/* Dados fictícios para o protótipo. Nada aqui vem de banco ou API. */

export const USUARIO = { nome: 'Marina Costa', cargo: 'Gerente comercial', email: 'marina@vitrum.app' };
export const VENDEDORES = ['Marina Costa', 'Rodrigo Alves', 'Patrícia Nunes', 'Diego Ramos', 'Larissa Moura'];

/* ---------------- Funil ---------------- */
export type Etapa = 'prospeccao' | 'qualificacao' | 'proposta' | 'negociacao' | 'ganho';
export const ETAPAS: { id: Etapa; nome: string; cor: string }[] = [
  { id: 'prospeccao', nome: 'Prospecção', cor: 'var(--info)' },
  { id: 'qualificacao', nome: 'Qualificação', cor: 'var(--accent-2)' },
  { id: 'proposta', nome: 'Proposta', cor: 'var(--accent)' },
  { id: 'negociacao', nome: 'Negociação', cor: 'var(--warning)' },
  { id: 'ganho', nome: 'Ganho', cor: 'var(--success)' },
];

export type Deal = {
  id: string;
  titulo: string;
  cliente: string;
  valor: number;
  etapa: Etapa;
  prob: number;
  responsavel: string;
  previsao: string;
  tags: string[];
  origem: string;
};

export const DEALS: Deal[] = [
  { id: 'd1', titulo: 'Usina solar 120 kWp', cliente: 'Agro Vale Sul', valor: 486000, etapa: 'negociacao', prob: 70, responsavel: 'Marina Costa', previsao: '18 nov', tags: ['Quente'], origem: 'Indicação' },
  { id: 'd2', titulo: 'Retrofit de iluminação', cliente: 'Construtora Horizonte', valor: 128500, etapa: 'proposta', prob: 55, responsavel: 'Rodrigo Alves', previsao: '25 nov', tags: ['Obra'], origem: 'Site' },
  { id: 'd3', titulo: 'Monitoramento IoT', cliente: 'TechNova Sistemas', valor: 64900, etapa: 'qualificacao', prob: 35, responsavel: 'Marina Costa', previsao: '02 dez', tags: ['Tech'], origem: 'Eventos' },
  { id: 'd4', titulo: 'Contrato de manutenção', cliente: 'Rede Bem-Estar Farmácias', valor: 92000, etapa: 'negociacao', prob: 80, responsavel: 'Patrícia Nunes', previsao: '12 nov', tags: ['Recorrente'], origem: 'WhatsApp' },
  { id: 'd5', titulo: 'Baterias para câmaras frias', cliente: 'Café Serra Alta', valor: 158000, etapa: 'proposta', prob: 50, responsavel: 'Diego Ramos', previsao: '30 nov', tags: [], origem: 'Indicação' },
  { id: 'd6', titulo: 'Painéis para 4 lojas', cliente: 'Lumi Móveis Planejados', valor: 212000, etapa: 'prospeccao', prob: 15, responsavel: 'Larissa Moura', previsao: '15 dez', tags: ['Novo'], origem: 'Outbound' },
  { id: 'd7', titulo: 'Carregadores para frota elétrica', cliente: 'Transportes Rota 101', valor: 340000, etapa: 'qualificacao', prob: 30, responsavel: 'Rodrigo Alves', previsao: '20 dez', tags: ['Grande'], origem: 'Eventos' },
  { id: 'd8', titulo: 'Gerador de backup', cliente: 'Clínica Vida Plena', valor: 74500, etapa: 'ganho', prob: 100, responsavel: 'Marina Costa', previsao: '01 nov', tags: [], origem: 'Site' },
  { id: 'd9', titulo: 'Forno elétrico eficiente', cliente: 'Padaria Trigo de Ouro', valor: 38900, etapa: 'prospeccao', prob: 10, responsavel: 'Patrícia Nunes', previsao: '10 dez', tags: [], origem: 'WhatsApp' },
  { id: 'd10', titulo: 'Energia solar no campus', cliente: 'Escola Pequenos Passos', valor: 96000, etapa: 'proposta', prob: 60, responsavel: 'Diego Ramos', previsao: '22 nov', tags: ['Quente'], origem: 'Indicação' },
  { id: 'd11', titulo: 'Parceria de revenda', cliente: 'Solaris Energia', valor: 520000, etapa: 'prospeccao', prob: 20, responsavel: 'Marina Costa', previsao: 'jan 2027', tags: ['Estratégico'], origem: 'Eventos' },
  { id: 'd12', titulo: 'Painéis flutuantes na marina', cliente: 'Náutica Sul', valor: 87000, etapa: 'qualificacao', prob: 40, responsavel: 'Larissa Moura', previsao: '05 dez', tags: [], origem: 'Site' },
  { id: 'd13', titulo: 'Ampliação — 2ª fase', cliente: 'Agro Vale Sul', valor: 265000, etapa: 'ganho', prob: 100, responsavel: 'Rodrigo Alves', previsao: '28 out', tags: ['Recorrente'], origem: 'Indicação' },
  { id: 'd14', titulo: 'Auditoria energética', cliente: 'TechNova Sistemas', valor: 18500, etapa: 'negociacao', prob: 75, responsavel: 'Patrícia Nunes', previsao: '14 nov', tags: [], origem: 'Outbound' },
  { id: 'd15', titulo: 'Cobertura do estacionamento', cliente: 'Construtora Horizonte', valor: 189000, etapa: 'prospeccao', prob: 15, responsavel: 'Diego Ramos', previsao: 'fev 2027', tags: ['Obra'], origem: 'Site' },
  { id: 'd16', titulo: 'Kit de sensores', cliente: 'Café Serra Alta', valor: 22400, etapa: 'ganho', prob: 100, responsavel: 'Larissa Moura', previsao: '03 nov', tags: [], origem: 'WhatsApp' },
];

