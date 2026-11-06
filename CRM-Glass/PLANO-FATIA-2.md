# Plano APROVADO — fatia 2: telas do front definitivo (login + casca + Minha conta + módulo administrativo)

> **Como usar este arquivo.** Este plano foi aprovado pelo dono em 06/11/2026 para a fatia 1, que acabou dividida em duas:
> - **Fatia 1 (entregue na branch `timeero/front-fatia-1`):** todo o backend da seção 1, a base do `ero-web/` (tokens, componentes glass, AparenciaProvider) e todo o movimento (cenas, troca de tema em vídeo, coreografia em blocos, `docs/06`).
> - **Fatia 2 (o que falta):** as telas e a sessão da seção 2 — login, sessão em memória, guardas, menu, casca, Início, Contratantes, Configuração do contratante, Usuários, Logs e Minha conta — e o QA com os critérios da seção 4.
>
> A seção 1 (backend) fica como referência do contrato já implementado. Para a API de movimento que as telas usam (`Tela`, `Bloco`, `RotaAnimada`, `TrocaDeArea`, `TrocaEtapa`, `coreografias`, `trocarTema`), veja `ero-web/src/motion/` e o modelo completo em `ero-web/src/design-system/catalogo/DemoMovimento.tsx`. Os componentes estão no catálogo `/design-system` (só em dev).
> Para começar: `/timeero Fatia 2: telas do PLANO-FATIA-2.md`.

Projeto: `CRM-Glass/` (repo git na pasta pai EroErp).
Escopo: login, casca do app, Minha conta e módulo administrativo (Logs, Contratantes, Usuários, Configuração do contratante). As telas de negócio do protótipo (dashboard de vendas, funil, negociações, agenda, cadastros de pessoas/produtos) ficam FORA.

## 0. Decisões do dono (valem por cima de qualquer coisa abaixo)

- **P1 — Pasta:** front definitivo em `CRM-Glass/ero-web/`. O `prototipo/` fica congelado (não mexer) como laboratório e referência de movimento.
- **P2 — Aparência FIXA por contratante:** tema (escuro/claro), animações (completas/reduzidas), destaque, fundo, fundo animado, vidro e foco são todos do contratante e valem para todos os usuários dele. **Não há preferência do usuário**: nada de `ero:pref:*` em localStorage, nada de aba Preferências em Minha conta.
  - O **botão de tema (ThemeToggle) sai da barra superior**. A troca de tema em estilo vídeo (cena dia→noite, luminárias e janelas acendendo aos poucos, só depois a interface troca — View Transition + sceneSync, idêntica ao protótipo) passa a disparar quando a aparência aplicada muda de tema: (a) na prévia da Configuração do contratante ao trocar Escuro/Claro; (b) quando o superadmin entra/sai de um contratante com tema diferente; (c) no login → Início quando o tema do contratante difere do padrão do sistema. Ou seja: a lógica do ThemeToggle vira uma função `trocarTema(novo)` reutilizável chamada pelo AparenciaProvider.
  - `prefers-reduced-motion` do sistema continua vencendo; e animações REDUZIDAS do contratante equivalem a `useReduce() = true`.
- **P3 — Só o superadmin** muda a aparência (tela Configuração do contratante, pela lista de contratantes). Sem grupo novo.
- **P4 — A tela de login usa sempre a aparência padrão do sistema** (sem `ero:ultima-aparencia`, nada guardado no navegador sobre o contratante).
- **P5 — Logs = trilha de segurança atual** (eventos de segurança existentes) com filtros de período, categoria, usuário e, na plataforma, contratante.
- **P6 — Retenção de 12 meses** com limpeza automática diária; no mesmo job limpar sessões e refresh tokens expirados.
- **Roteador: React Router 7** (padrão "rota congelada" com `useOutlet` que já funciona no protótipo). `design/DIRECAO-VISUAL.md` seção 4 já atualizada.
- CLAUDE.md, agentes e `.claude/launch.json` já apontam para `ero-web/` (entrada `ero-web`, `npm run dev --prefix ero-web`, porta **5173**).
- Outras decisões do planejador aceitas: componentes do protótipo + Radix só onde a acessibilidade pede (Slider, Tabs, Dialog, Popover/Combobox); cena exclusiva = catálogo no código com marca `exclusiva` + vínculo no banco em `tenant.fundo_exclusivo` com índice único.

---

## 1. Backend (dev-backend) — ero-api

### 1.1 O que já existe (conferido pelo planejador)

