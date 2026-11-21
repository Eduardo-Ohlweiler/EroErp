# Plano: Pessoas, dados complementares (branch `timeero/pessoas-complemento`, a partir da `main` depois do merge de Pessoas)

> Planejador, 20/11/2026. Fontes:
> - a pesquisa `pesquisa-pessoas-complemento.md`: o antigo tinha só CNH, categoria em texto e validade; o 2.0 não tinha nada disso;
> - `docs/negocio/` (pessoas, cadastros-auxiliares, codigo-sequencial, decisoes);
> - `docs/01` a `05`, o resumo do `docs/07`, a §1 (regra de disposição), a §2.3 e a §4.2;
> - o código de `pessoa/`, `auxiliar/`, `localidade/` e `seguranca/cripto/`;
> - `ero-web/src/modules/pessoas` e `modules/auxiliares`, o `PLANO-PESSOAS.md` e o `PLANO-FILIAIS.md`.
>
> O escopo foi decidido pelo Eduardo em 20/11/2026 (§2.1) e não se pergunta de novo. As perguntas novas estão na §2.3.

## 1. Entendimento

- **Pessoa física** ganha:
  - documentos: RG com órgão emissor, UF e emissão; CNH com número (dígito verificador conferido), categoria em enum e validade;
  - dados civis: estado civil, profissão, nacionalidade, naturalidade (cidade do IBGE), nome da mãe e nome do pai.
- **Pessoa jurídica** ganha a data de abertura. O representante legal é um **tipo de vínculo novo**, no `PessoaVinculo` que já existe.
- **Dois cadastros auxiliares novos**, Estado civil e Profissão, copiados do molde `auxiliar`: itens do sistema semeados mais itens do contratante, telas FormList e o grupo `CADASTROS_AUXILIARES` que já existe.
- **LGPD:** CNH, filiação e estado civil aparecem só na ficha. Ficam fora da lista, do Exportar, do Pdf e de qualquer log.
- Ficam **fora** os dados fiscais e os bancários (§7, "Em aberto").

## 2. Perguntas e decisões

### 2.1 Escopo do dono (20/11/2026)

Os 6 itens do pedido:
1. CNH com número, dígito verificador, categoria em enum e validade. RG com órgão emissor, UF e emissão.
2. Estado civil e profissão como cadastros auxiliares; nacionalidade; naturalidade como FK `Cidade`; filiação.
3. PJ: data de abertura. Representante legal como tipo de vínculo.
4. Fiscais e bancários: fora.
5. LGPD: fora do CSV e do Pdf, só na ficha, nunca em log. A avaliação de cripto está abaixo.
6. Campos do mesmo documento na mesma linha.

### 2.2 Decidido pelo planejador (regra escrita ou técnica)

- **Cripto: nenhum campo novo usa o `CriptoConverter`.** Os motivos:
  - O dono decidiu CPF e RG em claro. A CNH é um identificador da mesma classe, e cifrá-la com o CPF em claro ao lado não reduz o risco.
  - Estado civil e profissão são FK, e FK não se cifra.
  - Filiação e estado civil não são dado sensível (art. 5º, II, da LGPD).
  - A proteção fica no acesso (`PESSOAS_LER`), no `toString` sem os campos, na ausência de log, na saída da lista e do Exportar e no backup cifrado do deploy.
  - Se o dono quiser cifrar algo, o único candidato razoável é `nome_mae`: ninguém busca por ele. Ele é usado em fraude de identidade.
- **A UF do RG é FK para `estado`** (`rg_estado_id`), não texto, pela regra "relação vira FK por id". Para isso nasce `GET /api/estados` em `localidade`, com `ACESSO_LIBERADO`, porque é dado de referência.
- **Regras do RG e das datas:**
  - Órgão, UF e emissão só existem com o RG preenchido, como um grupo do documento. O RG continua opcional e não é único.
  - A emissão do RG não pode ser futura, nem anterior a 1900 ou ao nascimento.
  - A data de abertura não pode ser futura nem anterior a 1800.
  - A validade da CNH **pode estar vencida**: é um fato, e a tela mostra "Vencida". Fica limitada entre 1900 e hoje + 15 anos, contra erro de digitação.
- **Campos só de um tipo:** os campos de PF chegam nulos na PJ, e o contrário também. Se chegarem preenchidos, a resposta é 400 no campo, como hoje. O `ck_pessoa_campos_do_tipo` é recriado com as colunas novas. Trocar o tipo limpa o outro bloco, no front e no mapper.
- **Estado civil e profissão inativos** seguem a regra dos tipos: o valor já gravado continua aceito e aparece como "Nome (inativo)"; inativo novo dá 400.
- **Tipo de vínculo novo: `REPRESENTANTE_LEGAL("Representante legal")`, com o inverso `REPRESENTADA("Empresa representada")`.** A leitura segue "B é <tipo> de A": na ficha da empresa, "Fulano é Representante legal"; na ficha de Fulano, "ACME é Empresa representada".
- **Ficha sem N+1:** `Estado`, `Cidade`, `EstadoCivil` e `Profissao` são `@ManyToOne(LAZY)` na `Pessoa`. A ficha de uma pessoa lê os 4 dentro da transação, com no máximo 5 SELECTs curtos. A lista não toca neles, e o teste de no máximo 6 comandos continua valendo. O `travarPorIds` continua **sem fetch**, porque o PostgreSQL recusa `FOR UPDATE` no lado nulo de um outer join.
- **Front: a CNH usa uma máscara nova no kit, `cnh`.** Ela aceita só dígitos, até 11, grava cru e tem largura padrão `cpf`. O `inteiro` não serve: tem largura `quantidade` e tiraria o zero à esquerda.
- **Grupo de permissão:** fica o `CADASTROS_AUXILIARES`, que passa a ter 7 telas (decisão de 16/11: um grupo só para os auxiliares). Quem já tem o grupo ganha as duas telas novas sozinho.

