# 07 — Kit de telas: componentes, larguras e telas-modelo

## Resumo para quem constrói tela (leia isto primeiro)

Dá para construir ou conferir uma tela de cadastro padrão só com este resumo. O
detalhe de cada assunto está na seção do índice: leia só ela, não o arquivo todo.

**Os três modelos.** Toda tela de cadastro é um deles; copie a tela pronta e troque o que é `// troca`. Não cabe em nenhum: pare e pergunte ao Eduardo.

| Modelo | Copie de | Blocos, de cima para baixo | Botões (esquerda → direita, embaixo) |
|---|---|---|---|
| List | `ero-web/src/modules/admin/pages/ContratanteList.tsx` | `TPage` (`padrao`) → `TForm` de filtros (código, principal, combos, De · Até) → `TFormFooter` → `TDataGrid` → `TDataGridFooter` | Buscar · Limpar · Novo · Exportar · Pdf |
| Form | `ero-web/src/modules/admin/pages/ContratanteForm.tsx` | `TPage` (`formulario`) → `TForm`: código (só leitura) → principal → demais (um por `TRow`) → `TPanel` por assunto → Situação (só se a API de alterar recebe `ativo`) → `TAuditoria` → `TFormFooter` | Salvar · Novo · Voltar |
| FormList | `ero-web/src/modules/auxiliares/pages/TipoCadastroFormList.tsx` (nasce no cadastro de Pessoas; enquanto não existir, o exemplo da §4.3) | `TPage` (`formulario`) → `TForm` curto → `TFormFooter` → `TDataGrid` (sem filtro, ativos e inativos) → `TDataGridFooter` | Salvar · Novo |

**Kit `T*` que existe** (porta única `design-system/kit/index.ts`; largura padrão só vale dentro de `TRow`):
- Estrutura: `TPage` (container, `breadcrumb`, `coreografia`) · `TForm` (cartão `glass-solid`, `somenteLeitura`) · `TFormFooter`/`TFormActionsLeft` (rodapé de botões) · `TRow` (uma linha) · `TCol` (coluna; sem `width` divide a linha) · `TPanel` (seção recolhível) · `TModal` (`sm` 448, `md` 672, `lg` 896) · `TTabs`/`TTabPanel` · `TRotulo` (rótulo do label ao lado).
- Texto: `TEntry` (`metade`; com máscara, a do dado: cpf/telefone/cnh `cpf`, cnpj/cpfCnpj `cnpj`, cep `cep`, hora `hora`, moeda/decimal `valor`, inteiro `quantidade`) · `TDate` (`data`).
- Texto longo: `TTextArea` (`longo`, 3 linhas, contador com `maxLength`).
- Escolha: `TCombo` (largura **automática** pelo maior rótulo: `situacao`/`medio`/`metade`; opções fixas ou carregadas do banco, o inativo gravado com `inativo: true`; `SITUACAO_OPCOES`) · `TDBCombo` (`metade`, busca no servidor, opções de `/selecao`) · `TRadio` e `TCheckBox` (largura do conteúdo) · `TCor` (cor de registro `#RRGGBB`: 8 sugeridas com nome e "Outra"; largura do conteúdo).
- Cor de registro na grade, nos cartões e nos combos: `TCorMarca` (`cor`, `tamanho` `sm`/`md`, `rotulo`). A tela **nunca** escreve `style` de cor: só o `TCor` e o `TCorMarca` aplicam a cor do banco (§3.2, "Cor de registro").
- Lista filha: `TFieldList` (telefones, e-mails, endereços em várias linhas, vínculos; `principal` exclusivo; só leitura sem botões).
- Dados: `TDataGrid` (ações na 1ª coluna, cartões abaixo de `md`) · `TDataGridFooter` (lê o `PaginaDto`) · `TBadge` (situação) · `TAuditoria` (só na edição) · `TAcoesDeExportacao` (Exportar e Pdf).
- Ação e aviso: `TButton` (`variant`: salvar, novo, buscar, limpar, voltar, exportar, pdf, editar, inativar, reativar + genéricas) · `useMessage()` · `useQuestion()` · `useSomenteLeitura(grupo?)`.
- **Não existem** (peça ao `glass-design-system`): `TDateTime`, `TDBComboMulti`, `TDBCheckBox`, `TDBRadio`, `TBotaoImprimir`.
- Casca (fora do kit, `design-system/shell`): o menu é feito de **seções** (`secoes: {rotulo, itens}[]`); item com `filhos` abre o **submenu flutuante** no trilho e na barra inferior. Na barra inferior cabem 5; acima disso o 5º lugar vira **"Mais"**, com o resto achatado (§0, "Casca").

**Escala de larguras** (`width`, só nomes da escala; dica: na dúvida, a menor):
- Fixos (sm+): `uf` 80 · `codigo`/`hora`/`quantidade` 128 · `data`/`cep`/`valor` 160 · `cpf` 176 · `situacao` 192 · `cnpj` 208 · `dataHora`/`curto` 224 · `medio` 320.
- Proporcionais, relativos à `TCol`: `metade` (texto livre sozinho na linha, mín. 256) · `longo` (divide a linha: cada campo na sua `TCol` com `longo`; ou ocupa a linha toda).
- Critério de rótulo do `TCombo`: maior rótulo das opções (com o `vazio` e o " (inativo)") até 18 caracteres = `situacao`; de 19 a 36 = `medio`; acima, `metade`. **O `TCombo` sem `width` já escolhe sozinho** (dentro de `TRow`); a tela não passa `width` por causa do rótulo. O kit emite `data-rotulo-max` e o medidor confere.
- `width` só entra quando o padrão não serve. Abaixo de 640 px tudo empilha e ocupa 100 %.

**Proibido na página de cadastro:**
- Elemento cru (`<input>`, `<select>`, `<textarea>`) e componente de interface fora do kit (`CampoForm`, `Input`, `Tabela`, `Button`, `Dialogo` direto). Importe só de `design-system/kit`.
- `grid`, `col-span`, `w-*`, `sm:w-*` ou `"50%"`/`"200px"` na página: largura é `width` da escala.
- Máscara no `onChange` (o `TEntry` com `mascara` já exibe e grava certo) e `useToast` direto (use `useMessage`).
- Cor, sombra, desfoque, duração ou curva literal (vão para `tokens.css` e `motion/tokens.ts`).

**Disposição.** Um campo por `TRow`. Lado a lado só nos grupos naturais (campos do mesmo documento ficam sempre na mesma linha): CNH · Categoria · Validade, RG · Órgão emissor · UF · Emissão, De · Até, Dia · Das · Às, CEP · Número · Complemento, Bairro · Cidade · UF, Valor · Unidade, linha de `TFieldList`; ou quando o plano mandar dividir (cada um em `TCol` com `longo`). Campo curto nunca estica. Label em cima; ao lado só se o plano pedir (e então em toda a tela).

**Permissão e só leitura.** `useSomenteLeitura('<GRUPO>')` (sem argumento para tela presa ao papel). Sem `<GRUPO>_ESCREVER`, o `TForm somenteLeitura` esconde Salvar, Novo, Inativar e Reativar; na List, `!somenteLeitura &&` no Novo e nas ações da grade. Inativar/reativar na grade com `useQuestion` quando a API de alterar não recebe `ativo`.

**Dados e erro.** Edição manda `version`; lista lê `PaginaDto` (página base 0); `catch (e) { msg.erroApi(e, form) }` marca o campo no 400 e no 409 com `erros`, e oferece Recarregar no 409 sem `erros`. A exportação repete os filtros aplicados.

**Modal e abas.** `TModal` com formulário: `TForm` sem cartão, botões no `TFormFooter`, foco no primeiro campo sem `autoFocus`. `TTabs`: os `TTabPanel` ficam dentro, só a ativa monta e o `useForm` de cada aba mora na tela.

**Conferência.** Teste de código, `medir-campos.mjs` sem `✗` a 1440 px e olho a 1440/768/360 px nos dois temas; a lista final é o "Checklist".

**Índice (leia só a seção que precisa):**

| Assunto | Seção |
|---|---|
| Estado do kit, o que cada peça veste por baixo, decisões e diferenças do 2.0 (só leitura, `TDate`, `TRadio`, `TModal`, `TTabs`, `z-index`, impressão) | "0. Estado" |
| Regra de disposição e lista dos grupos lado a lado | "1. A ideia" |
| Tabelas das larguras, padrão de cada componente, `larguras.ts` | "2. Larguras" (2.1 a 2.4) |
| Props de `TPage`, `TForm`, `TRow`, `TCol`, `TPanel`, `TModal`, `TTabs` | "3.1 Estrutura" |
| Props e máscaras dos campos (`TEntry`, `TDate`, `TTextArea`, `TCombo`, `TDBCombo`, `TRadio`, `TCheckBox`, `TFieldList`, `TAuditoria`) | "3.2 Campos" |
| `useMessage`, `useQuestion` e o que `erroApi` faz por resposta (400, 409, 429) | "3.3 Mensagens e confirmação" |
| `TButton`, cor e ícone de cada ação, tokens de ação, campo só leitura, `useSomenteLeitura`, `TDataGrid`, exportação | "3.4 Botões e grade" |
| De qual componente de `ui/` a tela migra para o kit; rodapé fora de `TForm`; telas fora do kit | "3.5 Do ero-web de hoje para o kit" |
| Código completo dos modelos, ordem de filtros e colunas, rota `/novo` e `/:id`, erro ao carregar | "4.1 List", "4.2 Form", "4.3 FormList" |
| Coreografia e montagem em blocos | "4.4 Montagem e desmontagem em blocos" |
| Label ao lado | "5. Label ao lado" |
| Modal com formulário | "6. Modal" |
| Como se confere, scripts de medição e screenshots, atributos `data-*` do kit | "7. Como se confere" e "7.1 O que o kit expõe para o medidor" |
| Lista final de conferência | "8. Checklist" |

---

> Leia antes de criar ou mexer em qualquer tela de cadastro: formulário,
> listagem com filtros, FormList ou modal. **Este documento prevalece em tudo
> que é forma de tela** — quais componentes montam a tela, onde cada campo fica
> e de que tamanho ele é — sobre o `PLANO-FATIA-2.md` e sobre a frase da
> [DIRECAO-VISUAL §5](../design/DIRECAO-VISUAL.md) "listagem com busca e filtros
> → painel de detalhe → formulário em etapas". **O visual continua sendo o da
> DIRECAO-VISUAL**: tokens, três níveis de vidro, destaque por contratante e a
> montagem e desmontagem em blocos não mudam.
>
> Quem decide o padrão é o Eduardo: as telas do CRM são construídas com o padrão
> do EroErp 2.0 (decisão de 2026-11-13). O molde é o
> `EroErp2.0/docs/14-layout-de-telas.md` e o kit de lá
> (`EroErp2.0/ero/src/components/common/`): **mesmos nomes e mesmas props**,
> vestidos de vidro. Ajuste **aqui**, nunca tela por tela.

---

## 0. Estado