| Assunto | Rota | Observação |
|---|---|---|
| Login | `POST /api/auth/login` (`@PermitAll`) | `AutenticacaoRespostaDto { requerDoisFatores, desafioDoisFatores, tokenAcesso, tokenExpiraEm, usuario }`. Refresh no cookie `ero_refresh` (HttpOnly, SameSite=Strict, Path=/api/auth). |
| 2FA no login | `POST /api/auth/2fa/verificar` `{desafio, codigo}` | Código do app ou de recuperação. Desafio vale 5 min. |
| Refresh | `POST /api/auth/refresh` + header `X-Ero-Refresh: 1` | Gira o cookie. Reuso em até 10 s dá 401 sem derrubar; depois derruba a sessão. |
| Logout | `POST /api/auth/logout` + header | Limpa o cookie. |
| Eu | `GET /api/auth/eu` | `UsuarioLogadoDto { id, nome, email, papel, tenantId, tenantNome, corDestaque, superadminAtuando, pendencia (NENHUMA, TROCAR_SENHA, CONFIGURAR_2FA), permissoes, telas }`. Falta status do 2FA e aparência. |
| Trocar senha | `PUT /api/auth/senha` `{senhaAtual, novaSenha}` | Derruba outras sessões e tira a pendência. |
| 2FA | `POST /api/auth/2fa/configurar` → `{segredo, uri}`; `/ativar` `{senha, codigo}` → `{codigos}`; `/desativar` `{senha, codigo}` | Desativar dá 422 se obrigatório. |
| Superadmin no contratante | `POST /api/auth/superadmin/acessar/{tenantId}` e `/superadmin/sair`; combo `GET /api/tenants/selecao` | Já existe. |
| Sessões | `GET /api/sessoes`, `PATCH /api/sessoes/{id}/encerrar` | Falta "encerrar todas as outras". |
| Contratantes | `GET/POST /api/tenants`, `GET/PUT /api/tenants/{id}`, `PATCH /{id}/inativar` e `/ativar` (SUPERADMIN); `GET /api/tenants/atual` (`ACESSO_LIBERADO`) | `cor_destaque` em `tenant` (migration 001), `@Pattern violeta|azul|laranja|esmeralda|rosa|ambar`. |
| Usuários | `GET /api/usuarios`, `/selecao`, `GET/PUT /{id}`, `POST`, `PATCH /{id}/inativar`, `/ativar`, `/desbloquear`, `/redefinir-senha`, `/redefinir-2fa` | Falta `bloqueadoAte` no `UsuarioResponseDto`. |
| Grupos | `GET /api/permissoes/catalogo`; `GET/PUT /api/permissoes/usuarios/{id}` | Existe. |
| Logs | `GET /api/auditoria/eventos?tipo=&usuarioId=&page=` (`AUDITORIA_LER`) | Só um tipo, sem período, só ids, sem filtro por contratante, sem retenção. |

### 1.2 Migration `008-add-tenant-aparencia.xml` (fim do changelog-master, author `eduardo`)

`addColumn` em `tenant`:

| Coluna | Tipo | Nulo | Padrão |
|---|---|---|---|
| `tema_padrao` | VARCHAR(10) | não | `'ESCURO'` |
| `fundo` | VARCHAR(40) | não | `'ORBS'` |
| `fundo_animado` | BOOLEAN | não | `true` |
| `vidro_desfoque` | INTEGER | não | `12` |
| `fundo_foco` | NUMERIC(3,1) | não | `3.0` |
| `animacoes` | VARCHAR(10) | não | `'COMPLETAS'` |
| `fundo_exclusivo` | VARCHAR(40) | sim | — |

Checks em `<sql>` (como na 002): `ck_tenant_tema_padrao IN ('ESCURO','CLARO')`, `ck_tenant_animacoes IN ('COMPLETAS','REDUZIDAS')`, `ck_tenant_vidro_desfoque BETWEEN 0 AND 40`, `ck_tenant_fundo_foco BETWEEN 0 AND 10`. `fundo`/`fundo_exclusivo` sem CHECK (catálogo cresce). Índice único `uk_tenant_fundo_exclusivo (fundo_exclusivo)`.
Limites vêm do protótipo: vidro 0–40 padrão 12; foco 0–10 passo 0,5 padrão 3; 6 destaques; 9 fundos.

### 1.3 Enums (módulo `tenant` ganha `enums/`)
- `TemaInterface` ESCURO, CLARO · `NivelAnimacao` COMPLETAS, REDUZIDAS · `TipoFundo` VIVO, CENA.
- `Fundo`: ORBS, AURORA, ONDAS, MINIMO (VIVO); ESCRITORIO, CIDADE, MARINA, EXPEDIENTE, COWORKING (CENA). Campos `rotulo`, `tipo`, `boolean exclusiva` (todos false hoje), método `exclusiva()`. Código = `name()`; o front mapeia para o id minúsculo de `cenas.ts`.
- `Tenant` continua `BaseEntity` (raiz do multi-tenant). Campos novos: `temaPadrao=ESCURO`, `fundo=ORBS`, `fundoAnimado=true`, `vidroDesfoque=12`, `BigDecimal fundoFoco=3.0` (precision 3, scale 1), `animacoes=COMPLETAS`, `Fundo fundoExclusivo`. `corDestaque` continua String.

