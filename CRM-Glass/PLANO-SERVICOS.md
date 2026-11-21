# Plano: Cadastro de Serviços

> Branch da construção: `timeero/servicos`, criada a partir da `main` depois da aprovação.
> Planejador, 21/11/2026, ajustado com as respostas do Eduardo no mesmo dia. Fontes: pesquisa nos dois ERPs (`EroErp2.0/docs/10-modulo-servicos.md`, `ServicoForm`/`ServicoList` do 2.0, `ProdutoForm` do antigo), `docs/negocio/`, `CONTINUAR.md`, `docs/01`, `04`, `05`, `07`, os módulos `filial`, `auxiliar` e `pessoa`, o kit do `ero-web` e `PLANO-FILIAIS.md` (modelo de formato).

**Correção da pesquisa.** No 2.0 a tela de serviço é **List + Form** (`ServicoList` e `ServicoForm`), não FormList; o `TFieldList` de valores por filial fica dentro do Form. Este plano segue o mesmo desenho: filtros, lista filha e texto longo não cabem num FormList (`docs/07` §4.3).

**Já existe:** `TFieldList` (com `TDBCombo` na coluna, `detalhe`, `vazio`), `TEntry` com `mascara="moeda"` e `suffix`, `TTextArea`, `TCorMarca`, `formatarMoeda`/`paraNumero`, `RepetirSeCodigoRepetido`, `TextoBusca`, `/api/filiais/selecao` aberto e sem documento, o "Mais" da barra do celular.

**Não existe:** nenhuma categoria (nem de produto); nenhum consumidor de filial no backend (`FilialService.buscarAtiva`, "em aberto"); a bolinha da cor dentro do `TDBCombo` ("em aberto").

---

## 1. Entendimento

- **Serviços** é o 3º cadastro de negócio, com tabela própria (nunca um produto com tipo SERVICO). No cadastro se informa: código (automático), nome, categoria (opcional), duração (opcional), descrição, **as filiais onde o serviço é prestado, cada uma com o seu preço (opcional)**, situação e auditoria. Sem exclusão: só inativar e reativar.
- **Filiais do serviço:** a lista diz onde o serviço é prestado, e é obrigatório ter pelo menos uma filial. O preço é só por filial (como no 2.0, sem valor padrão). Preço vazio = "não informado" (será digitado na hora do movimento); 0 = gratuito.
- **A filial não depende do serviço.** Filial sem nenhum serviço continua aparecendo em todo lugar (combo do próprio cadastro de serviço, e a futura agenda, que também serve para reuniões e outros compromissos). A lista de filiais do serviço só restringe onde *aquele serviço* pode ser escolhido.
- Entram ainda: o auxiliar **Categoria de serviço** (FormList, grupo `CADASTROS_AUXILIARES`); o grupo `SERVICOS`; o `/api/servicos/selecao`; as telas ServicoList (List) e ServicoForm (Form).
- Peça de kit: o `TDBCombo` mostra a bolinha da cor quando a opção traz `cor` (fecha o "em aberto" de Filiais; o combo Matriz do FilialForm ganha a bolinha de graça).

### 1.1 O que melhora em relação aos dois ERPs

| Tema | EroErp antigo | EroErp 2.0 | CRM Glass |
|---|---|---|---|
| Onde mora | linha de `produto` com `tipo_produto.classificacao = 'SERVICO'` (texto) | tabela própria | tabela própria |
| Código | `Integer` digitado, sem unicidade | `tenant_sequencia` | `cod_servico`, maior + 1 com índice único (14/11) |
| Nome | sem unicidade | `lower(nome)` + native com `unaccent` | `nome_busca` no Java + índice único; o 409 diz o código do serviço que já tem o nome |
| Preço | no estoque, por emitente; sem estoque vendia a R$ 0,00 | só por filial; NULL ≠ 0 | só por filial; NULL ≠ 0 (igual ao 2.0) |
| Onde é prestado | qualquer emitente | lista só de preço; serviço vale em toda filial | **a lista é onde o serviço é prestado**, com pelo menos uma filial |
| Gravar filiais | — | `sincronizarFiliais` linha a linha | estado completo: `removerPorServico` + `saveAll`; lista obrigatória no corpo |
| Duração | não (só sessões padrão, da clínica) | não | `duracao_minutos` opcional, pensando na agenda |
| Categoria | categoria de produto | não | auxiliar "Categoria de serviço", opcional |
| Combo | `/produtos/select` com o DTO inteiro, inclusive custo | `/select` sem valores | `/selecao` `ACESSO_LIBERADO`, até 20, sem valores, busca no servidor |
| Busca | — | native com `unaccent`; dígitos buscam código | JPQL com `CAST`; Código é filtro à parte (14/11) |
| Outro módulo | — | `findById` devolvendo entidade | só pelo service; `buscarAtivo(id)` nasce com o 1º consumidor |
| Lista | — | faixa "R$ 40 – R$ 60" | faixa de preços; filtro "Filial" mostra só os serviços prestados nela e o preço dela; o Pdf vira a tabela de preços da filial |
| Filial inativa | — | fica, sinalizada | igual, com a bolinha da cor |
| Concorrência | — | PUT sem trava das filhas | `version` + `marcarAlteracao` (mudar só as filiais sobe a versão) |

