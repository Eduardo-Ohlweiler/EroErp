# Banco de Dados — PostgreSQL 16 + Liquibase XML

> Leia antes de criar entidade, tabela, índice, constraint, foreign key ou
> migration.


## 1. Regras de base

- **PostgreSQL 16.** Sem abstração para outro banco.
- **Liquibase XML.** Nada de Flyway, nada de SQL solto, nada de YAML/JSON.
- **`ddl-auto: none`.** O schema é do Liquibase, não do Hibernate.
- **Nunca alterar banco manualmente.** Nem em desenvolvimento — o que não está no
  changelog não existe.
- **Nunca editar changeSet já executado.** O checksum falha e a migration quebra
  em quem já rodou. Correção é changeSet novo.

Bancos: `ero_erp` em desenvolvimento e `ero_erp_test` para a suíte.

---

## 2. Estrutura de changelogs

```
src/main/resources/db/changelog/
├── changelog-master.xml
└── changes/
    ├── 001-enable-extensions.xml               base, acesso e auditoria
    ├── 002-create-tenant.xml
    ├── 003-create-usuario.xml
    ├── 004-create-login-log.xml
    ├── 005-create-refresh-token.xml
    ├── 006-usuario-email-unico-global.xml
    ├── 007-tenant-periodo-acesso.xml
    ├── 008-login-log-motivo-acesso-expirado.xml
    ├── 009-catalogos-pessoa.xml                 pessoas (doc 08)
    ├── 010-create-pessoa.xml
    ├── 011-estado-cidade-ibge.xml
    ├── 012-create-endereco.xml
    ├── 013-create-pessoa-vinculo.xml
    ├── 014-add-sexo-pessoa.xml
    ├── 015-tenant-paleta.xml                    paleta de cores do tenant (doc 05 §11)
    └── 016-usuario-versao-sessao.xml            corte de sessão na redefinição de senha (doc 02 §3.6)
```

O próximo número livre é o **017**. Os módulos do EroErp antigo entram a partir
dele, um arquivo por assunto.

> **Por que a numeração é contínua, se a base veio de outro projeto.** Esta base
> herdou o changelog de um sistema anterior, do qual ficaram só o acesso e as
> pessoas. Como nenhum banco do EroErp 2.0 tinha rodado aquelas migrations, as
> que sobraram foram **renumeradas** para fechar o buraco. Pelo mesmo motivo, as
> duas da antiga tabela `configuracao_sistema` (paleta global) foram
> **substituídas**, e não sucedidas por um `drop`: a paleta passou a ser coluna
> de `tenant` (015), e a 016 é a versão da sessão do usuário. Isso só foi
> possível porque não havia `databasechangelog` em produção para invalidar: daqui
> em diante vale a regra de sempre — changeSet executado não se edita, não se
> renumera nem se troca.

Nomenclatura: `NNN-verbo-alvo.xml`, sequencial, três dígitos, kebab-case.
Verbos: `create`, `add`, `alter`, `drop`, `insert`, `enable`.

```xml
<!-- changelog-master.xml -->
<databaseChangeLog xmlns="http://www.liquibase.org/xml/ns/dbchangelog"
                   xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                   xsi:schemaLocation="http://www.liquibase.org/xml/ns/dbchangelog
                       http://www.liquibase.org/xml/ns/dbchangelog/dbchangelog-4.29.xsd">

    <include file="db/changelog/changes/001-enable-extensions.xml"/>
    <include file="db/changelog/changes/002-create-tenant.xml"/>
    <!-- ... -->
</databaseChangeLog>
```

> **O `schemaLocation` repete `/dbchangelog/`.** A URL certa é
> `…/xml/ns/dbchangelog/dbchangelog-4.29.xsd` — o segmento aparece duas vezes.
> Omitir o segundo derruba **a aplicação inteira** na subida, com *"Unable to
> resolve xml entity … secureParsing is set to 'true'"*, e a mensagem culpa a
> versão do XSD, que está certa e vem empacotada no `liquibase-core`. O sintoma é
> a suíte toda vermelha por **erro de contexto**, e não uma migration falhando —
> nada aponta para o arquivo novo. Copie este cabeçalho em vez de digitá-lo.

### ChangeSet

```xml
<changeSet id="017-create-produto" author="eduardo">
    ...
    <rollback>
        <dropTable tableName="produto"/>
    </rollback>
</changeSet>
```

