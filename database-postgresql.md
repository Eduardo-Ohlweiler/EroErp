# Skill: Banco de Dados — PostgreSQL + Liquibase (EroERP)

Use esta skill em toda alteração de banco de dados do EroERP.

Leia esta skill antes de criar:

* Entidades
* Tabelas
* Índices
* Constraints
* Foreign Keys
* Migrations
* Changelogs Liquibase

---

# Stack Oficial

* PostgreSQL
* Liquibase XML
* Spring Data JPA
* Hibernate

---

# Liquibase Obrigatório

Toda alteração estrutural deve ser realizada através do Liquibase.

Nunca alterar banco manualmente.

Nunca executar SQL diretamente em produção.

---

# Formato de Migration

Utilizar exclusivamente:

```text
Liquibase XML
```

Não utilizar:

```text
SQL Migration
Flyway
Liquibase YAML
Liquibase JSON
```

---

# Estrutura de Changelogs

```text
src/main/resources/db/changelog

├── db.changelog-master.xml
├── V001_create_cliente.xml
├── V002_create_usuario.xml
├── V003_create_produto.xml
└── ...
```

---

# Regras de ChangeSet

Todo changeSet deve possuir:

```xml
<changeSet id="001-create-cliente" author="eduardo">
```

Regras:

* id único
* author obrigatório
* descritivo
* nunca reutilizar IDs

---

# Nunca Alterar ChangeSets Executados

Proibido:

```xml
<changeSet id="026-create-produto">
```

já executado e posteriormente modificado.

Correto:

Criar novo arquivo:

```xml
V027_add_coluna_produto.xml
```

---

# Chave Primária

Toda tabela deve utilizar:

```xml
<column name="id" type="BIGSERIAL">
    <constraints primaryKey="true"/>
</column>
```

Padrão obrigatório.

---

# Multi-Tenant

O EroERP é multi-tenant.

Toda entidade de negócio deve possuir:

```xml
<column name="cliente_id" type="BIGINT">
    <constraints nullable="false"/>
</column>
```

com Foreign Key para:

```text
cliente(id)
```

---

# Cliente é Obrigatório

Exemplos:

* produto
* estoque
* estoque_movimentacao
* estoque_transferencia
* pessoa
* endereco
* telefone
* pedido
* orçamento
* financeiro

Devem possuir:

```text
cliente_id
```

---

# Auditoria Obrigatória

Toda entidade de negócio deve possuir:

```xml
<column name="created_by" type="BIGINT"/>

<column name="updated_by" type="BIGINT"/>

<column name="created_at" type="TIMESTAMP">
    <constraints nullable="false"/>
</column>

<column name="updated_at" type="TIMESTAMP"/>
```

---

# Foreign Keys de Auditoria

Padrão:

```xml
<constraints
    foreignKeyName="fk_produto_created_by"
    references="usuario(id)"/>
```

e

```xml
<constraints
    foreignKeyName="fk_produto_updated_by"
    references="usuario(id)"/>
```

---

# Nomenclatura

Utilizar exclusivamente:

```text
snake_case
```

Exemplos:

```text
cliente_id
produto_id
tipo_produto_id
created_at
updated_at
created_by
updated_by
```

Não utilizar:

```text
clienteId
produtoId
createdAt
updatedAt
```

---

# Nome de Tabelas

Utilizar:

```text
singular
```

Exemplos:

```text
cliente
usuario
produto
estoque
pessoa
telefone
endereco
```

Evitar:

```text
clientes
usuarios
produtos
```

---

# Foreign Keys

Toda Foreign Key deve possuir nome explícito.

Exemplo:

```xml
<constraints
    foreignKeyName="fk_produto_cliente"
    references="cliente(id)"/>
```

---

# Nunca Permitir

Proibido:

```xml
<constraints references="cliente(id)"/>
```

sem nome.

---

# Convenção de Foreign Keys

Padrão:

```text
fk_[tabela]_[campo]
```

Exemplos:

```text
fk_produto_cliente
fk_produto_tipo_produto
fk_usuario_cliente
fk_estoque_produto
```

---

# Índices

Toda tabela multi-tenant deve possuir índice para:

```text
cliente_id
```

Exemplo:

```xml
<createIndex
    tableName="produto"
    indexName="idx_produto_cliente_id">

    <column name="cliente_id"/>

</createIndex>
```

