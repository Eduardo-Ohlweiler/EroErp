import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import { z } from 'zod'
import {
  TAviso,
  TBadge,
  TButton,
  TCheckBox,
  TEntry,
  TModal,
  TPage,
  TPanel,
  TRadio,
} from '@/components/common'
import { QrCodeModal } from '@/components/whatsapp/QrCodeModal'
import { useAuth } from '@/hooks/useAuth'
import { BolinhaDaCor } from '@/pages/filial/FilialList'
import { handleApiError } from '@/services/api'
import { whatsappService } from '@/services/whatsappService'
import { formatarDataHora, formatarTelefone } from '@/utils/format'
import {
  MODO_ROTULO,
  STATUS_CONEXAO_ROTULO,
  STATUS_CONEXAO_TOM,
  type ConexaoWhatsapp,
  type ModoWhatsapp,
  type PainelWhatsapp,
  type QrCodeWhatsapp,
  type ServidorWhatsapp,
} from '@/types/whatsapp'

const URL_VALIDA = /^https?:\/\/\S+$/i

/** `5551999998888` → `+55 (51) 99999-8888`; de fora do Brasil, só o `+`. */
function formatarNumeroWhatsapp(numero: string): string {
  if (numero.startsWith('55') && (numero.length === 12 || numero.length === 13))
    return `+55 ${formatarTelefone('55', numero.slice(2))}`
  return `+${numero}`
}

/** A frase do servidor, para mostrar inline — a consulta de status roda sozinha, sem toast. */
function fraseDoErro(erro: unknown): string {
  if (axios.isAxiosError<{ erro?: string }>(erro)) {
    if (!erro.response) return 'Não foi possível falar com o servidor'
    return erro.response.data?.erro ?? 'O servidor do WhatsApp não respondeu'
  }
  return 'Erro inesperado'
}

/**
 * Integrações › WhatsApp, numa tela só. O que aparece depende de quem olha:
 *
 * - o superadmin vê o servidor Evolution, o modo do tenant e, por conexão, a
 *   instância, a sobrescrita e o excluir;
 * - quem lê a tela vê as conexões com status e número;
 * - quem escreve (e todo ADMIN) também conecta pelo QR e desconecta.
 *
 * O status mostrado ao abrir é o último gravado; logo em seguida a tela
 * pergunta à Evolution por cada conexão. É o que faz a tela funcionar sem
 * webhook (servidor sem `APP_PUBLIC_URL`).
 */
