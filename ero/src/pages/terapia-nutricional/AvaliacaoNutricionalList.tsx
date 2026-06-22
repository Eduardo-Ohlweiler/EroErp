import { useState, useEffect }                                    from "react"
import { FaFilePdf, FaFileCsv }                                    from "react-icons/fa"
import { useNavigate }                                            from "react-router-dom"
import { api }                                                     from "../../services/api"
import type { AvaliacaoNutricionalSummary, AvaliacaoNutricionalResponse } from "../../types/TerapiaNutricional"
import type { TDataGridColumn }                                    from "../../types/TDataGridColumn"
import { TPage }                                                   from "../../components/tpage"
import { TForm, TFormActionsLeft, TFormActionsRight, TFormFooter } from "../../components/tform"
import { TRow }                                                    from "../../components/trow"
import { TCol }                                                    from "../../components/tcol"
import { TDbCombo }                                                from "../../components/tdbcombo"
import { TDate }                                                   from "../../components/tdate"
import { TButton }                                                 from "../../components/tbutton"
import { TDataGrid }                                               from "../../components/tdatagrid"
import { TDataGridFooter }                                         from "../../components/tdatagridfooter"
import { useMessage }                                              from "../../hooks/useMessage"
import { useQuestion }                                             from "../../hooks/useQuestion"
import { displayPessoa }                                           from "../../utils/pessoas"
import { gerarPdfLista }                                          from "../../utils/geradorPdf"
import { exportarCsv }                                            from "../../utils/exportarPlanilha"
import { TSpace } from "../../components/tspace"

