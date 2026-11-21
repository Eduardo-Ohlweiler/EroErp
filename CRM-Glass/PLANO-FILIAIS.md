# Plano: Cadastro de Filiais (branch `timeero/filiais`, a partir da `main` depois do merge de Pessoas)

> Planejador, 20/11/2026. Fontes:
> - a pesquisa de Filiais (`docs/negocio/eroerp-referencias.md`, "Pesquisa de 20/11/2026: Filiais", e o rascunho);
> - `EroErp2.0/docs/09-modulo-filiais.md` e o código do 2.0 (`FilialService`, `FilialRepository`, `FilialMapper`, `FilialForm.tsx`, `TCor.tsx`);
> - `docs/negocio/` (`pessoas.md`, `codigo-sequencial.md`, `decisoes.md`) e `docs/01`, `03`, `04`, `05`, `07`;
> - o módulo `pessoa` (forma mais recente do `usuario`) e o `PLANO-PESSOAS.md`.
>
> As decisões do dono de 20/11/2026 estão na §2.1. As perguntas novas, na §2.3.

## 1. Entendimento

- **Filiais** é o 2º cadastro de negócio. A filial **não duplica cadastro**: aponta para uma Pessoa (física ou jurídica) e guarda só tipo (Matriz ou Filial), a matriz, uma cor `#RRGGBB` e a situação.
- Pode haver várias matrizes por contratante, cada uma com as suas filiais. A lista mostra cada matriz seguida das suas filiais.
- Entram o `cod_filial`, o `/api/filiais/selecao` para os combos das próximas telas, o grupo `FILIAIS` e duas telas: FilialList (modelo List) e FilialForm (modelo Form, com o cadastro rápido de pessoa e o painel "Dados da pessoa", só leitura).
- Peças novas no kit: `TCor` (escolher a cor) e `TCorMarca` (a bolinha), com as cores sugeridas em `tokens.css`.

## 2. Perguntas e decisões

### 2.1 Já decidido pelo dono (20/11/2026). Não se pergunta de novo.

| # | Decisão | Efeito no plano |
|---|---|---|
| 1 | Como no 2.0: **sem vínculo usuário-filial** e sem "filial atual" na sessão ou no token. Os movimentos futuros (agenda, negócio) guardam o seu `filialId`, e as listas deles terão filtro opcional. | Nada no token, no `SessaoProvider` nem no `UsuarioForm`. Nenhum filtro automático por filial. |
| 2 | **Cor livre**, `#RRGGBB`, escolhida pelo usuário. É **dado do usuário**, não token do sistema. | §4.1: a cor vem do banco e é aplicada **só** pelo kit (`TCorMarca`/`TCor`), numa variável CSS e só na bolinha. As 8 sugeridas são tokens. |
| 3 | Base: `main` depois do merge de Pessoas. | A migration é a **019**. |

### 2.2 Decidido pelo planejador (regra técnica ou escrita)

- **Código `cod_filial`** pela regra do código sequencial (`docs/01`, "Código do registro"). Usa o `RepetirSeCodigoRepetido` com o índice `uk_filial_tenant_cod_filial`.
- **Referência que não existe no contratante = 404**, como no 2.0: `pessoaId` e `matrizId` de outro contratante ou inexistentes. Reaproveita o `pessoaService.buscarEntidade` ("Pessoa não encontrada."), e a matriz dá "Matriz não encontrada.". Pela tela isso não acontece; só por chamada direta.
- **Os 409 levam campo** (`ConflitoCampoException`) quando a culpa é de um campo (`pessoaId`, `matrizId`, `tipo`). Assim o `msg.erroApi(e, form)` marca o campo certo. Os 409 de inativar e reativar não têm campo (`ConflitoException`): saem em aviso.
- **Inativar e reativar** por `PATCH /{id}/inativar` e `/ativar` (convenção do `docs/01`), no lugar do `PATCH /ativo?ativo=` do 2.0.
- **`PUT` com `version`** (o 2.0 não conferia).
- **Trocar a pessoa de uma filial já gravada continua permitido**, como no 2.0. A pessoa nova precisa estar ativa e não ser filial. A pessoa que **não mudou** não é reconferida (inativa continua). A matriz que já estava também não é reconferida (decisão do 2.0: filial inativa de matriz inativa ainda troca a cor).
- **Lista em ordem fixa, agrupada:** a API recusa `sort` (lista branca vazia). Sem ordenação pela grade.
- **`/api/filiais/selecao` com `ACESSO_LIBERADO`** (pesquisa: "aberto a quem está logado", para os combos das próximas telas). Para ficar aberto, o `FilialSelectDto` **não leva CPF nem CNPJ** (o do 2.0 levava), e a busca é só por nome ou fantasia.
- **O combo de Pessoa do FilialForm usa `/api/pessoas/selecao`**, que exige `PESSOAS_LER` (dado pessoal; no 2.0 ficava aberto, e isso era defeito). Quem tem `FILIAIS_ESCREVER` sem `PESSOAS_LER` vê o combo travado, com ajuda; numa filial já gravada, ainda altera a cor e a matriz.
- **O painel "Dados da pessoa" lê `GET /api/pessoas/{id}`** (`PESSOAS_LER`), como no 2.0. Sem esse acesso, o painel mostra só o aviso. A resposta da filial **não** carrega IE, IM nem endereço: só o necessário para a lista (§3.3).
- **Front:** a FilialForm importa de `modules/pessoas` (`pessoasApi`, `rotuloDaPessoa`, `PessoaRapidaModal`). É a primeira dependência entre módulos do front. Ela fica numa direção só (filiais → pessoas) e não move arquivo de Pessoas.
- **Cadastro novo:** abre com Tipo = Matriz (a 1ª filial de um contratante é sempre matriz) e **sem cor**. A cor é obrigatória ("Escolha a cor"), e a escolha é consciente, como o tipo de cadastro em Pessoas (decisão de 20/11).
- **Nada fiscal** (logo, regime, CNAE, série de nota, certificado): fora, como no 2.0.
- **Não nasce agora** o `FilialService.buscarAtiva(id)` para outros módulos. Ele nasce com o primeiro módulo que precisar (regra do 2.0, `docs/09` §6).

### 2.3 Perguntas novas ao Eduardo

