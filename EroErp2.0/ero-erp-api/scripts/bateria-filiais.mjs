#!/usr/bin/env node
/**
 * Bateria de ponta a ponta de Filiais, Serviços, Produtos e Estoque, em VÁRIOS
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
 *     não é zero), com o código curto contado dentro do tenant;
 *   - em cada tenant, grupos, subgrupos, categorias e marcas de produto,
 *     produtos (o mesmo EAN em tenants diferentes; custo vazio e custo zero)
 *     e o estoque deles por filial, com preço de venda e saldo inicial — uma
 *     linha sem controle de estoque, que guarda só o preço.
 *   As transferências da bateria vão e voltam: rodar de novo não muda saldo.
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

/** Um EAN válido usado em dois tenants: a unicidade do EAN é por tenant. */
const EAN_COMUM = '7891000315507'

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
    produtos: [
      {
        nome: 'Refrigerante cola 2L', unidade: 'UN', ean: EAN_COMUM, grupo: 'Bebidas', subgrupo: 'Refrigerantes',
        categoria: 'Alimentos e bebidas', marca: 'Refri Sul', custo: 6.2, fornecedor: true,
        estoque: {
          'Mercado Bom Preço Ltda': { preco: 9.99, inicial: 48, minimo: 12 },
          'Mercado Bom Preço Centro Ltda': { preco: 9.99, inicial: 24 },
          'Mercado Bom Preço Canoas Ltda': { preco: 10.49, inicial: 12 },
        },
      },
      {
        nome: 'Arroz branco 5kg', unidade: 'UN', ean: '7891234567895', grupo: 'Mercearia', subgrupo: 'Grãos',
        categoria: 'Alimentos e bebidas', marca: 'Grão Bom', custo: 18.9,
        estoque: {
          'Mercado Bom Preço Ltda': { preco: 27.9, inicial: 30 },
          'Mercado Bom Preço Centro Ltda': { preco: 27.9, inicial: 10 },
        },
      },
      // Custo não informado (vazio, não zero), vendido a granel por quilo.
      {
        nome: 'Feijão preto a granel', unidade: 'KG', grupo: 'Mercearia', subgrupo: 'Grãos',
        estoque: { 'Mercado Bom Preço Ltda': { preco: 8.99, inicial: 25.5, minimo: 5 } },
      },
      // Custo zero informado; sem controle de estoque: a linha guarda só o preço.
      {
        nome: 'Sacola retornável', unidade: 'UN', custo: 0,
        estoque: { 'Mercado Bom Preço Ltda': { preco: 2.5, controla: false } },
      },
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
    produtos: [
      {
        nome: 'Dipirona 500mg (10 comprimidos)', unidade: 'CX', ean: '7896004700014', grupo: 'Medicamentos',
        subgrupo: 'Analgésicos', marca: 'Genérico', custo: 4.1, fornecedor: true,
        estoque: { 'Farmácia Vida Plena Ltda': { preco: 12.9, inicial: 40, minimo: 10 } },
      },
      {
        nome: 'Soro fisiológico 500ml', unidade: 'UN', ean: '7891012345608', grupo: 'Medicamentos',
        subgrupo: 'Soluções', custo: 3.75,
        estoque: { 'Farmácia Vida Plena Ltda': { preco: 8.5, inicial: 20 } },
      },
      // Material de consumo da clínica: estoque sem preço de venda.
      {
        nome: 'Seringa descartável 5ml', unidade: 'UN', grupo: 'Materiais', subgrupo: 'Descartáveis', custo: 0.42,
        estoque: {
          'Clínica Vida Plena Ltda': { inicial: 200, minimo: 50 },
          'Clínica Vida Plena Bento Ltda': { inicial: 50 },
        },
      },
      // O mesmo EAN do refrigerante do Mercado: EAN é único por tenant.
      {
        nome: 'Água mineral 500ml', unidade: 'UN', ean: EAN_COMUM, grupo: 'Bebidas', subgrupo: 'Águas',
        estoque: { 'Farmácia Vida Plena Ltda': { preco: 3.5, inicial: 36 } },
      },
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
    produtos: [
      // Litro: quantidade com casas.
      {
        nome: 'Óleo de motor 5W30', unidade: 'LT', ean: '7895550001231', grupo: 'Lubrificantes', subgrupo: 'Óleos',
        marca: 'Lubrimax', categoria: 'Manutenção', custo: 24.3, fornecedor: true,
        estoque: { 'Auto Center Rápido Ltda': { preco: 39.9, inicial: 60.5, minimo: 20 } },
      },
      {
        nome: 'Filtro de óleo', unidade: 'UN', ean: '7897770004566', grupo: 'Peças', subgrupo: 'Filtros',
        marca: 'Lubrimax', categoria: 'Manutenção', custo: 18,
        estoque: {
          'Auto Center Rápido Ltda': { preco: 35, inicial: 15 },
          // A filial de Rio Grande fica inativa no fim; o estoque dela fica.
          'Auto Center Rápido Rio Grande Ltda': { preco: 37, inicial: 5 },
        },
      },
      {
        nome: 'Palheta do limpador', unidade: 'PC', grupo: 'Peças', subgrupo: 'Acessórios',
        estoque: { 'Auto Center Rápido Ltda': { preco: 29.9, inicial: 8 } },
      },
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

const unidades = Object.fromEntries((await root.get('/unidades-medida/select')).map((u) => [u.sigla, u.id]))

/** Grupo, categoria ou marca, pelo nome exato. */
async function garantirAuxiliar(s, rota, nome) {
  const achados = await s.get(rota + q({ termo: nome, size: 20 }))
  const existente = achados.content.find((x) => x.nome === nome)
  if (existente) return existente.id
  return (await s.post(rota, { nome })).id
}

async function garantirSubgrupo(s, grupoId, nome) {
  const achados = await s.get('/subgrupos-produto' + q({ grupoId, termo: nome, size: 20 }))
  const existente = achados.content.find((x) => x.nome === nome)
  if (existente) return existente.id
  return (await s.post('/subgrupos-produto', { grupoId, nome })).id
}

async function garantirProduto(s, p, fornecedorId) {
  const achados = await s.get('/produtos' + q({ termo: p.nome, size: 20 }))
  const existente = achados.content.find((x) => x.nome === p.nome)
  if (existente) return existente
  const grupoId = p.grupo ? await garantirAuxiliar(s, '/grupos-produto', p.grupo) : undefined
  return s.post('/produtos', {
    nome: p.nome,
    unidadeMedidaId: unidades[p.unidade],
    ean: p.ean,
    subgrupoId: grupoId ? await garantirSubgrupo(s, grupoId, p.subgrupo) : undefined,
    categoriaId: p.categoria ? await garantirAuxiliar(s, '/categorias-produto', p.categoria) : undefined,
    marcaId: p.marca ? await garantirAuxiliar(s, '/marcas-produto', p.marca) : undefined,
    fornecedorId: p.fornecedor ? fornecedorId : undefined,
    custo: p.custo ?? null,
  })
}

/** A linha produto × filial; o saldo inicial só entra quando ela nasce. */
async function garantirEstoque(s, produtoId, filialId, e) {
  const achados = await s.get('/estoques' + q({ produtoId, filialId }))
  if (achados.content.length) return achados.content[0]
  return s.post('/estoques', {
    produtoId,
    filialId,
    precoVenda: e.preco ?? null,
    controlaEstoque: e.controla ?? true,
    quantidadeMinima: e.minimo ?? null,
    quantidadeInicial: e.inicial ?? null,
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
  const produtos = {}
  const estoques = {}
  for (const p of t.produtos) {
    produtos[p.nome] = (await garantirProduto(s, p, pessoas[FORNECEDOR.nome])).id
    for (const [pessoa, e] of Object.entries(p.estoque)) {
      estoques[`${p.nome} @ ${pessoa}`] = (await garantirEstoque(s, produtos[p.nome], filiais[pessoa], e)).id
    }
  }
  montados.push({ t, tenantId, adminEmail, userEmail, userId, pessoas, filiais, servicos, produtos, estoques })
  console.log(`  ✓ ${t.nome}: ${Object.keys(pessoas).length} pessoas, ${t.filiais.length} filiais, `
    + `${t.servicos.length} serviços, ${t.produtos.length} produtos, ${Object.keys(estoques).length} linhas de estoque`)
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

// ─── 6. Produtos e estoque: cada tenant vê só o que é dele ─────────────────

for (const m of montados) {
  const admin = sessao(await login(m.adminEmail, SENHA_DEMO))
  const g = `Produtos e estoque · ${m.t.nome}`

  const lista = (await admin.get('/produtos' + q({ size: 100 }))).content
  const esperados = m.t.produtos.map((p) => p.nome).sort()
  const vistos = lista.map((p) => p.nome).sort()
  conferir(g, `lista traz exatamente os ${esperados.length} produtos do tenant`,
    JSON.stringify(esperados) === JSON.stringify(vistos), `vistos: ${vistos.join(', ')}`)
  const codigos = lista.map((p) => p.codigo)
  conferir(g, 'código curto, sem repetir dentro do tenant',
    new Set(codigos).size === codigos.length && codigos.every((c) => Number.isInteger(c) && c >= 1), codigos.join(', '))
  conferir(g, 'custo como cadastrado (vazio continua vazio, zero é zero)',
    m.t.produtos.every((p) => (lista.find((x) => x.nome === p.nome)?.custo ?? null) === (p.custo ?? null)))

  const combo = await admin.get('/produtos/select')
  conferir(g, '/produtos/select não vaza produto de outro tenant e não traz custo',
    combo.every((c) => Object.values(m.produtos).includes(c.id) && c.custo === undefined))

  // As transferências da seção 7 vão e voltam: o saldo é sempre o inicial
  const linhas = (await admin.get('/estoques' + q({ size: 100 }))).content
  const cadastradas = m.t.produtos.flatMap((p) => Object.entries(p.estoque).map(([pessoa, e]) => ({ p, pessoa, e })))
  conferir(g, `estoque traz exatamente as ${cadastradas.length} linhas do tenant`, linhas.length === cadastradas.length,
    `vieram ${linhas.length}`)
  for (const { p, pessoa, e } of cadastradas) {
    const linha = linhas.find((l) => l.id === m.estoques[`${p.nome} @ ${pessoa}`])
    const confere = !!linha && linha.quantidade === (e.inicial ?? 0)
      && (linha.precoVenda ?? null) === (e.preco ?? null) && linha.controlaEstoque === (e.controla ?? true)
    conferir(g, `"${p.nome}" em ${pessoa}: saldo, preço e controle como cadastrados`, confere, JSON.stringify(linha))
  }

  for (const outro of montados.filter((x) => x !== m)) {
    const produtoAlheio = Object.values(outro.produtos)[0]
    const estoqueAlheio = Object.values(outro.estoques)[0]
    const filialAlheia = Object.values(outro.filiais)[0]
    await conferirStatus(g, `abrir produto de "${outro.t.nome}" → 404`, admin.chamar('GET', `/produtos/${produtoAlheio}`), 404)
    await conferirStatus(g, `abrir estoque de "${outro.t.nome}" → 404`, admin.chamar('GET', `/estoques/${estoqueAlheio}`), 404)
    await conferirStatus(g, `entrada no estoque de "${outro.t.nome}" → 404`,
      admin.chamar('POST', `/estoques/${estoqueAlheio}/entradas`, { quantidade: 1 }), 404)
    await conferirStatus(g, `abrir estoque de produto de "${outro.t.nome}" → 404`,
      admin.chamar('POST', '/estoques', {
        produtoId: produtoAlheio, filialId: Object.values(m.filiais)[0], controlaEstoque: true,
      }), 404)
    const combo = await admin.get('/estoques/movimentaveis' + q({ filialId: filialAlheia }))
    conferir(g, `combo de movimentação na filial de "${outro.t.nome}" vem vazio`, combo.length === 0)
  }
}

// ─── 7. Produtos e estoque: regras, no tenant do mercado ───────────────────

{
  const m = montados[0]
  const admin = sessao(await login(m.adminEmail, SENHA_DEMO))
  const g = `Produtos e estoque · regras · ${m.t.nome}`
  const un = unidades.UN
  const matriz = m.filiais['Mercado Bom Preço Ltda']
  const centro = m.filiais['Mercado Bom Preço Centro Ltda']
  const refri = m.produtos['Refrigerante cola 2L']

  await conferirStatus(g, 'nome repetido, em maiúsculas → 409',
    admin.chamar('POST', '/produtos', { nome: 'REFRIGERANTE COLA 2L', unidadeMedidaId: un }), 409)
  await conferirStatus(g, 'EAN com o dígito verificador errado → 400',
    admin.chamar('POST', '/produtos', { nome: 'Produto de EAN errado', unidadeMedidaId: un, ean: '7891000315508' }), 400)
  await conferirStatus(g, 'EAN de outro produto do tenant → 409',
    admin.chamar('POST', '/produtos', { nome: 'Produto de EAN repetido', unidadeMedidaId: un, ean: EAN_COMUM }), 409)
  await conferirStatus(g, 'o mesmo produto duas vezes na filial → 409',
    admin.chamar('POST', '/estoques', { produtoId: refri, filialId: matriz, controlaEstoque: true }), 409)

  const movimentaveis = await admin.get('/estoques/movimentaveis' + q({ filialId: matriz }))
  conferir(g, 'sem controle de estoque, a sacola não aparece na movimentação',
    !movimentaveis.some((x) => x.produtoNome === 'Sacola retornável') && movimentaveis.length === 3,
    movimentaveis.map((x) => x.produtoNome).join(', '))
  await conferirStatus(g, 'e não aceita entrada → 409',
    admin.chamar('POST', `/estoques/${m.estoques['Sacola retornável @ Mercado Bom Preço Ltda']}/entradas`, { quantidade: 1 }), 409)

  const idMatriz = m.estoques['Refrigerante cola 2L @ Mercado Bom Preço Ltda']
  const saldoMatriz = (await admin.get(`/estoques/${idMatriz}`)).quantidade
  await conferirStatus(g, 'transferir mais do que há → 409',
    admin.chamar('POST', '/estoques/transferencias', {
      produtoId: refri, filialOrigemId: matriz, filialDestinoId: centro, quantidade: saldoMatriz + 1,
    }), 409)
  await conferirStatus(g, 'ajuste para a mesma quantidade → 400',
    admin.chamar('POST', `/estoques/${idMatriz}/ajustes`, { quantidadeNova: saldoMatriz, motivo: 'Contagem' }), 400)

  const ida = await admin.post('/estoques/transferencias', {
    produtoId: refri, filialOrigemId: matriz, filialDestinoId: centro, quantidade: 6, motivo: 'Reposição (bateria)',
  })
  conferir(g, 'transferência grava saída negativa e entrada positiva, ligadas',
    ida[0].tipo === 'TRANSFERENCIA_SAIDA' && ida[0].quantidade === -6 && ida[1].quantidade === 6
      && ida[0].transferenciaId === ida[1].transferenciaId, JSON.stringify(ida.map((x) => [x.tipo, x.quantidade])))
  await admin.post('/estoques/transferencias', {
    produtoId: refri, filialOrigemId: centro, filialDestinoId: matriz, quantidade: 6, motivo: 'Devolução (bateria)',
  })
  conferir(g, 'ida e volta: o saldo da matriz é o de antes',
    (await admin.get(`/estoques/${idMatriz}`)).quantidade === saldoMatriz)
}

// ─── 8. Permissão do USER: Produtos, auxiliares e Estoque são telas à parte ─

{
  const m = montados[0]
  const g = `Permissão · produtos e estoque · ${m.t.nome}`
  const u = sessao(await login(m.userEmail, SENHA_DEMO))
  const atualizarUser = async (permissoes) => {
    const s = await entrarNoTenant(m.tenantId)
    const atual = await s.get(`/usuarios/${m.userId}`)
    await s.put(`/usuarios/${m.userId}`, {
      nome: atual.nome, email: atual.email, telefone: atual.telefone, codigoPais: atual.codigoPais, role: 'USER', permissoes,
    })
  }
  const base = [{ tela: 'FILIAIS', nivel: 'LEITURA' }, { tela: 'SERVICOS', nivel: 'LEITURA' }]

  await atualizarUser(base)
  await conferirStatus(g, 'sem Produtos não lista produtos → 403', u.chamar('GET', '/produtos'), 403)
  await conferirStatus(g, 'mas usa o /select de produtos → 200', u.chamar('GET', '/produtos/select'), 200)
  await conferirStatus(g, 'sem Estoque não lista estoque → 403', u.chamar('GET', '/estoques'), 403)

  await atualizarUser([...base, { tela: 'PRODUTOS', nivel: 'LEITURA' }, { tela: 'ESTOQUE', nivel: 'LEITURA' }])
  await conferirStatus(g, 'Produtos em leitura lista → 200', u.chamar('GET', '/produtos'), 200)
  await conferirStatus(g, 'Produtos em leitura não grava → 403',
    u.chamar('POST', '/produtos', { nome: 'Produto do USER', unidadeMedidaId: unidades.UN }), 403)
  await conferirStatus(g, 'Produtos liberado não abre os auxiliares → 403', u.chamar('GET', '/marcas-produto'), 403)
  await conferirStatus(g, 'Estoque em leitura lista → 200', u.chamar('GET', '/estoques'), 200)
  await conferirStatus(g, 'Estoque em leitura não movimenta → 403',
    u.chamar('POST', `/estoques/${m.estoques['Arroz branco 5kg @ Mercado Bom Preço Ltda']}/entradas`, { quantidade: 1 }), 403)

  // Fica assim para você ver o menu e as telas só de leitura com este usuário.
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
  `  ${m.t.nome.padEnd(28)} ${m.adminEmail} (ADMIN) · ${m.userEmail} (USER, ${i === 0 ? 'Filiais, Serviços, Produtos e Estoque só leitura' : 'sem permissão'})`))
process.exit(falhas ? 1 : 0)
