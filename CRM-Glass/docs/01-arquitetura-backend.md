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
    util/               LogSeguro, PaginacaoUtils, HashUtils, TextoBusca (nome_busca sem acento),
                        RestricaoViolada, RepetirSeCodigoRepetido (código), DocumentoValidator (CPF/CNPJ)
    web/                filtros HTTP (CorrelationId, limite de tamanho), ClienteRequisicao
    email/              EmailService (SMTP, modelos em resources/templates/email/)
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
| `controller/` | `UsuarioController.java` | `@RestController`, rota plural `/api/<recurso>`. Só recebe e devolve DTO. **Todo** método público com `@PreAuthorize` (ou `@PermitAll` justificado). Rota "de qualquer usuário" (combo, catálogo) usa `hasAuthority('ACESSO_LIBERADO')`, nunca `isAuthenticated()` (que deixaria passar quem ainda tem pendência). Exceção: `/api/auth/*`, que atende justamente quem tem pendência (trocar a senha temporária). Swagger `@Tag`/`@Operation`. Nenhuma regra: só delega. |
| `util/` | validadores do módulo | Opcional. Ex.: validador de CPF/CNPJ, cálculo puro. |

> **Entidade nunca sai da API (regra inviolável):** toda consulta que devolve informação
> tem o seu `ResponseDto` (ou `SelectDto`/DTO próprio) e o mapper; nenhuma rota, tratador
> de erro ou DTO devolve ou embute entidade (nem como campo, nem dentro de `PaginaDto` ou
> lista). **Dentro de um DTO também nunca vai entidade:** se o DTO precisa trazer dados de
> outra entidade, usa **outro DTO só com as informações necessárias** (ex.: `TenantSelectDto`
> com id e nome dentro de `UsuarioResponseDto`), montado no mapper. O `ArquiteturaTest` reprova: `controllerNaoVeEntidadeNemRepository`,
> `dtosNaoVeemEntidade` (nada em `dtos/` depende de `entity/`; enums de `enums/` podem) e
> `respostaHttpNaoVeEntidade` (nenhuma classe com `@RestController`, `@Controller`,
> `@RestControllerAdvice` ou `@ControllerAdvice`, em qualquer pacote, depende de `entity/`).

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
`CriptoConverter` (quando a entidade tem campo cifrado) e traz colunas que ninguém vai usar. O
service expõe isso como `buscarNomes(Collection<UUID>) → Map<UUID, String>` (um SELECT
por página, sem N+1). O filtro de tenant continua valendo, porque é JPQL. Fora desse caso
(nomes ou rótulos em lote), tudo segue entidade + mapper.

### Quem pode usar o quê

- Controller → service **do próprio módulo** (e DTOs/enums). **Nunca** repository, entity ou service de outro módulo (o ArchUnit barra).
- DTO e tratador de erro (`@RestControllerAdvice`) **nunca** enxergam entity (o ArchUnit barra).
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

### Listas filhas de um cadastro (modelo: `pessoa`)

- A filha (telefone, e-mail, endereço...) chega **sem `id`** dentro do Create/UpdateDto:
  a lista é o estado completo e substitui a anterior (`removerPorPessoa` + `saveAll`).
  Assim ninguém aponta para a linha de outro registro (sem IDOR) e a `ordem` é a posição.
- A entidade-mãe não tem coleção: cada filha tem o seu repository, com `buscarPorPessoa`
  (`JOIN FETCH` do que a resposta mostra) e, para a lista, consultas em lote (`...PorPessoas(ids)`).
- Mudou só uma filha: a `version` da mãe sobe mesmo assim (`marcarAlteracao`, `UPDATE VERSIONED`).
- Erro de regra numa linha usa o caminho do Bean Validation: `telefones[1].tipoId`,
  `vinculos[0].pessoaId` (o `erroApi` do front converte para o campo da linha).
