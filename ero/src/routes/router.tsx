import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { DashBoard } from "../pages/dashboard";
import Layout from "../components/Layout";
import { PessoaList } from "../pages/cadastros/pessoas/PessoaList";
import { ProdutoList } from "../pages/cadastros/produtos/ProdutoList";
import { PrivateRoute } from "./PrivateRoute";
import { Login } from "../pages/public/auth/Login";
import { PublicRoute } from "./PublicRoute";
import { TRoleRoute } from "./TRoleRoute";
import ClienteList from "../pages/administrativo/clientes/ClienteList";
import UsuarioList from "../pages/administrativo/usuarios/UsuarioFormList";
import ClienteForm from "../pages/administrativo/clientes/ClienteForm";
import UsuarioForm from "../pages/administrativo/usuarios/UsuarioForm";
import TipoTelefoneFormList from "../pages/administrativo/usuarios/UsuarioFormList";

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
                
                {/*ROTAS TIPO TELEFONE*/}
                <Route path="/tipos/telefone"     element={<TipoTelefoneFormList />} />

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