- `id` único e igual ao nome do arquivo (`NNN-descricao`)
- `author` obrigatório
- `rollback` sempre que não for inferido automaticamente (`sql`, `insert`, `update`)
- Um assunto por changeSet. Vários changeSets por arquivo é aceitável quando são
  do mesmo assunto (tabela + índices + uniques).

---

## 3. Primeira migration — extensões

```xml
<changeSet id="001-enable-extensions" author="eduardo">
    <sql>CREATE EXTENSION IF NOT EXISTS "pgcrypto";</sql>
    <sql>CREATE EXTENSION IF NOT EXISTS "unaccent";</sql>
    <rollback>
        <sql>DROP EXTENSION IF EXISTS "unaccent";</sql>
        <sql>DROP EXTENSION IF EXISTS "pgcrypto";</sql>
    </rollback>
</changeSet>
```

`pgcrypto` fornece `gen_random_uuid()`; `unaccent` viabiliza busca sem acento —
essencial num sistema em português.

---

## 4. Anatomia de uma tabela de negócio

O exemplo é uma tabela **hipotética** de produto — o gabarito vale para qualquer
módulo que vier. Para uma tabela real do sistema, ver `010-create-pessoa.xml`.

```xml
<changeSet id="017-create-produto" author="eduardo">

    <createTable tableName="produto">

        <!-- PK -->
        <column name="id" type="UUID" defaultValueComputed="gen_random_uuid()">
            <constraints primaryKey="true" primaryKeyName="pk_produto"/>
        </column>

        <!-- TENANT — obrigatório em toda tabela de negócio -->
        <column name="tenant_id" type="UUID">
            <constraints nullable="false"
                         foreignKeyName="fk_produto_tenant"
                         references="tenant(id)"/>
        </column>

        <!-- Negócio -->
        <column name="nome" type="VARCHAR(255)">
            <constraints nullable="false"/>
        </column>
        <column name="codigo" type="VARCHAR(60)">
            <constraints nullable="false"/>
        </column>
        <column name="unidade" type="VARCHAR(20)">
            <constraints nullable="false"/>
        </column>
        <column name="preco_venda" type="NUMERIC(15,2)"/>
        <column name="ativo" type="BOOLEAN" defaultValueBoolean="true">
            <constraints nullable="false"/>
        </column>

        <!-- Auditoria -->
        <column name="created_by" type="UUID">
            <constraints foreignKeyName="fk_produto_created_by" references="usuario(id)"/>
        </column>
        <column name="updated_by" type="UUID">
            <constraints foreignKeyName="fk_produto_updated_by" references="usuario(id)"/>
        </column>
        <column name="created_at" type="TIMESTAMP WITH TIME ZONE">
            <constraints nullable="false"/>
        </column>
        <column name="updated_at" type="TIMESTAMP WITH TIME ZONE"/>
    </createTable>

    <!-- Índice do tenant — obrigatório -->
    <createIndex tableName="produto" indexName="idx_produto_tenant_id">
        <column name="tenant_id"/>
    </createIndex>

    <!-- Índice composto de busca — tenant SEMPRE primeiro -->
    <createIndex tableName="produto" indexName="idx_produto_tenant_nome">
        <column name="tenant_id"/>
        <column name="nome"/>
    </createIndex>

    <!-- Unique SEMPRE composta com o tenant -->
    <addUniqueConstraint tableName="produto"
                         columnNames="tenant_id, codigo"
                         constraintName="uk_produto_tenant_codigo"/>

    <!-- Enum validado também no banco -->
    <sql>
        ALTER TABLE produto ADD CONSTRAINT ck_produto_unidade
        CHECK (unidade IN ('UN','KG','LT','CX'));
    </sql>

    <rollback>
        <dropTable tableName="produto"/>
    </rollback>
</changeSet>
```

Esse é o gabarito. Toda tabela de negócio tem: PK UUID com default no banco,
`tenant_id` com FK, colunas de negócio, auditoria completa, índice de tenant,
índices compostos de busca, uniques compostas e checks de enum.

---

## 5. Chave primária

```xml
<column name="id" type="UUID" defaultValueComputed="gen_random_uuid()">
    <constraints primaryKey="true" primaryKeyName="pk_produto"/>
</column>
```

O `defaultValueComputed` vai **desde a primeira migration**, mesmo com o Hibernate
usando `GenerationType.UUID`. Assim o banco funciona sozinho em seed, script de
manutenção e carga direta.

---

## 6. Multi-tenant no banco

