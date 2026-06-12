import { useEffect, useState }                                    from "react"
import { useNavigate, useParams }                                  from "react-router-dom"
import axios                                                       from "axios"
import { api }                                                     from "../../services/api"
import type { AvaliacaoFisicaResponse }                           from "../../types/AvaliacaoFisica"
import {
  OBJETIVO_LABELS,
  PONTO_LABELS,
  PONTOS_ORDENADOS,
  type ObjetivoAvaliacao,
  type PontoMedicao,
}                                                                  from "../../types/AvaliacaoFisica"
import type { ErrorResponse }                                      from "../../types/ErrorResponse"
import { TPage }                                                   from "../../components/tpage"
import { TForm, TFormActionsLeft, TFormActionsRight, TFormFooter } from "../../components/tform"
import { TPanel }                                                  from "../../components/tpanel"
import { TEntry }                                                  from "../../components/tentry"
import { TCombo }                                                  from "../../components/tcombo"
import { TText }                                                   from "../../components/ttext"
import { TDate }                                                   from "../../components/tdate"
import { TButton }                                                 from "../../components/tbutton"
import { TDbCombo }                                                from "../../components/tdbcombo"
import { TRow }                                                    from "../../components/trow"
import { TCol }                                                    from "../../components/tcol"
import { useMessage }                                              from "../../hooks/useMessage"
import TBodyChart                                                  from "../../components/TBodyChart"
import { displayUsuario, displayPessoa }                          from "../../utils/pessoas"

const OBJETIVO_OPTIONS = (Object.keys(OBJETIVO_LABELS) as ObjetivoAvaliacao[]).map(k => ({
  value: k,
  label: OBJETIVO_LABELS[k],
}))

const SEXO_OPTIONS = [
  { value: "M", label: "Masculino" },
  { value: "F", label: "Feminino"  },
]

interface MedidaState {
  [key: string]: string
}

interface ComposicaoState {
  percentualGordura:      string
  massaMuscularKg:        string
  massaGordaKg:           string
  massaOsseaKg:           string
  aguaCorporalPercentual: string
  metabolismoBasal:       string
  idadeMetabolica:        string
}

const emptyComposicao: ComposicaoState = {
  percentualGordura:      "",
  massaMuscularKg:        "",
  massaGordaKg:           "",
  massaOsseaKg:           "",
  aguaCorporalPercentual: "",
  metabolismoBasal:       "",
  idadeMetabolica:        "",
}

