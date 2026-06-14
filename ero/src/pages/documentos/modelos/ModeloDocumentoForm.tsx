import { useNavigate, useParams }                                from "react-router-dom"
import { useMessage }                                            from "../../../hooks/useMessage"
import { useEffect, useRef, useState }                           from "react"
import type { ModeloDocumento }                                  from "../../../types/ModeloDocumento"
import { api }                                                   from "../../../services/api"
import axios                                                     from "axios"
import type { ErrorResponse }                                    from "../../../types/ErrorResponse"
import { TPage }                                                 from "../../../components/tpage"
import { TForm, TFormActionsLeft, TFormActionsRight, TFormFooter } from "../../../components/tform"
import { TButton }                                               from "../../../components/tbutton"
import { TRow }                                                  from "../../../components/trow"
import { TCol }                                                  from "../../../components/tcol"
import { TEntry }                                                from "../../../components/tentry"
import { TCombo }                                                from "../../../components/tcombo"
import { TRichTextEditor }                                       from "../../../components/trichtexteditor"
import type { TRichTextEditorHandle }                            from "../../../components/trichtexteditor"

// ─── Definição das tags por categoria ───────────────────────────────────────

interface TagItem {
  tag: string
  descricao: string
}

interface TagCategory {
  nome: string
  tags: TagItem[]
}

const TAG_CATEGORIES: TagCategory[] = [
  {
    nome: "Sistema",
    tags: [
      { tag: "[data_atual]",        descricao: "Data atual (dd/MM/yyyy)"         },
      { tag: "[hora_atual]",        descricao: "Hora atual (HH:mm)"              },
      { tag: "[data_hora_atual]",   descricao: "Data e hora atual"               },
    ],
  },
  {
    nome: "Contrato",
    tags: [
      { tag: "[contrato_numero]",             descricao: "Número do contrato"            },
      { tag: "[contrato_data_emissao]",        descricao: "Data de emissão"              },
      { tag: "[contrato_valor]",              descricao: "Valor bruto"                   },
      { tag: "[contrato_desconto]",           descricao: "Desconto"                      },
      { tag: "[contrato_acrescimo]",          descricao: "Acréscimo"                     },
      { tag: "[contrato_valor_final]",        descricao: "Valor final"                   },
      { tag: "[contrato_numero_parcelas]",    descricao: "Número de parcelas"            },
      { tag: "[contrato_forma_pagamento]",   descricao: "Forma de pagamento"            },
    ],
  },
  {
    nome: "Cliente",
    tags: [
      { tag: "[cliente_pessoa_nome]",                descricao: "Nome completo"              },
      { tag: "[cliente_pessoa_cpf]",                 descricao: "CPF"                        },
      { tag: "[cliente_pessoa_cnpj]",                descricao: "CNPJ"                       },
      { tag: "[cliente_pessoa_cpf_cnpj]",            descricao: "CPF ou CNPJ"               },
      { tag: "[cliente_pessoa_rg]",                  descricao: "RG"                         },
      { tag: "[cliente_pessoa_razao_social]",         descricao: "Razão social"              },
      { tag: "[cliente_pessoa_nome_fantasia]",        descricao: "Nome fantasia"             },
      { tag: "[cliente_pessoa_inscricao_estadual]",   descricao: "Inscrição estadual"        },
      { tag: "[cliente_pessoa_inscricao_municipal]",  descricao: "Inscrição municipal"       },
    ],
  },
  {
    nome: "Emitente",
    tags: [
      { tag: "[emitente_pessoa_nome]",               descricao: "Nome do emitente"          },
      { tag: "[emitente_pessoa_cpf_cnpj]",           descricao: "CPF ou CNPJ do emitente"  },
      { tag: "[emitente_pessoa_cnpj]",               descricao: "CNPJ do emitente"          },
      { tag: "[emitente_pessoa_cpf]",                descricao: "CPF do emitente"           },
      { tag: "[emitente_pessoa_razao_social]",        descricao: "Razão social"             },
      { tag: "[emitente_pessoa_nome_fantasia]",       descricao: "Nome fantasia"            },
      { tag: "[emitente_pessoa_inscricao_estadual]",  descricao: "Inscrição estadual"       },
    ],
  },
  {
    nome: "Produto",
    tags: [
      { tag: "[produto_nome]",          descricao: "Nome do produto"        },
      { tag: "[produto_descricao]",     descricao: "Descrição"              },
      { tag: "[produto_codigo]",        descricao: "Código"                 },
      { tag: "[produto_unidade_medida]",descricao: "Unidade de medida"      },
      { tag: "[produto_categoria]",     descricao: "Categoria"              },
      { tag: "[produto_marca]",         descricao: "Marca"                  },
    ],
  },
  {
    nome: "Estoque",
    tags: [
      { tag: "[estoque_preco_venda]",   descricao: "Preço de venda"         },
      { tag: "[estoque_quantidade]",    descricao: "Quantidade disponível"  },
    ],
  },
]

