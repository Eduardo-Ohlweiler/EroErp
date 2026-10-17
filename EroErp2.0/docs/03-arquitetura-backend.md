# Arquitetura Backend — Java 21 + Spring Boot 3.5

> Leia antes de criar qualquer entidade, controller, service, repository, mapper
> ou migration.

---

## 1. Stack

Java 21 · Spring Boot 3.5.16 · Maven · PostgreSQL 16 · Liquibase XML ·
Spring Data JPA / Hibernate 6 · Spring Security · JJWT 0.12.6 ·
Bucket4j 8.19 (`bucket4j_jdk17-core`) · Bean Validation · Lombok ·
SpringDoc OpenAPI 2.8 · Spring Boot Actuator · JUnit 5

**Sem Docker.** PostgreSQL local, variáveis em `.env`, `./run-dev.sh` para subir.
Exige **JDK 21** — o `run-dev.sh` localiza o JDK certo mesmo que o `JAVA_HOME` da
máquina aponte para outra versão.

Não adicionar dependência que não esteja nesta lista sem justificativa escrita no
PR. Em particular: nada de MapStruct (mapper é código explícito), nada de
JasperReports ou Apache POI até existir requisito de relatório/planilha, nada de
Querydsl (JPQL basta), nada de biblioteca de cache distribuído.

---

## 2. Arquitetura modular por domínio

Cada módulo tem suas próprias camadas. Nada de pacotes globais `controllers/`,
`services/`, `entities/`.

```
com.api.ero_erp
├── EroErpApplication.java
├── baseentity/           BaseEntity, TenantEntity
├── config/               SecurityConfig, JwtUtil, JwtProperties, JwtFilter,
│                         SecurityUtils, AuthDetails, RateLimitFilter,
│                         PageableUtils, TransacaoConfig, SwaggerConfig, DataSeeder
├── jobs/                 ManutencaoJob
├── exceptions/           ApplicationException, BadRequestException,
│                         BusinessException, ConflictException, ForbiddenException,
│                         NotFoundException, UnauthorizedException,
│                         ErroResponseDto, GlobalExceptionHandler
├── auth/ · usuario/ · tenant/ · loginlog/ · refreshtoken/
├── catalogo/ · localidade/ · contato/ · vinculo/
└── pessoa/
    ├── controller/       PessoaController
    ├── dtos/             PessoaCreateDto, PessoaUpdateDto,
    │                     PessoaResponseDto, PessoaSelectDto, ...
    ├── entity/           Pessoa
    ├── enums/            TipoPessoa, Sexo
    ├── mapper/           PessoaMapper
    ├── repository/       PessoaRepository
    └── service/          PessoaService
```

Os exemplos de código abaixo usam `Produto`, um módulo que ainda **não**
existe aqui — é o caso típico do que vem do EroErp antigo, e tem valor
monetário, que é onde as regras de tipo numérico pesam.

Se uma funcionalidade pertence a um módulo, ela mora nele. `config/` e
`exceptions/` são as únicas exceções — infraestrutura transversal de verdade.

---

## 3. Fluxo obrigatório

```
Controller → Service → Repository → Banco
```

| Camada | Faz | Nunca faz |
|---|---|---|
| **Controller** | recebe HTTP, valida DTO, chama service, devolve response | acessa repository, contém regra de negócio, chama API externa, faz try/catch de negócio |
| **Service** | regra de negócio, validação, controle de tenant, autorização fina, auditoria, cálculo | monta JSON, conhece `HttpServletRequest` (salvo IP/User-Agent para auditoria) |
| **Repository** | consulta e persistência | regra de negócio, validação, chamada externa |

---

## 4. Entidades

Toda entidade de negócio estende `TenantEntity`; entidades globais estendem
`BaseEntity`. Ver [01-multitenant.md](01-multitenant.md) para o código das duas.