export const TAG_TONE: Record<string, 'danger' | 'success' | 'info' | 'accent' | 'warning' | 'neutral'> = {
  Quente: 'danger',
  Recorrente: 'success',
  Novo: 'info',
  Estratégico: 'accent',
  Grande: 'warning',
};

/* ---------------- Clientes ---------------- */
export type ClienteStatus = 'ativo' | 'lead' | 'negociacao' | 'inativo';
export type Cliente = {
  id: string;
  nome: string;
  contato: string;
  email: string;
  telefone: string;
  cidade: string;
  segmento: string;
  status: ClienteStatus;
  responsavel: string;
  valorAberto: number;
  receitaTotal: number;
  ultimaAtividade: string;
  tier?: 'VIP' | 'Ouro';
  desde: string;
};

export const CLIENTES: Cliente[] = [
  { id: 'agro-vale-sul', nome: 'Agro Vale Sul', contato: 'Ana Ribeiro', email: 'ana.ribeiro@agrovalesul.com.br', telefone: '(54) 99812-4410', cidade: 'Passo Fundo, RS', segmento: 'Agronegócio', status: 'ativo', responsavel: 'Marina Costa', valorAberto: 486000, receitaTotal: 1240000, ultimaAtividade: 'Hoje, 10:20', tier: 'VIP', desde: '2021' },
  { id: 'construtora-horizonte', nome: 'Construtora Horizonte', contato: 'Carlos Menezes', email: 'carlos@horizonte.eng.br', telefone: '(41) 98840-1203', cidade: 'Curitiba, PR', segmento: 'Construção', status: 'ativo', responsavel: 'Rodrigo Alves', valorAberto: 317500, receitaTotal: 860000, ultimaAtividade: 'Ontem, 17:45', tier: 'Ouro', desde: '2022' },
  { id: 'cafe-serra-alta', nome: 'Café Serra Alta', contato: 'Juliana Prado', email: 'juliana@serraalta.com.br', telefone: '(35) 99711-3388', cidade: 'Poços de Caldas, MG', segmento: 'Alimentos', status: 'ativo', responsavel: 'Diego Ramos', valorAberto: 158000, receitaTotal: 312000, ultimaAtividade: 'Hoje, 08:05', desde: '2023' },
  { id: 'technova', nome: 'TechNova Sistemas', contato: 'Rafael Souza', email: 'rafael@technova.io', telefone: '(48) 99630-7711', cidade: 'Florianópolis, SC', segmento: 'Tecnologia', status: 'ativo', responsavel: 'Marina Costa', valorAberto: 83400, receitaTotal: 540000, ultimaAtividade: '2 dias atrás', tier: 'VIP', desde: '2020' },
  { id: 'rede-bem-estar', nome: 'Rede Bem-Estar Farmácias', contato: 'Beatriz Lima', email: 'beatriz@redebemestar.com.br', telefone: '(51) 98122-9004', cidade: 'Porto Alegre, RS', segmento: 'Saúde', status: 'negociacao', responsavel: 'Patrícia Nunes', valorAberto: 92000, receitaTotal: 188000, ultimaAtividade: 'Hoje, 11:32', desde: '2024' },
  { id: 'lumi-moveis', nome: 'Lumi Móveis Planejados', contato: 'Thiago Martins', email: 'thiago@lumimoveis.com.br', telefone: '(54) 99104-5520', cidade: 'Caxias do Sul, RS', segmento: 'Varejo', status: 'lead', responsavel: 'Larissa Moura', valorAberto: 212000, receitaTotal: 0, ultimaAtividade: '3 dias atrás', desde: '2026' },
  { id: 'rota-101', nome: 'Transportes Rota 101', contato: 'Fernanda Alves', email: 'fernanda@rota101.com.br', telefone: '(47) 98877-6610', cidade: 'Joinville, SC', segmento: 'Logística', status: 'negociacao', responsavel: 'Rodrigo Alves', valorAberto: 340000, receitaTotal: 96000, ultimaAtividade: 'Semana passada', desde: '2025' },
  { id: 'vida-plena', nome: 'Clínica Vida Plena', contato: 'Lucas Oliveira', email: 'lucas@vidaplena.med.br', telefone: '(11) 99455-2290', cidade: 'São Paulo, SP', segmento: 'Saúde', status: 'ativo', responsavel: 'Marina Costa', valorAberto: 0, receitaTotal: 274500, ultimaAtividade: '01 nov', desde: '2023' },
  { id: 'trigo-de-ouro', nome: 'Padaria Trigo de Ouro', contato: 'Camila Duarte', email: 'camila@trigodeouro.com.br', telefone: '(53) 99201-4478', cidade: 'Pelotas, RS', segmento: 'Alimentos', status: 'lead', responsavel: 'Patrícia Nunes', valorAberto: 38900, receitaTotal: 0, ultimaAtividade: '4 dias atrás', desde: '2026' },
  { id: 'pequenos-passos', nome: 'Escola Pequenos Passos', contato: 'Pedro Henrique', email: 'pedro@pequenospassos.edu.br', telefone: '(55) 99318-0042', cidade: 'Santa Maria, RS', segmento: 'Educação', status: 'ativo', responsavel: 'Diego Ramos', valorAberto: 96000, receitaTotal: 142000, ultimaAtividade: 'Ontem, 09:10', desde: '2024' },
  { id: 'solaris', nome: 'Solaris Energia', contato: 'Mariana Freitas', email: 'mariana@solaris.eco.br', telefone: '(31) 98765-1122', cidade: 'Belo Horizonte, MG', segmento: 'Energia', status: 'lead', responsavel: 'Marina Costa', valorAberto: 520000, receitaTotal: 0, ultimaAtividade: 'Hoje, 07:58', tier: 'Ouro', desde: '2026' },
  { id: 'nautica-sul', nome: 'Náutica Sul', contato: 'Gustavo Pereira', email: 'gustavo@nauticasul.com.br', telefone: '(53) 98111-3307', cidade: 'Rio Grande, RS', segmento: 'Varejo', status: 'inativo', responsavel: 'Larissa Moura', valorAberto: 87000, receitaTotal: 61000, ultimaAtividade: '2 semanas atrás', desde: '2022' },
];

