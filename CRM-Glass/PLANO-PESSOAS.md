# Plano — Cadastro de Pessoas (branch `timeero/pessoas`)

> Planejador, 16/11/2026. **Revisão 2**, com as respostas do dono de 16/11/2026 (§2.1). Fontes:
> - a pesquisa do EroErp 2.0 (pessoas);
> - `docs/negocio/*` e `docs/01`, `03`, `04`, `05`, `07`, `08`;
> - o módulo `usuario`, o `ArquiteturaTest`, o `TenantService.criar`;
> - o kit `ero-web/src/design-system/kit/` e a casca `design-system/shell/Sidebar.tsx`.
>
> As perguntas novas estão na §2.3. Se a resposta do dono fugir do padrão, a seção afetada está indicada ao lado.

## 1. Entendimento

O que a entrega traz:
- **Pessoas**, o primeiro cadastro de negócio, com tudo o que havia no 2.0:
  - física e jurídica na mesma tabela, com um ou mais tipos de cadastro;
  - telefones, e-mails, redes sociais e endereços (CEP pelo ViaCEP, consultado pelo back; cidade do IBGE);
  - **vínculos entre pessoas**, **cadastro rápido em modal** e `GET /api/pessoas/selecao`.
- **Os 5 cadastros auxiliares:** Tipo de cadastro, Tipo de telefone, Tipo de e-mail, Tipo de endereço e Tipo de rede social. Cada um tem itens do sistema (pré-cadastrados e imutáveis) e itens do contratante. As telas são FormList.
- **Peças que nascem junto:**
  - o `cod_<entidade>`, com a peça comum de retentativa;
  - a seção "Cadastros" do menu, com o submenu "Auxiliares".
- **Construção** em 6 etapas, na mesma branch (§6).

## 2. Perguntas e decisões

### 2.1 Respondido pelo dono (16/11/2026)

| # | Assunto | Decisão | Onde |
|---|---|---|---|
| 1 | Escopo | **Tudo do 2.0 numa entrega:** vínculos, cadastro rápido e `/api/pessoas/selecao` entram. | §3.5, §4.6, §6 |
| 2 | Cidade | Tabelas `estado`/`cidade` do IBGE. | §3.2 (013), §3.3 |
| 3 | Tipos | **Tipo de pessoa:** enum fixo, Física e Jurídica.<br>**Tipos de cadastro, telefone, e-mail, endereço e rede social:** cadastros auxiliares no menu "Cadastros › Auxiliares".<br>**Itens do sistema:** pré-cadastrados; não se editam nem se excluem.<br>**Itens do contratante:** ele cria, edita e inativa.<br>**Itens do sistema de Tipo de cadastro:** Cliente, Fornecedor, Funcionário, Lead, Outros. Os outros 4 tipos usam os valores do 2.0. | §3.2 (014), §3.4, §4.2, §4.3 |
| 4 | Busca sem acento | Coluna normalizada no Java (`nome_busca`). | §3.1, §3.5 |
| 5 | CPF e RG | Em claro. | §3.2 |
| 6 | Exportar | Quem tem `PESSOAS_LER`, sem data de nascimento. | §4.4 |
| 7 | Aceitos | CEP pelo ViaCEP via backend. Sem consulta de CNPJ. Sem `razao_social`: na PJ o Nome vira "Razão social". RG não é único (6 a 10 caracteres). A tela mostra só os campos do tipo escolhido, e trocar o tipo limpa os do outro. | §3.3, §3.5, §4.5 |

### 2.2 Decidido pelo planejador (regra escrita ou técnica)

**Itens do sistema: opção (a), semeados em cada contratante.** Cada contratante recebe as próprias linhas dos itens do sistema. Elas são marcadas por `chave` (ex.: `CELULAR`); `chave` nula = item do contratante.
- Na criação do contratante: `ItensDoSistemaService.semear` dentro do `TenantService.criar`.
- Para os contratantes que já existem: a migration 014.

Por que (a):
- Tudo continua `TenantEntity`: filtro automático, nenhuma exceção em `ENTIDADES_SEM_TENANT`, nenhum SQL nativo, nenhum `comoRoot` novo (regra 2).
- A FK composta `(tipo_id, tenant_id)` garante **no banco** que uma pessoa nunca aponta para o tipo de outro contratante.
- "Nome repetido no contratante, contando os do sistema" vira um índice único simples, `(tenant_id, nome_busca)`.
- O `cod_<tabela>` fica 1..N por contratante sem caso especial.
- O custo é baixo: 19 linhas por contratante.

Por que não (b), linhas globais sem tenant:
- Linha global precisaria de `tenant_id` nulo. Nesse caso a entidade não pode ser `TenantEntity` (o `@TenantId` esconderia a linha).
- Sobrariam duas saídas, e as duas ferem as regras:
  - uma exceção em `ENTIDADES_SEM_TENANT` com `WHERE tenant_id = :t OR tenant_id IS NULL` escrito à mão (proibido pela regra 2 e pelo `docs/03`);
  - duas entidades unidas no Java, sem FK possível da `pessoa_telefone` para "uma das duas tabelas".
- O nome único entre linha global e linha do contratante só seria garantido no service, com corrida entre dois salvamentos.

**Demais decisões:**
- **5 tabelas, uma por tipo**, e não uma tabela com coluna "categoria": FK real e `cod_<tabela>` pela regra. Todas ficam num **módulo só, `auxiliar`**. O `TipoCadastro` é o modelo, e os outros 4 são cópia com troca de nomes (back e front).
- **Código nos auxiliares: sim.** São cadastros usados pelo contratante (`docs/negocio/codigo-sequencial.md`). Os do sistema recebem 1..N na ordem do enum; o primeiro do contratante continua do N+1.
- **"Excluir" item do contratante = inativar.** Não há DELETE físico de cadastro (`docs/01`, `codigo-sequencial.md`). O item inativo some dos combos e continua nas pessoas que já o usam.
- **Nome do tipo:**
  - de 1 a 25 caracteres;
  - único no contratante, sem diferenciar maiúsculas nem acento ("celular" = "Celular"), contando os do sistema.
  - Por que 25: com o " (inativo)" o rótulo fica em 35 caracteres e cabe no `TCombo` `medio` (§4.1).
- **Permissão:** um grupo só, `CADASTROS_AUXILIARES`, com 5 telas. Os combos leem pelo `/selecao` com `ACESSO_LIBERADO` (`docs/04`).
  - Por que não 5 grupos: poluiria o "Acesso aos módulos" sem ganho.
  - Por que não ler junto com `PESSOAS`: configurar tipos é outro ato, e os combos já ficam abertos a todos pelo `/selecao`.
- **Tipo inativo na pessoa:** o combo só oferece os ativos. O já gravado continua aparecendo, como "Nome (inativo)", e é aceito no salvar **daquela** pessoa. Tipo inativo novo dá 400.
- **Menu:** o menu lateral é um trilho de ícones de 72 px, sem texto. "Auxiliares" vira **um ícone que abre um submenu flutuante** com os 5. É peça nova da casca, feita pelo `glass-design-system` (§4.1). A rota `/cadastros/auxiliares` sozinha redireciona para o primeiro filho liberado.
- **Vínculo:**
  - tipo em enum, porque precisa do inverso e por isso não cabe em auxiliar;
  - uma linha serve os dois cadastros;
  - salvar trava as duas pessoas (em ordem de id) e sobe a `version` da outra quando o vínculo mudou.
- **`PessoaSelectDto` leva `codPessoa`** (decisão de 14/11: "combo código · nome pode entrar com pessoas"). Atualizar a frase "por enquanto" do `docs/01`.
- **`/api/pessoas/selecao` exige `PESSOAS_LER`**, não `ACESSO_LIBERADO`: é dado pessoal. No 2.0 ficava aberta, e isso era defeito.
- **Mantido da revisão 1:**
  - a filha vem sem `id` na entrada (a lista é o estado completo e substitui a anterior; elimina IDOR);
  - inativar e ativar por `PATCH /{id}/inativar` e `/ativar`;
  - telefone sem código do país;
  - IE "ISENTO" fica em aberto.

### 2.3 Perguntas novas — **respondidas pelo dono em 16/11/2026, todas no padrão; plano aprovado**

- P1: os 4 do 2.0 **+ Contato ↔ Empresa** (lado Empresa = PJ).
- P2: item do sistema **não** pode ser inativado (imutável, CHECK no banco).
- P3: cadastro rápido com **"Cliente"** já marcado.

Texto original das perguntas:

1. **Tipos de vínculo:** os 4 do 2.0 **+ Contato ↔ Empresa** (o lado Empresa precisa ser PJ)? Ou só os 4 do 2.0? Afeta o enum `TipoVinculo`, o CHECK da 018 e a regra em §3.5.
2. **Item do sistema pode ser inativado?** Padrão: **não**, ele é imutável (CHECK no banco). Se o dono disser sim, cai o `ck_<t>_sistema_ativo`, o `inativar` passa a aceitar item do sistema e o cadastro rápido precisa tratar "Celular" inativo.
3. **Cadastro rápido com algum tipo de cadastro já marcado?** Padrão: **"Cliente"**, como no 2.0. A alternativa é nenhum marcado.

## 3. Backend

### 3.1 Peças comuns (`compartilhado`, infraestrutura). Primeiro consumidor: `auxiliar` (E1).

| Arquivo | O que é |
|---|---|
| `compartilhado/util/DocumentoValidator.java` | **Movido** de `tenant/util/` (atualizar o import do `TenantService`). Ganha `cpfValido(String)` (11 dígitos + DV, recusa sequência repetida) e `cnpjValido(String)` (14 posições alfanuméricas + DV). O `valido` continua. |
| `compartilhado/util/TextoBusca.java` | `static String normalizar(String)`: `null`/vazio → `null`; `Normalizer.NFD`, remove `\p{M}`, `toLowerCase(Locale.ROOT)`, colapsa espaços, `trim`. É o `nome_busca` de pessoa, cidade e tipos. |
| `compartilhado/util/RestricaoViolada.java` | `static boolean violou(Throwable e, String restricao)`: procura nas causas a `org.hibernate.exception.ConstraintViolationException` com `getConstraintName()` igual, sem diferenciar caixa. |
| `compartilhado/util/RepetirSeCodigoRepetido.java` | `@Component`, montado com `PlatformTransactionManager` → `TransactionTemplate` (REQUIRED). `public <T> T executar(String indiceDoCodigo, Supplier<T> tentativa)`:<br>• chamado com transação já aberta → `IllegalStateException("O salvar com código precisa da própria transação.")`;<br>• até 3 tentativas, cada uma num `transacao.execute(...)` novo;<br>• `DataIntegrityViolationException` no índice do código com tentativa sobrando → repete;<br>• na 3ª recusa → `ConflitoException("Não foi possível gerar o código. Tente salvar de novo.")`;<br>• outra violação → relança na hora.<br>Javadoc com as regras do `docs/01` "Código do registro". |
| `compartilhado/exception/CampoInvalidoException.java` | `extends ApiException`, `(String campo, String mensagem)`. O `GlobalExceptionHandler` responde **400 `VALIDACAO`** com `erros[{campo, mensagem}]`. É para as regras que só o service vê. Entra na tabela de erros do `docs/01`. |