```java
@Entity
@Table(name = "produto")
@Getter @Setter @NoArgsConstructor
public class Produto extends TenantEntity {

    @Column(name = "descricao", nullable = false, length = 255)
    private String descricao;

    @Column(name = "codigo", length = 60)
    private String codigo;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", nullable = false, length = 20)
    private TipoProduto tipo;

    @Column(name = "preco_venda", precision = 15, scale = 2)
    private BigDecimal precoVenda;

    @Column(name = "ativo", nullable = false)
    private Boolean ativo = true;
}
```

Regras:

- **Lombok** — `@Getter @Setter @NoArgsConstructor`. Nunca `@Data` (traz `equals`,
  `hashCode` e `toString` que quebram com proxies lazy e vazam dados em log).
- **Enums** — sempre `@Enumerated(EnumType.STRING)`. Nunca `ORDINAL`.
- **`length`** obrigatório em toda `String`.
- **`precision`/`scale`** obrigatórios em todo `BigDecimal`.
- **Relacionamentos** — sempre `FetchType.LAZY`. `EAGER` só com justificativa.
- **Coleções** — nada de `CascadeType.REMOVE` sem intenção explícita.
- **Sem `@PrePersist` em subclasse.** Os callbacks ficam só em `BaseEntity`: a
  JPA invoca os de toda a hierarquia e redeclarar causa execução dupla. Valor
  padrão vai em inicializador de campo.
- **Sem lógica de negócio na entidade**, com uma exceção: métodos de leitura
  derivados e triviais, como `Usuario.estaBloqueado()`.

### Tipos numéricos

| Grandeza | Tipo Java | Coluna |
|---|---|---|
| Valor monetário (preço, total, saldo) | `BigDecimal` | `NUMERIC(15,2)` |
| Quantidade fracionária (kg, m, l) | `BigDecimal` | `NUMERIC(15,4)` |
| Percentual (desconto, alíquota) | `BigDecimal` | `NUMERIC(6,2)` |
| Contagem | `Integer` | `INTEGER` |

**Nunca `double` ou `float`** em nada que seja dinheiro, quantidade ou
percentual. `0.1 + 0.2` em ponto flutuante é `0.30000000000000004`: somado em
mil itens de pedido, vira centavo sumido — e centavo sumido é diferença no
fechamento de caixa.

### Datas

| Uso | Tipo |
|---|---|
| Auditoria, log, timestamps técnicos | **`Instant`** (UTC) |
| Data de nascimento, data de emissão, vencimento | `LocalDate` |
| Horário dentro do dia, sem data | `LocalTime` |

Nunca `LocalDateTime` para auditoria, agendamento ou integração — não carrega
fuso e vira ambiguidade na primeira mudança de horário de verão ou servidor.
`jackson.time-zone: UTC` no `application.yml`.

---

## 5. DTOs

Sempre `record`. Sempre com Bean Validation. Controller nunca vê `Entity`.

```
dtos/
├── ProdutoCreateDto.java
├── ProdutoUpdateDto.java
├── ProdutoResponseDto.java
└── ProdutoSelectDto.java
```

```java
public record ProdutoCreateDto(

        @NotBlank @Size(max = 255)
        String descricao,

        @Size(max = 60)
        String codigo,

        @NotNull
        TipoProduto tipo,

        @DecimalMin("0.00") @Digits(integer = 13, fraction = 2)
        BigDecimal precoVenda
) {}
```

- `CreateDto` e `UpdateDto` são separados, mesmo quando idênticos hoje — divergem
  cedo (o create de usuário exige senha, o update não; o código de um produto
  pode ser fixado na criação e não mudar depois).
- `ResponseDto` nunca expõe senha, hash, token ou id interno de outro tenant.
- `SelectDto` é o par mínimo `{ id, descricao }` para combos.
- Toda entrada validada. **Nunca confiar no frontend.**

---

## 6. Mappers

Classe final com métodos estáticos e construtor privado. Sem MapStruct — a
conversão explícita é curta, legível e não gera código na build.

