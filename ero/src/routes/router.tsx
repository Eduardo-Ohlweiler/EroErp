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
import WhatsappInstanciaForm                      from "../pages/administrativo/whatsapp/instancias/WhatsappInstanciaForm";

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

            {/* ── COMPRIMISSO ── */}
            <Route element={<TRoleRoute roles={["SUPERADMIN", "ADMIN", "COMPROMISSO"]} />}>
              <Route path="/agenda"              element={<CompromissoCalendario />} />
              <Route path="/compromissos/novo"   element={<CompromissoForm />} />
              <Route path="/compromissos/:id"    element={<CompromissoForm />} />
            </Route>

            <Route path="/" element={<DashBoard />} />

          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  )
}