# Arquitetura Frontend — React 19 + TypeScript + Tailwind v4

> Leia antes de criar qualquer página, componente, formulário, grid ou integração
> com a API.
>
> Cores, fontes, espaçamentos e componentes visuais: [05-identidade-visual.md](05-identidade-visual.md).
>
> **Kit de telas, larguras, disposição e telas-modelo: [14-layout-de-telas.md](14-layout-de-telas.md).**
> Ele prevalece sobre este documento em tudo que é forma de tela, e sobre os
> `grid sm:grid-cols-N` que ainda sobram nos exemplos daqui.

---

## 1. Stack

React 19 · TypeScript · Vite · Tailwind v4 · react-router-dom v7 · axios ·
react-hook-form · zod · react-toastify · `@fontsource` · `vite-plugin-svgr`

Nada além disso sem justificativa no PR. Em particular: **sem** biblioteca de
componentes de terceiros (MUI, Ant, shadcn) — a biblioteca é interna; **sem**
Redux/Zustand/Jotai — Context API dá conta deste porte; **sem** React Query nesta
fase — as telas são Form/List simples e o `useState` + service resolve.

---

## 2. Estrutura

O que existe hoje, no esqueleto do EroErp:

```
src/
├── assets/
│   ├── brand/             logo-ero-horizontal.svg (menu) · logo-ero-simbolo.svg
│   │                      (menu recolhido) · logo-ero.svg (login,
│   │                      404) — vetor nas cores do tema ·
│   │                      logo-full.svg (marca em texto, só na folha impressa)
│   └── icons/index.tsx    ícones em SVG inline, num módulo único
├── components/
│   ├── common/            biblioteca interna T* — §4
│   ├── impressao/         Folha · DocumentoLista (folha impressa, doc 05 §8)
│   ├── layout/            Layout · Sidebar · TenantSwitcher · TProtected ·
│   │                      MarcaEro (o logo nas cores do tema — doc 05 §2)
│   ├── pessoa/            PessoaRapidaModal (cadastro rápido)
│   ├── tenant/            SeletorPaleta (TenantNovo e painel Aparência do TenantForm)
│   └── usuario/           RedefinirSenhaModal (senha nova, no UsuarioForm)
├── contexts/              AuthContext · ThemeContext
├── hooks/                 useAuth · useTheme · useDebounce
├── pages/
│   ├── auth/              Login
│   ├── Inicio.tsx         tela inicial, com atalhos
│   ├── pessoa/            PessoaList · PessoaForm
│   ├── usuario/           UsuarioList · UsuarioForm
│   ├── tenant/            TenantList · TenantNovo · TenantForm
│   ├── loginlog/          LoginLogList
│   ├── perfil/            Perfil
│   └── NaoEncontrado · NaoEncontradoPublico
├── routes/                AppRoutes.tsx
├── services/              api.ts · tokenStore.ts + um service por módulo
├── styles/                theme.css · paletas.ts
├── types/                 auth · comum · pessoa · usuario · tenant · loginlog · paleta
└── utils/                 format.ts · planilha.ts
```

Espelha os módulos do backend. Se existe `produto` lá, existe `pages/produto`,
`services/produtoService.ts` e `types/produto.ts` aqui. Os módulos do EroErp
antigo entram assim, um por vez.

---

## 3. Antes de escrever qualquer coisa

Ordem obrigatória:

1. Procurar **tela semelhante** já implementada
2. Procurar **componente semelhante** na biblioteca interna
3. Procurar **service semelhante**
4. Só então gerar código novo

A implementação nova deve parecer ter sido escrita junto com o resto do sistema.
Não inventar arquitetura alternativa quando já existe uma equivalente.

Tela de referência: **os modelos do [doc 14 §4](14-layout-de-telas.md)** (List,
Form, FormList). Para dados, permissão e serviço, `UsuarioList`/`UsuarioForm`
(filtros, combo do banco, coluna condicional, paginação, ação de linha) e, para
módulo de negócio com listas filhas, `PessoaList`/`PessoaForm` — mas a **forma**
delas é a de antes do kit e não se copia.

---

## 3.1 Ícones

SVG inline em `src/assets/icons/index.tsx`, num módulo único. **Nenhum
componente importa ícone de outro lugar** — trocar de família é mexer só ali.

