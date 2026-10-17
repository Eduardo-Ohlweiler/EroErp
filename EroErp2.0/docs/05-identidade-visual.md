# Identidade Visual — EroErp

> **A identidade do EroErp ainda não está fechada.** Na tela está o logo antigo
> do EroErp, redesenhado em vetor que segue o tema; na folha impressa, a palavra
> "EroErp" em texto; e os favicons ainda são os do projeto de origem deste
> código. Tudo o que está aqui sobre paleta, tipografia, tokens, componentes e
> impressão **vale e está em uso**; o que muda quando a identidade nova chegar é
> a §2 e, se ela trouxer cor própria, a paleta Padrão (§3) — as outras dezenove
> opções de §11 continuam como estão.
>
> Os hexadecimais da paleta Padrão vieram de um export de Figma — fonte de
> verdade, não amostragem — e foram herdados junto com o resto da base.

---

## 1. Direção

**Delicado, suave, arejado.** Um ERP usado em jornadas longas, por quem cadastra,
confere e consulta o dia inteiro. A interface precisa ser calma, não
corporativa-pesada; precisa, não fria; cuidadosa, não infantil.

Cinco decisões que produzem esse tom:

1. **Peso invertido.** A sidebar é clara, não navy. O `#000F27` fica reservado ao
   texto e ao logo. A tela inteira respira em off-white. (Quem prefere moldura
   escura escolhe uma variante `_MENU_ESCURO`, §11.6.)
2. **Cantos generosos.** Raio de 12 a 20px em cards e painéis. Nada de quina viva.
3. **Sombra difusa, borda quase invisível.** Elevação por sombra suave e larga,
   nunca por borda escura.
4. **Tipografia leve.** Títulos em 500/600, nunca 700. Corpo em 400.
5. **Dois acentos suaves e dessaturados** — verde-sálvia e pêssego — reservados
   para marcar **contexto** (tipo de registro, módulo), usados com parcimônia
   sobre a base azul.

O que **não** fazer: gradiente colorido, cor saturada em área grande, ilustração
infantil, emoji, sombra dura, borda de 2px, `font-weight: 800`.

---

## 2. A marca

**Ainda não definitiva.** Na tela, o logo é o do **EroErp antigo**; no papel, a
palavra **"EroErp"** em texto. Os favicons continuam pendentes.

`ero/src/assets/brand/`

| Arquivo | Conteúdo | Uso |
|---|---|---|
| `logo-ero-horizontal.svg` | o logo do EroErp antigo em vetor plano: "ero" com "SISTEMA" ao lado | topo do menu lateral — pelo `MarcaEro` |
| `logo-ero.svg` | o mesmo desenho empilhado, "SISTEMA" embaixo, como o original | tela de login, 404 público — pelo `MarcaEro` |
| `logo-full.svg` | "EroErp" em texto, peso 600, `fill="currentColor"` | **só** a folha impressa (`Folha`) |

**O logo segue o tema.** O original era um PNG prateado e branco, desenhado para
fundo escuro, e vivia num selo navy fixo — no menu claro virava um chip pequeno
e destoante. Os dois SVGs redesenham o mesmo logo sem o metálico: as letras são
`currentColor` e o acento (a barra do "e", o arco e as barras do "o") é
`var(--logo-acento)`. O `components/layout/MarcaEro.tsx` os importa inline
(svgr `?react`) e dá `text-txt` às letras e `--color-primary` ao acento, então
um arquivo só serve as vinte paletas e os dois temas — nas `_MENU_ESCURO` o
`<aside>` já tem `data-theme="dark"` e o logo clareia junto. Um arquivo por
tema seriam dezenas de cópias com hex repetido, fora do `theme.css`.

No menu não há selo: o fundo é o próprio menu. Login e 404 são públicos, sem
tenant, e mantêm a faixa `bg-navy` da marca com `data-theme="dark"` — letras e
acento vêm claros, da paleta Padrão.

```tsx
<MarcaEro />                       {/* menu lateral — horizontal */}
<MarcaEro tamanho="faixa" />       {/* cabeçalho do cartão de login */}
<MarcaEro tamanho="destaque" />    {/* 404 público */}
```

**No papel fica o texto.** Na folha impressa o logotipo de texto é discreto e
não disputa com o título do documento. A `Folha` usa o
`logo-full.svg`, que segue **`currentColor`**: a cor vem do CSS (`--primary`,
§8), então o mesmo arquivo serve em qualquer paleta.

`ero/public/`

| Arquivo | Uso |
|---|---|
| `favicon.svg` · `favicon-32.png` · `favicon-16.png` | aba do navegador |
| `apple-touch-icon.png` (180) · `icon-512.png` | atalho em mobile, PWA |

Os favicons ainda são **os do projeto de origem**, à espera da marca nova. Não há
`og-image` nem página pública: `/` redireciona para `/app`, e o `index.html` leva
`noindex`.

### Regras de aplicação

| Situação | Versão |
|---|---|
| Menu, em qualquer paleta e tema | `logo-ero-horizontal.svg` nas cores do tema (`MarcaEro`) |
| Login, 404 público | `logo-ero.svg` sobre a faixa navy (`MarcaEro`) |
| Folha impressa | `logo-full.svg` em `--primary` da versão clara |
| Monocromático | uma cor só, sem gradiente |

- Nunca pôr os SVGs do logo fora do `MarcaEro`, nem escrever hex dentro deles:
  as cores são `currentColor` e `--logo-acento`, e quem as define é o tema.

- Nunca distorcer, rotacionar, aplicar sombra, contorno ou trocar as cores.
- Nunca aplicar sobre foto sem camada de contraste sólida por baixo.

---

## 3. Paleta

### Cores de base

| Token | Hex | Papel |
|---|---|---|
| `navy` | **`#000F27`** | texto principal, logo |
| `blue` | **`#1E4686`** | **primária** — botões, links, foco, item ativo |
| `blue-muted` | **`#5F7FB1`** | ícone secundário, placeholder |
| `blue-soft` | **`#BBD1F3`** | badge, realce, ilustração |
| `offwhite` | **`#FAF6FE`** | canvas da aplicação |
| `silver` | **`#DADADA`** | divisor, superfície neutra |
| `mist` | **`#E9F0F2`** | fundo de apresentação da marca |

