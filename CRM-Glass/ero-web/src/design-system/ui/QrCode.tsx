import { useMemo } from 'react';
import QRCode from 'qrcode';
import { cn } from '../../shared/util/utils';

export type QrCodeProps = {
  /** conteúdo (ex.: a `uri` otpauth:// devolvida por /api/auth/2fa/configurar) */
  valor: string;
  /** lado do desenho em px (sem a margem da placa) */
  tamanho?: number;
  /** descrição para leitores de tela */
  rotulo?: string;
  className?: string;
};

/**
 * QR code gerado no navegador (nenhum dado sai para serviço externo).
 * Sempre numa placa clara com tinta escura, nos dois temas: é o que as câmeras leem melhor.
 * Desenhado em SVG com React (sem innerHTML).
 */
export function QrCode({ valor, tamanho = 192, rotulo = 'QR code', className }: QrCodeProps) {
  const desenho = useMemo(() => {
    try {
      const qr = QRCode.create(valor, { errorCorrectionLevel: 'M' });
      const n = qr.modules.size;
      let d = '';
      for (let y = 0; y < n; y++) {
        for (let x = 0; x < n; x++) {
          if (qr.modules.get(x, y)) d += `M${x} ${y}h1v1h-1z`;
        }
      }
      return { n, d };
    } catch {
      return null;
    }
  }, [valor]);

  return (
    <div className={cn('qr-placa inline-grid place-items-center rounded-2xl p-3', className)}>
      {desenho ? (
        <svg
          role="img"
          aria-label={rotulo}
          width={tamanho}
          height={tamanho}
          viewBox={`0 0 ${desenho.n} ${desenho.n}`}
          shapeRendering="crispEdges"
        >
          <path d={desenho.d} fill="currentColor" />
        </svg>
      ) : (
        <div role="img" aria-label="Não foi possível gerar o QR code" style={{ width: tamanho, height: tamanho }} />
      )}
    </div>
  );
}