/* ---------------- Filiais ---------------- */
export type Filial = {
  id: string;
  nome: string;
  tipo: 'Matriz' | 'Filial';
  cidade: string;
  gerente: string;
  colaboradores: number;
  faturamento: number;
  meta: number;
  status: 'operando' | 'implantacao';
};
export const FILIAIS: Filial[] = [
  { id: 'f1', nome: 'Matriz Porto Alegre', tipo: 'Matriz', cidade: 'Porto Alegre, RS', gerente: 'Marina Costa', colaboradores: 42, faturamento: 168400, meta: 92, status: 'operando' },
  { id: 'f2', nome: 'Caxias do Sul', tipo: 'Filial', cidade: 'Caxias do Sul, RS', gerente: 'Larissa Moura', colaboradores: 18, faturamento: 72300, meta: 81, status: 'operando' },
  { id: 'f3', nome: 'Curitiba', tipo: 'Filial', cidade: 'Curitiba, PR', gerente: 'Rodrigo Alves', colaboradores: 21, faturamento: 88900, meta: 104, status: 'operando' },
  { id: 'f4', nome: 'Florianópolis', tipo: 'Filial', cidade: 'Florianópolis, SC', gerente: 'Patrícia Nunes', colaboradores: 14, faturamento: 51200, meta: 68, status: 'operando' },
  { id: 'f5', nome: 'São Paulo', tipo: 'Filial', cidade: 'São Paulo, SP', gerente: 'Diego Ramos', colaboradores: 26, faturamento: 31580, meta: 34, status: 'operando' },
  { id: 'f6', nome: 'Passo Fundo', tipo: 'Filial', cidade: 'Passo Fundo, RS', gerente: 'Ana Ribeiro', colaboradores: 6, faturamento: 0, meta: 0, status: 'implantacao' },
];