export default function AvaliacaoFisicaForm() {
  const { id: idParam } = useParams<{ id: string }>()
  const navigate         = useNavigate()
  const { showMessage }  = useMessage()

  const [loading,    setLoading]    = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [formKey,    setFormKey]    = useState(0)
  const [avaliacao,  setAvaliacao]  = useState<AvaliacaoFisicaResponse | null>(null)
  const [pessoaId,   setPessoaId]   = useState("")
  const [usuarioId,  setUsuarioId]  = useState("")
  const [pesoVal,    setPesoVal]    = useState("")
  const [alturaVal,  setAlturaVal]  = useState("")
  const [sexoVal,    setSexoVal]    = useState("M")
  const [medidas,    setMedidas]    = useState<MedidaState>({})
  const [composicao, setComposicao] = useState<ComposicaoState>(emptyComposicao)
  const [imcCalc,    setImcCalc]    = useState<string>("")

  useEffect(() => {
    if (idParam) carregarAvaliacao(idParam)
  }, [idParam])

  async function carregarAvaliacao(id: string) {
    setLoading(true)
    try {
      const res = await api.get<AvaliacaoFisicaResponse>(`/avaliacoes-fisicas/${id}`)
      const a   = res.data
      setAvaliacao(a)
      setPessoaId(String(a.pessoaId))
      setUsuarioId(a.usuarioId ? String(a.usuarioId) : "")
      setPesoVal(String(a.peso))
      setAlturaVal(String(a.altura))
      if (a.imc) setImcCalc(String(a.imc))
      if (a.sexo) setSexoVal(a.sexo)

      const medidasMap: MedidaState = {}
      a.medidas.forEach(m => { medidasMap[m.pontoMedicao] = String(m.valorCm) })
      setMedidas(medidasMap)

      if (a.composicao) {
        setComposicao({
          percentualGordura:      String(a.composicao.percentualGordura      ?? ""),
          massaMuscularKg:        String(a.composicao.massaMuscularKg        ?? ""),
          massaGordaKg:           String(a.composicao.massaGordaKg           ?? ""),
          massaOsseaKg:           String(a.composicao.massaOsseaKg           ?? ""),
          aguaCorporalPercentual: String(a.composicao.aguaCorporalPercentual ?? ""),
          metabolismoBasal:       String(a.composicao.metabolismoBasal       ?? ""),
          idadeMetabolica:        String(a.composicao.idadeMetabolica        ?? ""),
        })
      }

      setFormKey(k => k + 1)
    } catch {
      showMessage("error", "Erro ao carregar avaliação física")
    } finally {
      setLoading(false)
    }
  }

  function calcularImc(peso: string, altura: string) {
    const p = parseFloat(peso)
    const h = parseFloat(altura)
    if (!p || !h || h === 0) { setImcCalc(""); return }
    const alturaM = h / 100
    setImcCalc((p / (alturaM * alturaM)).toFixed(2))
  }

  function handlePesoChange(v: string) {
    setPesoVal(v)
    calcularImc(v, alturaVal)
  }

  function handleAlturaChange(v: string) {
    setAlturaVal(v)
    calcularImc(pesoVal, v)
  }

  function handleMedidaChange(ponto: PontoMedicao, valor: string) {
    setMedidas(prev => ({ ...prev, [ponto]: valor }))
  }

  async function handleSubmit(formData: Record<string, string>) {
    if (!pessoaId) { showMessage("error", "Selecione o paciente/aluno"); return }
    if (!formData.dataAvaliacao) { showMessage("error", "Informe a data da avaliação"); return }
    if (!formData.peso || !formData.altura) { showMessage("error", "Peso e altura são obrigatórios"); return }
    if (!formData.objetivo) { showMessage("error", "Selecione o objetivo"); return }
    if (!formData.sexo) { showMessage("error", "Selecione o sexo"); return }

    const medidasList = PONTOS_ORDENADOS
      .filter(p => medidas[p] && parseFloat(medidas[p]) > 0)
      .map(p => ({ pontoMedicao: p, valorCm: parseFloat(medidas[p]) }))

    const temComposicao = Object.values(composicao).some(v => v !== "")
    const composicaoPayload = temComposicao ? {
      percentualGordura:      composicao.percentualGordura      ? parseFloat(composicao.percentualGordura)      : null,
      massaMuscularKg:        composicao.massaMuscularKg        ? parseFloat(composicao.massaMuscularKg)        : null,
      massaGordaKg:           composicao.massaGordaKg           ? parseFloat(composicao.massaGordaKg)           : null,
      massaOsseaKg:           composicao.massaOsseaKg           ? parseFloat(composicao.massaOsseaKg)           : null,
      aguaCorporalPercentual: composicao.aguaCorporalPercentual ? parseFloat(composicao.aguaCorporalPercentual) : null,
      metabolismoBasal:       composicao.metabolismoBasal       ? parseInt(composicao.metabolismoBasal)         : null,
      idadeMetabolica:        composicao.idadeMetabolica        ? parseInt(composicao.idadeMetabolica)          : null,
    } : null

    const payload = {
      pessoaId:      parseInt(pessoaId),
      usuarioId:     usuarioId ? parseInt(usuarioId) : null,
      dataAvaliacao: formData.dataAvaliacao,
      peso:          parseFloat(formData.peso),
      altura:        parseFloat(formData.altura),
      idade:         parseInt(formData.idade),
      sexo:          formData.sexo,
      objetivo:      formData.objetivo as ObjetivoAvaliacao,
      metaDescricao: formData.metaDescricao || null,
      pesoAlvo:      formData.pesoAlvo ? parseFloat(formData.pesoAlvo) : null,
      observacoes:   formData.observacoes || null,
      medidas:       medidasList,
      composicao:    composicaoPayload,
    }

    setSaving(true)
    try {
      if (idParam) {
        await api.put(`/avaliacoes-fisicas/${idParam}`, payload)
        showMessage("success", "Avaliação atualizada com sucesso!")
        carregarAvaliacao(idParam)
      } else {
        const res = await api.post<AvaliacaoFisicaResponse>("/avaliacoes-fisicas", payload)
        showMessage("success", "Avaliação criada com sucesso!")
        navigate(`/avaliacao/avaliacoes-fisicas/${res.data.id}`, { replace: true })
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data) {
        const data = err.response.data as ErrorResponse
        showMessage("error", data.erro ?? "Erro ao salvar avaliação")
      } else {
        showMessage("error", "Erro ao salvar avaliação")
      }
    } finally {
      setSaving(false)
    }
  }

  const medidasParaChart = PONTOS_ORDENADOS
    .filter(p => medidas[p] && parseFloat(medidas[p]) > 0)
    .map(p => ({ pontoMedicao: p, valorCm: parseFloat(medidas[p]) }))

  if (loading) return (
    <TPage title="Avaliação Física" breadcrumb={["Avaliação Física", "Carregando..."]}>
      <div className="p-8 text-center text-gray-500">Carregando...</div>
    </TPage>
  )

  return (
    <TPage
      title     ={idParam ? "Editar Avaliação Física" : "Nova Avaliação Física"}
      breadcrumb={["Avaliação Física", idParam ? "Editar" : "Nova"]}
    >
      <TForm key={formKey} onSubmit={handleSubmit}>

        {/* ── Dados Básicos ─────────────────────────────────────────────── */}
        <TPanel title="Dados Básicos">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <TDbCombo
                name        ="pessoaId"
                label       ="Paciente / Aluno"
                url         ="/pessoas/select"
                valueField  ="id"
                displayField={displayPessoa}
                searchField ="nome"
                required
                value       ={pessoaId}
                onChange    ={(v) => setPessoaId(v)}
                placeholder ="Buscar paciente..."
              />
            </div>
            <div className="lg:col-span-2">
              <TDbCombo
                name        ="usuarioId"
                label       ="Profissional (Nutricionista / Personal)"
                url         ="/usuarios/select-personal"
                valueField  ="id"
                displayField={displayUsuario}
                searchField ="nome"
                value       ={usuarioId}
                onChange    ={(v) => setUsuarioId(v)}
                placeholder ="Selecionar profissional..."
              />
            </div>
            <div>
              <TDate
                name        ="dataAvaliacao"
                label       ="Data da Avaliação"
                required
                defaultValue={avaliacao?.dataAvaliacao ?? ""}
              />
            </div>
            <TEntry
              name        ="peso"
              label       ="Peso (kg)"
              placeholder ="Ex: 75.5"
              required
              defaultValue={pesoVal}
              onChange    ={handlePesoChange}
            />
            <TEntry
              name        ="altura"
              label       ="Altura (cm)"
              placeholder ="Ex: 170"
              required
              defaultValue={alturaVal}
              onChange    ={handleAlturaChange}
            />
            <div className="flex flex-col gap-1">
              <label className="text-sm text-(--text-secondary)">IMC (calculado)</label>
              <div className="flex items-center h-9.5 bg-(--bg-input) border border-(--border) rounded-md px-3 text-sm text-(--text-primary) opacity-70 select-none">
                {imcCalc || "—"}
              </div>
            </div>
            <TEntry
              name        ="idade"
              label       ="Idade (anos)"
              placeholder ="Ex: 30"
              required
              defaultValue={avaliacao?.idade ? String(avaliacao.idade) : ""}
            />
            <TCombo
              name        ="sexo"
              label       ="Sexo"
              options     ={SEXO_OPTIONS}
              required
              defaultValue={avaliacao?.sexo ?? ""}
              onChange    ={(v) => setSexoVal(v)}
            />
          </div>
        </TPanel>

        {/* ── Objetivo e Meta ───────────────────────────────────────────── */}
        <TPanel title="Objetivo e Meta">
          <TRow>
            <TCol flex={2}>
              <TCombo
                name        ="objetivo"
                label       ="Objetivo"
                options     ={OBJETIVO_OPTIONS}
                required
                defaultValue={avaliacao?.objetivo ?? ""}
              />
            </TCol>
            <TCol flex={1}>
              <TEntry
                name        ="pesoAlvo"
                label       ="Peso Alvo (kg)"
                placeholder ="Ex: 65.0 (opcional)"
                defaultValue={avaliacao?.pesoAlvo ? String(avaliacao.pesoAlvo) : ""}
              />
            </TCol>
          </TRow>
          <TRow>
            <TCol flex={2}>
              <TText
                name        ="metaDescricao"
                label       ="Descrição da Meta"
                placeholder ="Ex: Perder 10kg em 6 meses com foco em redução de gordura abdominal"
                defaultValue={avaliacao?.metaDescricao ?? ""}
                height      ="80px"
              />
            </TCol>
            <TCol flex={1}>
              <TText
                name        ="observacoes"
                label       ="Observações Gerais"
                placeholder ="Observações adicionais sobre a avaliação..."
                defaultValue={avaliacao?.observacoes ?? ""}
                height      ="80px"
              />
            </TCol>
          </TRow>
        </TPanel>

        {/* ── Medidas Corporais ─────────────────────────────────────────── */}
        <TPanel title="Medidas Corporais">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div>
              <p className="text-xs text-gray-500 mb-2">Circunferências em centímetros (cm)</p>
              <div className="grid grid-cols-3 gap-x-3 gap-y-2" style={{ maxWidth: 880 }}>
                {PONTOS_ORDENADOS.map(ponto => (
                  <TEntry
                    key         ={ponto}
                    name        ={`medida_${ponto}`}
                    label       ={PONTO_LABELS[ponto]}
                    placeholder ="cm"
                    defaultValue={medidas[ponto] ?? ""}
                    onChange    ={(v) => handleMedidaChange(ponto, v)}
                  />
                ))}
              </div>
            </div>
            <div className="w-full md:flex-1" style={{ maxWidth: 780 }}>
              <TBodyChart
                medidas={medidasParaChart}
                sexo   ={sexoVal}
              />
            </div>
          </div>
        </TPanel>

        {/* ── Bioimpedância ─────────────────────────────────────────────── */}
        <TPanel title="Composição Corporal (Bioimpedância)">
          <p className="text-xs text-gray-500">Dados opcionais da avaliação de bioimpedância</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <TEntry
              name        ="percGordura"
              label       ="% Gordura Corporal"
              placeholder ="Ex: 22.5"
              defaultValue={composicao.percentualGordura}
              onChange    ={(v) => setComposicao(p => ({ ...p, percentualGordura: v }))}
            />
            <TEntry
              name        ="massaMuscular"
              label       ="Massa Muscular (kg)"
              placeholder ="Ex: 35.2"
              defaultValue={composicao.massaMuscularKg}
              onChange    ={(v) => setComposicao(p => ({ ...p, massaMuscularKg: v }))}
            />
            <TEntry
              name        ="massaGorda"
              label       ="Massa Gorda (kg)"
              placeholder ="Ex: 18.1"
              defaultValue={composicao.massaGordaKg}
              onChange    ={(v) => setComposicao(p => ({ ...p, massaGordaKg: v }))}
            />
            <TEntry
              name        ="massaOssea"
              label       ="Massa Óssea (kg)"
              placeholder ="Ex: 3.4"
              defaultValue={composicao.massaOsseaKg}
              onChange    ={(v) => setComposicao(p => ({ ...p, massaOsseaKg: v }))}
            />
            <TEntry
              name        ="aguaCorporal"
              label       ="Água Corporal (%)"
              placeholder ="Ex: 55.0"
              defaultValue={composicao.aguaCorporalPercentual}
              onChange    ={(v) => setComposicao(p => ({ ...p, aguaCorporalPercentual: v }))}
            />
            <TEntry
              name        ="metabolismoBasal"
              label       ="Metabolismo Basal (kcal)"
              placeholder ="Ex: 1650"
              defaultValue={composicao.metabolismoBasal}
              onChange    ={(v) => setComposicao(p => ({ ...p, metabolismoBasal: v }))}
            />
            <TEntry
              name        ="idadeMetabolica"
              label       ="Idade Metabólica (anos)"
              placeholder ="Ex: 28"
              defaultValue={composicao.idadeMetabolica}
              onChange    ={(v) => setComposicao(p => ({ ...p, idadeMetabolica: v }))}
            />
          </div>
        </TPanel>

        <TFormFooter>
          <TFormActionsLeft>
            {idParam && avaliacao && (
              <TButton
                label   ="Ver Evolução"
                variant ="secondary"
                type    ="button"
                onClick ={() => navigate(`/avaliacao/avaliacoes-fisicas/evolucao/${avaliacao.pessoaId}`)}
              />
            )}
          </TFormActionsLeft>
          <TFormActionsRight>
            <TButton
              label   ="Voltar"
              variant ="cancel"
              type    ="button"
              onClick ={() => navigate("/avaliacao/avaliacoes-fisicas")}
            />
            <TButton
              label   ={saving ? "Salvando..." : "Salvar"}
              variant ="save"
              type    ="submit"
              disabled={saving}
            />
          </TFormActionsRight>
        </TFormFooter>
      </TForm>
    </TPage>
  )
}
