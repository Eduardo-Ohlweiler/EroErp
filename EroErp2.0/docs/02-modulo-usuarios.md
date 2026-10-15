# Módulo de Usuários, Acesso e Auditoria

> Parte da base do projeto — **implementada**. Este documento descreve o que existe
> em `ero-erp-api`, não uma intenção.
>
> Leia junto com [01-multitenant.md](01-multitenant.md) e
> [06-seguranca-owasp.md](06-seguranca-owasp.md).

---

## 1. Modelo de acesso

**Nível único por usuário**, guardado como enum na coluna `usuario.role`.
Sem tabela de role, sem grupo de acesso, sem tabela de junção.

| Nível | Alcance |
|---|---|
| `SUPERADMIN` | administra o sistema; **único que atravessa tenants** |
| `ADMIN` | administra o próprio tenant |
| `USER` | opera dentro do próprio tenant |

```java
public enum Role {
    SUPERADMIN, ADMIN, USER;

    public String authority() { return "ROLE_" + name(); }
}
```

A **área administrativa** — `/tenants`, `/usuarios`, `/login-logs` — é exclusiva do
`SUPERADMIN`. `ADMIN` e `USER` acessam os módulos de negócio e o próprio perfil.

> **Consequência a ter em mente:** o administrador de um tenant não cadastra os
> próprios usuários — quem provisiona é o superadmin. Foi decisão deliberada, e
> muda com uma linha em `@PreAuthorize` se o produto pedir.

> **Por que não há grupo de acesso.** Com três níveis fixos, um grupo não teria o
> que agrupar. Permissão por módulo entra quando houver demanda concreta: uma
> migration nova e um campo a mais, sem quebrar o que existe.

### 1.1 Período de acesso — a licença do cliente

O sistema é vendido como produto, e o prazo mora no **tenant**, não no usuário:
quem assina é o cliente, e desligar o tenant já derruba a equipe inteira pelo
caminho que existe — o login barra tenant inativo.

```java
public enum PeriodoAcesso {
    INDETERMINADO, UM_MES, DOIS_MESES, TRES_MESES, SEIS_MESES, UM_ANO, DOIS_ANOS
}
```

`INDETERMINADO` é acesso livre: sem data e sem rotina que o desligue. É o
**default deliberado** — o valor padrão nunca pode ser o que derruba um cliente
por esquecimento.

O prazo é escolhido ao criar o tenant — na tela "Novo tenant" ou no formulário
de usuário, quando a opção "Cliente novo" cria o tenant junto (§3.1). Informado ao entrar num tenant existente, é ignorado, como já
acontece com a `role` no caminho inverso.

**Quatro regras que sustentam o desenho:**

1. **A data expira no fim do dia**, no fuso de `app.acesso.fuso-horario`
   (padrão `America/Sao_Paulo`). "1 mês" contratado dia 13 vale o dia 13 inteiro
   do mês seguinte — ninguém perde acesso no meio do expediente.
2. **Renovar reconta a partir de hoje**, sempre. `PATCH /tenants/{id}/acesso`
   é a operação de renovação, e reativa o cliente junto quando ele estava
   desligado com o prazo vencido. Um tenant desativado à mão, sem prazo vencido,
   continua desativado: desligar foi decisão de alguém, e renovar contrato não a
   desfaz.
3. **Reativar sem renovar é recusado com 409.** Sem isso, a rotina desfaria a
   reativação na madrugada seguinte e o superadmin acharia que resolveu.
4. **O login não espera a rotina.** `AuthService` barra o prazo vencido no login
   e no refresh, registrando `ACESSO_EXPIRADO`. Cobre a janela entre a virada do
   dia e o job, e cobre o servidor ter ficado fora do ar na hora dele.

O tenant que abriga um `SUPERADMIN` nunca é desligado por prazo — nem pela
rotina, nem no login. É a trava que impede ficar trancado para fora do próprio
sistema por causa de uma data gravada errado.

---

## 2. Tabelas

Quatro. Nada além do necessário.

