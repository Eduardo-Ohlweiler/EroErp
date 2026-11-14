/**
 * Mede a largura de cada campo visível de uma tela e aponta o que fugiu da escala do
 * docs/07-layout-de-telas.md §2: campo curto esticado (data, hora, valor, CPF, CEP, UF, código,
 * combo curto), proporcional que não ocupa a fração da coluna e campo só leitura sem fundo próprio.
 *
 *   node .claude/skills/olhar-telas/medir-campos.mjs /admin/contratantes/novo
 *   node .claude/skills/olhar-telas/medir-campos.mjs /admin/usuarios/42 --aba "Dados"
 *   node .claude/skills/olhar-telas/medir-campos.mjs /admin/contratantes --largura 1280
 *   node .claude/skills/olhar-telas/medir-campos.mjs /login --sem-login
 *   node .claude/skills/olhar-telas/medir-campos.mjs /admin/logs --espera '[data-kit="TDataGrid"] tbody tr'
 *
 * Antes de medir, espera o 1º campo do kit aparecer no conteúdo (a tela pode estar no esqueleto enquanto a API
 * responde) e a tela parar; `--espera "<seletor>"` troca o que se espera (até 15 s; sem ele aparecer, mede assim mesmo
 * e avisa).
 *
 * Mede a 1440 px por padrão: a escala vale a partir de `sm`, e no celular todo campo é 100 % de
 * propósito. Sai com código 1 se houver ✗ (dá para usar como verificação) e 2 se não conseguiu medir.
 *
 * Campos do kit são achados pelos atributos que o kit emite (doc 07 §7.1):
 *   data-kit="TEntry" (ou TDate, TCombo...)  no elemento de fora do campo, o que recebe a largura;
 *   data-largura="<token>"                    o token aplicado (o `width` ou o padrão do componente),
 *                                             ou "celula" quando o campo está fora de uma TRow;
 *   data-mascara="<mascara>"                  no TEntry com máscara;
 *   data-rotulo-max="<n>"                     no TCombo: caracteres do maior rótulo das opções (decide
 *                                             entre `situacao` e `medio`, doc 07 §2.1).
 * Rádio e grupo de caixas (`role=radiogroup`/`group`) saem com o rótulo do GRUPO (`aria-labelledby`), não o da
 * primeira opção.
 * Campo sem esses atributos (tela fora do kit) é medido como no 2.0, pelo rótulo, pelo `type` e
 * pelo `inputmode`, e sai marcado "fora do kit".
 *
 * A régua cobre TAMANHO. Disposição (ordem, agrupamento, um campo por linha) só se confere olhando o
 * screenshot do olhar.mjs.
 *
 * Mesmas variáveis do olhar.mjs (ver comum.mjs). No Git Bash do Windows, rode com MSYS_NO_PATHCONV=1.
 */
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

/**
 * Limite em px de cada token fixo: a largura do doc 07 §2.1 com folga de ~25 % (borda, sufixo,
 * arredondamento). Acima disso, o campo esticou.
 */
export const LIMITES = {
  uf: { doc: 80, limite: 110 },
  codigo: { doc: 128, limite: 165 },
  hora: { doc: 128, limite: 165 },
  quantidade: { doc: 128, limite: 165 },
  data: { doc: 160, limite: 205 },
  cep: { doc: 160, limite: 205 },
  valor: { doc: 160, limite: 205 },
  cpf: { doc: 176, limite: 225 },
  situacao: { doc: 192, limite: 245 },
  cnpj: { doc: 208, limite: 265 },
  dataHora: { doc: 224, limite: 285 },
  curto: { doc: 224, limite: 285 },
  medio: { doc: 320, limite: 400 },
}

/** Tokens proporcionais (doc 07 §2.2): fração da coluna que contém o campo, com mínimo. */
export const PROPORCIONAIS = {
  metade: { fracao: 0.5, minimo: 256 },
  longo: { fracao: 1, minimo: 256 },
}

