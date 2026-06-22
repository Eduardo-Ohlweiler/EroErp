import { useState, useEffect }                                    from "react"
import { FaFilePdf, FaFileCsv }                                    from "react-icons/fa"
import { useNavigate }                                            from "react-router-dom"
import { api }                                                     from "../../services/api"
import type { FormulaEnteralResponse }                             from "../../types/TerapiaNutricional"
import type { TDataGridColumn }                                    from "../../types/TDataGridColumn"
import { TPage }                                                   from "../../components/tpage"
import { TForm, TFormActionsLeft, TFormActionsRight, TFormFooter } from "../../components/tform"
import { TRow }                                                    from "../../components/trow"
import { TCol }                                                    from "../../components/tcol"
import { TEntry }                                                  from "../../components/tentry"
import { TButton }                                                 from "../../components/tbutton"
import { TDataGrid }                                               from "../../components/tdatagrid"
import { TDataGridFooter }                                         from "../../components/tdatagridfooter"
import { useMessage }                                              from "../../hooks/useMessage"
import { useQuestion }                                             from "../../hooks/useQuestion"
import { gerarPdfLista }                                          from "../../utils/geradorPdf"
import { exportarCsv }                                            from "../../utils/exportarPlanilha"

function fmtNum(v: number | null, dec = 1): string {
  return v == null ? "—" : Number(v).toFixed(dec)
}

function hojeISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

// Formatadores para exportação (CSV usa vírgula decimal; "" para nulos).
function pdfNum(v: number | null, dec = 1): string {
  return v == null || Number.isNaN(Number(v)) ? "—" : Number(v).toFixed(dec)
}
function csvNum(v: number | null, dec = 1): string {
  return v == null || Number.isNaN(Number(v)) ? "" : Number(v).toFixed(dec).replace(".", ",")
}

