# EroErp

ERP multi-tenant (SaaS) com módulos administrativos, comerciais e clínicos.

```text
EroErp/
├── ero/          # Frontend — React 19 + TypeScript + Vite + Tailwind v4
└── ero-erp-api/  # Backend — Java 21 + Spring Boot 3.5 + PostgreSQL
```

## Módulos

- **Cadastros**: Pessoas, Emitentes, Produtos (grupos, subgrupos, categorias, marcas, NCM/CEST) e Estoque (ajustes, transferências, movimentações)
- **Pedidos (Venda PDV)**: pedidos de venda/compra, tipos de pedido, créditos de clientes
- **Financeiro**: contas a pagar/receber, lançamentos, transferências entre contas, formas de pagamento, tipos de cobrança
- **Clínica**: consultas, pacotes de sessões, fichas/templates de anamnese, planos alimentares, refeições
- **Agenda**: calendário de compromissos com mensagens automáticas via WhatsApp
- **CRM**: atendimentos via WhatsApp (Evolution API), kanban, andamentos, dashboard
- **Documentos**: emissão, modelos e assinatura eletrônica (link público)
- **Saúde/Fitness**: Gym (planos de treino, exercícios), Avaliação Física, Pediatria, Terapia Nutricional (UTI), Otorrinolaringologia
- **Dashboards**: painéis por módulo + dashboard geral com pendências
- **Administração**: clientes (tenants), usuários, roles, grupos de acesso, logs de login, integração WhatsApp

## Tecnologias

**Backend**: Java 21, Spring Boot 3.5, Spring Security + JWT, Spring Data JPA (Hibernate 6), PostgreSQL, Liquibase, Swagger/OpenAPI, Lombok.

**Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, React Router v6, Axios, biblioteca própria de componentes (`T*`), Recharts.

---

## Backend (`ero-erp-api/`)

### Pré-requisitos

- **JDK 21** (obrigatório — o build falha com JDK 17; se o default do sistema for outro, exporte `JAVA_HOME`)
- PostgreSQL rodando localmente
- Maven não precisa ser instalado (o projeto usa `./mvnw`)

### Banco de dados

Crie um banco vazio no PostgreSQL (ex.: `erodb`). As tabelas são criadas/atualizadas automaticamente pelo **Liquibase** na subida da aplicação (migrations em `src/main/resources/db/changelog/`).

### Variáveis de ambiente

| Variável | Obrigatória | Descrição | Exemplo |
| --- | --- | --- | --- |
| `DB_URL` | Sim | URL JDBC do PostgreSQL | `jdbc:postgresql://localhost:5432/erodb` |
| `DB_USER` | Sim | Usuário do banco | `postgres` |
| `DB_PASSWORD` | Sim | Senha do banco | `admin` |
| `JWT_SECRET` | Sim | Chave HMAC do JWT (mínimo 32 caracteres) | `minhaChaveSecretaSuperSegura1234567890` |
| `SUPERADMIN_EMAIL` | Sim | E-mail do usuário SUPERADMIN criado na primeira subida | `admin@empresa.com` |
| `SUPERADMIN_PASSWORD` | Sim | Senha do SUPERADMIN | `senhaForte123` |
| `SUPERADMIN_NAME` | Sim | Nome do SUPERADMIN | `Administrador` |
| `APP_PUBLIC_URL` | Não | URL pública da API — usada para montar o webhook do WhatsApp (Evolution API) no CRM. Default: `http://localhost:8080` no perfil dev | `https://api.seudominio.com` |

Na primeira subida, um `DataSeeder` cria as roles `SUPERADMIN`/`ADMIN` e o usuário superadmin a partir das variáveis acima (se ainda não existirem).

### Perfis

O perfil ativo default é **`prod`** (`application.yml`). Para desenvolvimento local use o perfil **`dev`** (logs de SQL, actuator completo, upload até 20MB):

```bash
cd ero-erp-api
JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64 \
SPRING_PROFILES_ACTIVE=dev \
DB_URL=jdbc:postgresql://localhost:5432/erodb \
DB_USER=postgres DB_PASSWORD=admin \
JWT_SECRET=minhaChaveSecretaSuperSegura1234567890 \
SUPERADMIN_EMAIL=admin@empresa.com SUPERADMIN_PASSWORD=senhaForte123 SUPERADMIN_NAME=Administrador \
./mvnw spring-boot:run
```

- API: <http://localhost:8080>
- Swagger: <http://localhost:8080/swagger-ui.html>

### CORS

As origens permitidas são fixas em `src/main/java/com/api/ero_erp/config/CorsConfig.java` (localhost:5173/4173 + domínios de produção). Ao publicar em um novo domínio, adicione a origem lá.

---

## Frontend (`ero/`)

### Pré-requisitos do frontend

- Node.js LTS + npm

### Variáveis de ambiente do frontend

Arquivos `.env` (dev) e `.env.production` (build de produção) na raiz de `ero/`:

| Variável | Descrição | Exemplo |
| --- | --- | --- |
| `VITE_API_URL` | URL base da API backend | `http://localhost:8080` |

### Execução

```bash
cd ero
npm install
npm run dev      # desenvolvimento — http://localhost:5173
npm run build    # build de produção (gera dist/)
```

---

## Autenticação e controle de acesso

- **JWT multi-tenant**: o token carrega o id do usuário, as roles e a sessão; toda query filtra pelo `clienteId` (tenant) do usuário logado.
- **Roles**: permissões granulares por módulo, no padrão `MODULO` (escrita) e `MODULO_GET` (leitura) — ex.: `PEDIDO`, `PEDIDO_GET`, `FINANCEIRO`, `ESTOQUE_AJUSTE`. Protegem endpoints (`@PreAuthorize`), rotas e menu do frontend.
- **Grupos de Acesso**: conjuntos de roles gerenciados em *Administração → Grupos de Acesso*. Ao vincular grupos a um usuário, ele herda as roles dos grupos (união com roles avulsas), resolvidas no login. A migration `112` já semeia **15 grupos completos por módulo** (Pessoas, Emitentes, Produtos, Estoque, Pedidos, Financeiro, Clínica, Agenda, Documentos, CRM, Gym, Avaliação Física, Pediatria, Terapia Nutricional, Otorrino), cada um incluindo as roles de apoio que as telas do módulo consomem.
- Mudanças de roles/grupos passam a valer no **próximo login** do usuário (as permissões vivem no JWT).

## Migrations

- Liquibase XML em `ero-erp-api/src/main/resources/db/changelog/`, nomeadas `{NNN}-{descricao}.xml` e registradas no `changelog-master.xml`.
- Aplicadas automaticamente na subida da API — não é necessário rodar nada manualmente.