export function WhatsappConfig() {
  const { sessao, hasRole, podeEscrever } = useAuth()
  const superadmin = hasRole('SUPERADMIN')
  const escreve = podeEscrever('WHATSAPP')

  const [painel, setPainel] = useState<PainelWhatsapp>()
  const [carregando, setCarregando] = useState(true)
  const [avisoStatus, setAvisoStatus] = useState<string | null>(null)
  const [ocupada, setOcupada] = useState<string | null>(null)
  const [qr, setQr] = useState<{ dados: QrCodeWhatsapp; titulo: string } | null>(null)
  const [desconectando, setDesconectando] = useState<ConexaoWhatsapp | null>(null)
  const [ajustando, setAjustando] = useState<ConexaoWhatsapp | null>(null)
  const [excluindo, setExcluindo] = useState<ConexaoWhatsapp | null>(null)
  /** A carga que vale: trocar de tenant no meio descarta a resposta da anterior. */
  const geracao = useRef(0)

  const tituloDe = useCallback(
    (c: ConexaoWhatsapp) => c.filialNome ?? sessao?.tenantNome ?? 'Tenant inteiro',
    [sessao?.tenantNome],
  )

  const trocarLinha = useCallback((atual: ConexaoWhatsapp) => {
    setPainel((p) => {
      if (!p) return p
      const mesma = (c: ConexaoWhatsapp) =>
        (atual.id && c.id === atual.id) || (!c.id && (c.filialId ?? null) === (atual.filialId ?? null))
      return {
        ...p,
        conexoes: p.conexoes.map((c) => (mesma(c) ? atual : c)),
        foraDoModo: p.foraDoModo?.map((c) => (c.id === atual.id ? atual : c)),
      }
    })
  }, [])

  /** Pergunta à Evolution por cada conexão gravada. Falha vira uma frase só, não um toast por linha. */
  const consultarStatus = useCallback(
    async (conexoes: ConexaoWhatsapp[], minha: number) => {
      const comId = conexoes.filter((c) => c.id && c.ativo)
      if (comId.length === 0) return
      const respostas = await Promise.allSettled(comId.map((c) => whatsappService.status(c.id!)))
      if (minha !== geracao.current) return
      const falha = respostas.find((r) => r.status === 'rejected')
      setAvisoStatus(
        falha
          ? `${fraseDoErro((falha as PromiseRejectedResult).reason)}. O status mostrado é o último conhecido.`
          : null,
      )
      respostas.forEach((r) => r.status === 'fulfilled' && trocarLinha(r.value))
    },
    [trocarLinha],
  )

  const carregar = useCallback(() => {
    const minha = ++geracao.current
    setCarregando(true)
    setAvisoStatus(null)
    whatsappService
      .painel()
      .then((p) => {
        if (minha !== geracao.current) return
        setPainel(p)
        void consultarStatus(p.conexoes, minha)
      })
      .catch(handleApiError)
      .finally(() => minha === geracao.current && setCarregando(false))
  }, [consultarStatus])

  // `sessao.tenantId` é sinal de invalidação: trocar de tenant refaz tudo e fecha o que estava aberto.
  useEffect(() => {
    setQr(null)
    setDesconectando(null)
    setAjustando(null)
    setExcluindo(null)
    carregar()
  }, [carregar, sessao?.tenantId])

  async function conectar(c: ConexaoWhatsapp) {
    const chave = c.id ?? c.filialId ?? 'tenant'
    setOcupada(chave)
    try {
      const dados = await whatsappService.conectar(c.filialId)
      trocarLinha(dados.conexao)
      if (dados.conexao.status === 'CONECTADO') toast.info('Este WhatsApp já estava conectado')
      else setQr({ dados, titulo: tituloDe(c) })
    } catch (e) {
      handleApiError(e)
    } finally {
      setOcupada(null)
    }
  }

  async function confirmarDesconexao() {
    if (!desconectando?.id) return
    setOcupada(desconectando.id)
    try {
      trocarLinha(await whatsappService.desconectar(desconectando.id))
      toast.success('WhatsApp desconectado')
      setDesconectando(null)
    } catch (e) {
      handleApiError(e)
    } finally {
      setOcupada(null)
    }
  }

  async function confirmarExclusao() {
    if (!excluindo?.id) return
    setOcupada(excluindo.id)
    try {
      await whatsappService.excluirConexao(excluindo.id)
      toast.success('Conexão excluída')
      setExcluindo(null)
      carregar()
    } catch (e) {
      handleApiError(e)
    } finally {
      setOcupada(null)
    }
  }

  return (
    <TPage title="WhatsApp" subtitle="O número que envia os avisos da agenda e do atendimento">
      <div className="flex flex-col gap-5">
        {superadmin && <ServidorPanel webhook={painel?.webhookConfigurado} onSalvo={carregar} />}

        {superadmin && painel && (
          <ModoPanel
            modo={painel.modo}
            onAlterado={(p) => {
              setPainel(p)
              void consultarStatus(p.conexoes, geracao.current)
            }}
          />
        )}

        <TPanel
          title="Conexões"
          subtitle={
            painel?.modo === 'POR_FILIAL'
              ? 'Uma por filial ativa'
              : 'Um número para todas as filiais'
          }
        >
          {carregando && !painel ? (
            <div className="grid place-items-center py-10">
              <span
                role="status"
                aria-label="Carregando"
                className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent"
              />
            </div>
          ) : painel ? (
            <div className="flex flex-col gap-3">
              {!painel.servidorConfigurado && (
                <TAviso>
                  {superadmin
                    ? 'Cadastre e ative o servidor Evolution acima para conectar.'
                    : 'O servidor do WhatsApp ainda não foi configurado. Peça ao administrador do sistema.'}
                </TAviso>
              )}
              {avisoStatus && <TAviso>{avisoStatus}</TAviso>}
              {!escreve && (
                <p className="text-caption text-txt-secondary">
                  Você vê o status. Conectar e desconectar é de quem tem escrita nesta tela.
                </p>
              )}

              {painel.conexoes.length === 0 ? (
                <p className="py-6 text-center text-body text-txt-secondary">
                  Nenhuma filial ativa. Cadastre uma filial para conectar o WhatsApp dela.
                </p>
              ) : (
                <ul className="divide-y divide-line">
                  {painel.conexoes.map((c) => (
                    <LinhaConexao
                      key={c.id ?? c.filialId ?? 'tenant'}
                      conexao={c}
                      titulo={tituloDe(c)}
                      subtitulo={c.filialId ? undefined : 'Todas as filiais'}
                      superadmin={superadmin}
                      escreve={escreve}
                      podeConectar={painel.servidorConfigurado || !!c.id}
                      ocupada={ocupada === (c.id ?? c.filialId ?? 'tenant')}
                      onConectar={() => conectar(c)}
                      onDesconectar={() => setDesconectando(c)}
                      onAjustes={() => setAjustando(c)}
                      onExcluir={() => setExcluindo(c)}
                    />
                  ))}
                </ul>
              )}
            </div>
          ) : null}
        </TPanel>

        {superadmin && painel?.foraDoModo && painel.foraDoModo.length > 0 && (
          <TPanel
            title="Fora do modo"
            subtitle="Conexões que o modo atual não usa: do outro modo ou de filial inativa. Não enviam avisos."
          >
            <ul className="divide-y divide-line">
              {painel.foraDoModo.map((c) => (
                <LinhaConexao
                  key={c.id}
                  conexao={c}
                  titulo={tituloDe(c)}
                  subtitulo={c.filialId ? undefined : 'Todas as filiais'}
                  superadmin
                  escreve={false}
                  podeConectar={false}
                  ocupada={ocupada === c.id}
                  onConectar={() => undefined}
                  onDesconectar={() => undefined}
                  onAjustes={() => setAjustando(c)}
                  onExcluir={() => setExcluindo(c)}
                />
              ))}
            </ul>
          </TPanel>
        )}
      </div>

      {qr && (
        <QrCodeModal
          inicial={qr.dados}
          titulo={qr.titulo}
          onFechar={() => setQr(null)}
          onAtualizada={trocarLinha}
        />
      )}

      <TModal
        aberto={!!desconectando}
        titulo="Desconectar WhatsApp"
        largura="sm"
        onFechar={() => setDesconectando(null)}
        acoes={
          <>
            <TButton variant="secondary" onClick={() => setDesconectando(null)}>
              Cancelar
            </TButton>
            <TButton variant="danger" loading={!!desconectando?.id && ocupada === desconectando.id} onClick={confirmarDesconexao}>
              Desconectar
            </TButton>
          </>
        }
      >
        <p className="text-body text-txt">
          Desconectar o WhatsApp de <b>{desconectando && tituloDe(desconectando)}</b>? Os avisos deixam de sair
          até alguém conectar de novo pelo QR.
        </p>
      </TModal>

      <TModal
        aberto={!!excluindo}
        titulo="Excluir conexão"
        largura="sm"
        onFechar={() => setExcluindo(null)}
        acoes={
          <>
            <TButton variant="secondary" onClick={() => setExcluindo(null)}>
              Cancelar
            </TButton>
            <TButton variant="danger" loading={!!excluindo?.id && ocupada === excluindo.id} onClick={confirmarExclusao}>
              Excluir
            </TButton>
          </>
        }
      >
        <p className="text-body text-txt">
          Apaga a instância <span className="font-mono break-all">{excluindo?.instancia}</span> no servidor do
          WhatsApp e esta conexão. Para voltar, alguém conecta de novo pelo QR — com uma instância nova.
        </p>
      </TModal>

      {ajustando && (
        <AjustesModal
          conexao={ajustando}
          titulo={tituloDe(ajustando)}
          onFechar={() => setAjustando(null)}
          onSalva={(c) => {
            trocarLinha(c)
            setAjustando(null)
          }}
        />
      )}
    </TPage>
  )
}

