import { Building2, ScrollText, Users } from 'lucide-react';
import { Avatar, Badge, CardHeader, GlassCard, PageHeader } from '../../../design-system/ui';
import { Tela } from '../../../motion/coreografia';
import { nomeDoContratante, rotuloDoPapel, useUsuarioAtual } from '../../../shared/sessao';
import { useAgora } from '../../../shared/util/tempo';
import { fmtDataExtenso, primeiroNome, saudacao } from '../../../shared/util/utils';

const EM_BREVE = [
  { icone: Building2, titulo: 'Contratantes', texto: 'Cadastro das empresas que usam o CRM.' },
  { icone: Users, titulo: 'Usuários', texto: 'Quem acessa, com que papel e quais telas.' },
  { icone: ScrollText, titulo: 'Logs', texto: 'Entradas, alterações e eventos de segurança.' },
];

/** Início: saudação, contratante, data e o que vem nas próximas versões. */
export function InicioPage() {
  const usuario = useUsuarioAtual();
  const agora = useAgora(); // a saudação e a data acompanham o relógio (a tela pode ficar aberta o dia todo)
  const contratante = nomeDoContratante(usuario);

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
          <CardHeader title="Em breve" subtitle="As próximas telas deste painel" />
          <ul className="space-y-3">
            {EM_BREVE.map(({ icone: I, titulo, texto }) => (
              <li key={titulo} className="flex items-center gap-3">
                <span aria-hidden className="size-9 rounded-xl chip grid place-items-center shrink-0">
                  <I className="size-4 text-accent-text" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{titulo}</span>
                  <span className="block text-xs text-muted">{texto}</span>
                </span>
              </li>
            ))}
          </ul>
        </GlassCard>
      </div>
    </Tela>
  );
}