| Regra | Como |
|---|---|
| Coluna | `tenant_id UUID NOT NULL` em toda tabela de negócio |
| FK | `fk_<tabela>_tenant` referenciando `tenant(id)` |
| Índice | `idx_<tabela>_tenant_id` — **obrigatório**, é o filtro de toda query |
| Unique | sempre composta: `uk_<tabela>_tenant_<campo>` (exceto credencial de login — ver abaixo) |
| Índice de busca | `tenant_id` como **primeira** coluna |

Tabelas **sem** `tenant_id` — dado de sistema ou de referência, igual para
todos os clientes: `tenant`, os catálogos de pessoa (`tipo_cadastro`,
`tipo_telefone`, `tipo_email`, `tipo_rede_social`), `estado` e `cidade` (IBGE),
`databasechangelog` e `databasechangeloglock`. Não há tabela de role: o nível de
acesso é coluna de `usuario`. Nem de configuração: a paleta de cores é coluna de
`tenant` (`tenant.paleta`), porque cada cliente tem a sua.

Tabela com `tenant_id` **nullable** (catálogo híbrido — `NULL` = do sistema, com
valor = do cliente): hoje nenhuma. É o caminho quando um catálogo precisar de
itens semeados para todos **e** itens próprios de cada cliente (unidade de
medida, forma de pagamento) — e entra em migration nova, nunca editando a de
origem. Nesse caso o PostgreSQL trata `NULL` como distinto em unique, então o
item do sistema e o de cada tenant convivem com o mesmo nome.

### Por que a unique é sempre composta

Dois tenants precisam poder ter o mesmo CPF de cliente, o mesmo código de
produto, o mesmo número de pedido. Unique global em campo de negócio faz um
cliente atrapalhar o outro.

### A exceção: credencial de login

`usuario.email` é **único globalmente** (`uk_usuario_email`). Não é campo de
negócio, é a credencial de autenticação: o login acontece antes de o tenant ser
conhecido e busca só por e-mail. Com o mesmo e-mail em dois tenants,
`findByEmailIgnoreCase` encontraria duas linhas e o login quebraria.

A regra vale para campo de identidade/credencial, não abre precedente para campo
de negócio. Ver a migration `006-usuario-email-unico-global.xml`, que documenta o
raciocínio no próprio changeSet.

---

## 7. Tipos de coluna

| Grandeza | Tipo | Exemplo |
|---|---|---|
| Chave e FK | `UUID` | `id`, `tenant_id`, `pessoa_id` |
| Texto curto | `VARCHAR(n)` — **sempre com tamanho** | `VARCHAR(255)` |
| Texto longo | `TEXT` | observação |
| Valor monetário | `NUMERIC(15,2)` | `preco_venda`, `valor_total` |
| Quantidade, peso, medida | `NUMERIC(15,4)` | `quantidade`, `peso_bruto` |
| Percentual, alíquota | `NUMERIC(7,4)` | `aliquota_icms`, `percentual_desconto` |
| Contagem | `INTEGER` | `numero_parcelas` |
| Booleano | `BOOLEAN` com `defaultValueBoolean` | `ativo` |
| Enum | `VARCHAR(n)` + `CHECK` | `sexo`, `tipo_logout` |
| Data | `DATE` | `data_nascimento` |
| Data e hora | `TIMESTAMP WITH TIME ZONE` | `created_at`, `data_login` |
| IP | `VARCHAR(45)` | `endereco_ip` (cabe IPv6) |
| JSON | `JSONB` | só quando o dado é realmente sem esquema |

**Nunca** `DOUBLE PRECISION`, `REAL` ou `FLOAT` em dinheiro, quantidade ou
alíquota. Erro de ponto flutuante aqui é o centavo que não fecha entre o pedido,
a nota e o imposto — e ninguém acha a diferença depois. Sempre `NUMERIC`, e
`BigDecimal` no Java.

**Sempre `TIMESTAMP WITH TIME ZONE`**, nunca `TIMESTAMP` puro. O `Instant` do Java
mapeia para `timestamptz` e o fuso fica explícito.

**Enum como `VARCHAR` + `CHECK`**, nunca tipo `ENUM` do PostgreSQL (alterar exige
DDL desconfortável) e nunca `SMALLINT` ordinal (renomear um valor no Java
silenciosamente corrompe os dados).

---

## 8. Nomenclatura

`snake_case` em tudo. Tabela no **singular**.

```
pessoa · pessoa_vinculo · endereco · login_log · refresh_token
```

Não: `pessoas`, `Pessoa`, `tbPessoa`.

Tabela de junção N:N: `<a>_<b>`, em ordem alfabética ou pela relação natural.

```
produto_fornecedor · usuario_filial
```