// ─────────────────────────────────────────────────────────────────────
//  Uma conexão
// ─────────────────────────────────────────────────────────────────────

interface LinhaConexaoProps {
  conexao: ConexaoWhatsapp
  titulo: string
  subtitulo?: string
  superadmin: boolean
  escreve: boolean
  /** Sem servidor, a linha nunca conectada não tem como nascer. */
  podeConectar: boolean
  ocupada: boolean
  onConectar: () => void
  onDesconectar: () => void
  onAjustes: () => void
  onExcluir: () => void
}

function LinhaConexao({
  conexao: c,
  titulo,
  subtitulo,
  superadmin,
  escreve,
  podeConectar,
  ocupada,
  onConectar,
  onDesconectar,
  onAjustes,
  onExcluir,
}: LinhaConexaoProps) {
  const sobrescrita = [c.url && `servidor ${c.url}`, c.possuiApiKey && 'apikey própria'].filter(Boolean)

  return (
    <li className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {c.filialCor && <BolinhaDaCor cor={c.filialCor} />}
          <span className="font-medium text-txt">{titulo}</span>
          {subtitulo && <span className="text-caption text-txt-secondary">· {subtitulo}</span>}
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <TBadge tom={STATUS_CONEXAO_TOM[c.status]}>{STATUS_CONEXAO_ROTULO[c.status]}</TBadge>
          {!c.ativo && <TBadge tom="erro">Desativada</TBadge>}
          {c.numero && <span className="text-body text-txt">{formatarNumeroWhatsapp(c.numero)}</span>}
        </div>
        {c.statusEm && (
          <p className="mt-1 text-caption text-txt-muted">Desde {formatarDataHora(c.statusEm)}</p>
        )}
        {superadmin && c.instancia && (
          <p className="mt-1 text-caption break-all text-txt-secondary">
            Instância <span className="font-mono">{c.instancia}</span>
            {sobrescrita.length > 0 && <> · {sobrescrita.join(' · ')}</>}
          </p>
        )}
      </div>

      <div className="flex shrink-0 flex-wrap gap-2">
        {escreve && c.ativo && c.status !== 'CONECTADO' && (
          <TButton size="sm" loading={ocupada} disabled={!podeConectar} onClick={onConectar}>
            Conectar
          </TButton>
        )}
        {escreve && c.id && c.status !== 'DESCONECTADO' && (
          <TButton size="sm" variant="secondary" disabled={ocupada} onClick={onDesconectar}>
            Desconectar
          </TButton>
        )}
        {superadmin && c.id && (
          <>
            <TButton size="sm" variant="ghost" onClick={onAjustes}>
              Ajustes
            </TButton>
            <TButton size="sm" variant="ghost" onClick={onExcluir}>
              Excluir
            </TButton>
          </>
        )}
      </div>
    </li>
  )
}

