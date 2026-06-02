import { useState, useEffect }                              from "react"
import { useNavigate, useParams }                           from "react-router-dom"
import { api }                                              from "../../../services/api"
import axios                                                from "axios"
import type { ProdutoResponse }                             from "../../../types/Produto"
import type { ErrorResponse }                               from "../../../types/ErrorResponse"
import { TPage }                                            from "../../../components/tpage"
import { TForm, TFormActionsLeft, TFormFooter }             from "../../../components/tform"
import { TRow }                                             from "../../../components/trow"
import { TCol }                                             from "../../../components/tcol"
import { TEntry }                                           from "../../../components/tentry"
import { TCombo }                                           from "../../../components/tcombo"
import { TDbCombo }                                         from "../../../components/tdbcombo"
import { TButton }                                          from "../../../components/tbutton"
import { useMessage }                                       from "../../../hooks/useMessage"
import { TSpace } from "../../../components/tspace"

function displayUnidade(item: Record<string, unknown>): string {
  return `${item.sigla} — ${item.descricao}`
}

function displayNcm(item: Record<string, unknown>): string {
  return `${item.codigo} — ${item.descricao}`
}

function displayOrigem(item: Record<string, unknown>): string {
  return `${item.codigo} — ${item.descricao}`
}

function displaySubgrupo(item: Record<string, unknown>): string {
  return `${item.grupoNome} — ${item.nome}`
}