1. **Pessoa inativada que é filial ativa.** No 2.0, inativar a pessoa não olha a filial: a filial continua ativa e usável.
   **Padrão:** seguir o 2.0.
   - Pessoas não bloqueia. O bloqueio criaria dependência circular pessoa ↔ filial.
   - A lista e o Form da filial mostram o `TBadge` "Pessoa inativa" ao lado do nome.
   - Reativar a filial não confere a pessoa.

   A alternativa é Pessoas recusar com 409 ("Esta pessoa é a filial código N. Inative a filial antes."). Nesse caso a conferência sai de um terceiro service, para não criar o ciclo.
2. **Barra inferior do celular** (em aberto em `pessoas.md`: "limite de 5 ícones quando entrar o próximo módulo"). Hoje cabem 5: Início, Pessoas, Auxiliares, Usuários e Logs. Com Filiais seriam 6, e o `secoesDaBarraInferior` **corta o Logs em silêncio**.
   **Padrão:** quando passar de 5, o 5º lugar vira **"Mais"** (ícone `Ellipsis`), que abre o submenu flutuante que já existe com o que sobrou. O pai com filhos sai achatado ("Cadastros auxiliares › Tipos de telefone"), como no Ctrl+K. É peça da casca, a cargo do `glass-design-system`, e reaproveita o movimento `submenu`.
   A alternativa é juntar a seção Cadastros num pai só no celular.

## 3. Backend

### 3.1 Migration `019-create-filial.xml` (última: 018; `include` no fim do `changelog-master.xml`)

Um changeSet `019-create-filial`. Comentário no topo com as regras: não duplica a pessoa, várias matrizes, código por contratante, a cor é dado do usuário.

| coluna | tipo | nulo | default / obs. |
|---|---|---|---|
| `id` | UUID | não | `pk_filial` |
| `tenant_id` | UUID | não | `fk_filial_tenant → tenant(id)` |
| `cod_filial` | BIGINT | não | |
| `pessoa_id` | UUID | não | FK composta abaixo |
| `tipo` | VARCHAR(10) | não | `MATRIZ` / `FILIAL` |
| `matriz_id` | UUID | sim | autorreferência; nula na matriz |
| `cor` | VARCHAR(7) | não | `#RRGGBB`, maiúsculas |
| `ativo` | BOOLEAN | não | `true` |
| `created_at` | TIMESTAMP WITH TIME ZONE | não | |
| `updated_at`, `created_by`, `updated_by` | como na 015 | sim | |
| `version` | BIGINT | não | `0` |

Índices, nesta ordem (o `uk_filial_id_tenant` vem antes da FK da matriz):
- `uk_filial_tenant_cod_filial (tenant_id, cod_filial)`, único;
- `uk_filial_tenant_pessoa (tenant_id, pessoa_id)`, único: uma pessoa é uma filial só;
- `uk_filial_id_tenant (id, tenant_id)`, único: alvo da autorreferência composta;
- `ix_filial_matriz (matriz_id)`.

FKs compostas (`docs/05`, "FK composta para filha de contratante"):
- `fk_filial_pessoa (pessoa_id, tenant_id) → pessoa(id, tenant_id)`;
- `fk_filial_matriz (matriz_id, tenant_id) → filial(id, tenant_id)`. Com `matriz_id` nulo o PostgreSQL não confere (MATCH SIMPLE), e é o que a matriz quer.

CHECKs (por `<sql>`, como na 015):
- `ck_filial_cod_filial CHECK (cod_filial > 0)`;
- `ck_filial_tipo CHECK (tipo IN ('MATRIZ','FILIAL'))`;
- `ck_filial_tipo_matriz CHECK ((tipo = 'MATRIZ' AND matriz_id IS NULL) OR (tipo = 'FILIAL' AND matriz_id IS NOT NULL))`;
- `ck_filial_matriz_outra CHECK (matriz_id IS NULL OR matriz_id <> id)`;
- `ck_filial_cor CHECK (cor ~ '^#[0-9A-F]{6}$')` (só maiúsculas: o mapper normaliza).

"A matriz é do tipo MATRIZ e está ativa" envolve outra linha e não cabe em CHECK: fica no service, com trava (§3.4).

### 3.2 Entidade e enum (`filial/entity`, `filial/enums`)

- `enums/TipoFilial`: `MATRIZ("Matriz")`, `FILIAL("Filial")`, com `rotulo()`.
- `entity/Filial extends TenantEntity`, com `@DynamicUpdate`, `@Getter @Setter @NoArgsConstructor`:
  - `Long codFilial`: `@Column(name="cod_filial", nullable=false, updatable=false)`;
  - `Pessoa pessoa`: `@ManyToOne(fetch=LAZY, optional=false) @JoinColumn(name="pessoa_id")`;
  - `TipoFilial tipo`: `@Enumerated(STRING)`, length 10;
  - `Filial matriz`: `@ManyToOne(fetch=LAZY) @JoinColumn(name="matriz_id")`;
  - `String cor`: length 7;
  - `boolean ativo = true`;
  - `boolean ehMatriz()`: `tipo == MATRIZ`.

### 3.3 DTOs (`filial/dtos`, records com `@Schema`)

- `FilialCreateDto`:
  - `@NotNull(message="Escolha a pessoa") UUID pessoaId`;
  - `@NotNull(message="Escolha o tipo") TipoFilial tipo`;
  - `UUID matrizId`;
  - `@NotBlank(message="Escolha a cor") @Pattern(regexp="^#[0-9A-Fa-f]{6}$", message="Cor deve estar no formato #RRGGBB") String cor`.
- `FilialUpdateDto`: os mesmos campos + `@NotNull Long version`.
- `FilialPessoaDto(UUID id, Long codPessoa, TipoPessoa tipoPessoa, String nome, String nomeFantasia, String documento, boolean ativo)`.
  - `documento` = CPF ou CNPJ, só dígitos (a tela formata).
  - `toString` sem o documento.
- `FilialSelectDto(UUID id, Long codFilial, String nome, TipoFilial tipo, String cor)`.
  - `nome` é o nome da pessoa.
  - **Sem documento** (§2.2).
- `FilialResponseDto`, nesta ordem: `id`, `codFilial`, `tipo`, `FilialPessoaDto pessoa`, `FilialSelectDto matriz` (nulo na matriz), `cor`, `ativo`, `createdAt`, `updatedAt`, `createdBy`, `updatedBy`, `criadoPorNome`, `alteradoPorNome`, `version`.
  - Serve à lista, à exportação e ao Form: é pequena, e não há dado que só um dos dois use.

### 3.4 Mapper, repository e service