/* ---------------- Produtos ---------------- */
export type Produto = {
  id: string;
  nome: string;
  sku: string;
  categoria: string;
  preco: number;
  estoque: number;
  icone: 'sun' | 'zap' | 'battery' | 'cpu' | 'wrench' | 'shield' | 'cable' | 'leaf' | 'gauge' | 'droplets';
};
export const PRODUTOS: Produto[] = [
  { id: 'p1', nome: 'Painel Solar 550 W', sku: 'PNL-550M', categoria: 'Geração', preco: 1290, estoque: 840, icone: 'sun' },
  { id: 'p2', nome: 'Inversor Híbrido 5 kW', sku: 'INV-H5K', categoria: 'Conversão', preco: 7890, estoque: 64, icone: 'zap' },
  { id: 'p3', nome: 'Bateria de Lítio 10 kWh', sku: 'BAT-L10', categoria: 'Armazenamento', preco: 24900, estoque: 12, icone: 'battery' },
  { id: 'p4', nome: 'Kit Monitoramento IoT', sku: 'IOT-KIT2', categoria: 'Monitoramento', preco: 2450, estoque: 0, icone: 'cpu' },
  { id: 'p5', nome: 'Serviço de Instalação', sku: 'SRV-INST', categoria: 'Serviços', preco: 3800, estoque: 999, icone: 'wrench' },
  { id: 'p6', nome: 'Manutenção Anual', sku: 'SRV-MAN12', categoria: 'Serviços', preco: 5400, estoque: 999, icone: 'shield' },
  { id: 'p7', nome: 'Cabo Solar 6 mm (100 m)', sku: 'CAB-6MM', categoria: 'Acessórios', preco: 980, estoque: 230, icone: 'cable' },
  { id: 'p8', nome: 'Consultoria Energética', sku: 'CON-ENRG', categoria: 'Serviços', preco: 6500, estoque: 999, icone: 'leaf' },
  { id: 'p9', nome: 'Medidor Bidirecional', sku: 'MED-BID', categoria: 'Monitoramento', preco: 1150, estoque: 9, icone: 'gauge' },
  { id: 'p10', nome: 'Sensor de Umidade S200', sku: 'SNS-S200', categoria: 'Monitoramento', preco: 340, estoque: 410, icone: 'droplets' },
];

