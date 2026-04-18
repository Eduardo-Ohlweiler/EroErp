import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { DashBoard } from "../pages/dashboard";
import Layout from "../components/Layout";
import { PessoaList } from "../pages/cadastros/pessoas/PessoaList";
import { ProdutoList } from "../pages/cadastros/produtos/ProdutoList";
import { PrivateRoute } from "./PrivateRoute";
import { Login } from "../pages/public/auth/Login";
import { PublicRoute } from "./PublicRoute";

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