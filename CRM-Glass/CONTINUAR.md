# Como continuar este projeto em outro computador

Guia de passagem do CRM Glass (nome provisório: **Vitrum CRM**). Última atualização: 21/11/2026.

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
| Login | Token de 15 min + refresh em cookie httpOnly com rotação; **código de 6 dígitos por e-mail em todo login, para todos** (11/11/2026; saiu o TOTP). E-mail pelo Gmail com senha de app (`ero-api/.env`) |
| Permissões | Superadmin (dono), ADMIN (regras a definir) e USUARIO com grupos de liberação LER/ESCREVER + ações extras, como no EroErp 2.0 (`docs/04`). Limite de usuários ativos por contratante, definido pelo superadmin (`docs/03`) |
| Infraestrutura | Docker (Docker Compose); imagem da API pronta (`ero-api/Dockerfile`) |
| Primeira entrega | Design system + protótipo navegável, **só visual, com dados fictícios** |

### Decisões em aberto

- **Para ver mais tarde:** hospedagem, integração com WhatsApp (Evolution API), assistente de IA, filas e demais detalhes de infraestrutura.
- **Nome e identidade:** "Vitrum" é provisório; falta escolher a cor de destaque oficial e o logotipo.
- **Biblioteca de componentes do produto final:** a proposta é shadcn/ui (Radix) reestilizado para glass. O protótipo usa componentes próprios mais simples.

### O que está pronto

- **Direção visual** em `design/DIRECAO-VISUAL.md`: análise das referências, níveis de vidro, regras de movimento, stack e módulos previstos.
- **Time de 13 agentes** em `.claude/agents/` e o comando **`/timeero <pedido>`**, que orquestra pesquisa → plano → backend → front → revisões → QA (tabela no `CLAUDE.md`).
- **Backend `ero-api`** (06/11/2026):
  - Fundação: base com auditoria e lock otimista, erros em ProblemDetail, tenant automático, CORS, cabeçalhos de segurança, limite de requisições e criptografia de campos.
  - Módulos `auth` (login, refresh com rotação, logout, troca de senha, 2FA com códigos de recuperação, superadmin "acessar contratante"), `tenant`, `usuario` (módulo-modelo), `permissao`, `sessao` e `auditoria`.
  - 7 migrations, Dockerfile e compose de dev.
  - 72 testes verdes: 21 de arquitetura (ArchUnit), integração com Postgres real (Testcontainers), TOTP e limite de corpo. Duas rodadas de revisão dos agentes `seguranca` e `revisor-backend`; achados bloqueantes corrigidos, pendências conhecidas em `docs/02` (seção "Pendências conhecidas").
  - Rodar: preview **`ero-api`** ou `ero-api/run-dev.cmd`. Swagger em `/swagger-ui.html`. Superadmin de dev em `ero-api/.env`.
- **Login real com código por e-mail + limite de usuários** (11/11/2026, na `main`, sem commit):
  - ero-api: migration 009 (tabela `codigo_verificacao`, `tenant.limite_usuarios` com padrão 5 ou os ativos para os contratantes que já existiam; saem as colunas do TOTP, `codigo_recuperacao` e `tenant.exige_2fa`). Todo login: senha certa → código de 6 dígitos por e-mail (vale 10 min do 1º envio, uso único, reenvio do mesmo código a cada 60 s, no máximo 5 envios) → sessão. `POST /api/auth/2fa/reenviar` novo; saíram `/2fa/configurar|ativar|desativar` e `PATCH /usuarios/{id}/redefinir-2fa`. `EmailService` em `compartilhado/email/` (SMTP; Gmail por padrão, Mailpit por variável).
  - Limite de usuários ativos por contratante (`limiteUsuarios` obrigatório na criação, editável; `usuariosAtivos` na resposta). Criar e reativar exigem vaga (422); inativar libera; limite abaixo do uso só trava criar e reativar.
  - 101 testes verdes (23 de arquitetura).
  - **Para o login funcionar no dev:** preencher `MAIL_USUARIO`, `MAIL_SENHA_APP` e `MAIL_REMETENTE_NOME` no `ero-api/.env` (passo a passo no `.env.example`). Sem isso o login responde 503.