Escolhi inline em vez de biblioteca por três razões: só embarca o que se usa,
não há risco de a dependência mudar de API, e o traço fica sob controle — 1.8
para casar com a direção delicada do doc 05. Todos usam `currentColor`, então
herdam a cor do texto nos dois temas.

```tsx
import { IconBusca } from '@/assets/icons'

<IconBusca className="size-4 text-txt-muted" />
```

---

## 4. Biblioteca interna

Componentes em `components/common/`. **Nunca** criar input, select, checkbox,
radio, grid, modal ou container de página novos quando já existe equivalente.

> **O kit de telas é o [doc 14 §3](14-layout-de-telas.md)** — `TForm`, `TRow`,
> `TCol`, `TDate`, `TDateTime`, `TCombo` (fixo), `TDBCombo` (banco), `TCheckBox`,
> `TDBCheckBox`, `TAuditoria`, `useMessage`, `useQuestion`, com nomes do EroErp
> antigo. Ele nasce na fase 0 do `/padronizar-layout`; até lá, a tabela abaixo
> descreve o **código de hoje**, e quem construir o kit a reescreve.

### Existe hoje

| Componente | Papel |
|---|---|
| `TPage` | container de tela: título, subtítulo, ações do topo; recebe o `documento` impresso |
| `TPanel` | agrupamento visual, com título opcional |
| `TEntry` | campo de texto/número, com rótulo, erro, ajuda, sufixo e `mascara` numérica |
| `TTextArea` | texto longo, com o mesmo rótulo e erro do `TEntry` |
| `TSelect` | `<select>` nativo, com opção "todos"/vazio |
| `TCombo` | select **com busca no servidor**, via `/select?nome=`; teclado e clique-fora |
| `TCheckBox` · `TRadio` | marcação e escolha única, rotuladas |
| `TDataGrid` | tabela no desktop, **cartões abaixo de `md`**; skeleton, estado vazio, ação de linha |
| `TDataGridFooter` | paginação e contagem |
| `TAcoesDeExportacao` | relatório e planilha da lista **inteira** do filtro, não da página aberta |
| `TButton` | `variant`: primary · secondary · danger · ghost; `size`; `loading` |
| `TBadge` | status com rótulo — `tom`: sucesso · alerta · neutro · info |
| `TModal` | janela modal |
| `TTabs` · `TTabPanel` | abas, com a faixa rolando sozinha no mobile |
| `TResult` · `TResultGroup` · `TResultTable` | resultado calculado no servidor: valor, unidade, classificação, referência e motivo da ausência (§7) |
| `TAviso` | faixa de aviso inline |
| `TBotaoImprimir` | dispara a impressão da `Folha` da tela |
| `TThemeToggle` | alterna claro/escuro |

Em `components/layout/`: `Layout` (header, faixa de impersonação, conteúdo),
`Sidebar` (fixa em `lg`, drawer abaixo), `TenantSwitcher` (só superadmin) e
`TProtected` (guarda de rota, com `roles` opcional).

**O menu recolhe.** A partir de `lg`, o botão ☰ do header (ou **Ctrl+B**)
alterna o menu entre expandido (248 px, `--spacing-sidebar`) e só ícones
(68 px, `--spacing-sidebar-min`); abaixo de `lg` o mesmo botão abre o drawer, e
**Esc** o fecha. A escolha fica no navegador (`localStorage`
`ero.menuRecolhido`, `hooks/useMenuRecolhido`). Os movimentos:

- a largura do `aside` e o recuo do conteúdo animam juntos, 300 ms `ease-out`
  — o conteúdo acompanha, não salta;
- rótulos e títulos de grupo **não saem do DOM**: somem por opacidade, e o
  título vira um filete; o ícone fica parado no centro dos 68 px, porque o
  padding do item é o mesmo nos dois estados;
- o logo horizontal cede lugar ao símbolo (`logo-ero-simbolo.svg`, o "e" do
  logo, mesmas cores);
- recolhido, passar o mouse ou o foco num item mostra a dica com o rótulo —
  por **portal** no `body`, porque o `nav` rola e o `aside` tem `translate`, e
  os dois prenderiam uma caixa posicionada dentro deles;
- o scrim do drawer entra e sai com fade; `prefers-reduced-motion` desliga tudo.

### O que muda com o kit

