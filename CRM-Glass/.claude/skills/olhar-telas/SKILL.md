---
name: olhar-telas
description: Abrir o CRM Glass num Chrome real e OLHAR as telas — screenshot a 1440, 768 e 360 px, montagem em blocos terminada, PDF da impressão, largura dos campos contra o docs/07, erros de console e da API. Entra sozinho pelo código do Mailpit. Use sempre que for validar visual, conferir uma folha impressa, testar responsividade ou dar uma tela por pronta. Build e vitest verdes NÃO substituem isto.
---

# Olhar as telas de verdade

O `ero-web` tem vitest (lógica e componentes em jsdom), mas nada nele abre a tela
num navegador. Tudo o que só existe desenhado — a montagem em blocos, o vidro
sobre o fundo, a linha que quebra no tablet, a rolagem em 360 px, a folha
impressa — só é verificável abrindo. A experiência do EroErp 2.0, de onde esta
skill veio, é literal: **dezenas de defeitos reais passaram por `build`, `lint`
e a suíte inteira verde** e só apareceram no navegador.

Não se cria runner de teste de front por causa disto. O que existe é o driver
desta pasta:

| Arquivo | Para quê |
|---|---|
| `comum.mjs` | playwright-core, Chrome, credencial, **login pelo código do Mailpit**, `ir()`, espera da montagem, rolagem, erros |
| `olhar.mjs` | screenshot de uma rota em 1440, 768 e/ou 360 px, PDF, tema forçado |
| `medir-campos.mjs` | régua das larguras do [doc 07 §2](../../../docs/07-layout-de-telas.md) |
| `tres-vias.mjs` | PREENCHI → ENVIADO → PERSISTIDO (§6) |

Tudo o que os scripts gravam vai para `<tmp do SO>/olhar-crm/`. Rode da pasta
`CRM-Glass`; no Git Bash do Windows, **sempre com `MSYS_NO_PATHCONV=1`** (sem
isso o shell transforma `/admin/...` em `C:/Program Files/Git/admin/...`).

## 1. Subir o que precisa estar de pé

O caminho padrão é o stack do Docker (banco, API e front no nginx), na pasta
`CRM-Glass` — ver `CONTINUAR.md`, "Rodar tudo com Docker":

```bash
docker compose ps        # o que está de pé, e em que modo
```

- **Front:** http://localhost:5173 (nginx; o `/api` passa por ele, mesma origem).
- **API:** http://localhost:8080 (Swagger em `/swagger-ui.html`).
- **Mailpit:** http://localhost:8025, **só no modo Mailpit**.

**Todo login pede um código de 6 dígitos por e-mail** — todos os usuários,
sempre. Por isso há dois modos, e eles importam aqui:

| Modo | Como sobe | `docker compose ps` mostra | Login automático |
|---|---|---|---|
| Gmail (padrão) | `docker compose up -d` | `api`, `postgres`, `web` | **recusado**: o código iria para a caixa de verdade do dono a cada execução |
| Mailpit | `docker compose -f compose.yaml -f deploy/dev/compose.mailpit.yaml up -d` | também `mailpit` | funciona: o código é lido em `localhost:8025` |

Os scripts conferem o modo antes de digitar qualquer coisa (o Mailpit tem de
responder e a API do Docker tem de estar com `MAIL_HOST=mailpit`) e **param sem
logar** se for Gmail. Trocar de modo recria a API: se outra sessão está usando o
stack, combine antes. Rota pública (`/login`) não precisa de login e funciona
em qualquer modo.

Esperar de verdade, sem `sleep` fixo:

```bash
until curl -s -o /dev/null localhost:8080/actuator/health && curl -s -o /dev/null localhost:5173; do sleep 3; done
```

**Front no Vite** (para ver uma mudança sem rebuild da imagem, ou o catálogo
`/design-system`, que só existe em dev): o preview `ero-web` do
`.claude/launch.json` sobe na 5173, que o nginx do Docker já ocupa. Suba o Vite
em outra porta (`npm run dev --prefix ero-web -- --port 5174`) e passe
`OLHAR_FRONT=http://localhost:5174`. O proxy do Vite manda `/api` para a 8080.

## 2. O driver

**Playwright:** como no 2.0, só o `playwright-core` (sem navegador baixado),
dirigindo o Chrome do sistema (`CHROME_PATH`, ou o caminho padrão do Windows /
Linux). **Não instale nada global.** O `comum.mjs` procura, nesta ordem:

1. `OLHAR_PLAYWRIGHT` (a pasta do pacote, ou a de um `npm install --prefix`);
2. `ero-web/node_modules/playwright-core` — onde ele mora no 2.0 (devDependency
   do front); ainda não está no `ero-web`;