- **Fatia 1 do front definitivo** (branch `timeero/front-fatia-1`):
  - ero-api: aparência por contratante (migration 008: tema, destaque, fundo, vidro, foco, animações, cena exclusiva), `GET /api/tenants/fundos` e `PUT /api/tenants/{id}/configuracao` (superadmin), logs com filtros e retenção de 12 meses, `PATCH /api/sessoes/encerrar-outras`, status do 2FA no `/eu`. Regra inviolável: entidade nunca sai da API (ArchUnit). 92 testes verdes.
  - `ero-web/`: base do front definitivo (Vite, React 19, React Router 7, TanStack Query), tokens e componentes glass com contraste AA nos dois temas, `AparenciaProvider` (sistema → contratante → prévia), cenas com shader, fundos vivos, troca de tema em vídeo ligada à aparência e coreografia de montar e desmontar em blocos (`motion/coreografia`). Catálogo e demonstração em `/design-system` (só dev).
  - `docs/06-fundos-de-cena.md`: passo a passo para cena nova e cena exclusiva.
  - Decisões do dono: a aparência é do contratante e só o superadmin a configura. O login usa sempre a aparência padrão do sistema. Ficou mudado em 14/11/2026: **cada usuário escolhe claro ou escuro**, a escolha fica salva no usuário e o botão volta à barra. Quem nunca escolheu segue o tema padrão do contratante. Fundo, destaque, vidro, animações e desempenho continuam só do contratante.
- **Menu Administrativo: Contratantes** (13 e 14/11/2026, na `main`, sem commit, pelo `/timeero`):
  - **Telas do superadmin** (só na visão de plataforma):
    - `/admin/contratantes`: lista com filtros "Nome ou documento" e Situação, Exportar CSV e Pdf;
    - `/novo`: com o administrador inicial e senha temporária;
    - `/:id`: edição com auditoria;
    - `/:id/aparencia`: prévia ao vivo, com a próxima tela montando durante a troca de tema;
    - inativar e reativar na grade.
  - **Kit `T*` (fase 0):** em `ero-web/src/design-system/kit/`, com os modelos List e Form no `/design-system`.
    - Tokens de ação AA; a ação vizinha troca de tom quando coincide com o destaque.
    - Máscara de CNPJ alfanumérico.
    - Só leitura acessível.
  - **Relatórios:** padrão do EroErp 2.0 em `docs/08-relatorios.md` e agente `relatorios`.
    - Moldura com o logo "Ero ERP", barra na cor do contratante, filtros na 1ª página e rodapé com o nome de quem gerou e "Página X de Y".
  - **Favicon:** o do Ero, repaginado em vidro violeta.
  - **Backend:**
    - `criadoPorNome` e `alteradoPorNome` no contratante e no usuário. O superadmin fica oculto para o contratante.
    - 409 de duplicidade com `erros[{campo}]`. O 409 de versão sai sem `erros`.
    - Limite de 10 códigos de login por hora (`APP_CODIGO_MAX_EMISSOES_POR_HORA`, teto 1000), com reserva da vaga dentro da trava e evento `CODIGO_LIMITE_ATINGIDO`.
    - Alerta de falhas seguidas de SMTP.
    - Retenção de logs com piso de 30 dias.
    - 140 testes verdes.
  - **Pendências antigas resolvidas:**
    - favicon, fonte local e pacote JS em partes (nenhuma acima de 500 kB);
    - contraste do Avatar, literais de cor e de duração e movimento reduzido ao vivo;
    - login automático da `olhar-telas`;
    - agente `seguranca` voltou a carregar (YAML);
    - cabeçalhos de segurança (CSP) no nginx de dev.
  - **Desempenho** (medido num i5-1334U com vídeo Intel integrado e tela de 120 Hz):
    - A troca de tela (~68 fps) e a rolagem (118 fps) cumprem a meta. O fundo vivo com vidro por cima fica em ~30–46 fps, e a revelação circular em ~29 fps.
    - O custo é a placa de vídeo refazendo o desfoque dos cartões enquanto o fundo se mexe. Com o fundo parado, a tela vai a 120 fps.
    - **Modo leve:** fica em `motion/desempenho.ts`.
      - Por padrão, todos veem o visual completo e ninguém é medido.
      - O superadmin pode ligar, na Aparência do contratante, "Otimizar desempenho em computadores mais fracos" (`aparencia.desempenhoAutomatico`, migration 010). Com isso, o app mede o aparelho e, se for fraco, pausa o fundo vivo e troca a revelação circular por esmaecimento.
      - Para testar: `?desempenho=normal|leve|auto` (fica guardado no navegador), ou o seletor e o botão "Medir agora" no `/design-system`.
    - Orbs e aurora desenhados por degradê, sem `filter: blur`. O visual ficou igual e o ganho foi pequeno, de ~2 fps.
    - Ainda não medido com a máquina livre: repetir com `scratchpad/medir-leve.mjs`, ou com a medição que o `qa` fizer.
  - **Tema por usuário (14/11/2026):**
    - O botão claro/escuro voltou à barra (`app/casca/Casca.tsx`) e há o comando "Alternar tema" no Ctrl + K.
    - A escolha fica salva no usuário: `PUT /api/auth/eu/tema`, `temaPreferido` no `/eu`, migration 011.
    - Precedência: sistema, depois contratante, depois tema do usuário, depois a prévia da Aparência.
    - Voltar a "seguir o contratante" (`null`) fica para a futura tela Minha conta.
    - A API passou a aceitar enum só pelo nome (Jackson `fail-on-numbers-for-enums`).
  - **Revisões:** revisor-backend, seguranca, revisor-ui e guardiao-layout aprovaram. O QA aprovou a bateria de ponta a ponta: isolamento entre contratantes, 403 para não superadmin e contratante inativado caindo na hora.
  - **Logins de teste:** contratantes "Teste QA …" e "Teste Contratante …" ficam no banco.