> **O kit existe (fase 0 enxuta, 2026-11-13)** em `ero-web/src/design-system/kit/`,
> porta única `kit/index.ts`. Entrou o que os modelos List e Form usam:
> `larguras.ts`, `TPage`, `TForm` + `TFormFooter`/`TFormActionsLeft`/`TFormActionsRight`,
> `TRow`, `TCol`, `TRotulo`, `TPanel`, `TEntry` (todas as máscaras, CNPJ
> alfanumérico), `TCombo` + `SITUACAO_OPCOES`, `TButton` (todas as variantes),
> `TDataGrid`, `TDataGridFooter`, `TBadge`, `TAuditoria`, `TAcoesDeExportacao`
> (+ `DocumentoLista`/`Folha` para o `documento` da `TPage`), `useMessage`,
> `useQuestion` (o `TQuestionProvider` está montado em `main.tsx`) e
> `useSomenteLeitura`. Fora do kit: `shared/util/format.ts` e
> `shared/api/pagina.ts` (`paginaSchema`, `PaginaDto`).
> **Entraram na fatia 3 (2026-11-14):** `TDate`, `TDBCombo`, `TRadio`,
> `TCheckBox` (booleano e grupo), `TModal`, `TTabs` · `TTabPanel`, o
> `somenteLeitura` do `TPanel` e o `acao` do `TEntry` (botão colado ao campo, o
> "Gerar" da senha). Na casca (`design-system/shell`, fora do kit): o
> `SeletorContratante` (popover do chip do contratante; aceita `aberto`/
> `onAbertoChange` para o "Acessar contratante…" do Ctrl+K abri-lo). Por baixo, em `ui/`: o
> `Calendario` (pt-BR) e, em `shared/util/datas.ts`, as datas `AAAA-MM-DD`.
> **Entraram no cadastro de Pessoas (2026-11-16):** `TTextArea` (contador),
> `TFieldList` (uma ou várias linhas por item, `principal` exclusivo, `dividir`,
> qualquer campo do kit na coluna, inclusive `TDBCombo` com `acao`), o `TCombo`
> com largura automática e a opção `inativo` (o valor gravado que deixou de
> valer), o `TEntry.onCompletar` (CEP completo) e o `erroApi` que lê
> `telefones[0].numero` como `telefones.0.numero`. Na casca: o menu em **seções**
> e o **submenu flutuante** (ver "Casca" abaixo).
> **Entraram em Filiais (2026-11-21):** `TCor` (escolher a cor de registro) e
> `TCorMarca` (a bolinha), com as 8 sugeridas em `tokens.css`
> (`--cor-registro-1` … `-8`) e o anel `--line-strong` (§3.2, "Cor de
> registro"). Na casca: o **"Mais"** da barra inferior.
> **Ainda não existem** (pedir ao `glass-design-system` antes de usar):
> `TDateTime`, `TDBComboMulti`, `TDBCheckBox`, `TDBRadio` e
> `TBotaoImprimir`. O modelo FormList nasce com a `TipoCadastroFormList`.
> Catálogo: seção "Kit de telas" em `/design-system` (e "Kit de telas: peças da
> fatia 3" e "Kit de telas: peças de Pessoas", com os interruptores de só
> leitura; o submenu está no trilho da própria página, em "Cadastros
> auxiliares") e os modelos em tela cheia
> em `/design-system?kit=lista`, `?kit=novo`, `?kit=editar&id=c2` e
> `?kit=leitura&id=c2` (Contratantes de mentira; só em dev).
> **Telas no kit (fatia 3, 2026-11-14):** Contratantes (`ContratanteList` +
> `ContratanteForm`, modelos List e Form), Usuários (`UsuarioList` +
> `UsuarioForm`, com as permissões por grupo em `TRadio`/`TCheckBox`), Logs
> (`AuditoriaList`, List só de consulta) e Minha conta (`MinhaContaPage`, em
> `TTabs`: dados, senha e sessões). Login e Início não são cadastro e ficam
> fora do kit (§3.5).
>
> Diferenças do kit do 2.0, de pele e de plataforma:
>
> - `TCombo` usa o `Combobox` glass (WAI-ARIA, lista em portal), não o
>   `<select>` nativo; o valor continua texto e `vazio` vale `''`.
> - **Tom próprio no conflito** (decisão do Eduardo): quando o destaque do
>   contratante coincide com a cor de uma ação vizinha do Novo, a ação troca de
>   tom por token (`tokens.css`, bloco "Ações x destaque"): Âmbar e Laranja →
>   Pdf terracota; Azul → Buscar índigo; Rosa → Limpar tijolo; Esmeralda →
>   Salvar e Exportar oliva. Todas com texto ≥ 4,5:1.
> - Dentro de `TForm somenteLeitura` os campos ficam `readOnly` +
>   `aria-readonly` (focáveis: o leitor de tela lê o valor), não `disabled`;
>   o `TCombo` foca e não abre a lista; some o `*` de obrigatório e a
>   `ajuda`. `disabled` fica para o campo travado de verdade (Código).
> - `reservarErro` (a linha do erro reservada embaixo do campo) só liga dentro
>   de um `TForm` cujo `useForm` tem `resolver`; filtros e campos soltos não
>   reservam. A ajuda e o erro podem passar da largura de um campo curto (até
>   28rem, a partir de `sm`).
> - `TDataGrid` ganhou `erro`/`onTentarDeNovo` (`EstadoErro`), `rotulo` (nome da
>   grade para leitor de tela) e `rotuloLinha`; com linhas na tela, `carregando`
>   não troca as linhas pelo esqueleto (o `placeholderData` as mantém).
>   No celular os cartões ficam numa superfície de vidro só.
> - `TDataGridFooter` lê o `PaginaDto` (`pagina`, `tamanho`, `totalElementos`,
>   `totalPaginas`) e aceita `carregando`.
> - `TBadge` aceita os tons do 2.0 (`neutro`, `sucesso`, `alerta`, `erro`,
>   `info`, `destaque`) e os do `Badge`; `ponto` põe a bolinha.
> - `TDate` não usa o `<input type="date">` do navegador (que muda de cara e de
>   idioma em cada sistema): é um campo de texto com máscara `DD/MM/AAAA`
>   (teclado numérico) e o `Calendario` pt-BR num popover `glass-flutuante`
>   (botão do calendário ou Alt+↓; semana começa no domingo; setas, PageUp/
>   PageDown, Home/End). Grava `AAAA-MM-DD`; o `onChange` controlado recebe o
>   texto ISO, não o evento. Data que não existe (31/02) volta ao valor
>   anterior ao sair do campo. `min`/`max` travam os dias fora (o "Até" passa
>   `min={de}`): o dia fora fica `aria-disabled` (apagado e riscado, sem
>   `opacity`), continua focável pelas setas e o Enter não o escolhe.
> - `TDBCombo` recebe `buscar(termo?)` com `{ id, nome }[]` (o `SelectDto` das
>   rotas `/selecao`); busca ao abrir e, a cada termo, depois de 300 ms
>   (`ESPERA_DA_BUSCA_MS`), descartando resposta velha. O `onChange` controlado
>   recebe o `id`. Sem `vazio` e sem `required`, o X limpa (como no `TCombo`).
> - `TRadio` e `TCheckBox` usam `<input>` nativos sem a aparência do sistema
>   (classe `.marca`, tokens `--marca-*`): marcado é o degradê do destaque com o
>   sinal em `--on-accent` (o âmbar sai com o sinal escuro). Só leitura:
>   focável, `readOnly`/`aria-readonly`, o clique, o Espaço e as setas não
>   mudam nada, fundo `--input-bg-readonly`. Desabilitado (`disabled` ou a opção
>   `desabilitada`, ex.: "Liberar acesso" com o grupo em "Sem acesso"): o mesmo
>   fundo `--input-bg-readonly`, sem `opacity` (a borda segue ≥ 3:1), rótulo em
>   `--fg-muted`, fora do Tab. `opcoes` aceita `desabilitada` e
>   `dica`: a dica vira o `title` da opção e entra, visível, na ajuda do grupo
>   (depois da `ajuda`, sem repetir; no toque e no teclado o `title` não
>   aparece). O `TRadio` é um `role="radiogroup"` com o rótulo. `TRadio` e
>   `TCheckBox` (booleano ou grupo) **não reservam** a linha do erro: o erro
>   aparece embaixo só quando existe (numa grade de permissões cada caixa
>   cresceria 16 px, e a folga vazia afastava o grupo do campo de baixo).
>   `TCheckBox` com `opcoes`, fora do `TForm`: `valores`/`onValoresChange`.
> - `TModal`: o `TForm` de dentro **não desenha cartão** (o modal é o vidro); os
>   botões vão no `TFormFooter` do formulário (embaixo, à esquerda) e o `acoes`
>   do modal só serve ao modal sem formulário. Ao abrir, o foco vai para o
>   primeiro campo (não use `autoFocus` dentro). `largura` `sm` (448, padrão),
>   `md` (672), `lg` (896). O `submit` de um `TForm` não sobe para o `TForm` de
>   fora (o modal está num portal, mas o evento do React subiria).
> - `TTabs`: os `TTabPanel` vão **dentro** do `TTabs` (o Radix liga aba e painel
>   pela raiz comum). Só a aba ativa fica montada; para o que foi digitado
>   sobreviver à troca, o `useForm` de cada aba mora na tela, fora do
>   `TTabPanel`. A aba escolhida entra como bloco curto (`ConteudoDeAba`, do
>   `motion-designer`); a barra é bloco da montagem e não imprime
>   (`nao-imprime`); o `rotulo` do painel vira o título dele no papel.
> - `TPanel somenteLeitura`: só aquele painel fica como no `TForm somenteLeitura`
>   (campos `readOnly`, sem Salvar/Novo/Inativar/Reativar dentro), com a marca
>   "Só leitura" ao lado do título.
> - `TPanel`: o primeiro do formulário não desenha a borda de cima (linha dupla
>   com a borda do cartão); sem conteúdo (`{null}`), não tem corpo (só o título,
>   sem o vão de 16 px) e não recolhe.
> - Camadas (`z-index`) só pelos tokens `--z-*` de `tokens.css` (classes
>   `z-conteudo`, `z-barra`, `z-menu`, `z-faixa`, `z-popover`, `z-modal`,
>   `z-toast`...): conteúdo < casca < faixa do suporte < popovers (combo, data,
>   menus) < modal < toast. Popover aberto de dentro de um modal sobe acima
>   dele. Com a faixa do suporte na tela, os toasts sobem acima dela
>   (`--folga-inferior`).
> - Toda camada que flutua sobre o conteúdo (lista do `TCombo`/`TDBCombo`,
>   calendário do `TDate`, `Popover`, `Submenu`, menu do usuário, seletor de
>   contratante, paleta Ctrl+K, `TModal`/`Dialogo`, `Gaveta`, toasts) e todo
>   elemento fixo ou sticky da casca com o conteúdo rolando por baixo (`Topbar`,
>   `MobileNav` do celular, faixa do suporte `AvisoContexto`) usa o
>   nível **`glass-flutuante`**, nunca `glass-solid`. O trilho lateral
>   (`Sidebar`) fica em `glass`: o conteúdo começa depois dele. **Camada flutuante não
>   segue a intensidade da Aparência abaixo do piso**: opacidade do token
>   `--glass-flutuante` e desfoque nunca abaixo de `--glass-flutuante-blur-piso`
>   (DIRECAO-VISUAL §2). Componente novo que flutua usa a mesma classe.
> - Classes de impressão: `nao-imprime` (some no papel: a faixa do
>   `AvisoContexto`, a barra do `TTabs`) e `so-impressao` (só no papel).
> - `useMessage().erroApi(e, form?, { recarregar? })`: o Recarregar do 409 (só
>   o 409 sem `erros`; com `erros` é duplicidade e marca o campo, como o 400), por
>   padrão, relê as consultas ativas (`queryClient.invalidateQueries()`).
> - O `documento` da `TPage` imprime sozinho por CSS (`@media print` em
>   `index.css`: some tudo o que não é a folha), sem classe `nao-imprime`.
> - `TFieldList`: o rádio **Principal** é a mesma `.marca` do `TRadio` (os
>   rádios das linhas têm o mesmo `name`, as setas andam entre eles); a linha é
>   um `role="group"` com `aria-label` (`rotuloLinha`, padrão "Linha N"), e o
>   remover diz qual ("Remover Telefone 2"). Acrescentar leva o foco ao 1º campo
>   da linha nova; remover devolve o foco ao Acrescentar. Item em várias linhas
>   fica num quadro com borda `--line` (sem vidro próprio: está no cartão). O
>   erro da lista inteira (`telefones` ou `telefones.root`) aparece embaixo.
> - `TTextArea`: o contador entra na linha da ajuda ("máx. 500 caracteres",
>   "120 de 500 caracteres", `--fg-subtle`: 4,3:1 no escuro e 3,4:1 no claro
>   sobre o vidro sólido, texto secundário ≥ 3:1) e some em só leitura.
> - **Casca** (`design-system/shell`): `Sidebar` e `MobileNav` recebem
>   `secoes: SecaoMenu[]` (`{ rotulo, itens }`), cada seção um
>   `<nav aria-label>` separado por uma linha `--line`; seção vazia some. Item
>   com `filhos` vira um botão (`aria-haspopup="menu"`, `aria-expanded`), ativo
>   quando a rota está sob ele ou num filho, que abre o **submenu flutuante**
>   (`Submenu`, Radix Popover num portal, `glass-flutuante`, `z-popover`): à direita
>   do trilho no computador, acima da barra no celular; título = rótulo do pai,
>   filhos com ícone e texto. Teclado de menu-button: Enter, Espaço, ↓ (e → no
>   trilho) abrem no 1º filho, ↑ no último; ↑ ↓ Home End andam; Esc, Tab, ← (no
>   trilho) e o clique fora fecham, e o foco volta ao botão. A dica do pai some
>   com o submenu aberto. A barra inferior mostra até 5 itens
>   (`MAXIMO_NA_BARRA_INFERIOR`), contando as seções na ordem (o pai conta 1).
>   **Passou de 5:** entram os 4 primeiros e o 5º lugar vira **"Mais"**
>   (ícone `Ellipsis`, numa seção própria, `<nav aria-label="Mais telas">`), um
>   pai cujos filhos são o resto, achatado como no Ctrl+K ("Cadastros
>   auxiliares › Tipos de telefone"). Abre o mesmo submenu flutuante (mesmo
>   teclado, foco preso e devolvido, `aria-expanded`, movimento `submenu`) e
>   fica ativo quando a rota está numa tela de dentro dele. Quem calcula é o
>   `secoesDaBarraInferior` (função pura); o trilho do computador não muda.
>   `telasDoMenu(secoes)` achata para o Ctrl+K e o Início: o filho entra como
>   "Cadastros auxiliares › Tipos de telefone".
>
> O kit **não duplica** o que o `ero-web` já tem: cada peça veste um componente
> de `ero-web/src/design-system/ui/` (exportados pelo `index.ts` de lá) ou da
> coreografia de `ero-web/src/motion/`. O que existe hoje e vai por baixo:
>
> | Peça do kit | O que já existe e vai por baixo | O que falta criar na fase 0 |
> |---|---|---|
> | `TPage` | `PageHeader` (título, subtítulo, ações; é bloco) e `Tela` (coreografia) | `breadcrumb`, `carregando` (com `Skeleton`), `documento` (folha impressa) |
> | `TForm` | `GlassCard level="solid"`; `react-hook-form` 7 + `zod` 4 + `@hookform/resolvers` (já no `package.json`); `Alerta tom="info"` para a faixa de só leitura | o contexto de só leitura |
> | `TFormFooter` · `TFormActionsLeft` · `TFormActionsRight` | `BarraAcoes` (`alinhar="inicio"`; é bloco) | borda no topo, empilhar no celular |
> | `TRow` · `TCol` | — | tudo (flex + `larguras.ts`) |
> | `TPanel` | `CardHeader` (título e ação) | recolhível, sem vidro próprio (§3.1) |
> | `TModal` | `Dialogo` (Radix: foco preso, Esc, `aria-modal`, `glass-flutuante`, fundo sem desfoque) | só a tradução das props |
> | `TTabs` · `TTabPanel` | `Tabs` · `ConteudoAba` (Radix, pílula que desliza) | só a tradução das props |
> | rótulo, ajuda e erro de todo campo | `CampoForm` (rótulo em cima, `id` gerado por `useId`, `aria-describedby`, erro animado sem pular layout, é bloco) | `rotuloOculto` (rótulo só para leitor de tela) |
> | `TEntry` | `Input` (`Bits.tsx`, classe `.input`); `InputSenha` para `type="password"` | máscaras: `shared/util/format.ts`, portando o `EroErp2.0/ero/src/utils/format.ts` (`mascararCpf`, `mascararCnpj`, `mascararCep`, `mascararTelefone`, `paraNumero`, `textoDaMascara`) |
> | `TCombo` · `TDBCombo` | `Combobox` (WAI-ARIA, lista em `glass-flutuante` num portal, `carregando`, `onBuscaChange`, `limpavel`) | debounce e rótulo do valor salvo no `TDBCombo` |
> | `TDBComboMulti` | — | tudo |
> | `TDate` · `TDateTime` | `Popover` (`Overlays.tsx`) | o calendário em pt-BR |
> | `TTextArea` | a classe `.input` | contador "máx. N caracteres" |
> | `TCheckBox` · `TDBCheckBox` | `Toggle` (interruptor) existe; caixa de marcar, não | a caixa de marcar glass |
> | `TRadio` · `TDBRadio` | `Segmented` existe, mas é `tablist`, não grupo de rádio | o grupo de rádio glass |
> | `TCor` · `TCorMarca` | `CampoForm` (`grupo="radiogroup"`); o anel que desliza do seletor de destaque do `EditorAparencia` | existe (Filiais, 2026-11-21) |
> | `TFieldList` · `TRotulo` · `TAuditoria` | — | tudo |
> | `useMessage` | `ToastProvider` / `useToast` (tons `success`, `info`, `danger`, `accent`; botão de ação, ex. "Recarregar" no 409); `ErroApi` de `shared/api/erros.ts` | tom de aviso; erro que fica até fechar, com botão de fechar |
> | `useQuestion` | `ConfirmDialog` (`perigo`, `confirmar`, `onConfirmar` com Promise e "Aguarde…") | a forma de Promise (`await confirmar(...)`) |
> | `TButton` | `Button` (`variant`, `size`, `carregando`, `textoCarregando`; carregando continua focável, `aria-busy`, sem pular largura) | as variantes de ação e os tokens delas (§3.4) |
> | `TDataGrid` | `Tabela` (`glass-solid`, cabeçalho fixo, `Skeleton` ao carregar, vazio, erro, linha clicável por teclado) + `EstadoVazio` / `EstadoErro` | coluna de ações na frente, cartões abaixo de `md` |
> | `TDataGridFooter` | `Paginacao` (página base 0, "1–20 de 137", anterior/próxima) | só a leitura do `PaginaDto` |
> | `TBadge` | `Badge` (tons `success`, `danger`, `info`...) | só o nome |
> | `TAcoesDeExportacao` · `TBotaoImprimir` | — | tudo (planilha CSV, folha impressa) |
> | `useSomenteLeitura` | `useUsuarioAtual()` de `shared/sessao` (traz `permissoes` e `telas` do `/api/auth/eu`) | o hook |
>
> O que a primeira passada do 2.0 fixou, e vale para o kit do CRM desde o
> primeiro dia:
>
> - **A largura padrão só vale dentro de uma `TRow`.** Fora dela o campo ocupa
>   a célula; `width` explícito vale sempre.
> - **Dentro de `TForm`, o campo se liga pelo `name`** — a não ser que receba
>   `value`/`onChange`: aí é controlado por quem chama.
> - **Só leitura é por contexto, não por `<fieldset disabled>`**: o fieldset
>   desligaria também o Voltar. Campos, `TFieldList` e `TButton` leem o
>   `somenteLeitura` do `TForm`.
> - **Máscara numérica grava o texto** (`"72,50"`), que o `paraCorpo` converte
>   com `paraNumero` — vazio continua vazio. Só CPF, CNPJ, CEP e telefone gravam
>   cru (dígitos).
> - **Situação no Form ou no FormList só quando a API de alterar recebe
>   `ativo`.** Quando não recebe, inativar e reativar ficam na grade, com
>   confirmação. No CRM, o `TenantUpdateDto` e o `UsuarioUpdateDto` não recebem:
>   a situação muda por `PATCH /{id}/inativar` e `/ativar`, na grade.
> - **A grade do FormList não tem filtro** e lista ativos e inativos.
> - **Botões embaixo do formulário, à esquerda, o principal primeiro** — List:
>   Buscar · Limpar · Novo · Exportar · Pdf; Form: Salvar · Novo · Voltar;
>   FormList: Salvar · Novo (§3.4).
> - **O `id` do campo é gerado** (`useId`, como o `CampoForm` já faz), não o
>   `name`: duas abas montadas com o mesmo `name` davam `id` repetido e o
>   rótulo apontava para o campo da aba escondida. Label ao lado (§5) passa `id`
>   explícito ao campo.

---

## 1. A ideia

No EroErp antigo, fazer uma tela era **copiar uma tela existente e trocar
nomes, rotas, máscaras e tipos**. O campo já vinha com o tamanho certo, a linha
já sabia se dividir, o rodapé de botões, a auditoria e as mensagens eram iguais
em todas. O 2.0 perdeu isso por um tempo e recuperou com o kit; o CRM nasce com
ele.

O kit traz o antigo com o que o CRM tem de melhor por baixo: react-hook-form +
zod, TanStack Query, os tokens e o vidro da DIRECAO-VISUAL, a montagem em
blocos, a permissão por grupo e a responsividade.

**A regra de disposição:**

- **Campos um abaixo do outro**, um por `TRow`.
- **Lado a lado só** nos grupos naturais abaixo, ou quando a tela tem muitos
  campos e o plano manda dividir a linha (cada campo na sua `TCol`, com
  `width="longo"`).
- **Campos do mesmo documento ficam na mesma linha** (regra do Eduardo,
  20/11/2026): o número do documento e os dados que só existem junto com ele
  (órgão, UF, categoria, emissão, validade). A lista abaixo dá exemplos, mas não
  esgota a regra; documento novo segue o mesmo princípio, e o plano diz a
  linha. Grupos naturais:
  - CNH · Categoria · Validade
  - RG · Órgão emissor · UF · Emissão
  - Título de eleitor · Zona · Seção
  - CTPS · Série · UF
  - Inscrição estadual · UF
  - De · Até
  - Dia · Das · Às
  - CEP · Número · Complemento
  - Bairro · Cidade · UF
  - Valor · Unidade
  - Criado por · Criado em — Alterado por · Alterado em (o `TAuditoria` faz)
  - Cada linha de uma lista filha (`TFieldList`): Tipo · Telefone, Tipo ·
    E-mail — e o botão de remover no fim
- **Label em cima**, dentro do componente. Label ao lado só quando o plano
  pedir — §5.
- **Campo curto nunca estica.** CPF tem tamanho de CPF em qualquer linha.
- **Tudo responsivo:** abaixo de `sm` (640 px) toda `TRow` empilha e todo campo
  ocupa 100 %; acima, a linha quebra sozinha quando as colunas não cabem no
  mínimo delas. Toda tela é conferida a 1440, 768 e 360 px (§7).

---

## 2. Larguras

Cada componente tem **largura padrão** (§2.3) e quase nunca precisa de `width`.
Quando precisa, passa-se **um nome da escala** — nunca `"50%"`, `"200px"` nem
classe Tailwind solta na tela.

Largura não é cor, sombra nem desfoque: não vai para o `tokens.css`. A escala
mora num arquivo só, o `larguras.ts` do kit (§2.4).

### 2.1 Tokens fixos — o tamanho do dado

Valem a partir de `sm`. Levam `max-w-full` (nunca vazam da `TCol`) e o campo
fica encostado à esquerda da coluna.

| `width` | Para | Classe (sm+) | px |
|---|---|---|---|
| `uf` | UF, sigla de 2–3 letras | `sm:w-20` | 80 |
| `codigo` | código curto por contratante, número do registro | `sm:w-32` | 128 |
| `hora` | hora | `sm:w-32` | 128 |
| `quantidade` | quantidade, percentual, inteiro pequeno (limite de usuários) | `sm:w-32` | 128 |
| `data` | data | `sm:w-40` | 160 |
| `cep` | CEP | `sm:w-40` | 160 |
| `valor` | dinheiro e decimal com sufixo | `sm:w-40` | 160 |
| `cpf` | CPF, telefone, celular | `sm:w-44` | 176 |
| `situacao` | `TCombo` curto: situação, sim/não, tipo com 2–5 opções, **maior rótulo até 18 caracteres** | `sm:w-48` | 192 |
| `cnpj` | CNPJ, e o CPF/CNPJ que alterna | `sm:w-52` | 208 |
| `dataHora` | data e hora | `sm:w-56` | 224 |
| `curto` | texto curto livre: número do endereço, complemento, bairro, EAN | `sm:w-56` | 224 |
| `medio` | `TCombo` de enum com rótulos longos (**maior rótulo de 19 a 36 caracteres**: em `situacao` sobram ~132 px úteis), cidade | `sm:w-80` | 320 |

### 2.2 Tokens proporcionais — como o percentual do antigo

São **relativos à `TCol` que contém o campo**, não à tela — exatamente como o
`width="50%"` do antigo.

| `width` | Ocupa | Classe (sm+) |
|---|---|---|
| `metade` | 50 % da coluna, mínimo 256 px | `sm:w-1/2 sm:min-w-64` |
| `longo` | 100 % da coluna, mínimo 256 px | `sm:w-full sm:min-w-64` |

- `metade` é o **padrão de texto livre sozinho na linha** (Nome, Descrição,
  E-mail).
- `longo` é para **dividir a linha**: dois ou três campos, cada um na sua
  `TCol`, cada um `longo` — a linha se divide ao meio ou em terços e os campos
  se ajustam sozinhos. Também para o campo que deve ocupar a linha inteira
  (observação, endereço completo).
- No tablet, quando as colunas não cabem no mínimo, a de sobra desce para a
  linha de baixo; no celular, tudo empilha.

Na dúvida entre duas, a menor — campo largo demais é o que destoa.

### 2.3 Largura padrão de cada componente

| Componente | Padrão |
|---|---|
| `TEntry` sem máscara | `metade` |
| `TEntry mascara="cpf"` · `"telefone"` · `"celular"` · `"cnh"` | `cpf` (a CNH, com Categoria `uf` e Validade `data`, cabe numa `TRow`: 176 + 80 + 160 + 2 × 16 = 448 px) |
| `TEntry mascara="cnpj"` · `"cpfCnpj"` | `cnpj` |
| `TEntry mascara="cep"` | `cep` |
| `TEntry mascara="hora"` | `hora` |
| `TEntry mascara="moeda"` · `"decimal"` · `"decimalComSinal"` | `valor` |
| `TEntry mascara="inteiro"` | `quantidade` |
| `TDate` | `data` |
| `TDateTime` | `dataHora` |
| `TCombo` | automático pelo maior rótulo (com o `vazio` e o " (inativo)"): até 18 caracteres `situacao`, até 36 `medio`, acima `metade` |
| `TDBCombo` · `TDBComboMulti` | `metade` |
| `TTextArea` | `longo` |
| `TCheckBox` · `TDBCheckBox` · `TRadio` · `TDBRadio` · `TCor` | o conteúdo |
| `TAuditoria` | quem: `medio` · quando: `dataHora` (fixo) |

Dentro do `TFieldList`, o campo sem `width` fica direto na linha: `metade` é
metade da linha da lista.

`width` só aparece na tela quando o padrão não serve — e o plano diz por quê.

### 2.4 O mapa, num arquivo só

`ero-web/src/design-system/kit/larguras.ts`:

```ts
export type Largura =
  | 'uf' | 'codigo' | 'hora' | 'quantidade' | 'data' | 'cep' | 'valor' | 'cpf'
  | 'situacao' | 'cnpj' | 'dataHora' | 'curto' | 'medio' | 'metade' | 'longo'

/** Abaixo de `sm` todo campo é 100 %; daqui para cima, o tamanho do dado. */
export const CLASSE_LARGURA: Record<Largura, string> = {
  uf:         'sm:w-20 max-w-full',
  codigo:     'sm:w-32 max-w-full',
  hora:       'sm:w-32 max-w-full',
  quantidade: 'sm:w-32 max-w-full',
  data:       'sm:w-40 max-w-full',
  cep:        'sm:w-40 max-w-full',
  valor:      'sm:w-40 max-w-full',
  cpf:        'sm:w-44 max-w-full',
  situacao:   'sm:w-48 max-w-full',
  cnpj:       'sm:w-52 max-w-full',
  dataHora:   'sm:w-56 max-w-full',
  curto:      'sm:w-56 max-w-full',
  medio:      'sm:w-80 max-w-full',
  metade:     'sm:w-1/2 sm:min-w-64',
  longo:      'sm:w-full sm:min-w-64',
}
```

O componente aplica `w-full ${CLASSE_LARGURA[width ?? padrao]}` no `div` de
fora — o mesmo `div` que leva `data-kit` e `data-largura` (§7.1). As classes
ficam escritas por inteiro, para o Tailwind v4 enxergá-las. A tabela da
§2.1–§2.2, este mapa e os `LIMITES` do `medir-campos.mjs` mudam juntos.

---

## 3. O kit

Em **`ero-web/src/design-system/kit/`**, exportado por um `index.ts`. **A tela
de cadastro só importa do kit**: nada de `<input>`, `<select>`, `grid`,
`col-span` ou classe de largura na página, e nada de `CampoForm`, `Input`,
`Tabela` ou `Button` direto — para componente de interface, o kit é a única
porta. Hooks de roteamento, dados e formulário (`react-router`, TanStack Query,
`react-hook-form`, `zod`) e o `useReduzirMovimento` de `motion/` a tela usa
direto.

Por que uma pasta própria dentro do design system, e não `design-system/ui/`:

- **O dono é o `glass-design-system`**, como de todo componente base: o kit é
  design system, não tela de módulo.
- **`ui/` é agnóstico** e serve também ao login e ao catálogo; o kit amarra
  coisas que `ui/` não deve conhecer — `react-hook-form`, a sessão
  (`useSomenteLeitura`), o `ErroApi` e o `PaginaDto` da ero-api. Misturar faria
  `ui/` depender de `shared/api` e `shared/sessao`.
- **Uma porta só** (`design-system/kit/index.ts`), como o `components/common/`
  do 2.0: é o que o `guardiao-layout` confere ("a tela só importa do kit").

Nomes do EroErp antigo e **as props do kit do 2.0**, como estão lá (inclusive
as em inglês: `title`, `width`, `variant`, `label`, `loading`). O kit traduz
para os componentes de baixo, que falam português (`loading` → `carregando`,
`label` → `rotulo`, `ajuda` → `dica`, `required` → `obrigatorio`, `aberto` /
`onFechar` → `aberto` / `onAbertoChange`).

### 3.1 Estrutura

| Componente | Props | O que faz |
|---|---|---|
| `TPage` | `title`, `breadcrumb?: string[]`, `subtitle?`, `actions?`, `documento?`, `carregando?`, **`coreografia?`** | Container de tela: `<Tela coreografia>` + `PageHeader`. `breadcrumb` em texto acima do título (`Administração › Contratantes`). `carregando` mostra o esqueleto — a tela não monta spinner. `coreografia` é a única prop a mais que o 2.0: a tela declara a sua entrada e saída (DIRECAO-VISUAL §6); padrão `padrao` (List), `formulario` no Form e no FormList (§4.4). |
| `TForm` | `form` (o retorno do `useForm`), `onSubmit`, `somenteLeitura?`, `children` | `FormProvider` + `<form noValidate>` + **cartão `glass-solid`** (`GlassCard level="solid"`, um bloco da montagem). Com `somenteLeitura`, põe o contexto de só leitura, mostra a faixa "acesso só de leitura" (`Alerta tom="info"`) e esconde os botões de escrita (§3.4). |
| `TFormFooter` · `TFormActionsLeft` · `TFormActionsRight` | `children` | Rodapé do cartão, com borda no topo (`--line`): os botões ficam **embaixo do formulário, à esquerda**, na ordem do padrão (§3.4), o principal primeiro. No celular empilham na mesma ordem, o principal em cima. É um bloco (`BarraAcoes`). `TFormActionsRight` existe, mas nenhum modelo o usa. |
| `TRow` | `children` | Uma linha: `flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start`. |
| `TCol` | `width?: 'auto' \| 'rotulo' \| Largura`, `align?: 'left' \| 'right'` | Coluna da linha. **Sem `width`, divide a linha em partes iguais** (`sm:flex-1 sm:min-w-0 sm:basis-64`) — CNH · Categoria · Validade ficam um em cada terço. `auto` encolhe até o campo, para curtos ficarem colados. `rotulo` (`sm:w-48`, 192 px) é a coluna de labels do §5. |
| `TPanel` | `title?`, `subtitle?`, `recolhido?`, `actions?`, **`somenteLeitura?`** | Seção por assunto (Administrador, Endereços…), recolhível pelo título. **Sem vidro próprio**: está dentro do cartão `glass-solid` e a região não passa de duas camadas de `backdrop-filter` (DIRECAO-VISUAL §3, desempenho). Separa por borda `--line` e título (`CardHeader`), como o `.glass-flat`. `somenteLeitura` deixa só este painel só leitura dentro de um formulário editável (marca "Só leitura" no título). |
| `TModal` | `aberto`, `titulo`, `onFechar`, `acoes?`, `largura?: 'sm' \| 'md' \| 'lg'`, `descricao?`, `bloquearFechar?` | Janela (`Dialogo`, `glass-flutuante`, fundo sem desfoque); nunca passa de `calc(100vw - 2rem)`. Foco no primeiro campo ao abrir; o `TForm` de dentro não põe cartão (§6). |
| `TTabs` · `TTabPanel` | `TTabs`: `abas: {id, rotulo, alerta?, icone?, desabilitada?}[]`, `ativa`, `onChange`, `label?`, `children`; `TTabPanel`: `id`, `rotulo?` | Abas (`Tabs` · `ConteudoAba`), quando o formulário é grande demais para painéis. Os painéis vão dentro do `TTabs`; só a ativa fica montada (o `useForm` mora na tela). |

Campo **sem `TCol`** vai direto na `TRow` quando está sozinho na linha. Campo
proporcional (`metade`, `longo`) que **divide** a linha vai sempre numa `TCol`
— é ela que dá a proporção.

### 3.2 Campos

Todos têm `name` e `label`; dentro de `TForm` pegam `register`, valor e erro
**só pelo `name`** (`useFormContext`), e o `required` põe o `*` no rótulo. Fora
de `TForm` (modal simples, filtro solto) aceitam `value`/`onChange`. Todos têm
`width?`, `ajuda?`, `disabled?`, `rotuloOculto?`. O rótulo, a ajuda e o erro
são os do `CampoForm`, e cada campo é um bloco da montagem.

| Componente | Props próprias | O que faz |
|---|---|---|
| `TEntry` | `mascara?`, `casas?`, `suffix?`, `type?`, `acao?` | Texto (`Input`). `acao` é o botão colado ao campo, na altura dele (o "Gerar" da senha temporária), e some em só leitura. Máscaras: `cpf`, `cnpj`, `cpfCnpj`, `telefone`, `celular`, `cep`, `cnh`, `hora`, `moeda`, `decimal`, `inteiro`, `decimalComSinal`. **Exibe formatado; CPF, CNPJ, CEP e telefone gravam só os dígitos, as numéricas gravam o texto da máscara** (§0) — com as funções de `shared/util/format.ts`. A `cnh` aceita só dígitos, até 11, sem pontuação, teclado numérico, e grava cru com o zero à esquerda (por isso não é `inteiro`); o dígito verificador fica com a API (400 em `cnh`), a tela só confere os 11 dígitos. A tela nunca chama máscara no `onChange`. `onCompletar?(cru)` é chamado quando a máscara fica completa ao digitar ou colar (CEP com 8 dígitos, CPF 11, CNPJ 14, celular 11, CNH 11, hora `HH:MM`), uma vez por valor, depois do `onChange` (o formulário já tem o valor): é a consulta do CEP. `type="password"` usa o `InputSenha` (mostrar/ocultar); `type="email"` põe `inputMode="email"` e `autoCapitalize="off"`. Aceita `maxLength` — use o mesmo limite do DTO (`@Size(max = 150)` → `maxLength={150}`); nas máscaras o kit já põe o tamanho do texto formatado. |
| `TDate` | `min?`, `max?` | Data com calendário em pt-BR (no popover glass) e botão de limpar. Digita-se `DD/MM/AAAA` ou escolhe-se no calendário. Grava `AAAA-MM-DD`; monta com `T00:00:00` para exibir; valor inicial `hojeIso()` quando o form pede hoje. A API manda ISO-8601 e o front formata. |
| `TDateTime` | `passoMinutos?` (padrão 5) | Data e hora; grava `AAAA-MM-DDTHH:mm`. |
| `TTextArea` | `linhas?` (padrão 3), `maxLength?` | Texto longo (observação), com a pele do `.input` e o puxador vertical. Com `maxLength`, o contador na linha da ajuda: "máx. 500 caracteres" vazio, "120 de 500 caracteres" ao digitar. Só leitura: `readOnly`, sem contador. |
| `TCombo` | `opcoes: {valor, rotulo, inativo?}[]`, `vazio?`, `autoFocus?` | `autoFocus` (como no `TEntry`: `autoFocus={!somenteLeitura}` no primeiro campo do Form) foca o campo ao montar **sem abrir a lista**. **Opções numa lista local** — situação, enum, ou os tipos que a tela carregou do banco (`/selecao`) sem busca no servidor (`Combobox`). `vazio` é a opção "Todos"/"Selecione…". `inativo: true` marca o valor **já gravado** que deixou de valer: aparece como "Nome (inativo)"; quem monta as opções põe os ativos mais os inativos gravados no registro. **Largura automática** sem `width` (§2.3). `SITUACAO_OPCOES` está pronto no kit. **X de limpar** (também no `TDBCombo`): só com valor, sem `vazio`, sem `required`, e nunca nas larguras estreitas (`uf`, `codigo`, `hora`, `quantidade` — `larguraEstreita`); o padding direito do campo reserva só os botões que aparecem (chevron 40 px, chevron + X 72 px), para a sigla caber inteira a 80 px. |
| `TDBCombo` | `buscar(termo)`, `rotuloInicial?`, `vazio?`, `acao?`, `autoFocus?` | `autoFocus` como no `TCombo`: foca ao montar, sem abrir a lista nem buscar no servidor (a Pessoa da Filial). **Opções do banco** (`Combobox` com `onBuscaChange` e `carregando`, debounce 300 ms) e o rótulo do valor salvo. No CRM as rotas de combo são `GET /api/<recurso>/selecao` (`SelectDto` com `id` e `nome`); hoje devolvem todos os ativos, sem termo — o `buscar` pode ignorar o termo e o `Combobox` filtra local. Quando a lista crescer, a rota ganha `?busca=` no backend. `acao` é o botão colado ao campo, na altura dele, para o **cadastro rápido** do que não está na lista (`<TButton variant="novo" label="" …/>`, que some para quem só lê). |
| `TDBComboMulti` | `buscar`, `excluir?`, `maximo?` | Vários do banco. |
| `TCor` | `value?`, `onChange?(cor)`, `onBlur?` (fora de `TForm`); `required?`, `ajuda?`, `disabled?`, `width?` (padrão: o conteúdo) | **Cor de identificação** de um registro (a filial): as 8 sugeridas (Azul, Verde, Âmbar, Vermelho, Violeta, Rosa, Turquesa, Ardósia) em bolinhas, cada uma com o nome, e "Outra", pelo `<input type="color">` do sistema (cru dentro do kit). Um `role="radiogroup"` com o rótulo do campo e nove `role="radio"`: ← → ↑ ↓ Home End andam e escolhem a sugerida; em "Outra" só focam, e Enter ou Espaço abrem o seletor. A escolhida tem o anel que desliza (`spring.snappy`; sem deslizar no movimento reduzido). **Grava `#RRGGBB` em maiúsculas**; a cor gravada que não é sugerida aparece como "Outra (#A1B2C3)". O hex das sugeridas é lido dos tokens (`getComputedStyle`), não está no código; o 2.0 tinha `cores?`, aqui não (as sugeridas são token). Só leitura: focável, a escolhida marcada, sem clique nem setas, `aria-readonly`. Não reserva a linha do erro (como o `TRadio`). `data-kit="TCor"`, `data-largura="conteudo"`. |
| `TCorMarca` | `cor`, `tamanho?` (`sm` 12 px, `md` 16 px, padrão), `rotulo?` | **A bolinha da cor de registro**, só exibição: na grade, nos cartões do celular e nos combos. `rotulo` ("Cor: Azul") vira `title` e `aria-label` (`role="img"`); sem ele, `aria-hidden` (o nome já está ao lado). Cor fora do formato: bolinha neutra. |
| `TCheckBox` | `opcoes?`, `vertical?` | Sem `opcoes`, um booleano com o rótulo ao lado; com `opcoes` (`{valor, rotulo, desabilitada?, dica?}`), um grupo fixo que grava a lista dos marcados, na ordem das opções. |
| `TDBCheckBox` | `buscar()`, `vertical?`, `altura?` | Grupo vindo do banco. |
| `TRadio` | `opcoes` (`{valor, rotulo, desabilitada?, dica?}`), `vertical?`, `vazio?` | Escolha única fixa (`role="radiogroup"`, setas entre as opções), lado a lado por padrão. `vazio` é a opção "Não informado" (valor `''`), no fim. |
| `TDBRadio` | `buscar()`, `vertical?` | Escolha única vinda do banco. |
| `TFieldList` | `name`, `colunas: ColunaDaLista[]` (uma linha) ou `ColunaDaLista[][]` (item em várias linhas), `novaLinha` (objeto ou função), `minimo?`, `rotuloAdicionar?` (padrão "Acrescentar"), `vazio?`, `detalhe?(i, linha)`, `principal?`, `rotuloLinha?(i, linha)`. Coluna: `{name, componente(campo, i, linha), width?, dividir?}` | **Lista filha editável** dentro do formulário (telefones, e-mails, redes, endereços, vínculos): `useFieldArray` por baixo, uma `TRow` por linha com os campos nas suas larguras padrão, o Principal e o remover no fim da 1ª linha, Acrescentar embaixo. `componente` recebe o `name` completo (`telefones.0.numero`) e serve a qualquer campo do kit (inclusive `TDBCombo` com `acao`, o cadastro rápido). `width` põe o campo numa `TCol` daquela largura; `dividir`, numa `TCol` sem largura (divide o resto da linha). `principal` = nome do booleano da linha: rádio exclusivo, a 1ª linha acrescentada já vem principal, remover a principal passa a marca para a 1ª. Só leitura: sem Acrescentar nem remover, o rádio travado. No celular cada linha empilha. A tela não monta `<ul>`/`grid` de linhas. |
| `TRotulo` | `htmlFor`, `required?` | Só o rótulo, para a coluna de labels do §5. |
| `TAuditoria` | `registro` | Só na edição, no fim do formulário: Criado por · Criado em, Alterado por · Alterado em, só leitura. Lê `criadoPorNome`, `createdAt`, `alteradoPorNome`, `updatedAt` do `ResponseDto` (datas ISO-8601 em UTC, formatadas em pt-BR no fuso do navegador). Linha sem dado não aparece. O backend publica `criadoPorNome`/`alteradoPorNome` em Contratantes e Usuários (cadastro novo segue o mesmo modelo, `docs/01`, "Auditoria de registro"). Dentro de um contratante, o que o superadmin (suporte) cadastrou ou alterou chega com o nome vazio: a linha mostra só a data. |

> **Cor de registro.** A cor que o usuário escolhe para um registro é **dado**,
> não pele: vem do banco como `#RRGGBB` e é a única cor que não mora em
> `tokens.css`. Por isso:
> - **Só o kit a aplica** (`TCor`, `TCorMarca`), numa variável CSS
>   (`--cor-do-registro`) lida por `bg-[var(--cor-do-registro)]`, só na
>   bolinha. Nunca como cor de texto nem fundo de texto; **a tela nunca escreve
>   `style` de cor** nem `bg-[#…]`.
> - **Antes de aplicar**, o kit confere `^#[0-9A-Fa-f]{6}$` (`normalizarCor`,
>   `kit/cores.ts`); fora disso a bolinha sai neutra (`--cor-registro-vazia`).
>   Isso fecha injeção de CSS; o DTO (`@Pattern`) e o banco (CHECK) conferem
>   também.
> - **As 8 sugeridas são token** (`--cor-registro-1` … `-8`), as mesmas nos dois
>   temas e em todo destaque: são dado, não pele.
> - **Contraste (WCAG 1.4.11):** toda bolinha tem o anel `--line-strong`,
>   desenhado sobre o fundo (`bg-clip-padding`): 4,3:1 no escuro e 3,4:1 no claro
>   contra o fundo, com qualquer cor dentro (inclusive `#FFFF00` no claro e
>   `#111111` no escuro). E a cor nunca é a única informação: o nome vai ao lado.

### 3.3 Mensagens e confirmação

| Hook | Uso |
|---|---|
| `useMessage()` | `sucesso(texto)`, `erro(texto)`, `aviso(texto)`, `info(texto)`, e `erroApi(e, form?)`. O `ToastProvider` fica por baixo; **a tela não importa `useToast`**. Sucesso some sozinho; erro fica até fechar. |
| `useQuestion()` | `await confirmar({ mensagem, confirmar: 'Inativar', variante: 'inativar' })` → `true`/`false`. Para inativar, reativar, excluir. Por baixo é o `ConfirmDialog`; `inativar` e `excluir` abrem como `perigo` (botão vermelho, foco inicial em Cancelar). |

O `erroApi` lê o `ErroApi` (ProblemDetail, RFC 9457, de `shared/api/erros.ts`)
e faz o que cada resposta pede:

| Resposta | O que a tela mostra |
|---|---|
| 400 com `erros[{campo, mensagem}]` | **erro no campo**: `form.setError(campo, { message })`, foco no primeiro. O `campo` é o caminho do DTO (`administrador.email`), que é o `name` do campo quando o schema espelha o DTO; a posição numa lista vem entre colchetes e o kit troca por ponto (`telefones[0].numero` → `telefones.0.numero`, o `name` do `TFieldList`). Campo que a tela não tem cai no toast. |
| 409 com `erros[{campo, mensagem}]` (`CONFLITO` de duplicidade: e-mail, documento já usado) | **igual ao 400**: erro no campo pelo caminho do DTO (`administrador.email`, `documento`, `email`), foco no primeiro, **sem** Recarregar (recarregar não resolve duplicidade). Se nenhum campo existe no form, o `detail` vai num toast de erro comum, também sem Recarregar. |
| 409 sem `erros` (`CONFLITO`, `version` desatualizada) | toast de erro com o botão **Recarregar** (relê o registro e refaz o `form.reset`) |
| 429 | aviso com o `retryAfter` em segundos |
| 401 | nada: o cliente já tentou renovar e a sessão cai no login |
| demais | o `detail` (em português), senão o texto padrão do status |

Exceção que continua valendo: numa superfície que recalcula sozinha (prévia ao
vivo, simulação), 400 é estado inline (`Alerta`), não mensagem.

### 3.4 Botões e grade

| Componente | Props | O que faz |
|---|---|---|
| `TButton` | `variant`, `label`, `loading?`, `size?`, `type?`, `icone?` | Variantes de ação **com ícone e cor prontos**: `salvar`, `novo`, `buscar`, `limpar`, `voltar`, `exportar`, `pdf`, `editar`, `inativar`, `reativar`; e as genéricas `primary`, `secondary`, `ghost`, `danger`. Cores por token, nunca hex. Dentro de `TForm somenteLeitura`, `salvar`, `novo`, `inativar` e `reativar` **não aparecem**. `label=""` deixa só o ícone em **qualquer** variante com ícone: botão quadrado, 32×32 na grade (`sm`) e 40×40 fora; nas ações o nome vira `aria-label` e dica, nas genéricas a tela passa `aria-label` (e `title`; sem ele a dica é o `aria-label`), ex.: `<TButton variant="secondary" icone={LogIn} label="" aria-label={'Acessar ' + t.nome} title="Acessar contratante" />`. `loading` é o `carregando` do `Button`: continua focável e não muda de largura. `icone` (componente do `lucide-react`) dá ícone às genéricas (`<TButton variant="secondary" icone={Palette} label="Configurar aparência" />`); nas ações troca o padrão. Sem `size`, vale o que o contêiner impõe (`sm` no `acoes` do `TDataGrid`), senão `md`. |
| `TDataGrid` | `colunas`, `linhas`, `chaveDe`, `carregando?`, `onLinhaClick?`, `tituloCartao?`, `vazioTitulo?`, `vazioDescricao?`, `acoes?(linha)`, `erro?`, `onTentarDeNovo?` | A `Tabela` glass (`glass-solid`). Ações na **primeira coluna**, como no antigo. Vira cartões abaixo de `md`. `erro` mostra o `EstadoErro` no lugar das linhas, com "Tentar de novo". Coluna: `chave`, `cabecalho`, `render(linha)`, `numerica?`, `secundaria?`, `principal?`, `className?`. |
| `TDataGridFooter` | `pagina` (o `PaginaDto`), `onPaginaChange` | "Exibindo X–Y de N registros" e a paginação (`Paginacao`). Lê `pagina`, `tamanho`, `totalElementos`, `totalPaginas`. |
| `TAcoesDeExportacao` | como no 2.0 (`nome`, `colunas`, `carregar(limite, indice)`, `aoCarregarParaImprimir`) | Os botões **Exportar** (planilha CSV) e **Pdf** (a folha impressa). Repetem a consulta com os **filtros aplicados**, página a página, até o teto do 2.0 (`TETO_DE_EXPORTACAO`), e avisam se cortou. Na List, vão no rodapé do filtro, depois do Novo. |
| `TBotaoImprimir` | como no 2.0 | No `actions` da `TPage`. |

**Os botões de cada modelo — nesta ordem, da esquerda para a direita, embaixo
do formulário:**

| Modelo | Botões |
|---|---|
| List | Buscar (ou Enter) · Limpar · Novo · Exportar · Pdf |
| Form | Salvar · Novo · Voltar |
| FormList | Salvar · Novo (o Novo esvazia o formulário para cadastrar) |

**Cor e ícone de cada ação** — as cores do 2.0, em versão glass (o `TButton`
já traz; a tela só escolhe a `variant`):

| Ação | Cor (2.0) | No CRM (glass) | Ícone (`lucide-react`) |
|---|---|---|---|
| `salvar` | verde | cheio: degradê `--success-strong` → `--success-2-strong`, texto `--on-success`, brilho `--success-glow` | `Check` |
| `buscar` | azul | cheio: `--info-strong` → `--info-2-strong`, texto `--on-info` | `Search` |
| `limpar` | vermelho | cheio: `--danger-strong` → `--danger-2-strong`, texto `--on-danger` | `Eraser` |
| `novo` | cor do contratante | cheio: o `primary` de hoje (`accent-gradient`, `--accent-strong` → `--accent-2-strong`, texto `--on-accent`, `btn-shine`) | `Plus` |
| `exportar` | verde | como `salvar` | `FileSpreadsheet` |
| `pdf` | âmbar | cheio: `--warning-strong` → `--warning-2-strong`, texto `--on-warning` | `FileText` |
| `voltar` | neutro, com borda | o `glass` de hoje (`.chip`: `--chip`, borda `--line`, texto `--fg`) | `ChevronLeft` |
| `editar` · `inativar` · `reativar` (grade, só ícone) | azul · vermelho · verde | leve: ícone na cor (`--info`, `--danger`, `--success`), fundo da cor a 12 % no hover, como o `danger` de hoje | `Pencil` · `Lock` · `LockOpen` |

"Versão glass" é o que o `primary` já é hoje: degradê da cor, brilho difuso da
cor por baixo, o reflexo que passa no hover (`btn-shine`) e o `whileTap` do
`Button` — **sem `backdrop-filter`** (o botão está dentro do cartão
`glass-solid`). O degradê é opaco: o contraste do texto não depende do que
está atrás do vidro.

**Tokens novos que o `glass-design-system` cria no `tokens.css` na fase 0**,
nos blocos do tema escuro **e** do claro (texto ≥ 4,5:1 sobre as duas pontas do
degradê, nos dois temas; o anel de foco continua `--focus-ring`):

| Token | Para quê | Sugestão de partida (a validar) |
|---|---|---|
| `--success-strong`, `--success-2-strong`, `--on-success` | Salvar, Exportar | `#047857` → `#065f46`, texto `#ffffff` (5,5:1 e 7,7:1) |
| `--info-strong`, `--info-2-strong`, `--on-info` | Buscar | `#1d4ed8` → `#1e40af`, texto `#ffffff` (6,7:1 e 8,7:1) |
| `--danger-strong`, `--danger-2-strong`, `--on-danger` | Limpar | `#be123c` → `#9f1239`, texto `#ffffff` (6,3:1 e 8,0:1) |
| `--warning-strong`, `--warning-2-strong`, `--on-warning` | Pdf | `#f59e0b` → `#fbbf24`, texto escuro `#1a1405` (8,5:1 e 11,0:1) |
| `--success-glow`, `--info-glow`, `--danger-glow`, `--warning-glow` | brilho sob o botão, como o `--accent-glow` | `color-mix(in srgb, var(--x-strong) 50%, transparent)` |
| `--input-bg-readonly`, `--input-border-readonly` | campo só leitura (abaixo) | escuro um tom mais fundo que `--input-bg`; claro um cinza leve; o texto `--fg-muted` tem de passar de 4,5:1 sobre ele |
| `--folha-bg`, `--folha-fg`, `--folha-fg-muted`, `--folha-linha` | a folha impressa (`documento` da `TPage`): papel branco, texto preto, sem vidro nem fundo de cena | — |
| `--folha-destaque`, `--folha-destaque-vivo`, `--folha-destaque-fundo`, `--folha-sobre-destaque` | a moldura do relatório na cor do contratante ([docs/08](08-relatorios.md)): logo, barra do cabeçalho, régua, cabeçalho da tabela | derivados de `--accent-ink`/`--accent`; texto branco sobre `--folha-destaque` ≥ 6:1 nos seis destaques |

`--success`, `--info`, `--danger` e `--warning` de hoje continuam sendo os de
texto e ícone (no claro são tons escuros, no escuro claros); os `-strong` são
para preenchimento. O `primary` (Novo) já tem os seus. As classes que usam
estes tokens (o equivalente ao `accent-gradient` para cada cor) também ficam no
design system, nunca na tela.

**Campo só leitura tem fundo diferente.** `disabled` (Código) e `readOnly`
(`TAuditoria`) saem iguais: fundo `--input-bg-readonly`, borda
`--input-border-readonly` e texto `--fg-muted`, sem o realce de hover e de foco
da `.input` — quem olha vê que ali não se digita. O `medir-campos.mjs` reprova
campo só leitura com o mesmo fundo de um editável.

Quem só lê não vê Salvar nem Novo (o `TButton` some sozinho dentro de
`TForm somenteLeitura`; na List, `!somenteLeitura &&`).

**Só leitura no CRM** sai do `GET /api/auth/eu`: `useSomenteLeitura('<GRUPO>')`
é `true` quando `permissoes` **não** traz `<GRUPO>_ESCREVER` (o `<GRUPO>_LER`
basta para abrir a tela; ver `docs/04-permissoes.md`). O menu monta pelas
`telas`. Tela presa ao papel (Contratantes, Configuração do contratante) não
tem grupo: chama `useSomenteLeitura()` sem argumento, que dá `false`, e só
aparece para o `SUPERADMIN` na plataforma.

### 3.5 Do ero-web de hoje para o kit

No CRM não há o que renomear: nenhuma tela de cadastro existe. O que muda é
**quem a tela chama**:

| Hoje, direto do `design-system/ui` | Na tela de cadastro |
|---|---|
| `Tela` + `PageHeader` | `TPage` (com `coreografia`) |
| `GlassCard level="solid"` em volta de um `<form>` | `TForm` |
| `CampoForm` + `Input` / `InputSenha` | `TEntry` (`type="password"`) |
| `Combobox` | `TCombo` (fixo) / `TDBCombo` (banco) |
| `Tabela` + `Paginacao` | `TDataGrid` + `TDataGridFooter` |
| `BarraAcoes` + `Button` | `TFormFooter` + `TFormActionsLeft` + `TButton variant` |
| `Dialogo` | `TModal` |
| `Tabs` + `ConteudoAba` | `TTabs` + `TTabPanel` |
| `useToast` + `ErroApi` à mão | `useMessage()` |
| `ConfirmDialog` com estado de aberto à mão | `useQuestion()` |
| `Badge` | `TBadge` |
| `grid md:grid-cols-2` na página | `TRow` + `TCol` + `width` da escala |

**Rodapé de ações fora de um `TForm`** (tela que não é cadastro, como a Aparência
do contratante): usa o mesmo `TFormFooter` + `TFormActionsLeft` + `TButton`, não
`BarraAcoes` solto. Fora do `TForm` ele não desenha a borda no topo, mas empilha
igual no celular (o principal em cima, cada botão na largura toda).

**Peças de `ui/` que saem pelo kit:** `AvisoContexto` (selo "Prévia de X",
"Você está dentro de X") e `EditorAparencia` são reexportados por
`design-system/kit`, para a Aparência do contratante (e qualquer tela que use o
kit) importar só do kit. Dentro de uma `<Tela>`, o `AvisoContexto` no fluxo é
um bloco da montagem: entra e sai com a coreografia, como o `TFormFooter` fora
do `TForm`.

O login (`modules/auth`) e o Início (`modules/inicio`) não são cadastro e
continuam como estão, com as coreografias `login` e `inicio`. Kanban, agenda e
painéis também não são List, Form nem FormList: quando chegarem, o plano diz
com o Eduardo como ficam.

---

## 4. Telas-modelo

Três modelos. **Toda tela de cadastro é um dos três.** Tela nova = copiar o
modelo (ou a tela pronta mais parecida que já o segue) e trocar o que está
marcado `// troca`. Se a tela não cabe em nenhum, **pare e pergunte** ao
Eduardo.

As telas ficam em `ero-web/src/modules/<modulo>/pages/`, a API do módulo em
`modules/<modulo>/api/` (funções sobre o `api.requisitar` de
`shared/api/cliente.ts`, com o `schema` zod da resposta) e os schemas do
formulário em `modules/<modulo>/schemas/`.

> **Os modelos abaixo são exemplos.** List e Form usam Contratantes
> (`/admin/contratantes`, campos do `TenantCreateDto` / `TenantUpdateDto` /
> `TenantResponseDto`) porque é a tela candidata a nascer com o kit; a forma
> final dela sai do plano aprovado pelo Eduardo. O FormList usa uma tabela de
> apoio **hipotética** — o CRM ainda não tem nenhuma.

Contrato da ero-api que os três seguem (`docs/01`):

- **Lista** em `PaginaDto`: `{ conteudo, pagina, tamanho, totalElementos,
  totalPaginas }`, página começando em 0; parâmetros `page`, `size` e
  `sort=campo,asc`, mais os filtros da rota (`busca`, `ativo`...).
- **Erro** em ProblemDetail: `erros[{campo, mensagem}]` vira erro no campo
  (§3.3).
- **Edição** manda a `version` do registro lido; 409 se outra pessoa salvou
  antes.
- **Permissão** pelo `/api/auth/eu`: `telas` monta o menu; sem
  `<GRUPO>_ESCREVER`, a tela é só leitura.

### 4.1 List com filtros (`/admin/contratantes`)

Filtros num `TForm` com **botões, como no antigo**: Buscar (ou Enter), Limpar,
Novo, Exportar, Pdf. A consulta só roda ao buscar, ao trocar de página ou ao
limpar — menos requisições, o que importa quando a tabela cresce.

```tsx
const FILTROS_VAZIOS: Filtros = { busca: '', ativo: 'true' }            // troca

export function ContratanteList() {                                     // troca
  const navigate = useNavigate()
  const somenteLeitura = useSomenteLeitura()                            // troca: presa ao papel; com grupo, useSomenteLeitura('USUARIOS')
  const msg = useMessage()
  const { confirmar } = useQuestion()
  const queryClient = useQueryClient()
  const form = useForm<Filtros>({ defaultValues: FILTROS_VAZIOS })
  const [aplicados, setAplicados] = useState(FILTROS_VAZIOS)
  const [pagina, setPagina] = useState(0)

  const lista = useQuery({
    queryKey: ['tenants', 'lista', aplicados, pagina],                  // troca
    queryFn: () => tenantsApi.listar({ ...paraConsulta(aplicados), page: pagina, size: 20, sort: 'nome,asc' }), // troca
    placeholderData: keepPreviousData,
  })

  const filtrar = (f: Filtros) => { setAplicados(f); setPagina(0) }
  const limpar = () => { form.reset(FILTROS_VAZIOS); filtrar(FILTROS_VAZIOS) }

  const alternar = async (t: TenantResponse) => {                       // troca
    if (!(await confirmar({ mensagem: `${t.ativo ? 'Inativar' : 'Reativar'} ${t.nome}?`,
      variante: t.ativo ? 'inativar' : 'reativar' }))) return
    try {
      await (t.ativo ? tenantsApi.inativar(t.id) : tenantsApi.ativar(t.id)) // PATCH /{id}/inativar | /ativar
      await queryClient.invalidateQueries({ queryKey: ['tenants'] })
    } catch (e) { msg.erroApi(e) }
  }

  const colunas: Coluna<TenantResponse>[] = [ /* nome (principal: true) · documento · e-mail · criado em · usuários · situação */ ] // troca

  return (
    <TPage title="Contratantes" breadcrumb={['Administração', 'Contratantes']} // troca
           documento={…}>
      <TForm form={form} onSubmit={filtrar}>
        <TRow><TEntry name="busca" label="Nome ou documento" /></TRow>  {/* troca */}
        <TRow><TCombo name="ativo" label="Situação" opcoes={SITUACAO_OPCOES} vazio="Todas" /></TRow>
        <TFormFooter>
          <TFormActionsLeft>
            <TButton variant="buscar" type="submit" />
            <TButton variant="limpar" onClick={limpar} />
            {!somenteLeitura && <TButton variant="novo" onClick={() => navigate('/admin/contratantes/novo')} />}
            <TAcoesDeExportacao … />
          </TFormActionsLeft>
        </TFormFooter>
      </TForm>

      <TDataGrid colunas={colunas} linhas={lista.data?.conteudo ?? []} chaveDe={(t) => t.id}
        carregando={lista.isFetching} erro={lista.error} onTentarDeNovo={() => lista.refetch()}
        onLinhaClick={(t) => navigate(`/admin/contratantes/${t.id}`)}
        acoes={somenteLeitura ? undefined : (t) => (<>
          <TButton variant="editar" label="" onClick={() => navigate(`/admin/contratantes/${t.id}`)} />
          <TButton variant={t.ativo ? 'inativar' : 'reativar'} label="" onClick={() => alternar(t)} />
        </>)}
        vazioTitulo="Nenhum contratante encontrado" vazioDescricao="Ajuste os filtros ou cadastre o primeiro." />
      <TDataGridFooter pagina={lista.data} onPaginaChange={setPagina} />
    </TPage>
  )
}
```

- Ordem dos filtros: código → principal (nome, busca) → combos → período De ·
  Até (uma `TRow`, cada um na sua `TCol width="auto"`).
- Código do registro (cadastro de negócio com `cod_<entidade>`, ver
  `docs/01` "Código do registro"): filtro exato na primeira `TRow`,
  `<TEntry name="codPessoa" label="Código" mascara="inteiro" width="codigo" maxLength={10} />`
  (a máscara grava o texto com milhar, "1.500": o `paraConsulta` converte com
  `paraNumero` antes de mandar `codPessoa` para a API, com teste no schema);
  na grade, a primeira coluna
  `{ chave: 'codPessoa', cabecalho: 'Código', numerica: true, className: 'w-px whitespace-nowrap', render: p => String(p.codPessoa) }`;
  e primeiro também nas colunas exportadas (Exportar e Pdf). Contratantes e
  usuários não têm código.
- Ordem das colunas: código · principal · demais textos · datas (ex.: "Criado
  em", opcional) · valores (`numerica`) · situação (`TBadge`) por último —
  datas sempre antes dos valores. Código, data, valor e situação com
  `className: 'w-px whitespace-nowrap'`; a principal leva a sobra e vai com
  `principal: true` (com `tituloCartao`, ela não se repete no cartão do
  celular; sem nenhuma marcada, vale a primeira); `secundaria: true` nas que
  podem sumir em tela média, nunca na principal.
- Os botões do `acoes` da grade não levam `size`: o `TDataGrid` impõe `sm`.
- A exportação repete os **filtros aplicados**, não os digitados e não
  filtrados.
- O `queryKey` leva os filtros aplicados e a página: trocar de página não
  refaz a montagem da tela, só as linhas (o `placeholderData` mantém as
  antigas até chegarem as novas).

### 4.2 Form (`/admin/contratantes/novo`, `/admin/contratantes/:id`)

```tsx
export function ContratanteForm() {                                     // troca
  const { id } = useParams()
  const navigate = useNavigate()
  const somenteLeitura = useSomenteLeitura()                            // troca
  const msg = useMessage()
  const queryClient = useQueryClient()
  const form = useForm<Dados>({ resolver: zodResolver(schema), defaultValues: VAZIO }) // troca: schema espelha o Create/UpdateDto
  const salvo = useQuery({ queryKey: ['tenants', id], queryFn: () => tenantsApi.buscar(id!), enabled: !!id }) // troca

  useEffect(() => { if (salvo.data) form.reset(paraForm(salvo.data)) }, [salvo.data])

  const salvar = async (d: Dados) => {
    try {
      const t = id
        ? await tenantsApi.alterar(id, { ...paraCorpo(d), version: salvo.data!.version }) // troca — 409 se outra pessoa salvou antes
        : await tenantsApi.criar(paraCorpoCriacao(d))                                     // troca
      msg.sucesso('Contratante salvo')                                  // troca
      await queryClient.invalidateQueries({ queryKey: ['tenants'] })
      navigate(`/admin/contratantes/${t.id}`)
    } catch (e) { msg.erroApi(e, form) }   // 400 e 409 com erros → erro no campo; 409 sem erros → "Recarregar"
  }
  const novo = () => (id ? navigate('/admin/contratantes/novo') : form.reset(VAZIO))

  return (
    <TPage title={somenteLeitura ? 'Contratante' : id ? 'Editar contratante' : 'Novo contratante'} // troca
           breadcrumb={['Administração', 'Contratantes', id ? (salvo.data?.nome ?? 'Editar') : 'Novo']}
           coreografia="formulario" carregando={salvo.isLoading}>
      <TForm form={form} onSubmit={salvar} somenteLeitura={somenteLeitura}>
        <TRow><TEntry name="nome" label="Nome" required autoFocus={!somenteLeitura} /></TRow> {/* troca */}
        <TRow><TEntry name="documento" label="CNPJ ou CPF" mascara="cpfCnpj" /></TRow>
        <TRow><TEntry name="email" label="E-mail" type="email" /></TRow>
        <TRow><TEntry name="limiteUsuarios" label="Limite de usuários" mascara="inteiro" required /></TRow>

        {!id && (
          <TPanel title="Administrador">                                {/* troca: só na criação */}
            <TRow><TEntry name="administrador.nome" label="Nome" required /></TRow>
            <TRow><TEntry name="administrador.email" label="E-mail" type="email" required /></TRow>
            <TRow><TEntry name="administrador.senha" label="Senha temporária" type="password" required /></TRow>
          </TPanel>
        )}

        {/* Sem Situação: o TenantUpdateDto não recebe `ativo` (§0) — fica na grade. */}
        <TAuditoria registro={salvo.data} />

        <TFormFooter>
          <TFormActionsLeft>
            <TButton variant="salvar" type="submit" loading={form.formState.isSubmitting} />
            <TButton variant="novo" onClick={novo} />  {/* aberto: vai para /novo; no /novo: form.reset(VAZIO) */}
            <TButton variant="voltar" onClick={() => navigate('/admin/contratantes')} />
          </TFormActionsLeft>
        </TFormFooter>
      </TForm>
    </TPage>
  )
}
```

Ordem fixa:

1. Código (só leitura), quando a entidade tem:
   `<TEntry label="Código" value={salvo?.codPessoa ?? ''} placeholder="Automático" disabled width="codigo" />`.
   No Novo fica vazio com "Automático"; o número aparece depois de salvar. Nunca
   vai no corpo do POST nem do PUT.
2. Campo principal (nome, descrição), depois os demais — **um por linha**.
3. `TPanel` por assunto, na ordem em que se preenche (Administrador, Contatos,
   Endereços, Observações). Painel de um campo só se junta ao vizinho.
4. Situação, se a API de alterar recebe `ativo`.
5. `TAuditoria`.
6. Rodapé: Salvar · Novo · Voltar, embaixo, à esquerda (§3.4). Título: "Novo
   …", "Editar …" e, para quem só lê, o nome da coisa ("Contratante"). Ação que
   não é salvar (Configurar aparência, Acessar o contratante, Redefinir senha)
   vai num `TPanel` próprio, abaixo do formulário, ou no `actions` da `TPage`.

**Rota `/novo` e rota `/:id`:** a `RotaAnimada` da casca troca a tela pela URL
(a chave é o `pathname`). Ir de `/novo` para `/:id` depois de salvar desmonta a
tela e monta de novo — o formulário nasce limpo, sem precisar de componente
de rota no meio. A direção vem da profundidade da rota: da lista para a ficha
(mais fundo) a tela nova entra pela direita; voltar, pela esquerda.

**Erro ao carregar o registro** (id que não existe, ou que a API devolve como
404): o Form avisa e volta à lista, sem ficar com o esqueleto ou o formulário
vazio na tela:

```tsx
useEffect(() => {
  if (!salvo.error) return;
  msg.erroApi(salvo.error);                                   // o detail da API (404 → "Não encontramos…")
  navigate('/admin/contratantes', { replace: true });         // troca
}, [salvo.error, msg, navigate]);
```

Formulário grande demais para painéis usa `TTabs`; dentro de cada aba, as
mesmas regras.

### 4.3 FormList (tabelas de apoio)

Formulário em cima, grade embaixo, na mesma tela — grupos, categorias, tipos.
É o modelo que mais se copia: entre duas telas FormList só mudam o nome, a API
e os campos.

> **O modelo FormList é a `TipoCadastroFormList`**
> (`ero-web/src/modules/auxiliares/pages/TipoCadastroFormList.tsx`, cadastro de
> Pessoas, `PLANO-PESSOAS.md` §4.3): copie dela. O exemplo abaixo é o
> **hipotético** que a originou (nomes, rota e campos só mostram a forma) e
> vale enquanto a tela não existir.

```tsx
export function CategoriaFormList() {                                   // troca (exemplo)
  const somenteLeitura = useSomenteLeitura('CATEGORIAS')                // troca (grupo hipotético)
  const msg = useMessage()
  const { confirmar } = useQuestion()
  const queryClient = useQueryClient()
  const reduzir = useReduzirMovimento()
  const form = useForm<Dados>({ resolver: zodResolver(schema), defaultValues: VAZIO }) // troca
  const [editando, setEditando] = useState<CategoriaResponse>()         // troca
  const [pagina, setPagina] = useState(0)

  const lista = useQuery({
    queryKey: ['categorias', 'lista', pagina],                          // troca
    queryFn: () => categoriasApi.listar({ page: pagina, size: 20, sort: 'nome,asc' }), // troca: sem filtro, ativos e inativos
    placeholderData: keepPreviousData,
  })

  const limpar = () => { setEditando(undefined); form.reset(VAZIO) }
  const editar = (c: CategoriaResponse) => {
    setEditando(c); form.reset(paraForm(c))
    window.scrollTo({ top: 0, behavior: reduzir ? 'auto' : 'smooth' })
  }
  const salvar = async (d: Dados) => {
    /* editando ? alterar(editando.id, { ...paraCorpo(d), version: editando.version }) : criar(paraCorpo(d))
       → msg.sucesso → limpar → invalidateQueries(['categorias']) → setPagina(0); catch → msg.erroApi(e, form) */
  }
  const alternar = async (c: CategoriaResponse) => { /* useQuestion → PATCH inativar | ativar → invalidar */ }

  return (
    <TPage title="Categorias" breadcrumb={['Cadastros', 'Categorias']} coreografia="formulario"> {/* troca */}
      <TForm form={form} onSubmit={salvar} somenteLeitura={somenteLeitura}>
        <TRow><TEntry name="nome" label="Nome" required /></TRow>      {/* troca */}
        <TFormFooter>
          <TFormActionsLeft>
            <TButton variant="salvar" type="submit" loading={form.formState.isSubmitting} />
            <TButton variant="novo" onClick={limpar} />
          </TFormActionsLeft>
        </TFormFooter>
      </TForm>

      <TDataGrid … linhas={lista.data?.conteudo ?? []} acoes={somenteLeitura ? undefined : (c) => (<>
        <TButton variant="editar" label="" onClick={() => editar(c)} />
        <TButton variant={c.ativo ? 'inativar' : 'reativar'} label="" onClick={() => alternar(c)} />
      </>)} />
      <TDataGridFooter pagina={lista.data} onPaginaChange={setPagina} />
    </TPage>
  )
}
```

Sem filtro e sem auditoria. Situação só aparece na edição, e só se a API de
alterar recebe `ativo` (§0); senão, fica na grade. Várias tabelas de apoio do
mesmo assunto podem dividir uma tela por `TTabs`, cada aba um FormList.

### 4.4 Montagem e desmontagem em blocos

A coreografia não é opcional e não é a tela que a monta: o kit já é feito de
blocos (DIRECAO-VISUAL §6, `ero-web/src/motion/`).

- **A `TPage` é a `<Tela coreografia>`.** List usa `padrao`; Form e FormList,
  `formulario` (cascata curta na entrada, saída de uma vez). Os tempos ficam
  em `motion/tokens.ts`; nenhuma tela escreve duração ou curva.
- **Os blocos são os próprios componentes do kit**, na ordem do documento:
  cabeçalho da `TPage` (`PageHeader`) → cartão do `TForm` (`GlassCard`) →
  cada campo (`CampoForm`) → rodapé (`BarraAcoes`) → grade (`Tabela`, com as
  primeiras linhas em cascata) → rodapé da grade. Depois de
  `montagem.limiteBlocos` blocos, o resto entra junto.
- **A troca de rota é da casca:** a `RotaAnimada` espera a tela que sai se
  desmontar (de baixo para cima) antes de montar a próxima, e a tela que sai
  fica congelada com a URL antiga até sumir.
- **A opacidade anima no próprio cartão de vidro**, nunca num invólucro em
  volta (o `backdrop-filter` piscaria). Elemento solto que precisa entrar como
  bloco usa `<Bloco>`.
- **Movimento reduzido** (sistema ou contratante): sem cascata, cada bloco só
  esmaece.
- **A montagem não atrasa o uso:** o campo com `autoFocus` recebe o foco e
  aceita digitação assim que aparece.

O encaixe fino (como os campos entram dentro do cartão, o ritmo de uma grade
longa) é do `motion-designer`, na fase 0, e vale para todas as telas.

---

## 5. Label ao lado

Quando o plano pedir, a tela monta o label ao lado com o mesmo kit: em cada
`TRow`, uma `TCol width="rotulo" align="right"` com o texto, e uma `TCol` com o
campo `rotuloOculto` (o rótulo continua no DOM para leitor de tela).

```tsx
<TRow>
  <TCol width="rotulo" align="right"><TRotulo htmlFor="nome" required>Nome</TRotulo></TCol>
  <TCol><TEntry name="nome" id="nome" label="Nome" rotuloOculto required /></TCol>
</TRow>
```

- Todas as linhas da tela usam a mesma largura de rótulo (`rotulo` = 192 px;
  se o maior label não cabe, o plano define outra e diz por quê).
- No celular a coluna de rótulo empilha em cima do campo, alinhada à esquerda.
- Não misturar os dois estilos na mesma tela.

---

## 6. Modal

`TModal` com formulário segue as mesmas regras: `TForm`, `TRow`, larguras
padrão, rodapé de botões. Dentro dele, `metade` e `longo` são relativos à
coluna do modal. O modal já é a camada de vidro (`glass-flutuante`, fundo
escurecido sem desfoque): dentro dele o `TForm` não põe outro cartão de vidro
e o `TPanel` continua sem `backdrop-filter`.

---

## 7. Como se confere

O `guardiao-layout` reprova a tela que fugir deste documento; contraste,
teclado, foco e movimento reduzido continuam com o `revisor-ui`. Três passos,
com a skill `olhar-telas` (`.claude/skills/olhar-telas/`):

1. **Código** — a tela é um dos três modelos e difere dele só no que é
   `// troca`; só componentes do kit, importados de `design-system/kit`;
   nenhum `grid`, `col-span`, `w-*` ou `sm:w-*` na página; `width` só com
   token e só onde o padrão não serve; proporcional que divide a linha está em
   `TCol`; um campo por `TRow`, fora os grupos da §1; nenhuma cor, sombra,
   desfoque, duração ou curva literal.
2. **Medida** — o `medir-campos.mjs` mede cada campo a 1440 px e aponta campo
   curto mais largo que o limite, proporcional fora da fração e só leitura sem
   fundo próprio:

   ```bash
   MSYS_NO_PATHCONV=1 node .claude/skills/olhar-telas/medir-campos.mjs /admin/contratantes/novo
   ```
3. **Olho** — screenshots a 1440, 768 e 360 px, num login só, nos dois temas:
   disposição, linha dividida quebrando no tablet, nada espremido, sem rolagem
   horizontal, a montagem terminando no layout planejado.

   ```bash
   MSYS_NO_PATHCONV=1 node .claude/skills/olhar-telas/olhar.mjs /admin/contratantes/novo contratante --todas
   MSYS_NO_PATHCONV=1 node .claude/skills/olhar-telas/olhar.mjs /admin/contratantes/novo contratante-claro --tema claro
   ```

Os scripts entram sozinhos lendo o código de 6 dígitos no Mailpit; por isso o
stack tem de estar no modo Mailpit (`olhar-telas` §1). No modo Gmail eles se
recusam a entrar.

### 7.1 O que o kit expõe para o medidor

O `medir-campos.mjs` acha os campos do kit pelos atributos, sem adivinhar pelo
rótulo. **O kit tem de emitir**, no `div` de fora de cada campo (o mesmo que
recebe a classe de largura):

| Atributo | Valor | Em quem |
|---|---|---|
| `data-kit` | o nome do componente: `TEntry`, `TDate`, `TDateTime`, `TTextArea`, `TCombo`, `TDBCombo`, `TDBComboMulti`, `TCheckBox`, `TDBCheckBox`, `TRadio`, `TDBRadio`, `TCor` | todo campo |
| `data-largura` | o token **aplicado**: o `width` recebido ou o padrão do componente (§2.3); `celula` quando o campo está fora de uma `TRow` sem `width`; `conteudo` em caixa de marcar, rádio e cor | todo campo |
| `data-mascara` | a máscara do `TEntry` (`cpf`, `moeda`...) | `TEntry` com máscara |
| `data-rotulo-max` | caracteres do maior rótulo das opções (com o `vazio` e o " (inativo)"): até 18 o medidor espera `situacao`, até 36 `medio` (§2.1); é o mesmo número com que o `TCombo` escolhe a largura automática | `TCombo` |

E, para o medidor e o screenshot apontarem o culpado pelo nome:

- `data-kit` também em `TRow`, `TCol` (com `data-largura` quando há `width`),
  `TForm`, `TPanel`, `TFieldList` (com `data-linhas`, e cada linha com
  `data-linha="<índice>"`; o rádio Principal em `data-kit="TFieldList-principal"`),
  `TFormFooter`, `TDataGrid` e `TButton` (com `data-variante`);
- a folha impressa do `documento` da `TPage` dentro de `[data-kit="folha"]`;
- dentro do campo, um controle de verdade (`input`, `textarea`, `select` ou
  `[role="combobox"]`) ligado ao rótulo por `htmlFor`/`id` ou
  `aria-labelledby` — é por ele que o medidor e o `tres-vias.mjs` acham o campo
  pelo rótulo (rádio e grupo de caixas: o `role="radiogroup"`/`group` com
  `aria-labelledby` no `div` de fora, e o medidor usa o rótulo do grupo);
- o campo só leitura com `disabled`, `readOnly` ou `aria-readonly="true"` no
  controle, e o fundo no próprio controle (é ele que o medidor compara).

Quando a lista de componentes ou a escala mudar, o `CAMPOS_DO_KIT` e os
`LIMITES` do `medir-campos.mjs` mudam junto.

## 8. Checklist

- [ ] A tela é List, Form ou FormList e foi copiada do modelo
- [ ] Só componentes do kit, importados de `design-system/kit`; nenhum `grid`, `col-span` ou classe de largura na página
- [ ] `width` só com token da escala, e só onde o padrão do componente não serve
- [ ] Um campo por `TRow`; lado a lado só nos grupos da §1 ou onde o plano mandou
- [ ] Linha dividida: cada campo na sua `TCol`, com `longo`
- [ ] Label em cima (ou ao lado em toda a tela, se o plano pediu)
- [ ] Form: Situação (se a API recebe `ativo`), `TAuditoria` e rodapé Salvar · Novo · Voltar
- [ ] FormList: rodapé Salvar · Novo
- [ ] List: filtros com Buscar · Limpar · Novo · Exportar · Pdf; colunas na ordem da §4.1
- [ ] Mensagens por `useMessage`, confirmação por `useQuestion`; 400 e 409 com `erros` marcam o campo, 409 sem `erros` oferece Recarregar
- [ ] Edição manda a `version`; lista lê o `PaginaDto`
- [ ] Só leitura pelo `<GRUPO>_ESCREVER` do `/api/auth/eu`: sem Salvar, Novo, Inativar
- [ ] `TPage` com a coreografia do modelo; a tela monta e desmonta em blocos, e com movimento reduzido só esmaece
- [ ] Nenhuma cor, sombra, desfoque, duração ou curva literal na tela
- [ ] `medir-campos.mjs` sem `✗` a 1440 px
- [ ] 1440, 768 e 360 px sem rolagem horizontal e sem campo espremido, no tema escuro e no claro
