# 03 — Multi-tenant

## Modelo

Um banco e uma aplicação para todos os contratantes. Cada tabela de negócio
tem `tenant_id` e o **Hibernate filtra sozinho**:

- `TenantEntity` tem o campo `tenantId` anotado com `@TenantId`.
- No insert, o Hibernate preenche `tenant_id` com o tenant atual.
- Em toda consulta JPQL/Criteria daquela entidade, o Hibernate acrescenta `tenant_id = :atual`.
- O tenant atual vem do `TenantIdentifierResolver`, nesta ordem:
  1. tenant forçado pelo `TenantContext`;
  2. tenant do token do usuário logado;
  3. `NENHUM`, que não enxerga nenhuma linha (falha fechada).

Ninguém escreve `WHERE tenant_id = ...` em JPQL e o service nunca recebe
tenant como parâmetro.

## Tenants especiais

| Id | Nome | Uso |
|---|---|---|
| `00000000-0000-0000-0000-000000000000` | `ROOT` / Plataforma | Dono do superadmin. Sessão ROOT enxerga todos os tenants (`isRoot`). |
| `ffffffff-ffff-ffff-ffff-ffffffffffff` | `NENHUM` | Sem usuário: não casa com nada. |

## Quando o contexto ROOT é usado

Só onde ainda não se sabe o tenant, ou onde a plataforma age sobre um contratante:

- **Login, código por e-mail (verificar e reenviar), refresh e logout** (`AuthService`, `CodigoVerificacaoService`): o e-mail, o desafio ou o cookie ainda não dizem o tenant. O código é buscado só pelo `jti` do desafio assinado. A limpeza diária dos códigos vencidos ou usados (`CodigoVerificacaoService.limparVencidos`) também roda em ROOT, porque a tabela é de contratante.
- **Montar o usuário da requisição** (`AutorizacaoService`): sempre pelo id do token assinado.
- **Operações do próprio usuário** (trocar senha, tema, meus dados em `/api/auth/eu/perfil`): funcionam até para o superadmin dentro de um contratante, sempre pelo id da sessão.
- **Seed do superadmin.**
- **Superadmin na visão de plataforma** (token com tenant ROOT): cria e altera contratantes e o primeiro admin, com `atribuirTenant` explícito.

`TenantContext.comoRoot(...)` precisa ser chamado **antes** de a transação abrir,
porque o Hibernate lê o tenant quando abre a sessão. Por isso esses fluxos usam
`TransactionTemplate` dentro do `comoRoot`, e não `@Transactional`.

## Superadmin

- Na visão de plataforma pode ler tudo. Escrever em dados de contratante é recusado (`SecurityUtils.exigirTenantSelecionado`).
- Para trabalhar num contratante: `POST /api/auth/superadmin/acessar/{tenantId}`. A sessão passa a ter `tenant_atuacao_id`, sai um token novo e o anterior deixa de valer. Fica registrado como `SUPERADMIN_ACESSOU_TENANT`.
- `POST /api/auth/superadmin/sair` volta para a plataforma.

## Aparência do contratante

A aparência é **do contratante** e vale para todos os usuários dele: fundo,
destaque, vidro, animações e desempenho. Só o superadmin muda (tela Configuração).
A única exceção é **claro ou escuro**, que cada usuário escolhe para si (ver
"Tema do usuário" abaixo). Nada fica guardado no navegador; a tela de login usa
sempre o padrão do sistema.

Campos (`AparenciaDto`, em `tenant`):

| Campo | Tipo | Valores | Padrão |
|---|---|---|---|
| `corDestaque` | texto | `violeta`, `azul`, `laranja`, `esmeralda`, `rosa`, `ambar` | `violeta` |
| `temaPadrao` | `TemaInterface` | `ESCURO`, `CLARO`. Vale para quem não escolheu o próprio tema (`temaPreferido` nulo). | `ESCURO` |
| `fundo` | `Fundo` | `ORBS`, `AURORA`, `ONDAS`, `MINIMO` (VIVO); `ESCRITORIO`, `CIDADE`, `MARINA`, `EXPEDIENTE`, `COWORKING` (CENA) | `ORBS` |
| `fundoAnimado` | booleano | | `true` |
| `vidroDesfoque` | inteiro | 0 a 40 | 12 |
| `fundoFoco` | decimal | 0 a 10, uma casa (passo 0,5 na tela) | 3.0 |
| `animacoes` | `NivelAnimacao` | `COMPLETAS`, `REDUZIDAS` | `COMPLETAS` |
| `desempenhoAutomatico` | booleano | "Otimizar desempenho em computadores mais fracos": ligado, o front mede o aparelho do usuário e entra no modo leve (pausa o fundo vivo, troca a revelação circular por esmaecimento). Desligado, todos veem o visual completo. | `false` |

