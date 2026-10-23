# Kit de telas — componentes, larguras e telas-modelo

> Leia antes de criar ou mexer em qualquer tela: formulário, listagem com
> filtros, FormList ou modal. **Este documento prevalece sobre o
> [doc 04](04-arquitetura-frontend.md) em tudo que é forma de tela**: lá a forma
> de buscar dados, validar e salvar; aqui quais componentes montam a tela, onde
> cada campo fica e de que tamanho ele é.
>
> Quem decide o padrão é o Eduardo (decisões de 2026-10-23). O molde é o EroErp
> antigo (`C:\Users\Eduardo\Documents\GitHub\EroErp\ero\src\components`), que
> montava toda tela com o mesmo kit — ajuste **aqui**, nunca tela por tela.

---

## 0. Estado

> **O kit da §3 ainda não existe no código.** Ele nasce na fase 0 do
> `/padronizar-layout` (`.claude/skills/padronizar-layout/SKILL.md`), antes da
> primeira tela corrigida. Até lá, as telas do 2.0 usam `TSelect`/`TCombo` com os
> nomes de hoje e `grid sm:grid-cols-N` — e **tela nova não nasce antes do kit**
> sem o Eduardo decidir: o `dev-frontend` para e pergunta, para a tela não ser
> feita duas vezes.
>
> Quem constrói o kit atualiza esta seção para "existe" e a lista de
> `components/common/` no `CLAUDE.md`.

---

## 1. A ideia

No antigo, fazer uma tela era **copiar uma tela existente e trocar nomes,
rotas, máscaras e tipos**. Não tinha segredo: o campo já vinha com o tamanho
certo, a linha já sabia se dividir, o rodapé de botões, a auditoria e as
mensagens eram iguais em todas. O 2.0 perdeu isso — cada tela monta o seu
`grid`, escolhe as suas classes de largura e repete à mão spinner, faixa de
"só leitura" e rodapé.

O kit devolve o antigo, com o que o 2.0 tem de melhor por baixo
(react-hook-form + zod, tokens de tema, responsividade, permissão por tela).

**A regra de disposição:**

- **Campos um abaixo do outro**, um por `TRow`.
- **Lado a lado só** nos grupos naturais abaixo, ou quando a tela tem muitos
  campos e o plano manda dividir a linha (cada campo na sua `TCol`, com
  `width="longo"`):
  - CNH · Categoria · Validade
  - De · Até
  - Dia · Das · Às
  - CEP · Número · Complemento
  - Bairro · Cidade · UF
  - Valor · Unidade
  - Criado por · Criado em — Alterado por · Alterado em (o `TAuditoria` faz)
  - Cada linha de uma lista filha (`TFieldList`): Filial · Valor, Tipo ·
    Telefone, Tipo · E-mail — e o botão de remover no fim
- **Label em cima**, dentro do componente. Label ao lado (estilo do sistema PHP
  do Eduardo) só quando o plano pedir — §5.
- **Campo curto nunca estica.** CPF tem tamanho de CPF em qualquer linha.
- **Tudo responsivo** (regra 6): abaixo de `sm` (640 px) toda `TRow` empilha e
  todo campo ocupa 100 %; acima, a linha quebra sozinha quando as colunas não
  cabem no mínimo delas.

---

## 2. Larguras

Cada componente tem **largura padrão** (§2.3) e quase nunca precisa de `width`.
Quando precisa, passa-se **um nome da escala** — nunca `"50%"`, `"200px"` nem
classe Tailwind solta na tela.

### 2.1 Tokens fixos — o tamanho do dado

Valem a partir de `sm`. Levam `max-w-full` (nunca vazam da `TCol`) e o campo
fica encostado à esquerda da coluna.

