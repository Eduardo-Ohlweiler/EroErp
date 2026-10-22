import { Fragment, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { TProtected } from '@/components/layout/TProtected'
import { Agenda } from '@/pages/agenda/Agenda'
import { CompromissoForm } from '@/pages/agenda/CompromissoForm'
import { ConsultaForm } from '@/pages/consulta/ConsultaForm'
import { ConsultaList } from '@/pages/consulta/ConsultaList'
import { FilialForm } from '@/pages/filial/FilialForm'
import { FilialList } from '@/pages/filial/FilialList'
import { Inicio } from '@/pages/Inicio'
import { NaoEncontrado } from '@/pages/NaoEncontrado'
import { NaoEncontradoPublico } from '@/pages/NaoEncontradoPublico'
import { Login } from '@/pages/auth/Login'
import { LoginLogList } from '@/pages/loginlog/LoginLogList'
import { Perfil } from '@/pages/perfil/Perfil'
import { PessoaForm } from '@/pages/pessoa/PessoaForm'
import { PessoaList } from '@/pages/pessoa/PessoaList'
import { EstoqueForm } from '@/pages/estoque/EstoqueForm'
import { EstoqueList } from '@/pages/estoque/EstoqueList'
import { MovimentacaoList } from '@/pages/estoque/MovimentacaoList'
import { AuxiliaresProduto } from '@/pages/produto/AuxiliaresProduto'
import { ProdutoForm } from '@/pages/produto/ProdutoForm'
import { ProdutoList } from '@/pages/produto/ProdutoList'
import { ServicoForm } from '@/pages/servico/ServicoForm'
import { ServicoList } from '@/pages/servico/ServicoList'
import { TenantForm } from '@/pages/tenant/TenantForm'
import { TenantNovo } from '@/pages/tenant/TenantNovo'
import { TenantList } from '@/pages/tenant/TenantList'
import { UsuarioForm } from '@/pages/usuario/UsuarioForm'
import { UsuarioList } from '@/pages/usuario/UsuarioList'
import { WhatsappConfig } from '@/pages/integracoes/WhatsappConfig'

/**
 * Formulário de cadastro remonta quando o registro da rota muda.
 *
 * `/pessoas/nova` e `/pessoas/:id` são duas rotas com o MESMO componente, e o
 * React reaproveita a instância entre elas: abrir um registro salvo e depois ir
 * para o novo (pelo histórico do navegador, por exemplo) mantinha os dados do
 * anterior debaixo do título de cadastro novo — e salvar criava uma cópia
 * calada. A chave pelo `id` faz cada registro nascer limpo.
 */
function PorRegistro({ children }: { children: ReactNode }) {
  const { id } = useParams()
  return <Fragment key={id ?? 'novo'}>{children}</Fragment>
}

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/app" replace />} />

        {/* Pública. Não há cadastro: o acesso é provisionado pelo superadmin. */}
        <Route path="/app/login" element={<Login />} />
        <Route path="/login" element={<Navigate to="/app/login" replace />} />

        {/* Todo o ERP vive sob /app; a raiz fica livre para páginas públicas futuras. */}
        <Route path="/app" element={<TProtected />}>
          <Route element={<Layout />}>
            <Route index element={<Inicio />} />
            <Route path="perfil" element={<Perfil />} />

            {/*
              Módulo de negócio: vale a permissão da tela. Quem só lê abre a
              lista e o registro, mas não o cadastro novo.
            */}
            <Route element={<TProtected tela="PESSOAS" />}>
              <Route path="pessoas" element={<PessoaList />} />
              <Route path="pessoas/:id" element={<PorRegistro><PessoaForm /></PorRegistro>} />
            </Route>
            <Route element={<TProtected tela="PESSOAS" escrita />}>
              <Route path="pessoas/nova" element={<PorRegistro><PessoaForm /></PorRegistro>} />
            </Route>

            <Route element={<TProtected tela="FILIAIS" />}>
              <Route path="filiais" element={<FilialList />} />
              <Route path="filiais/:id" element={<PorRegistro><FilialForm /></PorRegistro>} />
            </Route>
            <Route element={<TProtected tela="FILIAIS" escrita />}>
              <Route path="filiais/nova" element={<PorRegistro><FilialForm /></PorRegistro>} />
            </Route>

            <Route element={<TProtected tela="SERVICOS" />}>
              <Route path="servicos" element={<ServicoList />} />
              <Route path="servicos/:id" element={<PorRegistro><ServicoForm /></PorRegistro>} />
            </Route>
            <Route element={<TProtected tela="SERVICOS" escrita />}>
              <Route path="servicos/novo" element={<PorRegistro><ServicoForm /></PorRegistro>} />
            </Route>

            <Route element={<TProtected tela="PRODUTOS" />}>
              <Route path="produtos" element={<ProdutoList />} />
              <Route path="produtos/:id" element={<PorRegistro><ProdutoForm /></PorRegistro>} />
            </Route>
            <Route element={<TProtected tela="PRODUTOS" escrita />}>
              <Route path="produtos/novo" element={<PorRegistro><ProdutoForm /></PorRegistro>} />
            </Route>

            {/* Rota própria, não debaixo de /produtos: o item do menu de
                Produtos acenderia junto (o NavLink casa por prefixo). */}
            <Route element={<TProtected tela="AUXILIARES_PRODUTO" />}>
              <Route path="auxiliares-produto" element={<AuxiliaresProduto />} />
            </Route>

            <Route element={<TProtected tela="ESTOQUE" />}>
              <Route path="estoque" element={<EstoqueList />} />
              <Route path="estoque/:id" element={<PorRegistro><EstoqueForm /></PorRegistro>} />
              <Route path="estoque-movimentacoes" element={<MovimentacaoList />} />
            </Route>
            <Route element={<TProtected tela="ESTOQUE" escrita />}>
              <Route path="estoque/novo" element={<PorRegistro><EstoqueForm /></PorRegistro>} />
            </Route>

            {/* O formulário mora debaixo de /agenda: é a mesma tela no menu. */}
            <Route element={<TProtected tela="AGENDA" />}>
              <Route path="agenda" element={<Agenda />} />
              <Route path="agenda/:id" element={<PorRegistro><CompromissoForm /></PorRegistro>} />
            </Route>
            <Route element={<TProtected tela="AGENDA" escrita />}>
              <Route path="agenda/novo" element={<PorRegistro><CompromissoForm /></PorRegistro>} />
            </Route>

            <Route element={<TProtected tela="CONSULTAS" />}>
              <Route path="consultas" element={<ConsultaList />} />
              <Route path="consultas/:id" element={<PorRegistro><ConsultaForm /></PorRegistro>} />
            </Route>
            <Route element={<TProtected tela="CONSULTAS" escrita />}>
              <Route path="consultas/nova" element={<PorRegistro><ConsultaForm /></PorRegistro>} />
            </Route>

            {/* Uma tela só: o que é do superadmin aparece dentro dela, pela role. */}
            <Route element={<TProtected tela="WHATSAPP" />}>
              <Route path="integracoes/whatsapp" element={<WhatsappConfig />} />
            </Route>

            {/*
              Área administrativa. O guard aqui é conveniência de navegação —
              a autorização real é o @PreAuthorize do backend.
            */}
            <Route element={<TProtected roles={['SUPERADMIN']} />}>
              <Route path="usuarios" element={<UsuarioList />} />
              <Route path="usuarios/novo" element={<PorRegistro><UsuarioForm /></PorRegistro>} />
              <Route path="usuarios/:id" element={<PorRegistro><UsuarioForm /></PorRegistro>} />
              <Route path="tenants" element={<TenantList />} />
              <Route path="tenants/novo" element={<PorRegistro><TenantNovo /></PorRegistro>} />
              <Route path="tenants/:id" element={<PorRegistro><TenantForm /></PorRegistro>} />
              <Route path="log-acesso" element={<LoginLogList />} />
            </Route>

            <Route path="*" element={<NaoEncontrado />} />
          </Route>
        </Route>

        <Route path="*" element={<NaoEncontradoPublico />} />
      </Routes>
    </BrowserRouter>
  )
}