A primeira versão deste doc descartou `TRow`/`TForm` em favor de
`grid gap-4 sm:grid-cols-N` escrito em cada tela. Deu errado: cada tela
inventou o seu grid, campo curto esticou e nenhuma tela ficou igual à outra.
Decisão do Eduardo (2026-10-23): volta o kit do antigo — **[doc 14](14-layout-de-telas.md)**.
`TFieldList` (lista filha) faz parte do kit; `TDropdown` continua para quando a
fatia pedir.

### Escolha entre `TCombo` e `TDBCombo`

**`TCombo` para lista fixa e curta** (nível de acesso, situação, enum);
**`TDBCombo` quando a lista vem do banco** (cliente, pessoa, produto). Um
`<select>` com dezenas de clientes obriga a rolar procurando; o `TDBCombo` busca
no servidor com debounce, sem carregar tudo para filtrar no navegador. (Até a
fase 0, os nomes no código são `TSelect` e `TCombo`, nessa ordem.)

Todos com props tipadas, `forwardRef` quando o react-hook-form precisa, e estilo
só por tokens.

### Regras de estilo que já custaram bug

- **Token de tema, nunca cor fixa, em estado interativo.** `hover:bg-surface-alt`,
  não `hover:bg-brand-50`: a escala `brand-*` é fixa nos dois temas e ficaria clara
  sobre fundo escuro. Vale para `border-brand-300` também.
- **Botão cheio usa `text-txt-inverse`, nunca `text-white`.** No escuro a primária
  clareia, e branco sobre ela dá 3.28:1 — abaixo do mínimo AA. Ver doc 05.

---

## 5. Padrões de tela

Existem **três**, e toda tela é um deles: **List com filtros**, **Form** e
**FormList**. O esqueleto de cada um — componentes, ordem dos campos, botões,
auditoria — está no **[doc 14 §4](14-layout-de-telas.md)**, pronto para copiar.
Tela nova = copiar o modelo e trocar nomes, rota, service, campos, máscaras e
colunas.

- **List** (`/app/pessoas`) e **Form** (`/app/pessoas/nova`, `/app/pessoas/:id`)
  para as entidades principais: muitos registros, filtros, paginação.
- **FormList** para tabelas de apoio (grupos, categorias, marcas, tipos) — e só
  nelas.

O que faz a tela funcionar, além da forma:

- **`useCallback` + `useEffect(carregar, [carregar])`.** Uma função só de recarga,
  reaproveitada depois de uma ação de linha.
- **Filtro aplicado é estado próprio.** A lista consulta pelos filtros
  *aplicados* (Filtrar/Enter), não pelos digitados; filtrar e limpar fazem
  `setPagina(0)` — sem isso, filtrar na página 3 devolve página vazia.
- **`secundaria: true`** nas colunas que podem sumir primeiro no mobile.
- Toda rota de formulário (`/nova` e `/:id`) entra embrulhada em `PorRegistro`
  (`routes/AppRoutes.tsx`), que chaveia o componente pelo `id` da rota. Sem isso o
  React reaproveita a instância entre as duas rotas irmãs, e a tela "Nova pessoa"
  abre com os dados do registro aberto antes.

---

## 6. Formulários

Sempre **react-hook-form + zod**, por baixo do `TForm`. Nunca um `useState` por
campo.

```tsx
const pessoaSchema = z.object({
  nome:           z.string().min(1, 'Informe o nome').max(255),
  dataNascimento: z.string().optional(),
  cpf:            z.string().refine(isCpfValido, 'CPF inválido').optional().or(z.literal('')),
  limiteCredito:  z.coerce.number().min(0).max(1_000_000).optional(),
})
type Dados = z.infer<typeof pessoaSchema>

const form = useForm<Dados>({ resolver: zodResolver(pessoaSchema), defaultValues: VAZIO })

<TForm form={form} onSubmit={salvar} somenteLeitura={somenteLeitura}>
  <TRow><TEntry name="nome" label="Nome" required autoFocus /></TRow>
  <TRow><TDate name="dataNascimento" label="Data de nascimento" /></TRow>
  <TRow><TEntry name="cpf" label="CPF" mascara="cpf" /></TRow>
  <TRow><TEntry name="limiteCredito" label="Limite de crédito" mascara="moeda" /></TRow>
  …
</TForm>
```

O `TForm` entrega o `form` aos campos por `FormProvider`: cada campo pega
`register`, valor e erro **pelo `name`**, e os que não são `input` simples
(`TDBCombo`, `TDate`) usam `Controller` por dentro — a tela não escreve
`{...register('x')}` nem `error={errors.x?.message}`. O `<form>` é `noValidate`:
a validação é do zod, e a do navegador só atrapalharia com mensagens fora do
padrão visual.