---

# Convenção de Índices

Padrão:

```text
idx_[tabela]_[campo]
```

Exemplos:

```text
idx_produto_cliente_id
idx_produto_nome
idx_estoque_produto_id
idx_usuario_cliente
```

---

# Índices Compostos

Quando houver busca por tenant e campo:

Preferir:

```xml
<createIndex
    tableName="produto"
    indexName="idx_produto_nome">

    <column name="cliente_id"/>
    <column name="nome"/>

</createIndex>
```

---

# Constraints Únicas

Toda Unique Constraint deve possuir nome explícito.

Exemplo:

```xml
<addUniqueConstraint
    tableName="usuario"
    columnNames="email"
    constraintName="uk_usuario_email"/>
```

---

# Convenção de Unique

Padrão:

```text
uk_[tabela]_[campo]
```

Exemplos:

```text
uk_usuario_email
uk_cliente_cnpj
```

---

# Convenção de Unique Composta

Padrão:

```text
uq_[tabela]_[campos]
```

Exemplos:

```text
uq_estoque_emitente_produto
uq_pessoa_documento_cliente
```

---

# Campos Monetários

Utilizar:

```xml
NUMERIC(15,2)
```

Exemplos:

```text
valor
preco_venda
preco_custo
custo_medio
desconto
acrescimo
```

---

# Quantidades

Utilizar:

```xml
NUMERIC(15,4)
```

Exemplos:

```text
quantidade
saldo
peso
volume
```

---

# Booleanos

Utilizar:

```xml
BOOLEAN
```

Exemplo:

```xml
<column
    name="bloqueado"
    type="BOOLEAN"
    defaultValueBoolean="false">

    <constraints nullable="false"/>

</column>
```

---

# Campos Obrigatórios

Sempre definir:

```xml
<constraints nullable="false"/>
```

quando aplicável.

Nunca depender apenas da validação da aplicação.

---

# Datas

Utilizar:

```xml
TIMESTAMP
```

Persistir sempre em UTC.

---

# Exclusão Física

Por padrão o EroERP utiliza:

```text
DELETE físico
```

salvo módulos que possuam regra específica de auditoria.

Não implementar soft delete sem necessidade de negócio.

---

# Relacionamentos

Preferir:

```text
BIGINT
```

para todas as FKs.

Padronizar com:

```text
BIGSERIAL
```

das PKs.

---

# Entidades Auxiliares

Exemplos:

```text
tipo_pessoa
tipo_telefone
tipo_endereco
tipo_produto
unidade_medida
```

Devem seguir exatamente os mesmos padrões:

* id BIGSERIAL
* auditoria
* nomenclatura
* constraints nomeadas

---

# Banco e Aplicação Devem Refletir o Mesmo Modelo

Sempre que criar:

* Entity
* Repository
* DTO
* Mapper

validar que o Liquibase possui estrutura correspondente.

---

# O Que Nunca Fazer

* Alterar changeSets já executados
* Criar tabela sem cliente_id em entidades multi-tenant
* Criar tabela sem auditoria
* Criar FK sem nome
* Criar índice sem nome
* Criar constraint sem nome
* Utilizar camelCase em banco
* Utilizar plural para tabelas
* Utilizar VARCHAR sem tamanho definido
* Utilizar DOUBLE para valores monetários
* Utilizar FLOAT para valores monetários
* Criar tabelas sem índice para cliente_id
* Criar migrations SQL ao invés de Liquibase XML
* Alterar banco manualmente em produção
* Ignorar padrão já existente do EroERP

---

# Checklist Obrigatório

Antes de finalizar qualquer migration:

* [ ] Utilizou Liquibase XML
* [ ] Criou changeSet com id único
* [ ] Definiu author
* [ ] Utilizou BIGSERIAL como PK
* [ ] Criou cliente_id quando necessário
* [ ] Criou Foreign Keys nomeadas
* [ ] Criou índices nomeados
* [ ] Criou constraints nomeadas
* [ ] Utilizou snake_case
* [ ] Criou auditoria (created_by, updated_by, created_at, updated_at)
* [ ] Criou índice para cliente_id
* [ ] Utilizou NUMERIC(15,2) para valores monetários
* [ ] Utilizou NUMERIC(15,4) para quantidades
* [ ] Seguiu os padrões já existentes do EroERP