| `width` | Para | Classe (sm+) | px |
|---|---|---|---|
| `uf` | UF, sigla de 2–3 letras | `sm:w-20` | 80 |
| `codigo` | código curto por tenant (serviço, produto), número do registro | `sm:w-32` | 128 |
| `hora` | hora | `sm:w-32` | 128 |
| `quantidade` | quantidade, percentual, inteiro pequeno | `sm:w-32` | 128 |
| `data` | data | `sm:w-40` | 160 |
| `cep` | CEP | `sm:w-40` | 160 |
| `valor` | dinheiro e decimal com sufixo | `sm:w-40` | 160 |
| `cpf` | CPF, telefone, celular | `sm:w-44` | 176 |
| `situacao` | `TCombo` curto: situação, sim/não, tipo com 2–5 opções | `sm:w-48` | 192 |
| `cnpj` | CNPJ, e o CPF/CNPJ que alterna | `sm:w-52` | 208 |
| `dataHora` | data e hora | `sm:w-56` | 224 |
| `curto` | texto curto livre: número do endereço, complemento, bairro, EAN | `sm:w-56` | 224 |
| `medio` | `TCombo` de enum com rótulos longos, cidade | `sm:w-80` | 320 |

### 2.2 Tokens proporcionais — como o percentual do antigo

São **relativos à `TCol` que contém o campo**, não à tela — exatamente como o
`width="50%"` do antigo.

| `width` | Ocupa | Classe (sm+) |
|---|---|---|
| `metade` | 50 % da coluna, mínimo 256 px | `sm:w-1/2 sm:min-w-64` |
| `longo` | 100 % da coluna, mínimo 256 px | `sm:w-full sm:min-w-64` |

- `metade` é o **padrão de texto livre sozinho na linha** (Nome, Descrição) — o
  `width="50%" minWidth="200px"` que o antigo usava 147 vezes.
- `longo` é para **dividir a linha**: dois ou três campos, cada um na sua `TCol`,
  cada um `longo` — a linha se divide ao meio ou em terços e os campos se
  ajustam sozinhos. Também para o campo que deve ocupar a linha inteira
  (observação, endereço completo).
- No tablet, quando as colunas não cabem no mínimo, a de sobra desce para a
  linha de baixo; no celular, tudo empilha.

Na dúvida entre duas, a menor — campo largo demais é o que destoa.

### 2.3 Largura padrão de cada componente

| Componente | Padrão |
|---|---|
| `TEntry` sem máscara | `metade` |
| `TEntry mascara="cpf"` · `"telefone"` · `"celular"` | `cpf` |
| `TEntry mascara="cnpj"` · `"cpfCnpj"` | `cnpj` |
| `TEntry mascara="cep"` | `cep` |
| `TEntry mascara="hora"` | `hora` |
| `TEntry mascara="moeda"` · `"decimal"` · `"decimalComSinal"` | `valor` |
| `TEntry mascara="inteiro"` | `quantidade` |
| `TDate` | `data` |
| `TDateTime` | `dataHora` |
| `TCombo` | `situacao` |
| `TDBCombo` · `TDBComboMulti` | `metade` |
| `TTextArea` | `longo` |
| `TCheckBox` · `TDBCheckBox` · `TRadio` · `TDBRadio` | o conteúdo |

`width` só aparece na tela quando o padrão não serve — e o plano diz por quê.

### 2.4 O mapa, num arquivo só

`components/common/larguras.ts`:

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
fora. A tabela da §2.1–§2.2 e este mapa mudam juntos.

---

## 3. O kit

Em `components/common/`, exportado por `index.ts`. **A tela só usa o kit**: nada
de `<input>`, `<select>`, `grid`, `col-span` ou classe de largura na página.

Nomes do EroErp antigo. Props em português, como o resto do 2.0.

### 3.1 Estrutura

