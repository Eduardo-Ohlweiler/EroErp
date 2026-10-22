import { z } from 'zod'
import type { Sessao } from '@/types/auth'
import type { CompromissoRequest, CompromissoResponse } from '@/types/compromisso'
import { diaDe, horaDe, instante } from '@/utils/agenda'
import { hojeIso } from '@/utils/format'

/**
 * O formulário do compromisso — schema, valores iniciais e corpo —, dividido
 * pelos dois formulários que o usam: o da agenda e o da consulta. Os campos
 * na tela são o `CamposCompromisso`.
 */

export const HORA = /^\d{2}:\d{2}$/

export const camposCompromissoSchema = z.object({
  filialId: z.string().min(1, 'Escolha a filial'),
  filialRotulo: z.string(),
  responsavelId: z.string().min(1, 'Escolha o responsável'),
  responsavelRotulo: z.string(),
  pessoaId: z.string(),
  pessoaRotulo: z.string(),
  titulo: z.string().trim().min(1, 'Informe o título').max(255, 'Até 255 caracteres'),
  dia: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe o dia'),
  horaInicio: z.string().regex(HORA, 'Informe a hora'),
  horaFim: z.string().regex(HORA, 'Informe a hora'),
  convidados: z.array(z.object({ id: z.string(), nome: z.string() })).max(20, 'No máximo 20 convidados'),
  corDaFilial: z.boolean(),
  cor: z.string(),
  descricao: z.string().max(2000, 'Até 2000 caracteres'),
})

export type CamposCompromissoDados = z.infer<typeof camposCompromissoSchema>

/** A guarda de horário que o `superRefine` de cada formulário aplica. */
export function refinarHorario(d: Pick<CamposCompromissoDados, 'horaInicio' | 'horaFim'>, ctx: z.RefinementCtx) {
  if (HORA.test(d.horaInicio) && HORA.test(d.horaFim) && d.horaFim <= d.horaInicio) {
    ctx.addIssue({ code: 'custom', message: 'Termina depois de começar', path: ['horaFim'] })
  }
}

/** Hora cheia seguinte — o horário padrão de quem abre "Novo" sem escolher um. */
function proximaHoraCheia(): string {
  const h = Math.min(new Date().getHours() + 1, 23)
  return `${String(h).padStart(2, '0')}:00`
}

/** A hora do relógio, `HH:mm`, sem arredondar. */
function horaAtual(): string {
  return horaDe(new Date().toISOString())
}

/** Uma hora depois, sem passar da meia-noite (o fim é do mesmo dia). */
function maisUmaHora(hora: string): string {
  const [h, m] = hora.split(':').map(Number)
  return h >= 23 ? '23:59' : `${String(h + 1).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/**
 * O cadastro novo. `?inicio=` vem do clique num horário da grade; `?dia=` do
 * clique num dia do mês, e aí começa na hora atual.
 */
export function camposIniciais(busca: URLSearchParams, sessao: Sessao | null): CamposCompromissoDados {
  const inicio = busca.get('inicio')
  const diaEscolhido = busca.get('dia')
  const diaValido = diaEscolhido && /^\d{4}-\d{2}-\d{2}$/.test(diaEscolhido) ? diaEscolhido : null
  const horaInicio = inicio ? horaDe(inicio) : diaValido ? horaAtual() : proximaHoraCheia()
  // O logado é usuário do tenant em que está — salvo o superadmin dentro
  // de outro tenant, que lá não existe como usuário
  const eu = sessao && !sessao.impersonating
  return {
    filialId: busca.get('filialId') ?? '',
    filialRotulo: '',
    responsavelId: eu ? sessao.usuarioId : '',
    responsavelRotulo: eu ? sessao.nome : '',
    pessoaId: '',
    pessoaRotulo: '',
    titulo: '',
    dia: inicio ? diaDe(inicio) : (diaValido ?? hojeIso()),
    horaInicio,
    horaFim: maisUmaHora(horaInicio),
    convidados: [],
    corDaFilial: true,
    cor: '#3B82F6',
    descricao: '',
  }
}

export function camposDeResposta(c: CompromissoResponse): CamposCompromissoDados {
  return {
    filialId: c.filialId,
    filialRotulo: c.filialNome,
    responsavelId: c.responsavelId,
    responsavelRotulo: c.responsavelNome,
    pessoaId: c.pessoaId ?? '',
    pessoaRotulo: c.pessoaNome ?? '',
    titulo: c.titulo,
    dia: diaDe(c.inicio),
    horaInicio: horaDe(c.inicio),
    horaFim: horaDe(c.fim),
    convidados: c.convidados.map((cv) => ({ id: cv.usuarioId, nome: cv.nome })),
    // A API omite o nulo: sem cor gravada o campo nem vem
    corDaFilial: c.cor == null,
    cor: c.cor ?? c.corExibicao,
    descricao: c.descricao ?? '',
  }
}

/** O corpo do compromisso — o do PUT da agenda, sem a recorrência. */
export function compromissoDoFormulario(d: CamposCompromissoDados): Omit<CompromissoRequest, 'recorrencia' | 'ocorrencias'> {
  return {
    filialId: d.filialId,
    responsavelId: d.responsavelId,
    pessoaId: d.pessoaId || null,
    titulo: d.titulo.trim(),
    descricao: d.descricao.trim() || undefined,
    cor: d.corDaFilial ? null : d.cor.toUpperCase(),
    inicio: instante(d.dia, d.horaInicio),
    fim: instante(d.dia, d.horaFim),
    convidadoIds: d.convidados.map((c) => c.id),
  }
}