/* ---------------- Dashboard ---------------- */
export const KPIS = [
  { label: 'Receita do mês', value: 412380, kind: 'brl', delta: 12.4, spark: [22, 28, 25, 34, 31, 40, 38, 46, 44, 52] },
  { label: 'Novos leads', value: 1284, kind: 'int', delta: 8.1, spark: [30, 26, 34, 32, 38, 36, 44, 41, 47, 50] },
  { label: 'Taxa de conversão', value: 23.6, kind: 'pct', delta: 2.3, spark: [18, 19, 18, 21, 20, 22, 21, 23, 22, 24] },
  { label: 'Ticket médio', value: 18940, kind: 'brl', delta: -1.8, spark: [42, 40, 44, 41, 39, 42, 38, 40, 37, 38] },
] as const;

export const RECEITA_SEMANAS = {
  labels: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9', 'S10', 'S11', 'S12'],
  receita: [62, 71, 68, 80, 77, 92, 88, 97, 104, 99, 112, 121],
  meta: [70, 72, 74, 76, 78, 80, 83, 86, 89, 92, 95, 98],
};

export const RECEITA_MESES = [
  { label: 'jun', value: 268 },
  { label: 'jul', value: 301 },
  { label: 'ago', value: 289 },
  { label: 'set', value: 344 },
  { label: 'out', value: 372 },
  { label: 'nov', value: 412 },
];

export const CONVERSAO = [
  { etapa: 'Leads', valor: 1284 },
  { etapa: 'Qualificados', valor: 642 },
  { etapa: 'Proposta', valor: 268 },
  { etapa: 'Negociação', valor: 141 },
  { etapa: 'Ganhos', valor: 76 },
];

export const ORIGENS = [
  { label: 'Indicação', value: 34, color: 'var(--accent)' },
  { label: 'Site', value: 26, color: 'var(--accent-2)' },
  { label: 'WhatsApp', value: 21, color: 'var(--success)' },
  { label: 'Eventos', value: 11, color: 'var(--warning)' },
  { label: 'Outbound', value: 8, color: 'var(--accent-3)' },
];

export const RANKING = [
  { nome: 'Marina Costa', valor: 128400, meta: 112 },
  { nome: 'Rodrigo Alves', valor: 104900, meta: 96 },
  { nome: 'Patrícia Nunes', valor: 86200, meta: 88 },
  { nome: 'Diego Ramos', valor: 61300, meta: 71 },
  { nome: 'Larissa Moura', valor: 31580, meta: 52 },
];

export const ATIVIDADES = [
  { tipo: 'email', texto: 'Ana Ribeiro abriu a proposta da usina solar', quando: 'há 12 min' },
  { tipo: 'move', texto: 'Contrato de manutenção foi para Negociação', quando: 'há 40 min' },
  { tipo: 'won', texto: 'Kit de sensores — Café Serra Alta foi ganho', quando: 'há 2 h' },
  { tipo: 'call', texto: 'Ligação com Rafael Souza (TechNova) · 18 min', quando: 'há 3 h' },
  { tipo: 'new', texto: 'Novo lead: Solaris Energia, via evento', quando: 'há 5 h' },
];