### 1.4 DTOs
- `tenant/dtos/AparenciaDto` (entrada aninhada e saída, com `@Schema`): `corDestaque` (`@NotBlank @Pattern`), `temaPadrao` `@NotNull`, `fundo` `@NotNull`, `fundoAnimado` `@NotNull`, `vidroDesfoque` `@NotNull @Min(0) @Max(40)` ("Intensidade do vidro vai de 0 a 40"), `fundoFoco` `@NotNull @DecimalMin("0.0") @DecimalMax("10.0") @Digits(integer=2, fraction=1)`, `animacoes` `@NotNull`.
- `TenantCreateDto`: sai `corDestaque`; entra `@Valid AparenciaDto aparencia` opcional (null = padrão).
- `TenantUpdateDto` (só cadastrais): sai `corDestaque`. Fica `nome, documento, email, exige2fa, version`.
- `TenantConfiguracaoUpdateDto` (novo): `@NotNull @Valid AparenciaDto aparencia`, `Fundo fundoExclusivo` (nulo ok), `@NotNull Long version`.
- `TenantResponseDto`: sai `corDestaque`; entram `AparenciaDto aparencia` e `Fundo fundoExclusivo`.
- `TenantAtualDto`: `(UUID id, String nome, boolean exige2fa, AparenciaDto aparencia)`.
- `FundoCatalogoDto` (novo): `(Fundo codigo, String rotulo, TipoFundo tipo, boolean exclusiva)`.
- `auth/dtos/UsuarioLogadoDto`: troca `corDestaque` por `AparenciaDto aparencia`; acrescenta `boolean doisFatoresAtivo` e `boolean doisFatoresObrigatorio`. A aparência vem no `/eu` e em toda resposta de login, refresh, acessar e sair (usuário com pendência leva 403 em `/api/tenants/atual`, mas recebe a aparência pelo `/eu`).
- `usuario/dtos/UsuarioResponseDto`: + `Instant bloqueadoAte`.
- `auditoria/dtos/EventoSegurancaResponseDto`: + `usuarioNome`, `autorNome`, `tenantNome` (este só na visão de plataforma).
- Mudança de contrato segura (sem consumidor ainda). Ajustar testes: `IntegracaoTest.java:146`, `TenantIntegracaoTest.java:61, 74, 109`.

### 1.5 Mapper
- `TenantMapper`: `toAparenciaDto(Tenant)`, `aparenciaPadrao()`, `aplicarAparencia(Tenant, AparenciaDto)`; `toEntity` usa padrão quando `aparencia` nulo; `atualizarEntidade` deixa de mexer na cor; `toFundoCatalogoDto(Fundo)`.
- `AuthMapper.toUsuarioLogadoDto` chama `TenantMapper.toAparenciaDto(tenantAtuacao)` e lê os dois campos de 2FA de `UsuarioAutenticado`.
- `EventoSegurancaMapper.toResponseDto(e, Map<UUID,String> nomesUsuarios, Map<UUID,String> nomesTenants)`.
- `UsuarioMapper.toResponseDto` inclui `bloqueadoAte`.

### 1.6 Repository
- `TenantRepository`: `buscarFundosExclusivosEmUso(UUID ignorarId)`; `existeFundoExclusivo(Fundo, UUID ignorarId)`; `buscarNomesPorIds(Collection<UUID>)` → `TenantSelectDto`.
- `UsuarioRepository.buscarNomesPorIds(Collection<UUID>)` → `UsuarioSelectDto`.
- `EventoSegurancaRepository`: `buscarDoTenant(tenantId, Collection<TipoEventoSeguranca> tipos, UUID usuarioId, Instant de, Instant ate, Pageable)` com `e.tipo IN :tipos AND (:usuarioId IS NULL OR e.usuarioId = :usuarioId) AND e.createdAt >= :de AND e.createdAt < :ate`; `buscarDeTodos(UUID tenantId opcional, ...)` com `(:tenantId IS NULL OR e.tenantId = :tenantId)`. `de`/`ate` nunca nulos e `tipos` nunca vazio (service preenche). Retenção: `apagarAnterioresA(Instant limite)` `@Modifying` JPQL DELETE.

### 1.7 Service
- `TenantService.criar`: + `validarFundos(t, null)`. `atualizar`: só cadastrais.
- `TenantService.configurar(UUID id, TenantConfiguracaoUpdateDto)`: `exigirVisaoPlataforma()`, `buscarContratante(id)` (barra a Plataforma), `version` → 409, `aplicarAparencia`, `setFundoExclusivo`, `validarFundos(t, t.getId())`, `saveAndFlush`, `cache.invalidarTudo()`, evento `TENANT_ALTERADO` detalhe "configuração".
- `validarFundos`: exclusivo não-exclusiva → 422 "Esta cena não é exclusiva."; exclusivo já de outro → 409 "Esta cena exclusiva já pertence a outro contratante." (DataIntegrityViolation também vira 409); `fundo.exclusiva()` e `fundo != fundoExclusivo` → 422 "Este fundo não está disponível para este contratante."
- `listarFundos(UUID tenantId opcional)`: públicos + exclusivos livres + o exclusivo do próprio tenant.
- `atual()` devolve `aparencia`. `buscarNomes(Collection<UUID>)` → Map.
- `UsuarioService.buscarNomes(Collection<UUID>)` → Map.
- `auditoria/service/ConsultaEventoService` (novo, evita ciclo): `listar(tipos, usuarioId, tenantId, de, ate, Pageable)`; padrão `ate=agora`, `de=ate−7d`; 422 "Período inválido." se `de>=ate`; 422 "Escolha um período de até 1 ano." se >366 dias; `tipos` vazio = todos; ordena `createdAt DESC`; ROOT → `buscarDeTodos(tenantId,...)`; fora da ROOT **ignora o tenantId recebido** e usa o logado; nomes resolvidos uma vez por página (sem N+1); autor superadmin visto de dentro do contratante → `autorNome = null` (front mostra "Suporte da plataforma"). `EventoSegurancaService` fica só com `registrar`/`registrarIndependente`.
- **Retenção (P6 = 12 meses):** `auditoria/service/RetencaoEventoService` com `@Scheduled(cron = "${app.auditoria.retencao-cron:0 30 3 * * *}")` apagando eventos anteriores a `agora − app.auditoria.retencao` (padrão `P365D`); `@EnableScheduling` em `compartilhado/config` se ainda não houver. No mesmo job limpar `refresh_token` e `sessao_usuario` expirados (pendência de docs/02).
- `SessaoService.encerrarOutras()`: `revogarTodasDoUsuario(eu.usuarioId(), ENCERRADA_PELO_USUARIO, eu.sessaoId())` + evento `SESSAO_ENCERRADA` detalhe "todas as outras".
- `seguranca/UsuarioAutenticado` + `doisFatoresAtivo` (`usuario.isTotpAtivo()`) e `doisFatoresObrigatorio` (`tenantDoUsuario.isExige2fa() || (superadmin && superadminExige2fa)`), preenchidos em `AutorizacaoService.montar` (vêm do cache, sem consulta extra no `/eu`).

