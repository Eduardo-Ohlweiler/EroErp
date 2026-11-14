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

## Como gastar pouco sem perder qualidade

O que custa no time é **quem constrói em sessão longa**: cada passo relê todo o
contexto acumulado, e screenshot é a parte mais cara. Planejar sai barato e é
onde está a parte difícil. Por isso:

- **Chame só quem a entrega precisa.** `glass-design-system` só quando o plano
  listar peça nova do kit; `motion-designer` só quando o plano pedir movimento
  novo; `pesquisa-eroerp` só quando o assunto existiu no EroErp/2.0.
- **Componente que faltar é sempre criado no kit** pelo `glass-design-system`,
  no padrão `T*`, antes da tela continuar. Nunca aceite tela que contorne
  (componente local, variação com `className`). Isso mantém o padrão.
- **Execuções curtas.** Um `frontend-modulos` por tela (ou por par de telas
  parecidas), em vez de uma execução com todas. Correção vai para um **agente
  novo** com o achado literal e os arquivos, não para quem já tem histórico longo.
- **Uma passada visual só.** Construtores não abrem navegador (fecham com build
  e testes). O `guardiao-layout` fotografa tudo numa pasta comum
  (`<scratchpad>/capturas`) e o `revisor-ui` lê essas capturas.
- **Modelo por papel.** Opus: `planejador`, `seguranca`, `dev-backend`,
  `glass-design-system`, `motion-designer`, `revisor-backend`, `relatorios`.
  Sonnet: `frontend-modulos` (telas copiadas de modelo), `revisor-ui`,
  `guardiao-layout`, `qa`, `pesquisa-eroerp`. Tela que **foge do padrão**
  (kanban, agenda, dashboard, o planejador diz) → chame o `frontend-modulos`
  com `model: "opus"`.
- **Brief enxuto, relatório curto.** Passe o caminho do plano e de um arquivo de
  entregas (contrato da API, peças do kit) em vez de colar tudo no prompt, e
  aponte os arquivos a ler. Os agentes devolvem ~300–500 palavras; detalhe vai
  num arquivo. Do `docs/07`, todo agente lê o resumo do topo e só a seção que
  precisa.

## 0. Preparar

- `git status` e `git branch --show-current`. Se estiver na `main`, crie
  `timeero/<assunto-curto>` e trabalhe nela. Se a árvore estiver suja, pergunte
  ao Eduardo o que fazer antes de seguir.
- Monte a lista de tarefas com as etapas abaixo.
- Grave o plano aprovado na raiz (`PLANO-<ASSUNTO>.md`) e, conforme as etapas
  entregam, um arquivo de entregas no scratchpad: é o que os agentes leem.

## 1. Pesquisar (só se precisar)

Antes, veja `docs/negocio/eroerp-referencias.md`: se o assunto já foi
pesquisado, não pesquise de novo. Se o assunto já existiu no EroErp ou no
EroErp 2.0 (cadastros, agenda, WhatsApp, CEP...) e ainda não está lá, chame o
`pesquisa-eroerp` com o que procurar.

## 2. Planejar

Chame o `planejador` com o pedido, o relatório da pesquisa e a branch. Leve o
plano ao Eduardo; as perguntas do planejador vão **pelo AskUserQuestion**, com
a resposta padrão do planejador como primeira opção. **Não siga sem o plano
aprovado.** Se o Eduardo não estiver respondendo, pare aqui e deixe o plano escrito.

## 3. Construir

1. `dev-backend` com a parte de backend do plano aprovado e a branch.
   Lembre no prompt: **seguir obrigatoriamente `docs/01` e o módulo `usuario`**,
   e o `./mvnw verify` precisa ficar verde.
2. Peças novas, se o plano listou: `glass-design-system` (kit) e
   `motion-designer` (movimento) **em paralelo** com o backend (arquivos
   separados). Sem peça nova, pule.
3. Front, depois do backend (o front tipa o que o back entregou):
   - Lembre no prompt do `frontend-modulos`: **toda tela de cadastro é cópia do
     modelo List, Form ou FormList do docs/07, só com o kit T***.
   - Uma execução por tela (ou par de telas), com o plano, o arquivo de
     entregas e os arquivos-modelo a copiar.
   - Se ele apontar componente ou movimento faltando: o `glass-design-system`
     (ou o `motion-designer`) **cria** a peça, e só então um `frontend-modulos`
     novo termina a tela.

Entrega só de back ou só de front pula a outra parte.

## 4. Conferir

- **Em paralelo, na mesma mensagem:**
  - `revisor-backend` com o diff do backend (`git diff main...HEAD -- ero-api/`);
  - `seguranca` com o diff completo (`git diff main...HEAD`), **sempre**, mesmo em entrega só de front;
  - `guardiao-layout` com as telas tocadas (se houve front): mede, fotografa as
    telas a 1440/768/360 px e, se o kit mudou, o catálogo das peças tocadas, na
    pasta comum de capturas.
- **Depois do guardião:** `revisor-ui` lendo as capturas e o código, **só se** a
  entrega mexeu no kit, nos tokens, no movimento ou numa tela que não é cópia de
  modelo. Tela de cadastro copiada do modelo com o kit pronto não precisa dele.
- **Depois:** o `qa` com o que a entrega tocou (rotas, telas, regras, quem pode o quê).
  Ele sobe a API e o front, então roda sozinho.

## 5. Corrigir

Voltam para o agente dono do arquivo, com o achado literal:
- `bloqueia` ou `corrigir` do `revisor-backend`;
- qualquer `bloqueia` do `seguranca`;
- achados graves do `revisor-ui`;
- tela `reprovada` pelo `guardiao-layout`;
- qualquer ❌ do `qa`.

Os donos são: `dev-backend` para `ero-api/`, e `frontend-modulos`,
`glass-design-system` ou `motion-designer` para o front. Cada volta é um
**agente novo** do dono, com o achado literal e os arquivos; donos diferentes
rodam em paralelo. Depois, roda de novo
**só o conferente que reprovou**. **No máximo duas voltas**: se ainda
reprovar, pare e leve ao Eduardo o que não fechou. Sugestões não viram volta;
ficam no resumo.

## 6. Consolidar

Antes do resumo, **atualize `docs/negocio/`**: as decisões aprovadas pelo
Eduardo nesta entrega entram na nota do domínio e numa linha datada em
`decisoes.md`; o que a pesquisa achou no EroErp/2.0 entra em
`eroerp-referencias.md`. É o segundo cérebro que o planejador lê na próxima
vez (o Eduardo o abre no Obsidian, pasta `docs/`).

Para o Eduardo, curto:

- O que a entrega fez, em duas ou três frases.
- **Quem fez o quê**: uma linha por agente que trabalhou.
- Commits da branch (`git log --oneline main..HEAD`).
- Como ver funcionando (preview `ero-api` / `prototipo`, rotas, logins de teste).
- O que ele precisa olhar ou decidir, e as sugestões que ficaram de fora.
- O custo por agente, medido com o script de uso (memória
  `crmglass-custo-timeero`), para acompanhar se as regras acima estão valendo.
- O passo seguinte é dele: revisar e fazer merge/push. **Nunca dê `git push`
  nem merge na `main` sem ele pedir.**
