import { useMemo } from 'react';
import { Link } from 'react-router';
import { ChevronRight, UserRound } from 'lucide-react';
import { menuAdministrativo, menuDoUsuario, type ItemDoMenu } from '../../../app/menu';
import { Avatar, Badge, CardHeader, GlassCard, PageHeader } from '../../../design-system/ui';
import { Tela } from '../../../motion/coreografia';
import { nomeDoContratante, rotuloDoPapel, useUsuarioAtual } from '../../../shared/sessao';
import { useAgora } from '../../../shared/util/tempo';
import { fmtDataExtenso, primeiroNome, saudacao } from '../../../shared/util/utils';

/** Minha conta entra sempre nos atalhos: é de todo usuário logado. */
const MINHA_CONTA: ItemDoMenu = {
  to: '/minha-conta',
  label: 'Minha conta',
  icon: UserRound,
  descricao: 'Seus dados, a sua senha e os navegadores conectados.',
};

/** Início: saudação, contratante, data e os atalhos para as telas liberadas (as mesmas do menu). */
export function InicioPage() {
  const usuario = useUsuarioAtual();
  const agora = useAgora(); // a saudação e a data acompanham o relógio (a tela pode ficar aberta o dia todo)
  const contratante = nomeDoContratante(usuario);
  const atalhos = useMemo(
    () => [...menuDoUsuario(usuario).filter((i) => i.to !== '/'), ...menuAdministrativo(usuario), MINHA_CONTA],
    [usuario],
  );

  return (
    <Tela coreografia="inicio">
      <PageHeader
        title={`${saudacao(agora)}, ${primeiroNome(usuario.nome)}`}
        subtitle={
          <>
            {contratante} · <span className="first-letter:uppercase inline-block">{fmtDataExtenso(agora)}</span>
          </>
        }
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <GlassCard className="lg:col-span-2">
          <CardHeader title="Sua conta" subtitle="Com quem e onde você está conectado" />
          <div className="flex items-center gap-4 min-w-0">
            <Avatar name={usuario.nome} size={56} />
            <div className="min-w-0">
              <p className="text-[15px] font-semibold truncate">{usuario.nome}</p>
              <p className="text-sm text-muted truncate">{usuario.email}</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <Badge tone="accent">{rotuloDoPapel(usuario.papel)}</Badge>
                <Badge>{contratante}</Badge>
              </div>
            </div>
          </div>
        </GlassCard>
        <GlassCard>
          <CardHeader title="Atalhos" subtitle="As telas que você pode abrir" />
          <ul className="-mx-2 space-y-1">
            {atalhos.map(({ to, label, icon: I, descricao }) => (
              <li key={to}>
                <Link
                  to={to}
                  className="flex items-center gap-3 rounded-xl px-2 py-2 transicao-cor hover:bg-[var(--chip)] focus-visible:bg-[var(--chip)]"
                >
                  <span aria-hidden className="size-9 rounded-xl chip grid place-items-center shrink-0">
                    <I className="size-4 text-accent-text" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{label}</span>
                    {descricao && <span className="block text-xs text-muted">{descricao}</span>}
                  </span>
                  <ChevronRight aria-hidden className="size-4 text-subtle shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        </GlassCard>
      </div>
    </Tela>
  );
}