### 1.8 Controller

| Método | Rota | Authority | Situação |
|---|---|---|---|
| GET | `/api/auth/eu` | `isAuthenticated()` | resposta muda |
| GET | `/api/tenants/atual` | `ACESSO_LIBERADO` | resposta muda |
| GET | `/api/tenants/fundos?tenantId=` | `hasRole('SUPERADMIN')` | novo |
| POST | `/api/tenants` | SUPERADMIN | corpo muda |
| PUT | `/api/tenants/{id}` | SUPERADMIN | corpo muda (sem cor) |
| PUT | `/api/tenants/{id}/configuracao` | SUPERADMIN | novo |
| PATCH | `/api/sessoes/encerrar-outras` | `ACESSO_LIBERADO` | novo, 204 |
| GET | `/api/auditoria/eventos?tipos=&usuarioId=&tenantId=&de=&ate=&page=&size=` | `AUDITORIA_LER` | parâmetros novos; `tenantId` só na plataforma |
| GET | `/api/usuarios`, `/{id}` | `USUARIOS_LER` | + `bloqueadoAte` |

### 1.9 Permissões
Nenhum grupo novo. Contratantes e Configuração ficam com `hasRole('SUPERADMIN')` (grupo daria a todo ADMIN = escalada). `docs/04-permissoes.md` ganha seção sobre telas sem grupo e por quê. Atualizar `docs/03` com os contratos novos.

### 1.10 Testes
- Novo `tenant/TenantAparenciaIntegracaoTest`: feliz (criar sem aparência → padrão; criar com CLARO/azul/MARINA/20/4.5/REDUZIDAS → GET igual; `PUT configuracao` reflete no `/eu` e `/api/tenants/atual` do admin); validação (vidro 41/−1, foco 10.5/3.25 → 400 com `erros[].campo` `aparencia.vidroDesfoque`/`aparencia.fundoFoco`; `temaPadrao` nulo; `fundo` "PRAIA" → 400); isolamento (A MARINA/azul e B CIDADE/rosa, cada admin vê a sua; admin de A em `GET /api/tenants/{B}` → 403; superadmin acessar A → aparência A, B → B, sair → Plataforma); papel (ADMIN 403 em configuracao e fundos; USUARIO sem grupos 200 em atual; pendência TROCAR_SENHA 403 em atual e 200 em `/eu` com aparência); regras (version antiga 409; superadmin dentro de contratante 422 em configurar; fundoExclusivo=ESCRITORIO 422).
- `SessaoIntegracaoTest.encerrarOutrasMantemAAtual`, `AuthIntegracaoTest` (campos de 2FA), `AuditoriaIntegracaoTest` (feliz com nomes, validação de período, isolamento com tenantId forjado, par LER, superadmin com filtro e tenantNome, retenção), `UsuarioIntegracaoTest` (`bloqueadoAte` após 5 senhas erradas e nulo após desbloquear).
- `./mvnw verify` verde (ArchUnit incluso; precisa do Docker).

---

## 2. Front — `ero-web/`

### 2.1 Stack e porte
Vite, React 19, TypeScript, Tailwind 4, motion 12 (`motion/react`), React Router 7 (modo data), TanStack Query 5, React Hook Form + Zod, lucide-react, Radix (slider, tabs, dialog, popover), `qrcode` (QR gerado no navegador), Vitest. Porta **5173** (já no CORS de dev). Proxy do Vite `/api` → `http://localhost:8080` (cookie `Path=/api/auth`).

Copiado **sem reescrever** do `prototipo/src` (só caminhos de import mudam): `styles/tokens.css`, `styles/index.css`, `motion/tokens.ts`, `motion/CountUp.tsx`, `SceneShader.ts`, `SceneBackground.tsx`, `cenas.ts`, `sceneSync.ts`, `LiveBackground.tsx`, `ParticleSphere.tsx`, a lógica do `ThemeToggle` (de `Topbar.tsx`, agora como função `trocarTema`), `components/ui/*` (Glass, Button, Bits, Overlays, Toast), `public/cenas/**`, `scripts/cena-*.py`.
`theme/settings.tsx` vira `shared/aparencia/AparenciaProvider.tsx` mantendo a interface `useSettings()`/`useReduce()` para SceneBackground e LiveBackground funcionarem sem mudança. Rota `/design-system` só em `import.meta.env.DEV`.

