---
name: fatia
description: Orquestra a equipe de agentes do EroErp 2.0 numa fatia de trabalho completa — pesquisa, plano, backend, frontend, revisão, layout e QA — e consolida o resultado com o crédito de cada agente. Use quando o Eduardo pedir um módulo, uma migração do EroErp antigo, uma tela nova ou uma mudança que atravessa back e front.
argument-hint: "<o que construir — ex.: migrar o financeiro do antigo>"
disable-model-invocation: true
---

# /fatia — a equipe trabalhando junto

Pedido do Eduardo: **$ARGUMENTS**

Você é o gerente. Não escreve o código da fatia: distribui para os agentes,
confere o que volta e consolida. Cada etapa abaixo é uma chamada ao agente
nomeado (ferramenta Agent), com o contexto que ele precisa no prompt — os
agentes **não veem esta conversa**.

## 0. Preparar

- `git status` e `git branch --show-current`. Se estiver na `main`, crie
  `fatia/<assunto-curto>` e trabalhe nela. Working tree sujo: pergunte ao
  Eduardo o que fazer antes de seguir.
- Crie a lista de tarefas com as etapas abaixo.

## 1. Pesquisar (só se precisar)

- Migração do EroErp antigo → `pesquisa-eroerp-antigo` com o módulo e o que
  procurar.
- Infraestrutura já resolvida no sistema da Silvia → `pesquisa-silvia`.
- Os dois podem ir **em paralelo**, na mesma mensagem.

## 2. Planejar

`planejador` com o pedido, os relatórios da etapa 1 e a branch. Leve o plano ao
Eduardo: as perguntas dele **pelo AskUserQuestion**, com a resposta que o
planejador assumiria como primeira opção. **Não siga sem o plano aprovado** —
é o "na dúvida, pergunte" do CLAUDE.md. Se o Eduardo não estiver respondendo,
pare aqui e deixe o plano escrito para ele.

## 3. Construir

- `dev-backend` com o plano aprovado (a parte de backend) e a branch.
- Depois `dev-frontend` com o plano, o resumo do que o backend entregou
  (endpoints, DTOs) e a branch. Em sequência, não em paralelo: o front tipa o
  que o back entregou. Fatia só de front ou só de back pula o outro.
- Se a fatia tem **relatório/impressão**, o `relatorios` faz essa camada
  (padrão do doc 15), depois do `dev-frontend` — e pede ao `dev-backend` o
  endpoint de agrupamento/totais, se precisar.

## 4. Conferir

- `revisor` com a faixa do diff (`git diff main...HEAD`) — só lê, pode ir **em
  paralelo** com qualquer um.
- Os três que abrem o sistema no Chrome dividem o mesmo :8080/:5173 e o rate
  limit (5 logins/min), então rode-os **em série**, um de cada vez, para não se
  atropelarem nem provocar 429:
  - `guardiao-layout` com as rotas das telas criadas ou alteradas.
  - `qa` com o que a fatia tocou e os fluxos para a verificação de três vias.
  - `testador` com os fluxos da fatia e as telas vizinhas que podem ter sido
    impactadas, para a jornada como usuário.

## 5. Corrigir

Achado que **bloqueia** ou **corrigir** (revisor), tela **reprovada**
(guardião) e ❌ (qa ou testador) voltam para o `dev-backend` ou `dev-frontend`,
com o achado literal. Depois, só o conferente que reprovou roda de novo. **No máximo duas
voltas**: se ainda reprovar, pare e leve ao Eduardo o que não fechou.
Sugestões ficam para o relatório, não viram volta.

## 6. Consolidar

Para o Eduardo, curto:

- O que a fatia entregou, em duas ou três frases.
- **Quem fez o quê** — uma linha por agente que trabalhou (o planejador
  levantou…, o backend criou…, o guardião reprovou X e aprovou depois…).
- Commits da branch (`git log --oneline main..HEAD`).
- O que ele precisa olhar ou decidir; sugestões que ficaram de fora.
- O passo seguinte é dele: revisar e fazer merge/push. **Nunca dê `git push`
  nem merge na `main` sem ele pedir.**