```java
public final class ProdutoMapper {

    private ProdutoMapper() {}

    public static Produto toEntity(ProdutoCreateDto dto) {
        Produto p = new Produto();
        p.setDescricao(dto.descricao());
        p.setCodigo(dto.codigo());
        p.setTipo(dto.tipo());
        p.setPrecoVenda(dto.precoVenda());
        return p;                             // tenant é setado no service
    }

    public static void applyUpdate(Produto p, ProdutoUpdateDto dto) {
        p.setDescricao(dto.descricao());
        p.setTipo(dto.tipo());
        p.setPrecoVenda(dto.precoVenda());
    }

    public static ProdutoResponseDto toResponse(Produto p) {
        return new ProdutoResponseDto(p.getId(), p.getDescricao(), p.getCodigo(),
                                      p.getTipo(), p.getPrecoVenda(),
                                      p.getAtivo(), p.getCreatedAt());
    }

    public static ProdutoSelectDto toSelect(Produto p) {
        return new ProdutoSelectDto(p.getId(), p.getDescricao());
    }
}
```

O mapper **nunca** seta o tenant. Isso é responsabilidade do service, que o obtém
de `SecurityUtils`.

---

## 7. Repositories

Padrão completo em [01-multitenant.md §3](01-multitenant.md). Resumo:

- Todo método recebe `tenantId`
- `findByIdAndTenantId`, `existsByXAndTenantId`, `existsByXAndTenantIdAndIdNot`
- `findAllWithFilters(Pageable, tenantId, ...)` e `findForSelect(tenantId, nome)`

Consulta simples: derivação de nome do Spring Data.
**Listagem com filtro opcional: native query** com `CAST` explícito do PostgreSQL.

O JPQL do Hibernate 6 não tipa um parâmetro nulo solto em `:param IS NULL` e o
Postgres responde *"não foi possível determinar o tipo de dados do parâmetro $N"*.
Com String o sintoma é `função lower(bytea) não existe` — mesma causa. O cast
nativo resolve os dois e libera `unaccent`.

| Java | Cast |
|---|---|
| `String` | `CAST(:p AS text)` |
| `UUID` | `CAST(:p AS uuid)` |
| `Boolean` | `CAST(:p AS boolean)` |
| `Instant` | `CAST(:p AS timestamptz)` |
| enum | passe `.name()` e use `CAST(:p AS text)` |

Toda native paginada precisa de `countQuery`. A ordenação é fixa no SQL e o
service passa `PageableUtils.semOrdenacao(pageable)` — em native o Spring Data
usaria o nome da propriedade como coluna (`dataLogin` não existe, é `data_login`),
e `?sort=` é entrada de usuário que vira SQL (OWASP A03).

### Consultas em coleção — evitar N+1

Pessoa com tipos de cadastro, telefones e e-mails carrega tudo lazy e dispara
N+1 se o mapper percorrer as coleções. Usar `@EntityGraph` na leitura:

```java
@EntityGraph(attributePaths = {"tiposCadastro"})
Optional<Pessoa> findWithTiposByIdAndTenantId(UUID id, UUID tenantId);
```

Para páginas, `@EntityGraph` com `@ManyToMany` gera produto cartesiano — nesse
caso, buscar a página de ids primeiro e carregar as coleções numa segunda query.

---

## 8. Services

```java
@Service
@RequiredArgsConstructor
public class ProdutoService {

    private final ProdutoRepository produtoRepository;
    private final SecurityUtils     securityUtils;
```

- Injeção por construtor (`@RequiredArgsConstructor` + campos `final`).
  **Nunca `@Autowired` em campo.**
- `@Transactional(readOnly = true)` em leitura, `@Transactional` em escrita.
- O tenant vem sempre de `securityUtils.getTenantIdLogado()`.
- Regra de negócio mora aqui, inclusive as contas.

### Classes de cálculo

Conta que tenha regra própria — total de pedido com desconto, rateio de frete,
parcelamento — fica numa classe pura, sem estado e sem dependência de Spring,
dentro do módulo (`{modulo}/calculo/`). O service busca os dados, chama a
classe e grava o resultado:

```java
public final class TotalPedidoCalculator {

    private TotalPedidoCalculator() {}

    /**
     * Total do item: quantidade × valor unitário, menos o desconto percentual.
     * Arredonda em 2 casas, HALF_UP, só no fim — arredondar o subtotal antes do
     * desconto erra o centavo.
     */
    public static BigDecimal totalItem(BigDecimal quantidade,
                                       BigDecimal valorUnitario,
                                       BigDecimal descontoPercentual) { ... }
}
```

Toda conta carrega: a regra escrita no Javadoc, unidades explícitas nos
parâmetros, `BigDecimal` do início ao fim, `RoundingMode.HALF_UP` com escala
declarada, e um teste com valores conferidos à mão.

Classe pura é trivial de testar e não pode acessar banco por acidente.

---

## 9. Controllers

```java
@RestController
@RequestMapping("/produtos")
@RequiredArgsConstructor
@Tag(name = "Produtos")
public class ProdutoController {

    private final ProdutoService produtoService;

    @GetMapping
    @PreAuthorize("hasAuthority('PRODUTOS_LER')")
    public ResponseEntity<Page<ProdutoResponseDto>> getAll(
            @PageableDefault(size = 20) Pageable pageable,
            @RequestParam(required = false) String descricao,
            @RequestParam(required = false) String codigo,
            @RequestParam(required = false) Boolean ativo) {
        return ResponseEntity.ok(produtoService.getAll(pageable, descricao, codigo, ativo));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('PRODUTOS_LER')")
    public ResponseEntity<ProdutoResponseDto> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(produtoService.findById(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PRODUTOS_ESCREVER')")
    public ResponseEntity<ProdutoResponseDto> create(@Valid @RequestBody ProdutoCreateDto dto) {
        ProdutoResponseDto criado = produtoService.create(dto);
        return ResponseEntity.created(URI.create("/produtos/" + criado.id())).body(criado);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PRODUTOS_ESCREVER')")
    public ResponseEntity<ProdutoResponseDto> update(@PathVariable UUID id,
                                                     @Valid @RequestBody ProdutoUpdateDto dto) {
        return ResponseEntity.ok(produtoService.update(id, dto));
    }
}
```

Regras:

- **`@PreAuthorize` em todos os métodos.** Módulo de negócio usa a permissão da
  tela: `<TELA>_LER` nos GET, `<TELA>_ESCREVER` em POST, PUT, PATCH e DELETE. A
  tela nasce como constante no enum `Tela` (docs/02 §1.2). O `/select` dos combos
  é a exceção: `isAuthenticated()`, porque serve outras telas e devolve só id e
  rótulo.
- Rotas no plural e em kebab-case: `/pessoas`, `/login-logs`, `/unidades-medida`.
- `@Valid` em todo `@RequestBody`.
- Status: `200` leitura e update, `201` create (com `Location`), `204` delete,
  `404` não encontrado ou de outro tenant, `409` conflito, `422` regra de negócio.
- Sem `try/catch` — o `GlobalExceptionHandler` cuida.

### Paginação obrigatória

Toda listagem devolve `Page<T>` e recebe `Pageable`. Nenhum endpoint devolve
coleção ilimitada. `spring.data.web.pageable.max-page-size: 100` põe teto no
`size` — sem isso, `?size=1000000` é um DoS trivial.

`findForSelect` é a exceção controlada: devolve `List<SelectDto>` porque alimenta
combo, mas filtra por `ativo = true` e tem limite fixo no JPQL.

---

## 10. Tratamento de exceções

```java
public class ApplicationException extends RuntimeException { ... }   // 400
public class BadRequestException  extends ApplicationException { }   // 400
public class UnauthorizedException extends ApplicationException { }  // 401
public class ForbiddenException   extends ApplicationException { }   // 403
public class NotFoundException    extends ApplicationException { }   // 404
public class ConflictException    extends ApplicationException { }   // 409
public class BusinessException    extends ApplicationException { }   // 422
```

```java
public record ErroResponseDto(String erro, int codigo, Instant timestamp, String path) {}
```

