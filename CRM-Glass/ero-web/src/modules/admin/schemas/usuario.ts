import { z } from 'zod';
import type { Papel } from '../../../shared/api/tipos';
import { rotuloDoPapel } from '../../../shared/sessao/rotulos';
import { telefoneOpcionalSchema, telefoneParaApi, telefoneParaForm } from '../../../shared/util/telefone';
import type { GrupoCatalogo, LiberacoesResponse, LiberacoesUpdate, NivelAcesso } from '../api/permissoes';
import type { PapelDoContratante, UsuarioCreate, UsuarioResponse, UsuarioUpdate } from '../api/usuarios';

/*
 * Formulário do usuário: espelha o UsuarioCreateDto / UsuarioUpdateDto (mesmos nomes de campo, para o 400 cair no
 * campo certo) e, no painel "Acesso aos módulos", o LiberacoesUpdateDto em forma de tela: um nível por grupo
 * (`niveis.USUARIOS`) e uma caixa por ação (`acoes.USUARIOS_LIBERAR_ACESSO`). Validação aqui é conforto: a regra
 * (e-mail único, política de senha, limite de usuários, último administrador, escalada de privilégio) é da API.
 */

const SENHA_MINIMO = 12;
const SENHA_MAXIMO = 128;

/** Nível de um grupo na tela: "Sem acesso" é a ausência do grupo na lista da API. */
export const NIVEIS = ['NENHUM', 'LER', 'ESCREVER'] as const;
export type Nivel = (typeof NIVEIS)[number];

const nome = z.string().trim().min(1, 'Informe o nome.').max(150, 'No máximo 150 caracteres.');
const email = z
  .string()
  .trim()
  .min(1, 'Informe o e-mail.')
  .pipe(z.email('E-mail inválido.').max(255, 'No máximo 255 caracteres.'));

export const senhaTemporariaSchema = z
  .string()
  .min(SENHA_MINIMO, `Use ${SENHA_MINIMO} ou mais caracteres.`)
  .max(SENHA_MAXIMO, `No máximo ${SENHA_MAXIMO} caracteres.`);

/** Edição: dados cadastrais e acesso (a senha não se edita aqui: é o "Redefinir senha" do painel Segurança). */
export const schemaEdicao = z.object({
  nome,
  email,
  telefone: telefoneOpcionalSchema,
  papel: z.enum(['ADMIN', 'USUARIO'], 'Escolha o papel.'),
  senha: z.string(),
  niveis: z.record(z.string(), z.enum(NIVEIS)),
  acoes: z.record(z.string(), z.boolean()),
});

/** Criação: os mesmos dados mais a senha temporária (troca no primeiro acesso). */
export const schemaCriacao = schemaEdicao.extend({ senha: senhaTemporariaSchema });

export type DadosUsuario = z.infer<typeof schemaEdicao>;

/** Todos os grupos do catálogo em "Sem acesso" e todas as ações desmarcadas. */
function acessoVazio(catalogo: GrupoCatalogo[]): Pick<DadosUsuario, 'niveis' | 'acoes'> {
  return {
    niveis: Object.fromEntries(catalogo.map((g) => [g.codigo, 'NENHUM' as Nivel])),
    acoes: Object.fromEntries(catalogo.flatMap((g) => g.acoes.map((a) => [a.codigo, false]))),
  };
}

/** Formulário de um usuário novo: papel Usuário, sem acesso nenhum. */
export const vazio = (catalogo: GrupoCatalogo[]): DadosUsuario => ({
  nome: '',
  email: '',
  telefone: '',
  papel: 'USUARIO',
  senha: '',
  ...acessoVazio(catalogo),
});

/** Resposta da API (usuário + liberações) → valores do formulário. */
export function paraForm(u: UsuarioResponse, lib: LiberacoesResponse | undefined, catalogo: GrupoCatalogo[]): DadosUsuario {
  const acesso = acessoVazio(catalogo);
  for (const l of lib?.liberacoes ?? []) if (l.grupo in acesso.niveis) acesso.niveis[l.grupo] = l.nivel;
  for (const a of lib?.acoes ?? []) if (a in acesso.acoes) acesso.acoes[a] = true;
  return {
    nome: u.nome,
    email: u.email,
    telefone: telefoneParaForm(u.telefone),
    papel: u.papel === 'ADMIN' ? 'ADMIN' : 'USUARIO',
    senha: '',
    ...acesso,
  };
}

/** Formulário → corpo da alteração (sem a `version`, que vem do registro lido). */
export const paraCorpo = (d: DadosUsuario): Omit<UsuarioUpdate, 'version'> => ({
  nome: d.nome.trim(),
  email: d.email.trim(),
  telefone: telefoneParaApi(d.telefone),
  papel: d.papel,
});

/** Formulário → corpo da criação. */
export const paraCorpoCriacao = (d: DadosUsuario): UsuarioCreate => ({ ...paraCorpo(d), senha: d.senha });

/** Formulário → corpo das liberações (ação só com o grupo dela liberado; "Sem acesso" não vai). */
export function paraLiberacoes(d: DadosUsuario, catalogo: GrupoCatalogo[]): Omit<LiberacoesUpdate, 'version'> {
  const liberacoes: LiberacoesUpdate['liberacoes'] = [];
  const acoes: string[] = [];
  for (const g of catalogo) {
    const nivel = d.niveis[g.codigo] ?? 'NENHUM';
    if (nivel === 'NENHUM') continue;
    liberacoes.push({ grupo: g.codigo, nivel: nivel as NivelAcesso });
    for (const a of g.acoes) if (d.acoes[a.codigo]) acoes.push(a.codigo);
  }
  return { liberacoes, acoes };
}

