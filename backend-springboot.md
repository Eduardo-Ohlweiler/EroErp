# Skill: Arquitetura — Java 21 + Spring Boot (EroERP)

Use esta skill em todo código backend do EroERP.

Leia esta skill antes de criar qualquer entidade, controller, service, repository, mapper, integração ou migration.

---

# Stack Oficial

* Java 21
* Spring Boot 3
* Spring Security
* JWT (JJWT)
* Spring Data JPA
* Hibernate
* PostgreSQL
* Liquibase XML
* Lombok
* Bean Validation
* SpringDoc OpenAPI (Swagger)
* Spring Boot Actuator
* JasperReports
* Apache POI
* Maven

---

# Arquitetura do Projeto

O sistema deve seguir arquitetura modular por domínio.

Cada módulo deve possuir suas próprias camadas.

Exemplo:

```text
estoque
├── controller
├── dtos
├── entity
├── enums
├── mapper
├── repository
└── service
```

Outro exemplo:

```text
cadastro
├── controller
├── dtos
├── entity
├── enums
├── mapper
├── repository
└── service
```

Outro exemplo:

```text
financeiro
├── controller
├── dtos
├── entity
├── enums
├── mapper
├── repository
└── service
```

Não criar estruturas globais quando a funcionalidade pertence a um módulo específico.

---

# Fluxo Obrigatório

```text
Controller
→ Service
→ Repository
→ Banco de Dados
```

---

# Controller

Responsável apenas por:

* Receber requisições HTTP
* Validar DTOs
* Chamar Services
* Retornar Responses

Controllers nunca devem:

* Acessar Repository
* Conter regra de negócio
* Executar SQL
* Chamar APIs externas
* Conter lógica complexa

---

# Service

Responsável por:

* Regras de negócio
* Validações
* Controle de tenant
* Controle de permissões
* Auditoria
* Integrações externas

Toda regra de negócio deve ficar na Service.

---

# Repository

Responsável apenas por:

* Consultas ao banco
* Persistência

Repositories nunca devem:

* Conter regras de negócio
* Conter validações
* Chamar APIs externas

---

# Multi-Tenant (REGRA MÁXIMA)

O sistema é multi-tenant.

A entidade Cliente representa o tenant.

Nenhum usuário pode:

* Visualizar dados de outro cliente
* Alterar dados de outro cliente
* Excluir dados de outro cliente
* Consultar dados de outro cliente

Esta regra possui prioridade máxima sobre qualquer outra regra.

---

# Entidades Multi-Tenant

Toda entidade de negócio deve possuir relacionamento com Cliente.

Exemplo:

```java
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "cliente_id", nullable = false)
private Cliente cliente;
```

Exemplos de entidades multi-tenant:

* Produto
* GrupoProduto
* SubGrupoProduto
* Pessoa
* Endereco
* Telefone
* Agenda
* Pedido
* Orcamento
* Financeiro
* WhatsappInstancia
* Configurações do Cliente

---

# Nunca Confiar em clienteId do Frontend

Proibido:

```java
produto.setCliente(
    clienteRepository.findById(
        dto.getClienteId()
    ).orElseThrow()
);
```

Correto:

```java
produto.setCliente(
    usuarioLogado.getCliente()
);
```

O cliente sempre deve ser obtido através do usuário autenticado.

---

# Nunca Confiar em usuarioId do Frontend

Proibido:

```java
pedido.setUsuario(
    usuarioRepository.findById(
        dto.getUsuarioId()
    ).orElseThrow()
);
```

Correto:

```java
pedido.setUsuario(
    usuarioLogado
);
```

---

# Consultas Multi-Tenant

Toda consulta deve filtrar por cliente.

Proibido:

```java
produtoRepository.findById(id);
```

Correto:

```java
produtoRepository.findByIdAndClienteId(
    id,
    usuarioLogado.getCliente().getId()
);
```

---

# Listagens Multi-Tenant

Proibido:

```java
produtoRepository.findAll(pageable);
```

Correto:

```java
produtoRepository.findAllByClienteId(
    usuarioLogado.getCliente().getId(),
    pageable
);
```

---

# Atualizações Multi-Tenant

Sempre validar o tenant.

```java
Produto produto = produtoRepository
    .findByIdAndClienteId(
        id,
        usuarioLogado.getCliente().getId()
    )
    .orElseThrow(
        () -> new ResourceNotFoundException("Registro não encontrado")
    );
```

---

# Exclusões Multi-Tenant

Sempre validar o tenant.

```java
Produto produto = produtoRepository
    .findByIdAndClienteId(
        id,
        usuarioLogado.getCliente().getId()
    )
    .orElseThrow(
        () -> new ResourceNotFoundException("Registro não encontrado")
    );

produtoRepository.delete(produto);
```

---

# DTOs Obrigatórios

Controllers nunca recebem Entities.

Controllers nunca retornam Entities.

Sempre utilizar:

* Request DTO
* Response DTO

Estrutura recomendada:

```text
dtos
├── request
└── response
```

Exemplo:

```java
@PostMapping
public ResponseEntity<ProdutoResponse> salvar(
        @Valid @RequestBody ProdutoRequest request) {

    return ResponseEntity.ok(
        produtoService.salvar(request)
    );
}
```

