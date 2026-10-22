import axios from 'axios'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'react-toastify'
import { TBadge, TButton, TModal } from '@/components/common'
import { handleApiError } from '@/services/api'
import { whatsappService } from '@/services/whatsappService'
import {
  STATUS_CONEXAO_ROTULO,
  STATUS_CONEXAO_TOM,
  type ConexaoWhatsapp,
  type QrCodeWhatsapp,
} from '@/types/whatsapp'

/** O modal pergunta o status neste ritmo — com ou sem webhook, é assim que ele sabe. */
const INTERVALO_STATUS_MS = 3_000
/** O QR da Evolution vale por volta de 40 s; renovar antes evita mostrar um vencido. */
const INTERVALO_QR_MS = 35_000

interface QrCodeModalProps {
  /** O QR recém-pedido, com a conexão (já gravada, com `id`). */
  inicial: QrCodeWhatsapp
  /** Como a linha se chama na tela: "Tenant inteiro" ou o nome da filial. */
  titulo: string
  onFechar: () => void
  /** A conexão mudou (status, número): a lista troca a linha. */
  onAtualizada: (conexao: ConexaoWhatsapp) => void
}

/** A Evolution manda o QR já com `data:`, mas versões antigas mandavam só o base64. */
function srcDoQr(base64: string): string {
  return base64.startsWith('data:') ? base64 : `data:image/png;base64,${base64}`
}

/**
 * Falha no meio do polling é estado, não evento: o modal continua tentando e
 * mostra a frase inline. Um toast a cada 3 s seria uma pilha de avisos.
 */
function fraseDoErro(erro: unknown): string {
  if (axios.isAxiosError<{ erro?: string }>(erro)) {
    if (!erro.response) return 'Não foi possível falar com o servidor'
    return erro.response.data?.erro ?? 'O servidor do WhatsApp não respondeu'
  }
  return 'Erro inesperado'
}

/**
 * O QR para ler no celular. Pergunta o status a cada 3 s, renova o QR antes de
 * ele vencer e fecha sozinho quando o WhatsApp conecta. O antigo mostrava o QR
 * uma vez e pedia ao usuário para apertar "Atualizar status".
 */
export function QrCodeModal({ inicial, titulo, onFechar, onAtualizada }: QrCodeModalProps) {
  const [qr, setQr] = useState(inicial)
  const [erro, setErro] = useState<string | null>(null)
  const ocupado = useRef(false)
  const encerrado = useRef(false)

  // As props mudam a cada render do pai; os intervalos leem a versão atual daqui
  const callbacks = useRef({ onFechar, onAtualizada })
  useEffect(() => {
    callbacks.current = { onFechar, onAtualizada }
  })

  const id = inicial.conexao.id
  const filialId = inicial.conexao.filialId

  useEffect(() => {
    if (!id) return
    encerrado.current = false

    function concluir(conexao: ConexaoWhatsapp) {
      if (encerrado.current) return
      encerrado.current = true
      callbacks.current.onAtualizada(conexao)
      toast.success('WhatsApp conectado')
      callbacks.current.onFechar()
    }

    async function renovarQr() {
      try {
        const novo = await whatsappService.conectar(filialId)
        if (encerrado.current) return
        if (novo.conexao.status === 'CONECTADO') concluir(novo.conexao)
        else {
          setQr(novo)
          callbacks.current.onAtualizada(novo.conexao)
        }
        setErro(null)
      } catch (e) {
        setErro(fraseDoErro(e))
      }
    }

    async function consultar() {
      if (ocupado.current || encerrado.current) return
      ocupado.current = true
      try {
        const conexao = await whatsappService.status(id!)
        if (encerrado.current) return
        setErro(null)
        if (conexao.status === 'CONECTADO') concluir(conexao)
        // A Evolution fechou a tentativa (QR vencido sem leitura): pede outro na hora
        else if (conexao.status === 'DESCONECTADO') await renovarQr()
      } catch (e) {
        setErro(fraseDoErro(e))
      } finally {
        ocupado.current = false
      }
    }

    const status = window.setInterval(consultar, INTERVALO_STATUS_MS)
    const renovacao = window.setInterval(() => {
      if (!ocupado.current) void renovarQr()
    }, INTERVALO_QR_MS)
    return () => {
      encerrado.current = true
      window.clearInterval(status)
      window.clearInterval(renovacao)
    }
  }, [id, filialId])

  async function renovarAgora() {
    try {
      const novo = await whatsappService.conectar(filialId)
      setQr(novo)
      setErro(null)
    } catch (e) {
      handleApiError(e)
    }
  }

  const status = qr.conexao.status

  return (
    <TModal
      aberto
      titulo={`Conectar WhatsApp — ${titulo}`}
      onFechar={onFechar}
      largura="sm"
      acoes={
        <>
          <TButton variant="secondary" onClick={onFechar}>
            Fechar
          </TButton>
          <TButton variant="ghost" onClick={renovarAgora}>
            Gerar outro QR
          </TButton>
        </>
      }
    >
      <div className="flex flex-col items-center gap-4 text-center">
        {qr.base64 ? (
          // Fundo branco fixo de propósito: o leitor do celular precisa de contraste no QR, nos dois temas
          <img
            src={srcDoQr(qr.base64)}
            alt="QR para conectar o WhatsApp"
            className="size-64 max-w-full rounded-md border border-line bg-white p-2"
          />
        ) : (
          <p className="py-10 text-body text-txt-secondary">Gerando o QR…</p>
        )}

        {qr.pairingCode && (
          <div>
            <p className="text-caption text-txt-secondary">Ou digite o código no celular</p>
            <p className="font-mono text-h2 font-semibold tracking-widest text-txt">{qr.pairingCode}</p>
          </div>
        )}

        <ol className="list-decimal space-y-1 pl-5 text-left text-body text-txt-secondary">
          <li>Abra o WhatsApp no celular do número que vai enviar os avisos.</li>
          <li>
            Toque em <b className="text-txt">Aparelhos conectados</b> e depois em{' '}
            <b className="text-txt">Conectar um aparelho</b>.
          </li>
          <li>Aponte a câmera para o QR. Esta janela fecha sozinha ao conectar.</li>
        </ol>

        <div className="flex items-center gap-2" role="status" aria-live="polite">
          <span
            aria-hidden
            className="size-3 animate-spin rounded-full border-2 border-primary border-t-transparent"
          />
          <TBadge tom={STATUS_CONEXAO_TOM[status]}>{STATUS_CONEXAO_ROTULO[status]}</TBadge>
        </div>

        {erro && <p className="text-caption text-danger">{erro}. Tentando de novo…</p>}

        <p className="text-caption text-txt-muted">O QR é renovado sozinho antes de vencer.</p>
      </div>
    </TModal>
  )
}
