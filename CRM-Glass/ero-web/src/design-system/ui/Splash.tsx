import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';
import { spring } from '../../motion/tokens';
import { useReduce } from '../../shared/aparencia/AparenciaProvider';

/**
 * Tela de abertura enquanto a sessão é verificada (renovação do token ao abrir a página).
 * Fica por cima do fundo, sem vidro, e anuncia o carregamento.
 */
export function Splash({ mensagem = 'Carregando…' }: { mensagem?: string }) {
  const reduce = useReduce();
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="fixed inset-0 z-[60] grid place-items-center">
      <motion.div
        className="flex flex-col items-center gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={spring.soft}
      >
        <motion.span
          className="size-16 rounded-[22px] accent-gradient accent-glow grid place-items-center"
          initial={{ scale: 1 }}
          animate={reduce ? undefined : { scale: 1.07 }}
          transition={{ ...spring.soft, repeat: Infinity, repeatType: 'mirror' }}
        >
          <Sparkles className="size-7" aria-hidden />
        </motion.span>
        <span className="text-sm text-muted">{mensagem}</span>
      </motion.div>
    </div>
  );
}
