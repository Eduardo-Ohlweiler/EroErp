import { useCallback, useEffect, useRef } from 'react';
import { useLocation, useOutlet } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { EstadoErro, GlassCard, Splash } from '../design-system/ui';
import { PREFIXO_CASCA, TrocaDeArea, useCoreografiaDaArea } from '../motion/coreografia';
import { useAparencia } from '../shared/aparencia/AparenciaProvider';
import type { UsuarioLogado } from '../shared/api/tipos';
import { useSessao } from '../shared/sessao';
import { limparCacheAoTrocarDeArea } from './trocaDeContratante';

/**
 * Raiz do app: abre a sessão (Splash) e alterna as áreas inteiras, login ↔ casca, com a TrocaDeArea.
 * Modelo: comentário de motion/coreografia/TrocaDeArea.tsx e a DemoRaiz do catálogo.
 */
export function Raiz() {
  const { estado, tentarDeNovo } = useSessao();

  if (estado.tipo === 'carregando') return <Splash mensagem="Abrindo sua sessão…" />;
  if (estado.tipo === 'indisponivel') {
    return (
      <main className="min-h-screen grid place-items-center p-6">
        <GlassCard level="solid" bloco={false} className="max-w-md w-full">
          <EstadoErro
            titulo="Não foi possível abrir o CRM"
            descricao={estado.detail}
            codigo={estado.correlationId}
            onTentarDeNovo={tentarDeNovo}
          />
        </GlassCard>
      </main>
    );
  }
  return <Areas />;
}

/**
 * Login usa sempre a aparência padrão do sistema; a casca, a do contratante com o tema do usuário por cima.
 * Ordem: a área que sai se desmonta inteira com a aparência que tinha e só então (`aoSairCompleto`) entra a da
 * área nova. Dentro da mesma área, o tema do usuário muda na hora (botão claro/escuro da barra).
 */
function Areas() {
  const outlet = useOutlet();
  const { pathname } = useLocation();
  const { usuario } = useSessao();
  const { definirContratante, definirTemaDoUsuario } = useAparencia();
  const queryClient = useQueryClient();

  // A casca guarda o último usuário: ao sair ou expirar, a chave não muda até a rota ir para o login.
  const ultimo = useRef<UsuarioLogado | null>(usuario);
  if (usuario) ultimo.current = usuario;

  const noLogin = pathname === '/login' || pathname.startsWith('/login/');
  const chave = noLogin ? 'login' : `${PREFIXO_CASCA}${ultimo.current?.tenantId ?? 'plataforma'}`;
  const aparencia = noLogin ? null : (ultimo.current?.aparencia ?? null);
  const tema = noLogin ? null : (ultimo.current?.temaPreferido ?? null);
  const atual = useRef({ chave, aparencia, tema });
  atual.current = { chave, aparencia, tema };

  /** Chave da área cuja aparência está aplicada (muda só quando a área nova entra). */
  const aplicada = useRef<string | null>(null);
  const aplicarArea = useCallback(() => {
    // Entrou ou saiu de um contratante: a casca antiga terminou de sair e a nova ainda não montou. É a hora de
    // esquecer o cache do contratante anterior (o SessaoProvider não limpa antes, para a casca que sai não piscar).
    if (limparCacheAoTrocarDeArea(aplicada.current, atual.current.chave)) queryClient.clear();
    aplicada.current = atual.current.chave;
    definirContratante(atual.current.aparencia);
    definirTemaDoUsuario(atual.current.tema);
  }, [definirContratante, definirTemaDoUsuario, queryClient]);

  // Primeira montagem: não há área saindo, aplica direto. Ao desmontar (não acontece no app), volta ao padrão.
  useEffect(() => {
    aplicarArea();
    return () => {
      aplicada.current = null;
      definirContratante(null);
      definirTemaDoUsuario(null);
    };
  }, [aplicarArea, definirContratante, definirTemaDoUsuario]);

  // O usuário trocou o próprio tema com a área já na tela: aplica sem esperar troca de área.
  useEffect(() => {
    if (aplicada.current === chave) definirTemaDoUsuario(tema);
  }, [chave, tema, definirTemaDoUsuario]);

  /*
   * Superadmin entrando ou saindo de um contratante (casca → casca de outro tenant): coreografia `contexto`.
   * A casca inteira se desfaz com a aparência que tinha (faixa, conteúdo, barra, menu); em `aoSairCompleto` entra a
   * aparência do contratante novo: o fundo esmaece para o dele e, se o tema mudar, a troca de tema em vídeo roda
   * (AparenciaProvider → motion/cena/trocarTema: a cena muda primeiro e a interface troca quando a casca nova
   * terminou de montar). A casca nova monta depois da pausa curta do `contexto`.
   */
  const coreografia = useCoreografiaDaArea(chave);

  return (
    <TrocaDeArea chave={chave} coreografia={coreografia} aoSairCompleto={aplicarArea}>
      {outlet}
    </TrocaDeArea>
  );
}