### 2.2 Pastas (`ero-web/src`)
```
main.tsx
app/        rotas.tsx · Raiz.tsx (fundo vivo + AnimatePresence login↔casca) · Casca.tsx · menu.ts (registro de telas) · guardas.tsx
shared/api/        http.ts · erros.ts (ErroApi, aplicarErros(setError), toastDoErro) · tipos.ts (PaginaDto, ProblemDetail, UsuarioLogado, Aparencia)
shared/sessao/     sessao.ts · SessaoProvider.tsx · voltar.ts
shared/aparencia/  AparenciaProvider.tsx · mapear.ts
shared/util/       formatos.ts (datas pt-BR, "há 5 min") · agente.ts (user agent → "Chrome no Windows")
design-system/ui/     componentes [glass-design-system]
design-system/shell/  Sidebar, MobileNav, Topbar, AvisoSuperadmin, MenuUsuario, SeletorContratante, CommandPalette
motion/            tokens.ts, CountUp.tsx, coreografia/{Tela.tsx, RotaAnimada.tsx}, cena/{SceneShader, SceneBackground, cenas, sceneSync, trocarTema, LiveBackground, ParticleSphere} [motion-designer]
modules/auth/      pages/Login.tsx · components/{EtapaCredenciais, EtapaCodigo, EtapaTrocarSenha, AssistenteDoisFatores, CodigosRecuperacao} · api · schemas
modules/inicio/    pages/Inicio.tsx · api/indicadores.ts
modules/conta/     pages/MinhaConta.tsx · components/{AbaSenha, AbaDoisFatores, AbaSessoes} · api · schemas
modules/admin/     pages/{Contratantes, ContratanteForm, ContratanteConfiguracao, Usuarios, UsuarioFicha, UsuarioNovo, Logs} · components/{EditorAcesso, FiltrosLog, LinhaEvento} · api/{tenants, usuarios, permissoes, auditoria} · schemas
modules/erros/     NaoEncontrado.tsx · SemAcesso.tsx
```

### 2.3 Sessão (`shared/sessao/sessao.ts`)
- Token só numa variável do módulo; **nunca** localStorage/sessionStorage.
- `renovar()` com execução única: Promise compartilhada (cobre StrictMode) + `navigator.locks.request('ero-refresh', …)` entre abas; `fetch('/api/auth/refresh', {method:'POST', credentials:'include', headers:{'X-Ero-Refresh':'1'}})`.
- Ao abrir a página: `renovar()`; sucesso → token + usuário; falha → anônimo.
- Renovação agendada em `tokenExpiraEm − 60 s` + reativa (401 numa chamada comum renova uma vez e repete).
- Falha na renovação: limpa estado, `queryClient.clear()`, navega para `/login?voltar=<rota atual>`.
- `voltar.ts`: só caminho interno (começa com `/`, não `//`, não `/login`).
- Logout: `POST /api/auth/logout` com o header, limpa tudo, `BroadcastChannel('ero-sessao')` `{tipo:'saiu'}` → outras abas vão ao login.
- Mudança de contexto: toda resposta com `usuario` (login, refresh, acessar, sair) compara `tenantId`; se mudou → `queryClient.clear()`, aplica nova aparência (com troca de tema em vídeo se o tema mudou), navega para `/` com a coreografia `contexto` e avisa as outras abas.

### 2.4 Aparência (`AparenciaProvider`) — conforme P2 e P4
- Camadas: padrão do sistema → contratante (`usuario.aparencia`) → prévia (temporária, tela de Configuração). **Sem camada do usuário.**
- Antes do login (tela de login): sempre o padrão do sistema. Nada sobre o contratante é guardado no navegador.
- `prefers-reduced-motion` sempre vence; `animacoes = REDUZIDAS` do contratante → `useReduce()` true.
- Aplica `data-theme`, `data-accent`, `--blur`, `--scene-blur`, `data-vidro` como o protótipo.
- `mapear.ts`: lista branca e limites (enum → id, números presos a 0–40 e 0–10). Nada da API vai cru para o CSS.
- **Quando o tema aplicado muda** (prévia, acessar/sair contratante, login→Início), a troca passa por `trocarTema()` = mesmo fluxo do ThemeToggle do protótipo (View Transition + sceneSync: cena dia→noite, luzes acendendo aos poucos, depois a interface). Sem cena (fundo vivo), usa a View Transition do protótipo.
- No refresh periódico a aparência só atualiza o cache e vale na próxima abertura (não troca o fundo no meio do uso).

### 2.5 Coreografia (montar e desmontar em blocos)
- Tokens novos em `motion/tokens.ts`: `montagem = { entrada, saida, passo, passoSaida, limiteBlocos, reduzida }`; variantes `tela` (só orquestra; saída `when:'afterChildren'`, `staggerDirection:-1`), `bloco` (opacidade, `y`, `scale` no próprio cartão; **sem `filter` em elemento com `backdrop-filter`**), `blocoReduzido` (só fade); `coreografias = { login, inicio, padrao, formulario, etapa, contexto }` com variantes, ordem e `modo` (`'wait'` hoje; `'sync'` previsto para morph com `layoutId`).
- Cada tela declara a sua: `<Tela coreografia="inicio">…</Tela>`; `Tela` lê `useReduce()`.
- Blocos são os próprios componentes: `GlassCard`, `PageHeader`, `CampoForm`, `Tabela` (primeiras N linhas), `BarraAcoes` já trazem `variants={bloco}`; `bloco={false}` para ficar fora. Após `limiteBlocos` o resto aparece junto; nada desliga `pointer-events`.
- `RotaAnimada` (na casca): `AnimatePresence mode="wait" custom={direção}` com chave `pathname`; filho guarda o `useOutlet()` com que nasceu ("rota congelada"); direção por profundidade como o `AnimatedRoutes` do protótipo.
- `Raiz`: mesmo esquema um nível acima, entre área login e área casca, com o fundo fixo por baixo.
- Login → Início: API responde → navega para `voltar` ou `/` → login se desmonta em blocos (campos de baixo para cima, título, chips; esfera de partículas encolhe e some) → aparência do contratante aplicada (se o tema muda, a troca em vídeo roda aqui) → casca monta: menu lateral, barra superior, blocos do Início.
- Movimento reduzido: fade ~150 ms, sem cascata, sem CountUp; cena usa `duracaoReduzida`.