**`mapper/FilialMapper`** (final, estático):
- `toEntity(FilialCreateDto, Pessoa, Filial matriz)`;
- `atualizarEntidade(Filial, FilialUpdateDto, Pessoa, Filial matriz)`: nunca toca em `codFilial`;
- `normalizarCor(String)`: `trim` + `toUpperCase(Locale.ROOT)`;
- `toPessoaDto(Pessoa)`;
- `toSelectDto(Filial)`;
- `toResponseDto(Filial, Map<UUID,String> nomes, boolean plataforma)`, como o `PessoaMapper.toResponseDto`.

**`repository/FilialRepository`** (JPQL com nome; o tenant é automático; parâmetro String com `CAST`):

| Método | Consulta |
|---|---|
| `buscarPorId(UUID id)` | `SELECT f FROM Filial f JOIN FETCH f.pessoa LEFT JOIN FETCH f.matriz m LEFT JOIN FETCH m.pessoa WHERE f.id = :id` |
| `buscarComFiltros(Long codFilial, String busca, String documento, TipoFilial tipo, Boolean ativo, Pageable)` → `Page<Filial>` | Mesmos `JOIN FETCH` (alias `p` e `mp`). Filtros: `(:codFilial IS NULL OR f.codFilial = :codFilial)`, `(:busca IS NULL OR p.nomeBusca LIKE CONCAT('%', CAST(:busca AS string), '%'))`, `(:documento IS NULL OR p.cpf LIKE … OR p.cnpj LIKE …)` (com `CAST`), `(:tipo IS NULL OR f.tipo = :tipo)`, `(:ativo IS NULL OR f.ativo = :ativo)`.<br>`ORDER BY COALESCE(mp.nome, p.nome), COALESCE(m.id, f.id), CASE WHEN m.id IS NULL THEN 0 ELSE 1 END, p.nome, f.id`.<br>**`countQuery` explícito**, sem fetch: `SELECT COUNT(f) FROM Filial f JOIN f.pessoa p WHERE <os mesmos filtros>`. |
| `buscarParaSelecao(String busca, TipoFilial tipo, UUID ignorarId, Pageable limite)` | `JOIN FETCH f.pessoa p WHERE f.ativo = true AND (busca em p.nomeBusca) AND (:tipo IS NULL OR f.tipo = :tipo) AND (:ignorarId IS NULL OR f.id <> :ignorarId) ORDER BY p.nome`. O service passa `PageRequest.of(0, 20)`. |
| `@Lock(PESSIMISTIC_WRITE) travarPorIds(Collection<UUID> ids)` | `SELECT f FROM Filial f WHERE f.id IN :ids ORDER BY f.id`. **Sem fetch:** o PostgreSQL recusa `FOR UPDATE` no lado nulo de um outer join. |
| `buscarProximoCodigo()` | `SELECT COALESCE(MAX(f.codFilial), 0) + 1 FROM Filial f` |
| `buscarCodigoPorPessoa(UUID pessoaId, UUID ignorarId)` → `Optional<Long>` | `SELECT f.codFilial FROM Filial f WHERE f.pessoa.id = :pessoaId AND f.id <> :ignorarId` (na criação, UUID sentinela, como em Pessoas) |
| `contarFilhas(UUID matrizId)` → `long` | `SELECT COUNT(f) FROM Filial f WHERE f.matriz.id = :matrizId` |
| `contarFilhasAtivas(UUID matrizId)` → `long` | o mesmo, com `AND f.ativo = true` |

**`service/FilialService`** (forma do `PessoaService`).
- **Todo método começa com `SecurityUtils.exigirTenantSelecionado()`**, inclusive as leituras e o `/selecao`.
- Constantes:
  - `ORDENAVEIS = Set.of()`. O `PaginacaoUtils.validar(p, ORDENAVEIS, Sort.unsorted())` recusa qualquer `sort` com 422, e a ordem é a do JPQL.
  - `UK_CODIGO = "uk_filial_tenant_cod_filial"`, `UK_PESSOA = "uk_filial_tenant_pessoa"`.
  - Mensagens: `MSG_NAO_ENCONTRADA = "Filial não encontrada."` e `MSG_VERSAO = "Esta filial foi alterada por outro usuário. Recarregue e tente de novo."`.
- Dependências: `FilialRepository`, `PessoaService` (só `buscarEntidade`), `UsuarioService` (`buscarNomes`), `RepetirSeCodigoRepetido`.
- Logs: só o id e a operação.

| Método | Regras |
|---|---|
| `listar(codFilial, busca, documento, tipo, ativo, pageable)` → `PaginaDto<FilialResponseDto>`, `@Transactional(readOnly=true)` | `busca` passa pelo `TextoBusca.normalizar`; `documento`, pelo `DocumentoValidator.normalizar` (sem máscara; vazio vira `null`). São 3 consultas: página, contagem e `buscarNomes`. |
| `buscarPorId(id)` → `FilialResponseDto` | 404 com `MSG_NAO_ENCONTRADA`. |
| `listarParaSelecao(busca, tipo, ignorarId)` → `List<FilialSelectDto>` | Só as ativas, até 20. |
| `criar(dto)`, **sem `@Transactional`** | `repetir.executar(UK_CODIGO, () -> gravarNova(dto))`. A violação de `UK_PESSOA` numa corrida (`RestricaoViolada`) vira o mesmo 409 de "já é filial". |
| `gravarNova(dto)` (privado) | 1. `pessoa = pessoaService.buscarEntidade(dto.pessoaId())`: 404.<br>2. `exigirPessoaLivre(pessoa, null)`.<br>3. `matriz = resolverMatriz(dto.tipo(), dto.matrizId(), null)`: trava a matriz.<br>4. `toEntity`, `setCodFilial(buscarProximoCodigo())` e `saveAndFlush`.<br>5. `montarResposta`. |
| `atualizar(id, dto)`, `@Transactional` | 1. `travarPorIds({id} ∪ {dto.matrizId, se FILIAL})`. Em ordem de id, sem deadlock entre duas matrizes que viram filial uma da outra. `id` fora do resultado → 404.<br>2. `f = buscarPorId(id)`; `dto.version ≠ f.version` → 409 `MSG_VERSAO`.<br>3. Pessoa mudou → `buscarEntidade` (404) + `exigirPessoaLivre(nova, id)`. Não mudou → não confere.<br>4. `f.ehMatriz() && dto.tipo == FILIAL && contarFilhas(id) > 0` → `ConflitoCampoException("tipo", "Esta matriz tem N filial(is). Mude a matriz delas antes de transformá-la em filial.")`.<br>5. Matriz: FILIAL com a mesma matriz de antes → mantém, sem reconferir. Senão → `resolverMatriz(dto.tipo, dto.matrizId, id)`.<br>6. `atualizarEntidade`, `saveAndFlush` (`UK_PESSOA` → 409 com campo), `montarResposta`. |
| `inativar(id)`, `@Transactional` | Trava `{id}`; não existe → 404; já inativa → nada (204).<br>Matriz com `contarFilhasAtivas > 0` → `ConflitoException("Esta matriz tem 1 filial ativa. Inative-a antes.")` ou "Esta matriz tem N filiais ativas. Inative-as antes.". |
| `ativar(id)`, `@Transactional` | Trava `{id, matrizId}`; não existe → 404; já ativa → nada.<br>Filial com a matriz inativa → `ConflitoException("A matriz desta filial está inativa. Reative a matriz antes.")`. |
| `exigirPessoaLivre(Pessoa p, UUID ignorarFilialId)` (privado) | `!p.isAtivo()` → `ConflitoCampoException("pessoaId", "Esta pessoa está inativa.")`.<br>`buscarCodigoPorPessoa` com valor → `ConflitoCampoException("pessoaId", "Esta pessoa já é a filial código N.")`. |
| `resolverMatriz(tipo, matrizId, propriaId)` (privado) | MATRIZ com `matrizId` → `CampoInvalidoException("matrizId", "Matriz não responde a outra matriz. Deixe a matriz em branco.")` (400).<br>FILIAL sem `matrizId` → `("matrizId", "Informe a matriz desta filial.")` (400).<br>`matrizId == propriaId` → `("matrizId", "A filial não pode ser a própria matriz.")` (400).<br>Trava pela `travarPorIds` (no `atualizar` já veio travada); não volta → `NaoEncontradoException("Matriz não encontrada.")`.<br>`!ehMatriz()` → `ConflitoCampoException("matrizId", "A matriz escolhida é uma filial. Escolha uma matriz.")`.<br>Inativa → `ConflitoCampoException("matrizId", "A matriz escolhida está inativa.")`. |

