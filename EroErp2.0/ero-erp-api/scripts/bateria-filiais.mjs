#!/usr/bin/env node
/**
 * Bateria de ponta a ponta dos cadastros de Filiais e Serviços, em VÁRIOS
 * tenants — pela API HTTP, contra a aplicação em execução. Cria dados de
 * demonstração e confere, de fora, o que os testes de integração conferem de
 * dentro: cada tenant enxerga só as suas pessoas, filiais e serviços.
 *
 *   node ero-erp-api/scripts/bateria-filiais.mjs
 *   BATERIA_EMAIL=... BATERIA_SENHA=... node ero-erp-api/scripts/bateria-filiais.mjs
 *
 * Sem as variáveis, entra com o SUPERADMIN_EMAIL/SUPERADMIN_PASSWORD do
 * `ero-erp-api/.env` (local, fora do git).
 *
 * Variáveis:
 *   BATERIA_API    base da API (padrão http://localhost:8080). Só aceita
 *                  localhost ou 127.0.0.1: este script NUNCA roda em produção.
 *   BATERIA_EMAIL  e-mail de um SUPERADMIN — é ele quem abre os tenants e
 *   BATERIA_SENHA  os usuários. Nenhuma das duas é impressa.
 *
 * O que ele cria (e reaproveita, se já existir — rodar de novo não duplica):
 *   - 3 tenants de demonstração, cada um com um ADMIN e um USER sem permissão;
 *   - em cada tenant, pessoas e filiais próprias (um deles com DUAS matrizes:
 *     negócios separados), e um mesmo fornecedor (mesmo CNPJ) nos três —
 *     documento é único por tenant, não no sistema;
 *   - em cada tenant, serviços com valor por filial (alguns sem valor: vazio
 *     não é zero), com o código curto contado dentro do tenant.
 * Os usuários criados entram com a senha de demonstração impressa no fim.
 *
 * Nada é apagado. Sai com código 1 se qualquer conferência falhar.
 */

import { readFileSync } from 'node:fs'

// ─── Ambiente: só local, credencial por variável ou pelo .env local ─────────

const BASE = (process.env.BATERIA_API ?? 'http://localhost:8080').replace(/\/+$/, '')
const falhar = (msg) => { console.error('ERRO: ' + msg); process.exit(2) }
{
  let host
  try { host = new URL(BASE).hostname } catch { falhar(`BATERIA_API inválida: ${BASE}`) }
  if (host !== 'localhost' && host !== '127.0.0.1')
    falhar(`recuso rodar contra "${host}" — esta bateria só roda na API local.`)
}
/**
 * Sem BATERIA_EMAIL/BATERIA_SENHA, usa o superadmin do `ero-erp-api/.env`
 * (SUPERADMIN_EMAIL/SUPERADMIN_PASSWORD) — o arquivo local, fora do git.
 */
function lerDotEnv() {
  try {
    const caminho = new URL('../.env', import.meta.url)
    return Object.fromEntries(readFileSync(caminho, 'utf8').split(/\r?\n/)
      .map((l) => l.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/))
      .filter(Boolean)
      .map(([, k, v]) => [k, v.replace(/^"(.*)"$/, '$1')]))
  } catch {
    return {}
  }
}
const dotEnv = lerDotEnv()
const EMAIL = process.env.BATERIA_EMAIL ?? dotEnv.SUPERADMIN_EMAIL
const SENHA = process.env.BATERIA_SENHA ?? dotEnv.SUPERADMIN_PASSWORD
if (!EMAIL || !SENHA)
  falhar('defina BATERIA_EMAIL e BATERIA_SENHA (de um superadmin), ou SUPERADMIN_* no ero-erp-api/.env.')

/** Senha dos usuários de demonstração que a bateria cria. Só para dev local. */
const SENHA_DEMO = 'Demo@Filiais2026'

// ─── HTTP ───────────────────────────────────────────────────────────────────

class ErroApi extends Error {
  constructor(metodo, caminho, status, corpo) {
    const msg = corpo && typeof corpo === 'object' ? (corpo.erro ?? JSON.stringify(corpo)) : corpo
    super(`${metodo} ${caminho} → ${status}: ${String(msg).slice(0, 200)}`)
    this.status = status
  }
}

