import { BrowserRouter, Route, Routes } from "react-router-dom";
import { DashBoard } from "../pages/dashboard";
import Layout from "../components/Layout";
import { PessoaList } from "../pages/cadastros/pessoas/PessoaList";
import { ProdutoList } from "../pages/cadastros/produtos/ProdutoList";

export function Router(){
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<Layout />} >
                    <Route path="/" element={<DashBoard />} />
                    <Route path="/pessoas" element={<PessoaList />} />
                    <Route path="/produtos" element={<ProdutoList />} />
                </Route>
            </Routes>
        </BrowserRouter>
    )
}