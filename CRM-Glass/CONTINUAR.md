# Como continuar este projeto em outro computador

Guia de passagem do CRM Glass (nome provisório: **Vitrum CRM**). Última atualização: 06/11/2026.

---

## 1. Antes de compactar

- **Não inclua `prototipo/node_modules`.** São centenas de MB e são reinstalados com um comando. Se for compactar pelo Explorer, apague essa pasta antes ou compacte só o resto.
- **Não inclua `ero-api/target`** (gerado pelo build) **nem `ero-api/.env`** (segredos de dev desta máquina; no outro computador, gere um novo a partir do `.env.example`).
- **Inclua a pasta `.claude`.** Ela tem os 11 agentes, a skill `/timeero` e a configuração do preview. No Windows ela aparece normalmente, mas confira que entrou no zip.
- Se existir `prototipo/dist`, pode deixar de fora (é gerada pelo build).

O que precisa ir no zip:

```
CRM-Glass/
  CONTINUAR.md            este guia
  CLAUDE.md               instruções do projeto para o Claude
  design/DIRECAO-VISUAL.md
  docs/                   arquitetura, segurança, multi-tenant, permissões, banco
  ero-api/                backend (sem target/ e sem .env)
  .claude/agents/*.md     o time de agentes
  .claude/skills/timeero/ orquestração do time (/timeero)
  .claude/launch.json     abre o protótipo e a API no preview do app
  .claude/settings.json   permissões do projeto (bloqueia push --force etc.)
  prototipo/              código do protótipo (sem node_modules)
```

Para o backend, o outro computador precisa de **JDK 25** (com `JAVA_HOME`
apontando para ele) e **Docker Desktop** ligado.

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
| Backend | Java 25 + Spring Boot 4.1 + Maven, em `ero-api/`, pacote `com.api.ero_api` (06/11/2026) |
| Arquitetura | Camadas por entidade: `entity/ repository/ dtos/ mapper/ service/ controller/`, mapper manual estático, módulo-modelo `usuario`; o ArchUnit garante a estrutura (`docs/01`) |
| Banco | PostgreSQL 18, Liquibase, UUID v7 |
| Multiempresa | **Multi-tenant** com `tenant_id` filtrado automaticamente pelo Hibernate (`@TenantId`). Funciona igual se cada contratante ganhar o próprio container, que é o caminho provável (`docs/03`) |
| Segurança | OWASP Top 10 desde o início (`docs/02`) |
| Login | Token de 15 min + refresh em cookie httpOnly com rotação; 2FA (TOTP) opcional, exigível pelo contratante |
| Permissões | Superadmin (dono), ADMIN (regras a definir) e USUARIO com grupos de liberação LER/ESCREVER + ações extras, como no EroErp 2.0 (`docs/04`) |
| Infraestrutura | Docker (Docker Compose); imagem da API pronta (`ero-api/Dockerfile`) |
| Primeira entrega | Design system + protótipo navegável, **só visual, com dados fictícios** |

### Decisões em aberto

- **Para ver mais tarde:** hospedagem, integração com WhatsApp (Evolution API), assistente de IA, filas e demais detalhes de infraestrutura.
- **Nome e identidade:** "Vitrum" é provisório; falta escolher a cor de destaque oficial e o logotipo.
- **Biblioteca de componentes do produto final:** a proposta é shadcn/ui (Radix) reestilizado para glass. O protótipo usa componentes próprios mais simples.

### O que está pronto