### 2.6 Telas
**`/login`** (coreografia `login`): esfera de partículas à esquerda, cartão de vidro à direita; etapas trocam com coreografia `etapa`. Aparência padrão do sistema.
- Credenciais: E-mail (`autocomplete=username`), Senha (`InputSenha`, `current-password`), Entrar. Sem Google/Microsoft, "Manter conectado" e "Esqueci a senha"; no lugar, a dica "Esqueceu? Fale com o administrador".
- Código 2FA (`requerDoisFatores`): `OtpInput` 6 dígitos (`one-time-code`, aceita colar), link "Usar código de recuperação" (campo texto), Verificar/Voltar. Desafio expirado (401) → volta às credenciais com alerta.
- Trocar senha (TROCAR_SENHA): Nova senha (dicas: 12+ caracteres, sem nome nem e-mail), Confirmar; senha atual reaproveitada da etapa 1 só em memória; se veio de refresh, pede Senha atual. Depois chama `/eu`.
- Configurar 2FA (CONFIGURAR_2FA): `AssistenteDoisFatores` — QR local + segredo copiável → Senha e Código → `CodigosRecuperacao` (Copiar, Baixar .txt, "Guardei em lugar seguro") → Continuar.

**`/` Início** (painel administrativo, coreografia `inicio`): saudação (nome, contratante, data); KPIs com CountUp conforme permissão — Contratantes ativos (`/api/tenants?ativo=true&size=1`, superadmin na plataforma), Usuários ativos (`/api/usuarios?ativo=true&size=1`, USUARIOS_LER), Eventos 24 h e Falhas de login 24 h (`/api/auditoria/eventos?de=…&size=1`, `tipos=LOGIN_FALHA`, AUDITORIA_LER), situação do 2FA (badge); atividade recente (6 últimos eventos); atalhos das telas liberadas; sem grupos → saudação, atalho Minha conta e "Peça acesso ao administrador".

**`/admin/contratantes`**: PageHeader + "Novo contratante"; busca (nome/documento) e Segmented Ativos/Inativos/Todos; Tabela: Nome, Documento (máscara), E-mail, 2FA obrigatório, Situação, Criado em; paginação; ações: Editar, Configurar aparência, Acessar (coreografia `contexto`), Inativar/Ativar.

**`/admin/contratantes/novo` e `/:id`** (`Etapas`): 1 Dados (Nome, Documento, E-mail, Exigir 2FA); 2 Administrador, só na criação (Nome, E-mail, Senha temporária com "Gerar" via `crypto.getRandomValues` e Copiar); 3 Aparência, opcional na criação (`EditorAparencia`). Edição: só etapa 1 com `version`; 409 → toast "Recarregar".

**`/admin/contratantes/:id/configuracao`**: `EditorAparencia` na ordem: Tema padrão (cartões Escuro/Claro — ao trocar, roda a troca em vídeo na prévia), Cor de destaque (6), Fundo (grade de miniaturas de `GET /api/tenants/fundos?tenantId=`), Fundo animado, Intensidade do vidro (Slider 0–40), Foco do fundo (Slider 0–10 passo 0,5, só CENA), Animações (Segmented). Cena exclusiva (Select com as livres; escondido sem nenhuma no catálogo). **Prévia ao vivo na interface inteira** (`definirPrevia`), selo fixo "Prévia de <Contratante>"; desfeita ao sair, cancelar ou salvar.

**`/admin/usuarios`**: "Novo usuário" só com `USUARIOS_ESCREVER`; busca e Ativos/Inativos/Todos; Tabela: Avatar+Nome, E-mail, Papel (Badge), Situação (Ativo, Inativo, "Bloqueado até 14:32", "Troca de senha pendente"), 2FA, Último acesso (relativo).

**`/admin/usuarios/novo`**: Nome, E-mail, Papel (Segmented USUARIO/ADMIN; ADMIN só se eu for ADMIN/SUPERADMIN), Senha temporária (Gerar). Depois vai para a ficha na aba Acesso.

**`/admin/usuarios/:id`** (`Tabs`): Dados (Nome, E-mail, Papel, `version`); Acesso (por grupo do catálogo: Segmented Sem acesso/Ler/Escrever + ações em checkbox; `PUT /api/permissoes/usuarios/{id}` com `version`; escondido para ADMIN/SUPERADMIN — "tem acesso a tudo" — e para mim mesmo; só com `USUARIOS_LIBERAR_ACESSO`); Segurança (só se eu for ADMIN/SUPERADMIN e o alvo não for eu: Redefinir senha (modal com senha gerada), Redefinir 2FA (ConfirmDialog), Desbloquear (só se `bloqueadoAte` no futuro), Inativar/Reativar com `USUARIOS_ESCREVER`); Atividade (`/api/auditoria/eventos?usuarioId=` se AUDITORIA_LER).

