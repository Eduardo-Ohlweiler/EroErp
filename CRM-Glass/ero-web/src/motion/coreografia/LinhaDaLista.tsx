import { useContext, useMemo, useState, type ReactNode, type Ref } from 'react';
import { AnimatePresence, motion, MotionContext, useIsPresent, type VisualElement } from 'motion/react';
import { useModoLeve } from '../desempenho';
import { useReduzirMovimento } from '../reduzir';
import { linhaDaLista, type AlvosDaLinha, type ModoDaLinha } from '../tokens';

/** Modo da coreografia `linhaDaLista` agora: reduzido (sistema ou contratante) vence o modo leve. */
export function useModoDaLinha(): ModoDaLinha {
  const reduzir = useReduzirMovimento();
  const leve = useModoLeve();
  return reduzir ? 'reduzido' : leve ? 'leve' : 'completo';
}

export type LinhaDaListaProps = {
  /**
   * A linha nasce animando (o usuário acrescentou)? Lido só na montagem. `false` = nasceu junto com a tela ou com os
   * dados carregados: aparece no lugar e os campos de dentro seguem a cascata do cartão em volta.
   */
  entrar: boolean;
  /** troca de bloco sem altura (modo leve e reduzido): o bloco que sai some na hora (ver `linhaDaLista`) */
  saidaNaHora?: boolean;
  className?: string;
  ref?: Ref<HTMLDivElement>;
  children: ReactNode;
};

/**
 * Uma linha de lista editável (coreografia `linhaDaLista` em motion/tokens.ts). Vai como filho DIRETO de um
 * `<AnimatePresence>` (com `key`), sem `initial={false}` nele: quem decide se a linha anima ao nascer é o `entrar`.
 *
 *  - Entrando: o espaço abre e o conteúdo aparece; os campos de dentro vêm junto com a linha (sem cascata própria).
 *  - Nascida com a tela (`entrar=false`, o cartão montando no mesmo instante): os campos entram na cascata do cartão.
 *  - Nascida com os dados depois da cascata (`entrar=false`, o `reset` da pessoa reaberta): aparece no lugar, com os
 *    campos já no estado final (`ForaDaCascata`).
 *  - Saindo: o conteúdo some e a altura recolhe. Enquanto sai, a linha fica `inert` (fora do Tab, do clique e do
 *    leitor de tela) e marcada com `data-saindo`, para o foco nunca cair numa linha que está indo embora.
 *  - Os alvos são objetos (não rótulos): a linha não comanda as variantes dos campos, que continuam filhos do cartão
 *    (na montagem da tela, entram na cascata dele como qualquer campo; na saída, desmontam com ele).
 *
 * Modo leve: sem altura (só opacidade e y). Reduzido: só opacidade.
 *
 *   <AnimatePresence>
 *     {fields.map((f) => <LinhaDaLista key={f.id} entrar={acrescentou}>…</LinhaDaLista>)}
 *   </AnimatePresence>
 */
export function LinhaDaLista({ entrar, saidaNaHora = false, className, ref, children }: LinhaDaListaProps) {
  const [entrando] = useState(entrar);
  // Lido só na montagem: o bloco de variantes em volta (o cartão) já montou? Então a cascata dele já passou.
  const doPai = useContext(MotionContext).visualElement;
  const [depoisDaCascata] = useState(() => cascataJaPassou(doPai));
  const presente = useIsPresent();
  const alvos: AlvosDaLinha = linhaDaLista(useModoDaLinha(), { saidaNaHora });
  return (
    <motion.div
      ref={ref}
      data-linha-lista=""
      data-saindo={presente ? undefined : ''}
      inert={!presente}
      initial={entrando ? alvos.hidden : false}
      animate={alvos.show}
      exit={alvos.exit}
      className={className}
    >
      {entrando || depoisDaCascata ? <ForaDaCascata>{children}</ForaDaCascata> : children}
    </motion.div>
  );
}

