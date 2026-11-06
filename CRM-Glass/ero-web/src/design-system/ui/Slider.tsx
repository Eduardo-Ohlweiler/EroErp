import * as RadixSlider from '@radix-ui/react-slider';
import { cn } from '../../shared/util/utils';

export type SliderProps = {
  valor: number;
  onValor: (v: number) => void;
  /** chamado ao soltar (ex.: salvar só no fim do arraste) */
  onValorFinal?: (v: number) => void;
  min?: number;
  max?: number;
  passo?: number;
  /** nome acessível (obrigatório quando não há rótulo ligado por aria-labelledby) */
  rotulo?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  id?: string;
  /** texto lido pelo leitor de tela (ex.: v => `${v} px`) */
  formatar?: (v: number) => string;
  /** legendas das pontas, ex.: ['Mais nítido', 'Mais fosco'] */
  legendas?: [string, string];
  desabilitado?: boolean;
  className?: string;
};

/** Controle deslizante (Radix): teclado com setas, Page Up/Down, Home/End. */
export function Slider({
  valor,
  onValor,
  onValorFinal,
  min = 0,
  max = 100,
  passo = 1,
  rotulo,
  formatar,
  legendas,
  desabilitado,
  className,
  id,
  ...aria
}: SliderProps) {
  return (
    <div className={className}>
      <RadixSlider.Root
        value={[valor]}
        onValueChange={([v]) => onValor(v)}
        onValueCommit={onValorFinal ? ([v]) => onValorFinal(v) : undefined}
        min={min}
        max={max}
        step={passo}
        disabled={desabilitado}
        className={cn(
          'relative flex items-center select-none touch-none w-full h-6',
          desabilitado && 'opacity-50 pointer-events-none',
        )}
      >
        <RadixSlider.Track className="relative grow h-1.5 rounded-full bg-[var(--track)] overflow-hidden">
          <RadixSlider.Range className="absolute h-full rounded-full accent-gradient" />
        </RadixSlider.Track>
        <RadixSlider.Thumb
          id={id}
          aria-label={rotulo}
          aria-labelledby={aria['aria-labelledby']}
          aria-describedby={aria['aria-describedby']}
          aria-valuetext={formatar ? formatar(valor) : undefined}
          className="slider-knob block size-5 rounded-full transition-transform hover:scale-110 focus-visible:scale-110"
        />
      </RadixSlider.Root>
      {legendas && (
        <div className="flex justify-between text-[11px] text-subtle mt-1" aria-hidden>
          <span>{legendas[0]}</span>
          <span>{legendas[1]}</span>
        </div>
      )}
    </div>
  );
}