| Componente | Props | O que faz |
|---|---|---|
| `TPage` | `title`, `breadcrumb?: string[]`, `subtitle?`, `actions?`, `documento?`, `carregando?` | Container de tela. `breadcrumb` em texto acima do título (`Cadastros › Produtos`). `carregando` mostra o spinner — a tela não monta spinner. |
| `TForm` | `form` (o retorno do `useForm`), `onSubmit`, `somenteLeitura?`, `children` | `FormProvider` + `<form noValidate>` + cartão. Com `somenteLeitura`, faz o `fieldset disabled`, mostra a faixa "acesso só de leitura" e esconde os botões de escrita (§3.4). |
| `TFormFooter` · `TFormActionsLeft` · `TFormActionsRight` | `children` | Rodapé do cartão, com borda no topo. Empilha no celular com o botão principal embaixo. |
| `TRow` | `children` | Uma linha: `flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start`. |
| `TCol` | `width?: 'auto' \| 'rotulo' \| Largura`, `align?: 'left' \| 'right'` | Coluna da linha. **Sem `width`, divide a linha em partes iguais** (`sm:flex-1 sm:min-w-0 sm:basis-64`) — como no antigo, CNH · Categoria · Validade ficam um em cada terço. `auto` encolhe até o campo, para curtos ficarem colados. `rotulo` (`sm:w-48`, 192 px) é a coluna de labels do estilo PHP (§5). |
| `TPanel` | `title?`, `recolhido?`, `actions?` | Seção por assunto (Pessoa física, Endereços…), recolhível pelo título. |
| `TModal` | `aberto`, `titulo`, `onFechar`, `acoes?`, `largura?` | Janela; nunca passa de `calc(100vw - 2rem)`. |
| `TTabs` · `TTabPanel` | como hoje | Abas, quando o formulário é grande demais para painéis. |

Campo **sem `TCol`** vai direto na `TRow` quando está sozinho na linha. Campo
proporcional (`metade`, `longo`) que **divide** a linha vai sempre numa `TCol` —
é ela que dá a proporção.

### 3.2 Campos

Todos têm `name` e `label`; dentro de `TForm` pegam `register`, valor e erro
**só pelo `name`** (`useFormContext`), e o `required` põe o `*` no rótulo. Fora
de `TForm` (modal simples, filtro de cabeçalho) aceitam `value`/`onChange`.
Todos têm `width?`, `ajuda?`, `disabled?`, `rotuloOculto?`.

| Componente | Props próprias | O que faz |
|---|---|---|
| `TEntry` | `mascara?`, `casas?`, `suffix?`, `type?` | Texto. Máscaras: `cpf`, `cnpj`, `cpfCnpj`, `telefone`, `celular`, `cep`, `hora`, `moeda`, `decimal`, `inteiro`, `decimalComSinal`. **Exibe formatado, grava cru** (CPF só dígitos, moeda número) — reaproveitando `utils/format.ts` (`mascararCpf`, `mascararCnpj`, `mascararCep`, `mascararTelefone`, `paraNumero`, `textoDaMascara`). A tela nunca chama máscara no `onChange`. |
| `TDate` | — | Data com calendário em pt-BR e botão de limpar. Grava `AAAA-MM-DD`; monta com `T00:00:00` para exibir; valor inicial `hojeIso()` quando o form pede hoje. |
| `TDateTime` | `passoMinutos?` (padrão 5) | Data e hora; grava `AAAA-MM-DDTHH:mm`. |
| `TTextArea` | `linhas?`, `maxLength?` | Texto longo; mostra "máx. N caracteres". |
| `TCombo` | `opcoes: {valor, rotulo}[]`, `vazio?` | **Opções fixas** — situação, tipo, enum. `vazio` é a opção "Todos"/"Selecione…". (Hoje se chama `TSelect`.) |
| `TDBCombo` | `buscar(termo)`, `rotuloInicial?`, `vazio?` | **Opções do banco**, com busca no servidor (`/select?nome=`, debounce 300 ms) e o rótulo do valor salvo. (Hoje se chama `TCombo`.) |
| `TDBComboMulti` | `buscar`, `excluir?`, `maximo?` | Vários do banco. (Hoje `TComboMulti`.) |
| `TCheckBox` | `opcoes?` | Sem `opcoes`, um booleano com o rótulo ao lado; com `opcoes`, um grupo fixo que grava a lista dos marcados. |
| `TDBCheckBox` | `buscar()`, `vertical?`, `altura?` | Grupo vindo do banco (tipos de cadastro, módulos). |
| `TRadio` | `opcoes`, `vertical?` | Escolha única fixa. |
| `TDBRadio` | `buscar()`, `vertical?` | Escolha única vinda do banco. |
| `TFieldList` | `name`, `colunas: {name, componente, width?}[]`, `novaLinha`, `minimo?`, `rotuloAdicionar?` | **Lista filha editável** dentro do formulário, como no antigo (e-mails, telefones, valores por filial): `useFieldArray` por baixo, uma `TRow` por linha com os campos nas suas larguras padrão e o remover no fim, botão Acrescentar no rodapé. No celular cada linha empilha. A tela não monta `<ul>`/`grid` de linhas. |
| `TRotulo` | `htmlFor`, `required?` | Só o rótulo, para a coluna de labels do estilo PHP (§5). |
| `TAuditoria` | `registro` | Só na edição, no fim do formulário: Criado por · Criado em, Alterado por · Alterado em, só leitura. Lê `criadoPorNome`, `createdAt`, `alteradoPorNome`, `updatedAt` do `ResponseDto`. Linha sem dado não aparece. |

