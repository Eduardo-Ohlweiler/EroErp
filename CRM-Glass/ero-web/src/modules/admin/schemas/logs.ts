import { hojeIso } from '../../../shared/util/format';
import { partesIso, somarDias } from '../../../shared/util/datas';
import type { ConsultaEventos, EventoResponse, TipoEvento } from '../api/auditoria';

/*
 * Filtros dos Logs. O período é de dias do calendário de quem usa (De · Até, `AAAA-MM-DD`); a API recebe instantes
 * ISO-8601 em UTC, com `de` inclusivo e `ate` exclusivo. A consulta da grade e a exportação usam o MESMO
 * `paraConsulta`: o CSV e o papel nunca discordam da tela.
 */

export type FiltrosLogs = { de: string; ate: string; categoria: string; usuarioId: string; tenantId: string };

/** Padrão: os últimos 7 dias, hoje incluído (hoje − 6 até hoje). Função: "hoje" muda se a tela ficar aberta. */
export const filtrosIniciais = (hoje = hojeIso()): FiltrosLogs => ({
  de: somarDias(hoje, -6),
  ate: hoje,
  categoria: '',
  usuarioId: '',
  tenantId: '',
});

/** Meia-noite LOCAL do dia `AAAA-MM-DD`, em ISO UTC ("2026-11-14" em Brasília → "2026-11-14T03:00:00.000Z"). */
export function inicioDoDiaIso(dia: string): string | undefined {
  const p = partesIso(dia);
  return p ? new Date(p.ano, p.mes, p.dia).toISOString() : undefined;
}

/** Categorias do filtro, na ordem dos tipos; "Contratantes" só na visão de plataforma. */
export function categoriasDe(tipos: TipoEvento[], naPlataforma: boolean): { valor: string; rotulo: string }[] {
  const vistas = new Map<string, string>();
  for (const t of tipos) if (!vistas.has(t.categoria)) vistas.set(t.categoria, t.categoriaRotulo);
  return [...vistas]
    .filter(([c]) => naPlataforma || c !== 'CONTRATANTES')
    .map(([valor, rotulo]) => ({ valor, rotulo }));
}

/**
 * Filtros do formulário → parâmetros da API: `de` às 00:00 locais do dia, `ate` às 00:00 do dia SEGUINTE (exclusivo:
 * o dia do "Até" entra inteiro); a categoria vira a lista dos tipos dela; o usuário só dentro de um contratante e o
 * contratante só na plataforma (a API ignora `tenantId` fora dela).
 */
export function paraConsulta(
  f: FiltrosLogs,
  tipos: TipoEvento[],
  naPlataforma: boolean,
): Omit<ConsultaEventos, 'page' | 'size'> {
  const r: Omit<ConsultaEventos, 'page' | 'size'> = {};
  const de = f.de ? inicioDoDiaIso(f.de) : undefined;
  const ate = f.ate && partesIso(f.ate) ? inicioDoDiaIso(somarDias(f.ate, 1)) : undefined;
  if (de) r.de = de;
  if (ate) r.ate = ate;
  if (f.categoria) r.tipos = tipos.filter((t) => t.categoria === f.categoria).map((t) => t.codigo);
  if (!naPlataforma && f.usuarioId) r.usuarioId = f.usuarioId;
  if (naPlataforma && f.tenantId) r.tenantId = f.tenantId;
  return r;
}

export const SUPORTE_DA_PLATAFORMA = 'Suporte da plataforma';

/** Quem foi afetado: o nome; o superadmin visto de dentro do contratante; senão, ninguém. */
export const usuarioDoEvento = (e: Pick<EventoResponse, 'usuarioNome' | 'usuarioId' | 'suporte'>): string =>
  e.usuarioNome || (e.suporte && !e.usuarioId ? SUPORTE_DA_PLATAFORMA : '—');

/** Quem fez: o nome; o superadmin visto de dentro do contratante; senão, o próprio sistema (login, bloqueio). */
export const autorDoEvento = (e: Pick<EventoResponse, 'autorNome' | 'autorId' | 'suporte'>): string =>
  e.autorNome || (e.suporte && !e.autorId ? SUPORTE_DA_PLATAFORMA : 'Sistema');

export type TomDoEvento = 'erro' | 'info' | 'neutro';

/** Badge do evento: falha em vermelho, coisa do suporte em azul, o resto neutro. */
export function tomDoEvento(e: Pick<EventoResponse, 'tipo' | 'suporte'>, tipo?: TipoEvento): TomDoEvento {
  if (tipo?.falha) return 'erro';
  if (e.suporte || tipo?.categoria === 'SUPORTE') return 'info';
  return 'neutro';
}
