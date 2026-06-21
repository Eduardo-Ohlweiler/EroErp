import { useEffect, useState }                                    from "react"
import { useNavigate, useParams }                                  from "react-router-dom"
import axios                                                       from "axios"
import { api }                                                     from "../../services/api"
import type {
  AudiometriaResponse,
  AudiometriaPayload,
  AudiometriaLimiar,
  OrelhaAudiometria,
  ViaAudiometria,
  GrauPerda,
  TipoPerda,
}                                                                  from "../../types/Otorrino"
import type { ErrorResponse }                                      from "../../types/ErrorResponse"
import { TPage }                                                   from "../../components/tpage"
import { TForm, TFormActionsLeft, TFormActionsRight, TFormFooter } from "../../components/tform"
import { TPanel }                                                  from "../../components/tpanel"
import { TRow }                                                    from "../../components/trow"
import { TCol }                                                    from "../../components/tcol"
import { TEntry }                                                  from "../../components/tentry"
import { TText }                                                   from "../../components/ttext"
import { TDate }                                                   from "../../components/tdate"
import { TDbCombo }                                                from "../../components/tdbcombo"
import { TButton }                                                 from "../../components/tbutton"
import { useMessage }                                              from "../../hooks/useMessage"
import { displayPessoa }                                           from "../../utils/pessoas"
import { Audiograma }                                              from "./components/Audiograma"
import { gerarPdfAudiometria }                                     from "../../utils/geradorPdf"

// ── Configuração da grade ──────────────────────────────────────────────────────

const FREQUENCIAS = [250, 500, 1000, 2000, 3000, 4000, 6000, 8000]

const LINHAS: { orelha: OrelhaAudiometria; via: ViaAudiometria; label: string }[] = [
  { orelha: "OD", via: "AEREA", label: "OD · Aérea" },
  { orelha: "OD", via: "OSSEA", label: "OD · Óssea" },
  { orelha: "OE", via: "AEREA", label: "OE · Aérea" },
  { orelha: "OE", via: "OSSEA", label: "OE · Óssea" },
]

// chave única por ponto da grade
function chave(orelha: OrelhaAudiometria, via: ViaAudiometria, freq: number): string {
  return `${orelha}|${via}|${freq}`
}

// estado editável por célula da grade
interface CelulaGrade {
  limiarDb:    string  // texto livre (aceita "-10")
  mascarado:   boolean
  semResposta: boolean
}

type Grade = Record<string, CelulaGrade>

function gradeVazia(): Grade {
  const g: Grade = {}
  for (const linha of LINHAS) {
    for (const freq of FREQUENCIAS) {
      g[chave(linha.orelha, linha.via, freq)] = { limiarDb: "", mascarado: false, semResposta: false }
    }
  }
  return g
}

function gradeDeLimiares(limiares: AudiometriaLimiar[]): Grade {
  const g = gradeVazia()
  for (const l of limiares) {
    const k = chave(l.orelha, l.via, l.frequencia)
    if (!(k in g)) continue
    g[k] = {
      limiarDb:    l.limiarDb != null ? String(l.limiarDb) : "",
      mascarado:   l.mascarado,
      semResposta: l.semResposta,
    }
  }
  return g
}

// converte a grade no array de limiares para o payload (apenas pontos preenchidos ou sem resposta)
function gradeParaLimiares(grade: Grade): AudiometriaLimiar[] {
  const out: AudiometriaLimiar[] = []
  for (const linha of LINHAS) {
    for (const freq of FREQUENCIAS) {
      const c = grade[chave(linha.orelha, linha.via, freq)]
      if (!c) continue
      const num = c.limiarDb.trim() === "" ? null : parseInt(c.limiarDb, 10)
      const limiarDb = num != null && !Number.isNaN(num) ? num : null
      // só envia pontos com valor OU marcados como sem resposta
      if (limiarDb == null && !c.semResposta) continue
      out.push({
        orelha:      linha.orelha,
        via:         linha.via,
        frequencia:  freq,
        limiarDb:    c.semResposta ? null : limiarDb,
        mascarado:   c.mascarado,
        semResposta: c.semResposta,
      })
    }
  }
  return out
}

function num(v: string): number | null {
  if (!v || v.trim() === "") return null
  const n = parseFloat(v.replace(",", "."))
  return Number.isNaN(n) ? null : n
}

// ── SRT sugerido: média tritonal da via aérea (500/1.000/2.000 Hz) por orelha ───
const FREQ_TRITONAL = [500, 1000, 2000]