/**
 * Um login por usuário, guardado: o `/auth/login` tem limite por minuto
 * (Bucket4j), e a permissão é relida do banco a cada requisição — o mesmo
 * token serve antes e depois de mudar o acesso.
 */
const tokens = new Map()
async function login(email, senha) {
  if (tokens.has(email)) return tokens.get(email)
  const tentar = () => fetch(BASE + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, senha }),
  })
  let r = await tentar()
  if (r.status === 429) {
    console.log('  … limite de login por minuto atingido; esperando o balde recarregar (65 s)')
    await new Promise((ok) => setTimeout(ok, 65_000))
    r = await tentar()
  }
  /* Login que falha conta tentativa no bloqueio da conta: não insistir. */
  if (!r.ok) falhar(`login de ${email === EMAIL ? 'BATERIA_EMAIL' : email} recusado (${r.status}).`)
  const token = (await r.json()).accessToken
  tokens.set(email, token)
  return token
}

/** Um cliente HTTP preso a um token — cada usuário da bateria tem o seu. */
function sessao(token) {
  const s = {
    token,
    async chamar(metodo, caminho, corpo) {
      const r = await fetch(BASE + caminho, {
        method: metodo,
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + s.token },
        body: corpo === undefined ? undefined : JSON.stringify(corpo),
      })
      const texto = await r.text()
      let json = null
      try { json = texto ? JSON.parse(texto) : null } catch { json = texto }
      return { status: r.status, json }
    },
    async api(metodo, caminho, corpo) {
      const { status, json } = await s.chamar(metodo, caminho, corpo)
      if (status >= 400) throw new ErroApi(metodo, caminho, status, json)
      return json
    },
    get: (c) => s.api('GET', c),
    post: (c, b) => s.api('POST', c, b),
    put: (c, b) => s.api('PUT', c, b),
    patch: (c) => s.api('PATCH', c),
  }
  return s
}

const q = (o) => '?' + new URLSearchParams(Object.entries(o).filter(([, v]) => v !== undefined)).toString()

// ─── Conferências ───────────────────────────────────────────────────────────

const resultados = []
function conferir(grupo, descricao, ok, detalhe = '') {
  resultados.push({ grupo, descricao, ok: !!ok, detalhe })
}
async function conferirStatus(grupo, descricao, promessa, esperado) {
  const { status, json } = await promessa
  const msg = json && typeof json === 'object' && json.erro ? ` — "${json.erro}"` : ''
  conferir(grupo, descricao, status === esperado, `esperado ${esperado}, veio ${status}${msg}`)
}

// ─── Documentos válidos, gerados de uma semente ─────────────────────────────

