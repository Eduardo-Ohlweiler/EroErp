# EroErp 2.0 — Guia para Agentes

ERP multi-tenant. É a reescrita do **EroErp antigo**
(`C:\Users\eduardoohlweiler\Documents\EroErp`), montada sobre a base de um
projeto anterior que saiu mais bem construída que ele: acesso, multi-tenant,
auditoria de login, componentes, impressão, exportação e paletas.

Os módulos do EroErp antigo entram **aos poucos, um de cada vez**, e cada um é
melhorado na passagem, não copiado. **Na dúvida, pergunte** antes de decidir.

Sistema leve. Nada de complexidade que não se pague.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Backend | Java 21 · Spring Boot 3.5 · Maven |
| Persistência | PostgreSQL 16 · Spring Data JPA / Hibernate 6 · Liquibase XML |
| Segurança | Spring Security · JWT (JJWT 0.12.x) · BCrypt · Bucket4j |
| Docs | SpringDoc OpenAPI |
| Frontend | React 19 · TypeScript · Vite · Tailwind v4 |
| Front (libs) | react-router-dom · axios · react-hook-form · zod · react-toastify |
| Chave primária | **UUID** em todas as tabelas |

---

## Estrutura

```
EroErp2.0/
├── CLAUDE.md · docs/
├── ero-erp-api/                   # com.api.ero_erp
│   ├── .env.example · run-dev.sh · README.md
│   ├── scripts/popular-dev.mjs    # dados de demonstração, só localhost
│   └── src/main/java/com/api/ero_erp/
│       ├── EroErpApplication.java
│       ├── config/                # SecurityConfig, JwtUtil, JwtFilter, SecurityUtils,
│       │                          # AuthDetails, RateLimitFilter, PageableUtils,
│       │                          # TransacaoConfig, DataSeeder, SwaggerConfig
│       ├── exceptions/            # GlobalExceptionHandler + hierarquia
│       ├── baseentity/            # BaseEntity, TenantEntity
│       ├── jobs/                  # ManutencaoJob
│       └── {modulo}/              # tenant, usuario, auth, loginlog, refreshtoken,
│           ├── controller/        # pessoa, contato, vinculo, catalogo, localidade,
│           │                      # filial, servico, sequencia, produto,
│           │                      # auxiliarproduto, estoque, compromisso
│           ├── dtos/
│           ├── entity/
│           ├── enums/
│           ├── mapper/
│           ├── repository/
│           └── service/
│                                  # catalogo/ = tipos de cadastro, telefone, e-mail,
│                                  #   rede social e endereço, e a unidade de
│                                  #   medida do produto (sem tenant)
│                                  # auxiliarproduto/ = grupo, subgrupo, categoria
│                                  #   e marca, por tenant (docs/11 §2)
│                                  # estoque/ = produto × filial, preço de venda,
│                                  #   movimentação com sinal e trava (docs/11 §3)
│                                  # localidade/ = estados e cidades do IBGE, e o
│                                  #   CEP (GET /cep/{cep}, ViaCEP pelo backend,
│                                  #   cidade pelo código IBGE — docs/08 §3.4)
│                                  # tenant/ = também a paleta de cores de cada
│                                  #   tenant (PaletaSistema, docs/05 §11)
│                                  # sequencia/ = código curto por tenant
│                                  #   (serviço e produto 1, 2, 3… — docs/10 §2)
└── ero/                           # frontend
    ├── public/                    # favicon e ícones
    ├── scripts/validar-paletas.mjs  # npm run paletas — contraste e cascata
    └── src/
        ├── assets/brand/          # logo-ero-horizontal.svg (menu) · logo-ero-simbolo.svg
        │                          # (menu recolhido) · logo-ero.svg
        │                          # (login, 404) — vetor nas cores do tema
        │                          # logo-full.svg (texto, só na folha impressa)
        ├── assets/icons/          # SVG inline, módulo único
        ├── styles/theme.css       # tokens Tailwind v4 + temas claro/escuro
        │                          # + 9 paletas [data-paleta] (doc 05 §11)
        ├── styles/paletas.ts      # catálogo das paletas, sem hex
        ├── components/common/     # TPage TPanel TDataGrid TDataGridFooter
        │                          # TEntry TSelect TCombo TButton TBadge TModal
        │                          # TThemeToggle TTabs TResult TResultGroup
        │                          # TResultTable TAviso TCheckBox TRadio TTextArea
        │                          # TBotaoImprimir TAcoesDeExportacao TComboMulti
        │                          # (doc 04 §7)
        ├── components/agenda/     # GradeHoras · GradeMes · ListaAgenda
        │                          # ResumoCompromisso · AcoesCompromisso
        ├── components/impressao/  # Folha · TiraIndicadores · Secao · LinhasDeValor
        │                          # TabelaDoc · DocumentoLista (doc 05 §8)
        ├── components/layout/     # Layout · Sidebar · TenantSwitcher · TProtected
        │                          # MarcaEro (logo nas cores do tema)
        ├── components/pessoa/     # PessoaRapidaModal (cadastro rápido)
        ├── components/tenant/     # SeletorPaleta (as 20 paletas, com miniaturas)
        ├── components/usuario/    # RedefinirSenhaModal
        ├── contexts/              # AuthContext · ThemeContext
        ├── hooks/                 # useAuth · useTheme · useDebounce · useMenuRecolhido
        ├── services/              # api.ts (interceptor + refresh) + um por módulo
        ├── pages/                 # auth/Login · Inicio · usuario · tenant · pessoa · filial
        │                          # servico · produto · estoque · agenda · loginlog · perfil
        ├── types/ utils/          # utils/format.ts (paraNumero, máscaras, datas)
        │                          # utils/planilha.ts (exportação CSV)
        │                          # utils/estoque.ts (máscara da quantidade pela unidade)
        │                          # utils/agenda.ts (dia × instante, blocos na grade)
        └── routes/AppRoutes.tsx
```