/* ---------------- Agenda ---------------- */
export type TipoEvento = 'reuniao' | 'ligacao' | 'visita' | 'demo' | 'interno';
export const TIPOS_EVENTO: Record<TipoEvento, { label: string; cor: string }> = {
  reuniao: { label: 'Reunião', cor: 'var(--accent)' },
  ligacao: { label: 'Ligação', cor: 'var(--info)' },
  visita: { label: 'Visita', cor: 'var(--success)' },
  demo: { label: 'Demonstração', cor: 'var(--warning)' },
  interno: { label: 'Interno', cor: 'var(--accent-3)' },
};

/** off = dias a partir de hoje (0 = hoje). Horas em decimal. */
export type EventoBase = {
  off: number;
  inicio: number;
  fim: number;
  titulo: string;
  cliente?: string;
  tipo: TipoEvento;
  local?: string;
  participantes: string[];
};

export const EVENTOS_BASE: EventoBase[] = [
  { off: -6, inicio: 10, fim: 11, titulo: 'Reunião de alinhamento', cliente: 'Construtora Horizonte', tipo: 'reuniao', local: 'Google Meet', participantes: ['Rodrigo Alves', 'Carlos Menezes'] },
  { off: -5, inicio: 9, fim: 9.5, titulo: 'Daily comercial', tipo: 'interno', local: 'Sala Aurora', participantes: VENDEDORES },
  { off: -5, inicio: 14, fim: 15.5, titulo: 'Visita técnica', cliente: 'Clínica Vida Plena', tipo: 'visita', local: 'São Paulo, SP', participantes: ['Marina Costa', 'Lucas Oliveira'] },
  { off: -4, inicio: 11, fim: 12, titulo: 'Demonstração do monitoramento', cliente: 'TechNova Sistemas', tipo: 'demo', local: 'Zoom', participantes: ['Marina Costa', 'Rafael Souza'] },
  { off: -3, inicio: 9, fim: 9.5, titulo: 'Daily comercial', tipo: 'interno', local: 'Sala Aurora', participantes: VENDEDORES },
  { off: -3, inicio: 15, fim: 16, titulo: 'Ligação de follow-up', cliente: 'Café Serra Alta', tipo: 'ligacao', participantes: ['Diego Ramos', 'Juliana Prado'] },
  { off: -2, inicio: 9, fim: 9.5, titulo: 'Daily comercial', tipo: 'interno', local: 'Sala Aurora', participantes: VENDEDORES },
  { off: -2, inicio: 10, fim: 11.5, titulo: 'Apresentação de proposta', cliente: 'Agro Vale Sul', tipo: 'reuniao', local: 'Passo Fundo, RS', participantes: ['Marina Costa', 'Ana Ribeiro', 'Rodrigo Alves'] },
  { off: -2, inicio: 14, fim: 15, titulo: 'Ligação de qualificação', cliente: 'Náutica Sul', tipo: 'ligacao', participantes: ['Larissa Moura'] },
  { off: -2, inicio: 16, fim: 17.5, titulo: 'Visita à obra', cliente: 'Construtora Horizonte', tipo: 'visita', local: 'Curitiba, PR', participantes: ['Rodrigo Alves', 'Carlos Menezes'] },
  { off: -1, inicio: 8.5, fim: 9.5, titulo: 'Planejamento semanal', tipo: 'interno', local: 'Sala Aurora', participantes: VENDEDORES },
  { off: -1, inicio: 11, fim: 12, titulo: 'Demo do app mobile', cliente: 'TechNova Sistemas', tipo: 'demo', local: 'Zoom', participantes: ['Marina Costa', 'Rafael Souza'] },
  { off: -1, inicio: 15, fim: 16, titulo: 'Negociação de contrato', cliente: 'Rede Bem-Estar Farmácias', tipo: 'ligacao', participantes: ['Patrícia Nunes', 'Beatriz Lima'] },
  { off: 0, inicio: 9, fim: 9.5, titulo: 'Daily comercial', tipo: 'interno', local: 'Sala Aurora', participantes: VENDEDORES },
  { off: 0, inicio: 10.5, fim: 11.5, titulo: 'Fechamento da usina solar', cliente: 'Agro Vale Sul', tipo: 'reuniao', local: 'Google Meet', participantes: ['Marina Costa', 'Ana Ribeiro'] },
  { off: 0, inicio: 14, fim: 15.5, titulo: 'Demonstração da plataforma', cliente: 'TechNova Sistemas', tipo: 'demo', local: 'Zoom', participantes: ['Marina Costa', 'Rafael Souza', 'Diego Ramos'] },
  { off: 0, inicio: 16.5, fim: 17, titulo: 'Ligação: ajustes do contrato', cliente: 'Rede Bem-Estar Farmácias', tipo: 'ligacao', participantes: ['Patrícia Nunes', 'Beatriz Lima'] },
  { off: 0, inicio: 18, fim: 19, titulo: 'Visita de pós-venda', cliente: 'Construtora Horizonte', tipo: 'visita', local: 'Curitiba, PR', participantes: ['Rodrigo Alves'] },
  { off: 1, inicio: 9, fim: 10, titulo: 'Reunião de descoberta', cliente: 'Lumi Móveis Planejados', tipo: 'reuniao', local: 'Caxias do Sul, RS', participantes: ['Larissa Moura', 'Thiago Martins'] },
  { off: 1, inicio: 13.5, fim: 15, titulo: 'Vistoria técnica', cliente: 'Clínica Vida Plena', tipo: 'visita', local: 'São Paulo, SP', participantes: ['Diego Ramos'] },
  { off: 1, inicio: 16, fim: 17, titulo: 'Demo para revenda', cliente: 'Solaris Energia', tipo: 'demo', local: 'Google Meet', participantes: ['Marina Costa', 'Mariana Freitas'] },
  { off: 2, inicio: 9, fim: 9.5, titulo: 'Daily comercial', tipo: 'interno', local: 'Sala Aurora', participantes: VENDEDORES },
  { off: 2, inicio: 10, fim: 12, titulo: 'Workshop de eficiência', cliente: 'Escola Pequenos Passos', tipo: 'visita', local: 'Santa Maria, RS', participantes: ['Diego Ramos', 'Pedro Henrique'] },
  { off: 2, inicio: 15, fim: 16, titulo: 'Reunião de proposta', cliente: 'Náutica Sul', tipo: 'reuniao', local: 'Google Meet', participantes: ['Larissa Moura', 'Gustavo Pereira'] },
  { off: 2, inicio: 17, fim: 18, titulo: 'Revisão do funil', tipo: 'interno', local: 'Sala Aurora', participantes: VENDEDORES },
  { off: 3, inicio: 9, fim: 11, titulo: 'Feira AgroTech — estande', tipo: 'visita', local: 'Esteio, RS', participantes: ['Marina Costa', 'Rodrigo Alves'] },
  { off: 4, inicio: 10, fim: 11, titulo: 'Ligação com investidor', cliente: 'Solaris Energia', tipo: 'ligacao', participantes: ['Marina Costa'] },
  { off: 5, inicio: 9, fim: 9.5, titulo: 'Daily comercial', tipo: 'interno', local: 'Sala Aurora', participantes: VENDEDORES },
  { off: 5, inicio: 14, fim: 15.5, titulo: 'Apresentação executiva', cliente: 'Transportes Rota 101', tipo: 'reuniao', local: 'Joinville, SC', participantes: ['Rodrigo Alves', 'Fernanda Alves'] },
  { off: 6, inicio: 11, fim: 12, titulo: 'Demo de baterias', cliente: 'Café Serra Alta', tipo: 'demo', local: 'Zoom', participantes: ['Diego Ramos', 'Juliana Prado'] },
];
