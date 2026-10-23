/**
 * Abre uma rota do sistema num Chrome real, tira screenshot e, se pedido, gera
 * o PDF da folha impressa.
 *
 *   node .claude/skills/olhar-telas/olhar.mjs /app tela
 *   node .claude/skills/olhar-telas/olhar.mjs /app/pessoas lista --pdf
 *   node .claude/skills/olhar-telas/olhar.mjs /app/usuarios usuarios --360
 *   node .claude/skills/olhar-telas/olhar.mjs /app/produtos/novo produto --768   (tablet)
 *
 * Sai em <tmp do SO>/olhar/<nome>.png (e .pdf). Depois ABRA o arquivo — gerar
 * e não olhar não vale de nada.
 *
 * Variáveis opcionais: CHROME_PATH, OLHAR_EMAIL, OLHAR_SENHA. Sem as duas
 * últimas, entra com o superadmin do ero-erp-api/.env.
 *
 * No Git Bash do Windows, rode com MSYS_NO_PATHCONV=1: sem isso o shell
 * transforma "/app/..." em "C:/Program Files/Git/app/...".
 */
import { chromium } from '../../../ero/node_modules/playwright-core/index.mjs'
import { mkdirSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const CHROME = process.env.CHROME_PATH
  ?? (process.platform === 'win32'
    ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    : '/usr/bin/google-chrome')

/**
 * Credencial do superadmin de desenvolvimento: OLHAR_EMAIL/OLHAR_SENHA, senão
 * o SUPERADMIN_EMAIL/SUPERADMIN_PASSWORD do `ero-erp-api/.env` (local, fora do
 * git — é o que vale na máquina), senão o `.env.example`.
 */
function lerDotEnv() {
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
const EMAIL = process.env.OLHAR_EMAIL ?? dotEnv.SUPERADMIN_EMAIL ?? 'ohlweilereduardo@gmail.com'
const SENHA = process.env.OLHAR_SENHA ?? dotEnv.SUPERADMIN_PASSWORD ?? 'Admin123@Ero'

const [, , rota = '/app', nome = 'tela', ...flags] = process.argv
const pdf = flags.includes('--pdf')
const largura = flags.includes('--360') ? 360 : flags.includes('--768') ? 768 : 1440
const SAIDA = join(tmpdir(), 'olhar')
mkdirSync(SAIDA, { recursive: true })

const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] })
const pg = await (await b.newContext({ viewport: { width: largura, height: 1100 } })).newPage()

const erros = []
pg.on('pageerror', (e) => erros.push(String(e)))
pg.on('console', (m) => m.type() === 'error' && erros.push(m.text()))
// Sem isto o window.print() abre diálogo e trava o headless.
await pg.addInitScript(() => { window.print = () => {} })

await pg.goto('http://localhost:5173/app/login', { waitUntil: 'domcontentloaded' })
await pg.fill('input[type="email"]', EMAIL)
await pg.fill('input[type="password"]', SENHA)
await pg.click('button[type="submit"]')
// `aside` e não `**/app**`: esse padrão casa com a própria /app/login.
await pg.waitForSelector('aside', { timeout: 20000 })

await pg.goto(`http://localhost:5173${rota}`, { waitUntil: 'domcontentloaded' })
// Dá tempo às consultas e às animações de layout.
await pg.waitForTimeout(1800)

await pg.screenshot({ path: `${SAIDA}/${nome}.png`, fullPage: true })
if (pdf) await pg.pdf({ path: `${SAIDA}/${nome}.pdf`, format: 'A4', printBackground: true })

const m = await pg.evaluate(() => {
  const d = document.documentElement
  let culpado = ''
  if (d.scrollWidth > d.clientWidth + 1)
    for (const e of document.querySelectorAll('*')) {
      const r = e.getBoundingClientRect()
      if (r.right > d.clientWidth + 1 && r.width > 20) {
        culpado = `${e.tagName}.${String(e.className).slice(0, 40)}`
        break
      }
    }
  return { rolagem: d.scrollWidth - d.clientWidth, culpado, folhas: document.querySelectorAll('.folha').length }
})

console.log(`${rota} @ ${largura}px`)
console.log(`  arquivo : ${SAIDA}/${nome}.png${pdf ? ` (+ .pdf)` : ''}`)
console.log(`  rolagem : ${m.rolagem}px ${m.culpado ? `← ${m.culpado}` : ''}`)
console.log(`  folha   : ${m.folhas > 0 ? 'monta' : 'nenhuma'}`)
console.log(`  erros   : ${erros.length ? erros.slice(0, 3).join(' | ') : 'nenhum'}`)
await b.close()