/** Componentes de campo do kit (doc 07 §3.2). Estrutura (TRow, TCol, TForm...) não é medida. */
/**
 * Até quantos caracteres o maior rótulo de um TCombo cabe em `situacao` (192 px, ~132 px úteis depois do X e da
 * seta, a 13–14 px de fonte) e em `medio` (320 px). Acima de `medio`, livre.
 */
export const ROTULO_MAX = { situacao: 18, medio: 36 }

export const CAMPOS_DO_KIT = [
  'TEntry', 'TDate', 'TDateTime', 'TTextArea', 'TCombo', 'TDBCombo', 'TDBComboMulti',
  'TCheckBox', 'TDBCheckBox', 'TRadio', 'TDBRadio', 'TCor',
]

/**
 * Roda DENTRO da página (page.evaluate): lista os campos visíveis do conteúdo (o <main> da casca e
 * diálogos abertos, ou a página inteira fora da casca; nunca header, menu ou o que está escondido)
 * com rótulo, tipo, largura, largura da
 * coluna e fundo. Não classifica; isso é do `classificar`, que roda no Node.
 */
export function coletarCampos(camposDoKit) {
  // Dentro da casca o conteúdo é o <main>; a /login (fora da casca) não tem <main>: vale o body.
  const escopos = document.querySelector('main')
    ? [...document.querySelectorAll('main, [role="dialog"]')]
    : [document.body]
  const dentro = (el) => escopos.some((s) => s.contains(el))
  const fora = (el) => !dentro(el) || el.closest('header, aside, nav, [aria-hidden="true"], [inert]')
  const visivel = (el) => {
    const r = el.getBoundingClientRect()
    const s = getComputedStyle(el)
    return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'
  }
  const texto = (s) => (s ?? '').replace(/\*/g, '').trim().replace(/\s+/g, ' ')
  const rotuloDe = (ctrl, caixa) => {
    if (ctrl?.labels?.[0]) return texto(ctrl.labels[0].textContent)
    const por = ctrl?.getAttribute('aria-labelledby')
    if (por) return texto(por.split(/\s+/).map((id) => document.getElementById(id)?.textContent).join(' '))
    const l = caixa?.querySelector('label, legend, [id$="-rotulo"]')
    if (l) return texto(l.textContent)
    return texto(ctrl?.getAttribute('aria-label') ?? ctrl?.getAttribute('placeholder') ?? ctrl?.getAttribute('name'))
  }
  const larguraUtil = (el) => {
    if (!el) return null
    const s = getComputedStyle(el)
    return Math.round(el.clientWidth - parseFloat(s.paddingLeft) - parseFloat(s.paddingRight))
  }
  const somenteLeitura = (c) => !!c && (c.disabled || c.readOnly || c.getAttribute('aria-readonly') === 'true')
  const tipoDe = (c) => !c ? '' : c.tagName === 'INPUT' ? (c.getAttribute('type') ?? 'text').toLowerCase() : c.tagName.toLowerCase()
  const SELETOR_CONTROLE = 'input:not([type="hidden"]), select, textarea, [role="combobox"]'

  const campos = []
  const jaMedidos = new Set()

  // 1. Campos do kit, pelo atributo.
  for (const caixa of document.querySelectorAll('[data-kit][data-largura]')) {
    if (!camposDoKit.includes(caixa.dataset.kit) || fora(caixa) || !visivel(caixa)) continue
    const ctrl = caixa.querySelector(SELETOR_CONTROLE)
    // Rádio e grupo de caixas: o rótulo é o do grupo (aria-labelledby do radiogroup/group), não o da 1ª opção.
    const grupo = caixa.matches('[role="radiogroup"], [role="group"]') ? caixa : null
    caixa.querySelectorAll(SELETOR_CONTROLE).forEach((c) => jaMedidos.add(c))
    const opcoes = ctrl?.tagName === 'SELECT' ? [...ctrl.options].map((o) => o.textContent.trim()) : null
    campos.push({
      kit: caixa.dataset.kit,
      declarado: caixa.dataset.largura,
      mascara: caixa.dataset.mascara ?? '',
      rotulo: grupo ? rotuloDe(grupo, caixa) : rotuloDe(ctrl, caixa),
      rotuloMax: caixa.dataset.rotuloMax ? Number(caixa.dataset.rotuloMax) : null,
      tipo: tipoDe(ctrl),
      inputMode: ctrl?.getAttribute('inputmode') ?? '',
      largura: Math.round(caixa.getBoundingClientRect().width),
      coluna: larguraUtil(caixa.parentElement),
      opcoes,
      somenteLeitura: somenteLeitura(ctrl),
      fundo: ctrl ? getComputedStyle(ctrl).backgroundColor : '',
    })
  }

  // 2. O que sobrou: tela fora do kit (ou campo do kit sem os atributos), como no 2.0.
  for (const el of document.querySelectorAll(SELETOR_CONTROLE)) {
    if (jaMedidos.has(el) || fora(el) || !visivel(el)) continue
    const tipo = tipoDe(el)
    if (['checkbox', 'radio', 'submit', 'button', 'file', 'color', 'range'].includes(tipo)) continue
    // OtpInput e afins: casas de um caractere não são campo de dado.
    if (el.maxLength === 1) continue
    campos.push({
      kit: null,
      declarado: null,
      mascara: '',
      rotulo: rotuloDe(el, el.parentElement),
      rotuloMax: null,
      tipo,
      inputMode: el.getAttribute('inputmode') ?? '',
      largura: Math.round(el.getBoundingClientRect().width),
      coluna: null,
      opcoes: el.tagName === 'SELECT' ? [...el.options].map((o) => o.textContent.trim()) : null,
      somenteLeitura: somenteLeitura(el),
      fundo: getComputedStyle(el).backgroundColor,
    })
  }
  return campos
}

