# Padrão de relatórios

> Todo relatório do CRM Glass tem a **mesma moldura**: cabeçalho com o logo e a
> barra na cor de destaque do contratante em toda página, filtros só na
> primeira, rodapé de auditoria em toda página. O conteúdo muda; a moldura, não.
> Veio do EroErp 2.0 (`EroErp2.0/docs/15-relatorios.md`), adaptado ao CRM Glass.
> Construído em cima da impressão do kit (`documento` da `TPage`,
> [docs/07](07-layout-de-telas.md)), não de uma segunda ferramenta.
>
> Dono: o agente `relatorios` (`ero-web/src/design-system/kit/impressao.tsx`,
> o bloco `.folha*` e o `@media print` do `ero-web/src/styles/index.css`, os
> tokens `--folha-*` do `ero-web/src/styles/tokens.css`).

A folha é **o DOM impresso**, não um print da tela nem um PDF remontado à mão:
duas montagens do mesmo documento divergem, e a do papel envelhece calada. O
relatório lê os mesmos objetos e os mesmos formatadores que a tela leu
(`shared/util/format.ts`: datas, números e documentos em pt-BR).

Na tela a folha não existe (`.folha { display: none }`); no papel ela é a única
coisa que existe (`@media print` do `index.css` some com tudo o que não é a
folha nem ancestral dela). Papel branco e texto escuro **nos dois temas**: sem
vidro, sem fundo de cena, sem desfoque, sem sombra.

---

## 1. A moldura (vale para todo relatório)

Quem desenha a moldura é a `Folha` (`kit/impressao.tsx`). Todo documento monta
uma `Folha` (ou um `Documento*`, que monta a dele) e a passa à `TPage` por
`documento`.

### 1.1 Cabeçalho, em **todas** as páginas

Uma faixa, da esquerda para a direita:

- **Logo "Ero ERP"** à esquerda: o desenho do 2.0 (`ero-web/src/assets/brand/`,
  `logo-ero-horizontal.svg`) com o texto **"ERP"** ao lado no lugar de
  "SISTEMA" (decisão do Eduardo, 2026-11-13), mesma fonte, tamanho e linha de
  base do 2.0. Desenhado inline por `LogoEroHorizontal`
  (`assets/brand/LogoEro.tsx`, porque o ero-web não tem svgr). Letras em
  `currentColor` = `--folha-destaque`, acento em `--logo-acento` =
  `--folha-destaque-vivo`. Nunca um PNG de cor fixa: destoaria do destaque.
- **Barra na cor clara do destaque** ocupando o resto: fundo
  `--folha-destaque-fundo` e borda à esquerda em `--folha-destaque-vivo`; dentro:
  - o **emitente** em destaque: o **contratante efetivo** (o nome dele na
    sessão; o superadmin fora de um contratante emite como "Plataforma");
  - o **título do relatório** logo abaixo.
- Uma régua em `--folha-destaque` fecha o cabeçalho.

A cor é a do **contratante efetivo**: os tokens `--folha-destaque*` derivam de
`--accent`/`--accent-ink`, que o `AparenciaProvider` troca no `<html>`
(`data-accent`). O cabeçalho acompanha sozinho. **Nunca hex cravado** na folha.

### 1.2 Filtros, só na **primeira** página

Uma linha logo abaixo do cabeçalho, **uma vez**: `Filtros:` e os filtros que
geraram o relatório, `rótulo: valor`, separados por `·`, seguidos do
complemento (na lista, `N registros`). Filtro vazio não aparece; **nenhum**
filtro aplicado vira a frase explícita "sem filtro aplicado". Uma folha sem o
recorte que a produziu é indefensável: é o que separa relatório de print de
grade. Documento de um registro só (ficha) não tem bloco de filtros (`Folha`
sem a prop `filtros`).

### 1.3 Rodapé, em **todas** as páginas

Uma linha de auditoria, com régua fina por cima:

**`CRM Glass · <data e hora da geração> · gerado por <nome do usuário>`** à esquerda e
**`Página X de Y`** à direita.

- Data e hora em pt-BR (`formatarDataHora`).
- O usuário é o logado que mandou gerar, pelo **nome** que está na sessão
  (decisão do Eduardo, 2026-11-13). **Nunca o e-mail**, nem como reserva: sem
  nome, o rodapé fica só **`CRM Glass · <data e hora>`**. Nenhum outro dado
  pessoal.
- Emitente e usuário vêm da sessão do front (`useUsuarioDaCasca`, em
  `shared/sessao`): nenhuma tela passa isso à mão. As props `emitente`,
  `usuario` e `geradoEm` da `Folha` existem só para sobrescrever (catálogo,
  testes).

### 1.4 Como a moldura se repete (técnica)

- **Cabeçalho:** a `Folha` é uma tabela de uma célula (`.folha-moldura`). O
  cabeçalho vai no `thead`, que o navegador repete no topo de cada página; os
  filtros e o corpo vão no `tbody`, em fluxo, então os filtros saem uma vez só.
  A tabela de dados dentro do corpo também repete o `thead` (títulos das
  colunas) a cada página.
- **Rodapé e numeração:** `counter(page)` e `counter(pages)` só existem nas
  **caixas de margem do `@page`** (`@bottom-left`, `@bottom-right`; Chrome 131
  ou mais novo). O `@media print` do `index.css` reserva a margem de baixo e dá
  o estilo das caixas (fonte, cor `--folha-fg-muted`, régua `--folha-linha`); a
  `Folha` injeta só o `content` (`regraDoRodape`, num `<style>` dentro dela), que
  por isso só existe enquanto houver uma folha montada. Sem `content` a caixa
  nem é gerada: tela sem documento imprime sem rodapé. As caixas herdam do
  `<html>` a fonte e as variáveis.
- O texto do usuário entra no `@page` como string CSS escapada (`textoCss`:
  aspas, barra e `<` escapados), nunca concatenado cru.
- O `<footer class="folha-rodape">` da folha só aparece na prévia de tela do
  catálogo (`/design-system`); no papel ele some e quem desenha é o `@page`.
- `break-inside: avoid` **só em caixa menor que a página**: linha de tabela,
  tira de indicadores. **Nunca num grupo inteiro**: grupo maior que a página
  empurraria a folha inteira para a seguinte e deixaria páginas em branco.

---

## 2. Os modelos, por tipo de assunto

### 2.1 Lista simples: `DocumentoLista`

Existe (`kit/impressao.tsx`). Uma listagem sem agrupamento (Contratantes,
Usuários, Pessoas): os filtros na 1ª página, uma tabela, o aviso de corte
quando a exportação trunca. Colunas = as mesmas da planilha
(`ColunaExportavel`, `kit/planilha.ts`), para o CSV e o papel nunca
discordarem. A coluna diz como se comporta no papel (nenhuma muda o texto do
CSV):

| Dica | Para quê | Na folha |
|---|---|---|
| `numerica` | valores | à direita, algarismos tabulares; no CSV, o negativo pt-BR puro ("-1.234,56") segue como número, sem o apóstrofo da proteção contra fórmula |
| `semQuebra` | CPF/CNPJ, data | não quebra a linha |
| `quebra: 'email'` | e-mail | ganha `<wbr>` depois do `@` e de cada `.` (o hífen já é ponto de quebra): sai "contato@ / demomarina.test", nunca "contato@demomari / na.test" |

Toda célula tem `overflow-wrap: anywhere`, que é o que segura a tabela dentro
da folha. Ele só parte uma palavra (ou um pedaço de e-mail) quando ela sozinha
não cabe na coluna; havendo `<wbr>`, o navegador prefere o `<wbr>`. Não troque
por `normal` na coluna de e-mail: a largura mínima do pedaço mais longo passa a
empurrar as outras colunas e o nome sai "Demo / Marin / a".