O cinza metálico (`silver`) tem uma versão em **gradiente horizontal**:

```css
background: linear-gradient(90deg, #9D9D9D 0%, #DADADA 52.4%, #9D9D9D 100%);
```

Reservado a detalhes de marca (cabeçalho de relatório impresso). Nunca em área de
leitura.

### Escala do azul

Interpolada a partir dos quatro azuis de base, que ocupam os degraus 200, 400,
700 e 950. Os intermediários existem para estado — não inventam matiz.

| Degrau | Hex | Uso |
|---|---|---|
| `50` | `#F4F8FD` | canvas alternativo, zebra de grid |
| `100` | `#E6EEFA` | **item ativo da sidebar**, hover de linha |
| **`200`** | **`#BBD1F3`** | base — badge, realce |
| `300` | `#8DA8D2` | borda em foco suave, texto secundário no escuro |
| **`400`** | **`#5F7FB1`** | base — ícone secundário, placeholder |
| `500` | `#3F639C` | **texto secundário** (AA) |
| `600` | `#2E5491` | hover do botão primário |
| **`700`** | **`#1E4686`** | base — **primária** |
| `800` | `#0F2A56` | active do botão primário |
| `900` | `#071C3E` | azul profundo — degrau da escala, não é a superfície do tema escuro |
| **`950`** | **`#000F27`** | base — texto principal |

### Acentos de contexto

Dessaturados de propósito. Marcam **contexto**, não hierarquia.

| Acento | Fill | Fundo | Texto (AA) | Contraste do texto |
|---|---|---|---|---|
| **Sálvia** (`sage`) | `#7FA88F` | `#EDF3EE` | `#4A7259` | 5,47:1 sobre branco |
| **Pêssego** (`peach`) | `#E0A188` | `#FAF0EB` | `#9E5334` | 5,61:1 sobre branco |

Hoje aparecem só como `tom` do `TBadge`. Onde podem aparecer quando um módulo
pedir:

- Faixa de contexto no topo de um registro (dois tipos de registro que convivem)
- Ícone e badge do módulo na sidebar
- Borda esquerda de 3px no painel de resultados do módulo correspondente
- Marcador de linha no grid, quando dois tipos convivem na mesma lista

Onde **não** aparecem: botão, link, fundo de página, header, campo de formulário.
Ação continua sendo a primária em todo o sistema — vários módulos, uma gramática
de interação.

> `#7FA88F` (2,66:1) e `#E0A188` (2,18:1) são **cores de preenchimento**, não de
> texto. Texto sobre eles usa as variantes escuras `#4A7259` e `#9E5334`.

### Cores semânticas

| Papel | Claro | Sobre `#FFFFFF` | Escuro | Sobre `#0B2145` |
|---|---|---|---|---|
| Sucesso | `#0E7C5A` | 5,19:1 | `#46D3A5` | 8,44:1 |
| Alerta | `#B45309` | 5,03:1 | `#F5B44E` | 8,74:1 |
| Erro | `#B42318` | 6,57:1 | `#F58279` | 6,34:1 |
| Informação | `#0B6E8F` | 5,76:1 | `#6FC1E3` | 7,90:1 |

Sucesso é verde-escuro, distinto do sálvia de contexto — as duas informações são
diferentes e não podem se confundir.

### Acessibilidade

| Combinação | Razão | Veredito |
|---|---|---|
| `#000F27` sobre `#FFFFFF` | **19,13:1** | AAA — texto principal |
| `#1E4686` sobre `#FFFFFF` | **9,23:1** | AAA — link, botão primário |
| `#3F639C` sobre `#FFFFFF` | **6,04:1** | AA — texto secundário |
| `#4A7259` sobre `#EDF3EE` | **4,86:1** | AA — texto sobre acento sálvia |
| `#9E5334` sobre `#FAF0EB` | **5,01:1** | AA — texto sobre acento pêssego |
| `#5F7FB1` sobre `#FFFFFF` | **4,07:1** | ⚠️ só ícone, placeholder e texto ≥18,66px bold |
| `#F2F6FC` sobre `#0B2145` | **14,69:1** | AAA — texto no tema escuro |
| `#9DB4DA` sobre `#0B2145` | **7,57:1** | AA — secundário no escuro |
| branco sobre `#5F8FD8` | **3,28:1** | ❌ **reprova** — por isso botão cheio usa `--txt-inverse` |
| `#00091A` sobre `#5F8FD8` | **6,08:1** | AA — texto do botão no escuro |

**`#5F7FB1` nunca é cor de texto corrido.** Texto secundário é `#3F639C` no tema
claro e `#8DA8D2` no escuro.

Cor nunca é o único portador de informação: status vem sempre com ícone ou rótulo.

---

## 4. Tipografia

| Papel | Fonte | Origem |
|---|---|---|
| **Primária** — UI, títulos, números | **IBM Plex Sans** | `@fontsource/ibm-plex-sans` |
| **Secundária** — texto longo, relatórios, impressão | **Lato** | `@fontsource/lato` |

Self-hosted via `@fontsource` — o CSP bloqueia host externo, e é uma requisição de
rede a menos. São as duas únicas famílias do sistema.

Pesos: IBM Plex Sans 400, 500, 600 · Lato 400, 700.
**Sem 700 na interface.** Peso alto endurece a tela; o destaque vem de tamanho,
cor e espaço.

### Escala

| Token | Tamanho / altura | Peso | Uso |
|---|---|---|---|
| `display` | 30 / 40 px | 500 | título da tela inicial |
| `h1` | 24 / 32 px | 500 | título de tela |
| `h2` | 18 / 26 px | 500 | título de `TPanel` |
| `h3` | 15 / 22 px | 500 | subtítulo, cabeçalho de grid |
| `body` | 14 / 22 px | 400 | padrão da interface |
| `body-lg` | 16 / 26 px | 400 | texto longo (Lato) |
| `caption` | 12 / 18 px | 400 | rótulo de campo, ajuda |
| `numeric` | 15 / 22 px | 500 | resultado de cálculo |

