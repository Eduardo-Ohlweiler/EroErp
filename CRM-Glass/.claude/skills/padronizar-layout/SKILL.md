---
name: padronizar-layout
description: Leva telas de cadastro do CRM Glass para o kit de telas do docs/07-layout-de-telas.md — na primeira execução o glass-design-system constrói o kit e o catálogo (fase 0); depois cada tela vira cópia do seu modelo (List, Form, FormList), módulo a módulo, com o guardião de layout auditando antes e depois. Use quando o Eduardo pedir para padronizar uma tela, um módulo ou todas.
argument-hint: "<tela ou módulo — ex.: contratantes, ContratanteForm, todas>"
disable-model-invocation: true
---

# /padronizar-layout

Alvo: **$ARGUMENTS**

O padrão é o do EroErp 2.0 (que veio do antigo): um kit pronto, campos com
tamanho padrão, e toda tela de cadastro copiada de um modelo (doc 07).
Decisão do Eduardo de 2026-11-13: label em cima, os nomes e as props do kit do
2.0 (`TCombo` fixo, `TDBCombo` banco...), largura por token da escala, List com
Buscar · Limpar · Novo · Exportar · Pdf, Form com Salvar · Novo · Voltar e
FormList com Salvar · Novo, botões de ação com as cores do 2.0 em versão
glass. **O visual glass não muda**: tokens, três níveis de vidro, destaque por
contratante e a montagem e desmontagem em blocos (`design/DIRECAO-VISUAL.md`).

Os agentes do `.claude/agents/` **não veem esta conversa**: mande a cada um o
alvo, o doc 07, o que a etapa anterior entregou e o parecer do guardião.

## 0. Preparar

- **Branch:** hoje o trabalho fica na `main`, sem branch, por decisão do dono
  (11/11/2026). Se ele pedir branch, crie `layout/<alvo>`. Commit só com o OK
  dele; **push e merge são sempre do dono**.
- Leia o doc 07 §0. **Se o kit ainda não existe, a fase 0 vem antes de tudo**,
  qualquer que seja o alvo.
- Liste as telas do alvo em `ero-web/src/modules/*/pages/` e as rotas delas em
  `modules/*/routes.tsx` (montadas em `ero-web/src/app/rotas.tsx`), com o
  modelo de cada uma (List, Form, FormList). Login, Início, kanban, agenda e
  painéis não são cadastro: ficam fora (doc 07 §3.5). "todas" = todas as telas
  de cadastro; nesse caso, mostre a lista ao Eduardo e siga **um módulo por
  vez**.
- Suba o stack (skill `olhar-telas` §1). Para os scripts entrarem sozinhos,
  ele tem de estar no **modo Mailpit**; no modo Gmail eles se recusam a logar.

## Fase 0 — construir o kit (só na primeira execução)

1. **Backend da auditoria** — `dev-backend`: os `ResponseDto` das entidades que
   têm `createdBy`/`updatedBy` (hoje `TenantResponseDto` e
   `UsuarioResponseDto`) publicam `criadoPorNome` e `alteradoPorNome` ao lado
   do `createdAt`/`updatedAt` que já publicam, montados pelo mapper com outro
   DTO ou nome em lote (`docs/01`, "nomes em lote projetados em `SelectDto`"),
   nunca com entidade. Testes de integração conferindo os nomes, incluindo o
   isolamento entre dois contratantes. `revisor-backend` e `seguranca` revisam.
2. **Tokens** — `glass-design-system`: os tokens novos do doc 07 §3.4 no
   `ero-web/src/styles/tokens.css`, nos temas escuro e claro (cores cheias das
   ações com o texto de cada uma, brilhos, campo só leitura, folha impressa),
   com contraste AA conferido nos dois temas.
3. **Kit** — `glass-design-system`, conforme o doc 07 §2.4 e §3, em
   `ero-web/src/design-system/kit/`, exportado pelo `index.ts` de lá, vestindo
   os componentes de `design-system/ui/` (doc 07 §0, tabela) em vez de
   duplicá-los: `larguras.ts`, `TPage` (com `coreografia`), `TForm` + rodapé,
   `TRow`, `TCol`, `TRotulo`, `TPanel`, `TModal`, `TTabs`, `TEntry` com as
   máscaras (portando o `EroErp2.0/ero/src/utils/format.ts` para
   `shared/util/format.ts`), `TDate`, `TDateTime`, `TTextArea`, `TCombo`,
   `TDBCombo`, `TDBComboMulti`, `TCheckBox`, `TDBCheckBox`, `TRadio`,
   `TDBRadio`, `TCor`, `TFieldList`, `TAuditoria`, `TButton` com as variantes
   de ação, `TDataGrid`, `TDataGridFooter`, `TBadge`, `TAcoesDeExportacao`,
   `TBotaoImprimir`, `useMessage`, `useQuestion`, `useSomenteLeitura`; `width`
   e a largura padrão em todos os campos; e **os atributos do doc 07 §7.1**
   (`data-kit`, `data-largura`, `data-mascara`), sem os quais o
   `medir-campos.mjs` não enxerga o kit. Referência de comportamento: o kit do
   2.0 em `EroErp2.0/ero/src/components/common/` (mesmos nomes e props); a
   aparência é a do CRM.
