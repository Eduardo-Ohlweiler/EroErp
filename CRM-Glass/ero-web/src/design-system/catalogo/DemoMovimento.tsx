import { createContext, useContext, useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate, useOutlet, useParams } from 'react-router';
import { ArrowLeft, ArrowRight, Building2, CalendarDays, Home, KeyRound, Mail, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { casca, coreografias, login, type NomeCoreografia } from '../../motion/tokens';
import { Bloco, RotaAnimada, Tela, TrocaDeArea, TrocaEtapa } from '../../motion/coreografia';
import { ParticleSphere } from '../../motion/cena/ParticleSphere';
import { CountUp } from '../../motion/CountUp';
import { useAparencia, type AparenciaApi } from '../../shared/aparencia/AparenciaProvider';
import {
  Avatar,
  Badge,
  BarraAcoes,
  Button,
  CampoForm,
  CardHeader,
  GlassCard,
  Input,
  InputSenha,
  OtpInput,
  PageHeader,
  Progress,
  Tabela,
  type ColunaTabela,
} from '../ui';
import { ChipContratante, MobileNav, Sidebar, Topbar, type ItemMenu } from '../shell';
import { MedidorFps } from './MedidorFps';

/*
 * Demonstração da montagem em blocos (só em desenvolvimento), com a mesma estrutura que o app real vai ter:
 *   Raiz (TrocaDeArea: login ↔ casca, casca de um contratante ↔ de outro) → Casca (Sidebar, Topbar, RotaAnimada) → telas.
 * Os dois contratantes de exemplo têm aparências diferentes (prévia), para ver a troca de tema em vídeo
 * e o esmaecimento do fundo no login → Início e na troca de contratante.
 */

const BASE = '/design-system/movimento';

type IdContratante = 'a' | 'b';
const CONTRATANTES: Record<IdContratante, { nome: string; aparencia: AparenciaApi }> = {
  a: {
    nome: 'Demo Solar',
    aparencia: {
      corDestaque: 'ambar',
      temaPadrao: 'CLARO',
      fundo: 'ESCRITORIO',
      fundoAnimado: true,
      vidroDesfoque: 14,
      fundoFoco: 3,
      animacoes: 'COMPLETAS',
    },
  },
  b: {
    nome: 'Demo Marina',
    aparencia: {
      corDestaque: 'azul',
      temaPadrao: 'ESCURO',
      fundo: 'CIDADE',
      fundoAnimado: true,
      vidroDesfoque: 12,
      fundoFoco: 2,
      animacoes: 'COMPLETAS',
    },
  },
};

const DemoCtx = createContext<{ contratante: IdContratante; trocar: () => void }>({ contratante: 'a', trocar: () => {} });

/* ---------------- Raiz: área login ↔ área casca ---------------- */
export function DemoRaiz() {
  const outlet = useOutlet();
  const { pathname } = useLocation();
  const nav = useNavigate();
  const { definirPrevia, limparPrevia } = useAparencia();
  const [contratante, setContratante] = useState<IdContratante>('a');
  const area = pathname.endsWith('/login') ? 'login' : `casca:${contratante}`;

  // Casca → casca de outro contratante = coreografia `contexto` (só quando a área muda).
  const ultima = useRef<{ area: string; coreografia?: NomeCoreografia }>({ area });
  if (ultima.current.area !== area) {
    ultima.current = { area, coreografia: ultima.current.area.startsWith('casca') && area.startsWith('casca') ? 'contexto' : undefined };
  }

  // Login usa o padrão do sistema; dentro, vale a aparência do contratante (aqui, como prévia).
  useEffect(() => {
    if (area === 'login') limparPrevia();
    else definirPrevia(CONTRATANTES[contratante].aparencia);
  }, [area, contratante, definirPrevia, limparPrevia]);
  useEffect(() => () => limparPrevia(), [limparPrevia]);

  const trocar = () => {
    setContratante((c) => (c === 'a' ? 'b' : 'a'));
    nav(`${BASE}/inicio`);
  };

  return (
    <>
      <TrocaDeArea chave={area} coreografia={ultima.current.coreografia}>
        <DemoCtx.Provider value={{ contratante, trocar }}>{outlet}</DemoCtx.Provider>
      </TrocaDeArea>
      <MedidorFps />
    </>
  );
}

/* ---------------- Login: esfera → vitrine → cartão; etapas trocam dentro do cartão ---------------- */
export function DemoLogin() {
  const nav = useNavigate();
  const [etapa, setEtapa] = useState<'credenciais' | 'codigo'>('credenciais');
  const [direcao, setDirecao] = useState(1);
  const [codigo, setCodigo] = useState('');
  const v = coreografias.login.variantes;

  const ir = (e: 'credenciais' | 'codigo', d: number) => {
    setDirecao(d);
    setEtapa(e);
  };
  const entrar = (ev: FormEvent) => {
    ev.preventDefault();
    if (etapa === 'credenciais') ir('codigo', 1);
    else nav(`${BASE}/inicio`);
  };

  return (
    <Tela coreografia="login" className="min-h-screen grid lg:grid-cols-[1.1fr_1fr] items-center">
      <div className="relative h-[46vh] lg:h-screen overflow-hidden">
        <Bloco className="absolute inset-0" variants={v.esfera}>
          <ParticleSphere />
        </Bloco>
        <Bloco orquestra variants={v.vitrine} className="absolute inset-x-0 bottom-8 lg:bottom-16 px-8 lg:px-16 pointer-events-none">
          <Bloco className="flex items-center gap-2.5 mb-5">
            <span className="size-9 rounded-xl accent-gradient accent-glow grid place-items-center">
              <Sparkles className="size-4" />
            </span>
            <span className="font-semibold tracking-tight">CRM Glass</span>
          </Bloco>
          <Bloco as="h1" variants={v.titulo} className="text-3xl lg:text-[46px] font-semibold tracking-tight leading-[1.08] max-w-xl text-gradient-accent">
            Telas que se montam em blocos.
          </Bloco>
          <Bloco className="mt-6 flex flex-wrap gap-2">
            {[
              { icon: Users, t: 'Multi-contratante' },
              { icon: CalendarDays, t: 'Agenda integrada' },
              { icon: ShieldCheck, t: 'Verificação em duas etapas' },
            ].map(({ icon: I, t }) => (
              <span key={t} className="glass-subtle h-9 px-3.5 rounded-full inline-flex items-center gap-2 text-xs font-medium">
                <I className="size-3.5 text-accent-text" />
                {t}
              </span>
            ))}
          </Bloco>
        </Bloco>
      </div>

      <div className="px-5 py-10 lg:py-0 flex justify-center">
        <GlassCard variants={v.cartao} padded={false} className="w-full max-w-[440px] rounded-[30px] p-8 overflow-hidden">
          <Bloco>
            <h2 className="text-2xl font-semibold tracking-tight">Bem-vindo de volta</h2>
            <p className="text-sm text-muted mt-1 mb-7">Demonstração: Entrar → código → Início.</p>
          </Bloco>
          <form onSubmit={entrar}>
            <TrocaEtapa etapa={etapa} direcao={direcao} atrasoInicial={login.atrasoCampos} className="space-y-4">
              {etapa === 'credenciais' ? (
                <>
                  <CampoForm rotulo="E-mail">
                    <Input icon={Mail} type="email" placeholder="voce@empresa.com.br" autoComplete="username" defaultValue="ana@demo.com.br" />
                  </CampoForm>
                  <CampoForm rotulo="Senha" dica="Esqueceu? Fale com o administrador.">
                    <InputSenha autoComplete="current-password" defaultValue="demonstracao" />
                  </CampoForm>
                  <BarraAcoes className="pt-2">
                    <Button type="submit" variant="primary" size="lg" className="w-full justify-center">
                      Entrar <ArrowRight className="size-4" />
                    </Button>
                  </BarraAcoes>
                </>
              ) : (
                <>
                  <CampoForm rotulo="Código do aplicativo" grupo dica="Qualquer código serve na demonstração.">
                    {(ids) => <OtpInput valor={codigo} onChange={setCodigo} autoFocus {...ids} />}
                  </CampoForm>
                  <BarraAcoes alinhar="entre" className="pt-2">
                    <Button type="button" variant="ghost" onClick={() => ir('credenciais', -1)}>
                      <ArrowLeft className="size-4" /> Voltar
                    </Button>
                    <Button type="submit" variant="primary">
                      <KeyRound className="size-4" /> Verificar
                    </Button>
                  </BarraAcoes>
                </>
              )}
            </TrocaEtapa>
          </form>
          <Bloco className="mt-6 text-center text-xs text-muted">
            <Link to="/design-system" className="underline underline-offset-4">
              Voltar ao catálogo
            </Link>
          </Bloco>
        </GlassCard>
      </div>
    </Tela>
  );
}

/* ---------------- Casca: menu → barra → conteúdo ---------------- */
const MENU: ItemMenu[] = [
  { to: `${BASE}/inicio`, label: 'Início', icon: Home },
  { to: `${BASE}/usuarios`, label: 'Usuários', icon: Users },
];
const TITULOS: [RegExp, string][] = [
  [/\/usuarios\/[^/]+$/, 'Ficha do usuário'],
  [/\/usuarios$/, 'Usuários'],
  [/\/inicio$/, 'Início'],
];

export function DemoCasca() {
  const { pathname } = useLocation();
  const nav = useNavigate();
  const { contratante, trocar } = useContext(DemoCtx);
  const titulo = TITULOS.find(([r]) => r.test(pathname))?.[1] ?? 'Início';
  const outro = CONTRATANTES[contratante === 'a' ? 'b' : 'a'].nome;

  return (
    <>
      <Sidebar itens={MENU} onSair={() => nav(`${BASE}/login`)} />
      <MobileNav itens={MENU} />
      <div className="md:pl-[104px] px-3 md:pr-6 pt-4 pb-28 md:pb-10">
        <div className="mx-auto max-w-[1680px]">
          <Topbar
            titulo={titulo}
            contratante={<ChipContratante nome={CONTRATANTES[contratante].nome} detalhe="Superadmin" />}
            onBuscar={() => {}}
            direita={
              <Button onClick={trocar} className="h-11">
                <Building2 className="size-4" /> Entrar em {outro}
              </Button>
            }
          />
          <main className="mt-6">
            <RotaAnimada atrasoInicial={casca.atrasoConteudo} />
          </main>
        </div>
      </div>
    </>
  );
}

/* ---------------- Telas de exemplo ---------------- */
const KPIS = [
  { rotulo: 'Usuários ativos', valor: 128, meta: 72 },
  { rotulo: 'Eventos nas últimas 24 h', valor: 2364, meta: 54 },
  { rotulo: 'Falhas de login 24 h', valor: 7, meta: 12 },
  { rotulo: 'Sessões abertas', valor: 41, meta: 38 },
];
const ATIVIDADE = [
  { quem: 'Ana Ribeiro', o: 'entrou com verificação em duas etapas', quando: 'há 2 min' },
  { quem: 'Bruno Carvalho', o: 'foi bloqueado após 5 senhas erradas', quando: 'há 14 min' },
  { quem: 'Carla Menezes', o: 'recebeu acesso a Usuários', quando: 'há 1 h' },
  { quem: 'Diego Fontana', o: 'encerrou as outras sessões', quando: 'há 3 h' },
];

export function DemoInicio() {
  const { contratante } = useContext(DemoCtx);
  const nav = useNavigate();
  return (
    <Tela coreografia="inicio">
      <PageHeader title="Bom dia, Ana" subtitle={`${CONTRATANTES[contratante].nome} · painel administrativo`} />
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {KPIS.map((k) => (
          <GlassCard key={k.rotulo} hover>
            <p className="text-xs text-muted">{k.rotulo}</p>
            <CountUp value={k.valor} format={(n) => Math.round(n).toLocaleString('pt-BR')} className="block text-3xl font-semibold tracking-tight mt-2" />
            <Progress value={k.meta} className="mt-4" />
          </GlassCard>
        ))}
      </div>
      <div className="grid lg:grid-cols-3 gap-4 mt-4">
        <GlassCard className="lg:col-span-2">
          <CardHeader title="Atividade recente" subtitle="Últimos eventos de segurança" />
          <ul className="space-y-3">
            {ATIVIDADE.map((a) => (
              <li key={a.quem} className="flex items-center gap-3 text-sm">
                <Avatar name={a.quem} size={32} />
                <span className="min-w-0 flex-1 truncate">
                  <strong className="font-semibold">{a.quem}</strong> <span className="text-muted">{a.o}</span>
                </span>
                <span className="text-xs text-subtle shrink-0">{a.quando}</span>
              </li>
            ))}
          </ul>
        </GlassCard>
        <GlassCard>
          <CardHeader title="Atalhos" subtitle="Telas liberadas" />
          <div className="grid gap-2">
            <Button onClick={() => nav(`${BASE}/usuarios`)} className="justify-between">
              Usuários <ArrowRight className="size-4" />
            </Button>
            <Button onClick={() => nav(`${BASE}/usuarios/1`)} className="justify-between">
              Ficha de Ana <ArrowRight className="size-4" />
            </Button>
          </div>
        </GlassCard>
      </div>
    </Tela>
  );
}

type Usuario = { id: string; nome: string; email: string; papel: string };
const USUARIOS: Usuario[] = [
  { id: '1', nome: 'Ana Ribeiro', email: 'ana@demo.com.br', papel: 'Administrador' },
  { id: '2', nome: 'Bruno Carvalho', email: 'bruno@demo.com.br', papel: 'Usuário' },
  { id: '3', nome: 'Carla Menezes', email: 'carla@demo.com.br', papel: 'Usuário' },
  { id: '4', nome: 'Diego Fontana', email: 'diego@demo.com.br', papel: 'Usuário' },
  { id: '5', nome: 'Elisa Prado', email: 'elisa@demo.com.br', papel: 'Administrador' },
];
const COLUNAS: ColunaTabela<Usuario>[] = [
  {
    chave: 'nome',
    titulo: 'Nome',
    celula: (u) => (
      <span className="flex items-center gap-2.5 font-medium">
        <Avatar name={u.nome} size={28} />
        {u.nome}
      </span>
    ),
  },
  { chave: 'email', titulo: 'E-mail', esconderNoCelular: true, celula: (u) => <span className="text-muted">{u.email}</span> },
  { chave: 'papel', titulo: 'Papel', celula: (u) => <Badge tone={u.papel === 'Administrador' ? 'accent' : 'neutral'}>{u.papel}</Badge> },
];

export function DemoLista() {
  const nav = useNavigate();
  return (
    <Tela coreografia="padrao">
      <PageHeader title="Usuários" subtitle="Clique numa linha: a ficha entra da direita (mais fundo)" />
      <Tabela
        rotulo="Usuários"
        colunas={COLUNAS}
        linhas={USUARIOS}
        chaveLinha={(u) => u.id}
        onLinhaClick={(u) => nav(`${BASE}/usuarios/${u.id}`)}
        rotuloLinha={(u) => `Abrir ficha de ${u.nome}`}
      />
    </Tela>
  );
}

export function DemoDetalhe() {
  const { id } = useParams();
  const nav = useNavigate();
  const u = USUARIOS.find((x) => x.id === id) ?? USUARIOS[0];
  return (
    <Tela coreografia="formulario">
      <PageHeader
        title={u.nome}
        subtitle="Formulário: cascata curta, saída de uma vez; voltar desliza para a direita"
        actions={
          <Button onClick={() => nav(`${BASE}/usuarios`)}>
            <ArrowLeft className="size-4" /> Voltar
          </Button>
        }
      />
      <GlassCard level="solid">
        <div className="grid md:grid-cols-2 gap-4">
          <CampoForm rotulo="Nome" bloco={false}>
            <Input defaultValue={u.nome} />
          </CampoForm>
          <CampoForm rotulo="E-mail" bloco={false}>
            <Input type="email" defaultValue={u.email} />
          </CampoForm>
        </div>
      </GlassCard>
      <BarraAcoes className="mt-4">
        <Button onClick={() => nav(`${BASE}/usuarios`)}>Cancelar</Button>
        <Button variant="primary">Salvar</Button>
      </BarraAcoes>
    </Tela>
  );
}
