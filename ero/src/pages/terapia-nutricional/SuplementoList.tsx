import { useState, useEffect }                                    from "react"
import { FaFilePdf, FaFileCsv }                                    from "react-icons/fa"
import { useNavigate }                                            from "react-router-dom"
import { api }                                                     from "../../services/api"
import type { SuplementoResponse }                                 from "../../types/TerapiaNutricional"
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

function n(v: number | null, dec = 1): string {
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

const columns: TDataGridColumn<SuplementoResponse>[] = [
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
  { label: "Qtd (g)", width: "90px", align: "center", render: (row) => <span>{n(row.qtdG, 0)}</span> },
  { label: "Kcal",    width: "90px", align: "center", render: (row) => <span>{n(row.kcal, 0)}</span> },
  { label: "PTN (g)", width: "90px", align: "center", render: (row) => <span>{n(row.ptn, 1)}</span> },
  { label: "CHO (g)", width: "90px", align: "center", render: (row) => <span>{n(row.cho, 1)}</span> },
  { label: "LIP (g)", width: "90px", align: "center", render: (row) => <span>{n(row.lip, 1)}</span> },
  { label: "K (mg)",  width: "90px", align: "center", render: (row) => <span>{n(row.potassio, 0)}</span> },
  { label: "Osmol.", width: "90px", align: "center", render: (row) => <span>{n(row.osmolaridade, 0)}</span> },
  { label: "Status", width: "90px", align: "center",
    render: (row) => (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium text-white ${row.ativo ? "bg-green-500" : "bg-red-400"}`}>
        {row.ativo ? "Ativo" : "Inativo"}
      </span>
    ) },
]

export default function SuplementoList() {
  const navigate        = useNavigate()
  const { showMessage } = useMessage()
  const { ask }         = useQuestion()

  const [filtroNome,    setFiltroNome]    = useState("")
  const [data,          setData]          = useState<SuplementoResponse[]>([])
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
      const res = await api.get(`/suplementos?${params.toString()}`)
      setData(res.data.content ?? [])
      setTotalPages(res.data.totalPages ?? 1)
      setTotalElements(res.data.totalElements ?? 0)
    } catch {
      showMessage("error", "Erro ao carregar suplementos")
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

  async function fetchTodos(): Promise<SuplementoResponse[]> {
    const params = new URLSearchParams({ page: "0", size: "1000", sort: "nome" })
    if (filtroNome) params.append("nome", filtroNome)
    const res = await api.get(`/suplementos?${params.toString()}`)
    return res.data.content ?? []
  }

  function filtrosResumo(): string {
    return filtroNome ? `Nome contém "${filtroNome}"` : "Nenhum filtro aplicado"
  }

  async function handleExportarPdf() {
    try {
      const linhas = await fetchTodos()
      if (linhas.length === 0) { showMessage("warning", "Nenhum suplemento para exportar"); return }
      const b64 = gerarPdfLista({
        titulo:      "SUPLEMENTOS",
        dataEmissao: hojeISO(),
        filtros:     filtrosResumo(),
        colunas: [
          { header: "Nome" },
          { header: "Qtd (g)",     align: "right" },
          { header: "Kcal",        align: "right" },
          { header: "PTN (g)",     align: "right" },
          { header: "CHO (g)",     align: "right" },
          { header: "Açúcar (g)",  align: "right" },
          { header: "LIP (g)",     align: "right" },
          { header: "Sódio (mg)",  align: "right" },
          { header: "K (mg)",      align: "right" },
          { header: "Fósforo (mg)", align: "right" },
          { header: "Ferro (mg)",  align: "right" },
          { header: "Fibras (g)",  align: "right" },
          { header: "Osmol.",      align: "right" },
          { header: "Status",      align: "center" },
        ],
        linhas: linhas.map(l => [
          l.nome,
          pdfNum(l.qtdG, 0),
          pdfNum(l.kcal, 0),
          pdfNum(l.ptn, 1),
          pdfNum(l.cho, 1),
          pdfNum(l.acucar, 1),
          pdfNum(l.lip, 1),
          pdfNum(l.sodio, 0),
          pdfNum(l.potassio, 0),
          pdfNum(l.fosforo, 0),
          pdfNum(l.ferro, 1),
          pdfNum(l.fibras, 1),
          pdfNum(l.osmolaridade, 0),
          l.ativo ? "Ativo" : "Inativo",
        ]),
      })
      const link    = document.createElement("a")
      link.href     = `data:application/pdf;base64,${b64}`
      link.download = `suplementos_${hojeISO()}.pdf`
      link.click()
    } catch {
      showMessage("error", "Erro ao gerar PDF")
    }
  }

  async function handleExportarCsv() {
    try {
      const linhas = await fetchTodos()
      if (linhas.length === 0) { showMessage("warning", "Nenhum suplemento para exportar"); return }
      const headers = [
        "Nome", "Qtd (g)", "Kcal", "PTN (g)", "CHO (g)", "Açúcar (g)", "LIP (g)",
        "Sódio (mg)", "Potássio (mg)", "Fósforo (mg)", "Ferro (mg)", "Fibras (g)", "Osmolaridade", "Status",
      ]
      const rows = linhas.map(l => [
        l.nome,
        csvNum(l.qtdG, 0),
        csvNum(l.kcal, 0),
        csvNum(l.ptn, 1),
        csvNum(l.cho, 1),
        csvNum(l.acucar, 1),
        csvNum(l.lip, 1),
        csvNum(l.sodio, 0),
        csvNum(l.potassio, 0),
        csvNum(l.fosforo, 0),
        csvNum(l.ferro, 1),
        csvNum(l.fibras, 1),
        csvNum(l.osmolaridade, 0),
        l.ativo ? "Ativo" : "Inativo",
      ])
      exportarCsv(`suplementos_${hojeISO()}.csv`, headers, rows)
    } catch {
      showMessage("error", "Erro ao gerar CSV")
    }
  }

  function handleExcluir(row: SuplementoResponse) {
    ask(`Excluir o suplemento "${row.nome}"?`, [
      { label: "Cancelar", variant: "cancel",  onClick: () => {} },
      { label: "Excluir",  variant: "confirm", onClick: async () => {
        try {
          await api.delete(`/suplementos/${row.id}`)
          showMessage("success", "Suplemento excluído com sucesso!")
          load()
        } catch {
          showMessage("error", "Erro ao excluir suplemento")
        }
      }},
    ])
  }

  return (
    <TPage title="Suplementos" breadcrumb={["Terapia Nutricional", "Suplementos"]}>
      <TForm onSubmit={handleFiltrar}>
        <TRow>
          <TCol>
            <TEntry name="nome" label="Nome" placeholder="Filtrar por nome..."
              width="50%" defaultValue={filtroNome} />
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
            <TButton label="Novo Suplemento" variant="new" type="button"
              onClick={() => navigate("/terapia-nutricional/suplementos/novo")} />
          </TFormActionsRight>
        </TFormFooter>
      </TForm>

      <TDataGrid
        columns      ={columns}
        data         ={data}
        keyField     ="id"
        loading      ={loading}
        emptyMessage ="Nenhum suplemento encontrado"
        onRowClick   ={(row) => { if (!row.global) navigate(`/terapia-nutricional/suplementos/${row.id}`) }}
        actionsWidth ="100px"
        actions      ={(row) => (
          row.global
            ? <span className="text-xs text-(--text-muted)">Somente leitura</span>
            : (
              <>
                <TButton label="" variant="edit"
                  onClick={(e) => { e?.stopPropagation(); navigate(`/terapia-nutricional/suplementos/${row.id}`) }} />
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
