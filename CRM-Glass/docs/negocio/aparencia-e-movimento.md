# Aparência e movimento

Resumo das decisões visuais do dono. A fonte da verdade é `design/DIRECAO-VISUAL.md`; fundos de cena em `docs/06-fundos-de-cena.md`; forma das telas em `docs/07-layout-de-telas.md`.

## Regras vigentes

- **Glass moderno e dinâmico**, tema escuro como padrão e claro trocável, mesmos tokens. Três níveis de vidro (`glass-subtle`, `glass`, `glass-solid`; tabelas e formulários usam o mais opaco). Contraste AA é inegociável.
- **Cor de destaque configurável por contratante** (padrão violeta para azul); nenhuma tela usa cor fixa, só tokens. Ver [[contratantes]].
- **Movimento é parte do produto, nível "site premiado":** telas que se montam em blocos ao entrar e se desmontam ao sair (login para Início é o exemplo principal; o kanban também pesa). Respeitar movimento reduzido. **Nunca simplificar movimento existente sem perguntar.**
- **Troca de tema em vídeo** (View Transition, cena dia/noite, luzes acendendo aos poucos) deve ser mantida; o dono investiu muito nela.
- Telas de cadastro seguem o **padrão do EroErp 2.0**: kit `T*` com os mesmos nomes e props, larguras por escala, modelos List/Form/FormList, label em cima, botões embaixo à esquerda; só o visual é glass. Botões de ação com as cores do 2.0 em versão glass (Salvar verde, Buscar azul, Limpar vermelho, Novo cor do contratante, Exportar verde, Pdf âmbar, Voltar neutro). Tela fora do modelo é pergunta ao dono. Componente que faltar é criado no kit, nunca contornado na tela.
- Relatórios: a folha impressa é o DOM, com logo do Ero, barra na cor do contratante, filtros só na 1ª página e rodapé com sistema, data, usuário e "Página X de Y" (`docs/08`).
- Nenhuma cor, sombra ou desfoque literal fora de `tokens.css`; nenhuma duração ou curva fora de `motion/tokens.ts`.
- **Cor de registro** (a cor da filial, [[filiais]]): é **dado do usuário**, não pele.
  - Vem do banco como `#RRGGBB` e é a única cor que não mora em `tokens.css`.
  - **Só o kit a aplica** (`TCor` e `TCorMarca`), e só na bolinha. Nunca em texto nem fundo de texto. A tela nunca escreve `style` de cor.
  - O kit confere o formato antes de aplicar; fora dele, a bolinha sai neutra.
  - As 8 sugeridas (Azul, Verde, Âmbar, Vermelho, Violeta, Rosa, Turquesa, Ardósia) são token (`--cor-registro-1` a `-8`), iguais nos dois temas.
  - A bolinha tem sempre o anel `--line-strong`, para aparecer em qualquer cor, e o nome fica ao lado: a cor nunca é a única informação.
  - Detalhe técnico: `docs/07`, §3.2, "Cor de registro".
- **Barra inferior do celular:** cabem 5 itens. Acima disso, o 5º lugar vira "Mais", que abre o submenu flutuante com o resto.

## Decisões do dono

- 06/11/2026: visão de movimento; troca de tema em vídeo preservada.
- 12/11/2026: telas no padrão do 2.0 com visual glass.
- 14/11/2026: tema claro/escuro volta a ser escolha do usuário.
- 14/11/2026: custo do time otimizado (um construtor por tela, uma passada visual só); ver `.claude/skills/timeero`.
- 20/11/2026: cor da filial livre `#RRGGBB`, como dado do usuário, aplicada só pelo kit.
- 20/11/2026: "Mais" na barra inferior do celular acima de 5 itens (P2 de Filiais).

## Em aberto

- Nome e identidade finais ("Vitrum" é provisório): cor de destaque oficial e logotipo.
- Desempenho: o fundo vivo com vidro fica em ~30 a 46 fps numa GPU integrada; decidir se o QA passa a reprovar abaixo da meta.