A validação zod do front **espelha** a Bean Validation do backend, não a substitui.
O backend valida de novo, sempre — o front só evita ida e volta desnecessária.

---

## 7. Telas de cálculo

A regra mais importante deste documento.

**Nenhuma regra de cálculo de negócio é implementada em TypeScript** — preço,
imposto, desconto, comissão, total de pedido. O front envia as entradas, o
backend calcula, o front exibe. Duas implementações da mesma conta divergem — e
divergência aqui significa o valor da tela diferente do valor gravado, do
impresso e do faturado.

### Layout: abas autocontidas

Uma tela de cálculo acumula campos depressa — custos, impostos, margens,
resultados de várias contas. Empilhar tudo em painéis, um sob o outro, produz uma
tela longa em que o usuário digita em cima e procura o resultado lá embaixo.

O formato adotado é **em abas**, cada aba autocontida: poucas entradas e os
resultados **daquelas** entradas logo abaixo, no mesmo lugar em que se digitou.

> Dentro de cada aba, as entradas seguem o kit do doc 14 (`TRow`, `TCol`,
> larguras padrão). Os `grid sm:grid-cols-N` do exemplo abaixo são de antes do
> kit: valem a ideia das abas, não a forma das linhas.

```tsx
<TPage title="Formação de preço">

  {/* Identificação fica FORA das abas — não é entrada de cálculo */}
  <TPanel>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <TCombo label="Produto" … />
      <TCombo label="Tabela de preço" … />
      <TEntry label="Data" type="date" … />
    </div>
  </TPanel>

  <TTabs abas={ABAS} ativa={aba} onChange={setAba} />

  <TPanel>
    {aba === 'custos' && (
      <>
        {/* ENTRADAS */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <TEntry label="Custo de compra" suffix="R$" mascara="decimal" … />
          <TEntry label="Frete"           suffix="R$" mascara="decimal" … />
          <TEntry label="Margem"          suffix="%"  mascara="decimal" … />
          <TSelect label="Regime tributário" … />
        </div>

        <hr className="my-5 border-line" />

        {/* RESULTADOS — vindos do backend */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <TResult label="Custo total" valor={r?.custoTotal} unidade="R$" />
          <TResult label="Preço sugerido" valor={r?.precoSugerido} unidade="R$"
                   referencia="markup sobre o custo total" motivoAusencia={r?.motivoPreco} />
          <TResult label="Margem líquida" valor={r?.margemLiquida} unidade="%"
                   referencia="após impostos do regime" motivoAusencia={r?.motivoMargem} />
        </div>
      </>
    )}
  </TPanel>

  <p className="text-caption text-txt-muted">
    Cálculos recalculados automaticamente ao alterar os campos.
  </p>
</TPage>
```

Regras:

- **Uma entrada aparece em uma aba só.** Se duas abas precisam do mesmo campo, a
  divisão está errada — refaça o agrupamento, não duplique o campo.
- Se uma aba exibe um resultado que depende de entrada de **outra** aba, ela
  mostra essa dependência como referência somente-leitura. Um percentual sem o
  valor de referência ao lado é um número sem significado.
- Recálculo por **debounce de 500 ms** sobre as entradas válidas — não a cada
  tecla, não só no submit. **Sem botão "Calcular".** A nota de rodapé avisa que o
  recálculo é automático.
- Cada `TResult` mostra **valor + unidade + classificação + referência**. O
  usuário precisa saber de qual regra veio o número; um valor solto na tela não é
  auditável.
- Enquanto recalcula, o valor anterior fica visível com opacidade reduzida — nunca
  sumir ou piscar.