**Sem Docker.** PostgreSQL local, variáveis em `.env`, `./run-dev.sh` para subir.
Testes contra o banco `ero_erp_test` — nada de H2 nem Testcontainers.

---

## Onde estamos

| Fatia | Situação |
|---|---|
| **0 — Esqueleto** | ✅ pronto · herdado do projeto anterior: acesso (login, refresh com rotação, troca de tenant), tenants com período de acesso e **paleta de cores por tenant**, usuários (com **redefinição de senha pelo superadmin**), log de acesso, perfil e **cadastro de pessoas** (PF/PJ, contatos, endereços com IBGE, vínculos). Migrations 001–016 |
| **Permissões por tela** | ✅ pronto · o superadmin libera módulos ao USER e, por tela, leitura ou escrita (`permissao/`, migration 017, [docs/02 §1.2](docs/02-modulo-usuarios.md)). Módulo é o assunto que se libera (Pessoas, Filiais), não o grupo do menu |
| **Filiais** | ✅ pronto · o "emitente" do antigo: matriz e filiais apontando para uma pessoa, várias matrizes por tenant (`filial/`, migration 018, [docs/09](docs/09-modulo-filiais.md)) |
| **Serviços** | ✅ pronto · cadastro próprio, separado de produto e sem estoque: código curto por tenant (`tenant_sequencia`), nome único no tenant, valor **opcional por filial** — vazio não é zero (`servico/`, migrations 019–020, [docs/10](docs/10-modulo-servicos.md)) |
| **Produtos, auxiliares e estoque** | ✅ pronto · do antigo, sem a parte fiscal: produto com código por tenant, EAN com dígito verificador e custo opcional; unidade global; grupo/subgrupo, categoria e marca por tenant; estoque só de produto, por filial, com preço de venda opcional, "controla estoque" (sem ele, a linha só guarda o preço), entrada, ajuste e transferência com quantidade **com sinal** e a linha travada (`produto/`, `auxiliarproduto/`, `estoque/`, migrations 021–024, [docs/11](docs/11-modulo-produtos-estoque.md)). Mínimo só guardado: o alerta vem com o painel |
| **Menu recolhível** | ✅ pronto · expandido ↔ só ícones em `lg+`, Ctrl+B, lembrado no navegador ([docs/04](docs/04-arquitetura-frontend.md), "O menu recolhe") |
| **Agenda** | ✅ pronto · compromisso com responsável **escolhido** (usuário), convidados, cliente opcional, filial e cor herdada dela; conflito **por usuário** — o do responsável recusa, o do convidado só avisa; recorrência de 2 a 52 calculada a partir da primeira, no fuso do sistema; status único (agendado, confirmado, concluído, cancelado, faltou); calendário dia/semana/mês/lista feito à mão e responsivo (`compromisso/`, migration 025, [docs/12](docs/12-modulo-agenda-consulta.md)) |
| Em andamento | plano aprovado, nesta ordem: **consulta** (serviços e produtos sobre o compromisso; o campo some sem a permissão de Serviços/Produtos; baixa de estoque) → **WhatsApp** (Evolution: servidor global do superadmin, conexão por tenant ou por filial, conectar/desconectar por QR) → avisos, lembrete e **pós-atendimento** → **pacotes**. Financeiro fica de fora |
| Próximas | **migrar módulos do EroErp antigo**, um de cada vez, perguntando antes qual e como |
| `audit_log` | pendente · especificação em [docs/06 §A09](docs/06-seguranca-owasp.md); molde estrutural é o `loginlog`, com o expurgo no `ManutencaoJob` |
| Recuperação de senha por e-mail | pendente · depende de escolher o serviço de e-mail (não há `spring-boot-starter-mail` no `pom.xml`). Enquanto isso, o superadmin redefine em `PATCH /usuarios/{id}/senha` |
| Marca | o logo do EroErp antigo, redesenhado em SVG que segue o tema, entra no menu (horizontal), no login e no 404; favicons ainda são os do projeto anterior |

