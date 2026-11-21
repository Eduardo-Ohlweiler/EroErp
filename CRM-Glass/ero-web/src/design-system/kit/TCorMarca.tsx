import { cn } from '../../shared/util/utils';
import { CLASSE_DA_BOLINHA, estiloDaCor } from './cores';

export type TCorMarcaProps = {
  /** `#RRGGBB` vindo do banco; fora do formato, a bolinha sai neutra (nada vai para o CSS) */
  cor: string | null | undefined;
  /** `sm` 12 px (grade, cartões do celular, combos) · `md` 16 px (padrão) */
  tamanho?: 'sm' | 'md';
  /** o que a cor quer dizer ("Cor: Azul"): vira `title` e `aria-label`; sem ele, a bolinha é decorativa (`aria-hidden`) */
  rotulo?: string;
  className?: string;
};

/**
 * A bolinha da cor de um registro (docs/07 §3.2): só exibição, para a grade, os cartões do celular e os combos. A cor
 * entra só pela variável `--cor-do-registro`, conferida antes (`^#[0-9A-Fa-f]{6}$`); o anel `--line-strong` vem
 * sempre, para a borda aparecer em qualquer cor e nos dois temas (WCAG 1.4.11). A cor nunca é a única informação:
 * ao lado vai o nome, ou o `rotulo`.
 */
export function TCorMarca({ cor, tamanho = 'md', rotulo, className }: TCorMarcaProps) {
  return (
    <span
      data-kit="TCorMarca"
      role={rotulo ? 'img' : undefined}
      aria-label={rotulo}
      title={rotulo}
      aria-hidden={rotulo ? undefined : true}
      style={estiloDaCor(cor)}
      className={cn('inline-block shrink-0 align-middle', CLASSE_DA_BOLINHA, tamanho === 'sm' ? 'size-3 border' : 'size-4 border-[1.5px]', className)}
    />
  );
}
