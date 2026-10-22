---
name: padronizar-layout
description: Corrige larguras e disposição dos campos de telas do EroErp 2.0 para o padrão do docs/13-layout-de-telas.md, com o guardião de layout auditando antes e depois. Use quando o Eduardo pedir para padronizar uma tela, um módulo ou todas.
argument-hint: "<tela ou módulo — ex.: agenda, CompromissoForm, todas>"
disable-model-invocation: true
---

# /padronizar-layout

Alvo: **$ARGUMENTS**

## 0. Preparar

- Branch: se estiver na `main`, crie `layout/<alvo>`.
- Liste as telas do alvo em `ero/src/pages/` e as rotas delas em
  `ero/src/routes/AppRoutes.tsx`. "todas" = todas as páginas com formulário ou
  filtro; nesse caso, mostre a lista ao Eduardo e corrija **um módulo por vez**,
  um commit por tela.
- Suba API e front se não estiverem de pé (skill `olhar-telas` §1).

## 1. Auditar antes

`guardiao-layout` com as telas e rotas. Guarde o parecer e os screenshots do
"antes".

## 2. Corrigir

`dev-frontend` com o parecer do guardião e as telas. Na **primeira** execução
deste comando, a prop `largura` e o `TLinha` ainda não existem: o dev cria os
dois conforme o doc 13 §3, antes de mexer em qualquer tela, e atualiza o estado
no doc 13 §3 e a tabela da biblioteca no doc 04 §4.

A correção é **só de layout**: larguras, ordem e agrupamento dos campos. Nada de
regra, validação, texto ou comportamento — se o dev achar outra coisa errada,
anota no relatório e não corrige.

## 3. Auditar depois

`guardiao-layout` de novo, nas mesmas telas. Reprovou: volta ao `dev-frontend`
com o parecer, **no máximo duas vezes**.

## 4. Fechar

- `cd ero && npm run build && npm run lint`.
- Para o Eduardo: por tela, antes → depois (os campos que mudaram de largura e
  de linha), os caminhos dos screenshots de antes e depois, o que o guardião
  deixou como pergunta, e os commits. **Sem push.**