| Tabela | Conteúdo | Escopo |
|---|---|---|
| `tenant` | `nome`, `ativo`, **`periodo_acesso`**, **`acesso_expira_em`**, **`paleta`**, timestamps | global |
| `usuario` | `tenant_id`, `nome`, `email`, `senha`, `telefone`, `codigo_pais`, **`role`**, `ativo`, `tentativas_falhas`, `bloqueado_ate`, **`versao_sessao`**, `created_by`, `updated_by` | **tenant** |
| `login_log` | `tenant_id`, `usuario_id`, `email_tentativa`, `sucesso`, `motivo_falha`, `data_login`, `data_logout`, `tipo_logout`, `endereco_ip`, `user_agent`, `impersonado_por` | **tenant** |
| `refresh_token` | `usuario_id`, `session_id`, `token_hash`, `expira_em`, `revogado_em` | via usuário |

Constraints que importam:

```
uk_usuario_email               (email)                -- GLOBAL: é a credencial de login
uk_refresh_token_hash          (token_hash)
ck_usuario_role                CHECK role IN ('SUPERADMIN','ADMIN','USER')
ck_tenant_periodo_acesso       CHECK periodo_acesso IN ('INDETERMINADO','UM_MES',…)
ck_tenant_acesso_coerente      CHECK INDETERMINADO ⇔ acesso_expira_em IS NULL
ck_tenant_paleta               CHECK paleta IN ('PADRAO','PADRAO_MENU_ESCURO',…)   -- as 20 do enum
idx_usuario_email              (email)                -- o login busca antes de saber o tenant
idx_usuario_tenant_id          (tenant_id)
idx_login_log_tenant_data      (tenant_id, data_login DESC)
idx_tenant_acesso_expira_em    (acesso_expira_em) WHERE ativo AND acesso_expira_em IS NOT NULL
```

`ck_tenant_acesso_coerente` guarda a invariante do período: acesso livre é
exatamente acesso sem data. Sem ela, um `INDETERMINADO` com data velha seria
desligado pela rotina, e um prazo definido sem data nunca expiraria.

`login_log.tenant_id` e `usuario_id` são **nullable** de propósito: uma tentativa
com e-mail inexistente não tem nem tenant nem usuário, e é justamente a que mais
importa registrar. Nesse caso `email_tentativa` guarda o que foi digitado.

`refresh_token.session_id` aponta para o `login_log`: o refresh emite um access
token novo carregando a **mesma** sessão, para que o logout e o job de expiração
continuem fechando a sessão certa.

### Por que o e-mail é único globalmente

Exceção deliberada à regra "toda unique é composta com `tenant_id`". E-mail aqui
não é campo de negócio, é a **credencial de login**: a autenticação acontece antes
de o tenant ser conhecido e busca só por e-mail. Com o mesmo e-mail em dois
tenants, `findByEmailIgnoreCase` encontraria duas linhas e o login quebraria com
erro 500.

Consequência aceita: um usuário que trabalhe para duas empresas clientes precisa
de um e-mail por empresa. O contrário exigiria login com tenant explícito — complexidade
que o sistema não pede.

---

## 3. Fluxos de autenticação

### 3.1 Como um usuário nasce

**Não existe rota pública de registro.** `POST /usuarios` é o único caminho, e é
exclusivo do `SUPERADMIN`. Quem abre a porta é o `DataSeeder`, que cria o primeiro
superadmin a partir de variável de ambiente.

Consequência: ninguém se cadastra sozinho no sistema. Toda conta é provisionada.
Para um produto vendido a empresas, isso é o comportamento certo — não há
autosserviço a proteger contra abuso, e a superfície pública fica em duas rotas.

`POST /usuarios` decide o destino assim:

| Entrada | Destino |
|---|---|
| `tenantId` informado | aquele tenant |
| superadmin **dentro** de um tenant (troca de tenant) | o tenant efetivo |
| superadmin no tenant raiz, **sem** `tenantId` | **cria um tenant novo** com o nome do usuário |

```java
private boolean ehClienteNovo(UsuarioCreateDto dto) {
    return dto.tenantId() == null && !securityUtils.isImpersonating();
}
```

Ao abrir um cliente novo o usuário nasce **`ADMIN`**, e a role informada no DTO é
ignorada — um tenant sem administrador seria um tenant que ninguém consegue gerir.
Para tenant existente a role é obrigatória; sem ela, 400.

Isso cobre abrir um cliente novo, que nasce com o seu primeiro administrador, e
o caso de equipe, acrescentar alguém a um cliente que já existe.