- Banco: FK composta `(mae_id, tenant_id)` e `(tipo_id, tenant_id)` (`docs/05`).
- Vínculo entre dois registros do mesmo cadastro: uma linha só, em orientação canônica
  (`OrdemUuid`, a mesma ordem do `uuid <` do PostgreSQL); salvar trava as duas pontas em
  ordem de id e sobe a `version` da outra quando o vínculo dela mudou.

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
| validação de DTO ou de parâmetro (`erros[{campo, mensagem}]`: o campo do DTO, ex. `administrador.email`, ou o nome do parâmetro na URL; vale também quando a rota mistura `@Valid @RequestBody` com restrição em parâmetro) | 400 | `VALIDACAO` |
| `CampoInvalidoException` (regra de campo que só o service vê: cidade inexistente, CEP fora de 8 dígitos...; `erros[{campo, mensagem}]` como acima) | 400 | `VALIDACAO` |
| `AutenticacaoException` / token inválido | 401 | `NAO_AUTENTICADO` |
| `/2fa/verificar`: desafio vencido, código vencido, já usado, substituído por login novo ou anterior à última troca de senha (voltar para a senha) | 401 | `DESAFIO_EXPIRADO` |
| `/2fa/verificar`: código errado, ou conta bloqueada/inativa/contratante inativo, sem dizer qual (pode digitar de novo) | 401 | `CODIGO_INVALIDO` |
| `AcessoNegadoException` / sem permissão | 403 | `ACESSO_NEGADO` |
| `NaoEncontradoException` (também quando é de outro tenant) | 404 | `NAO_ENCONTRADO` |
| `ConflitoException` / versão desatualizada (sem `erros`) | 409 | `CONFLITO` |
| `ConflitoCampoException` / duplicidade num campo (com `erros[{campo, mensagem}]`, como o 400; ver `docs/03`, "Contrato do 409") | 409 | `CONFLITO` |
| `RegraNegocioException` | 422 | `REGRA_NEGOCIO` |
| limite de requisições (com `Retry-After`) | 429 | `MUITAS_REQUISICOES` |
| `ServicoIndisponivelException` (ex.: e-mail não saiu) | 503 | `SERVICO_INDISPONIVEL` |
| inesperado | 500 | `ERRO_INTERNO` (texto genérico + correlationId; detalhe só no log) |

## Auditoria de registro

Toda entidade tem `created_at`, `updated_at`, `created_by`, `updated_by` (UUID do
usuário) e `version`. São preenchidos pelo Spring Data; ninguém seta à mão. O
ResponseDto devolve esses campos e mais `criadoPorNome` e `alteradoPorNome` (o que o
`TAuditoria` da tela lê). Os nomes vêm de `UsuarioService.buscarNomes`, uma consulta por
página (sem N+1), e o mapper monta a resposta (modelo: `UsuarioService.listar` e
`UsuarioMapper.toResponseDto`).

O filtro de tenant vale também aqui: dentro de um contratante o superadmin não está no
mapa de nomes. Quando foi ele (o suporte da plataforma) quem cadastrou ou alterou, o
registro sai com `createdBy`/`updatedBy` e o nome **vazios**: o id do superadmin não sai
para o contratante (mesma regra da trilha de logs). Na visão de plataforma tudo aparece.

## Código do registro (`cod_<entidade>`)

Todo cadastro de negócio usado pelo contratante (pessoa, emitente, pedido,
estoque...) tem, além do UUID, um **número sequencial por contratante** que o
usuário fala e imprime: `cod_pessoa` na tabela `pessoa`, `cod_emitente` em
`emitente`, `cod_pedido` em `pedido`. Tabelas da plataforma e do Administrativo
(`tenant`, `usuario`, permissões, logs) **não** têm. Decisão do dono:
`docs/negocio/codigo-sequencial.md`.

- O UUID continua sendo a chave, a FK e o id na URL. O código **nunca** é FK e
  **nunca vem na entrada**: `CreateDto` e `UpdateDto` não têm o campo e o mapper
  nunca o copia. Nunca muda depois de gravado. Não existe rota nem
  `buscarPorCodigo` que leia ou altere pelo código; ele só aparece no filtro da lista.