---

## 2. Decisões

### 2.1 Respostas do Eduardo (21/11/2026)

| Pergunta | Resposta |
|---|---|
| Como o preço é definido? | **Só por filial, como no 2.0.** Sem valor padrão no serviço. |
| Preço da filial obrigatório? | **Opcional.** Vazio = não informado; 0 = gratuito. |
| Filiais do serviço | **Entram já no cadastro**: a lista é onde o serviço é prestado (pelo menos uma). A filial não depende de serviço: a agenda futura mostra toda filial, com ou sem serviço. |
| Duração | **Entra agora, opcional** (minutos, 1 a 1440). Sem "intervalo depois". |
| Categoria | **Entra agora, opcional** (auxiliar "Categoria de serviço"). |
| O que fica para depois | Profissionais habilitados, insumos, comissão, unidade de cobrança (hora, m²), sessões/pacotes. |
| Obrigatórios | **Nome e filial** (pelo menos uma). Categoria, duração, preço e descrição são opcionais. |
| Código | Visível e **não editável, primeiro campo da tela** ("Automático" até salvar). |
| Combo de serviços | Mostra **código e nome** (`cod · nome`), nunca preço. |

### 2.2 Já decidido antes (não se pergunta de novo)

| Decisão registrada | Efeito aqui |
|---|---|
| `cod_<entidade>` por contratante, maior + 1, índice único (14/11) | `cod_servico` e `cod_categoria_servico` com `RepetirSeCodigoRepetido`. Sem `tenant_sequencia`. |
| Busca sem acento por `nome_busca` no Java (16/11) | Nada de `unaccent`. |
| Um grupo só para todos os auxiliares (20/11) | Categoria entra no `CADASTROS_AUXILIARES`. |
| Inativo já gravado continua como "Nome (inativo)"; inativo novo é recusado (16/11, 20/11) | Vale para categoria e filial da lista. |
| Filial sem "filial atual" na sessão; cada movimento guarda a sua (20/11) | Quem consome passa a filial do movimento e confere se o serviço é prestado nela. |
| Combos e buscas de texto não aceitam código (14/11) | Filtro "Código" separado. |
| Situação da lista abre em "Ativo" (20/11) | Igual. |

### 2.3 Decidido pelo planejador

- **Lista filha = estado completo** (como `pessoa`): sem `id` de linha, a filial é a chave. Erro de linha → 400 com caminho (`valores[1].filialId`); filial inexistente ou de outro contratante também é 400 na linha. Filial já gravada e inativada depois continua com `filialAtiva: false` e o preço ainda se corrige.
- **`valores` obrigatório no corpo, de 1 a 100 linhas** (`@NotNull @Size(min=1, max=100)`, mensagem "Informe pelo menos uma filial onde o serviço é prestado.").
- **Inativar filial não olha os serviços** (filial inativa não entra em movimento novo).
- **Uma `ServicoResponseDto` só** para lista, exportação e Form.
- **Categoria sem itens do sistema**: sem `chave`; os DTOs mantêm `sistema=false` e `chave=null` só pela forma comum dos auxiliares no front.
- **Cadastro rápido de categoria** no ServicoForm, só com `CADASTROS_AUXILIARES_ESCREVER` (a API barra).
- **"Todas as filiais"** no painel de filiais: um botão acrescenta de uma vez as filiais ativas que ainda não estão na lista (sem preço). Se o `TFieldList` não tiver lugar para ação extra, o `glass-design-system` cria o encaixe (`acoes?`) junto com a bolinha.
- **`TDBCombo` com bolinha** — primeira peça a sair se quiser cortar custo.
- `ServicoService.buscarAtivo(id)` e `precoNaFilial(servicoId, filialId)` nascem com o 1º consumidor (regra escrita em `servicos.md`).
- **Nasce agora `FilialService.buscarPorIds(ids)`** (Serviços é o 1º módulo que usa filial).

