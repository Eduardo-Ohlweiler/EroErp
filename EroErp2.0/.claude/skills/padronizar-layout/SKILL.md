---
name: padronizar-layout
description: Leva telas do EroErp 2.0 para o kit de telas do docs/14-layout-de-telas.md — na primeira execução constrói o kit (fase 0); depois migra cada tela para o seu modelo (List, Form, FormList), com o guardião de layout auditando antes e depois. Use quando o Eduardo pedir para padronizar uma tela, um módulo ou todas.
argument-hint: "<tela ou módulo — ex.: agenda, CompromissoForm, todas>"
disable-model-invocation: true
---

# /padronizar-layout

Alvo: **$ARGUMENTS**

O padrão é o do EroErp antigo: um kit pronto, campos com tamanho padrão, e toda
tela copiada de um modelo (doc 14). Decisões do Eduardo de 2026-10-23: label em
cima, nomes do antigo (`TCombo` fixo, `TDBCombo` banco), largura por token da
escala, lista com botões Filtrar · Limpar · Novo.

## 0. Preparar

- Branch: se estiver na `main`, crie `layout/<alvo>`.
- Leia o doc 14 §0. **Se o kit ainda não existe, a fase 0 vem antes de tudo**,
  qualquer que seja o alvo.
- Liste as telas do alvo em `ero/src/pages/` e as rotas delas em
  `ero/src/routes/AppRoutes.tsx`, com o modelo de cada uma (List, Form,
  FormList). "todas" = todas as páginas; nesse caso, mostre a lista ao Eduardo
  e corrija **um módulo por vez**, um commit por tela.
- Suba API e front se não estiverem de pé (skill `olhar-telas` §1).

## Fase 0 — construir o kit (só na primeira execução)

1. **Backend da auditoria** — `dev-backend`: os `ResponseDto` das entidades que
   têm `createdBy`/`updatedBy` (Pessoa, Produto, Serviço, Filial, Estoque,
   Compromisso, Consulta) publicam `criadoPorNome` e `alteradoPorNome` ao lado
   do `createdAt`/`updatedAt` que já publicam. Testes de integração conferindo
   os nomes. Commit próprio.
2. **Kit** — `dev-frontend`, conforme o doc 14 §2.4 e §3: `larguras.ts`,
   `TForm` + rodapé, `TRow`, `TCol`, `TRotulo`, `TEntry` com as máscaras novas,
   `TDate`, `TDateTime`, `TDBCheckBox`, `TDBRadio`, `TFieldList`, `TAuditoria`, `TButton` com
   as variantes de ação, `TPage` com `breadcrumb` e `carregando`, `useMessage`,
   `useQuestion`; `width` e a largura padrão em todos os campos. Exportados por
   `components/common/index.ts`.
3. **Renomeação** — `TSelect`→`TCombo`, `TCombo`→`TDBCombo`,
   `TComboMulti`→`TDBComboMulti` em todas as importações (doc 14 §3.5). É
   mecânica, sem mudar tela: commit próprio, `npm run build && npm run lint`
   verdes.
4. **Documentos** — doc 14 §0 passa a "existe"; a tabela "Existe hoje" do doc 04
   §4 e a lista de `components/common/` do `CLAUDE.md` descrevem o kit.
5. **Prova** — uma tela pequena de cada modelo migrada primeiro (sugestão: um
   FormList de `AuxiliaresProduto`, `ServicoList`, `ServicoForm`), auditada
   pelo guardião e **mostrada ao Eduardo antes de seguir** para as outras.

## 1. Auditar antes

`guardiao-layout` com as telas e rotas. Guarde o parecer e os screenshots do
"antes".

## 2. Migrar

`dev-frontend` com o parecer do guardião e as telas. Cada tela vira **cópia do
seu modelo** do doc 14 §4 com o kit:

- campos para o kit (`TEntry` com `mascara`, `TDate`, `TCombo`, `TDBCombo`…),
  um por `TRow`, lado a lado só nos grupos da §1;
- larguras pelo padrão do componente, `width` por token só onde preciso, nenhum
  `grid` ou classe de largura sobrando na página;
- Form com Situação, `TAuditoria` e rodapé Voltar · Novo | Salvar;
- **List com filtros por botão** (Filtrar/Enter · Limpar · Novo) no lugar da
  busca automática por `useDebounce` — mudança aprovada pelo Eduardo em
  2026-10-23, faz parte da migração;
- mensagens por `useMessage`, confirmação por `useQuestion`; spinner, faixa de
  só leitura e rodapé à mão saem.

Fora do escopo: regra de negócio, validação, textos, endpoints. Se o dev achar
outra coisa errada, anota no relatório e não corrige.

## 3. Auditar depois

`guardiao-layout` de novo, nas mesmas telas, a 1440, 768 e 360 px. Reprovou:
volta ao `dev-frontend` com o parecer, **no máximo duas vezes**.

## 4. Fechar

- `cd ero && npm run build && npm run lint`.
- `testador` nas telas migradas: filtrar, limpar, paginar com filtro, criar,
  editar, só leitura (sem Salvar, Novo e Inativar).
- Para o Eduardo: por tela, antes → depois (modelo, campos que mudaram de linha
  e de largura), os caminhos dos screenshots de antes e depois, o que o
  guardião deixou como pergunta, e os commits. **Sem push.**