export default function ProdutoForm() {
  const { id }          = useParams<{ id: string }>()
  const navigate        = useNavigate()
  const { showMessage } = useMessage()
  const isEdit          = Boolean(id)

  const [saving,                setSaving]                = useState(false)
  const [loading,               setLoading]               = useState(false)
  const [formKey,               setFormKey]               = useState(0)
  const [tipoProdutoId,         setTipoProdutoId]         = useState("")
  const [unidadeMedidaId,       setUnidadeMedidaId]       = useState("")
  const [subgrupoId,            setSubgrupoId]            = useState("")
  const [categoriaId,           setCategoriaId]           = useState("")
  const [marcaId,               setMarcaId]               = useState("")
  const [fornecedorPessoaId,    setFornecedorPessoaId]    = useState("")
  const [ncmId,                 setNcmId]                 = useState("")
  const [origemProdutoId,       setOrigemProdutoId]       = useState("")
  const [cestId,                setCestId]                = useState("")
  const [codigo,                setCodigo]                = useState("")
  const [codigoEan,             setCodigoEan]             = useState("")
  const [codigoGtin,            setCodigoGtin]            = useState("")
  const [nome,                  setNome]                  = useState("")
  const [descricao,             setDescricao]             = useState("")
  const [custo,                 setCusto]                 = useState("")
  const [bloqueado,             setBloqueado]             = useState("false")
  const [substituicaoTributaria,setSubstituicaoTributaria]= useState("false")

  useEffect(() => {
    if (isEdit) loadProduto()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function loadProduto() {
    setLoading(true)
    try {
      const res = await api.get<ProdutoResponse>(`/produtos/${id}`)
      const p   = res.data

      setCodigo(p.codigo != null ? String(p.codigo) : "")
      setCodigoEan(p.codigoEan ?? "")
      setCodigoGtin(p.codigoGtin ?? "")
      setNome(p.nome)
      setDescricao(p.descricao ?? "")
      setCusto(p.custo != null ? String(p.custo) : "")
      setBloqueado(p.bloqueado ? "true" : "false")
      setSubstituicaoTributaria(p.substituicaoTributaria ? "true" : "false")

      setTipoProdutoId(String(p.tipoProdutoId))
      setUnidadeMedidaId(String(p.unidadeMedidaId))
      if (p.subgrupoId)         setSubgrupoId(String(p.subgrupoId))
      if (p.categoriaId)        setCategoriaId(String(p.categoriaId))
      if (p.marcaId)            setMarcaId(String(p.marcaId))
      if (p.fornecedorPessoaId) setFornecedorPessoaId(String(p.fornecedorPessoaId))
      if (p.ncmId)              setNcmId(String(p.ncmId))
      if (p.origemProdutoId)    setOrigemProdutoId(String(p.origemProdutoId))
      if (p.cestId)             setCestId(String(p.cestId))

      setFormKey((k) => k + 1)
    } catch {
      showMessage("error", "Erro ao carregar produto")
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(formData: Record<string, string>) {
    if (!tipoProdutoId) {
      showMessage("error", "Tipo de produto é obrigatório")
      return
    }
    if (!unidadeMedidaId) {
      showMessage("error", "Unidade de medida é obrigatória")
      return
    }

    setSaving(true)
    try {
      const payload = {
        codigo:                formData.codigo    ? Number(formData.codigo) : null,
        codigoEan:             formData.codigoEan || null,
        codigoGtin:            formData.codigoGtin|| null,
        nome:                  formData.nome,
        descricao:             formData.descricao || null,
        bloqueado:             formData.bloqueado === "true",
        tipoProdutoId:         Number(tipoProdutoId),
        subgrupoId:            subgrupoId  ? Number(subgrupoId)  : null,
        categoriaId:           categoriaId ? Number(categoriaId) : null,
        marcaId:               marcaId     ? Number(marcaId)     : null,
        unidadeMedidaId:       Number(unidadeMedidaId),
        fornecedorPessoaId:    fornecedorPessoaId ? Number(fornecedorPessoaId) : null,
        custo:                 formData.custo     ? Number(formData.custo)     : null,
        ncmId:                 ncmId              ? Number(ncmId)              : null,
        origemProdutoId:       origemProdutoId    ? Number(origemProdutoId)    : null,
        cestId:                cestId             ? Number(cestId)             : null,
        substituicaoTributaria: formData.substituicaoTributaria === "true"
      }

      if (isEdit) {
        await api.put(`/produtos/${id}`, payload)
        showMessage("success", "Produto atualizado com sucesso!")
      } else {
        await api.post("/produtos", payload)
        showMessage("success", "Produto cadastrado com sucesso!")
        navigate("/produtos")
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const e = err.response?.data as ErrorResponse
        showMessage("error", e?.erro ?? "Erro ao salvar produto")
      } else {
        showMessage("error", "Erro inesperado")
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <TPage title="Carregando..." breadcrumb={["Cadastros", "Produtos"]}><div /></TPage>

  return (
    <TPage
      title     ={isEdit ? "Editar Produto" : "Novo Produto"}
      breadcrumb={["Cadastros", "Produtos", isEdit ? "Editar" : "Novo"]}
    >
      <TForm key={formKey} onSubmit={handleSubmit}>

        {/* ── Identificação ── */}
        <TRow>
          <TCol>
            <TDbCombo
              name         ="tipoProdutoId"
              label        ="Tipo de Produto"
              url          ="/tipos-produto"
              valueField   ="id"
              displayField ="nome"
              searchField  ="nome"
              placeholder  ="Selecione..."
              required
              width        ="300px"
              value        ={tipoProdutoId}
              onChange     ={(val) => setTipoProdutoId(val)}
            />
          </TCol>
        </TRow>
        <TRow>
          <TCol>
            <TEntry
              name         ="nome"
              label        ="Nome"
              required
              maxLength    ={150}
              defaultValue ={nome}
              width        ="50%"
            />
          </TCol>
        </TRow>
        <TRow>
          <TCol>
            <TEntry
              name         ="descricao"
              label        ="Descrição"
              maxLength    ={255}
              defaultValue ={descricao}
              width        ="50%"
            />
          </TCol>
        </TRow>
        <TRow>
          <TCol>
            <TDbCombo
              name         ="unidadeMedidaId"
              label        ="Unidade de Medida"
              url          ="/unidades-medida"
              valueField   ="id"
              displayField ={displayUnidade}
              searchField  ="busca"
              placeholder  ="Selecione..."
              required
              width        ="300px"
              value        ={unidadeMedidaId}
              onChange     ={(val) => setUnidadeMedidaId(val)}
            />
          </TCol>
        </TRow>
        <TRow>
          <TCol>
            <TEntry
              name         ="codigo"
              label        ="Código interno"
              mask         ="numero"
              defaultValue ={codigo}
              width        ="300px"
            />
          </TCol>
        </TRow>
        <TRow>
          <TCol>
            <TEntry
              name         ="codigoEan"
              label        ="EAN"
              maxLength    ={14}
              defaultValue ={codigoEan}
              width        ="300px"
            />
          </TCol>
          <TCol>
            <TEntry
              name         ="codigoGtin"
              label        ="GTIN"
              maxLength    ={14}
              defaultValue ={codigoGtin}
              width        ="300px"
            />
          </TCol>
          <TSpace />
        </TRow>
        <TRow>
          <TCol>
            <TDbCombo
              name         ="subgrupoId"
              label        ="Subgrupo"
              url          ="/subgrupos"
              valueField   ="id"
              displayField ={displaySubgrupo}
              searchField  ="nome"
              placeholder  ="Selecione..."
              width        ="300px"
              value        ={subgrupoId}
              onChange     ={(val) => setSubgrupoId(val)}
            />
          </TCol>
        </TRow>
        <TRow>
          <TCol>
            <TDbCombo
              name         ="categoriaId"
              label        ="Categoria"
              url          ="/categorias"
              valueField   ="id"
              displayField ="nome"
              searchField  ="nome"
              placeholder  ="Selecione..."
              width        ="300px"
              value        ={categoriaId}
              onChange     ={(val) => setCategoriaId(val)}
            />
          </TCol>
        </TRow>
        <TRow>
          <TCol>
            <TDbCombo
              name         ="marcaId"
              label        ="Marca"
              url          ="/marcas"
              valueField   ="id"
              displayField ="nome"
              searchField  ="nome"
              placeholder  ="Selecione..."
              width        ="300px"
              value        ={marcaId}
              onChange     ={(val) => setMarcaId(val)}
            />
          </TCol>
        </TRow>
        <TRow>
          <TCol>
            <TEntry
              name         ="custo"
              label        ="Custo"
              mask         ="moeda"
              defaultValue ={custo}
              width        ="160px"
            />
          </TCol>
        </TRow>
        <TRow>
          <TCol>
            <TDbCombo
              name         ="fornecedorPessoaId"
              label        ="Fornecedor"
              url          ="/pessoas/select"
              valueField   ="id"
              displayField ="nome"
              searchField  ="nome"
              placeholder  ="Selecione..."
              width        ="50%"
              value        ={fornecedorPessoaId}
              onChange     ={(val) => setFornecedorPessoaId(val)}
            />
          </TCol>
        </TRow>

        <TRow>
          <TCol>
            <TDbCombo
              name         ="ncmId"
              label        ="NCM"
              url          ="/ncm"
              valueField   ="id"
              displayField ={displayNcm}
              searchField  ="busca"
              placeholder  ="Digite para buscar..."
              minLength    ={2}
              width        ="300px"
              value        ={ncmId}
              onChange     ={(val) => setNcmId(val)}
            />
          </TCol>
        </TRow>
        <TRow>
          <TCol>
            <TDbCombo
              name         ="origemProdutoId"
              label        ="Origem"
              url          ="/origens-produto"
              valueField   ="id"
              displayField ={displayOrigem}
              placeholder  ="Selecione..."
              width        ="300px"
              value        ={origemProdutoId}
              onChange     ={(val) => setOrigemProdutoId(val)}
            />
          </TCol>
        </TRow>
        <TRow>
          <TCol>
            <TDbCombo
              name         ="cestId"
              label        ="CEST"
              url          ="/cest"
              valueField   ="id"
              displayField ={displayNcm}
              searchField  ="busca"
              placeholder  ="Digite para buscar..."
              minLength    ={2}
              width        ="300px"
              value        ={cestId}
              onChange     ={(val) => setCestId(val)}
            />
          </TCol>
        </TRow>

        {/* ── Tributário ── */}
        <TRow>
          <TCol>
            <TCombo
              name         ="substituicaoTributaria"
              label        ="Substituição Tributária"
              width        ="300px"
              defaultValue ={substituicaoTributaria}
              onChange     ={setSubstituicaoTributaria}
              options      ={[
                { value: "false", label: "Não" },
                { value: "true",  label: "Sim" },
              ]}
            />
          </TCol>
        </TRow>
        <TRow>
          {isEdit && (
            <TCol>
              <TCombo
                name         ="bloqueado"
                label        ="Status"
                width        ="300px"
                defaultValue ={bloqueado}
                onChange     ={setBloqueado}
                options      ={[
                  { value: "false", label: "Ativo"     },
                  { value: "true",  label: "Bloqueado" },
                ]}
              />
            </TCol>
          )}
        </TRow>

        <TFormFooter>
          <TFormActionsLeft>
            <TButton label="Voltar" variant="cancel" type="button"
              onClick={() => navigate("/produtos")} />
            <TButton label="Salvar" variant="save" type="submit" loading={saving} />
          </TFormActionsLeft>
        </TFormFooter>
      </TForm>
    </TPage>
  )
}
