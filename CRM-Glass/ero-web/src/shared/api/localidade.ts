import { z } from 'zod';
import { api } from './cliente';
import type { OpcaoCombo, OpcaoDoBanco } from '../../design-system/kit';

/*
 * Localidades (ero-api, módulo `localidade`; as duas rotas valem para qualquer usuário sem pendência — ACESSO_LIBERADO):
 *   GET /api/cidades/selecao?busca=&uf=  → CidadeSelectDto[]  (até 50, por nome; a busca ignora acento)
 *   GET /api/cep/{cep}                   → CepResponseDto     (consulta o ViaCEP pelo back; 404 = CEP não encontrado,
 *                                                              503 = serviço indisponível: preencher à mão)
 * Cidade e estado vêm do IBGE (tabelas de referência, iguais para todos os contratantes).
 */

const cidadeSchema = z.object({ id: z.string(), nome: z.string(), uf: z.string() });
export type Cidade = z.infer<typeof cidadeSchema>;

/** "Porto Alegre - RS": como a cidade aparece no combo e na grade. */
export const rotuloDaCidade = (c: Pick<Cidade, 'nome' | 'uf'>) => `${c.nome} - ${c.uf}`;

/** `TDBCombo`: busca no servidor. Sem termo (ao abrir), a API devolve as primeiras 50. */
export async function buscarCidades(termo?: string): Promise<OpcaoDoBanco[]> {
  const p = new URLSearchParams();
  const busca = termo?.trim();
  if (busca) p.set('busca', busca);
  const consulta = p.toString();
  const lista = await api.requisitar(`/api/cidades/selecao${consulta ? `?${consulta}` : ''}`, { schema: z.array(cidadeSchema) });
  return lista.map((c) => ({ id: c.id, nome: rotuloDaCidade(c) }));
}

/** CepResponseDto. `cepUnico`: o CEP é da cidade toda (sem rua e bairro). */
export const cepSchema = z.object({
  cep: z.string(),
  cidade: cidadeSchema.nullable().optional(),
  rua: z.string().nullable().optional(),
  bairro: z.string().nullable().optional(),
  cepUnico: z.boolean().optional().default(false),
});
export type CepResposta = z.infer<typeof cepSchema>;

/** `cep` só com os 8 dígitos. Erro da API (404, 503) sobe como `ErroApi`: quem chama mostra e deixa preencher à mão. */
export const consultarCep = (cep: string): Promise<CepResposta> =>
  api.requisitar(`/api/cep/${encodeURIComponent(cep)}`, { schema: cepSchema });

/** EstadoSelectDto: os 27 estados (tabela do IBGE, iguais para todos os contratantes). */
const estadoSchema = z.object({ id: z.string(), sigla: z.string(), nome: z.string() });
export type Estado = z.infer<typeof estadoSchema>;

/** `GET /api/estados` (ACESSO_LIBERADO): os 27, por sigla. Alimenta o `TCombo` de UF (órgão emissor do RG, naturalidade). */
export const listarEstados = (): Promise<Estado[]> => api.requisitar('/api/estados', { schema: z.array(estadoSchema) });

/** Chave do TanStack Query da lista de estados (não muda: `staleTime` infinito nas telas). */
export const CHAVE_ESTADOS = ['estados'] as const;

/** Opções do `TCombo` de UF: o valor é o id do estado e o rótulo é a sigla ("RS"). */
export const opcoesDeUf = (lista: readonly Estado[]): OpcaoCombo[] => lista.map((e) => ({ valor: e.id, rotulo: e.sigla }));