function digito(base, pesos) {
  const s = base.reduce((a, d, i) => a + d * pesos[i], 0) % 11
  return s < 2 ? 0 : 11 - s
}
function cnpj(semente) {
  const b = String(semente).padStart(8, '0').concat('0001').split('').map(Number)
  const d1 = digito(b, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
  const d2 = digito([...b, d1], [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
  return b.join('') + d1 + d2
}
function cpf(semente) {
  const b = String(semente).padStart(9, '0').split('').map(Number)
  const d1 = digito(b, [10, 9, 8, 7, 6, 5, 4, 3, 2])
  const d2 = digito([...b, d1], [11, 10, 9, 8, 7, 6, 5, 4, 3, 2])
  return b.join('') + d1 + d2
}

// ─── O cenário ──────────────────────────────────────────────────────────────

/** O mesmo fornecedor nos três tenants: mesmo CNPJ, três cadastros. */
const FORNECEDOR = { nome: 'Distribuidora Sul Atacado Ltda', cnpj: cnpj(70707070), cidade: 'Porto Alegre' }

const TENANTS = [
  {
    nome: 'Mercado Bom Preço (demo)',
    slug: 'bompreco',
    paleta: 'PADRAO',
    pessoas: [
      { nome: 'Mercado Bom Preço Ltda', fantasia: 'Bom Preço', cnpj: cnpj(31313131), cidade: 'Porto Alegre' },
      { nome: 'Mercado Bom Preço Centro Ltda', fantasia: 'Bom Preço Centro', cnpj: cnpj(31313132), cidade: 'Porto Alegre' },
      { nome: 'Mercado Bom Preço Canoas Ltda', fantasia: 'Bom Preço Canoas', cnpj: cnpj(31313133), cidade: 'Canoas' },
      { nome: 'Ana Paula Souza', cpf: cpf(123123123), cidade: 'Porto Alegre', tipo: 'Cliente' },
    ],
    filiais: [
      { pessoa: 'Mercado Bom Preço Ltda', tipo: 'MATRIZ', cor: '#3B82F6' },
      { pessoa: 'Mercado Bom Preço Centro Ltda', tipo: 'FILIAL', matriz: 'Mercado Bom Preço Ltda', cor: '#10B981' },
      { pessoa: 'Mercado Bom Preço Canoas Ltda', tipo: 'FILIAL', matriz: 'Mercado Bom Preço Ltda', cor: '#F59E0B' },
    ],
    servicos: [
      {
        nome: 'Entrega em domicílio',
        valores: { 'Mercado Bom Preço Ltda': 15, 'Mercado Bom Preço Centro Ltda': 15, 'Mercado Bom Preço Canoas Ltda': 20 },
      },
      // No Centro o valor não foi informado: fica vazio, não zero.
      { nome: 'Montagem de cesta básica', valores: { 'Mercado Bom Preço Ltda': 8.5, 'Mercado Bom Preço Centro Ltda': null } },
      { nome: 'Encomenda especial', observacao: 'Valor combinado com o cliente a cada pedido.', valores: {} },
    ],
  },
  {
    // Dois negócios separados no mesmo tenant: duas matrizes.
    nome: 'Grupo Vida Plena (demo)',
    slug: 'vidaplena',
    paleta: 'PADRAO',
    pessoas: [
      { nome: 'Clínica Vida Plena Ltda', fantasia: 'Clínica Vida Plena', cnpj: cnpj(42424241), cidade: 'Caxias do Sul' },
      { nome: 'Clínica Vida Plena Bento Ltda', fantasia: 'Vida Plena Bento', cnpj: cnpj(42424242), cidade: 'Bento Gonçalves' },
      { nome: 'Farmácia Vida Plena Ltda', fantasia: 'Farmácia Vida Plena', cnpj: cnpj(42424243), cidade: 'Caxias do Sul' },
      { nome: 'Dra. Helena Martins', cpf: cpf(456456456), cidade: 'Caxias do Sul', tipo: 'Funcionário' },
    ],
    filiais: [
      { pessoa: 'Clínica Vida Plena Ltda', tipo: 'MATRIZ', cor: '#8B5CF6' },
      { pessoa: 'Clínica Vida Plena Bento Ltda', tipo: 'FILIAL', matriz: 'Clínica Vida Plena Ltda', cor: '#EC4899' },
      { pessoa: 'Farmácia Vida Plena Ltda', tipo: 'MATRIZ', cor: '#14B8A6' },
      // Consultório com CPF: filial também pode ser pessoa física.
      { pessoa: 'Dra. Helena Martins', tipo: 'FILIAL', matriz: 'Clínica Vida Plena Ltda', cor: '#64748B' },
    ],
    servicos: [
      {
        nome: 'Consulta clínica',
        valores: { 'Clínica Vida Plena Ltda': 250, 'Clínica Vida Plena Bento Ltda': 220, 'Dra. Helena Martins': 300 },
      },
      // Zero informado, que é diferente de vazio.
      {
        nome: 'Retorno de consulta',
        observacao: 'Gratuito até 30 dias depois da consulta.',
        valores: { 'Clínica Vida Plena Ltda': 0, 'Clínica Vida Plena Bento Ltda': 0 },
      },
      { nome: 'Aplicação de injetável', valores: { 'Farmácia Vida Plena Ltda': 12 } },
    ],
  },
  {
    nome: 'Auto Center Rápido (demo)',
    slug: 'autorapido',
    paleta: 'PADRAO',
    pessoas: [
      { nome: 'Auto Center Rápido Ltda', fantasia: 'Auto Rápido', cnpj: cnpj(53535351), cidade: 'Pelotas' },
      { nome: 'Auto Center Rápido Rio Grande Ltda', fantasia: 'Auto Rápido RG', cnpj: cnpj(53535352), cidade: 'Rio Grande' },
    ],
    filiais: [
      { pessoa: 'Auto Center Rápido Ltda', tipo: 'MATRIZ', cor: '#EF4444' },
      // Esta fica inativa no fim: a lista mostra o filtro de situação.
      { pessoa: 'Auto Center Rápido Rio Grande Ltda', tipo: 'FILIAL', matriz: 'Auto Center Rápido Ltda', cor: '#F59E0B', inativa: true },
    ],
    servicos: [
      // A filial de Rio Grande fica inativa no fim; o valor dela continua aqui.
      { nome: 'Alinhamento e balanceamento', valores: { 'Auto Center Rápido Ltda': 120, 'Auto Center Rápido Rio Grande Ltda': 110 } },
      { nome: 'Troca de óleo (mão de obra)', valores: { 'Auto Center Rápido Ltda': 40 } },
      { nome: 'Diagnóstico eletrônico', observacao: 'Orçamento depois da avaliação.', valores: {} },
    ],
  },
]

// ─── Execução ───────────────────────────────────────────────────────────────

const root = sessao(await login(EMAIL, SENHA))
const perfil = await root.get('/usuarios/perfil')
if (perfil.role !== 'SUPERADMIN') falhar('BATERIA_EMAIL precisa ser de um SUPERADMIN.')

const tiposCadastro = await root.get('/tipos-cadastro/select')
const tiposEndereco = await root.get('/tipos-endereco/select')
const idTipoCadastro = (nome) => tiposCadastro.find((t) => t.nome === nome)?.id
const comercial = tiposEndereco.find((t) => t.nome === 'Comercial')?.id ?? tiposEndereco[0].id
const cidades = {}
async function idCidade(nome) {
  if (!cidades[nome]) {
    const achadas = await root.get('/cidades/select' + q({ nome }))
    cidades[nome] = (achadas.find((c) => c.nome === nome && c.estadoSigla === 'RS') ?? achadas[0]).id
  }
  return cidades[nome]
}

/** Entra no tenant como superadmin: a escrita é sempre no tenant efetivo. */
async function entrarNoTenant(tenantId) {
  const r = await root.post(`/auth/switch-tenant/${tenantId}`)
  return sessao(r.accessToken)
}

async function garantirTenant(t) {
  const achados = await root.get('/tenants' + q({ nome: t.nome, size: 5 }))
  const existente = achados.content.find((x) => x.nome === t.nome)
  if (existente) return existente.id
  return (await root.post('/tenants', { nome: t.nome, periodoAcesso: 'INDETERMINADO', paleta: t.paleta })).id
}

async function garantirUsuario(tenantId, email, nome, role) {
  const achados = await root.get('/usuarios/global' + q({ email, size: 5 }))
  const existente = achados.content.find((u) => u.email === email)
  if (existente) return existente.id
  return (await root.post('/usuarios', {
    nome, email, senha: SENHA_DEMO, role, tenantId, permissoes: [],
  })).id
}

async function garantirPessoa(s, p) {
  const achadas = await s.get('/pessoas' + q({ nome: p.nome, size: 5 }))
  const existente = achadas.content.find((x) => x.nome === p.nome)
  if (existente) return existente
  const pj = !!p.cnpj
  return s.post('/pessoas', {
    nome: p.nome,
    tipoPessoa: pj ? 'PESSOA_JURIDICA' : 'PESSOA_FISICA',
    cnpj: p.cnpj,
    cpf: p.cpf,
    razaoSocial: pj ? p.nome : undefined,
    nomeFantasia: p.fantasia,
    tiposCadastroIds: [idTipoCadastro(p.tipo ?? 'Outros')],
    enderecos: [{
      tipoEnderecoId: comercial,
      cidadeId: await idCidade(p.cidade),
      cep: '90000000',
      rua: 'Avenida Principal',
      numero: String(100 + (p.nome.length * 7) % 900),
      bairro: 'Centro',
      principal: true,
    }],
  })
}

async function garantirFilial(s, f, pessoaId, matrizId) {
  const achadas = await s.get('/filiais' + q({ size: 100 }))
  const existente = achadas.content.find((x) => x.pessoaId === pessoaId)
  if (existente) {
    // A inativa da rodada anterior volta a ativa durante a montagem — serviço
    // novo só aceita filial ativa. A seção 3 a inativa de novo.
    if (!existente.ativo) await s.patch(`/filiais/${existente.id}/ativo?ativo=true`)
    return existente
  }
  return s.post('/filiais', { pessoaId, tipo: f.tipo, matrizId, cor: f.cor })
}

async function garantirServico(s, sv, filiais) {
  const achados = await s.get('/servicos' + q({ termo: sv.nome, size: 20 }))
  const existente = achados.content.find((x) => x.nome === sv.nome)
  if (existente) return existente
  return s.post('/servicos', {
    nome: sv.nome,
    observacao: sv.observacao,
    filiais: Object.entries(sv.valores).map(([pessoa, valor]) => ({ filialId: filiais[pessoa], valor })),
  })
}

console.log(`\nBateria de Filiais em ${BASE}\n`)

const montados = []
for (const t of TENANTS) {
  const tenantId = await garantirTenant(t)
  const adminEmail = `admin@${t.slug}.demo.local`
  const userEmail = `usuario@${t.slug}.demo.local`
  await garantirUsuario(tenantId, adminEmail, `Admin ${t.nome.replace(' (demo)', '')}`, 'ADMIN')
  const userId = await garantirUsuario(tenantId, userEmail, `Usuário ${t.nome.replace(' (demo)', '')}`, 'USER')

  const s = await entrarNoTenant(tenantId)
  const pessoas = {}
  for (const p of [...t.pessoas, { ...FORNECEDOR, tipo: 'Fornecedor' }]) {
    pessoas[p.nome] = (await garantirPessoa(s, p)).id
  }
  const filiais = {}
  for (const f of t.filiais) {
    const filial = await garantirFilial(s, f, pessoas[f.pessoa], f.matriz ? filiais[f.matriz] : undefined)
    filiais[f.pessoa] = filial.id
  }
  const servicos = {}
  for (const sv of t.servicos) {
    servicos[sv.nome] = (await garantirServico(s, sv, filiais)).id
  }
  montados.push({ t, tenantId, adminEmail, userEmail, userId, pessoas, filiais, servicos })
  console.log(`  ✓ ${t.nome}: ${Object.keys(pessoas).length} pessoas, ${t.filiais.length} filiais, ${t.servicos.length} serviços`)
}

// ─── 1. Cada tenant vê só o que é dele ──────────────────────────────────────

for (const m of montados) {
  const admin = sessao(await login(m.adminEmail, SENHA_DEMO))
  const g = `Isolamento · ${m.t.nome}`
  const lista = await admin.get('/filiais' + q({ size: 100 }))
  const esperadas = m.t.filiais.map((f) => f.pessoa).sort()
  const vistas = lista.content.map((f) => f.pessoaNome).sort()
  conferir(g, `lista de filiais traz exatamente as ${esperadas.length} do tenant`,
    JSON.stringify(esperadas) === JSON.stringify(vistas), `vistas: ${vistas.join(', ')}`)

  const pessoas = await admin.get('/pessoas' + q({ size: 100 }))
  conferir(g, `lista de pessoas traz só as ${m.t.pessoas.length + 1} do tenant`,
    pessoas.totalElements === m.t.pessoas.length + 1, `vieram ${pessoas.totalElements}`)

  const combo = await admin.get('/filiais/select')
  conferir(g, '/select não vaza filial de outro tenant',
    combo.every((c) => Object.values(m.filiais).includes(c.id)))

  for (const outro of montados.filter((x) => x !== m)) {
    const idAlheio = Object.values(outro.filiais)[0]
    await conferirStatus(g, `abrir filial de "${outro.t.nome}" → 404`, admin.chamar('GET', `/filiais/${idAlheio}`), 404)
    await conferirStatus(g, `inativar filial de "${outro.t.nome}" → 404`,
      admin.chamar('PATCH', `/filiais/${idAlheio}/ativo?ativo=false`), 404)
    const pessoaAlheia = outro.pessoas[outro.t.pessoas[0].nome]
    await conferirStatus(g, `usar pessoa de "${outro.t.nome}" como filial → 404`,
      admin.chamar('POST', '/filiais', { pessoaId: pessoaAlheia, tipo: 'MATRIZ', cor: '#000000' }), 404)
    const minhaLivre = m.pessoas[FORNECEDOR.nome]
    await conferirStatus(g, `pendurar filial numa matriz de "${outro.t.nome}" → 404`,
      admin.chamar('POST', '/filiais', { pessoaId: minhaLivre, tipo: 'FILIAL', matrizId: idAlheio, cor: '#000000' }), 404)
  }
}

// O mesmo CNPJ existe nos três: unicidade de documento é por tenant.
{
  const ids = montados.map((m) => m.pessoas[FORNECEDOR.nome])
  conferir('Documento por tenant', `"${FORNECEDOR.nome}" (mesmo CNPJ) cadastrado nos 3 tenants`,
    new Set(ids).size === montados.length)
}

// ─── 2. Regras, no tenant com duas matrizes ─────────────────────────────────

{
  const m = montados[1]
  const admin = sessao(await login(m.adminEmail, SENHA_DEMO))
  const g = `Regras · ${m.t.nome}`
  const matrizes = await admin.get('/filiais' + q({ tipo: 'MATRIZ' }))
  conferir(g, 'duas matrizes no mesmo tenant', matrizes.totalElements === 2, `vieram ${matrizes.totalElements}`)

  const clinica = m.filiais['Clínica Vida Plena Ltda']
  const farmacia = m.filiais['Farmácia Vida Plena Ltda']
  const bento = m.filiais['Clínica Vida Plena Bento Ltda']
  await conferirStatus(g, 'inativar matriz com filiais ativas → 409', admin.chamar('PATCH', `/filiais/${clinica}/ativo?ativo=false`), 409)
  await conferirStatus(g, 'FILIAL sem matriz → 400',
    admin.chamar('POST', '/filiais', { pessoaId: m.pessoas[FORNECEDOR.nome], tipo: 'FILIAL', cor: '#000000' }), 400)
  await conferirStatus(g, 'matriz que é FILIAL → 409',
    admin.chamar('POST', '/filiais', { pessoaId: m.pessoas[FORNECEDOR.nome], tipo: 'FILIAL', matrizId: bento, cor: '#000000' }), 409)
  await conferirStatus(g, 'mesma pessoa duas vezes → 409',
    admin.chamar('POST', '/filiais', { pessoaId: m.pessoas['Farmácia Vida Plena Ltda'], tipo: 'MATRIZ', cor: '#000000' }), 409)
  await conferirStatus(g, 'cor fora de #RRGGBB → 400',
    admin.chamar('POST', '/filiais', { pessoaId: m.pessoas[FORNECEDOR.nome], tipo: 'MATRIZ', cor: 'verde' }), 400)

  const ordem = (await admin.get('/filiais' + q({ size: 100 }))).content.map((f) => f.pessoaNome)
  conferir(g, 'lista agrupa cada matriz com as suas filiais',
    ordem[0] === 'Clínica Vida Plena Ltda' && ordem.at(-1) === 'Farmácia Vida Plena Ltda', ordem.join(' › '))
  conferir(g, 'a farmácia (outra matriz) não tem filial', !ordem.slice(1, -1).includes('Farmácia Vida Plena Ltda'))
  void farmacia
}

// ─── 3. Situação: a filial inativa do terceiro tenant ───────────────────────

{
  const m = montados[2]
  const admin = sessao(await login(m.adminEmail, SENHA_DEMO))
  const g = `Situação · ${m.t.nome}`
  for (const f of m.t.filiais.filter((x) => x.inativa)) {
    const id = m.filiais[f.pessoa]
    const atual = await admin.get(`/filiais/${id}`)
    if (atual.ativo) await admin.patch(`/filiais/${id}/ativo?ativo=false`)
  }
  const ativas = await admin.get('/filiais' + q({ ativo: true }))
  const inativas = await admin.get('/filiais' + q({ ativo: false }))
  conferir(g, 'filtro de situação separa ativa e inativa',
    ativas.totalElements === 1 && inativas.totalElements === 1, `ativas ${ativas.totalElements}, inativas ${inativas.totalElements}`)
  const combo = await admin.get('/filiais/select')
  conferir(g, 'filial inativa some do combo', combo.length === 1)
  const matriz = m.filiais['Auto Center Rápido Ltda']
  await conferirStatus(g, 'reativar filial com matriz ativa → 200',
    admin.chamar('PATCH', `/filiais/${m.filiais['Auto Center Rápido Rio Grande Ltda']}/ativo?ativo=true`), 200)
  await admin.patch(`/filiais/${m.filiais['Auto Center Rápido Rio Grande Ltda']}/ativo?ativo=false`)
  void matriz
}

// ─── 4. Permissão do USER: Pessoas e Filiais são módulos separados ──────────

{
  const m = montados[0]
  const g = `Permissão · ${m.t.nome}`
  const comoUser = async () => sessao(await login(m.userEmail, SENHA_DEMO))
  const atualizarUser = async (permissoes) => {
    const s = await entrarNoTenant(m.tenantId)
    const u = await s.get(`/usuarios/${m.userId}`)
    await s.put(`/usuarios/${m.userId}`, {
      nome: u.nome, email: u.email, telefone: u.telefone, codigoPais: u.codigoPais, role: 'USER', permissoes,
    })
  }

  // Um token só: a permissão muda e vale na requisição seguinte.
  await atualizarUser([])
  const u = await comoUser()
  await conferirStatus(g, 'USER sem permissão não lista filiais → 403', u.chamar('GET', '/filiais'), 403)
  await conferirStatus(g, 'mas usa o /select dos combos → 200', u.chamar('GET', '/filiais/select'), 200)

  await atualizarUser([{ tela: 'PESSOAS', nivel: 'ESCRITA' }])
  await conferirStatus(g, 'Pessoas liberada não abre Filiais → 403', u.chamar('GET', '/filiais'), 403)

  await atualizarUser([{ tela: 'FILIAIS', nivel: 'LEITURA' }])
  await conferirStatus(g, 'Filiais em leitura lista → 200', u.chamar('GET', '/filiais'), 200)
  await conferirStatus(g, 'Filiais em leitura não grava → 403',
    u.chamar('POST', '/filiais', { pessoaId: m.pessoas[FORNECEDOR.nome], tipo: 'MATRIZ', cor: '#000000' }), 403)

  await conferirStatus(g, 'Filiais liberada não abre Serviços → 403', u.chamar('GET', '/servicos'), 403)
  await conferirStatus(g, 'mas usa o /select de serviços → 200', u.chamar('GET', '/servicos/select'), 200)

  await atualizarUser([{ tela: 'FILIAIS', nivel: 'LEITURA' }, { tela: 'SERVICOS', nivel: 'LEITURA' }])
  await conferirStatus(g, 'Serviços em leitura lista → 200', u.chamar('GET', '/servicos'), 200)
  await conferirStatus(g, 'Serviços em leitura não grava → 403',
    u.chamar('POST', '/servicos', { nome: 'Serviço do USER', filiais: [] }), 403)

  // Fica assim para você ver o menu e as telas só de leitura com este usuário.
}

// ─── 5. Serviços: código por tenant, valor por filial, isolamento ──────────

for (const m of montados) {
  const admin = sessao(await login(m.adminEmail, SENHA_DEMO))
  const g = `Serviços · ${m.t.nome}`
  const lista = (await admin.get('/servicos' + q({ size: 100 }))).content
  const esperados = m.t.servicos.map((sv) => sv.nome).sort()
  const vistos = lista.map((sv) => sv.nome).sort()
  conferir(g, `lista traz exatamente os ${esperados.length} serviços do tenant`,
    JSON.stringify(esperados) === JSON.stringify(vistos), `vistos: ${vistos.join(', ')}`)
  const codigos = lista.map((sv) => sv.codigo)
  conferir(g, 'código curto, sem repetir dentro do tenant',
    new Set(codigos).size === codigos.length && codigos.every((c) => Number.isInteger(c) && c >= 1), codigos.join(', '))

  const combo = await admin.get('/servicos/select')
  conferir(g, '/select não vaza serviço de outro tenant e não traz valor',
    combo.every((c) => Object.values(m.servicos).includes(c.id) && c.filiais === undefined))

  for (const sv of m.t.servicos) {
    const gravado = lista.find((x) => x.nome === sv.nome)
    const confere = !!gravado && gravado.filiais.length === Object.keys(sv.valores).length
      && Object.entries(sv.valores).every(([pessoa, valor]) => {
        const linha = gravado.filiais.find((l) => l.filialId === m.filiais[pessoa])
        return linha && (linha.valor ?? null) === valor
      })
    conferir(g, `"${sv.nome}": valores por filial como cadastrados (vazio continua vazio)`, confere)
  }

  for (const outro of montados.filter((x) => x !== m)) {
    const idAlheio = Object.values(outro.servicos)[0]
    await conferirStatus(g, `abrir serviço de "${outro.t.nome}" → 404`, admin.chamar('GET', `/servicos/${idAlheio}`), 404)
    await conferirStatus(g, `inativar serviço de "${outro.t.nome}" → 404`,
      admin.chamar('PATCH', `/servicos/${idAlheio}/ativo?ativo=false`), 404)
    await conferirStatus(g, `dar valor numa filial de "${outro.t.nome}" → 404`,
      admin.chamar('POST', '/servicos', {
        nome: 'Serviço com filial alheia', filiais: [{ filialId: Object.values(outro.filiais)[0], valor: 1 }],
      }), 404)
  }
}

{
  const m = montados[0]
  const admin = sessao(await login(m.adminEmail, SENHA_DEMO))
  const g = `Serviços · regras · ${m.t.nome}`
  const matriz = m.filiais['Mercado Bom Preço Ltda']
  await conferirStatus(g, 'nome repetido, em maiúsculas e sem acento → 409',
    admin.chamar('POST', '/servicos', { nome: 'ENTREGA EM DOMICILIO', filiais: [] }), 409)
  await conferirStatus(g, 'a mesma filial duas vezes → 400',
    admin.chamar('POST', '/servicos', {
      nome: 'Serviço duplicado', filiais: [{ filialId: matriz, valor: 1 }, { filialId: matriz, valor: 2 }],
    }), 400)
  await conferirStatus(g, 'valor negativo → 400',
    admin.chamar('POST', '/servicos', { nome: 'Serviço negativo', filiais: [{ filialId: matriz, valor: -5 }] }), 400)
  const canoas = await admin.get('/servicos' + q({ filialId: m.filiais['Mercado Bom Preço Canoas Ltda'] }))
  conferir(g, 'filtro por filial traz só quem tem linha nela',
    canoas.totalElements === 1 && canoas.content[0].nome === 'Entrega em domicílio',
    canoas.content.map((sv) => sv.nome).join(', '))
}

{
  // A filial de Rio Grande foi inativada na seção 3: o valor dela fica.
  const m = montados[2]
  const admin = sessao(await login(m.adminEmail, SENHA_DEMO))
  const g = `Serviços · filial inativa · ${m.t.nome}`
  const rioGrande = m.filiais['Auto Center Rápido Rio Grande Ltda']
  const alinhamento = await admin.get(`/servicos/${m.servicos['Alinhamento e balanceamento']}`)
  const linha = alinhamento.filiais.find((l) => l.filialId === rioGrande)
  conferir(g, 'filial inativada depois continua na lista, com o valor e sinalizada',
    linha && linha.valor === 110 && linha.filialAtiva === false, JSON.stringify(linha))
  await conferirStatus(g, 'mas não entra num serviço novo → 409',
    admin.chamar('POST', '/servicos', { nome: 'Serviço em filial inativa', filiais: [{ filialId: rioGrande, valor: 1 }] }), 409)
}

// ─── Relatório ──────────────────────────────────────────────────────────────

let grupoAtual = ''
for (const r of resultados) {
  if (r.grupo !== grupoAtual) { console.log(`\n${r.grupo}`); grupoAtual = r.grupo }
  console.log(`  ${r.ok ? '✓' : '✗'} ${r.descricao}${r.ok ? '' : `  (${r.detalhe})`}`)
}
const falhas = resultados.filter((r) => !r.ok).length
console.log(`\n${resultados.length - falhas}/${resultados.length} conferências passaram.`)
console.log('\nUsuários de demonstração (senha ' + SENHA_DEMO + '):')
montados.forEach((m, i) => console.log(
  `  ${m.t.nome.padEnd(28)} ${m.adminEmail} (ADMIN) · ${m.userEmail} (USER, ${i === 0 ? 'Filiais e Serviços só leitura' : 'sem permissão'})`))
process.exit(falhas ? 1 : 0)