---

## 3. Backend

### 3.1 Migration `023-create-servico.xml`

Três changeSets: `023-create-servico-1-categoria`, `-2-servico`, `-3-filial`. Auditoria e `version` pelo `docs/05`. Todas `TenantEntity`. Comentário no topo: preço só por filial, a lista é onde o serviço é prestado, NULL ≠ 0, código por contratante.

**`categoria_servico`**

| coluna | tipo | nulo | obs. |
|---|---|---|---|
| `id` | UUID | não | `pk_categoria_servico` |
| `tenant_id` | UUID | não | `fk_categoria_servico_tenant` |
| `cod_categoria_servico` | BIGINT | não | |
| `nome` | VARCHAR(40) | não | |
| `nome_busca` | VARCHAR(40) | não | `TextoBusca.normalizar(nome)` |
| `ativo` | BOOLEAN | não | `true` |

Únicos `(tenant_id, cod_categoria_servico)`, `(tenant_id, nome_busca)`, `(id, tenant_id)`; check `cod > 0`. Sem semente, sem `chave`.

**`servico`**

| coluna | tipo | nulo | obs. |
|---|---|---|---|
| `id` | UUID | não | `pk_servico` |
| `tenant_id` | UUID | não | `fk_servico_tenant` |
| `cod_servico` | BIGINT | não | |
| `nome` | VARCHAR(150) | não | |
| `nome_busca` | VARCHAR(150) | não | |
| `categoria_servico_id` | UUID | sim | FK composta |
| `duracao_minutos` | INTEGER | sim | |
| `descricao` | VARCHAR(2000) | sim | |
| `ativo` | BOOLEAN | não | `true` |

Índices `uk_servico_tenant_cod_servico`, `uk_servico_tenant_nome_busca`, `uk_servico_id_tenant` (antes da FK da filha), `ix_servico_categoria`. FK `fk_servico_categoria (categoria_servico_id, tenant_id)` (MATCH SIMPLE). Checks: `cod_servico > 0`; `duracao_minutos IS NULL OR BETWEEN 1 AND 1440`.

**`servico_filial`** (filial onde o serviço é prestado)

| coluna | tipo | nulo | obs. |
|---|---|---|---|
| `id` | UUID | não | `pk_servico_filial` |
| `tenant_id` | UUID | não | |
| `servico_id` | UUID | não | FK composta |
| `filial_id` | UUID | não | FK composta |
| `valor` | NUMERIC(15,2) | **sim** | NULL = não informado; 0 = gratuito |

Únicos `(servico_id, filial_id)`; `ix_servico_filial_filial`; FKs compostas para `servico` e `filial` (`uk_filial_id_tenant` já existe); check `valor IS NULL OR valor >= 0`.

### 3.2 Entidades

- `auxiliar/entity/CategoriaServico`: cópia de `Profissao`, sem `chave`.
- `servico/entity/Servico` (`@DynamicUpdate`): `codServico` (`updatable=false`), `nome`, `nomeBusca`, `CategoriaServico categoria` (LAZY), `Integer duracaoMinutos`, `descricao`, `ativo`. Sem coleção.
- `servico/entity/ServicoFilial`: `Servico servico` (`optional=false, updatable=false`), `Filial filial`, `BigDecimal valor` (nulo).

### 3.3 DTOs