### 3.2 Migrations (última aplicada: `012-add-usuario-telefone.xml`)

Todas as tabelas levam as colunas obrigatórias do `docs/05` (id UUID, auditoria, `version`). As de negócio levam também `tenant_id NN fk_<t>_tenant`. Índice parcial vai por `<sql>`. Os includes vão no fim do `changelog-master.xml`, na ordem.

**`013-create-estado-cidade.xml`**: sem mudança desde a revisão 1.
- `estado`:
  - colunas: `nome VARCHAR(100) NN`, `sigla VARCHAR(2) NN`, `codigo_ibge INTEGER NN`;
  - **`sigla` é VARCHAR, não CHAR:** o `validate` recusa `bpchar` para `String`;
  - índices: `uk_estado_sigla`, `uk_estado_codigo_ibge`.
- `cidade`:
  - colunas: `estado_id UUID NN fk_cidade_estado`, `nome VARCHAR(150) NN`, `nome_busca VARCHAR(150) NN`, `codigo_ibge INTEGER NN`;
  - índices: `uk_cidade_codigo_ibge`, `ix_cidade_estado`.
- Seed: copiar de `EroErp2.0/.../changes/011-estado-cidade-ibge.xml`.
  - São 27 UFs e 5.571 municípios.
  - `id = gen_random_uuid()`, `created_at = now()`, `version = 0`.
  - `nome_busca = translate(lower(nome), 'áàâãäéèêëíìîïóòôõöúùûüçñ', 'aaaaaeeeeiiiiooooouuuucn')`.
- Sem tenant: é dado de referência, igual para todos (§3.3).

**`014-create-tipos-auxiliares.xml`**: 5 changeSets de criação e 5 de semente.

Colunas iguais nas 5 tabelas `<t>` (`tipo_cadastro`, `tipo_telefone`, `tipo_email`, `tipo_endereco`, `tipo_rede_social`):

| coluna | tipo | nulo | obs. |
|---|---|---|---|
| `id` | UUID | não | `pk_<t>` |
| `tenant_id` | UUID | não | `fk_<t>_tenant` |
| `cod_<t>` | BIGINT | não | `ck_<t>_cod_<t> CHECK (cod_<t> > 0)` |
| `nome` | VARCHAR(25) | não | |
| `nome_busca` | VARCHAR(25) | não | `TextoBusca.normalizar(nome)` |
| `chave` | VARCHAR(30) | sim | nula = item do contratante; preenchida = item do sistema (nome do enum) |
| `ativo` | BOOLEAN | não | default `true` |
| auditoria + `version` | | | |

- Índices únicos: `uk_<t>_tenant_cod_<t> (tenant_id, cod_<t>)`, `uk_<t>_tenant_nome_busca (tenant_id, nome_busca)`, `uk_<t>_tenant_chave (tenant_id, chave)` (nulos não colidem no PostgreSQL) e `uk_<t>_id_tenant (id, tenant_id)` (alvo das FKs compostas).
- Check: `ck_<t>_sistema_ativo CHECK (chave IS NULL OR ativo)`. Cai se a P2 for "sim".
- Semente para os contratantes existentes, um `<sql>` por tabela:
  ```sql
  INSERT INTO tipo_telefone (id, tenant_id, cod_tipo_telefone, nome, nome_busca, chave, ativo, created_at, version)
  SELECT gen_random_uuid(), t.id, v.cod, v.nome, v.busca, v.chave, true, now(), 0
  FROM tenant t CROSS JOIN (VALUES (1,'Celular','celular','CELULAR'), ...) AS v(cod, nome, busca, chave)
  WHERE t.id <> '00000000-0000-0000-0000-000000000000';
  ```
  Inclui os contratantes inativos e exclui a Plataforma.
- Valores, na ordem do código. **Iguais aos enums da §3.4** (o `revisor-backend` confere):

  | Tabela | Itens |
  |---|---|
  | `tipo_cadastro` | Cliente `CLIENTE`, Fornecedor `FORNECEDOR`, Funcionário `FUNCIONARIO`, Lead `LEAD`, Outros `OUTROS` |
  | `tipo_telefone` | Celular `CELULAR`, WhatsApp `WHATSAPP`, Residencial `RESIDENCIAL`, Comercial `COMERCIAL` |
  | `tipo_email` | Particular `PARTICULAR`, Comercial `COMERCIAL` |
  | `tipo_endereco` | Residencial `RESIDENCIAL`, Comercial `COMERCIAL`, Cobrança `COBRANCA` |
  | `tipo_rede_social` | Instagram `INSTAGRAM`, Facebook `FACEBOOK`, LinkedIn `LINKEDIN`, TikTok `TIKTOK`, X `X` |

**`015-create-pessoa.xml`**

`pessoa`:

| coluna | tipo | nulo | obs. |
|---|---|---|---|
| `id` | UUID | não | `pk_pessoa` |
| `tenant_id` | UUID | não | `fk_pessoa_tenant` |
| `cod_pessoa` | BIGINT | não | `ck_pessoa_cod_pessoa CHECK (cod_pessoa > 0)` |
| `tipo_pessoa` | VARCHAR(10) | não | `ck_pessoa_tipo_pessoa IN ('FISICA','JURIDICA')` |
| `nome` | VARCHAR(255) | não | razão social na PJ |
| `nome_fantasia` | VARCHAR(255) | sim | só PJ |
| `nome_busca` | VARCHAR(511) | não | `TextoBusca.normalizar(nome + " " + fantasia)` |
| `cpf` | VARCHAR(11) | sim | `ck_pessoa_cpf CHECK (cpf ~ '^[0-9]{11}$')` |
| `rg` | VARCHAR(20) | sim | só PF |
| `data_nascimento` | DATE | sim | só PF |
| `sexo` | VARCHAR(10) | sim | `ck_pessoa_sexo IN ('MASCULINO','FEMININO')` |
| `cnpj` | VARCHAR(14) | sim | `ck_pessoa_cnpj CHECK (cnpj ~ '^[0-9A-Z]{12}[0-9]{2}$')` |
| `inscricao_estadual` | VARCHAR(12) | sim | só dígitos |
| `inscricao_municipal` | VARCHAR(12) | sim | só dígitos |
| `observacao` | VARCHAR(500) | sim | |
| `ativo` | BOOLEAN | não | default `true` |
| auditoria + `version` | | | |

- `ck_pessoa_campos_do_tipo`:
  ```sql
  (tipo_pessoa = 'FISICA' AND cnpj IS NULL AND nome_fantasia IS NULL
     AND inscricao_estadual IS NULL AND inscricao_municipal IS NULL)
  OR (tipo_pessoa = 'JURIDICA' AND cpf IS NULL AND rg IS NULL
     AND data_nascimento IS NULL AND sexo IS NULL)
  ```
- Índices:
  - `uk_pessoa_tenant_cod_pessoa (tenant_id, cod_pessoa)`;
  - por `<sql>`: `CREATE UNIQUE INDEX uk_pessoa_tenant_cpf ON pessoa (tenant_id, cpf) WHERE cpf IS NOT NULL`, e o mesmo para `uk_pessoa_tenant_cnpj`;
  - `ix_pessoa_tenant_nome (tenant_id, nome)`;
  - `uk_pessoa_id_tenant (id, tenant_id)`.

`pessoa_tipo_cadastro`: filha como as outras, `TenantEntity`; substitui a `@ElementCollection` da revisão 1.
- Colunas: `id`, `tenant_id`, `pessoa_id UUID NN`, `tipo_cadastro_id UUID NN`, auditoria, `version`.
- FKs compostas:
  - `fk_pessoa_tipo_cadastro_pessoa (pessoa_id, tenant_id) → pessoa(id, tenant_id)`;
  - `fk_pessoa_tipo_cadastro_tipo (tipo_cadastro_id, tenant_id) → tipo_cadastro(id, tenant_id)`.
- Índices: `uk_pessoa_tipo_cadastro_par (tenant_id, pessoa_id, tipo_cadastro_id)`, `ix_pessoa_tipo_cadastro_tipo (tipo_cadastro_id)`.

**`016-create-pessoa-contatos.xml`**: changeSets `-telefone`, `-email` e `-rede-social`.
- Colunas comuns: `id`, `tenant_id`, `pessoa_id UUID NN`, `ordem INTEGER NN`, auditoria, `version`. FK `fk_<t>_pessoa (pessoa_id, tenant_id) → pessoa(id, tenant_id)`. Índice `ix_<t>_pessoa`.
- O tipo é FK composta para o auxiliar: `tipo_<x>_id UUID NN`, com `fk_<t>_tipo (tipo_<x>_id, tenant_id) → tipo_<x>(id, tenant_id)` e índice `ix_<t>_tipo`.
- `pessoa_telefone`:
  - `tipo_telefone_id`;
  - `numero VARCHAR(11) NN ck_pessoa_telefone_numero (~ '^[0-9]{10,11}$')`;
  - `observacao VARCHAR(255)`;
  - `principal BOOLEAN NN default false`;
  - `CREATE UNIQUE INDEX uk_pessoa_telefone_principal ON pessoa_telefone (pessoa_id) WHERE principal`.
- `pessoa_email`:
  - `tipo_email_id`;
  - `email VARCHAR(255) NN ck_pessoa_email_minusculo (email = lower(email))`;
  - `observacao VARCHAR(255)`;
  - `principal`, com o índice parcial `uk_pessoa_email_principal`.
- `pessoa_rede_social`:
  - `tipo_rede_social_id`;
  - `usuario VARCHAR(255)`;
  - `url VARCHAR(500)`;
  - checks `ck_pessoa_rede_social_preenchida (usuario IS NOT NULL OR url IS NOT NULL)` e `ck_pessoa_rede_social_url (url IS NULL OR url ~ '^https?://')`.

**`017-create-pessoa-endereco.xml`**
- `pessoa_endereco`: colunas comuns + `tipo_endereco_id` (FK composta), `cep VARCHAR(8) ck_pessoa_endereco_cep (~ '^[0-9]{8}$')`, `cidade_id UUID NN fk_pessoa_endereco_cidade → cidade(id)`, `rua VARCHAR(255)`, `numero VARCHAR(20)`, `bairro VARCHAR(100)`, `complemento VARCHAR(100)` e `principal`.
- Índices: `ix_pessoa_endereco_cidade`, `uk_pessoa_endereco_principal` (parcial).

**`018-create-pessoa-vinculo.xml`**
- `pessoa_vinculo`:
  - `id`, `tenant_id`;
  - `pessoa_origem_id UUID NN`, `pessoa_destino_id UUID NN`;
  - `tipo VARCHAR(20) NN`, com `ck_pessoa_vinculo_tipo IN ('RESPONSAVEL','DEPENDENTE','CONJUGE','FAMILIAR','CONTATO','EMPRESA')` (lista fechada; sem `CONTATO`/`EMPRESA` se a P1 mudar);
  - `observacao VARCHAR(255)`, auditoria, `version`.
