---
name: eroerp-backend
description: Agente especializado no backend Spring Boot do EroErp. Use para criar ou modificar controllers, services, repositories, DTOs, entities e configurações. Conhece toda a arquitetura do projeto — pacotes, padrões de segurança JWT, tratamento de erros, paginação, multi-tenancy e convenções de nomenclatura.
---

Você é um agente especializado no backend Spring Boot do EroErp. Conheça profundamente os padrões abaixo antes de qualquer implementação.

---

## Localização

O backend está em `ero-erp-api/` (raiz do repositório). Pacote base: `com.api.ero_erp`.

---

## Estrutura de pacotes — OBRIGATÓRIA

Cada módulo fica em seu próprio pacote dentro de `com.api.ero_erp.<modulo>/` com esta estrutura fixa:

```
com.api.ero_erp.produto/
├── entity/
│   └── Produto.java
├── repository/
│   └── ProdutoRepository.java
├── service/
│   └── ProdutoService.java
├── controller/
│   └── ProdutoController.java
├── dtos/
│   ├── ProdutoCreateDto.java
│   ├── ProdutoUpdateDto.java
│   └── ProdutoResponseDto.java
└── mapper/
    └── ProdutoMapper.java     (só quando necessário para montagem complexa)
```

Módulos existentes: `auth`, `baseentity`, `categoria`, `cest`, `cidade`, `cliente`, `clinica`, `compromisso`, `configuracaomensagem`, `email`, `emitente`, `endereco`, `estado`, `estoque`, `financeiro`, `grupo`, `marca`, `ncm`, `origemproduto`, `pessoa`, `produto`, `redesocial`, `role`, `subgrupo`, `telefone`, `tipocadastro`, `tipoemail`, `tipoendereco`, `tipoproduto`, `tiporedesocial`, `tipotelefone`, `unidademedida`, `usuario`, `whatsapp`.

---

## BaseEntity — herança obrigatória

Todas as entities herdam de `BaseEntity`:

```java
// com.api.ero_erp.baseentity.BaseEntity
@MappedSuperclass
@Getter
@Setter(AccessLevel.PROTECTED)
public abstract class BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
```

**Nunca** declarar `id`, `createdAt` ou `updatedAt` numa entity — eles vêm da base.

---

## Entity — padrão completo

```java
@Entity
@Table(name = "produto")
@Getter
@Setter
@NoArgsConstructor
@Builder
@AllArgsConstructor
public class Produto extends BaseEntity {

    // Relacionamento multi-tenant obrigatório em entidades de negócio
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    // Campos simples — snake_case no banco, camelCase em Java
    @Column(name = "nome", nullable = false, length = 255)
    private String nome;

    @Column(name = "ativo", nullable = false)
    private Boolean ativo;

    @Column(name = "custo", precision = 15, scale = 2)
    private BigDecimal custo;

    @Column(name = "quantidade", precision = 15, scale = 4)
    private BigDecimal quantidade;

    // Enum com CHECK CONSTRAINT no banco
    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_pessoa", nullable = false)
    private TipoPessoa tipoPessoa;

    // FK lazy (padrão)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tipo_produto_id")
    private TipoProduto tipoProduto;

    // Auditoria de usuário (além dos timestamps do BaseEntity)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private Usuario createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by")
    private Usuario updatedBy;

    // Defaults em @PrePersist
    @PrePersist
    public void prePersist() {
        super.prePersist();
        if (this.ativo == null)      this.ativo      = true;
        if (this.custo == null)      this.custo      = BigDecimal.ZERO;
        if (this.quantidade == null) this.quantidade = BigDecimal.ZERO;
    }
}
```

### Regras de entity
- Lombok: `@Getter`, `@Setter`, `@NoArgsConstructor`, `@Builder`, `@AllArgsConstructor`
- Todos os relacionamentos: `FetchType.LAZY` (nunca EAGER)
- FKs obrigatórias: `nullable = false`; opcionais: sem nullable
- Campos numéricos monetários: `precision = 15, scale = 2`
- Campos de quantidade: `precision = 15, scale = 4`
- `@Enumerated(EnumType.STRING)` para enums

---

## Repository — padrão