/** Que token o DADO pede (doc 07 §2.3), pela máscara, pelo componente, pelo tipo ou pelo rótulo; null = livre. */
export function classificar(c) {
  const porMascara = {
    cpf: 'cpf', telefone: 'cpf', celular: 'cpf', cnpj: 'cnpj', cpfCnpj: 'cnpj', cep: 'cep', hora: 'hora',
    moeda: 'valor', decimal: 'valor', decimalComSinal: 'valor', inteiro: 'quantidade',
  }
  if (c.mascara && porMascara[c.mascara]) return porMascara[c.mascara]
  if (c.kit === 'TDate') return 'data'
  if (c.kit === 'TDateTime') return 'dataHora'
  if (c.kit === 'TTextArea' || c.tipo === 'textarea') return null
  if (c.tipo === 'date') return 'data'
  if (c.tipo === 'time') return 'hora'
  if (c.tipo === 'datetime-local') return 'dataHora'
  const r = c.rotulo.toLowerCase()
  if (/\bcnpj\b/.test(r)) return 'cnpj'
  if (/\bcpf\b|telefone|celular|whatsapp/.test(r)) return 'cpf'
  if (/\bcep\b/.test(r)) return 'cep'
  if (/^uf$|\buf\b|^estado \(uf\)/.test(r)) return 'uf'
  // "Código" no começo do rótulo: "EAN (código de barras)" é texto curto, não código.
  if (/^c[oó]digo|^n[ºo°]\.?$/.test(r)) return 'codigo'
  // "Número" sozinho é o do endereço (doc 07 §2.1: `curto`), não o do registro.
  if (/^n[uú]mero$|^ean\b|^complemento$|^bairro$/.test(r)) return 'curto'
  if (c.kit === 'TCombo') {
    // Sem o data-rotulo-max (build antigo do front): o padrão do componente.
    if (c.rotuloMax == null) return 'situacao'
    if (c.rotuloMax <= ROTULO_MAX.situacao) return 'situacao'
    return c.rotuloMax <= ROTULO_MAX.medio ? 'medio' : null
  }
  if (c.tipo === 'select') {
    const o = c.opcoes ?? []
    return o.length > 0 && o.length <= 6 && o.every((t) => t.length <= 20) ? 'situacao' : null
  }
  if (!c.kit && (c.inputMode === 'decimal' || c.inputMode === 'numeric')) return 'valor'
  return null
}

