import { useEffect, useRef } from 'react';
import { useLocation, useOutlet } from 'react-router';
import { EstadoErro, GlassCard, Splash } from '../design-system/ui';
import { TrocaDeArea } from '../motion/coreografia';
import { useAparencia } from '../shared/aparencia/AparenciaProvider';
import type { UsuarioLogado } from '../shared/api/tipos';
import { useSessao } from '../shared/sessao';

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
 * Login usa sempre a aparência padrão do sistema; a casca, a do contratante. Ordem: a área que sai se desmonta
 * inteira com a aparência que tinha e só então (`aoSairCompleto`) entra a da área nova.
 */
function Areas() {
  const outlet = useOutlet();
  const { pathname } = useLocation();
  const { usuario } = useSessao();
  const { definirContratante } = useAparencia();

  // A casca guarda o último usuário: ao sair ou expirar, a chave não muda até a rota ir para o login.
  const ultimo = useRef<UsuarioLogado | null>(usuario);
  if (usuario) ultimo.current = usuario;

  const noLogin = pathname === '/login' || pathname.startsWith('/login/');
  const chave = noLogin ? 'login' : `casca:${ultimo.current?.tenantId ?? 'plataforma'}`;
  const aparencia = noLogin ? null : (ultimo.current?.aparencia ?? null);
  const atual = useRef(aparencia);
  atual.current = aparencia;

  // Primeira montagem: não há área saindo, aplica direto. Ao desmontar (não acontece no app), volta ao padrão.
  useEffect(() => {
    definirContratante(atual.current);
    return () => definirContratante(null);
  }, [definirContratante]);

  return (
    <TrocaDeArea chave={chave} aoSairCompleto={() => definirContratante(atual.current)}>
      {outlet}
    </TrocaDeArea>
  );
}
