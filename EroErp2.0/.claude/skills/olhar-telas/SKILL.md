---
name: olhar-telas
description: Abrir o sistema num Chrome real e OLHAR as telas — screenshot, PDF da impressão, checagem de 360 px, largura dos campos contra o docs/14 e erros de console. Use sempre que for validar visual, conferir uma folha impressa, testar responsividade, ou dar uma tela por pronta. Build e teste verdes NÃO substituem isto.
---

# Olhar as telas de verdade

Este projeto tem **zero testes de front**. Tudo o que a tela mostra — motivo de
ausência, folha impressa, rolagem em 360 px — só é verificável abrindo. E a
experiência do projeto de origem é literal: **dezenas de defeitos reais passaram
por `build`, `lint` e a suíte inteira verde** e só apareceram no navegador —
folhas impressas cujas contas não fechavam, traços mudos onde o servidor mandava
o motivo, eixo de gráfico com número em notação inglesa.

Não existe runner de teste de front, e não se vai criar um por causa disto. O
que existe é o driver abaixo.

## 1. Subir o que precisa estar de pé

Os dois, em background — a API demora ~40 s:

```bash
cd ero-erp-api && ./run-dev.sh          # :8080
cd ero && npm run dev                   # :5173
```

Esperar de verdade, sem `sleep` fixo:

```bash
until curl -s -o /dev/null localhost:8080/actuator/health && curl -s -o /dev/null localhost:5173; do sleep 3; done
```

Se o 8080 recusar conexão, **quase sempre é uma API antiga ainda no ar**:
encerre o processo Java antigo e suba de novo.

## 2. O driver

`playwright-core` **já está** em `ero/node_modules` (devDependency) — **não
instale playwright**. Ele dirige o Chrome do sistema (`CHROME_PATH`, ou o
caminho padrão do Windows / Linux — ver `olhar.mjs`):

```js
import { chromium } from '<repo>/ero/node_modules/playwright-core/index.mjs'

const b = await chromium.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', // não há browser baixado pelo playwright
  args: ['--no-sandbox'],
})
const pg = await (await b.newContext({ viewport: { width: 1440, height: 1100 } })).newPage()

const erros = []
pg.on('pageerror', (e) => erros.push(String(e)))
pg.on('console', (m) => m.type() === 'error' && erros.push(m.text()))

// window.print() abriria diálogo e travaria o headless.
await pg.addInitScript(() => { window.print = () => {} })

await pg.goto('http://localhost:5173/app/login', { waitUntil: 'domcontentloaded' })
// Superadmin de desenvolvimento: SUPERADMIN_EMAIL / SUPERADMIN_PASSWORD do
// ero-erp-api/.env (local, fora do git). O olhar.mjs já lê de lá sozinho.
await pg.fill('input[type="email"]', EMAIL)
await pg.fill('input[type="password"]', SENHA)
await pg.click('button[type="submit"]')
await pg.waitForSelector('aside', { timeout: 20000 })   // ver armadilha 1

await pg.goto('http://localhost:5173/app/pessoas', { waitUntil: 'domcontentloaded' })
await pg.waitForTimeout(1500)                            // ver armadilha 2
await pg.screenshot({ path: 'tela.png', fullPage: true })
console.log('erros:', erros.length ? erros : 'nenhum')
await b.close()
```

Rodar com `node arquivo.mjs`, do diretório do scratchpad. **Depois abrir o PNG
com a ferramenta Read** — gerar e não olhar não vale.

## 3. As treze armadilhas que custaram tempo

1. **Esperar por `aside`, nunca por `**/app**`.** O padrão `**/app**` casa com a
   própria `/app/login`, e o script segue achando que logou.
2. **A lista e as animações entram depois do `domcontentloaded`.** Sem
   `waitForTimeout(1500)` o screenshot sai antes delas.
3. **Máscara de centavos: os dígitos entram pela direita.** `fill('6800')` num
   campo de 2 casas vira **68,00**. Confira as casas no `TEntry` da tela — num
   campo com `casas={3}`, `500000` é que dá 500,000.
4. **Combo de pessoa ≠ seletor de tenant.** O primeiro `input[placeholder]`
   visível é o **trocador de tenant** do topo. Mire pelo rótulo:
   `pg.locator('label:text-is("Pessoa")').locator('xpath=following::input[1]')`.
5. **O rótulo do `<option>` pode levar detalhe junto** — nome e complemento entre
   parênteses. `selectOption({ label })` falha; case por conteúdo:
   ```js
   await pg.evaluate((txt) => {
     for (const s of document.querySelectorAll('select'))
       for (const o of s.options)
         if (o.textContent.includes(txt)) {
           s.value = o.value
           s.dispatchEvent(new Event('change', { bubbles: true }))
           return o.textContent
         }
   }, 'Texto da opção')
   ```
