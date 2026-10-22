/**
 * Mede a largura de cada campo visível de uma tela e aponta os curtos que
 * passaram do tamanho do docs/13-layout-de-telas.md — data, hora, valor, CPF,
 * CEP, UF, código e select curto.
 *
 *   node .claude/skills/olhar-telas/medir-campos.mjs /app/agenda/novo
 *   node .claude/skills/olhar-telas/medir-campos.mjs /app/pessoas/nova --aba "Endereços"
 *   node .claude/skills/olhar-telas/medir-campos.mjs /app/estoque --largura 1280
 *
 * Mede a 1440 px por padrão: a escala do doc 13 vale a partir de `sm`, e no
 * celular todo campo é 100 % de propósito. Sai com código 1 se houver campo
 * acima do limite — dá para usar como verificação.
 *
 * A régua cobre TAMANHO. Disposição (ordem, agrupamento, um campo longo por
 * linha) só se confere olhando o screenshot do olhar.mjs.
 *
 * Mesmas variáveis do olhar.mjs: CHROME_PATH, OLHAR_EMAIL, OLHAR_SENHA. No Git
 * Bash do Windows, rode com MSYS_NO_PATHCONV=1.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

/**
 * Limite em px de cada tipo de campo curto: a largura do doc 13 §2 com folga
 * de ~25 % (borda, sufixo, arredondamento). Acima disso, o campo esticou.
 */
export const LIMITES = {
  uf: { doc: 80, limite: 110 },
  codigo: { doc: 128, limite: 165 },
  hora: { doc: 128, limite: 165 },
  data: { doc: 160, limite: 205 },
  cep: { doc: 160, limite: 205 },
  valor: { doc: 160, limite: 205 },
  cpf: { doc: 176, limite: 225 },
  situacao: { doc: 192, limite: 245 },
  cnpj: { doc: 208, limite: 265 },
  dataHora: { doc: 224, limite: 285 },
}

/**
 * Roda DENTRO da página (page.evaluate): lista os campos visíveis do conteúdo
 * — fora do header, do menu e de diálogos fechados — com rótulo, tipo e
 * largura. Não classifica; isso é do `classificar`, que roda no Node.
 */
export function coletarCampos() {
  const fora = (el) => el.closest('header, aside, nav, [aria-hidden="true"]')
  const visivel = (el) => {
    const r = el.getBoundingClientRect()
    const s = getComputedStyle(el)
    return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'
  }
  const rotuloDe = (el) =>
    (el.labels?.[0]?.textContent
      ?? el.getAttribute('aria-label')
      ?? el.getAttribute('placeholder')
      ?? el.getAttribute('name')
      ?? '').trim().replace(/\s+/g, ' ')

  const campos = []
  for (const el of document.querySelectorAll('input, select, textarea')) {
    if (fora(el) || !visivel(el)) continue
    const tipo = el.tagName === 'INPUT' ? (el.getAttribute('type') ?? 'text').toLowerCase() : el.tagName.toLowerCase()
    if (['hidden', 'checkbox', 'radio', 'submit', 'button', 'file', 'color', 'range'].includes(tipo)) continue
    const opcoes = el.tagName === 'SELECT' ? [...el.options].map((o) => o.textContent.trim()) : null
    campos.push({
      rotulo: rotuloDe(el),
      tipo,
      inputMode: el.getAttribute('inputmode') ?? '',
      largura: Math.round(el.getBoundingClientRect().width),
      opcoes,
    })
  }
  return campos
}

/** Que tipo de campo curto é este, pelo doc 13 — ou null se é longo/livre. */
export function classificar(c) {
  const r = c.rotulo.toLowerCase()
  if (c.tipo === 'date') return 'data'
  if (c.tipo === 'time') return 'hora'
  if (c.tipo === 'datetime-local') return 'dataHora'
  if (c.tipo === 'textarea') return null
  if (/\bcnpj\b/.test(r)) return 'cnpj'
  if (/\bcpf\b|telefone|celular|whatsapp/.test(r)) return 'cpf'
  if (/\bcep\b/.test(r)) return 'cep'
  if (/^uf$|\buf\b|^estado \(uf\)/.test(r)) return 'uf'
  if (/c[oó]digo|^n[uú]mero$|^n[ºo°]\.?$/.test(r)) return 'codigo'
  if (c.tipo === 'select') {
    const o = c.opcoes ?? []
    const curto = o.length > 0 && o.length <= 6 && o.every((t) => t.length <= 20)
    return curto ? 'situacao' : null
  }
  if (c.inputMode === 'decimal' || c.inputMode === 'numeric') return 'valor'
  return null
}

