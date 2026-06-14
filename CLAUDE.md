# EroErp — Guia para Agentes

## Stack

- **Backend**: Java 21 + Spring Boot 3.5, JPA/Hibernate 6, Liquibase
- **Banco de dados**: **PostgreSQL** (importante para queries JPQL/HQL)
- **Frontend**: React 19 + TypeScript + Tailwind v4
- **Autenticação**: JWT multi-tenant (clienteId no token)

## Regras críticas de JPQL/HQL (PostgreSQL)

Sempre usar `CAST(:param AS string)` em parâmetros String dentro de funções SQL:

```java
// CORRETO
LOWER(p.nome) LIKE LOWER(CONCAT('%', CAST(:nome AS string), '%'))
UPPER(p.classificacao) = UPPER(CAST(:classificacao AS string))

// ERRADO — gera "função upper(bytea) não existe" no PostgreSQL
UPPER(p.classificacao) = UPPER(:classificacao)
```

O Hibernate 6 passa parâmetros opcionais (nullable) como `bytea` no PostgreSQL quando não há cast explícito.

## Estrutura do projeto

```
EroErp/
├── ero/                  # Frontend React
│   └── src/
│       ├── pages/
│       ├── components/
│       └── services/api.ts
└── ero-erp-api/          # Backend Spring Boot
    └── src/main/java/com/api/ero_erp/
        └── {modulo}/
            ├── controller/
            ├── service/
            ├── repository/
            ├── entity/
            ├── dtos/
            └── mapper/
```

## Migrations

- Usar Liquibase XML em `src/main/resources/db/changelog/`
- Nomear como `{NNN}-{descricao}.xml` (ex: `040-create-tabela.xml`)
- Referenciar no `changelog-master.xml`

## Multi-tenancy

Toda query deve filtrar por `clienteId` obtido via `securityUtils.getClienteIdLogado()`.