Entrelinha mais generosa que o usual (22px para corpo de 14px) — é o que faz a
tela parecer calma mesmo cheia de campos.

Resultado de cálculo e coluna numérica usam `font-variant-numeric: tabular-nums`;
sem isso os dígitos dançam de linha em linha.

Rótulo de campo em `caption`, `#3F639C`, sem caixa alta. Caixa alta em rótulo
endurece e prejudica a leitura de siglas (CPF, CNPJ, CFOP).

---

## 5. Tokens Tailwind v4

`src/styles/theme.css`, importado antes de tudo em `main.tsx`.

```css
@import "tailwindcss";

@theme {
  /* ── Base ──────────────────────────────────────────────────── */
  --color-navy:       #000F27;
  --color-blue:       #1E4686;
  --color-blue-muted: #5F7FB1;
  --color-blue-soft:  #BBD1F3;
  --color-offwhite:   #FAF6FE;
  --color-silver:     #DADADA;
  --color-mist:       #E9F0F2;

  /* ── Escala do azul ────────────────────────────────────────── */
  --color-brand-50:  #F4F8FD;
  --color-brand-100: #E6EEFA;
  --color-brand-200: #BBD1F3;
  --color-brand-300: #8DA8D2;
  --color-brand-400: #5F7FB1;
  --color-brand-500: #3F639C;
  --color-brand-600: #2E5491;
  --color-brand-700: #1E4686;
  --color-brand-800: #0F2A56;
  --color-brand-900: #071C3E;
  --color-brand-950: #000F27;

  /* ── Acentos de contexto ───────────────────────────────────── */
  --color-sage:        #7FA88F;   /* sálvia — preenchimento */
  --color-sage-bg:     #EDF3EE;
  --color-sage-text:   #4A7259;
  --color-peach:       #E0A188;   /* pêssego — preenchimento */
  --color-peach-bg:    #FAF0EB;
  --color-peach-text:  #9E5334;

  /* ── Silver ────────────────────────────────────────────────── */
  --color-silver-100: #F2F2F2;
  --color-silver-200: #E8E8E8;
  --color-silver-300: #DADADA;
  --color-silver-500: #9D9D9D;
  --color-mist:       #E9F0F2;

  /* ── Tipografia ────────────────────────────────────────────── */
  --font-sans:  "IBM Plex Sans", ui-sans-serif, system-ui, sans-serif;
  --font-serif: "Lato", ui-sans-serif, system-ui, sans-serif;

  --text-display: 1.875rem;  --text-display--line-height: 2.5rem;
  --text-h1:      1.5rem;    --text-h1--line-height:      2rem;
  --text-h2:      1.125rem;  --text-h2--line-height:      1.625rem;
  --text-h3:      0.9375rem; --text-h3--line-height:      1.375rem;
  --text-body:    0.875rem;  --text-body--line-height:    1.375rem;
  --text-caption: 0.75rem;   --text-caption--line-height: 1.125rem;

  /* ── Raio — generoso ───────────────────────────────────────── */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;
  --radius-pill: 9999px;

  /* ── Sombra — difusa, nunca dura ───────────────────────────── */
  --shadow-xs:    0 1px 2px rgb(0 15 39 / 0.04);
  --shadow-card:  0 1px 3px rgb(0 15 39 / 0.04), 0 6px 20px rgb(0 15 39 / 0.05);
  --shadow-hover: 0 2px 6px rgb(0 15 39 / 0.06), 0 12px 32px rgb(0 15 39 / 0.08);
  --shadow-modal: 0 12px 48px rgb(0 15 39 / 0.16);
}

/* ── Tokens semânticos — TEMA CLARO (padrão) ─────────────────── */
:root {
  --color-bg:             #FAF6FE;   /* canvas — off-white */
  --color-surface:        #FFFFFF;   /* card, painel */
  --color-surface-alt:    #F4F8FD;   /* zebra, header de grid */

  --color-sidebar:        #FFFFFF;
  --color-sidebar-text:   #3F639C;
  --color-sidebar-active-bg:   #E6EEFA;
  --color-sidebar-active-text: #1E4686;

  --color-text:           #000F27;
  --color-text-secondary: #3F639C;
  --color-text-muted:     #5F7FB1;   /* só rótulo/placeholder/ícone */
  --color-text-inverse:   #FFFFFF;

  --color-border:         #EAEEF6;   /* quase invisível — a elevação é a sombra */
  --color-border-strong:  #D5DDEB;
  --color-focus:          #1E4686;

  --color-primary:        #1E4686;
  --color-primary-hover:  #2E5491;
  --color-primary-active: #0F2A56;

  --color-success: #0E7C5A;  --color-success-bg: #E6F4EF;
  --color-warning: #B45309;  --color-warning-bg: #FDF3E6;
  --color-danger:  #B42318;  --color-danger-bg:  #FCECEA;
  --color-info:    #0B6E8F;  --color-info-bg:    #E6F2F7;
}

/* ── Tokens semânticos — TEMA ESCURO ─────────────────────────── */
/* Opção de conforto, não o padrão. Degraus REAIS de superfície: a primeira
   versão usava #071C3E sobre #000F27 (razão 1,13) e virava uma mancha
   chapada. Agora canvas → sidebar → surface → surface-alt sobem de verdade. */
[data-theme="dark"] {
  --bg:             #00091A;   /* canvas, mais fundo que o navy de base */
  --surface:        #0B2145;   /* card e header — 1,25 sobre o canvas */
  --surface-alt:    #12305C;   /* zebra, header de grid, hover */

  --sidebar:        #061631;
  --sidebar-text:   #8DA8D2;
  --sidebar-active-bg:   #16345F;
  --sidebar-active-text: #BBD1F3;

  --txt:            #F2F6FC;
  --txt-secondary:  #9DB4DA;
  --txt-muted:      #6B87B8;
  --txt-inverse:    #00091A;   /* texto dos botões cheios — ver nota abaixo */

  --line:           #16305A;   /* desenha a aresta do card: sombra não aparece aqui */
  --line-strong:    #24487E;

  --primary:        #5F8FD8;
  --primary-hover:  #7BA5E4;
  --primary-active: #4A78BE;

  --success: #46D3A5;  --success-bg: #0A3A2E;
  --warning: #F5B44E;  --warning-bg: #402C0C;
  --danger:  #F58279;  --danger-bg:  #451915;
  --info:    #6FC1E3;  --info-bg:    #0A3242;

  --color-sage:  #6E9A80;  --color-sage-bg:  #10281C;  --color-sage-text:  #9CC4AA;
  --color-peach: #C98D76;  --color-peach-bg: #30201A;  --color-peach-text: #E8B79F;
}

body {
  background-color: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-sans);
  font-size: var(--text-body);
  line-height: var(--text-body--line-height);
  -webkit-font-smoothing: antialiased;
}

.numeric, td.numeric, .resultado-calculo {
  font-variant-numeric: tabular-nums;
  font-weight: 500;
}
```