**O tenant também nasce sozinho**, em `POST /tenants` (SUPERADMIN, 201): nome
obrigatório, período de acesso (padrão `INDETERMINADO`) e paleta (padrão
`PADRAO`) opcionais, sem usuário. Na tela é o botão "Novo tenant"
(`/app/tenants/novo`), num formulário salvo de uma vez. Depois, o cadastro do
tenant tem o atalho **"Novo usuário neste tenant"**, que abre o formulário de
usuário com o tenant fixo — sem o painel "Destino" — e manda o `tenantId`; a
`role` é escolhida ali, como em todo tenant existente. O atalho passa o tenant
pelo state do router, não pela URL. Criar usuário continua exclusivo do
SUPERADMIN.

O e-mail é único no sistema inteiro — ver §2.

### 3.2 Login

`POST /auth/login` — público, rate limit.

Ordem de verificação: usuário existe → não está bloqueado → está ativo → tenant
está ativo → senha confere.

**Toda falha devolve a mesma mensagem** — "E-mail ou senha inválidos" — para
usuário inexistente e senha errada. Revelar quais e-mails existem entrega
informação a quem está sondando. O motivo real vai só para o `login_log`, no enum
`MotivoFalha`: `SENHA_INVALIDA`, `USUARIO_INEXISTENTE`, `USUARIO_INATIVO`,
`TENANT_INATIVO`, `BLOQUEADO`.

### 3.3 Bloqueio por tentativas

Cinco senhas erradas consecutivas bloqueiam a conta por 15 minutos
(`app.seguranca.max-tentativas-login` e `duracao-bloqueio`). Qualquer login
bem-sucedido zera o contador. O superadmin libera manualmente em
`PATCH /usuarios/{id}/desbloquear`.

O contador é gravado em **transação independente**:

```java
@Transactional(propagation = Propagation.REQUIRES_NEW)
public void registrarTentativaInvalida(UUID usuarioId) { ... }
```

Sem isso, a exceção lançada logo em seguida faria rollback e apagaria o
incremento — o bloqueio nunca dispararia. Vale para tudo que registra evento de
segurança num caminho que termina em exceção. Ver §7.

Bloqueio por usuário e rate limit por IP são defesas **complementares**: um barra
ataque distribuído contra uma conta, o outro barra varredura de muitos e-mails a
partir de um IP.

### 3.4 Logout

`POST /auth/logout` fecha a sessão com `TipoLogout.MANUAL` e revoga os refresh
tokens do usuário. Tolerante: sem sessão no contexto, devolve 204 e não faz nada.

### 3.5 Refresh token

| Token | Validade | Onde |
|---|---|---|
| Access | **8 horas** | memória do front |
| Refresh | **7 dias** | `localStorage`; no banco só o hash SHA-256 |

Uso único com rotação: cada `POST /auth/refresh` revoga o token apresentado e
emite um par novo, carregando o mesmo `sessionId`.

**Reapresentar um token já consumido revoga toda a cadeia do usuário** — é o sinal
clássico de token roubado. A revogação também roda em transação independente,
pelo mesmo motivo do contador de tentativas.

A resposta de login, refresh, `switch-tenant` e `exit-tenant` (`AuthResponseDto`)
carrega também a **`paleta` do tenant efetivo** — é por ela que o front pinta o
sistema na cor do cliente, sem consulta à parte ([05 §11](05-identidade-visual.md)).

### 3.6 Senha redefinida pelo superadmin

Não há recuperação de senha por e-mail — ela continua pendente, e depende de
escolher o serviço de envio. Até lá, quem perdeu a senha pede ao superadmin, que
define uma nova em `PATCH /usuarios/{id}/senha` com `{ "senhaNova": "..." }`
(`SenhaRedefinicaoDto`, 10 a 72 caracteres). Resposta 204.

- **Só no tenant efetivo**, como toda escrita (§6.1): usuário de outro cliente é
  404. O front entra no tenant dele antes de abrir o formulário — o mesmo que a
  lista de usuários já faz para editar.
- **A própria senha não se redefine por aqui** (400): ela se troca pelo perfil,
  em `PATCH /usuarios/perfil/senha`, informando a atual.
- **Desbloqueia a conta** (`registrarLoginValido`): quem esqueceu a senha
  costuma ter errado cinco vezes antes de pedir ajuda.
