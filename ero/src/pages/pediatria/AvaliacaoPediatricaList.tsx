import { useState, useEffect }                                    from "react"
import { FaFilePdf, FaFileCsv }                                    from "react-icons/fa"
import { useNavigate }                                            from "react-router-dom"
import { api }                                                     from "../../services/api"
import type { AvaliacaoPediatricaSummary, AvaliacaoPediatricaResponse } from "../../types/Pediatria"
import type { TDataGridColumn }                                    from "../../types/TDataGridColumn"
import { TPage }                                                   from "../../components/tpage"
import { TForm, TFormActionsLeft, TFormActionsRight, TFormFooter } from "../../components/tform"
import { TRow }                                                    from "../../components/trow"
import { TCol }                                                    from "../../components/tcol"
import { TDbCombo }                                                from "../../components/tdbcombo"
import { TCombo }                                                  from "../../components/tcombo"
import { TEntry }                                                  from "../../components/tentry"
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

function corClassif(classif: string | null): string {
  if (!classif) return "#94a3b8"
  const c = classif.toLowerCase()
  if (c.includes("adequad")) return "#22c55e"
  if (c.includes("magrez"))  return "#3b82f6"
  if (c.includes("sobrepeso")) return "#f59e0b"
  return "#64748b"
}

const columns: TDataGridColumn<AvaliacaoPediatricaSummary>[] = [
  { label: "Data", width: "110px",
    render: (row) => <span>{formatarData(row.dataAvaliacao)}</span> },
  { label: "Paciente", field: "pessoaNome" },
  { label: "Idade (meses)", width: "120px", align: "center",
    render: (row) => <span>{row.idadeMeses != null ? `${row.idadeMeses}` : "—"}</span> },
  { label: "Peso", width: "90px", align: "center",
    render: (row) => <span>{row.peso != null ? `${Number(row.peso).toFixed(1)} kg` : "—"}</span> },
  { label: "IMC", width: "90px", align: "center",
    render: (row) => <span className="font-semibold">{row.imc != null ? Number(row.imc).toFixed(1) : "—"}</span> },
  { label: "Classif. IMC", width: "150px",
    render: (row) => (
      <span className="font-medium" style={{ color: corClassif(row.classifImcIdade) }}>
        {row.classifImcIdade ?? "—"}
      </span>
    ) },
]

// ── Exportação (PDF + CSV) — descritor único de colunas completas, em sincronia ──
// pdf usa "—" para nulos; csv usa "" e vírgula decimal (pt-BR).
function pdfNum(v: number | null, dec = 1): string {
  return v == null || Number.isNaN(Number(v)) ? "—" : Number(v).toFixed(dec)
}
function csvNum(v: number | null, dec = 1): string {
  return v == null || Number.isNaN(Number(v)) ? "" : Number(v).toFixed(dec).replace(".", ",")
}
function intPdf(v: number | null): string { return v == null ? "—" : String(v) }
function intCsv(v: number | null): string { return v == null ? "" : String(v) }
function sexoLabel(s: string | null): string { return s === "M" ? "Masculino" : s === "F" ? "Feminino" : "" }

interface ColExport {
  header: string
  align?: "left" | "right" | "center"
  pdf: (l: AvaliacaoPediatricaResponse) => string
  csv: (l: AvaliacaoPediatricaResponse) => string
}

