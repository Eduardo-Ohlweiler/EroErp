import { z } from 'zod';
import { paraNumero, textoDaMascara } from '../../../shared/util/format';
import { rotuloDaFilial } from '../../filiais/api/filiais';
import type { Servico, ServicoCreate } from '../api/servicos';

/*
 * Formulário de Serviço: o schema espelha o ServicoCreateDto/UpdateDto. Validação aqui é conforto (nome, duração, pelo
 * menos uma filial, filial repetida): as regras de verdade (categoria ativa, filial ativa, preço sem sinal e até 2 casas)
 * são da API e voltam em 400/409 com `erros[]` (`nome`, `categoriaId`, `valores`, `valores[i].filialId`, `valores[i].valor`),
 * que o `msg.erroApi(e, form)` põe no campo ou na linha.
 *
 * O preço só existe por filial e é opcional: vazio = não informado (`null`, nunca 0); "0,00" = gratuito.
 * A duração e o preço são texto no formulário (as máscaras gravam texto); o `paraCorpo` converte com `paraNumero`.
 */

export const NOME_MAXIMO = 150;
export const DESCRICAO_MAXIMA = 2000;
export const DURACAO_MAXIMA = 1440;
export const MENSAGEM_SEM_FILIAL = 'Informe pelo menos uma filial onde o serviço é prestado.';

/**
 * A linha de "Filiais e preços". O rótulo, a cor e a situação da filial são só para desenhar o combo e o aviso (o
 * `rotuloInicial`/`corInicial` do combo e o selo "Filial inativa"); não vão para a API.
 */
export type LinhaDeValor = {
  filialId: string;
  filialRotulo: string;
  filialCor: string | null;
  filialAtiva: boolean;
  preco: string;
};

const linha = z.object({
  filialId: z.string().min(1, 'Escolha a filial.'),
  filialRotulo: z.string(),
  filialCor: z.string().nullable(),
  filialAtiva: z.boolean(),
  preco: z.string(),
});

/** Duração vazia (opcional) ou de 1 a 1.440 minutos, inteira. */
const duracao = z.string().refine((v) => {
  const n = paraNumero(v);
  return n === undefined || (Number.isInteger(n) && n >= 1 && n <= DURACAO_MAXIMA);
}, 'Informe de 1 a 1.440 minutos.');

export const schema = z
  .object({
    nome: z.string().trim().min(1, 'Informe o nome.').max(NOME_MAXIMO, `No máximo ${NOME_MAXIMO} caracteres.`),
    categoriaId: z.string(),
    duracao,
    descricao: z.string().max(DESCRICAO_MAXIMA, `No máximo ${DESCRICAO_MAXIMA} caracteres.`),
    valores: z.array(linha).min(1, MENSAGEM_SEM_FILIAL),
  })
  .superRefine((d, ctx) => {
    // marca a 2ª ocorrência, como a API
    const vistas = new Set<string>();
    d.valores.forEach((v, i) => {
      if (!v.filialId) return;
      if (vistas.has(v.filialId)) {
        ctx.addIssue({ code: 'custom', path: ['valores', i, 'filialId'], message: 'Esta filial já está na lista.' });
      }
      vistas.add(v.filialId);
    });
  });

export type Dados = z.infer<typeof schema>;

/** Serviço novo: sem filial (a pessoa acrescenta; pelo menos uma é obrigatória). */
export const VAZIO: Dados = { nome: '', categoriaId: '', duracao: '', descricao: '', valores: [] };

/** Serviço gravado → formulário (o preço volta no formato da máscara; sem preço = campo vazio). */
export function paraForm(s: Servico): Dados {
  return {
    nome: s.nome,
    categoriaId: s.categoria?.id ?? '',
    duracao: s.duracaoMinutos ? String(s.duracaoMinutos) : '',
    descricao: s.descricao ?? '',
    valores: s.valores.map((v) => ({
      filialId: v.filial.id,
      filialRotulo: rotuloDaFilial(v.filial),
      filialCor: v.filial.cor,
      filialAtiva: v.filialAtiva,
      preco: textoDaMascara(v.valor),
    })),
  };
}

/** Formulário → corpo da API: vazio vira `null` (preço vazio nunca vira 0); `valores` vai sempre (é o estado completo). */
export function paraCorpo(d: Dados): ServicoCreate {
  return {
    nome: d.nome.trim(),
    categoriaId: d.categoriaId.trim() === '' ? null : d.categoriaId,
    duracaoMinutos: paraNumero(d.duracao) ?? null,
    descricao: d.descricao.trim() === '' ? null : d.descricao.trim(),
    valores: d.valores.map((v) => ({ filialId: v.filialId, valor: paraNumero(v.preco) ?? null })),
  };
}