**Por que travar a matriz:** criar uma filial em M, inativar M e transformar M em filial travam todos a linha de M antes de conferir. Sem a trava, duas requisições juntas deixariam uma filial ativa numa matriz inativa, ou uma filial respondendo a outra filial. Isso o banco não pega, porque envolve outra linha.

**Os defeitos da pesquisa e como ficam:**

| Defeito | Correção |
|---|---|
| SQL nativo com `unaccent` e segunda consulta por ids | JPQL com `nome_busca` + `JOIN FETCH` + `countQuery` |
| Tenant lido à mão | Filtro automático + `exigirTenantSelecionado` |
| Sem `version` | `version` no `PUT` |
| Corrida matriz × filha | Trava |
| `/select` com documento e aberto | Seleção sem documento; o combo de pessoa com `PESSOAS_LER` |
| Do antigo: matriz qualquer, exclusão física, cor validada só no cadastro, sem CHECK | Já resolvidos pelo desenho do 2.0, mantido aqui |

### 3.5 Controller `FilialController` (`/api/filiais`, `@Tag("Filiais")`)

| Método | Rota | Authority |
|---|---|---|
| GET | `/api/filiais?codFilial=&busca=&documento=&tipo=&ativo=&page=&size=` (`codFilial @Positive`, `busca @Size(max=100)`, `documento @Size(max=18)`, `@PageableDefault(size=20)` **sem sort**) | `FILIAIS_LER` |
| GET | `/api/filiais/selecao?busca=&tipo=&ignorarId=` (`busca @Size(max=100)`) → até 20 `FilialSelectDto`, só as ativas | `ACESSO_LIBERADO` |
| GET | `/api/filiais/{id}` | `FILIAIS_LER` |
| POST | `/api/filiais` → 201 | `FILIAIS_ESCREVER` |
| PUT | `/api/filiais/{id}` | `FILIAIS_ESCREVER` |
| PATCH | `/api/filiais/{id}/inativar` e `/ativar` → 204 | `FILIAIS_ESCREVER` |

### 3.6 Permissões

- `Tela`, novas: `FILIAL_LIST("filial-list", "Filiais — lista")` e `FILIAL_FORM("filial-form", "Filiais — cadastro")`.
- `GrupoLiberacao`: grupo **novo** `FILIAIS("Filiais", List.of(Tela.FILIAL_LIST, Tela.FILIAL_FORM), List.of())`.
  - Declarado logo depois de `PESSOAS` e antes de `CADASTROS_AUXILIARES`.
  - Javadoc: "Liberar Pessoas não abre Filiais; o combo de filiais é aberto a todos (`/selecao`); escolher a pessoa da filial exige `PESSOAS_LER`."
- Sem ação extra. O ADMIN recebe o grupo sozinho; o catálogo do `UsuarioForm` vem da API.

### 3.7 Testes: `filial/FilialIntegracaoTest` (copia o `PessoaIntegracaoTest`)

**Os 4 obrigatórios:**
- `caminhoFeliz`:
  1. cria pessoa PJ e matriz; cria filial;
  2. a lista sai na ordem matriz → filial;
  3. troca a cor (`#3b82f6` → grava `#3B82F6`);
  4. inativa a filial, inativa a matriz, reativa a matriz, reativa a filial.
- `validacaoRecusada`:
  - cor `azul` e `#12345` → 400 `erros[campo=cor]`;
  - `pessoaId` nulo → 400;
  - FILIAL sem matriz → 400 `erros[campo=matrizId]`;
  - MATRIZ com matriz → 400.
- `isolamentoEntreTenants`:
  - a filial de A não aparece na lista nem no `/selecao` de B;
  - GET, PUT e PATCH com id de A dentro de B → 404;
  - POST em B com a pessoa de A → 404; com a matriz de A → 404;
  - a mesma pessoa (CNPJ igual) vira filial nos dois contratantes.
- `parLerEscrever`:
  - com LER: GET 200; POST, PUT e PATCH 403;
  - sem o grupo: GET 403;
  - `/selecao` 200 para um usuário sem o grupo;
  - superadmin na plataforma → 422 nas leituras e no `/selecao`.

**Código:**
- `codigo_primeiro1_segundo2_porContratante`;
- `codigo_ignoradoNoCorpo`;
- `codigo_doisCriarSimultaneosSem409`;
- `filtroCodigoNaoAchaOutroContratante`.