const EXPORT_COLS: ColExport[] = [
  { header: "Data",                   pdf: l => formatarData(l.dataAvaliacao), csv: l => formatarData(l.dataAvaliacao) },
  { header: "Paciente",               pdf: l => l.pessoaNome ?? "—",           csv: l => l.pessoaNome ?? "" },
  { header: "Sexo", align: "center",  pdf: l => sexoLabel(l.sexo) || "—",      csv: l => sexoLabel(l.sexo) },
  { header: "Idade (meses)", align: "right", pdf: l => intPdf(l.idadeMeses), csv: l => intCsv(l.idadeMeses) },
  { header: "Peso (kg)",     align: "right", pdf: l => pdfNum(l.peso, 1),    csv: l => csvNum(l.peso, 1) },
  { header: "Estatura (cm)", align: "right", pdf: l => pdfNum(l.estatura, 1), csv: l => csvNum(l.estatura, 1) },
  { header: "IMC",           align: "right", pdf: l => pdfNum(l.imc, 1),     csv: l => csvNum(l.imc, 1) },
  { header: "Peso/idade",      pdf: l => l.classifPesoIdade ?? "—",     csv: l => l.classifPesoIdade ?? "" },
  { header: "Estatura/idade",  pdf: l => l.classifEstaturaIdade ?? "—", csv: l => l.classifEstaturaIdade ?? "" },
  { header: "IMC/idade",       pdf: l => l.classifImcIdade ?? "—",      csv: l => l.classifImcIdade ?? "" },
  { header: "VET (kcal)",        align: "right", pdf: l => pdfNum(l.vet, 0),                 csv: l => csvNum(l.vet, 0) },
  { header: "Proteína nec. (g)", align: "right", pdf: l => pdfNum(l.proteinaNecessidade, 1), csv: l => csvNum(l.proteinaNecessidade, 1) },
  { header: "Fórmula",      pdf: l => l.formulaNome ?? "—", csv: l => l.formulaNome ?? "" },
  { header: "Kcal/100ml", align: "right", pdf: l => pdfNum(l.formulaKcalPor100ml, 1),     csv: l => csvNum(l.formulaKcalPor100ml, 1) },
  { header: "Prot/100ml", align: "right", pdf: l => pdfNum(l.formulaProteinaPor100ml, 2), csv: l => csvNum(l.formulaProteinaPor100ml, 2) },
  { header: "Volume (ml)",        align: "right", pdf: l => pdfNum(l.volumeMl, 0),       csv: l => csvNum(l.volumeMl, 0) },
  { header: "Freq. (h)",          align: "right", pdf: l => pdfNum(l.frequenciaHoras, 0), csv: l => csvNum(l.frequenciaHoras, 0) },
  { header: "Vezes/dia",          align: "right", pdf: l => pdfNum(l.vezesDia, 1),       csv: l => csvNum(l.vezesDia, 1) },
  { header: "Volume total (ml)",  align: "right", pdf: l => pdfNum(l.volumeTotal, 0),    csv: l => csvNum(l.volumeTotal, 0) },
  { header: "Calorias totais (kcal)", align: "right", pdf: l => pdfNum(l.caloriasTotais, 0), csv: l => csvNum(l.caloriasTotais, 0) },
  { header: "Proteína total (g)", align: "right", pdf: l => pdfNum(l.proteinaTotal, 1),  csv: l => csvNum(l.proteinaTotal, 1) },
  { header: "% Calórico", align: "right", pdf: l => l.percCalorico != null ? `${pdfNum(l.percCalorico, 1)}%` : "—", csv: l => csvNum(l.percCalorico, 1) },
  { header: "% Proteico", align: "right", pdf: l => l.percProteico != null ? `${pdfNum(l.percProteico, 1)}%` : "—", csv: l => csvNum(l.percProteico, 1) },
]

