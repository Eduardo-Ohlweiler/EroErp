/**
 * Driver das três vias: PREENCHI → ENVIADO → PERSISTIDO.
 *
 * O `estado.trocas` guarda o corpo de cada POST/PUT/PATCH/DELETE que a tela dispara para a API e,
 * ao lado, a resposta. Comparar os dois com o que foi digitado é a verificação que build, vitest e
 * a suíte da API não fazem.
 *
 *   import { abrir, campo, ir, ok, saidaEm } from './tres-vias.mjs'
 *   saidaEm('<scratchpad>/minha-verificacao.txt')
 *   const { b, pg, estado } = await abrir()        // entra pela /login com o código do Mailpit
 *   await ir(pg, '/admin/contratantes/novo')
 *   ...
 *
 * Mesmas variáveis do olhar.mjs (ver comum.mjs). Só entra no modo Mailpit.
 */
import fs from 'node:fs'
import { join } from 'node:path'
import { abrirNavegador, entrar, ir as irComum, medirRolagem, SAIDA } from './comum.mjs'

export { esperarTelaParada } from './comum.mjs'

export const linhas = []
let arquivo = join(SAIDA, 'verificacao.txt')
export function saidaEm(f) { arquivo = f }
export function P(...a) {
  const s = a.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).join(' ')
  linhas.push(s)
  fs.writeFileSync(arquivo, linhas.join('\n') + '\n')
}
export let falhas = 0
export function ok(t, v, extra = '') {
  if (!v) falhas++
  P(`${v ? '  ok  ' : ' FALHA'} ${t}${extra ? ' — ' + extra : ''}`)
  return v
}

/** Caminho da API sem origem e sem o prefixo: "/tenants/42". */
const caminhoDaApi = (url) => new URL(url).pathname.replace(/^\/api(?=\/)/, '')

export async function abrir({ largura = 1440, credencial } = {}) {
  const { b, pg } = await abrirNavegador({ largura, altura: 1200 })
  const estado = { erros: [], trocas: [] }
  pg.on('pageerror', (e) => estado.erros.push(String(e).slice(0, 160)))
  pg.on('console', (m) => {
    if (m.type() === 'error' && !m.text().includes('Failed to load resource'))
      estado.erros.push(m.text().slice(0, 160))
  })
  /*
   * Requisição e resposta em DOIS ganchos. Fazer tudo dentro do `response` com um `await r.text()`
   * antes do `push` já custou uma rodada inteira no 2.0: a troca só entrava no array depois do await,
   * e a verificação lia o array antes — concluindo "nenhuma requisição" diante de um 400 que estava
   * na tela. Registrar no `request` é síncrono e não tem como perder.
   *
   * O front fala com `/api` na MESMA origem (nginx do Docker ou proxy do Vite), nunca com `:8080`.
   */
  pg.on('request', (q) => {
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(q.method())) return
    const u = new URL(q.url())
    if (!u.pathname.startsWith('/api/') || u.pathname.startsWith('/api/auth/')) return
    let env = null
    try { env = JSON.parse(q.postData() || 'null') } catch { env = q.postData() }
    estado.trocas.push({ m: q.method(), u: caminhoDaApi(q.url()), env, st: null, res: null })
  })
  pg.on('response', async (r) => {
    const t = estado.trocas.find((x) => x.st === null && x.u === caminhoDaApi(r.url()) && x.m === r.request().method())
    if (!t) return
    t.st = r.status()
    try { t.res = JSON.parse(await r.text()) } catch { t.res = null }
  })
  await entrar(pg, credencial)
  return { b, pg, estado }
}

/**
 * O controle pelo RÓTULO, não pela posição no DOM. O CampoForm liga o <label htmlFor> ao controle, e
 * é essa associação que o navegador (e o `getByLabel`) usa. `visible=true` porque abas escondidas
 * continuam montadas com os mesmos rótulos; e só controle de formulário serve, porque o painel da aba
 * responde pelo `aria-labelledby` com o mesmo texto ("Dados" é aba e pode ser rótulo).
 */
export const porRotulo = (pg, rot) =>
  pg
    .getByLabel(rot, { exact: true })
    .and(pg.locator('input, textarea, select, [role="combobox"]'))
    .locator('visible=true')
    .first()
export const campo = porRotulo
export const area = porRotulo
export const selec = porRotulo

/**
 * O combo (Combobox glass, por baixo do TCombo e do TDBCombo). Enquanto busca, a lista tem um <li>
 * "Carregando…" com role="presentation", SEM role="option" — clicar no primeiro `li` clica no nada.
 * E a lista JÁ ESTÁ na tela quando se digita (pré-carga sem termo); o filtro só chega depois do
 * debounce. Esperar por qualquer `[role="option"]` visível é satisfeito na hora pela lista velha:
 * buscar "Helena" e clicar em "Antônio". Só serve esperar pela lista QUE CASA COM O QUE SE DIGITOU.
 */
export async function escolherNoCombo(pg, rot, texto) {
  const i = porRotulo(pg, rot)
  await i.click()
  await i.fill(texto)
  const opcao = pg.locator(`[role="option"]:has-text("${texto}")`).first()
  await opcao.waitFor({ state: 'visible', timeout: 15000 })
  await pg.waitForFunction(
    (t) => {
      const l = [...document.querySelectorAll('[role="option"]')]
      return l.length > 0 && l.every((o) => o.textContent.toLowerCase().includes(t.toLowerCase()))
    },
    texto,
    { timeout: 15000 },
  )
  const nome = (await opcao.innerText()).trim()
  await opcao.click()
  await pg.waitForTimeout(600)
  return nome
}

export async function aba(pg, nome) {
  await pg.locator(`[role="tab"]:has-text("${nome}")`).first().click()
  await pg.waitForTimeout(600)
}

/** O texto que a tela mostra junto de um rótulo (valor calculado, campo só leitura renderizado como texto). */
export async function resultado(pg, rot) {
  const l = pg.locator('main').locator(`:text-is("${rot}")`).first()
  if (!(await l.count())) return null
  return (await l.locator('xpath=..').innerText()).replace(/\s+/g, ' ').trim()
}

export async function rolagem(pg) {
  return (await medirRolagem(pg)).rolagem
}

/** Navegar sem recarregar (um `goto` gastaria um /api/auth/refresh): ver comum.mjs. */
export const ir = irComum
