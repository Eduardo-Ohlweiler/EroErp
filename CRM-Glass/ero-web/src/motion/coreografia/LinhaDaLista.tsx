import { useState, type ReactNode, type Ref } from 'react';
import { AnimatePresence, motion, useIsPresent } from 'motion/react';
import { useModoLeve } from '../desempenho';
import { useReduzirMovimento } from '../reduzir';
import { linhaDaLista, parado, type AlvosDaLinha, type ModoDaLinha } from '../tokens';
import { BlocoDaTela } from './contexto';

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
 *  - Saindo: o conteúdo some e a altura recolhe. Enquanto sai, a linha fica `inert` (fora do Tab, do clique e do
 *    leitor de tela) e marcada com `data-saindo`, para o foco nunca cair numa linha que está indo embora.
 *  - Os alvos são objetos (não rótulos): a linha não comanda as variantes dos campos, que continuam filhos do cartão
 *    (na montagem da tela, entram na cascata dele como qualquer campo).
 *
 * Modo leve: sem altura (só opacidade e y). Reduzido: só opacidade.
 *
 *   <AnimatePresence>
 *     {fields.map((f) => <LinhaDaLista key={f.id} entrar={acrescentou}>…</LinhaDaLista>)}
 *   </AnimatePresence>
 */
export function LinhaDaLista({ entrar, saidaNaHora = false, className, ref, children }: LinhaDaListaProps) {
  const [entrando] = useState(entrar);
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
      {entrando ? <BlocoDaTela.Provider value={parado}>{children}</BlocoDaTela.Provider> : children}
    </motion.div>
  );
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
