import { useState, useEffect }                                    from "react"
import { FaFilePdf, FaFileCsv }                                    from "react-icons/fa"
import { useNavigate }                                            from "react-router-dom"
import { api }                                                     from "../../services/api"
import type { AvaliacaoPediatricaSummary }                         from "../../types/Pediatria"
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
import { gerarPdfAvaliacoesPediatricas }                          from "../../utils/geradorPdf"

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
  { label: "Idade (sem.)", width: "110px", align: "center",
    render: (row) => <span>{row.idadeSemanas != null ? `${row.idadeSemanas}` : "—"}</span> },
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

export default function AvaliacaoPediatricaList() {
  const navigate        = useNavigate()
  const { showMessage } = useMessage()
  const { ask }         = useQuestion()

  const [filtroPessoaId, setFiltroPessoaId] = useState("")
  const [filtroInicio,   setFiltroInicio]   = useState("")
  const [filtroFim,      setFiltroFim]      = useState("")
  const [filtroSemMin,   setFiltroSemMin]   = useState("")
  const [filtroSemMax,   setFiltroSemMax]   = useState("")
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
    semMin:    string
    semMax:    string
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
    if (f.semMin)    params.append("semanasMin",     f.semMin)
    if (f.semMax)    params.append("semanasMax",     f.semMax)
    if (f.formulaId) params.append("formulaLacteaId", f.formulaId)
    return params
  }

  function filtrosResumo(f: Filtros): string {
    const partes: string[] = []
    if (f.inicio || f.fim) partes.push(`Período: ${f.inicio ? formatarData(f.inicio) : "..."} a ${f.fim ? formatarData(f.fim) : "..."}`)
    if (f.semMin || f.semMax) partes.push(`Semanas: ${f.semMin || "..."} a ${f.semMax || "..."}`)
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
      semMin:    filtroSemMin,
      semMax:    filtroSemMax,
      formulaId: filtroFormulaId,
    }
  }

  function handleFiltrar(formData: Record<string, string>) {
    const inicio = formData.dataInicio ?? ""
    const fim    = formData.dataFim    ?? ""
    const semMin = formData.semanasMin ?? ""
    const semMax = formData.semanasMax ?? ""
    setFiltroInicio(inicio)
    setFiltroFim(fim)
    setFiltroSemMin(semMin)
    setFiltroSemMax(semMax)
    setPage(0)
    load({ pessoaId: filtroPessoaId, inicio, fim, semMin, semMax, formulaId: filtroFormulaId }, 0)
  }

  function handleLimpar() {
    setFiltroPessoaId("")
    setFiltroInicio("")
    setFiltroFim("")
    setFiltroSemMin("")
    setFiltroSemMax("")
    setFiltroFormulaId("")
    setPage(0)
    load({ pessoaId: "", inicio: "", fim: "", semMin: "", semMax: "", formulaId: "" }, 0)
  }

  async function fetchTodos(f: Filtros): Promise<AvaliacaoPediatricaSummary[]> {
    const params = buildParams(f, 0, 1000)
    const res = await api.get(`/avaliacoes-pediatricas?${params.toString()}`)
    return res.data.content ?? []
  }

  function nomeArquivo(ext: string): string {
    return `avaliacoes_pediatricas_${hojeISO()}.${ext}`
  }

  async function handleExportarPdf() {
    const f = currentFiltros()
    try {
      const linhas = await fetchTodos(f)
      if (linhas.length === 0) { showMessage("warning", "Nenhuma avaliação para exportar"); return }
      const b64 = gerarPdfAvaliacoesPediatricas({
        dataEmissao: hojeISO(),
        filtros:     filtrosResumo(f),
        linhas: linhas.map(l => ({
          dataAvaliacao:   l.dataAvaliacao,
          pessoaNome:      l.pessoaNome,
          idadeMeses:      l.idadeMeses,
          idadeSemanas:    l.idadeSemanas,
          peso:            l.peso,
          imc:             l.imc,
          classifImcIdade: l.classifImcIdade,
          formulaNome:     l.formulaNome,
        })),
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

      const aspas = (v: string) => `"${v.replace(/"/g, '""')}"`
      const numCsv = (v: number | null, dec = 1) =>
        v == null || Number.isNaN(Number(v)) ? "" : Number(v).toFixed(dec).replace(".", ",")
      const intCsv = (v: number | null) => v == null ? "" : String(v)

      const header = ["Data", "Paciente", "Idade (meses)", "Idade (semanas)", "Peso (kg)", "IMC", "Classif. IMC", "Fórmula"]
      const rows = linhas.map(l => [
        aspas(formatarData(l.dataAvaliacao)),
        aspas(l.pessoaNome ?? ""),
        intCsv(l.idadeMeses),
        intCsv(l.idadeSemanas),
        numCsv(l.peso, 1),
        numCsv(l.imc, 1),
        aspas(l.classifImcIdade ?? ""),
        aspas(l.formulaNome ?? ""),
      ].join(";"))

      const conteudo = "﻿" + [header.map(aspas).join(";"), ...rows].join("\r\n")
      const blob = new Blob([conteudo], { type: "text/csv;charset=utf-8" })
      const link = document.createElement("a")
      link.href     = URL.createObjectURL(blob)
      link.download = nomeArquivo("csv")
      link.click()
      URL.revokeObjectURL(link.href)
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
            />
          </TCol>
          <TCol flex={1}>
            <TDate name="dataInicio" label="Data Inicial" defaultValue={filtroInicio} />
          </TCol>
          <TCol flex={1}>
            <TDate name="dataFim" label="Data Final" defaultValue={filtroFim} />
          </TCol>
        </TRow>
        <TRow>
          <TCol flex={2}>
            <TCombo
              name        ="formulaLacteaId"
              label       ="Fórmula Láctea"
              width       ="100%"
              placeholder ="Filtrar por fórmula..."
              options     ={formulaOptions}
              defaultValue={filtroFormulaId}
              onChange    ={(v) => setFiltroFormulaId(v)}
            />
          </TCol>
          <TCol flex={1}>
            <TEntry name="semanasMin" label="De (semanas)" mask="numero"
              width="100%" defaultValue={filtroSemMin} onChange={setFiltroSemMin} />
          </TCol>
          <TCol flex={1}>
            <TEntry name="semanasMax" label="Até (semanas)" mask="numero"
              width="100%" defaultValue={filtroSemMax} onChange={setFiltroSemMax} />
          </TCol>
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