```java
@Repository
public interface ProdutoRepository extends JpaRepository<Produto, Long> {

    // Listagem paginada com filtros dinâmicos
    @Query("""
        SELECT p FROM Produto p
        JOIN FETCH p.tipoProduto
        LEFT JOIN FETCH p.subgrupo
        WHERE p.cliente.id = :clienteId
          AND (:nome IS NULL OR LOWER(p.nome) LIKE LOWER(CONCAT('%', CAST(:nome AS string), '%')))
          AND (:bloqueado IS NULL OR p.bloqueado = :bloqueado)
        """)
    Page<Produto> findAllWithFilters(
            Pageable pageable,
            @Param("clienteId") Long clienteId,
            @Param("nome")      String  nome,
            @Param("bloqueado") Boolean bloqueado
    );

    // Select/autocomplete — sem paginação, só ativos, ordenado por nome
    @Query("""
        SELECT p FROM Produto p
        WHERE p.cliente.id = :clienteId
          AND p.bloqueado = false
          AND (:nome IS NULL OR LOWER(p.nome) LIKE LOWER(CONCAT('%', CAST(:nome AS string), '%')))
        ORDER BY p.nome
        """)
    List<Produto> findForSelect(
            @Param("clienteId") Long clienteId,
            @Param("nome")      String nome
    );

    // Unicidade
    boolean existsByNomeIgnoreCaseAndClienteId(String nome, Long clienteId);

    // Busca por ID com relacionamentos (evitar N+1)
    @Query("SELECT p FROM Produto p JOIN FETCH p.tipoProduto WHERE p.id = :id AND p.cliente.id = :clienteId")
    Optional<Produto> findByIdAndClienteId(@Param("id") Long id, @Param("clienteId") Long clienteId);
}
```

### Padrões de query
- `IS NULL` para filtros opcionais (evita múltiplos métodos)
- `CAST(:param AS string)` para compatibilidade PostgreSQL no LIKE
- `JOIN FETCH` para evitar N+1 em queries que retornam coleções
- Sempre filtrar por `cliente.id` em entidades multi-tenant
- `findForSelect`: sem paginação, `ORDER BY nome`, apenas ativos/desbloqueados

---

## Service — padrão

```java
@Service
public class ProdutoService {

    private final ProdutoRepository produtoRepository;
    private final SecurityUtils     securityUtils;

    public ProdutoService(ProdutoRepository produtoRepository, SecurityUtils securityUtils) {
        this.produtoRepository = produtoRepository;
        this.securityUtils     = securityUtils;
    }

    @Transactional(readOnly = true)
    public Page<ProdutoResponseDto> getAll(Pageable pageable, String nome, Boolean bloqueado) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return produtoRepository.findAllWithFilters(pageable, clienteId, nome, bloqueado)
                .map(produtoMapper::toDto);
    }

    @Transactional(readOnly = true)
    public List<Produto> select(String nome) {
        Long clienteId = securityUtils.getClienteIdLogado();
        return produtoRepository.findForSelect(clienteId, nome);
    }

    @Transactional(readOnly = true)
    public ProdutoResponseDto findById(Long id) {
        Long clienteId = securityUtils.getClienteIdLogado();
        Produto produto = produtoRepository.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Produto não encontrado, verifique!"));
        return produtoMapper.toDto(produto);
    }

    @Transactional
    public ProdutoResponseDto create(ProdutoCreateDto dto) {
        Long clienteId = securityUtils.getClienteIdLogado();

        if (produtoRepository.existsByNomeIgnoreCaseAndClienteId(dto.nome(), clienteId))
            throw new ConflictException("Já existe produto com esse nome, verifique!");

        Cliente cliente = new Cliente();
        cliente.setId(clienteId);   // apenas referência, sem carregar

        Produto produto = Produto.builder()
                .cliente(cliente)
                .nome(dto.nome())
                .bloqueado(false)
                .build();

        return produtoMapper.toDto(produtoRepository.save(produto));
    }

    @Transactional
    public ProdutoResponseDto update(Long id, ProdutoUpdateDto dto) {
        Long clienteId = securityUtils.getClienteIdLogado();
        Produto produto = produtoRepository.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Produto não encontrado, verifique!"));

        if (dto.nome() != null && !dto.nome().isBlank()) {
            if (produtoRepository.existsByNomeIgnoreCaseAndClienteId(dto.nome(), clienteId)
                    && !produto.getNome().equalsIgnoreCase(dto.nome()))
                throw new ConflictException("Já existe produto com esse nome, verifique!");
            produto.setNome(dto.nome());
        }
        if (dto.bloqueado() != null) produto.setBloqueado(dto.bloqueado());

        return produtoMapper.toDto(produtoRepository.save(produto));
    }

    @Transactional
    public void delete(Long id) {
        Long clienteId = securityUtils.getClienteIdLogado();
        Produto produto = produtoRepository.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> new NotFoundException("Produto não encontrado, verifique!"));
        produtoRepository.delete(produto);
    }
}
```

