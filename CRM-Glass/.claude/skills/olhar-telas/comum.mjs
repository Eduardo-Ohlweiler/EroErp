/**
 * Peças comuns do olhar.mjs, medir-campos.mjs e tres-vias.mjs: onde o app responde, o Chrome, o
 * playwright-core, a credencial, o login com o código do Mailpit, a navegação sem recarregar e a
 * espera da montagem em blocos.
 *
 * Variáveis opcionais:
 *   OLHAR_FRONT        onde o front responde (padrão http://localhost:5173: nginx do Docker ou Vite)
 *   OLHAR_MAILPIT      onde o Mailpit responde (padrão http://localhost:8025)
 *   OLHAR_EMAIL        quem entra (padrão: SUPERADMIN_EMAIL do ero-api/.env)
 *   OLHAR_SENHA        a senha dele (padrão: SUPERADMIN_SENHA do ero-api/.env). NUNCA é impressa.
 *   OLHAR_PLAYWRIGHT   pasta do playwright-core (ou do --prefix de um npm install), se não estiver nos lugares de sempre
 *   OLHAR_MAILPIT_CONFIRMADO=1  pula a conferência do modo do e-mail (API subida à mão com MAIL_HOST do Mailpit)
 *   CHROME_PATH        o Chrome do sistema
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

/** Pasta CRM-Glass (esta skill mora em CRM-Glass/.claude/skills/olhar-telas). */
export const RAIZ = fileURLToPath(new URL('../../../', import.meta.url))

export const FRONT = (process.env.OLHAR_FRONT ?? 'http://localhost:5173').replace(/\/$/, '')
export const MAILPIT = (process.env.OLHAR_MAILPIT ?? 'http://localhost:8025').replace(/\/$/, '')
export const CHROME = process.env.CHROME_PATH
  ?? (process.platform === 'win32'
    ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    : '/usr/bin/google-chrome')

/** Tudo o que os scripts gravam vai para cá (fora do repositório). */
export const SAIDA = join(tmpdir(), 'olhar-crm')
mkdirSync(SAIDA, { recursive: true })

/** As três larguras que toda tela tem de aguentar: desktop, tablet e celular. */
export const LARGURAS = [1440, 768, 360]

// ── playwright-core ──────────────────────────────────────────────────────

/*
 * Como no EroErp 2.0: só o `playwright-core` (sem navegador baixado), dirigindo o Chrome do sistema.
 * Ordem de procura: OLHAR_PLAYWRIGHT → devDependency do ero-web (quando entrar) → a do EroErp 2.0,
 * que mora ao lado deste repositório nesta máquina. Nada é instalado por estes scripts.
 */
const CANDIDATOS_PW = [
  process.env.OLHAR_PLAYWRIGHT,
  join(RAIZ, 'ero-web', 'node_modules', 'playwright-core'),
  join(RAIZ, '..', 'EroErp2.0', 'ero', 'node_modules', 'playwright-core'),
].filter(Boolean)

export async function carregarChromium() {
  for (const c of CANDIDATOS_PW) {
    const arquivo = [
      c.endsWith('.mjs') ? c : null,
      join(c, 'index.mjs'),
      join(c, 'node_modules', 'playwright-core', 'index.mjs'),
    ].find((a) => a && existsSync(a))
    if (arquivo) return (await import(pathToFileURL(arquivo).href)).chromium
  }
  throw new Error(
    'playwright-core não encontrado. Procurei em:\n  ' + CANDIDATOS_PW.join('\n  ') +
    '\nSem instalar nada global: npm install --prefix "<pasta temporária>/olhar-pw" playwright-core@1.62.1' +
    '\ne rode com OLHAR_PLAYWRIGHT="<pasta temporária>/olhar-pw".',
  )
}

/** Chrome headless. `reduzir` emula prefers-reduced-motion (a coreografia vira só esmaecer). */
export async function abrirNavegador({ largura = 1440, altura = 1100, reduzir = false } = {}) {
  const chromium = await carregarChromium()
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] })
  const ctx = await b.newContext({
    viewport: { width: largura, height: altura },
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    reducedMotion: reduzir ? 'reduce' : 'no-preference',
  })
  const pg = await ctx.newPage()
  // Sem isto o window.print() do botão Pdf abre diálogo e trava o headless.
  await pg.addInitScript(() => { window.print = () => {} })
  return { b, ctx, pg }
}

// ── Credencial ───────────────────────────────────────────────────────────

