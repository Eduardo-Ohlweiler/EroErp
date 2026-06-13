import { useEffect, useState }           from "react"
import { useNavigate, useParams }         from "react-router-dom"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts"
import { api }                            from "../../services/api"
import type { AvaliacaoFisicaSummary }    from "../../types/AvaliacaoFisica"
import { OBJETIVO_LABELS, PONTO_LABELS }  from "../../types/AvaliacaoFisica"
import { TPage }                          from "../../components/tpage"
import { TPanel }                         from "../../components/tpanel"
import { TButton }                        from "../../components/tbutton"
import { TRow }                           from "../../components/trow"
import { TCol }                           from "../../components/tcol"
import { useMessage }                     from "../../hooks/useMessage"
import TBodyChart                         from "../../components/TBodyChart"

function formatarData(iso: string): string {
  if (!iso) return "—"
  const [y, m, d] = iso.split("-")
  return `${d}/${m}/${y}`
}

function calcImc(peso: number, altura: number): string {
  if (!peso || !altura) return "—"
  const h = altura / 100
  return (peso / (h * h)).toFixed(1)
}

export default function AvaliacaoFisicaEvolucao() {
  const { pessoaId }    = useParams<{ pessoaId: string }>()
  const navigate         = useNavigate()
  const { showMessage }  = useMessage()

  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoFisicaSummary[]>([])
  const [loading,    setLoading]    = useState(false)
  const [nomePessoa, setNomePessoa] = useState("")

  useEffect(() => {
    if (pessoaId) carregar()
  }, [pessoaId])

  async function carregar() {
    setLoading(true)
    try {
      const res = await api.get<AvaliacaoFisicaSummary[]>(`/avaliacoes-fisicas/evolucao/${pessoaId}`)
      setAvaliacoes(res.data)
      if (res.data.length > 0) setNomePessoa(res.data[0].pessoaNome)
    } catch {
      showMessage("error", "Erro ao carregar histórico de avaliações")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <TPage
        title     ="Evolução Física"
        breadcrumb={["Avaliação Física", "Evolução"]}
        actions   ={
          <TButton
            label   ="Voltar"
            variant ="cancel"
            type    ="button"
            onClick ={() => navigate(-1)}
          />
        }
      >
        <div className="p-8 text-center text-gray-500">Carregando...</div>
      </TPage>
    )
  }

  if (!avaliacoes.length) {
    return (
      <TPage
        title     ="Evolução Física"
        breadcrumb={["Avaliação Física", "Evolução"]}
        actions   ={
          <TButton
            label   ="Voltar"
            variant ="cancel"
            type    ="button"
            onClick ={() => navigate(-1)}
          />
        }
      >
        <div className="p-8 text-center text-gray-400">
          Nenhuma avaliação encontrada para este paciente.
        </div>
      </TPage>
    )
  }

  const primeira = avaliacoes[0]
  const ultima   = avaliacoes[avaliacoes.length - 1]

  // Dados para o gráfico de linha
  const dadosGrafico = avaliacoes.map(a => {
    const ponto: Record<string, number | string> = {
      data:    formatarData(a.dataAvaliacao),
      Peso:    Number(a.peso),
      IMC:     a.imc ? Number(a.imc) : Number(calcImc(Number(a.peso), Number(a.altura))),
    }
    if (a.composicao?.percentualGordura != null)
      ponto['% Gordura'] = Number(a.composicao.percentualGordura)
    const cintura = a.medidas.find(m => m.pontoMedicao === 'CINTURA')
    if (cintura) ponto['Cintura (cm)'] = Number(cintura.valorCm)
    return ponto
  })

  const linhas = [
    { key: 'Peso',        cor: '#3b82f6' },
    { key: 'IMC',         cor: '#8b5cf6' },
    { key: '% Gordura',   cor: '#ef4444' },
    { key: 'Cintura (cm)',cor: '#f59e0b' },
  ].filter(l => dadosGrafico.some(d => l.key in d))

  // Diferença entre primeira e última
  function delta(atual: number | null | undefined, base: number | null | undefined): string {
    if (atual == null || base == null) return "—"
    const d = Number(atual) - Number(base)
    return (d >= 0 ? "+" : "") + d.toFixed(1)
  }

  function corDelta(atual: number | null | undefined, base: number | null | undefined, menorMelhor = true): string {
    if (atual == null || base == null) return "text-gray-400"
    const d = Number(atual) - Number(base)
    if (d === 0) return "text-gray-500"
    return (d < 0) === menorMelhor ? "text-green-600" : "text-red-500"
  }

  return (
    <TPage
      title     ={`Evolução — ${nomePessoa}`}
      breadcrumb={["Avaliação Física", "Evolução", nomePessoa]}
      actions   ={
        <div className="flex gap-2">
          <TButton
            label   ="Voltar"
            variant ="cancel"
            type    ="button"
            onClick ={() => navigate(-1)}
          />
          <TButton
            label   ="Nova Avaliação"
            variant ="save"
            onClick ={() => navigate(`/avaliacao/avaliacoes-fisicas/novo`)}
          />
        </div>
      }
    >

      {/* ── Resumo ─────────────────────────────────────────────────────── */}
      <TPanel title="Resumo do Progresso">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Avaliações",  valor: String(avaliacoes.length), unidade: "registros", menorMelhor: false, semDelta: true },
            { label: "Peso",        valor: `${Number(ultima.peso).toFixed(1)}`, unidade: "kg",    base: Number(primeira.peso),   atual: Number(ultima.peso),   menorMelhor: true },
            { label: "IMC",         valor: ultima.imc ? Number(ultima.imc).toFixed(1) : calcImc(Number(ultima.peso), Number(ultima.altura)), unidade: "",  base: primeira.imc ? Number(primeira.imc) : null, atual: ultima.imc ? Number(ultima.imc) : null, menorMelhor: true },
            { label: "% Gordura",   valor: ultima.composicao?.percentualGordura != null ? `${Number(ultima.composicao.percentualGordura).toFixed(1)}` : "—", unidade: "%", base: primeira.composicao?.percentualGordura != null ? Number(primeira.composicao.percentualGordura) : null, atual: ultima.composicao?.percentualGordura != null ? Number(ultima.composicao.percentualGordura) : null, menorMelhor: true },
          ].map(card => (
            <div key={card.label} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <p className="text-xs text-gray-500 mb-1">{card.label}</p>
              <p className="text-2xl font-bold text-gray-800">{card.valor}<span className="text-sm font-normal text-gray-500 ml-1">{card.unidade}</span></p>
              {!card.semDelta && (
                <p className={`text-sm font-medium mt-1 ${corDelta(card.atual, card.base, card.menorMelhor)}`}>
                  {delta(card.atual, card.base)} vs inicial
                </p>
              )}
            </div>
          ))}
        </div>
      </TPanel>

      {/* ── Gráfico Evolutivo ──────────────────────────────────────────── */}
      {dadosGrafico.length >= 2 && (
        <TPanel title="Gráfico Evolutivo">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dadosGrafico} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
              <XAxis dataKey="data" tick={{ fontSize: 11 }}/>
              <YAxis tick={{ fontSize: 11 }}/>
              <Tooltip/>
              <Legend/>
              {linhas.map(l => (
                <Line
                  key         ={l.key}
                  type        ="monotone"
                  dataKey     ={l.key}
                  stroke      ={l.cor}
                  strokeWidth ={2}
                  dot         ={{ r: 4 }}
                  activeDot   ={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </TPanel>
      )}

      {/* ── Comparativo Corporal ───────────────────────────────────────── */}
      {avaliacoes.length >= 2 && (
        <TPanel title="Comparativo Corporal — Inicial vs Atual">
          <TRow>
            <TCol flex={1}>
              <TBodyChart
                medidas    ={primeira.medidas}
                sexo       ={primeira.sexo}
                titulo     ={`Inicial — ${formatarData(primeira.dataAvaliacao)}`}
              />
            </TCol>
            <div className="flex flex-col justify-center items-center px-4 gap-3 min-w-[80px]">
              {primeira.medidas.map(m => {
                const atual = ultima.medidas.find(a => a.pontoMedicao === m.pontoMedicao)
                if (!atual) return null
                const d = Number(atual.valorCm) - Number(m.valorCm)
                if (d === 0) return null
                return (
                  <div key={m.pontoMedicao} className="text-xs text-center">
                    <span className="text-gray-400">{PONTO_LABELS[m.pontoMedicao]}</span>
                    <br/>
                    <span className={d < 0 ? "text-green-600 font-semibold" : "text-red-500 font-semibold"}>
                      {d > 0 ? "▲" : "▼"} {Math.abs(d).toFixed(1)}
                    </span>
                  </div>
                )
              })}
            </div>
            <TCol flex={1}>
              <TBodyChart
                medidas    ={ultima.medidas}
                medidasBase={primeira.medidas}
                sexo       ={ultima.sexo}
                titulo     ={`Atual — ${formatarData(ultima.dataAvaliacao)}`}
              />
            </TCol>
          </TRow>
        </TPanel>
      )}

      {/* ── Histórico de Objetivos ─────────────────────────────────────── */}
      <TPanel title="Histórico de Objetivos e Metas">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500 text-xs">
                <th className="py-2 pr-4">Data</th>
                <th className="py-2 pr-4">Objetivo</th>
                <th className="py-2 pr-4">Meta</th>
                <th className="py-2 pr-4">Peso Alvo</th>
                <th className="py-2 pr-4">Peso Real</th>
                <th className="py-2">IMC</th>
              </tr>
            </thead>
            <tbody>
              {[...avaliacoes].reverse().map(a => (
                <tr
                  key      ={a.id}
                  className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                  onClick  ={() => navigate(`/avaliacao/avaliacoes-fisicas/${a.id}`)}
                >
                  <td className="py-2 pr-4 font-medium">{formatarData(a.dataAvaliacao)}</td>
                  <td className="py-2 pr-4">{OBJETIVO_LABELS[a.objetivo]}</td>
                  <td className="py-2 pr-4 text-gray-600 max-w-[200px] truncate">{a.metaDescricao ?? "—"}</td>
                  <td className="py-2 pr-4">{a.pesoAlvo ? `${Number(a.pesoAlvo).toFixed(1)} kg` : "—"}</td>
                  <td className="py-2 pr-4">{Number(a.peso).toFixed(1)} kg</td>
                  <td className="py-2">{a.imc ? Number(a.imc).toFixed(1) : calcImc(Number(a.peso), Number(a.altura))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TPanel>
    </TPage>
  )
}
