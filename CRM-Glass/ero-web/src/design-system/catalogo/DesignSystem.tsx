import { useMemo, useRef, useState, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router';
import { Building2, Home, KeyRound, Mail, Palette, Plus, ScrollText, Search, Trash2, UserRound, Users } from 'lucide-react';
import { staggerGroup } from '../../motion/tokens';
import { CountUp } from '../../motion/CountUp';
import { useAparencia } from '../../shared/aparencia/AparenciaProvider';
import { APARENCIA_PADRAO, DESTAQUES, paraApi, type AparenciaApi, type FundoCatalogo } from '../../shared/aparencia/mapear';
import {
  Alerta,
  Avatar,
  AvatarStack,
  Badge,
  BarraAcoes,
  Button,
  CampoForm,
  CardHeader,
  Combobox,
  ConfirmDialog,
  ConteudoAba,
  Delta,
  Dialogo,
  Gaveta,
  EditorAparencia,
  EstadoErro,
  EstadoVazio,
  Etapas,
  GlassCard,
  Input,
  InputSenha,
  OtpInput,
  PageHeader,
  Paginacao,
  Progress,
  QrCode,
  Segmented,
  Skeleton,
  SkeletonTexto,
  Slider,
  Splash,
  Tabela,
  Tabs,
  Toggle,
  AvisoContexto,
  useToast,
  type ColunaTabela,
} from '../ui';
import { ChipContratante, CommandPalette, MenuUsuario, MobileNav, Sidebar, Topbar, type Comando, type ItemMenu } from '../shell';
import { MedidorFps } from './MedidorFps';
import { SecaoMovimento } from './SecaoMovimento';

/* ---------------- Dados fictícios só para o catálogo ---------------- */
type UsuarioDemo = { id: string; nome: string; email: string; papel: 'ADMIN' | 'USUARIO'; situacao: 'ATIVO' | 'INATIVO' | 'BLOQUEADO'; acesso: string };
const USUARIOS: UsuarioDemo[] = [
  { id: '1', nome: 'Ana Ribeiro', email: 'ana@demo.com.br', papel: 'ADMIN', situacao: 'ATIVO', acesso: 'há 5 min' },
  { id: '2', nome: 'Bruno Carvalho', email: 'bruno@demo.com.br', papel: 'USUARIO', situacao: 'BLOQUEADO', acesso: 'há 2 h' },
  { id: '3', nome: 'Carla Menezes', email: 'carla@demo.com.br', papel: 'USUARIO', situacao: 'ATIVO', acesso: 'ontem' },
  { id: '4', nome: 'Diego Fontana', email: 'diego@demo.com.br', papel: 'USUARIO', situacao: 'INATIVO', acesso: 'há 3 meses' },
  { id: '5', nome: 'Elisa Prado', email: 'elisa@demo.com.br', papel: 'ADMIN', situacao: 'ATIVO', acesso: 'há 1 dia' },
];
const FUNDOS_DEMO: FundoCatalogo[] = [
  { codigo: 'ORBS', rotulo: 'Orbs', tipo: 'VIVO', exclusiva: false },
  { codigo: 'AURORA', rotulo: 'Aurora', tipo: 'VIVO', exclusiva: false },
  { codigo: 'ONDAS', rotulo: 'Ondas', tipo: 'VIVO', exclusiva: false },
  { codigo: 'MINIMO', rotulo: 'Mínimo', tipo: 'VIVO', exclusiva: false },
  { codigo: 'ESCRITORIO', rotulo: 'Escritório', tipo: 'CENA', exclusiva: false },
  { codigo: 'CIDADE', rotulo: 'Cidade', tipo: 'CENA', exclusiva: false },
  { codigo: 'MARINA', rotulo: 'Marina', tipo: 'CENA', exclusiva: true },
  { codigo: 'EXPEDIENTE', rotulo: 'Expediente', tipo: 'CENA', exclusiva: false },
  { codigo: 'COWORKING', rotulo: 'Coworking', tipo: 'CENA', exclusiva: false },
];
const MENU: ItemMenu[] = [
  { to: '/design-system', label: 'Início', icon: Home },
  { to: '/design-system/usuarios', label: 'Usuários', icon: Users },
  { to: '/design-system/contratantes', label: 'Contratantes', icon: Building2 },
  { to: '/design-system/logs', label: 'Logs', icon: ScrollText },
];
const CORES = ['accent', 'accent-2', 'accent-3', 'success', 'warning', 'danger', 'info', 'fg'];

function Secao({ titulo, subtitulo, children, className = 'col-span-12 lg:col-span-6' }: { titulo: string; subtitulo?: string; children: ReactNode; className?: string }) {
  return (
    <GlassCard className={className}>
      <CardHeader title={titulo} subtitle={subtitulo} />
      {children}
    </GlassCard>
  );
}

/** Catálogo vivo do design system (só em desenvolvimento): cada componente com variações e estados. */
export default function DesignSystem() {
  const toast = useToast();
  const nav = useNavigate();
  const { alvo, set, definirPrevia, limparPrevia, emPrevia } = useAparencia();

  const [seg, setSeg] = useState<'ativos' | 'inativos' | 'todos'>('ativos');
  const [ligado, setLigado] = useState(true);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [vidro, setVidro] = useState(12);
  const [foco, setFoco] = useState(3);
  const [etapa, setEtapa] = useState(1);
  const [aba, setAba] = useState('senha');
  const [estadoTabela, setEstadoTabela] = useState<'dados' | 'carregando' | 'vazio' | 'erro'>('dados');
  const [pagina, setPagina] = useState(0);
  const [usuario, setUsuario] = useState<string | null>(null);
  const [dialogo, setDialogo] = useState(false);
  const [gaveta, setGaveta] = useState(false);
  const [confirmar, setConfirmar] = useState<null | 'normal' | 'perigo'>(null);
  const [splash, setSplash] = useState(false);
  const [aviso, setAviso] = useState(true);
  const [avisoFlutuante, setAvisoFlutuante] = useState(false);
  const [casca, setCasca] = useState(false);
  const [busca, setBusca] = useState(false);
  const [editor, setEditor] = useState<AparenciaApi>(() => paraApi(alvo));
  const [previaAoVivo, setPreviaAoVivo] = useState(false);
  const [replay, setReplay] = useState(0);
  const chipRef = useRef<HTMLButtonElement>(null);

  const colunas: ColunaTabela<UsuarioDemo>[] = [
    {
      chave: 'nome',
      titulo: 'Nome',
      esqueleto: 'w-40',
      celula: (u) => (
        <span className="flex items-center gap-2.5 font-medium">
          <Avatar name={u.nome} size={28} />
          {u.nome}
        </span>
      ),
    },
    { chave: 'email', titulo: 'E-mail', esconderNoCelular: true, celula: (u) => <span className="text-muted">{u.email}</span> },
    { chave: 'papel', titulo: 'Papel', celula: (u) => <Badge tone={u.papel === 'ADMIN' ? 'accent' : 'neutral'}>{u.papel === 'ADMIN' ? 'Administrador' : 'Usuário'}</Badge> },
    {
      chave: 'situacao',
      titulo: 'Situação',
      celula: (u) =>
        u.situacao === 'ATIVO' ? (
          <Badge tone="success" dot>
            Ativo
          </Badge>
        ) : u.situacao === 'BLOQUEADO' ? (
          <Badge tone="warning" dot>
            Bloqueado até 14:32
          </Badge>
        ) : (
          <Badge dot>Inativo</Badge>
        ),
    },
    { chave: 'acesso', titulo: 'Último acesso', alinhar: 'direita', esconderNoCelular: true, celula: (u) => <span className="text-muted tabular-nums">{u.acesso}</span> },
  ];

  const comandos = useMemo<Comando[]>(
    () => [
      ...MENU.map((m) => ({ grupo: 'Telas', rotulo: m.label, icone: m.icon, executar: () => toast({ title: `Abrir ${m.label}`, tone: 'info' }) })),
      { grupo: 'Conta', rotulo: 'Minha conta', icone: UserRound, executar: () => toast({ title: 'Minha conta', tone: 'info' }) },
    ],
    [toast],
  );

  const mudarEditor = (v: AparenciaApi) => {
    setEditor(v);
    if (previaAoVivo) definirPrevia(v);
  };

  return (
    <>
      {/* O fundo (vivo ou de cena) é o LiveBackground montado na raiz (main.tsx). */}
      <MedidorFps />

      {casca && (
        <>
          <Sidebar itens={MENU} itensSistema={[{ to: '/design-system/conta', label: 'Minha conta', icon: UserRound }]} onSair={() => toast({ title: 'Sair', tone: 'info' })} />
          <MobileNav itens={MENU} />
        </>
      )}
      <CommandPalette aberto={busca} onAbertoChange={setBusca} comandos={comandos} />
      {splash && <Splash mensagem="Verificando sua sessão…" />}
      <AvisoContexto
        visivel={aviso && avisoFlutuante}
        flutuante
        tipo="superadmin"
        acao={{ rotulo: 'Sair do contratante', onClick: () => setAviso(false) }}
      >
        Você está dentro de <strong>Demo Solar</strong> como superadmin
      </AvisoContexto>

      <motion.div
        initial="hidden"
        animate="show"
        variants={staggerGroup}
        className={casca ? 'relative z-10 md:pl-[104px] px-3 md:pr-6 pt-4 pb-28 md:pb-10' : 'relative z-10 px-3 md:px-8 pt-6 pb-16'}
      >
        <div className="mx-auto max-w-[1680px]">
          <PageHeader
            title="Design system"
            subtitle="Tokens e componentes do ero-web — teste nos dois temas e com mais de um destaque"
            actions={
              <>
                <Segmented
                  size="sm"
                  options={[
                    { value: 'dark', label: 'Escuro' },
                    { value: 'light', label: 'Claro' },
                  ]}
                  value={alvo.theme}
                  onChange={(v) => set({ theme: v })}
                />
                <Segmented size="sm" options={DESTAQUES.map((d) => ({ value: d.id, label: d.nome }))} value={alvo.accent} onChange={(v) => set({ accent: v })} />
                <Segmented
                  size="sm"
                  options={[
                    { value: 'completa', label: 'Animações completas' },
                    { value: 'reduzida', label: 'Reduzidas' },
                  ]}
                  value={alvo.movimento}
                  onChange={(v) => set({ movimento: v })}
                />
                {emPrevia && (
                  <Button size="sm" variant="ghost" onClick={limparPrevia}>
                    Voltar ao padrão
                  </Button>
                )}
              </>
            }
          />

          <div className="grid grid-cols-12 gap-4">
            {/* ---------- Movimento (motion-designer) ---------- */}
            <SecaoMovimento />

            {/* ---------- Fundamentos ---------- */}
            <Secao titulo="Níveis de vidro" subtitulo="glass-subtle, glass e glass-solid (tabelas, formulários, modais, menus)" className="col-span-12">
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { c: 'glass-subtle', d: 'Painéis grandes e fundos de seção.' },
                  { c: 'glass', d: 'Cartões, KPIs e gráficos. O padrão.' },
                  { c: 'glass-solid', d: 'Tabelas, formulários, modais e menus.' },
                ].map((g) => (
                  <div key={g.c} className="relative rounded-[22px] overflow-hidden p-5 min-h-[150px]">
                    <div className="absolute inset-0" style={{ background: 'var(--bg)' }} />
                    <div className="absolute -left-6 top-4 size-28 rounded-full blur-2xl accent-gradient opacity-80" />
                    <div className="absolute right-4 -bottom-6 size-24 rounded-full blur-2xl opacity-70" style={{ background: 'var(--accent-3)' }} />
                    <div className={`${g.c} relative p-4 rounded-2xl mt-4`}>
                      <div className="text-sm font-semibold font-mono">.{g.c}</div>
                      <div className="text-xs text-muted mt-1">{g.d}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Secao>

            <Secao titulo="Cores" subtitulo="Só tokens: troque o destaque acima e tudo muda" className="col-span-12 lg:col-span-5">
              <div className="grid grid-cols-4 gap-3">
                {CORES.map((c) => (
                  <div key={c}>
                    <div className="h-12 rounded-2xl border border-line" style={{ background: `var(--${c})` }} />
                    <div className="text-[11px] font-mono text-muted mt-1.5">{c}</div>
                  </div>
                ))}
              </div>
            </Secao>

            <Secao titulo="Tipografia e números" subtitulo="Plus Jakarta Sans · números tabulares" className="col-span-12 lg:col-span-7">
              <div className="space-y-2">
                <div className="text-[34px] font-semibold tracking-tight leading-none">
                  <CountUp key={replay} value={1284} format={(v) => Math.round(v).toLocaleString('pt-BR')} />
                </div>
                <div className="text-[26px] font-semibold tracking-tight">Título de página · 26–30px</div>
                <div className="text-[15px] font-semibold">Título de cartão · 15px</div>
                <div className="text-sm text-muted">Texto de apoio · 14px, muted</div>
                <div className="text-xs text-subtle">Legenda · 12px, subtle</div>
                <Button size="sm" onClick={() => setReplay((r) => r + 1)}>
                  Contar de novo
                </Button>
              </div>
            </Secao>

            {/* ---------- Ações ---------- */}
            <Secao titulo="Botões" subtitulo="primary, glass, ghost, danger · tamanhos · desabilitado">
              <div className="flex flex-wrap gap-2 items-center">
                <Button variant="primary">
                  <Plus className="size-4" /> Novo usuário
                </Button>
                <Button>Cancelar</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="danger">
                  <Trash2 className="size-4" /> Inativar
                </Button>
                <Button variant="primary" disabled>
                  Desabilitado
                </Button>
                <Button size="icon" aria-label="Buscar">
                  <Search className="size-4" />
                </Button>
                <Button size="sm">Pequeno</Button>
                <Button size="lg" variant="primary">
                  Grande
                </Button>
              </div>
            </Secao>

            <Secao titulo="Etiquetas, avatar, segmentado, interruptor" subtitulo="Badge · Delta · Avatar · Segmented · Toggle · Progress">
              <div className="flex flex-wrap gap-2">
                <Badge>Neutro</Badge>
                <Badge tone="accent">Administrador</Badge>
                <Badge tone="success" dot>
                  Ativo
                </Badge>
                <Badge tone="warning" dot>
                  Bloqueado
                </Badge>
                <Badge tone="danger">Falha de login</Badge>
                <Badge tone="info">Info</Badge>
                <Delta value={12.4} />
                <Delta value={-3.1} />
              </div>
              <div className="flex flex-wrap items-center gap-4 mt-4">
                <AvatarStack names={USUARIOS.map((u) => u.nome)} max={4} />
                <Segmented
                  options={[
                    { value: 'ativos', label: 'Ativos' },
                    { value: 'inativos', label: 'Inativos' },
                    { value: 'todos', label: 'Todos' },
                  ]}
                  value={seg}
                  onChange={setSeg}
                />
                <Toggle checked={ligado} onChange={setLigado} label="Exigir 2FA" />
              </div>
              <Progress value={64} className="mt-4" />
            </Secao>

            {/* ---------- Formulários ---------- */}
            <Secao titulo="Campos (CampoForm)" subtitulo="rótulo ligado ao controle · dica · erro · obrigatório">
              <div className="grid sm:grid-cols-2 gap-4">
                <CampoForm rotulo="E-mail" obrigatorio dica="Usado para entrar">
                  <Input icon={Mail} type="email" autoComplete="username" placeholder="voce@empresa.com.br" value={email} onChange={(e) => setEmail(e.target.value)} />
                </CampoForm>
                <CampoForm rotulo="E-mail (com erro)" erro="Informe um e-mail válido.">
                  <Input icon={Mail} defaultValue="ana@" />
                </CampoForm>
                <CampoForm rotulo="Senha" dica="12 ou mais caracteres, sem seu nome ou e-mail">
                  <InputSenha autoComplete="new-password" placeholder="Nova senha" />
                </CampoForm>
                <CampoForm rotulo="Senha (desabilitada)">
                  <InputSenha disabled defaultValue="segredo-123" />
                </CampoForm>
                <CampoForm rotulo="Usuário" className="sm:col-span-2" dica="Combobox: digite para filtrar, setas e Enter">
                  {(ids) => (
                    <Combobox
                      {...ids}
                      icone={UserRound}
                      placeholder="Todos os usuários"
                      opcoes={USUARIOS.map((u) => ({ valor: u.id, rotulo: u.nome, detalhe: u.email }))}
                      valor={usuario}
                      onChange={setUsuario}
                    />
                  )}
                </CampoForm>
              </div>
              <BarraAcoes className="mt-5">
                <Button>Cancelar</Button>
                <Button variant="primary">Salvar</Button>
              </BarraAcoes>
            </Secao>

            <Secao titulo="Código de verificação (OtpInput)" subtitulo="6 dígitos · aceita colar · one-time-code">
              <div className="space-y-5">
                <CampoForm rotulo="Código do app autenticador" grupo dica={otp.length === 6 ? `Completo: ${otp}` : 'Digite ou cole o código'}>
                  {(ids) => <OtpInput {...ids} semGrupo valor={otp} onChange={setOtp} onCompleto={(v) => toast({ title: `Código ${v} completo`, tone: 'success' })} />}
                </CampoForm>
                <CampoForm rotulo="Código inválido" grupo erro="Código incorreto. Tente de novo.">
                  {(ids) => <OtpInput {...ids} semGrupo valor="123" onChange={() => {}} />}
                </CampoForm>
              </div>
            </Secao>

            <Secao titulo="Slider" subtitulo="Radix · setas, Page Up/Down, Home/End">
              <div className="space-y-6">
                <div>
                  <div id="ds-vidro" className="text-xs font-medium text-muted mb-2">
                    Intensidade do vidro: {vidro}px
                  </div>
                  <Slider aria-labelledby="ds-vidro" valor={vidro} onValor={setVidro} min={0} max={40} formatar={(v) => `${v} pixels`} legendas={['Mais nítido', 'Mais fosco']} />
                </div>
                <div>
                  <div id="ds-foco" className="text-xs font-medium text-muted mb-2">
                    Foco do fundo: {String(foco).replace('.', ',')}px (passo 0,5)
                  </div>
                  <Slider aria-labelledby="ds-foco" valor={foco} onValor={setFoco} min={0} max={10} passo={0.5} legendas={['Nítido', 'Desfocado']} />
                </div>
                <Slider rotulo="Desabilitado" valor={20} onValor={() => {}} max={40} desabilitado />
              </div>
            </Secao>

            <Secao titulo="QR code" subtitulo="Gerado no navegador · placa clara nos dois temas">
              <div className="flex flex-wrap items-center gap-6">
                <QrCode valor="otpauth://totp/CRM%20Glass:ana@demo.com.br?secret=JBSWY3DPEHPK3PXP&issuer=CRM%20Glass" rotulo="QR code para configurar o app autenticador" />
                <QrCode valor="https://exemplo.com.br" tamanho={112} rotulo="QR code pequeno" />
              </div>
            </Secao>

            <Secao titulo="Etapas" subtitulo="Indicador desliza entre as etapas (layoutId) · volta clicando numa concluída">
              <Etapas
                etapas={[
                  { rotulo: 'Dados', descricao: 'Nome e documento' },
                  { rotulo: 'Administrador', descricao: 'Primeiro acesso' },
                  { rotulo: 'Aparência', descricao: 'Opcional' },
                ]}
                atual={etapa}
                onIr={setEtapa}
              />
              <BarraAcoes className="mt-5" alinhar="entre">
                <Button onClick={() => setEtapa((e) => Math.max(0, e - 1))} disabled={etapa === 0}>
                  Voltar
                </Button>
                <Button variant="primary" onClick={() => setEtapa((e) => Math.min(2, e + 1))} disabled={etapa === 2}>
                  Avançar
                </Button>
              </BarraAcoes>
            </Secao>

            <Secao titulo="Abas (Tabs)" subtitulo="Radix · setas entre abas · pílula deslizante">
              <Tabs
                rotulo="Minha conta"
                valor={aba}
                onValorChange={setAba}
                abas={[
                  { valor: 'senha', rotulo: 'Senha', icone: KeyRound },
                  { valor: '2fa', rotulo: 'Verificação em duas etapas' },
                  { valor: 'sessoes', rotulo: 'Sessões' },
                  { valor: 'off', rotulo: 'Desabilitada', desabilitada: true },
                ]}
              >
                <ConteudoAba valor="senha">
                  <p className="text-sm text-muted">Conteúdo da aba Senha.</p>
                </ConteudoAba>
                <ConteudoAba valor="2fa">
                  <p className="text-sm text-muted">Conteúdo da aba Verificação em duas etapas.</p>
                </ConteudoAba>
                <ConteudoAba valor="sessoes">
                  <p className="text-sm text-muted">Conteúdo da aba Sessões.</p>
                </ConteudoAba>
              </Tabs>
            </Secao>

            {/* ---------- Dados ---------- */}
            <div className="col-span-12">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div>
                  <h2 className="text-[15px] font-semibold">Tabela + Paginação</h2>
                  <p className="text-xs text-muted">glass-solid · cabeçalho fixo · esqueleto · vazio · erro · linha clicável (Enter)</p>
                </div>
                <Segmented
                  size="sm"
                  options={[
                    { value: 'dados', label: 'Com dados' },
                    { value: 'carregando', label: 'Carregando' },
                    { value: 'vazio', label: 'Vazio' },
                    { value: 'erro', label: 'Erro' },
                  ]}
                  value={estadoTabela}
                  onChange={setEstadoTabela}
                />
              </div>
              <Tabela
                rotulo="Usuários"
                colunas={colunas}
                linhas={estadoTabela === 'vazio' ? [] : USUARIOS}
                chaveLinha={(u) => u.id}
                carregando={estadoTabela === 'carregando'}
                alturaMax="320px"
                onLinhaClick={(u) => toast({ title: `Abrir ficha de ${u.nome}`, tone: 'info' })}
                rotuloLinha={(u) => `Abrir ficha de ${u.nome}`}
                vazio={
                  <EstadoVazio
                    titulo="Nenhum usuário encontrado"
                    descricao="Ajuste a busca ou os filtros."
                    acao={
                      <Button variant="primary">
                        <Plus className="size-4" /> Novo usuário
                      </Button>
                    }
                  />
                }
                erro={estadoTabela === 'erro' ? <EstadoErro onTentarDeNovo={() => setEstadoTabela('dados')} codigo="b7e1c9a2" /> : undefined}
                rodape={<Paginacao pagina={pagina} totalPaginas={25} totalElementos={1234} tamanho={50} onPagina={setPagina} />}
              />
            </div>

            <Secao titulo="Alertas" subtitulo="Texto na cor do tema; o tom vai no ícone, fundo e borda">
              <div className="space-y-2.5">
                <Alerta tom="info" titulo="Dica">
                  Esqueceu a senha? Fale com o administrador.
                </Alerta>
                <Alerta tom="sucesso" titulo="Verificação ligada">
                  Guarde os códigos de recuperação.
                </Alerta>
                <Alerta tom="aviso" titulo="Código expirado" acao={<Button size="sm">Voltar</Button>}>
                  Entre de novo com e-mail e senha.
                </Alerta>
                <Alerta tom="perigo" titulo="Não foi possível salvar">
                  Esta cena exclusiva já pertence a outro contratante.
                </Alerta>
              </div>
            </Secao>

            <Secao titulo="Esqueleto, vazio e erro" subtitulo="Skeleton · EstadoVazio · EstadoErro">
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-full" />
                <div className="flex-1">
                  <SkeletonTexto linhas={2} />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3 mt-4">
                <div className="glass-flat">
                  <EstadoVazio titulo="Sem sessões" descricao="Nenhuma outra sessão aberta." className="!py-8" />
                </div>
                <div className="glass-flat">
                  <EstadoErro onTentarDeNovo={() => toast({ title: 'Tentando de novo', tone: 'info' })} codigo="c0ffee42" className="!py-8" />
                </div>
              </div>
            </Secao>

            {/* ---------- Sobreposições ---------- */}
            <Secao titulo="Diálogos e toasts" subtitulo="Dialogo e ConfirmDialog (Radix: foco preso, Esc, aria-modal) · Toast com ação">
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => setDialogo(true)}>Abrir diálogo</Button>
                <Button onClick={() => setGaveta(true)}>Abrir gaveta</Button>
                <Button onClick={() => setConfirmar('normal')}>Confirmar</Button>
                <Button variant="danger" onClick={() => setConfirmar('perigo')}>
                  Confirmar (perigo)
                </Button>
                <Button onClick={() => toast({ title: 'Senha alterada', description: 'As outras sessões foram encerradas.', tone: 'success' })}>Toast sucesso</Button>
                <Button onClick={() => toast({ title: 'Você não tem permissão para isso.', tone: 'danger' })}>Toast erro</Button>
                <Button
                  onClick={() =>
                    toast({
                      title: 'Outra pessoa alterou este registro',
                      description: 'Recarregue para ver a versão atual.',
                      tone: 'accent',
                      acao: { rotulo: 'Recarregar', onClick: () => toast({ title: 'Recarregado', tone: 'success' }) },
                    })
                  }
                >
                  Toast com ação
                </Button>
                <Button
                  onClick={() => {
                    setSplash(true);
                    setTimeout(() => setSplash(false), 2000);
                  }}
                >
                  Splash (2 s)
                </Button>
              </div>
            </Secao>

            <Secao titulo="Aviso de contexto" subtitulo="role=status · superadmin dentro do contratante · selo de prévia">
              <div className="space-y-3">
                <AvisoContexto visivel={aviso && !avisoFlutuante} acao={{ rotulo: 'Sair do contratante', onClick: () => setAviso(false) }}>
                  Você está dentro de <strong>Demo Solar</strong> como superadmin
                </AvisoContexto>
                <AvisoContexto tipo="previa">
                  Prévia de <strong>Demo Marina</strong>
                </AvisoContexto>
                <div className="flex flex-wrap gap-2 justify-center">
                  <Button size="sm" onClick={() => setAviso((v) => !v)}>
                    {aviso ? 'Esconder' : 'Mostrar'}
                  </Button>
                  <Toggle checked={avisoFlutuante} onChange={setAvisoFlutuante} label="Fixo embaixo" />
                </div>
              </div>
            </Secao>

            {/* ---------- Casca ---------- */}
            <Secao titulo="Casca: barra superior, menu do usuário, busca" subtitulo="Sem botão de tema, sem Novo e sem sino" className="col-span-12">
              <Topbar
                titulo="Usuários"
                contratante={<ChipContratante ref={chipRef} nome="Demo Solar" detalhe="Superadmin" onClick={() => toast({ title: 'Abrir seletor de contratante', tone: 'info' })} />}
                onBuscar={() => setBusca(true)}
                direita={
                  <MenuUsuario
                    nome="Ana Ribeiro"
                    email="ana@demo.com.br"
                    papel="Administrador"
                    contexto="Demo Solar"
                    onMinhaConta={() => toast({ title: 'Minha conta', tone: 'info' })}
                    onSair={() => toast({ title: 'Sair', tone: 'info' })}
                  />
                }
              />
              <div className="flex flex-wrap items-center gap-3 mt-4">
                <ChipContratante nome="Plataforma" detalhe="Sem troca (não clicável)" />
                <MenuUsuario nome="Bruno Carvalho" onMinhaConta={() => {}} onSair={() => {}} tamanho={36} />
                <Toggle checked={casca} onChange={setCasca} label="Mostrar menu lateral e barra inferior" />
                <Button size="sm" onClick={() => setBusca(true)}>
                  Abrir busca (Ctrl K)
                </Button>
                <Button size="sm" variant="ghost" onClick={() => nav('/')}>
                  Ir para a página inicial
                </Button>
              </div>
            </Secao>

            {/* ---------- Aparência ---------- */}
            <div className="col-span-12">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div>
                  <h2 className="text-[15px] font-semibold flex items-center gap-2">
                    <Palette className="size-4" aria-hidden /> Editor de aparência
                  </h2>
                  <p className="text-xs text-muted">SeletorTema · SeletorDestaque · SeletorFundo (Marina marcada como exclusiva no exemplo) · Slider · Segmented</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Toggle
                    checked={previaAoVivo}
                    onChange={(v) => {
                      setPreviaAoVivo(v);
                      if (v) definirPrevia(editor);
                      else limparPrevia();
                    }}
                    label="Prévia ao vivo na interface"
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      setEditor(APARENCIA_PADRAO);
                      if (previaAoVivo) definirPrevia(APARENCIA_PADRAO);
                    }}
                  >
                    Padrão do sistema
                  </Button>
                </div>
              </div>
              <EditorAparencia valor={editor} onChange={mudarEditor} fundos={FUNDOS_DEMO} />
              <pre className="glass-flat mt-3 p-3 text-[11px] text-muted overflow-x-auto">{JSON.stringify(editor)}</pre>
            </div>
          </div>
        </div>
      </motion.div>

      <Dialogo
        aberto={dialogo}
        onAbertoChange={setDialogo}
        titulo="Redefinir senha"
        descricao="Uma senha temporária foi gerada. Passe para o usuário por um canal seguro."
        rodape={
          <>
            <Button onClick={() => setDialogo(false)}>Fechar</Button>
            <Button variant="primary" onClick={() => setDialogo(false)}>
              Copiar e fechar
            </Button>
          </>
        }
      >
        <CampoForm rotulo="Senha temporária" bloco={false}>
          <Input readOnly value="Vidro-Azul-7391-Lago" className="font-mono" />
        </CampoForm>
      </Dialogo>
      <Gaveta
        aberto={gaveta}
        onAbertoChange={setGaveta}
        titulo="Filtros dos logs"
        descricao="Gaveta lateral (Radix): foco preso, Esc fecha, foco volta ao botão."
        rodape={
          <>
            <Button onClick={() => setGaveta(false)}>Limpar</Button>
            <Button variant="primary" onClick={() => setGaveta(false)}>
              Aplicar
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <CampoForm rotulo="Usuário" bloco={false}>
            <Input icon={UserRound} placeholder="Nome ou e-mail" />
          </CampoForm>
          <CampoForm rotulo="Período" grupo bloco={false}>
            <Segmented
              options={[
                { value: '24h', label: '24 h' },
                { value: '7d', label: '7 dias' },
                { value: '30d', label: '30 dias' },
              ]}
              value="7d"
              onChange={() => {}}
            />
          </CampoForm>
        </div>
      </Gaveta>
      <ConfirmDialog
        aberto={confirmar !== null}
        onAbertoChange={(v) => !v && setConfirmar(null)}
        titulo={confirmar === 'perigo' ? 'Encerrar todas as outras sessões?' : 'Ativar o contratante?'}
        descricao={confirmar === 'perigo' ? 'Os outros dispositivos vão precisar entrar de novo.' : 'Os usuários dele voltam a conseguir entrar.'}
        confirmar={confirmar === 'perigo' ? 'Encerrar sessões' : 'Ativar'}
        perigo={confirmar === 'perigo'}
        onConfirmar={() => new Promise((r) => setTimeout(r, 800)).then(() => toast({ title: 'Feito', tone: 'success' }))}
      />
    </>
  );
}
