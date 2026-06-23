import { useState, useEffect }                  from "react"
import { api }                                   from "../../services/api"
import type { CreditoMovimento, TipoCredito }    from "../../types/Credito"
import type { TDataGridColumn }                  from "../../types/TDataGridColumn"
import { TPage }                                 from "../../components/tpage"
import { TForm, TFormActionsLeft, TFormFooter }  from "../../components/tform"
import { TRow }                                  from "../../components/trow"
import { TCol }                                  from "../../components/tcol"
import { TDbCombo }                              from "../../components/tdbcombo"
import { TButton }                               from "../../components/tbutton"
import { TDataGrid }                             from "../../components/tdatagrid"
import { TDataGridFooter }                       from "../../components/tdatagridfooter"
import { useMessage }                            from "../../hooks/useMessage"
import { displayPessoa }                         from "../../utils/pessoas"

const TIPO_LABEL: Record<TipoCredito, string> = { ENTRADA: "Crédito", USO: "Uso" }
const TIPO_COLOR: Record<TipoCredito, string> = { ENTRADA: "bg-green-500", USO: "bg-orange-500" }

function fmtMoeda(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}
function fmtDataHora(iso: string | null) {
  if (!iso) return "—"
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const columns: TDataGridColumn<CreditoMovimento>[] = [
  { label: "Data", width: "160px", render: r => <span>{fmtDataHora(r.data)}</span> },
  { label: "Tipo", width: "110px", align: "center",
    render: r => (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium text-white ${TIPO_COLOR[r.tipo]}`}>
        {TIPO_LABEL[r.tipo]}
      </span>
    ) },
  { label: "Valor", width: "140px", align: "right",
    render: r => (
      <span className={r.tipo === "ENTRADA" ? "text-green-600 font-medium" : "text-orange-600 font-medium"}>
        {r.tipo === "ENTRADA" ? "+ " : "− "}{fmtMoeda(r.valor)}
      </span>
    ) },
  { label: "Origem", field: "origem", render: r => <span>{r.origem ?? "—"}</span> },
]

export default function CreditoClienteList() {
  const { showMessage } = useMessage()

  const [pessoaId,      setPessoaId]      = useState("")
  const [saldo,         setSaldo]         = useState<number | null>(null)
  const [data,          setData]          = useState<CreditoMovimento[]>([])
  const [loading,       setLoading]       = useState(false)
  const [page,          setPage]          = useState(0)
  const [totalPages,    setTotalPages]    = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const pageSize = 20

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (pessoaId) load(pessoaId, page) }, [page])

  async function load(pessoa = pessoaId, pagina = page) {
    if (!pessoa) {
      setSaldo(null); setData([]); setTotalPages(0); setTotalElements(0)
      return
    }
    setLoading(true)
    try {
      const [saldoRes, movRes] = await Promise.all([
        api.get(`/creditos/saldo?pessoaId=${pessoa}`),
        api.get(`/creditos?pessoaId=${pessoa}&page=${pagina}&size=${pageSize}`),
      ])
      setSaldo(Number(saldoRes.data?.saldo) || 0)
      setData(movRes.data.content ?? [])
      setTotalPages(movRes.data.totalPages ?? 1)
      setTotalElements(movRes.data.totalElements ?? 0)
    } catch {
      showMessage("error", "Erro ao carregar créditos do cliente")
    } finally {
      setLoading(false)
    }
  }

  function handleConsultar() {
    setPage(0)
    load(pessoaId, 0)
  }

  return (
    <TPage title="Créditos de Clientes" breadcrumb={["Pedidos", "Créditos de Clientes"]}>
      <TForm onSubmit={handleConsultar}>
        <TRow>
          <TCol>
            <TDbCombo
              name         ="pessoaId"
              label        ="Cliente"
              url          ="/pessoas/select"
              valueField   ="id"
              displayField ={displayPessoa}
              searchField  ="nome"
              placeholder  ="Selecione o cliente..."
              width        ="50%"
              minWidth     ="220px"
              value        ={pessoaId}
              onChange     ={(val) => setPessoaId(val)}
            />
          </TCol>
        </TRow>
        <TFormFooter>
          <TFormActionsLeft>
            <TButton type="submit" label="Consultar" />
          </TFormActionsLeft>
        </TFormFooter>
      </TForm>

      {saldo !== null && (
        <div className="my-4 p-4 rounded-lg border border-(--border) bg-(--surface-secondary) flex items-center gap-2">
          <span className="text-sm text-(--text-muted)">Saldo de crédito disponível:</span>
          <span className={`text-xl font-bold ${saldo > 0 ? "text-green-600" : "text-(--text-primary)"}`}>
            {fmtMoeda(saldo)}
          </span>
        </div>
      )}

      {pessoaId ? (
        <>
          <TDataGrid
            columns      ={columns}
            data         ={data}
            keyField     ="id"
            loading      ={loading}
            emptyMessage ="Nenhum movimento de crédito"
          />
          <TDataGridFooter
            page         ={page}
            totalPages   ={totalPages}
            totalElements={totalElements}
            pageSize     ={pageSize}
            onPageChange ={setPage}
          />
        </>
      ) : (
        <div className="text-sm text-(--text-muted) text-center py-10 rounded-lg border border-dashed border-(--border)">
          Selecione um cliente para ver o saldo e os movimentos de crédito.
        </div>
      )}
    </TPage>
  )
}
