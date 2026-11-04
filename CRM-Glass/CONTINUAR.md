# Como continuar este projeto em outro computador

Guia de passagem do CRM Glass (nome provisório: **Vitrum CRM**). Última atualização: 04/11/2026.

---

## 1. Antes de compactar

- **Não inclua `prototipo/node_modules`.** São centenas de MB e são reinstalados com um comando. Se for compactar pelo Explorer, apague essa pasta antes ou compacte só o resto.
- **Inclua a pasta `.claude`.** Ela tem os 4 agentes e a configuração do preview. No Windows ela aparece normalmente, mas confira que entrou no zip.
- Se existir `prototipo/dist`, pode deixar de fora (é gerada pelo build).

O que precisa ir no zip:

```
CRM-Glass/
  CONTINUAR.md            este guia
  CLAUDE.md               instruções do projeto para o Claude
  design/DIRECAO-VISUAL.md
  .claude/agents/*.md     os 4 agentes de front-end
  .claude/launch.json     abre o protótipo no preview do app
  prototipo/              código do protótipo (sem node_modules)
```

## 2. Preparar o outro computador

1. Instale o **Node.js 20 ou mais novo** (o protótipo foi feito com Node 24).
2. Descompacte a pasta onde quiser, por exemplo `Documentos\CRM-Glass`.
3. Instale as dependências e rode:

```bash
cd CRM-Glass/prototipo
npm install
npm run dev
```

4. Abra http://localhost:5180. Na primeira visita da aba aparece o login; qualquer clique em **Entrar** abre o sistema.

Recomendado: dentro de `CRM-Glass`, rode `git init` e faça um primeiro commit, para ter histórico a partir daqui (hoje a pasta não é um repositório).

## 3. Retomar com o Claude Code

1. Abra o Claude Code com a pasta **`CRM-Glass`** (a raiz, não `prototipo`), para ele carregar o `CLAUDE.md` e os agentes de `.claude/agents/`.
2. Opcional, mas recomendado: instale os plugins de design que encontramos no catálogo (os agentes já carregam essas skills quando estão disponíveis):
   - **frontend-design** (Anthropic)
   - **Design** (Anthropic): crítica de design, design system, acessibilidade
   - **VectorLab UI/UX Skills**: movimento, transições, superfícies, paleta, anti-slop
   - **Skills For Real React/React Native Engineers**: Framer Motion, animações, Tailwind
3. Primeira mensagem sugerida:

> Leia o CONTINUAR.md, o CLAUDE.md e o design/DIRECAO-VISUAL.md. Estamos continuando o CRM Glass a partir do protótipo visual. Suba o protótipo no preview e vamos seguir pelos próximos passos.

---

## 4. Onde paramos

### Objetivo do produto

CRM comercial (SaaS web) para vender, bonito e atrativo, em estilo **glass**, que depois cresce para outros módulos: agenda, cadastros de pessoas, filiais, produtos etc. As referências foram 20 prints de UIs "glassy" (dashboards, sidebar, login, carrossel, partículas), resumidas na direção visual.

### Decisões já tomadas

| Tema | Decisão |
|---|---|
| Visual | Glass moderno e dinâmico, com animação na troca de telas |
| Tema | Escuro como padrão, claro trocável (mesmos tokens) |
| Cor de destaque | Configurável por empresa cliente; padrão violeta → azul |
| Vidro | Três níveis: `glass-subtle`, `glass`, `glass-solid` (tabelas e formulários usam o mais opaco) |
| Front-end | React + TypeScript + Vite + Tailwind CSS 4 + Motion (Framer Motion) + lucide-react |
| Banco | PostgreSQL |
| Primeira entrega | Design system + protótipo navegável, **só visual, com dados fictícios** |

### Decisões em aberto

- **Backend:** NestJS ou Java com Spring Boot.
- **Multiempresa (multi-tenant):** ainda não decidido.
- **Nome e identidade:** "Vitrum" é provisório; falta escolher a cor de destaque oficial e o logotipo.
- **Biblioteca de componentes do produto final:** a proposta é shadcn/ui (Radix) reestilizado para glass. O protótipo usa componentes próprios mais simples.

### O que está pronto

- **Direção visual** em `design/DIRECAO-VISUAL.md`: análise das referências, níveis de vidro, regras de movimento, stack e módulos previstos.
- **Time de 4 agentes** em `.claude/agents/`:
  - `glass-design-system`: tokens, temas, componentes base;
  - `motion-designer`: transições de tela e animações;
  - `frontend-modulos`: telas de negócio;
  - `revisor-ui`: revisão somente leitura.
- **Protótipo** em `prototipo/` (detalhes no `prototipo/README.md`):
  - login com esfera de partículas;
  - dashboard com números que contam, gráficos que se desenham, medidor, rosca e ranking;
  - funil kanban com arrastar e soltar, modal de detalhe e formulário de novo negócio com validação;
  - agenda dia/semana/mês com linha do horário atual e gaveta de detalhes;
  - clientes, filiais e produtos usando o mesmo componente de cadastro;
  - ficha do cliente com transição em profundidade e abas;
  - página Design system (catálogo) e página Aparência (troca tema, destaque, fundo, vidro e animação ao vivo);
  - busca global com Ctrl + K e troca de tema com revelação circular.

### O que foi verificado e o que não foi

- **Conferido no navegador (1440×900):** login, dashboard, funil (incluindo arrastar), modal de negócio, agenda (semana), clientes, ficha do cliente e tema claro. O build de produção compila sem erros.
- **Não aberto no navegador:** Filiais, Produtos, Design system, Aparência, agenda nas visões Dia e Mês, busca Ctrl + K.
- **Não testado:** celular e tablet, contraste medido (só olhado), desempenho medido (meta: 60 fps), navegadores além do Chromium.
- **Simplificações de propósito no protótipo:** React Router em vez de TanStack Router, gráficos em SVG próprio em vez de Recharts, dados fixos em memória em vez de TanStack Query + MSW. "Novo cliente" e "Novo compromisso" só mostram um aviso; o formulário completo existe apenas para "Novo negócio".

---

## 5. Próximos passos sugeridos

1. **Feedback visual:** navegar no protótipo e listar o que mudar (cores, densidade, fundo, intensidade do vidro, animações). A página **Aparência** ajuda a testar opções antes de decidir.
2. **Fechar a identidade:** nome, cor de destaque oficial, logotipo. Atualizar `tokens.css` e a direção visual.
3. **Conferir o que ficou sem verificar:** as telas da seção 4, o celular, e uma revisão com o agente `revisor-ui`.
4. **Decidir o backend** (NestJS × Spring Boot) e o modelo multiempresa.
5. **Montar o projeto definitivo:** estrutura por módulos, shadcn/ui reestilizado, TanStack Router/Query/Table, React Hook Form + Zod, MSW para simular a API e, depois, a API real com PostgreSQL.