- Entrada faltando ou fora da faixa da regra: o resultado mostra "—" **e o
  motivo**, vindo do backend ("custo não informado", "regime sem alíquota
  cadastrada"). Traço mudo faz o usuário achar que o sistema falhou.
- Numa tela que recalcula sozinha, o **400 é estado do formulário**, não evento:
  a recusa de entrada aparece inline e some quando o campo fica válido. Mandá-la
  para o `toast` empilha um aviso a cada pausa da digitação.
- Toda entrada numérica usa a `mascara` do `TEntry` (`decimal`, `inteiro`,
  `decimalComSinal`), com `suffix` na unidade. Apagar tudo devolve vazio, não
  zero — senão um campo opcional limpo vira 0 e o cálculo devolve número em vez
  de dizer o que falta.
- No mobile, a faixa de abas rola horizontalmente — **só ela**, nunca a página.
  Dentro da aba, os campos empilham.

---

## 8. Serviços

Toda chamada HTTP passa por `services/api.ts`. **Nunca `fetch` direto.**

```ts
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',   // dev cai no proxy do Vite
  timeout: 30_000,
})

api.interceptors.request.use(config => {
  const token = tokenStore.getAccessToken()
  if (token && !ehRotaPublica(config.url)) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  r => r,
  async (erro: AxiosError<ErroResponse>) => {
    const original = erro.config as RequisicaoRepetivel | undefined

    if (erro.response?.status === 401 && original && !original._jaTentouRenovar &&
        !ehRotaPublica(original.url) && tokenStore.getRefreshToken()) {
      original._jaTentouRenovar = true
      try {
        const { accessToken } = await renovarSessao()
        original.headers.Authorization = `Bearer ${accessToken}`
        return api(original)
      } catch {
        tokenStore.clear()
        aoPerderSessao?.()            // o AuthContext navega para /login
      }
    }
    return Promise.reject(erro)
  },
)
```

### Uma renovação por vez, no aplicativo inteiro

O refresh é de **uso único com rotação**: reapresentar um token já consumido faz o
backend revogar a cadeia toda, tratando como roubo. Duas chamadas concorrentes com
o mesmo token derrubam a sessão do próprio usuário.

```ts
let renovacaoEmCurso: Promise<AuthResponse> | null = null

export function renovarSessao(): Promise<AuthResponse> {
  renovacaoEmCurso ??= executarRenovacao().finally(() => { renovacaoEmCurso = null })
  return renovacaoEmCurso
}
```

Interceptor e boot do `AuthContext` compartilham essa promessa. São dois cenários
reais, não hipóteses: várias requisições tomando 401 juntas, e o `StrictMode`, que
em desenvolvimento monta o efeito de boot **duas vezes** — as duas leriam o mesmo
token do `localStorage`. Foi assim que a troca de tenant passou a jogar o
superadmin na tela de login.

A renovação usa `axios.post` puro, e não a instância `api`: passar pelos
interceptores dela criaria recursão no 401.

**Redirecionar para o login é do `AuthContext`, não do `api.ts`.**
`window.location.assign` recarrega a aplicação e descarta o token em memória —
o callback registrado navega pelo router, sem reload.

Um service por módulo, tipado ponta a ponta:

```ts
export const pessoaService = {
  getAll: (params: PessoaFiltros & Paginacao) =>
    api.get<Page<PessoaResponse>>('/pessoas', { params }).then(r => r.data),

  findById: (id: string) =>
    api.get<PessoaResponse>(`/pessoas/${id}`).then(r => r.data),

  select: (nome?: string) =>
    api.get<SelectOption[]>('/pessoas/select', { params: { nome } }).then(r => r.data),

  create: (dto: PessoaCreate) =>
    api.post<PessoaResponse>('/pessoas', dto).then(r => r.data),

  update: (id: string, dto: PessoaUpdate) =>
    api.put<PessoaResponse>(`/pessoas/${id}`, dto).then(r => r.data),
}
```

### Tratamento de erro

Um helper único, usado em todo `catch`:

```ts
export function handleApiError(error: unknown): void {
  if (axios.isAxiosError<ErroResponse>(error)) {
    const status = error.response?.status
    if (status === 401) return                                   // o interceptor cuida
    if (status === 403) return toast.error('Você não tem permissão para esta ação')
    if (status === 404) return toast.error('Registro não encontrado')
    return toast.error(error.response?.data?.erro ?? 'Falha na comunicação com o servidor')
  }
  toast.error('Erro inesperado')
}
```

**Nunca `alert()`.** Com o kit, a tela fala por `useMessage()` (`sucesso`,
`erro`, `aviso`, `info`, `erroApi`) — doc 14 §3.3 —, e o `toast` e o
`handleApiError` ficam por baixo dele. Antes do kit, `toast.success` /
`toast.error` / `toast.warning` direto.

---

## 9. Autenticação e autorização visual

`AuthContext` guarda usuário, tenant, roles e o flag `impersonating`.
O access token fica **em memória**; o refresh token em `localStorage`
(chave `ero-refresh`).

A sessão é um objeto só, derivado do token — nunca montado a partir de campos
soltos vindos do formulário:

```ts
interface Sessao {
  usuarioId: string
  nome: string
  email: string
  role: Role                  // SUPERADMIN | ADMIN | USER
  tenantId: string
  tenantNome: string
  paleta: PaletaSistema       // paleta do tenant efetivo
  impersonating: boolean      // superadmin dentro de outro tenant
  permissoes: Permissoes      // { PESSOAS: 'ESCRITA' } — já resolvido pelo servidor
}
```

A paleta de cores é do **tenant**, e chega na resposta de autenticação (login,
refresh, troca e saída de tenant). `aplicar()` chama `definirPaleta` do
`ThemeContext` a cada sessão nova; o logout (`encerrar`) volta à `PADRAO`, e a
tela de login também a define ao abrir — sem sessão não há tenant. O
`ThemeContext` não consulta o servidor: o `ero-paleta` do `localStorage` existe
só para o F5 dentro do sistema não piscar a cor errada antes do refresh. Ver
[05 §11](05-identidade-visual.md).

`useAuth()` só devolve o contexto — quem decide é o `TProtected` e o próprio JSX,
comparando `sessao.role`. Com nível único não há cálculo de roles efetivas para
fazer:

```ts
export function useAuth() {
  const contexto = useContext(AuthContext)
  if (!contexto) throw new Error('useAuth precisa estar dentro de <AuthProvider>')
  return contexto
}
```

Rotas protegidas por `TProtected`, nunca com verificação dentro da página:

```tsx
<Route path="/app" element={<TProtected />}>
  <Route element={<Layout />}>
    <Route path="pessoas"     element={<PessoaList />} />
    <Route path="pessoas/:id" element={<PorRegistro><PessoaForm /></PorRegistro>} />

    <Route element={<TProtected roles={['SUPERADMIN']} />}>
      <Route path="tenants" element={<TenantList />} />
    </Route>
  </Route>
</Route>
```

### Permissão por tela e somente leitura

`useAuth().podeLer(tela)` e `podeEscrever(tela)` leem `sessao.permissoes`, que o
servidor manda já resolvido (ADMIN e SUPERADMIN vêm com tudo). O item de menu, o
atalho do Início e a rota levam a `tela`:

```tsx
<Route element={<TProtected tela="PESSOAS" />}>          {/* lista e registro */}
<Route element={<TProtected tela="PESSOAS" escrita />}>  {/* /nova */}
```

Na tela, `useSomenteLeitura(tela)`: quem só lê não vê Salvar, Novo, Inativar nem
os botões de acrescentar e remover linha — somem, não ficam cinza —, e o corpo
do formulário vai num `<fieldset disabled className="min-w-0 …">`, que trava todo
input nativo de uma vez (o `min-w-0` porque o fieldset nasce com
`min-width: min-content` e rolaria em 360 px). A cada 403 o `AuthContext` relê
`/usuarios/perfil/acesso`: se o superadmin mudou algo, menu e botões se acertam.

### O front não autoriza

Esconder um menu ou um botão é **conveniência visual**. A autorização real está no
`@PreAuthorize` do backend. Nunca supor que uma rota escondida está protegida.

```tsx
{sessao.role === 'SUPERADMIN' && <TButton onClick={novo}>Novo usuário</TButton>}
```

### Seletor de tenant e faixa de impersonação

No header, só para `SUPERADMIN`: um seletor alimentado por `/tenants/select` que
chama `switchTenant` e troca o access token.

> **Nunca recarregar a página ao trocar de tenant.** O access token vive em
> memória; um reload o descarta, o boot restaura a sessão pelo refresh token —
> que pertence ao tenant de origem — e o usuário volta de onde saiu. Não é
> preciso: o `AuthContext` já atualizou a sessão, e as listas refazem a consulta
> porque dependem de `sessao.tenantId`.

Quando `impersonating`, o `Layout` mostra a faixa no topo, em `--color-warning`:

> **Você está navegando como o tenant "Empresa X".** [Sair do tenant]

Sem essa faixa é fácil o superadmin agir no tenant errado achando que está no seu.

---

## 10. TypeScript

- **Zero `any`.** `unknown` + narrowing quando o tipo é realmente desconhecido.
- Um arquivo de tipos por módulo, espelhando os DTOs do backend:

```ts
export interface PessoaResponse {
  id: string
  nome: string
  dataNascimento: string | null      // ISO — converter só na exibição
  sexo: Sexo
  cpf: string | null
  limiteCredito: number | null
  ativo: boolean
  createdAt: string
}

export type PessoaCreate = Omit<PessoaResponse, 'id' | 'ativo' | 'createdAt'>
export type PessoaUpdate = PessoaCreate
```

- Enums do backend viram `enum` ou union de string literais, e os rótulos ficam
  num mapa único: `const SEXO_LABEL: Record<Sexo, string>`.
- Tipos genéricos compartilhados em `types/comum.ts`: `Page<T>`, `SelectOption`,
  `Paginacao`, `ErroResponse`.
- Data e hora trafegam como string ISO e são formatadas só na exibição
  (`utils/format.ts`). Nada de `Date` no estado. Data sem hora é **dia do
  calendário**: `formatarData` monta com `T00:00:00` (meia-noite local), e a data
  de hoje vem de `hojeIso()`, nunca de `toISOString()` — os dois atalhos leem UTC
  e erram um dia no Brasil.
- Valores numéricos de cálculo chegam como `number` do JSON, mas são **exibidos**
  com a casa decimal que o backend definiu — o front não arredonda por conta.

---

## 11. Estado e componentização

- `useState` / `useEffect` / `useMemo` / `useCallback` conforme a necessidade real.
  Sem `useMemo` decorativo.
- Nada de estado duplicado: se veio da API, tem uma fonte só.
- Extrair componente quando: aparece mais de uma vez, tem lógica reutilizável, ou
  passa de ~120 linhas.
- Lógica de negócio não mora em componente. Formatação vai para `utils/`,
  chamada de API para `services/`, estado compartilhado para `contexts/`.

---

## 12. Responsividade e acessibilidade

Funciona em desktop, tablet e mobile, sem quebrar:

| Faixa | Comportamento |
|---|---|
| ≥1024px | sidebar fixa, expandida ou só ícones à escolha do usuário ("O menu recolhe", acima); grid com todas as colunas |
| 768–1023px | sidebar em *drawer*, colunas secundárias ocultas |
| <768px | sidebar em *drawer*, grid vira lista de cartões, painel de resultado abaixo |

Acessibilidade: `<label>` associado a todo campo, `aria-invalid` e
`aria-describedby` no erro, foco visível (nunca `outline: none` sem substituto),
navegação completa por teclado, e nenhuma informação transmitida só por cor.

---

## 13. Tailwind

Tailwind é para **layout e espaçamento**. Cor, fonte e raio vêm dos tokens de
[05-identidade-visual.md](05-identidade-visual.md).

```tsx
// CERTO
<div className="flex items-center gap-3 rounded-md bg-surface p-4">

// ERRADO — hex solto
<div className="flex items-center gap-3 rounded-md bg-[#FFFFFF] p-4">
```

Classe utilitária repetida em três lugares vira componente ou `@apply` num
componente da biblioteca — não um quarto `className` copiado.

---

## 14. O que nunca fazer

- `fetch()` direto
- `alert()`
- `any` sem justificativa
- Criar input, select, grid ou modal quando já existe na biblioteca
- Implementar autenticação dentro de página
- **Reimplementar regra de cálculo de negócio em TypeScript**
- Hex de cor solto no JSX ou no CSS de componente
- Tela fora dos modelos List, Form ou FormList (doc 14 §4)
- `grid`, `col-span` ou classe de largura na página — largura é do kit (doc 14 §2)
- Ignorar tratamento de erro da API
- Estado de formulário grande em `useState` por campo
- Confiar em role do front para proteger dado
- Arredondar resultado de cálculo no front

---

## 15. Checklist de tela

- [ ] Copiada de um modelo do doc 14 §4 (List, Form ou FormList)
- [ ] Só componentes do kit; checklist do doc 14 §8
- [ ] react-hook-form + zod, por baixo do `TForm`
- [ ] Chamadas via `services/`, erro tratado com `handleApiError`
- [ ] Feedback por `useMessage` (antes do kit: `toast`)
- [ ] Tipagem completa, zero `any`
- [ ] Tokens de cor e tipografia respeitados, tema claro e escuro
- [ ] Foco de teclado visível, campos rotulados
- [ ] Funciona em desktop, tablet e mobile — e em 360 px sem rolagem horizontal
- [ ] Nenhuma regra de cálculo de negócio no front
- [ ] Menus e botões condicionados por `sessao.role` (conveniência, não segurança)
