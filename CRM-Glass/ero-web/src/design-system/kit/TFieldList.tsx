import { Fragment, useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { get, useFieldArray, useFormContext, useFormState, useWatch, type FieldValues } from 'react-hook-form';
import { AnimatePresence } from 'motion/react';
import { Plus, X } from 'lucide-react';
import { LinhaDaLista } from '../../motion/coreografia';
import { cn } from '../../shared/util/utils';
import { linhaParaAcrescentar, linhasDasColunas, marcarPrincipal, principalDepoisDeRemover } from './fieldList';
import type { Largura } from './larguras';
import { TButton } from './TButton';
import { TCol, TRow } from './TRow';
import { useSomenteLeituraDoForm } from './somenteLeitura';

/** Uma coluna da lista: um campo do kit dentro da linha. */
export type ColunaDaLista<L> = {
  /** o campo dentro da linha (`numero`, `tipoId`) */
  name: string;
  /**
   * O campo da coluna. Recebe o `name` completo (`telefones.0.numero`) para passar ao componente do kit, o índice e a
   * linha como está agora. Qualquer campo do kit serve, inclusive `TDBCombo` com `acao` (o cadastro rápido do vínculo).
   */
  componente: (campo: string, indice: number, linha: L) => ReactNode;
  /** põe o campo numa `TCol` desta largura (só quando a padrão do campo não serve) */
  width?: Largura;
  /** põe o campo numa `TCol` sem largura: divide o que sobra da linha com as outras colunas `dividir` */
  dividir?: boolean;
};

export type TFieldListProps<L> = {
  /** o campo-lista do formulário (`telefones`) */
  name: string;
  /** colunas de uma linha só (`ColunaDaLista[]`) ou de um item em várias linhas (`ColunaDaLista[][]`, o endereço) */
  colunas: ColunaDaLista<L>[] | ColunaDaLista<L>[][];
  /** a linha que o Acrescentar põe no fim (ou uma função que a cria) */
  novaLinha: L | (() => L);
  /** não deixa remover abaixo disto */
  minimo?: number;
  /** texto do botão; padrão "Acrescentar" */
  rotuloAdicionar?: string;
  /**
   * Botões extras ao lado do Acrescentar, no mesmo alinhamento (quebram para a linha de baixo no celular): o "Todas
   * as filiais" do Serviço (`<TButton variant="secondary" size="sm" …/>`). Somem em só leitura, junto com o Acrescentar.
   */
  acoes?: ReactNode;
  /** o que se diz com a lista vazia ("Nenhum telefone.") */
  vazio?: string;
  /** nota sob a linha (ex.: "Pessoa inativa"); `null` quando não há */
  detalhe?: (indice: number, linha: L) => ReactNode;
  /**
   * Campo booleano da linha que marca **a** principal (`principal`): um rádio "Principal" por linha, exclusivo. A 1ª
   * linha acrescentada já vem principal; remover a principal passa a marca para a 1ª que sobrou.
   */
  principal?: string;
  /** nome de cada linha para o leitor de tela e o remover ("Telefone 2"); padrão "Linha N" */
  rotuloLinha?: (indice: number, linha: L) => string;
};

/** O que recebe o foco dentro da linha nova: o primeiro campo que se digita ou escolhe. */
const FOCAVEL = 'input:not([type="radio"]):not([disabled]), textarea:not([disabled])';

/**
 * Lista filha editável dentro do formulário (docs/07 §3.2), como no antigo: telefones, e-mails, endereços, vínculos.
 * `useFieldArray` por baixo; uma `TRow` por linha (ou várias, no item de várias linhas, com borda `--line`), os
 * campos nas larguras padrão deles, o "Principal" e o remover no fim da 1ª linha, o Acrescentar embaixo. No celular
 * cada linha empilha. A tela não monta `<ul>`/`grid` de linhas.
 *
 * Só leitura (`TForm` ou `TPanel somenteLeitura`): sem Acrescentar e sem remover, e o rádio Principal fica focável
 * mas não muda. O erro da lista inteira (`telefones` ou `telefones.root`, ex.: "Informe um telefone") vai embaixo.
 *
 * Teclado: acrescentar leva o foco ao primeiro campo da linha nova; remover devolve o foco ao Acrescentar.
 *
 * Movimento (coreografia `linhaDaLista`, motion/tokens.ts, via <LinhaDaLista>): a linha acrescentada abre o espaço e
 * aparece; a removida some e recolhe, e o que está embaixo sobe sem pulo. Linhas que vêm com a tela ou com os dados
 * não animam sozinhas: as da tela seguem a cascata do cartão; as que chegam com os dados depois dela aparecem já
 * prontas (pessoa reaberta). A linha que sai fica `inert` até sumir, e o foco
 * nunca vai para ela. A tela não escreve movimento.
 */
export function TFieldList<L extends FieldValues>({
  name,
  colunas,
  novaLinha,
  minimo = 0,
  rotuloAdicionar = 'Acrescentar',
  acoes,
  vazio,
  detalhe,
  principal,
  rotuloLinha,
}: TFieldListProps<L>) {
  const { control, getValues, setValue } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name });
  const linhas = (useWatch({ control, name }) as L[] | undefined) ?? [];
  const { errors } = useFormState({ control, name });
  const erroDaLista = mensagemDaLista(get(errors, name));
  const somenteLeitura = useSomenteLeituraDoForm();
  const grupo = useId();
  const raiz = useRef<HTMLDivElement>(null);
  const focar = useRef<number | 'acrescentar' | null>(null);
  /** a próxima linha que nascer foi o usuário que acrescentou: ela anima (as da tela e dos dados, não) */
  const animarNovas = useRef(false);
  const entrarNovas = animarNovas.current;

  const grade = linhasDasColunas(colunas);
  const variasLinhas = grade.length > 1;
  const base = () => (typeof novaLinha === 'function' ? (novaLinha as () => L)() : novaLinha);
  const atuais = () => ((getValues(name) as L[] | undefined) ?? []);

  // Depois que a lista muda: o foco vai ao primeiro campo da linha nova, ou ao Acrescentar depois de remover.
  useEffect(() => {
    animarNovas.current = false;
    const alvo = focar.current;
    if (alvo === null) return;
    focar.current = null;
    // A linha que está saindo (inert, `data-saindo`) pode ter o mesmo índice da nova: procura só nas que ficam.
    const el =
      alvo === 'acrescentar'
        ? raiz.current?.querySelector<HTMLElement>('[data-acrescentar]')
        : raiz.current
            ?.querySelector(`[data-linha-lista]:not([data-saindo]) [data-linha="${alvo}"]`)
            ?.querySelector<HTMLElement>(FOCAVEL);
    el?.focus();
  }, [fields]);

  const acrescentar = () => {
    focar.current = fields.length;
    animarNovas.current = true;
    append(linhaParaAcrescentar(base(), atuais(), principal), { shouldFocus: false });
  };

  const remover = (i: number) => {
    const marcar = principalDepoisDeRemover(atuais(), i, principal);
    focar.current = 'acrescentar';
    remove(i);
    if (marcar !== null && principal) setValue(`${name}.${marcar}.${principal}`, true, { shouldDirty: true });
  };

  const escolherPrincipal = (i: number) => {
    if (!principal || somenteLeitura) return;
    marcarPrincipal(atuais().length, i).forEach((v, j) => setValue(`${name}.${j}.${principal}`, v, { shouldDirty: true }));
  };

  const podeRemover = !somenteLeitura && fields.length > minimo;

  return (
    <div ref={raiz} data-kit="TFieldList" data-linhas={fields.length} className="flex min-w-0 flex-col gap-3">
      {fields.length === 0 && vazio && <p className="text-sm text-muted">{vazio}</p>}

      {/* O espaço entre as linhas fica DENTRO de cada uma (pb-3) e recolhe junto com ela; o -mb-3 tira o da última. */}
      <div className="-mb-3 flex min-w-0 flex-col">
        <AnimatePresence>
          {fields.map((campo, i) => {
            const linha = linhas[i] ?? base();
            const nome = rotuloLinha?.(i, linha) ?? `Linha ${i + 1}`;
            const celula = (c: ColunaDaLista<L>) => {
              const el = c.componente(`${name}.${i}.${c.name}`, i, linha);
              if (c.width) return <TCol key={c.name} width={c.width}>{el}</TCol>;
              if (c.dividir) return <TCol key={c.name}>{el}</TCol>;
              return <Fragment key={c.name}>{el}</Fragment>;
            };
            return (
              <LinhaDaLista key={campo.id} entrar={entrarNovas} className="group/linha min-w-0 pb-3">
                <div
                  role="group"
                  aria-label={nome}
                  data-linha={i}
                  className={cn(
                    'flex min-w-0 flex-col',
                    variasLinhas
                      ? 'gap-4 rounded-2xl border border-line p-4'
                      : 'gap-2 border-b border-line pb-4 group-last/linha:border-b-0 group-last/linha:pb-0 sm:border-b-0 sm:pb-0',
                  )}
                >
                  {grade.map((cols, l) => (
                    <TRow key={l}>
                      {cols.map(celula)}
                      {l === 0 && principal && (
                        <ControleDaLinha>
                          <RadioPrincipal
                            grupo={grupo}
                            marcado={!!(linha as Record<string, unknown>)[principal]}
                            somenteLeitura={somenteLeitura}
                            onEscolher={() => escolherPrincipal(i)}
                          />
                        </ControleDaLinha>
                      )}
                      {l === 0 && podeRemover && (
                        <ControleDaLinha className={variasLinhas ? 'sm:ml-auto' : undefined}>
                          <TButton variant="ghost" icone={X} label="" aria-label={`Remover ${nome}`} title="Remover" onClick={() => remover(i)} />
                        </ControleDaLinha>
                      )}
                    </TRow>
                  ))}
                  {detalhe?.(i, linha)}
                </div>
              </LinhaDaLista>
            );
          })}
        </AnimatePresence>
      </div>

      {erroDaLista && <p className="text-xs text-danger">{erroDaLista}</p>}

      {!somenteLeitura && (
        <div data-kit="TFieldList-acoes" className="flex min-w-0 flex-wrap items-center gap-2">
          <TButton variant="secondary" size="sm" icone={Plus} label={rotuloAdicionar} data-acrescentar onClick={acrescentar} />
          {acoes}
        </div>
      )}
    </div>
  );
}

