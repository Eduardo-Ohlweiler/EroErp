import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { useIsPresent } from 'motion/react';
import { useQuery } from '@tanstack/react-query';
import { Building2, LogOut, Moon, Sun, UserRound } from 'lucide-react';
import { useMessage } from '../../design-system/kit';
import {
  ChipContratante,
  CommandPalette,
  MenuUsuario,
  MobileNav,
  SeletorContratante,
  Sidebar,
  telasDoMenu,
  Topbar,
  type Comando,
  type SecaoMenu,
} from '../../design-system/shell';
import { AvisoContexto, Button } from '../../design-system/ui';
import { useAparencia } from '../../shared/aparencia/AparenciaProvider';
import { casca } from '../../motion/tokens';
import { FaixaDaCasca, RotaAnimada } from '../../motion/coreografia';
import { ErroApi } from '../../shared/api/erros';
import { selecaoApi } from '../../shared/api/selecao';
import type { UsuarioLogado } from '../../shared/api/tipos';
import {
  naVisaoDePlataforma,
  nomeDoContratante,
  rotaDoLogin,
  rotuloDoPapel,
  useSessao,
  UsuarioDaCascaProvider,
} from '../../shared/sessao';
import { cn } from '../../shared/util/utils';
import { menuAdministrativo, menuDeCadastros, menuDoUsuario, ROTULO_ADMINISTRATIVO, ROTULO_CADASTROS, tituloDaRota } from '../menu';

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

  // Só acompanha o usuário enquanto esta casca está presente: ao entrar ou sair de um contratante, a casca antiga
  // se desfaz com o nome, o menu e a faixa que tinha (a sessão já é a do contratante novo, que é da casca nova).
  const ultimo = useRef<UsuarioLogado | null>(null);
  if (estado.tipo === 'autenticado' && (presente || !ultimo.current)) ultimo.current = estado.usuario;

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
 * Busca (Ctrl K): fica desligada até haver 3 telas ou mais no menu (as seções somadas, com os filhos dos submenus); com uma só, ela não
 * leva a lugar nenhum. A seção do meio é Cadastros (Cadastros auxiliares, com submenu); a de baixo, o Administrativo (Usuários, Logs e, na plataforma, Contratantes).
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
  const cadastros = useMemo(() => menuDeCadastros(usuario), [usuario]);
  const administrativo = useMemo(() => menuAdministrativo(usuario), [usuario]);
  // Seções do menu, de cima para baixo (seção vazia não aparece). Item com `filhos` abre o submenu flutuante.
  const secoes = useMemo<SecaoMenu[]>(
    () => [
      { rotulo: 'Principal', itens: menu },
      { rotulo: ROTULO_CADASTROS, itens: cadastros },
      { rotulo: ROTULO_ADMINISTRATIVO, itens: administrativo },
    ],
    [menu, cadastros, administrativo],
  );
  // As telas com os filhos dos submenus achatados ("Cadastros auxiliares › Tipos de telefone"): Ctrl+K e contagem.
  const telas = useMemo(() => telasDoMenu(secoes), [secoes]);
  const totalNoMenu = telas.length;
  const contratante = nomeDoContratante(usuario);
  const papel = rotuloDoPapel(usuario.papel);
  const comBusca = totalNoMenu >= MINIMO_PARA_BUSCA;
  const comBarraInferior = totalNoMenu >= MINIMO_PARA_BARRA_INFERIOR;

  const fazerSair = () => {
    if (saindo.current) return;
    saindo.current = true;
    void sair();
  };

  const tema = useAlternarTema();
  const contexto = useTrocaDeContratante(usuario);
  const minhaConta = () => navegar('/minha-conta');

  const comandos: Comando[] = [
    ...telas.map((t) => ({
      grupo: t.secao === 'Principal' ? 'Telas' : t.secao,
      rotulo: t.rotulo,
      icone: t.item.icon,
      executar: () => navegar(t.item.to),
    })),
    { grupo: 'Ações', rotulo: 'Minha conta', dica: 'Meus dados, senha e sessões', icone: UserRound, executar: minhaConta },
    // Superadmin: na plataforma, abre o seletor do chip (busca e lista dos contratantes ativos);
    // dentro de um contratante, voltar à plataforma.
    ...(naVisaoDePlataforma(usuario)
      ? [{ grupo: 'Ações', rotulo: 'Acessar contratante…', icone: Building2, executar: () => contexto.setSeletorAberto(true) }]
      : []),
    ...(usuario.superadminAtuando
      ? [{ grupo: 'Ações', rotulo: 'Sair do contratante', dica: 'Voltar à plataforma', icone: LogOut, executar: contexto.sair }]
      : []),
    { grupo: 'Ações', rotulo: 'Alternar tema', dica: tema.rotulo, icone: tema.Icone, executar: tema.alternar },
  ];

  // Só o superadmin troca de contratante: para os outros o chip não é clicável.
  const chip =
    usuario.papel === 'SUPERADMIN' ? (
      <SeletorContratante
        opcoes={contexto.opcoes}
        carregando={contexto.carregando}
        erro={contexto.erro}
        atual={contexto.atual}
        onEscolher={(id) => void contexto.acessar(id)}
        onSair={() => void contexto.sair()}
        aberto={contexto.seletorAberto}
        onAbertoChange={contexto.setSeletorAberto}
        ocupado={contexto.trocando}
        nome={contratante}
        detalhe={papel}
      />
    ) : (
      <ChipContratante nome={contratante} detalhe={papel} />
    );

  return (
    <>
      <Sidebar secoes={secoes} onSair={fazerSair} />
      {comBarraInferior && <MobileNav secoes={secoes} />}
      {/*
       * Espaço embaixo do conteúdo para o fim da tela não ficar escondido atrás do que é fixo: a barra inferior do
       * celular e, com o superadmin dentro de um contratante, a faixa do suporte (bottom-24 no celular, onde ocupa
       * duas linhas; bottom-5 a partir de md).
       */}
      <div
        className={cn(
          'md:pl-[104px] px-3 md:pr-6 pt-4',
          usuario.superadminAtuando ? 'pb-52 md:pb-24' : comBarraInferior ? 'pb-28 md:pb-10' : 'pb-8 md:pb-10',
        )}
      >
        <div className="mx-auto max-w-[1680px]">
          <Topbar
            titulo={tituloDaRota(pathname)}
            contratante={chip}
            onBuscar={comBusca ? () => setBusca(true) : undefined}
            direita={
              <span className="flex items-center gap-1.5">
                <Button
                  size="icon"
                  className="size-11 rounded-2xl"
                  onClick={tema.alternar}
                  aria-label={tema.rotulo}
                  title={tema.rotulo}
                >
                  <tema.Icone className="size-[18px]" aria-hidden />
                </Button>
                <MenuUsuario
                  nome={usuario.nome}
                  email={usuario.email}
                  papel={papel}
                  contexto={contratante}
                  onMinhaConta={minhaConta}
                  onSair={fazerSair}
                />
              </span>
            }
          />
          <main className="mt-6">
            <RotaAnimada atrasoInicial={casca.atrasoConteudo} />
          </main>
        </div>
      </div>
      {comBusca && <CommandPalette aberto={busca} onAbertoChange={setBusca} comandos={comandos} />}
      {/*
       * Faixa do superadmin dentro de um contratante: entra depois da casca e sai antes dela (FaixaDaCasca, com o
       * AvisoContexto SEM `flutuante`). Não imprime.
       */}
      {usuario.superadminAtuando && (
        <FaixaDaCasca>
          <AvisoContexto
            tipo="superadmin"
            acao={{ rotulo: 'Sair do contratante', onClick: () => void contexto.sair(), carregando: contexto.trocando }}
          >
            Você está dentro de <strong>{contratante}</strong> como suporte da plataforma
          </AvisoContexto>
        </FaixaDaCasca>
      )}
    </>
  );
}