Bancos `ero_erp` e `ero_erp_test` criados no PostgreSQL 17 local.

### Migrando do EroErp antigo

O antigo mora em `C:\Users\eduardoohlweiler\Documents\EroErp` ou em
`C:\Users\Eduardo\Documents\GitHub\EroErp`, conforme a máquina — nesta
segunda, esta pasta é subpasta dele (`ero-erp-api`, pacote `com.api.ero_erp`;
front em `ero/`).

Para pesquisar sem encher o contexto, há dois agentes **só de leitura** em
`.claude/agents/`: **`pesquisa-eroerp-antigo`** (como o antigo fazia) e
**`pesquisa-silvia`** (o sistema da Silvia, base de infraestrutura deste:
como já foi resolvido lá). Ao trazer um módulo:

1. **Perguntar** qual módulo e o que muda nele antes de começar.
2. Ler o módulo lá, entender o que ele resolve, e redesenhá-lo no padrão daqui —
   a implementação nova deve parecer escrita junto com o resto deste sistema.
3. Converter:
   - `cliente_id` de lá é `tenant_id` aqui (`TenantEntity`);
   - `BIGSERIAL`/`Long` vira **UUID**;
   - JPQL com filtro opcional vira **native query com `CAST`** (regra 2);
   - entidade nunca sai do controller: DTO `record` + mapper estático (regra 3);
   - toda tela nasce responsiva (regra 6).
4. Migration nova em `db/changelog/changes/NNN-descricao.xml`, continuando a
   numeração.
5. Permissão: cada tela nova vira constante em `Tela` (e no `Modulo`, se for
   módulo novo — módulo é o **assunto que se libera**, não o grupo do menu) e em
   `types/permissao.ts`; o item do menu leva `tela:` para só aparecer a quem lê; GET com `hasAuthority('<TELA>_LER')`,
   escrita com `hasAuthority('<TELA>_ESCREVER')`, `/select` com
   `isAuthenticated()`; a tela usa `useSomenteLeitura` e a rota, `TProtected tela`.
6. Testes de integração no molde dos que existem (`AbstractIntegrationTest`),
   incluindo o de isolamento entre tenants e o par leitura/escrita do `PermissaoTest`.

## Modelo de acesso

Nível único por usuário, enum em `usuario.role`: **`SUPERADMIN`** (administra o
sistema, único que atravessa tenants, e só existe no tenant do sistema — o que
abriga um superadmin nunca expira) · **`ADMIN`** (administra o próprio tenant) ·
**`USER`** (opera dentro do tenant). Sem tabela de role, sem grupo de acesso.

A área administrativa — `/tenants`, `/usuarios`, `/login-logs` — é exclusiva
do `SUPERADMIN`. `ADMIN` acessa todos os módulos de negócio; **`USER` só as
telas que o superadmin liberou**, cada uma em leitura ou escrita
(`usuario_permissao`). O catálogo de módulos e telas é o enum `Tela`, não
tabela. A permissão não vai no token: o `JwtFilter` a lê do banco a cada
requisição, então muda na hora. O front recebe o mapa já resolvido em
`AuthResponseDto.permissoes` e relê em `/usuarios/perfil/acesso` a cada 403.
Quem só lê não vê Salvar, Novo nem Inativar. Detalhe em
[docs/02 §1.2](docs/02-modulo-usuarios.md).

**Sem autocadastro.** A superfície pública são duas rotas de autenticação,
`/auth/login` e `/auth/refresh`. Usuário só nasce por `POST /usuarios`, do
superadmin. O tenant nasce por dois caminhos, ambos do superadmin: pela tela de
tenants (`POST /tenants`, sem usuário — o atalho "Novo usuário neste tenant"
leva ao cadastro de usuário com o tenant já escolhido), ou junto do primeiro
usuário, quando nenhum tenant é indicado.

**A paleta de cores é do tenant.** Só o superadmin a escolhe, no cadastro do
tenant (`PATCH /tenants/{id}/paleta`). Ela viaja na resposta de autenticação
(`AuthResponseDto.paleta`, a do tenant efetivo), então troca junto na troca de
tenant. A tela de login, que ainda não sabe o tenant, abre sempre na `PADRAO`.