- Categoria: cópia de `Profissao*` (`CreateDto`, `UpdateDto` + `version`, `ResponseDto` com `sistema=false`, `SelectDto` com `chave=null`).
- `ServicoFilialItemDto(@NotNull("Escolha a filial") filialId, @DecimalMin("0.00") @Digits(13,2) valor)` — valor opcional.
- `ServicoCreateDto`: `@NotBlank @Size(150) nome`, `categoriaId`, `@Min(1) @Max(1440) duracaoMinutos`, `@Size(2000) descricao`, `@NotNull @Size(min=1, max=100, message="Informe pelo menos uma filial onde o serviço é prestado.") List<@NotNull @Valid ServicoFilialItemDto> valores`.
- `ServicoUpdateDto`: os mesmos + `@NotNull Long version`.
- `ServicoFilialResponseDto(FilialSelectDto filial, BigDecimal valor, boolean filialAtiva)`.
- `ServicoResponseDto(id, codServico, nome, CategoriaServicoSelectDto categoria, duracaoMinutos, descricao, valores, ativo, auditoria…, version)`.
- `ServicoSelectDto(id, codServico, nome)` — sem preço nem duração (nascem com o consumidor).

### 3.4 Mapper

`CategoriaServicoMapper` (cópia do `ProfissaoMapper`). `ServicoMapper` estático: `toEntity`, `atualizarEntidade` (nunca toca `codServico`), `dados`, `toFilial`, `toFilialResponseDto` (via `FilialMapper.toSelectDto`), `toResponseDto`, `toSelectDto`.

### 3.5 Repositories

- `CategoriaServicoRepository`: cópia do `ProfissaoRepository`.
- `ServicoRepository`:
  - `buscarPorId` (fetch categoria);
  - `buscarComFiltros(codServico, busca, categoriaId, filialId, ativo, Pageable)` com `CAST` nos Strings; filial por `(:filialId IS NULL OR EXISTS (SELECT 1 FROM ServicoFilial sf WHERE sf.servico = s AND sf.filial.id = :filialId))`; **`countQuery` explícito sem fetch**;
  - `buscarParaSelecao(busca, limite)` (ativos);
  - `buscarCodigoPorNome(nomeBusca, ignorarId)`, `buscarProximoCodigo()`;
  - `marcarAlteracao(id, versao, agora, autor)` (`UPDATE VERSIONED`, cópia do `PessoaRepository`).
- `ServicoFilialRepository`: `buscarPorServico`, `buscarPorServicos(ids)` (lote por página), `removerPorServico`.
- `FilialRepository.buscarPorIds(ids)`.

### 3.6 Services

- `FilialService.buscarPorIds(ids) → Map<UUID, Filial>` com `exigirTenantSelecionado()`.
- `CategoriaServicoService`: cópia do `ProfissaoService` sem `exigirDoContratante`.
- `ServicoService` (forma do `FilialService`/`PessoaService`), todo método com `exigirTenantSelecionado()`:
  - `listar` (4 comandos: página, contagem, filiais em lote, nomes de auditoria; `ORDENAVEIS = codServico, nome`);
  - `buscarPorId` (404), `listarParaSelecao` (ativos, 20);
  - `criar` sem `@Transactional` com `repetir.executar(UK_CODIGO, …)`;
  - `atualizar`: versão → validar → nome livre → `marcarAlteracao` (409 se 0) → reler → salvar → substituir filiais;
  - `inativar`/`ativar` (204);
  - `validar`: categoria (400 inexistente; inativa nova 400), filiais linha a linha (repetida, não encontrada, inativa nova), todos os erros num 400 só;
  - `exigirNomeLivre`: 409 "Já existe o serviço código N com este nome."

### 3.7 Controllers

| Método | Rota | Authority |
|---|---|---|
| GET | `/api/servicos?codServico=&busca=&categoriaId=&filialId=&ativo=&page=&size=&sort=` | `SERVICOS_LER` |
| GET | `/api/servicos/selecao?busca=` | `ACESSO_LIBERADO` |
| GET | `/api/servicos/{id}` | `SERVICOS_LER` |
| POST | `/api/servicos` | `SERVICOS_ESCREVER` |
| PUT | `/api/servicos/{id}` | `SERVICOS_ESCREVER` |
| PATCH | `/api/servicos/{id}/inativar`, `/ativar` | `SERVICOS_ESCREVER` |

`CategoriaServicoController` (`/api/categorias-servico`): cópia do `ProfissaoController`.

### 3.8 Permissões

- `Tela`: `SERVICO_LIST`, `SERVICO_FORM`, `CATEGORIA_SERVICO_FORMLIST`.
- `GrupoLiberacao`: novo `SERVICOS` (depois de `FILIAIS`); `CADASTROS_AUXILIARES` ganha a categoria.