4. **Movimento** — `motion-designer`, em paralelo com o 3 (arquivos
   separados): o encaixe dos blocos do kit (cartão do `TForm`, campos, rodapé,
   linhas da grade) nas coreografias `padrao` e `formulario`, e o movimento
   reduzido.
5. **Catálogo** — `glass-design-system`: uma seção "Kit de telas" no
   `/design-system` (só em dev) com os três modelos funcionando sobre dados de
   mentira, nos dois temas, a 1440, 768 e 360 px. Vitest dos componentes com
   lógica (máscaras, `erroApi`, só leitura). `npm run build` e `npm test` no
   `ero-web` verdes.
6. **Documentos** — doc 07 §0 passa a "existe" e lista as telas que já estão
   no kit; o `CLAUDE.md` e os agentes passam a apontar o kit (quem cuida
   desses arquivos atualiza; esta skill só avisa o que mudou).
7. **Prova** — `revisor-ui` e `guardiao-layout` revisam o kit no catálogo; a
   primeira tela de cadastro (sugestão: Contratantes, List e Form) é montada
   pelo `frontend-modulos` sobre o kit, auditada pelo guardião e **mostrada ao
   Eduardo antes de seguir** para as outras.

## 1. Auditar antes

`guardiao-layout` com as telas e rotas do alvo. Guarde o parecer e os
screenshots do "antes" (`olhar.mjs … --todas`). Tela nova, que ainda não
existe, pula esta etapa.

## 2. Migrar

`frontend-modulos` com o parecer do guardião e as telas. Cada tela vira **cópia
do seu modelo** do doc 07 §4 com o kit:

- campos para o kit (`TEntry` com `mascara`, `TDate`, `TCombo`, `TDBCombo`…),
  um por `TRow`, lado a lado só nos grupos da §1;
- larguras pelo padrão do componente, `width` por token só onde preciso,
  nenhum `grid` ou classe de largura sobrando na página;
- Form com Situação (se a API de alterar recebe `ativo`), `TAuditoria` e
  rodapé Salvar · Novo · Voltar; FormList com Salvar · Novo;
- **List com filtros por botão** (Buscar/Enter · Limpar · Novo · Exportar ·
  Pdf), consulta só ao buscar, paginar ou limpar;
- lista pelo `PaginaDto`, edição com `version`, erro do ProblemDetail no
  campo, só leitura pelo `<GRUPO>_ESCREVER` (doc 07 §4);
- `TPage` com a coreografia do modelo; mensagens por `useMessage`,
  confirmação por `useQuestion`.

Se faltar um componente ou um movimento no kit, o `frontend-modulos` **não
improvisa na tela**: pede ao `glass-design-system` (componente, token) ou ao
`motion-designer` (movimento), que entregam no kit, e só então segue.

Fora do escopo: regra de negócio, validação, textos, endpoints. Se o dev achar
outra coisa errada, anota no relatório e não corrige. Na dúvida sobre regra de
negócio, pergunta ao Eduardo.

## 3. Auditar depois

`guardiao-layout` de novo, nas mesmas telas, a 1440, 768 e 360 px
(`medir-campos.mjs` sem `✗`, `olhar.mjs --todas`, os dois temas), e
`revisor-ui` para contraste, teclado, foco e movimento reduzido. Reprovou:
volta a quem é dono do arquivo (`frontend-modulos` na tela,
`glass-design-system` no kit, `motion-designer` no movimento) com o parecer,
**no máximo duas vezes**.

## 4. Fechar

- `npm run build --prefix ero-web` e `npm test --prefix ero-web`.
- `qa` nas telas migradas: filtrar, limpar, paginar com filtro, criar, editar
  (com 409 de outra aba), erro de validação no campo, só leitura (sem Salvar,
  Novo e Inativar) e o isolamento entre dois contratantes.
- Para o Eduardo: por tela, antes → depois (modelo, campos que mudaram de linha
  e de largura), os caminhos dos screenshots de antes e depois, o que o
  guardião deixou como pergunta, e o que ficou para commitar. **Sem commit sem
  o OK dele; push e merge são sempre dele.**
