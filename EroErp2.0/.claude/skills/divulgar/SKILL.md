---
name: divulgar
description: Gera material de divulgação do EroErp 2.0 (screenshots reais das telas + copy + arte) pelo agente comercial, sob demanda. Use quando o Eduardo pedir uma peça para divulgar o sistema — post, story, LinkedIn, landing, folder. Nada é publicado: a peça fica pronta para ele revisar e postar.
argument-hint: "<canal · o que divulgar — ex.: post instagram, lançamento da agenda>"
disable-model-invocation: true
---

# /divulgar

Pedido: **$ARGUMENTS**

Material de divulgação, **sob demanda**. Nada aqui é publicado, enviado ou pago —
a peça fica pronta para o Eduardo revisar e postar.

## 1. Entender o pedido

Do `$ARGUMENTS`, tire o **canal** (post/story Instagram, LinkedIn, landing,
folder) e o **objetivo** (lançamento, uma funcionalidade, prova social). Faltou
o que muda a peça — canal, telas a mostrar, público? Pergunte ao Eduardo pelo
**AskUserQuestion** antes de seguir.

## 2. Telas de pé

Suba API (:8080) e front (:5173) se não estiverem (skill `olhar-telas` §1) — o
comercial precisa delas para capturar os screenshots reais.

## 3. Chamar o comercial

Chame o agente **`comercial`** (ferramenta Agent) com: o canal, o objetivo, as
telas que a peça deve mostrar e qualquer resposta do Eduardo da etapa 1. Ele
captura os screenshots, escreve a copy e monta a arte (ou descreve a arte para
gerar).

## 4. Arte por IA, se houver

Se a sessão tem **Canva (MCP)** ou um **gerador de imagem** (nano banana /
Gemini) conectado, gere aqui a arte final a partir da copy e do screenshot que o
comercial entregou — é a sessão principal que tem esses tools. Sem connector,
fica a peça composta em HTML que o comercial já montou; diga ao Eduardo que a
versão por IA depende de conectar o Canva/gerador.

## 5. Entregar ao Eduardo

Mostre: os arquivos gerados (`divulgacao/<campanha>/`) e para qual canal cada um
é, a copy por canal, e os screenshots usados. **O passo final é dele:** revisar,
ajustar e postar. Nunca publique, conecte conta nem gaste por ele.