### 3.9 Testes

`ServicoIntegracaoTest` (copia `FilialIntegracaoTest`):
- os 4 obrigatórios: caminho feliz (categoria, duas filiais, uma com preço 150,00 e outra sem preço; PUT troca filiais; inativa/reativa), validação recusada (nome vazio/151, preço -1 e 1,234, duração 0 e 1441, `valores` ausente, **`valores` vazio**, 101 linhas), isolamento entre tenants (incl. filial e categoria de outro contratante → 400), par LER/ESCREVER + 422 do superadmin na plataforma;
- código: 1/2 por contratante, ignorado no corpo, dois criar simultâneos sem 409, filtro de código não acha outro contratante;
- regras: nome sem acento/caixa 409 com código, preço vazio ≠ 0, filial repetida, filial inativa nova, filial inativada depois continua, categoria inativa, versão antiga, PUT só com filiais sobe versão, lista substitui, sort 422;
- lista/seleção: filtros (incl. **`filialId` traz só os prestados nela**), seleção sem preços, no máximo 4 comandos;
- banco: checks, FK composta.

`AuxiliarIntegracaoTest`: `CATEGORIA_SERVICO` com `itensDoSistema = 0` e `auxiliaresComItensDoSistema()` separado. `mvnw verify` verde.

---

## 4. Front

### 4.1 Kit (`glass-design-system`)

- **Bolinha no `TDBCombo`:** `OpcaoDoBanco` ganha `cor?`; `opcoesDoCombo` leva a cor; `Combobox` aceita `marca?` por opção e mostra a da escolhida; `TDBCombo` desenha `TCorMarca tamanho="sm"` `aria-hidden`. Testes, catálogo `/design-system` nos dois temas, `docs/07` §3.2.
- **Ação extra no `TFieldList`** (só se ainda não houver encaixe): `acoes?` ao lado de "Acrescentar", para o "Todas as filiais".
- **Movimento: nada novo.**

### 4.2 Menu e rotas

`app/menu.ts` (Serviços depois de Filiais, ícone `ConciergeBell`, "O que você presta, onde e por quanto."), `TITULOS`, `menu.test`; `modules/auxiliares/telas.ts` (8º item, ícone `Shapes`); `modules/servicos/routes.tsx` (`/cadastros/servicos`, `/novo`, `/:id`, lazy); `shared/api/auxiliares.ts`; `modules/servicos/api/servicos.ts` (CRUD, zod, `rotuloDoServico`, `faixaDePrecos` com teste); `formatarDuracao` ("45 min", "1 h 30 min", "—") com teste.

### 4.3 CategoriaServicoFormList — cópia do FormList (`ProfissaoFormList.tsx`)

Campo `TEntry nome` (`metade`, 1–40). Grade Código · Nome · Situação.

### 4.4 ServicoList — cópia do modelo List (`FilialList.tsx`)

Filtros (um por `TRow`): Código (`codigo`, inteiro) · Nome · Categoria (`TCombo`, "Todas") · Filial (`TDBCombo` com bolinha, "Todas"; vai para a API) · Situação ("Ativo").

Colunas: Código · Nome · Categoria · Duração · Preço · Situação.
- Sem filial no filtro: Preço mostra a faixa ("R$ 90,00", "R$ 90,00 – R$ 120,00" ou "—" quando nenhuma filial tem preço) e, embaixo, em `text-muted`, "N filiais".
- Com filial no filtro: o cabeçalho vira "Preço na filial" e mostra o preço daquela filial (ou "Não informado").

Ações: editar, inativar/reativar. Exportar com "Filiais e preços" em texto ("2 · Centro: R$ 90,00; 3 · Norte: não informado"). Pdf pelo `DocumentoLista`: com filial no filtro é a tabela de preços daquela filial.

### 4.5 ServicoForm — cópia do modelo Form (`FilialForm.tsx` + `TFieldList` da `PessoaForm.tsx`)