`desempenhoAutomatico` (coluna `tenant.desempenho_automatico`, migration 010) é o
único campo **opcional na entrada**: ausente ou `null` grava `false`, para cliente
antigo que não manda o campo não quebrar. Atenção: por isso, salvar a configuração
sem o campo **desliga** a opção. Na saída sai sempre preenchido (`true`/`false`),
em todas as rotas da tabela abaixo. Os demais campos são obrigatórios.

`tenant.fundo_exclusivo` (enum `Fundo`, nulo = nenhuma) vincula uma **cena
exclusiva** ao contratante. Cena exclusiva é marcada com `exclusiva = true` no
enum `Fundo`, tem no máximo um dono (índice único `uk_tenant_fundo_exclusivo`) e
só pode ser o `fundo` de quem é dono dela.

Onde a aparência aparece:

| Rota | Quem | Entrada / saída |
|---|---|---|
| `GET /api/auth/eu` e o `usuario` de login, 2FA, refresh, `superadmin/acessar` e `superadmin/sair` | logado (até com pendência) | `UsuarioLogadoDto.aparencia` = aparência do contratante **em que está atuando** (Plataforma usa o padrão). |
| `GET /api/tenants/atual` | `ACESSO_LIBERADO` | `{ id, nome, aparencia }` |
| `GET /api/tenants`, `GET /api/tenants/{id}` | `hasRole('SUPERADMIN')`, na visão de plataforma (422 dentro de contratante) | `TenantResponseDto` com `aparencia`, `fundoExclusivo`, `limiteUsuarios` e `usuariosAtivos`. A Plataforma não aparece na lista e a ficha dela dá 404. |
| `GET /api/tenants/selecao` | `hasRole('SUPERADMIN')` | `[{ id, nome }]` dos contratantes ativos, sem a Plataforma |
| `POST /api/tenants` | `hasRole('SUPERADMIN')` | `limiteUsuarios` obrigatório (1 a 10000); `aparencia` opcional (ausente = padrão). 409 com `erros[0].campo` = `documento` (CPF/CNPJ de outro contratante) ou `administrador.email` (e-mail já em uso) |
| `PUT /api/tenants/{id}` | `hasRole('SUPERADMIN')` | só cadastrais: `{ nome, documento, email, limiteUsuarios, version }`. 409 com `erros[0].campo = "documento"` (duplicidade) ou sem `erros` (versão antiga); 404 para a Plataforma |
| `PUT /api/tenants/{id}/configuracao` | `hasRole('SUPERADMIN')`, na visão de plataforma | `{ aparencia, fundoExclusivo, version }` → `TenantResponseDto`. 400 com `erros[].campo` = `aparencia.vidroDesfoque` etc.; 409 sem `erros` para versão antiga e com `erros[0].campo = "fundoExclusivo"` para cena exclusiva de outro; 422 superadmin dentro de contratante, cena comum como exclusiva ou fundo exclusivo que não é o dele; 404 para a Plataforma. |
| `GET /api/tenants/fundos?tenantId=` | `hasRole('SUPERADMIN')` | `[{ codigo, rotulo, tipo, exclusiva }]`: comuns + exclusivas livres + a exclusiva do próprio `tenantId`. `tenantId` da Plataforma dá 404 |
| `PATCH /api/tenants/{id}/inativar`, `/ativar` | `hasRole('SUPERADMIN')`, na visão de plataforma | 204. Já na situação pedida: 204 sem evento novo e sem limpar o cache (linha travada: o duplo clique não duplica). 404 para a Plataforma. |

### Tema do usuário (claro ou escuro)

Cada usuário escolhe o próprio tema; a escolha fica no usuário (coluna
`usuario.tema_preferido`, migration 011) e vale em qualquer computador.

**Precedência:** `temaPreferido` do usuário; se for `null`, `aparencia.temaPadrao`
do contratante em que está atuando. `null` é o valor inicial de todo usuário
(inclusive os que já existiam). O resto da aparência não tem escolha pessoal.

| Campo | Tipo | Valores | Padrão |
|---|---|---|---|
| `temaPreferido` | `TemaInterface` ou nulo | `CLARO`, `ESCURO`, `null` = segue o contratante | `null` |