/** Lê o ero-api/.env (local, fora do git). Só chaves e valores; ninguém imprime o resultado. */
export function lerDotEnv() {
  try {
    return Object.fromEntries(readFileSync(join(RAIZ, 'ero-api', '.env'), 'utf8').split(/\r?\n/)
      .map((l) => l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/))
      .filter(Boolean)
      .map(([, k, v]) => [k, v.replace(/^"(.*)"$/, '$1')]))
  } catch {
    return {}
  }
}

/**
 * OLHAR_EMAIL/OLHAR_SENHA, senão o superadmin do ero-api/.env. Sem chute: login errado conta
 * tentativa (10 por minuto por IP) e pode bloquear a conta.
 */
export function credencial() {
  const env = lerDotEnv()
  const email = process.env.OLHAR_EMAIL ?? env.SUPERADMIN_EMAIL
  const senha = process.env.OLHAR_SENHA ?? env.SUPERADMIN_SENHA
  if (!email || !senha) {
    throw new Error('Sem credencial: defina OLHAR_EMAIL/OLHAR_SENHA ou SUPERADMIN_EMAIL/SUPERADMIN_SENHA no ero-api/.env.')
  }
  return { email, senha }
}

/** E-mail para a saída do terminal: nunca inteiro (regra 7 do CLAUDE.md). */
export const mascararEmail = (e) => {
  const [u = '', d = ''] = String(e).split('@')
  return `${u.slice(0, 2)}***@${d}`
}

// ── Mailpit: o código de 6 dígitos sem mandar e-mail de verdade ──────────

/**
 * MAIL_HOST da API que está no Docker (`docker compose ps -q api` na pasta CRM-Glass).
 * undefined = não há API no Docker (ou não há docker); '' = sem MAIL_HOST, ou seja, Gmail do .env.
 * Lê só essa variável; o resto do ambiente do container não sai daqui.
 */
export function mailHostDaApiDocker() {
  try {
    const opcoes = { cwd: RAIZ, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }
    const id = execFileSync('docker', ['compose', 'ps', '-q', 'api'], opcoes).trim().split(/\s+/)[0]
    if (!id) return undefined
    const linhas = execFileSync('docker', ['inspect', '-f', '{{range .Config.Env}}{{println .}}{{end}}', id], opcoes)
      .split(/\r?\n/)
    const linha = linhas.find((l) => l.startsWith('MAIL_HOST='))
    return linha ? linha.slice('MAIL_HOST='.length) : ''
  } catch {
    return undefined
  }
}

async function mailpitResponde() {
  try {
    const r = await fetch(`${MAILPIT}/api/v1/messages?limit=1`)
    if (!r.ok) return false
    const j = await r.json()
    return Array.isArray(j.messages)
  } catch {
    return false
  }
}

/**
 * Trava de segurança: só faz login se o código for para o Mailpit. No modo Gmail (padrão do
 * `docker compose up`) o código iria para a caixa de verdade do dono, a cada execução.
 */
export async function confirmarModoMailpit() {
  if (process.env.OLHAR_MAILPIT_CONFIRMADO === '1') return
  const subir = 'Suba no modo Mailpit, na pasta CRM-Glass:\n' +
    '  docker compose -f compose.yaml -f deploy/dev/compose.mailpit.yaml up -d\n' +
    'e rode de novo. (Para voltar ao Gmail depois: docker compose up -d.)'
  if (!(await mailpitResponde())) {
    throw new Error(`O Mailpit não responde em ${MAILPIT}. Não vou entrar: o código iria por e-mail de verdade.\n${subir}`)
  }
  const host = mailHostDaApiDocker()
  if (host === undefined) {
    // API fora do Docker (run-dev.cmd / preview ero-api): ela lê o ero-api/.env.
    const h = lerDotEnv().MAIL_HOST ?? ''
    if (!/^(localhost|127\.0\.0\.1|mailpit)$/i.test(h)) {
      throw new Error('A API não está no Docker e o ero-api/.env não aponta MAIL_HOST para o Mailpit.\n' +
        'Se você subiu a API com MAIL_HOST=localhost na linha de comando, rode com OLHAR_MAILPIT_CONFIRMADO=1.')
    }
  } else if (host.toLowerCase() !== 'mailpit') {
    throw new Error(`A API do Docker está mandando e-mail pelo Gmail (MAIL_HOST ${host ? 'diferente do Mailpit' : 'vazio'}).\n${subir}`)
  }
}