/** Junta classificação e limite; `estourou` é o que vai para o relatório. */
export function avaliar(campos) {
  return campos.map((c) => {
    const tipoDoc = classificar(c)
    const regra = tipoDoc ? LIMITES[tipoDoc] : null
    return { ...c, tipoDoc, doc: regra?.doc ?? null, limite: regra?.limite ?? null,
      estourou: !!regra && c.largura > regra.limite }
  })
}

export function relatorio(rota, larguraTela, avaliados) {
  const linhas = [`${rota} @ ${larguraTela}px — ${avaliados.length} campos`]
  const w = Math.max(8, ...avaliados.map((a) => a.rotulo.length))
  for (const a of avaliados) {
    const marca = a.estourou ? '✗' : a.tipoDoc ? '✓' : '·'
    const regra = a.tipoDoc ? `${a.tipoDoc} (doc ${a.doc}px, limite ${a.limite}px)` : 'longo/livre — conferir no olho'
    linhas.push(`  ${marca} ${a.rotulo.padEnd(w)}  ${String(a.largura).padStart(4)}px  ${regra}`)
  }
  const ruins = avaliados.filter((a) => a.estourou)
  linhas.push(ruins.length
    ? `  ${ruins.length} campo(s) acima do limite: ${ruins.map((a) => a.rotulo).join(', ')}`
    : '  nenhum campo curto acima do limite')
  return { texto: linhas.join('\n'), violacoes: ruins.length }
}

// ── Execução direta ──────────────────────────────────────────────────────
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { chromium } = await import('../../../ero/node_modules/playwright-core/index.mjs')

  const CHROME = process.env.CHROME_PATH
    ?? (process.platform === 'win32'
      ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
      : '/usr/bin/google-chrome')

  const lerDotEnv = () => {
    try {
      const caminho = new URL('../../../ero-erp-api/.env', import.meta.url)
      return Object.fromEntries(readFileSync(caminho, 'utf8').split(/\r?\n/)
        .map((l) => l.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/))
        .filter(Boolean)
        .map(([, k, v]) => [k, v.replace(/^"(.*)"$/, '$1')]))
    } catch {
      return {}
    }
  }
  const dotEnv = lerDotEnv()
  const EMAIL = process.env.OLHAR_EMAIL ?? dotEnv.SUPERADMIN_EMAIL
  const SENHA = process.env.OLHAR_SENHA ?? dotEnv.SUPERADMIN_PASSWORD
  if (!EMAIL || !SENHA) {
    console.error('Sem credencial: defina OLHAR_EMAIL/OLHAR_SENHA ou o SUPERADMIN_* do ero-erp-api/.env.')
    process.exit(2)
  }

  const [, , rota = '/app', ...resto] = process.argv
  const valorDe = (flag) => {
    const i = resto.indexOf(flag)
    return i >= 0 ? resto[i + 1] : undefined
  }
  const aba = valorDe('--aba')
  const larguraTela = Number(valorDe('--largura') ?? 1440)

  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] })
  const pg = await (await b.newContext({ viewport: { width: larguraTela, height: 1100 } })).newPage()
  await pg.addInitScript(() => { window.print = () => {} })

  await pg.goto('http://localhost:5173/app/login', { waitUntil: 'domcontentloaded' })
  await pg.fill('input[type="email"]', EMAIL)
  await pg.fill('input[type="password"]', SENHA)
  await pg.click('button[type="submit"]')
  // `aside` e não `**/app**`: esse padrão casa com a própria /app/login.
  await pg.waitForSelector('aside', { timeout: 20000 })

  // Navega dentro da página: um goto gastaria outro /auth/refresh (armadilha 8).
  await pg.evaluate((r) => {
    history.pushState({}, '', r)
    dispatchEvent(new PopStateEvent('popstate'))
  }, rota)
  await pg.waitForTimeout(1800)

  if (aba) {
    await pg.locator(`[role="tab"]:has-text("${aba}"), button:has-text("${aba}")`).first().click()
    await pg.waitForTimeout(500)
  }

  const avaliados = avaliar(await pg.evaluate(coletarCampos))
  const { texto, violacoes } = relatorio(aba ? `${rota} [${aba}]` : rota, larguraTela, avaliados)
  console.log(texto)

  const saida = join(tmpdir(), 'olhar')
  mkdirSync(saida, { recursive: true })
  const nome = `campos${rota.replace(/[^a-z0-9]+/gi, '-')}${aba ? `-${aba.replace(/[^a-z0-9]+/gi, '-')}` : ''}.json`
  writeFileSync(join(saida, nome), JSON.stringify(avaliados, null, 2))
  console.log(`  detalhe : ${join(saida, nome)}`)

  await b.close()
  process.exit(violacoes ? 1 : 0)
}