### 3.3 Mensagens e confirmação

| Hook | Uso |
|---|---|
| `useMessage()` | `sucesso(texto)`, `erro(texto)`, `aviso(texto)`, `info(texto)`, e `erroApi(e)` (que é o `handleApiError`). O `react-toastify` fica por baixo; **a tela não importa `toast`**. Sucesso some sozinho; erro fica até fechar. |
| `useQuestion()` | `await confirmar({ mensagem, confirmar: 'Inativar', variante: 'inativar' })` → `true`/`false`. Para inativar, reativar, excluir. |

Exceção que continua valendo: numa superfície que recalcula sozinha, 400 é
estado inline, não mensagem (CLAUDE.md, "Nesta tela um 400 pode ser estado").

### 3.4 Botões e grade

| Componente | Props | O que faz |
|---|---|---|
| `TButton` | `variant`, `label`, `loading?`, `size?`, `type?` | Variantes de ação **com ícone e cor prontos**: `salvar`, `novo`, `filtrar`, `limpar`, `voltar`, `editar`, `inativar`, `reativar`; e as genéricas `primary`, `secondary`, `ghost`, `danger`. Cores por token de tema, nunca hex. Dentro de `TForm somenteLeitura`, `salvar`, `novo`, `inativar` e `reativar` **não aparecem**. `label=""` deixa só o ícone (grade). |
| `TDataGrid` | como hoje, com `acoes(linha)` | Ações na **primeira coluna**, como no antigo. Vira cartões abaixo de `md`. |
| `TDataGridFooter` | `pagina`, `onPaginaChange` | "Exibindo X–Y de N registros" e a paginação. |
| `TAcoesDeExportacao` · `TBotaoImprimir` | como hoje | Vão no `actions` da `TPage`. |

### 3.5 Renomeação (fase 0)

| Hoje | No kit |
|---|---|
| `TSelect` | `TCombo` |
| `TCombo` | `TDBCombo` |
| `TComboMulti` | `TDBComboMulti` |
| `TEntry type="date"` | `TDate` |
| `TEntry type="datetime-local"` | `TDateTime` |
| `mascararCpf(...)` etc. no `onChange` | `TEntry mascara="cpf"` |
| `toast.*` + `handleApiError` | `useMessage()` |
| spinner, faixa de só leitura, `fieldset`, rodapé à mão | `TPage carregando`, `TForm somenteLeitura`, `TFormFooter` |

A renomeação dos componentes é mecânica, num commit próprio, com build e lint
verdes antes de mexer em qualquer tela.

---

## 4. Telas-modelo

Três modelos. **Toda tela é um dos três.** Tela nova = copiar o modelo (ou a
tela pronta mais parecida que já o segue) e trocar o que está marcado
`// troca`. Se a tela não cabe em nenhum, **pare e pergunte** ao Eduardo.

### 4.1 List com filtros (`/app/produtos`)

Filtros num `TForm` com **botões, como no antigo**: Filtrar (ou Enter), Limpar,
Novo. A consulta só roda ao filtrar, ao trocar de página ou ao limpar — menos
requisições, o que importa quando a tabela cresce.

