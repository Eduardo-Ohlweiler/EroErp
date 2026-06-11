import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { DashBoard }                              from "../pages/dashboard";
import Layout                                     from "../components/Layout";
import { PrivateRoute }                           from "./PrivateRoute";
import { Login }                                  from "../pages/public/auth/Login";
import { PublicRoute }                            from "./PublicRoute";
import { TRoleRoute }                             from "./TRoleRoute";
import ClienteList                                from "../pages/administrativo/clientes/ClienteList";
import ClienteForm                                from "../pages/administrativo/clientes/ClienteForm";
import UsuarioForm                                from "../pages/administrativo/usuarios/UsuarioForm";
import TipoTelefoneFormList                       from "../pages/administrativo/auxiliares/TipoTelefoneFormList";
import UsuarioList                                from "../pages/administrativo/usuarios/UsuarioList";
import TipoEmailFormList                          from "../pages/administrativo/auxiliares/TipoEmailFormList";
import TipoRedeSocialFormList                     from "../pages/administrativo/auxiliares/TipoRedeSocialFormList";
import TipoEnderecoFormList                       from "../pages/administrativo/auxiliares/TipoEnderecoFormList";
import TipoCadastroFormList                       from "../pages/administrativo/auxiliares/TipoCadastroFormList";
import EstadoFormList                             from "../pages/administrativo/auxiliares/EstadoFormList";
import CidadeList                                 from "../pages/cadastros/auxiliares/CidadeList";
import CidadeForm                                 from "../pages/cadastros/auxiliares/CidadeForm";
import PessoaList                                 from "../pages/cadastros/pessoas/PessoaList";
import PessoaForm                                 from "../pages/cadastros/pessoas/PessoaForm";
import EmitenteFormList                           from "../pages/cadastros/emitente/EmitenteFormList";
import CompromissoCalendario                      from "../pages/calendario/CompromissoCalendario";
import CompromissoForm                            from "../pages/calendario/CompromissoForm";
import WhatsappConfigGlobalForm                   from "../pages/administrativo/whatsapp/WhatsappConfigGlobalForm";
import WhatsappInstanciaList                      from "../pages/administrativo/whatsapp/instancias/WhatsappInstanciaList";
import WhatsappInstanciaForm                      from "../pages/administrativo/whatsapp/instancias/WhatsappInstanciaForm"
import ConfiguracaoMensagemForm                   from "../pages/agenda/auxiliares/ConfiguracaoMensagemForm";
import TipoProdutoList                            from "../pages/administrativo/auxiliares/TipoProdutoList";
import UnidadeMedidaList                          from "../pages/administrativo/auxiliares/UnidadeMedidaList";
import NcmList                                    from "../pages/administrativo/auxiliares/NcmList";
import OrigemProdutoList                          from "../pages/administrativo/auxiliares/OrigemProdutoList";
import CestList                                   from "../pages/administrativo/auxiliares/CestList";
import GrupoFormList                              from "../pages/cadastros/produtos/auxiliar/GrupoFormList";
import SubgrupoFormList                           from "../pages/cadastros/produtos/auxiliar/SubgrupoFormList";
import CategoriaFormList                          from "../pages/cadastros/produtos/auxiliar/CategoriaFormList";
import MarcaFormList                              from "../pages/cadastros/produtos/auxiliar/MarcaFormList";
import ProdutoList                                from "../pages/cadastros/produtos/ProdutoList";
import ProdutoForm                                from "../pages/cadastros/produtos/ProdutoForm";
import EstoqueList                                from "../pages/cadastros/estoque/EstoqueList";
import EstoqueForm                                from "../pages/cadastros/estoque/EstoqueForm";
import AjusteList                                 from "../pages/cadastros/estoque/AjusteList";
import AjusteForm                                 from "../pages/cadastros/estoque/AjusteForm";
import TransferenciaList                          from "../pages/cadastros/estoque/TransferenciaList";
import TransferenciaForm                          from "../pages/cadastros/estoque/TransferenciaForm";
import MovimentacaoList                           from "../pages/cadastros/estoque/MovimentacaoList"
import ConsultaList                              from "../pages/clinica/ConsultaList"
import ConsultaForm                              from "../pages/clinica/ConsultaForm"
import FaturamentoConsulta                       from "../pages/clinica/FaturamentoConsulta"
import ConsultaDashboard                         from "../pages/clinica/ConsultaDashboard"
import TemplateAnamneseList                      from "../pages/clinica/TemplateAnamneseList"
import TemplateAnamneseForm                      from "../pages/clinica/TemplateAnamneseForm"
import FichaAnamneseList                         from "../pages/clinica/FichaAnamneseList"
import FichaAnamneseForm                         from "../pages/clinica/FichaAnamneseForm"
import PlanoAlimentarList                        from "../pages/clinica/PlanoAlimentarList"
import PlanoAlimentarForm                        from "../pages/clinica/PlanoAlimentarForm"
import RefeicaoList                              from "../pages/clinica/RefeicaoList"
import RefeicaoForm                              from "../pages/clinica/RefeicaoForm"
import ContaFinanceiraFormList                   from "../pages/financeiro/auxiliares/ContaFinanceiraFormList"
import TipoCobrancaFormList                      from "../pages/financeiro/auxiliares/TipoCobrancaFormList"
import FormaPagamentoFormList                    from "../pages/financeiro/auxiliares/FormaPagamentoFormList"
import ContaPagarList                            from "../pages/financeiro/contapagar/ContaPagarList"
import ContaPagarForm                            from "../pages/financeiro/contapagar/ContaPagarForm"
import ContaReceberList                          from "../pages/financeiro/contareceber/ContaReceberList"
import ContaReceberForm                          from "../pages/financeiro/contareceber/ContaReceberForm"
import PagarContas                               from "../pages/financeiro/PagarContas"
import FinanceiroDashboard                       from "../pages/financeiro/FinanceiroDashboard"
import LancamentosFinanceiros                    from "../pages/financeiro/LancamentosFinanceiros"
import TransferenciaEntreContas                  from "../pages/financeiro/TransferenciaEntreContas"