O acesso **não** tem tabela de junção: o nível é um enum em `usuario.role`, com
`CHECK` — a decisão de simplificar está no doc 02.

### Convenções de nome de objeto

| Objeto | Padrão | Exemplo |
|---|---|---|
| Primary key | `pk_<tabela>` | `pk_pessoa` |
| Foreign key | `fk_<tabela>_<campo sem _id>` | `fk_pessoa_tenant` |
| Índice | `idx_<tabela>_<campos>` | `idx_pessoa_tenant_nome` |
| Unique | `uk_<tabela>_<campos>` | `uk_produto_tenant_codigo` |
| Check | `ck_<tabela>_<campo>` | `ck_pessoa_sexo` |

**Toda** constraint e **todo** índice têm nome explícito. Nome gerado pelo banco
é impossível de referenciar numa migration futura.

---

## 9. Índices

Criar índice para:

1. `tenant_id` — sempre, em toda tabela de negócio
2. Toda FK — o PostgreSQL **não** indexa FK automaticamente, e sem índice o
   `DELETE` no pai faz varredura sequencial no filho
3. Campo usado em filtro de listagem — composto, com `tenant_id` primeiro
4. Campo de ordenação padrão da listagem

```xml
<createIndex tableName="pedido" indexName="idx_pedido_tenant_data">
    <column name="tenant_id"/>
    <column name="data_pedido" descending="true"/>
</createIndex>
```

Busca textual sem acento, quando a listagem exigir:

```xml
<sql>
    CREATE INDEX idx_pessoa_nome_unaccent
    ON pessoa USING gin (unaccent(lower(nome)) gin_trgm_ops);
</sql>
```

(exige a extensão `pg_trgm`; adicionar só quando o volume justificar)

Não indexar por reflexo. Índice custa escrita e espaço — criar quando há consulta
que o use.

---

## 10. Foreign keys e exclusão

```xml
<column name="tenant_id" type="UUID">
    <constraints nullable="false"
                 foreignKeyName="fk_pedido_tenant"
                 references="tenant(id)"/>
</column>
```

Para agregados com filhos que não fazem sentido sozinhos:

```xml
<addForeignKeyConstraint
        baseTableName="pedido_item"  baseColumnNames="pedido_id"
        referencedTableName="pedido" referencedColumnNames="id"
        constraintName="fk_pedido_item_pedido"
        onDelete="CASCADE"/>
```

`ON DELETE CASCADE` só dentro do agregado (pessoa → contatos e endereços, como
na `010-create-pessoa.xml` e na `012-create-endereco.xml`; pedido → itens).
**Nunca** em FK para `tenant` ou `usuario` — apagar um tenant não deve varrer a
base em silêncio; isso é operação deliberada, com backup e confirmação.

### Exclusão física × lógica

Padrão é **exclusão física**. Soft delete só onde houver regra de negócio ou
exigência de auditoria — e aí a coluna é `ativo BOOLEAN`, não `deleted_at`.

Cadastros com histórico (pessoa, produto) e documentos (pedido, nota) são
**desativados** ou cancelados, nunca apagados: outros registros apontam para
eles, e o histórico comercial e fiscal precisa continuar legível. Exclusão real de
dado pessoal só via pedido de titular sob LGPD, em rotina própria e registrada em
`audit_log`.

---

## 11. Seeds

Não há catálogo de roles em tabela — o nível de acesso é um enum na coluna
`usuario.role`, validado por `CHECK`. Um seed de dado de sistema, quando houver,
entra por migration com `rollback` declarado:

```xml
<changeSet id="017-insert-tipo-cadastro-transportadora" author="eduardo">
    <insert tableName="tipo_cadastro">
        <column name="id" valueComputed="gen_random_uuid()"/>
        <column name="nome" value="Transportadora"/>
        <column name="ativo" valueBoolean="true"/>
        <column name="created_at" valueComputed="now()"/>
    </insert>
    <rollback>
        <delete tableName="tipo_cadastro">
            <where>nome = 'Transportadora'</where>
        </delete>
    </rollback>
</changeSet>
```

É assim que um módulo acrescenta os seus valores a um catálogo que já existe: a
`009-catalogos-pessoa.xml` semeia só os tipos genéricos (Cliente, Fornecedor,
Funcionário, Outros), e quem precisar de outro traz a própria migration — nunca
editando a 009.