/** A mensagem de erro da lista inteira (`telefones` ou `telefones.root`), não a de um campo de uma linha. */
function mensagemDaLista(erro: unknown): string | undefined {
  const e = erro as { message?: unknown; root?: { message?: unknown } } | undefined;
  const m = e?.message ?? e?.root?.message;
  return typeof m === 'string' && m !== '' ? m : undefined;
}

/** Principal e remover: na altura do campo (abaixo do rótulo, a partir de `sm`). */
function ControleDaLinha({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('flex h-11 items-center sm:mt-5.5', className)}>{children}</div>;
}

const SETAS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']);

/**
 * O rádio "Principal" de uma linha. Os rádios das linhas têm o mesmo `name` (o navegador dá as setas entre eles); o
 * nome da linha vem do `role="group"` em volta. Mesma pele do `TRadio` (`.marca`, tokens `--marca-*`).
 */
function RadioPrincipal({
  grupo,
  marcado,
  somenteLeitura,
  onEscolher,
}: {
  grupo: string;
  marcado: boolean;
  somenteLeitura: boolean;
  onEscolher: () => void;
}) {
  const travarTecla = (e: KeyboardEvent<HTMLInputElement>) => {
    if (SETAS.has(e.key) || e.key === ' ') e.preventDefault();
  };
  return (
    <label data-kit="TFieldList-principal" className={cn('flex min-h-9 items-center gap-2.5 text-sm', somenteLeitura ? 'cursor-default' : 'cursor-pointer')}>
      <span className="inline-grid place-items-center">
        <input
          type="radio"
          name={`${grupo}-principal`}
          checked={marcado}
          readOnly={somenteLeitura}
          onChange={() => {
            if (!somenteLeitura) onEscolher();
          }}
          onClick={somenteLeitura ? (e) => e.preventDefault() : undefined}
          onKeyDown={somenteLeitura ? travarTecla : undefined}
          className="marca marca-radio [grid-area:1/1]"
        />
        <span aria-hidden className="marca-sinal [grid-area:1/1] size-2 rounded-full bg-current" />
      </span>
      <span>Principal</span>
    </label>
  );
}