// ─────────────────────────────────────────────────────────────────────
//  Superadmin: servidor, modo, ajustes da conexão
// ─────────────────────────────────────────────────────────────────────

const servidorSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, 'Informe a URL do servidor')
    .max(255)
    .regex(URL_VALIDA, 'A URL deve começar com http:// ou https://'),
  apiKey: z.string().max(500).optional(),
  ativo: z.boolean(),
})

type ServidorForm = z.infer<typeof servidorSchema>

function ServidorPanel({ webhook, onSalvo }: { webhook?: boolean; onSalvo: () => void }) {
  const [servidor, setServidor] = useState<ServidorWhatsapp>()
  const form = useForm<ServidorForm>({
    resolver: zodResolver(servidorSchema),
    defaultValues: { url: '', apiKey: '', ativo: true },
  })

  useEffect(() => {
    whatsappService
      .servidor()
      .then((s) => {
        setServidor(s)
        form.reset({ url: s.url ?? '', apiKey: '', ativo: s.configurado ? !!s.ativo : true })
      })
      .catch(handleApiError)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function salvar(dados: ServidorForm) {
    if (!servidor?.possuiApiKey && !dados.apiKey?.trim()) {
      form.setError('apiKey', { message: 'Informe a apikey do servidor' })
      return
    }
    try {
      const salvo = await whatsappService.salvarServidor({
        url: dados.url,
        apiKey: dados.apiKey?.trim() || undefined,
        ativo: dados.ativo,
      })
      setServidor(salvo)
      form.reset({ url: salvo.url ?? '', apiKey: '', ativo: !!salvo.ativo })
      toast.success('Servidor do WhatsApp salvo')
      onSalvo()
    } catch (e) {
      handleApiError(e)
    }
  }

  const erros = form.formState.errors

  return (
    <TPanel
      title="Servidor Evolution"
      subtitle="Do sistema inteiro — vale para todos os tenants. Só o superadmin vê."
    >
      <form onSubmit={form.handleSubmit(salvar)} noValidate className="flex flex-col gap-4">
        <div className="grid gap-4 md:grid-cols-2">
          <TEntry
            label="URL"
            placeholder="https://evolution.seudominio.com.br"
            inputMode="url"
            autoComplete="off"
            error={erros.url?.message}
            {...form.register('url')}
          />
          <TEntry
            label="Apikey"
            type="password"
            autoComplete="new-password"
            placeholder={servidor?.possuiApiKey ? '•••••••• salva' : ''}
            ajuda={servidor?.possuiApiKey ? 'Deixe em branco para manter a salva.' : undefined}
            error={erros.apiKey?.message}
            {...form.register('apiKey')}
          />
        </div>
        <TCheckBox label="Servidor ativo" {...form.register('ativo')} />

        <p className="text-caption text-txt-secondary">
          {webhook
            ? 'Webhook ligado: a Evolution avisa sozinha quando uma conexão muda.'
            : 'Webhook desligado (sem APP_PUBLIC_URL na API): o status é consultado pela tela.'}
        </p>

        <TButton type="submit" loading={form.formState.isSubmitting} className="self-start">
          Salvar servidor
        </TButton>
      </form>
    </TPanel>
  )
}

function ModoPanel({ modo, onAlterado }: { modo: ModoWhatsapp; onAlterado: (p: PainelWhatsapp) => void }) {
  const [escolhido, setEscolhido] = useState<ModoWhatsapp>(modo)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => setEscolhido(modo), [modo])

  async function salvar() {
    setSalvando(true)
    try {
      onAlterado(await whatsappService.alterarModo(escolhido))
      toast.success('Modo do WhatsApp alterado')
    } catch (e) {
      handleApiError(e)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <TPanel title="Modo deste tenant" subtitle="Trocar não apaga conexões: as do outro modo ficam de lado.">
      <div className="flex flex-col gap-4">
        <TRadio
          label="De quem é o número"
          vertical
          opcoes={(Object.keys(MODO_ROTULO) as ModoWhatsapp[]).map((m) => ({ valor: m, rotulo: MODO_ROTULO[m] }))}
          value={escolhido}
          onChange={(v) => setEscolhido(v as ModoWhatsapp)}
        />
        <TButton className="self-start" disabled={escolhido === modo} loading={salvando} onClick={salvar}>
          Salvar modo
        </TButton>
      </div>
    </TPanel>
  )
}

const ajustesSchema = z.object({
  url: z
    .string()
    .trim()
    .max(255)
    .refine((v) => v === '' || URL_VALIDA.test(v), 'A URL deve começar com http:// ou https://'),
  apiKey: z.string().max(500).optional(),
  removerApiKey: z.boolean(),
  ativo: z.boolean(),
})

type AjustesForm = z.infer<typeof ajustesSchema>

function AjustesModal({
  conexao,
  titulo,
  onFechar,
  onSalva,
}: {
  conexao: ConexaoWhatsapp
  titulo: string
  onFechar: () => void
  onSalva: (c: ConexaoWhatsapp) => void
}) {
  const form = useForm<AjustesForm>({
    resolver: zodResolver(ajustesSchema),
    defaultValues: { url: conexao.url ?? '', apiKey: '', removerApiKey: false, ativo: conexao.ativo },
  })
  const removendo = form.watch('removerApiKey')

  async function salvar(dados: AjustesForm) {
    try {
      const salva = await whatsappService.atualizarConexao(conexao.id!, {
        url: dados.url || undefined,
        apiKey: dados.removerApiKey ? undefined : dados.apiKey?.trim() || undefined,
        removerApiKey: dados.removerApiKey,
        ativo: dados.ativo,
      })
      toast.success('Conexão salva')
      onSalva(salva)
    } catch (e) {
      handleApiError(e)
    }
  }

  return (
    <TModal
      aberto
      titulo={`Ajustes — ${titulo}`}
      onFechar={onFechar}
      acoes={
        <>
          <TButton variant="secondary" onClick={onFechar}>
            Cancelar
          </TButton>
          <TButton loading={form.formState.isSubmitting} onClick={form.handleSubmit(salvar)}>
            Salvar
          </TButton>
        </>
      }
    >
      <form onSubmit={form.handleSubmit(salvar)} noValidate className="flex flex-col gap-4">
        <p className="text-caption break-all text-txt-secondary">
          Instância <span className="font-mono">{conexao.instancia}</span>. Em branco, valem a URL e a apikey do
          servidor global.
        </p>
        <TEntry
          label="URL própria"
          placeholder="https://outra-evolution.com.br"
          inputMode="url"
          autoComplete="off"
          error={form.formState.errors.url?.message}
          {...form.register('url')}
        />
        <TEntry
          label="Apikey própria"
          type="password"
          autoComplete="new-password"
          disabled={removendo}
          placeholder={conexao.possuiApiKey ? '•••••••• salva' : ''}
          ajuda={conexao.possuiApiKey ? 'Deixe em branco para manter a salva.' : undefined}
          {...form.register('apiKey')}
        />
        {conexao.possuiApiKey && (
          <TCheckBox label="Voltar à apikey do servidor global" {...form.register('removerApiKey')} />
        )}
        <TCheckBox
          label="Conexão ativa"
          ajuda="Desativada, não conecta nem envia avisos."
          {...form.register('ativo')}
        />
      </form>
    </TModal>
  )
}