6. **Campo invisível é campo de outra aba.** Formulários em `TTabs`: clique na
   aba antes (`button:has-text("Endereços")`). O `fill` falha com "element
   is not visible" e o motivo é esse.
7. **O rate limit responde 429** se você varrer muitas rotas seguidas. É o
   Bucket4j funcionando, não defeito. E a causa costuma ser a 8 — não "muitas
   telas", e sim muitas **recargas**.
8. **`page.goto` gasta um `/auth/refresh`; navegue como o usuário navega.** O
   access token vive em memória: cada `goto` recarrega o documento, o boot
   restaura a sessão pelo refresh, e sete rotas em vinte segundos estouram o
   balde — a varredura então culpa 31 telas por um 429 que ela mesma provocou.
   Faça a navegação dentro da página; o React Router ouve `popstate`:
   ```js
   const ir = async (pg, rota) => {
     await pg.evaluate((r) => {
       history.pushState({}, '', r)
       dispatchEvent(new PopStateEvent('popstate'))
     }, rota)
     await pg.waitForTimeout(300)
   }
   ```
   O balde recarrega de minuto em minuto: se já estourou, espere 65 s antes de
   entrar de novo.
9. **Em dev o front fala com `/api`, nunca com `:8080`.** `VITE_API_URL=/api` e
   o proxy do Vite (`vite.config.ts`). Um `page.on('request')` filtrando por
   `:8080` não captura **nada** — e o script conclui "nenhuma requisição"
   diante de um 400 que está na tela.
10. **Registre a requisição no gancho `request`, não no `response`.** Fazer
    `await r.text()` antes do `push` faz a troca entrar no array depois que a
    verificação já o leu. `request` é síncrono e não perde.
11. **Ache o campo pelo RÓTULO, não pela posição no DOM.** `TEntry` e `TSelect`
    põem o `<label htmlFor>` como irmão, mas o **`TTextArea` embrulha** o
    controle — ali `following::textarea[1]` não acha nada, ou acha o campo do
    rótulo seguinte, calado. Use `getByLabel`, que é a associação que o
    navegador usa. Duas ressalvas: as abas escondidas continuam montadas com os
    mesmos rótulos (`.locator('visible=true')`), e o `aria-labelledby` faz o
    **painel da aba** responder pelo rótulo do campo homônimo — "Observações" é
    aba e é campo. Então:
    ```js
    const porRotulo = (pg, rot) =>
      pg.getByLabel(rot, { exact: true })
        .and(pg.locator('input, textarea, select'))
        .locator('visible=true').first()
    ```
12. **O combo tem debounce de 500 ms, e a lista velha já está na tela.** Esperar
    por `[role="option"]` visível é satisfeito na hora, pelo primeiro nome da
    pré-carga: buscar "Helena" e clicar em "Antônio". O teste segue verde
    medindo a pessoa errada. Espere a lista **casar com o que se digitou** —
    e note que enquanto busca há um `<li>` "Buscando…" **sem** `role="option"`,
    então `li` na união do seletor clica no nada e o salvar nem dispara.
    ```js
    await pg.waitForFunction((t) => {
      const l = [...document.querySelectorAll('[role="option"]')]
      return l.length > 0 && l.every((o) => o.textContent.toLowerCase().includes(t.toLowerCase()))
    }, texto, { timeout: 15000 })
    ```
13. **As casas da máscara mudam de campo para campo, na mesma tela.** O mesmo
    `fill('8000')` dá 8,000 num campo de `casas={3}` e 80,00 noutro de `2`, e um
    `inteiro` não tem vírgula. Leia o `mascara`/`casas` no `.tsx` antes de
    escolher os dígitos, sempre — o
    sintoma é um 400 de validação que parece defeito da aplicação e é do teste.

## 4. Conferir a impressão

A folha só existe no `documento` da `TPage`. Gere PDF, que é como o papel sai:

```js
await pg.pdf({ path: 'folha.pdf', format: 'A4', printBackground: true })
```

Depois **ler o PDF com a ferramenta Read** (`pages: "1-3"`). É assim que se
enxerga página em branco, quebra ruim, traço mudo e legenda que não fecha com o
número ao lado.

Para uma lista, a folha só monta depois de clicar em **Relatório** (que refaz a
consulta sem paginação) — espere ~2,5 s antes do `pdf()`.

## 5. Responsividade — regra 6 do projeto

Nenhuma tela é dada por pronta sem 360 px. O que se mede é a rolagem
horizontal, e vale identificar **o elemento culpado**, não só o sintoma:

```js
await pg.setViewportSize({ width: 360, height: 900 })
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
  return { rolagem: d.scrollWidth - d.clientWidth, culpado }
})
```

## 5.1 Larguras dos campos — docs/14

Campo curto esticado (data, hora, valor, CPF com 300 px) não quebra nada e
passa por build, lint e 360 px — só se vê medindo. `medir-campos.mjs`, ao lado
deste arquivo, mede cada campo visível do conteúdo (fora do header e do menu) a
1440 px e compara com a escala do
[doc 14 §2](../../../docs/14-layout-de-telas.md):