- **Cadastro de Pessoas (20/11/2026, branch `timeero/pessoas`)**, pelo `/timeero`:
  - **Localidade:** tabelas do IBGE (27 UFs, 5.571 municípios), busca de cidade e consulta de CEP pelo backend no ViaCEP (limite próprio de 30 por minuto).
  - **5 cadastros auxiliares** (tipo de cadastro, telefone, e-mail, endereço e rede social), com itens do sistema semeados por contratante e itens do contratante editáveis (menu Cadastros › Auxiliares).
  - **Módulo `pessoa`:** física e jurídica, telefones, e-mails, redes sociais, endereços, vínculos entre pessoas e cadastro rápido em modal. `cod_pessoa` sequencial por contratante, com a peça de retentativa.
  - **Telas:** Pessoas (lista, cadastro, painel Vínculos, modal rápido, Exportar e Pdf), as 5 telas auxiliares (FormList) e o submenu flutuante da casca.
  - **Testes:** 274 no backend e 422 no front.
  - **Revisões:** revisor-backend, seguranca, revisor-ui e guardiao-layout aprovaram, e o QA aprovou. Regras em `docs/negocio/pessoas.md` e `docs/negocio/cadastros-auxiliares.md`.
  - **Pendências:** seção "Pendências de Pessoas" no fim da seção 5; as de segurança também em `docs/02`.
  - A `timeero/pessoas` já foi mesclada na `main` local, **sem push**.
