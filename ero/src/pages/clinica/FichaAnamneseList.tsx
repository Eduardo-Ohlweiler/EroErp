import { useState, useEffect }                         from "react"
import { useNavigate }                                 from "react-router-dom"
import { api }                                         from "../../services/api"
import type { FichaAnamnesesSummary }                  from "../../types/Anamnese"
import type { TDataGridColumn }                        from "../../types/TDataGridColumn"
import { TPage }                                       from "../../components/tpage"
import { TForm, TFormActionsLeft, TFormFooter }        from "../../components/tform"
import { TRow }                                        from "../../components/trow"
import { TCol }                                        from "../../components/tcol"
import { TDbCombo }                                    from "../../components/tdbcombo"
import { TCombo }                                      from "../../components/tcombo"
import { TButton }                                     from "../../components/tbutton"
import { TDataGrid }                                   from "../../components/tdatagrid"
import { TDataGridFooter }                             from "../../components/tdatagridfooter"
import { useMessage }                                  from "../../hooks/useMessage"
import { useQuestion }                                 from "../../hooks/useQuestion"
import { displayPessoa }                               from "../../utils/pessoas"
import { FINALIDADE_LABEL, FINALIDADE_OPTIONS }        from "../../utils/anamnese"

function fmtData(iso: string) {
  if (!iso) return "—"
  const [y, m, d] = iso.split("-")
  return `${d}/${m}/${y}`
}

const columns: TDataGridColumn<FichaAnamnesesSummary>[] = [
  { label: "Data",         width: "110px",
    render: (row) => <span>{fmtData(row.dataPreenchimento)}</span> },
  { label: "Paciente",     field: "pessoaNome" },
  { label: "Especialidade", width: "150px",
    render: (row) => <span>{FINALIDADE_LABEL[row.finalidade]}</span> },
  { label: "Template",     field: "templateNome" },
  { label: "Emitente",     width: "180px",
    render: (row) => <span>{row.emitenteNome ?? "—"}</span> },
]

export default function FichaAnamneseList() {
  const navigate        = useNavigate()
  const { showMessage } = useMessage()
  const { ask }         = useQuestion()

  const [filtroPessoaId,  setFiltroPessoaId]  = useState("")
  const [filtroFinalidade, setFiltroFinalidade] = useState("")
  const [data,            setData]            = useState<FichaAnamnesesSummary[]>([])
  const [loading,         setLoading]         = useState(false)
  const [page,            setPage]            = useState(0)
  const [totalPages,      setTotalPages]      = useState(0)
  const [totalElements,   setTotalElements]   = useState(0)
  const pageSize = 15

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [page])

  async function load(
    pessoaId   = filtroPessoaId,
    finalidade = filtroFinalidade,
    pagina     = page
  ) {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(pagina), size: String(pageSize) })
      if (pessoaId)   params.append("pessoaId",   pessoaId)
      if (finalidade) params.append("finalidade", finalidade)
      const res = await api.get(`/fichas-anamnese?${params.toString()}`)
      setData(res.data.content ?? [])
      setTotalPages(res.data.totalPages ?? 1)
      setTotalElements(res.data.totalElements ?? 0)
    } catch {
      showMessage("error", "Erro ao carregar fichas de anamnese")
    } finally {
      setLoading(false)
    }
  }

  function handleFiltrar(formData: Record<string, string>) {
    setFiltroFinalidade(formData.finalidade ?? "")
    setPage(0)
    load(filtroPessoaId, formData.finalidade ?? "", 0)
  }

  function handleLimpar() {
    setFiltroPessoaId("")
    setFiltroFinalidade("")
    setPage(0)
    load("", "", 0)
  }

  function handleExcluir(row: FichaAnamnesesSummary) {
    ask(`Excluir a ficha de anamnese de "${row.pessoaNome}" (${fmtData(row.dataPreenchimento)})?`, [
      { label: "Cancelar", variant: "cancel",  onClick: () => {} },
      { label: "Excluir",  variant: "confirm", onClick: async () => {
        try {
          await api.delete(`/fichas-anamnese/${row.id}`)
          showMessage("success", "Ficha de anamnese excluída com sucesso!")
          load()
        } catch (err) {
          const data = (err as { response?: { data?: { erro?: string } } })?.response?.data
          showMessage("error", data?.erro ?? "Erro ao excluir ficha de anamnese")
        }
      }},
    ])
  }

  return (
    <TPage title="Fichas de Anamnese" breadcrumb={["Clínica", "Fichas de Anamnese"]}>
      <TForm onSubmit={handleFiltrar}>
        <TRow>
          <TCol>
            <TDbCombo
              name         ="pessoaId"
              label        ="Paciente"
              url          ="/pessoas/select"
              valueField   ="id"
              displayField ={displayPessoa}
              searchField  ="nome"
              placeholder  ="Todos os pacientes..."
              width        ="100%"
              value        ={filtroPessoaId}
              onChange     ={(val) => setFiltroPessoaId(val)}
            />
          </TCol>
        </TRow>
        <TRow>
          <TCol>
            <TCombo
              name        ="finalidade"
              label       ="Especialidade"
              width       ="100%"
              defaultValue={filtroFinalidade}
              options     ={[{ value: "", label: "Todas" }, ...FINALIDADE_OPTIONS]}
            />
          </TCol>
        </TRow>
        <TFormFooter>
          <TFormActionsLeft>
            <TButton type="submit" label="Filtrar" />
            <TButton label="Limpar" variant="cancel" type="button" onClick={handleLimpar} />
            <TButton label="Nova Ficha" variant="new" type="button"
              onClick={() => navigate("/clinica/fichas-anamnese/nova")} />
          </TFormActionsLeft>
        </TFormFooter>
      </TForm>

      <TDataGrid
        columns      ={columns}
        data         ={data}
        keyField     ="id"
        loading      ={loading}
        emptyMessage ="Nenhuma ficha encontrada"
        onRowClick   ={(row) => navigate(`/clinica/fichas-anamnese/${row.id}`)}
        actionsWidth ="100px"
        actions      ={(row) => (
          <>
            <TButton label="" variant="edit"
              onClick={(e) => { e?.stopPropagation(); navigate(`/clinica/fichas-anamnese/${row.id}`) }} />
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
