import { useState, useEffect }                                    from "react"
import { useNavigate }                                            from "react-router-dom"
import { api }                                                    from "../../services/api"
import type { AvaliacaoFisicaSummary }                            from "../../types/AvaliacaoFisica"
import { OBJETIVO_LABELS }                                        from "../../types/AvaliacaoFisica"
import type { TDataGridColumn }                                   from "../../types/TDataGridColumn"
import { TPage }                                                  from "../../components/tpage"
import { TForm, TFormActionsLeft, TFormActionsRight, TFormFooter }from "../../components/tform"
import { TRow }                                                   from "../../components/trow"
import { TCol }                                                   from "../../components/tcol"
import { TDbCombo }                                               from "../../components/tdbcombo"
import { TDate }                                                  from "../../components/tdate"
import { TButton }                                                from "../../components/tbutton"
import { TDataGrid }                                              from "../../components/tdatagrid"
import { TDataGridFooter }                                        from "../../components/tdatagridfooter"
import { useMessage }                                             from "../../hooks/useMessage"
import { useQuestion }                                            from "../../hooks/useQuestion"
import { displayPessoa }                                          from "../../utils/pessoas"

function formatarData(iso: string): string {
  if (!iso) return "—"
  const [y, m, d] = iso.split("-")
  return `${d}/${m}/${y}`
}

function labelImc(imc: number | null): string {
  if (!imc) return "—"
  const v = Number(imc)
  if (v < 18.5) return "Abaixo do peso"
  if (v < 25)   return "Normal"
  if (v < 30)   return "Sobrepeso"
  return "Obesidade"
}

function corImc(imc: number | null): string {
  if (!imc) return "#94a3b8"
  const v = Number(imc)
  if (v < 18.5) return "#3b82f6"
  if (v < 25)   return "#22c55e"
  if (v < 30)   return "#f59e0b"
  return "#ef4444"
}