Tema alternado por `data-theme` no `<html>` e persistido em `localStorage`
(chave `ero-tema`) pelo `ThemeContext`. O padrão é o **claro** — quem prefere o
escuro alterna no header, e a escolha fica salva. O `index.html` aplica o tema e
a última paleta em uso (`ero-paleta`) antes do React montar, para o F5 dentro do
sistema não piscar a cor errada — quem decide a paleta é o tenant (§11).

---

## 6. Aplicação nos componentes

Cada token aparece em duas formas equivalentes: `--surface` é o valor que troca
no tema, e `--color-surface` é como o `@theme` do Tailwind o expõe — no JSX você
escreve a classe, `bg-surface`.

| Componente | Especificação |
|---|---|
| **Sidebar** | fundo `--color-sidebar` (branco), largura 248px, borda direita `--color-border`. Item: texto `--color-sidebar-text`, ícone `--color-text-muted`, altura 40px, `--radius-md`, margem lateral de 8px. **Item ativo:** fundo `--color-sidebar-active-bg`, texto e ícone `--color-sidebar-active-text`, peso 500 — pílula arredondada, sem barra lateral dura. Grupos separados por rótulo em `caption` e `--color-text-muted`. |
| **Header** | 60px, fundo `--color-surface`, borda inferior `--color-border`, seletor de tenant (só `SUPERADMIN`) e menu de usuário à direita. O logo (`MarcaEro`, §2) fica no topo do menu lateral, na mesma altura |
| **`TPage`** | padding 24px (16px no mobile), título em `h1`, ações à direita, breadcrumb em `caption` |
| **`TPanel`** | fundo `--color-surface`, `--radius-lg`, `--shadow-card`, **sem borda**, padding 20px; título em `h2` com 16px abaixo |
| **`TButton` primary** | fundo `--color-primary`, texto **`--color-txt-inverse`** (não branco — ver §Tokens fixos), `--radius-md`, altura 38px, padding 16px, peso 500, `transition: 150ms` |
| **`TButton` secondary** | fundo `--color-surface`, borda `--color-line-strong`, texto `--color-txt`, hover fundo **`--color-surface-alt`** |
| **`TButton` ghost** | sem fundo nem borda, texto `--color-primary`, hover fundo **`--color-surface-alt`** |
| **`TButton` danger** | fundo `--color-danger`, texto `--color-txt-inverse` — só em exclusão confirmada |
| **`TEntry` / `TCombo`** | altura 38px, `--radius-md`, fundo `--color-surface`, borda `--color-border-strong`; foco borda `--color-focus` + `box-shadow: 0 0 0 3px rgb(30 70 134 / 0.10)` (halo suave, não outline duro); erro borda `--color-danger` + mensagem em `caption` |
| **`TDataGrid`** | sem borda externa; header fundo `--color-surface-alt`, texto `--color-txt-secondary` em `h3`; linha 44px; separador `--color-line`; hover **`--color-surface-alt`**; primeira e última linha com canto arredondado. Abaixo de `md` vira cartão — regra 6 do `CLAUDE.md` |
| **`TModal`** | overlay `rgb(0 15 39 / 0.35)` com `backdrop-filter: blur(2px)`, painel `--radius-xl`, `--shadow-modal` |
| **Badge** | `--radius-pill`, altura 22px, `caption`, fundo `--color-*-bg`, texto `--color-*`, sempre com ícone de 14px |
| **Badge de contexto** | fundo `--color-sage-bg` / `--color-peach-bg`, texto `--color-sage-text` / `--color-peach-text`, com ícone que nomeia o contexto |
| **`TResult`** | fundo `--color-surface`, borda esquerda 3px na cor do contexto, quando houver, `--radius-md`; valor em `numeric` 20px `--color-text`; unidade em `caption` `--color-text-muted`; classificação como badge; referência em `caption` |
| **Toast** | `--radius-md`, `--shadow-hover`, barra de progresso na cor semântica |
| **Estado vazio** | ícone de 40px em `--color-txt-muted`, título em `h3`, texto em `--color-txt-secondary`, ação em ghost — nunca uma tabela vazia sem explicação |
| **Loading** | *skeleton* em `--color-surface-alt` com pulso de 1,5s. Nunca spinner em tela cheia |

### Tokens fixos × tokens de tema

Distinção que já causou um bug: o hover do alternador de tema usava
`bg-brand-50` e, no tema escuro, ficava **branco**.

| Grupo | Muda com claro/escuro? | Muda com a paleta (§11)? | Quando usar |
|---|---|---|---|
| `navy`, `blue`, `offwhite`, `silver-*`, `sage`, `peach` | **não** | **não** | ilustração, badge de contexto, detalhe de marca |
| `brand-*` | **não** | **sim** | detalhe de marca e a folha impressa (`brand-100`, `brand-200`) |
| `bg`, `surface`, `surface-alt`, `txt*`, `line*`, `primary*`, `sidebar*` | **sim** | **sim** | tudo que é superfície, texto, borda, estado e ação |
| `success`, `warning`, `danger`, `info` | **sim** | **não** | estado — o significado não troca de cor com a paleta |

