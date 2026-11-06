# 05 — Banco e Liquibase

## Arquivos

```
ero-api/src/main/resources/db/changelog/
  changelog-master.xml          # lista de includes, na ordem
  changes/NNN-verbo-assunto.xml # ex.: 007-create-pessoa.xml, 008-add-pessoa-apelido.xml
```

- Próximo número livre, com três dígitos. Arquivo novo entra no **fim** do `changelog-master.xml`.
- `changeSet id` = nome do arquivo (sem `.xml`). Se o arquivo tiver mais de um changeSet, acrescente um sufixo. `author="eduardo"`.
- **Migration aplicada nunca é editada.** Corrigir = migration nova.
- O Hibernate só **valida** o schema (`ddl-auto: validate`). Coluna esquecida faz a aplicação não subir.

## Tipos

| Java | PostgreSQL (Liquibase) |
|---|---|
| `UUID` | `UUID` |
| `String` | `VARCHAR(n)`, com o mesmo `n` do `@Size` do DTO e do `length` da entidade |
| `boolean` | `BOOLEAN` com `defaultValueBoolean` |
| `int` / `long` | `INTEGER` / `BIGINT` |
| `BigDecimal` (dinheiro) | `NUMERIC(15,2)` |
| `Instant` | `TIMESTAMP WITH TIME ZONE` |
| `LocalDate` | `DATE` |
| enum | `VARCHAR(n)` + `CHECK (col IN (...))` quando a lista é fechada (ex.: papel, nível). Enum que cresce a cada módulo (grupo, ação, tipo de evento) fica sem CHECK, para não exigir migration a cada valor novo. |

## Colunas obrigatórias de toda tabela

```xml
<column name="id" type="UUID"><constraints primaryKey="true" primaryKeyName="pk_<tabela>"/></column>
<column name="tenant_id" type="UUID">   <!-- tabelas de negócio -->
    <constraints nullable="false" foreignKeyName="fk_<tabela>_tenant" references="tenant(id)"/>
</column>
...
<column name="created_at" type="TIMESTAMP WITH TIME ZONE"><constraints nullable="false"/></column>
<column name="updated_at" type="TIMESTAMP WITH TIME ZONE"/>
<column name="created_by" type="UUID"/>
<column name="updated_by" type="UUID"/>
<column name="version" type="BIGINT" defaultValueNumeric="0"><constraints nullable="false"/></column>
```

## Nomes

| Objeto | Padrão | Exemplo |
|---|---|---|
| tabela, coluna | `snake_case`, singular | `usuario_liberacao.usuario_id` |
| PK | `pk_<tabela>` | `pk_usuario` |
| FK | `fk_<tabela>_<referência>` | `fk_usuario_tenant` |
| índice | `ix_<tabela>_<colunas>` | `ix_usuario_tenant_nome` |
| único | `uk_<tabela>_<colunas>` | `uk_usuario_email` |
| check | `ck_<tabela>_<regra>` | `ck_usuario_papel` |

## Índices

- Índice de listagem começa por `tenant_id` (ex.: `tenant_id, nome`).
- Unicidade por contratante inclui o `tenant_id`: `uk_pessoa_tenant_documento (tenant_id, documento)`.
  Unicidade global só quando é regra do sistema todo, como o e-mail de login.
- FK usada em filtro ou join ganha índice próprio.

## Ambientes

| Ambiente | Banco |
|---|---|
| dev | `compose.yaml` → Postgres 18 em `localhost:5433`, banco `ero_api` (sobe sozinho com o perfil dev) |
| testes | Testcontainers, um Postgres 18 descartável por execução |
| prod | `DB_URL`, `DB_USUARIO`, `DB_SENHA` |