**Regras:**
- `pessoaJaFilial409ComCampoECodigo`; `pessoaInativa409`;
- `matrizQueEhFilial409`; `matrizInativa409`; `propriaComoMatriz400`;
- `matrizComFilhasNaoViraFilial409`;
- `inativarMatrizComFilialAtiva409ComContagem` (1 e 2 filiais: singular e plural);
- `reativarFilialDeMatrizInativa409`;
- `filialInativaDeMatrizInativaAindaTrocaCor200`;
- `trocarPessoaExigePessoaLivreEAtiva`;
- `versaoAntiga409`;
- `sortRecusado422`.

**Lista e seleção:**
- `ordemAgrupada`: 2 matrizes ("Beta" e "Alfa"), as filiais de cada uma com nomes que cruzam a ordem alfabética das matrizes;
- `filtros`: busca sem acento pelo nome e pela fantasia, documento parcial com máscara, tipo, ativo e todos nulos;
- `selecaoSoAtivasPorTipoEIgnoraId`;
- `selecaoSemDocumento`: o JSON não tem `documento`, `cpf` nem `cnpj`;
- `listaSemNMais1`: no máximo 3 comandos (estatísticas do Hibernate, como em Pessoas).

**Concorrência e banco:**
- `criarFilialEInativarMatrizAoMesmoTempo` (em paralelo, como o teste de vínculos): nunca termina com filial ativa em matriz inativa; nenhum 500.
- `checksDoBanco`: por `JdbcTemplate`, MATRIZ com `matriz_id` e FILIAL sem ele violam `ck_filial_tipo_matriz`; `matriz_id = id` viola `ck_filial_matriz_outra`.

`ArquiteturaTest` verde e `mvnw verify` verde (com o Docker ligado).

## 4. Front

### 4.1 Kit (`glass-design-system`, antes das telas)

**Como a cor livre convive com "nenhuma cor literal fora de `tokens.css`":**
- **Cor do sistema** (as 8 sugeridas): é token. `--cor-registro-1` … `--cor-registro-8` em `tokens.css`, os mesmos nos dois temas: são dados, não pele. Valores do 2.0: `#3B82F6` Azul, `#10B981` Verde, `#F59E0B` Âmbar, `#EF4444` Vermelho, `#8B5CF6` Violeta, `#EC4899` Rosa, `#14B8A6` Turquesa, `#64748B` Ardósia. Nenhum hex em `.tsx`.
- **Cor do registro** (a que vem do banco): **não é literal no código**, é dado. Só o kit a aplica:
  - numa variável CSS: `style={{ '--cor-do-registro': cor }}`;
  - com a classe `bg-[var(--cor-do-registro)]`;
  - **só** na bolinha e no anel de seleção.
  - Nunca como cor de texto nem como fundo de texto, e a tela nunca escreve `style` de cor.
- **Antes de aplicar**, o kit confere `^#[0-9A-Fa-f]{6}$`. Valor fora disso não é aplicado (bolinha neutra), o que fecha injeção de CSS. O banco também tem o CHECK.
- **Contraste (WCAG 1.4.11):** a bolinha tem sempre o anel `--line-strong`. Assim a borda aparece em qualquer cor, nos dois temas, e a cor nunca é o único portador da informação (o nome está ao lado).

| Peça | Contrato |
|---|---|
| `TCor` (novo; o do 2.0 vestido de vidro, `docs/07` §3.2) | `name`, `label`, `required?`, `ajuda?`, `disabled?`, `width?` (padrão `conteudo`, já em `LARGURA_PADRAO`).<br>As 8 sugeridas viram um `role="radiogroup"` com setas, como a escolha de destaque do `EditorAparencia`, e cada bolinha tem o nome ("Azul"...).<br>"Outra" usa o `<input type="color">` do sistema (cru **dentro** do kit, permitido) e mostra "Outra (#A1B2C3)" quando a cor gravada não é sugerida.<br>Grava `#RRGGBB` em maiúsculas. Lê o hex das sugeridas com `getComputedStyle(document.documentElement)` e as variáveis `--cor-registro-N`; o `kit.test` faz o stub.<br>Só leitura: sem clique, a escolhida marcada.<br>`data-kit="TCor"`, `data-largura="conteudo"`. |
| `TCorMarca` (novo, só exibição) | `cor: string`, `tamanho?: 'sm' \| 'md'` (12 e 16 px), `rotulo?` (vira `title` e `aria-label`; sem ele, `aria-hidden`).<br>Para a grade, os cartões do celular e os combos futuros. |
| Exportar no `index.ts` | `TCor`, `TCorMarca`, `type TCorProps`. |
| Catálogo `/design-system` | `TCor` (vazio, sugerida, "Outra", erro, só leitura) e `TCorMarca` numa grade, nos dois temas e nos 6 destaques. |
| `docs/07` | §0 tira o `TCor` de "Não existem"; §3.2 com as props reais; resumo do topo com o `TCor` e o `TCorMarca`; uma nota "cor de registro". |
| `medir-campos.mjs` | Já conhece `TCor: 'conteudo'`. Conferir. |
| **Só se a P2 ficar no padrão:** casca, item "Mais" | `secoesDaBarraInferior` põe "Mais" no 5º lugar quando passar de 5, com os restantes achatados por `telasDoMenu`, e abre o submenu flutuante que já existe. Teste em `navegacao.test`. |

**Movimento:** nada novo.
- A seleção do `TCor` usa a transição de anel que já existe (tokens de `motion/tokens.ts`).
- O "Mais" reaproveita `submenu`.
- O `motion-designer` não entra.

### 4.2 Menu e rotas (na execução da FilialList)

- `app/menu.ts`:
  - `TELAS_DE_CADASTRO` ganha, depois de Pessoas: `{ tela: 'filial-list', to: '/cadastros/filiais', label: 'Filiais', icon: Store, escopo: 'contratante', descricao: 'Matrizes e filiais do contratante.' }`;
  - `TITULOS` ganha `[/^\/cadastros\/filiais(\/|$)/, 'Filiais']`;
  - `menu.test.ts`: quem tem só `FILIAIS` vê Filiais em Cadastros.
- `modules/filiais/routes.tsx`, incluída em `app/rotas.tsx` depois de `rotasPessoas`:
  - `/cadastros/filiais` → `ExigeTela tela="filial-list"`;
  - `/cadastros/filiais/novo` e `/:id` → `tela="filial-form"`;
  - todas `escopo="contratante"` e lazy.
- O Início e o Ctrl+K pegam Filiais sozinhos (`telasDoMenu`).