```tsx
const FILTROS_VAZIOS: Filtros = { codigo: '', nome: '', grupoId: '', ativo: 'true' } // troca

export function ProdutoList() {                                        // troca
  const navigate = useNavigate()
  const somenteLeitura = useSomenteLeitura(Tela.PRODUTOS)              // troca
  const msg = useMessage()
  const { confirmar } = useQuestion()
  const form = useForm<Filtros>({ defaultValues: FILTROS_VAZIOS })
  const [aplicados, setAplicados] = useState(FILTROS_VAZIOS)
  const [pagina, setPagina] = useState(0)
  const [dados, setDados] = useState<Page<ProdutoResponse>>()          // troca
  const [carregando, setCarregando] = useState(true)

  const carregar = useCallback(() => {
    setCarregando(true)
    produtoService.getAll({ ...paraConsulta(aplicados), page: pagina }) // troca
      .then(setDados).catch(msg.erroApi).finally(() => setCarregando(false))
  }, [aplicados, pagina])
  useEffect(carregar, [carregar])

  const filtrar = (f: Filtros) => { setAplicados(f); setPagina(0) }
  const limpar = () => { form.reset(FILTROS_VAZIOS); filtrar(FILTROS_VAZIOS) }

  const alternar = async (p: ProdutoResponse) => {                     // troca
    if (!(await confirmar({ mensagem: `${p.ativo ? 'Inativar' : 'Reativar'} ${p.nome}?`,
      variante: p.ativo ? 'inativar' : 'reativar' }))) return
    await produtoService.alterarAtivo(p.id, !p.ativo).catch(msg.erroApi)
    carregar()
  }

  const colunas: Coluna<ProdutoResponse>[] = [ /* código · nome · … · situação */ ] // troca

  return (
    <TPage title="Produtos" breadcrumb={['Cadastros', 'Produtos']}    // troca
           actions={<TAcoesDeExportacao … />} documento={…}>
      <TForm form={form} onSubmit={filtrar}>
        <TRow><TEntry name="codigo" label="Código" width="codigo" /></TRow>
        <TRow><TEntry name="nome" label="Nome" /></TRow>
        <TRow><TDBCombo name="grupoId" label="Grupo" buscar={grupoService.select} vazio="Todos" /></TRow>
        <TRow><TCombo name="ativo" label="Situação" opcoes={SITUACAO_OPCOES} vazio="Todas" /></TRow>
        <TFormFooter>
          <TFormActionsLeft>
            <TButton variant="filtrar" type="submit" />
            <TButton variant="limpar" onClick={limpar} />
            {!somenteLeitura && <TButton variant="novo" onClick={() => navigate('/app/produtos/novo')} />}
          </TFormActionsLeft>
        </TFormFooter>
      </TForm>

      <TDataGrid colunas={colunas} linhas={dados?.content ?? []} chaveDe={(p) => p.id}
        carregando={carregando} onLinhaClick={(p) => navigate(`/app/produtos/${p.id}`)}
        acoes={somenteLeitura ? undefined : (p) => (<>
          <TButton variant="editar" label="" onClick={() => navigate(`/app/produtos/${p.id}`)} />
          <TButton variant={p.ativo ? 'inativar' : 'reativar'} label="" onClick={() => alternar(p)} />
        </>)}
        vazioTitulo="Nenhum produto encontrado" vazioDescricao="Ajuste os filtros ou cadastre o primeiro." />
      <TDataGridFooter pagina={dados} onPaginaChange={setPagina} />
    </TPage>
  )
}
```

- Ordem dos filtros: código → nome (principal) → combos → período De · Até (uma
  `TRow`, cada um na sua `TCol width="auto"`).
- Ordem das colunas: código · principal · demais textos · datas · valores
  (`numerica`) · situação (`TBadge`) por último. Código, data, valor e situação
  com `className: 'w-px whitespace-nowrap'`; a principal leva a sobra;
  `secundaria: true` nas que podem sumir em tela média, nunca na principal.
- A exportação repete os **filtros aplicados**, não os digitados e não filtrados.

### 4.2 Form (`/app/produtos/novo`, `/app/produtos/:id`)