Regra prática: **se o elemento faz parte da interface, use token de tema.**
`hover:bg-surface-alt`, nunca `hover:bg-brand-50`. `text-txt-inverse` em botão
cheio, nunca `text-white` — no escuro a primária é clara e o branco reprova o
contraste (3,28:1 contra os 4,5:1 exigidos).

### Foco visível

O sistema é operado muito pelo teclado — cadastro em sequência, conferência,
balcão.

```css
:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}
```

Campos usam halo (`box-shadow`) em vez de outline, para não brigar com o raio.
Nunca `outline: none` sem substituto.

### Movimento

Transições de 150–200ms, `ease-out`. Só em cor, sombra e opacidade — nunca em
layout. E sempre:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

---

## 7. Espaçamento e densidade

Escala de 4px: `4 · 8 · 12 · 16 · 20 · 24 · 32 · 48 · 64`.

Densidade **confortável** — um pouco mais folgada que o ERP comum, porque o tom é
delicado; mas ainda compacta o bastante para uma tela de cadastro não exigir
rolagem constante.

| Elemento | Altura |
|---|---|
| Campo de formulário | 38 px |
| Botão | 38 px (32 px em `size="sm"`) |
| Linha de grid | 44 px |
| Header | 60 px |
| Sidebar expandida / recolhida | 248 px / 68 px |
| Espaço entre painéis | 20 px |
| Espaço entre campos na mesma linha | 16 px |

Ícones: **SVG inline**, traço de 1.8, em `src/assets/icons/index.tsx`. 20px na
interface, 18px na sidebar, 16px em botão pequeno. Todos usam `currentColor` e
herdam a cor do texto — nenhum componente define ícone fora desse módulo.

---

## 8. Impressão

Fichas de cadastro e relatórios saem no papel.

**A folha não é a tela — é um documento próprio.** Imprimir o formulário dava
formulário: campos de entrada, rótulos de digitação, abas. Quem lê no papel
precisa de um **demonstrativo** — identificação no topo, tira de indicadores,
seções com o número já calculado e a sua procedência ao lado.

Cada tela imprimível monta uma `Folha` (`components/impressao/Folha.tsx`) e a
entrega à `TPage` pela prop `documento`. A `TPage` então marca **todo o conteúdo
de tela como `.nao-imprime`**: a folha é o que sai, e não há como uma tela ganhar
documento e continuar imprimindo o formulário por baixo dele.

**O desenho vem do EroErp antigo** (o `utils/geradorPdf.ts` de lá), que monta
relatório com jsPDF. A ferramenta não vem: jsPDF seria dependência nova, layout
imperativo em milímetros e — o que pesa — uma **segunda montagem** do mesmo
documento, com os números reescritos à mão. Duas montagens divergem, e a do papel
envelhece calada. Aqui o documento lê os mesmos objetos que a tela leu, com os
mesmos formatadores e os mesmos tokens.

Tela sem documento próprio ainda imprime como está, limpa da interface. É o
fallback de quem aperta Ctrl+P fora das telas de registro.

### 8.0 As peças da folha

| Peça | O que é |
|---|---|
| `Folha` | a folha: cabeçalho com logo, título, `pessoa`, linha de referência e rodapé |
| `TiraIndicadores` | os cinco números do topo, em caixa — o que se lê primeiro |
| `Secao` | bloco com barra de título na cor da marca e nota de procedência |
| `LinhasDeValor` | rótulo → **valor** → detalhe (classificação, origem do número); variante `prosa` para resposta em texto |
| `TabelaDoc` | tabela de verdade, para série no tempo e listagem |
| `DocumentoLista` | relatório de uma listagem, **com os filtros aplicados escritos no cabeçalho** |

**O cabeçalho não é faixa cheia.** Um bloco navy sangrando de margem a margem
pesa na página, come tinta e faz o documento parecer papel timbrado de banco — o
oposto do que o sistema é na tela. A cor aparece em três lugares e só: o logo, o
filete sob o cabeçalho e o número dentro da tira de indicadores.

- **Fundo branco, e a paleta clara por cima.** Tinta navy `#000F27`, cartão de
  canto arredondado com borda hairline `--line`
- Corpo em **IBM Plex Sans** 10,5pt, entrelinha 1,45 — a mesma família da tela
- **Logo** no cabeçalho de cada folha, em `--primary`, com o título do documento
  e a pessoa à direita (classe `.folha-pessoa`)
- Rodapé com "Documento gerado por EroErp"
- Sidebar, header da aplicação, botões, abas e filtros com `display: none`
- Tabelas com **linha de base** `--line` e o cabeçalho no seu fundo; sem grade
  fechada e sem zebra — o sistema não usa zebra em lugar nenhum
- Sombra sai: no papel ela vira mancha cinza, não profundidade
- `@page { margin: 15mm; }`

### 8.1 As duas coisas que a cor exige

1. **`print-color-adjust: exact` na árvore inteira.** Sem isso o Chrome
   descarta todo fundo, e a folha sai com o desenho pela metade.
2. **O tema escuro vale só em tela.** O bloco `[data-theme="dark"]` de
   `theme.css` está envolvido em `@media screen`, e por isso o papel herda
   sempre a paleta clara. Sem esse envelope, quem trabalha no escuro imprimiria
   navy chapado — um cartucho por folha. Envolver custa uma linha; redeclarar os
   trinta tokens na regra de impressão seria a próxima coisa a divergir.

### 8.1.1 Quebra de página

**Só promete não quebrar quem é menor que a página.** `break-inside: avoid` numa
caixa mais alta que o A4 — uma tabela longa é — faz o navegador empurrá-la
inteira para a folha seguinte e deixar a anterior em branco. A regra fica onde a
unidade é pequena:

| Elemento | Regra | Por quê |
|---|---|---|
| `.folha-tira` | `break-inside: avoid` | cinco números que só significam algo juntos |
| `.folha-tabela tr` | `break-inside: avoid` | a maior unidade que cabe sempre |
| `.folha-secao-titulo` | `break-after: avoid` | título no pé com o conteúdo na folha seguinte é pior que quebrar a tabela |
| `.folha-tabela thead` | `display: table-header-group` | da segunda folha em diante seriam números sem nome de coluna |
| `.folha-rodape` | `break-before: avoid` | senão ele sozinho vira uma última folha |
| `.folha-secao` | **nenhuma** | é o que pode ser mais alto que a página |