```bash
MSYS_NO_PATHCONV=1 node .claude/skills/olhar-telas/medir-campos.mjs /app/agenda/novo
MSYS_NO_PATHCONV=1 node .claude/skills/olhar-telas/medir-campos.mjs /app/pessoas/nova --aba "Endereços"
```

`✗` é campo acima do limite, `✓` dentro, `·` é campo longo — esse a régua não
julga. Sai com código 1 se houver `✗`, e grava o detalhe em
`<tmp do SO>/olhar/campos-<rota>.json`. O tipo do campo vem do `type` (date,
time), do rótulo (CPF, CEP, UF, Código…), do `inputmode` da máscara e, no
select, de ter poucas opções curtas. Rótulo novo que a régua não reconhece cai
em `·` — acrescente-o no `classificar`.

A régua mede **tamanho**. **Disposição** — ordem, agrupamento, um campo longo
por linha — se confere abrindo o screenshot do `olhar.mjs`.

## 6. A verificação de três vias — quando "abriu sem erro" não basta

Olhar a tela prova que ela **renderiza**. Não prova que o que foi digitado é o
que foi enviado, nem que o que foi enviado é o que ficou gravado. Entre o
`fill` e a linha do Postgres há três traduções — máscara → número, número →
JSON, JSON → coluna — e cada uma já errou neste projeto em silêncio (`72.5`
virando `725`, um id indo `null` com a caixa marcada).

`tres-vias.mjs`, ao lado deste arquivo, é o driver pronto: faz login, grava o
corpo de **todo** POST/PUT/PATCH, casa cada um com a sua resposta, e exporta
`porRotulo`, `escolherNoCombo`, `aba`, `ir` e `ok` já com as armadilhas de cima
resolvidas.

```js
import { abrir, campo, escolherNoCombo, ir, ok, P, saidaEm } from './tres-vias.mjs'
saidaEm('minha-verificacao.txt')
const { b, pg, estado } = await abrir()

await ir(pg, '/app/pessoas/nova')
await campo(pg, 'Nome').fill('Pessoa de Teste')
await campo(pg, 'Limite de crédito').fill('120000')   // 1.200,00 — campo ilustrativo

estado.trocas.length = 0
await pg.locator('button:has-text("Salvar")').click()
await pg.waitForTimeout(3000)

const t = estado.trocas.at(-1)                 // { m, u, env, st, res }
ok('a máscara virou 1200 no corpo', t.env.limiteCredito === 1200)
ok('e o servidor devolveu o mesmo', t.res.limiteCredito === 1200)
```

Depois reabra o registro e confira os campos, e leia a **linha no Postgres** —
são a quarta e a quinta vias, e é onde aparece a coluna com escala errada.

Quatro coisas que só esta verificação pega:

| O quê | Como aparece |
|---|---|
| Máscara mal lida | a tela mostra `1.500,00` e o corpo leva `1500000` |
| Campo que não é enviado | a caixa marcada e o id `null` no corpo |
| Derivado que não fecha | a folha diz um total e um percentual que não batem |
| Escala da coluna | você grava `9,263` e relê `9,26` |

## 7. Dado de teste

O banco de desenvolvimento é `ero_erp`, e às vezes a tabela que você quer olhar
está vazia. Criar pelo **endpoint**, com o token do login, é mais rápido e mais
fiel que pela tela:

A credencial do superadmin é a do `ero-erp-api/.env` (`SUPERADMIN_EMAIL`,
`SUPERADMIN_PASSWORD`) — local, fora do git; o `.env.example` traz só um
valor de exemplo, que **não** é a senha do banco desta máquina. Não chute
senha: login que falha conta tentativa e bloqueia a conta. O limite é de 5
logins por minuto (Bucket4j): reaproveite o token.

```bash
set -a; source ero-erp-api/.env; set +a
TOKEN=$(curl -s -X POST http://localhost:8080/auth/login \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$SUPERADMIN_EMAIL\",\"senha\":\"$SUPERADMIN_PASSWORD\"}" \
  | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log(JSON.parse(s).accessToken))")
```

Corpo com acento pelo `curl` do Git Bash chega quebrado ("Corpo da requisição
inválido"): para texto com acento, monte a requisição num script Node.

**Dados de demonstração que ficam:** os três tenants `(demo)` da
`ero-erp-api/scripts/bateria-filiais.mjs` existem de propósito, para ver o
isolamento entre tenants na tela. O resto que você criar à mão, **limpe**:
`PGPASSWORD=admin psql -h localhost -U postgres -d ero_erp`, e apague só as
linhas que você inseriu, por nome ou por data.

> As credenciais acima são do `.env` de desenvolvimento local e servem só para
> entrar no `localhost`. Não vão para lugar nenhum fora desta máquina.