- FKs compostas: `fk_pessoa_vinculo_origem (pessoa_origem_id, tenant_id) → pessoa(id, tenant_id)` e `fk_pessoa_vinculo_destino`, do mesmo jeito.
- `uk_pessoa_vinculo_par (tenant_id, pessoa_origem_id, pessoa_destino_id)`.
- `ck_pessoa_vinculo_ordem CHECK (pessoa_origem_id < pessoa_destino_id)`. Garante a orientação canônica e também que origem e destino são diferentes.
- Índices `ix_pessoa_vinculo_origem` e `ix_pessoa_vinculo_destino`.

### 3.3 Módulo `localidade` (novo): sem mudança desde a revisão 1

- **`entity/`:** `Estado` e `Cidade` estendem `BaseEntity`, **sem tenant** (referência do IBGE).
  - Entram em `ArquiteturaTest.ENTIDADES_SEM_TENANT`, com Javadoc de justificativa.
  - `Cidade.estado` é `LAZY`.
- **`dtos/`:**
  - `CidadeSelectDto(UUID id, String nome, String uf)`;
  - `CepResponseDto(String cep, CidadeSelectDto cidade, String rua, String bairro, boolean cepUnico)`;
  - `ViaCepRespostaDto(cep, logradouro, bairro, localidade, uf, ibge, Boolean erro)`, com `@JsonIgnoreProperties(ignoreUnknown = true)`.
- **`mapper/LocalidadeMapper`:** `toSelectDto(Cidade)` e `toCepResponseDto(cep, Cidade, ViaCepRespostaDto)`.
- **`repository/CidadeRepository`:**
  - `buscarParaSelecao(String busca, String uf, Pageable limite)`:
    ```
    SELECT c FROM Cidade c JOIN FETCH c.estado e
    WHERE (:busca IS NULL OR c.nomeBusca LIKE CONCAT('%', CAST(:busca AS string), '%'))
      AND (:uf IS NULL OR e.sigla = CAST(:uf AS string))
    ORDER BY c.nome
    ```
    O service passa `PageRequest.of(0, 50)`.
  - `buscarPorIds(Collection<UUID>)` e `buscarPorCodigoIbge(Integer)`, os dois com `JOIN FETCH c.estado`.
- **`service/ViaCepService`:** só HTTP.
  - `RestClient` com base em `app.cep.url` (padrão `https://viacep.com.br/ws`).
  - 3 s de conexão e 3 s de leitura, **sem seguir redirecionamento**.
  - `Optional<ViaCepRespostaDto> consultar(String cep8)`: `erro=true` → vazio; falha ou timeout → `ServicoIndisponivelException("Consulta de CEP indisponível. Preencha o endereço à mão.")`.
  - Log sem o CEP.
- **`service/LocalidadeService`:**
  - `buscarCidadesParaSelecao(busca, uf)`, com o termo passado pelo `TextoBusca`;
  - `Map<UUID, Cidade> buscarCidades(Collection<UUID>)`;
  - `consultarCep(String cep)`: fora de `\d{8}` → `CampoInvalidoException("cep", "CEP deve ter 8 dígitos.")`; vazio → `NaoEncontradoException("CEP não encontrado.")`; a cidade sai do `ibge`; `cepUnico` quando o logradouro vem vazio.
- **`controller/LocalidadeController`** (`@RequestMapping("/api")`):

  | Método | Rota | Authority |
  |---|---|---|
  | GET | `/api/cidades/selecao?busca=&uf=` (`busca @Size(max=100)`, `uf @Pattern("[A-Z]{2}")`) | `ACESSO_LIBERADO` |
  | GET | `/api/cep/{cep}` | `ACESSO_LIBERADO` |

- **Configuração:**
  - limite próprio: `RateLimitProperties.cep` (30/min por IP), aplicado pelo `RateLimitFilter` a `/api/cep/`;
  - `application.yml`: `app.cep.url`;
  - deploy: saída liberada para `viacep.com.br`.

### 3.4 Módulo `auxiliar` (novo)

O modelo é o `TipoCadastro`. Os outros 4 são cópia com troca de nomes:

| Entidade | Tabela | Rota | Tela (código) | Enum do sistema |
|---|---|---|---|---|
| `TipoCadastro` | `tipo_cadastro` | `/api/tipos-cadastro` | `tipo-cadastro-formlist` | `TipoCadastroDoSistema` |
| `TipoTelefone` | `tipo_telefone` | `/api/tipos-telefone` | `tipo-telefone-formlist` | `TipoTelefoneDoSistema` |
| `TipoEmail` | `tipo_email` | `/api/tipos-email` | `tipo-email-formlist` | `TipoEmailDoSistema` |
| `TipoEndereco` | `tipo_endereco` | `/api/tipos-endereco` | `tipo-endereco-formlist` | `TipoEnderecoDoSistema` |
| `TipoRedeSocial` | `tipo_rede_social` | `/api/tipos-rede-social` | `tipo-rede-social-formlist` | `TipoRedeSocialDoSistema` |

