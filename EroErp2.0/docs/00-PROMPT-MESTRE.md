# Prompt-Mestre — EroErp 2.0

> Este é o documento de partida. Ele descreve **o que** é o sistema, **com o quê**
> ele é construído e **como** ele cresce daqui em diante.
> Os documentos 01–08 descrevem **como** escrever cada parte. Leia este primeiro e
> o específico da tarefa depois.

---

## 1. O sistema

**Nome:** EroErp 2.0
**Repositório:** `EroErp2.0`

ERP web **multi-tenant**: cada cliente (empresa) é um tenant, com os seus usuários
e os seus dados, isolados dos de todos os outros.

É a **reescrita do EroErp antigo** (`~/Documents/EroErp` — pacote
`com.api.ero_erp`, front em `ero`). O antigo funciona, mas acumulou os defeitos
que este projeto existe para não repetir: `cliente_id` lido do banco a cada
chamada, JPQL que quebra com filtro nulo, entidade exposta no controller, chave
`BIGSERIAL`. Reescrever não é copiar: cada módulo que vem de lá passa pelas
regras deste repositório antes de entrar.

A base não nasce do zero. Ela foi herdada de um projeto anterior construído
sobre a mesma stack, onde já estava pronta e coberta por teste a parte que todo
sistema multi-tenant precisa e nenhum cliente vê: autenticação com JWT e refresh
rotativo, isolamento por tenant, licença do cliente com prazo, log de acesso,
troca de tenant do superadmin, cadastro de pessoas e a casca do front com tema e
paletas. Os módulos de negócio daquele projeto foram removidos; o esqueleto
ficou.

**Porte:** leve. Poucas dezenas de usuários por tenant, volume moderado de
escrita. Nada de fila, cache distribuído, microserviço ou event-sourcing. Um
backend Spring Boot, um banco PostgreSQL, um front React. Complexidade só entra
quando se paga.

---

## 2. Stack obrigatória

### Backend — `ero-erp-api`

| Item | Versão / escolha |
|---|---|
| Java | **21** |
| Spring Boot | **3.5.x** |
| Build | Maven · `com.api:ero-erp` |
| Pacote base | `com.api.ero_erp` · classe principal `EroErpApplication` |
| Banco | PostgreSQL 16 · `ero_erp` (testes em `ero_erp_test`) |
| Migrations | Liquibase **XML** |
| ORM | Spring Data JPA + Hibernate 6 |
| Segurança | Spring Security + JJWT **0.12.x** (API nova: `Jwts.builder().subject(...)`, `Jwts.parser().verifyWith(...)`) |
| Hash de senha | BCrypt, força 12 |
| Rate limiting | Bucket4j |
| Validação | Bean Validation (Jakarta) |
| Docs | SpringDoc OpenAPI 2.8.x |
| Observabilidade | Spring Boot Actuator |
| Boilerplate | Lombok |
| Testes | JUnit 5 + Spring Boot Test, contra PostgreSQL local (`ero_erp_test`) |

Não incluir JasperReports, Apache POI ou qualquer dependência de relatório/planilha
até existir um requisito concreto que as exija. A impressão hoje é a folha
montada no front (`components/impressao/`) e a exportação é CSV.

### Frontend — `ero`

| Item | Versão / escolha |
|---|---|
| React | **19** |
| Linguagem | **TypeScript** (zero `any`) |
| Bundler | Vite |
| Estilo | **Tailwind v4** (`@theme` com os tokens da marca) |
| Rotas | react-router-dom v7 |
| HTTP | axios (via `services/api.ts`) |
| Formulários | react-hook-form + **zod** |
| Notificação | react-toastify |
| Ícones | SVG inline em `assets/icons` |
| Fontes | `@fontsource/ibm-plex-sans` + `@fontsource/lato` (self-hosted) |

### Infraestrutura

**Sem Docker.** PostgreSQL instalado localmente, variáveis de ambiente em `.env`
(fora do repositório) e `./run-dev.sh` para subir. Exige **JDK 21**.

---

## 3. Estrutura de repositório

