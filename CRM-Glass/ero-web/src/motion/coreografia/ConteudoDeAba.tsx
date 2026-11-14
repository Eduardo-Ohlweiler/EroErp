import { useState, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { useReduzirMovimento } from '../reduzir';
import { coreografias, telaReduzida } from '../tokens';
import { useMarcarMontagem } from './andamento';
import { BlocoDaTela, CoreografiaDaTela, useTelaMontada } from './contexto';

export type ConteudoDeAbaProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Conteúdo de uma aba (TTabPanel do kit). Vai DENTRO do painel da aba (Radix Tabs.Content), que só monta a aba
 * visível: cada troca de aba monta um <ConteudoDeAba> novo.
 *
 *  - Aba que nasce junto com a tela (a inicial): não anima nada por conta própria. Os blocos dela (TForm, TDataGrid,
 *    <Bloco>) fazem parte da coreografia da <Tela> em volta, na ordem do documento, como qualquer outro bloco.
 *  - Aba escolhida depois: o conteúdo entra como UM bloco curto (coreografia `aba` em motion/tokens.ts): cartões e
 *    grades sobem `aba.distancia` px e aparecem juntos em `aba.entrada` s; campos e rodapé vêm com o cartão.
 *    A aba antiga sai na hora (a troca nunca espera animação). Se a tela inteira sair, o conteúdo sai junto.
 *  - Movimento reduzido: só esmaece (blocoReduzido nos blocos), sem deslocamento.
 *
 * O contêiner nunca anima opacidade (os cartões de vidro dentro dele têm backdrop-filter); quem aparece são os
 * blocos, cada um em si mesmo. Conteúdo solto que não é bloco do kit: envolva em <Bloco>.
 *
 *   export function TTabPanel({ valor, children, className }: TTabPanelProps) {
 *     return (
 *       <RadixTabs.Content value={valor} className="mt-5 …">
 *         <ConteudoDeAba className="flex flex-col gap-5">{children}</ConteudoDeAba>
 *       </RadixTabs.Content>
 *     );
 *   }
 */
export function ConteudoDeAba({ children, className }: ConteudoDeAbaProps) {
  const reduzir = useReduzirMovimento();
  const telaMontada = useTelaMontada();
  // Decidido na montagem e fixo: dentro de uma <Tela> que ainda está nascendo, herda a coreografia dela.
  const [daTela] = useState(() => telaMontada !== null && !telaMontada.current);
  const marca = useMarcarMontagem();

  if (daTela) return <div className={className}>{children}</div>;

  const c = coreografias.aba;
  return (
    <motion.div
      variants={reduzir ? telaReduzida : c.variantes.tela}
      initial="hidden"
      animate="show"
      exit="exit"
      data-coreografia="aba"
      className={className}
      {...marca}
    >
      <CoreografiaDaTela.Provider value="aba">
        <BlocoDaTela.Provider value={c.variantes.bloco}>{children}</BlocoDaTela.Provider>
      </CoreografiaDaTela.Provider>
    </motion.div>
  );
}
