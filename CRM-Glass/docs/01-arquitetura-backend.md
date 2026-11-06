# 01 — Arquitetura do backend (`ero-api`)

Fonte da verdade da estrutura do backend. O teste `ArquiteturaTest` verifica
estas regras a cada `mvnw verify`: se uma regra quebrar, o build falha.
Mudar uma regra é decisão do dono do produto, nunca de quem está codando.

## Stack

| Item | Escolha |
|---|---|
| Linguagem | Java 25 |
| Framework | Spring Boot 4.1 (Spring 7, Hibernate 7, Jackson 3, Spring Security 7) |
| Build | Maven (`mvnw` / `mvnw.cmd`) |
| Banco | PostgreSQL 18 (dev pelo `compose.yaml`; testes pelo Testcontainers) |
| Migrations | Liquibase XML |
| Testes | JUnit 5, MockMvcTester, Testcontainers, ArchUnit |

## Pastas

```
ero-api/src/main/java/com/api/ero_api/
  EroApiApplication.java
  compartilhado/        infraestrutura comum (não é módulo de negócio)
    entity/             BaseEntity, TenantEntity, @SqlNativoRevisado
    dtos/               PaginaDto, ErroCampoDto
    exception/          ApiException e filhas + GlobalExceptionHandler
    util/               LogSeguro, PaginacaoUtils, HashUtils
    web/                filtros HTTP (CorrelationId, limite de tamanho), ClienteRequisicao
    config/             auditoria JPA, OpenAPI, seed do superadmin, agendamento (@EnableScheduling)
  seguranca/            infraestrutura de segurança (não é módulo de negócio)
    config/             SecurityConfig, CorsConfig, SegurancaProperties
    jwt/                JwtService, JwtAutenticacaoConverter
    tenant/             TenantContext, TenantIdentifierResolver
    autorizacao/        AutorizacaoService, AutorizacaoCache
    ratelimit/          RateLimitFilter
    cripto/             CriptoService, CriptoConverter
    senha/              SenhaService (política + Argon2)
    SecurityUtils, UsuarioAutenticado
  <modulo>/             um por assunto de negócio: usuario, tenant, permissao, auth, sessao, auditoria...
    entity/  enums/  repository/  dtos/  mapper/  service/  controller/  util/
```

Dentro de um módulo **só existem estas 8 pastas**. Não crie `dto/`, `model/`,
`domain/`, `helper/`, `impl/`, `usecase/` nem nada fora da lista.

## Padrão de módulo — copie o `usuario`

O módulo `usuario` é o **módulo-modelo**. Módulo novo = copiar a forma dele.

