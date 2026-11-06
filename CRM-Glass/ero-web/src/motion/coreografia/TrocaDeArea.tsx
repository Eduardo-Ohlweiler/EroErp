import { createContext, useContext, useMemo, useRef, type ReactNode } from 'react';
import { AnimatePresence, motion, type Variants } from 'motion/react';
import { UNSAFE_LocationContext } from 'react-router';
import { useReduzirMovimento } from '../reduzir';
import { coreografias, type NomeCoreografia } from '../tokens';
import { useMarcarMontagem } from './andamento';
import { AtrasoMontagem, useAtrasoMontagem } from './contexto';
import { LocalCongelado } from './RotaAnimada';

/** A área em si não anima nada: quem monta e desmonta são as partes dela (menu, barra, telas). */
const area: Variants = { hidden: {}, show: {}, exit: {} };

/** Conteúdo atual e a chave a que ele pertence (fora do AnimatePresence). */
const ConteudoDaArea = createContext<{ chave: string; conteudo: ReactNode }>({ chave: '', conteudo: null });

/**
 * Mostra o conteúdo da própria área: enquanto a chave atual é a dela, acompanha as atualizações; quando outra
 * área assume, fica com o último que teve (a área que sai continua inteira até terminar de se desmontar).
 */
function ConteudoCongelado({ chave }: { chave: string }) {
  const atual = useContext(ConteudoDaArea);
  const local = useContext(UNSAFE_LocationContext);
  const guardado = useRef({ conteudo: null as ReactNode, local });
  if (atual.chave === chave) guardado.current = { conteudo: atual.conteudo, local };
  // A área que sai também fica com a URL que tinha (menu ativo, título, rota), até terminar de se desmontar.
  return <LocalCongelado local={guardado.current.local}>{guardado.current.conteudo}</LocalCongelado>;
}

export type TrocaDeAreaProps = {
  /**
   * Identifica a área. Trocou → a área atual se desmonta inteira e a nova monta depois.
   * Ex.: 'login' | `casca:${tenantId}` (a troca de contratante remonta a casca).
   */
  chave: string;
  /** coreografia da troca: `contexto` (troca de contratante) soma uma pausa curta antes de montar a nova área */
  coreografia?: NomeCoreografia;
  /**
   * Chamado quando a área que saía terminou de se desmontar, no instante em que a nova vai montar.
   * É aqui que a aparência da área nova entra (definirContratante): o login se desmonta inteiro com a
   * aparência do sistema e a casca já nasce com a do contratante (destaque, fundo, tema em vídeo).
   * Na primeira montagem não há saída: aplique a aparência direto (ex.: ao abrir a página com sessão).
   */
  aoSairCompleto?: () => void;
  children: ReactNode;
  className?: string;
};

/**
 * Troca entre áreas inteiras, um nível acima da RotaAnimada: login ↔ casca, casca de um contratante ↔ casca
 * de outro. A área que sai fica congelada (mesmo outlet) até todas as suas partes terminarem de sair.
 * O fundo (LiveBackground) fica fora, fixo por baixo, e faz o próprio esmaecimento quando o fundo muda.
 *
 * Ordem (DIRECAO-VISUAL 6, plano 2.5): a área que sai se desmonta com a aparência que tinha; só depois
 * (`aoSairCompleto`) entra a aparência da área nova, que já monta com o destaque e o fundo novos.
 * Exemplo completo e funcionando: design-system/catalogo/DemoMovimento.tsx (DemoRaiz).
 *
 *   function Raiz() {
 *     const outlet = useOutlet();
 *     const { pathname } = useLocation();
 *     const { usuario, trocouContratante } = useSessao();
 *     const { definirContratante } = useAparencia();
 *     const chave = pathname.startsWith('/login') ? 'login' : `casca:${usuario?.tenantId}`;
 *     const aparencia = chave === 'login' ? null : usuario?.aparencia; // login: sempre o padrão do sistema
 *     const atual = useRef(aparencia);
 *     atual.current = aparencia;
 *     useEffect(() => definirContratante(atual.current), []); // primeira montagem: não há área saindo
 *     return (
 *       <div className="relative z-10">
 *         <TrocaDeArea chave={chave} coreografia={trocouContratante ? 'contexto' : undefined}
 *           aoSairCompleto={() => definirContratante(atual.current)}>{outlet}</TrocaDeArea>
 *       </div>
 *     );
 *   }
 */
export function TrocaDeArea({ chave, coreografia, aoSairCompleto, children, className }: TrocaDeAreaProps) {
  const reduzir = useReduzirMovimento();
  const herdado = useAtrasoMontagem();
  const c = coreografia ? coreografias[coreografia] : null;
  const pausa = herdado + (c && !reduzir ? c.atraso : 0);
  const marca = useMarcarMontagem();

  /*
   * O elemento da área só muda quando a chave muda. O conteúdo chega por contexto. Assim, quando o conteúdo
   * muda de novo durante a saída (ex.: troca de contratante e o roteador confirma a rota nova logo depois), o
   * AnimatePresence não recalcula as áreas no meio da saída, o que deixava a área antiga presa na tela.
   */
  const elemento = useMemo(
    () => (
      <motion.div key={chave} variants={area} initial="hidden" animate="show" exit="exit" className={className} {...marca}>
        <AtrasoMontagem.Provider value={pausa}>
          <ConteudoCongelado chave={chave} />
        </AtrasoMontagem.Provider>
      </motion.div>
    ),
    [chave, className, pausa, marca],
  );

  return (
    <ConteudoDaArea.Provider value={{ chave, conteudo: children }}>
      <AnimatePresence mode={c?.modo ?? 'wait'} propagate onExitComplete={aoSairCompleto}>
        {elemento}
      </AnimatePresence>
    </ConteudoDaArea.Provider>
  );
}