É o que toda tela List usa no botão Pdf:

```tsx
<TPage
  documento={paraImprimir && (
    <DocumentoLista titulo="Contratantes" colunas={colunasExportadas}
      linhas={paraImprimir.linhas} truncado={paraImprimir.restantes}
      chaveDe={(t) => t.id} filtros={[{ rotulo: 'Situação', valor: 'Ativos' }]} />
  )}
>
```

### 2.2 Registros agrupados com subtotais: `DocumentoAgrupado` (quando o primeiro relatório pedir)

Ainda **não existe**: nasce com o primeiro relatório agrupado, não antes.
Forma: N níveis de agrupamento, **subtotal por nível** e **total geral**. Um
componente só, parametrizado pela lista de níveis, serve a todos os recortes:

- por **filial**;
- por **cliente** e **data**;
- por **data** e **cliente**;
- por **data**, **cliente** e **serviço**.

Cada nível abre uma **barra de grupo** na cor clara do destaque (mais forte a
cada nível acima), as linhas de detalhe abaixo, e ao fechar o grupo uma linha
**`Total <nível>: …`** destacada; no fim, o **total geral**. Colunas numéricas
à direita (`.folha-num`), com as casas do dado. Grupo vazio não vai. As barras
de grupo e as linhas de total usam tokens `--folha-*` novos, derivados do
destaque, criados junto com o componente.

O agrupamento e os subtotais são **calculados no servidor** e vêm prontos: o
front **exibe**, não soma regra de negócio em TypeScript. Precisou de um
derivado novo, é endpoint do `dev-backend` (§3).

### 2.3 Registros em cartão: `DocumentoCartoes` (quando couber)

Para registro "largo", com muitos campos por item: cada registro é um bloco
rótulo → valor em 2 ou 3 colunas, com totais no pé. Criar só quando um assunto
pedir; não antecipar.

---

## 3. Dados do relatório vêm do servidor, cobrindo o filtro inteiro

- A consulta do relatório **refaz sem paginação**: o `TAcoesDeExportacao`
  repete a consulta com os filtros aplicados, página a página
  (`carregarAteOTeto`), até o teto (`TETO_DE_EXPORTACAO`). Nunca a página
  visível.
- **Anuncia o que ficou de fora**: o `DocumentoLista` escreve no papel quantos
  registros atendem ao filtro e não couberam, e o `TAcoesDeExportacao` avisa na
  tela. Relatório que corta calado não é registro.
- **Escopo do contratante efetivo**, sempre: quem garante é a API (tenant
  automático, [docs/03](03-multitenant.md)); o front nunca filtra nem manda
  `tenantId`.
- Agrupamento e subtotais: endpoint próprio de relatório que devolve os grupos
  e os totais prontos, no escopo do contratante efetivo. O pedido vai ao
  `dev-backend` pela sessão principal.

## 4. Retrato, não catálogo

Relatório de registro salvo lê o **retrato** gravado (preço, rótulo, descrição
do momento em que foi salvo), não o catálogo de hoje. Senão a conta do papel
deixa de fechar com a que foi feita na hora.

## 5. Como conferir

Build e vitest verdes não bastam: a folha só existe impressa.

1. Gere o **PDF da impressão** pelo `playwright-core` do `ero-web`
   (`page.emulateMedia({ media: 'print' })` + `page.pdf({ format: 'A4',
   printBackground: true, preferCSSPageSize: true })`), ou pela skill
   `olhar-telas`.
2. **Abra o PDF** e confira, num relatório de **2 páginas ou mais**: cabeçalho e
   rodapé em todas, filtros só na 1ª, `Página X de Y` certo, barra na cor do
   destaque (teste com outro destaque também), nenhuma página em branco,
   subtotais fechando (agrupado).