- **Pessoas: dados complementares (21/11/2026, branch `timeero/pessoas-complemento`):**
  - PF: RG com órgão, UF e emissão; CNH (DV conferido; categoria e validade opcionais, só com o número; vencida aceita); estado civil, profissão, nacionalidade, naturalidade, nome da mãe e do pai. PJ: data de abertura. Representante legal como vínculo (PF, vários por empresa).
  - Dois auxiliares novos, Estado civil e Profissão (7 no total), `GET /api/estados` e a máscara `cnh` no kit. Migrations 019 a 021.
  - LGPD: CNH, filiação e estado civil só na ficha, fora da lista, do Exportar e do Pdf.
  - Camadas flutuantes com opacidade e desfoque mínimos que a Aparência não baixa; combo estreito sem o X de limpar.
  - 335 testes no backend, 458 no front; revisões e QA aprovados. Push e merge são do dono. Doc: `docs/negocio/pessoas.md`.
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
5. ~~Base do front definitivo~~ **Feito na fatia 1.** **Fatia 2:** as telas do `PLANO-FATIA-2.md` (login com código por e-mail e sessão em memória, casca com menu por permissão, Início, Contratantes, Configuração do contratante, Usuários, Logs e Minha conta), mais as pendências da seção 5 desse arquivo. Começar com `/timeero Fatia 2: telas do PLANO-FATIA-2.md`.
6. ~~Definir as regras do papel ADMIN~~ **Feito em 14/11/2026:** o ADMIN faz tudo dentro do contratante, e sempre sobra pelo menos um ADMIN ativo (`docs/negocio/usuarios-e-acesso.md`).
7. **Próximo: Filiais, como no EroErp 2.0** (a pesquisa já está feita em `docs/negocio/eroerp-referencias.md`, "Pesquisa de 20/11/2026: Filiais"). A filial aponta para uma Pessoa, com matriz, tipo e cor. Antes de planejar, o dono decide duas coisas: se o usuário fica preso a uma filial e como a cor da filial convive com a regra de tokens. A migration dela será a **022**. Depois: produtos, funil de negócios e agenda. (Pessoas, cadastros auxiliares e os dados complementares de Pessoas: feitos em 20 e 21/11/2026.)
8. **Deploy:** decidir entre banco compartilhado e container por contratante, e pedir ao `operador-deploy` o compose de produção com HTTPS e backup. Checklist que o `seguranca` deixou para produção:
   - tirar o Swagger e o actuator do nginx, ou restringi-los por IP;
   - HSTS no terminador TLS, `server_tokens off` e `Permissions-Policy`;
   - incluir `deploy/dev/security-headers.conf` (CSP);
   - **nunca** levar o `APP_CODIGO_MAX_EMISSOES_POR_HORA: "1000"` do modo Mailpit;
   - avaliar nonce no lugar de `'unsafe-inline'` em `style-src`.
9. **Próxima fatia do Administrativo:** "acessar contratante" no front (faixa "Você está em X" + Sair, menus separados; o backend já existe), junto com as telas Usuários e Logs. Usuários já recebe `criadoPorNome`/`alteradoPorNome` da API, e Logs precisa do rótulo do evento `CODIGO_LIMITE_ATINGIDO`.
10. **Só quando houver a 1ª cena exclusiva:** F1 (fotos em URL pública) e F12 (teste do 409 da cena exclusiva), do `PLANO-FATIA-2.md` §5.
11. **Orçamento de desempenho:** decidir se o `qa` passa a medir fps (rolagem, troca de tela, tela parada) no build de produção em toda entrega e se reprova abaixo da meta. A proposta é 60 fps nas trocas, tela utilizável em menos de 500 ms e nenhuma tarefa acima de 50 ms. Avaliar também um fundo 3D pontual (ex.: login) com WebGL, medindo o fps.
12. **Custo do `/timeero`:** na próxima entrega só de tela, medir de novo o gasto por agente e só então decidir as otimizações do time (o kit `T*` desta entrega foi um custo único).

### Pendências de Pessoas (20/11/2026)

Achados menores das revisões e do QA, deixados para depois. Nenhum bloqueia a entrega.

**Segurança** (o texto completo está em `docs/02`, "Pendências conhecidas")
- CPF na query string de `GET /api/pessoas?documento=` vai para o `access_log` do nginx. Antes de produção: `log_format` sem `$args` no `/api/` e conferir o access log do Tomcat.
- O `SqlExceptionHelper` do Hibernate grava o CPF no ERROR da corrida de duplicidade: desligar o logger ou `logServerErrorDetail=false`. Risco maior desde 21/11: um CHECK violado da `pessoa` leva CNH e filiação ao log.
- O `resolverDeToken` do `SecurityConfig` compara a URI crua: alinhar com `RateLimitFilter.caminho()`. É consistência, não brecha.
- Link de rede social clicável: `rel="noopener noreferrer"` e conferir http(s) também na hora de mostrar.

