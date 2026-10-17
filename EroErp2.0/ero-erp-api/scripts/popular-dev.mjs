#!/usr/bin/env node
/**
 * Popula o banco de DESENVOLVIMENTO com dados de demonstração — pela API HTTP,
 * para que cada registro passe pelas mesmas validações da tela — e depois relê
 * tudo e imprime uma lista de conferência. Serve também de teste geral de ponta
 * a ponta contra a aplicação em execução.
 *
 *   POPULAR_EMAIL=... POPULAR_SENHA=... node ero-erp-api/scripts/popular-dev.mjs
 *
 * Variáveis:
 *   POPULAR_API    base da API (padrão http://localhost:8080). Só aceita
 *                  localhost ou 127.0.0.1: este script NUNCA roda em produção.
 *   POPULAR_EMAIL  e-mail do usuário que vai gravar (o tenant é o dele).
 *   POPULAR_SENHA  senha dele. Nenhuma das duas é impressa.
 *
 * O que ele cria, no tenant de quem entra: pessoas (clientes, fornecedores e
 * funcionários), com telefone, e-mail e endereço, e serviços (com valor na
 * primeira filial ativa, se o tenant tiver alguma). Cada módulo novo do EroErp
 * acrescenta aqui os seus dados e as suas conferências.
 *
 * Nada é apagado, nunca. Rodar de novo REAPROVEITA o que já existe — pessoa
 * pelo nome —: a segunda rodada não duplica nada.
 *
 * Sai com código 1 se qualquer conferência falhar.
 */

// ─── Ambiente: só local, credencial só por variável ─────────────────────────

const BASE = (process.env.POPULAR_API ?? 'http://localhost:8080').replace(/\/+$/, '');
const falhar = (msg) => { console.error('ERRO: ' + msg); process.exit(2); };

{
  let host;
  try { host = new URL(BASE).hostname; } catch { falhar(`POPULAR_API inválida: ${BASE}`); }
  if (host !== 'localhost' && host !== '127.0.0.1')
    falhar(`recuso rodar contra "${host}" — este script só popula a API local (localhost ou 127.0.0.1).`);
}
const EMAIL = process.env.POPULAR_EMAIL;
const SENHA = process.env.POPULAR_SENHA;
if (!EMAIL || !SENHA) falhar('defina POPULAR_EMAIL e POPULAR_SENHA no ambiente.');

// ─── HTTP, com um login só e renovação no 401 ───────────────────────────────

let token = null;

async function entrar() {
  const r = await fetch(BASE + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, senha: SENHA }),
  });
  /* Login que falha conta tentativa no bloqueio da conta: não insistir. */
  if (!r.ok) falhar(`login recusado (${r.status}). Confira as credenciais — não vou tentar de novo.`);
  token = (await r.json()).accessToken;
}

class ErroApi extends Error {
  constructor(metodo, caminho, status, corpo) {
    const msg = corpo && typeof corpo === 'object' ? (corpo.erro ?? corpo.message ?? JSON.stringify(corpo)) : corpo;
    super(`${metodo} ${caminho} → ${status}: ${String(msg).slice(0, 300)}`);
    this.status = status;
    this.corpo = corpo;
  }
}

async function api(metodo, caminho, corpo) {
  const chamar = () => fetch(BASE + caminho, {
    method: metodo,
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  });
  let r = await chamar();
  if (r.status === 401) { await entrar(); r = await chamar(); }
  const texto = await r.text();
  let json = null;
  try { json = texto ? JSON.parse(texto) : null; } catch { json = texto; }
  if (!r.ok) throw new ErroApi(metodo, caminho, r.status, json);
  return json;
}

const get = (c) => api('GET', c);
const post = (c, b) => api('POST', c, b);

const qs = (o) => '?' + Object.entries(o).filter(([, v]) => v !== undefined && v !== null)
  .map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');

// ─── Conferência e contagem ─────────────────────────────────────────────────

const conferencias = [];
const contagem = {};
const erros = [];

function conferir(nome, ok, detalhe = '') {
  conferencias.push({ nome, ok: !!ok, detalhe });
}

function contar(modulo, como) {
  contagem[modulo] ??= { criado: 0, reaproveitado: 0 };
  contagem[modulo][como]++;
}

/** Roda um passo; erro vira conferência reprovada, e o resto segue. */
async function passo(nome, fn) {
  try { return await fn(); } catch (e) {
    erros.push(`${nome}: ${e.message}`);
    conferir(nome, false, e.message);
    return null;
  }
}

// ─── Datas: dia do calendário em São Paulo, nunca instante ──────────────────

const HOJE = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });

// ─── Aleatório com semente: a mesma pessoa, os mesmos números ───────────────

function hash(texto) {
  let h = 2166136261;
  for (const c of texto) h = Math.imul(h ^ c.codePointAt(0), 16777619);
  return h >>> 0;
}

function sorteador(semente) {
  let s = hash(semente);
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}