| Rota | Quem | Entrada / saída |
|---|---|---|
| `PUT /api/auth/eu/tema` | `isAuthenticated()` (até com pendência, como `/api/auth/senha`) | `{ "tema": "CLARO" \| "ESCURO" \| null }` → 204. Campo ausente = `null`. Outro valor (`"AZUL"`, `"claro"`, número, objeto) ou sem corpo: 400 `REQUISICAO_INVALIDA`. Sem token: 401. |
| `GET /api/auth/eu` e o `usuario` de login (2FA), refresh, `superadmin/acessar` e `superadmin/sair` | logado | `UsuarioLogadoDto.temaPreferido`, sempre presente (`null` quando segue o contratante). |

Regras:

- Só o próprio: o id vem da sessão, nunca do corpo. Não existe rota para mudar
  o tema de outra pessoa, e o `UsuarioResponseDto` (ficha e lista de usuários)
  **não** traz a preferência.
- O superadmin também tem a sua. Ela vale na visão de plataforma e dentro de um
  contratante (é dele, não do contratante); a leitura e a gravação rodam em ROOT
  no `AuthService`, pelo id da sessão.
- Gravada por UPDATE direto (`UsuarioRepository.definirTemaPreferido`): não sobe a
  `version` nem o "alterado por" do cadastro, então nunca dá 409 nem atrapalha um
  administrador que está com a ficha do usuário aberta. Salvar a ficha também não
  apaga a preferência (`@DynamicUpdate`).
- Não grava evento de segurança: é preferência visual.
- Não fica no cache de 30 s do `UsuarioAutenticado`: o próximo `/eu` já traz a troca.

### Meus dados (Minha conta)

O próprio usuário altera **nome e telefone**. E-mail (é o segundo fator do login), papel e
contratante são só leitura: quem troca o e-mail é o administrador.

| Rota | Quem | Entrada / saída |
|---|---|---|
| `GET /api/auth/eu/perfil` | `ACESSO_LIBERADO` (com pendência: 403) | `MeuPerfilResponseDto { id, nome, email, telefone, papel, tenantNome, temaPreferido, version }` |
| `PUT /api/auth/eu/perfil` | `ACESSO_LIBERADO` | `{ nome, telefone, version }` → `MeuPerfilResponseDto` com a `version` nova. 400 com `erros[].campo` = `nome` (vazio ou mais de 150), `telefone` (fora de 10 ou 11 dígitos) ou `version` (ausente); 409 sem `erros` se a `version` mudou. |

Regras:

- O id vem da sessão. O corpo não tem id, e-mail, papel nem tenant; campos extras são ignorados.
- `tenantNome` é o contratante **a que o usuário pertence**: para o superadmin é "Plataforma",
  mesmo atuando num contratante. Leitura e gravação rodam em ROOT no `AuthService`.
- Sobe a `version` e o "alterado por" do cadastro, como uma edição normal: o administrador
  com a ficha aberta recebe 409, e a Minha conta aberta recebe 409 depois que o
  administrador salva.
- O cache de 30 s do usuário da sessão é invalidado: o próximo `GET /api/auth/eu` já traz o nome novo.
- Grava `USUARIO_ALTERADO` com detalhe "próprio perfil" (sem o telefone) no tenant do
  usuário: o do superadmin fica na Plataforma e não aparece para o contratante.

### Telefone do usuário

`usuario.telefone` (migration 012), opcional, gravado **só com dígitos**: 10 (fixo) ou 11
(celular), com DDD; o banco confere (`ck_usuario_telefone`). Entra em `UsuarioCreateDto`,
`UsuarioUpdateDto` e `MeuPerfilUpdateDto` (vazio ou nulo = não informado, grava `NULL`) e sai
em `UsuarioResponseDto` (ficha e lista) e `MeuPerfilResponseDto`. O front manda só dígitos e
formata na tela. Dado pessoal: nunca vai para log nem para o detalhe de evento.

### Contrato do `TenantResponseDto`

Resposta de `GET /api/tenants` (dentro de `PaginaDto.conteudo`), `GET /api/tenants/{id}`,
`POST`, `PUT /{id}` e `PUT /{id}/configuracao`:

| Campo | Tipo | Observação |
|---|---|---|
| `id` | UUID | |
| `nome` | texto | até 150 |
| `documento` | texto ou nulo | CPF/CNPJ sem máscara (CNPJ pode ser alfanumérico, em maiúsculas) |
| `email` | texto ou nulo | minúsculo |
| `ativo` | booleano | |
| `limiteUsuarios` | inteiro ou nulo | nulo só na Plataforma |
| `usuariosAtivos` | inteiro | o superadmin não conta |
| `aparencia` | `AparenciaDto` | tabela acima |
| `fundoExclusivo` | `Fundo` ou nulo | |
| `createdAt` | instante ISO-8601 | |
| `updatedAt` | instante ISO-8601 ou nulo | |
| `createdBy`, `updatedBy` | UUID ou nulo | |
| `criadoPorNome` | texto ou nulo | nome de quem cadastrou; nulo em contratante sem autor (ex.: criado por migration) |
| `alteradoPorNome` | texto ou nulo | nome de quem fez a última alteração |
| `version` | inteiro | lock otimista; volta no `PUT` |

Os nomes da auditoria (para o `TAuditoria` da ficha) são resolvidos numa consulta por
página (`UsuarioService.buscarNomes`, sem N+1). Como lista e ficha só respondem na visão
de plataforma, o filtro de tenant não esconde o superadmin e o nome dele aparece.

### Contrato do 409 (`CONFLITO`)

O 409 tem dois sentidos, e o front distingue pela presença de `erros`:

| Resposta | Significa | O que a tela faz |
|---|---|---|
| 409 **com** `erros[{campo, mensagem}]` | duplicidade num campo (`ConflitoCampoException`) | marca o campo, como no 400. Recarregar não resolve. |
| 409 **sem** `erros` | o registro mudou desde que a tela leu (`version` antiga) ou conflito sem campo (violação de integridade numa corrida) | oferece Recarregar |

`erros` tem o mesmo formato do 400 e `campo` é o caminho no DTO de entrada:

```json
{
  "type": "about:blank",
  "title": "Conflict",
  "status": 409,
  "detail": "Este e-mail já está em uso.",
  "instance": "/api/tenants",
  "codigo": "CONFLITO",
  "correlationId": "4f0c…",
  "erros": [{ "campo": "administrador.email", "mensagem": "Este e-mail já está em uso." }]
}
```

| Rota | `erros[0].campo` | `mensagem` |
|---|---|---|
| `POST /api/tenants` | `administrador.email` | "Este e-mail já está em uso." |
| `POST /api/tenants`, `PUT /api/tenants/{id}` | `documento` | "Já existe um contratante com este documento." |
| `PUT /api/tenants/{id}/configuracao` | `fundoExclusivo` | "Esta cena exclusiva já pertence a outro contratante." |
| `POST /api/usuarios`, `PUT /api/usuarios/{id}` | `email` | "Este e-mail já está em uso." (o e-mail é único no sistema todo, em qualquer contratante) |

## Limite de usuários por contratante

`tenant.limite_usuarios` é definido pelo superadmin na contratação (obrigatório, 1 a
10000, editável no `PUT /api/tenants/{id}`). A Plataforma tem limite nulo (sem limite) e é a
única: o banco recusa nulo em outro contratante (`ck_tenant_limite_usuarios_obrigatorio`).
Na migration 009, os contratantes que já existiam receberam o maior entre 5 e os ativos deles.

- Só usuários **ativos** contam; o administrador inicial conta; o superadmin nunca conta.
  Limite 5 = administrador inicial + 4.
- Criar (`POST /api/usuarios`) e reativar (`PATCH /api/usuarios/{id}/ativar` de um inativo)
  exigem vaga. Sem vaga: **422** `"Este contratante já usa X de N usuários. Fale com o suporte para ampliar."`
  Vale também para o superadmin atuando dentro do contratante.
- Inativar libera a vaga, sem checagem.
- Baixar o limite abaixo do uso é aceito ("5 de 3"): ninguém é desligado, só criar e
  reativar ficam travados. O evento `TENANT_ALTERADO` guarda `limite de usuários 5 -> 3`.
- Concorrência: o `UsuarioService` trava a linha do contratante
  (`LimiteUsuariosService.travarELerLimite`, `SELECT ... FOR UPDATE`) antes de contar
  (`UsuarioRepository.contarAtivos`, filtro automático de tenant). Dois cadastros ao
  mesmo tempo não ocupam a mesma última vaga. Reativar trava antes a linha do usuário: no
  duplo clique em "Ativar", o segundo pedido já o lê ativo e responde 204 sem pedir vaga.
- `TenantResponseDto.usuariosAtivos` vem de uma contagem agrupada por contratante
  (`contarAtivosPorTenant`, JPQL). Por isso lista e ficha de contratantes só respondem na
  visão de plataforma: dentro de um contratante o filtro automático só deixaria contar o
  dele, e os outros viriam com 0.

