import { useEffect, useState }                                    from "react"
import { useNavigate, useParams }                                  from "react-router-dom"
import axios                                                       from "axios"
import { api }                                                     from "../../services/api"
import type {
  RegistroDiarioUtiPayload,
  RegistroDiarioUtiResponse,
}                                                                  from "../../types/TerapiaNutricional"
import type { ErrorResponse }                                      from "../../types/ErrorResponse"
import { TPage }                                                   from "../../components/tpage"
import { TForm, TFormActionsLeft, TFormActionsRight, TFormFooter } from "../../components/tform"
import { TPanel }                                                  from "../../components/tpanel"
import { TRow }                                                    from "../../components/trow"
import { TCol }                                                    from "../../components/tcol"
import { TSpace }                                                  from "../../components/tspace"
import { TEntry }                                                  from "../../components/tentry"
import { TText }                                                   from "../../components/ttext"
import { TDate }                                                   from "../../components/tdate"
import { TDbCombo }                                                from "../../components/tdbcombo"
import { TButton }                                                 from "../../components/tbutton"
import { useMessage }                                              from "../../hooks/useMessage"
import { displayPessoa }                                           from "../../utils/pessoas"

function hoje(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function num(v: string): number | null {
  if (!v || v.trim() === "") return null
  const n = parseFloat(v.replace(",", "."))
  return Number.isNaN(n) ? null : n
}

function dv(v: number | null | undefined): string {
  return v != null ? String(v) : ""
}

function Resultado({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-(--text-muted)">{label}</span>
      <div className="flex items-center h-9.5 bg-(--bg-input) border border-(--border) rounded-md px-3 text-sm font-semibold text-(--text-primary) select-none">
        {value}
      </div>
    </div>
  )
}

export default function RegistroDiarioUtiForm() {
  const { id: idParam } = useParams<{ id: string }>()
  const navigate        = useNavigate()
  const { showMessage } = useMessage()
  const isEdit          = !!idParam

  const [loading,  setLoading]  = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [formKey,  setFormKey]  = useState(0)
  const [reg,      setReg]      = useState<RegistroDiarioUtiResponse | null>(null)

  const [pessoaId, setPessoaId] = useState("")
  const [dataVal,  setDataVal]  = useState(hoje())

  // Campos com cálculo derivado (live).
  const [volPrescrito, setVolPrescrito] = useState("")
  const [volRecebido,  setVolRecebido]  = useState("")
  const [cafeManha,    setCafeManha]    = useState("")
  const [lancheManha,  setLancheManha]  = useState("")
  const [almoco,       setAlmoco]       = useState("")
  const [lancheTarde,  setLancheTarde]  = useState("")
  const [jantar,       setJantar]       = useState("")
  const [ceia,         setCeia]         = useState("")

  useEffect(() => {
    if (!idParam) return
    setLoading(true)
    api.get<RegistroDiarioUtiResponse>(`/registros-diarios-uti/${idParam}`)
      .then(r => {
        const a = r.data
        setReg(a)
        setPessoaId(String(a.pessoaId))
        setDataVal(a.data)
        setVolPrescrito(dv(a.volPrescrito24h))
        setVolRecebido(dv(a.volRecebido24h))
        setCafeManha(dv(a.cafeManha))
        setLancheManha(dv(a.lancheManha))
        setAlmoco(dv(a.almoco))
        setLancheTarde(dv(a.lancheTarde))
        setJantar(dv(a.jantar))
        setCeia(dv(a.ceia))
        setFormKey(k => k + 1)
      })
      .catch(() => { showMessage("error", "Erro ao carregar registro"); navigate("/terapia-nutricional/acompanhamento") })
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idParam])

  // ── Derivados ──
  const vp = num(volPrescrito)
  const vr = num(volRecebido)
  const percRecebido = vp != null && vp > 0 && vr != null ? (vr / vp) * 100 : null

  const refeicoes = [cafeManha, lancheManha, almoco, lancheTarde, jantar, ceia].map(num).filter((v): v is number => v != null)
  const mediaIngestao = refeicoes.length > 0 ? refeicoes.reduce((a, b) => a + b, 0) / refeicoes.length : null

  async function handleSubmit(formData: Record<string, string>) {
    if (!pessoaId)            { showMessage("error", "Selecione o paciente"); return }
    if (!formData.data)       { showMessage("error", "Informe a data"); return }

    const payload: RegistroDiarioUtiPayload = {
      pessoaId:        parseInt(pessoaId),
      data:            formData.data,
      dieta:           formData.dieta?.trim() || null,
      hgt:             num(formData.hgt),
      vmO2:            num(formData.vmO2),
      pa:              formData.pa?.trim() || null,
      mg:              num(formData.mg),
      k:               num(formData.k),
      na:              num(formData.na),
      lact:            num(formData.lact),
      pcr:             num(formData.pcr),
      ph:              num(formData.ph),
      pco2:            num(formData.pco2),
      hco3:            num(formData.hco3),
      bh:              num(formData.bh),
      diurese:         num(formData.diurese),
      evacuacao:       formData.evacuacao?.trim() || null,
      percRecebidoNE:  num(formData.percRecebidoNE),
      volPrescrito24h: num(volPrescrito),
      volRecebido24h:  num(volRecebido),
      cafeManha:       num(cafeManha),
      lancheManha:     num(lancheManha),
      almoco:          num(almoco),
      lancheTarde:     num(lancheTarde),
      jantar:          num(jantar),
      ceia:            num(ceia),
      observacao:      formData.observacao?.trim() || null,
    }

    setSaving(true)
    try {
      if (isEdit) {
        await api.put(`/registros-diarios-uti/${idParam}`, payload)
        showMessage("success", "Registro atualizado com sucesso!")
      } else {
        await api.post<RegistroDiarioUtiResponse>("/registros-diarios-uti", payload)
        showMessage("success", "Registro criado com sucesso!")
      }
      navigate("/terapia-nutricional/acompanhamento")
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const d = err.response?.data as ErrorResponse
        showMessage("error", d?.erro ?? "Erro ao salvar registro")
      } else {
        showMessage("error", "Erro inesperado")
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <TPage title="Carregando..." breadcrumb={["Terapia Nutricional", "Acompanhamento"]}>
        <div className="flex justify-center py-12">
          <span className="w-6 h-6 border-2 border-(--accent) border-t-transparent rounded-full animate-spin" />
        </div>
      </TPage>
    )
  }

  return (
    <TPage
      title     ={isEdit ? "Editar Registro Diário" : "Novo Registro Diário"}
      breadcrumb={["Terapia Nutricional", "Acompanhamento", isEdit ? "Editar" : "Novo"]}
    >
      <TForm key={formKey} onSubmit={handleSubmit}>

        {/* ── Identificação ──────────────────────────────────────────────────── */}
        <TPanel title="Identificação">
          <TRow>
            <TCol flex={2}>
              <TDbCombo
                name        ="pessoaId"
                label       ="Paciente"
                url         ="/pessoas/select"
                valueField  ="id"
                displayField={displayPessoa}
                searchField ="nome"
                required
                value       ={pessoaId}
                onChange    ={(v) => setPessoaId(v)}
                placeholder ="Buscar paciente..."
                width="50%"
                minWidth="200px"
              />
            </TCol>
          </TRow>
          <TRow>
            <TCol flex={1}>
              <TDate name="data" label="Data" required defaultValue={dataVal} onChange={setDataVal} />
            </TCol>
          </TRow>
        </TPanel>

        {/* ── Dieta & TNE ────────────────────────────────────────────────────── */}
        <TPanel title="Dieta & TNE">
          <TRow>
            <TCol>
              <TEntry name="dieta" label="Dieta" placeholder="Ex: Enteral contínua" width="100%"
                defaultValue={reg?.dieta ?? ""} />
            </TCol>
          </TRow>
          <TRow>
            <TCol>
              <TEntry name="volPrescrito" label="Vol. prescrito 24h (ml)" placeholder="Ex: 1500" width="100%"
                mask="numerodecimal2" defaultValue={volPrescrito} onChange={setVolPrescrito} />
            </TCol>
            <TCol>
              <TEntry name="volRecebido" label="Vol. recebido 24h (ml)" placeholder="Ex: 1350" width="100%"
                mask="numerodecimal2" defaultValue={volRecebido} onChange={setVolRecebido} />
            </TCol>
            <TCol>
              <TEntry name="percRecebidoNE" label="% Recebido NE" placeholder="Ex: 90" width="100%"
                mask="numerodecimal2" defaultValue={dv(reg?.percRecebidoNE)} />
            </TCol>
            <TSpace />
          </TRow>
          <div className="border-t border-(--border) my-2" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Resultado label="% Recebido (calculado)"
              value={percRecebido != null ? `${percRecebido.toFixed(0)}%` : "—"} />
          </div>
        </TPanel>

        {/* ── Eletrólitos ────────────────────────────────────────────────────── */}
        <TPanel title="Eletrólitos">
          <TRow>
            <TCol>
              <TEntry name="mg"   label="Mg (mg/dL)"  placeholder="Ex: 2,0" width="100%" mask="numerodecimal2" defaultValue={dv(reg?.mg)} />
            </TCol>
            <TCol>
              <TEntry name="k"    label="K (mEq/L)"   placeholder="Ex: 4,0" width="100%" mask="numerodecimal2" defaultValue={dv(reg?.k)} />
            </TCol>
            <TCol>
              <TEntry name="na"   label="Na (mEq/L)"  placeholder="Ex: 140" width="100%" mask="numerodecimal2" defaultValue={dv(reg?.na)} />
            </TCol>
            <TCol>
              <TEntry name="lact" label="Lactato (mmol/L)" placeholder="Ex: 1,5" width="100%" mask="numerodecimal2" defaultValue={dv(reg?.lact)} />
            </TCol>
          </TRow>
        </TPanel>

        {/* ── Gasometria ─────────────────────────────────────────────────────── */}
        <TPanel title="Gasometria">
          <TRow>
            <TCol>
              <TEntry name="ph"   label="pH"          placeholder="Ex: 7,35" width="100%" mask="numerodecimal2" defaultValue={dv(reg?.ph)} />
            </TCol>
            <TCol>
              <TEntry name="pco2" label="pCO₂ (mmHg)" placeholder="Ex: 40" width="100%" mask="numerodecimal2" defaultValue={dv(reg?.pco2)} />
            </TCol>
            <TCol>
              <TEntry name="hco3" label="HCO₃ (mEq/L)" placeholder="Ex: 24" width="100%" mask="numerodecimal2" defaultValue={dv(reg?.hco3)} />
            </TCol>
            <TSpace />
          </TRow>
        </TPanel>

        {/* ── Balanço & Clínica ──────────────────────────────────────────────── */}
        <TPanel title="Balanço & Clínica">
          <TRow>
            <TCol>
              <TEntry name="hgt"  label="HGT (mg/dL)"  placeholder="Ex: 110" width="100%" mask="numerodecimal2" defaultValue={dv(reg?.hgt)} />
            </TCol>
            <TCol>
              <TEntry name="vmO2" label="VM / O₂ (%)"   placeholder="Ex: 40"  width="100%" mask="numerodecimal2" defaultValue={dv(reg?.vmO2)} />
            </TCol>
            <TCol>
              <TEntry name="pa"   label="PA (mmHg)"     placeholder="Ex: 120/80" width="100%" defaultValue={reg?.pa ?? ""} />
            </TCol>
            <TCol>
              <TEntry name="pcr"  label="PCR (mg/dL)" placeholder="Ex: 5,0" width="100%" mask="numerodecimal2" defaultValue={dv(reg?.pcr)} />
            </TCol>
          </TRow>
          <TRow>
            <TCol>
              <TEntry name="bh" label="Balanço hídrico (ml)" placeholder="Ex: -200" width="100%" mask="numerosinal" defaultValue={dv(reg?.bh)} />
            </TCol>
            <TCol>
              <TEntry name="diurese" label="Diurese (ml)" placeholder="Ex: 1200" width="100%" mask="numerodecimal2" defaultValue={dv(reg?.diurese)} />
            </TCol>
            <TCol>
              <TEntry name="evacuacao" label="Evacuação" placeholder="Ex: Presente" width="100%" defaultValue={reg?.evacuacao ?? ""} />
            </TCol>
            <TSpace />
          </TRow>
        </TPanel>

        {/* ── Ingestão Oral ──────────────────────────────────────────────────── */}
        <TPanel title="Ingestão Oral">
          <TRow>
            <TCol>
              <TEntry name="cafeManha"   label="Café da manhã (%)"  placeholder="0–100" width="100%" mask="numerodecimal2" defaultValue={cafeManha}   onChange={setCafeManha} />
            </TCol>
            <TCol>
              <TEntry name="lancheManha" label="Lanche da manhã (%)" placeholder="0–100" width="100%" mask="numerodecimal2" defaultValue={lancheManha} onChange={setLancheManha} />
            </TCol>
            <TCol>
              <TEntry name="almoco"      label="Almoço (%)"         placeholder="0–100" width="100%" mask="numerodecimal2" defaultValue={almoco}      onChange={setAlmoco} />
            </TCol>
          </TRow>
          <TRow>
            <TCol>
              <TEntry name="lancheTarde" label="Lanche da tarde (%)" placeholder="0–100" width="100%" mask="numerodecimal2" defaultValue={lancheTarde} onChange={setLancheTarde} />
            </TCol>
            <TCol>
              <TEntry name="jantar"      label="Jantar (%)"         placeholder="0–100" width="100%" mask="numerodecimal2" defaultValue={jantar}      onChange={setJantar} />
            </TCol>
            <TCol>
              <TEntry name="ceia"        label="Ceia (%)"           placeholder="0–100" width="100%" mask="numerodecimal2" defaultValue={ceia}        onChange={setCeia} />
            </TCol>
          </TRow>
          <div className="border-t border-(--border) my-2" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Resultado label="Média de ingestão oral"
              value={mediaIngestao != null ? `${mediaIngestao.toFixed(0)}%` : "—"} />
          </div>
        </TPanel>

        {/* ── Observações ────────────────────────────────────────────────────── */}
        <TPanel title="Observações">
          <TRow>
            <TCol>
              <TText name="observacao" label="Observações" width="100%" height="80px"
                placeholder="Observações adicionais sobre o registro..."
                defaultValue={reg?.observacao ?? ""} />
            </TCol>
          </TRow>
        </TPanel>

        <TFormFooter>
          <TFormActionsLeft>
            <TButton label="Voltar" variant="cancel" type="button"
              onClick={() => navigate("/terapia-nutricional/acompanhamento")} />
          </TFormActionsLeft>
          <TFormActionsRight>
            <TButton label="Salvar" variant="save" type="submit" loading={saving} />
          </TFormActionsRight>
        </TFormFooter>
      </TForm>
    </TPage>
  )
}
