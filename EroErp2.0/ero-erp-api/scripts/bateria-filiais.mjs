#!/usr/bin/env node
/**
 * Bateria de ponta a ponta de Filiais, Serviços, Produtos, Estoque, Agenda e
 * Consulta, em VÁRIOS tenants — pela API HTTP, contra a aplicação em execução.
 * Cria dados de demonstração e confere, de fora, o que os testes de integração
 * conferem de dentro: cada tenant enxerga só o que é dele.
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
 *     linha sem controle de estoque, que guarda só o preço;
 *   - em cada tenant, a cada rodada, um atendimento: compromisso do ADMIN
 *     convertido em consulta, com um serviço e um produto pelo preço da
 *     filial, concluído (baixa o estoque); e um compromisso do USER no mesmo
 *     horário, com o ADMIN convidado, que fica cancelado no fim. O horário é o
 *     primeiro livre dos dois a partir de amanhã, em dia útil. No mercado, mais
 *     uma consulta sem saldo, que não conclui e fica cancelada.
 *   As transferências da bateria vão e voltam, e a baixa da consulta volta por
 *   uma entrada: rodar de novo não muda saldo. Consulta concluída pela tela
 *   num tenant demo baixa de verdade, e a conferência de saldo a desconta.
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

/** Dinheiro em centavos e quantidade em milésimos: comparar sem ruído de float. */
const centavos = (v) => Math.round(Number((Number(v ?? 0) * 100).toFixed(6)))
const milesimos = (v) => Math.round(Number((Number(v ?? 0) * 1000).toFixed(6)))

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
      { nome: 'Mercado Bom Preço Gravataí Ltda', fantasia: 'Bom Preço Gravataí', cnpj: cnpj(31313134), cidade: 'Gravataí' },
      { nome: 'Ana Paula Souza', cpf: cpf(123123123), cidade: 'Porto Alegre', tipo: 'Cliente' },
    ],
    filiais: [
      { pessoa: 'Mercado Bom Preço Ltda', tipo: 'MATRIZ', cor: '#3B82F6' },
      { pessoa: 'Mercado Bom Preço Centro Ltda', tipo: 'FILIAL', matriz: 'Mercado Bom Preço Ltda', cor: '#10B981' },
      { pessoa: 'Mercado Bom Preço Canoas Ltda', tipo: 'FILIAL', matriz: 'Mercado Bom Preço Ltda', cor: '#F59E0B' },
      { pessoa: 'Mercado Bom Preço Gravataí Ltda', tipo: 'FILIAL', matriz: 'Mercado Bom Preço Ltda', cor: '#EF4444' },
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
    // A consulta da bateria: preços do catálogo da filial, sem ajuste.
    atendimento: {
      filial: 'Mercado Bom Preço Ltda', cliente: 'Ana Paula Souza',
      servico: 'Entrega em domicílio', produto: 'Arroz branco 5kg', quantidade: 2,
      semControle: 'Sacola retornável',
    },
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
      { nome: 'Carlos Eduardo Lima', cpf: cpf(789789789), cidade: 'Caxias do Sul', tipo: 'Cliente' },
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
    // Na farmácia, com 10 % de desconto no total.
    atendimento: {
      filial: 'Farmácia Vida Plena Ltda', cliente: 'Carlos Eduardo Lima',
      servico: 'Aplicação de injetável', produto: 'Dipirona 500mg (10 comprimidos)', quantidade: 1,
      descontoGeralPercentual: 10,
    },
  },
  {
    nome: 'Auto Center Rápido (demo)',
    slug: 'autorapido',
    paleta: 'PADRAO',
    pessoas: [
      { nome: 'Auto Center Rápido Ltda', fantasia: 'Auto Rápido', cnpj: cnpj(53535351), cidade: 'Pelotas' },
      { nome: 'Auto Center Rápido Rio Grande Ltda', fantasia: 'Auto Rápido RG', cnpj: cnpj(53535352), cidade: 'Rio Grande' },
      { nome: 'Roberto Dias Pereira', cpf: cpf(321321321), cidade: 'Pelotas', tipo: 'Cliente' },
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
    // Litro: a baixa leva casas.
    atendimento: {
      filial: 'Auto Center Rápido Ltda', cliente: 'Roberto Dias Pereira',
      servico: 'Troca de óleo (mão de obra)', produto: 'Óleo de motor 5W30', quantidade: 4.5,
    },
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
  const adminId = await garantirUsuario(tenantId, adminEmail, `Admin ${t.nome.replace(' (demo)', '')}`, 'ADMIN')
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
  montados.push({ t, tenantId, adminEmail, adminId, userEmail, userId, pessoas, filiais, servicos, produtos, estoques })
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

/** Todas as linhas de uma listagem paginada, 100 por vez (o teto do servidor). */
async function todasAsPaginas(s, caminho, filtros) {
  const itens = []
  for (let page = 0; ; page++) {
    const r = await s.get(caminho + q({ ...filtros, page, size: 100 }))
    itens.push(...r.content)
    if (r.last ?? page + 1 >= r.totalPages) return itens
  }
}

/**
 * O que as consultas mexeram em cada linha de estoque, em milésimos e com
 * sinal: as baixas (SAIDA_CONSULTA) mais as entradas de "Reposição da
 * consulta…". As da bateria se anulam — ela repõe o que baixou —, e quem
 * concluir uma consulta pela tela num tenant demo não deixa a bateria
 * vermelha. Uma bateria interrompida entre a baixa e a reposição também não:
 * a baixa dela conta como a de qualquer consulta.
 */
async function porConsulta(s) {
  const movs = [
    ...await todasAsPaginas(s, '/estoques/movimentacoes', { tipo: 'SAIDA_CONSULTA' }),
    ...(await todasAsPaginas(s, '/estoques/movimentacoes', { tipo: 'ENTRADA' }))
      .filter((x) => x.motivo?.startsWith('Reposição da consulta')),
  ]
  const soma = new Map()
  for (const x of movs) soma.set(x.estoqueId, (soma.get(x.estoqueId) ?? 0) + milesimos(x.quantidade))
  return soma
}

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

  // As transferências da seção 7 vão e voltam: o saldo é o inicial, mais o que
  // as consultas baixaram e as reposições devolveram (veja `porConsulta`).
  const linhas = (await admin.get('/estoques' + q({ size: 100 }))).content
  const cadastradas = m.t.produtos.flatMap((p) => Object.entries(p.estoque).map(([pessoa, e]) => ({ p, pessoa, e })))
  conferir(g, `estoque traz exatamente as ${cadastradas.length} linhas do tenant`, linhas.length === cadastradas.length,
    `vieram ${linhas.length}`)
  const consultas = await porConsulta(admin)
  for (const { p, pessoa, e } of cadastradas) {
    const id = m.estoques[`${p.nome} @ ${pessoa}`]
    const linha = linhas.find((l) => l.id === id)
    const esperado = milesimos(e.inicial) + (consultas.get(id) ?? 0)
    const confere = !!linha && milesimos(linha.quantidade) === esperado
      && (linha.precoVenda ?? null) === (e.preco ?? null) && linha.controlaEstoque === (e.controla ?? true)
    conferir(g, `"${p.nome}" em ${pessoa}: saldo, preço e controle como cadastrados`, confere,
      `saldo esperado ${esperado / 1000} (${(consultas.get(id) ?? 0) / 1000} de consultas fora da bateria) · ${JSON.stringify(linha)}`)
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

// ─── 9. Agenda e consulta: conflito, preço da filial, totais, baixa ────────

const somaTotais = (itens) => (itens ?? []).reduce((a, i) => a + centavos(i.total), 0)

/** Os totais que o servidor publica fecham: por item, por lista e no total. */
function totaisFecham(c) {
  const itens = [...(c.servicos ?? []), ...(c.produtos ?? [])]
  return itens.every((i) => centavos(i.subtotal) === centavos(i.quantidade * i.precoUnitario)
      && centavos(i.total) === centavos(i.subtotal) + centavos(i.ajuste))
    && centavos(c.subtotalServicos) === somaTotais(c.servicos)
    && centavos(c.subtotalProdutos) === somaTotais(c.produtos)
    && centavos(c.subtotal) === centavos(c.subtotalServicos) + centavos(c.subtotalProdutos)
    && centavos(c.total) === centavos(c.subtotal) + centavos(c.ajusteGeral)
}

/** O corpo do PUT a partir do compromisso como veio. */
const corpoCompromisso = (c) => ({
  filialId: c.filialId, responsavelId: c.responsavelId, pessoaId: c.pessoaId, titulo: c.titulo,
  descricao: c.descricao, cor: c.cor, inicio: c.inicio, fim: c.fim,
  convidadoIds: (c.convidados ?? []).map((x) => x.usuarioId),
})

const UMA_HORA = 3_600_000
/**
 * O primeiro horário cheio livre para todos os usuários, de amanhã em diante,
 * em dia útil das 8h às 18h de Brasília (sem horário de verão desde 2019). Cada
 * rodada deixa uma consulta concluída, que ocupa o horário: a próxima pega o
 * seguinte.
 */
async function horarioLivre(s, usuarioIds) {
  const hojeBrasilia = new Date(Date.now() - 3 * UMA_HORA)
  const [ano, mes, dia] = [hojeBrasilia.getUTCFullYear(), hojeBrasilia.getUTCMonth(), hojeBrasilia.getUTCDate()]
  const inicio = new Date(Date.UTC(ano, mes, dia + 1, 3))
  const fim = new Date(inicio.getTime() + 60 * 24 * UMA_HORA)
  const ocupados = []
  for (const usuarioId of usuarioIds) {
    const janela = await s.get('/compromissos/calendario'
      + q({ inicio: inicio.toISOString(), fim: fim.toISOString(), usuarioId }))
    ocupados.push(...janela.filter((c) => c.status !== 'CANCELADO' && c.status !== 'FALTOU')
      .map((c) => [Date.parse(c.inicio), Date.parse(c.fim)]))
  }
  for (let d = 1; d <= 60; d++) {
    const diaSemana = new Date(Date.UTC(ano, mes, dia + d)).getUTCDay()
    if (diaSemana === 0 || diaSemana === 6) continue
    for (let h = 8; h < 18; h++) {
      const ini = Date.UTC(ano, mes, dia + d, h + 3)
      if (!ocupados.some(([i, f]) => i < ini + UMA_HORA && f > ini))
        return { inicio: new Date(ini).toISOString(), fim: new Date(ini + UMA_HORA).toISOString() }
    }
  }
  return falhar('nenhum horário livre nos próximos 60 dias úteis da agenda demo.')
}

async function permissoesDoUser(m, permissoes) {
  const s = await entrarNoTenant(m.tenantId)
  const atual = await s.get(`/usuarios/${m.userId}`)
  await s.put(`/usuarios/${m.userId}`, {
    nome: atual.nome, email: atual.email, telefone: atual.telefone, codigoPais: atual.codigoPais, role: 'USER', permissoes,
  })
}

/**
 * O USER com Consultas e sem Serviços nem Produtos: não vê as listas, não as
 * apaga ao salvar, e não pode mandá-las. Agenda e Consultas se liberam à
 * parte. Roda com a consulta ainda aberta.
 */
async function conferirUserSemItens(m, consulta) {
  const g = `Permissão · consulta · ${m.t.nome}`
  const u = sessao(await login(m.userEmail, SENHA_DEMO))
  const admin = sessao(await login(m.adminEmail, SENHA_DEMO))
  const filialId = consulta.compromisso.filialId
  const servicoId = consulta.servicos[0].servicoId
  const produtoId = consulta.produtos[0].produtoId
  await permissoesDoUser(m, [{ tela: 'CONSULTAS', nivel: 'ESCRITA' }])

  const vista = await u.get(`/consultas/${consulta.id}`)
  conferir(g, 'sem Serviços e Produtos, o GET omite as duas listas', vista.servicos == null && vista.produtos == null,
    `servicos ${JSON.stringify(vista.servicos)}, produtos ${JSON.stringify(vista.produtos)}`)
  conferir(g, 'mas publica os totais, que incluem o que ele não vê',
    centavos(vista.total) === centavos(consulta.total) && centavos(vista.subtotalServicos) === centavos(consulta.subtotalServicos),
    `total ${vista.total}, esperado ${consulta.total}`)

  const corpo = { compromisso: corpoCompromisso(vista.compromisso), observacao: 'Revisada pelo USER (bateria).' }
  await conferirStatus(g, 'PUT com as listas nulas → 200', u.chamar('PUT', `/consultas/${consulta.id}`, corpo), 200)
  const depois = await admin.get(`/consultas/${consulta.id}`)
  conferir(g, 'e os serviços e produtos continuam lá, com o mesmo total',
    depois.servicos?.length === consulta.servicos.length && depois.produtos?.length === consulta.produtos.length
      && centavos(depois.total) === centavos(consulta.total) && depois.observacao === corpo.observacao,
    JSON.stringify({ s: depois.servicos?.length, p: depois.produtos?.length, t: depois.total }))
  await conferirStatus(g, 'PUT mandando a lista de serviços → 403',
    u.chamar('PUT', `/consultas/${consulta.id}`, { ...corpo, servicos: [] }), 403)
  await conferirStatus(g, 'PUT mandando a lista de produtos → 403',
    u.chamar('PUT', `/consultas/${consulta.id}`, { ...corpo, produtos: [] }), 403)
  await conferirStatus(g, 'prévia mandando a lista de serviços → 403',
    u.chamar('POST', '/consultas/calculo', { filialId, servicos: [] }), 403)
  await conferirStatus(g, 'preço sugerido de serviço → 403',
    u.chamar('GET', '/consultas/preco' + q({ filialId, servicoId })), 403)
  await conferirStatus(g, 'preço sugerido de produto → 403',
    u.chamar('GET', '/consultas/preco' + q({ filialId, produtoId })), 403)
  await conferirStatus(g, 'combo de produtos da consulta → 403',
    u.chamar('GET', '/consultas/produtos' + q({ filialId })), 403)
  await conferirStatus(g, 'Consultas sem Agenda: não abre o compromisso pela agenda → 403',
    u.chamar('GET', `/compromissos/${consulta.compromisso.id}`), 403)

  await permissoesDoUser(m, [{ tela: 'AGENDA', nivel: 'ESCRITA' }])
  await conferirStatus(g, 'Agenda sem Consultas: abre o compromisso → 200',
    u.chamar('GET', `/compromissos/${consulta.compromisso.id}`), 200)
  await conferirStatus(g, 'mas não abre a consulta → 403', u.chamar('GET', `/consultas/${consulta.id}`), 403)
  await conferirStatus(g, 'nem converte compromisso em consulta → 403',
    u.chamar('POST', '/consultas', { compromissoId: consulta.compromisso.id }), 403)

  await permissoesDoUser(m, [{ tela: 'CONSULTAS', nivel: 'LEITURA' }])
  await conferirStatus(g, 'Consultas em leitura abre → 200', u.chamar('GET', `/consultas/${consulta.id}`), 200)
  await conferirStatus(g, 'Consultas em leitura não grava → 403', u.chamar('PUT', `/consultas/${consulta.id}`, corpo), 403)
  await conferirStatus(g, 'nem inicia o atendimento → 403', u.chamar('PATCH', `/consultas/${consulta.id}/iniciar`), 403)

  // Fica com tudo em leitura, para você ver as telas só de leitura com ele.
  await permissoesDoUser(m, ['FILIAIS', 'SERVICOS', 'PRODUTOS', 'ESTOQUE', 'AGENDA', 'CONSULTAS']
    .map((tela) => ({ tela, nivel: 'LEITURA' })))
}

const atendidos = []
for (const m of montados) {
  const at = m.t.atendimento
  const admin = sessao(await login(m.adminEmail, SENHA_DEMO))
  const filialId = m.filiais[at.filial]
  const corFilial = m.t.filiais.find((f) => f.pessoa === at.filial).cor
  const horario = await horarioLivre(admin, [m.adminId, m.userId])

  // ── Agenda: o choque do responsável recusa, o do convidado só avisa
  const ga = `Agenda · ${m.t.nome}`
  const [comp] = await admin.post('/compromissos', {
    ...horario, filialId, responsavelId: m.adminId, pessoaId: m.pessoas[at.cliente],
    titulo: `Atendimento de ${at.cliente} (bateria)`,
  })
  conferir(ga, 'compromisso nasce agendado, com a cor da filial',
    comp.status === 'AGENDADO' && comp.corExibicao?.toUpperCase() === corFilial.toUpperCase(), `${comp.status} ${comp.corExibicao}`)
  await conferirStatus(ga, 'outro compromisso do ADMIN como responsável no mesmo horário → 409',
    admin.chamar('POST', '/compromissos', { ...horario, filialId, responsavelId: m.adminId, titulo: 'Choque (bateria)' }), 409)
  const aviso = await admin.post('/compromissos/disponibilidade',
    { ...horario, responsavelId: m.userId, convidadoIds: [m.adminId] })
  const choques = aviso.ocorrencias.flatMap((o) => o.choques)
  conferir(ga, 'disponibilidade: o ADMIN ocupado como convidado é aviso, não bloqueio',
    !aviso.bloqueia && choques.some((c) => c.usuarioId === m.adminId && !c.responsavel && c.compromissoId === comp.id),
    JSON.stringify(aviso))
  const reuniao = await admin.chamar('POST', '/compromissos', {
    ...horario, filialId, responsavelId: m.userId, convidadoIds: [m.adminId], titulo: 'Reunião de equipe (bateria)',
  })
  conferir(ga, 'e o compromisso do USER com o ADMIN convidado grava → 201', reuniao.status === 201,
    `veio ${reuniao.status}${reuniao.json?.erro ? ` — "${reuniao.json.erro}"` : ''}`)
  const bloqueio = await admin.post('/compromissos/disponibilidade', { ...horario, responsavelId: m.adminId })
  conferir(ga, 'disponibilidade: o ADMIN ocupado como responsável bloqueia', bloqueio.bloqueia === true)
  // A reunião não fica ocupando a agenda: cancelada não conta como choque.
  if (reuniao.status === 201)
    await admin.api('PATCH', `/compromissos/${reuniao.json[0].id}/cancelar`, { motivo: 'Fim da bateria' })

  // ── Consulta: convertida do compromisso, preço da filial, totais do servidor
  const gc = `Consulta · ${m.t.nome}`
  const servicoId = m.servicos[at.servico]
  const produtoId = m.produtos[at.produto]
  const estoqueId = m.estoques[`${at.produto} @ ${at.filial}`]
  const precoServico = m.t.servicos.find((sv) => sv.nome === at.servico).valores[at.filial]
  const precoProduto = m.t.produtos.find((p) => p.nome === at.produto).estoque[at.filial].preco
  // O produto sem controle de estoque entra na conta, mas não baixa.
  const semControleId = at.semControle && m.produtos[at.semControle]
  const precoSemControle = at.semControle ? m.t.produtos.find((p) => p.nome === at.semControle).estoque[at.filial].preco : 0
  const corpoItens = {
    servicos: [{ servicoId, quantidade: 1 }],
    produtos: [{ produtoId, quantidade: at.quantidade }, ...(semControleId ? [{ produtoId: semControleId, quantidade: 1 }] : [])],
    ...(at.descontoGeralPercentual
      ? { tipoAjusteGeral: 'DESCONTO', tipoCalculoGeral: 'PERCENTUAL', valorAjusteGeral: at.descontoGeralPercentual }
      : {}),
  }
  const previa = await admin.post('/consultas/calculo', { filialId, ...corpoItens })
  const consulta = await admin.post('/consultas', { compromissoId: comp.id, observacao: 'Consulta da bateria.', ...corpoItens })
  conferir(gc, 'nasce convertendo o compromisso da agenda, que passa a apontar para ela',
    consulta.compromisso.id === comp.id && consulta.compromisso.consultaId === consulta.id
      && consulta.compromisso.status === 'AGENDADO', JSON.stringify(consulta.compromisso))
  conferir(gc, `preço do catálogo da filial: serviço ${precoServico}, produto ${precoProduto}`,
    consulta.servicos?.[0]?.precoUnitario === precoServico && consulta.produtos?.[0]?.precoUnitario === precoProduto,
    `serviço ${consulta.servicos?.[0]?.precoUnitario}, produto ${consulta.produtos?.[0]?.precoUnitario}`)
  const bruto = centavos(precoServico) + centavos(at.quantidade * precoProduto) + centavos(precoSemControle)
  const esperado = bruto - (at.descontoGeralPercentual ? Math.round(bruto * at.descontoGeralPercentual / 100) : 0)
  conferir(gc, `totais publicados fecham (total ${(esperado / 100).toFixed(2)}${at.descontoGeralPercentual ? `, com ${at.descontoGeralPercentual} % de desconto` : ''})`,
    totaisFecham(consulta) && centavos(consulta.total) === esperado,
    JSON.stringify({ subtotal: consulta.subtotal, ajusteGeral: consulta.ajusteGeral, total: consulta.total }))
  conferir(gc, 'a prévia (/consultas/calculo) dá o mesmo total e o mesmo preço, sem gravar',
    centavos(previa.total) === centavos(consulta.total) && previa.servicos?.[0]?.precoUnitario === precoServico,
    `prévia ${previa.total}, gravada ${consulta.total}`)
  const saldoAntes = (await admin.get(`/estoques/${estoqueId}`)).quantidade
  conferir(gc, 'o produto avisa o saldo que vai baixar',
    consulta.produtos?.[0]?.controlaEstoque === true && milesimos(consulta.produtos[0].saldoDisponivel) === milesimos(saldoAntes))
  if (semControleId)
    conferir(gc, `"${at.semControle}" vem sem controle de estoque e sem saldo`,
      consulta.produtos?.[1]?.controlaEstoque === false && consulta.produtos[1].saldoDisponivel == null
        && consulta.produtos[1].precoUnitario === precoSemControle, JSON.stringify(consulta.produtos?.[1]))
  const sugeridoServico = await admin.get('/consultas/preco' + q({ filialId, servicoId }))
  const sugeridoProduto = await admin.get('/consultas/preco' + q({ filialId, produtoId }))
  conferir(gc, 'preço sugerido (/consultas/preco): o do catálogo, e do produto também o saldo',
    sugeridoServico.precoUnitario === precoServico && sugeridoProduto.precoUnitario === precoProduto
      && sugeridoProduto.controlaEstoque === true && milesimos(sugeridoProduto.saldo) === milesimos(saldoAntes),
    JSON.stringify({ sugeridoServico, sugeridoProduto }))
  const comboProdutos = await admin.get('/consultas/produtos' + q({ filialId }))
  const comEstoque = m.t.produtos.filter((p) => p.estoque[at.filial]).map((p) => m.produtos[p.nome]).sort()
  conferir(gc, 'combo de produtos da consulta: só os com estoque na filial',
    JSON.stringify(comboProdutos.map((p) => p.id).sort()) === JSON.stringify(comEstoque),
    comboProdutos.map((p) => p.nome).join(', '))
  await conferirStatus(gc, 'concluir o compromisso pela agenda → 409 (conclui-se pela consulta)',
    admin.chamar('PATCH', `/compromissos/${comp.id}/concluir`), 409)

  if (m === montados[0]) await conferirUserSemItens(m, consulta)

  // ── Situação e baixa
  const iniciada = await admin.patch(`/consultas/${consulta.id}/iniciar`)
  conferir(gc, 'iniciar: o compromisso fica em atendimento', iniciada.compromisso.status === 'EM_ATENDIMENTO')
  const concluida = await admin.patch(`/consultas/${consulta.id}/concluir`)
  conferir(gc, 'concluir: o compromisso fica concluído', concluida.compromisso.status === 'CONCLUIDO')
  const saldoDepois = (await admin.get(`/estoques/${estoqueId}`)).quantidade
  conferir(gc, `concluir baixa ${at.quantidade} do estoque da filial`,
    milesimos(saldoAntes) - milesimos(saldoDepois) === milesimos(at.quantidade), `de ${saldoAntes} para ${saldoDepois}`)
  const movs = await admin.get('/estoques/movimentacoes' + q({ estoqueId, tipo: 'SAIDA_CONSULTA', size: 20 }))
  const mov = movs.content.find((x) => x.consultaId === consulta.id)
  conferir(gc, 'a movimentação SAIDA_CONSULTA aparece, negativa e ligada à consulta',
    !!mov && milesimos(mov.quantidade) === -milesimos(at.quantidade) && milesimos(mov.quantidadePosterior) === milesimos(saldoDepois),
    JSON.stringify(mov))
  if (semControleId) {
    const linhaSemControle = m.estoques[`${at.semControle} @ ${at.filial}`]
    const baixasSemControle = await admin.get('/estoques/movimentacoes'
      + q({ estoqueId: linhaSemControle, tipo: 'SAIDA_CONSULTA', size: 20 }))
    conferir(gc, `"${at.semControle}", sem controle de estoque, não baixa`,
      !baixasSemControle.content.some((x) => x.consultaId === consulta.id)
        && milesimos((await admin.get(`/estoques/${linhaSemControle}`)).quantidade) === 0)
  }
  await conferirStatus(gc, 'concluir de novo → 409', admin.chamar('PATCH', `/consultas/${consulta.id}/concluir`), 409)
  await conferirStatus(gc, 'alterar a concluída → 409',
    admin.chamar('PUT', `/consultas/${consulta.id}`, { compromisso: corpoCompromisso(concluida.compromisso), observacao: 'Depois' }), 409)

  // A reposição devolve o que a consulta baixou: rodar de novo não muda saldo.
  await admin.post(`/estoques/${estoqueId}/entradas`, { quantidade: at.quantidade, motivo: 'Reposição da consulta (bateria)' })
  conferir(gc, 'a entrada de reposição devolve o saldo de antes',
    milesimos((await admin.get(`/estoques/${estoqueId}`)).quantidade) === milesimos(saldoAntes))

  atendidos.push({ m, consultaId: consulta.id, compromissoId: comp.id, filialId, servicoId, produtoId, horario })
}

// Cada tenant vê só as suas consultas, os seus compromissos e os seus preços.
for (const meu of atendidos) {
  const { m } = meu
  const admin = sessao(await login(m.adminEmail, SENHA_DEMO))
  const g = `Consulta · isolamento · ${m.t.nome}`
  const minhas = (await admin.get('/consultas' + q({ size: 100 }))).content
  for (const outro of atendidos.filter((x) => x.m !== m)) {
    const nome = outro.m.t.nome
    await conferirStatus(g, `abrir consulta de "${nome}" → 404`, admin.chamar('GET', `/consultas/${outro.consultaId}`), 404)
    await conferirStatus(g, `abrir o compromisso dela → 404`, admin.chamar('GET', `/compromissos/${outro.compromissoId}`), 404)
    await conferirStatus(g, `converter compromisso de "${nome}" → 404`,
      admin.chamar('POST', '/consultas', { compromissoId: outro.compromissoId }), 404)
    conferir(g, `lista de consultas não traz a de "${nome}"`, !minhas.some((c) => c.id === outro.consultaId))
    // O antigo respondia o preço de outro cliente: aqui serviço e produto alheios não existem.
    await conferirStatus(g, `preço sugerido de serviço de "${nome}" → 404`,
      admin.chamar('GET', '/consultas/preco' + q({ filialId: meu.filialId, servicoId: outro.servicoId })), 404)
    await conferirStatus(g, `preço sugerido de produto de "${nome}" → 404`,
      admin.chamar('GET', '/consultas/preco' + q({ filialId: meu.filialId, produtoId: outro.produtoId })), 404)
    const precoNaAlheia = await admin.get('/consultas/preco' + q({ filialId: outro.filialId, servicoId: meu.servicoId }))
    conferir(g, `preço do meu serviço na filial de "${nome}" vem vazio`, precoNaAlheia.precoUnitario == null,
      JSON.stringify(precoNaAlheia))
    const comboAlheio = await admin.get('/consultas/produtos' + q({ filialId: outro.filialId }))
    conferir(g, `combo de produtos na filial de "${nome}" vem vazio`, comboAlheio.length === 0,
      comboAlheio.map((p) => p.nome).join(', '))
  }
}

// ─── 9b. Consulta: regras que a conta e a baixa não podem esquecer ─────────

/** Ordem do `TreeMap<UUID, …>` do Java: os 64 bits altos com sinal, depois os baixos. */
function compararUuidJava(a, b) {
  const metades = (u) => {
    const h = u.replace(/-/g, '')
    return [BigInt.asIntN(64, BigInt('0x' + h.slice(0, 16))), BigInt.asIntN(64, BigInt('0x' + h.slice(16)))]
  }
  const [a1, a2] = metades(a)
  const [b1, b2] = metades(b)
  return a1 !== b1 ? (a1 < b1 ? -1 : 1) : a2 === b2 ? 0 : a2 < b2 ? -1 : 1
}

{
  // Saldo insuficiente desfaz tudo. O concluir baixa em ordem de produto: o que
  // tem saldo vai primeiro, e a falta do segundo tem de desfazer a baixa dele.
  const atendido = atendidos[0]
  const { m } = atendido
  const at = m.t.atendimento
  const admin = sessao(await login(m.adminEmail, SENHA_DEMO))
  const g = `Consulta · regras · ${m.t.nome}`
  const filialId = m.filiais[at.filial]
  const controlados = m.t.produtos
    .filter((p) => p.estoque[at.filial] && (p.estoque[at.filial].controla ?? true))
    .map((p) => ({ nome: p.nome, id: m.produtos[p.nome], estoqueId: m.estoques[`${p.nome} @ ${at.filial}`] }))
    .sort((a, b) => compararUuidJava(a.id, b.id))
  const [comSaldo, semSaldo] = [controlados[0], controlados.at(-1)]
  const saldos = async () => Promise.all([comSaldo, semSaldo].map(async (p) => (await admin.get(`/estoques/${p.estoqueId}`)).quantidade))
  const [antesCom, antesSem] = await saldos()

  // Criada junto com o compromisso, e o choque do responsável vale aqui também.
  const compromissoNovo = (horario) => ({
    ...horario, filialId, responsavelId: m.adminId, pessoaId: m.pessoas[at.cliente],
    titulo: `Consulta sem saldo de ${at.cliente} (bateria)`,
  })
  await conferirStatus(g, 'consulta criada junto com o compromisso, no horário ocupado do ADMIN → 409',
    admin.chamar('POST', '/consultas', { compromisso: compromissoNovo(atendido.horario) }), 409)
  const horario = await horarioLivre(admin, [m.adminId])
  await conferirStatus(g, 'consulta sem cliente → 400',
    admin.chamar('POST', '/consultas', { compromisso: { ...compromissoNovo(horario), pessoaId: null } }), 400)
  const consulta = await admin.post('/consultas', {
    compromisso: compromissoNovo(horario), observacao: 'Consulta sem saldo da bateria.',
    produtos: [{ produtoId: comSaldo.id, quantidade: 1 }, { produtoId: semSaldo.id, quantidade: antesSem + 1000 }],
  })
  conferir(g, 'criada junto: o compromisso nasce com ela, agendado',
    consulta.compromisso.consultaId === consulta.id && consulta.compromisso.status === 'AGENDADO')
  const recusa = await admin.chamar('PATCH', `/consultas/${consulta.id}/concluir`)
  conferir(g, `concluir sem saldo de "${semSaldo.nome}" → 409 nomeando o produto`,
    recusa.status === 409 && String(recusa.json?.erro).includes(semSaldo.nome), `veio ${recusa.status} — "${recusa.json?.erro}"`)
  const [depoisCom, depoisSem] = await saldos()
  conferir(g, `e nada baixa: nem "${comSaldo.nome}", que veio antes e tinha saldo`,
    milesimos(depoisCom) === milesimos(antesCom) && milesimos(depoisSem) === milesimos(antesSem),
    `${comSaldo.nome} ${antesCom} → ${depoisCom}, ${semSaldo.nome} ${antesSem} → ${depoisSem}`)
  const baixas = await admin.get('/estoques/movimentacoes' + q({ tipo: 'SAIDA_CONSULTA', size: 20 }))
  conferir(g, 'nenhuma movimentação ligada a ela', !baixas.content.some((x) => x.consultaId === consulta.id))
  const cancelada = await admin.api('PATCH', `/consultas/${consulta.id}/cancelar`, { motivo: 'Sem saldo (bateria)' })
  conferir(g, 'a consulta continua aberta, e cancelar pela consulta cancela o compromisso',
    cancelada.compromisso.status === 'CANCELADO', cancelada.compromisso.status)
}

{
  // Vazio não é zero: sem preço informado e sem preço no catálogo, a conta recusa.
  const m = montados[1]
  const admin = sessao(await login(m.adminEmail, SENHA_DEMO))
  const g = `Consulta · regras · ${m.t.nome}`
  const clinica = m.filiais['Clínica Vida Plena Ltda']
  const seringa = 'Seringa descartável 5ml'
  const semPreco = await admin.chamar('POST', '/consultas/calculo',
    { filialId: clinica, produtos: [{ produtoId: m.produtos[seringa], quantidade: 2 }] })
  conferir(g, `"${seringa}" sem preço na filial e sem preço informado → 400 nomeando o item`,
    semPreco.status === 400 && String(semPreco.json?.erro).includes(seringa), `veio ${semPreco.status} — "${semPreco.json?.erro}"`)
  const zero = await admin.post('/consultas/calculo',
    { filialId: clinica, produtos: [{ produtoId: m.produtos[seringa], quantidade: 2, precoUnitario: 0 }] })
  conferir(g, 'com preço zero informado, vale zero', zero.total === 0 && zero.produtos[0].precoUnitario === 0, JSON.stringify(zero))
  const retorno = await admin.post('/consultas/calculo',
    { filialId: clinica, servicos: [{ servicoId: m.servicos['Retorno de consulta'], quantidade: 1 }] })
  conferir(g, 'serviço com valor zero no catálogo entra a zero, sem recusar', retorno.total === 0, JSON.stringify(retorno))
  const m0 = montados[0]
  const admin0 = sessao(await login(m0.adminEmail, SENHA_DEMO))
  const cesta = await admin0.chamar('POST', '/consultas/calculo', {
    filialId: m0.filiais['Mercado Bom Preço Centro Ltda'],
    servicos: [{ servicoId: m0.servicos['Montagem de cesta básica'], quantidade: 1 }],
  })
  conferir(`Consulta · regras · ${m0.t.nome}`, 'serviço sem valor na filial e sem preço informado → 400 nomeando o item',
    cesta.status === 400 && String(cesta.json?.erro).includes('Montagem de cesta básica'), `veio ${cesta.status} — "${cesta.json?.erro}"`)
}

// ─── Relatório ──────────────────────────────────────────────────────────────

let grupoAtual = ''
for (const r of resultados) {
  if (r.grupo !== grupoAtual) { console.log(`\n${r.grupo}`); grupoAtual = r.grupo }
  console.log(`  ${r.ok ? '✓' : '✗'} ${r.descricao}${r.ok ? '' : `  (${r.detalhe})`}`)
}
const falhas = resultados.filter((r) => !r.ok).length
console.log(`\n${resultados.length - falhas}/${resultados.length} conferências passaram.`)
/**
 * O acesso do USER como está no banco, não como a bateria o deixou: alguém
 * pode tê-lo mudado pela tela de usuários depois.
 */
const ROTULO_TELA = {
  PESSOAS: 'Pessoas', FILIAIS: 'Filiais', SERVICOS: 'Serviços', PRODUTOS: 'Produtos',
  AUXILIARES_PRODUTO: 'Auxiliares de produto', ESTOQUE: 'Estoque', AGENDA: 'Agenda', CONSULTAS: 'Consultas',
}
async function descreverAcesso(m) {
  const s = await entrarNoTenant(m.tenantId)
  const permissoes = (await s.get(`/usuarios/${m.userId}`)).permissoes ?? []
  if (!permissoes.length) return 'sem permissão'
  const telas = (nivel) => permissoes.filter((p) => p.nivel === nivel).map((p) => ROTULO_TELA[p.tela] ?? p.tela)
  return [['LEITURA', 'em leitura'], ['ESCRITA', 'em escrita']]
    .filter(([nivel]) => telas(nivel).length)
    .map(([nivel, rotulo]) => `${telas(nivel).join(', ')} ${rotulo}`)
    .join(' · ')
}

console.log('\nUsuários de demonstração (senha ' + SENHA_DEMO + '):')
for (const m of montados) {
  console.log(`  ${m.t.nome.padEnd(28)} ${m.adminEmail} (ADMIN) · ${m.userEmail} (USER: ${await descreverAcesso(m)})`)
}
process.exit(falhas ? 1 : 0)