**Senha perdida, o superadmin redefine.** `PATCH /usuarios/{id}/senha`, dentro
do tenant efetivo, nunca a própria. Desbloqueia a conta, revoga os refresh
tokens e sobe `usuario.versao_sessao` — o access token leva essa versão, e o
`JwtFilter` derruba na hora o que foi emitido antes. Contador e não carimbo de
tempo: o `iat` do JWT tem resolução de segundo.

**A licença é do tenant, não do usuário.** `tenant.periodo_acesso`
(Indeterminado · 1 · 2 · 3 · 6 meses · 1 · 2 anos) e `tenant.acesso_expira_em`
são escolhidos ao abrir o cliente, no mesmo formulário. Uma rotina diária
desliga quem venceu, e o login barra o vencido sem esperar por ela. Renovar é
`PATCH /tenants/{id}/acesso`, sempre recontando a partir de hoje — e é a única
porta de volta: reativar um vencido devolve 409. O tenant do superadmin nunca
expira. Detalhe em [docs/02 §1.1](docs/02-modulo-usuarios.md).

---

## As 6 regras que não podem ser esquecidas

**1. Isolamento por tenant é a regra máxima.**
Toda entidade de negócio tem `tenant_id NOT NULL`. Toda consulta filtra por
`securityUtils.getTenantIdLogado()`. Proibido `findById`, `findAll`, `deleteById`
em entidade multi-tenant — use `findByIdAndTenantId`, `findAllByTenantId`.
Nunca aceitar `tenantId`, `usuarioId` ou `role` vindos do frontend — a única
exceção são as consultas `/global` do superadmin, onde `tenantId` é *filtro
opcional* e a role substitui o `WHERE`.
Detalhes: [docs/01-multitenant.md](docs/01-multitenant.md)

**2. Listagem com filtro opcional = native query com `CAST` explícito.**
O JPQL do Hibernate 6 não consegue tipar um parâmetro nulo solto em
`:param IS NULL`, e o Postgres responde *"não foi possível determinar o tipo de
dados do parâmetro $N"*. Native query resolve e ainda libera `unaccent`.

```sql
WHERE u.tenant_id = CAST(:tenantId AS uuid)
  AND (CAST(:nome  AS text)    IS NULL OR unaccent(lower(u.nome)) LIKE unaccent(lower('%' || CAST(:nome AS text) || '%')))
  AND (CAST(:ativo AS boolean) IS NULL OR u.ativo = CAST(:ativo AS boolean))
  AND (CAST(:de    AS timestamptz) IS NULL OR l.data_login >= CAST(:de AS timestamptz))
ORDER BY u.nome
```

Toda native paginada precisa de `countQuery`, e o `Sort` do cliente é descartado
com `PageableUtils.semOrdenacao(pageable)` — a ordenação é fixa no SQL.

**3. DTO sempre.** Controller nunca recebe nem retorna Entity. Request e Response
são `record` com Bean Validation. Conversão só via Mapper.

**4. Liquibase sempre.** Nenhuma alteração estrutural fora de
`db/changelog/changes/NNN-descricao.xml`. Nunca editar changeSet já executado
(a renumeração de 2026-10 só foi possível porque nenhum banco existia).

**5. Nada de dado pessoal, senha ou token em log.** Nome, CPF, telefone,
e-mail, endereço — dados pessoais sob a LGPD. Os logs levam o id e a operação.

**6. Toda tela é responsiva. Sem exceção.**
Desktop, tablet e celular. Não é ajuste no fim — é como a tela nasce. Nenhuma
tela é dada por pronta sem funcionar em 360px de largura, sem rolagem
horizontal e sem conteúdo cortado. Grid vira cartão no mobile, sidebar vira
*drawer*, coluna secundária some antes da principal.

---

## Armadilhas já pagas

**Teste verde não prova que o Tomcat sobe.** Nesta máquina Windows o JDK 21
abre um socket local (AF_UNIX) na pasta temporária do usuário para o `Selector`
do NIO, e essa pasta recusa o socket: a API morria com *"Unable to establish
loopback connection"* enquanto os 111 testes passavam, porque o MockMvc não
abre Tomcat. O `run-dev.sh` aponta `jdk.net.unixdomain.tmpdir` para
`ero-erp-api/.tmp/` no Windows. Subir a API de outro jeito (IDE, `mvn` direto)
precisa da mesma propriedade.

**Logo em cor fixa destoa de metade das paletas.** O logo antigo era um PNG
branco num chip navy fixo, e no menu claro virava um selo pequeno e estranho.
Agora os SVGs de `assets/brand/` têm letras em `currentColor` e acento em
`var(--logo-acento)`, e o `MarcaEro` os importa inline (`?react`) com `txt` e
`primary` do tema — um arquivo serve as 20 paletas e os dois temas. Nada de hex
dentro deles, nem um arquivo por tema. Login e 404 (sem tenant) mantêm a faixa
`bg-navy` com `data-theme="dark"`. Na folha impressa fica o logotipo de texto.