function formatarData(iso: string): string {
  if (!iso) return "—"
  const [y, m, d] = iso.split("-")
  return `${d}/${m}/${y}`
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

function corClassif(classif: string | null): string {
  if (!classif) return "#94a3b8"
  const c = classif.toLowerCase()
  if (c.includes("eutrof") || c.includes("adequad") || c.includes("normal")) return "#22c55e"
  if (c.includes("desnutri") || c.includes("baixo") || c.includes("magrez")) return "#3b82f6"
  if (c.includes("sobrepeso") || c.includes("obesid") || c.includes("excesso")) return "#f59e0b"
  return "#64748b"
}

const columns: TDataGridColumn<AvaliacaoNutricionalSummary>[] = [
  { label: "Data", width: "110px",
    render: (row) => <span>{formatarData(row.dataAvaliacao)}</span> },
  { label: "Paciente", field: "pessoaNome" },
  { label: "Peso", width: "100px", align: "center",
    render: (row) => <span>{row.pesoAtual != null ? `${Number(row.pesoAtual).toFixed(1)} kg` : "—"}</span> },
  { label: "IMC", width: "90px", align: "center",
    render: (row) => <span className="font-semibold">{row.imc != null ? Number(row.imc).toFixed(1) : "—"}</span> },
  { label: "Classif. IMC (OMS)", width: "160px",
    render: (row) => (
      <span className="font-medium" style={{ color: corClassif(row.classifImcOms) }}>
        {row.classifImcOms ?? "—"}
      </span>
    ) },
  { label: "Fórmula", field: "formulaNome",
    render: (row) => <span>{row.formulaNome ?? "—"}</span> },
]

// Descritor das colunas de exportação — mantém PDF e CSV em sincronia (mesmo
// cabeçalho/ordem). `pdf` usa "—" para nulos; `csv` usa "" e vírgula decimal.
interface ColExport {
  header: string
  align?: "left" | "right" | "center"
  pdf:    (r: AvaliacaoNutricionalResponse) => string
  csv:    (r: AvaliacaoNutricionalResponse) => string
}

const colunasExport: ColExport[] = [
  { header: "Data",              pdf: r => formatarData(r.dataAvaliacao),     csv: r => formatarData(r.dataAvaliacao) },
  { header: "Paciente",          pdf: r => r.pessoaNome ?? "—",               csv: r => r.pessoaNome ?? "" },
  { header: "Sexo",              pdf: r => r.sexo ?? "—",                     csv: r => r.sexo ?? "" },
  { header: "Idade",             align: "right", pdf: r => r.idade != null ? String(r.idade) : "—", csv: r => r.idade != null ? String(r.idade) : "" },
  { header: "Peso atual (kg)",   align: "right", pdf: r => pdfNum(r.pesoAtual, 1),       csv: r => csvNum(r.pesoAtual, 1) },
  { header: "Altura (cm)",       align: "right", pdf: r => pdfNum(r.altura, 1),          csv: r => csvNum(r.altura, 1) },
  { header: "IMC",               align: "right", pdf: r => pdfNum(r.imc, 1),             csv: r => csvNum(r.imc, 1) },
  { header: "Classif. IMC (OMS)",  pdf: r => r.classifImcOms ?? "—",          csv: r => r.classifImcOms ?? "" },
  { header: "Classif. IMC (OPAS)", pdf: r => r.classifImcOpas ?? "—",         csv: r => r.classifImcOpas ?? "" },
  { header: "Peso ideal (kg)",   align: "right", pdf: r => pdfNum(r.pesoIdeal, 1),       csv: r => csvNum(r.pesoIdeal, 1) },
  { header: "Peso ajustado (kg)", align: "right", pdf: r => pdfNum(r.pesoAjustado, 1),   csv: r => csvNum(r.pesoAjustado, 1) },
  { header: "% Perda peso",      align: "right", pdf: r => pdfNum(r.percPerdaPeso, 1),   csv: r => csvNum(r.percPerdaPeso, 1) },
  { header: "% Adequação CB",    align: "right", pdf: r => pdfNum(r.percAdequacaoCb, 1), csv: r => csvNum(r.percAdequacaoCb, 1) },
  { header: "Fase",              pdf: r => r.fase ?? "—",                     csv: r => r.fase ?? "" },
  { header: "Kcal meta",         align: "right", pdf: r => pdfNum(r.kcalTotal, 0),       csv: r => csvNum(r.kcalTotal, 0) },
  { header: "Kcal mín",          align: "right", pdf: r => pdfNum(r.kcalMin, 0),         csv: r => csvNum(r.kcalMin, 0) },
  { header: "Kcal máx",          align: "right", pdf: r => pdfNum(r.kcalMax, 0),         csv: r => csvNum(r.kcalMax, 0) },
  { header: "PTN meta (g)",      align: "right", pdf: r => pdfNum(r.ptnTotal, 1),        csv: r => csvNum(r.ptnTotal, 1) },
  { header: "PTN mín (g)",       align: "right", pdf: r => pdfNum(r.ptnMin, 1),          csv: r => csvNum(r.ptnMin, 1) },
  { header: "PTN máx (g)",       align: "right", pdf: r => pdfNum(r.ptnMax, 1),          csv: r => csvNum(r.ptnMax, 1) },
  { header: "Fórmula",           pdf: r => r.formulaNome ?? "—",              csv: r => r.formulaNome ?? "" },
  { header: "Dieta VT (ml)",     align: "right", pdf: r => pdfNum(r.dietaVt, 0),         csv: r => csvNum(r.dietaVt, 0) },
  { header: "Dieta kcal",        align: "right", pdf: r => pdfNum(r.dietaKcal, 0),       csv: r => csvNum(r.dietaKcal, 0) },
  { header: "Dieta PTN (g)",     align: "right", pdf: r => pdfNum(r.dietaPtn, 1),        csv: r => csvNum(r.dietaPtn, 1) },
  { header: "% VCT",             align: "right", pdf: r => pdfNum(r.dietaPercVct, 1),    csv: r => csvNum(r.dietaPercVct, 1) },
  { header: "% PTN",             align: "right", pdf: r => pdfNum(r.dietaPercPtn, 1),    csv: r => csvNum(r.dietaPercPtn, 1) },
  { header: "Hidratação nec. ideal (ml)", align: "right", pdf: r => pdfNum(r.hidratacaoNecIdeal, 0), csv: r => csvNum(r.hidratacaoNecIdeal, 0) },
]

export default function AvaliacaoNutricionalList() {
  const navigate        = useNavigate()
  const { showMessage } = useMessage()
  const { ask }         = useQuestion()

  const [filtroPessoaId, setFiltroPessoaId] = useState("")
  const [filtroInicio,   setFiltroInicio]   = useState("")
  const [filtroFim,      setFiltroFim]      = useState("")
  const [data,           setData]           = useState<AvaliacaoNutricionalSummary[]>([])
  const [loading,        setLoading]        = useState(false)
  const [page,           setPage]           = useState(0)
  const [totalPages,     setTotalPages]     = useState(0)
  const [totalElements,  setTotalElements]  = useState(0)
  const pageSize = 15

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [page])

  interface Filtros { pessoaId: string; inicio: string; fim: string }

  function currentFiltros(): Filtros {
    return { pessoaId: filtroPessoaId, inicio: filtroInicio, fim: filtroFim }
  }

  async function load(f: Filtros = currentFiltros(), pagina = page) {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(pagina),
        size: String(pageSize),
        sort: "dataAvaliacao,desc",
      })
      if (f.pessoaId) params.append("pessoaId",   f.pessoaId)
      if (f.inicio)   params.append("dataInicio", f.inicio)
      if (f.fim)      params.append("dataFim",    f.fim)
      const res = await api.get(`/avaliacoes-nutricionais?${params.toString()}`)
      setData(res.data.content ?? [])
      setTotalPages(res.data.totalPages ?? 1)
      setTotalElements(res.data.totalElements ?? 0)
    } catch {
      showMessage("error", "Erro ao carregar avaliações nutricionais")
    } finally {
      setLoading(false)
    }
  }

  function handleFiltrar(formData: Record<string, string>) {
    const inicio = formData.dataInicio ?? ""
    const fim    = formData.dataFim    ?? ""
    setFiltroInicio(inicio)
    setFiltroFim(fim)
    setPage(0)
    load({ pessoaId: filtroPessoaId, inicio, fim }, 0)
  }

  function handleLimpar() {
    setFiltroPessoaId("")
    setFiltroInicio("")
    setFiltroFim("")
    setPage(0)
    load({ pessoaId: "", inicio: "", fim: "" }, 0)
  }

  async function fetchTodos(f: Filtros): Promise<AvaliacaoNutricionalResponse[]> {
    const params = new URLSearchParams()
    if (f.pessoaId) params.append("pessoaId",   f.pessoaId)
    if (f.inicio)   params.append("dataInicio", f.inicio)
    if (f.fim)      params.append("dataFim",    f.fim)
    const qs  = params.toString()
    const res = await api.get(`/avaliacoes-nutricionais/export${qs ? `?${qs}` : ""}`)
    return res.data ?? []
  }

  function filtrosResumo(f: Filtros): string {
    const partes: string[] = []
    if (f.inicio || f.fim) partes.push(`Período: ${f.inicio ? formatarData(f.inicio) : "..."} a ${f.fim ? formatarData(f.fim) : "..."}`)
    if (f.pessoaId) partes.push("Paciente filtrado")
    return partes.length ? partes.join("  •  ") : "Nenhum filtro aplicado"
  }

  async function handleExportarPdf() {
    const f = currentFiltros()
    try {
      const linhas = await fetchTodos(f)
      if (linhas.length === 0) { showMessage("warning", "Nenhuma avaliação para exportar"); return }
      const b64 = gerarPdfLista({
        titulo:      "AVALIAÇÕES NUTRICIONAIS (UTI)",
        dataEmissao: hojeISO(),
        filtros:     filtrosResumo(f),
        colunas:     colunasExport.map(c => ({ header: c.header, align: c.align })),
        linhas:      linhas.map(l => colunasExport.map(c => c.pdf(l))),
      })
      const link    = document.createElement("a")
      link.href     = `data:application/pdf;base64,${b64}`
      link.download = `avaliacoes_nutricionais_${hojeISO()}.pdf`
      link.click()
    } catch {
      showMessage("error", "Erro ao gerar PDF")
    }
  }

  async function handleExportarCsv() {
    const f = currentFiltros()
    try {
      const linhas = await fetchTodos(f)
      if (linhas.length === 0) { showMessage("warning", "Nenhuma avaliação para exportar"); return }
      const headers = colunasExport.map(c => c.header)
      const rows    = linhas.map(l => colunasExport.map(c => c.csv(l)))
      exportarCsv(`avaliacoes_nutricionais_${hojeISO()}.csv`, headers, rows)
    } catch {
      showMessage("error", "Erro ao gerar CSV")
    }
  }

  function handleExcluir(row: AvaliacaoNutricionalSummary) {
    ask(`Excluir a avaliação de "${row.pessoaNome}" em ${formatarData(row.dataAvaliacao)}?`, [
      { label: "Cancelar", variant: "cancel",  onClick: () => {} },
      { label: "Excluir",  variant: "confirm", onClick: async () => {
        try {
          await api.delete(`/avaliacoes-nutricionais/${row.id}`)
          showMessage("success", "Avaliação excluída com sucesso!")
          load()
        } catch {
          showMessage("error", "Erro ao excluir avaliação")
        }
      }},
    ])
  }

  return (
    <TPage title="Avaliações Nutricionais" breadcrumb={["Terapia Nutricional", "Avaliações"]}>
      <TForm onSubmit={handleFiltrar}>
        <TRow>
          <TCol flex={2}>
            <TDbCombo
              name         ="pessoaId"
              label        ="Paciente"
              url          ="/pessoas/select"
              valueField   ="id"
              displayField ={displayPessoa}
              searchField  ="nome"
              value        ={filtroPessoaId}
              onChange     ={(v) => setFiltroPessoaId(v)}
              placeholder  ="Filtrar por paciente..."
              width="50%"
              minWidth="200px"
            />
          </TCol>
        </TRow>
        <TRow>
          <TCol flex={1}>
            <TDate name="dataInicio" label="Data Inicial" defaultValue={filtroInicio} />
          </TCol>
          <TCol flex={1}>
            <TDate name="dataFim" label="Data Final" defaultValue={filtroFim} />
          </TCol>
          <TSpace />
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
            <TButton label="Nova Avaliação" variant="new" type="button"
              onClick={() => navigate("/terapia-nutricional/avaliacoes/novo")} />
          </TFormActionsRight>
        </TFormFooter>
      </TForm>

      <TDataGrid
        data        ={data}
        columns     ={columns}
        keyField    ="id"
        loading     ={loading}
        emptyMessage="Nenhuma avaliação encontrada"
        onRowClick  ={(row) => navigate(`/terapia-nutricional/avaliacoes/${row.id}`)}
        actionsWidth="100px"
        actions     ={(row) => (
          <>
            <TButton label="" variant="edit"
              onClick={(e) => { e?.stopPropagation(); navigate(`/terapia-nutricional/avaliacoes/${row.id}`) }} />
            <TButton label="" variant="delete"
              onClick={(e) => { e?.stopPropagation(); handleExcluir(row) }} />
          </>
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