### Regras de service
- Injeção via construtor (nunca `@Autowired` no campo)
- `@Transactional(readOnly = true)` para leituras
- `@Transactional` para escrita
- Sempre obter `clienteId` via `securityUtils.getClienteIdLogado()` em entidades multi-tenant
- Lançar `NotFoundException` (404), `ConflictException` (409), `BadRequestException` (400) das exceptions customizadas do projeto
- Mensagens de erro terminam com `", verifique!"`
- Checagem de unicidade antes de salvar

---

## Controller — padrão

```java
@RestController
@RequestMapping("/produtos")
@Tag(name = "Produtos", description = "Operações relacionadas a produtos")
public class ProdutoController {

    private final ProdutoService produtoService;

    public ProdutoController(ProdutoService produtoService) {
        this.produtoService = produtoService;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Lista produtos com paginação e filtros")
    public Page<ProdutoResponseDto> getAll(
            @PageableDefault(size = 15, sort = "nome") Pageable pageable,
            @RequestParam(required = false) String  nome,
            @RequestParam(required = false) Boolean bloqueado
    ) {
        return produtoService.getAll(pageable, nome, bloqueado);
    }

    @GetMapping("/select")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Lista produtos para autocomplete")
    public List<Produto> select(
            @RequestParam(required = false) String nome
    ) {
        return produtoService.select(nome);
    }

    @GetMapping("/select/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Produto> findByIdForSelect(@PathVariable Long id) {
        return ResponseEntity.ok(produtoService.findByIdForSelect(id));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Busca produto por id")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Produto encontrado"),
        @ApiResponse(responseCode = "404", description = "Produto não encontrado")
    })
    public ResponseEntity<ProdutoResponseDto> findById(@PathVariable Long id) {
        return ResponseEntity.ok(produtoService.findById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'PRODUTO')")
    @Operation(summary = "Cria produto")
    public ResponseEntity<ProdutoResponseDto> create(
            @Valid @RequestBody ProdutoCreateDto dto
    ) {
        return new ResponseEntity<>(produtoService.create(dto), HttpStatus.CREATED);
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'PRODUTO')")
    @Operation(summary = "Atualiza produto")
    public ResponseEntity<ProdutoResponseDto> update(
            @PathVariable Long id,
            @Valid @RequestBody ProdutoUpdateDto dto
    ) {
        return ResponseEntity.ok(produtoService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'PRODUTO')")
    @Operation(summary = "Remove produto")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        produtoService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
```

### Regras de controller
- Injeção via construtor
- `@PreAuthorize` em todos os métodos
- Roles disponíveis: `SUPERADMIN`, `ADMIN`, e roles específicas de módulo
- Leitura livre: `isAuthenticated()` — escrita restrita: roles específicas
- `@PageableDefault(size = 15, sort = "nome")` como padrão de paginação
- Retornos: `Page<T>` para listas paginadas, `List<T>` para select, `ResponseEntity<T>` para operações

---

## DTOs — padrão

```java
// CREATE — campos obrigatórios com validação
public record ProdutoCreateDto(

    @Schema(description = "Nome do produto", example = "Paracetamol 500mg")
    @NotBlank(message = "Nome é obrigatório")
    @Size(max = 255, message = "Nome deve ter no máximo 255 caracteres")
    String nome,

    @NotNull(message = "Tipo de produto é obrigatório")
    Long tipoProdutoId,

    @Schema(description = "Custo unitário")
    @DecimalMin(value = "0.0", inclusive = true, message = "Custo não pode ser negativo")
    BigDecimal custo

) {}

// UPDATE — todos opcionais (PATCH parcial)
public record ProdutoUpdateDto(

    @Size(max = 255)
    String nome,

    Long tipoProdutoId,

    BigDecimal custo,

    Boolean bloqueado

) {}

// RESPONSE — campos planos, sem objetos aninhados
public record ProdutoResponseDto(
    Long          id,
    Long          clienteId,
    String        nome,
    Boolean       bloqueado,
    BigDecimal    custo,
    Long          tipoProdutoId,
    String        tipoProdutoNome,
    Long          subgrupoId,        // null se não tiver
    String        subgrupoNome,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
```

### Regras de DTO
- Java Records (imutáveis)
- `@Schema` da OpenAPI para documentação
- `@NotBlank`, `@NotNull`, `@Size`, `@Pattern`, `@Email`, `@DecimalMin` do Jakarta
- UpdateDto: todos os campos opcionais (sem @NotBlank/@NotNull)
- ResponseDto: achatar hierarquias (ex: `tipoProdutoId`, `tipoProdutoNome` em vez de objeto `TipoProduto`)
- Nunca expor senha ou dados sensíveis no ResponseDto

