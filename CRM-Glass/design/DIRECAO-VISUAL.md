# Direção visual do CRM — Glass moderno e dinâmico

Documento-fonte para todos os agentes de front-end. Quando um agente estiver em dúvida sobre estilo, vale o que está aqui. Mudanças de direção são decididas pelo dono do produto e registradas neste arquivo.

## 1. O que as referências mostram

Analisei 20 prints de referências (reels de UI "glassy" feitos em React + Tailwind + Framer Motion). Os padrões que se repetem:

| Elemento | Como aparece nas referências |
|---|---|
| Fundo | Nunca é cor lisa. É imagem ou gradiente com profundidade: cacos 3D escuros, curvas roxo/azul, feixes de luz azul, ambiente de interiores desfocado (tons quentes). O vidro só funciona porque há algo atrás dele. |
| Cartões | Translúcidos (branco a 5–12% no tema escuro), desfoque de fundo forte, borda de 1px clara e fina, cantos bem arredondados (16–28px), brilho sutil na borda superior, sombra difusa. |
| Navegação | Duas variações: barra lateral de ícones flutuante em formato de pílula, com rótulo que aparece ao passar o mouse; ou menu superior em pílulas, com a ativa preenchida. A seleção ativa "desliza" de um item para o outro. |
| Barra superior | Busca central com atalho de teclado, botão "+ Novo" na cor de destaque, chip de data/hora, notificações e avatar. |
| Dados | KPIs grandes com variação em pílula verde/vermelha; gráficos de linha com brilho e gradiente embaixo; barras em formato de pílula de vidro com uma destacada; rosca multicolorida; medidor (gauge) de satisfação. |
| CRM | Funil de etapas com barras de progresso, kanban de negociações por etapa (Descoberta → Proposta → Negociação → Ganho), cartões de cliente com avatar, tabela de clientes com segmento em etiqueta colorida. |
| Formulários | Campos de vidro escuro com ícone à esquerda, botão principal com gradiente luminoso, login social em botões de vidro. |
| Estado de sucesso | Cartão de vidro central com ícone de check em quadrado com brilho verde. |
| Cor de destaque | Varia por tela: violeta/índigo, azul elétrico, laranja e amarelo (no tema claro). Verde esmeralda sempre para positivo. |
| Tema claro | Existe: vidro fosco branco sobre fundo quente desfocado, pílulas pretas como contraste, destaque amarelo. |

## 2. Decisões

- **Tema escuro como padrão, tema claro trocável.** Os dois saem dos mesmos tokens.
- **Cor de destaque configurável.** Padrão: violeta → azul (gradiente). O sistema deve permitir trocar o destaque por empresa cliente (branding), então nenhuma tela usa cor fixa: só tokens.
- **Três níveis de vidro**, para não sacrificar a leitura em telas densas de CRM:
  - `glass-subtle` — painéis grandes e fundo de seções (mais transparente).
  - `glass` — cartões padrão, KPIs, gráficos.
  - `glass-solid` — tabelas, formulários longos, modais, menus suspensos (mais opaco, texto sempre legível).
- **Fundo vivo:** gradiente com "orbs" de cor desfocados que se movem devagar; opção de imagem de fundo escolhida pelo usuário; partículas apenas em login/boas-vindas.
- **Contraste é inegociável:** texto principal com contraste AA mínimo sobre o pior caso do fundo. Vidro bonito e ilegível não vale para um produto comercial.

## 3. Movimento (pedido explícito: muito moderno e dinâmico)

Biblioteca: Motion (Framer Motion) com `AnimatePresence` e animações de layout.

| Momento | Comportamento |
|---|---|
| **Troca de tela** | A tela que sai desfoca, perde opacidade e encolhe levemente (blur 0→8px, opacidade 1→0, escala 1→0,98). A nova entra ao contrário, e seus cartões aparecem em cascata (stagger de 40–60ms), subindo alguns pixels. Duração total ~350–450ms. |
| Direção | Ir para um nível mais fundo (lista → detalhe) desliza para a esquerda; voltar desliza para a direita. Trocar de módulo pelo menu usa a transição com desfoque. |
| Elemento compartilhado | Cartão de cliente/negócio "se expande" até virar a tela de detalhe (`layoutId`). |
| Menu | O indicador do item ativo desliza entre os itens (`layoutId`), rótulo do ícone aparece com mola. |
| Hover | Cartões sobem 4–5px e a borda ganha brilho; botões têm brilho que acompanha o cursor. |
| Números | KPIs contam de 0 até o valor ao entrar na tela; gráficos desenham a linha da esquerda para a direita. |
| Kanban | Arrastar cartão com inclinação leve e sombra; as colunas se reorganizam com animação de layout. |
| Feedback | Toasts de vidro que entram com mola; check de sucesso desenhado. |
| Acessibilidade | Respeitar `prefers-reduced-motion`: troca de tela vira só fade, sem desfoque, sem movimento. |
| Desempenho | Animar só `transform`, `opacity` e `filter` em elementos pequenos. Nunca animar `backdrop-filter`. Limitar camadas de vidro sobrepostas. Meta: 60fps num notebook comum. |

## 4. Stack de front-end

- React + Vite + TypeScript
- Tailwind CSS v4 (tokens em variáveis CSS) + shadcn/ui (Radix) como base de componentes acessíveis, reestilizados para glass
- Motion (Framer Motion) para animações e transições de tela
- lucide-react para ícones
- TanStack Router (rotas com transição) e TanStack Query (dados)
- TanStack Table para listagens e cadastros
- React Hook Form + Zod para formulários
- Recharts para gráficos (estilizados com os tokens)
- dnd-kit para o kanban
- MSW para simular a API enquanto o backend (NestJS ou Spring Boot) não é decidido

> **No protótipo (`prototipo/`)** algumas peças foram simplificadas de propósito, porque o objetivo era só o visual: React Router no lugar do TanStack Router, gráficos em SVG próprio (com animação de desenho) no lugar do Recharts, arrastar do kanban feito com o próprio Motion, e dados fixos em memória no lugar de TanStack Query + MSW. Os tokens, o vidro e o movimento já seguem este documento.

## 5. Módulos previstos (o design system tem que servir a todos)

- CRM: funil de vendas (kanban), negociações, atividades, painel de resultados
- Agenda: visão mês/semana/dia, compromissos, arrastar para remarcar
- Cadastros: pessoas, empresas/filiais, produtos, usuários e permissões
- Futuro: outros módulos no mesmo shell (menu, barra superior, busca global)

Todo cadastro segue o mesmo padrão de tela: listagem com busca e filtros → painel de detalhe → formulário em etapas. Fazer uma vez no design system e reutilizar.