```java
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<ErroResponseDto> notFound(NotFoundException e, HttpServletRequest req) {
        return build(HttpStatus.NOT_FOUND, e.getMessage(), req);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErroResponseDto> validacao(MethodArgumentNotValidException e,
                                                     HttpServletRequest req) {
        String msg = e.getBindingResult().getFieldErrors().stream()
                .map(f -> f.getField() + ": " + f.getDefaultMessage())
                .collect(Collectors.joining("; "));
        return build(HttpStatus.BAD_REQUEST, msg, req);
    }

    /** Rede de segurança — nunca devolve a mensagem original. */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErroResponseDto> inesperado(Exception e, HttpServletRequest req) {
        String ref = UUID.randomUUID().toString();
        log.error("Erro inesperado [{}] em {}", ref, req.getRequestURI(), e);
        return build(HttpStatus.INTERNAL_SERVER_ERROR,
                     "Erro interno. Referência: " + ref, req);
    }
}
```

O handler genérico **nunca** devolve `e.getMessage()` nem stack trace. Devolve uma
referência opaca; o detalhe fica no log do servidor. Uma mensagem de exceção crua
vaza nome de tabela, de coluna, caminho de arquivo e versão de biblioteca.

---

## 11. Configuração

`application.yml` — só seleciona o profile.
`application-dev.yml` / `application-prod.yml` — tudo por variável de ambiente.

```yaml
spring:
  datasource:
    url:      ${DB_URL}
    username: ${DB_USER}
    password: ${DB_PASSWORD}
  jpa:
    hibernate.ddl-auto: none          # SEMPRE none — o schema é do Liquibase
    open-in-view: false               # evita lazy loading fora da transação
    properties.hibernate.jdbc.batch_size: 25
  liquibase:
    change-log: classpath:db/changelog/changelog-master.xml
  jackson:
    time-zone: UTC
    default-property-inclusion: non_null
  data.web.pageable:
    default-page-size: 20
    max-page-size: 100

jwt:
  secret:      ${JWT_SECRET}          # ≥ 32 caracteres
  access-ttl:  PT8H
  refresh-ttl: P7D

app:
  cors.allowed-origins: ${CORS_ALLOWED_ORIGINS}    # nunca hard-coded
  superadmin:
    tenant-nome: ${SUPERADMIN_TENANT_NOME:EroErp Admin}
    nome:        ${SUPERADMIN_NOME}
    email:       ${SUPERADMIN_EMAIL}
    senha:       ${SUPERADMIN_SENHA}
  rate-limit:
    login-por-minuto: 5
  auditoria:
    retencao-meses: 12
```

Diferenças em `prod`:

```yaml
spring.jpa.show-sql: false
springdoc.api-docs.enabled: false          # ou protegido por autenticação
management.endpoints.web.exposure.include: health,info
management.endpoint.health.show-details: never
logging.level.root: INFO
```

`open-in-view: false` é importante: com o padrão `true`, uma coleção lazy acessada
no mapper dispara query fora da transação e mascara N+1.

---

## 12. Testes

Rodam contra o **PostgreSQL local** `ero_erp_test`, com o Liquibase recriando o
schema a cada execução (`drop-first`). Configuração em
`src/test/resources/application-test.yml`.

Nem H2 nem Testcontainers:

- **H2**, mesmo em modo PostgreSQL, não tem `unaccent`, trata `NULL` em constraint
  única de outro jeito e aceita SQL que o Postgres rejeita — daria falsa confiança
  exatamente onde dói.
- **Testcontainers** exige Docker, que este projeto não usa.

| Tipo | Anotação | O que cobre |
|---|---|---|
| Unitário de cálculo | nenhuma (JUnit puro) | classes de `calculo/` |
| Integração | `@SpringBootTest` + `@AutoConfigureMockMvc` + `@ActiveProfiles("test")` | rota, status, validação, `@PreAuthorize`, native query |
| Isolamento | idem, estendendo `AbstractIntegrationTest` | tenant A × tenant B |