function srtSugerido(grade: Grade, orelha: OrelhaAudiometria): number | null {
  const valores: number[] = []
  for (const freq of FREQ_TRITONAL) {
    const c = grade[chave(orelha, "AEREA", freq)]
    if (!c || c.semResposta) continue
    const n = c.limiarDb.trim() === "" ? null : parseInt(c.limiarDb, 10)
    if (n != null && !Number.isNaN(n)) valores.push(n)
  }
  if (valores.length === 0) return null
  return Math.round(valores.reduce((a, b) => a + b, 0) / valores.length)
}

// ── Classificação do IRF (% reconhecimento de fala) — faixas de referência ──────
function classificacaoIrf(perc: number | null): string | null {
  if (perc == null || Number.isNaN(perc)) return null
  if (perc >= 88) return "dentro da normalidade"
  if (perc >= 76) return "dificuldade leve"
  if (perc >= 64) return "dificuldade moderada"
  if (perc >= 52) return "dificuldade acentuada"
  return "dificuldade profunda"
}

function hoje(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

// ── Rótulos dos resultados calculados ───────────────────────────────────────────

const GRAU_LABEL: Record<GrauPerda, string> = {
  NORMAL: "Normal", LEVE: "Leve", MODERADA: "Moderada", SEVERA: "Severa", PROFUNDA: "Profunda",
}
const TIPO_LABEL: Record<TipoPerda, string> = {
  NORMAL: "Normal", CONDUTIVA: "Condutiva", NEUROSSENSORIAL: "Neurossensorial", MISTA: "Mista",
}

function fmtDb(v: number | null): string {
  return v == null ? "—" : `${Number(v).toFixed(1)} dB`
}
function fmtGrau(g: GrauPerda | null): string { return g ? GRAU_LABEL[g] : "—" }
function fmtTipo(t: TipoPerda | null): string { return t ? TIPO_LABEL[t] : "—" }

function ResultadoCard({ titulo, media, grau, tipo }:
  { titulo: string; media: number | null; grau: GrauPerda | null; tipo: TipoPerda | null }) {
  return (
    <div className="flex-1 min-w-50 border border-(--border) rounded-lg p-4 bg-(--bg-input)">
      <p className="text-sm font-medium text-(--text-secondary) mb-2">{titulo}</p>
      <div className="flex flex-col gap-1 text-sm">
        <div className="flex justify-between"><span className="text-(--text-muted)">Média:</span><span className="font-semibold text-(--text-primary)">{fmtDb(media)}</span></div>
        <div className="flex justify-between"><span className="text-(--text-muted)">Grau:</span><span className="font-semibold text-(--text-primary)">{fmtGrau(grau)}</span></div>
        <div className="flex justify-between"><span className="text-(--text-muted)">Tipo:</span><span className="font-semibold text-(--text-primary)">{fmtTipo(tipo)}</span></div>
      </div>
    </div>
  )
}

// ── Componente ─────────────────────────────────────────────────────────────────

export default function AudiometriaForm() {
  const { id: idParam } = useParams<{ id: string }>()
  const navigate        = useNavigate()
  const { showMessage } = useMessage()

  const [loading,    setLoading]    = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [formKey,    setFormKey]    = useState(0)
  const [audiometria, setAudiometria] = useState<AudiometriaResponse | null>(null)

  const [pessoaId, setPessoaId] = useState("")
  const [dataVal,  setDataVal]  = useState(hoje())
  const [grade,    setGrade]    = useState<Grade>(gradeVazia())

  // SRT: enquanto não editado manualmente, segue a sugestão calculada da grade
  const [srtOd,        setSrtOd]        = useState("")
  const [srtOe,        setSrtOe]        = useState("")
  const [srtOdTouched, setSrtOdTouched] = useState(false)
  const [srtOeTouched, setSrtOeTouched] = useState(false)
  // IRF: digitado manualmente, usado apenas para exibir a classificação
  const [irfOd, setIrfOd] = useState("")
  const [irfOe, setIrfOe] = useState("")

  useEffect(() => {
    if (idParam) carregar(idParam)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idParam])

  async function carregar(id: string) {
    setLoading(true)
    try {
      const res = await api.get<AudiometriaResponse>(`/otorrino/audiometrias/${id}`)
      const a   = res.data
      setAudiometria(a)
      setPessoaId(String(a.pessoaId))
      setDataVal(a.dataExame)
      setGrade(gradeDeLimiares(a.limiares ?? []))
      // respeita os valores persistidos (não sobrescreve com a sugestão)
      setSrtOd(a.srtOdDb != null ? String(a.srtOdDb) : "")
      setSrtOe(a.srtOeDb != null ? String(a.srtOeDb) : "")
      setSrtOdTouched(a.srtOdDb != null)
      setSrtOeTouched(a.srtOeDb != null)
      setIrfOd(a.irfOdPerc != null ? String(a.irfOdPerc) : "")
      setIrfOe(a.irfOePerc != null ? String(a.irfOePerc) : "")
      setFormKey(k => k + 1)
    } catch {
      showMessage("error", "Erro ao carregar audiometria")
    } finally {
      setLoading(false)
    }
  }

  function atualizarCelula(k: string, patch: Partial<CelulaGrade>) {
    setGrade(prev => ({ ...prev, [k]: { ...prev[k], ...patch } }))
  }

  function handleGerarPdf() {
    if (!audiometria) return
    const b64 = gerarPdfAudiometria({
      dataEmissao:  hoje(),
      pacienteNome: audiometria.pessoaNome,
      usuarioNome:  audiometria.usuarioNome,
      dataExame:    audiometria.dataExame,
      srtOdDb:      audiometria.srtOdDb,
      srtOeDb:      audiometria.srtOeDb,
      irfOdPerc:    audiometria.irfOdPerc,
      irfOePerc:    audiometria.irfOePerc,
      mediaOd:      audiometria.mediaOd,
      mediaOe:      audiometria.mediaOe,
      grauOd:       audiometria.grauOd,
      grauOe:       audiometria.grauOe,
      tipoPerdaOd:  audiometria.tipoPerdaOd,
      tipoPerdaOe:  audiometria.tipoPerdaOe,
      norma:        audiometria.norma,
      observacao:   audiometria.observacao,
      limiares:     audiometria.limiares ?? [],
    })
    const link    = document.createElement("a")
    link.href     = `data:application/pdf;base64,${b64}`
    link.download = `audiometria_${(audiometria.pessoaNome ?? "paciente").replace(/\s+/g, "_")}_${audiometria.dataExame}.pdf`
    link.click()
  }

  // limiares ao vivo para o audiograma de preview
  const limiaresPreview: AudiometriaLimiar[] = gradeParaLimiares(grade)

  // SRT sugerido a partir da grade (média tritonal aérea); classificação do IRF digitado
  const srtSugOd = srtSugerido(grade, "OD")
  const srtSugOe = srtSugerido(grade, "OE")
  const irfClassOd = classificacaoIrf(num(irfOd))
  const irfClassOe = classificacaoIrf(num(irfOe))

  const SRT_HINT = "≈ média de 500, 1.000 e 2.000 Hz (via aérea) — valor aproximado, ajuste se necessário"

  async function handleSubmit(formData: Record<string, string>) {
    if (!pessoaId)              { showMessage("error", "Selecione o paciente"); return }
    if (!formData.dataExame)    { showMessage("error", "Informe a data do exame"); return }

    // SRT efetivo: valor digitado quando tocado; senão, a sugestão calculada
    const srtOdFinal = srtOdTouched ? srtOd : (srtSugerido(grade, "OD")?.toString() ?? "")
    const srtOeFinal = srtOeTouched ? srtOe : (srtSugerido(grade, "OE")?.toString() ?? "")

    const payload: AudiometriaPayload = {
      pessoaId:   parseInt(pessoaId),
      consultaId: null,
      dataExame:  formData.dataExame,
      srtOdDb:    num(srtOdFinal),
      srtOeDb:    num(srtOeFinal),
      irfOdPerc:  num(irfOd),
      irfOePerc:  num(irfOe),
      norma:      formData.norma?.trim()      || null,
      observacao: formData.observacao?.trim() || null,
      limiares:   gradeParaLimiares(grade),
    }

    setSaving(true)
    try {
      if (idParam) {
        await api.put(`/otorrino/audiometrias/${idParam}`, payload)
        showMessage("success", "Audiometria atualizada com sucesso!")
        await carregar(idParam)   // recarrega para refletir média/grau/tipo recalculados
      } else {
        const res = await api.post<AudiometriaResponse>("/otorrino/audiometrias", payload)
        showMessage("success", "Audiometria criada com sucesso!")
        navigate(`/otorrino/audiometrias/${res.data.id}`, { replace: true })
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data) {
        const data = err.response.data as ErrorResponse
        showMessage("error", data.erro ?? "Erro ao salvar audiometria")
      } else {
        showMessage("error", "Erro ao salvar audiometria")
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <TPage title="Audiometria" breadcrumb={["Otorrinolaringologia", "Audiometrias", "Carregando..."]}>
        <div className="flex justify-center py-12">
          <span className="w-6 h-6 border-2 border-(--accent) border-t-transparent rounded-full animate-spin" />
        </div>
      </TPage>
    )
  }

  return (
    <TPage
      title     ={idParam ? "Editar Audiometria" : "Nova Audiometria"}
      breadcrumb={["Otorrinolaringologia", "Audiometrias", idParam ? "Editar" : "Nova"]}
    >
      <TForm key={formKey} onSubmit={handleSubmit}>

        <TPanel title="Dados do Exame">
          <TRow>
            <TCol flex={3}>
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
              />
            </TCol>
            <TCol flex={1}>
              <TDate
                name        ="dataExame"
                label       ="Data do Exame"
                required
                defaultValue={dataVal}
                onChange    ={setDataVal}
              />
            </TCol>
          </TRow>
        </TPanel>

        <TPanel title="Limiares Auditivos (dB)">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="text-left text-(--text-secondary) font-medium px-2 py-2 sticky left-0 bg-(--bg-surface) z-10">Via</th>
                  {FREQUENCIAS.map(f => (
                    <th key={f} className="text-center text-(--text-secondary) font-medium px-1 py-2 min-w-16">
                      {f >= 1000 ? `${f / 1000}k` : f}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {LINHAS.map(linha => (
                  <tr key={`${linha.orelha}-${linha.via}`} className="border-t border-(--border)">
                    <td className="px-2 py-1.5 font-medium text-(--text-primary) whitespace-nowrap sticky left-0 bg-(--bg-surface) z-10"
                      style={{ color: linha.orelha === "OD" ? "#ef4444" : "#3b82f6" }}>
                      {linha.label}
                    </td>
                    {FREQUENCIAS.map(freq => {
                      const k = chave(linha.orelha, linha.via, freq)
                      const c = grade[k]
                      return (
                        <td key={k} className="px-1 py-1.5 align-top">
                          <div className="flex flex-col items-center gap-1">
                            <input
                              type        ="number"
                              min          ={-10}
                              max          ={120}
                              step         ={5}
                              value        ={c.semResposta ? "" : c.limiarDb}
                              disabled     ={c.semResposta}
                              onChange     ={(e) => atualizarCelula(k, { limiarDb: e.target.value })}
                              className    ="w-14 h-8 text-center bg-(--bg-input) border border-(--border) rounded
                                text-(--text-primary) text-sm focus:outline-none focus:border-(--accent) focus:ring-1 focus:ring-(--accent)
                                disabled:opacity-40 disabled:cursor-not-allowed transition"
                            />
                            <label className="flex items-center gap-1 cursor-pointer select-none text-[10px] text-(--text-muted)"
                              title="Mascarado">
                              <input type="checkbox" checked={c.mascarado}
                                onChange={(e) => atualizarCelula(k, { mascarado: e.target.checked })}
                                className="w-3 h-3 cursor-pointer accent-(--accent)" />
                              masc
                            </label>
                            <label className="flex items-center gap-1 cursor-pointer select-none text-[10px] text-(--text-muted)"
                              title="Sem resposta">
                              <input type="checkbox" checked={c.semResposta}
                                onChange={(e) => atualizarCelula(k, { semResposta: e.target.checked })}
                                className="w-3 h-3 cursor-pointer accent-(--danger)" />
                              s/r
                            </label>
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-(--text-muted)">
            Informe o limiar em dB (−10 a 120) por frequência. Marque <strong>masc</strong> para resposta mascarada
            e <strong>s/r</strong> para ausência de resposta. Pontos em branco não são gravados.
          </p>
        </TPanel>

        <TPanel title="Audiograma (pré-visualização)">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <p className="text-center text-sm font-semibold mb-1" style={{ color: "#ef4444" }}>
                Orelha Direita (OD)
              </p>
              <Audiograma limiares={limiaresPreview} orelha="OD" />
              <div className="text-center text-xs text-(--text-muted)">
                <span style={{ color: "#ef4444" }}>O</span> VA OD &nbsp;
                <span style={{ color: "#ef4444" }}>&lt;</span> VO OD
              </div>
            </div>
            <div>
              <p className="text-center text-sm font-semibold mb-1" style={{ color: "#3b82f6" }}>
                Orelha Esquerda (OE)
              </p>
              <Audiograma limiares={limiaresPreview} orelha="OE" />
              <div className="text-center text-xs text-(--text-muted)">
                <span style={{ color: "#3b82f6" }}>X</span> VA OE &nbsp;
                <span style={{ color: "#3b82f6" }}>&gt;</span> VO OE
              </div>
            </div>
          </div>
        </TPanel>

        <TPanel title="Logoaudiometria">
          <TRow>
            <TCol>
              <TEntry
                key         ={srtOdTouched ? "srtod-manual" : `srtod-${srtSugOd ?? "none"}`}
                name        ="srtOdDb" label="SRT OD (dB)" width="100%" mask="numerosinal"
                placeholder ="Ex: 20"
                defaultValue={srtOdTouched ? srtOd : (srtSugOd != null ? String(srtSugOd) : "")}
                onChange    ={(v) => { setSrtOd(v); setSrtOdTouched(true) }}
                hint        ={!srtOdTouched && srtSugOd != null ? SRT_HINT : undefined}
              />
            </TCol>
            <TCol>
              <TEntry
                key         ={srtOeTouched ? "srtoe-manual" : `srtoe-${srtSugOe ?? "none"}`}
                name        ="srtOeDb" label="SRT OE (dB)" width="100%" mask="numerosinal"
                placeholder ="Ex: 20"
                defaultValue={srtOeTouched ? srtOe : (srtSugOe != null ? String(srtSugOe) : "")}
                onChange    ={(v) => { setSrtOe(v); setSrtOeTouched(true) }}
                hint        ={!srtOeTouched && srtSugOe != null ? SRT_HINT : undefined}
              />
            </TCol>
            <TCol>
              <TEntry
                name        ="irfOdPerc" label="IRF OD (%)" width="100%" mask="numero"
                placeholder ="Ex: 96" defaultValue={irfOd}
                onChange    ={setIrfOd}
                hint        ={irfClassOd ? `Reconhecimento de fala: ${irfClassOd}` : undefined}
              />
            </TCol>
            <TCol>
              <TEntry
                name        ="irfOePerc" label="IRF OE (%)" width="100%" mask="numero"
                placeholder ="Ex: 96" defaultValue={irfOe}
                onChange    ={setIrfOe}
                hint        ={irfClassOe ? `Reconhecimento de fala: ${irfClassOe}` : undefined}
              />
            </TCol>
          </TRow>
        </TPanel>

        {audiometria && (
          <TPanel title="Resultados Calculados">
            <TRow>
              <ResultadoCard titulo="Orelha Direita (OD)" media={audiometria.mediaOd}
                grau={audiometria.grauOd} tipo={audiometria.tipoPerdaOd} />
              <ResultadoCard titulo="Orelha Esquerda (OE)" media={audiometria.mediaOe}
                grau={audiometria.grauOe} tipo={audiometria.tipoPerdaOe} />
            </TRow>
            <p className="text-xs text-(--text-muted)">
              Média, grau e tipo de perda são calculados automaticamente pelo sistema a partir dos limiares informados.
            </p>
          </TPanel>
        )}

        <TPanel title="Observações">
          <TRow>
            <TCol>
              <TEntry name="norma" label="Norma utilizada" width="100%"
                placeholder="Ex: ISO 8253 / BIAP" defaultValue={audiometria?.norma ?? ""} />
            </TCol>
          </TRow>
          <TRow>
            <TCol>
              <TText name="observacao" label="Observações" width="100%" height="80px"
                placeholder="Observações adicionais sobre o exame..."
                defaultValue={audiometria?.observacao ?? ""} />
            </TCol>
          </TRow>
        </TPanel>

        <TFormFooter>
          <TFormActionsLeft>
            <TButton label="Voltar" variant="cancel" type="button"
              onClick={() => navigate("/otorrino/audiometrias")} />
            {audiometria && (
              <TButton label="Gerar PDF" variant="secondary" type="button"
                onClick={handleGerarPdf} />
            )}
          </TFormActionsLeft>
          <TFormActionsRight>
            <TButton label="Salvar" variant="save" type="submit" loading={saving} />
          </TFormActionsRight>
        </TFormFooter>
      </TForm>
    </TPage>
  )
}
