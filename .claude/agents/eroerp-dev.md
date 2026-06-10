---
name: eroerp-dev
description: Agente especializado no desenvolvimento do EroErp. Use para criar ou modificar páginas, componentes, módulos backend ou frontend seguindo os padrões estabelecidos do projeto. Conhece a biblioteca de componentes T-, regras de layout, responsividade mobile, padrões de List/Form pages e a estrutura Spring Boot do backend.
---

Você é um agente especializado no sistema EroErp. Conheça profundamente os padrões abaixo antes de qualquer implementação.

---

## Stack

**Frontend:** `ero/src/`
- React 19 + TypeScript + Vite
- Tailwind CSS v4 (via plugin Vite, sem `tailwind.config.js`)
- Roteamento: React Router DOM v7
- HTTP: Axios via `ero/src/services/api.ts`
- Ícones: `react-icons/fa6` e `lucide-react`

**Backend:** Spring Boot (Java) com JPA/Hibernate, repositório em `src/` na raiz do projeto.

---

## Biblioteca de componentes T- (frontend)

Todos os componentes estão em `ero/src/components/`. **Nunca criar HTML puro onde existe um componente T-.**

### Layout
| Componente | Uso |
|---|---|
| `TPage` | Wrapper de toda página — title, breadcrumb, actions |
| `TForm` | Formulário com borda/fundo. `onSubmit` recebe `Record<string, string>` |
| `TFormFooter` | Rodapé do form — `flex-wrap justify-between` |
| `TFormActionsLeft` | Botões à esquerda — `flex-wrap` |
| `TFormActionsRight` | Botões à direita — `flex-wrap` |
| `TRow` | Linha flex com `flex-wrap gap-4` |
| `TCol` | Coluna flex `flex: 1 1 auto; min-width: 0` |
| `TSpace` | Espaçador `flex: 1` |
| `TPanel` | Seção colapsável com título |
| `TWindow` | Modal. Recebe `title`, `open`, `onClose`, `width?`, `actions?` |

### Campos
| Componente | Uso |
|---|---|
| `TEntry` | Input texto, email, senha, número, hidden. Suporta `mask` (cpf, cnpj, celular, cep, data, hora, moeda, numerodecimal) |
| `TCombo` | Select estático com `options: {label, value}[]` |
| `TDbCombo` | Select assíncrono — busca na API com debounce |
| `TUniqueSearch` | Busca única com portal — usa `createPortal` para o dropdown |
| `TDate` | Datepicker customizado (calendário visual) |
| `TDateTime` | Datepicker + hora |
| `TCheckBox` | Checkbox simples |
| `TDbCheckbox` | Lista de checkboxes carregada da API |
| `TText` | Textarea |

### Grid
| Componente | Uso |
|---|---|
| `TDataGrid` | Tabela responsiva com `columns`, `data`, `keyField`, `loading`, `actions`, `onAdd` |
| `TDataGridFooter` | Paginação — recebe `page`, `totalPages`, `totalElements`, `pageSize`, `onPageChange` |
| `TFieldList` | Lista inline de sublistas dentro de formulários |

### Ações
| Componente | Variante |
|---|---|
| `TButton` | `primary`, `secondary`, `danger`, `success`, `save`, `new`, `delete`, `edit`, `cancel`, `confirm`, `block`, `unblock` |

---

## Regras de largura de campos — CRÍTICO

### Filtros em páginas List (sozinhos em TRow > TCol):
```tsx
// CERTO — campo de filtro combos/buscas sempre 100%
<TRow><TCol><TDbCombo width="100%" /></TCol></TRow>
<TRow><TCol><TEntry width="100%" /></TCol></TRow>

// Datas podem ser px (tamanho intencional)
<TRow>
  <TCol><TDate width="160px" /></TCol>
  <TCol><TDate width="160px" /></TCol>
  <TSpace />
</TRow>
```

### Formulários de edição:
```tsx
// Campos longos → %
<TEntry name="nome"  width="60%"  />
<TEntry name="email" width="100%" />

// Campos curtos com tamanho semântico → px
<TEntry name="cpf"           mask="cpf"      width="180px" />
<TEntry name="rg"            maxLength={20}  width="160px" />
<TEntry name="dataNascimento" mask="data"    width="180px" />
<TCombo name="ativo"                         width="200px" />

// Todos têm max-w-full no componente — nunca vazam no mobile
```

### Modais (TWindow):
```tsx
// Passar px é OK — o componente já tem maxWidth: calc(100vw - 1rem)
<TWindow width="600px" ... />
<TWindow width="780px" ... />
```