export function Router() {
  return (
    <BrowserRouter>
      <Routes>

        {/* rotas públicas */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
        </Route>

        {/* rotas privadas */}
        <Route element={<PrivateRoute />}>
          <Route element={<Layout />}>

            {/* ── SUPERADMIN ── */}
            <Route element={<TRoleRoute roles={["SUPERADMIN"]} />}>
              <Route path="/clientes"         element={<ClienteList />} />
              <Route path="/clientes/novo"    element={<ClienteForm />} />
              <Route path="/clientes/:id"     element={<ClienteForm />} />

              <Route path="/usuarios"         element={<UsuarioList />} />
              <Route path="/usuarios/novo"    element={<UsuarioForm />} />
              <Route path="/usuarios/:id"     element={<UsuarioForm />} />

              <Route path="/whatsapp/config-global" element={<WhatsappConfigGlobalForm />} />

              <Route path="/estados"          element={<EstadoFormList />} />
              <Route path="/tipos/telefone"   element={<TipoTelefoneFormList />} />
              <Route path="/tipos/cadastro"   element={<TipoCadastroFormList />} />
              <Route path="/tipos/email"      element={<TipoEmailFormList />} />
              <Route path="/tipos/redesocial" element={<TipoRedeSocialFormList />} />
              <Route path="/tipos/endereco"   element={<TipoEnderecoFormList />} />

              <Route path="/tabelas/tipo-produto"   element={<TipoProdutoList />} />
              <Route path="/tabelas/unidade-medida" element={<UnidadeMedidaList />} />
              <Route path="/tabelas/ncm"            element={<NcmList />} />
              <Route path="/tabelas/origem-produto" element={<OrigemProdutoList />} />
              <Route path="/tabelas/cest"           element={<CestList />} />
            </Route>

            {/* ── CIDADES ── */}
            <Route element={<TRoleRoute roles={["SUPERADMIN", "ADMIN", "CIDADE", "CIDADE_GET", "CIDADE_POST"]} />}>
              <Route path="/cidades"      element={<CidadeList />} />
              <Route path="/cidades/novo" element={<CidadeForm />} />
              <Route path="/cidades/:id"  element={<CidadeForm />} />
            </Route>

            {/* ── EMITENTES ── */}
            <Route element={<TRoleRoute roles={["SUPERADMIN", "ADMIN", "EMITENTE", "EMITENTE_GET"]} />}>
              <Route path="/emitentes" element={<EmitenteFormList />} />
            </Route>

            {/* ── PESSOAS ── */}
            <Route element={<TRoleRoute roles={["SUPERADMIN", "ADMIN", "PESSOA", "PESSOA_GET", "PESSOA_POST"]} />}>
              <Route path="/pessoas"      element={<PessoaList />} />
              <Route path="/pessoas/novo" element={<PessoaForm />} />
              <Route path="/pessoas/:id"  element={<PessoaForm />} />
            </Route>

            {/* ── WHATSAPP INSTÂNCIAS ── */}
            <Route element={<TRoleRoute roles={["SUPERADMIN", "ADMIN"]} />}>
              <Route path="/whatsapp/instancias"      element={<WhatsappInstanciaList />} />
              <Route path="/whatsapp/instancias/novo"  element={<WhatsappInstanciaForm />} />
              <Route path="/whatsapp/instancias/:id"   element={<WhatsappInstanciaForm />} />
            </Route>

            {/* ── PRODUTOS ── */}
            <Route element={<TRoleRoute roles={["SUPERADMIN", "ADMIN", "PRODUTO", "PRODUTO_GET"]} />}>
              <Route path="/produtos"      element={<ProdutoList />} />
              <Route path="/produtos/novo" element={<ProdutoForm />} />
              <Route path="/produtos/:id"  element={<ProdutoForm />} />
            </Route>

            {/* ── AUXILIAR PRODUTO ── */}
            <Route element={<TRoleRoute roles={["SUPERADMIN", "ADMIN", "GRUPO", "GRUPO_GET", "PRODUTO", "PRODUTO_GET"]} />}>
              <Route path="/produtos/grupos"     element={<GrupoFormList />} />
              <Route path="/produtos/subgrupos"  element={<SubgrupoFormList />} />
              <Route path="/produtos/categorias" element={<CategoriaFormList />} />
              <Route path="/produtos/marcas"     element={<MarcaFormList />} />
            </Route>

            {/* ── ESTOQUE ── */}
            <Route element={<TRoleRoute roles={["SUPERADMIN", "ADMIN", "ESTOQUE", "ESTOQUE_GET"]} />}>
              <Route path="/estoque"                          element={<EstoqueList />} />
              <Route path="/estoque/novo"                     element={<EstoqueForm />} />
              <Route path="/estoque/:id"                      element={<EstoqueForm />} />
              <Route path="/estoque/movimentacoes"            element={<MovimentacaoList />} />
            </Route>
            <Route element={<TRoleRoute roles={["SUPERADMIN", "ADMIN", "ESTOQUE", "ESTOQUE_GET", "ESTOQUE_AJUSTE"]} />}>
              <Route path="/estoque/ajustes"                  element={<AjusteList />} />
              <Route path="/estoque/ajustes/novo"             element={<AjusteForm />} />
            </Route>
            <Route element={<TRoleRoute roles={["SUPERADMIN", "ADMIN", "ESTOQUE", "ESTOQUE_GET", "ESTOQUE_TRANSFERENCIA"]} />}>
              <Route path="/estoque/transferencias"           element={<TransferenciaList />} />
              <Route path="/estoque/transferencias/nova"      element={<TransferenciaForm />} />
            </Route>

            {/* ── COMPRIMISSO ── */}
            <Route element={<TRoleRoute roles={["SUPERADMIN", "ADMIN", "COMPROMISSO"]} />}>
              <Route path="/agenda"                          element={<CompromissoCalendario />} />
              <Route path="/compromissos/novo"               element={<CompromissoForm />} />
              <Route path="/compromissos/:id"                element={<CompromissoForm />} />
              <Route path="/agenda/configuracao-mensagem"    element={<ConfiguracaoMensagemForm />} />
            </Route>

            {/* ── CLÍNICA ── */}
            <Route element={<TRoleRoute roles={["SUPERADMIN", "ADMIN", "CLINICA", "CLINICA_GET"]} />}>
              <Route path="/clinica/consultas"                      element={<ConsultaList />} />
              <Route path="/clinica/consultas/nova"             element={<ConsultaForm />} />
              <Route path="/clinica/consultas/:id"              element={<ConsultaForm />} />
              <Route path="/clinica/consultas/:id/faturamento"  element={<FaturamentoConsulta />} />
              <Route path="/dashboards/consultas"               element={<ConsultaDashboard />} />
              <Route path="/clinica/fichas-anamnese"            element={<FichaAnamneseList />} />
              <Route path="/clinica/fichas-anamnese/nova"       element={<FichaAnamneseForm />} />
              <Route path="/clinica/fichas-anamnese/:id"        element={<FichaAnamneseForm />} />
              <Route path="/clinica/templates-anamnese"         element={<TemplateAnamneseList />} />
              <Route path="/clinica/templates-anamnese/novo"    element={<TemplateAnamneseForm />} />
              <Route path="/clinica/templates-anamnese/:id"     element={<TemplateAnamneseForm />} />
              <Route path="/clinica/planos-alimentares"         element={<PlanoAlimentarList />} />
              <Route path="/clinica/planos-alimentares/novo"    element={<PlanoAlimentarForm />} />
              <Route path="/clinica/planos-alimentares/:id"     element={<PlanoAlimentarForm />} />
              <Route path="/clinica/refeicoes"                  element={<RefeicaoList />} />
              <Route path="/clinica/refeicoes/nova"             element={<RefeicaoForm />} />
              <Route path="/clinica/refeicoes/:id"              element={<RefeicaoForm />} />
            </Route>

            {/* ── FINANCEIRO ── */}
            <Route element={<TRoleRoute roles={["SUPERADMIN", "ADMIN", "FINANCEIRO", "FINANCEIRO_GET"]} />}>
              <Route path="/financeiro/contas"           element={<ContaFinanceiraFormList />} />
              <Route path="/financeiro/tipos-cobranca"   element={<TipoCobrancaFormList />} />
              <Route path="/financeiro/formas-pagamento" element={<FormaPagamentoFormList />} />

              <Route path="/financeiro/contas-pagar"      element={<ContaPagarList />} />
              <Route path="/financeiro/contas-pagar/novo" element={<ContaPagarForm />} />
              <Route path="/financeiro/contas-pagar/:id"  element={<ContaPagarForm />} />

              <Route path="/financeiro/contas-receber"      element={<ContaReceberList />} />
              <Route path="/financeiro/contas-receber/novo" element={<ContaReceberForm />} />
              <Route path="/financeiro/contas-receber/:id"  element={<ContaReceberForm />} />

              <Route path="/financeiro/pagar-contas"    element={<PagarContas />} />
              <Route path="/dashboards/financeiro"      element={<FinanceiroDashboard />} />
              <Route path="/financeiro/lancamentos"     element={<LancamentosFinanceiros />} />
              <Route path="/financeiro/transferencias"  element={<TransferenciaEntreContas />} />
            </Route>

            <Route path="/" element={<DashBoard />} />

          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  )
}