- **Encerra toda sessão aberta, na hora.** Revoga os refresh tokens e sobe
  `usuario.versao_sessao` (migration 016). O access token leva a versão em que
  foi emitido, no claim `versaoSessao`, e o `JwtFilter` recusa o que não bate
  (§5) — sem isso o token em uso valeria até as 8 horas dele. Redefinir também
  é a resposta a uma conta tomada, e aí a sessão aberta é a do intruso.

**Contador, e não carimbo de tempo.** Comparar o `iat` do token com a data da
redefinição parece mais simples, mas o `iat` tem resolução de **um segundo**: um
token emitido no mesmo segundo da redefinição ficaria do lado errado da
comparação, para mais ou para menos. A versão é um inteiro que só sobe.

Na tela, o `UsuarioForm` em edição — e nunca para o próprio usuário — tem o
painel **Senha**, com o botão *Redefinir senha*, que abre
`components/usuario/RedefinirSenhaModal.tsx` (senha nova e confirmação).

---

## 4. Troca de tenant do superadmin

`POST /auth/switch-tenant/{tenantId}` e `POST /auth/exit-tenant`.

O ponto central, e o que mantém o isolamento simples:

> **O superadmin não fura o filtro de tenant — ele muda o valor do filtro.**

O token passa a carregar o `tenantId` de destino e `impersonating: true`. Todo o
resto do sistema continua filtrando normalmente. Não existe caminho de código com
`if (isSuperadmin)` pulando o `WHERE tenant_id = ?`.

```java
loginLogService.fecharSessao(securityUtils.getSessionIdLogado(), TipoLogout.MANUAL);
UUID sessionId = loginLogService.abrirSessaoImpersonada(superadmin, destino, request);

String access = jwtUtil.gerarAccessToken(
        superadmin.getId(), destino.getId(), superadmin.getRole(), sessionId, true);
```

Consequências desejadas:

- Nenhum service precisa saber que o superadmin existe
- Todo acesso dele dentro de um tenant fica registrado no `login_log` **daquele
  tenant**, com `impersonado_por` preenchido
- Não é possível entrar em tenant inativo (409)
- O refresh token não é reemitido no switch: o token atual continua apontando
  para o tenant de origem

---

## 5. JWT

```json
{
  "sub":           "9f1c...",   // usuario.id
  "tenantId":      "3a7e...",   // tenant EFETIVO
  "role":          "ADMIN",
  "sessionId":     "b2d4...",   // id em login_log
  "impersonating": false,
  "versaoSessao":  0,           // usuario.versao_sessao na emissão — §3.6
  "iat": 1770000000,
  "exp": 1770028800
}
```

HS256, secret ≥ 32 caracteres por variável de ambiente. **JJWT 0.12.x** — API nova
(`Jwts.builder().subject(...)`, `Jwts.parser().verifyWith(...)`), nunca a
`setSubject()`/`parserBuilder()` da 0.11.

### JwtFilter

A cada requisição:

1. lê `Authorization: Bearer <token>`; sem token, segue a cadeia
2. valida assinatura e expiração
3. **recarrega o usuário** e rejeita se inativo
4. rejeita se o claim `versaoSessao` difere de `usuario.versao_sessao` — a senha
   foi redefinida depois da emissão (§3.6)
5. **recarrega o tenant efetivo** e rejeita se inativo
6. recusa token cujo tenant não é o do usuário, salvo se for `SUPERADMIN`
7. monta o `Authentication`: principal = `UUID`, authority = `ROLE_<role>`,
   details = `AuthDetails(tenantId, sessionId, role, impersonating)`
8. em qualquer falha, 401 em JSON com mensagem genérica

Os passos 3 e 5 custam um SELECT por requisição e são o que impede um token
válido de continuar funcionando depois de uma desativação. Vale o custo. O
passo 4 vem de graça: o usuário já foi carregado.

O passo 6 é o que impede que um token com `tenantId` adulterado — se o segredo
algum dia vazasse — desse acesso a outro tenant a um usuário comum.

---

## 6. Endpoints

### Público (rate limit 5/min por IP)

Duas rotas de autenticação. Só isso — não há rota pública de leitura: a paleta
de cores viaja na resposta de autenticação, e a tela de login abre sempre na
Padrão ([05 §11](05-identidade-visual.md)).

| Método | Rota |
|---|---|
| `POST` | `/auth/login` |
| `POST` | `/auth/refresh` |

### Autenticado