Catálogos de referência volumosos entram de uma vez, por `INSERT … SELECT` ou
por `<loadData>` a partir de CSV versionado em `src/main/resources/db/data/`. As
5.571 cidades do IBGE (`011-estado-cidade-ibge.xml`) são o caso que já existe.
Tabela oficial (IBGE, NCM, CFOP) **nunca** é digitada à mão no XML: vem de
arquivo da fonte, conferido antes de virar seed, e a procedência vai escrita no
comentário da migration.

Tenant raiz e superadmin **não** entram por migration — vêm do `DataSeeder`, com
credenciais por variável de ambiente (ver [02-modulo-usuarios.md §9](02-modulo-usuarios.md)).
Credencial em migration é credencial no repositório.

---

## 12. Alterações em tabela existente

Nunca editar o changeSet original. Criar um novo:

```xml
<changeSet id="018-add-regime-tributario-pessoa" author="eduardo">
    <addColumn tableName="pessoa">
        <column name="regime_tributario" type="VARCHAR(20)"/>
    </addColumn>
    <sql>
        ALTER TABLE pessoa ADD CONSTRAINT ck_pessoa_regime_tributario
        CHECK (regime_tributario IS NULL
               OR regime_tributario IN ('SIMPLES','PRESUMIDO','REAL'));
    </sql>
    <rollback>
        <sql>ALTER TABLE pessoa DROP CONSTRAINT ck_pessoa_regime_tributario;</sql>
        <dropColumn tableName="pessoa" columnName="regime_tributario"/>
    </rollback>
</changeSet>
```

A `014-add-sexo-pessoa.xml` é um caso real do mesmo formato.

Coluna `NOT NULL` em tabela com dados: três changeSets — adicionar nullable,
preencher, depois aplicar a restrição. Em um passo só, a migration falha em
produção e passa em desenvolvimento.

---

## 13. Banco e aplicação em sincronia

Ao criar ou alterar Entity, Repository, DTO ou Mapper, conferir que o Liquibase
tem estrutura correspondente:

- Campo `nullable = false` na entidade → `nullable="false"` na coluna
- `@Column(length = 255)` → `VARCHAR(255)`
- `BigDecimal precision/scale` → `NUMERIC(p,s)` com os mesmos valores
- Enum Java → `CHECK` com exatamente os mesmos valores
- Unique de negócio → `addUniqueConstraint` composta com `tenant_id`

Os testes de integração pegam a divergência: rodam contra o PostgreSQL local
`ero_erp_test`, com o Liquibase recriando o schema e as queries sendo executadas
de verdade. H2 não serviria — não tem `unaccent`, trata `NULL` em unique de outro
jeito e aceita SQL que o Postgres rejeita.

---

## 14. O que nunca fazer

- Editar changeSet já executado
- Alterar banco fora do Liquibase
- `ddl-auto` diferente de `none`
- Tabela de negócio sem `tenant_id`
- Tabela sem auditoria (`created_at`, `updated_at`, `created_by`, `updated_by`)
- FK, índice, unique ou check sem nome explícito
- Unique de campo de negócio sem `tenant_id`
- Tabela multi-tenant sem índice em `tenant_id`
- FK sem índice
- `VARCHAR` sem tamanho
- `DOUBLE`/`REAL`/`FLOAT` em dinheiro, quantidade ou alíquota
- `TIMESTAMP` sem time zone
- Tipo `ENUM` nativo ou enum como ordinal
- `camelCase` ou plural em nome de tabela ou coluna
- `ON DELETE CASCADE` em FK para `tenant` ou `usuario`
- Credencial em migration
- Migration em SQL solto quando o Liquibase XML resolve

---

## 15. Checklist de migration

- [ ] Liquibase XML em `changes/NNN-descricao.xml`, incluído no master
- [ ] `id` único igual ao nome do arquivo, `author` preenchido
- [ ] `rollback` declarado quando não inferido
- [ ] PK `UUID` com `gen_random_uuid()`
- [ ] `tenant_id UUID NOT NULL` + FK (ou nullable, se catálogo híbrido)
- [ ] Auditoria completa
- [ ] `idx_<tabela>_tenant_id` criado
- [ ] Índice em toda FK
- [ ] Índices de busca com `tenant_id` primeiro
- [ ] Uniques compostas com `tenant_id`
- [ ] `CHECK` para cada enum
- [ ] `snake_case`, tabela no singular
- [ ] Todo objeto com nome explícito
- [ ] `NUMERIC` para tudo que é dinheiro, quantidade ou alíquota
- [ ] `TIMESTAMP WITH TIME ZONE` em data-hora
- [ ] Entidade JPA em sincronia com a estrutura
- [ ] Seed de catálogo, se houver, em migration própria e com `rollback`
