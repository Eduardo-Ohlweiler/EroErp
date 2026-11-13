/**
 * Abre uma rota do CRM num Chrome real, espera a tela se montar, tira screenshot e, se pedido,
 * gera o PDF da folha impressa.
 *
 *   node .claude/skills/olhar-telas/olhar.mjs /login login --sem-login
 *   node .claude/skills/olhar-telas/olhar.mjs / inicio
 *   node .claude/skills/olhar-telas/olhar.mjs /admin/contratantes contratantes --todas
 *   node .claude/skills/olhar-telas/olhar.mjs /admin/contratantes/novo contratante --768
 *   node .claude/skills/olhar-telas/olhar.mjs /admin/contratantes lista --pdf
 *   node .claude/skills/olhar-telas/olhar.mjs /admin/contratantes lista --tema claro
 *
 * Larguras: 1440 (padrão), --768, --360, ou --todas (as três, num login só).
 * --sem-login       rota pública (a /login entra assim sozinha) ou o catálogo /design-system no Vite
 * --tema claro|escuro  força o data-theme do <html> depois de montar (contraste nos dois temas)
 * --movimento-reduzido emula prefers-reduced-motion
 * --pdf             gera a folha impressa (a do `documento` da TPage)
 *
 * Sai em <tmp do SO>/olhar-crm/<nome>-<largura>.png (e <nome>.pdf). Depois ABRA o arquivo com a
 * ferramenta Read: gerar e não olhar não vale de nada.
 *
 * Rotas protegidas entram pela /login com o código lido no Mailpit (ver comum.mjs). No modo Gmail o
 * script se recusa a entrar.
 *
 * No Git Bash do Windows, rode com MSYS_NO_PATHCONV=1: sem isso o shell transforma "/admin/..."
 * em "C:/Program Files/Git/admin/...".
 */
import { join } from 'node:path'
import {
  abrirNavegador, ehPublica, entrar, esperarTelaParada, FRONT, ir, LARGURAS, medirRolagem, ouvirErros, SAIDA,
} from './comum.mjs'

const [, , rota = '/', nome = 'tela', ...flags] = process.argv
const valorDe = (flag) => {
  const i = flags.indexOf(flag)
  return i >= 0 ? flags[i + 1] : undefined
}
const pdf = flags.includes('--pdf')
const semLogin = flags.includes('--sem-login') || ehPublica(rota)
const tema = { claro: 'light', escuro: 'dark' }[valorDe('--tema') ?? ''] ?? null
const larguras = flags.includes('--todas') ? LARGURAS
  : flags.includes('--360') ? [360] : flags.includes('--768') ? [768] : [1440]

const { b, pg } = await abrirNavegador({ largura: larguras[0], reduzir: flags.includes('--movimento-reduzido') })
const { erros, api } = ouvirErros(pg)

try {
  if (semLogin) {
    await pg.goto(`${FRONT}${rota}`, { waitUntil: 'domcontentloaded' })
    await esperarTelaParada(pg)
  } else {
    await entrar(pg)
    if (rota !== '/') await ir(pg, rota)
  }
  if (tema) {
    await pg.evaluate((t) => { document.documentElement.dataset.theme = t }, tema)
    await pg.waitForTimeout(400)
  }

  console.log(`${rota}${tema ? ` (tema ${valorDe('--tema')} forçado)` : ''}`)
  for (const largura of larguras) {
    if (largura !== larguras[0]) {
      await pg.setViewportSize({ width: largura, height: 1100 })
      await esperarTelaParada(pg, { minimo: 400 })
    }
    const arquivo = join(SAIDA, `${nome}-${largura}.png`)
    await pg.screenshot({ path: arquivo, fullPage: true })
    const m = await medirRolagem(pg)
    console.log(`  @ ${String(largura).padStart(4)}px  ${arquivo}`)
    console.log(`           rolagem horizontal: ${m.rolagem}px${m.culpado ? ` ← ${m.culpado}` : ''}`)
  }

  const fim = await pg.evaluate(() => ({
    caminho: location.pathname,
    folhas: document.querySelectorAll('[data-kit="folha"]').length,
    kit: document.querySelectorAll('main [data-kit]').length,
  }))
  if (pdf) {
    const arquivo = join(SAIDA, `${nome}.pdf`)
    await pg.pdf({ path: arquivo, format: 'A4', printBackground: true })
    console.log(`  pdf     : ${arquivo}`)
  }
  if (fim.caminho !== rota.split('?')[0]) console.log(`  ATENÇÃO : terminou em ${fim.caminho} (redirecionou?)`)
  console.log(`  kit     : ${fim.kit ? `${fim.kit} elementos com data-kit` : 'nenhum (tela fora do kit)'}`)
  console.log(`  folha   : ${fim.folhas ? 'monta' : 'nenhuma'}`)
  console.log(`  api     : ${api.length ? api.slice(0, 5).join(' | ') : 'nenhuma resposta de erro'}`)
  console.log(`  erros   : ${erros.length ? erros.slice(0, 3).join(' | ') : 'nenhum'}`)
} catch (e) {
  console.error(String(e.message ?? e))
  process.exitCode = 2
} finally {
  await b.close()
}