**enums/** `<Tipo>DoSistema`:
- constantes com `rotulo()`, na ordem da tabela da 014 (ex.: `CELULAR("Celular")`);
- o código do item é `ordinal() + 1`;
- o nome da constante é a `chave`;
- só entra constante nova no fim, junto com a migration que semeia os contratantes existentes (§5).

**entity/** `TipoCadastro extends TenantEntity` (Lombok `@Getter @Setter @NoArgsConstructor`):
- `Long codTipoCadastro`, com `@Column(name="cod_tipo_cadastro", nullable=false, updatable=false)`;
- `String nome`, `String nomeBusca`;
- `String chave`, com `updatable=false`;
- `boolean ativo`;
- `boolean sistema()`, que devolve `chave != null`.

**dtos/** (os mesmos 4 em cada tipo, trocando o nome):
- `TipoCadastroCreateDto(@NotBlank @Size(max=25) String nome)`.
- `TipoCadastroUpdateDto(@NotBlank @Size(max=25) String nome, @NotNull Long version)`.
- `TipoCadastroResponseDto(id, codTipoCadastro, nome, boolean sistema, boolean ativo, createdAt, updatedAt, createdBy, updatedBy, criadoPorNome, alteradoPorNome, version)`.
- `TipoCadastroSelectDto(UUID id, String nome, String chave, boolean ativo)`. A `chave` permite ao front achar "Cliente" e "Celular" no cadastro rápido.

**mapper/TipoCadastroMapper:**
- `toEntity(CreateDto)`: `trim` no nome; `chave` nula; ativo.
- `atualizarEntidade(e, UpdateDto)`: só o nome.
- `nomeBusca(e)`.
- `toResponseDto(e, nomes, plataforma)`, como no `UsuarioMapper`.
- `toSelectDto(e)`.
- `doSistema(TipoCadastroDoSistema item, UUID tenantId)`: monta a entidade com `atribuirTenant`, `cod = ordinal + 1`, `chave = name()` e `nome = rotulo()`.

**repository/TipoCadastroRepository** (JPQL com nome; o tenant é automático):
- `buscarPorId(UUID id)`.
- `buscarPagina(Pageable)`, que devolve `Page<TipoCadastro>`: ativos e inativos, sem filtro (FormList).
- `buscarParaSelecao(boolean inativos)`: `WHERE (:inativos = true OR t.ativo = true) ORDER BY t.nome`.
- `buscarPorIds(Collection<UUID> ids)`.
- `existeNome(String nomeBusca, UUID ignorarId)`: `SELECT COUNT(t) > 0 FROM TipoCadastro t WHERE t.nomeBusca = :nomeBusca AND t.id <> :ignorarId`. O service passa um UUID sentinela na criação.
- `buscarProximoCodigo()`: `SELECT COALESCE(MAX(t.codTipoCadastro), 0) + 1 FROM TipoCadastro t`.

**service/TipoCadastroService** (e as 4 cópias):

Todo método começa com `SecurityUtils.exigirTenantSelecionado()`. Na plataforma dá 422, e o MAX+1 nunca roda em ROOT. Ordenação aceita: `ORDENAVEIS = Set.of("codTipoCadastro", "nome")`.
- `listar(Pageable)` → `PaginaDto<TipoCadastroResponseDto>`. Uma consulta da página + `usuarioService.buscarNomes`.
- `listarParaSelecao(boolean inativos)` → `List<TipoCadastroSelectDto>`.
- `criar(dto)`, **sem `@Transactional`**:
  - `repetir.executar("uk_tipo_cadastro_tenant_cod_tipo_cadastro", () -> gravarNovo(dto))`;
  - `gravarNovo`: nome repetido (`existeNome`) → `ConflitoCampoException("nome", "Já existe um tipo de cadastro com este nome.")`;
  - depois `toEntity`, `nomeBusca`, `setCodTipoCadastro(buscarProximoCodigo())` e `saveAndFlush`;
  - violação de `uk_tipo_cadastro_tenant_nome_busca` numa corrida → o mesmo 409 com campo (`RestricaoViolada`).
- `atualizar(id, dto)` `@Transactional`:
  - não existe → 404 `"Tipo de cadastro não encontrado."`;
  - **item do sistema** → `RegraNegocioException("Itens do sistema não podem ser alterados.")` (422);
  - versão diferente → 409;
  - nome repetido → 409 com campo;
  - depois `atualizarEntidade`, `nomeBusca` e `saveAndFlush`.
- `inativar(id)` e `ativar(id)` `@Transactional`:
  - item do sistema → o mesmo 422;
  - já no estado pedido → nada (204).
- `Map<UUID, TipoCadastro> buscarPorIds(Collection<UUID>)`, `@Transactional(readOnly = true)`. Usado pela pessoa; o tenant é filtrado.

**service/ItensDoSistemaService:**
- `@Transactional public void semear(UUID tenantId)`.
- Guarda: `if (!TenantContext.ROOT.equals(SecurityUtils.getTenantIdLogado())) throw new IllegalStateException(...)`. Só roda no fluxo de plataforma.
- Monta os 19 itens com o `doSistema` de cada mapper e faz `saveAll` nos 5 repositories. O código vem explícito: **nunca** `buscarProximoCodigo` em ROOT.
- **`TenantService.criar`** chama `itensDoSistemaService.semear(t.getId())` logo depois de `criarAdminInicial`, na mesma transação. A sessão já é ROOT, então não há `comoRoot` novo. É o mesmo caminho do admin inicial.

**controller/** um por tipo (`TipoCadastroController` em `/api/tipos-cadastro`; as cópias trocam a rota):

| Método | Rota | Authority |
|---|---|---|
| GET | `/api/tipos-cadastro?page=&size=&sort=` (`@PageableDefault(size=20, sort="nome")`) | `CADASTROS_AUXILIARES_LER` |
| GET | `/api/tipos-cadastro/selecao?inativos=false` | `ACESSO_LIBERADO` |
| POST | `/api/tipos-cadastro` → 201 | `CADASTROS_AUXILIARES_ESCREVER` |
| PUT | `/api/tipos-cadastro/{id}` | `CADASTROS_AUXILIARES_ESCREVER` |
| PATCH | `/api/tipos-cadastro/{id}/inativar` e `/ativar` → 204 | `CADASTROS_AUXILIARES_ESCREVER` |

Não há `GET /{id}`: a FormList edita a partir da linha da grade, que já traz a `version`.

### 3.5 Módulo `pessoa`

**enums/** (com `rotulo()`; gravados como texto):
- `TipoPessoa`: `FISICA("Física")`, `JURIDICA("Jurídica")`.
- `Sexo`: `MASCULINO`, `FEMININO`.
- `TipoVinculo`: `RESPONSAVEL`, `DEPENDENTE`, `CONJUGE`, `FAMILIAR`, `CONTATO("Contato")`, `EMPRESA("Empresa")` (P1).
  - `inverso()`: RESPONSAVEL ↔ DEPENDENTE e CONTATO ↔ EMPRESA; os outros são o próprio.
  - Leitura: "B é <tipo> de A".

**entity/** (todas `TenantEntity`; relações `LAZY`):
- `Pessoa`:
  - os campos da 015;
  - `codPessoa` com `@Column(name="cod_pessoa", nullable=false, updatable=false)`;
  - **sem** coleções: tipos, filhas e vínculos são lidos pelos repositories deles.
- `PessoaTipoCadastro`: `Pessoa pessoa` (`updatable=false`) e `TipoCadastro tipoCadastro`.
- `PessoaTelefone`, `PessoaEmail`, `PessoaRedeSocial` e `PessoaEndereco`:
  - `Pessoa pessoa` e `int ordem`;
  - o tipo como `@ManyToOne(fetch = LAZY, optional = false)`: `TipoTelefone tipoTelefone`, `TipoEmail tipoEmail`, `TipoRedeSocial tipoRedeSocial`, `TipoEndereco tipoEndereco`;
  - os campos da tabela;
  - no endereço, também `Cidade cidade`.
- `PessoaVinculo`: `Pessoa pessoaOrigem`, `Pessoa pessoaDestino`, `TipoVinculo tipo`, `String observacao`.

**util/OrdemUuid.java:** `static final Comparator<UUID> COMO_NO_BANCO = Comparator.comparing(UUID::getMostSignificantBits, Long::compareUnsigned).thenComparing(UUID::getLeastSignificantBits, Long::compareUnsigned)`.
- É a mesma ordem do `uuid <` do PostgreSQL (comparação de bytes sem sinal).
- O `UUID.compareTo` do Java compara com sinal e **não serve** para o `ck_pessoa_vinculo_ordem`.

**dtos/** (records; o `toString` não mostra CPF, RG, nascimento, telefone, e-mail nem URL)
- `PessoaCreateDto`:
  - `@NotNull TipoPessoa tipoPessoa`;
  - `@NotBlank @Size(max=255) nome`;
  - `@Size(max=14) cpf` (aceita com máscara);
  - `@Size(max=20) rg`;
  - `@PastOrPresent LocalDate dataNascimento`;
  - `Sexo sexo`;
  - `@Size(max=18) cnpj`;
  - `@Size(max=255) nomeFantasia`;
  - `@Size(max=20) inscricaoEstadual`, `@Size(max=20) inscricaoMunicipal`;
  - `@Size(max=500) observacao`;
  - `@NotEmpty(message="Selecione ao menos um tipo de cadastro") @Size(max=20) Set<@NotNull UUID> tiposCadastroIds`;
  - `@Size(max=20) List<@Valid PessoaTelefoneItemDto> telefones`;
  - `@Size(max=20) List<@Valid PessoaEmailItemDto> emails`;
  - `@Size(max=20) List<@Valid PessoaRedeSocialItemDto> redesSociais`;
  - `@Size(max=10) List<@Valid PessoaEnderecoItemDto> enderecos`;
  - `@Size(max=20) List<@Valid PessoaVinculoItemDto> vinculos`;
  - sem `id`, sem `codPessoa`, sem auditoria.
- `PessoaUpdateDto`: os mesmos campos + `@NotNull Long version`.
- Itens de entrada (sem `id`):
  - `PessoaTelefoneItemDto`: `@NotNull UUID tipoId`, `@NotBlank @Pattern("^\\d{10,11}$") numero`, `@Size(max=255) observacao`, `@NotNull Boolean principal`;
  - `PessoaEmailItemDto`: `@NotNull UUID tipoId`, `@NotBlank @Email @Size(max=255) email`, `@Size(max=255) observacao`, `@NotNull Boolean principal`;
  - `PessoaRedeSocialItemDto`: `@NotNull UUID tipoId`, `@Size(max=255) usuario`, `@Size(max=500) @Pattern("^$|^https?://\\S+$", message="Link deve começar com http:// ou https://") url`;
  - `PessoaEnderecoItemDto`: `@NotNull UUID tipoId`, `@Pattern("^$|^\\d{8}$") cep`, `@NotNull UUID cidadeId`, `@Size(max=255) rua`, `@Size(max=20) numero`, `@Size(max=100) bairro`, `@Size(max=100) complemento`, `@NotNull Boolean principal`;
  - `PessoaVinculoItemDto`: `@NotNull UUID pessoaId` (é a referência à outra pessoa, não o id da linha), `@NotNull TipoVinculo tipo` ("a outra pessoa é o quê desta"), `@Size(max=255) observacao`.
- Saída:
  - `PessoaTelefoneResponseDto(TipoTelefoneSelectDto tipo, numero, observacao, principal)`;
  - `PessoaEmailResponseDto(TipoEmailSelectDto tipo, email, observacao, principal)`;
  - `PessoaRedeSocialResponseDto(TipoRedeSocialSelectDto tipo, usuario, url)`;
  - `PessoaEnderecoResponseDto(TipoEnderecoSelectDto tipo, cep, CidadeSelectDto cidade, rua, numero, bairro, complemento, principal)`;
  - `PessoaVinculoResponseDto(PessoaSelectDto pessoa, boolean pessoaAtiva, TipoVinculo tipo, String observacao)`. O `tipo` já sai na visão da pessoa aberta.
- `PessoaSelectDto(UUID id, Long codPessoa, String nome)`.
- `PessoaResponseDto`, nesta ordem: `id`, `codPessoa`, `tipoPessoa`, `nome`, `nomeFantasia`, `cpf`, `rg`, `dataNascimento`, `sexo`, `cnpj`, `inscricaoEstadual`, `inscricaoMunicipal`, `observacao`, `ativo`, `List<TipoCadastroSelectDto> tiposCadastro` (por nome), `telefones`, `emails`, `redesSociais`, `enderecos`, `vinculos` (por nome da outra pessoa), `createdAt`, `updatedAt`, `createdBy`, `updatedBy`, `criadoPorNome`, `alteradoPorNome`, `version`.
- `PessoaListaDto` (a lista e a exportação): `id`, `codPessoa`, `tipoPessoa`, `nome`, `nomeFantasia`, `documento`, `List<TipoCadastroSelectDto> tiposCadastro`, `telefonePrincipal`, `emailPrincipal`, `cidadePrincipal`, `ufPrincipal`, `ativo`. Sem nascimento, sem RG, sem auditoria.

**mapper/PessoaMapper** (estático):
- `toEntity` e `atualizarEntidade`: normalizam tudo.
  - `trim`;
  - documentos pelo `DocumentoValidator.normalizar`;
  - RG em maiúsculas, sem ponto, hífen nem espaço;
  - IE e IM só com dígitos;
  - vazio vira `null`;
  - campo do outro tipo chega `null`;
  - nunca tocam em `codPessoa`.
- `nomeBusca(p)`.
- Montagem das filhas:
  - `tipoCadastro(p, TipoCadastro)`;
  - `telefone(item, p, TipoTelefone, ordem)`, `email(...)` (em minúsculas), `redeSocial(...)`, `endereco(item, p, TipoEndereco, Cidade, ordem)`;
  - `vinculo(p, outra, TipoVinculo naVisaoDeP, obs)`: aplica a orientação com `OrdemUuid`. Se `p` vem antes, a linha é (p, outra, tipo); senão é (outra, p, tipo.inverso()).
- Respostas:
  - `toVinculoResponseDto(v, UUID aberta)`: a outra pessoa, e o tipo invertido quando a aberta é o destino;
  - `toResponseDto(...)`, `toListaDto(...)` e `toSelectDto(p)`.

**repository/**
- `PessoaRepository`:
  - `buscarPorId(id)`;
  - `buscarComFiltros(Long codPessoa, String busca, String documento, TipoPessoa tipoPessoa, UUID tipoCadastroId, Boolean ativo, Pageable)`. É o JPQL da revisão 1 trocando o `MEMBER OF` por:
    `AND (:tipoCadastroId IS NULL OR EXISTS (SELECT 1 FROM PessoaTipoCadastro x WHERE x.pessoa = p AND x.tipoCadastro.id = :tipoCadastroId))`
    (o teste confere o parâmetro nulo). Não usa `JOIN FETCH`.
  - `buscarParaSelecao(String busca, UUID ignorarId, Pageable limite)`: `WHERE p.ativo = true AND (:busca IS NULL OR p.nomeBusca LIKE CONCAT('%', CAST(:busca AS string), '%')) AND (:ignorarId IS NULL OR p.id <> :ignorarId) ORDER BY p.nome`, com limite de 20;
  - `@Lock(PESSIMISTIC_WRITE) travarPorIds(Collection<UUID> ids)`: `SELECT p FROM Pessoa p WHERE p.id IN :ids ORDER BY p.id`. Trava em ordem de id, o que evita deadlock;
  - `buscarProximoCodigo()`;
  - `buscarCodigoPorCpf(cpf, ignorarId)` e `buscarCodigoPorCnpj(...)`;
  - `marcarAlteracao(id, versao, agora, autor)`: `UPDATE` versionado, `@Modifying(flushAutomatically = true, clearAutomatically = true)`;
  - `marcarAlteradaPorVinculo(Collection<UUID> ids, Instant agora, UUID autor)`: `UPDATE Pessoa p SET p.version = p.version + 1, p.updatedAt = :agora, p.updatedBy = :autor WHERE p.id IN :ids`.
- `PessoaTipoCadastroRepository`:
  - `buscarPorPessoa(id)` e `buscarPorPessoas(ids)`, com `JOIN FETCH x.tipoCadastro`;
  - `@Modifying(flushAutomatically = true) removerPorPessoa(id)`.
- `PessoaTelefoneRepository`, `PessoaEmailRepository`, `PessoaRedeSocialRepository` e `PessoaEnderecoRepository`:
  - `buscarPorPessoa(id)`, com `JOIN FETCH` do tipo (no endereço, também `cidade` e `estado`) e `ORDER BY ordem`;
  - `buscarPrincipaisPorPessoas(ids)` (telefone, e-mail e endereço);
  - `removerPorPessoa(id)`.
- `PessoaVinculoRepository`: `buscarPorPessoa(id)`: `SELECT v FROM PessoaVinculo v JOIN FETCH v.pessoaOrigem JOIN FETCH v.pessoaDestino WHERE v.pessoaOrigem.id = :id OR v.pessoaDestino.id = :id`.

**service/PessoaService**
- `ORDENAVEIS = Set.of("codPessoa", "nome", "createdAt")`. Ordem padrão: `nome`.
- **Todo método começa com `exigirTenantSelecionado()`, inclusive as leituras.**
- `listar(...)` → `PaginaDto<PessoaListaDto>`. São 6 consultas por página: página, contagem, tipos e os 3 principais.
- `buscarPorId(id)` → `PessoaResponseDto`. Lê as filhas, os tipos e os vínculos, e chama `buscarNomes`.
- `buscarEntidade(id)`: 404 `"Pessoa não encontrada."`.
- `listarParaSelecao(busca, ignorarId)` → `List<PessoaSelectDto>`. O termo passa pelo `TextoBusca`.
- `criar(dto)`, sem `@Transactional`:
  - `repetir.executar("uk_pessoa_tenant_cod_pessoa", () -> gravarNova(dto))`;
  - violação de `uk_pessoa_tenant_cpf` ou `_cnpj` → `ConflitoCampoException`;
  - `gravarNova`:
    1. `travadas = travarPorIds(ids dos vínculos)`.
    2. `validar(dto, null, travadas, antes = vazio)`.
    3. `toEntity`, `nomeBusca`, `setCodPessoa(buscarProximoCodigo())` e `saveAndFlush`.
    4. `gravarFilhas`.
    5. `vinculoService.sincronizar`.
    6. `marcarAlteradaPorVinculo(parceiros)`.
    7. `montarResposta`.
- `atualizar(id, dto)` `@Transactional`:
  1. `buscarEntidade(id)`: 404.
  2. Versão diferente → 409.
  3. `antes = vinculoRepository.buscarPorPessoa(id)`.
  4. `travarPorIds({id} ∪ outras de antes ∪ dto.vinculos.pessoaId)`.
  5. `validar(dto, id, travadas, antes)`.
  6. `marcarAlteracao(id, version, ...)`; 0 linhas → 409. Assim qualquer mudança de vínculo vinda do outro lado depois do passo 2 também dá 409, porque subiu a versão desta.
  7. Relê, `atualizarEntidade`, `nomeBusca`, `saveAndFlush`.
  8. `substituirFilhas`: tipos e as 4 filhas, com `removerPorPessoa` + `saveAll` + `flush`.
  9. `parceiros = vinculoService.sincronizar(p, dto.vinculos, antes)` e `marcarAlteradaPorVinculo(parceiros)`.
  10. `montarResposta`.
- `inativar(id)` e `ativar(id)`, como na revisão 1.
- `validar` (privado):
  - **Campo do tipo errado:** `CampoInvalidoException`, ex.: `("cnpj", "Pessoa física não tem CNPJ.")`.
  - **CPF e CNPJ:**
    - DV inválido → `("cpf", "CPF inválido.")`;
    - repetido no contratante → `ConflitoCampoException("cpf", "CPF já cadastrado (código N).")`.
  - **Tamanhos:** RG de 6 a 10 caracteres; IE e IM de 5 a 12 dígitos.
  - **Tipos de cadastro:** em lote, por `tipoCadastroService.buscarPorIds`.
    - id que não volta → `("tiposCadastroIds", "Tipo de cadastro não encontrado.")`;
    - inativo que a pessoa não tinha → `("tiposCadastroIds", "Tipo de cadastro inativo.")`.
  - **Tipo das filhas:** mesma regra, pelos services dos auxiliares. Campo `telefones[i].tipoId`, mensagens "Tipo de telefone não encontrado." e "Tipo de telefone inativo."; idem para e-mail, rede e endereço. Inativo só passa se a pessoa já tinha aquele tipo na mesma lista.
  - **Principal:** dois marcados → `("telefones", "Marque só um telefone principal.")`; nenhum marcado → o primeiro vira principal.
  - **Rede social:** vazia → `("redesSociais[i].usuario", "Informe o usuário ou o link.")`.
  - **Cidade:** em lote; inexistente → `("enderecos[i].cidadeId", "Cidade não encontrada.")`.
  - **Vínculos** (`vinculos[i].pessoaId`):
    - a própria pessoa → "Uma pessoa não pode ser vinculada a ela mesma.";
    - repetida na lista → "Esta pessoa já está na lista.";
    - fora de `travadas` (não existe ou é de outro contratante) → "Pessoa não encontrada.";
    - inativa e nova → "Esta pessoa está inativa.";
    - (P1) `tipo = EMPRESA` com a outra PF → `vinculos[i].tipo` "A empresa precisa ser pessoa jurídica.";
    - (P1) `tipo = CONTATO` com esta PF → "Só pessoa jurídica tem contato.".
- Nada de dado pessoal em log. Pessoa não gera evento de segurança.

**service/PessoaVinculoService** (mesmo módulo):
- `List<PessoaVinculo> buscarDaPessoa(UUID id)`.
- `Set<UUID> sincronizar(Pessoa p, List<PessoaVinculoItemDto> itens, List<PessoaVinculo> antes)`:
  - casa pela **outra pessoa**, que é única por par;
  - a que saiu → `deleteAll` + `flush`, antes de inserir (`uk_pessoa_vinculo_par`);
  - a que entrou → insere com `PessoaMapper.vinculo`;
  - tipo ou observação mudou → atualiza a linha, na orientação dela;
  - devolve os ids das outras pessoas cujo vínculo mudou.

**controller/PessoaController** (`/api/pessoas`)

| Método | Rota | Authority |
|---|---|---|
| GET | `/api/pessoas?codPessoa=&busca=&documento=&tipoPessoa=&tipoCadastroId=&ativo=&page=&size=&sort=` (`codPessoa @Positive`, `busca @Size(max=100)`, `documento @Size(max=18)`; `@PageableDefault(size=20, sort="nome")`) | `PESSOAS_LER` |
| GET | `/api/pessoas/selecao?busca=&ignorarId=` (`busca @Size(max=100)`) → até 20 `PessoaSelectDto`, só ativas | `PESSOAS_LER` |
| GET | `/api/pessoas/{id}` | `PESSOAS_LER` |
| POST | `/api/pessoas` → 201 | `PESSOAS_ESCREVER` |
| PUT | `/api/pessoas/{id}` | `PESSOAS_ESCREVER` |
| PATCH | `/api/pessoas/{id}/inativar` e `/ativar` → 204 | `PESSOAS_ESCREVER` |

### 3.6 Permissões

- `Tela`, novas:
  - `PESSOA_LIST("pessoa-list", "Pessoas — lista")`;
  - `PESSOA_FORM("pessoa-form", "Pessoas — cadastro")`;
  - `TIPO_CADASTRO_FORMLIST("tipo-cadastro-formlist", "Tipos de cadastro")`;
  - `TIPO_TELEFONE_FORMLIST`, `TIPO_EMAIL_FORMLIST`, `TIPO_ENDERECO_FORMLIST` e `TIPO_REDE_SOCIAL_FORMLIST`, com os códigos da tabela da §3.4.
- `GrupoLiberacao`, dois grupos **novos**, declarados antes de `USUARIOS` (os de negócio vêm primeiro no "Acesso aos módulos"):
  - `PESSOAS("Pessoas", List.of(PESSOA_LIST, PESSOA_FORM), List.of())`;
  - `CADASTROS_AUXILIARES("Cadastros auxiliares", List.of(as 5 telas), List.of())`.
- Sem ação extra. O ADMIN recebe os dois sozinho. O catálogo do `UsuarioForm` vem da API, sem mudar o front.

### 3.7 Testes (`src/test/java/com/api/ero_api/...`)

**`auxiliar/AuxiliarIntegracaoTest`**: `@ParameterizedTest` sobre as 5 rotas, para a cópia não escapar sem teste.
- Os 4 obrigatórios:
  - `caminhoFeliz`: a lista traz os itens do sistema, com `sistema=true`; cria, altera, inativa e ativa um item próprio;
  - `validacaoRecusada`: nome vazio e nome com 26 caracteres;
  - `isolamentoEntreTenants`: o item próprio de A não aparece em B; PUT e PATCH com id de A dentro de B → 404; o mesmo nome passa no outro contratante;
  - `parLerEscrever`: com LER, GET 200 e POST/PUT/PATCH 403; sem o grupo, GET 403; `/selecao` 200 para qualquer usuário sem pendência; superadmin na plataforma → 422.
- Código:
  - `codigo_itensDoSistemaSao1aN_oPrimeiroProprioEhNmais1`;
  - `codigo_ignoradoNoCorpo`;
  - `codigo_doisCriarSimultaneosSem409`: só em `tipos-cadastro`, copiando o paralelo do `UsuarioIntegracaoTest`.
- Regras:
  - `itemDoSistemaNaoAltera422`: PUT, inativar e ativar;
  - `nomeRepetidoComOSistema409`: "celular" e "CELULÁR" → `erros[campo=nome]`;
  - `selecaoSoAtivos` e `selecaoComInativos`.

**`tenant/TenantIntegracaoTest`:**
- `contratanteNovoRecebeOsItensDoSistema`: 5 + 4 + 2 + 3 + 5, iguais aos enums (chave, nome, código);
- a Plataforma continua sem itens.

**`pessoa/PessoaIntegracaoTest`** (copia o `UsuarioIntegracaoTest`):
- **Obrigatórios e código:** os 4 obrigatórios e os 4 de código da revisão 1. O CPF repetido continua passando em outro contratante.
- **Documentos e campos:** `cpfDuplicado409ComCampoECodigo`, `cnpjDuplicado409`, `campoDoTipoErrado400`, `trocaDeTipoLimpaOsCamposAnteriores`.
- **Filhas e versão:** `doisPrincipais400`, `nenhumPrincipalOPrimeiroVira`, `listaEhOEstadoCompleto`, `versaoSobeQuandoSoUmTelefoneMuda`.
- **Busca e filtros:** `buscaSemAcento`, `filtroDocumentoComMascaraEParcial`, `filtroTipoCadastro` (também com o parâmetro nulo), `rgIeImForaDoTamanho400`, `cidadeInexistente400`, `listaSemNMais1` (no máximo 6 comandos).
- **Tipos:**
  - `tipoDeOutroContratante400`, para tipo de cadastro e tipo de telefone;
  - `tipoInativoNovo400`;
  - `tipoInativoJaGravadoContinuaAceito`.
- **Vínculos:**
  - `vinculoApareceNosDoisLados`: A põe B como Dependente → B mostra A como Responsável;
  - `vinculoConsigoMesma400`, `vinculoRepetidoNaLista400`, `vinculoComPessoaDeOutroContratante400`, `vinculoComInativaNova400`;
  - `removerPeloOutroLadoSomeNosDois`;
  - `versaoDoOutroLadoSobe`: o PUT de B com a versão antiga → 409;
  - `vinculoEmpresaPrecisaSerPJ400` (P1);
  - `doisSalvandoAoMesmoTempoAeBSemErro500`: em paralelo, os dois terminam com 200 ou 409, nunca deadlock nem 500.
- **Seleção:** `selecaoExigePessoasLer403`, `selecaoSoAtivasAte20EIgnoraId`, `selecaoNaoTrazOutroContratante`.
- **Unitário `OrdemUuidTest`:** compara com `SELECT a < b` no PostgreSQL para 1.000 pares aleatórios (dentro do Testcontainers).

**Os outros:**
- `localidade/LocalidadeIntegracaoTest`: os da revisão 1.
- `compartilhado/RepetirSeCodigoRepetidoTest`: os da revisão 1.
- `ArquiteturaTest` verde, com `Estado` e `Cidade` na lista justificada.
- `mvnw verify` verde (com o Docker ligado).

## 4. Front

### 4.1 Kit, casca e movimento (`glass-design-system` e `motion-designer`, antes das telas)

| Peça | Contrato |
|---|---|
| **Casca: seções e submenu** (`design-system/shell/navegacao.ts`, `Sidebar.tsx`, `CommandPalette` pela Casca) | **Seções:**<br>• `ItemMenu` ganha `filhos?: ItemMenu[]`;<br>• `Sidebar` e `MobileNav` trocam `itens`/`itensSistema`/`rotuloSistema` por `secoes: { rotulo: string; itens: ItemMenu[] }[]`, cada seção um `<nav aria-label>` separado pela linha `--line`.<br>**Item com `filhos`:** vira botão (`aria-haspopup="menu"`, `aria-expanded`), ativo quando a rota está sob o `to`, e abre o **submenu flutuante**:<br>• `glass-solid`, `z-popover`, à direita do trilho (no celular, acima da barra);<br>• título = rótulo do pai; filhos com ícone e texto;<br>• setas ↑↓, Enter, Esc e clique fora fecham; o foco volta ao botão;<br>• a dica (tooltip) do pai some enquanto está aberto.<br>`MAXIMO_NA_BARRA_INFERIOR` continua 5, contando as seções na ordem. O Ctrl+K lista os filhos como "Cadastros auxiliares › Tipos de telefone". |
| `TCombo`: largura automática | Sem `width`, usa `situacao` se `maiorRotulo(opcoes + vazio) ≤ 18` e `medio` se `≤ 36`, pela mesma regra do `medir-campos.mjs`. Necessário porque as opções agora vêm do banco. Ajustar `docs/07` §2.3. |
| `TFieldList` (novo; o do 2.0 vestido de vidro) | O contrato da revisão 1:<br>• `name`, `colunas`, `novaLinha`, `minimo?`, `rotuloAdicionar?`, `vazio?`, `detalhe?`;<br>• `principal?`: rádio `.marca` por linha; marcar um desmarca os outros; a 1ª linha já vem principal; remover a principal passa a marca para a 1ª;<br>• `colunas` como `ColunaDaLista[][]`: item em várias `TRow`, com borda `--line`;<br>• `coluna.dividir?`: `TCol` sem `width`;<br>• só leitura trava Acrescentar, Remover e o rádio;<br>• `data-kit="TFieldList"`.<br>**Novo:** a coluna aceita qualquer campo do kit, inclusive `TDBCombo` com `acao` (vínculos). |
| `TTextArea` (novo) | `linhas?` (padrão 3), `maxLength?` e o contador "máx. N caracteres"; largura padrão `longo`. |
| `TEntry.onCompletar?(cru)` | Disparado quando a máscara de documento fica completa (CEP com 8 dígitos). |
| `erroApi` com colchetes | `telefones[0].numero` → `telefones.0.numero`, com teste. |
| Catálogo `/design-system` | `TFieldList` (telefones; endereço em várias linhas), `TTextArea`, `TCombo` automático e o submenu, nos dois temas e em só leitura. |
| `docs/07` | §0: as peças passam a existir. §3.2: as props novas. §4.3: o modelo FormList passa a ser a `TipoCadastroFormList` (§4.3 deste plano). |

**Movimento (`motion-designer`):**
- `linhaDaLista` em `motion/tokens.ts`:
  - entrada ao acrescentar e recolhimento de altura ao remover;
  - serve também à troca entre os blocos de PF e PJ, sem pular layout;
  - o `TFieldList` usa a variante por dentro; a tela não escreve movimento.
- `submenu`: abre do trilho para fora, com mola curta, e fecha mais rápido.
- Nas duas, o movimento reduzido fica só com a opacidade.

**Já existem e servem:**
- `TDBCombo` (busca no servidor, `rotuloInicial`, `acao`);
- as máscaras `cpf`, `cnpj`, `cpfCnpj`, `cep`, `telefone`, `inteiro`;
- `TCheckBox` em grupo, com `desabilitada`/`dica`;
- `TRadio` com `vazio`, `TBadge`, `TDate`, `TModal` (o modal do `UsuarioForm` é o exemplo);
- `TAcoesDeExportacao` e `DocumentoLista`.

### 4.2 Menu, rotas e APIs compartilhadas

**`app/menu.ts`:**
- `TELAS_DE_CADASTRO`:
  - Pessoas: `{ tela: 'pessoa-list', to: '/cadastros/pessoas', label: 'Pessoas', icon: Contact, escopo: 'contratante', descricao: 'Clientes, fornecedores, leads e contatos.' }`;
  - o pai `AUXILIARES`: `{ to: '/cadastros/auxiliares', label: 'Cadastros auxiliares', icon: Tags, filhos: [...] }`, com os 5 filhos:

    | Filho | Rota | Ícone | Tela |
    |---|---|---|---|
    | Tipos de cadastro | `/cadastros/auxiliares/tipos-de-cadastro` | `Tag` | `tipo-cadastro-formlist` |
    | Tipos de telefone | `/cadastros/auxiliares/tipos-de-telefone` | `Phone` | `tipo-telefone-formlist` |
    | Tipos de e-mail | `/cadastros/auxiliares/tipos-de-email` | `Mail` | `tipo-email-formlist` |
    | Tipos de endereço | `/cadastros/auxiliares/tipos-de-endereco` | `MapPin` | `tipo-endereco-formlist` |
    | Tipos de rede social | `/cadastros/auxiliares/tipos-de-rede-social` | `AtSign` | `tipo-rede-social-formlist` |

    Todos com `escopo: 'contratante'`.
- `menuDeCadastros(usuario)`: Pessoas, se liberada, e o pai só com os filhos liberados (some se nenhum).
- `TITULOS`: uma expressão por rota nova.
- `menu.test.ts` cobre:
  - o usuário só com `CADASTROS_AUXILIARES` vê só o pai;
  - o superadmin na plataforma não vê a seção.

**Casca e Início:**
- `Casca.tsx`: `secoes = [{ rotulo: 'Principal', itens: menu }, { rotulo: 'Cadastros', itens: cadastros }, { rotulo: ROTULO_ADMINISTRATIVO, itens: administrativo }]`.
- `InicioPage`: os atalhos incluem Pessoas e os 5 filhos, achatados.

**Rotas** (`modules/pessoas/routes.tsx` e `modules/auxiliares/routes.tsx`, incluídas em `app/rotas.tsx`):
- todas com `ExigeTela tela=... escopo="contratante"`;
- `/cadastros/auxiliares` redireciona para o primeiro filho liberado;
- **`ExigeTela` sai de `modules/admin/components/` para `shared/sessao/`** (ajustar os imports do admin).

**APIs:**
- `shared/api/auxiliares.ts`:
  - `selecionarTipos(recurso, inativos?)` → `{ id, nome, chave, ativo }[]`, com zod. `recurso` é `'tipos-cadastro' | 'tipos-telefone' | 'tipos-email' | 'tipos-endereco' | 'tipos-rede-social'`;
  - `opcoesDeTipo(lista, salvos[])` → `OpcaoSelect[]`: os ativos, mais os salvos inativos como "Nome (inativo)";
  - teste unitário.
  - Fica em `shared/` porque é usado por `pessoas` e por `auxiliares`.
- `shared/api/localidade.ts`: `buscarCidades(termo)` (`{ id, nome: "Porto Alegre - RS" }`) e `consultarCep(cep)`.

### 4.3 Auxiliares: `TipoCadastroFormList` = **o modelo FormList** (docs/07 §4.3), e 4 cópias

Arquivos em `ero-web/src/modules/auxiliares/`:
- `pages/TipoCadastroFormList.tsx`;
- `api/tiposCadastro.ts`: `listar`, `criar`, `alterar`, `inativar`, `ativar`, com `tipoCadastroSchema`;
- `schemas/tipoCadastro.ts` + teste: `Dados { nome }`, `VAZIO`, `paraForm`, `paraCorpo` (com `trim`).

Copia o exemplo da §4.3 do `docs/07`, trocando:
- `useSomenteLeitura('CADASTROS_AUXILIARES')`;
- `queryKey ['tipos-cadastro', 'lista', pagina]`, `sort: 'nome,asc'`. Ao salvar, inativar ou reativar, invalidar `['tipos-cadastro']` (pega também a seleção).
- título "Tipos de cadastro"; breadcrumb `['Cadastros', 'Auxiliares', 'Tipos de cadastro']`; `coreografia="formulario"`.

Campos, um por `TRow`:
1. `TEntry label="Código" value={editando?.codTipoCadastro ?? ''} placeholder="Automático" disabled width="codigo"`
2. `TEntry name="nome" label="Nome" required maxLength={25} autoFocus={!somenteLeitura} width="curto"`

Botões: Salvar · Novo (o `limpar`).

Grade (ativos e inativos, sem filtro):
1. **Código**: `numerica`, `w-px whitespace-nowrap`.
2. **Nome**: `principal: true`.
3. **Origem**: `TBadge tom="info"` "Sistema" ou `TBadge tom="neutro"` "Próprio", `w-px whitespace-nowrap`.
4. **Situação**: `TBadge`.

Ações da grade:
- `acoes` só quando `!somenteLeitura`;
- a linha do sistema **não tem** Editar nem Inativar (o `acoes` devolve `null` para ela).

Erros: o 409 com `erros[campo=nome]` marca o Nome (`msg.erroApi(e, form)`). O 422 do item do sistema não acontece pela tela.

**Cópias** (só trocam nome, rota, `queryKey`, `codTipo<X>`, título e breadcrumb):
- `TipoTelefoneFormList`
- `TipoEmailFormList`
- `TipoEnderecoFormList`
- `TipoRedeSocialFormList`

Cada uma tem `pages/`, `api/tipos<X>.ts` e `schemas/tipo<X>.ts`. A fiação (menu, as 5 rotas e o redirecionamento) já nasce na execução do modelo; as cópias **não mexem** em `menu.ts` nem em `routes.tsx`.

### 4.4 PessoaList: **cópia direta do modelo List** (`ContratanteList.tsx` / `UsuarioList.tsx`)

Arquivos: `modules/pessoas/api/pessoas.ts` (`listar`, `buscar`, `criar`, `alterar`, `inativar`, `ativar`, `selecionar(busca, ignorarId)`; zod de lista, ficha e seleção) e `schemas/pessoaFiltros.ts` + teste (`Filtros`, `FILTROS_VAZIOS` com `ativo: 'true'`, `paraConsulta` com `paraNumero` no código, `colunasExportadas`).

- `useSomenteLeitura('PESSOAS')`, `queryKey ['pessoas', 'lista', aplicados, pagina]`, `sort: 'nome,asc'`.
- Título "Pessoas"; breadcrumb `['Cadastros', 'Pessoas']`.

Filtros, um por `TRow`:
1. `TEntry name="codPessoa" label="Código" mascara="inteiro" width="codigo" maxLength={10}`
2. `TEntry name="busca" label="Nome ou fantasia" maxLength={100}` (`metade`)
3. `TEntry name="documento" label="CPF ou CNPJ" mascara="cpfCnpj"` (`cnpj`)
4. `TCombo name="tipoPessoa" label="Tipo de pessoa" opcoes={TIPO_PESSOA_OPCOES} vazio="Todas"` (automático → `situacao`)
5. `TCombo name="tipoCadastroId" label="Tipo de cadastro" opcoes={opcoesDeTipo(selecionarTipos('tipos-cadastro', true))} vazio="Todos"` (automático)
6. `TCombo name="ativo" label="Situação" opcoes={SITUACAO_OPCOES} vazio="Todas"`

Rodapé: Buscar · Limpar · Novo (`!somenteLeitura`) · Exportar · Pdf.

Colunas:
1. **Código**: `numerica`, `w-px whitespace-nowrap`.
2. **Nome**: `principal: true`; a fantasia embaixo, em `text-muted`.
3. **CPF/CNPJ**: `formatarDocumento`, `w-px whitespace-nowrap tabular-nums`.
4. **Tipos**: um `TBadge` por tipo, `secundaria`.
5. **Telefone**: `mascararTelefone`, `secundaria`, `w-px`.
6. **Cidade**: "Cidade/UF", `secundaria`.
7. **Situação**: `TBadge`.

Ações: editar e inativar/reativar (com `useQuestion`). A linha abre `/cadastros/pessoas/:id`.

Exportar e Pdf (`DocumentoLista`, `titulo="Pessoas"`):
- colunas: Código · Nome (com "· fantasia") · CPF/CNPJ (`semQuebra`) · Tipos · Telefone (`semQuebra`) · E-mail (`quebra: 'email'`) · Cidade/UF · Situação;
- filtros aplicados na 1ª página;
- **sem nascimento**.

Esta execução cria `routes.tsx` (só a lista) e a entrada de Pessoas no menu.

### 4.5 PessoaForm: **cópia do modelo Form** (a partir do `UsuarioForm.tsx`, que tem painéis)

Arquivos: `pages/PessoaForm.tsx` e `schemas/pessoa.ts` + teste.
- `Dados`: zod com `superRefine` por tipo.
- `VAZIO`, `paraForm`.
- `paraCorpo`:
  - manda `null` nos campos do outro tipo;
  - manda `tiposCadastroIds` e `tipoId` nas filhas;
  - tira `cidadeRotulo` e `pessoaRotulo`.
- `TIPO_PESSOA_OPCOES`, `SEXO_OPCOES` e `TIPO_VINCULO_OPCOES`.

A execução acrescenta `/cadastros/pessoas/novo` e `/:id` ao `routes.tsx`.

Cabeçalho e comportamento:
- `useSomenteLeitura('PESSOAS')`.
- Títulos: "Nova pessoa", "Editar pessoa", ou "Pessoa" para quem só lê.
- Breadcrumb `['Cadastros', 'Pessoas', nome | 'Nova']`, `coreografia="formulario"`.
- Erro ao carregar → volta para `/cadastros/pessoas`.
- As opções dos 5 tipos vêm de `selecionarTipos` (só ativos, uma `useQuery` por recurso), passadas pelo `opcoesDeTipo` com os tipos já gravados.

Campos, um por `TRow`:
1. `TEntry label="Código" value={salvo?.codPessoa ?? ''} placeholder="Automático" disabled width="codigo"`
2. `TRadio name="tipoPessoa" label="Tipo de pessoa" opcoes={Física, Jurídica} required`. Vem antes do Nome porque muda o rótulo dele e os campos de baixo.
3. `TEntry name="nome" label={PF ? 'Nome' : 'Razão social'} required maxLength={255} autoFocus` (`metade`)
4. **Só PF**:
   - `TEntry name="cpf" label="CPF" mascara="cpf"` (`cpf`)
   - `TEntry name="rg" label="RG" maxLength={20} width="cpf"`
   - `TDate name="dataNascimento" label="Data de nascimento" max={hojeIso()}` (`data`)
   - `TRadio name="sexo" label="Sexo" opcoes={Masculino, Feminino} vazio="Não informado"`
5. **Só PJ**:
   - `TEntry name="nomeFantasia" label="Nome fantasia" maxLength={255}` (`metade`)
   - `TEntry name="cnpj" label="CNPJ" mascara="cnpj"` (`cnpj`)
   - `TEntry name="inscricaoEstadual" label="Inscrição estadual" maxLength={20} width="curto"`
   - `TEntry name="inscricaoMunicipal" label="Inscrição municipal" maxLength={20} width="curto"`

   Trocar o tipo limpa os campos do outro bloco, e a troca usa `linhaDaLista`.
6. `TPanel title="Classificação"`:
   - `TCheckBox name="tiposCadastro" label="Tipos de cadastro" opcoes={...} required`. O inativo já gravado aparece com `dica="Inativo"`; se for desmarcado, fica `desabilitada`.
   - `TTextArea name="observacao" label="Observação" maxLength={500}` (`longo`)
7. `TPanel title="Telefones"`, com `TFieldList name="telefones" principal="principal" rotuloAdicionar="Acrescentar telefone" vazio="Nenhum telefone."`. Uma linha por item:
   - Tipo: `TCombo name="tipoId"` (automático)
   - Número: `TEntry mascara="telefone"` (`cpf`)
   - Observação: `TEntry maxLength={255}`, `dividir`
   - Principal e o remover
8. `TPanel title="E-mails"`, com `TFieldList name="emails" principal="principal"`. Uma linha por item:
   - Tipo: `TCombo` (automático)
   - E-mail: `TEntry type="email" maxLength={255}`, `dividir`
   - Observação: `dividir`
   - Principal
9. `TPanel title="Redes sociais"`, com `TFieldList name="redesSociais"` (sem principal). Uma linha por item:
   - Rede: `TCombo` (automático)
   - Usuário: `TEntry maxLength={255} width="curto"`
   - Link: `TEntry maxLength={500}`, `dividir`
10. `TPanel title="Endereços"`, com `TFieldList name="enderecos" principal="principal" rotuloAdicionar="Acrescentar endereço"`. Item em várias linhas:
    - L1: Tipo (`TCombo`, automático) · Principal
    - L2: CEP `TEntry mascara="cep" onCompletar` (`cep`) · Número `width="curto"` · Complemento `width="curto"`
    - L3: Rua `width="longo"`
    - L4: Bairro `width="curto"` · Cidade `TDBCombo buscar={buscarCidades} rotuloInicial={linha.cidadeRotulo} required width="medio"`
11. `TPanel title="Vínculos"`: §4.6 (etapa E5).
12. `TAuditoria registro={salvo.data}`. A Situação fica na grade.
13. `TFormFooter`: Salvar · Novo · Voltar.

`consultarCep(i, cep)`:
- preenche sempre `cidadeId` e `cidadeRotulo`;
- preenche rua e bairro só se estiverem vazios ou ainda com o valor do CEP anterior (um `useRef` por linha);
- `cepUnico` → `msg.info` e foco na rua;
- 400, 404 e 503 → `form.setError` no CEP da linha.

### 4.6 Vínculos e cadastro rápido (dentro do PessoaForm; etapa E5)

**Painel Vínculos:** `TPanel title="Vínculos"`, com `TFieldList name="vinculos" rotuloAdicionar="Acrescentar vínculo" vazio="Nenhum vínculo."`. Uma linha por item:
- **Pessoa:** `TDBCombo name="pessoaId" label="Pessoa" required width="medio"`.
  - `buscar={(t) => pessoasApi.selecionar(t, id)}`, que mapeia para `{ id, nome: \`${cod} · ${nome}\` }`;
  - `rotuloInicial={linha.pessoaRotulo}`;
  - `acao={!somenteLeitura && <TButton variant="novo" label="" aria-label="Cadastrar pessoa" onClick={() => setRapida(i)} />}`.
  - Vínculo com pessoa inativa mostra `TBadge` "Inativa" na ajuda do campo.
- **Tipo:** `TCombo name="tipo" label="É o quê desta pessoa" opcoes={TIPO_VINCULO_OPCOES} required` (automático → `situacao`).
- **Observação:** `TEntry name="observacao" maxLength={255}`, `dividir`.
- O remover.

**`modules/pessoas/components/PessoaRapidaModal.tsx`:**
- Copia o modal "Redefinir senha" do `UsuarioForm`.
- `TModal largura="md" titulo="Cadastro rápido de pessoa"`, renderizado **fora** do `TForm` principal (no fim da `TPage`), com o estado `rapida: number | null` (a linha que pediu).
- `useForm` próprio. Campos, um por `TRow`:
  1. `TRadio tipoPessoa`
  2. `TEntry nome` (Nome/Razão social, required)
  3. PF: `TEntry cpf mascara="cpf"`, `TDate dataNascimento`, `TRadio sexo vazio="Não informado"`. PJ: `TEntry cnpj mascara="cnpj"`.
  4. `TCheckBox tiposCadastro`, só ativos, com o item `chave === 'CLIENTE'` já marcado (P3)
  5. `TEntry telefone mascara="telefone"` (opcional). Vai como `telefones: [{ tipoId: <chave CELULAR>, numero, principal: true }]`.
- Rodapé: Salvar · Cancelar.
- Salvar:
  - `pessoasApi.criar` (o mesmo `POST`);
  - põe na linha `pessoaId = nova.id` e `pessoaRotulo = "cod · nome"`;
  - invalida `['pessoas']` e fecha.
- 400 e 409 com campo → `msg.erroApi(e, formRapida)`.

### 4.7 Relatório

Só o Pdf da List, com o `DocumentoLista` que já existe. O agente `relatorios` não entra. O resumo do 2.0 (total, físicas, ativas) fica em aberto.

## 5. Riscos e como o plano evita

| Risco | Prevenção |
|---|---|
| Superadmin na plataforma lê ou grava pessoas e tipos de todos os contratantes (ROOT não filtra) | `exigirTenantSelecionado()` em toda rota de `pessoa` e `auxiliar`, também nos GET e no `/selecao`; teste com 422. |
| MAX+1 calculado em ROOT pega o maior de todos os contratantes | `semear` usa código explícito e tem guarda de ROOT; `buscarProximoCodigo` só roda depois do `exigirTenantSelecionado`. |
| Pessoa apontando para tipo de outro contratante (IDOR por id) | Busca em lote filtrada (400 "não encontrado") **e** FK composta `(tipo_id, tenant_id)` no banco. |
| Os itens do sistema da 014 e o enum ficarem diferentes | O `revisor-backend` confere as 5 listas; teste do contratante novo contra o enum. **Regra para o futuro:** item novo do sistema = constante no fim do enum + migration que semeia os existentes. Se o contratante já tiver item com o mesmo `nome_busca`, a migration **adota** o dele (`UPDATE ... SET chave`) em vez de inserir. Fica em `docs/05`. |
| Alterar ou inativar item do sistema por chamada direta | 422 no service e `ck_<t>_sistema_ativo` no banco. |
| Nome repetido numa corrida | Índice `(tenant_id, nome_busca)` + tradução para 409 com campo. |
| Vínculo apagado em silêncio pela ficha aberta do outro lado (lost update) | Salvar sobe a `version` da outra pessoa quando o vínculo dela mudou; a ficha aberta recebe 409. |
| Deadlock entre A e B salvando ao mesmo tempo | `travarPorIds` em ordem de id antes de qualquer `UPDATE`; teste paralelo. |
| Orientação do vínculo diferente entre Java e banco | `OrdemUuid.COMO_NO_BANCO` (sem sinal) + `ck_pessoa_vinculo_ordem`; teste contra o PostgreSQL. |
| Escrita velha quando só uma filha mudou | `marcarAlteracao` sobe a versão e trava a linha. |
| Código repetido entre requisições simultâneas | `RepetirSeCodigoRepetido` (transação por tentativa); `criar` sem `@Transactional`; testes. |
| IDOR em filha | A entrada não tem `id` de filha; o DELETE é sempre por `pessoaId` já filtrado; FK composta. |
| N+1 | Lista com 6 consultas; filhas fora da entidade; teste com estatísticas. |
| SSRF ou abuso no CEP | Host fixo, `\d{8}` antes de montar a URL, 3 s, sem redirecionamento, limite próprio; log sem o CEP. |
| XSS por link de rede social | `^https?://` no DTO e no CHECK; a tela não usa o link como `href` nesta entrega. |
| LGPD | `/selecao` exige `PESSOAS_LER` e devolve só código e nome; `toString` sem dado pessoal; 409 só com o código; exportação sem nascimento nem RG. |
| Barra inferior do celular estourar | Hoje cabe (Início, Pessoas, Auxiliares, Usuários, Logs = 5). Com o próximo módulo, vira pergunta ao dono (agrupar mais no submenu). |
| `TCombo` automático mudar telas antigas | As antigas com até 18 caracteres não mudam; as que têm `width` explícito, também. O `guardiao-layout` remede Usuários e Contratantes. |

## 6. Ordem de execução (etapas na branch `timeero/pessoas`) e foco dos conferentes

| Etapa | Quem | O quê | Depende de | Paralelo com |
|---|---|---|---|---|
| **E0** | dono | Responde a P1, a P2 e a P3 (§2.3) | | |
| **E1a** | `dev-backend` | §3.1 + 013/`localidade` + 014/`auxiliar` + `semear` no `TenantService` + grupo `CADASTROS_AUXILIARES` + testes (Auxiliar, Localidade, Tenant, RepetirSeCodigo) → `mvnw verify` | E0 | E1b |
| **E1b** | `glass-design-system`, depois `motion-designer` | §4.1: casca (seções e submenu), `TCombo` automático, `TFieldList`, `TTextArea`, `onCompletar`, `erroApi`, catálogo, `docs/07`; movimentos `linhaDaLista` e `submenu` | E0 | E1a |
| **E2** | `frontend-modulos` (1 execução) | **Modelo FormList** `TipoCadastroFormList` + `shared/api/auxiliares.ts` + `shared/api/localidade.ts` + mudar a `ExigeTela` + menu "Cadastros" com os 5 filhos + as 5 rotas | E1b (contrato da §3.4; não precisa do back rodando) | E3 |
| **E3** | `dev-backend` | 015 a 018 + módulo `pessoa` completo (vínculos, `/selecao`) + grupo `PESSOAS` + `PessoaIntegracaoTest` → `mvnw verify` | E1a | E2, E4 |
| **E3r** | `revisor-backend` ‖ `seguranca` | Revisão do backend inteiro (E1a + E3) | E3 | E4 |
| **E4a** | `frontend-modulos`, **5 execuções em paralelo** | `TipoTelefoneFormList`, `TipoEmailFormList`, `TipoEnderecoFormList`, `TipoRedeSocialFormList` (cópias; só os próprios arquivos) e **PessoaList** (cópia do List; `api/pessoas.ts`, filtros, rota da lista, Pessoas no menu) | E2 | E3/E3r |
| — | orquestrador | `npm run build` + `vitest` uma vez, depois das 5 | E4a | |
| **E4b** | `frontend-modulos` (1 execução) | **PessoaForm**, sem o painel Vínculos (§4.5) | E4a | |
| **E5** | `frontend-modulos` (1 execução) | Painel **Vínculos** + **PessoaRapidaModal** (§4.6) | E4b | |
| **E6** | `guardiao-layout` ‖ `revisor-ui` ‖ `seguranca` (parte do front) | Passada visual única e revisões | E5 | |
| **E7** | `qa` → correções (no máximo 2 voltas) → `docs/negocio` (§7) | | E6 | |

**Kit e movimento:**
- **Peças novas:** casca com seções e submenu flutuante, `TCombo` com largura automática, `TFieldList`, `TTextArea`, `TEntry.onCompletar` e `erroApi` com colchetes. A cargo do `glass-design-system`, na E1b, antes das telas.
- **Movimentos novos:** `linhaDaLista` e `submenu`, a cargo do `motion-designer`.

**Telas:** todas são **cópia direta de modelo**. Nenhuma foge do padrão (não há kanban, agenda nem painel), então nenhuma precisa do Opus.
- os 5 FormList: o 1º é o modelo, as outras 4 são cópias;
- PessoaList: modelo List;
- PessoaForm: modelo Form, com painéis.
- O submenu é peça do kit, não tela.
- Medir o custo do PessoaForm (memória "Custo do /timeero").

**Foco dos conferentes:**
- `revisor-backend`:
  - `RepetirSeCodigoRepetido`: transação por tentativa, nome do índice, `criar` sem `@Transactional`;
  - as 5 cópias do `auxiliar` idênticas fora os nomes;
  - as 5 listas da 014 iguais aos enums;
  - a ordem `travarPorIds` → `marcarAlteracao` → reler → salvar → vínculos;
  - `OrdemUuid`;
  - o `EXISTS` com o parâmetro nulo e o `CAST` nos parâmetros;
  - nenhuma entidade em DTO (`*SelectDto` aninhados);
  - a justificativa de `Estado`/`Cidade` sem tenant.
- `seguranca`:
  - a guarda de ROOT no `semear` e nenhum `comoRoot` novo;
  - `exigirTenantSelecionado` em todas as rotas;
  - as FKs compostas e o tipo de outro contratante;
  - `/selecao` com `PESSOAS_LER` e sem dado pessoal;
  - ViaCEP (SSRF, timeout, redirecionamento, limite);
  - IDOR das filhas e dos vínculos;
  - `toString` e logs; URL `javascript:`; a mensagem do 409;
  - o 422 do item do sistema.
- `guardiao-layout`:
  - os 5 FormList (Código só leitura, Nome `curto`, grade sem filtro, sem ações na linha do sistema);
  - as larguras da §4.4/§4.5, com o `TCombo` automático medido com opções reais (inclusive "(inativo)");
  - o `TFieldList` (linha única, endereço em 4 linhas, vínculo com `acao`) a 1440, 768 e 360 px;
  - a troca PF/PJ; o modal rápido;
  - o submenu no trilho e na barra inferior;
  - remedir Usuários e Contratantes por causa do `TCombo`.
- `revisor-ui`: entra porque o kit, a casca e o movimento mudaram.
  - submenu: contraste, foco preso e devolvido, Esc e leitor de tela (`aria-expanded`);
  - contraste do contador do `TTextArea` e do rádio Principal nos 6 destaques;
  - `linhaDaLista` e `submenu` com movimento reduzido.
- `qa`:
  - bateria entre dois contratantes (tipos e pessoas);
  - contratante criado na hora já com os 19 itens;
  - criação simultânea;
  - A e B editando o vínculo ao mesmo tempo;
  - CEP real no dev (o container precisa alcançar `viacep.com.br`);
  - Pdf com 2 ou mais páginas;
  - usuário só com LER em cada grupo;
  - deixar cerca de 10 pessoas de demonstração, com vínculos, e 1 tipo próprio por auxiliar em cada contratante Demo.

## 7. Decisões novas para `docs/negocio/`

- **`docs/negocio/pessoas.md` (novo; acrescentar ao índice):**
  - regras vigentes: §2.1, §2.2, vínculos e cadastro rápido;
  - decisões do dono de 16/11/2026: as respostas 1 a 7 e a P1 a P3.
- **`docs/negocio/cadastros-auxiliares.md` (novo):**
  - os 5 tipos e os itens do sistema;
  - imutabilidade;
  - item do contratante: criar, editar, inativar;
  - nome único sem caixa nem acento, até 25 caracteres;
  - código por tipo;
  - grupo único;
  - menu "Cadastros › Auxiliares";
  - item novo do sistema = enum + migration que adota o nome igual.
- **`decisoes.md`:** uma linha por decisão de 16/11:
  - escopo inteiro;
  - IBGE;
  - TipoPessoa enum + 5 auxiliares;
  - `nome_busca`;
  - CPF/RG em claro;
  - exportação;
  - os aceitos;
  - as respostas da P1 a P3.
- **`codigo-sequencial.md`:**
  - tirar do "Em aberto" a peça de retentativa (nasceu: `RepetirSeCodigoRepetido`);
  - registrar o código nos auxiliares (sistema = 1..N);
  - registrar o combo "código · nome" na seleção de pessoas.
- **`eroerp-referencias.md`:** seção "Pesquisa de 16/11/2026: Pessoas".
  - O que foi trazido.
  - O que não foi copiado: catálogos globais, `razao_social`, RG 409 sem índice, `/select` sem permissão, `unaccent`, filhas casadas por `id`, tenant filtrado à mão.
- **Docs técnicos:**
  - `docs/01`: `CampoInvalidoException`; a peça de retentativa; `SelectDto` de pessoa com código (rever o "por enquanto");
  - `docs/03`: `Estado`/`Cidade` sem tenant; itens do sistema semeados por contratante;
  - `docs/04`: grupos `PESSOAS` e `CADASTROS_AUXILIARES`, telas e rotas;
  - `docs/05`: regra da migration de item novo do sistema; FK composta `(x_id, tenant_id)` como padrão de filha;
  - `docs/07`: kit novo, `TCombo` automático, modelo FormList = `TipoCadastroFormList`, submenu da casca;
  - `docs/02`: a saída para o ViaCEP.
- **Em aberto:**
  - IE "ISENTO";
  - código do país no telefone (com o WhatsApp);
  - resumo no Pdf de pessoas;
  - consulta de CNPJ;
  - o limite de 5 ícones na barra do celular quando entrar o próximo módulo.
