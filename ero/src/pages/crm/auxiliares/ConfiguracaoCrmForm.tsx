import { useState, useEffect }           from "react"
import axios                              from "axios"
import { api }                           from "../../../services/api"
import { useMessage }                    from "../../../hooks/useMessage"
import type { ErrorResponse }            from "../../../types/ErrorResponse"
import type {
  ConfiguracaoCrmResponse,
  ConfiguracaoCrmPayload,
  CrmStatusResponse,
  CrmQrCodeResponse,
  LembretePendencia,
}                                        from "../../../types/ConfiguracaoCrm"
import type { TDataGridColumn }          from "../../../types/TDataGridColumn"
import { TPage }                         from "../../../components/tpage"
import { TForm, TFormFooter, TFormActionsRight } from "../../../components/tform"
import { TRow }                          from "../../../components/trow"
import { TCol }                          from "../../../components/tcol"
import { TPanel }                        from "../../../components/tpanel"
import { TEntry }                        from "../../../components/tentry"
import { TText }                         from "../../../components/ttext"
import { TCombo }                        from "../../../components/tcombo"
import { TButton }                       from "../../../components/tbutton"
import { TWindow }                       from "../../../components/twindow"
import { TDataGrid }                     from "../../../components/tdatagrid"

type LembreteLocal = {
  _tempId:    string
  id:         string
  tempoHoras: string
  mensagem:   string
}

function lembretesParaState(lembretes?: LembretePendencia[]): LembreteLocal[] {
  if (!lembretes?.length) return []
  return [...lembretes]
    .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
    .map((l) => ({
      _tempId:    String(l.id),
      id:         String(l.id),
      tempoHoras: String(l.tempoHoras),
      mensagem:   l.mensagem,
    }))
}