| Método | Rota |
|---|---|
| `POST` | `/auth/logout` |
| `GET` `PUT` | `/usuarios/perfil` |
| `PATCH` | `/usuarios/perfil/senha` — exige a senha atual |

### Somente `SUPERADMIN`

| Método | Rota | Observação |
|---|---|---|
| `GET` | `/tenants`, `/tenants/{id}`, `/tenants/select` | `expirandoEmDias` restringe a quem vence na janela |
| `POST` | `/tenants` | cria o tenant sem usuário; período e paleta opcionais · 201 |
| `PUT` `PATCH` | `/tenants/{id}`, `/tenants/{id}/ativo` | tenant inativo derruba os tokens em uso; reativar com prazo vencido é 409 |
| `PATCH` | `/tenants/{id}/acesso` | define ou renova o período — §1.1 |
| `PATCH` | `/tenants/{id}/paleta` | `{ "paleta": "JADE" }`; chega aos usuários do tenant na próxima sessão — [05 §11](05-identidade-visual.md) |
| `GET` | `/usuarios`, `/usuarios/{id}`, `/usuarios/select` | escopo do tenant **efetivo** |
| `GET` | `/usuarios/global` | atravessa tenants — §6.1 |
| `POST` `PUT` | `/usuarios`, `/usuarios/{id}` | o `POST` abre um cliente novo quando não há tenant indicado — §3.1 |
| `PATCH` | `/usuarios/{id}/ativo`, `/usuarios/{id}/desbloquear` | |
| `PATCH` | `/usuarios/{id}/senha` | redefine a senha, desbloqueia e derruba as sessões — §3.6 |
| `GET` | `/login-logs` | tenant efetivo |
| `GET` | `/login-logs/global` | atravessa tenants — §6.1 |
| `POST` | `/auth/switch-tenant/{tenantId}`, `/auth/exit-tenant` | |

Mesmo sendo superadmin, `/usuarios/{id}` usa `findByIdAndTenantId`. Para operar em
outro tenant ele troca de tenant primeiro.

### 6.1 As duas consultas globais

`GET /usuarios/global` e `GET /login-logs/global` são as **únicas** consultas do
sistema sem `WHERE tenant_id = ?`. Existem porque há perguntas que só se responde
de fora: *"onde está o usuário que acabei de criar?"* e *"quem tentou entrar hoje?"*.

A de usuários nasceu de um sintoma real: criar um cliente novo e o usuário
"desaparecer" da lista. Não era falha de isolamento — era isolamento funcionando,
com o superadmin ainda no tenant raiz olhando uma lista que só mostrava o tenant
efetivo.

Regras que fazem delas exceção controlada, e não uma porta:

- **`@PreAuthorize("hasRole('SUPERADMIN')")`** substitui o filtro. Sem a role, não
  há rota. `ADMIN` e `USER` recebem 403.
- **`tenantId` é filtro, nunca escopo.** Vem como parâmetro *opcional* para
  restringir a um cliente; ausente, traz todos. Em qualquer outro endpoint um
  `tenantId` do cliente seria recusado (§ regra 1 do `CLAUDE.md`) — aqui ele só
  estreita um resultado que a role já autorizou.
- **A resposta carrega `tenantId` e `tenantNome`** em cada linha. Uma lista que
  atravessa clientes sem dizer de quem é cada registro convida ao erro.
- **Ler global não abre escrever global.** `GET`/`PUT /usuarios/{id}` continuam em
  `findByIdAndTenantId` e devolvem 404 para quem é de outro tenant. O front resolve
  entrando no tenant antes de abrir a edição — o backend não relaxa.

Módulo novo **não** ganha visão global por simetria. Só quando existir uma pergunta
que de fato precise ser respondida de fora do tenant.

### Regras de escrita no cadastro de usuários

- Ninguém concede `SUPERADMIN` sem já ser `SUPERADMIN` (OWASP A01)
- Ninguém desativa o próprio usuário
- Ninguém rebaixa o próprio nível de acesso
- E-mail único no sistema inteiro, na criação e na alteração
- Senha nunca é alterada pelo `PUT` — há endpoint próprio, que exige a senha
  atual; a do **outro** só o superadmin redefine, por `PATCH /usuarios/{id}/senha`
  (§3.6), e nunca a própria por ali

---

## 7. Log de acesso

Registrado **sempre**:

| Evento | Como aparece |
|---|---|
| Login com sucesso | `sucesso = true`, sessão aberta |
| Login com falha | `sucesso = false` + `motivo_falha` |
| Logout manual | `data_logout` + `tipo_logout = MANUAL` |
| Expiração | job horário fecha com `EXPIRACAO` |
| Troca de tenant | sessão nova no tenant de destino, com `impersonado_por` |

**Nunca** registrado: senha, JWT, refresh token, dado pessoal além do e-mail
digitado na tentativa.

Retenção de 12 meses (`app.auditoria.retencao-meses`), com expurgo mensal —
guardar IP, e-mail e hábito de acesso indefinidamente sem finalidade é problema
de LGPD, não zelo.

### Transação independente

Três escritas precisam sobreviver ao rollback da operação em curso: o contador de
tentativas, a revogação de refresh token reutilizado e o log de falha. Todas
acontecem em caminhos que terminam em exceção.

Duas formas, ambas em uso:

- `@Transactional(propagation = REQUIRES_NEW)` quando a chamada **atravessa** o
  proxy do Spring (de um bean para outro) — é o caso de
  `UsuarioService.registrarTentativaInvalida` e `LoginLogService.registrarFalha`
- o `TransactionTemplate` `transacaoIndependente` quando a chamada é interna à
  própria classe — self-invocation não passa pelo proxy e a anotação seria
  **silenciosamente ignorada**

Esse segundo caso já mordeu uma vez: a revogação por reuso de refresh token era
desfeita pelo rollback, e o token roubado continuava valendo.

---

## 8. Telas do frontend

Padrão Form/List — ver [04-arquitetura-frontend.md](04-arquitetura-frontend.md).

Rotas **do front**, que não são as da API: a tela de log é `/app/log-acesso`, o
endpoint é `/login-logs`. Toda tela do sistema mora debaixo de `/app`; a raiz
`/` só redireciona para lá.

| Tela | Rota | Quem vê |
|---|---|---|
| Login | `/app/login` | público |
| Início | `/app` | todos |
| Meu perfil | `/app/perfil` | todos |
| Usuários | `/app/usuarios` · `/app/usuarios/novo` · `/app/usuarios/:id` | SUPERADMIN |
| Tenants | `/app/tenants` · `/app/tenants/novo` · `/app/tenants/:id` | SUPERADMIN |
| Log de acesso | `/app/log-acesso` | SUPERADMIN |

A paleta de cores não tem tela própria: é o painel **Aparência** do formulário
de tenant (`/app/tenants/:id`).

Rota literal **antes** da paramétrica: `/app/usuarios/novo` declarada depois de
`/app/usuarios/:id` casaria com o `:id` e o form tentaria carregar o usuário "novo".

### A lista de usuários

No tenant raiz usa a visão global (§6.1) e mostra a coluna **Cliente**, com
`TCombo` de tenant como filtro. Dentro de um tenant, some a coluna, some o filtro,
e o subtítulo diz em que cliente você está — a lista se limita a ele porque foi
uma escolha deliberada de quem entrou ali.

Clicar num usuário de outro cliente **entra naquele tenant antes de abrir a
edição**, com toast avisando. É o que o combo do topo faz, em um clique. No form
o cliente aparece como campo somente-leitura: visível porque errar de tenant é
fácil, não editável porque mover usuário entre clientes não é um `PUT`.

### A lista de tenants

Mostra **Acesso até** e o selo da situação: `Acesso expirado` (contrato vencido)
é diferente de `Inativo` (decisão de alguém), e a sete dias do fim aparece
`Expira em N dias` — cor nunca vai sozinha, o ícone acompanha. O filtro
*Expirando* manda `ativo=true&expirandoEmDias=7`.

Clicar na linha abre `/app/tenants/:id`, onde nome e período são salvos **separados**:
prazo é ação com efeito imediato — recontar a data e, se for o caso, religar o
acesso — e não pode acontecer de carona num "salvar cadastro". Reativar um
cliente vencido leva para lá, porque o backend recusaria o `PATCH /ativo` com
409 (§1.1).

No mesmo formulário, o painel **Aparência** (`components/tenant/SeletorPaleta.tsx`)
escolhe a paleta do cliente, também com salvar próprio (`PATCH /paleta`). Os
usuários dele a recebem na próxima sessão — login, refresh ou troca de tenant;
se o superadmin estiver dentro daquele tenant, ela vale na hora para ele.

