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
- **CHECK que muda** (ex.: coluna nova no `ck_pessoa_campos_do_tipo`, tipo novo no `ck_pessoa_vinculo_tipo`): `DROP CONSTRAINT` + `ADD CONSTRAINT` com o mesmo nome, na mesma changeSet de uma migration nova (ver 020 e 021). Coluna nova nasce nula, então as linhas antigas passam no CHECK recriado.
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

### Código do registro em cadastro de negócio

Cadastro de negócio usado pelo contratante (pessoa, emitente, pedido...) ganha o
seu código sequencial por contratante, chamado `cod_<tabela>` (regra e uso no
`01-arquitetura-backend.md`, seção "Código do registro"). Tabelas da plataforma e
do Administrativo (`tenant`, `usuario`...) não têm.

```xml
<column name="cod_pessoa" type="BIGINT"><constraints nullable="false"/></column>
...
<createIndex tableName="pessoa" indexName="uk_pessoa_tenant_cod_pessoa" unique="true">
    <column name="tenant_id"/>
    <column name="cod_pessoa"/>
</createIndex>
<sql>ALTER TABLE pessoa ADD CONSTRAINT ck_pessoa_cod_pessoa CHECK (cod_pessoa &gt; 0)</sql>
```

O índice único é o que garante que o número não se repete quando dois salvam
juntos; ele também serve à consulta do maior + 1 e ao filtro por código. Não há
tabela de contadores nem sequence.

Se uma tabela que **já tem dados** ganhar o código, a migration cria a coluna
nula, preenche na ordem de criação e só então põe o `NOT NULL`, o único e o check:

```sql
UPDATE pessoa p SET cod_pessoa = n.num
  FROM (SELECT id, row_number() OVER (PARTITION BY tenant_id ORDER BY created_at, id) AS num
          FROM pessoa) n
 WHERE p.id = n.id;
```

## Nomes

| Objeto | Padrão | Exemplo |
|---|---|---|
| tabela, coluna | `snake_case`, singular | `usuario_liberacao.usuario_id` |
| código do registro | `cod_<tabela>` | `pessoa.cod_pessoa` |
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

## Itens do sistema semeados por contratante

Cadastro auxiliar com itens pré-cadastrados (ex.: `tipo_telefone` com Celular, WhatsApp...) grava esses itens **em cada contratante**, marcados pela coluna `chave` (nome da constante do enum `<Tipo>DoSistema`; nula = item do contratante). Padrão da migration 014 (repetido na 019):

- índices únicos `uk_<t>_tenant_cod_<t>`, `uk_<t>_tenant_nome_busca` (nome único sem caixa nem acento, contando os do sistema), `uk_<t>_tenant_chave` (nulos não colidem) e `uk_<t>_id_tenant (id, tenant_id)`, alvo das FKs compostas;
- `ck_<t>_sistema_ativo CHECK (chave IS NULL OR ativo)`: item do sistema nunca fica inativo;
- semente para os contratantes que já existem com `INSERT ... SELECT ... FROM tenant t CROSS JOIN (VALUES ...)`, excluindo a Plataforma (`00000000-0000-0000-0000-000000000000`); os valores são iguais aos do enum (o `ItensDoSistemaMigrationTest` confere).

**Item novo do sistema** = constante no **fim** do enum + migration nova que semeia os contratantes existentes. Se o contratante já tiver um item com o mesmo `nome_busca`, a migration **adota** o dele (`UPDATE ... SET chave = ...`) em vez de inserir (o índice de nome recusaria a linha nova).

## FK composta para filha de contratante

Tabela filha que aponta para um cadastro do contratante usa FK composta `(x_id, tenant_id) → x(id, tenant_id)`, com o índice único `uk_x_id_tenant (id, tenant_id)` na tabela referenciada. Assim o banco garante que o registro nunca aponta para o de outro contratante, além do filtro automático do service.

## Ambientes

| Ambiente | Banco |
|---|---|
| dev | `compose.yaml` → Postgres 18 em `localhost:5433`, banco `ero_api` (sobe sozinho com o perfil dev) |
| testes | Testcontainers, um Postgres 18 descartável por execução |
| prod | `DB_URL`, `DB_USUARIO`, `DB_SENHA` |