| Pasta | Arquivo | Regras |
|---|---|---|
| `entity/` | `Usuario.java` | Estende `TenantEntity` (ou `BaseEntity` se for da plataforma; ver lista em `ArquiteturaTest`). Lombok só `@Getter @Setter @NoArgsConstructor`. Relações `LAZY`. Sem regra de negócio além de perguntas simples (`bloqueadoEm`). |
| `enums/` | `Papel.java` | Só quando o módulo tiver enum. Enum gravado como texto (`@Enumerated(STRING)`). |
| `repository/` | `UsuarioRepository.java` | Interface. Toda consulta é JPQL com nome em português em text block: `buscarPorId`, `buscarComFiltros`, `buscarParaSelecao`, `existe...`. Nunca use os genéricos `findById`/`findAll`/`count`/`existsById`/`deleteById` (o ArchUnit barra). Parâmetro String opcional dentro de função SQL sempre com `CAST(:p AS string)`. Use `JOIN FETCH` para não cair em N+1. |
| `dtos/` | `UsuarioCreateDto`, `UsuarioUpdateDto`, `UsuarioResponseDto`, `UsuarioSelectDto` | Sempre `record` e sempre com sufixo `Dto`. Bean Validation com mensagem em pt-BR e `@Schema`. **Nunca** `tenantId`, `id` nem auditoria na entrada. O UpdateDto traz `version`. DTO com senha sobrescreve `toString()`. Em DTO de entrada, use tipo objeto (`Boolean`, `Integer`) com `@NotNull`, nunca primitivo: o Jackson 3 recusa campo primitivo ausente com erro genérico, sem dizer qual campo. |
| `mapper/` | `UsuarioMapper.java` | Classe `final` com construtor privado e métodos `static`: `toResponseDto`, `toSelectDto`, `toEntity(CreateDto)`, `atualizarEntidade(entity, UpdateDto)`. Sem Spring e sem regra de negócio. |
| `service/` | `UsuarioService.java` | `@Service`, injeção pelo construtor. `@Transactional(readOnly = true)` em leitura e `@Transactional` em escrita. `buscarEntidade(id)` para outros services; `buscarPorId(id)` devolve DTO para o controller. Escreveu e vai devolver o DTO: **`saveAndFlush`** antes de mapear (senão a resposta sai com a `version` antiga e o próximo PUT dá 409 falso). Regras de negócio e autorização fina ficam aqui. Erros com exceção tipada. |
| `controller/` | `UsuarioController.java` | `@RestController`, rota plural `/api/<recurso>`. Só recebe e devolve DTO. **Todo** método público com `@PreAuthorize` (ou `@PermitAll` justificado). Rota "de qualquer usuário" (combo, catálogo) usa `hasAuthority('ACESSO_LIBERADO')`, nunca `isAuthenticated()` (que deixaria passar quem ainda tem pendência). Exceção: `/api/auth/*`, que atende justamente quem tem pendência (trocar senha, configurar 2FA). Swagger `@Tag`/`@Operation`. Nenhuma regra: só delega. |
| `util/` | validadores do módulo | Opcional. Ex.: validador de CPF/CNPJ, cálculo puro. |

### Exceção: nomes em lote projetados em `SelectDto`

A regra é: repository devolve entidade e o mapper converte. **Única exceção:** buscar
nomes ou rótulos de vários registros de uma vez, para enriquecer outra listagem (ex.: os
nomes de usuário e de contratante na trilha de logs). Nesse caso o JPQL pode projetar
direto no `SelectDto` do módulo:

```java
@Query("""
        SELECT new com.api.ero_api.usuario.dtos.UsuarioSelectDto(u.id, u.nome)
        FROM Usuario u
        WHERE u.id IN :ids
        """)
List<UsuarioSelectDto> buscarNomesPorIds(@Param("ids") Collection<UUID> ids);
```

Por quê: carregar a entidade inteira só para ler o nome decifra os campos com
`CriptoConverter` (o segredo TOTP do usuário) e traz colunas que ninguém vai usar. O
service expõe isso como `buscarNomes(Collection<UUID>) → Map<UUID, String>` (um SELECT
por página, sem N+1). O filtro de tenant continua valendo, porque é JPQL. Fora desse caso
(nomes ou rótulos em lote), tudo segue entidade + mapper.

### Quem pode usar o quê

- Controller → service **do próprio módulo** (e DTOs/enums). **Nunca** repository, entity ou service de outro módulo (o ArchUnit barra).
- Service → repository **do próprio módulo** e services de outros módulos.
  Precisa de dado de outro módulo? Chame o service dele (`usuarioService.buscarEntidade(id)`).
- Ninguém depende de controller.
- Evite ciclo entre services: se A precisa de B e B de A, uma das partes vai para um terceiro service.

## Convenções de API

| Operação | Verbo e rota | Retorno |
|---|---|---|
| Listar com filtro e página | `GET /api/usuarios?busca=&ativo=&page=0&size=20&sort=nome,asc` | `200 PaginaDto<ResponseDto>` |
| Buscar um | `GET /api/usuarios/{id}` | `200 ResponseDto` |
| Combo/autocomplete | `GET /api/usuarios/selecao` (`ACESSO_LIBERADO`) | `200 List<SelectDto>` |
| Criar | `POST /api/usuarios` | `201 ResponseDto` |
| Alterar (formulário completo) | `PUT /api/usuarios/{id}` com `version` | `200 ResponseDto` (`409` se a versão mudou) |
| Inativar / reativar | `PATCH /api/usuarios/{id}/inativar` / `ativar` | `204` |
| Ação específica | `PATCH /api/usuarios/{id}/redefinir-senha` | `204` ou `200` |