/**
 * Entrar e sair de um contratante (só o superadmin): a lista do seletor (`GET /api/tenants/selecao`, buscada só com
 * o seletor aberto), a troca pela sessão e a ida ao Início. A casca inteira troca em seguida (a raiz troca a área pela
 * chave `casca:${tenantId}`), então o "trocando" vale até ela sair.
 */
function useTrocaDeContratante(usuario: UsuarioLogado) {
  const { acessarContratante, sairDoContratante } = useSessao();
  const navegar = useNavigate();
  const mensagem = useMessage();
  const [seletorAberto, setSeletorAberto] = useState(false);
  const [trocando, setTrocando] = useState(false);
  const superadmin = usuario.papel === 'SUPERADMIN';

  const lista = useQuery({
    queryKey: ['tenants', 'selecao'],
    queryFn: selecaoApi.contratantes,
    enabled: superadmin && seletorAberto,
  });

  const trocar = async (fazer: () => Promise<void>) => {
    if (trocando) return;
    setTrocando(true);
    try {
      await fazer();
      navegar('/');
    } catch (e) {
      setTrocando(false);
      mensagem.erroApi(e);
    }
  };

  return {
    opcoes: lista.data ?? [],
    carregando: lista.isFetching,
    erro: lista.error ? (lista.error instanceof ErroApi ? lista.error.detail : 'Não foi possível carregar os contratantes.') : undefined,
    atual: usuario.superadminAtuando && usuario.tenantId ? { id: usuario.tenantId, nome: nomeDoContratante(usuario) } : null,
    trocando,
    seletorAberto,
    setSeletorAberto,
    acessar: (id: string) => trocar(() => acessarContratante(id)),
    sair: () => trocar(sairDoContratante),
  };
}

/**
 * Claro/escuro do próprio usuário (o resto da aparência é do contratante). Mostra e alterna o tema sem a prévia
 * (`temaBase`): na tela Aparência a prévia continua mostrando o tema do contratante, e a escolha vale ao sair dela.
 * A sessão muda na hora e a Raiz aplica o tema pela troca em vídeo do AparenciaProvider (modo leve e movimento
 * reduzido incluídos); a gravação vai em seguida e, se falhar, a sessão volta ao tema anterior.
 * Voltar a seguir o contratante (`null`) fica para a tela "Minha conta".
 */
function useAlternarTema() {
  const { temaBase } = useAparencia();
  const { trocarTemaPreferido } = useSessao();
  const mensagem = useMessage();
  const escuro = temaBase === 'dark';

  const alternar = useCallback(() => {
    trocarTemaPreferido(escuro ? 'CLARO' : 'ESCURO').catch((e: unknown) => mensagem.erroApi(e));
  }, [escuro, trocarTemaPreferido, mensagem]);

  return { alternar, rotulo: escuro ? 'Usar tema claro' : 'Usar tema escuro', Icone: escuro ? Moon : Sun };
}
