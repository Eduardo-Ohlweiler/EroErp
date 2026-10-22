import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconAdicionar, IconAnterior, IconProximo } from '@/assets/icons'
import { GradeHoras } from '@/components/agenda/GradeHoras'
import { GradeMes } from '@/components/agenda/GradeMes'
import { ListaAgenda } from '@/components/agenda/ListaAgenda'
import { ResumoCompromisso } from '@/components/agenda/ResumoCompromisso'
import { TBotaoImprimir, TButton, TCheckBox, TCombo, TPage, TPanel } from '@/components/common'
import { DocumentoLista } from '@/components/impressao/DocumentoLista'
import { useAuth } from '@/hooks/useAuth'
import { handleApiError } from '@/services/api'
import { compromissoService } from '@/services/compromissoService'
import { filialService } from '@/services/filialService'
import { usuarioService } from '@/services/usuarioService'
import type { SelectOption } from '@/types/comum'
import type { CompromissoCalendario } from '@/types/compromisso'
import {
  diaCurto,
  diaDaSemana,
  diaDe,
  diaPorExtenso,
  faixaDaSemana,
  faixaDeHorario,
  inicioDaSemana,
  instante,
  meiaNoite,
  mesPorExtenso,
  primeiroDoMes,
  somarDias,
  somarMeses,
  STATUS_ROTULO,
} from '@/utils/agenda'
import type { ColunaExportavel } from '@/utils/planilha'

type Visao = 'dia' | 'semana' | 'mes' | 'lista'

const VISOES: { id: Visao; rotulo: string }[] = [
  { id: 'dia', rotulo: 'Dia' },
  { id: 'semana', rotulo: 'Semana' },
  { id: 'mes', rotulo: 'Mês' },
  { id: 'lista', rotulo: 'Lista' },
]

const CELULAR = '(max-width: 767px)'

/** Abaixo de `md`: a semana vira faixa de dias e o mês, pontos. */
function useCelular(): boolean {
  const [celular, setCelular] = useState(() => window.matchMedia(CELULAR).matches)
  useEffect(() => {
    const consulta = window.matchMedia(CELULAR)
    const aoMudar = () => setCelular(consulta.matches)
    consulta.addEventListener('change', aoMudar)
    return () => consulta.removeEventListener('change', aoMudar)
  }, [])
  return celular
}

const COLUNAS_IMPRESSAS: ColunaExportavel<CompromissoCalendario>[] = [
  { titulo: 'Dia', valor: (c) => diaCurto(diaDe(c.inicio)) },
  { titulo: 'Horário', valor: (c) => faixaDeHorario(c.inicio, c.fim) },
  { titulo: 'Compromisso', valor: (c) => c.titulo },
  { titulo: 'Cliente', valor: (c) => c.pessoaNome ?? '' },
  { titulo: 'Responsável', valor: (c) => c.responsavelNome },
  { titulo: 'Filial', valor: (c) => c.filialNome },
  { titulo: 'Situação', valor: (c) => STATUS_ROTULO[c.status] },
]

/**
 * Agenda. Dia, semana, mês e lista sobre a mesma consulta da janela visível;
 * filial e responsável filtram no servidor, os cancelados só na tela.
 *
 * Abre no mês, que agenda e edita direto (clique no dia ou no compromisso).
 * No celular a semana vira uma faixa de dias tocáveis com a grade do dia
 * escolhido, e o mês mostra pontos — nenhuma das visões exige rolar para os
 * lados em 360 px.
 */
