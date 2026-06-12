import { useEffect, useState }                                    from "react"
import { FaCalculator }                                           from "react-icons/fa6"
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
  const [idadeVal,           setIdadeVal]           = useState("")
  const [composicao,         setComposicao]         = useState<ComposicaoState>(emptyComposicao)
  const [composicaoEstimada, setComposicaoEstimada] = useState<Set<keyof ComposicaoState>>(new Set())
  const [imcCalc,            setImcCalc]            = useState<string>("")

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
      setIdadeVal(a.idade ? String(a.idade) : "")
      if (a.imc) setImcCalc(String(a.imc))
      if (a.sexo) setSexoVal(a.sexo)
      setComposicaoEstimada(new Set())

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

  function calcularImc(peso: string, altura: string): string {
    const p = parseFloat(peso)
    const h = parseFloat(altura)
    if (!p || !h || h === 0) { setImcCalc(""); return "" }
    const alturaM = h / 100
    const imc = (p / (alturaM * alturaM)).toFixed(2)
    setImcCalc(imc)
    return imc
  }

  function isComposicaoVazia(comp: ComposicaoState) {
    return Object.values(comp).every(v => v === "")
  }

  function calcularEstimativasBioimpedancia(
    peso: string, altura: string, idade: string, sexo: string, imc: string
  ): Partial<ComposicaoState> {
    const p   = parseFloat(peso)
    const h   = parseFloat(altura)
    const i   = parseFloat(idade)
    const bmi = parseFloat(imc)
    if (!p || !h || !i || p <= 0 || h <= 0 || i <= 0) return {}

    const masculino = sexo === "M"
    const result: Partial<ComposicaoState> = {}

    // Mifflin-St Jeor
    const tmb = masculino
      ? (10 * p) + (6.25 * h) - (5 * i) + 5
      : (10 * p) + (6.25 * h) - (5 * i) - 161
    result.metabolismoBasal = Math.round(tmb).toString()

    // Deurenberg (requer IMC válido)
    if (bmi > 0) {
      const bf = 1.20 * bmi + 0.23 * i - 10.8 * (masculino ? 1 : 0) - 5.4
      if (bf > 0 && bf < 100) {
        result.percentualGordura = bf.toFixed(1)
        const mg = p * (bf / 100)
        result.massaGordaKg = mg.toFixed(1)
        // Hume
        const ossea = masculino
          ? (0.1948 * h) + (0.3238 * p) - 19.861
          : (0.4734 * h) + (0.3171 * p) - 49.396
        if (ossea > 0) {
          result.massaOsseaKg = ossea.toFixed(1)
          const mm = p - mg - ossea
          if (mm > 0) result.massaMuscularKg = mm.toFixed(1)
        }
      }
    }

    // Watson
    const tbw = masculino
      ? 2.447 - (0.09145 * i) + (0.1074 * h) + (0.3362 * p)
      : -2.097 + (0.1069 * h) + (0.2466 * p)
    if (tbw > 0) result.aguaCorporalPercentual = ((tbw / p) * 100).toFixed(1)

    return result
  }

  function aplicarEstimativas(peso: string, altura: string, idade: string, sexo: string, imc: string) {
    const estimativas = calcularEstimativasBioimpedancia(peso, altura, idade, sexo, imc)
    if (Object.keys(estimativas).length === 0) return

    const novasEstimadas = new Set(composicaoEstimada)
    const updates: Partial<ComposicaoState> = {}

    for (const [key, value] of Object.entries(estimativas) as [keyof ComposicaoState, string][]) {
      if (!composicao[key]) {
        updates[key] = value
        novasEstimadas.add(key)
      }
    }

    if (Object.keys(updates).length > 0) {
      setComposicao(prev => ({ ...prev, ...updates }))
      setComposicaoEstimada(novasEstimadas)
    }
  }

  function handleComposicaoChange(key: keyof ComposicaoState, value: string) {
    setComposicao(prev => ({ ...prev, [key]: value }))
    setComposicaoEstimada(prev => { const n = new Set(prev); n.delete(key); return n })
  }

  function handlePesoChange(v: string) {
    setPesoVal(v)
    const imc = calcularImc(v, alturaVal)
    if (isComposicaoVazia(composicao)) aplicarEstimativas(v, alturaVal, idadeVal, sexoVal, imc)
  }

  function handleAlturaChange(v: string) {
    setAlturaVal(v)
    const imc = calcularImc(pesoVal, v)
    if (isComposicaoVazia(composicao)) aplicarEstimativas(pesoVal, v, idadeVal, sexoVal, imc)
  }

  function handleIdadeChange(v: string) {
    setIdadeVal(v)
    if (isComposicaoVazia(composicao)) aplicarEstimativas(pesoVal, alturaVal, v, sexoVal, imcCalc)
  }

  function handleSexoChange(v: string) {
    setSexoVal(v)
    if (isComposicaoVazia(composicao)) aplicarEstimativas(pesoVal, alturaVal, idadeVal, v, imcCalc)
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
              defaultValue={idadeVal}
              onChange    ={handleIdadeChange}
            />
            <TCombo
              name        ="sexo"
              label       ="Sexo"
              options     ={SEXO_OPTIONS}
              required
              defaultValue={avaliacao?.sexo ?? ""}
              onChange    ={handleSexoChange}
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
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-500">Dados opcionais da avaliação de bioimpedância</p>
            {pesoVal && alturaVal && idadeVal && sexoVal && (
              <TButton
                label  ="Calcular estimativas"
                variant="secondary"
                type   ="button"
                icon   ={<FaCalculator />}
                onClick={() => aplicarEstimativas(pesoVal, alturaVal, idadeVal, sexoVal, imcCalc)}
              />
            )}
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {(["percentualGordura", "massaMuscularKg", "massaGordaKg", "massaOsseaKg",
               "aguaCorporalPercentual", "metabolismoBasal", "idadeMetabolica"] as (keyof ComposicaoState)[]).map(key => {
              const meta: Record<keyof ComposicaoState, { name: string; label: string; placeholder: string }> = {
                percentualGordura:      { name: "percGordura",      label: "% Gordura Corporal",      placeholder: "Ex: 22.5" },
                massaMuscularKg:        { name: "massaMuscular",     label: "Massa Muscular (kg)",      placeholder: "Ex: 35.2" },
                massaGordaKg:           { name: "massaGorda",        label: "Massa Gorda (kg)",         placeholder: "Ex: 18.1" },
                massaOsseaKg:           { name: "massaOssea",        label: "Massa Óssea (kg)",         placeholder: "Ex: 3.4"  },
                aguaCorporalPercentual: { name: "aguaCorporal",      label: "Água Corporal (%)",        placeholder: "Ex: 55.0" },
                metabolismoBasal:       { name: "metabolismoBasal",  label: "Metabolismo Basal (kcal)", placeholder: "Ex: 1650" },
                idadeMetabolica:        { name: "idadeMetabolica",   label: "Idade Metabólica (anos)",  placeholder: "Ex: 28"   },
              }
              const { name, label, placeholder } = meta[key]
              const estimado = composicaoEstimada.has(key)
              return (
                <div key={key}>
                  <TEntry
                    name        ={name}
                    label       ={label}
                    placeholder ={placeholder}
                    defaultValue={composicao[key]}
                    onChange    ={(v) => handleComposicaoChange(key, v)}
                  />
                  {estimado && (
                    <p className="text-[10px] text-amber-500/80 mt-0.5 ml-0.5">estimado</p>
                  )}
                </div>
              )
            })}
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