### 2.3 Perguntas novas ao Eduardo

1. **Representante legal: quem pode ser e quantos.**
   **Padrão:**
   - o representante é sempre pessoa física, e o representado, pessoa jurídica;
   - uma empresa pode ter vários representantes;
   - o vínculo continua **um por par** (`uk_pessoa_vinculo_par`). Quem é representante deixa de ser marcado também como Contato daquela empresa, porque o representante já é o contato principal.

   As alternativas são aceitar uma PJ como representante (uma administradora, por exemplo) ou permitir dois vínculos no mesmo par. A segunda muda o índice e a ordem canônica da 018.
2. **Itens do sistema e tamanho do nome.**
   **Padrão:**
   - Estado civil: Solteiro(a), Casado(a), União estável, Separado(a), Divorciado(a), Viúvo(a).
   - Profissão: Autônomo(a), Empresário(a), Servidor(a) público(a), Profissional liberal, Aposentado(a), Estudante, Do lar. Sem a tabela CBO.
   - Nome de **até 25 caracteres no estado civil** (igual aos outros auxiliares) e de **até 40 na profissão**. Exemplos que não cabem em 25: "Microempreendedor individual" (28) e "Técnico em segurança do trabalho" (32).
3. **Nacionalidade.**
   **Padrão:** texto livre de 2 a 40 caracteres (ex.: "Brasileira"). O cadastro novo abre vazio, coerente com a escolha consciente de 20/11.

   A alternativa é abrir com "Brasileira" já preenchida.
4. **CNH.** **Decidido pelo Eduardo (20/11/2026):**
   - o número pode ir sozinho; categoria e validade são **opcionais**;
   - sem o número, categoria e validade não são aceitas (só existem junto com ele, como o órgão emissor do RG);
   - CNH vencida é aceita e mostra "Vencida";
   - a CNH **não é única** no contratante, como o RG.

## 3. Backend

### 3.1 Migrations (última: `018-create-pessoa-vinculo.xml`)

Os includes vão no fim do `changelog-master.xml`, na ordem. Os CHECKs e os índices parciais vão por `<sql>`.

**`019-create-estado-civil-profissao.xml`:** 2 changeSets de criação e 2 de semente, cópia exata da 014.
- `estado_civil`:
  - colunas: `id`, `tenant_id`, `cod_estado_civil BIGINT NN`, `nome VARCHAR(25) NN`, `nome_busca VARCHAR(25) NN`, `chave VARCHAR(30)`, `ativo BOOLEAN NN default true`, auditoria e `version`;
  - restrições: `pk_estado_civil`, `fk_estado_civil_tenant`;
  - índices únicos: `uk_estado_civil_tenant_cod_estado_civil`, `uk_estado_civil_tenant_nome_busca`, `uk_estado_civil_tenant_chave` e `uk_estado_civil_id_tenant`;
  - checks: `ck_estado_civil_cod_estado_civil (> 0)` e `ck_estado_civil_sistema_ativo (chave IS NULL OR ativo)`.
- `profissao`: igual, com `cod_profissao` e **`nome`/`nome_busca` em VARCHAR(40)** (P2).
- Semente para os contratantes existentes (`WHERE t.id <> '00000000-…'`), na ordem do código:
  - `estado_civil`: (1, Solteiro(a), `SOLTEIRO`), (2, Casado(a), `CASADO`), (3, União estável, `UNIAO_ESTAVEL`), (4, Separado(a), `SEPARADO`), (5, Divorciado(a), `DIVORCIADO`), (6, Viúvo(a), `VIUVO`);
  - `profissao`: `AUTONOMO`, `EMPRESARIO`, `SERVIDOR_PUBLICO`, `PROFISSIONAL_LIBERAL`, `APOSENTADO`, `ESTUDANTE`, `DO_LAR`, com os rótulos da P2;
  - `nome_busca` = `TextoBusca.normalizar(nome)`, escrito literal no SQL (ex.: `'solteiro(a)'`, `'uniao estavel'`, `'viuvo(a)'`). O `revisor-backend` confere contra o Java.

**`020-alter-pessoa-complemento.xml`**, na tabela `pessoa`:

| coluna | tipo | nulo | obs. |
|---|---|---|---|
| `rg_orgao_emissor` | VARCHAR(15) | sim | maiúsculas; só PF |
| `rg_estado_id` | UUID | sim | `fk_pessoa_rg_estado → estado(id)` |
| `rg_data_emissao` | DATE | sim | |
| `cnh` | VARCHAR(11) | sim | `ck_pessoa_cnh CHECK (cnh ~ '^[0-9]{11}$')` |
| `cnh_categoria` | VARCHAR(2) | sim | `ck_pessoa_cnh_categoria IN ('A','B','AB','C','D','E','AC','AD','AE')` |
| `cnh_validade` | DATE | sim | |
| `estado_civil_id` | UUID | sim | `fk_pessoa_estado_civil (estado_civil_id, tenant_id) → estado_civil(id, tenant_id)` |
| `profissao_id` | UUID | sim | `fk_pessoa_profissao (profissao_id, tenant_id) → profissao(id, tenant_id)` |
| `nacionalidade` | VARCHAR(40) | sim | |
| `naturalidade_id` | UUID | sim | `fk_pessoa_naturalidade → cidade(id)` |
| `nome_mae` | VARCHAR(255) | sim | |
| `nome_pai` | VARCHAR(255) | sim | |
| `data_abertura` | DATE | sim | só PJ |