**Backend**
- `PessoaService.buscarEntidade` é público e sem uso: deixar `private`.
- Índice GIN `pg_trgm` em `nome_busca` quando o volume justificar.
- Índice em `rg_estado_id` só se houver filtro por UF do RG.
- Renomear `NASCIMENTO_MINIMO` para `DATA_MINIMA` no `PessoaService` (já serve a emissão do RG e a validade da CNH).
- Categoria da CNH fora do enum dá 400 genérico, sem o campo.
- O PUT que muda campo da pessoa sobe a `version` em 2. É inofensivo.

**UI**
- A borda do `.input` (`--line`, 8%) fica abaixo de 3:1. Criar o token `--input-border`.
- A dica do trilho (`ComDica`, `Sidebar.tsx`) não respeita movimento reduzido.
- O combo Pessoa do vínculo (320 px) corta nome longo.
- O "×" do `TFieldList` fica sozinho numa linha a 768 e 360 px.
- O `Submenu` não consulta o modo leve.

**Dados**
- O Demo Solar tem 3 usuários ativos para um limite de 2 (já era assim).
- O QA deixou pessoas e tipos "QA ..." inativos no Solar e no Marina.



---

## Formatar o computador

**Antes:**

- Conferir que a branch de trabalho foi enviada ao GitHub: `git log --branches --not --remotes` precisa sair vazio.
- Copiar à mão, para um lugar seguro, os dois `.env`: `CRM-Glass/ero-api/.env` e `EroErp2.0/ero-erp-api/.env`. **Nunca no git.**
- Guardar o zip `backup-claude-<data>.zip` com a memória do Claude (`C:\Users\Eduardo\.claude\projects\*\memory\`), os planos (`C:\Users\Eduardo\.claude\plans\`) e o `C:\Users\Eduardo\.claude\settings.json`.
- Opcional: `pg_dump` do volume Docker `ero-api_ero_api_pg` (dados de demonstração).
- Olhar o worktree `EroErp2.0/.claude/worktrees/layout-modulos-5abfc5`, que tem 1 arquivo sem commit.

**Depois:**

- Instalar Git, JDK 25 (com `JAVA_HOME`), Node 20+, Docker Desktop, Claude Code (app desktop) e Obsidian (`winget install Obsidian.Obsidian`; abrir `CRM-Glass/docs` como cofre e criar as notas novas em `negocio`).
- Clonar o repo.
- Restaurar os `.env` nos mesmos caminhos.
- Descompactar a memória e os planos no mesmo caminho de `C:\Users\Eduardo\.claude\`.
- `npm install` em `ero-web` e em `prototipo`.
- Subir com `docker compose up --build -d` (na pasta `CRM-Glass`).

---

## Rodar tudo com Docker (dev/demonstração)

Na pasta `CRM-Glass`: sobe banco, API e front (nginx) de uma vez. Arquivos em `deploy/dev/`.

```
docker compose up --build -d     # sobe (use --build quando mudar código)
docker compose logs -f api       # acompanhar a API
docker compose down              # derruba (o banco fica no volume)
```

- App: http://localhost:5173 (o `/api` passa pelo nginx, mesma origem) | API/Swagger: http://localhost:8080/swagger-ui.html
- Segredos e superadmin vêm de `ero-api/.env`. O código do login sai pelo **Gmail** do `.env` (padrão).
- **Testar sem mandar e-mail:** `docker compose -f compose.yaml -f deploy/dev/compose.mailpit.yaml up -d` e ler os códigos em http://localhost:8025. Para voltar ao Gmail: `docker compose up -d`.
- O banco usa o volume existente `ero-api_ero_api_pg`. **Não rode junto com o `run-dev.cmd`/preview da API** (mesmo volume, mesma porta 5433). Se o container `ero-api-postgres-1` estiver de pé: `docker compose -f ero-api/compose.yaml stop`.
- Portas mudam por variável: `WEB_PORTA`, `API_PORTA`, `PG_PORTA`, `MAILPIT_PORTA`, `SMTP_PORTA`.