---

# Bean Validation Obrigatória

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

# Mappers Obrigatórios

Toda conversão entre Entity e DTO deve ser realizada através de Mapper.

Exemplo:

```java
ProdutoMapper.toResponse(produto);
```

Evitar:

```java
new ProdutoResponse(
    produto.getId(),
    produto.getDescricao()
);
```

espalhado pelos Controllers.

---

# Paginação Obrigatória

Toda listagem deve ser paginada.

Proibido:

```java
findAll()
```

Correto:

```java
Page<ProdutoResponse>
```

e

```java
Pageable pageable
```

---

# Segurança

Todas as rotas devem exigir JWT.

Exceções:

* /auth/login
* /auth/refresh
* /health

Qualquer exceção deve ser justificada.

---

# JWT

Toda autenticação deve utilizar JWT.

Nunca utilizar:

* HttpSession
* Session
* Sessões em memória

Sempre validar:

* Expiração
* Assinatura
* Usuário

---

# Usuário Autenticado

Sempre obter o usuário através do JWT.

Nunca confiar em:

* usuarioId do body
* clienteId do body
* role do body
* permissões do body

---

# Spring Security

Toda autorização deve ocorrer no backend.

O frontend nunca é fonte confiável.

Utilizar:

```java
@PreAuthorize(...)
```

quando aplicável.

---

# Tratamento de Exceções

Utilizar:

```java
@RestControllerAdvice
```

para tratamento global.

Controllers não devem utilizar try/catch para regras de negócio.

Exemplo:

```java
@RestControllerAdvice
public class GlobalExceptionHandler {
}
```

---

# Banco de Dados

Utilizar PostgreSQL.

Toda alteração estrutural deve ser realizada através do Liquibase.

Nunca alterar banco manualmente.

Nunca executar SQL diretamente em produção.

---

# Liquibase

Toda alteração estrutural deve possuir changelog XML.

Estrutura padrão:

```text
src/main/resources/db/changelog

├── db.changelog-master.xml
├── V001_create_cliente.xml
├── V002_create_usuario.xml
├── V003_create_produto.xml
└── ...
```

---

# Regras Liquibase

* Nunca editar um changeSet já executado
* Sempre criar novo changeSet para alterações
* Todo changeSet deve possuir id único
* Todo changeSet deve possuir author
* Toda nova entidade deve possuir migration correspondente
* Toda nova coluna deve possuir migration correspondente
* Toda nova constraint deve possuir migration correspondente

---

# Auditoria

Toda operação de:

* Inclusão
* Alteração
* Exclusão

deve registrar:

* Usuário
* Cliente
* Data/Hora UTC
* Entidade
* Registro afetado

Eventos obrigatórios:

* Login
* Logout
* Falha de login
* Alterações críticas
* Exclusões
* Alteração de permissões

---

# Datas e Horários

Banco:

Preferir:

```java
Instant
```

ou

```java
OffsetDateTime
```

Utilizar UTC.

Evitar:

```java
LocalDateTime
```

para:

* Auditoria
* Integrações
* Agendamentos
* Notificações

---

# Swagger

Utilizar SpringDoc OpenAPI.

Produção:

* Protegido por autenticação

ou

* Desabilitado

Nunca deixar Swagger público em produção.

---

# Actuator

Produção deve expor apenas:

* health
* info

Nunca expor:

* env
* beans
* mappings
* heapdump
* threaddump

---

# Integrações Externas

Toda integração deve ficar em camada própria.

Exemplos:

* Evolution API
* WhatsApp
* Pix
* E-mail
* APIs terceiras

Controllers nunca devem chamar APIs externas diretamente.

---

# Relatórios

Utilizar JasperReports.

Arquivos de relatório devem ficar organizados por módulo.

Exemplo:

```text
estoque/reports
financeiro/reports
cadastro/reports
```

---

# Excel

Utilizar Apache POI.

Sempre validar:

* Extensão
* Tamanho
* Conteúdo

antes de processar arquivos enviados pelo usuário.

---

# Repositories

Preferir:

```java
findByIdAndClienteId(...)
existsByIdAndClienteId(...)
findAllByClienteId(...)
```

Evitar:

```java
findById(...)
findAll(...)
deleteById(...)
```

em entidades multi-tenant.

---

# Logs

Nunca logar:

* Senhas
* JWT
* Refresh Token
* Chaves de API
* Dados bancários
* Dados médicos

---

# Dependências

Após adicionar dependências:

```bash
mvn dependency-check:check
```

Corrigir vulnerabilidades críticas antes do merge.

---

# O Que Nunca Fazer

* Repository dentro de Controller
* Regra de negócio em Controller
* clienteId vindo do frontend
* usuarioId vindo do frontend
* Entity como Request
* Entity como Response
* findAll() sem paginação
* SQL concatenado
* Stack trace para frontend
* Senhas sem BCrypt
* Dados de outro cliente acessíveis
* Secrets hardcoded
* Alterar banco manualmente
* Editar changeSets Liquibase já executados
* Chamar APIs externas diretamente em Controllers
* Ignorar validação de tenant
* Ignorar validação de usuário autenticado
* Utilizar LocalDateTime para auditoria ou agendamentos
* Confiar em permissões enviadas pelo frontend
