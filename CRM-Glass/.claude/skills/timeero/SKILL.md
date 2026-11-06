---
name: timeero
description: Orquestra o time de agentes do CRM Glass numa entrega completa — pesquisa, plano aprovado pelo dono, backend, front, revisões (backend, segurança, UI), QA, correções e resumo com o crédito de cada agente. Use quando o Eduardo pedir um módulo, uma tela nova ou uma mudança que atravessa back e front.
argument-hint: "<o que construir — ex.: cadastro de pessoas>"
disable-model-invocation: true
---

# /timeero — o time trabalhando junto

Pedido do Eduardo: **$ARGUMENTS**

Você é o gerente. **Não escreve o código da entrega**: distribui para os agentes,
confere o que volta e consolida. Cada etapa é uma chamada ao agente nomeado
(ferramenta Agent), com todo o contexto que ele precisa no prompt. Os agentes
**não veem esta conversa**: mande o pedido, o plano aprovado, a branch e o que
as etapas anteriores entregaram.

## 0. Preparar

- `git status` e `git branch --show-current`. Se estiver na `main`, crie
  `timeero/<assunto-curto>` e trabalhe nela. Se a árvore estiver suja, pergunte
  ao Eduardo o que fazer antes de seguir.
- Monte a lista de tarefas com as etapas abaixo.

## 1. Pesquisar (só se precisar)

Se o assunto já existiu no EroErp ou no EroErp 2.0 (cadastros, agenda,
WhatsApp, CEP...), chame o `pesquisa-eroerp` com o que procurar.

## 2. Planejar

Chame o `planejador` com o pedido, o relatório da pesquisa e a branch. Leve o
plano ao Eduardo; as perguntas do planejador vão **pelo AskUserQuestion**, com
a resposta padrão do planejador como primeira opção. **Não siga sem o plano
aprovado.** Se o Eduardo não estiver respondendo, pare aqui e deixe o plano escrito.

## 3. Construir

1. `dev-backend` com a parte de backend do plano aprovado e a branch.
   Lembre no prompt: **seguir obrigatoriamente `docs/01` e o módulo `usuario`**,
   e o `./mvnw verify` precisa ficar verde.
2. Front, depois do backend (o front tipa o que o back entregou):
   - Se o `frontend-modulos` apontar componente ou movimento faltando,
     chame `glass-design-system` e `motion-designer` **em paralelo** (arquivos separados).
   - Depois o `frontend-modulos`, com o plano, os endpoints e DTOs entregues
     pelo backend e o que o design system criou.

Entrega só de back ou só de front pula a outra parte.

## 4. Conferir

- **Em paralelo, na mesma mensagem:**
  - `revisor-backend` com o diff do backend (`git diff main...HEAD -- ero-api/`);
  - `seguranca` com o diff completo (`git diff main...HEAD`), **sempre**, mesmo em entrega só de front;
  - `revisor-ui` com as telas e os componentes tocados (se houve front).
- **Depois:** o `qa` com o que a entrega tocou (rotas, telas, regras, quem pode o quê).
  Ele sobe a API e o front, então roda sozinho.

## 5. Corrigir

Voltam para o agente dono do arquivo, com o achado literal:
- `bloqueia` ou `corrigir` do `revisor-backend`;
- qualquer `bloqueia` do `seguranca`;
- achados graves do `revisor-ui`;
- qualquer ❌ do `qa`.

Os donos são: `dev-backend` para `ero-api/`, e `frontend-modulos`,
`glass-design-system` ou `motion-designer` para o front. Depois, roda de novo
**só o conferente que reprovou**. **No máximo duas voltas**: se ainda
reprovar, pare e leve ao Eduardo o que não fechou. Sugestões não viram volta;
ficam no resumo.

## 6. Consolidar

Para o Eduardo, curto:

- O que a entrega fez, em duas ou três frases.
- **Quem fez o quê**: uma linha por agente que trabalhou.
- Commits da branch (`git log --oneline main..HEAD`).
- Como ver funcionando (preview `ero-api` / `prototipo`, rotas, logins de teste).
- O que ele precisa olhar ou decidir, e as sugestões que ficaram de fora.
- O passo seguinte é dele: revisar e fazer merge/push. **Nunca dê `git push`
  nem merge na `main` sem ele pedir.**