export default function ConfiguracaoCrmForm() {
  const { showMessage } = useMessage()

  const [config,  setConfig]  = useState<ConfiguracaoCrmResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [formKey, setFormKey] = useState(0)

  // status da conexão
  const [status,        setStatus]        = useState<CrmStatusResponse | null>(null)
  const [statusLoading, setStatusLoading] = useState(false)

  // QR Code
  const [qrCode,      setQrCode]      = useState<CrmQrCodeResponse | null>(null)
  const [qrLoading,   setQrLoading]   = useState(false)
  const [qrModalOpen, setQrModalOpen] = useState(false)

  // Pendências
  const [ativarPendencias, setAtivarPendencias] = useState(false)
  const [lembretes,        setLembretes]        = useState<LembreteLocal[]>([])
  const [lembreteWindowOpen, setLembreteWindowOpen] = useState(false)
  const [editandoLembrete,   setEditandoLembrete]   = useState<LembreteLocal | null>(null)

  const isConfigurado = !!config?.id

  // hidrata o estado de pendências a partir da resposta do backend
  function hidratarPendencias(cfg: ConfiguracaoCrmResponse | null) {
    setAtivarPendencias(cfg?.ativarPendencias ?? false)
    setLembretes(lembretesParaState(cfg?.lembretes))
  }

  // ── carga inicial ──
  useEffect(() => {
    setLoading(true)
    api.get("/crm/configuracao")
      .then((r) => {
        const cfg = (r.data ?? null) as ConfiguracaoCrmResponse | null
        setConfig(cfg)          // 204/null => sem config ainda
        hidratarPendencias(cfg)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // consulta status apenas quando já existe configuração salva
  useEffect(() => {
    if (isConfigurado) carregarStatus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConfigurado])

  async function reload() {
    try {
      const r   = await api.get("/crm/configuracao")
      const cfg = (r.data ?? null) as ConfiguracaoCrmResponse | null
      setConfig(cfg)
      hidratarPendencias(cfg)
      setFormKey((prev) => prev + 1)
    } catch {
      showMessage("error", "Erro ao recarregar configuração")
    }
  }

  async function carregarStatus() {
    setStatusLoading(true)
    try {
      const r = await api.get("/crm/configuracao/status")
      setStatus(r.data as CrmStatusResponse)
    } catch {
      setStatus(null)
    } finally {
      setStatusLoading(false)
    }
  }

  async function handleSubmit(data: Record<string, string>) {
    setSaving(true)
    try {
      const payload: ConfiguracaoCrmPayload = {
        provedor:     data.provedor     ?? "EVOLUTION",
        apiUrl:       data.apiUrl       ?? "",
        // vazio = preservar o valor salvo no backend
        apiKey:       data.apiKey       ?? "",
        instanceName: data.instanceName ?? "",
        token:        data.token        ?? "",
        numero:       data.numero       ?? "",
        ativo:        data.ativo === "true",
        ativarPendencias,
        lembretes: ativarPendencias
          ? lembretes
              .filter((l) => l.mensagem.trim() && l.tempoHoras.trim())
              .map((l, i) => ({
                id:         l.id ? Number(l.id) : null,
                tempoHoras: Number(l.tempoHoras),
                mensagem:   l.mensagem,
                ordem:      i,
              }))
          : [],
      }

      await api.put("/crm/configuracao", payload)
      showMessage("success", "Configuração salva com sucesso!")
      await reload()
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const d = err.response?.data as ErrorResponse
        showMessage("error", d?.erro ?? "Erro ao salvar configuração")
      } else {
        showMessage("error", "Erro inesperado ao salvar configuração")
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleGerarQrCode() {
    setQrLoading(true)
    try {
      const r  = await api.post("/crm/configuracao/qrcode")
      const qr = r.data as CrmQrCodeResponse
      setQrCode(qr)
      setQrModalOpen(true)
      await carregarStatus()
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const d = err.response?.data as ErrorResponse
        showMessage("error", d?.erro ?? "Erro ao gerar QR Code")
      } else {
        showMessage("error", "Erro inesperado ao gerar QR Code")
      }
    } finally {
      setQrLoading(false)
    }
  }

  // ── lembretes de pendência ──
  function handleAbrirNovoLembrete() {
    setEditandoLembrete(null)
    setLembreteWindowOpen(true)
  }

  function handleAbrirEditarLembrete(l: LembreteLocal) {
    setEditandoLembrete(l)
    setLembreteWindowOpen(true)
  }

  function handleSalvarLembrete(data: Record<string, string>) {
    const tempoHoras = (data.tempoHoras ?? "").trim()
    const mensagem   = (data.mensagem ?? "").trim()
    if (!tempoHoras || !mensagem) {
      showMessage("error", "Informe o tempo (horas) e a mensagem")
      return
    }
    const novo: LembreteLocal = {
      _tempId:    editandoLembrete?._tempId ?? crypto.randomUUID(),
      id:         editandoLembrete?.id      ?? "",
      tempoHoras,
      mensagem,
    }
    setLembretes((prev) =>
      editandoLembrete
        ? prev.map((l) => (l._tempId === editandoLembrete._tempId ? novo : l))
        : [...prev, novo]
    )
    setLembreteWindowOpen(false)
  }

  function handleRemoverLembrete(tempId: string) {
    setLembretes((prev) => prev.filter((l) => l._tempId !== tempId))
  }

  const lembreteColumns: TDataGridColumn<LembreteLocal>[] = [
    { label: "Tempo (horas)", field: "tempoHoras", width: "140px", align: "center" },
    { label: "Mensagem",      field: "mensagem" },
  ]

  // garante o prefixo data URI caso o backend envie apenas o base64 puro
  function qrSrc(base64: string): string {
    if (!base64) return ""
    return base64.startsWith("data:") ? base64 : `data:image/png;base64,${base64}`
  }

  if (loading) {
    return (
      <TPage title="Carregando..." breadcrumb={["CRM", "Auxiliar CRM", "Config. CRM"]}>
        <div className="flex justify-center py-12">
          <span className="w-6 h-6 border-2 border-(--accent) border-t-transparent rounded-full animate-spin" />
        </div>
      </TPage>
    )
  }

  return (
    <TPage
      title      ="Configuração CRM"
      breadcrumb ={["CRM", "Auxiliar CRM", "Config. CRM"]}
    >
      <div className="flex flex-col gap-4">
      {/* ── Conexão Evolution ── */}
      <TForm key={formKey} onSubmit={handleSubmit}>
        <TPanel title="Conexão Evolution">
          <TEntry name="provedor" type="hidden" label="" defaultValue={config?.provedor ?? "EVOLUTION"} />

          <TRow>
            <TCol>
              <TEntry
                name         ="apiUrl"
                label        ="URL da API Evolution"
                required
                maxLength    ={255}
                placeholder  ="https://evolution.meuservidor.com"
                defaultValue ={config?.apiUrl}
                width        ="360px"
                minWidth     ="200px"
              />
            </TCol>
          </TRow>

          <TRow>
            <TCol>
              <TEntry
                name        ="apiKey"
                label       ="API Key"
                type        ="password"
                maxLength   ={500}
                placeholder ={config?.possuiApiKey ? "•••• (preencha para alterar)" : "Informe a API Key"}
                width       ="360px"
                minWidth    ="200px"
                hint        ={config?.possuiApiKey ? "Deixe em branco para manter a chave atual." : undefined}
              />
            </TCol>
          </TRow>

          <TRow>
            <TCol>
              <TEntry
                name         ="instanceName"
                label        ="Nome da instância"
                required
                maxLength    ={120}
                placeholder  ="minha-instancia"
                defaultValue ={config?.instanceName}
                width        ="360px"
                minWidth     ="200px"
              />
            </TCol>
          </TRow>

          <TRow>
            <TCol>
              <TEntry
                name        ="token"
                label       ="Token"
                type        ="password"
                maxLength   ={500}
                placeholder ={config?.possuiToken ? "•••• (preencha para alterar)" : "Informe o token"}
                width       ="360px"
                minWidth    ="200px"
                hint        ={config?.possuiToken ? "Deixe em branco para manter o token atual." : undefined}
              />
            </TCol>
          </TRow>

          <TRow>
            <TCol>
              <TEntry
                name         ="numero"
                label        ="Número"
                maxLength    ={20}
                placeholder  ="5551999999999"
                defaultValue ={config?.numero}
                width        ="180px"
                minWidth     ="140px"
              />
            </TCol>
          </TRow>

          <TRow>
            <TCol>
              <TCombo
                name         ="ativo"
                label        ="Status"
                width        ="200px"
                defaultValue ={config ? (config.ativo ? "true" : "false") : "true"}
                options      ={[
                  { value: "true",  label: "Ativo"   },
                  { value: "false", label: "Inativo" },
                ]}
              />
            </TCol>
          </TRow>
        </TPanel>

        {/* ── Pendências ── */}
        <TPanel title="Pendências">
          <TRow>
            <TCol>
              <TCombo
                name         ="ativarPendenciasCombo"
                label        ="Ativar pendências"
                width        ="200px"
                defaultValue ={ativarPendencias ? "true" : "false"}
                onChange     ={(v) => setAtivarPendencias(v === "true")}
                options      ={[
                  { value: "true",  label: "Sim" },
                  { value: "false", label: "Não" },
                ]}
              />
            </TCol>
          </TRow>

          {ativarPendencias && (
            <TDataGrid<LembreteLocal>
              keyField     ="_tempId"
              data         ={lembretes}
              emptyMessage ="Nenhum lembrete cadastrado"
              onAdd        ={handleAbrirNovoLembrete}
              actionsWidth ="100px"
              columns      ={lembreteColumns}
              actions      ={(row) => (
                <>
                  <TButton
                    label   =""
                    variant ="edit"
                    onClick ={(e) => { e?.stopPropagation(); handleAbrirEditarLembrete(row) }}
                  />
                  <TButton
                    label   =""
                    variant ="delete"
                    onClick ={(e) => { e?.stopPropagation(); handleRemoverLembrete(row._tempId) }}
                  />
                </>
              )}
            />
          )}
        </TPanel>

        <TFormFooter>
          <TFormActionsRight>
            <TButton label="Salvar" variant="save" type="submit" loading={saving} />
          </TFormActionsRight>
        </TFormFooter>
      </TForm>

      {/* ── Conexão / QR Code ── */}
      <TPanel title="Conexão / QR Code">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-(--text-secondary)">Status:</span>

          {statusLoading ? (
            <span className="w-4 h-4 border-2 border-(--accent) border-t-transparent rounded-full animate-spin" />
          ) : status?.conectado ? (
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-(--success) text-(--text-inverse)">
              Conectado
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-(--accent-light) text-(--accent)">
              {status?.status ?? (isConfigurado ? "Desconectado" : "Não configurado")}
            </span>
          )}
        </div>

        {!isConfigurado && (
          <p className="text-xs text-(--text-muted) mt-3">
            Salve a configuração antes de gerar o QR Code.
          </p>
        )}

        <div className="flex flex-wrap gap-2 mt-4">
          <TButton
            label    ="Gerar QR Code"
            variant  ="primary"
            type     ="button"
            loading  ={qrLoading}
            disabled ={!isConfigurado}
            onClick  ={handleGerarQrCode}
          />
          <TButton
            label    ="Atualizar status"
            variant  ="secondary"
            type     ="button"
            loading  ={statusLoading}
            disabled ={!isConfigurado}
            onClick  ={carregarStatus}
          />
        </div>
      </TPanel>

      {/* ── Modal do QR Code ── */}
      <TWindow
        title  ="Conectar instância — QR Code"
        open   ={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        width  ="420px"
        actions={
          <>
            <TButton label="Atualizar status" variant="secondary" type="button"
              loading={statusLoading} onClick={carregarStatus} />
            <TButton label="Fechar" variant="cancel" type="button"
              onClick={() => setQrModalOpen(false)} />
          </>
        }
      >
        <div className="flex flex-col items-center gap-4">
          {qrCode?.base64 ? (
            <img
              src={qrSrc(qrCode.base64)}
              alt="QR Code para conectar a instância"
              className="w-64 h-64 max-w-full border border-(--border) rounded-md bg-white p-2"
            />
          ) : (
            <p className="text-sm text-(--text-muted)">QR Code indisponível.</p>
          )}

          {qrCode?.pairingCode && (
            <div className="text-center">
              <p className="text-xs text-(--text-muted)">Código de pareamento</p>
              <p className="text-lg font-mono font-semibold tracking-widest text-(--text-primary)">
                {qrCode.pairingCode}
              </p>
            </div>
          )}

          <p className="text-xs text-(--text-muted) text-center">
            Abra o WhatsApp no celular, vá em <strong>Aparelhos conectados</strong> e
            escaneie o código acima. Depois clique em <strong>Atualizar status</strong>.
          </p>
        </div>
      </TWindow>

      {/* ── Modal do lembrete de pendência ── */}
      <TWindow
        title   ={editandoLembrete ? "Editar Lembrete" : "Novo Lembrete"}
        open    ={lembreteWindowOpen}
        width   ="560px"
        onClose ={() => setLembreteWindowOpen(false)}
        actions ={
          <TButton
            label   ={editandoLembrete ? "Salvar" : "Adicionar"}
            variant ="save"
            type    ="submit"
            form    ="lembrete-form"
          />
        }
      >
        <form
          id        ="lembrete-form"
          key       ={editandoLembrete?._tempId ?? "novo"}
          className ="flex flex-col gap-4"
          onSubmit  ={(e) => {
            e.preventDefault()
            const inputs = e.currentTarget.querySelectorAll<
              HTMLInputElement | HTMLTextAreaElement
            >("input, textarea")
            const data: Record<string, string> = {}
            inputs.forEach((el) => {
              if (!el.name) return
              data[el.name] = el.value
            })
            handleSalvarLembrete(data)
          }}
        >
          <TRow>
            <TCol>
              <TEntry
                name         ="tempoHoras"
                label        ="Tempo (horas)"
                type         ="number"
                required
                width        ="160px"
                defaultValue ={editandoLembrete?.tempoHoras ?? ""}
              />
            </TCol>
          </TRow>
          <TRow>
            <TCol>
              <TText
                name         ="mensagem"
                label        ="Mensagem"
                required
                maxLength    ={500}
                width        ="100%"
                defaultValue ={editandoLembrete?.mensagem ?? ""}
              />
            </TCol>
          </TRow>
        </form>
      </TWindow>
      </div>
    </TPage>
  )
}