Cada uma destas custou depuração no projeto de origem. Não repita.

### Acesso e sessão

**Ler pode ser global; escrever é dentro do tenant.**
`GET /usuarios/global` e `GET /login-logs/global` são os únicos pontos que
atravessam tenants, exclusivos de `SUPERADMIN` e com nome explícito. Toda
escrita (`POST`, `PUT`, `PATCH`) filtra pelo tenant efetivo e devolve 404 fora
dele. No front, abrir um registro de outro cliente **entra naquele tenant
antes** — é o que o `switch-tenant` faz.

**Nunca recarregar a página ao trocar de tenant.**
O access token vive em memória. Um `navigate(0)` ou `location.assign` o
descarta, o boot restaura a sessão pelo refresh token — que pertence ao tenant
de **origem** — e o usuário volta de onde saiu. O `AuthContext` já atualizou a
sessão; as listas refazem a consulta porque dependem de `sessao.tenantId`.

**Uma trava só de renovação de token, no aplicativo inteiro.**
O refresh é de uso único com rotação: reapresentar um token consumido faz o
backend revogar a cadeia, tratando como roubo. O `StrictMode` monta efeitos
duas vezes em desenvolvimento — sem a trava compartilhada de
`renovarSessao()`, o boot derruba a própria sessão. O sintoma era cair no login
sem motivo aparente.

**Escrita que precisa sobreviver a rollback vai em transação independente.**
Contador de tentativas de login, revogação de refresh reutilizado e log de
falha acontecem em caminhos que terminam em exceção. Use
`@Transactional(REQUIRES_NEW)` entre beans, ou o `TransactionTemplate`
`transacaoIndependente` quando a chamada é interna à classe — self-invocation
não passa pelo proxy e a anotação é ignorada em silêncio.

**Rota literal antes de `/{id}`.** `/usuarios/global`, `/select` e `/perfil`
convivem com `/usuarios/{id}` porque o Spring prefere o literal. Se der
*"Valor inválido para o parâmetro: id"*, a aplicação em execução está
desatualizada — reinicie.

### Backend e testes

**A compilação incremental do Maven mente quando você muda uma assinatura.**
`./run-dev.sh compile` pode responder *"Nothing to compile"* e **BUILD
SUCCESS** com o projeto quebrado: uma assinatura mudou, o chamador em outro
pacote não foi recompilado, e os testes rodam contra o `.class` velho. O sintoma
é 500 com `NoSuchMethodError` escondido atrás de *"Erro inesperado"*. Mudou
assinatura pública, rode `./run-dev.sh clean compile`.