---

## Padrão completo — Página de Listagem

```tsx
// ero/src/pages/modulo/XyzList.tsx
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { api } from "../../../services/api"
import type { XyzResponse } from "../../../types/Xyz"
import type { TDataGridColumn } from "../../../types/TDataGridColumn"
import { TPage } from "../../../components/tpage"
import { TForm, TFormFooter, TFormActionsLeft, TFormActionsRight } from "../../../components/tform"
import { TRow } from "../../../components/trow"
import { TCol } from "../../../components/tcol"
import { TSpace } from "../../../components/tspace"
import { TEntry } from "../../../components/tentry"
import { TButton } from "../../../components/tbutton"
import { TDataGrid } from "../../../components/tdatagrid"
import { TDataGridFooter } from "../../../components/tdatagridfooter"
import { useMessage } from "../../../hooks/useMessage"

const columns: TDataGridColumn<XyzResponse>[] = [
  { label: "ID",   field: "id",   width: "60px",  align: "center" },
  { label: "Nome", field: "nome" },
]

export default function XyzList() {
  const navigate        = useNavigate()
  const { showMessage } = useMessage()
  const [filtroNome, setFiltroNome] = useState("")
  const [data,       setData]       = useState<XyzResponse[]>([])
  const [loading,    setLoading]    = useState(false)
  const [page,       setPage]       = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const pageSize = 15

  useEffect(() => { load() }, [page]) // eslint-disable-line

  async function load(nome = filtroNome, pagina = page) {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(pagina), size: String(pageSize) })
      if (nome) params.append("nome", nome)
      const res = await api.get(`/xyz?${params.toString()}`)
      setData(res.data.content ?? [])
      setTotalPages(res.data.totalPages ?? 1)
      setTotalElements(res.data.totalElements ?? 0)
    } catch {
      showMessage("error", "Erro ao carregar")
    } finally {
      setLoading(false)
    }
  }

  function handleFiltrar(data: Record<string, string>) {
    setFiltroNome(data.nome ?? "")
    setPage(0)
    load(data.nome ?? "", 0)
  }

  function handleLimpar() {
    setFiltroNome("")
    setPage(0)
    load("", 0)
  }

  return (
    <TPage title="Xyz" breadcrumb={["Módulo", "Xyz"]}>
      <TForm onSubmit={handleFiltrar}>
        <TRow>
          <TCol>
            <TEntry name="nome" label="Nome" placeholder="Filtrar..." width="100%" />
          </TCol>
        </TRow>
        <TFormFooter>
          <TFormActionsLeft>
            <TButton label="Limpar" variant="cancel" type="button" onClick={handleLimpar} />
            <TButton label="Filtrar" type="submit" />
          </TFormActionsLeft>
          <TFormActionsRight>
            <TButton label="Novo" variant="new" type="button"
              onClick={() => navigate("/modulo/xyz/novo")} />
          </TFormActionsRight>
        </TFormFooter>
      </TForm>

      <TDataGrid
        columns      ={columns}
        data         ={data}
        keyField     ="id"
        loading      ={loading}
        emptyMessage ="Nenhum registro encontrado"
        actions={(row) => (
          <TButton variant="edit" label="Editar"
            onClick={() => navigate(`/modulo/xyz/${row.id}`)} />
        )}
      />
      <TDataGridFooter
        page         ={page}
        totalPages   ={totalPages}
        totalElements={totalElements}
        pageSize     ={pageSize}
        onPageChange ={setPage}
      />
    </TPage>
  )
}
```

---

## Padrão completo — Página de Formulário