/** CPF fictício com dígitos verificadores válidos, derivado do nome. */
function cpfDe(nome) {
  const rnd = sorteador('cpf:' + nome);
  let base;
  do base = Array.from({ length: 9 }, () => Math.floor(rnd() * 10));
  while (base.every((d) => d === base[0]));
  const dv = (digitos) => {
    const soma = digitos.reduce((s, d, i) => s + d * (digitos.length + 1 - i), 0);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  const d1 = dv(base);
  const d2 = dv([...base, d1]);
  return [...base, d1, d2].join('');
}


// ─── Os dados de demonstração ───────────────────────────────────────────────

const CLIENTES = [
  { nome: 'Antônio Carlos Ferreira', sexo: 'MASCULINO', nasc: '1958-03-14', bairro: 'Petrópolis' },
  { nome: 'Maria das Graças Oliveira', sexo: 'FEMININO', nasc: '1944-07-02', bairro: 'Menino Deus' },
  { nome: 'José Roberto Almeida', sexo: 'MASCULINO', nasc: '1971-11-23', bairro: 'Cidade Baixa' },
  { nome: 'Francisca Lima Souza', sexo: 'FEMININO', nasc: '1955-01-30', bairro: 'Partenon' },
  { nome: 'Paulo Henrique Martins', sexo: 'MASCULINO', nasc: '1981-06-09', bairro: 'Santana' },
  { nome: 'Luiza Helena Cardoso', sexo: 'FEMININO', nasc: '1988-09-17', bairro: 'Moinhos de Vento' },
];

const FORNECEDORES = [
  { nome: 'Ricardo Gomes Pereira', sexo: 'MASCULINO', nasc: '1964-04-05', bairro: 'Tristeza' },
  { nome: 'Cláudia Regina Teixeira', sexo: 'FEMININO', nasc: '1976-08-28', bairro: 'Jardim Botânico' },
];

const FUNCIONARIOS = [
  { nome: 'Camila Andrade Vieira', sexo: 'FEMININO', nasc: '1986-05-19', bairro: 'Auxiliadora' },
  { nome: 'Renata Moura Fontes', sexo: 'FEMININO', nasc: '1991-10-03', bairro: 'Higienópolis' },
];

// ─── Catálogos de que tudo depende ──────────────────────────────────────────

const cat = {};

async function carregarCatalogos() {
  const tipos = await get('/tipos-cadastro/select');
  const porNome = (lista, nome) => lista.find((t) => t.nome === nome)?.id;
  cat.cliente = porNome(tipos, 'Cliente');
  cat.fornecedor = porNome(tipos, 'Fornecedor');
  cat.funcionario = porNome(tipos, 'Funcionário');
  cat.celular = porNome(await get('/tipos-telefone/select'), 'Celular');
  cat.emailParticular = porNome(await get('/tipos-email/select'), 'Particular');
  cat.residencial = porNome(await get('/tipos-endereco/select'), 'Residencial');
  cat.portoAlegre = (await get('/cidades/select' + qs({ nome: 'Porto Alegre' })))
    .find((c) => c.nome === 'Porto Alegre' && c.estadoSigla === 'RS')?.id;

  const faltando = Object.entries(cat).filter(([, v]) => v === undefined).map(([k]) => k);
  conferir('catálogos do sistema encontrados', faltando.length === 0, faltando.join(', '));
  if (faltando.length) falhar('catálogo ausente: ' + faltando.join(', '));
}

// ─── Pessoas ────────────────────────────────────────────────────────────────

const pessoas = {}; // nome → resposta completa

async function garantirPessoa(p, tipoId, i) {
  const achadas = await get('/pessoas' + qs({ nome: p.nome, size: 20 }));
  const existente = achadas.content.find((x) => x.nome === p.nome);
  if (existente) {
    contar('pessoas', 'reaproveitado');
    pessoas[p.nome] = existente;
    return existente;
  }
  const primeiro = p.nome.split(' ')[0].normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const ultimo = p.nome.split(' ').at(-1).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const corpo = {
    nome: p.nome,
    tipoPessoa: 'PESSOA_FISICA',
    dataNascimento: p.nasc,
    cpf: cpfDe(p.nome),
    sexo: p.sexo,
    observacao: 'Cadastro de demonstração.',
    tiposCadastroIds: [tipoId],
    telefones: [{ tipoTelefoneId: cat.celular, numero: `519${String(91000000 + hash(p.nome) % 8999999).slice(0, 8)}`, principal: true }],
    emails: [{ tipoEmailId: cat.emailParticular, email: `${primeiro}.${ultimo}@exemplo.com.br`, principal: true }],
    enderecos: p.bairro ? [{
      tipoEnderecoId: cat.residencial, cidadeId: cat.portoAlegre,
      cep: `90${String(100 + (hash(p.bairro) % 800)).padStart(3, '0')}-${String(100 + i * 37).slice(0, 3)}`,
      rua: ['Rua Felipe Camarão', 'Av. Protásio Alves', 'Rua José do Patrocínio', 'Av. Ipiranga', 'Rua Dona Laura'][i % 5],
      numero: String(100 + i * 47), bairro: p.bairro, principal: true,
    }] : [],
  };
  const criada = await post('/pessoas', corpo);
  contar('pessoas', 'criado');
  pessoas[p.nome] = criada;
  return criada;
}

const idDe = (nome) => pessoas[nome]?.id;

// ─── Serviços ───────────────────────────────────────────────────────────────

/** `valor: null` é de propósito: o serviço sem valor informado, que não é zero. */
const SERVICOS = [
  { nome: 'Visita técnica', valor: 90, observacao: 'Cadastro de demonstração.' },
  { nome: 'Instalação', valor: 150 },
  { nome: 'Orçamento', valor: null, observacao: 'Valor combinado a cada pedido.' },
];

const servicos = {}; // nome → resposta completa

/** O valor vai para a primeira filial ativa do tenant, se houver alguma. */
async function garantirServico(sv, filiais) {
  const achados = await get('/servicos' + qs({ termo: sv.nome, size: 20 }));
  const existente = achados.content.find((x) => x.nome === sv.nome);
  if (existente) {
    contar('serviços', 'reaproveitado');
    servicos[sv.nome] = existente;
    return existente;
  }
  const criado = await post('/servicos', {
    nome: sv.nome,
    observacao: sv.observacao,
    filiais: filiais.length ? [{ filialId: filiais[0].id, valor: sv.valor }] : [],
  });
  contar('serviços', 'criado');
  servicos[sv.nome] = criado;
  return criado;
}

// ─── Conferência: reler tudo ────────────────────────────────────────────────

async function conferirTudo() {
  for (const p of [...CLIENTES, ...FORNECEDORES, ...FUNCIONARIOS]) {
    const id = idDe(p.nome);
    if (!id) continue;
    await passo(`pessoa ${p.nome}`, async () => {
      const r = await get('/pessoas/' + id);
      conferir(`pessoa "${p.nome}" relida`, r.nome === p.nome && r.sexo === p.sexo && r.tiposCadastro.length > 0,
        `sexo ${r.sexo}, ${r.tiposCadastro.map((t) => t.nome).join('/')}`);
    });
  }

  for (const sv of SERVICOS) {
    const id = servicos[sv.nome]?.id;
    if (!id) continue;
    await passo(`serviço ${sv.nome}`, async () => {
      const r = await get('/servicos/' + id);
      conferir(`serviço "${sv.nome}" relido, código ${r.codigo}`, r.nome === sv.nome && Number.isInteger(r.codigo));
    });
  }

  const rotas = [
    ['/pessoas', { tipoCadastroId: cat.cliente, ativo: true }], ['/pessoas', { nome: 'Ferreira' }],
    ['/pessoas', { documento: cpfDe('Antônio Carlos Ferreira') }], ['/pessoas/select', { termo: 'Maria', tipoCadastroId: cat.cliente }],
    ['/servicos', { ativo: true }], ['/servicos/select', { termo: 'Inst' }],
  ];
  for (const [rota, filtros] of rotas)
    await passo(`GET ${rota}`, async () => {
      const r = await get(rota + qs(filtros));
      const n = Array.isArray(r) ? r.length : r?.totalElements;
      conferir(`GET ${rota}${Object.keys(filtros).length ? ' com filtro' : ''} → 200`, true, n != null ? `${n} linhas` : '');
    });
}

// ─── Execução ───────────────────────────────────────────────────────────────

console.log(`Populando ${BASE} — hoje é ${HOJE} (São Paulo).`);
await entrar();
await carregarCatalogos();

for (const [i, p] of CLIENTES.entries()) await passo(`pessoa ${p.nome}`, () => garantirPessoa(p, cat.cliente, i));
for (const [i, p] of FORNECEDORES.entries()) await passo(`pessoa ${p.nome}`, () => garantirPessoa(p, cat.fornecedor, i + 6));
for (const [i, p] of FUNCIONARIOS.entries()) await passo(`pessoa ${p.nome}`, () => garantirPessoa(p, cat.funcionario, i + 8));

const filiaisAtivas = (await passo('filiais do tenant', () => get('/filiais/select'))) ?? [];
for (const sv of SERVICOS) await passo(`serviço ${sv.nome}`, () => garantirServico(sv, filiaisAtivas));

await conferirTudo();

// ─── Relatório ──────────────────────────────────────────────────────────────

console.log('\nRegistros');
for (const [modulo, c] of Object.entries(contagem))
  console.log(`  ${modulo.padEnd(24)} ${String(c.criado).padStart(3)} criados · ${String(c.reaproveitado).padStart(3)} reaproveitados`);

console.log('\nConferência');
for (const c of conferencias) console.log(`  ${c.ok ? '✔' : '✘'} ${c.nome}${c.detalhe ? `  — ${c.detalhe}` : ''}`);

const reprovadas = conferencias.filter((c) => !c.ok).length;
console.log(`\n${conferencias.length - reprovadas} de ${conferencias.length} conferências passaram.`);
if (erros.length) {
  console.log('\nErros da API');
  for (const e of erros) console.log('  ' + e);
}
process.exit(reprovadas ? 1 : 0);