export default function AvaliacaoPediatricaList() {
  const navigate        = useNavigate()
  const { showMessage } = useMessage()
  const { ask }         = useQuestion()

  const [filtroPessoaId, setFiltroPessoaId] = useState("")
  const [filtroInicio,   setFiltroInicio]   = useState("")
  const [filtroFim,      setFiltroFim]      = useState("")
  const [filtroMesMin,   setFiltroMesMin]   = useState("")
  const [filtroMesMax,   setFiltroMesMax]   = useState("")
  const [filtroFormulaId, setFiltroFormulaId] = useState("")
  const [formulaOptions, setFormulaOptions] = useState<{ value: string; label: string }[]>([])
  const [data,           setData]           = useState<AvaliacaoPediatricaSummary[]>([])
  const [loading,        setLoading]        = useState(false)
  const [page,           setPage]           = useState(0)
  const [totalPages,     setTotalPages]     = useState(0)
  const [totalElements,  setTotalElements]  = useState(0)
  const pageSize = 15

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [page])

  useEffect(() => {
    api.get<{ id: number; nome: string }[]>("/formulas-lacteas/select")
      .then(r => setFormulaOptions((r.data ?? []).map(f => ({ value: String(f.id), label: f.nome }))))
      .catch(() => showMessage("error", "Erro ao carregar fórmulas lácteas"))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  interface Filtros {
    pessoaId:  string
    inicio:    string
    fim:       string
    mesMin:    string
    mesMax:    string
    formulaId: string
  }

  function buildParams(f: Filtros, pagina: number, size: number): URLSearchParams {
    const params = new URLSearchParams({
      page: String(pagina),
      size: String(size),
      sort: "dataAvaliacao,desc",
    })
    if (f.pessoaId)  params.append("pessoaId",       f.pessoaId)
    if (f.inicio)    params.append("dataInicio",     f.inicio)
    if (f.fim)       params.append("dataFim",        f.fim)
    if (f.mesMin)    params.append("mesesMin",       f.mesMin)
    if (f.mesMax)    params.append("mesesMax",       f.mesMax)
    if (f.formulaId) params.append("formulaLacteaId", f.formulaId)
    return params
  }

  function filtrosResumo(f: Filtros): string {
    const partes: string[] = []
    if (f.inicio || f.fim) partes.push(`Período: ${f.inicio ? formatarData(f.inicio) : "..."} a ${f.fim ? formatarData(f.fim) : "..."}`)
    if (f.mesMin || f.mesMax) partes.push(`Meses: ${f.mesMin || "..."} a ${f.mesMax || "..."}`)
    if (f.formulaId) partes.push(`Fórmula: ${formulaOptions.find(o => o.value === f.formulaId)?.label ?? f.formulaId}`)
    if (f.pessoaId) partes.push("Paciente filtrado")
    return partes.length ? partes.join("  •  ") : "Nenhum filtro aplicado"
  }

  async function load(f: Filtros = currentFiltros(), pagina = page) {
    setLoading(true)
    try {
      const params = buildParams(f, pagina, pageSize)
      const res = await api.get(`/avaliacoes-pediatricas?${params.toString()}`)
      setData(res.data.content ?? [])
      setTotalPages(res.data.totalPages ?? 1)
      setTotalElements(res.data.totalElements ?? 0)
    } catch {
      showMessage("error", "Erro ao carregar avaliações pediátricas")
    } finally {
      setLoading(false)
    }
  }

  function currentFiltros(): Filtros {
    return {
      pessoaId:  filtroPessoaId,
      inicio:    filtroInicio,
      fim:       filtroFim,
      mesMin:    filtroMesMin,
      mesMax:    filtroMesMax,
      formulaId: filtroFormulaId,
    }
  }

  function handleFiltrar(formData: Record<string, string>) {
    const inicio = formData.dataInicio ?? ""
    const fim    = formData.dataFim    ?? ""
    const mesMin = formData.mesesMin   ?? ""
    const mesMax = formData.mesesMax   ?? ""
    setFiltroInicio(inicio)
    setFiltroFim(fim)
    setFiltroMesMin(mesMin)
    setFiltroMesMax(mesMax)
    setPage(0)
    load({ pessoaId: filtroPessoaId, inicio, fim, mesMin, mesMax, formulaId: filtroFormulaId }, 0)
  }

  function handleLimpar() {
    setFiltroPessoaId("")
    setFiltroInicio("")
    setFiltroFim("")
    setFiltroMesMin("")
    setFiltroMesMax("")
    setFiltroFormulaId("")
    setPage(0)
    load({ pessoaId: "", inicio: "", fim: "", mesMin: "", mesMax: "", formulaId: "" }, 0)
  }

  async function fetchTodos(f: Filtros): Promise<AvaliacaoPediatricaResponse[]> {
    const params = new URLSearchParams()
    if (f.pessoaId)  params.append("pessoaId",        f.pessoaId)
    if (f.inicio)    params.append("dataInicio",      f.inicio)
    if (f.fim)       params.append("dataFim",         f.fim)
    if (f.mesMin)    params.append("mesesMin",        f.mesMin)
    if (f.mesMax)    params.append("mesesMax",        f.mesMax)
    if (f.formulaId) params.append("formulaLacteaId", f.formulaId)
    const res = await api.get(`/avaliacoes-pediatricas/export?${params.toString()}`)
    return res.data ?? []
  }

  function nomeArquivo(ext: string): string {
    return `avaliacoes_pediatricas_${hojeISO()}.${ext}`
  }

  async function handleExportarPdf() {
    const f = currentFiltros()
    try {
      const linhas = await fetchTodos(f)
      if (linhas.length === 0) { showMessage("warning", "Nenhuma avaliação para exportar"); return }
      const b64 = gerarPdfLista({
        titulo:      "AVALIAÇÕES PEDIÁTRICAS",
        dataEmissao: hojeISO(),
        filtros:     filtrosResumo(f),
        colunas:     EXPORT_COLS.map(c => ({ header: c.header, align: c.align })),
        linhas:      linhas.map(l => EXPORT_COLS.map(c => c.pdf(l))),
      })
      const link    = document.createElement("a")
      link.href     = `data:application/pdf;base64,${b64}`
      link.download = nomeArquivo("pdf")
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
      exportarCsv(
        nomeArquivo("csv"),
        EXPORT_COLS.map(c => c.header),
        linhas.map(l => EXPORT_COLS.map(c => c.csv(l))),
      )
    } catch {
      showMessage("error", "Erro ao gerar CSV")
    }
  }

  function handleExcluir(row: AvaliacaoPediatricaSummary) {
    ask(`Excluir a avaliação de "${row.pessoaNome}" em ${formatarData(row.dataAvaliacao)}?`, [
      { label: "Cancelar", variant: "cancel",  onClick: () => {} },
      { label: "Excluir",  variant: "confirm", onClick: async () => {
        try {
          await api.delete(`/avaliacoes-pediatricas/${row.id}`)
          showMessage("success", "Avaliação excluída com sucesso!")
          load()
        } catch {
          showMessage("error", "Erro ao excluir avaliação")
        }
      }},
    ])
  }

  return (
    <TPage title="Avaliações Pediátricas" breadcrumb={["Pediatria", "Avaliações"]}>
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
          <TCol flex={2}>
            <TCombo
              name        ="formulaLacteaId"
              label       ="Fórmula Láctea"
              width       ="50%"
              minWidth    ="200px"
              placeholder ="Filtrar por fórmula..."
              options     ={formulaOptions}
              defaultValue={filtroFormulaId}
              onChange    ={(v) => setFiltroFormulaId(v)}
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
        <TRow>
          <TCol flex={1}>
            <TEntry name="mesesMin" label="De (meses)" mask="numero"
              width="200px" defaultValue={filtroMesMin} onChange={setFiltroMesMin} />
          </TCol>
          <TCol flex={1}>
            <TEntry name="mesesMax" label="Até (meses)" mask="numero"
              width="200px" defaultValue={filtroMesMax} onChange={setFiltroMesMax} />
          </TCol>
          <TSpace />
        </TRow>
        <TFormFooter>
          <TFormActionsLeft>
            <TButton type="submit" label="Filtrar" />
            <TButton label="Limpar" variant="cancel" type="button" onClick={handleLimpar} />
          </TFormActionsLeft>
          <TFormActionsRight>
            <TButton label="PDF" variant="secondary" type="button"
              icon={<FaFilePdf />} onClick={handleExportarPdf} />
            <TButton label="CSV" variant="secondary" type="button"
              icon={<FaFileCsv />} onClick={handleExportarCsv} />
            <TButton label="Nova Avaliação" variant="new" type="button"
              onClick={() => navigate("/pediatria/avaliacoes/novo")} />
          </TFormActionsRight>
        </TFormFooter>
      </TForm>

      <TDataGrid
        data       ={data}
        columns    ={columns}
        keyField   ="id"
        loading    ={loading}
        emptyMessage="Nenhuma avaliação encontrada"
        onRowClick ={(row) => navigate(`/pediatria/avaliacoes/${row.id}`)}
        actionsWidth="100px"
        actions    ={(row) => (
          <>
            <TButton label="" variant="edit"
              onClick={(e) => { e?.stopPropagation(); navigate(`/pediatria/avaliacoes/${row.id}`) }} />
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