3. `../EroErp2.0/ero/node_modules/playwright-core` — a cópia do 2.0, ao lado
   deste repositório nesta máquina. É ela que roda hoje.

Sem nenhuma das três: `npm install --prefix "<scratchpad>/olhar-pw"
playwright-core@1.62.1` e `OLHAR_PLAYWRIGHT="<scratchpad>/olhar-pw"`.

**Credencial:** `OLHAR_EMAIL`/`OLHAR_SENHA`, senão `SUPERADMIN_EMAIL`/
`SUPERADMIN_SENHA` do `ero-api/.env` (local, fora do git). **A senha nunca é
impressa**, e o e-mail sai mascarado (`ma***@dominio`). Não chute senha: login
errado conta tentativa e bloqueia a conta.

**Login:** o `entrar(pg)` faz o que a pessoa faz — e-mail e senha na `/login`,
lê o código da mensagem mais nova para aquele destinatário que chegou **depois**
do clique (não depende do relógio do container), digita nas casas e espera a
URL sair da `/login`. O token de acesso fica só em memória; o refresh fica no
cookie httpOnly `ero_refresh` (Path=/api/auth), e o front o usa ao abrir a
página (`POST /api/auth/refresh` com `X-Ero-Refresh: 1`). Por isso, depois de
entrar, **navegue com `ir()`**, nunca com `goto` (armadilha 8).

```bash
MSYS_NO_PATHCONV=1 node .claude/skills/olhar-telas/olhar.mjs /login login --sem-login --todas
MSYS_NO_PATHCONV=1 node .claude/skills/olhar-telas/olhar.mjs /admin/contratantes contratantes --todas
MSYS_NO_PATHCONV=1 node .claude/skills/olhar-telas/olhar.mjs /admin/contratantes/novo contratante --tema claro
```

Script próprio (no scratchpad), com as peças prontas:

```js
import { abrirNavegador, entrar, ir, medirRolagem, ouvirErros } from '<CRM-Glass>/.claude/skills/olhar-telas/comum.mjs'

const { b, pg } = await abrirNavegador({ largura: 1440 })
const { erros, api } = ouvirErros(pg)          // console e respostas 4xx/5xx da API
await entrar(pg)                               // para no modo Gmail
await ir(pg, '/admin/contratantes')            // sem recarregar; espera a montagem
await pg.screenshot({ path: '<scratchpad>/tela.png', fullPage: true })
console.log(await medirRolagem(pg), erros, api)
await b.close()
```

**Depois abra o PNG com a ferramenta Read** — gerar e não olhar não vale.

## 3. As armadilhas que custaram tempo

1. **Espere a URL sair da `/login`, nunca por `aside`.** O menu lateral é
   `hidden md:flex`: a 360 e 768 px ele existe mas não aparece, e esperar por
   ele trava. Também não espere por `main`: fora da casca a página pode ter o
   seu.
2. **A tela se monta em blocos.** Screenshot logo depois do `domcontentloaded`
   sai com cartões no meio do caminho. O `esperarTelaParada` espera posição,
   tamanho e opacidade pararem — fora os orbs do fundo vivo e o canvas da cena,
   que não param nunca. Tempo fixo erra para os dois lados.
3. **Máscara de centavos: os dígitos entram pela direita.** `fill('6800')` num
   `TEntry mascara="moeda"` de 2 casas vira **68,00**. Confira as `casas` no
   `.tsx`.
4. **Mire pelo rótulo, não pelo primeiro campo visível.** A barra superior pode
   ter campo (a busca do `CommandPalette`) e o superadmin tem o seletor de
   contratante. `porRotulo` (§6) resolve.
5. **O `Combobox` não é `<select>`.** `selectOption` não serve. A opção pode
   levar `detalhe` junto do rótulo; use `escolherNoCombo` com um pedaço do
   texto.
6. **Campo invisível é campo de outra aba.** Formulários em `TTabs`: clique na
   aba antes (`[role="tab"]:has-text("Dados")`). O `fill` falha com "element is
   not visible" e o motivo é esse.
7. **O rate limit responde 429**, por IP e por minuto (`app.rate-limit`): login
   10, código 10 (verificar e reenviar no mesmo balde), refresh 30, o resto 300.
   É defeito do teste, não da aplicação; e a causa costuma ser a 8.
8. **`page.goto` gasta um `/api/auth/refresh`; navegue como o usuário navega.**
   Cada `goto` recarrega o documento e o boot restaura a sessão pelo cookie.
   Trinta recargas num minuto estouram o balde e a varredura culpa as telas por
   um 429 que ela mesma provocou. O `ir()` empurra a rota no histórico e o React
   Router ouve `popstate`. Se já estourou, espere 65 s.
9. **O front fala com `/api` na mesma origem, nunca com `:8080`.** No Docker o
   nginx repassa; no Vite, o proxy do `vite.config.ts`. Um
   `page.on('request')` filtrando por `:8080` não captura **nada**.