// ─── Painel lateral de tags ───────────────────────────────────────────────

interface TagPanelProps {
  onInsert: (tag: string) => void
}

function TagPanel({ onInsert }: TagPanelProps) {
  const [open, setOpen] = useState<Record<string, boolean>>({})

  function toggleCategory(nome: string) {
    setOpen((prev) => ({ ...prev, [nome]: !prev[nome] }))
  }

  return (
    <div className="w-72 flex-shrink-0 flex flex-col gap-2">
      <div className="bg-(--bg-surface) border border-(--border) rounded-lg p-3 flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-(--text-primary)">Tags Disponíveis</h3>
        <p className="text-xs text-(--text-muted) leading-relaxed">
          Clique em uma tag para inseri-la na posição atual do cursor no editor.
        </p>

        <div className="flex flex-col gap-1 mt-1">
          {TAG_CATEGORIES.map((cat) => (
            <div key={cat.nome} className="border border-(--border) rounded-md overflow-hidden">
              {/* Cabeçalho colapsável */}
              <button
                type="button"
                onClick={() => toggleCategory(cat.nome)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium
                  text-(--text-secondary) bg-(--bg-hover) hover:bg-(--border) transition-colors cursor-pointer"
              >
                <span>{cat.nome}</span>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className={`transition-transform ${open[cat.nome] ? "rotate-180" : ""}`}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {/* Lista de tags */}
              {open[cat.nome] && (
                <div className="flex flex-col gap-0.5 p-2 bg-(--bg-surface)">
                  {cat.tags.map((item) => (
                    <button
                      key={item.tag}
                      type="button"
                      onClick={() => onInsert(item.tag)}
                      title={item.descricao}
                      className="flex flex-col items-start px-2 py-1.5 rounded text-left
                        hover:bg-(--accent-light) transition-colors cursor-pointer group"
                    >
                      <span className="text-xs font-mono font-semibold text-(--accent) group-hover:text-(--accent)">
                        {item.tag}
                      </span>
                      <span className="text-xs text-(--text-muted)">
                        {item.descricao}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────

export default function ModeloDocumentoForm() {

    const { id: idParam } = useParams()
    const navigate        = useNavigate()
    const { showMessage } = useMessage()

    const [currentId, setCurrentId] = useState<string | undefined>(idParam)
    const [formKey,   setFormKey]   = useState(0)
    const [loading,   setLoading]   = useState(false)
    const [saving,    setSaving]    = useState(false)
    const [modelo,    setModelo]    = useState<ModeloDocumento | null>(null)
    const [conteudo,  setConteudo]  = useState("")

    const editorRef = useRef<TRichTextEditorHandle | null>(null)

    const isEdit = !!currentId

    useEffect(() => {
        if (!currentId) {
            setModelo(null)
            setConteudo("")
            return
        }

        setLoading(true)
        api.get(`/modelos-documento/${currentId}`)
            .then((response) => {
                setModelo(response.data)
                setConteudo(response.data.conteudo ?? "")
            })
            .catch(() => {
                showMessage("error", "Erro ao carregar modelo de documento")
                navigate("/documentos/modelos")
            })
            .finally(() => setLoading(false))
    }, [currentId, navigate, showMessage])

    function handleNovo() {
        setCurrentId(undefined)
        setModelo(null)
        setConteudo("")
        setFormKey((prev) => prev + 1)
    }

    async function reload(id: string) {
        try {
            const response = await api.get(`/modelos-documento/${id}`)
            setModelo(response.data)
            setConteudo(response.data.conteudo ?? "")
            setFormKey((prev) => prev + 1)
        } catch {
            showMessage("error", "Erro ao recarregar o modelo de documento")
        }
    }

    // O TForm coleta nome, descricao e ativo via DOM.
    // O conteúdo do editor é mantido no estado `conteudo` via onChange.
    async function handleSubmit(data: Record<string, string>) {
        setSaving(true)
        try {
            const payload = {
                nome:      data.nome,
                descricao: data.descricao || undefined,
                conteudo:  conteudo,
                ativo:     data.ativo === "true",
            }

            if (isEdit) {
                await api.put(`/modelos-documento/${currentId}`, payload)
                showMessage("success", "Modelo atualizado com sucesso!")
                await reload(currentId!)
            } else {
                const response = await api.post("/modelos-documento", payload)
                showMessage("success", "Modelo cadastrado com sucesso!")
                const novoId = String(response.data.id)
                setCurrentId(novoId)
                await reload(novoId)
            }
        } catch (err) {
            if (axios.isAxiosError(err)) {
                const errData = err.response?.data as ErrorResponse
                showMessage("error", errData?.erro ?? "Erro ao salvar modelo")
            } else {
                showMessage("error", "Erro inesperado ao salvar modelo")
            }
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <TPage title="Carregando..." breadcrumb={["Documentos", "Modelos de Documentos"]}>
                <div className="flex justify-center py-12">
                    <span className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
                </div>
            </TPage>
        )
    }

    return (
        <TPage
            title     ={isEdit ? "Editar Modelo de Documento" : "Novo Modelo de Documento"}
            breadcrumb={["Documentos", "Modelos de Documentos"]}
        >
            <TForm key={formKey} onSubmit={handleSubmit}>
                {/* Layout de duas colunas: editor + painel de tags */}
                <div className="flex gap-4 items-start flex-wrap">

                    {/* Coluna principal */}
                    <div className="flex flex-col gap-4 flex-1 min-w-0">
                        <TRow>
                            <TCol>
                                <TEntry
                                    name        ="nome"
                                    label       ="Nome"
                                    required
                                    maxLength   ={255}
                                    defaultValue={modelo?.nome}
                                    width       ="100%"
                                />
                            </TCol>
                        </TRow>
                        <TRow>
                            <TCol>
                                <TEntry
                                    name        ="descricao"
                                    label       ="Descrição"
                                    maxLength   ={500}
                                    defaultValue={modelo?.descricao}
                                    width       ="100%"
                                />
                            </TCol>
                        </TRow>
                        <TRow>
                            <TCol>
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-(--text-secondary)">
                                        Conteúdo <span className="text-(--danger)">*</span>
                                    </label>
                                    <TRichTextEditor
                                        defaultValue={modelo?.conteudo}
                                        onChange    ={setConteudo}
                                        editorRef   ={editorRef}
                                    />
                                </div>
                            </TCol>
                        </TRow>
                        <TRow>
                            <TCol>
                                <TCombo
                                    name        ="ativo"
                                    label       ="Status"
                                    width       ="200px"
                                    defaultValue={modelo ? (modelo.ativo ? "true" : "false") : "true"}
                                    options     ={[
                                        { value: "true",  label: "Ativo"   },
                                        { value: "false", label: "Inativo" },
                                    ]}
                                />
                            </TCol>
                        </TRow>
                    </div>

                    {/* Painel lateral de tags */}
                    <TagPanel
                        onInsert={(tag) => editorRef.current?.insertText(tag)}
                    />
                </div>

                <TFormFooter>
                    <TFormActionsLeft>
                        <TButton
                            label  ="Voltar"
                            variant="cancel"
                            type   ="button"
                            onClick={() => navigate("/documentos/modelos")}
                        />
                        <TButton
                            label  ="Novo"
                            variant="new"
                            type   ="button"
                            onClick={handleNovo}
                        />
                    </TFormActionsLeft>
                    <TFormActionsRight>
                        <TButton
                            label  ="Salvar"
                            variant="save"
                            type   ="submit"
                            loading={saving}
                        />
                    </TFormActionsRight>
                </TFormFooter>
            </TForm>
        </TPage>
    )
}