1. Código (disabled, "Automático", `codigo`)
2. Nome (`metade`, obrigatório, 150)
3. Categoria (`TDBCombo`, `medio`, "Sem categoria", opcional, botão de cadastro rápido)
4. Duração (`inteiro`, sufixo "min", `quantidade`, opcional, ajuda "Em minutos. A agenda vai usar para reservar o horário.")
5. Descrição (`TTextArea`, 4 linhas, 2000, `longo`)
6. `TPanel` "Filiais e preços" (subtítulo "Onde o serviço é prestado. Preço vazio é não informado; 0 é gratuito.") com `TFieldList` (obrigatório ao menos 1): Filial (`TDBCombo` com bolinha, sem as já escolhidas, todas as filiais ativas) · Preço (`moeda`, opcional, "Não informado") · ×; selo "Filial inativa"; botões "Acrescentar filial" e "Todas as filiais"; vazio = "Acrescente as filiais onde o serviço é prestado."
7. `TAuditoria`
8. `TFormFooter`: Salvar · Novo · Voltar

`CategoriaRapidaModal` (`TModal` "Nova categoria", `sm`). Erros pelo `msg.erroApi` com caminho das linhas (e a mensagem de "pelo menos uma filial" no painel); 409 de versão oferece Recarregar.

### 4.6 Relatório

Só o Pdf da List pelo `DocumentoLista`. O agente `relatorios` não entra.

---

## 5. Riscos

| Risco | Prevenção |
|---|---|
| Superadmin na plataforma lendo de todos | `exigirTenantSelecionado()` em todo método; teste 422 |
| IDOR com filial/categoria de outro contratante | busca filtrada (400) + FKs compostas; teste de banco |
| N+1 na lista | fetch da categoria, filiais em lote, `countQuery` sem fetch; teste ≤ 4 comandos |
| Corrida no nome/código | índices únicos + `RepetirSeCodigoRepetido` |
| Edição simultânea só nas filiais | `marcarAlteracao` com `version` |
| PUT sem `valores` apagando filiais | `@NotNull @Size(min=1)` |
| Arredondamento | `BigDecimal` + `NUMERIC(15,2)`; vazio nunca vira 0 |
| Cadastro rápido sem permissão | API exige `CADASTROS_AUXILIARES_ESCREVER` |
| LGPD | serviço sem dado pessoal; `/selecao` sem preço; log só com id |
| Cor injetada | só via `TCorMarca` |

---

## 6. Ordem de execução

| Etapa | Quem | O quê | Paralelo com |
|---|---|---|---|
| E0 | Eduardo | Aprova; cria a branch | |
| E1a | `dev-backend` | §3 inteiro → `mvnw verify` | E1b |
| E1b | `glass-design-system` | §4.1 | E1a |
| E2 | `revisor-backend` ‖ `seguranca` | revisão do backend | E3 |
| E3 | `frontend-modulos` | CategoriaServicoFormList + auxiliares + rota | E2 |
| E4 | `frontend-modulos` | ServicoList + api + filtros + `formatarDuracao` + rotas + menu | |
| E5 | `frontend-modulos` | ServicoForm + schema + `CategoriaRapidaModal` + bolinha no combo Matriz | |
| — | orquestrador | `npm run build` + `vitest` | |
| E6 | `guardiao-layout` ‖ `revisor-ui` ‖ `seguranca` (front) | passada visual única | |
| E7 | `qa` → correções (máx. 2 voltas) → `docs/negocio` | dados demo no Demo Solar (Instalação, Manutenção, Consultoria; um serviço com preço diferente por filial e um sem preço) e no Marina | |

---

## 7. Decisões novas para `docs/negocio/`

- `servicos.md` (novo): regras vigentes; regra para consumidores futuros (retrato de nome e preço; serviço inativo ou não prestado na filial do movimento é recusado; preço = o informado ou o da filial; sem nenhum, a tela pede o valor); a filial não depende de serviço (agenda mostra toda filial); respostas do Eduardo; em aberto (profissionais, insumos, comissão, unidade de cobrança, pacotes).
- `decisoes.md`: uma linha por resposta e "Serviços: List + Form, como no 2.0".
- `cadastros-auxiliares.md`: 8º cadastro, sem itens do sistema.
- `filiais.md`: `buscarPorIds` e bolinha no `TDBCombo` resolvidos; inativar filial não olha serviços.
- `codigo-sequencial.md`: `cod_servico`, `cod_categoria_servico`.
- `eroerp-referencias.md`: pesquisa de 21/11/2026 (trazido, não copiado, correção List + Form).
- `docs/04`, `docs/07`, `docs/01` ("lista filha obrigatória no corpo"), `CONTINUAR.md`.
