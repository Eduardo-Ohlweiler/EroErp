# Padrão de relatórios

> Todo relatório do EroErp 2.0 tem a **mesma moldura**: cabeçalho com o logo e a
> faixa do tenant em toda página, filtros só na primeira, rodapé de auditoria em
> toda página. O conteúdo muda; a moldura, não. Prevalece sobre o desenho antigo
> da `Folha`. Construído em cima da impressão que já existe
> ([docs/05 §8](05-identidade-visual.md)), não de uma segunda ferramenta.

A folha é **o DOM impresso**, não um print da tela nem um PDF remontado à mão
(a armadilha "duas montagens divergem" do `Folha.tsx`). O relatório lê os mesmos
objetos e formatadores que a tela leu.

---

## 1. A moldura (vale para todo relatório)

### 1.1 Cabeçalho — em **todas** as páginas

Uma faixa, da esquerda para a direita:

- **Logo do Ero** à esquerda (`assets/brand/logo-ero-horizontal.svg`, inline
  `?react`, em `currentColor` = `--primary` do tenant; nunca um PNG de cor fixa —
  armadilha "logo em cor fixa destoa da paleta").
- **Barra na cor clara do tenant** ocupando o resto: fundo `--surface-alt` (o
  tom claro da paleta do tenant), uma borda/àcento à esquerda em `--primary`, e
  dentro:
  - **nome do emitente** (a filial/matriz emitente), em destaque;
  - **título do relatório** logo abaixo do nome.

A cor é a do **tenant efetivo** — `--primary`/`--surface-alt` já trocam com a
paleta, então o cabeçalho acompanha sozinho. Não cravar hex.

### 1.2 Filtros — só na **primeira** página

Bloco logo abaixo do cabeçalho, **uma vez**: os filtros que geraram o relatório,
`rótulo: valor`, separados por `·`. Filtro vazio não aparece; **nenhum** filtro
aplicado vira a frase explícita "sem filtro aplicado". Uma folha sem o recorte
que a produziu é indefensável (é o que separa relatório de print de grid —
`DocumentoLista.tsx`).

### 1.3 Rodapé — em **todas** as páginas

Uma linha de auditoria: **`EroErp · <data e hora da geração> · gerado por
<usuário> · Página X de Y`**. O usuário é o logado que mandou gerar — nunca dado
pessoal além do identificador de login (regra 5). Hoje o `Folha` só tem
"Documento gerado por EroErp · data"; o padrão acrescenta **o usuário** e a
**página**.

### 1.4 Como a moldura se repete (técnica)

Cabeçalho e rodapé repetem em toda página com `position: fixed` no `@media print`
e `@page { margin }` reservando o espaço no topo e no pé; o corpo flui na área
entre eles. Os **filtros** ficam em fluxo normal (não fixos), então aparecem só
na primeira página. Numeração de página: `counter(page)` dentro de `@page` não é
suportada pelos navegadores (comentário no `Folha.tsx`) — usar o `X de Y` do
diálogo de impressão, ou gerar o PDF pelo driver do `olhar-telas`
(`page.pdf({ displayHeaderFooter, footerTemplate })`, que expõe `pageNumber`/
`totalPages`). `break-inside: avoid` só em caixa menor que a página (armadilha do
`Folha`): linha de tabela e tira de indicadores, nunca um grupo inteiro.

---

## 2. Os modelos, por tipo de assunto

### 2.1 Lista simples — `DocumentoLista`

Já existe. Uma listagem sem agrupamento (Pessoas, Serviços): tira de indicadores
opcional no topo, uma tabela, os filtros no cabeçalho, aviso de corte quando a
exportação trunca. Só **migrar** para a nova moldura (§1). Colunas = as mesmas da
planilha (`ColunaExportavel`), para o CSV e o papel nunca discordarem.

### 2.2 Registros agrupados com subtotais — `DocumentoAgrupado` (novo)

O modelo dos exemplos do Eduardo: N níveis de agrupamento, **subtotal por nível**
e **total geral**. O mesmo componente serve a todos os recortes — o que muda é a
lista de níveis:

- por **filial**;
- por **cliente** e **data**;
- por **data** e **cliente**;
- por **data**, **cliente** e **serviço**.

Forma: cada nível abre uma **barra de grupo** (na cor clara do tenant, mais forte
a cada nível acima), as linhas de detalhe abaixo, e ao fechar o grupo uma linha
**`Total <nível>: …`** destacada; no fim, o **total geral**. Colunas numéricas à
direita (`.numeric`), com as casas do dado. Grupo vazio não vai.

O agrupamento e os subtotais são **calculados no servidor** e vêm prontos
(derivado que a regra escolhe é publicado, não recomputado na tela — armadilha
"derivado… tem de ser publicado"). O front **exibe**; não soma regra de negócio
em TypeScript (doc 04 §14).

### 2.3 Registros em cartão — `DocumentoCartoes` (quando couber)

Para registro "largo" com muitos campos por item (o relatório de containers do
exemplo): cada registro é um bloco rótulo→valor em 2–3 colunas, com totais no pé.
Reusa `LinhasDeValor`. Criar só quando um assunto pedir; não antecipar.

---

## 3. Dados do relatório vêm do servidor, cobrindo o filtro inteiro

Como o `DocumentoLista` já faz: a consulta do relatório **refaz sem paginação**
(`TAcoesDeExportacao`), cobre o filtro todo até o teto, e **anuncia o que ficou
de fora** — relatório que corta calado não é registro. Agrupamento/subtotais:
endpoint próprio de relatório que devolve os grupos e os totais prontos, no
escopo do tenant efetivo (regra 1). Exportação com escopo duplo (tenant × global)
repete o mesmo `if` da tela (armadilha "exportação com escopo duplo").

## 4. Retrato, não catálogo

Relatório de registro salvo lê o **retrato** gravado (preço, rótulo, descrição do
momento), não o catálogo de hoje — senão a conta do papel deixa de fechar
(armadilha "retrato gravado explica o número").

---

Exemplo visual do padrão (lista + agrupado, com o logo e a cor reais):
`relatorio-exemplo.pdf` na raiz do `EroErp2.0/`.