- **Direção visual** em `design/DIRECAO-VISUAL.md`: análise das referências, níveis de vidro, regras de movimento, stack e módulos previstos.
- **Time de 11 agentes** em `.claude/agents/` e o comando **`/timeero <pedido>`**, que orquestra pesquisa → plano → backend → front → revisões → QA (tabela no `CLAUDE.md`).
- **Backend `ero-api`** (06/11/2026):
  - Fundação: base com auditoria e lock otimista, erros em ProblemDetail, tenant automático, CORS, cabeçalhos de segurança, limite de requisições e criptografia de campos.
  - Módulos `auth` (login, refresh com rotação, logout, troca de senha, 2FA com códigos de recuperação, superadmin "acessar contratante"), `tenant`, `usuario` (módulo-modelo), `permissao`, `sessao` e `auditoria`.
  - 7 migrations, Dockerfile e compose de dev.
  - 72 testes verdes: 21 de arquitetura (ArchUnit), integração com Postgres real (Testcontainers), TOTP e limite de corpo. Duas rodadas de revisão dos agentes `seguranca` e `revisor-backend`; achados bloqueantes corrigidos, pendências conhecidas em `docs/02` (seção "Pendências conhecidas").
  - Rodar: preview **`ero-api`** ou `ero-api/run-dev.cmd`. Swagger em `/swagger-ui.html`. Superadmin de dev em `ero-api/.env`.
- **Fatia 1 do front definitivo** (branch `timeero/front-fatia-1`):
  - ero-api: aparência por contratante (migration 008: tema, destaque, fundo, vidro, foco, animações, cena exclusiva), `GET /api/tenants/fundos` e `PUT /api/tenants/{id}/configuracao` (superadmin), logs com filtros e retenção de 12 meses, `PATCH /api/sessoes/encerrar-outras`, status do 2FA no `/eu`. Regra inviolável: entidade nunca sai da API (ArchUnit). 92 testes verdes.
  - `ero-web/`: base do front definitivo (Vite, React 19, React Router 7, TanStack Query), tokens e componentes glass com contraste AA nos dois temas, `AparenciaProvider` (sistema → contratante → prévia), cenas com shader, fundos vivos, troca de tema em vídeo ligada à aparência e coreografia de montar e desmontar em blocos (`motion/coreografia`). Catálogo e demonstração em `/design-system` (só dev).
  - `docs/06-fundos-de-cena.md`: passo a passo para cena nova e cena exclusiva.
  - Decisões do dono: aparência fixa por contratante (sem preferência do usuário; o botão de tema saiu da barra), só o superadmin configura, login sempre com a aparência padrão do sistema.
- **Protótipo** em `prototipo/` (congelado; detalhes no `prototipo/README.md`):
  - login com esfera de partículas;
  - dashboard com números que contam, gráficos que se desenham, medidor, rosca e ranking;
  - funil kanban com arrastar e soltar, modal de detalhe e formulário de novo negócio com validação;
  - agenda dia/semana/mês com linha do horário atual e gaveta de detalhes;
  - clientes, filiais e produtos usando o mesmo componente de cadastro;
  - ficha do cliente com transição em profundidade e abas;
  - página Design system (catálogo) e página Aparência (troca tema, destaque, fundo, vidro e animação ao vivo);
  - busca global com Ctrl + K e troca de tema com revelação circular;
  - fundo **Escritório** (Aparência → Fundo): no claro a janela amanhece e as luminárias acendem uma a uma; no escuro apagam. Usa o par dia/noite gerado no Gemini; prompts e passos em `design/CENA-ESCRITORIO.md`.

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
4. ~~Começar o backend~~ **Feito** (fundação, segurança, login, usuários e permissões).
5. ~~Base do front definitivo~~ **Feito na fatia 1.** **Fatia 2:** as telas do `PLANO-FATIA-2.md` (login com 2FA e sessão em memória, casca com menu por permissão, Início, Contratantes, Configuração do contratante, Usuários, Logs e Minha conta), mais as pendências da seção 5 desse arquivo. Começar com `/timeero Fatia 2: telas do PLANO-FATIA-2.md`.
6. **Definir as regras do papel ADMIN** (hoje recebe tudo do contratante; ver `docs/04-permissoes.md`).
7. **Primeiros módulos de negócio pelo `/timeero`:** cadastro de pessoas/clientes, empresas/filiais, produtos, funil de negócios e agenda.
8. **Deploy:** decidir entre banco compartilhado e container por contratante, e pedir ao `operador-deploy` o compose de produção com HTTPS e backup.
