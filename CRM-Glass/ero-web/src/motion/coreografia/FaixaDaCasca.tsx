import { useMemo, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { cn } from '../../shared/util/utils';
import { useReduzirMovimento } from '../reduzir';
import { blocoReduzido, faixa, faixaContexto, orquestrarFaixa } from '../tokens';
import { useMarcarMontagem } from './andamento';
import { BlocoDaTela, useAtrasoMontagem } from './contexto';

export type FaixaDaCascaProps = {
  /**
   * O aviso, SEM `flutuante`: `<AvisoContexto tipo="superadmin" acao={…}>…</AvisoContexto>`.
   * Sem `flutuante` ele lê as variantes daqui (BlocoDaTela) e entra/sai junto com a casca; com `flutuante`
   * ele abriria o próprio portal com a animação própria e ficaria parado na tela enquanto a casca se desfaz.
   */
  children: ReactNode;
  /**
   * `flutuante` (padrão): fixa embaixo, no centro da tela, por cima do conteúdo (portal no body), acima da barra
   * inferior do celular. `fluxo`: fica onde for colocada (ex.: logo abaixo da Topbar).
   */
  posicao?: 'flutuante' | 'fluxo';
  className?: string;
};

/**
 * Faixa da casca: o aviso "Você está dentro de X como suporte da plataforma" do superadmin (plano fatia 3, 0.3).
 * É uma peça da CASCA (como o menu e a barra), não da tela: vai dentro da Casca, fora da RotaAnimada, e só existe
 * enquanto `usuario.superadminAtuando`. Como entrar e sair de um contratante troca a chave da área
 * (`casca:${tenantId}`), a faixa nasce e morre com a casca:
 *
 *   entrar:  menu → barra → (faixa.atraso) faixa sobe encaixando; os blocos da tela seguem a cascata deles.
 *   sair:    a faixa desce e some em `faixa.saida` (= casca.saidaBarra), junto com o conteúdo, ANTES de a barra
 *            e o menu começarem a sair. A área só termina (e a próxima monta) depois que a faixa saiu.
 *   reduzido: só esmaece, junto com o menu e a barra (blocoReduzido, sem atraso, sem deslocamento).
 *
 * Herda os rótulos hidden/show/exit da área (TrocaDeArea) pela árvore de variantes, mesmo pelo portal. O contêiner
 * só orquestra; quem anima é o próprio aviso de vidro (opacidade e transform nele mesmo, nunca `filter`).
 * Não imprime (`nao-imprime` e `print:hidden`).
 *
 *   // app/casca/Casca.tsx, depois do conteúdo:
 *   {usuario.superadminAtuando && (
 *     <FaixaDaCasca>
 *       <AvisoContexto tipo="superadmin" acao={{ rotulo: 'Sair do contratante', onClick: sairDoContratante, carregando }}>
 *         Você está dentro de <strong>{contratante}</strong> como suporte da plataforma
 *       </AvisoContexto>
 *     </FaixaDaCasca>
 *   )}
 */
export function FaixaDaCasca({ children, posicao = 'flutuante', className }: FaixaDaCascaProps) {
  const reduzir = useReduzirMovimento();
  const herdado = useAtrasoMontagem();
  const variants = useMemo(() => orquestrarFaixa(reduzir ? 0 : herdado + faixa.atraso), [reduzir, herdado]);
  const marca = useMarcarMontagem();

  const flutuante = posicao === 'flutuante';
  const faixaEl = (
    <motion.div
      variants={variants}
      data-faixa-casca
      className={cn(
        'nao-imprime print:hidden',
        flutuante && 'fixed inset-x-0 bottom-24 md:bottom-5 z-faixa flex justify-center px-3 pointer-events-none',
        className,
      )}
      {...marca}
    >
      <div className={flutuante ? 'pointer-events-auto max-w-full' : undefined}>
        <BlocoDaTela.Provider value={reduzir ? blocoReduzido : faixaContexto}>{children}</BlocoDaTela.Provider>
      </div>
    </motion.div>
  );
  return flutuante ? createPortal(faixaEl, document.body) : faixaEl;
}
