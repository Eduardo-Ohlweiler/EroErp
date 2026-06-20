import { useState, useEffect }                                    from "react"
import { FaFilePdf, FaFileCsv }                                    from "react-icons/fa"
import { useNavigate }                                            from "react-router-dom"
import { api }                                                     from "../../services/api"
import type { RegistroDiarioUtiSummary, RegistroDiarioUtiResponse } from "../../types/TerapiaNutricional"
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

function formatarData(iso: string): string {
  if (!iso) return "—"
  const [y, m, d] = iso.split("-")
  return `${d}/${m}/${y}`
}

function hojeISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

// Média das 6 refeições (% de ingestão oral), ignorando valores nulos.
function mediaRefeicoes(r: RegistroDiarioUtiResponse): number | null {
  const vals = [r.cafeManha, r.lancheManha, r.almoco, r.lancheTarde, r.jantar, r.ceia]
    .filter((v): v is number => v != null && !Number.isNaN(Number(v)))
    .map(Number)
  if (vals.length === 0) return null
  return vals.reduce((acc, v) => acc + v, 0) / vals.length
}

// Formatadores para exportação (CSV usa vírgula decimal; "" para nulos).
function pdfNum(v: number | null, dec = 1): string {
  return v == null || Number.isNaN(Number(v)) ? "—" : Number(v).toFixed(dec)
}
function csvNum(v: number | null, dec = 1): string {
  return v == null || Number.isNaN(Number(v)) ? "" : Number(v).toFixed(dec).replace(".", ",")
}
// Campos textuais (hgt/vmO2/pa/evacuacao chegam como string no /export). Coage com segurança.
function pdfTxt(v: unknown): string {
  return v == null || v === "" ? "—" : String(v)
}
function csvTxt(v: unknown): string {
  return v == null ? "" : String(v)
}

function corPerc(v: number | null): string {
  if (v == null) return "#94a3b8"
  if (v >= 90) return "#22c55e"
  if (v >= 70) return "#f59e0b"
  return "#ef4444"
}

const columns: TDataGridColumn<RegistroDiarioUtiSummary>[] = [
  { label: "Data", width: "110px",
    render: (row) => <span>{formatarData(row.data)}</span> },
  { label: "Paciente", field: "pessoaNome" },
  { label: "Dieta", field: "dieta",
    render: (row) => <span>{row.dieta ?? "—"}</span> },
  { label: "% Recebido", width: "120px", align: "center",
    render: (row) => (
      <span className="font-semibold" style={{ color: corPerc(row.percRecebido) }}>
        {row.percRecebido != null ? `${Number(row.percRecebido).toFixed(0)}%` : "—"}
      </span>
    ) },
]

// Descritor das colunas de exportação — mantém PDF e CSV em sincronia (mesmo
// cabeçalho/ordem). `pdf` usa "—" para nulos; `csv` usa "" e vírgula decimal.
interface ColExport {
  header: string
  align?: "left" | "right" | "center"
  pdf:    (r: RegistroDiarioUtiResponse) => string
  csv:    (r: RegistroDiarioUtiResponse) => string
}