- **Não existe DELETE físico de cadastro.** Cadastro é inativado.
- IDs são UUID v7, gerados pela aplicação.
- Repository: todo método declarado tem `@Query` (o ArchUnit barra `findByX` derivado).
- Campo que muda sozinho (contador, último acesso) não pode subir a `version` do cadastro: grave com `UPDATE` direto no repository (ver `UsuarioRepository.atualizarTentativas`) e use `@DynamicUpdate` na entidade.
- Ordenação aceita só os campos da lista branca do service (`PaginacaoUtils.validar`). No máximo 100 itens por página.
- Datas trafegam em ISO-8601 UTC (`Instant`). Quem formata em pt-BR é o front.

### Erros (RFC 9457 — ProblemDetail)

```json
{
  "type": "about:blank",
  "title": "Bad Request",
  "status": 400,
  "detail": "Existem campos inválidos.",
  "instance": "/api/usuarios",
  "codigo": "VALIDACAO",
  "correlationId": "4f0c…",
  "erros": [{ "campo": "email", "mensagem": "E-mail inválido" }]
}
```

| Exceção | HTTP | `codigo` |
|---|---|---|
| validação de DTO | 400 | `VALIDACAO` |
| `AutenticacaoException` / token inválido | 401 | `NAO_AUTENTICADO` |
| `AcessoNegadoException` / sem permissão | 403 | `ACESSO_NEGADO` |
| `NaoEncontradoException` (também quando é de outro tenant) | 404 | `NAO_ENCONTRADO` |
| `ConflitoException` / versão desatualizada / duplicidade | 409 | `CONFLITO` |
| `RegraNegocioException` | 422 | `REGRA_NEGOCIO` |
| limite de requisições | 429 | `MUITAS_REQUISICOES` |
| inesperado | 500 | `ERRO_INTERNO` (texto genérico + correlationId; detalhe só no log) |

## Auditoria de registro

Toda entidade tem `created_at`, `updated_at`, `created_by`, `updated_by` (UUID do
usuário) e `version`. São preenchidos pelo Spring Data; ninguém seta à mão. O
ResponseDto devolve esses campos.

## Passo a passo: módulo novo

1. Planejar: campos, regras, telas e o **grupo de liberação** (ver `04-permissoes.md`).
2. Migration `NNN-create-<tabela>.xml` (ver `05-banco-liquibase.md`) + linha no `changelog-master.xml`.
3. `entity/` estendendo `TenantEntity`.
4. `repository/` com `buscarPorId`, `buscarComFiltros`, `buscarParaSelecao`.
5. `dtos/` Create, Update (com `version`), Response, Select.
6. `mapper/` estático.
7. `service/` copiando a forma do `UsuarioService`.
8. Grupo em `GrupoLiberacao` + telas em `Tela` (+ ações, se houver).
9. `controller/` com `@PreAuthorize("hasAuthority('<GRUPO>_LER')")` nos GET e `_ESCREVER` no resto.
10. Teste de integração em `src/test/java/.../<modulo>/` copiando o `UsuarioIntegracaoTest`, com no mínimo:
    caminho feliz, validação recusada, **isolamento entre dois tenants** e o **par LER/ESCREVER**.
11. `mvnw verify` verde (inclui ArchUnit).

## Rodar

```bash
cd ero-api
cp .env.example .env      # e preencha (ou use o .env de dev já gerado)
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
./mvnw verify             # build + ArchUnit + testes (Docker ligado)
./mvnw verify -Pseguranca # + checagem de dependências vulneráveis (OWASP)
```

Swagger em dev: `http://localhost:8080/swagger-ui.html`.
