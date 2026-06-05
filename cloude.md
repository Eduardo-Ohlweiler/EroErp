# CLAUDE.md — Governança de Desenvolvimento

Este arquivo define as regras obrigatórias para geração de código nesta organização.

Leia este arquivo **inteiro** antes de escrever qualquer linha de código.

---

# 1. Skills Obrigatórias

Consulte as skills abaixo conforme o contexto do projeto.

| Contexto                      | Skill                    |
| ----------------------------- | ------------------------ |
| Qualquer projeto              | `security-owasp.md`      |
| Backend Java 21 + Spring Boot | `backend-springboot.md`  |
| Frontend React                | `frontend-react.md`      |
| PostgreSQL                    | `database-postgresql.md` |

---

# 2. Regras Universais — Aplicam-se a Todo Projeto

## Segurança

* Nunca hardcodar credenciais, tokens, senhas ou secrets
* Sempre utilizar variáveis de ambiente
* Sempre atualizar o README quando novas variáveis de ambiente forem criadas
* Toda rota HTTP deve possuir autenticação, exceto quando explicitamente justificado
* Seguir integralmente a skill `security-owasp.md`
* Nunca retornar stack traces para o frontend
* Nunca expor dados sensíveis em logs
* Nunca confiar em dados enviados pelo frontend para autorização

---

## Multi-Tenant

O sistema é multi-tenant.

A entidade **Cliente** representa o tenant.

Regras obrigatórias:

* Nenhum usuário pode visualizar dados de outro cliente
* Nenhum usuário pode alterar dados de outro cliente
* Nenhum usuário pode excluir dados de outro cliente
* Nenhum usuário pode consultar dados de outro cliente
* Toda entidade de negócio deve possuir relacionamento com Cliente
* Toda consulta deve filtrar por clienteId
* Nunca confiar em clienteId enviado pelo frontend
* Nunca confiar em tenantId enviado pelo frontend
* O cliente deve ser obtido exclusivamente através do usuário autenticado
* Toda validação de tenant deve ocorrer no backend

---

## Arquitetura

Fluxo obrigatório:

```text
Controller
→ Service
→ Repository
→ Banco de Dados
```

### Controllers

Responsáveis por:

* Receber requisições
* Validar DTOs
* Chamar Services
* Retornar Responses

Controllers nunca devem:

* Conter regra de negócio
* Acessar Repository diretamente
* Executar SQL
* Chamar APIs externas

### Services

Responsáveis por:

* Regras de negócio
* Validações
* Controle de tenant
* Auditoria
* Integrações externas

### Repositories

Responsáveis por:

* Persistência
* Consultas ao banco

Repositories nunca devem:

* Conter regras de negócio
* Conter validações
* Executar integrações externas

---

## DTOs

* Controllers nunca recebem Entities
* Controllers nunca retornam Entities
* Sempre utilizar Request DTO
* Sempre utilizar Response DTO
* Toda entrada deve utilizar Bean Validation

Exemplo:

```java
@PostMapping
public ResponseEntity<ProdutoResponse> salvar(
        @Valid @RequestBody ProdutoRequest request) {
}
```

---

## Bean Validation

Toda entrada deve ser validada.

Exemplo:

```java
public record ProdutoRequest(

    @NotBlank
    String descricao,

    @NotNull
    BigDecimal valor

) {
}
```

Nunca confiar em dados enviados pelo frontend.

---

## Banco de Dados

* Sempre seguir a skill `database-postgresql.md`
* Nunca acessar banco diretamente em Controllers
* Sempre utilizar Repositories
* Nunca concatenar SQL manualmente
* Utilizar queries parametrizadas
* Toda alteração estrutural deve ser versionada
* Nunca alterar banco manualmente em produção

---

## Liquibase

Toda alteração estrutural deve utilizar Liquibase XML.

Regras:

* Toda alteração deve possuir changelog
* Nunca editar changeSets já executados
* Sempre criar novo changeSet para alterações
* Todo changeSet deve possuir id único
* Todo changeSet deve possuir author
* Toda nova entidade deve possuir migration correspondente
* Toda nova coluna deve possuir migration correspondente
* Toda nova constraint deve possuir migration correspondente

Estrutura recomendada:

```text
src/main/resources/db/changelog

├── db.changelog-master.xml
├── V001_create_cliente.xml
├── V002_create_usuario.xml
├── V003_create_produto.xml
└── ...
```

---

## Paginação

Toda listagem deve ser paginada.

Evitar:

```java
findAll()
```

Preferir:

```java
Page<T>
```

e

```java
Pageable pageable
```

---

## Auditoria

Toda operação crítica deve ser auditada.

Ações críticas incluem:

* Criação de usuários
* Alteração de usuários
* Exclusão de usuários
* Alterações financeiras
* Alterações de permissões
* Alterações de configuração
* Envio de mensagens em massa
* Exclusão de registros

Registrar sempre:

* Usuário
* Cliente
* Data/Hora
* Entidade
* Registro afetado

---

## Datas e Horários

Regras obrigatórias:

* Salvar datas em UTC
* Preferir Instant
* Preferir OffsetDateTime
* Converter para timezone do usuário apenas no frontend

Evitar:

```java
LocalDateTime
```

para:

* Auditoria
* Agendamentos
* Notificações
* Integrações

---

## Dependências

### Backend Java

* Revisar dependências antes de adicionar
* Utilizar versões estáveis
* Evitar bibliotecas abandonadas
* Verificar vulnerabilidades periodicamente

### Frontend React

* Nunca utilizar versões latest
* Fixar versões explicitamente
* Executar npm audit após novas dependências

---

## Logs

Nunca registrar:

* Senhas
* JWT
* Refresh Tokens
* Chaves de API
* Dados bancários
* Dados médicos
* Secrets

Logs devem conter apenas informações necessárias para auditoria e diagnóstico.

---

## Integrações Externas

Toda integração externa deve ficar em camada própria.

Exemplos:

* Evolution API
* WhatsApp
* E-mail
* Pix
* APIs terceiras

Controllers nunca devem chamar APIs externas diretamente.

---

## Código Gerado por IA

Antes de gerar código:

* Ler integralmente o CLAUDE.md
* Ler as skills aplicáveis ao contexto
* Seguir os padrões existentes do projeto
* Respeitar a arquitetura definida
* Não criar bibliotecas sem necessidade
* Não alterar padrões existentes sem justificativa
* Manter consistência com o restante do sistema

---

## Checklist Obrigatório Antes de Finalizar Código

* [ ] Seguiu OWASP Top 10
* [ ] Respeitou arquitetura Controller → Service → Repository
* [ ] Respeitou isolamento multi-tenant
* [ ] Não confiou em clienteId enviado pelo frontend
* [ ] Utilizou DTOs
* [ ] Utilizou Bean Validation
* [ ] Utilizou paginação quando aplicável
* [ ] Criou migration Liquibase quando necessário
* [ ] Não expôs informações sensíveis
* [ ] Não inseriu secrets no código
* [ ] Manteve compatibilidade com padrões existentes do projeto