10. **Registre a requisição no gancho `request`, não no `response`.** Um `await
    r.text()` antes do `push` faz a troca entrar no array depois que a
    verificação já o leu. `request` é síncrono e não perde.
11. **Ache o campo pelo RÓTULO** (`getByLabel`, a associação que o navegador
    usa), só entre controles de formulário e só os visíveis: abas escondidas
    continuam montadas com os mesmos rótulos, e o painel da aba responde pelo
    `aria-labelledby` com o mesmo texto.
12. **O combo tem debounce, e a lista velha já está na tela.** Esperar por
    `[role="option"]` visível é satisfeito na hora pela pré-carga: buscar
    "Helena" e clicar em "Antônio". E enquanto busca há um `<li>` "Carregando…"
    com `role="presentation"`. Espere a lista **casar com o que se digitou**
    (o `escolherNoCombo` já faz).
13. **As casas da máscara mudam de campo para campo, na mesma tela.** O mesmo
    `fill('8000')` dá 8,000 num campo de `casas={3}` e 80,00 noutro de 2.
    O sintoma é um 400 que parece defeito da aplicação e é do teste.
14. **O código do login é um por login.** Cada `entrar()` gasta um login, um
    código e uma mensagem no Mailpit. Não chame "Reenviar" (manda o mesmo
    código, no máximo 5 vezes, 60 s entre envios); o código vale 10 min e é de
    uso único. Faça várias larguras num login só (`--todas`) e reaproveite a
    página.
15. **Tema e destaque vêm do contratante.** O superadmin na plataforma vê a
    aparência padrão (escuro, violeta). Para conferir o tema claro, `--tema
    claro` força o `data-theme` do `<html>` depois de montar (a cena de fundo
    não troca), ou entre com um usuário de um contratante de tema claro (§7).
16. **O catálogo `/design-system` só existe no Vite** (`import.meta.env.DEV`).
    No nginx do Docker, que serve o build de produção, a rota cai no Início.

## 4. Conferir a impressão

A folha só existe no `documento` da `TPage` (doc 07 §3.4), dentro de
`[data-kit="folha"]`. Gere PDF, que é como o papel sai:

```bash
MSYS_NO_PATHCONV=1 node .claude/skills/olhar-telas/olhar.mjs /admin/contratantes lista --pdf
```

Depois **leia o PDF com a ferramenta Read** (`pages: "1-3"`). É assim que se
enxerga página em branco, quebra ruim, vidro e fundo que não deviam sair no
papel, e traço mudo onde o servidor mandava o dado. Numa lista, a folha só
monta depois de clicar em **Pdf** (que refaz a consulta sem paginação): num
script próprio, clique e espere a folha antes do `pg.pdf()`.

## 5. Responsividade

Nenhuma tela é dada por pronta sem **1440, 768 e 360 px** (`--todas`, num login
só). É no tablet que a linha dividida em `TCol`s tem de quebrar sem espremer
campo, e no celular que tudo empilha. O `olhar.mjs` mede a rolagem horizontal e
aponta **o elemento culpado** (com o `data-kit` dele, quando é do kit), não só
o sintoma.

Também vale olhar com `--movimento-reduzido`: a montagem vira só esmaecer, e
nada pode depender dela.

## 5.1 Larguras dos campos — docs/07

Campo curto esticado (data, hora, valor, CPF com 300 px) não quebra nada e
passa por build, vitest e 360 px — só se vê medindo. O `medir-campos.mjs` mede
cada campo visível do conteúdo (o `<main>` e os diálogos abertos; fora da
barra superior e do menu) a 1440 px:

```bash
MSYS_NO_PATHCONV=1 node .claude/skills/olhar-telas/medir-campos.mjs /admin/contratantes/novo
MSYS_NO_PATHCONV=1 node .claude/skills/olhar-telas/medir-campos.mjs /admin/usuarios/42 --aba "Dados"
MSYS_NO_PATHCONV=1 node .claude/skills/olhar-telas/medir-campos.mjs /login --sem-login
```

Nos campos do kit ele lê o que o kit emite (doc 07 §7.1): `data-kit` (qual
componente), `data-largura` (o token aplicado, ou `celula` fora de `TRow`) e
`data-mascara`. Confere quatro coisas:

| Marca | O quê |
|---|---|
| `✗` | o dado pede um token fixo (pela máscara, pelo componente, pelo tipo ou pelo rótulo) e o campo passou do limite dele |
| `✗` | o token declarado não vale na tela: fixo acima do limite, ou proporcional (`metade`, `longo`) longe da fração da coluna |
| `✗` | campo só leitura com o mesmo fundo de um editável (§3.4 do doc 07) |
| `!` | token declarado mais estreito que o dado pede, ou campo fora de `TRow` — só aviso: o plano pode justificar |
| `✓` / `·` | dentro da escala / livre, a régua não julga |