### 8.2 O que não conseguimos entregar

**A numeração de página não é nossa.** Regras de margem paginada
(`@bottom-right { content: counter(page) }`) não são suportadas por nenhum
navegador; quem numera é o cabeçalho/rodapé do próprio diálogo de impressão,
ligado por padrão. O rodapé traz a identificação; o número vem de lá.

### 8.3 Listas: relatório e planilha

Toda listagem oferece os dois (`TAcoesDeExportacao`), **no recorte que está na
tela**:

- **Relatório** — `DocumentoLista`, com os filtros aplicados escritos no
  cabeçalho. Uma folha com 40 linhas e sem o recorte que as produziu é
  indefensável: quem a recebe não sabe se são todos os clientes ou os de um mês.
- **Planilha** — CSV com BOM UTF-8 e ponto-e-vírgula, que abre no Excel em
  português com um duplo clique. XLSX exigiria ~1 MB de biblioteca para escrever
  um formato que aqui ninguém precisa.

Dois cuidados que não são detalhe:

1. **Os dois cobrem o filtro inteiro, não a página visível.** Exportar "os 20 da
   página 1" seria a armadilha óbvia, e o usuário só descobriria ao conferir o
   total. A exportação pagina de 100 em 100 até um teto de 2.000 linhas, e quando
   ele corta o relatório **diz quantas ficaram de fora** — truncar em silêncio faz
   a exportação parecer completa sem ser.
2. **Injeção de fórmula no CSV.** Célula que começa com `=`, `+`, `-` ou `@` é
   executada ao abrir a planilha. Nome de pessoa é texto que o usuário digitou;
   `utils/planilha.ts` prefixa com apóstrofo, como o OWASP recomenda.

As colunas do relatório e as da planilha são **as mesmas**: um só lugar define o
que é relevante naquela lista, e os dois não conseguem divergir.

> **Esta seção foi reescrita duas vezes.** A primeira versão mandava folha em
> preto e branco, logo monocromático, Lato 11pt e grade `#9D9D9D` — herança de
> relatório de sistema antigo. A segunda trocou por **cor, suavidade e o logo**,
> mas ainda imprimia a tela. A terceira é esta: o papel passou a ser um
> **documento próprio**, porque imprimir o formulário devolvia formulário.

---

## 9. Checklist visual

- [ ] Nenhuma cor fora dos tokens — zero hex solto no JSX ou no CSS de componente
- [ ] Texto corrido em `--color-text` ou `--color-text-secondary`, nunca `--color-text-muted`
- [ ] Sálvia e pêssego só em contexto (faixa, badge, borda de resultado) — nunca em botão ou link
- [ ] Nenhum peso de fonte acima de 600
- [ ] Painéis com sombra difusa, sem borda dura
- [ ] Raio ≥ 12px em card, painel e modal
- [ ] Funciona em tema claro **e** escuro, e numa paleta que não seja a Padrão
- [ ] Foco de teclado visível em todo elemento interativo
- [ ] `prefers-reduced-motion` respeitado
- [ ] Números em `.numeric` (tabular)
- [ ] Ícones vindos de `assets/icons`
- [ ] Estado vazio e skeleton de carregamento previstos
- [ ] Status com ícone ou rótulo, não só cor
- [ ] Legível em 1280×720 e em 360 px sem rolagem horizontal

---

## 10. Paleta de gráficos

**O sistema ainda não tem gráfico.** Os tokens `--viz-*` do `theme.css` ficam
reservados para o primeiro que vier, e continuam no arquivo porque o
`npm run paletas` os valida (§11.4) — cor de gráfico **não é escolhida a olho**.
Cada cor faz exatamente um trabalho, e o conjunto passa por checagens computáveis
(banda de luminosidade, piso de croma, separação sob daltonismo, contraste sobre
a superfície), medidas contra `#FFFFFF` e contra a superfície escura `#0B2145` —
que é azul-marinho, não cinza: uma série azul que funciona sobre cinza pode
sumir sobre ela.

| Token | Claro | Escuro | Para quê |
|---|---|---|---|
| `--viz-serie-1…3` | `#2a78d6` `#eb6834` `#1baf7a` | `#3987e5` `#d95926` `#199e70` | **categórica** — identidade de série, ordem fixa, nunca ciclada |
| `--viz-faixa-externa` · `-interna` | `#cde2fb` · `#9ec5f4` | `#12305C` · `#24487E` | **sequencial** — faixa de referência atrás da série; contexto, não protagonista |
| `--viz-ordinal-1…5` | `#86b6ef` → `#0d366b` | `#1c5cab` → `#cde2fb` | **ordinal** — categorias com ordem; no escuro a âncora inverte (mais = mais claro) |

O que já foi medido e não deve ser refeito por intuição:

- **Os tokens `success`/`warning`/`info` NÃO servem para gráfico.** `info`
  (`#0B6E8F`) e `success` (`#0E7C5A`) ficam a ΔE 10,7 — abaixo do piso 15 — e
  `info` tem croma 0,096: lê como cinza. Como **texto rotulado** funcionam; como
  duas fatias vizinhas, colapsam.
- O slot 3 categórico fica em 2,82:1 no claro — abaixo de 3:1 —, então **exige
  rótulo visível ou tabela equivalente**.
- Para uma escala de três (abaixo · adequado · acima), os três slots categóricos
  na ordem **azul → verde → laranja**: frio de um lado, quente do outro, o
  adequado no meio — sem que ele vire o cinza de "nada".
- A rampa ordinal tem **cinco degraus**, porque seis não mantêm o intervalo
  mínimo de luminosidade entre vizinhos. O validador categórico a reprova, e é o
  teste errado: rampa se verifica por **monotonicidade** da luminosidade, e ela é
  monotônica nos dois temas — por isso continua legível em fotocópia.

