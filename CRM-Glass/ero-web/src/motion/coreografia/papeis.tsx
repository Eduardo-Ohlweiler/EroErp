import type { ReactNode } from 'react';
import type { Variants } from 'motion/react';
import { useReduzirMovimento } from '../reduzir';
import { blocoReduzido, coreografias, type NomeCoreografia, type Papel } from '../tokens';
import { BlocoDaTela, useCoreografiaDaTela } from './contexto';

/**
 * Variantes de um papel do kit na coreografia informada; sem ela (ou se ela não define o papel), as da `padrao`.
 * Fora de componente; dentro, prefira `useVariantesDoPapel` (que respeita o movimento reduzido).
 */
export function variantesDoPapel(papel: Papel, coreografia?: NomeCoreografia | null): Variants {
  return coreografias[coreografia ?? 'padrao'].variantes[papel] ?? coreografias.padrao.variantes[papel];
}

/**
 * Encaixe de um bloco do kit T* conforme o papel dele e a coreografia da <Tela> em volta (docs/07 §4.4):
 *
 *  - `cartao`     → GlassCard do TForm: encaixa como bloco da tela e põe os campos e o rodapé em cascata.
 *  - `campo`      → CampoForm de cada campo (TEntry, TCombo, TAuditoria...). Dentro de <DentroDoCartao> é automático.
 *  - `rodape`     → BarraAcoes do TFormFooter (último da cascata do cartão).
 *  - `grade`      → contêiner da Tabela do TDataGrid: encaixa como bloco e põe as primeiras linhas em cascata.
 *  - `linhaGrade` → `variantesLinha` da Tabela (e cada cartão de linha abaixo de `md`), com `linhasAnimadas={kit.linhas.quantas}`.
 *
 * Movimento reduzido (sistema ou contratante): todos só esmaecem, sem cascata (`blocoReduzido`).
 */
export function useVariantesDoPapel(papel: Papel): Variants {
  const reduzir = useReduzirMovimento();
  const coreografia = useCoreografiaDaTela();
  return reduzir ? blocoReduzido : variantesDoPapel(papel, coreografia);
}

/**
 * Dentro do cartão: os blocos de dentro (CampoForm, BarraAcoes, <Bloco>) encaixam como `campo`, em cascata
 * pelo ritmo do `cartao`, sem cada campo precisar receber `variants`. Vai logo dentro do GlassCard do TForm:
 *
 *   const cartao = useVariantesDoPapel('cartao');
 *   <GlassCard level="solid" variants={cartao}>
 *     <DentroDoCartao><form noValidate>…campos… <BarraAcoes variants={rodape}>…</BarraAcoes></form></DentroDoCartao>
 *   </GlassCard>
 */
export function DentroDoCartao({ children }: { children: ReactNode }) {
  const campo = useVariantesDoPapel('campo');
  return <BlocoDaTela.Provider value={campo}>{children}</BlocoDaTela.Provider>;
}