const colunasExport: ColExport[] = [
  { header: "Data",            pdf: r => formatarData(r.data),    csv: r => formatarData(r.data) },
  { header: "Paciente",        pdf: r => pdfTxt(r.pessoaNome),    csv: r => csvTxt(r.pessoaNome) },
  { header: "Dieta",           pdf: r => pdfTxt(r.dieta),         csv: r => csvTxt(r.dieta) },
  { header: "Vol. prescrito (ml)", align: "right", pdf: r => pdfNum(r.volPrescrito24h, 0), csv: r => csvNum(r.volPrescrito24h, 0) },
  { header: "Vol. recebido (ml)",  align: "right", pdf: r => pdfNum(r.volRecebido24h, 0),  csv: r => csvNum(r.volRecebido24h, 0) },
  { header: "% Recebido NE",   align: "right", pdf: r => pdfNum(r.percRecebidoNE, 0), csv: r => csvNum(r.percRecebidoNE, 0) },
  { header: "HGT",             align: "right", pdf: r => pdfTxt(r.hgt),  csv: r => csvTxt(r.hgt) },
  { header: "VM/O2",           pdf: r => pdfTxt(r.vmO2), csv: r => csvTxt(r.vmO2) },
  { header: "PA",              pdf: r => pdfTxt(r.pa),   csv: r => csvTxt(r.pa) },
  { header: "Mg",              align: "right", pdf: r => pdfNum(r.mg, 1),   csv: r => csvNum(r.mg, 1) },
  { header: "K",               align: "right", pdf: r => pdfNum(r.k, 1),    csv: r => csvNum(r.k, 1) },
  { header: "Na",              align: "right", pdf: r => pdfNum(r.na, 0),   csv: r => csvNum(r.na, 0) },
  { header: "Lactato",         align: "right", pdf: r => pdfNum(r.lact, 1), csv: r => csvNum(r.lact, 1) },
  { header: "PCR",             align: "right", pdf: r => pdfNum(r.pcr, 1),  csv: r => csvNum(r.pcr, 1) },
  { header: "pH",              align: "right", pdf: r => pdfNum(r.ph, 2),   csv: r => csvNum(r.ph, 2) },
  { header: "pCO2",            align: "right", pdf: r => pdfNum(r.pco2, 1), csv: r => csvNum(r.pco2, 1) },
  { header: "HCO3",            align: "right", pdf: r => pdfNum(r.hco3, 1), csv: r => csvNum(r.hco3, 1) },
  { header: "BH (ml)",         align: "right", pdf: r => pdfNum(r.bh, 0),      csv: r => csvNum(r.bh, 0) },
  { header: "Diurese (ml)",    align: "right", pdf: r => pdfNum(r.diurese, 0), csv: r => csvNum(r.diurese, 0) },
  { header: "Evacuação",       pdf: r => pdfTxt(r.evacuacao), csv: r => csvTxt(r.evacuacao) },
  { header: "Café (%)",        align: "right", pdf: r => pdfNum(r.cafeManha, 0),   csv: r => csvNum(r.cafeManha, 0) },
  { header: "Lanche manhã (%)", align: "right", pdf: r => pdfNum(r.lancheManha, 0), csv: r => csvNum(r.lancheManha, 0) },
  { header: "Almoço (%)",      align: "right", pdf: r => pdfNum(r.almoco, 0),      csv: r => csvNum(r.almoco, 0) },
  { header: "Lanche tarde (%)", align: "right", pdf: r => pdfNum(r.lancheTarde, 0), csv: r => csvNum(r.lancheTarde, 0) },
  { header: "Jantar (%)",      align: "right", pdf: r => pdfNum(r.jantar, 0),      csv: r => csvNum(r.jantar, 0) },
  { header: "Ceia (%)",        align: "right", pdf: r => pdfNum(r.ceia, 0),        csv: r => csvNum(r.ceia, 0) },
  { header: "Média refeições (%)", align: "right", pdf: r => pdfNum(mediaRefeicoes(r), 0), csv: r => csvNum(mediaRefeicoes(r), 0) },
]

