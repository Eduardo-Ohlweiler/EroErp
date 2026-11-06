import { useRef, type ReactNode } from 'react';
import { useLocation, useOutlet, type Location } from 'react-router';
import { AnimatePresence, motion, useIsPresent } from 'motion/react';
import { useReduzirMovimento } from '../reduzir';
import { coreografias, rota, rotaReduzida, type NomeCoreografia } from '../tokens';
import { useMarcarMontagem } from './andamento';
import { AtrasoMontagem, useAtrasoMontagem } from './contexto';

/**
 * "Rota congelada": guarda o conteúdo com que nasceu e para de atualizar quando começa a sair.
 * Assim a tela que sai fica inteira (mesma rota, mesmos parâmetros) até a desmontagem terminar,
 * enquanto a URL já é a da próxima. Enquanto está presente, acompanha as atualizações normalmente.
 */
export function Congelado({ children }: { children: ReactNode }) {
  const presente = useIsPresent();
  const guardado = useRef(children);
  if (presente) guardado.current = children;
  return <>{guardado.current}</>;
}

/**
 * Direção pela profundidade da rota, como o AnimatedRoutes do protótipo:
 * /admin/usuarios → /admin/usuarios/42 = 1 (mais fundo, entra da direita); o inverso = −1; mesmo nível = 0.
 */
export function useDirecaoPorProfundidade(pathname: string) {
  const profundidade = pathname.split('/').filter(Boolean).length;
  const ultimo = useRef({ path: pathname, profundidade, dir: 0 });
  if (ultimo.current.path !== pathname) {
    ultimo.current = { path: pathname, profundidade, dir: Math.sign(profundidade - ultimo.current.profundidade) };
  }
  return ultimo.current.dir;
}

export type RotaAnimadaProps = {
  /** chave da tela (padrão: pathname). Ex.: abas como rotas filhas sem trocar a tela inteira. */
  chave?: (location: Location) => string;
  /**
   * Atraso do primeiro bloco da PRIMEIRA tela mostrada (s). Na casca: `casca.atrasoConteudo`,
   * para a montagem ser menu → barra → blocos. As trocas seguintes não esperam.
   */
  atrasoInicial?: number;
  /** 'wait' (padrão): a tela sai inteira antes da próxima montar. 'sync': previsto para morph com layoutId. */
  modo?: (typeof coreografias)[NomeCoreografia]['modo'];
  /** volta a rolagem ao topo quando a tela que saiu termina de sair (padrão true) */
  rolarAoTopo?: boolean;
  className?: string;
};

/**
 * Troca de tela dentro de um layout do React Router 7 (no lugar do <Outlet />).
 * AnimatePresence com chave pelo pathname; a direção vem da profundidade; o contêiner só anima
 * transform; a montagem em blocos é da <Tela coreografia> de cada página. Com `propagate`, quando a
 * área inteira sai (logout, troca de contratante), a tela atual também se desmonta em blocos.
 *
 *   function Casca() {
 *     return (<><Sidebar …/><Topbar …/><main><RotaAnimada atrasoInicial={casca.atrasoConteudo} /></main></>);
 *   }
 */
export function RotaAnimada({ chave, atrasoInicial = 0, modo = 'wait', rolarAoTopo = true, className }: RotaAnimadaProps) {
  const location = useLocation();
  const outlet = useOutlet();
  const reduzir = useReduzirMovimento();
  const herdado = useAtrasoMontagem();
  const k = chave ? chave(location) : location.pathname;
  const dir = useDirecaoPorProfundidade(location.pathname);
  const marca = useMarcarMontagem();

  // Só a primeira tela depois de montar herda o atraso (casca recém-montada, pausa do contexto).
  const primeira = useRef<string | null>(k);
  if (primeira.current !== null && primeira.current !== k) primeira.current = null;
  const atraso = primeira.current === k ? herdado + atrasoInicial : 0;

  return (
    <AnimatePresence
      mode={modo}
      custom={dir}
      propagate
      onExitComplete={rolarAoTopo ? () => window.scrollTo({ top: 0 }) : undefined}
    >
      <motion.div
        key={k}
        custom={dir}
        variants={reduzir ? rotaReduzida : rota}
        initial="hidden"
        animate="show"
        exit="exit"
        className={className}
        {...marca}
      >
        <AtrasoMontagem.Provider value={atraso}>
          <Congelado>{outlet}</Congelado>
        </AtrasoMontagem.Provider>
      </motion.div>
    </AnimatePresence>
  );
}