/**
 * O bloco de variantes mais próximo (o cartão do TForm, o conteúdo de uma aba...) já está montado? Quem nasce depois
 * dele não recebe mais a cascata (o Motion só a repassa aos filhos que já existiam quando ela rodou).
 */
function cascataJaPassou(pai: VisualElement | undefined): boolean {
  let no = pai;
  while (no && !no.isVariantNode) no = no.parent;
  return !!no?.current;
}

/**
 * Os campos de uma linha que não faz parte da montagem da tela (acrescentada pelo usuário ou chegada com os dados
 * depois da cascata do cartão) nascem já no estado final da coreografia em volta (`initial: false`): aparecem junto
 * com a linha, em qualquer modo (completo, leve ou reduzido), e nunca ficam presos no `hidden` esperando uma cascata
 * que não vem mais. Continuam filhos do cartão: na saída da tela, desmontam junto com ele.
 */
function ForaDaCascata({ children }: { children: ReactNode }) {
  const daLinha = useContext(MotionContext);
  const semInicial = useMemo(() => ({ ...daLinha, initial: false as const }), [daLinha]);
  return <MotionContext.Provider value={semInicial}>{children}</MotionContext.Provider>;
}

export type TrocaDeBlocosProps = {
  /** o que está aparecendo (`FISICA` | `JURIDICA`): trocar a chave troca o bloco */
  chave: string;
  /** classes de cada bloco (substitui o padrão `flex flex-col gap-4`, a mesma pilha do `TForm`) */
  className?: string;
  children: ReactNode;
};

/** Pilha padrão de cada bloco: a mesma do `TForm`, para as linhas de dentro terem o espaçamento do formulário. */
const PILHA_DO_BLOCO = 'flex flex-col gap-4';

/**
 * Troca de um bloco por outro no mesmo lugar (PF ↔ PJ do PessoaForm), com a coreografia `linhaDaLista`: o bloco
 * antigo some e recolhe enquanto o novo abre, e a altura total vai de uma à outra sem pulo (o que está embaixo
 * desliza). O bloco da primeira montagem não anima por conta própria: os campos dele entram na cascata do cartão.
 * Modo leve e reduzido: o antigo sai na hora e o novo aparece (só opacidade; no leve, desce alguns px).
 *
 * Os dois blocos ficam dentro de um `<div>` próprio, SEM gap: para o pai (o `TForm`, `flex flex-col gap-4`) a troca
 * é um filho só, então o espaço até o vizinho de baixo é o mesmo antes, durante e depois (sem o vão extra entre o
 * bloco que sai e o que entra, que sumiria de uma vez no fim da saída). Cada bloco já é uma pilha `flex flex-col
 * gap-4`: as linhas vão direto, num fragmento, sem `<div>` em volta.
 *
 *   <TrocaDeBlocos chave={tipo}>
 *     {tipo === 'FISICA' ? <><TRow>…CPF…</TRow><TRow>…RG…</TRow></> : <><TRow>…CNPJ…</TRow><TRow>…IE…</TRow></>}
 *   </TrocaDeBlocos>
 *
 * A tela só escolhe o conteúdo; limpar os campos do outro tipo continua sendo da tela.
 */
export function TrocaDeBlocos({ chave, className = PILHA_DO_BLOCO, children }: TrocaDeBlocosProps) {
  // A partir da primeira troca, todo bloco que nasce anima (inclusive voltar ao primeiro).
  const [anterior, setAnterior] = useState(chave);
  const [trocou, setTrocou] = useState(false);
  if (chave !== anterior) {
    setAnterior(chave);
    setTrocou(true);
  }
  const modo = useModoDaLinha();
  return (
    <div data-troca-blocos="">
      <AnimatePresence>
        <LinhaDaLista key={chave} entrar={trocou || chave !== anterior} saidaNaHora={modo !== 'completo'} className={className}>
          {children}
        </LinhaDaLista>
      </AnimatePresence>
    </div>
  );
}
