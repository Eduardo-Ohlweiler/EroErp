import { api } from './api'
import type {
  ConexaoWhatsapp,
  ConexaoWhatsappRequest,
  ModoWhatsapp,
  PainelWhatsapp,
  QrCodeWhatsapp,
  ServidorWhatsapp,
  ServidorWhatsappRequest,
} from '@/types/whatsapp'

const BASE = '/integracoes/whatsapp'

/**
 * Integrações › WhatsApp. O escopo é o tenant efetivo do token; o servidor é
 * global e, como o modo e a sobrescrita, só do superadmin.
 */
export const whatsappService = {
  painel: () => api.get<PainelWhatsapp>(BASE).then((r) => r.data),

  /** Chamar de novo renova o QR expirado. `filialId` só no modo por filial. */
  conectar: (filialId?: string) =>
    api.post<QrCodeWhatsapp>(`${BASE}/conexoes/conectar`, { filialId }).then((r) => r.data),

  /** Pergunta à Evolution agora — com ou sem webhook, é daqui que a tela sabe. */
  status: (id: string) =>
    api.get<ConexaoWhatsapp>(`${BASE}/conexoes/${id}/status`).then((r) => r.data),

  desconectar: (id: string) =>
    api.post<ConexaoWhatsapp>(`${BASE}/conexoes/${id}/desconectar`).then((r) => r.data),

  // ─── Superadmin ──────────────────────────────────────────────────
  servidor: () => api.get<ServidorWhatsapp>(`${BASE}/servidor`).then((r) => r.data),

  salvarServidor: (dto: ServidorWhatsappRequest) =>
    api.put<ServidorWhatsapp>(`${BASE}/servidor`, dto).then((r) => r.data),

  alterarModo: (modo: ModoWhatsapp) =>
    api.patch<PainelWhatsapp>(`${BASE}/modo`, { modo }).then((r) => r.data),

  atualizarConexao: (id: string, dto: ConexaoWhatsappRequest) =>
    api.patch<ConexaoWhatsapp>(`${BASE}/conexoes/${id}`, dto).then((r) => r.data),

  excluirConexao: (id: string) => api.delete(`${BASE}/conexoes/${id}`),
}