- Índices: `ix_pessoa_estado_civil`, `ix_pessoa_profissao`, `ix_pessoa_naturalidade`.
- `ck_pessoa_rg_complemento CHECK (rg IS NOT NULL OR (rg_orgao_emissor IS NULL AND rg_estado_id IS NULL AND rg_data_emissao IS NULL))`.
- `ck_pessoa_cnh_complemento CHECK (cnh IS NOT NULL OR (cnh_categoria IS NULL AND cnh_validade IS NULL))`: categoria e validade são opcionais, mas só existem com o número (P4, decidido pelo Eduardo).
- `DROP CONSTRAINT ck_pessoa_campos_do_tipo` e recriar:
  ```sql
  (tipo_pessoa = 'FISICA' AND cnpj IS NULL AND nome_fantasia IS NULL AND inscricao_estadual IS NULL
     AND inscricao_municipal IS NULL AND data_abertura IS NULL)
  OR (tipo_pessoa = 'JURIDICA' AND cpf IS NULL AND rg IS NULL AND data_nascimento IS NULL AND sexo IS NULL
     AND rg_orgao_emissor IS NULL AND rg_estado_id IS NULL AND rg_data_emissao IS NULL
     AND cnh IS NULL AND cnh_categoria IS NULL AND cnh_validade IS NULL
     AND estado_civil_id IS NULL AND profissao_id IS NULL AND nacionalidade IS NULL
     AND naturalidade_id IS NULL AND nome_mae IS NULL AND nome_pai IS NULL)
  ```
  As linhas que já existem passam, porque as colunas novas nascem nulas.

**`021-alter-pessoa-vinculo-representante.xml`:**
- `DROP CONSTRAINT ck_pessoa_vinculo_tipo`;
- recriar com `'REPRESENTANTE_LEGAL','REPRESENTADA'` a mais (os dois cabem no VARCHAR(20)).

### 3.2 Módulo `auxiliar`: 2 cópias do `TipoCadastro`

| Entidade | Tabela | Rota | Tela | Enum | Nome |
|---|---|---|---|---|---|
| `EstadoCivil` | `estado_civil` | `/api/estados-civis` | `estado-civil-formlist` | `EstadoCivilDoSistema` | 1–25 |
| `Profissao` | `profissao` | `/api/profissoes` | `profissao-formlist` | `ProfissaoDoSistema` | 1–40 |

Cada uma copia os arquivos do `TipoCadastro`, trocando nomes. O que muda está no `PLANO-PESSOAS.md` §3.4 e abaixo:
- `entity/`: `codEstadoCivil` e `codProfissao`.
- `enums/`: a ordem é a da semente da 019, e o código é `ordinal() + 1`.
- `dtos/`:
  - `CreateDto(@NotBlank @Size(max=25|40) nome)`;
  - `UpdateDto` (+ `@NotNull Long version`);
  - `ResponseDto(id, cod…, nome, sistema, ativo, auditoria com nomes, version)`;
  - `SelectDto(id, nome, chave, ativo)`.
- `mapper/`, `repository/` (`buscarPorId`, `buscarPagina`, `buscarParaSelecao`, `buscarPorIds`, `existeNome`, `buscarProximoCodigo`), `service/` e `controller/`: cópia, com `exigirTenantSelecionado()` em todo método.
- Mensagens, no gênero certo:
  - "Já existe um estado civil com este nome." e "Estado civil não encontrado.";
  - "Já existe uma profissão com este nome." e "Profissão não encontrada.";
  - "Itens do sistema não podem ser alterados." (422).
- `ItensDoSistemaService.semear` passa a gravar também os 2 enums novos (código explícito).
- Rotas, iguais às do §3.4 do `PLANO-PESSOAS.md`:

| Método | Rota | Authority |
|---|---|---|
| GET | `/api/estados-civis?page=&size=&sort=` | `CADASTROS_AUXILIARES_LER` |
| GET | `/api/estados-civis/selecao?inativos=false` | `ACESSO_LIBERADO` |
| POST · PUT `/{id}` · PATCH `/{id}/inativar` e `/ativar` | | `CADASTROS_AUXILIARES_ESCREVER` |
| (as mesmas para `/api/profissoes`) | | |

### 3.3 Módulo `localidade`

- `dtos/EstadoSelectDto(UUID id, String sigla, String nome)`.
- `LocalidadeMapper.toEstadoSelectDto(Estado)`.
- `repository/EstadoRepository`, novo:
  - `buscarTodos()`: `SELECT e FROM Estado e ORDER BY e.sigla`;
  - `buscarPorId(UUID id)`.
- `LocalidadeService`:
  - `listarEstados()` → `List<EstadoSelectDto>`;
  - `Optional<Estado> buscarEstado(UUID id)`;
  - `Cidade buscarCidade(UUID id)` (pode reaproveitar `buscarCidades(Set.of(id))`).
- `LocalidadeController`: `GET /api/estados` → `List<EstadoSelectDto>`, com `ACESSO_LIBERADO` (27 linhas fixas).

### 3.4 Módulo `pessoa`