const columns: TDataGridColumn<AvaliacaoFisicaSummary>[] = [
  { label: "Data",     width: "110px",
    render: (row) => <span>{formatarData(row.dataAvaliacao)}</span> },
  { label: "Paciente / Aluno", field: "pessoaNome" },
  { label: "Peso",     width: "80px",  align: "center",
    render: (row) => <span>{Number(row.peso).toFixed(1)} kg</span> },
  { label: "Altura",   width: "80px",  align: "center",
    render: (row) => <span>{Number(row.altura).toFixed(0)} cm</span> },
  { label: "IMC",      width: "120px", align: "center",
    render: (row) => (
      <span className="flex flex-col items-center gap-0.5">
        <span style={{ color: corImc(row.imc) }} className="font-semibold">
          {row.imc ? Number(row.imc).toFixed(1) : "—"}
        </span>
        <span className="text-xs text-gray-500">{labelImc(row.imc)}</span>
      </span>
    ) },
  { label: "Objetivo", width: "180px",
    render: (row) => <span>{OBJETIVO_LABELS[row.objetivo]}</span> },
  { label: "Status",   width: "90px",  align: "center",
    render: (row) => (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium text-white ${row.ativo ? "bg-green-500" : "bg-red-400"}`}>
        {row.ativo ? "Ativo" : "Inativo"}
      </span>
    ) },
]

export default function AvaliacaoFisicaList() {
  const navigate        = useNavigate()
  const { showMessage } = useMessage()
  const { ask }         = useQuestion()

  const [filtroPessoaId, setFiltroPessoaId] = useState("")
  const [filtroInicio,   setFiltroInicio]   = useState("")
  const [filtroFim,      setFiltroFim]      = useState("")
  const [data,           setData]           = useState<AvaliacaoFisicaSummary[]>([])
  const [loading,        setLoading]        = useState(false)
  const [page,           setPage]           = useState(0)
  const [totalPages,     setTotalPages]     = useState(0)
  const [totalElements,  setTotalElements]  = useState(0)
  const pageSize = 15

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [page])

  async function load(
    pessoaId  = filtroPessoaId,
    inicio    = filtroInicio,
    fim       = filtroFim,
    pagina    = page
  ) {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(pagina),
        size: String(pageSize),
        sort: "dataAvaliacao,desc",
      })
      if (pessoaId) params.append("pessoaId", pessoaId)
      if (inicio)   params.append("dataInicio", inicio)
      if (fim)      params.append("dataFim",    fim)
      const res = await api.get(`/avaliacoes-fisicas?${params.toString()}`)
      setData(res.data.content ?? [])
      setTotalPages(res.data.totalPages ?? 1)
      setTotalElements(res.data.totalElements ?? 0)
    } catch {
      showMessage("error", "Erro ao carregar avaliações físicas")
    } finally {
      setLoading(false)
    }
  }

  function handleFiltrar(formData: Record<string, string>) {
    setFiltroInicio(formData.dataInicio ?? "")
    setFiltroFim(formData.dataFim ?? "")
    setPage(0)
    load(filtroPessoaId, formData.dataInicio ?? "", formData.dataFim ?? "", 0)
  }

  function handleLimpar() {
    setFiltroPessoaId("")
    setFiltroInicio("")
    setFiltroFim("")
    setPage(0)
    load("", "", "", 0)
  }

  function handleExcluir(row: AvaliacaoFisicaSummary) {
    ask(`Excluir a avaliação de "${row.pessoaNome}" em ${formatarData(row.dataAvaliacao)}?`, [
      { label: "Cancelar", variant: "cancel",  onClick: () => {} },
      { label: "Excluir",  variant: "confirm", onClick: async () => {
        try {
          await api.delete(`/avaliacoes-fisicas/${row.id}`)
          showMessage("success", "Avaliação excluída com sucesso!")
          load()
        } catch {
          showMessage("error", "Erro ao excluir avaliação")
        }
      }},
    ])
  }

  return (
    <TPage
      title  ="Avaliações Físicas"
      breadcrumb={["Avaliação Física", "Avaliações"]}
    >
      <TForm onSubmit={handleFiltrar}>
        <TRow>
          <TCol flex={2}>
            <TDbCombo
              name         ="pessoaId"
              label        ="Paciente / Aluno"
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
            <TDate
              name        ="dataInicio"
              label       ="Data Inicial"
              defaultValue={filtroInicio}
            />
          </TCol>
          <TCol flex={1}>
            <TDate
              name        ="dataFim"
              label       ="Data Final"
              defaultValue={filtroFim}
            />
          </TCol>
        </TRow>
        <TFormFooter>
          <TFormActionsLeft>
            <TButton type="submit" label="Filtrar" />
            <TButton label="Limpar" variant="cancel" type="button" onClick={handleLimpar} />
          </TFormActionsLeft>
          <TFormActionsRight>
            <TButton label="Nova Avaliação" variant="new" type="button"
              onClick={() => navigate("/avaliacao/avaliacoes-fisicas/novo")} />
          </TFormActionsRight>
        </TFormFooter>
      </TForm>

      <TDataGrid
        data     ={data}
        columns  ={columns}
        keyField ="id"
        loading  ={loading}
        onRowClick={(row) => navigate(`/avaliacao/avaliacoes-fisicas/${row.id}`)}
        actions  ={(row) => (
          <>
            <TButton label="Evolução" variant="secondary" onClick={(e) => { e?.stopPropagation(); navigate(`/avaliacao/avaliacoes-fisicas/evolucao/${row.pessoaId}`) }} />
            <TButton label="" variant="delete"    onClick={(e) => { e?.stopPropagation(); handleExcluir(row) }} />
          </>
        )}
      />
      <TDataGridFooter
        page         ={page}
        totalPages   ={totalPages}
        totalElements={totalElements}
        pageSize     ={pageSize}
        onPageChange ={(p) => setPage(p)}
      />
    </TPage>
  )
}