export function Agenda() {
  const navigate = useNavigate()
  const { sessao, podeLer, podeEscrever } = useAuth()
  const escreve = podeEscrever('AGENDA')
  const celular = useCelular()
  const hoje = diaDe(new Date())

  // O mês é a visão padrão, em todo aparelho: é dele que se agenda
  const [visao, setVisao] = useState<Visao>('mes')
  const [dia, setDia] = useState(hoje)
  const [filialId, setFilialId] = useState('')
  const [filialNome, setFilialNome] = useState('')
  const [usuarioId, setUsuarioId] = useState('')
  const [usuarioNome, setUsuarioNome] = useState('')
  const [comCancelados, setComCancelados] = useState(false)
  const [itens, setItens] = useState<CompromissoCalendario[]>([])
  const [carregando, setCarregando] = useState(true)
  const [aberto, setAberto] = useState<string | null>(null)

  /** O superadmin dentro de outro tenant não é usuário de lá: "Meus" não lhe serve. */
  const meuId = sessao && !sessao.impersonating ? sessao.usuarioId : null

  /**
   * O nome de cada opção que os combos já mostraram — o filtro escolhido sai
   * escrito na folha impressa, e o combo só devolve o id.
   */
  const nomes = useRef(new Map<string, string>())
  const lembrar = (opcoes: SelectOption[]) => {
    opcoes.forEach((o) => nomes.current.set(o.id, o.nome))
    return opcoes
  }

  // Trocar de tenant: os filtros eram do anterior
  useEffect(() => {
    setFilialId('')
    setUsuarioId('')
  }, [sessao?.tenantId])

  /** Os dias que a visão cobre — e, com eles, a janela pedida ao servidor. */
  const dias = useMemo(() => {
    if (visao === 'dia') return [dia]
    if (visao === 'mes') {
      const inicio = inicioDaSemana(primeiroDoMes(dia))
      return Array.from({ length: 42 }, (_, i) => somarDias(inicio, i))
    }
    const segunda = inicioDaSemana(dia)
    return Array.from({ length: 7 }, (_, i) => somarDias(segunda, i))
  }, [visao, dia])

  const carregar = useCallback(() => {
    setCarregando(true)
    compromissoService
      .calendario({
        inicio: meiaNoite(dias[0]).toISOString(),
        fim: meiaNoite(somarDias(dias[dias.length - 1], 1)).toISOString(),
        filialId: filialId || undefined,
        usuarioId: usuarioId || undefined,
      })
      .then(setItens)
      .catch(handleApiError)
      .finally(() => setCarregando(false))
    // `sessao.tenantId` é sinal de invalidação: trocar de tenant refaz a consulta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dias, filialId, usuarioId, sessao?.tenantId])

  useEffect(carregar, [carregar])

  const visiveis = comCancelados ? itens : itens.filter((i) => i.status !== 'CANCELADO')

  function navegar(passo: number) {
    if (visao === 'dia') setDia((d) => somarDias(d, passo))
    else if (visao === 'mes') setDia((d) => somarMeses(d, passo))
    else setDia((d) => somarDias(d, 7 * passo))
  }

  function novo(diaEscolhido?: string, hora?: string) {
    const params = new URLSearchParams()
    if (diaEscolhido && hora) params.set('inicio', instante(diaEscolhido, hora))
    if (filialId) params.set('filialId', filialId)
    navigate(`/app/agenda/novo${params.size ? `?${params}` : ''}`)
  }

  /** Cadastro no dia escolhido; a hora o formulário põe (a atual). */
  function novoNoDia(diaEscolhido: string) {
    const params = new URLSearchParams({ dia: diaEscolhido })
    if (filialId) params.set('filialId', filialId)
    navigate(`/app/agenda/novo?${params}`)
  }

  function verDia(diaEscolhido: string) {
    setDia(diaEscolhido)
    setVisao('dia')
  }

  const titulo =
    visao === 'dia'
      ? diaPorExtenso(dia)
      : visao === 'mes'
        ? mesPorExtenso(dia)
        : faixaDaSemana(dias[0])

  return (
    <TPage
      title="Agenda"
      actions={
        <>
          <TBotaoImprimir />
          {escreve && (
            <TButton onClick={() => novo()}>
              <IconAdicionar className="size-4" />
              Novo compromisso
            </TButton>
          )}
        </>
      }
      documento={
        <DocumentoLista
          titulo="Agenda"
          colunas={COLUNAS_IMPRESSAS}
          linhas={visao === 'mes' ? visiveis.filter((i) => diaDe(i.inicio).startsWith(dia.slice(0, 7))) : visiveis}
          chaveDe={(c) => c.id}
          filtros={[
            { rotulo: 'Período', valor: titulo },
            { rotulo: 'Filial', valor: filialId ? filialNome : '' },
            { rotulo: 'Responsável ou convidado', valor: usuarioId ? usuarioNome : '' },
          ]}
          nota={comCancelados ? 'Inclui os cancelados.' : 'Sem os cancelados.'}
        />
      }
    >
      <TPanel>
        <div className="flex flex-col gap-4">
          {/* Filtros */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end">
            <TCombo
              label="Filial"
              value={filialId}
              rotuloInicial={filialNome}
              vazio="Todas as filiais"
              placeholder="Todas as filiais"
              onChange={(id) => {
                setFilialId(id)
                setFilialNome(nomes.current.get(id) ?? '')
              }}
              buscar={(termo) =>
                filialService.select(termo).then((lista) => lembrar(lista.map((f) => ({ id: f.id, nome: f.nome }))))
              }
            />
            <div className="flex items-end gap-2">
              <TCombo
                label="Responsável ou convidado"
                className="min-w-0 flex-1"
                value={usuarioId}
                rotuloInicial={usuarioNome}
                vazio="Todos"
                placeholder="Todos"
                onChange={(id) => {
                  setUsuarioId(id)
                  setUsuarioNome(nomes.current.get(id) ?? '')
                }}
                buscar={(termo) => usuarioService.select(termo).then(lembrar)}
              />
              {meuId && (
                <TButton
                  type="button"
                  variant={usuarioId === meuId ? 'primary' : 'secondary'}
                  onClick={() => {
                    if (usuarioId === meuId) {
                      setUsuarioId('')
                    } else {
                      setUsuarioId(meuId)
                      setUsuarioNome(sessao?.nome ?? '')
                    }
                  }}
                  aria-pressed={usuarioId === meuId}
                >
                  Meus
                </TButton>
              )}
            </div>
            <TCheckBox
              label="Mostrar cancelados"
              checked={comCancelados}
              onChange={(e) => setComCancelados(e.target.checked)}
              className="sm:col-span-2 lg:col-span-1 lg:pb-2"
            />
          </div>

          {/* Navegação e visão */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <TButton type="button" variant="secondary" size="sm" onClick={() => navegar(-1)} aria-label="Anterior">
                <IconAnterior className="size-4" />
              </TButton>
              <TButton type="button" variant="secondary" size="sm" onClick={() => setDia(hoje)}>
                Hoje
              </TButton>
              <TButton type="button" variant="secondary" size="sm" onClick={() => navegar(1)} aria-label="Próximo">
                <IconProximo className="size-4" />
              </TButton>
              <h2 className="ml-1 min-w-0 truncate text-body font-medium text-txt first-letter:uppercase">
                {titulo}
              </h2>
              {carregando && (
                <span
                  role="status"
                  aria-label="Carregando"
                  className="size-4 shrink-0 animate-spin rounded-full border-2 border-primary border-t-transparent"
                />
              )}
            </div>

            <div role="tablist" aria-label="Visão" className="grid grid-cols-4 rounded-md border border-line p-0.5">
              {VISOES.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  role="tab"
                  aria-selected={visao === v.id}
                  onClick={() => setVisao(v.id)}
                  className={`rounded px-3 py-1.5 text-caption
                    ${visao === v.id ? 'bg-primary font-medium text-txt-inverse' : 'text-txt-secondary hover:bg-surface-alt'}`}
                >
                  {v.rotulo}
                </button>
              ))}
            </div>
          </div>

          {/* A semana no celular: faixa de dias, grade do escolhido */}
          {visao === 'semana' && celular && (
            <div className="grid grid-cols-7 gap-1">
              {dias.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDia(d)}
                  aria-pressed={d === dia}
                  className={`flex flex-col items-center rounded-md py-1.5 text-caption
                    ${d === dia ? 'bg-primary text-txt-inverse' : d === hoje ? 'text-primary' : 'text-txt-secondary'}
                    ${d !== dia ? 'hover:bg-surface-alt' : ''}`}
                >
                  <span className="capitalize">{diaDaSemana(d).replace('.', '')}</span>
                  <span className="font-medium">{Number(d.slice(8, 10))}</span>
                  <span
                    className={`mt-0.5 size-1 rounded-full ${
                      visiveis.some((i) => diaDe(i.inicio) === d) ? (d === dia ? 'bg-txt-inverse' : 'bg-primary') : ''
                    }`}
                  />
                </button>
              ))}
            </div>
          )}

          {(visao === 'dia' || visao === 'semana') && (
            <GradeHoras
              dias={visao === 'semana' && celular ? [dia] : dias}
              itens={visiveis}
              hoje={hoje}
              onAbrir={(i) => setAberto(i.id)}
              onNovo={escreve ? novo : undefined}
            />
          )}

          {visao === 'mes' && (
            <>
              {/*
                O mês agenda e edita direto: o dia abre o cadastro naquele dia,
                o compromisso abre o formulário dele. Quem só lê vai à visão do
                dia, e o formulário abre travado.
              */}
              <GradeMes
                dias={dias}
                mes={dia.slice(0, 7)}
                itens={visiveis}
                hoje={hoje}
                selecionado={dia}
                compacto={celular}
                onAbrir={(i) =>
                  // A consulta abre na tela dela, que tem os itens e o concluir
                  navigate(i.consultaId && podeLer('CONSULTAS') ? `/app/consultas/${i.consultaId}` : `/app/agenda/${i.id}`)
                }
                onSelecionarDia={(d) => (escreve ? novoNoDia(d) : verDia(d))}
                onVerDia={verDia}
              />
            </>
          )}

          {visao === 'lista' && (
            <ListaAgenda dias={dias} itens={visiveis} hoje={hoje} onAbrir={(i) => setAberto(i.id)} />
          )}
        </div>
      </TPanel>

      <ResumoCompromisso
        id={aberto}
        onFechar={() => setAberto(null)}
        onAlterado={carregar}
        podeEscrever={escreve}
      />
    </TPage>
  )
}