### Seletor de tenant

No header, visível **apenas** para `SUPERADMIN` — as outras roles não devem nem
ver o componente. A guarda vai *dentro* do efeito também, não só no JSX: um efeito
que dispara antes do early-return chama `/tenants/select` e o ADMIN leva um toast
de 403 sem ter feito nada.

Ao escolher, chama `switch-tenant` e substitui o access token no `AuthContext`.
**Sem recarregar a página** — ver a armadilha no `CLAUDE.md`: `navigate(0)` e
`location.assign` descartam o token em memória, o boot restaura pelo refresh do
tenant de origem e o superadmin volta de onde saiu. Não é preciso recarregar: as
listas trazem `sessao.tenantId` nas dependências e refazem a consulta sozinhas.

Quando `impersonating === true`, faixa fixa no topo em `--color-warning`:

> **Você está navegando como o tenant "Empresa X".** [Sair do tenant]

Sem essa faixa é fácil o superadmin agir no tenant errado achando que está no seu.

**O front não autoriza.** Esconder menu é conveniência visual; a autorização real
é o `@PreAuthorize` do backend.

---

## 9. O que está coberto por teste

76 testes neste módulo, de 111 no projeto, contra o PostgreSQL local
`ero_erp_test`. Rodar com `./run-dev.sh test`.

| Classe | Testes | O que prova |
|---|---|---|
| `TenantIsolationTest` | 5 | tenant A não lê, altera nem desativa nada do tenant B (404, não 403); listagem e log de acesso não vazam |
| `PeriodoAcessoTest` | 14 | o prazo nasce com o cliente e é ignorado em tenant existente; a rotina desliga só os vencidos e nunca o tenant do superadmin; login e refresh barram o vencido antes da rotina; reativar sem renovar é 409; renovar reconta a data, reativa e devolve o acesso na prática; o filtro *Expirando* respeita a janela |
| `AuthTest` | 15 | a rota de registro não existe e nenhum tenant nasce por ela; rota inexistente é 404 e método errado 405, nunca 500; mensagem de falha idêntica para e-mail inexistente e senha errada; usuário e tenant inativos barrados; bloqueio após 5 tentativas fazendo a senha certa deixar de valer; rotação de refresh; reuso derrubando a cadeia inteira; logout revogando; switch/exit-tenant e a recusa para ADMIN e USER |
| `CriacaoDeClienteTest` | 12 | usuário sem tenant abre um cliente novo com ele como ADMIN, ignorando a role pedida; com `tenantId` ou dentro de um tenant, entra no existente; e-mail duplicado em outro tenant é recusado; a listagem global acha quem a do tenant não acha, filtra por tenant quando pedido, e recusa ADMIN e USER |
| `AutorizacaoTest` | 9 | área administrativa restrita ao superadmin; perfil próprio para todos; senha nunca no response; token adulterado; desativação de usuário ou de tenant derrubando token em uso; provisionamento no tenant efetivo; e-mail duplicado |
| `RedefinicaoSenhaTest` | 7 | a senha antiga deixa de entrar e a nova passa a entrar; a conta bloqueada volta a entrar; access token e refresh emitidos antes caem na hora; ADMIN e USER não redefinem; senha curta é 400; usuário de outro tenant é 404; a própria senha é 400 |
| `CadastroTenantTest` | 6 | só com o nome nasce ativo, sem prazo, na Padrão e sem usuário; com período e paleta; entrada inválida é 400; ADMIN e USER recebem 403 ao criar tenant e ao criar usuário nele; tenant depois usuário, e o usuário entra no tenant certo |
| `PaletaTenantTest` | 8 | tenant novo nasce na Padrão e o login a entrega; a paleta é do tenant e só os usuários dele a recebem; a troca de tenant leva a do destino e a volta a da origem; ADMIN e USER não escolhem, nem a do próprio tenant; sem token é 401; paleta ausente ou inexistente é 400; não há rota pública de aparência; o banco aceita todo valor do enum |

O isolamento aqui é manual — garantido por `findByIdAndTenantId` e disciplina,
não por Hibernate `@Filter` nem Row-Level Security. **Estes testes são a única
garantia automatizada de que ele vale.** Todo módulo multi-tenant novo precisa do
seu equivalente.