- Numeração: **maior + 1 do contratante, no salvar**. Sem tabela de contadores e
  sem sequence do banco.
- Banco: coluna, índice único e check conforme `05-banco-liquibase.md`.
- Entidade: `private Long codPessoa;` com `@Column(name = "cod_pessoa", nullable = false, updatable = false)`.
- Repository: uma consulta com nome, que já sai filtrada pelo tenant (`@TenantId`):
  ```java
  @Query("SELECT COALESCE(MAX(p.codPessoa), 0) + 1 FROM Pessoa p")
  long buscarProximoCodigo();
  ```
- O `criar` começa com `SecurityUtils.exigirTenantSelecionado()` (como no
  `usuario`): no contexto ROOT o `@TenantId` não filtra e o maior sairia o da
  plataforma toda. `buscarProximoCodigo` nunca roda em `comoRoot`; fluxo de
  plataforma usa `TenantContext.comoTenant(id, ...)`.
- Depois de todas as validações e **imediatamente antes do `saveAndFlush`**,
  `p.setCodPessoa(repository.buscarProximoCodigo())`. Assim uma recusa
  (validação, duplicado) não chega a pedir número.
- Dois salvando juntos: os dois leem o mesmo maior, e o índice único
  `(tenant_id, cod_pessoa)` recusa o segundo. Aí o salvar roda de novo, até 3
  vezes, e é assim que se faz (no PostgreSQL a violação aborta a transação, e a
  entidade que falhou já tem `id` e `version`):
  - o `criar` do service **não** leva `@Transactional`; ele chama a peça comum de
    `compartilhado/util/` (ex.: `RepetirSeCodigoRepetido`), que roda o corpo num
    `TransactionTemplate` **novo a cada tentativa** (chamar outro método do
    próprio service não abre transação nova, porque passa por fora do proxy);
  - cada tentativa remonta a entidade a partir do DTO (`toEntity`), valida e pede
    o número de novo; nunca reaproveita a entidade da tentativa que falhou;
  - só repete quando a causa é `org.hibernate.exception.ConstraintViolationException`
    com `getConstraintName()` igual a `uk_<tabela>_tenant_cod_<tabela>` (como o
    `TenantService.violou`); outra violação sobe na hora para o `GlobalExceptionHandler`;
  - na 3ª recusa lança `ConflitoException("Não foi possível gerar o código. Tente salvar de novo.")` (409);
  - evento de log (`eventos.registrar`) entra na transação da tentativa; e-mail e
    outros efeitos de fora só depois do commit, para não sair em dobro.
  A peça é a `compartilhado/util/RepetirSeCodigoRepetido` (nasceu com os cadastros auxiliares) e é usada por todos.
- Como cadastro não tem DELETE físico (só inativa), o número não volta a ser usado.
- `ResponseDto`: `codPessoa` logo depois de `id`. O `SelectDto` leva o código quando o
  combo mostra "código · nome" (decisão de 14/11: `PessoaSelectDto(id, codPessoa, nome)`);
  os combos dos auxiliares não levam.
- Lista: filtro exato `@RequestParam(required = false) @Positive Long codPessoa`,
  `AND (:codPessoa IS NULL OR p.codPessoa = :codPessoa)` no `buscarComFiltros` e
  `"codPessoa"` na lista branca de ordenação.
- Teste mínimo, além dos do módulo: o primeiro registro do contratante é 1 e o
  seguinte é 2; dois contratantes numeram cada um do 1; `codPessoa` no corpo do
  POST e do PUT é ignorado; o filtro não acha o código de outro contratante; dois
  `criar` simultâneos no mesmo contratante terminam com 1 e 2, sem 409; violação
  de outro índice único não é repetida.

## Passo a passo: módulo novo

1. Planejar: campos, regras, telas e o **grupo de liberação** (ver `04-permissoes.md`).
2. Migration `NNN-create-<tabela>.xml` (ver `05-banco-liquibase.md`) + linha no `changelog-master.xml`. Cadastro de negócio já nasce com `cod_<entidade>` (seção "Código do registro").
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