async function mensagensDoMailpit() {
  const r = await fetch(`${MAILPIT}/api/v1/messages?limit=50`)
  if (!r.ok) throw new Error(`Mailpit respondeu ${r.status}`)
  return (await r.json()).messages ?? []
}

/** IDs que já estavam na caixa: o código certo é o de uma mensagem que chegou DEPOIS do clique. */
export async function idsNoMailpit() {
  return new Set((await mensagensDoMailpit()).map((m) => m.ID))
}

/**
 * O código de 6 dígitos da mensagem mais recente para `email` que não estava em `antes`.
 * Não depende do relógio do container (a VM do Docker às vezes anda alguns segundos fora).
 */
export async function codigoDoMailpit(email, antes, limiteMs = 30000) {
  const alvo = email.toLowerCase()
  const fim = Date.now() + limiteMs
  while (Date.now() < fim) {
    const novas = (await mensagensDoMailpit())
      .filter((m) => !antes.has(m.ID))
      .filter((m) => (m.To ?? []).some((t) => String(t.Address).toLowerCase() === alvo))
      .sort((a, b) => Date.parse(b.Created) - Date.parse(a.Created))
    if (novas.length) {
      const msg = await (await fetch(`${MAILPIT}/api/v1/message/${novas[0].ID}`)).json()
      const achado = String(msg.Text ?? '').match(/\b(\d{6})\b/) ?? String(msg.HTML ?? '').match(/>\s*(\d{6})\s*</)
      if (achado) return achado[1]
    }
    await new Promise((r) => setTimeout(r, 700))
  }
  throw new Error(`Nenhum código para ${mascararEmail(email)} chegou ao Mailpit em ${limiteMs / 1000} s.`)
}

// ── Login pela própria tela ──────────────────────────────────────────────

/** Avisos visíveis (senha errada, 429, código vencido) para explicar por que o login parou. */
export async function avisoNaTela(pg) {
  try {
    const t = (await pg.locator('[role="alert"]').allInnerTexts()).map((s) => s.trim()).filter(Boolean)
    return t.length ? t.join(' | ') : 'nenhum aviso na tela'
  } catch {
    return 'sem leitura da tela'
  }
}

const saiuDoLogin = (u) => !u.pathname.startsWith('/login')

/**
 * Entra como o usuário entra: e-mail e senha na /login, código lido no Mailpit, digitado nas casas.
 * O token de acesso fica só em memória e o refresh no cookie httpOnly `ero_refresh` (Path=/api/auth):
 * depois disto, navegue com `ir()`, nunca com `goto` (cada recarga gasta um /api/auth/refresh).
 */
export async function entrar(pg, { email, senha } = credencial()) {
  await confirmarModoMailpit()
  await pg.goto(`${FRONT}/login`, { waitUntil: 'domcontentloaded' })
  await pg.locator('input[type="email"]').fill(email)
  await pg.locator('input[autocomplete="current-password"]').fill(senha)
  const antes = await idsNoMailpit()
  await pg.locator('form button[type="submit"]').first().click()

  // Etapa do código (o normal: todo login pede) ou já dentro.
  const otp = pg.locator('input[autocomplete="one-time-code"]')
  const etapa = await Promise.race([
    otp.waitFor({ state: 'visible', timeout: 20000 }).then(() => 'codigo', () => null),
    pg.waitForURL(saiuDoLogin, { timeout: 20000 }).then(() => 'dentro', () => null),
  ])
  if (!etapa) throw new Error(`O login parou na senha: ${await avisoNaTela(pg)}`)

  if (etapa === 'codigo') {
    const codigo = await codigoDoMailpit(email, antes)
    // A 1ª casa aceita os 6 dígitos de uma vez (colagem/autopreenchimento) e envia sozinha ao completar.
    await otp.fill(codigo)
    const dentro = await pg.waitForURL(saiuDoLogin, { timeout: 25000 }).then(() => true, () => false)
    if (!dentro) {
      throw new Error(`O código não levou para dentro: ${await avisoNaTela(pg)} (troca de senha pendente? código vencido?)`)
    }
  }
  await esperarTelaParada(pg)
}

/**
 * Token de acesso pela API, para criar dado de teste por endpoint (mesma trava do Mailpit).
 * Gasta um login e um código: guarde o token e reaproveite.
 */