**Guarda com teto e sem piso deixa passar exatamente o erro mais provável.**
Com a máscara de centavos, o erro provável é o número **pequeno** — quem digita
`156` num campo de duas casas obtém `1,56`. `@DecimalMin("0.0")` só barra
negativo. Piso e teto são a mesma guarda pela metade cada um, e o lado que a
interface torna provável é o que precisa da frase melhor (*"para 156, digite
15600"*). Ao fechar uma guarda de entrada, `grep` do mesmo campo em **todos**
os DTOs que o recebem.

**O ramo que o usuário escolhe não herda a guarda do ramo automático.**
Quando um `if` separa "o sistema escolheu" de "o usuário escolheu", confira se
as duas pernas têm as mesmas guardas e o mesmo teste. Exceção sem handler cai
no catch-all e vira 500 na tela.

**Ramo `else if` sem `else` é traço mudo esperando acontecer.**
Em bloco que produz valor-e-motivo, **todo caminho que não produz valor tem de
produzir motivo**, e a forma de garantir isso é o `else` final. O teste que
trava é chamar sem a entrada e exigir `motivo != null` — e a prova de que ele
trava algo é reintroduzir o defeito e vê-lo ficar vermelho. **Um teste que
passa antes e depois da correção não trava nada.**

**Derivado que a regra escolhe tem de ser publicado, não só a procedência.**
Quando o servidor decide entre dois valores, ele expõe **o número escolhido**,
não só um texto dizendo de onde veio. Do contrário cada tela reimplementa a
decisão, e a enésima erra. O percentual é literalmente `parte / valor exposto`,
e o teste trava essa invariante.

**Calculador escrito e testado não é funcionalidade entregue.** Método público
verde e órfão passa por auditoria sem aparecer. Antes de dar uma fatia por
pronta, `grep` do nome de cada método público novo: se só aparece na própria
declaração e no teste, ninguém o chama.

**`Map.of` numa mensagem que o usuário lê muda de assunto a cada execução.**
Coleção que alimenta texto lido por gente é ordenada — `LinkedHashMap`, na
ordem em que a regra apresenta os itens.

**Teste que depende do dia do mês quebra sozinho, e ensina a ignorar vermelho.**
Ao afirmar sobre um período (mês corrente, semana corrente), ancore a data
**dentro** dele; subtrair dias de hoje atravessa a virada do mês.

**`deleteAll(lista)` só enfileira, e num teste `@Transactional` isso muda a ordem.**
Na limpeza do `AbstractIntegrationTest`, use **`deleteAllInBatch`**, que executa
na hora; senão o delete em lote do pai chega ao banco antes do filho e a FK
estoura — só quando a ordem das classes muda.

**Faixa de validação se roda contra os dados que o sistema já distribui.**
Antes de pinar um limite, rodar o limite contra o seed — e travar isso em
teste, para quem apertar a faixa depois ser reprovado pelo próprio seed.

**Dado de fonte oficial passa por conferência de leiaute e de domínio antes de
virar seed.** Gerador de seed **para** diante de todo texto que não reconhece;
cada correção vai escrita no comentário da migration.

### Frontend

**`brand-*` é fixo; `surface`/`txt`/`line`/`primary` viram com o tema.**
`hover:bg-brand-50` fica branco no tema escuro. Se o elemento é interface, use
token de tema. Botão cheio usa `text-txt-inverse`, nunca `text-white` — no
escuro a primária é clara e o branco reprova o contraste (3,28:1).

**Variável CSS que aponta para outra é resolvida onde é declarada.**
`--color-bg: var(--bg)` no `:root` desce já resolvida; redefinir `--bg` num
elemento interno não muda nada. Todo elemento com `data-theme` refaz a ponte
(`theme.css`, bloco `[data-theme] { --color-bg: var(--bg); … }`). E seletor de
descendente casa com **qualquer** ancestral, não com o mais próximo — daí o
`:not([data-paleta])` e o `data-paleta="padrao"` explícito nas miniaturas
(docs/05 §11.6).

**Ponto digitado é decimal, não milhar.** `paraNumero` (`utils/format.ts`) é a
única porta por onde texto vira número no front. Só é milhar quando há vírgula
no número, quando há mais de um ponto, ou no padrão `1.500` (1 a 3 dígitos,
três depois, sem começar em zero). Removendo todo ponto, `72.5` virava **725**.

**Campo numérico usa máscara de centavos, e vazio tem de continuar vazio.**
`TEntry` recebe `mascara="decimal" | "inteiro" | "decimalComSinal"`: os dígitos
entram pela direita (`7250` → `72,50`). **Apagar tudo devolve string vazia**,
não `0,00`, e **colar passa por `paraNumero`** (senão colar `70` daria `0,70`).
Ao repovoar registro salvo, use `textoDaMascara(valor, casas)` com as mesmas
casas do campo: `String(72.5)` daria `"72,5"`, que a primeira tecla releria
como `725`.

**"—" é uma string, e string não é ausência.** `formatarNumero(null)` devolve o
traço `AUSENTE` (`utils/format.ts`), e o `TResult` o reconhece como vazio para
mostrar o motivo. Sentinela de ausência que também é valor de exibição é
**constante compartilhada**, nunca literal repetido. Nenhuma tela está
verificada enquanto ninguém a abriu vazia para ver se ela fala.

**`new Date('2026-08-29')` é meia-noite UTC, e no Brasil isso é ontem.**
Data sem hora é **dia do calendário**: monte com `T00:00:00` (meia-noite local)
antes de formatar. Timestamp completo (`createdAt`) é instante real e se formata
no fuso do leitor.

**`toISOString()` devolve a data em UTC, e à noite isso é amanhã.** Data padrão
de formulário é `hojeIso()` (`utils/format.ts`), nunca
`new Date().toISOString().slice(0, 10)` — das 21h à meia-noite isso dá o dia
seguinte, e um campo `@PastOrPresent` recusa com 400.

**Rota `/nova` e rota `/:id` com o mesmo componente compartilham a instância.**
Toda rota de cadastro passa por `PorRegistro` (`routes/AppRoutes.tsx`), que
chaveia o formulário pelo `id`. Sem isso, ir de um registro salvo para o novo
mantém os dados do anterior, e salvar cria uma cópia calada.

**Tela nova começa no topo, e quem garante é o `Layout`.** O `BrowserRouter`
não rola sozinho: a janela ficava na altura da tela anterior, e o formulário
aberto do fim do calendário nascia com os primeiros campos escondidos. O
`Layout` faz `window.scrollTo(0, 0)` a cada troca de rota, menos no Voltar do
navegador (`POP`). Não duplicar isso por tela.

**Rota filha de um item de menu acende os dois.** O `NavLink` casa por prefixo:
página que tem item próprio no menu mora em rota própria, não debaixo de outro
item.

**Nesta tela um 400 pode ser estado, não evento.** Numa superfície que
recalcula sozinha (debounce), cada pausa da máscara dispara uma requisição, e
`handleApiError` mandaria cada 400 para o toast — três avisos por número
digitado. Ali, **400 é recusa de entrada e aparece inline**; 500, sessão e rede
continuam no toast. Quem decide é a tela, não o interceptor.

**Legenda escrita à mão mente no dia em que a fonte passa a variar.** Quando o
servidor manda a procedência ou a regra aplicada, a tela **usa** o que veio —
literal ao lado de interpolação no mesmo bloco é o cheiro. E motivo é do
tamanho da coisa que faltou: um motivo por campo, nomeando o que falta.

**Número arredondado ao lado de um limite precisa de casas para discordar dele.**
As casas de um valor classificado são as que bastam para ele não coincidir com
o limiar quando está do outro lado.

### Impressão e exportação

**Imprimir o formulário devolve formulário.** Cada tela imprimível monta uma
`Folha` e a passa à `TPage` pela prop `documento`; a `TPage` marca o conteúdo
de tela como `.nao-imprime`. Quem lê no papel quer **demonstrativo**, não campos
de entrada.

**`break-inside: avoid` numa caixa mais alta que a página esvazia a página.**
Só promete não quebrar quem é menor que a página — a linha da tabela, a tira de
indicadores. Para o título existe `break-after: avoid`; o rodapé precisa de
`break-before: avoid`.

**Componente de folha impressa carrega a forma do dado que o pariu.**
`LinhasDeValor` foi desenhado para número (coluna de 22 % à direita); para
texto corrido use a variante `prosa`. Ao reusar um componente de impressão,
pergunte **de que forma era o dado** para o qual ele foi desenhado. Isso só
aparece no PDF.

**Exportar a página visível é a armadilha da listagem.** `TAcoesDeExportacao`
refaz a consulta **paginando** (100 por vez, o `max-page-size` do servidor) até
o total ou o teto de 2.000 linhas, e **anuncia quantas ficaram de fora**. O CSV
escapa `=`, `+`, `-` e `@` no início da célula: texto digitado não pode virar
fórmula na máquina de quem abre.

**Exportação com escopo duplo repete o `if` da tela, ou mente calada.**
`UsuarioList` e `LoginLogList` alternam entre a consulta do tenant e a `/global`
do superadmin. O `carregarTudo` da exportação **tem de repetir esse mesmo `if`**.

**Limite pedido pelo cliente não é limite obtido.** Quando dois limites são
declarados em camadas diferentes, o menor vence em silêncio; só contar as linhas
do arquivo mostra.

**Retrato gravado explica o número; catálogo de hoje explica o cálculo de hoje.**
Registro que depende de um cadastro editável (preço, descrição, rótulo) grava o
**retrato** do que valia no momento, e a tela do registro salvo lê o retrato,
não o catálogo vivo — senão a legenda passa a ser de outro dia e a conta deixa
de fechar no papel.

---

## Índice de documentação

| Doc | Assunto |
|---|---|
| [docs/00-PROMPT-MESTRE.md](docs/00-PROMPT-MESTRE.md) | Prompt de criação do projeto · ordem de construção · glossário |
| [docs/01-multitenant.md](docs/01-multitenant.md) | Isolamento por tenant — regra máxima |
| [docs/02-modulo-usuarios.md](docs/02-modulo-usuarios.md) | Usuários, níveis de acesso, log de acesso, troca de tenant |
| [docs/03-arquitetura-backend.md](docs/03-arquitetura-backend.md) | Padrão Java 21 + Spring Boot |
| [docs/04-arquitetura-frontend.md](docs/04-arquitetura-frontend.md) | Padrão React 19 + TS + Tailwind |
| [docs/05-identidade-visual.md](docs/05-identidade-visual.md) | Paleta, tipografia, tokens, marca |
| [docs/06-seguranca-owasp.md](docs/06-seguranca-owasp.md) | OWASP Top 10 aplicado a Java/Spring |
| [docs/07-banco-liquibase.md](docs/07-banco-liquibase.md) | PostgreSQL + Liquibase |
| [docs/08-modulo-pessoas.md](docs/08-modulo-pessoas.md) | Cadastro de pessoas — PF/PJ, contatos, endereços e vínculos |
| [docs/09-modulo-filiais.md](docs/09-modulo-filiais.md) | Filiais — matriz e filiais (o emitente do antigo), várias matrizes por tenant |
| [docs/10-modulo-servicos.md](docs/10-modulo-servicos.md) | Serviços — código por tenant, valor opcional por filial, sem estoque |
| [docs/11-modulo-produtos-estoque.md](docs/11-modulo-produtos-estoque.md) | Produtos, auxiliares e estoque — preço por filial no estoque, movimentação com sinal e trava |
| [docs/12-modulo-agenda-consulta.md](docs/12-modulo-agenda-consulta.md) | Agenda — responsável escolhido, convidados, conflito por usuário, recorrência; a consulta vem em seguida |

---

## Antes de escrever código novo

1. Procurar módulo semelhante já implementado no projeto
2. Seguir a mesma estrutura, nomenclatura e componentes
3. Só então gerar código novo

A implementação nova deve parecer ter sido escrita junto com o resto do sistema.
O módulo `usuario` é a referência de CRUD multi-tenant completo: migration →
entidade → DTOs `record` → mapper estático → repository com `AndTenantId` →
service com `@Transactional` → controller com `@PreAuthorize` → testes.

Para **módulo de negócio** (não administrativo), a referência é `pessoa`:
`isAuthenticated()` em vez de role, listas filhas sincronizadas num único PUT e
catálogo de referência sem tenant. Ver [docs/08](docs/08-modulo-pessoas.md).

---

## Olhar as telas — não pule isto

**Não há teste de front neste projeto**, e `build` + `lint` + a suíte inteira
verde já deixaram passar, no projeto de origem, dezenas de defeitos que só
apareceram no navegador ou no PDF.

A skill **[`olhar-telas`](.claude/skills/olhar-telas/SKILL.md)** tem o driver
pronto e as armadilhas já pagas (esperar por `aside` e não por `**/app**`,
máscara de centavos, combo × seletor de tenant, campo escondido em outra aba).
Uso direto:

```bash
node .claude/skills/olhar-telas/olhar.mjs /app tela
node .claude/skills/olhar-telas/olhar.mjs /app/pessoas lista --pdf
node .claude/skills/olhar-telas/olhar.mjs /app/usuarios usuarios --360
```

Entra com o superadmin do `ero-erp-api/.env` (abaixo, "Rodar"). No Git Bash,
prefixe `MSYS_NO_PATHCONV=1`, senão `/app/...` vira caminho do Windows.

Sai em `<tmp do SO>/olhar/`, e reporta rolagem horizontal, elemento culpado e
erro de console. **Depois abra o arquivo** — gerar e não olhar não vale.

`playwright-core` já está no `node_modules` do front e dirige o Chrome instalado
(`CHROME_PATH` ou o caminho padrão do SO): **não instale playwright**.

## Rodar

```bash
cd ero-erp-api
cp .env.example .env      # ajuste DB_PASSWORD e JWT_SECRET
./run-dev.sh              # sobe em :8080
./run-dev.sh test         # testes contra ero_erp_test
```

**Login de desenvolvimento.** O superadmin desta máquina está no
`ero-erp-api/.env` (`SUPERADMIN_EMAIL` / `SUPERADMIN_PASSWORD`), local e fora
do git — o `.env.example` tem só um valor de exemplo, que não é a senha do
banco. Os scripts (`bateria-filiais.mjs`, `olhar.mjs`) leem de lá sozinhos.
**Não chute senha**: login que falha conta tentativa e bloqueia a conta; e são
no máximo 5 logins por minuto. Os testes usam outro banco e outros usuários
(`root@teste.local`, `admin.a@teste.local`… senha `SenhaDeTeste123`, do
`AbstractIntegrationTest`).

Antes da primeira subida, crie os dois bancos:

```bash
createdb -U postgres -h localhost ero_erp
createdb -U postgres -h localhost ero_erp_test
```

**Dados de demonstração** — pessoas (clientes, fornecedores e funcionários),
gravadas **pela API** e conferidas na volta. Só roda contra localhost;
reaproveita o que já existe. **Nunca em produção.**

```bash
POPULAR_EMAIL=... POPULAR_SENHA=... node ero-erp-api/scripts/popular-dev.mjs
```

**Bateria multi-tenant** — com o superadmin do `.env`, abre três tenants
`(demo)` (Mercado Bom Preço, Grupo Vida Plena com duas matrizes, Auto Center
Rápido), cada um com ADMIN, USER, pessoas, filiais, serviços, produtos e estoque
próprios, e confere isolamento, regras e permissão de cada módulo. As
transferências dela vão e voltam, então rodar de novo não muda saldo. Reaproveita o que existe; os
usuários `admin@<tenant>.demo.local` entram com a senha que ela imprime. Cada
módulo novo que tiver tenant acrescenta aqui as suas conferências.

```bash
node ero-erp-api/scripts/bateria-filiais.mjs
```

Exige **JDK 21**. O `run-dev.sh` localiza o JDK certo mesmo que o `JAVA_HOME` da
máquina aponte para outra versão. Detalhes no
[README da API](ero-erp-api/README.md).
