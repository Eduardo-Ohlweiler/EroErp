import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { useIsPresent } from 'motion/react';
import { ChipContratante, CommandPalette, MenuUsuario, MobileNav, Sidebar, Topbar, type Comando } from '../../design-system/shell';
import { casca } from '../../motion/tokens';
import { RotaAnimada } from '../../motion/coreografia';
import type { UsuarioLogado } from '../../shared/api/tipos';
import { nomeDoContratante, rotaDoLogin, rotuloDoPapel, useSessao, UsuarioDaCascaProvider } from '../../shared/sessao';
import { cn } from '../../shared/util/utils';
import { menuAdministrativo, menuDoUsuario, ROTULO_ADMINISTRATIVO, tituloDaRota } from '../menu';

/**
 * Casca protegida: só com sessão autenticada. Sem sessão → /login?voltar=<rota>; com a troca de senha
 * pendente → /login (etapa de troca).
 *
 * Quando a sessão acaba com a casca na tela (Sair, sessão expirada), ela continua com o último usuário
 * e navega para o login; a TrocaDeArea da raiz a desmonta em blocos (conteúdo, barra, menu).
 */
export function CascaProtegida() {
  const { estado } = useSessao();
  const { pathname, search, hash } = useLocation();
  const navegar = useNavigate();
  const presente = useIsPresent();

  const ultimo = useRef<UsuarioLogado | null>(null);
  if (estado.tipo === 'autenticado') ultimo.current = estado.usuario;

  const destino =
    estado.tipo === 'autenticado'
      ? null
      : estado.tipo === 'anonimo' && estado.motivo === 'saiu'
        ? '/login'
        : rotaDoLogin(`${pathname}${search}${hash}`);

  useEffect(() => {
    if (presente && destino && ultimo.current) navegar(destino, { replace: true });
  }, [presente, destino, navegar]);

  // Nunca teve sessão aqui (abriu a página sem estar logado): vai direto, não há o que desmontar.
  if (!ultimo.current) return <Navigate to={destino ?? '/login'} replace />;

  return (
    <UsuarioDaCascaProvider value={ultimo.current}>
      <Casca usuario={ultimo.current} />
    </UsuarioDaCascaProvider>
  );
}

/**
 * Menu lateral (barra inferior no celular) → barra superior → conteúdo (RotaAnimada).
 *
 * Busca (Ctrl K): fica desligada até haver 3 telas ou mais no menu (os dois grupos somados); com uma só, ela não
 * leva a lugar nenhum. O grupo de baixo é o Administrativo (só o superadmin na plataforma).
 * O Sair fica no menu lateral e no MenuUsuario (que também aparece no celular).
 * Barra inferior do celular: só com 2 telas ou mais, somando os dois grupos (com uma, ocupa espaço fixo à toa).
 */
const MINIMO_PARA_BUSCA = 3;
const MINIMO_PARA_BARRA_INFERIOR = 2;

function Casca({ usuario }: { usuario: UsuarioLogado }) {
  const { sair } = useSessao();
  const navegar = useNavigate();
  const { pathname } = useLocation();
  const [busca, setBusca] = useState(false);
  const saindo = useRef(false);

  const menu = useMemo(() => menuDoUsuario(usuario), [usuario]);
  const administrativo = useMemo(() => menuAdministrativo(usuario), [usuario]);
  const totalNoMenu = menu.length + administrativo.length;
  const contratante = nomeDoContratante(usuario);
  const papel = rotuloDoPapel(usuario.papel);
  const comBusca = totalNoMenu >= MINIMO_PARA_BUSCA;
  const comBarraInferior = totalNoMenu >= MINIMO_PARA_BARRA_INFERIOR;

  const fazerSair = () => {
    if (saindo.current) return;
    saindo.current = true;
    void sair();
  };

  const comandos: Comando[] = [
    ...menu.map((i) => ({ grupo: 'Telas', rotulo: i.label, icone: i.icon, executar: () => navegar(i.to) })),
    ...administrativo.map((i) => ({ grupo: ROTULO_ADMINISTRATIVO, rotulo: i.label, icone: i.icon, executar: () => navegar(i.to) })),
  ];

  return (
    <>
      <Sidebar itens={menu} itensSistema={administrativo} rotuloSistema={ROTULO_ADMINISTRATIVO} onSair={fazerSair} />
      {comBarraInferior && <MobileNav itens={menu} itensSistema={administrativo} rotuloSistema={ROTULO_ADMINISTRATIVO} />}
      <div className={cn('md:pl-[104px] px-3 md:pr-6 pt-4 md:pb-10', comBarraInferior ? 'pb-28' : 'pb-8')}>
        <div className="mx-auto max-w-[1680px]">
          <Topbar
            titulo={tituloDaRota(pathname)}
            contratante={<ChipContratante nome={contratante} detalhe={papel} />}
            onBuscar={comBusca ? () => setBusca(true) : undefined}
            direita={<MenuUsuario nome={usuario.nome} email={usuario.email} papel={papel} contexto={contratante} onSair={fazerSair} />}
          />
          <main className="mt-6">
            <RotaAnimada atrasoInicial={casca.atrasoConteudo} />
          </main>
        </div>
      </div>
      {comBusca && <CommandPalette aberto={busca} onAbertoChange={setBusca} comandos={comandos} />}
    </>
  );
}