Campo sem os atributos (tela fora do kit) é medido como no 2.0, pelo rótulo,
pelo `type` e pelo `inputmode`, e sai marcado "fora do kit". Sai com código 1
se houver `✗`, 2 se não conseguiu medir, e grava o detalhe em
`<tmp do SO>/olhar-crm/campos-<rota>.json`. Rótulo novo que a régua não
reconhece cai em `·` — acrescente-o no `classificar`.

A régua mede **tamanho**. **Disposição** — ordem, agrupamento, um campo por
linha — se confere abrindo o screenshot do `olhar.mjs`.

## 6. A verificação de três vias — quando "abriu sem erro" não basta

Olhar a tela prova que ela **renderiza**. Não prova que o que foi digitado é o
que foi enviado, nem que o que foi enviado é o que ficou gravado. Entre o
`fill` e a linha do Postgres há três traduções — máscara → número, número →
JSON, JSON → coluna — e cada uma já errou em silêncio no 2.0 (`72.5` virando
`725`, um id indo `null` com a caixa marcada).

O `tres-vias.mjs` faz login (modo Mailpit), grava o corpo de **todo**
POST/PUT/PATCH/DELETE para `/api` (fora `/api/auth`), casa cada um com a sua
resposta, e exporta `porRotulo`, `escolherNoCombo`, `aba`, `ir` e `ok` com as
armadilhas de cima resolvidas.

```js
import { abrir, campo, ir, ok, saidaEm } from '<CRM-Glass>/.claude/skills/olhar-telas/tres-vias.mjs'
saidaEm('<scratchpad>/verificacao-contratante.txt')
const { b, pg, estado } = await abrir()

await ir(pg, '/admin/contratantes/novo')
await campo(pg, 'Nome').fill('Contratante de Teste')      // exemplo: preencha também
await campo(pg, 'Limite de usuários').fill('5')           // o painel Administrador

estado.trocas.length = 0
await pg.locator('button:has-text("Salvar")').click()
await pg.waitForTimeout(3000)

const t = estado.trocas.at(-1)                 // { m, u: '/tenants', env, st, res }
ok('o limite foi como número', t.env.limiteUsuarios === 5)
ok('e o servidor devolveu o mesmo', t.res.limiteUsuarios === 5)
ok('a resposta traz a version', typeof t.res.version === 'number')
await b.close()
```

Depois reabra o registro e confira os campos, e leia a **linha no Postgres** —
são a quarta e a quinta vias, e é onde aparece a coluna com escala errada.
Na edição, confira também o **409**: dois PUTs com a mesma `version`, o segundo
tem de voltar 409 e a tela tem de oferecer "Recarregar".

| O quê | Como aparece |
|---|---|
| Máscara mal lida | a tela mostra `1.500,00` e o corpo leva `1500000` |
| Campo que não é enviado | a caixa marcada e o id `null` no corpo |
| Erro de campo perdido | 400 com `erros[{campo, mensagem}]` e nenhum campo marcado na tela |
| Escala da coluna | você grava `9,263` e relê `9,26` |

## 7. Dado de teste

O banco de dev é o `ero_api` do Postgres do Docker (porta 5433). Às vezes a
tabela que você quer olhar está vazia. Criar pelo **endpoint** é mais rápido e
mais fiel que pela tela. O `tokenDaApi()` do `comum.mjs` faz login, lê o código
no Mailpit e devolve o token de acesso (mesma trava do modo Gmail). Gasta um
login: guarde o token e reaproveite.

```js
import { tokenDaApi } from '<CRM-Glass>/.claude/skills/olhar-telas/comum.mjs'
const token = await tokenDaApi()
await fetch('http://localhost:8080/api/...', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify({ /* ... */ }),
})
```

Corpo com acento pelo `curl` do Git Bash chega quebrado: monte a requisição
num script Node.

**Dados de demonstração que ficam:** os contratantes `Demo Solar` e `Demo
Marina` (tema claro, destaque esmeralda) existem de propósito, para ver o
isolamento entre contratantes e as aparências na tela. Entre com eles por
`OLHAR_EMAIL`/`OLHAR_SENHA` (credenciais de teste, fora do repositório; os
e-mails `.test` só recebem o código no modo Mailpit). O resto que você criar à
mão, **limpe**: `docker compose exec postgres psql -U ero -d ero_api`, e apague
só as linhas que você inseriu, por nome ou por data.

> As credenciais do `.env` são de desenvolvimento local e servem só para entrar
> no `localhost`. Não vão para lugar nenhum fora desta máquina, nem para a
> saída do terminal.
