import type { StatusCompromisso, TipoRecorrencia } from '@/types/compromisso'

/**
 * Datas da agenda.
 *
 * Duas espécies, e nunca se misturam (as armadilhas de `utils/format.ts`):
 * o **dia do calendário** é `AAAA-MM-DD` local, e vira `Date` só com
 * `T00:00:00`; o **instante** do compromisso é ISO com fuso, como vem da API.
 * Nada de `toISOString().slice(0, 10)`: à noite isso já é amanhã.
 */

/** O dia local de um instante, `AAAA-MM-DD`. `sv-SE` dá o formato sem montar à mão. */
export function diaDe(data: Date | string): string {
  return (typeof data === 'string' ? new Date(data) : data).toLocaleDateString('sv-SE')
}

/** Meia-noite local do dia. */
export function meiaNoite(dia: string): Date {
  return new Date(`${dia}T00:00:00`)
}

export function somarDias(dia: string, n: number): string {
  const d = meiaNoite(dia)
  d.setDate(d.getDate() + n)
  return diaDe(d)
}

/** Segunda-feira da semana do dia — a semana da agenda começa na segunda. */
export function inicioDaSemana(dia: string): string {
  const semana = meiaNoite(dia).getDay() // 0 = domingo
  return somarDias(dia, semana === 0 ? -6 : 1 - semana)
}

export function primeiroDoMes(dia: string): string {
  return `${dia.slice(0, 7)}-01`
}

export function somarMeses(dia: string, n: number): string {
  const d = meiaNoite(primeiroDoMes(dia))
  d.setMonth(d.getMonth() + n)
  return diaDe(d)
}

/** `HH:mm` local de um instante. */
export function horaDe(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

/** O instante (ISO, UTC) de um dia e hora de parede locais. */
export function instante(dia: string, hora: string): string {
  return new Date(`${dia}T${hora}:00`).toISOString()
}

/** Chave de um instante que não depende do formato (`…Z` do servidor × `….000Z` do navegador). */
export function chaveDoInstante(iso: string): string {
  return String(new Date(iso).getTime())
}

/** Minutos desde a meia-noite local do dia — onde o bloco começa na grade. */
export function minutosNoDia(iso: string, dia: string): number {
  return (new Date(iso).getTime() - meiaNoite(dia).getTime()) / 60_000
}

const DIA_LONGO = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
const DIA_CURTO = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })
const SEMANA = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' })
const MES = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' })

/** "quarta-feira, 10 de março" */
export function diaPorExtenso(dia: string): string {
  return DIA_LONGO.format(meiaNoite(dia))
}

/** "qua., 10/03" */
export function diaCurto(dia: string): string {
  return DIA_CURTO.format(meiaNoite(dia))
}

/** "qua." */
export function diaDaSemana(dia: string): string {
  return SEMANA.format(meiaNoite(dia))
}

/** "março de 2027" */
export function mesPorExtenso(dia: string): string {
  return MES.format(meiaNoite(dia))
}

/** "10/03 a 16/03" */
export function faixaDaSemana(segunda: string): string {
  const fmt = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`
  return `${fmt(segunda)} a ${fmt(somarDias(segunda, 6))}`
}

/** "10:00 – 11:00" */
export function faixaDeHorario(inicio: string, fim: string): string {
  return `${horaDe(inicio)} – ${horaDe(fim)}`
}

export function estaAberto(status: StatusCompromisso): boolean {
  return status === 'AGENDADO' || status === 'CONFIRMADO' || status === 'EM_ATENDIMENTO'
}

export const STATUS_ROTULO: Record<StatusCompromisso, string> = {
  AGENDADO: 'Agendado',
  CONFIRMADO: 'Confirmado',
  EM_ATENDIMENTO: 'Em atendimento',
  CONCLUIDO: 'Concluído',
  CANCELADO: 'Cancelado',
  FALTOU: 'Faltou',
}

export const STATUS_TOM = {
  AGENDADO: 'neutro',
  CONFIRMADO: 'info',
  EM_ATENDIMENTO: 'sage',
  CONCLUIDO: 'sucesso',
  CANCELADO: 'erro',
  FALTOU: 'alerta',
} as const satisfies Record<StatusCompromisso, string>

export const RECORRENCIA_OPCOES: { valor: TipoRecorrencia; rotulo: string }[] = [
  { valor: 'DIARIO', rotulo: 'Todo dia' },
  { valor: 'SEMANAL', rotulo: 'Toda semana' },
  { valor: 'QUINZENAL', rotulo: 'A cada 2 semanas' },
  { valor: 'MENSAL', rotulo: 'Todo mês' },
  { valor: 'TRIMESTRAL', rotulo: 'A cada 3 meses' },
  { valor: 'SEMESTRAL', rotulo: 'A cada 6 meses' },
  { valor: 'ANUAL', rotulo: 'Todo ano' },
]

/** Um bloco já posicionado num dia da grade de horas. */
export interface BlocoNoDia<T> {
  item: T
  /** Minutos desde a meia-noite, recortados ao dia. */
  de: number
  ate: number
  /** Coluna do bloco e quantas colunas o seu grupo de sobrepostos ocupa. */
  coluna: number
  colunas: number
}

/**
 * Posiciona os blocos de um dia: altura pela duração e, quando se sobrepõem,
 * lado a lado em colunas — o antigo encaixava tudo na linha da hora de
 * início e empilhava os sobrepostos.
 *
 * Agrupa os que se tocam em cadeia (A sobrepõe B, B sobrepõe C) e dá a cada
 * um a primeira coluna livre; o grupo inteiro divide a largura pelo número
 * de colunas que usou.
 */
export function posicionarNoDia<T extends { inicio: string; fim: string }>(
  itens: T[],
  dia: string,
): BlocoNoDia<T>[] {
  const blocos = itens
    .map((item) => ({
      item,
      de: Math.max(0, minutosNoDia(item.inicio, dia)),
      ate: Math.min(24 * 60, minutosNoDia(item.fim, dia)),
      coluna: 0,
      colunas: 1,
    }))
    .filter((b) => b.ate > b.de)
    .sort((a, b) => a.de - b.de || b.ate - a.ate)

  let grupo: typeof blocos = []
  let fimDoGrupo = -1
  const fecharGrupo = () => {
    const total = Math.max(1, ...grupo.map((b) => b.coluna + 1))
    grupo.forEach((b) => (b.colunas = total))
    grupo = []
  }

  for (const bloco of blocos) {
    if (bloco.de >= fimDoGrupo && grupo.length > 0) fecharGrupo()
    const ocupadas = grupo.filter((b) => b.ate > bloco.de).map((b) => b.coluna)
    let coluna = 0
    while (ocupadas.includes(coluna)) coluna++
    bloco.coluna = coluna
    grupo.push(bloco)
    fimDoGrupo = Math.max(fimDoGrupo, bloco.ate)
  }
  if (grupo.length > 0) fecharGrupo()

  return blocos
}

/** O item toca o dia (algum pedaço dele cai entre a meia-noite e a seguinte). */
export function tocaODia(item: { inicio: string; fim: string }, dia: string): boolean {
  const ini = meiaNoite(dia).getTime()
  const fim = meiaNoite(somarDias(dia, 1)).getTime()
  return new Date(item.inicio).getTime() < fim && new Date(item.fim).getTime() > ini
}