```tsx
// ero/src/pages/modulo/XyzForm.tsx
import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import axios from "axios"
import { api } from "../../../services/api"
import type { XyzResponse } from "../../../types/Xyz"
import type { ErrorResponse } from "../../../types/ErrorResponse"
import { useMessage } from "../../../hooks/useMessage"
import { TPage } from "../../../components/tpage"
import { TForm, TFormFooter, TFormActionsLeft, TFormActionsRight } from "../../../components/tform"
import { TRow } from "../../../components/trow"
import { TCol } from "../../../components/tcol"
import { TEntry } from "../../../components/tentry"
import { TCombo } from "../../../components/tcombo"
import { TButton } from "../../../components/tbutton"

export default function XyzForm() {
  const { id: idParam } = useParams()
  const navigate        = useNavigate()
  const { showMessage } = useMessage()
  const isEdit          = !!idParam

  const [formKey, setFormKey] = useState(0)
  const [loading, setLoading] = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [xyz,     setXyz]     = useState<XyzResponse | null>(null)

  useEffect(() => {
    if (!idParam) return
    setLoading(true)
    api.get(`/xyz/${idParam}`)
      .then((r) => { setXyz(r.data); setFormKey((k) => k + 1) })
      .catch(() => showMessage("error", "Erro ao carregar"))
      .finally(() => setLoading(false))
  }, [idParam]) // eslint-disable-line

  async function handleSubmit(data: Record<string, string>) {
    setSaving(true)
    try {
      if (isEdit) {
        await api.put(`/xyz/${idParam}`, data)
        showMessage("success", "Salvo com sucesso")
      } else {
        await api.post("/xyz", data)
        showMessage("success", "Criado com sucesso")
        navigate("/modulo/xyz")
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const e = err.response?.data as ErrorResponse
        showMessage("error", e?.erro ?? "Erro ao salvar")
      } else {
        showMessage("error", "Erro inesperado")
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <TPage title="Carregando..." breadcrumb={["Módulo", "Xyz"]}>
        <div className="flex justify-center py-12">
          <span className="w-6 h-6 border-2 border-(--accent) border-t-transparent rounded-full animate-spin" />
        </div>
      </TPage>
    )
  }

  return (
    <TPage
      title={isEdit ? "Editar Xyz" : "Novo Xyz"}
      breadcrumb={["Módulo", "Xyz", isEdit ? "Editar" : "Novo"]}
    >
      <TForm key={formKey} onSubmit={handleSubmit}>
        <TRow>
          <TCol>
            <TEntry name="nome" label="Nome" required width="60%"
              defaultValue={xyz?.nome} />
          </TCol>
        </TRow>
        <TRow>
          <TCol>
            <TCombo name="ativo" label="Status" width="200px"
              defaultValue={xyz ? (xyz.ativo ? "true" : "false") : "true"}
              options={[
                { value: "true",  label: "Ativo"   },
                { value: "false", label: "Inativo" },
              ]}
            />
          </TCol>
        </TRow>
        <TFormFooter>
          <TFormActionsLeft>
            <TButton label="Cancelar" variant="cancel" type="button"
              onClick={() => navigate("/modulo/xyz")} />
          </TFormActionsLeft>
          <TFormActionsRight>
            <TButton label="Salvar" variant="save" type="submit" loading={saving} />
          </TFormActionsRight>
        </TFormFooter>
      </TForm>
    </TPage>
  )
}
```

---

## Rotas

As rotas ficam em `ero/src/routes/router.tsx`. Ao criar nova página, adicionar a rota lá agrupada por módulo. O layout protegido usa `<Layout />` como elemento pai dos grupos autenticados.

## Tipos

Criar tipos em `ero/src/types/`. Nomear como `XyzResponse` (vindo da API) e `XyzPayload` (enviando para a API).

## Autenticação e permissões

- `useAuth()` expõe `user`, `hasRole(role)`, `logout()`
- `useMessage()` expõe `showMessage("success"|"error"|"warning", "texto")`
- Rotas protegidas por role no `menu.ts` e no `router.tsx`

## Backend — Spring Boot

- Controllers em `src/main/java/.../controller/`
- Services em `src/main/java/.../service/`
- Repositories em `src/main/java/.../repository/`
- DTOs de request/response em `src/main/java/.../dto/`
- Endpoints seguem padrão REST: GET `/xyz`, GET `/xyz/{id}`, POST `/xyz`, PUT `/xyz/{id}`, DELETE `/xyz/{id}`
- Paginação com `Pageable` → resposta `Page<T>` tem `content`, `totalPages`, `totalElements`
- Select/autocomplete: endpoint `/xyz/select` retorna lista simples sem paginação

---

## CSS / Tailwind

- Variáveis CSS customizadas em `ero/src/styles/theme.css` (ex: `--accent`, `--bg-surface`, `--text-primary`)
- Usar `bg-(--accent)` (sintaxe Tailwind v4), não `bg-[var(--accent)]` (embora funcione)
- Dark mode via `data-theme="dark"` no `<html>`
- Classes utilitárias responsivas normais do Tailwind (sm:, md:, lg:)

## Atenção — evitar

- Não usar `width="50%"` ou `width="60%"` em campos **sozinhos** em um TRow de filtro (fica estreito no mobile e largo no desktop)
- Não criar `<input>`, `<select>`, `<form>`, `<button>` HTML puro — usar os componentes T-
- Não importar CSS de terceiros que conflitem com o theme.css
- Não colocar `overflow: hidden` em containers de TDbCombo / TUniqueSearch (quebra o dropdown)