**`/admin/logs`**: filtros Período (24 h, 7 dias, 30 dias, personalizado), Categoria (chips Acessos, Senha e 2FA, Usuários e permissões, Contratantes → `tipos`), Usuário (Combobox com `/api/usuarios/selecao`), Contratante (só superadmin na plataforma). Tabela: Quando, Evento (rótulo pt-BR + Badge de tom: falha=perigo, bloqueio=alerta), Usuário afetado, Autor (ou "Suporte da plataforma"), Contratante (só plataforma), IP, Navegador (resumido), Detalhe. Paginação de 50. Rótulos dos tipos em `modules/admin/api/auditoria.ts` com código como fallback.

**`/minha-conta`** (`Tabs`; também no menu do avatar): Senha (atual, nova, confirmar; toast "Senha alterada. As outras sessões foram encerradas."); Verificação em duas etapas (status de `doisFatoresAtivo`; Ligar abre `AssistenteDoisFatores`; Desligar = modal Senha+Código, escondido se `doisFatoresObrigatorio`); Sessões (cartões com dispositivo, IP, iniciada em, último uso, badge "Este navegador"; Encerrar em cada uma menos a atual; "Encerrar todas as outras" com ConfirmDialog). **Sem aba Preferências.**

**Casca**: Sidebar a partir de `menu.ts`, filtrada por `eu.telas`, papel e escopo (`'plataforma' | 'contratante' | 'ambos'`), indicador `layoutId` mantido, Sair embaixo. Topbar: chip do contratante (superadmin abre `SeletorContratante`), título animado, busca Ctrl+K entre telas liberadas, relógio, `MenuUsuario` (Minha conta, Sair). **Sem ThemeToggle**, sem "Novo" e sem sino. `AvisoSuperadmin` fixo enquanto `superadminAtuando`: "Você está dentro de <Contratante> como superadmin" + "Sair do contratante" (`/superadmin/sair`, coreografia `contexto`).

Quem vê cada tela:

| Tela | Superadmin na plataforma | Superadmin dentro do contratante | ADMIN | USUARIO |
|---|---|---|---|---|
| Início | sim (painel da plataforma) | sim (painel do contratante) | sim | sim (blocos por permissão) |
| Contratantes / Configuração | sim | não | não | não |
| Usuários | não (precisa entrar no contratante) | sim | sim | com USUARIOS_LER/_ESCREVER; acesso com USUARIOS_LIBERAR_ACESSO |
| Logs | sim (todos, filtro por contratante) | sim (do contratante) | sim | com AUDITORIA_LER |
| Minha conta | sim | sim | sim | sim |

Guardas: sem sessão → `/login?voltar=`; com pendência → `/login` na etapa da pendência; sem a tela → `SemAcesso` (sem redirecionar); plataforma → só superadmin com `!superadminAtuando`.

Erros (ProblemDetail): 400 com `erros[]` → `setError` no campo (inclusive aninhados `aparencia.vidroDesfoque`, `administrador.email`); 422 → alerta no formulário; 409 → toast com "Recarregar"; 403 → toast "Você não tem permissão para isso."; 429 → toast com `Retry-After`; 500 → toast genérico "Código para o suporte: <correlationId>"; 401 no login → "E-mail ou senha inválidos.".

### 2.7 O que falta criar
**glass-design-system:** criar o `ero-web` (Vite, Tailwind, proxy, tokens, componentes portados) e depois: `Slider` (Radix), `OtpInput`, `QrCode` (placa clara, legível nos dois temas), `InputSenha`, `Etapas` (indicador `layoutId`), `Tabs` (Radix, pílula deslizante), `Tabela` (glass-solid, cabeçalho fixo, skeleton, vazio, `Paginacao`), `Combobox`, `Alerta`, `Skeleton`, `EstadoVazio`, `EstadoErro` ("Tentar de novo"), `ConfirmDialog`, `Splash`, `AvisoContexto` (`role=status`), `MenuUsuario`, `EditorAparencia` (`SeletorTema`, `SeletorDestaque`, `SeletorFundo` com miniaturas, extraídos de `Configuracoes.tsx`), `AparenciaProvider` (camadas, prévia, lista branca). Cada componente com entrada na rota `/design-system`.

**motion-designer:** portar cena, shader, sceneSync, lógica do ThemeToggle como `trocarTema()`, LiveBackground, partículas, CountUp; `montagem` e `coreografias` nos tokens; `Tela` e `RotaAnimada`; coreografias `login`, `inicio`, `contexto`, `etapa`; transição suave quando o fundo muda na troca de contexto; `Renderizador.destruir()` liberando o contexto WebGL (`WEBGL_lose_context`); medir fps de login→Início e da prévia; escrever `docs/06-fundos-de-cena.md` (passo a passo de cena nova: fotos dia/noite alinhadas em WebP, `scripts/cena-mascaras.py` canais RGBA, luminárias e janelas medidas, `vidro: 'denso'`, registrar em `cenas.ts` e em `Fundo.java` com `exclusiva`, vincular na Configuração, nome neutro para cena exclusiva (`exclusiva-01`) carregada sob demanda, licença das imagens, teste da exclusividade, referência a `design/CENA-ESCRITORIO.md`).

**frontend-modulos:** sessão, guardas, menu, casca, login, Início, Minha conta, Contratantes, Configuração, Usuários, Logs. Vitest para `sessao.ts`, `voltar.ts`, `erros.ts`.

---