const larguraDoToken = (t) => LIMITES[t]?.doc ?? (PROPORCIONAIS[t] ? Infinity : null)

/** Junta classificação, limite e proporção; `problemas` não vazio é ✗, `avisos` é !. */
export function avaliar(campos) {
  const avaliados = campos.map((c) => {
    const tipoDoc = classificar(c)
    const problemas = []
    const avisos = []

    // a) o dado pede um token fixo: não pode passar do limite dele (vale dentro e fora do kit)
    if (tipoDoc && LIMITES[tipoDoc] && c.largura > LIMITES[tipoDoc].limite) {
      problemas.push(`${tipoDoc} pede até ${LIMITES[tipoDoc].limite}px`)
    }
    // b) o token declarado tem de valer na tela (CSS quebrado, classe sobrescrita)
    if (c.declarado && LIMITES[c.declarado] && c.largura > LIMITES[c.declarado].limite) {
      problemas.push(`declarado ${c.declarado}, mas mede mais que ${LIMITES[c.declarado].limite}px`)
    }
    if (c.declarado && PROPORCIONAIS[c.declarado] && c.coluna) {
      const p = PROPORCIONAIS[c.declarado]
      const esperado = Math.min(c.coluna, Math.max(p.minimo, c.coluna * p.fracao))
      if (Math.abs(c.largura - esperado) > Math.max(12, esperado * 0.08)) {
        problemas.push(`${c.declarado} devia medir ~${Math.round(esperado)}px numa coluna de ${c.coluna}px`)
      }
    }
    // c) token declarado diferente do que o dado pede: mais largo já caiu em (a); mais estreito corta o dado
    if (c.declarado && tipoDoc && c.declarado !== tipoDoc) {
      const dec = larguraDoToken(c.declarado)
      const esp = larguraDoToken(tipoDoc)
      if (dec !== null && esp !== null && dec < esp) avisos.push(`declarado ${c.declarado}, o dado pede ${tipoDoc} (o plano justifica?)`)
    }
    if (c.declarado === 'celula') avisos.push('fora de TRow: ocupa a célula (§0)')
    return { ...c, tipoDoc, doc: LIMITES[tipoDoc]?.doc ?? null, limite: LIMITES[tipoDoc]?.limite ?? null, problemas, avisos }
  })

  // d) só leitura com o MESMO fundo de um campo editável: quem olha não vê que ali não se digita (§3.4)
  const editaveis = new Set(avaliados.filter((a) => !a.somenteLeitura && a.fundo).map((a) => a.fundo))
  for (const a of avaliados) {
    if (a.somenteLeitura && a.fundo && editaveis.has(a.fundo)) a.problemas.push('só leitura com o fundo de um campo editável')
  }
  return avaliados.map((a) => ({ ...a, estourou: a.problemas.length > 0 }))
}