```tsx
export function ProdutoForm() {                                        // troca
  const { id } = useParams()
  const navigate = useNavigate()
  const somenteLeitura = useSomenteLeitura(Tela.PRODUTOS)              // troca
  const msg = useMessage()
  const form = useForm<Dados>({ resolver: zodResolver(schema), defaultValues: VAZIO }) // troca
  const [salvo, setSalvo] = useState<ProdutoResponse>()                // troca
  const [carregando, setCarregando] = useState(!!id)

  useEffect(() => {
    if (!id) return
    produtoService.findById(id)                                        // troca
      .then((p) => { setSalvo(p); form.reset(paraForm(p)) })
      .catch(msg.erroApi).finally(() => setCarregando(false))
  }, [id])

  const salvar = async (d: Dados) => {
    try {
      const p = id ? await produtoService.update(id, paraCorpo(d)) : await produtoService.create(paraCorpo(d))
      msg.sucesso('Produto salvo')                                     // troca
      navigate(`/app/produtos/${p.id}`)
    } catch (e) { msg.erroApi(e) }
  }

  return (
    <TPage title={id ? 'Editar produto' : 'Novo produto'}              // troca
           breadcrumb={['Cadastros', 'Produtos', id ? 'Editar' : 'Novo']} carregando={carregando}>
      <TForm form={form} onSubmit={salvar} somenteLeitura={somenteLeitura}>
        <TRow><TEntry name="codigo" label="Código" width="codigo" disabled /></TRow>
        <TRow><TEntry name="nome" label="Nome" required autoFocus /></TRow>
        <TRow><TEntry name="ean" label="EAN" width="curto" /></TRow>
        <TRow><TDBCombo name="grupoId" label="Grupo" buscar={grupoService.select} /></TRow>
        <TRow><TEntry name="custo" label="Custo" mascara="moeda" /></TRow>

        <TPanel title="Observações">
          <TRow><TTextArea name="observacao" label="Observação" /></TRow>
        </TPanel>

        <TRow><TCombo name="ativo" label="Situação" opcoes={SITUACAO_OPCOES} /></TRow>
        <TAuditoria registro={salvo} />

        <TFormFooter>
          <TFormActionsLeft>
            <TButton variant="voltar" onClick={() => navigate('/app/produtos')} />
            <TButton variant="novo" onClick={() => navigate('/app/produtos/novo')} />
          </TFormActionsLeft>
          <TFormActionsRight>
            <TButton variant="salvar" type="submit" loading={form.formState.isSubmitting} />
          </TFormActionsRight>
        </TFormFooter>
      </TForm>
    </TPage>
  )
}
```

Ordem fixa:

1. Código (só leitura), quando a entidade tem.
2. Campo principal (nome, descrição), depois os demais — **um por linha**.
3. `TPanel` por assunto, na ordem em que se preenche (Pessoa física, Pessoa
   jurídica, Contatos, Endereços, Observações). Painel de um campo só se junta
   ao vizinho.
4. Situação.
5. `TAuditoria`.
6. Rodapé: Voltar · Novo à esquerda, Salvar à direita. Ação que não é salvar
   (Redefinir senha, Conectar) vai num `TPanel` próprio, abaixo do formulário.

A rota passa por `PorRegistro` (CLAUDE.md, "Rota `/nova` e rota `/:id`").
Formulário grande demais para painéis usa `TTabs`; dentro de cada aba, as
mesmas regras.

### 4.3 FormList (tabelas de apoio)

Formulário em cima, grade embaixo, na mesma tela — grupos, subgrupos,
categorias, marcas, tipos. É o modelo que mais se copia: entre duas telas
FormList só mudam o nome, o service e os campos.

```tsx
export function CategoriaFormList() {                                  // troca
  const somenteLeitura = useSomenteLeitura(Tela.AUXILIARES_PRODUTO)    // troca
  const msg = useMessage()
  const { confirmar } = useQuestion()
  const form = useForm<Dados>({ resolver: zodResolver(schema), defaultValues: VAZIO }) // troca
  const [editando, setEditando] = useState<string>()
  const [pagina, setPagina] = useState(0)
  const [dados, setDados] = useState<Page<AuxiliarResponse>>()         // troca
  const [carregando, setCarregando] = useState(true)

  const carregar = useCallback(() => { /* categoriaService.getAll({ page: pagina }) */ }, [pagina]) // troca
  useEffect(carregar, [carregar])

  const limpar = () => { setEditando(undefined); form.reset(VAZIO) }
  const editar = (c: AuxiliarResponse) => {
    setEditando(c.id); form.reset(paraForm(c)); window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const salvar = async (d: Dados) => { /* create ou update → msg.sucesso → limpar → setPagina(0) → carregar */ }

  return (
    <TPage title="Categorias de produto" breadcrumb={['Cadastros', 'Auxiliar produto', 'Categorias']}> {/* troca */}
      <TForm form={form} onSubmit={salvar} somenteLeitura={somenteLeitura}>
        <TRow><TEntry name="nome" label="Nome" required /></TRow>      {/* troca */}
        {editando && <TRow><TCombo name="ativo" label="Situação" opcoes={SITUACAO_OPCOES} /></TRow>}
        <TFormFooter>
          <TFormActionsLeft>
            <TButton variant="limpar" onClick={limpar} />
            <TButton variant="salvar" type="submit" loading={form.formState.isSubmitting} />
          </TFormActionsLeft>
        </TFormFooter>
      </TForm>

      <TDataGrid … acoes={somenteLeitura ? undefined : (c) => (<>
        <TButton variant="editar" label="" onClick={() => editar(c)} />
        <TButton variant={c.ativo ? 'inativar' : 'reativar'} label="" onClick={() => alternar(c)} />
      </>)} />
      <TDataGridFooter pagina={dados} onPaginaChange={setPagina} />
    </TPage>
  )
}
```