```
EroErp2.0/
├── CLAUDE.md
├── docs/                               # estes documentos
├── ero-erp-api/
│   ├── pom.xml
│   ├── run-dev.sh · .env.example · scripts/
│   └── src/
│       ├── main/java/com/api/ero_erp/
│       │   ├── EroErpApplication.java
│       │   ├── baseentity/             # BaseEntity, TenantEntity
│       │   ├── config/                 # SecurityConfig, JwtUtil, JwtFilter,
│       │   │                           # SecurityUtils, AuthDetails, SwaggerConfig,
│       │   │                           # RateLimitFilter, PageableUtils,
│       │   │                           # TransacaoConfig, DataSeeder
│       │   ├── exceptions/             # GlobalExceptionHandler + hierarquia
│       │   ├── jobs/                   # ManutencaoJob
│       │   └── {modulo}/
│       │       ├── controller/
│       │       ├── dtos/
│       │       ├── entity/
│       │       ├── enums/
│       │       ├── mapper/
│       │       ├── repository/
│       │       └── service/
│       ├── main/resources/
│       │   ├── application.yml
│       │   ├── application-dev.yml
│       │   ├── application-prod.yml
│       │   └── db/changelog/
│       │       ├── changelog-master.xml
│       │       └── changes/NNN-descricao.xml
│       └── test/java/com/api/ero_erp/
└── ero/
    ├── package.json
    ├── vite.config.ts
    └── src/
        ├── assets/                     # brand/ e icons/
        ├── components/
        │   ├── common/                 # biblioteca interna T*
        │   ├── impressao/              # Folha, DocumentoLista, ...
        │   ├── layout/                 # Layout, Sidebar, TenantSwitcher, TProtected, MarcaEro
        │   ├── pessoa/                 # PessoaRapidaModal
        │   ├── tenant/                 # SeletorPaleta
        │   └── usuario/                # RedefinirSenhaModal
        ├── contexts/                   # AuthContext, ThemeContext
        ├── hooks/                      # useAuth, useTheme, useDebounce
        ├── pages/{modulo}/
        ├── routes/
        ├── services/                   # api.ts + um service por módulo
        ├── styles/                     # theme.css (tokens Tailwind v4) + paletas
        ├── types/
        └── utils/
```

---

## 4. O que já existe

O esqueleto. Tudo o que está aqui está pronto, verificado contra a API rodando e
coberto por teste.

### Backend

| Módulo | Conteúdo |
|---|---|
| `tenant` | o cliente; ativo/inativo, **período de acesso** (a licença) — [02 §1.1](02-modulo-usuarios.md) — e a **paleta de cores** dos seus usuários, escolhida pelo superadmin — [05 §11](05-identidade-visual.md) |
| `usuario` | role única (`SUPERADMIN` · `ADMIN` · `USER`), bloqueio por tentativas, perfil próprio, senha redefinida pelo superadmin — [02](02-modulo-usuarios.md) |
| `auth` | login, logout, refresh com rotação, troca de tenant do superadmin. Sem registro público |
| `loginlog` · `refreshtoken` | log de acesso e tokens de renovação (só o hash no banco) |
| `pessoa` · `contato` · `vinculo` | cadastro de pessoas PF/PJ com telefones, e-mails, redes sociais, endereços e vínculos entre pessoas — [08](08-modulo-pessoas.md) |
| `catalogo` | `tipo_cadastro`, `tipo_telefone`, `tipo_email`, `tipo_rede_social`, `tipo_endereco` — referência sem tenant |
| `localidade` | estados e municípios do IBGE |
| `jobs` | `ManutencaoJob`: expiração de sessões, expurgo do log, desligamento de tenant vencido |

O `tipo_cadastro` vem semeado com **Cliente, Fornecedor, Funcionário e Outros**.

Migrations **001–016**: base e acesso (001–008), pessoas, IBGE, endereço,
vínculo e sexo (009–014), paleta do tenant (015) e versão da sessão do usuário
(016). A próxima livre é a 017.

### Frontend

Login · Início (cartões de atalho) · Meu perfil · Pessoas · Usuários (com a
redefinição de senha) · Tenants (com a paleta, no painel **Aparência**) · Log de
acesso · página de não encontrado. A raiz `/` redireciona para `/app`.

### Testes

111 testes: `AuthTest`, `AutorizacaoTest`, `CriacaoDeClienteTest`, `CadastroTenantTest`,
`TenantIsolationTest`, `RedefinicaoSenhaTest`, `PeriodoAcessoTest`,
`PaletaTenantTest`, `PessoaTest`, `EnderecoVinculoTest` — contra o banco
`ero_erp_test`, com `./run-dev.sh test`.

---

## 5. Como o sistema cresce: migração módulo a módulo

O que falta é **trazer os módulos de negócio do EroErp antigo** — produto,
pedido, estoque, financeiro e o resto do que existe lá —, **um de cada vez**.