## 3. Riscos
- Dados de um contratante na tela de outro → `queryClient.clear()` + comparação de `tenantId` em toda resposta de sessão + aviso entre abas; no back, filtro automático e `tenantId` dos logs ignorado fora da ROOT.
- Escalada de privilégio → nada de grupo para Contratantes/Configuração; aba Acesso some para mim mesmo; opção ADMIN só para ADMIN/SUPERADMIN; quem barra é a API.
- Refresh em várias abas → Web Locks + execução única.
- XSS → token em memória; nada de `dangerouslySetInnerHTML`; QR local; códigos de recuperação nunca guardados.
- Redirecionamento aberto → sanitização de `voltar`.
- N+1 → nomes dos logs por página; KPIs com `size=1`.
- Concorrência → `version` + 409; índice único em `fundo_exclusivo`.
- LGPD → IP/user agent só nas próprias sessões e na trilha para quem tem AUDITORIA; e-mail mascarado no detalhe; retenção 12 meses; localStorage não guarda nada do contratante; cena exclusiva com nome neutro.
- Desempenho (WebGL + vidro + cascata) → `limiteBlocos`, sem `filter` em vidro, medição, liberar contexto WebGL.
- Dev: superadmin não exige 2FA; o QA liga o 2FA pela Minha conta.

## 4. Ordem
1. Em paralelo: dev-backend (tudo da seção 1) e glass-design-system (cria `ero-web` + componentes + AparenciaProvider).
2. motion-designer (porte de cena/motion + coreografia + docs/06), depois da base do ero-web.
3. frontend-modulos (telas, sessão, casca), com o contrato entregue pelo back.
4. Revisões em paralelo (revisor-backend, seguranca, revisor-ui), depois qa.

QA (pronto quando): superadmin liga 2FA em Minha conta, sai, entra com código e com código de recuperação; admin de dois contratantes demo "Demo Solar" e "Demo Marina" com aparências diferentes (fundo, destaque, vidro) que ficam no banco; troca de senha temporária; renovação com `--app.seguranca.token-acesso=1m`, recarregar, duas abas; logout; falha de renovação → login → volta à rota; usuário sem USUARIOS não vê Usuários no menu e cai em "Sem acesso" pela URL; acessar/sair de contratante com o aviso; logs com filtros; encerrar outras sessões; troca de tema em vídeo com cena (luzes acendendo aos poucos) na prévia e ao entrar num contratante de outro tema; login → Início desmonta/monta em blocos; movimento reduzido.

---

## 5. Pendências herdadas da fatia 1 (sugestões dos revisores, decidir na fatia 2)

**Segurança (seguranca, veredito aprovado):**
1. **Obrigatória antes da 1ª cena exclusiva:** as fotos em `ero-web/public/cenas/exclusiva-NN/` ficam públicas numa URL previsível (quem enumera descobre clientes pela fachada/marca). Servir as fotos de cena exclusiva por rota autenticada da API que confira `fundo == fundoExclusivo`, ou documentar em `docs/06` que as fotos não podem identificar o cliente; corrigir a frase de `docs/06-fundos-de-cena.md:25`.
2. IP, navegador e `autorId` do superadmin aparecem para quem tem `AUDITORIA_LER` dentro do contratante (`EventoSegurancaMapper.java:25-26`). Fora da ROOT, quando o nome não for resolvido, devolver `ip`, `userAgent` e `autorId` nulos.
3. Fonte carregada do Google em `ero-web/index.html:7-12` (IP do visitante vai a terceiros antes de consentimento; CSP precisaria liberar). Hospedar a Plus Jakarta Sans no projeto.
4. Retenção sem piso (`RetencaoEventoService.java:36, 46`): recusar valor abaixo de `P30D` na construção.
5. `pedido in CENAS_EXCLUSIVAS` (`LiveBackground.tsx:76`, `cenas.ts:181`): usar `Object.hasOwn`.

**Interface (revisor-ui, veredito aprovado):**
6. `CampoForm` reserva ~22 px sob todo campo (`reservarErro` padrão `true`): usar `reservarErro={false}` em filtros e diálogos de um campo; avaliar `mt-1` no login.
7. `RotaAnimada.tsx`/`TrocaDeArea.tsx` usam `UNSAFE_LocationContext` do React Router (fixado em 7.18.5): teste que monte `LocalCongelado` ou alerta antes de atualizar o roteador.
8. `shell/CommandPalette.tsx:91-92` anima `filter: blur(8px)` no `glass-solid`: trocar por opacidade, `y` e escala.
9. `Avatar` (`Bits.tsx:62-67`): iniciais brancas a ~2:1 em âmbar, esmeralda e laranja; usar `--accent-strong`/`--on-accent`.
10. Durações e cores literais que sobraram em `index.css` (keyframes dos fundos, tooltip `#fff`, `.accent-glow`, `.btn-shine`, `.kpi-featured`) e em `Overlays.tsx`/`Toast.tsx`: levar para `motion/tokens.ts` (via variável CSS) e `tokens.css`.
11. Revelação circular com fundo vivo a ~44 fps na GPU integrada, mesmo com o fundo pausado; conferir numa janela real com o medidor do `/design-system`.

**Backend (revisor-backend):**
12. O 409 de cena exclusiva duplicada só é testado pelo índice (JDBC); quando existir a 1ª cena exclusiva, testar pela API (passo a passo em `docs/06`).
13. O parâmetro `tipo` da auditoria virou `tipos` (o antigo é ignorado sem erro).
