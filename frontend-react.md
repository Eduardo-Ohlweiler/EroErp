# Skill: Frontend — React + TypeScript (EroERP)

Use esta skill em todo código frontend do EroERP.

Leia esta skill antes de criar qualquer página, componente, formulário, grid ou integração com API.

---

# Stack Oficial

* React 19
* TypeScript
* React Router DOM
* Axios
* React Hook Form
* React Toastify
* TailwindCSS
* Biblioteca interna de componentes

---

# Biblioteca Interna (Obrigatória)

O projeto possui uma biblioteca própria de componentes.

Antes de criar qualquer componente novo, verificar se já existe um equivalente em:

```text
src/components
```

Priorizar reutilização.

---

# Componentes Disponíveis

Utilizar preferencialmente:

```text
TButton
TCheckBox
TColor
TCombo
TDataGrid
TDataGridFooter
TDate
TDateTime
TDbCheckBox
TDbCombo
TDbRadio
TDropdown
TEntry
TFieldList
TForm
TPage
TPanel
TRadio
TRow
TSpace
TText
TUniqueSearch
TWindow
```

---

# O Que Não Fazer

Não criar novos:

* Inputs
* Selects
* Checkboxes
* Radios
* DataGrids
* Modais
* Containers de Página

quando existir componente equivalente na biblioteca.

---

# Estrutura de Páginas

Organizar páginas por módulo.

Exemplo:

```text
pages

├── cadastro
│   ├── pessoa
│   │   ├── PessoaForm.tsx
│   │   └── PessoaList.tsx
│
├── estoque
│   ├── produto
│   │   ├── ProdutoForm.tsx
│   │   └── ProdutoList.tsx
│
├── auxiliar
│   ├── tipotelefone
│   ├── tipopessoa
│   └── tipoendereco
```

---

# Padrões de Tela

Existem apenas dois padrões principais.

# Consulta Obrigatória ao Projeto

Antes de criar qualquer código novo, analisar a estrutura existente do projeto.

Sempre procurar exemplos semelhantes já implementados.

Ordem obrigatória:

1. Procurar tela semelhante já existente
2. Procurar componente semelhante já existente
3. Procurar service semelhante já existente
4. Procurar integração semelhante já existente
5. Somente então gerar novo código

Exemplos de referência:

Cadastros:

- PessoaForm
- ProdutoForm
- EstoqueForm

Listagens:

- PessoaList
- ProdutoList
- EstoqueList

Cadastros auxiliares:

- TipoTelefone
- TipoPessoa
- TipoEndereco

Sempre reutilizar o padrão já existente.

Nunca inventar uma nova arquitetura quando já existir uma implementação semelhante no projeto.

---

# Regra de Consistência

Ao implementar uma nova funcionalidade:

- Procurar o módulo mais parecido existente
- Seguir a mesma estrutura
- Seguir a mesma nomenclatura
- Seguir os mesmos componentes
- Seguir o mesmo padrão visual

A implementação nova deve parecer ter sido escrita junto com o restante do sistema.

Evitar criar padrões alternativos.

# Padrão Form/List

Utilizado para entidades principais.

Exemplos:

```text
PessoaForm
PessoaList

ProdutoForm
ProdutoList

EstoqueForm
EstoqueList
```

Características:

* Tela de listagem separada
* Tela de cadastro separada
* Muitos registros
* Pesquisa
* Paginação
* Navegação entre telas

---

# Padrão FormList

Utilizado para entidades auxiliares.

Exemplos:

```text
TipoTelefone
TipoPessoa
TipoEndereco
TipoContato
```

Características:

* Poucos registros
* Formulário e grid na mesma tela
* Sem tela de listagem separada
* CRUD simples

Sempre utilizar este padrão para tabelas auxiliares.

---

# Estrutura de Formulários

Todo formulário deve utilizar:

```text
react-hook-form
```

Exemplo:

```tsx
const {
  register,
  handleSubmit,
  reset,
  setValue,
  watch
} = useForm<FormData>()
```

---

# O Que Não Fazer

Evitar:

```tsx
const [descricao, setDescricao] = useState("")
const [ativo, setAtivo] = useState(true)
const [valor, setValor] = useState(0)
```