export async function tokenDaApi(api = 'http://localhost:8080', { email, senha } = credencial()) {
  await confirmarModoMailpit()
  const json = { 'Content-Type': 'application/json' }
  const antes = await idsNoMailpit()
  const r1 = await fetch(`${api}/api/auth/login`, { method: 'POST', headers: json, body: JSON.stringify({ email, senha }) })
  if (!r1.ok) throw new Error(`login respondeu ${r1.status}`)
  const { desafioDoisFatores } = await r1.json()
  const codigo = await codigoDoMailpit(email, antes)
  const r2 = await fetch(`${api}/api/auth/2fa/verificar`, { method: 'POST', headers: json, body: JSON.stringify({ desafio: desafioDoisFatores, codigo }) })
  if (!r2.ok) throw new Error(`2fa/verificar respondeu ${r2.status}`)
  return (await r2.json()).tokenAcesso
}

// ── Navegar e esperar ────────────────────────────────────────────────────

/**
 * Navegar como o usuário navega: pela rota, dentro da mesma página (o React Router ouve `popstate`).
 * Um `goto` recarregaria o documento e gastaria um /api/auth/refresh (30 por minuto por IP).
 */
export async function ir(pg, rota) {
  await pg.evaluate((r) => {
    history.pushState({}, '', r)
    dispatchEvent(new PopStateEvent('popstate'))
  }, rota)
  await esperarTelaParada(pg)
}

/**
 * Espera a coreografia: a tela que sai se desmonta, a nova se monta em blocos. Considera parada quando
 * posição, tamanho e opacidade dos elementos do conteúdo não mudam entre duas leituras seguidas.
 * O fundo vivo não para nunca: os orbs (`.orb`, que se movem devagar o tempo todo), o canvas da cena
 * e das partículas e o que é decorativo (`aria-hidden`) ficam fora da conta.
 */
export async function esperarTelaParada(pg, { minimo = 600, maximo = 8000 } = {}) {
  await pg.waitForTimeout(minimo)
  const fim = Date.now() + maximo
  let anterior = ''
  while (Date.now() < fim) {
    const atual = await pg.evaluate(() => {
      const raiz = document.querySelector('main') ?? document.body
      const decorativo = (e) => e.closest('.orb, canvas, [aria-hidden="true"]')
      return [...raiz.querySelectorAll('*')].filter((e) => !decorativo(e)).slice(0, 500).map((e) => {
        const r = e.getBoundingClientRect()
        return `${Math.round(r.x)},${Math.round(r.y)},${Math.round(r.width)},${Math.round(r.height)},${getComputedStyle(e).opacity}`
      }).join(';')
    }).catch(() => '')
    if (atual && atual === anterior) return
    anterior = atual
    await pg.waitForTimeout(250)
  }
}

/** Rolagem horizontal e o elemento culpado (não só o sintoma). */
export async function medirRolagem(pg) {
  return pg.evaluate(() => {
    const d = document.documentElement
    let culpado = ''
    if (d.scrollWidth > d.clientWidth + 1)
      for (const e of document.querySelectorAll('body *')) {
        const r = e.getBoundingClientRect()
        if (r.right > d.clientWidth + 1 && r.width > 20) {
          culpado = `${e.tagName}${e.dataset.kit ? `[data-kit=${e.dataset.kit}]` : ''}.${String(e.className).slice(0, 40)}`
          break
        }
      }
    return { rolagem: d.scrollWidth - d.clientWidth, culpado }
  })
}

/**
 * Erros de console que contam. Fica de fora o 401 do /api/auth/refresh ao abrir sem sessão: é o boot
 * tentando restaurar a sessão, esperado em /login.
 */
export function ouvirErros(pg) {
  const erros = []
  const api = []
  pg.on('pageerror', (e) => erros.push(String(e).slice(0, 200)))
  pg.on('console', (m) => {
    if (m.type() !== 'error') return
    const url = m.location()?.url ?? ''
    if (m.text().startsWith('Failed to load resource') && url.includes('/api/')) return // já vai pelo `api`
    erros.push(m.text().slice(0, 200))
  })
  pg.on('response', (r) => {
    const u = new URL(r.url())
    if (!u.pathname.startsWith('/api/') || r.status() < 400) return
    if (u.pathname === '/api/auth/refresh' && r.status() === 401) return
    api.push(`${r.request().method()} ${u.pathname} → ${r.status()}`)
  })
  return { erros, api }
}

/** Rota que não precisa de sessão. */
export const ehPublica = (rota) => rota.startsWith('/login')
