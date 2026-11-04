import { useEffect, useRef } from 'react';
import { Route, Routes, useLocation, useNavigate, type Location } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { LiveBackground } from './components/layout/LiveBackground';
import { MobileNav, Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { CommandPalette } from './components/layout/CommandPalette';
import { NewDealModal } from './components/layout/NewDealModal';
import { page } from './motion/tokens';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Funil from './pages/Funil';
import Agenda from './pages/Agenda';
import Cadastro from './pages/Cadastro';
import ClienteDetalhe from './pages/ClienteDetalhe';
import Configuracoes from './pages/Configuracoes';
import DesignSystem from './pages/DesignSystem';
import { clientesConfig, filiaisConfig, produtosConfig } from './pages/cadastros';

const ENTROU = 'vitrum:entrou';

export default function App() {
  const location = useLocation();
  const nav = useNavigate();
  const isLogin = location.pathname === '/login';

  // Primeira visita da sessão abre o login (para ver a animação de partículas).
  useEffect(() => {
    try {
      if (!isLogin && !sessionStorage.getItem(ENTROU)) nav('/login', { replace: true });
    } catch {
      /* ignora */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <LiveBackground />
      <div className="relative z-10">
        <AnimatePresence mode="wait">
          {isLogin ? <Login key="login" /> : <AppShell key="app" location={location} />}
        </AnimatePresence>
      </div>
    </>
  );
}

function AppShell({ location }: { location: Location }) {
  return (
    <motion.div className="min-h-screen" exit={{ opacity: 0, filter: 'blur(12px)', scale: 0.98, transition: { duration: 0.35 } }}>
      <Sidebar />
      <MobileNav />
      <div className="md:pl-[104px] px-3 md:pr-6 pt-4 pb-28 md:pb-10">
        <div className="mx-auto max-w-[1680px]">
          <Topbar />
          <main className="mt-6">
            <AnimatedRoutes location={location} />
          </main>
        </div>
      </div>
      <CommandPalette />
      <NewDealModal />
    </motion.div>
  );
}

/**
 * Transição entre telas. A direção vem da profundidade da rota:
 * /clientes → /clientes/:id desliza para a esquerda; voltar, para a direita; trocar de módulo desfoca.
 */
function AnimatedRoutes({ location }: { location: Location }) {
  const depth = location.pathname.split('/').filter(Boolean).length;
  const last = useRef({ path: location.pathname, depth, dir: 0 });
  if (last.current.path !== location.pathname) {
    last.current = { path: location.pathname, depth, dir: Math.sign(depth - last.current.depth) };
  }
  const dir = last.current.dir;

  return (
    <AnimatePresence mode="wait" custom={dir} onExitComplete={() => window.scrollTo({ top: 0 })}>
      <motion.div key={location.pathname} custom={dir} variants={page} initial="hidden" animate="show" exit="exit">
        <Routes location={location}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/funil" element={<Funil />} />
          <Route path="/agenda" element={<Agenda />} />
          <Route path="/clientes" element={<Cadastro config={clientesConfig} />} />
          <Route path="/clientes/:id" element={<ClienteDetalhe />} />
          <Route path="/filiais" element={<Cadastro config={filiaisConfig} />} />
          <Route path="/produtos" element={<Cadastro config={produtosConfig} />} />
          <Route path="/design-system" element={<DesignSystem />} />
          <Route path="/configuracoes" element={<Configuracoes />} />
          <Route path="*" element={<Dashboard />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}