**`modules/filiais/api/filiais.ts`:**
- `listar`, `buscar`, `criar`, `alterar`, `inativar`, `ativar` e `selecionar(busca?, tipo?, ignorarId?)`;
- os zod `filialSchema` (com `pessoa` e `matriz` aninhados) e `filialSelectSchema`;
- `rotuloDaFilial = (f) => cod + " · " + nome`;
- `TIPO_FILIAL_OPCOES = [{valor:'MATRIZ', rotulo:'Matriz'}, {valor:'FILIAL', rotulo:'Filial'}]`.

### 4.3 FilialList: **cópia direta do modelo List** (`docs/07` §4.1)

Parte da `PessoaList.tsx`, que já é a cópia do `ContratanteList` com código, documento e exportação.

Arquivos: `pages/FilialList.tsx`, `schemas/filialFiltros.ts` + teste (`Filtros`, `FILTROS_VAZIOS` com `ativo: 'true'`, `paraConsulta` com `paraNumero` no código, `colunasExportadas`).

O que troca:
- `useSomenteLeitura('FILIAIS')`;
- `queryKey ['filiais', 'lista', aplicados, pagina]`;
- **sem `sort`** (a API recusa);
- título "Filiais"; breadcrumb `['Cadastros', 'Filiais']`.

Filtros, um por `TRow`:
1. `TEntry name="codFilial" label="Código" mascara="inteiro" width="codigo" maxLength={10}`
2. `TEntry name="busca" label="Nome ou fantasia" maxLength={100}` (padrão `metade`)
3. `TEntry name="documento" label="CPF ou CNPJ" mascara="cpfCnpj"` (padrão `cnpj`)
4. `TCombo name="tipo" label="Tipo" opcoes={TIPO_FILIAL_OPCOES} vazio="Todos"` (automático → `situacao`)
5. `TCombo name="ativo" label="Situação" opcoes={SITUACAO_OPCOES} vazio="Todas"` (abre e limpa em "Ativo", como em Pessoas)

Rodapé: Buscar · Limpar · Novo (`!somenteLeitura`) · Exportar · Pdf.

Colunas:
1. **Código**: `numerica`, `w-px whitespace-nowrap`.
2. **Nome**: `principal: true`.
   - `TCorMarca cor={f.cor}` + o nome da pessoa;
   - a fantasia embaixo, em `text-muted`;
   - `TBadge tom="alerta"` "Pessoa inativa" quando `!f.pessoa.ativo` (P1).
3. **CPF/CNPJ**: `formatarDocumento`, `w-px whitespace-nowrap tabular-nums`.
4. **Tipo**: `TBadge` (Matriz `tom="destaque"`, Filial `tom="neutro"`), `w-px`.
5. **Matriz**: `rotuloDaFilial(f.matriz)` ou "—", `secundaria`.
6. **Situação**: `TBadge`.

A grade não ordena por coluna: a ordem é a da API (matriz e as suas filiais).

Ações:
- editar e inativar/reativar com `useQuestion`;
- o 409 da regra ("Esta matriz tem 2 filiais ativas…") sai pelo `msg.erroApi(e)`.

Exportar e Pdf (`DocumentoLista titulo="Filiais"`): Código · Nome (com "· fantasia") · CPF/CNPJ (`semQuebra`) · Tipo · Matriz · Situação. A cor não vai.

### 4.4 FilialForm: **cópia direta do modelo Form** (`docs/07` §4.2)

Parte da `PessoaForm.tsx`, pelo `TDBCombo` com `acao` e pelo `PessoaRapidaModal` fora do `TForm`.

Arquivos: `pages/FilialForm.tsx`, `schemas/filial.ts` + teste.
- `Dados { pessoaId, tipo, matrizId, cor }`, com zod:
  - `pessoaId` obrigatório: "Escolha a pessoa";
  - `cor` pela regex: "Escolha a cor";
  - `superRefine`: FILIAL exige `matrizId` ("Informe a matriz").
- `VAZIO = { pessoaId: '', tipo: 'MATRIZ', matrizId: '', cor: '' }`.
- `paraForm`.
- `paraCorpo`: `matrizId: null` na MATRIZ; `cor` em maiúsculas.

O que troca:
- `useSomenteLeitura('FILIAIS')`;
- `lePessoas = usuario.permissoes.includes('PESSOAS_LER')` e `escrevePessoas = !useSomenteLeitura('PESSOAS')`;
- títulos "Nova filial", "Editar filial", ou "Filial" para quem só lê;
- breadcrumb `['Cadastros', 'Filiais', salvo?.pessoa.nome ?? 'Nova']`, `coreografia="formulario"`;
- erro ao carregar → volta para `/cadastros/filiais`.

Campos, um por `TRow`:
1. `TEntry label="Código" value={salvo?.codFilial ?? ''} placeholder="Automático" disabled width="codigo"`
2. `TDBCombo name="pessoaId" label="Pessoa" required autoFocus={!somenteLeitura}` (padrão `metade`):
   - `buscar={(t) => pessoasApi.selecionar(t)}`, com rótulo `rotuloDaPessoa`;
   - `rotuloInicial` = `codPessoa · nome` do salvo;
   - `disabled={!lePessoas}`, com `ajuda="Escolher a pessoa exige acesso a Pessoas."`;
   - `acao={!somenteLeitura && escrevePessoas && <TButton variant="novo" label="" aria-label="Cadastrar pessoa" onClick={() => setRapida(true)} />}`.
3. `TCombo name="tipo" label="Tipo" opcoes={TIPO_FILIAL_OPCOES} required` (automático → `situacao`).
   - `ajuda`: Matriz → "Um negócio próprio. Pode haver mais de uma matriz."; Filial → "Responde a uma matriz."
   - Trocar para Matriz limpa `matrizId` e o rótulo.
4. **Só Filial:** `TDBCombo name="matrizId" label="Matriz" required` (padrão `metade`):
   - `buscar={(t) => filiaisApi.selecionar(t, 'MATRIZ', id)}`, com rótulo `rotuloDaFilial`;
   - `rotuloInicial` vem do `salvo.matriz`.
