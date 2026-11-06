import { useRef, type ReactNode } from 'react';
import { AnimatePresence } from 'motion/react';
import { AtrasoMontagem } from './contexto';
import { Tela } from './Tela';

export type TrocaEtapaProps = {
  /** identifica a etapa atual (ex.: 'credenciais' | 'codigo' | 'trocar-senha') */
  etapa: string;
  /** 1 = avançando (entra da direita), −1 = voltando (entra da esquerda) */
  direcao?: number;
  /** atraso dos campos da PRIMEIRA etapa (s): no login, esperam o cartão subir (`login.atrasoCampos`) */
  atrasoInicial?: number;
  children: ReactNode;
  className?: string;
};

/**
 * Troca de etapas dentro de um cartão, com a coreografia `etapa`: os campos da etapa atual saem
 * de baixo para cima e o contêiner desliza; os da próxima encaixam em cascata.
 * Os campos são blocos (CampoForm, BarraAcoes, <Bloco>). Com `propagate`, se a tela inteira sair
 * (login → Início), os campos da etapa também se desmontam.
 *
 *   <GlassCard variants={coreografias.login.variantes.cartao}>
 *     <TrocaEtapa etapa={etapa} direcao={direcao} atrasoInicial={login.atrasoCampos}>
 *       {etapa === 'credenciais' ? <EtapaCredenciais /> : <EtapaCodigo />}
 *     </TrocaEtapa>
 *   </GlassCard>
 */
export function TrocaEtapa({ etapa, direcao = 1, atrasoInicial = 0, children, className }: TrocaEtapaProps) {
  const primeira = useRef<string | null>(etapa);
  if (primeira.current !== null && primeira.current !== etapa) primeira.current = null;
  return (
    <AnimatePresence mode="wait" custom={direcao} propagate>
      <AtrasoMontagem.Provider key={etapa} value={primeira.current === etapa ? atrasoInicial : 0}>
        <Tela coreografia="etapa" direcao={direcao} className={className}>
          {children}
        </Tela>
      </AtrasoMontagem.Provider>
    </AnimatePresence>
  );
}
