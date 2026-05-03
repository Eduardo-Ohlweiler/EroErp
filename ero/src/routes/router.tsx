import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { DashBoard }                              from "../pages/dashboard";
import Layout                                     from "../components/Layout";
import { PessoaList }                             from "../pages/cadastros/pessoas/PessoaList";
import { ProdutoList }                            from "../pages/cadastros/produtos/ProdutoList";
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
import TipoCadastroFormList from "../pages/administrativo/auxiliares/TipoCadastroFormList";
import EstadoFormList from "../pages/administrativo/auxiliares/EstadoFormList";

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
            
            {/* rotas só para SUPERADMIN */}
            <Route element={<TRoleRoute roles={["SUPERADMIN"]} />}>
                {/*ROTAS CLIENTES*/}
                <Route path="/clientes"           element={<ClienteList />} />
                <Route path="/clientes/novo"      element={<ClienteForm />} />
                <Route path="/clientes/:id"       element={<ClienteForm />} />
                
                {/*ROTAS USUARIOS*/}
                <Route path="/usuarios"           element={<UsuarioList />} />
                <Route path="/usuarios/novo"      element={<UsuarioForm />} />
                <Route path="/usuarios/:id"       element={<UsuarioForm />} />

                {/*ROTAS endereçlo*/}
                <Route path="/estados"            element={<EstadoFormList />} />
                
                {/*ROTAS TIPO TELEFONE*/}
                <Route path="/tipos/telefone"     element={<TipoTelefoneFormList />} />

                {/*ROTAS TIPO TELEFONE*/}
                <Route path="/tipos/cadastro"     element={<TipoCadastroFormList />} />

                {/*ROTAS TIPO EMAIL*/}
                <Route path="/tipos/email"        element={<TipoEmailFormList />} />

                {/*ROTAS TIPO REDE SOCIAL*/}
                <Route path="/tipos/redesocial"   element={<TipoRedeSocialFormList />} />

                {/*ROTAS TIPO ENDERECO*/}
                <Route path="/tipos/endereco"     element={<TipoEnderecoFormList />} />

            </Route>

            <Route path="/" element={<DashBoard />} />
            <Route path="/pessoas" element={<PessoaList />} />
            <Route path="/produtos" element={<ProdutoList />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  )
}