`AbstractIntegrationTest` monta o cenário canônico — dois tenants completos com
seus administradores, mais o superadmin — e autentica pelo próprio endpoint, de
modo que o token do teste é igual ao de produção. A limpeza entre testes respeita
a ordem de dependência: `refresh_token → login_log → pessoa → usuario → tenant`,
sempre com `deleteAllInBatch`, que executa na hora (o cascade do banco leva os
contatos e vínculos da pessoa). `deleteAll(lista)` só enfileira, e num teste
`@Transactional` o delete em lote seguinte chega ao banco antes dele.

```bash
./run-dev.sh test
```

Obrigatório por módulo:

- **teste de isolamento** com os quatro casos de [01-multitenant.md §10](01-multitenant.md)
- **teste de cálculo** com valores conferidos à mão, quando o módulo calcula

```java
@Test
void totalItem_descontoArredondaSoNoFim() {
    // 3 × 19,99 = 59,97; 59,97 × (1 − 0,075) = 55,47225 → 55,47
    BigDecimal total = TotalPedidoCalculator.totalItem(
            new BigDecimal("3"),       // quantidade
            new BigDecimal("19.99"),   // valor unitário
            new BigDecimal("7.5"));    // desconto %
    assertThat(total).isEqualByComparingTo("55.47");
}
```

Gabarito se confere em decimal, não em `double`: a conta feita em ponto
flutuante para escrever o teste pode errar o último dígito que o `BigDecimal`
acerta.

---

## 13. Logs

```java
log.info("Pessoa criada id={} tenant={}", pessoa.getId(), tenantId);   // CERTO
log.info("Pessoa criada: {}", pessoa);                                 // ERRADO
```

**Nunca logar:** senha, hash de senha, JWT, refresh token, chave de API, nome,
CPF/CNPJ, RG, e-mail, telefone, endereço — nada que identifique ou descreva uma
pessoa. São dados pessoais sob a LGPD.

Log de negócio referencia por **id e tenant**, nunca por conteúdo. Ver
[06-seguranca-owasp.md](06-seguranca-owasp.md) A09.

---

## 14. Dependências

Após adicionar qualquer dependência:

```bash
./mvnw dependency-check:check
```

Vulnerabilidade crítica bloqueia o merge. O plugin roda no CI.

---

## 15. O que nunca fazer

- Repository dentro de Controller
- Regra de negócio em Controller
- `tenantId`, `usuarioId` ou `role` vindos do frontend
- Entity como Request ou Response
- `findAll()` sem paginação
- `findById()` em entidade multi-tenant
- SQL concatenado
- Stack trace ou `e.getMessage()` cru na resposta
- Senha sem BCrypt
- Secret no `application.yml` ou no código
- `@Autowired` em campo
- `@Data` do Lombok em entidade
- `double`/`float` em dinheiro, quantidade ou percentual
- `LocalDateTime` em auditoria ou agendamento
- `EnumType.ORDINAL`
- `ddl-auto` diferente de `none`
- `open-in-view: true`
- Alterar banco fora do Liquibase
- Editar changeSet já executado
- Endpoint sem `@PreAuthorize`
- Dado pessoal em log

---

## 16. Checklist de PR

- [ ] Módulo com as sete pastas do padrão
- [ ] Entity estende `TenantEntity` (ou `BaseEntity` se global)
- [ ] DTOs `record` com Bean Validation, Create e Update separados
- [ ] Mapper estático, sem setar tenant
- [ ] Repository sem método sem `tenantId`; listagem filtrada em native query com `CAST` explícito e `countQuery`
- [ ] Service com `@Transactional` e tenant vindo de `SecurityUtils`
- [ ] Controller com `@PreAuthorize` em todos os métodos e paginação nas listagens
- [ ] Migration Liquibase com FK, índice e uniques nomeadas
- [ ] Teste de isolamento
- [ ] Teste de cálculo conferido à mão, se aplicável
- [ ] Nenhum dado pessoal em log
- [ ] `dependency-check` limpo
