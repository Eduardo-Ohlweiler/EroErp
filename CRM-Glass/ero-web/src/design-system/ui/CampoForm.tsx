import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { spring } from '../../motion/tokens';
import { cn } from '../../shared/util/utils';
import { useVariantesBloco, type PropsBloco } from './bloco';

/** Atributos que ligam o controle ao rótulo, à dica e ao erro. */
export type IdsCampo = { id: string; 'aria-describedby'?: string; 'aria-invalid'?: true };

export type CampoFormProps = PropsBloco & {
  rotulo: ReactNode;
  erro?: string;
  dica?: ReactNode;
  /** id do controle; sem ele, um id é gerado */
  id?: string;
  /** marca visual de obrigatório (o `required` continua no controle) */
  obrigatorio?: boolean;
  /**
   * Controle composto (Segmented, OtpInput, grupo de opções): o rótulo vira a legenda de um `role=group`
   * (`'radiogroup'` no grupo de rádio do TRadio, que leva também o `ariaGrupo`).
   */
  grupo?: boolean | 'radiogroup';
  /** estado do grupo para o leitor de tela (só com `grupo`): só leitura, obrigatório, inválido */
  ariaGrupo?: { 'aria-readonly'?: boolean; 'aria-required'?: boolean; 'aria-invalid'?: boolean };
  /** ação ao lado do rótulo (ex.: "Gerar", "Copiar") */
  acao?: ReactNode;
  /**
   * Reserva a linha da dica/erro mesmo vazia (padrão true): o erro aparece sem empurrar o formulário
   * e sem animar altura. Use false em campos soltos (filtros, diálogos de um campo só).
   */
  reservarErro?: boolean;
  /** rótulo só para leitor de tela (label ao lado, filtro de cabeçalho): continua ligado ao controle */
  rotuloOculto?: boolean;
  /**
   * A dica e o erro podem passar da largura do controle (a partir de 640 px), até 28rem: num campo curto
   * (CNPJ, quantidade) a frase não se espreme em três linhas. O kit liga; abaixo de 640 px o campo já é 100 %.
   */
  dicaLarga?: boolean;
  /** atributos `data-*` no contêiner (o kit põe `data-kit`, `data-largura`, `data-mascara`) */
  dados?: Record<`data-${string}`, string | undefined>;
  className?: string;
  /**
   * O controle. Um único elemento recebe `id`, `aria-describedby` e `aria-invalid` automaticamente;
   * use a forma de função quando o controle precisar repassar esses atributos.
   */
  children: ReactNode | ((ids: IdsCampo) => ReactNode);
};

/**
 * Campo de formulário: rótulo em cima, controle, dica ou erro embaixo.
 * É um bloco da montagem da tela (campos entram em cascata quando o pai orquestra).
 */
export function CampoForm({
  rotulo,
  erro,
  dica,
  id,
  obrigatorio,
  grupo,
  ariaGrupo,
  acao,
  reservarErro = true,
  rotuloOculto,
  dicaLarga,
  dados,
  className,
  children,
  bloco = true,
  variants,
}: CampoFormProps) {
  const auto = useId();
  const campoId = id ?? `campo-${auto}`;
  const rotuloId = `${campoId}-rotulo`;
  const descId = `${campoId}-desc`;
  const temDesc = !!erro || !!dica;
  const ids: IdsCampo = {
    id: campoId,
    ...(temDesc ? { 'aria-describedby': descId } : {}),
    ...(erro ? { 'aria-invalid': true as const } : {}),
  };

  let controle: ReactNode;
  if (typeof children === 'function') controle = children(ids);
  else if (isValidElement(children)) {
    const el = children as ReactElement<Record<string, unknown>>;
    controle = cloneElement(el, { ...ids, id: (el.props.id as string | undefined) ?? campoId });
  } else controle = children;

  const Rotulo = grupo ? 'span' : 'label';
  const variantesBloco = useVariantesBloco(bloco, variants);
  return (
    <motion.div
      variants={variantesBloco}
      className={className}
      {...dados}
      {...(grupo
        ? {
            role: grupo === 'radiogroup' ? 'radiogroup' : 'group',
            'aria-labelledby': rotuloId,
            'aria-describedby': temDesc ? descId : undefined,
            ...ariaGrupo,
          }
        : {})}
    >
      <div className={rotuloOculto && !acao ? 'sr-only' : 'flex items-center justify-between gap-2 mb-1.5'}>
        <Rotulo id={rotuloId} {...(grupo ? {} : { htmlFor: campoId })} className={rotuloOculto ? 'sr-only' : 'block text-xs font-medium text-muted'}>
          {rotulo}
          {obrigatorio && (
            <span className="text-danger ml-0.5" aria-hidden>
              *
            </span>
          )}
        </Rotulo>
        {acao}
      </div>
      {controle}
      {(temDesc || reservarErro) && (
        <div className="relative mt-1.5 min-h-4">
          {/* Só opacidade e y (nada de altura): a linha já está reservada. */}
          <AnimatePresence initial={false} mode="popLayout">
            {erro ? (
              <motion.span
                key="erro"
                id={descId}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -2 }}
                transition={spring.snappy}
                className={cn('block text-xs text-danger', dicaLarga && 'sm:w-max sm:max-w-[28rem]')}
              >
                {erro}
              </motion.span>
            ) : dica ? (
              <motion.span
                key="dica"
                id={descId}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={spring.snappy}
                className={cn('block text-[11px] leading-4 text-subtle', dicaLarga && 'sm:w-max sm:max-w-[28rem]')}
              >
                {dica}
              </motion.span>
            ) : null}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