para formulários grandes.

Preferir React Hook Form.

---

# Integração com API

Sempre utilizar:

```text
services/api.ts
```

Nunca utilizar:

```javascript
fetch(...)
```

Preferir:

```typescript
api.get(...)
api.post(...)
api.put(...)
api.delete(...)
```

---

# Tratamento de Erros

Sempre tratar erros de API.

Exemplo:

```typescript
try {

} catch (error) {

  if (axios.isAxiosError(error)) {
    toast.error(error.response?.data?.message)
  }

}
```

---

# Mensagens ao Usuário

Nunca utilizar:

```javascript
alert()
```

Sempre utilizar:

```typescript
toast.success(...)
toast.error(...)
toast.warning(...)
toast.info(...)
```

---

# Rotas

Toda rota protegida deve utilizar:

```text
TProtected.tsx
```

Nunca implementar validação de autenticação diretamente na página.

---

# Layout

Toda página deve utilizar:

```text
Layout.tsx
```

como container principal.

---

# TPage

Toda tela deve iniciar com:

```tsx
<TPage>
```

salvo exceções justificadas.

---

# TPanel

Utilizar para agrupamento visual de informações.

Exemplo:

```tsx
<TPanel title="Dados Gerais">
    ...
</TPanel>
```

---

# DataGrid

Listagens devem utilizar:

```tsx
<TDataGrid />
```

e

```tsx
<TDataGridFooter />
```

quando aplicável.

---

# Pesquisa

Listagens devem possuir:

* Pesquisa
* Filtros
* Paginação

quando a quantidade de registros justificar.

---

# Componentização

Extrair componentes quando:

* Existirem mais de uma vez
* Possuírem lógica reutilizável
* Possuírem mais de 100 linhas de código

---

# Estado

Utilizar:

* useState
* useEffect
* useMemo
* useCallback

quando necessário.

Evitar estados duplicados.

---

# Tipagem

Nunca utilizar:

```typescript
any
```

salvo exceções justificadas.

Sempre criar interfaces ou types.

Exemplo:

```typescript
export interface Produto {
  id: number
  descricao: string
}
```

---

# Consumo de API

Criar tipos específicos.

Exemplo:

```typescript
export interface ProdutoResponse {
  id: number
  descricao: string
}
```

---

# Organização

Separar:

```text
types
services
hooks
contexts
pages
components
```

conforme padrão do projeto.

---

# Autenticação

Toda autenticação deve utilizar:

* Context API existente
* TProtected

Nunca criar novo mecanismo de autenticação.

---

# Hooks

Sempre verificar se já existe hook antes de criar novo.

Exemplos:

```text
useAuth
useMessage
```

---

# Responsividade

Toda nova tela deve funcionar:

* Desktop
* Tablet
* Mobile

Sem quebrar layout.

---

# Tailwind

Utilizar Tailwind apenas quando necessário.

Priorizar componentes já existentes da biblioteca.

---

# Código Limpo

Evitar:

* Código duplicado
* Componentes gigantes
* Funções muito longas
* Lógica de negócio na interface

---

# O Que Nunca Fazer

* Utilizar fetch()
* Utilizar alert()
* Utilizar any sem necessidade
* Criar componentes duplicados
* Ignorar componentes da biblioteca interna
* Implementar autenticação dentro das páginas
* Duplicar lógica existente
* Misturar regras de negócio com interface
* Criar telas fora dos padrões Form/List ou FormList
* Ignorar tratamento de erros da API
* Fazer chamadas HTTP diretamente sem usar api.ts
* Quebrar o padrão visual do EroERP

---

# Checklist Obrigatório

Antes de finalizar qualquer tela:

* [ ] Utilizou componentes da biblioteca interna
* [ ] Seguiu padrão Form/List ou FormList
* [ ] Utilizou React Hook Form
* [ ] Utilizou api.ts
* [ ] Tratou erros da API
* [ ] Utilizou Toastify
* [ ] Tipou corretamente
* [ ] Não utilizou any sem necessidade
* [ ] Não utilizou fetch()
* [ ] Não utilizou alert()
* [ ] Manteve padrão visual do EroERP
* [ ] Funciona em desktop e mobile