Sem filtro e sem auditoria. Situação só aparece na edição. Várias tabelas de
apoio do mesmo assunto podem dividir uma tela por `TTabs` (como
`AuxiliaresProduto`), cada aba um FormList.

---

## 5. Label ao lado (estilo PHP)

Quando o plano pedir, a tela monta o label ao lado com o mesmo kit: em cada
`TRow`, uma `TCol width="rotulo" align="right"` com o texto, e uma `TCol` com o
campo `rotuloOculto` (o rótulo continua no DOM para leitor de tela).

```tsx
<TRow>
  <TCol width="rotulo" align="right"><TRotulo htmlFor="nome" required>Nome</TRotulo></TCol>
  <TCol><TEntry name="nome" label="Nome" rotuloOculto required /></TCol>
</TRow>
```

- Todas as linhas da tela usam a mesma largura de rótulo (`rotulo` = 192 px; se
  o maior label não cabe, o plano define outra e diz por quê).
- No celular a coluna de rótulo empilha em cima do campo, alinhada à esquerda.
- Não misturar os dois estilos na mesma tela.

---

## 6. Modal

`TModal` com formulário segue as mesmas regras: `TForm`, `TRow`, larguras
padrão, rodapé de botões. Dentro dele, `metade` e `longo` são relativos à
coluna do modal.

---

## 7. Como se confere

O `guardiao-layout` reprova a tela que fugir deste documento. Três passos:

1. **Código** — a tela é um dos três modelos e difere dele só no que é
   `// troca`; só componentes do kit; nenhum `grid`, `col-span`, `w-*` ou
   `sm:w-*` na página; `width` só com token e só onde o padrão não serve;
   proporcional que divide a linha está em `TCol`; um campo por `TRow`, fora os
   grupos da §1.
2. **Medida** — o `medir-campos.mjs` mede cada campo a 1440 px e aponta data,
   hora, valor, CPF, CEP, UF e combo curto mais largos que o limite:

   ```bash
   MSYS_NO_PATHCONV=1 node .claude/skills/olhar-telas/medir-campos.mjs /app/produtos/novo
   ```
3. **Olho** — screenshots a 1440, 768 e 360 px: disposição, linha dividida
   quebrando no tablet, nada espremido, sem rolagem horizontal.

## 8. Checklist

- [ ] A tela é List, Form ou FormList e foi copiada do modelo
- [ ] Só componentes do kit; nenhum `grid`, `col-span` ou classe de largura na página
- [ ] `width` só com token da escala, e só onde o padrão do componente não serve
- [ ] Um campo por `TRow`; lado a lado só nos grupos da §1 ou onde o plano mandou
- [ ] Linha dividida: cada campo na sua `TCol`, com `longo`
- [ ] Label em cima (ou ao lado em toda a tela, se o plano pediu)
- [ ] Form: Situação, `TAuditoria` e rodapé Voltar · Novo | Salvar
- [ ] List: filtros com Filtrar · Limpar · Novo; colunas na ordem da §4.1
- [ ] Mensagens por `useMessage`, confirmação por `useQuestion`
- [ ] `medir-campos.mjs` sem violação a 1440 px
- [ ] 768 px e 360 px sem rolagem horizontal e sem campo espremido
