import type { ReactNode } from 'react';
import { Alerta, type TomAlerta } from '../../../design-system/ui';
import { Bloco } from '../../../motion/coreografia';

/** Aviso mostrado no topo de uma etapa (erro da API, código expirado, sessão expirada). */
export type Aviso = { tom: TomAlerta; texto: ReactNode; correlationId?: string };

/** Desafio do código por e-mail, com os horários do servidor já em milissegundos. */
export type DesafioAtivo = {
  desafio: string;
  emailMascarado: string;
  codigoExpiraEm: number;
  reenvioDisponivelEm: number;
};

export type EtapaLogin = 'credenciais' | 'codigo' | 'trocar-senha';

/** Título e texto de apoio de cada etapa (primeiro bloco do cartão). */
export function CabecalhoEtapa({ titulo, children }: { titulo: string; children?: ReactNode }) {
  return (
    <Bloco className="mb-6">
      <h2 className="text-2xl font-semibold tracking-tight">{titulo}</h2>
      {children && <p className="text-sm text-muted mt-1">{children}</p>}
    </Bloco>
  );
}

/** Alerta da etapa como bloco da montagem. Erros ficam no formulário, não em toast. */
export function AvisoEtapa({ aviso }: { aviso: Aviso | null }) {
  if (!aviso) return null;
  return (
    <Bloco>
      <Alerta tom={aviso.tom}>
        {aviso.texto}
        {aviso.correlationId && (
          <span className="block text-xs text-muted mt-1">
            Código para o suporte: <span className="font-mono select-all">{aviso.correlationId}</span>
          </span>
        )}
      </Alerta>
    </Bloco>
  );
}