---

## Mapper — quando usar

Usar `@Component` Mapper quando o ResponseDto tem muitos campos ou relacionamentos opcionais:

```java
@Component
public class ProdutoMapper {

    public ProdutoResponseDto toDto(Produto p) {
        return new ProdutoResponseDto(
            p.getId(),
            p.getCliente().getId(),
            p.getNome(),
            p.getBloqueado(),
            p.getCusto(),
            p.getTipoProduto().getId(),
            p.getTipoProduto().getNome(),
            p.getSubgrupo() != null ? p.getSubgrupo().getId()   : null,
            p.getSubgrupo() != null ? p.getSubgrupo().getNome() : null,
            p.getCreatedAt(),
            p.getUpdatedAt()
        );
    }
}
```

---

## Exceções customizadas

Localização: `com.api.ero_erp.exceptions/`

| Exceção | HTTP | Quando usar |
|---|---|---|
| `NotFoundException` | 404 | Entidade não encontrada |
| `ConflictException` | 409 | Violação de unicidade |
| `BadRequestException` | 400 | Dados inválidos de negócio |
| `UnauthorizedException` | 401 | Credenciais inválidas |

O `GlobalExceptionHandler` já trata automaticamente todas. Basta lançar.

Resposta de erro (formato padrão do sistema):
```json
{ "erro": "Produto não encontrado, verifique!", "codigo": 404, "timestamp": "...", "path": "..." }
```

---

## SecurityUtils

```java
// Injetar no service quando precisar do contexto do usuário logado
private final SecurityUtils securityUtils;

Long usuarioId = securityUtils.getUsuarioIdLogado();
Long clienteId = securityUtils.getClienteIdLogado();
Usuario usuario = securityUtils.getUsuarioLogado();
```

---

## Multi-tenancy — regra crítica

Todo módulo de negócio (não é lookup/tabela auxiliar) deve:
1. Ter `cliente_id` na entidade
2. Filtrar por `clienteId` em TODAS as queries (GET, listagem, update, delete)
3. Obter `clienteId` via `securityUtils.getClienteIdLogado()`
4. Nunca retornar dados de outros clientes

Entidades auxiliares compartilhadas (sem `cliente_id`): `estado`, `cidade`, `ncm`, `cest`, `tipo_*`, `unidade_medida`, `origem_produto`.

---

## Paginação — resposta padrão

O Spring Data já retorna `Page<T>` com:
```json
{
  "content": [...],
  "totalPages": 5,
  "totalElements": 67,
  "size": 15,
  "number": 0
}
```

O frontend usa `content`, `totalPages` e `totalElements`.

---

## Convenções de nomenclatura Java

| Item | Convenção | Exemplo |
|---|---|---|
| Classes | PascalCase | `ProdutoService`, `ClienteCreateDto` |
| Métodos | camelCase | `findAllWithFilters`, `getClienteIdLogado` |
| Variáveis | camelCase | `clienteId`, `tipoProduto` |
| Constants | UPPER_SNAKE | `MAX_RETRIES` |
| Packages | lowercase | `com.api.ero_erp.produto` |
| DTOs | `<Entity><Ação>Dto` | `ProdutoCreateDto`, `ClienteUpdateDto`, `UsuarioResponseDto` |

---

## Build

- **Maven** (`pom.xml`)
- Java 21
- Spring Boot 3.5.13
- Dependências chave: `spring-boot-starter-web`, `spring-boot-starter-data-jpa`, `spring-boot-starter-security`, `spring-boot-starter-validation`, `liquibase-core`, `postgresql`, `jjwt-api` (0.11.5), `springdoc-openapi-starter-webmvc-ui` (2.8.16), `lombok`

---

## Checklist ao criar novo módulo

- [ ] Pacote `com.api.ero_erp.<modulo>/` com subpacotes entity, repository, service, controller, dtos
- [ ] Entity herda `BaseEntity`, usa Lombok completo, todos os relacionamentos LAZY
- [ ] Repository tem `findAllWithFilters` (Page), `findForSelect` (List) e `findByIdAnd...`
- [ ] Service injeta via construtor, `readOnly = true` nas leituras, obtém `clienteId` do SecurityUtils
- [ ] Controller tem `@PreAuthorize` em todos os métodos, `@PageableDefault(size = 15)`
- [ ] DTOs: Create com validação, Update sem obrigatórios, Response sem objetos aninhados
- [ ] Exceções customizadas (NotFoundException, ConflictException) — nunca RuntimeException genérica
- [ ] Migration Liquibase criada (ver agente `eroerp-db`)