**enums/**
- `CategoriaCnh`: `A, B, AB, C, D, E, AC, AD, AE`, com `rotulo()` igual ao nome.
- `TipoVinculo`:
  - acrescenta `REPRESENTANTE_LEGAL("Representante legal")` e `REPRESENTADA("Empresa representada")` **no fim**;
  - `inverso()`: os dois trocam entre si;
  - o Javadoc cita a 021.

**entity/Pessoa** (com os Javadocs "só PF"/"só PJ" e "dado pessoal: nunca em log"):
- `String rgOrgaoEmissor`;
- `@ManyToOne(LAZY) @JoinColumn(name="rg_estado_id") Estado rgEstado`;
- `LocalDate rgDataEmissao`;
- `String cnh`;
- `@Enumerated(STRING) CategoriaCnh cnhCategoria`;
- `LocalDate cnhValidade`;
- `@ManyToOne(LAZY) EstadoCivil estadoCivil`;
- `@ManyToOne(LAZY) Profissao profissao`;
- `String nacionalidade`;
- `@ManyToOne(LAZY) @JoinColumn(name="naturalidade_id") Cidade naturalidade`;
- `String nomeMae`, `String nomePai`;
- `LocalDate dataAbertura`.

**dtos/**
- `PessoaCreateDto` e `PessoaUpdateDto` acrescentam, depois de `sexo`:
  - `@Size(max=15) String rgOrgaoEmissor`;
  - `UUID rgEstadoId`;
  - `@PastOrPresent(message="Data de emissão não pode ser no futuro") LocalDate rgDataEmissao`;
  - `@Size(max=14) String cnh` (aceita espaço e ponto; o mapper tira);
  - `CategoriaCnh cnhCategoria`;
  - `LocalDate cnhValidade`;
  - `UUID estadoCivilId`, `UUID profissaoId`;
  - `@Size(max=40) String nacionalidade`;
  - `UUID naturalidadeId`;
  - `@Size(max=255) String nomeMae`, `@Size(max=255) String nomePai`.

  E, depois de `inscricaoMunicipal`:
  - `@PastOrPresent(message="Data de abertura não pode ser no futuro") LocalDate dataAbertura`.

  O `toString` continua só com tipo e nome. O `PessoaMapper.dados(UpdateDto)` repassa os campos novos.
- `PessoaResponseDto` acrescenta, na mesma posição:
  - `rgOrgaoEmissor`, `EstadoSelectDto rgUf`, `rgDataEmissao`;
  - `cnh`, `cnhCategoria`, `cnhValidade`;
  - `EstadoCivilSelectDto estadoCivil`, `ProfissaoSelectDto profissao`;
  - `nacionalidade`, `CidadeSelectDto naturalidade`;
  - `nomeMae`, `nomePai`, `dataAbertura`.
- **`PessoaListaDto`, `PessoaSelectDto` e `PessoaVinculoResponseDto` não mudam.** É isso que tira os campos novos da lista, do Exportar e do Pdf.

**mapper/PessoaMapper**
- `toEntity` e `atualizarEntidade` recebem um `record Complementos(Estado rgEstado, EstadoCivil estadoCivil, Profissao profissao, Cidade naturalidade)`, já conferido pelo service.
- Normalizações:
  - `trim`, e vazio vira `null`;
  - `rgOrgaoEmissor` em maiúsculas;
  - `cnh` só com dígitos (`normalizarCnh`);
  - na PJ, todo campo de PF vira `null`, e na PF, a `dataAbertura`.
- `toResponseDto` monta os 4 SelectDto, que são `null` quando a FK é nula.

**compartilhado/util/DocumentoValidator.cnhValida(String)**
- Recusa o que não tem 11 dígitos e a sequência repetida.
- DV1 = soma(d[i] * (9 - i)) para i de 0 a 8, mod 11. Se der 10 ou mais, DV1 = 0 e `dsc = 2`.
- DV2 = (soma(d[i] * (i + 1)) mod 11) - `dsc`. Se der menos de 0, soma 11. Se der 10 ou mais, DV2 = 0.
- Confere com os 2 últimos dígitos.
- É o algoritmo do DETRAN, igual ao da `validate-docbr`. O teste usa números válidos conhecidos.

**service/PessoaService.validar**: as regras novas, cada uma com `CampoInvalidoException(campo, msg)`.
- `validarCamposDoTipo`:
  - PJ com qualquer campo novo de PF → ex.: `("cnh", "Pessoa jurídica não tem CNH.")`, `("nomeMae", "Pessoa jurídica não tem filiação.")`;
  - PF com `dataAbertura` → `("dataAbertura", "Pessoa física não tem data de abertura.")`.
- RG:
  - órgão, UF ou emissão sem RG → `("rg", "Informe o número do RG.")`;
  - órgão fora de `^[A-Z][A-Z /-]{1,14}$` → `("rgOrgaoEmissor", "Órgão emissor inválido.")`;
  - emissão antes de 1900 ou do nascimento → `("rgDataEmissao", "A emissão não pode ser anterior ao nascimento.")`.
- CNH (P4):
  - número sem DV válido → `("cnh", "CNH inválida.")`;
  - número sem categoria → `("cnhCategoria", "Informe a categoria da CNH.")`;
  - número sem validade → `("cnhValidade", "Informe a validade da CNH.")`;
  - categoria ou validade sem número → `("cnh", "Informe o número da CNH.")`;
  - validade fora de 1900 a hoje + 15 anos → `("cnhValidade", "Validade da CNH inválida.")`.
- PJ: `dataAbertura` antes de 1800 → `("dataAbertura", "Data de abertura inválida.")`.
- `nacionalidade` com menos de 2 caracteres → `("nacionalidade", "Nacionalidade deve ter de 2 a 40 caracteres.")`.
- Referências, conferidas em lote e com o tenant filtrado:
  - `estadoCivilService.buscarPorIds`: id que não volta → "Estado civil não encontrado."; inativo novo → "Estado civil inativo.". O inativo passa quando `atual.getEstadoCivil()` já era ele;
  - `profissaoService.buscarPorIds`: igual;
  - `localidadeService.buscarEstado` → `("rgEstadoId", "UF não encontrada.")`;
  - `buscarCidades` → `("naturalidadeId", "Cidade não encontrada.")`.
  - As referências vão no `record Referencias` (ganha `Complementos`).
- `validarVinculos`, para `REPRESENTANTE_LEGAL` e `REPRESENTADA` (P1). Quando o tipo é `REPRESENTANTE_LEGAL`, a empresa é esta pessoa e o representante é a outra; quando é `REPRESENTADA`, é o contrário. Erros no campo `vinculos[i].tipo`:
  - empresa que não é PJ → `REPRESENTANTE_LEGAL` com esta PF: "Só pessoa jurídica tem representante legal."; `REPRESENTADA` com a outra PF: "A empresa representada precisa ser pessoa jurídica.";
  - representante que não é PF → "O representante legal precisa ser pessoa física.".
- Nenhum log novo. O que já existe registra só o id.

**controller/**: nada muda. As rotas e as authorities de `/api/pessoas` continuam as mesmas.

### 3.5 Permissões

- `Tela`, acrescentadas no fim:
  - `ESTADO_CIVIL_FORMLIST("estado-civil-formlist", "Estados civis")`;
  - `PROFISSAO_FORMLIST("profissao-formlist", "Profissões")`.
- `GrupoLiberacao.CADASTROS_AUXILIARES`: **grupo existente**, que ganha as 2 telas, com 7 no total. Sem ação extra. O catálogo do `UsuarioForm` vem da API.

### 3.6 Testes

- **`auxiliar/AuxiliarIntegracaoTest`:**
  - o `@ParameterizedTest` ganha `estados-civis` (máximo 25) e `profissoes` (máximo 40);
  - a validação usa máximo + 1 por rota;
  - os 4 obrigatórios, os de código, `itemDoSistemaNaoAltera422`, `nomeRepetidoComOSistema409` e os de seleção valem para as 7 rotas.
- **`tenant/TenantIntegracaoTest.contratanteNovoRecebeOsItensDoSistema`:** + 6 + 7, iguais aos enums.
- **`compartilhado/DocumentoValidatorTest`:** `cnhValida` com válidas conhecidas, DV errado, `00000000000`, 10 e 12 dígitos e um caso com `dsc = 2`.
- **`pessoa/PessoaIntegracaoTest`**, testes novos:
  - `complemento_caminhoFelizPF` (todos os campos, ida e volta) e `complemento_caminhoFelizPJ` (`dataAbertura`);
  - `campoDePfNaPj400` (`@ParameterizedTest` sobre os 13 campos) e `dataAberturaNaPf400`;
  - `trocaDeTipoLimpaComplementos`: PF completa → PUT como PJ → colunas nulas no banco;
  - `cnhDvInvalido400`, `cnhSemCategoria400`, `cnhSemValidade400`, `categoriaSemNumero400`, `cnhCategoriaForaDoEnum400`, `cnhVencidaAceita200`;
  - `rgComplementoSemRg400`, `emissaoFutura400`, `emissaoAntesDoNascimento400`, `aberturaFutura400`;
  - `estadoCivilDeOutroContratante400`, `profissaoInativaNova400`, `profissaoInativaJaGravadaContinuaAceita`, `ufInexistente400`, `naturalidadeInexistente400`;
  - `listaEExportacaoSemComplementos`: o JSON de `GET /api/pessoas` não tem `cnh`, `nomeMae`, `nomePai`, `estadoCivil`, `profissao`, `rgOrgaoEmissor`, `naturalidade`;
  - `representante_apareceNosDoisLados` (PJ A põe PF B como `REPRESENTANTE_LEGAL` → B vê A como `REPRESENTADA`), `representantePJ400`, `representanteEmPF400`, `representadaPF400` e `variosRepresentantes200`;
  - `checksDoBanco` (`JdbcTemplate`): `ck_pessoa_cnh_complemento`, `ck_pessoa_rg_complemento`, o `ck_pessoa_campos_do_tipo` com a coluna nova, e o `ck_pessoa_vinculo_tipo` aceitando os 2 tipos novos;
  - `fichaSemNMais1`: no máximo 12 comandos (5 a mais que hoje) e `listaSemNMais1` ainda com no máximo 6.
- **`localidade/LocalidadeIntegracaoTest.estados27PorSigla`.**
- `ArquiteturaTest` verde e `mvnw verify` verde (com o Docker ligado).

## 4. Front

### 4.1 Kit (`glass-design-system`): uma peça pequena

- **Máscara `cnh`** em `kit/mascaras.ts`:
  - só dígitos, até 11, sem pontuação;
  - `TAMANHO_MAXIMO.cnh = 11`;
  - `teclado` = `numeric`;
  - `larguraPadraoDoEntry('cnh')` = `cpf`;
  - `valorParaGravar` cru;
  - teste no `kit.test.tsx`.
- **Catálogo:** o exemplo "CNH · Categoria · Validade" numa `TRow`.
- **`docs/07`:** a §2.3 ganha "`cnh` → `cpf`", e a §3.2 ganha a máscara.
- **Movimento: nada novo.** Os painéis PF entram na `TrocaDeBlocos` que já existe.

### 4.2 APIs compartilhadas e fiação (na execução da `EstadoCivilFormList`)

- `shared/api/auxiliares.ts`:
  - `RecursoAuxiliar` ganha `'estados-civis' | 'profissoes'`;
  - `CampoCodigoAuxiliar` ganha `'codEstadoCivil' | 'codProfissao'`;
  - teste.
- `shared/api/localidade.ts`: `listarEstados()` → `{ id, sigla, nome }[]` (zod) e `opcoesDeUf(lista)` → `{ valor: id, rotulo: sigla }`.
- `modules/auxiliares/telas.ts`: `TELAS_AUXILIARES` ganha, no fim:
  - `{ tela: 'estado-civil-formlist', recurso: 'estados-civis', to: '/cadastros/auxiliares/estados-civis', label: 'Estados civis', icon: HeartHandshake, descricao: 'Solteiro, casado, união estável e os seus próprios.' }`;
  - `{ tela: 'profissao-formlist', recurso: 'profissoes', to: '/cadastros/auxiliares/profissoes', label: 'Profissões', icon: BriefcaseBusiness, descricao: 'Autônomo, empresário e as profissões que você usa.' }`.
- `modules/auxiliares/routes.tsx`: as 2 rotas lazy com `ExigeTela … escopo="contratante"`. O cabeçalho do arquivo é atualizado.
- `app/menu.test.ts`: o submenu tem 7 filhos, e quem tem só `CADASTROS_AUXILIARES` vê os 7.

### 4.3 EstadoCivilFormList e ProfissaoFormList: **cópia direta do modelo FormList** (`TipoCadastroFormList.tsx`)

Cada uma tem `pages/`, `api/estadosCivis.ts` | `api/profissoes.ts` (pelo `criarApiAuxiliar`) e `schemas/estadoCivil.ts` | `schemas/profissao.ts` com teste. Trocam só o que está marcado com `// troca`:

| | EstadoCivilFormList | ProfissaoFormList |
|---|---|---|
| `RECURSO` | `'estados-civis'` | `'profissoes'` |
| `NOME_PLURAL` / `NOME_SINGULAR` | "Estados civis" / "estado civil" | "Profissões" / "profissão" |
| Textos no feminino | não | **sim:** "Profissão salva", "Ela deixa de aparecer…" |
| `NOME_MAXIMO` | 25 | 40 |
| Campo Nome | `TEntry width="curto"` (como o modelo) | `TEntry width="metade"` (40 caracteres não cabem em `curto`) |
| Breadcrumb | `[Cadastros, Auxiliares, Estados civis]` | `[Cadastros, Auxiliares, Profissões]` |

O resto é igual ao modelo:
- campos: Código (`codigo`, só leitura) e Nome;
- grade: Código · Nome · Origem · Situação;
- a linha do sistema não tem ações;
- botões Salvar · Novo.

### 4.4 PessoaForm: painéis novos (cópia do modelo Form que já existe; só acréscimos)

Arquivos: `pages/PessoaForm.tsx`, `schemas/pessoa.ts` + teste e `api/pessoas.ts` (zod da ficha).
- **`schemas/pessoa.ts`:**
  - `Dados` ganha os 13 campos, mais `naturalidadeRotulo`;
  - `CAMPOS_DA_FISICA` ganha os 12 de PF (e `naturalidadeRotulo`), e `CAMPOS_DA_JURIDICA` ganha `dataAbertura`;
  - `CNH_CATEGORIA_OPCOES`;
  - `TIPO_VINCULO_OPCOES` ganha "Representante legal" e "Empresa representada";
  - o `superRefine` espelha a §3.4: CNH com 11 dígitos (o DV fica com a API), categoria e validade só com o número da CNH (os dois opcionais), órgão, UF e emissão só com RG, emissão ≥ nascimento, e as datas não futuras;
  - `paraForm` lê `rgUf?.id`, `estadoCivil?.id`, `profissao?.id`, e `naturalidade` vira id + `rotuloDaCidade`;
  - `paraCorpo` manda `null` no que é do outro tipo e tira o `naturalidadeRotulo`.
- **Opções:**
  - `useTipos('estados-civis')` e `useTipos('profissoes')`, passadas por `opcoesDeTipo(lista, [salvo.estadoCivil])`;
  - UF: `useQuery(['estados'], listarEstados, { staleTime: Infinity })` → `opcoesDeUf`.

**Disposição. Fica igual:** Código, Tipo de pessoa e Nome. Bloco PF dentro da `TrocaDeBlocos` (o RG sai da linha própria):

| Linha | Campos (componente · largura) |
|---|---|
| CPF | `TEntry name="cpf" mascara="cpf"` (`cpf`, padrão) |
| Nascimento | `TDate name="dataNascimento" max={hojeIso()}` (`data`) |
| Sexo | `TRadio name="sexo" vazio="Não informado"` (conteúdo) |
| **`TPanel title="Documentos"`**, L1, grupo natural **RG · Órgão emissor · UF · Emissão** | `TEntry name="rg" label="RG" maxLength={20} width="cpf"` · `TEntry name="rgOrgaoEmissor" label="Órgão emissor" maxLength={15} width="codigo"` (sigla curta: SSP, DETRAN, IGP) · `TCombo name="rgEstadoId" label="UF" opcoes={ufs} vazio="" width="uf"` (rótulo de 2 letras; o automático daria `situacao`, largo demais) · `TDate name="rgDataEmissao" label="Emissão" max={hojeIso()}` (`data`) |
| Documentos, L2, grupo natural **CNH · Categoria · Validade** | `TEntry name="cnh" label="CNH" mascara="cnh"` (`cpf`, padrão) · `TCombo name="cnhCategoria" label="Categoria" opcoes={CNH_CATEGORIA_OPCOES} vazio="" width="uf"` (sigla de 1 ou 2 letras) · `TDate name="cnhValidade" label="Validade" ajuda={vencida && <TBadge tom="alerta">Vencida</TBadge>}` (`data`) |
| **`TPanel title="Dados civis"`**, L1 | `TCombo name="estadoCivilId" label="Estado civil" opcoes={…}` (automático: 25 + " (inativo)" → `medio`) |
| Dados civis, L2 | `TCombo name="profissaoId" label="Profissão" opcoes={…}` (automático: 40 + " (inativo)" → `metade`) |
| Dados civis, L3 | `TEntry name="nacionalidade" label="Nacionalidade" maxLength={40} width="curto"` |
| Dados civis, L4 | `TDBCombo name="naturalidadeId" label="Naturalidade" buscar={buscarCidades} rotuloInicial={naturalidadeRotulo} width="medio"` (cidade) |
| Dados civis, L5 | `TEntry name="nomeMae" label="Nome da mãe" maxLength={255}` (`metade`, padrão) |
| Dados civis, L6 | `TEntry name="nomePai" label="Nome do pai" maxLength={255}` (`metade`, padrão) |

Bloco PJ: Nome fantasia · CNPJ · **Data de abertura** · IE · IM, um por `TRow`:
- **Data de abertura:** `TDate name="dataAbertura" label="Data de abertura" max={hojeIso()}` (`data`), logo depois do CNPJ.

**Vínculos:** o painel não muda. O Tipo passa a ter rótulos de 20 caracteres ("Empresa representada"), e o `TCombo` automático vai de `situacao` para `medio`.

O resto não muda:
- painéis Classificação, Telefones, E-mails, Redes sociais, Endereços e Vínculos;
- `TAuditoria` e `TFormFooter`;
- o `PessoaRapidaModal`, porque os campos novos vão nulos.

**PessoaList, Exportar e Pdf:** nada muda. O `pessoaFiltros.test` ganha a asserção de que `colunasExportadas` não tem nenhum campo novo.

## 5. Riscos

| Risco | Como o plano evita |
|---|---|
| Estado civil ou profissão de outro contratante (IDOR) | Busca em lote com tenant (400) **e** FK composta `(x_id, tenant_id)`. |
| Superadmin na plataforma lê ou grava auxiliares de todos | `exigirTenantSelecionado()` nas 2 cópias; teste com 422 pela parametrização. |
| Os itens da 019 diferentes dos enums | Teste do contratante novo contra o enum; o `revisor-backend` confere chave, rótulo e `nome_busca`. |
| DV da CNH errado recusando CNH verdadeira | Algoritmo da §3.4 com o caso `dsc`; teste com números válidos conhecidos; o QA usa uma CNH real de teste. |
| `FOR UPDATE` falhando com fetch novo | `travarPorIds` sem `JOIN FETCH`; as relações novas são LAZY, lidas depois. |
| N+1 | A lista não lê as relações novas (`PessoaListaDto` igual); a ficha tem teto de comandos no teste. |
| Recriar CHECK em tabela com dados | `DROP` + `ADD` na mesma changeSet; as linhas antigas passam, porque as colunas nascem nulas. O teste roda a 020 sobre pessoas já gravadas pela 015. |
| LGPD: CNH, filiação ou estado civil vazando | Fora do `PessoaListaDto` (e por isso do CSV e do Pdf), teste do JSON da lista, `toString` sem os campos, nenhum log; `/selecao` igual. |
| Escalada | As rotas e as authorities não mudam; as telas novas entram no grupo já existente, que só o ADMIN libera. |
| O tipo de vínculo novo quebrar fichas abertas | O enum cresce no fim; o front aceita os 2 valores novos no zod antes de o back mandá-los (os dois saem na mesma branch). |

## 6. Ordem de execução e foco dos conferentes

| Etapa | Quem | O quê | Depende de | Paralelo com |
|---|---|---|---|---|
| **E0** | dono | Merge de `timeero/pessoas` na `main`; responde a P1 a P4; aprova | | |
| **E1a** | `dev-backend` | §3.1 (019) + §3.2 + §3.5 + `semear` + `AuxiliarIntegracaoTest` e `TenantIntegracaoTest` → `mvnw verify` | E0 | E1b, E2 |
| **E1b** | `glass-design-system` | §4.1: máscara `cnh`, catálogo, `docs/07` | E0 | E1a, E2 |
| **E2** | `frontend-modulos` (1 execução) | §4.2 inteira + **EstadoCivilFormList** (§4.3). O contrato basta, sem o back rodando. | E0 | E1a, E1b |
| **E3** | `dev-backend` | §3.1 (020 e 021) + §3.3 + §3.4 + `PessoaIntegracaoTest`, `DocumentoValidatorTest` e `LocalidadeIntegracaoTest` → `mvnw verify` | E1a | E4 |
| **E3r** | `revisor-backend` ‖ `seguranca` | Revisão do backend (E1a + E3) | E3 | E4 |
| **E4** | `frontend-modulos`, **2 execuções em paralelo** | **ProfissaoFormList** (só os próprios arquivos; a fiação veio na E2) ‖ **PessoaForm** (§4.4) | E1b, E2 | E3, E3r |
| — | orquestrador | `npm run build` + `vitest` | E4 | |
| **E5** | `guardiao-layout` ‖ `seguranca` (parte do front) | Passada visual única | E4 | |
| **E6** | `qa` → correções (no máximo 2 voltas) → `docs/negocio` (§7) | | E5 | |

**Kit e movimento:**
- kit: uma peça nova, a **máscara `cnh`**, a cargo do `glass-design-system` na E1b, antes do PessoaForm;
- movimento: nada novo; o `motion-designer` não entra;
- o `revisor-ui` também não entra, porque a máscara não muda o visual.

**Telas:** todas são **cópia de modelo**, e nenhuma vai para o Opus.
- EstadoCivilFormList e ProfissaoFormList copiam o FormList.
- PessoaForm já é o modelo Form e só ganha painéis.

**Foco dos conferentes:**
- `revisor-backend`:
  - as 2 cópias do `auxiliar` idênticas fora os nomes, o gênero das mensagens e o 40 da profissão;
  - as sementes da 019 iguais aos enums, inclusive o `nome_busca`;
  - o `ck_pessoa_campos_do_tipo` recriado com as 13 colunas;
  - `travarPorIds` sem fetch;
  - o `inverso()` e o CHECK da 021;
  - nenhuma entidade nos DTOs (`EstadoSelectDto`, `EstadoCivilSelectDto`, `ProfissaoSelectDto`, `CidadeSelectDto`);
  - `CAST` onde houver parâmetro String.
- `seguranca`:
  - FKs compostas e o 400 de outro contratante;
  - `exigirTenantSelecionado` nas cópias;
  - `GET /api/estados` com `ACESSO_LIBERADO` e sem dado pessoal;
  - os campos novos fora do `PessoaListaDto`, do `toString` e dos logs;
  - a avaliação de cripto (§2.2).
- `guardiao-layout`:
  - as duas linhas de documento (RG · Órgão · UF · Emissão e CNH · Categoria · Validade) a 1440, 768 e 360 px;
  - os `width="uf"` intencionais nos dois combos: o medidor não deve marcá-los como erro;
  - Estado civil em `medio` e Profissão em `metade`;
  - Data de abertura na PJ;
  - o combo de Tipo de vínculo agora em `medio`;
  - a troca PF ↔ PJ com os dois painéis;
  - as 2 FormList (Nome `curto` e `metade`) e o submenu com 7 itens no trilho e na barra inferior.
- `qa`:
  - bateria entre dois contratantes (auxiliares novos e pessoa com estado civil do outro);
  - contratante criado na hora com + 6 + 7 itens;
  - usuário só com LER;
  - CNH válida e inválida pela tela;
  - CSV e Pdf de pessoas sem os campos novos;
  - representante nos dois lados;
  - **dados demo:** completar 3 PF e 2 PJ (com representante) em cada contratante Demo, mais 1 estado civil e 1 profissão próprios.

## 7. O que entra em `docs/negocio/`

- **`pessoas.md`:**
  - **Regras vigentes:** os documentos da PF (RG com órgão, UF e emissão; CNH com DV, o número pode ir sozinho, categoria e validade opcionais e só com o número, vencida aceita), os dados civis, a data de abertura, o representante legal (PF, vários, um vínculo por par) e a disposição dos documentos;
  - **LGPD:** CNH, filiação e estado civil só na ficha; nada cifrado, com o motivo;
  - **Decisões do dono de 20/11/2026:** o escopo e as respostas P1 a P4;
  - **Em aberto:**
    - fiscais (regime tributário, contribuinte de ICMS, CNAE, quando houver nota fiscal);
    - bancários e PIX (quando houver cobrança; conta e chave PIX com o `CriptoConverter`);
    - gerador de contratos (tags, flexão "(a)" pelo sexo e pela `chave`);
    - cifrar `nome_mae`, se o dono quiser.
- **`cadastros-auxiliares.md`:**
  - "Sete cadastros", com Estado civil e Profissão e os itens do sistema;
  - nome de até 40 caracteres na profissão;
  - o grupo com 7 telas.
- **`decisoes.md`:** uma linha para o escopo de 20/11 e uma para cada resposta (P1 a P4).
- **`eroerp-referencias.md`:** a seção "Pesquisa de 20/11/2026: dados complementares de Pessoas".
  - O que veio do antigo: a CNH.
  - O que não foi copiado: a categoria em texto, a CNH sem DV e o "só grava se preenchido", que não deixava limpar.
  - Para o gerador: a ideia do `DocumentoTagService` e os defeitos dele.
- **Docs técnicos:**
  - `docs/04`: as 2 telas no `CADASTROS_AUXILIARES` e as rotas novas, inclusive `/api/estados`;
  - `docs/05`: CHECK alterado = `DROP` + `ADD` em migration nova;
  - `docs/07`: a máscara `cnh`;
  - `docs/03`: os itens do sistema agora são 7 cadastros.

## 8. Impacto no `PLANO-FILIAIS.md`

1. **Migration:** a 019 de Filiais passa a ser a **022** (§2.1, item 3, e §3.1: "última: 021"). A branch `timeero/filiais` parte da `main` **depois do merge desta entrega**.
2. **Painel "Dados da pessoa": sem mudança obrigatória.** Ele lê `GET /api/pessoas/{id}` pelo mesmo `pessoasApi.buscar`, cujo zod ganha os campos novos aqui, então nada quebra.
   - **Padrão:** não acrescentar nada, porque o painel é de identificação fiscal.
   - Se o dono quiser, a "Data de abertura" (PJ) entra numa `TRow` própria, `TEntry disabled width="data"`.
3. **Nada mais muda:**
   - o `FilialPessoaDto`, o `FilialIntegracaoTest` (pessoas criadas sem os campos novos) e a ordem do `GrupoLiberacao`;
   - a barra inferior, porque os auxiliares continuam sendo um ícone só.

---

## Aprovação (20/11/2026)

Plano aprovado pelo Eduardo, com as respostas padrão das perguntas 1 a 3:
- representante legal sempre PF, vários por empresa, um vínculo por par;
- estado civil com os 6 itens do sistema; profissão com 7 genéricas, sem CBO;
- nacionalidade em texto livre, vazia no cadastro novo.

A pergunta 4 (CNH) foi mudada por ele: o número pode ir sozinho, categoria e validade são opcionais e só existem com o número, e a CNH vencida é aceita.

A construção começa na 	imeero/pessoas-complemento, a partir da main, depois do merge de 	imeero/pessoas.