const columns: TDataGridColumn<FormulaEnteralResponse>[] = [
  { label: "Nome",
    render: (row) => (
      <span className="flex items-center gap-2">
        {row.nome}
        {row.global && (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-(--accent-light) text-(--accent)">
            Sistema
          </span>
        )}
      </span>
    ) },
  { label: "Categoria", width: "160px",
    render: (row) => <span>{row.categoria ?? "—"}</span> },
  { label: "Densidade (kcal/ml)", width: "130px", align: "center",
    render: (row) => <span>{Number(row.densidadeKcalMl).toFixed(2)}</span> },
  { label: "PTN (g/L)", width: "90px", align: "center",
    render: (row) => <span>{Number(row.proteinaGL).toFixed(1)}</span> },
  { label: "CHO (g/L)", width: "90px", align: "center",
    render: (row) => <span>{fmtNum(row.cho)}</span> },
  { label: "LIP (g/L)", width: "90px", align: "center",
    render: (row) => <span>{fmtNum(row.lip)}</span> },
  { label: "Fibras (g/L)", width: "100px", align: "center",
    render: (row) => <span>{fmtNum(row.fibras)}</span> },
  { label: "K (mg/L)", width: "90px", align: "center",
    render: (row) => <span>{fmtNum(row.potassio, 0)}</span> },
  { label: "Osmol. (mOsm/L)", width: "120px", align: "center",
    render: (row) => <span>{fmtNum(row.osmolaridade, 0)}</span> },
  { label: "Status", width: "90px", align: "center",
    render: (row) => (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium text-white ${row.ativo ? "bg-green-500" : "bg-red-400"}`}>
        {row.ativo ? "Ativo" : "Inativo"}
      </span>
    ) },
]

export default function FormulaEnteralList() {
  const navigate        = useNavigate()
  const { showMessage } = useMessage()
  const { ask }         = useQuestion()

  const [filtroNome,    setFiltroNome]    = useState("")
  const [data,          setData]          = useState<FormulaEnteralResponse[]>([])
  const [loading,       setLoading]       = useState(false)
  const [page,          setPage]          = useState(0)
  const [totalPages,    setTotalPages]    = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const pageSize = 15

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [page])

  async function load(nome = filtroNome, pagina = page) {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(pagina), size: String(pageSize), sort: "nome" })
      if (nome) params.append("nome", nome)
      const res = await api.get(`/formulas-enterais?${params.toString()}`)
      setData(res.data.content ?? [])
      setTotalPages(res.data.totalPages ?? 1)
      setTotalElements(res.data.totalElements ?? 0)
    } catch {
      showMessage("error", "Erro ao carregar fórmulas enterais")
    } finally {
      setLoading(false)
    }
  }

  function handleFiltrar(formData: Record<string, string>) {
    setFiltroNome(formData.nome ?? "")
    setPage(0)
    load(formData.nome ?? "", 0)
  }

  function handleLimpar() {
    setFiltroNome("")
    setPage(0)
    load("", 0)
  }

  async function fetchTodos(): Promise<FormulaEnteralResponse[]> {
    const params = new URLSearchParams({ page: "0", size: "1000", sort: "nome" })
    if (filtroNome) params.append("nome", filtroNome)
    const res = await api.get(`/formulas-enterais?${params.toString()}`)
    return res.data.content ?? []
  }

  function filtrosResumo(): string {
    return filtroNome ? `Nome contém "${filtroNome}"` : "Nenhum filtro aplicado"
  }

  async function handleExportarPdf() {
    try {
      const linhas = await fetchTodos()
      if (linhas.length === 0) { showMessage("warning", "Nenhuma fórmula para exportar"); return }
      const b64 = gerarPdfLista({
        titulo:      "FÓRMULAS ENTERAIS",
        dataEmissao: hojeISO(),
        filtros:     filtrosResumo(),
        colunas: [
          { header: "Nome" },
          { header: "Categoria" },
          { header: "Densidade (kcal/ml)", align: "right" },
          { header: "PTN (g/L)",           align: "right" },
          { header: "CHO (g/L)",           align: "right" },
          { header: "LIP (g/L)",           align: "right" },
          { header: "Fibras (g/L)",        align: "right" },
          { header: "K (mg/L)",            align: "right" },
          { header: "Osmol. (mOsm/L)",     align: "right" },
          { header: "Status",              align: "center" },
        ],
        linhas: linhas.map(l => [
          l.nome,
          l.categoria ?? "—",
          pdfNum(l.densidadeKcalMl, 2),
          pdfNum(l.proteinaGL, 1),
          pdfNum(l.cho, 1),
          pdfNum(l.lip, 1),
          pdfNum(l.fibras, 1),
          pdfNum(l.potassio, 0),
          pdfNum(l.osmolaridade, 0),
          l.ativo ? "Ativo" : "Inativo",
        ]),
      })
      const link    = document.createElement("a")
      link.href     = `data:application/pdf;base64,${b64}`
      link.download = `formulas_enterais_${hojeISO()}.pdf`
      link.click()
    } catch {
      showMessage("error", "Erro ao gerar PDF")
    }
  }

  async function handleExportarCsv() {
    try {
      const linhas = await fetchTodos()
      if (linhas.length === 0) { showMessage("warning", "Nenhuma fórmula para exportar"); return }
      const headers = [
        "Nome", "Categoria", "Densidade (kcal/ml)", "PTN (g/L)", "CHO (g/L)",
        "LIP (g/L)", "Fibras (g/L)", "K (mg/L)", "Osmol. (mOsm/L)", "Status",
      ]
      const rows = linhas.map(l => [
        l.nome,
        l.categoria ?? "",
        csvNum(l.densidadeKcalMl, 2),
        csvNum(l.proteinaGL, 1),
        csvNum(l.cho, 1),
        csvNum(l.lip, 1),
        csvNum(l.fibras, 1),
        csvNum(l.potassio, 0),
        csvNum(l.osmolaridade, 0),
        l.ativo ? "Ativo" : "Inativo",
      ])
      exportarCsv(`formulas_enterais_${hojeISO()}.csv`, headers, rows)
    } catch {
      showMessage("error", "Erro ao gerar CSV")
    }
  }

  function handleExcluir(row: FormulaEnteralResponse) {
    ask(`Excluir a fórmula "${row.nome}"?`, [
      { label: "Cancelar", variant: "cancel",  onClick: () => {} },
      { label: "Excluir",  variant: "confirm", onClick: async () => {
        try {
          await api.delete(`/formulas-enterais/${row.id}`)
          showMessage("success", "Fórmula excluída com sucesso!")
          load()
        } catch {
          showMessage("error", "Erro ao excluir fórmula")
        }
      }},
    ])
  }

  return (
    <TPage title="Fórmulas Enterais" breadcrumb={["Terapia Nutricional", "Fórmulas Enterais"]}>
      <TForm onSubmit={handleFiltrar}>
        <TRow>
          <TCol>
            <TEntry name="nome" label="Nome" placeholder="Filtrar por nome..."
              width="50%" minWidth="200px" defaultValue={filtroNome} />
          </TCol>
        </TRow>
        <TFormFooter>
          <TFormActionsLeft>
            <TButton type="submit" label="Filtrar" />
            <TButton label="Limpar" variant="cancel" type="button" onClick={handleLimpar} />
          </TFormActionsLeft>
          <TFormActionsRight>
            <TButton label="Relatório" variant="secondary" type="button"
              icon={<FaFilePdf />} onClick={handleExportarPdf} />
            <TButton label="Planilha" variant="secondary" type="button"
              icon={<FaFileCsv />} onClick={handleExportarCsv} />
            <TButton label="Nova Fórmula" variant="new" type="button"
              onClick={() => navigate("/terapia-nutricional/formulas-enterais/novo")} />
          </TFormActionsRight>
        </TFormFooter>
      </TForm>

      <TDataGrid
        columns      ={columns}
        data         ={data}
        keyField     ="id"
        loading      ={loading}
        emptyMessage ="Nenhuma fórmula encontrada"
        onRowClick   ={(row) => { if (!row.global) navigate(`/terapia-nutricional/formulas-enterais/${row.id}`) }}
        actionsWidth ="100px"
        actions      ={(row) => (
          row.global
            ? <span className="text-xs text-(--text-muted)">Somente leitura</span>
            : (
              <>
                <TButton label="" variant="edit"
                  onClick={(e) => { e?.stopPropagation(); navigate(`/terapia-nutricional/formulas-enterais/${row.id}`) }} />
                <TButton label="" variant="delete"
                  onClick={(e) => { e?.stopPropagation(); handleExcluir(row) }} />
              </>
            )
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