**Antes de cada módulo, perguntar ao usuário** qual vem a seguir e o que dele
entra. A ordem não está fixada aqui de propósito: ela depende do que o cliente
precisa primeiro, e um módulo trazido "porque estava lá" é código a manter sem
ninguém usar.

Cada módulo é uma **fatia vertical**: do banco à tela, entregável sozinho, com
teste de isolamento. Não começar o próximo com o anterior pela metade.

### Roteiro de uma fatia

1. **Ler o módulo no EroErp antigo** — entidade, migration, service, controller
   e telas. Entender o que ele resolve antes de olhar como resolve.
2. **Decidir o que entra.** Campo que ninguém preenche, tela que ninguém abre e
   regra que só existe para contornar defeito do antigo ficam para trás.
3. **Escrever do jeito deste repositório**, na ordem do módulo de referência:
   migration → entidade → DTOs `record` → mapper estático → repository com
   `AndTenantId` → service com `@Transactional` → controller com `@PreAuthorize`
   → testes → telas.
4. **Olhar as telas** no navegador, em desktop e em 360 px. `build`, `lint` e a
   suíte verde não substituem isso.

Referências dentro deste repositório: `usuario` para CRUD administrativo,
`pessoa` para módulo de negócio (listas filhas sincronizadas num único `PUT`,
catálogo de referência sem tenant).

### Regras de conversão do EroErp antigo

| No EroErp antigo | No EroErp 2.0 |
|---|---|
| `cliente_id` | **`tenant_id`**, vindo do claim do JWT por `securityUtils.getTenantIdLogado()` — nunca de consulta ao banco, nunca do cliente HTTP |
| `BIGSERIAL` / `Long id` | **`UUID`** em toda tabela |
| JPQL com filtro opcional (`:p IS NULL OR ...`) | **native query com `CAST` explícito** e `countQuery` — [01 §3](01-multitenant.md) |
| Entity recebida ou devolvida pelo controller | **DTO `record`** com Bean Validation + **mapper estático** |
| `findById` / `findAll` em entidade de negócio | `findByIdAndTenantId` / `findAllWithFilters(..., tenantId, ...)` |
| `LocalDateTime` em auditoria | `Instant` |
| Grupo de acesso / tabela de role | role única no usuário — [02 §1](02-modulo-usuarios.md) |
| Migration existente | migration **nova**, numerada a partir da última daqui (`017-...`) |

---

## 6. Regras invioláveis

Estas valem para todo código do projeto, sem exceção e sem discussão:

1. **Isolamento por tenant.** Nenhum usuário vê, altera, cria ou exclui dado de
   outro tenant. Toda consulta filtra por `tenant_id`. Esta regra tem prioridade
   sobre qualquer outra.
2. **O tenant vem do JWT, nunca do cliente.** Idem `usuarioId` e `role`. Nada que
   determine autorização pode vir do body, da query ou de header customizado.
3. **DTO sempre.** Controller não recebe nem devolve Entity. Request e Response são
   `record` com Bean Validation. Conversão só via Mapper.
4. **Paginação sempre.** Nenhum endpoint devolve coleção ilimitada. `size` tem teto.
5. **Liquibase sempre.** Zero alteração manual de banco. Zero `ddl-auto` diferente
   de `none`. Zero changeSet editado depois de executado.
6. **BCrypt sempre.** Senha nunca em texto plano, nunca em MD5/SHA1, nunca em log.
7. **Nenhum dado pessoal em log.** Nome, CPF/CNPJ, e-mail, telefone, endereço e
   qualquer identificador de pessoa ficam fora de log, de mensagem de erro e de
   telemetria. São dados pessoais sob a LGPD; log referencia por id e tenant.
8. **A regra mora no backend.** Cálculo e regra de negócio são do servidor. O
   front envia entradas e exibe resultados — uma conta reimplementada em
   TypeScript é a segunda versão da regra, e a segunda versão envelhece calada.
9. **Stack trace nunca chega ao cliente.** `GlobalExceptionHandler` devolve mensagem
   controlada; o detalhe fica no log do servidor.
10. **Secret nenhum no repositório.** Tudo por variável de ambiente.
11. **Toda tela é responsiva.** Desktop, tablet e celular, sem rolagem horizontal
    em 360 px. É como a tela nasce, não ajuste no fim.

---

## 7. Definição de pronto

Um módulo do backend só está pronto quando tem:

- [ ] Migration Liquibase com FK, índice de `tenant_id` e uniques compostas nomeadas
- [ ] Entity estendendo `TenantEntity` (ou `BaseEntity` se for global)
- [ ] DTOs `record`: `CreateDto`, `UpdateDto`, `ResponseDto`, `SelectDto` — com Bean Validation
- [ ] Mapper (classe com métodos estáticos)
- [ ] Repository com `findByIdAndTenantId`, `findAllWithFilters(...)`, `findForSelect(...)` — nenhum `findById`/`findAll` exposto
- [ ] Service com `@Transactional`, obtendo o tenant por `securityUtils.getTenantIdLogado()`
- [ ] Controller com `@PreAuthorize`, paginação nas listagens
- [ ] Teste de isolamento: usuário do tenant A não alcança recurso do tenant B
- [ ] Teste de cálculo (se o módulo calcula) com valores conferidos à mão

Uma tela do frontend só está pronta quando tem:

- [ ] Padrão Form/List (entidade principal) ou FormList (auxiliar)
- [ ] Componentes da biblioteca interna `T*` — nenhum input/select/grid novo
- [ ] react-hook-form + schema zod
- [ ] Chamadas via `services/api.ts`, nunca `fetch`
- [ ] Erros tratados com `toast`, nunca `alert`
- [ ] Tipagem completa, zero `any`
- [ ] Funciona em desktop, tablet e mobile (360 px)
- [ ] Respeita os tokens de cor e tipografia da marca
- [ ] Foi aberta no navegador — inclusive vazia, para ver se ela fala

---

## 8. Documentação de referência

| Doc | Quando ler |
|---|---|
| [01-multitenant.md](01-multitenant.md) | Antes de qualquer entidade, repository ou service |
| [02-modulo-usuarios.md](02-modulo-usuarios.md) | Sempre que mexer em acesso, permissão ou licença |
| [03-arquitetura-backend.md](03-arquitetura-backend.md) | Todo código Java |
| [04-arquitetura-frontend.md](04-arquitetura-frontend.md) | Todo código React |
| [05-identidade-visual.md](05-identidade-visual.md) | Qualquer decisão de cor, fonte ou espaçamento |
| [06-seguranca-owasp.md](06-seguranca-owasp.md) | Antes de abrir endpoint, tratar input ou logar evento |
| [07-banco-liquibase.md](07-banco-liquibase.md) | Toda migration |
| [08-modulo-pessoas.md](08-modulo-pessoas.md) | Cadastro de pessoas, contatos, endereços e vínculos |

---

## 9. Glossário

Use este vocabulário no código, nos DTOs e na interface — o domínio já tem nome,
não invente outro.

| Termo | Significado |
|---|---|
| **Tenant** | o cliente que contrata o sistema: uma empresa, com os seus usuários e os seus dados. Na interface aparece como **Cliente** |
| **Tenant raiz** | o tenant do superadmin, semeado pelo `DataSeeder`. Nunca expira |
| **Tenant efetivo** | o tenant em que a requisição opera — o do claim do JWT, que muda quando o superadmin troca de tenant |
| **Período de acesso** | a licença do tenant: indeterminado ou com data de expiração |
| **Pessoa** | qualquer pessoa física ou jurídica cadastrada pelo tenant; o papel dela vem do tipo de cadastro |
| **Tipo de cadastro** | o papel da pessoa para o tenant: Cliente, Fornecedor, Funcionário, Outros. Uma pessoa pode ter vários |
| **Vínculo** | relação entre duas pessoas do mesmo tenant |
| **Catálogo de referência** | tabela sem tenant, igual para todos, só leitura pela API (`tipo_*`, estado, cidade) |
| **Catálogo híbrido** | tabela com `tenant_id` anulável: nulo é do sistema, preenchido é do tenant — [01 §6](01-multitenant.md) |
| **Fatia** | unidade de entrega: um módulo do banco à tela |

### Convenção de nomenclatura no código

Nomes por extenso em identificadores Java e TypeScript; a sigla, se houver, fica
no rótulo da interface:

```java
private String inscricaoEstadual;     // rótulo na tela: "IE"
private BigDecimal valorUnitario;     // rótulo na tela: "Vl. unit."
```

Exceção: siglas universalmente conhecidas e sem ambiguidade — `cpf`, `cnpj`,
`cep` — podem ser usadas como estão.

Todo valor monetário, quantidade fracionária e resultado de cálculo é
`BigDecimal`, nunca `double` ou `float`.
