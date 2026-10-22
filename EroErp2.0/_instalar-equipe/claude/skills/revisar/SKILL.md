---
name: revisar
description: Revisão do trabalho em andamento no EroErp 2.0 pelo revisor de código e pelo guardião de layout, em paralelo. Use quando o Eduardo pedir uma revisão do que está na branch ou do que ainda não foi commitado.
argument-hint: "[faixa do git, ex.: main...HEAD — padrão: o que difere da main]"
disable-model-invocation: true
---

# /revisar

Faixa: **$ARGUMENTS** (vazio = `main...HEAD` mais o que não foi commitado).

1. `git status` e `git diff --stat` da faixa, para saber o que mudou. Separe os
   arquivos de tela (`ero/src/pages/`, `ero/src/components/`) e descubra as
   rotas deles em `ero/src/routes/AppRoutes.tsx`.
2. Na **mesma mensagem**, chame:
   - `revisor` com a faixa;
   - `guardiao-layout` com as rotas e os `.tsx` alterados — só se houver tela
     na faixa.
3. Junte os dois relatórios para o Eduardo, do mais grave ao menos grave, sem
   repetir achado que os dois viram. Diga quem achou cada coisa. **Não corrija
   nada**: a correção é decisão dele (ou um `/fatia`).