Formas que o sistema não usa: **dois eixos Y** no mesmo gráfico (inventa
correlação — duas escalas, dois gráficos); **pizza** para valores próximos ou de
duas fatias (rosca só para parte contra o todo, de três a seis fatias); **rampa
de valor em categoria sem ordem**; **número em todo ponto**; **grade tracejada**
(tracejado é limiar, não grade).

Obrigatório em todo gráfico: legenda a partir de 2 séries; **tabela
equivalente** para os mesmos dados; ao recalcular, o desenho anterior esmaece,
não pisca; filtros numa linha **acima** do que filtram; eixo com formatador
`pt-BR` (o ponto não é separador de milhar aqui); e, quando houver faixa de
referência, o **domínio do eixo contém a faixa** — senão a escala fecha nos
dados e a faixa some do quadro.

---

## 11. Paletas do sistema

A paleta de cores é **de cada tenant**: todos os usuários de um cliente veem o
sistema na cor dele, e outro cliente pode ter outra. Quem escolhe é o
**superadmin**, no painel **Aparência** do formulário de tenant
(`/app/tenants/:id`); `ADMIN` e `USER` não escolhem, nem a do próprio tenant. O
**claro/escuro continua sendo de cada usuário**, e cada paleta tem as duas
versões.

A paleta **Padrão** é a das seções acima, e **nada nela foi alterado**: ela é a
ausência do atributo `data-paleta` no `<html>`. As outras nove são blocos
`[data-paleta="…"]` no `theme.css`, depois dos blocos originais.

### 11.1 Método — a régua de claridade da Padrão

Nenhuma paleta foi escolhida a olho. O método é o das paletas tonais (Material 3),
dos degraus com papel fixo (Radix Colors) e das rampas em OKLCH (Tailwind v4):
cada token de cada paleta tem **a mesma claridade (L do OKLCH) do token
correspondente da Padrão**, degrau a degrau — muda o matiz e o croma. É por isso
que todas têm a mesma respiração: o canvas é tão claro quanto o off-white da
Padrão, a primária tão escura quanto o `#1E4686`, o texto secundário tão legível
quanto o `#3F639C`. As tendências de 2026 (jade e teal calmos, terrosos, índigo
sobre neutro quente, brancos suaves) guiaram os matizes.

| Paleta | Matiz | Primária clara | Canvas | Primária escura | Superfície escura |
|---|---|---|---|---|---|
| **Padrão** — azul marinho | 259° | `#1E4686` | `#FAF6FE` | `#5F8FD8` | `#0B2145` |
| **Menta** — verde claro | 168° | `#025F47` | `#F2FAF7` | `#50AF8E` | `#012A1E` |
| **Floresta** — verde profundo | 150° | `#015222` | `#F7F9F2` | `#69AD78` | `#00290E` |
| **Jade** — verde-azulado | 192° | `#055A58` | `#F2FAF9` | `#29B0AC` | `#012928` |
| **Oceano** — azul petróleo | 228° | `#005C79` | `#F2F9FC` | `#39A8D3` | `#002735` |
| **Índigo** — sobre creme | 280° | `#424191` | `#FDF7F1` | `#8C91E4` | `#1C1B48` |
| **Lavanda** — roxo suave | 295° | `#5D4297` | `#FAF6FF` | `#A38EE1` | `#261746` |
| **Ameixa** — roxo intenso | 318° | `#5E1C71` | `#FBF6FC` | `#BD85CF` | `#340F3E` |
| **Malva** — rosa antigo | 350° | `#763256` | `#FEF5F9` | `#C9A6CB` | `#391327` |
| **Café** — marrom | 55° | `#6C3A12` | `#FDF7EF` | `#A29372` | `#361A05` |

### 11.2 O que segue a paleta e o que não segue

**Segue:** `bg`, `surface-alt`, `sidebar*`, `txt*`, `line*`, `primary*`, `brand-*`
e, no escuro, `surface`, `sidebar`, `txt-inverse` e as faixas `--viz-faixa-*`
(que já eram "os degraus do próprio tema", §10). A **folha impressa** segue
também (logo de texto em `--primary`, filete e título de seção em
`brand-100`/`brand-200`), sempre na versão clara.

**Não segue:** semânticos (`success`, `warning`, `danger`, `info`) e acentos de
contexto (`sage`, `peach`) — têm significado fixo; séries categóricas, rampa
ordinal e faixas de referência do claro (§10) — validadas contra o branco, que é
a superfície de todas as paletas; a faixa `bg-navy` do logo no login e no 404
(§2); e o favicon. O logo do **menu** segue: letras em `txt`, acento em
`primary` (§2).

### 11.3 A cascata — o ponto delicado

- `[data-paleta]` tem a mesma especificidade do `[data-theme="dark"]` padrão e vem
  depois dele: **vence por ordem**. Por isso o bloco escuro de cada paleta,
  `[data-paleta][data-theme="dark"]`, tem de **redeclarar todo token de tema que
  o bloco claro declara** — senão o valor claro vaza para o escuro.
- `brand-*` fica só no bloco claro: muda com a paleta, não com o tema.
- O escuro de cada paleta está em `@media screen`, como o padrão (§8.1): o papel
  sai sempre claro.
- A prévia do seletor de paletas (`components/tenant/SeletorPaleta.tsx`, no
  painel Aparência do tenant) é o **CSS de verdade**: cada miniatura leva
  `data-theme` e `data-paleta` no próprio elemento. Não há uma segunda cópia das
  cores em TypeScript para envelhecer. A miniatura da Padrão, que não tem
  atributo de paleta, é protegida pelo `data-theme` explícito: ele redeclara os
  tokens do bloco original no elemento, por cima dos herdados do `<html>`.

### 11.4 O validador — `npm run paletas`

`scripts/validar-paletas.mjs` resolve a cascata como o navegador e reprova a
paleta que:

1. quebra um par de contraste de §3 — texto, secundário sobre `surface`,
   `surface-alt` e canvas, item ativo da sidebar, texto do botão sobre a primária
   e os seus estados, título da folha sobre `brand-100`;