## Trilha de segurança (tela Logs)

`GET /api/auditoria/eventos` (`AUDITORIA_LER`), consultada pelo `ConsultaEventoService`:

| Parâmetro | Regra |
|---|---|
| `tipos` | lista de `TipoEventoSeguranca` (repetido ou separado por vírgula); vazio = todos |
| `tipo` | **recusado**: 400 com `erros[0].campo = "tipo"` e mensagem "Use o parâmetro tipos" (o erro de digitação não vira "todos os tipos" em silêncio) |
| `usuarioId` | usuário afetado |
| `tenantId` | só vale para o superadmin na visão de plataforma; **dentro de um contratante é ignorado** |
| `de`, `ate` | ISO-8601 UTC; `de` inclusivo, `ate` exclusivo. Padrão: últimos 7 dias. `de >= ate` → 422 "Período inválido."; mais de 366 dias → 422 "Escolha um período de até 1 ano." |
| `page`, `size`, `sort` | `sort` só `createdAt` ou `tipo`; padrão `createdAt` decrescente; no máximo 100 por página |

Cada evento traz `usuarioNome` e `autorNome` (e `tenantNome` só na visão de
plataforma), resolvidos numa consulta por página. O nome é buscado com o filtro
de tenant ligado: dentro de um contratante o superadmin não é visível. Um evento
do suporte (autor ou afetado sem nome visível daqui) chega com `suporte = true` e
sem os dados do superadmin: `autorId` (ou `usuarioId`, quando o afetado é ele, como
em `SUPERADMIN_ACESSOU_TENANT`), `ip` e `userAgent` nulos. O front mostra "Suporte da
plataforma". Na visão de plataforma tudo aparece e `suporte` é sempre `false`.

A mesma regra vale para a auditoria do cadastro de usuários (`GET /api/usuarios` e a
ficha): dentro de um contratante, `createdBy`/`updatedBy` e `criadoPorNome`/`alteradoPorNome`
saem vazios quando o autor é o superadmin (o admin inicial, cadastrado na plataforma, ou
o que o suporte fez depois de acessar o contratante).

`GET /api/auditoria/tipos` (`AUDITORIA_LER`) devolve todos os tipos na ordem do enum, como
`[{ codigo, rotulo, categoria, categoriaRotulo, falha }]` (ex.: `CODIGO_LIMITE_ATINGIDO`,
"Limite de códigos por hora atingido", `FALHAS`, "Falhas e bloqueios", `true`). O rótulo, a
categoria e o `falha` ficam no próprio `TipoEventoSeguranca` (sem migration). Categorias
(`CategoriaEvento`): `ACESSOS` "Acessos", `FALHAS` "Falhas e bloqueios", `SENHA` "Senha",
`USUARIOS` "Usuários e permissões", `CONTRATANTES` "Contratantes", `SUPORTE` "Suporte da
plataforma". A tela filtra por categoria mandando os códigos dela em `tipos`; "Contratantes"
só aparece na visão de plataforma.

`CODIGO_LIMITE_ATINGIDO`: alguém acertou a senha, mas o login foi barrado pelo limite de
códigos por hora (429). No máximo um por usuário dentro da janela de 1 hora do limite.

Retenção: 12 meses (`app.auditoria.retencao`, padrão `P365D`, mínimo `P30D`: abaixo
disso a aplicação não sobe; horário em `app.auditoria.retencao-cron`, padrão `0 30 3 * * *`).

## O que NÃO é filtrado automaticamente

- **SQL nativo.** Só é permitido em repository com `@SqlNativoRevisado`, e a consulta filtra `tenant_id` à mão (ou é global de propósito, como a checagem de e-mail único).
- **Entidades da plataforma**, que não estendem `TenantEntity`: `Tenant`, `SessaoUsuario`, `RefreshToken`, `EventoSeguranca`. As consultas delas são por id ou hash, ou filtram à mão, como `ConsultaEventoService.listar`.

## E se for um container por contratante?

Nada muda no código. Cada container sobe com o próprio banco e variáveis
próprias, e lá dentro existem só a Plataforma e um contratante. O filtro
continua ligado como defesa extra. Para provisionar:

1. Um banco (ou schema) e um conjunto de segredos (`APP_JWT_SEGREDO`, `APP_CRIPTO_CHAVE`) por contratante.
2. A mesma imagem Docker com variáveis diferentes.
3. O superadmin cria o contratante e o primeiro admin pela API.

Os dois modelos podem coexistir: clientes pequenos no banco compartilhado e
clientes grandes no próprio container.