export function relatorio(rota, larguraTela, avaliados) {
  const linhas = [`${rota} @ ${larguraTela}px — ${avaliados.length} campos`]
  const w = Math.max(8, ...avaliados.map((a) => a.rotulo.length))
  for (const a of avaliados) {
    const julgado = a.tipoDoc || LIMITES[a.declarado] || PROPORCIONAIS[a.declarado]
    const marca = a.estourou ? '✗' : a.avisos.length ? '!' : julgado ? '✓' : '·'
    const origem = a.kit ? `${a.kit} ${a.declarado}` : 'fora do kit'
    const regra = a.tipoDoc ? `${a.tipoDoc} (doc ${a.doc ?? '—'}px)`
      : LIMITES[a.declarado] ? `${a.declarado} (doc ${LIMITES[a.declarado].doc}px)`
      : PROPORCIONAIS[a.declarado] ? `proporcional, coluna de ${a.coluna ?? '?'}px`
        : a.declarado === 'conteudo' ? 'o tamanho do conteúdo'
          : 'longo/livre — conferir no olho'
    const notas = [...a.problemas, ...a.avisos].join('; ')
    linhas.push(`  ${marca} ${a.rotulo.padEnd(w)}  ${String(a.largura).padStart(4)}px  ${origem} · ${regra}${notas ? ` — ${notas}` : ''}`)
  }
  const ruins = avaliados.filter((a) => a.estourou)
  linhas.push(ruins.length
    ? `  ${ruins.length} campo(s) com problema: ${ruins.map((a) => a.rotulo).join(', ')}`
    : '  nenhum campo fora da escala')
  return { texto: linhas.join('\n'), violacoes: ruins.length }
}

// ── Execução direta ──────────────────────────────────────────────────────
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { abrirNavegador, ehPublica, entrar, esperarTelaParada, FRONT, ir, ouvirErros, SAIDA } = await import('./comum.mjs')

  const [, , rota = '/', ...resto] = process.argv
  const valorDe = (flag) => {
    const i = resto.indexOf(flag)
    return i >= 0 ? resto[i + 1] : undefined
  }
  const aba = valorDe('--aba')
  const larguraTela = Number(valorDe('--largura') ?? 1440)
  const semLogin = resto.includes('--sem-login') || ehPublica(rota)
  const espera = valorDe('--espera') ?? CAMPOS_DO_KIT.map((k) => `main [data-kit="${k}"], [role="dialog"] [data-kit="${k}"]`).join(', ')

  const { b, pg } = await abrirNavegador({ largura: larguraTela })
  ouvirErros(pg)
  let codigo = 0
  try {
    if (semLogin) {
      await pg.goto(`${FRONT}${rota}`, { waitUntil: 'domcontentloaded' })
      await esperarTelaParada(pg)
    } else {
      await entrar(pg)
      if (rota !== '/') await ir(pg, rota)
    }
    if (aba) {
      await pg.locator(`[role="tab"]:has-text("${aba}")`).first().click()
      await esperarTelaParada(pg, { minimo: 300 })
    }
    // A tela pode ter parado no esqueleto (a API ainda não respondeu): espera o 1º campo (ou o --espera) e a
    // montagem dos blocos dele terminar.
    const apareceu = await pg.locator(espera).first().waitFor({ state: 'visible', timeout: 15000 }).then(() => true, () => false)
    if (apareceu) await esperarTelaParada(pg, { minimo: 300 })
    else console.log(`  aviso   : nada de "${espera.length > 80 ? 'campo do kit' : espera}" em 15 s; medindo o que está na tela`)

    const avaliados = avaliar(await pg.evaluate(coletarCampos, CAMPOS_DO_KIT))
    const { texto, violacoes } = relatorio(aba ? `${rota} [${aba}]` : rota, larguraTela, avaliados)
    console.log(texto)

    const nome = `campos${rota.replace(/[^a-z0-9]+/gi, '-')}${aba ? `-${aba.replace(/[^a-z0-9]+/gi, '-')}` : ''}.json`
    writeFileSync(join(SAIDA, nome), JSON.stringify(avaliados, null, 2))
    console.log(`  detalhe : ${join(SAIDA, nome)}`)
    codigo = violacoes ? 1 : 0
  } catch (e) {
    console.error(String(e.message ?? e))
    codigo = 2
  } finally {
    await b.close()
  }
  process.exit(codigo)
}