export default function RegistroDiarioUtiList() {
  const navigate        = useNavigate()
  const { showMessage } = useMessage()
  const { ask }         = useQuestion()

  const [filtroPessoaId, setFiltroPessoaId] = useState("")
  const [filtroInicio,   setFiltroInicio]   = useState("")
  const [filtroFim,      setFiltroFim]      = useState("")
  const [data,           setData]           = useState<RegistroDiarioUtiSummary[]>([])
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
        sort: "data,desc",
      })
      if (f.pessoaId) params.append("pessoaId",   f.pessoaId)
      if (f.inicio)   params.append("dataInicio", f.inicio)
      if (f.fim)      params.append("dataFim",    f.fim)
      const res = await api.get(`/registros-diarios-uti?${params.toString()}`)
      setData(res.data.content ?? [])
      setTotalPages(res.data.totalPages ?? 1)
      setTotalElements(res.data.totalElements ?? 0)
    } catch {
      showMessage("error", "Erro ao carregar registros diários")
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

  async function fetchTodos(f: Filtros): Promise<RegistroDiarioUtiResponse[]> {
    const params = new URLSearchParams()
    if (f.pessoaId) params.append("pessoaId",   f.pessoaId)
    if (f.inicio)   params.append("dataInicio", f.inicio)
    if (f.fim)      params.append("dataFim",    f.fim)
    const qs  = params.toString()
    const res = await api.get(`/registros-diarios-uti/export${qs ? `?${qs}` : ""}`)
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
      if (linhas.length === 0) { showMessage("warning", "Nenhum registro para exportar"); return }
      const b64 = gerarPdfLista({
        titulo:      "ACOMPANHAMENTO DIÁRIO (UTI)",
        dataEmissao: hojeISO(),
        filtros:     filtrosResumo(f),
        colunas:     colunasExport.map(c => ({ header: c.header, align: c.align })),
        linhas:      linhas.map(l => colunasExport.map(c => c.pdf(l))),
      })
      const link    = document.createElement("a")
      link.href     = `data:application/pdf;base64,${b64}`
      link.download = `registros_diarios_uti_${hojeISO()}.pdf`
      link.click()
    } catch {
      showMessage("error", "Erro ao gerar PDF")
    }
  }

  async function handleExportarCsv() {
    const f = currentFiltros()
    try {
      const linhas = await fetchTodos(f)
      if (linhas.length === 0) { showMessage("warning", "Nenhum registro para exportar"); return }
      const headers = colunasExport.map(c => c.header)
      const rows    = linhas.map(l => colunasExport.map(c => c.csv(l)))
      exportarCsv(`registros_diarios_uti_${hojeISO()}.csv`, headers, rows)
    } catch {
      showMessage("error", "Erro ao gerar CSV")
    }
  }

  function handleExcluir(row: RegistroDiarioUtiSummary) {
    ask(`Excluir o registro de "${row.pessoaNome}" em ${formatarData(row.data)}?`, [
      { label: "Cancelar", variant: "cancel",  onClick: () => {} },
      { label: "Excluir",  variant: "confirm", onClick: async () => {
        try {
          await api.delete(`/registros-diarios-uti/${row.id}`)
          showMessage("success", "Registro excluído com sucesso!")
          load()
        } catch {
          showMessage("error", "Erro ao excluir registro")
        }
      }},
    ])
  }

  return (
    <TPage title="Acompanhamento Diário (UTI)" breadcrumb={["Terapia Nutricional", "Acompanhamento"]}>
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
            />
          </TCol>
          <TCol flex={1}>
            <TDate name="dataInicio" label="Data Inicial" defaultValue={filtroInicio} />
          </TCol>
          <TCol flex={1}>
            <TDate name="dataFim" label="Data Final" defaultValue={filtroFim} />
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
            <TButton label="Novo Registro" variant="new" type="button"
              onClick={() => navigate("/terapia-nutricional/acompanhamento/novo")} />
          </TFormActionsRight>
        </TFormFooter>
      </TForm>

      <TDataGrid
        data        ={data}
        columns     ={columns}
        keyField    ="id"
        loading     ={loading}
        emptyMessage="Nenhum registro encontrado"
        onRowClick  ={(row) => navigate(`/terapia-nutricional/acompanhamento/${row.id}`)}
        actionsWidth="100px"
        actions     ={(row) => (
          <>
            <TButton label="" variant="edit"
              onClick={(e) => { e?.stopPropagation(); navigate(`/terapia-nutricional/acompanhamento/${row.id}`) }} />
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
