import { createContext, useContext, type ComponentType, type ReactNode } from 'react';
import { Check, ChevronLeft, Eraser, FileSpreadsheet, FileText, Lock, LockOpen, Pencil, Plus, Search } from 'lucide-react';
import { Button, type ButtonProps } from '../ui/Button';
import { cn } from '../../shared/util/utils';
import { useSomenteLeituraDoForm } from './somenteLeitura';

type Generica = 'primary' | 'secondary' | 'ghost' | 'danger';

/** As ações do kit (docs/07 §3.4): ícone, cor e rótulo prontos. */
export type AcaoTButton = 'salvar' | 'novo' | 'buscar' | 'limpar' | 'voltar' | 'exportar' | 'pdf' | 'editar' | 'inativar' | 'reativar';

export type VarianteTButton = Generica | AcaoTButton;

type Icone = ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;

/**
 * Tamanho que o contêiner impõe aos TButton de dentro quando a tela não passa `size` (o `acoes` do TDataGrid
 * usa `sm`: a tela não repete `size="sm"` em cada botão da grade).
 */
export const TamanhoDoTButton = createContext<'md' | 'sm' | undefined>(undefined);

/**
 * Cores do 2.0 em versão glass (tokens de styles/tokens.css, classes de index.css):
 * Salvar e Exportar verde, Buscar azul, Limpar vermelho, Pdf âmbar, Novo na cor do contratante, Voltar neutro;
 * na grade, Editar azul, Inativar vermelho e Reativar verde, leves (só o ícone na cor).
 */
const ACOES: Record<AcaoTButton, { rotulo: string; variante: ButtonProps['variant']; classe: string; icone: Icone; escreve: boolean; leve?: boolean }> = {
  salvar: { rotulo: 'Salvar', variante: 'acao', classe: 'acao-sucesso btn-shine', icone: Check, escreve: true },
  novo: { rotulo: 'Novo', variante: 'primary', classe: '', icone: Plus, escreve: true },
  buscar: { rotulo: 'Buscar', variante: 'acao', classe: 'acao-info btn-shine', icone: Search, escreve: false },
  limpar: { rotulo: 'Limpar', variante: 'acao', classe: 'acao-perigo btn-shine', icone: Eraser, escreve: false },
  voltar: { rotulo: 'Voltar', variante: 'glass', classe: '', icone: ChevronLeft, escreve: false },
  exportar: { rotulo: 'Exportar', variante: 'acao', classe: 'acao-sucesso btn-shine', icone: FileSpreadsheet, escreve: false },
  pdf: { rotulo: 'Pdf', variante: 'acao', classe: 'acao-alerta btn-shine', icone: FileText, escreve: false },
  editar: { rotulo: 'Editar', variante: 'acao', classe: 'acao-leve-info', icone: Pencil, escreve: false, leve: true },
  inativar: { rotulo: 'Inativar', variante: 'acao', classe: 'acao-leve-perigo', icone: Lock, escreve: true, leve: true },
  reativar: { rotulo: 'Reativar', variante: 'acao', classe: 'acao-leve-sucesso', icone: LockOpen, escreve: true, leve: true },
};

const GENERICAS: Record<Generica, ButtonProps['variant']> = {
  primary: 'primary',
  secondary: 'glass',
  ghost: 'ghost',
  danger: 'danger',
};

/** As ações que gravam: somem dentro de `TForm somenteLeitura`. */
export const ACOES_QUE_GRAVAM: AcaoTButton[] = (Object.keys(ACOES) as AcaoTButton[]).filter((a) => ACOES[a].escreve);

export type TButtonProps = Omit<ButtonProps, 'variant' | 'size' | 'carregando' | 'children'> & {
  variant?: VarianteTButton;
  size?: 'md' | 'sm';
  /** ação em andamento (o `carregando` do `Button`): continua focável, `aria-busy`, não muda de largura */
  loading?: boolean;
  /** texto do botão; nas ações o padrão é o nome dela ("Salvar"). `label=""` deixa só o ícone (grade): o nome vira `aria-label` e dica */
  label?: string;
  /** ícone (componente do lucide-react) para as genéricas, ex.: "Configurar aparência"; nas ações, troca o ícone padrão */
  icone?: Icone;
  children?: ReactNode;
};

const ehAcao = (v: VarianteTButton): v is AcaoTButton => v in ACOES;

/**
 * Botão do kit (docs/07 §3.4), sobre o `Button` (whileTap, carregando sem pular largura). As ações trazem ícone,
 * cor e rótulo; dentro de `TForm somenteLeitura`, `salvar`, `novo`, `inativar` e `reativar` não aparecem.
 * Sem `type`, não envia o formulário (`type="submit"` no Salvar e no Buscar).
 */
export function TButton({ variant = 'primary', size: sizeProp, loading, label, icone, children, className, type = 'button', title, ...rest }: TButtonProps) {
  const somenteLeitura = useSomenteLeituraDoForm();
  const doContexto = useContext(TamanhoDoTButton);
  const size = sizeProp ?? doContexto ?? 'md';
  const acao = ehAcao(variant) ? ACOES[variant] : undefined;
  if (acao?.escreve && somenteLeitura) return null;

  const texto = label ?? acao?.rotulo;
  const soIcone = !!acao && texto === '' && children === undefined;
  const Icone = icone ?? acao?.icone;
  const tamanho: ButtonProps['size'] = soIcone ? (size === 'sm' ? 'icon-sm' : 'icon') : size;

  return (
    <Button
      {...rest}
      type={type}
      variant={acao ? acao.variante : GENERICAS[variant as Generica]}
      size={tamanho}
      carregando={!!loading}
      aria-label={rest['aria-label'] ?? (soIcone ? acao.rotulo : undefined)}
      title={title ?? (soIcone ? acao.rotulo : undefined)}
      data-kit="TButton"
      data-variante={variant}
      className={cn(acao?.classe, className)}
    >
      {Icone && <Icone aria-hidden className="size-4 shrink-0" />}
      {children ?? (soIcone ? null : texto)}
    </Button>
  );
}