2. tem a escala `brand` fora de ordem;
3. declara no claro um token que o escuro não redeclara (o vazamento de §11.3);
4. põe a primária a menos de **ΔE 12** do vermelho de perigo, em qualquer tema;
5. deixa as séries de gráfico abaixo de **4:1** sobre a superfície escura dela;
6. existe num lugar e não nos outros — `theme.css`, `styles/paletas.ts` e o enum
   `PaletaSistema` do backend (`tenant/enums/PaletaSistema.java`). O
   `ck_tenant_paleta` da migration 015 contra o enum é travado em teste
   (`PaletaTenantTest`).

O validador foi provado ao contrário: com três defeitos plantados — primária
clara demais, `--txt-muted` fora do bloco escuro, paleta ausente do catálogo —
ele reprovou os três.

A Padrão é a régua, não o réu: é relatada e nunca reprovada. Ela tem um `4,48:1`
conhecido no `primary-active` do escuro, e o pedido foi não tocar nela.

**De onde vem o ΔE 12.** É a menor distância entre dois semânticos do **próprio
sistema** no escuro — `success` × `info`, 12,2. Uma primária mais perto do perigo
do que os semânticos ficam uns dos outros faz um "Salvar" parecer "Excluir". Três
consequências:

- **Terracota caiu** na pesquisa: primária a ΔE 10,0 do `#B42318`.
- **Café e Malva têm primária própria no escuro.** O perigo do escuro é um salmão
  claro (`#F58279`), e marrom-claro e rosa-claro caem em cima dele (ΔE 7,9 e 8,6,
  medidos). O Café escuro usa um *café com leite* (`#A29372`), o mais quente que
  se afasta do salmão **e** do âmbar de alerta; a Malva escura, um malva de
  verdade (`#C9A6CB`), entre o rosa e o lilás.
- A **Floresta** escura teve a superfície escurecida em meio degrau (`#002B0F` →
  `#00290E`): a série laranja dos gráficos dava 3,996:1, em cima do piso.

### 11.5 Onde ela mora e como chega a cada usuário

- **Gravada no tenant**: `tenant.paleta`, `VARCHAR(40) NOT NULL DEFAULT 'PADRAO'`,
  com o `CHECK ck_tenant_paleta` listando as vinte chaves do enum (migration 015).
  Todo cliente novo nasce na Padrão.
- **Escrita só pelo superadmin**: `PATCH /tenants/{id}/paleta`, com
  `{ "paleta": "JADE" }` (`TenantPaletaDto`). A resposta de tenant
  (`TenantResponseDto`) traz a `paleta`.
- **Lida na resposta de autenticação.** Login, refresh, `switch-tenant` e
  `exit-tenant` devolvem, no `AuthResponseDto`, a `paleta` do **tenant
  efetivo**; o `AuthContext.aplicar()` a entrega ao `definirPaleta` do
  `ThemeContext`. Por isso o superadmin dentro de outro tenant vê a cor daquele
  tenant, e volta à do seu ao sair.
- **A troca chega na próxima sessão** de cada usuário — login, refresh ou troca
  de tenant. Se o superadmin está dentro do tenant que acabou de pintar, ela vale
  na hora para ele.
- **Não há rota pública de leitura.** O login acontece antes de se saber o
  tenant, então a tela de login abre **sempre na Padrão** (`Login.tsx` a define),
  e o logout (`encerrar`) volta a ela.
- O `index.html` aplica a última paleta do `localStorage` (`ero-paleta`) antes do
  React, só para o F5 dentro do sistema não piscar a cor errada até o refresh
  responder. O `ThemeContext` **não consulta o servidor** — a cor vem da sessão.
- A barra do navegador no celular (`theme-color`) lê o `--bg` do próprio CSS.

### 11.6 Menu e cabeçalho escuros — as dez variantes `_MENU_ESCURO`

Cada uma das dez paletas (a Padrão inclusive, que continua intocada como opção
própria) tem uma variante com **as mesmas cores**, em que o menu lateral e o
cabeçalho usam os tons escuros da paleta e o conteúdo continua claro. No
seletor de paletas do tenant elas formam o segundo grupo de cartões. O sistema não tem
rodapé; a decisão foi não criar um.

**Não há CSS novo de cor.** A moldura (`aside`, `header` e a faixa do seletor de
tenant no celular) recebe `data-theme="dark"`, e por isso usa os tokens do
**escuro da própria paleta** — já validados por §11.4. Uma terceira paleta por
cor seria mais trinta tokens para divergir. Duas peças fazem isso funcionar:

1. **Cada bloco escuro tem dois seletores**: o do `<html>`
   (`[data-paleta="x"][data-theme="dark"]`) e o da moldura
   (`[data-paleta="x"] [data-theme="dark"]:not([data-paleta])`). O `:not`
   protege as miniaturas do seletor de paletas, que levam o próprio
   `data-paleta` (a Padrão leva `"padrao"`, que não casa com nada): seletor de
   descendente casa com **qualquer** ancestral, não com o mais próximo.
2. **A ponte do `@theme` é refeita em todo elemento com `data-theme`** (bloco
   `[data-theme] { --color-bg: var(--bg); … }`). O `@theme` declara
   `--color-bg: var(--bg)` no `:root`, e variável que aponta para outra é
   resolvida **onde é declarada**: o que desce para os filhos é a cor pronta do
   `<html>`. Sem a ponte refeita, redefinir `--bg` na moldura não mudava nada —
   e a primeira versão do seletor pintou as vinte miniaturas, inclusive as
   "Escuro", com a paleta em uso. Nenhuma checagem pegou: só o screenshot.

Na moldura o cabeçalho usa o tom do **menu** (`bg-sidebar`), não o da superfície
escura: um degrau mais claro abria uma emenda visível no canto do logo. Por isso
o validador mede também texto e secundário sobre `--sidebar` no escuro. No tema
escuro global a variante é igual à base, porque a moldura já é escura.

A chave é a da base com `_MENU_ESCURO` (por isso `tenant.paleta` tem 40
caracteres: `FLORESTA_MENU_ESCURO` tem exatos 20). O validador exige que toda base tenha a
sua variante e que nenhuma variante fique sem base.