5. `TCor name="cor" label="Cor de identificação" required ajuda="Identifica a filial nas listas e nos combos das outras telas."` (largura do conteúdo).
6. `TPanel title="Dados da pessoa"`, só quando há `pessoaId`:
   - `subtitle`: "CPF ou CNPJ, inscrições e endereço ficam no cadastro da pessoa." Sem `lePessoas`, o `subtitle` vira "Você não tem acesso ao cadastro de Pessoas, onde ficam os dados desta filial." e o painel não tem corpo.
   - `actions={lePessoas && <TButton variant="secondary" icone={ExternalLink} label="Abrir em Pessoas" />}`, que navega para `/cadastros/pessoas/<pessoaId>`;
   - os dados vêm de `useQuery(['pessoas', pessoaId], pessoasApi.buscar, { enabled: lePessoas && !!pessoaId })`, no mesmo cache do PessoaForm.
   - Todos os campos são `TEntry … disabled`, com "—" quando vazio:
     - `CPF` (`cpf`) ou `CNPJ` (`cnpj`), formatado;
     - **só PJ:** "Razão social" (`metade`), "Nome fantasia" (`metade`), "Inscrição estadual" (`curto`) e "Inscrição municipal" (`curto`), cada um na sua `TRow`;
     - endereço principal (ou o 1º), em 3 `TRow`:
       - "Rua" (`longo`);
       - grupo natural: "CEP" (`cep`) · "Número" (`curto`) · "Complemento" (`curto`);
       - grupo natural: "Bairro" (`curto`) · "Cidade" (`medio`) · "UF" (`uf`);
     - sem endereço: `TEntry label="Endereço" value="Nenhum endereço cadastrado" disabled`.
   - `TBadge tom="alerta"` "Pessoa inativa" na ajuda do combo Pessoa quando `!salvo.pessoa.ativo` (P1).
7. `TAuditoria registro={salvo.data}`. A Situação fica na grade: o `UpdateDto` não recebe `ativo`.
8. `TFormFooter`: Salvar · Novo · Voltar.

**Cadastro rápido:** `PessoaRapidaModal` fora do `TForm`, só quando `!somenteLeitura && escrevePessoas`.
- Recebe `tiposCadastro` e `tiposTelefone` de `selecionarTipos` (`chaveDaSelecao`), como no PessoaForm.
- `onCriada(p)`: `setValue('pessoaId', p.id)`, o rótulo `rotuloDaPessoa(p)`, invalida `['pessoas']` e fecha.

**Erros:**
- `msg.erroApi(e, form)` marca `pessoaId`, `matrizId`, `tipo` ou `cor` no 400 e no 409 com campo;
- o 409 de versão oferece Recarregar.

### 4.5 Relatório

Só o Pdf da List, pelo `DocumentoLista`. O agente `relatorios` não entra.

## 5. Riscos e como o plano evita

| Risco | Prevenção |
|---|---|
| Superadmin na plataforma lê ou grava filiais de todos (ROOT não filtra) e o MAX+1 sai global | `exigirTenantSelecionado()` em todo método, inclusive no `/selecao`; teste com 422. |
| Filial apontando para pessoa ou matriz de outro contratante (IDOR) | Busca filtrada (404) **e** FKs compostas `(pessoa_id, tenant_id)` e `(matriz_id, tenant_id)`. |
| Corrida: filial criada numa matriz que está sendo inativada, ou matriz que vira filial enquanto ganha uma filha | `travarPorIds` em ordem de id antes de conferir; teste em paralelo. |
| Deadlock entre duas matrizes trocadas ao mesmo tempo | A trava é sempre em ordem de id e sem `JOIN FETCH`. |
| Mesma pessoa em duas filiais numa corrida | `uk_filial_tenant_pessoa` traduzido para 409 com campo. |
| Código repetido | `RepetirSeCodigoRepetido`; `criar` sem `@Transactional`; teste em paralelo. |
| Hierarquia quebrada por chamada direta | CHECKs `ck_filial_tipo_matriz` e `ck_filial_matriz_outra`; profundidade 1 garantida (a matriz é sempre MATRIZ, conferida com trava). |
| N+1 na lista e no combo (defeito do antigo) | `JOIN FETCH` da pessoa, da matriz e da pessoa da matriz; `countQuery` sem fetch; teste com no máximo 3 comandos. |
| `countQuery` faltando com `JOIN FETCH` (o Spring falha na subida) | `countQuery` explícito no `buscarComFiltros`. |
| LGPD: CPF de filial pessoa física | O `/selecao` aberto não leva documento; a lista (com CPF/CNPJ) exige `FILIAIS_LER`; os dados completos só com `PESSOAS_LER`; `toString` do `FilialPessoaDto` sem documento; log só com id. |
| Escalada: escolher pessoa sem ler Pessoas | O combo usa `/api/pessoas/selecao` (`PESSOAS_LER`), e o cadastro rápido, `POST /api/pessoas` (`PESSOAS_ESCREVER`). A tela só esconde; quem barra é a API. |
| Injeção de CSS pela cor | `@Pattern` no DTO, CHECK no banco e conferência no kit antes de aplicar. A tela nunca escreve `style`. |
| Contraste de cor livre (amarelo claro no tema claro, ardósia no escuro) | Anel `--line-strong` sempre; a cor nunca é a única informação; o `revisor-ui` confere nos dois temas. |
| Logs cortado da barra do celular | P2 ("Mais"). |
| A primeira dependência entre módulos do front virar emaranhado | Só filiais → pessoas, só pela API, pelo `rotuloDaPessoa` e pelo modal. O `guardiao-layout` e o `revisor-ui` não precisam mexer em Pessoas. |

## 6. Ordem de execução (branch `timeero/filiais`, a partir da `main`)

| Etapa | Quem | O quê | Depende de | Paralelo com |
|---|---|---|---|---|
| **E0** | dono | Merge de Pessoas na `main`; responde a P1 e P2; aprova o plano | | |
| **E1a** | `dev-backend` | §3 inteiro: 019, módulo `filial`, `Tela` e `GrupoLiberacao`, `FilialIntegracaoTest` → `mvnw verify` | E0 | E1b |
| **E1b** | `glass-design-system` | §4.1: tokens `--cor-registro-*`, `TCor`, `TCorMarca`, catálogo, `docs/07`; o "Mais" da casca se a P2 ficar no padrão | E0 | E1a |
| **E2** | `revisor-backend` ‖ `seguranca` | Revisão do backend | E1a | E3 |
| **E3** | `frontend-modulos` (1 execução) | **FilialList** + `api/filiais.ts` + `filialFiltros` + `routes.tsx` (as 3 rotas; o Form entra como lazy vazio até a E4) + menu e `TITULOS` | E1b (o contrato da §3.5 basta; não precisa do back rodando) | E2 |
| **E4** | `frontend-modulos` (1 execução) | **FilialForm** + `schemas/filial.ts` + o modal | E3 | |
| — | orquestrador | `npm run build` + `vitest` | E4 | |
| **E5** | `guardiao-layout` ‖ `revisor-ui` ‖ `seguranca` (parte do front) | Passada visual única e revisões | E4 | |
| **E6** | `qa` → correções (no máximo 2 voltas) → `docs/negocio` (§7) | | E5 | |