/** Os dados cadastrais mudaram em relação ao que foi lido? (decide se o Salvar faz o POST/PUT) */
export function dadosMudaram(d: DadosUsuario, inicial: DadosUsuario): boolean {
  const a = paraCorpo(d);
  const b = paraCorpo(inicial);
  return a.nome !== b.nome || a.email !== b.email || a.telefone !== b.telefone || a.papel !== b.papel;
}

/** O acesso mudou? Compara o que iria para a API (a caixa de uma ação num grupo sem acesso não conta). */
export function acessoMudou(d: DadosUsuario, inicial: DadosUsuario, catalogo: GrupoCatalogo[]): boolean {
  return JSON.stringify(paraLiberacoes(d, catalogo)) !== JSON.stringify(paraLiberacoes(inicial, catalogo));
}

/* ---------------- Quem libera o quê (conforto: quem barra é a API) ---------------- */

/** O meu nível num grupo, pelas `permissoes` do `GET /api/auth/eu`. */
export function meuNivel(permissoes: readonly string[], grupo: string): Nivel {
  if (permissoes.includes(`${grupo}_ESCREVER`)) return 'ESCREVER';
  if (permissoes.includes(`${grupo}_LER`)) return 'LER';
  return 'NENHUM';
}

export const DICA_SO_O_QUE_TEM = 'Você só libera o que tem';

const ROTULO_NIVEL: Record<Nivel, string> = { NENHUM: 'Sem acesso', LER: 'Ler', ESCREVER: 'Ler e escrever' };

/**
 * Opções do rádio de um grupo. Administrador libera tudo; usuário comum só até o nível que ele mesmo tem (as de cima
 * ficam desabilitadas, com a dica).
 */
export function opcoesDeNivel(limite: Nivel | 'TUDO') {
  const teto = limite === 'TUDO' ? NIVEIS.length - 1 : NIVEIS.indexOf(limite);
  return NIVEIS.map((n, i) =>
    i > teto ? { valor: n, rotulo: ROTULO_NIVEL[n], desabilitada: true, dica: DICA_SO_O_QUE_TEM } : { valor: n, rotulo: ROTULO_NIVEL[n] },
  );
}

/** Opções do Papel: Administrador só para quem é ADMIN/SUPERADMIN (ou para mostrar o papel de quem já é). */
export function opcoesDePapel(podeDarAdmin: boolean, atual?: Papel) {
  const usuario = { valor: 'USUARIO', rotulo: rotuloDoPapel('USUARIO') };
  const admin = { valor: 'ADMIN', rotulo: rotuloDoPapel('ADMIN') };
  return podeDarAdmin || atual === 'ADMIN' ? [admin, usuario] : [usuario];
}

/* ---------------- Lista: filtros e situação ---------------- */

export type FiltrosUsuario = { busca: string; papel: '' | PapelDoContratante; situacao: '' | 'ativos' | 'inativos' | 'bloqueados' };

/** A situação começa em Ativos, como em Contratantes. */
export const FILTROS_VAZIOS: FiltrosUsuario = { busca: '', papel: '', situacao: 'ativos' };

export const PAPEL_OPCOES = [
  { valor: 'ADMIN', rotulo: rotuloDoPapel('ADMIN') },
  { valor: 'USUARIO', rotulo: rotuloDoPapel('USUARIO') },
];

export const SITUACAO_USUARIO_OPCOES = [
  { valor: 'ativos', rotulo: 'Ativos' },
  { valor: 'inativos', rotulo: 'Inativos' },
  { valor: 'bloqueados', rotulo: 'Bloqueados' },
];

/** Filtros do formulário → parâmetros da API (`situacao` vira `ativo` ou `bloqueado`; vazio = todos). */
export const paraConsulta = (
  f: FiltrosUsuario,
): { busca?: string; papel?: PapelDoContratante; ativo?: boolean; bloqueado?: boolean } => ({
  busca: f.busca.trim() || undefined,
  papel: f.papel || undefined,
  ativo: f.situacao === 'ativos' ? true : f.situacao === 'inativos' ? false : undefined,
  bloqueado: f.situacao === 'bloqueados' ? true : undefined,
});

const HORA = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' });
const DIA_HORA = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

/** Está bloqueado agora (por tentativas erradas)? */
export const estaBloqueado = (u: Pick<UsuarioResponse, 'bloqueadoAte'>, agoraMs: number): boolean =>
  !!u.bloqueadoAte && new Date(u.bloqueadoAte).getTime() > agoraMs;

/** "14:35" se for hoje; "15/11, 08:00" se passar da meia-noite. */
export function horaDoBloqueio(iso: string, agoraMs: number): string {
  const fim = new Date(iso);
  const mesmoDia = fim.toDateString() === new Date(agoraMs).toDateString();
  return (mesmoDia ? HORA : DIA_HORA).format(fim);
}

export type SituacaoDoUsuario = { tom: 'alerta' | 'erro' | 'info' | 'sucesso'; texto: string };

/** Badge da situação, na ordem do plano: bloqueado > inativo > troca de senha pendente > ativo. */
export function situacaoDoUsuario(
  u: Pick<UsuarioResponse, 'ativo' | 'bloqueadoAte' | 'exigirTrocaSenha'>,
  agoraMs: number,
): SituacaoDoUsuario {
  if (estaBloqueado(u, agoraMs)) return { tom: 'alerta', texto: `Bloqueado até ${horaDoBloqueio(u.bloqueadoAte!, agoraMs)}` };
  if (!u.ativo) return { tom: 'erro', texto: 'Inativo' };
  if (u.exigirTrocaSenha) return { tom: 'info', texto: 'Troca de senha pendente' };
  return { tom: 'sucesso', texto: 'Ativo' };
}