**Kit e movimento:**
- **Kit: peças novas** `TCor` e `TCorMarca` (e o "Mais" da casca, se a P2 ficar no padrão). Ficam a cargo do `glass-design-system`, na E1b, antes das telas.
- **Movimento: nada novo.** O `motion-designer` não entra.

**Telas:** as duas são **cópia direta de modelo**: FilialList (List) e FilialForm (Form). Nenhuma foge do padrão, então nenhuma vai para o Opus. Medir o custo de novo (memória "Custo do /timeero").

**Foco dos conferentes:**
- `revisor-backend`:
  - a ordem trava → lê → confere versão no `atualizar`;
  - `travarPorIds` sem fetch;
  - o `ORDER BY` agrupado e o `countQuery`;
  - `CAST` em todo String opcional;
  - `ORDENAVEIS` vazio;
  - `criar` sem `@Transactional` e o nome do índice no `repetir`;
  - nenhuma entidade em DTO (`FilialPessoaDto` e `FilialSelectDto` aninhados);
  - a FK autorreferente composta e a ordem dos índices na 019.
- `seguranca`:
  - `exigirTenantSelecionado` em todo método;
  - FKs compostas e 404 de outro contratante;
  - `/selecao` `ACESSO_LIBERADO` sem documento;
  - o combo de pessoa com `PESSOAS_LER`;
  - a cor validada nas três camadas (DTO, CHECK e kit);
  - `toString` e logs;
  - a corrida matriz × filha.
- `guardiao-layout`:
  - FilialList: filtros e larguras, `TCorMarca` na grade e nos cartões do celular, Tipo automático em `situacao`;
  - FilialForm: Pessoa com `acao`, Matriz aparecendo e sumindo, `TCor` com largura do conteúdo;
  - o painel só leitura com os grupos naturais CEP · Número · Complemento e Bairro · Cidade · UF;
  - tudo a 1440, 768 e 360 px, nos dois temas;
  - a barra inferior com "Mais".
- `revisor-ui` (entra porque o kit mudou):
  - o `TCor` como radiogroup (setas, foco visível, nome das cores, "Outra" pelo teclado);
  - o anel da bolinha com as 8 sugeridas e com cores-limite (`#FFFF00`, `#111111`) nos dois temas e nos 6 destaques;
  - nenhum hex em `.tsx`;
  - o "Mais": foco preso e devolvido, `aria-expanded`.
- `qa`:
  - bateria entre dois contratantes;
  - LER sem ESCREVER; FILIAIS sem PESSOAS (combo travado, painel com aviso, a cor ainda se altera);
  - as regras de 409 pela tela;
  - inativar a matriz com filiais;
  - criação simultânea;
  - Pdf;
  - dados de demonstração: em cada contratante Demo, 1 matriz com 2 filiais e uma 2ª matriz, com cores diferentes.

## 7. Decisões novas para `docs/negocio/`

- **`filiais.md` (novo; entra no índice do `README.md`)**, na forma das outras notas:
  - **Regras vigentes:**
    - aponta para pessoa (física ou jurídica), uma pessoa = uma filial;
    - várias matrizes; os 409/400 da §3.4;
    - sem exclusão; cor livre `#RRGGBB`; `cod_filial`;
    - `/selecao` aberto sem documento; escolher a pessoa exige `PESSOAS_LER`;
    - lista agrupada; Tipo = Matriz e sem cor no Novo.
  - **Decisões do dono de 20/11/2026:** sem vínculo usuário-filial nem filial atual; cor livre como dado do usuário; base na `main`; as respostas de P1 e P2.
  - **Em aberto:** `buscarAtiva` para os módulos que usarem filial; a bolinha nos combos dessas telas (`TDBCombo` com marca).
- **`decisoes.md`:** uma linha por decisão de 20/11 (as 3) e uma por resposta (P1, P2).
- **`eroerp-referencias.md`**, seção Filiais: marcar as duas "Decisões em aberto" como decididas (com link para `filiais.md`); acrescentar ao "O que não copiar" o `/select` com documento e o combo de pessoa aberto.
- **`pessoas.md`:** tirar do "Em aberto" o limite de 5 ícones (resolvido pela P2); se a P1 mudar, registrar a regra de inativar.
- **`codigo-sequencial.md`:** `cod_filial` em uso; trocar o exemplo "emitente" por "filial".
- **`aparencia-e-movimento.md`:** cor de registro = dado do usuário, aplicada só pelo kit, sugeridas em token.
- **Docs técnicos:**
  - `docs/04`: grupo `FILIAIS`, telas e rotas;
  - `docs/05`: FK composta autorreferente (`matriz_id`), nula não conferida;
  - `docs/07`: `TCor`, `TCorMarca` e a nota "cor de registro"; o "Mais";
  - `docs/01`: referência inexistente no corpo = 404 (filial) contra 400 com campo (filhas de pessoa); deixar escrito quando vale cada um;
  - `CLAUDE.md`: na regra "nenhuma cor literal fora de `tokens.css`", a ressalva "cor de registro vinda do banco, aplicada só pelo `TCor`/`TCorMarca`". **Mudança do dono:** o orquestrador propõe e o Eduardo aprova.

---

## Aprovação (20/11/2026)

Plano aprovado pelo Eduardo, com as respostas padrão das duas perguntas:
1. **Pessoa inativada que é filial ativa:** como no 2.0. Pessoas não bloqueia, e a filial mostra o aviso "Pessoa inativa".
2. **Barra inferior do celular:** acima de 5 itens, o 5º lugar vira "Mais", que abre o submenu já existente. A peça da casca é do glass-design-system.

Decisões anteriores do mesmo dia:
- usuário sem vínculo com filial, como no 2.0;
- cor livre #RRGGBB;
- a branch 	imeero/filiais parte da main depois do merge de Pessoas.

A construção começa quando o Eduardo avisar que o merge de 	imeero/pessoas foi feito.
**Mudança de ordem (20/11/2026):** antes de Filiais vem a entrega "Pessoas: dados complementares" (PLANO-PESSOAS-COMPLEMENTO.md).
- A migration de Filiais passa de 019 para **022**.
- A 	imeero/filiais parte da main depois do merge dessa entrega.
- O painel "Dados da pessoa" pode mostrar a Data de abertura da PJ, em leitura.