# Plano APROVADO — fatia 3: Usuários, acessar contratante, menu por permissão, Minha conta e Logs

Aprovado pelo Eduardo em 14/11/2026. Branch: `timeero/fatia-3-usuarios`.
Telas de cadastro seguem o `docs/07-layout-de-telas.md` (kit `T*`, cópia dos modelos List/Form). Relatórios seguem o `docs/08`.

## 0. Decisões do dono

1. **ADMIN** faz tudo dentro do contratante: cadastra (até o limite de usuários ativos), edita, inativa/reativa, cria e promove outro ADMIN, redefine senha, desbloqueia. Nunca em si mesmo. Não vê Contratantes nem Aparência. **Regra nova:** o contratante sempre tem pelo menos um ADMIN ativo; rebaixar ou inativar o último dá 422 "O contratante precisa de pelo menos um administrador ativo." (vale também para o superadmin dentro do contratante). O docs/04 deixa de dizer "provisório".
2. **Telefone** opcional no usuário (10 ou 11 dígitos, gravado só com dígitos): cadastro, lista e Minha conta. **Minha conta edita nome e telefone**; e-mail (é o segundo fator; quem troca é o administrador), papel e contratante ficam só leitura. O nome muda na barra **na hora**.
3. **Acessar contratante** nos dois lugares: chip do contratante na barra (só superadmin) abre um seletor com busca, e ação "Acessar contratante" na grade de Contratantes (só nos ativos). Faixa fixa "Você está dentro de X como suporte da plataforma" com "Sair do contratante" (não imprime). Entrar e sair levam ao Início.
4. **Forma:** cadastro de usuário = Form com painéis empilhados (Dados do usuário, Acesso aos módulos, Segurança) e **um** Salvar. Minha conta = abas (Meus dados, Senha, Sessões), cada aba grava na sua rota. Logs = List.
5. Logs com Exportar (CSV) e Pdf (`DocumentoLista`), mesmo objeto de filtro da consulta, sem resumo agrupado. Sem filtro por IP.
6. Usuários só dentro do contratante (o superadmin acessa o contratante antes). Backend não muda nisso.

## 1. O que já existe (conferido)

- `bloqueadoAte` no `UsuarioResponseDto` (`UsuarioMapper.java:37`).
- IP/navegador/autorId do suporte ocultos dentro do contratante (flag `suporte` em `EventoSegurancaMapper` / `ConsultaEventoService`). Só conferir.
- `/api/auth/superadmin/acessar/{id}` e `/sair`; `/api/tenants/selecao` (ativos, SUPERADMIN). A `Raiz` já troca a casca pela chave `casca:${tenantId}` e `definirUsuario` limpa o cache quando a identidade muda.
- `/api/permissoes/catalogo` e `/usuarios/{id}` (GET/PUT com version), `/api/sessoes` (lista, encerrar, encerrar-outras), `/api/auth/senha`, `/api/auth/eu/tema` (aceita `null` = seguir o contratante).
- Faltam: telefone; filtros `papel` e `bloqueado`; `/selecao` com inativos; rota do perfil próprio; rótulos/categorias dos eventos; regra do último ADMIN; no kit: `TRadio`, `TCheckBox`, `TDate`, `TDBCombo`, `TModal`, `TTabs`, só leitura por painel, `SeletorContratante`; menu só tem Início.

## 2. Backend (`dev-backend`) — seguir docs/01 e o módulo `usuario`

### 2.1 Migration `012-add-usuario-telefone.xml` (fim do `changelog-master.xml`, author `eduardo`)
- `addColumn usuario`: `telefone VARCHAR(20) NULL`.
- `<sql>`: `ALTER TABLE usuario ADD CONSTRAINT ck_usuario_telefone CHECK (telefone ~ '^[0-9]{10,11}$')`. Sem índice.

### 2.2 Entidade e enums
- `Usuario`: `@Column(name="telefone", length=20) String telefone`.
- `auditoria/enums/CategoriaEvento` (novo, com `rotulo`): `ACESSOS` "Acessos", `FALHAS` "Falhas e bloqueios", `SENHA` "Senha", `USUARIOS` "Usuários e permissões", `CONTRATANTES` "Contratantes", `SUPORTE` "Suporte da plataforma".
- `TipoEventoSeguranca` ganha `(String rotulo, CategoriaEvento categoria, boolean falha)` em todos os tipos. Ex.: `LOGIN_FALHA("Falha no login", FALHAS, true)`, `CODIGO_LIMITE_ATINGIDO("Limite de códigos por hora atingido", FALHAS, true)`, `SUPERADMIN_ACESSOU_TENANT("Suporte acessou o contratante", SUPORTE, false)`. Sem migration (coluna sem CHECK).

### 2.3 DTOs
- `UsuarioCreateDto` / `UsuarioUpdateDto`: + `@Pattern(regexp="^\\d{10,11}$", message="Telefone deve ter 10 ou 11 dígitos") String telefone` (nulo ok; o front manda só dígitos).
- `UsuarioResponseDto`: + `telefone`.
- `auth/dtos/MeuPerfilResponseDto(UUID id, String nome, String email, String telefone, Papel papel, String tenantNome, TemaInterface temaPreferido, Long version)`.
- `auth/dtos/MeuPerfilUpdateDto(@NotBlank @Size(max=150) nome, telefone (mesmas validações), @NotNull Long version)` — **sem** e-mail, papel ou id.
- `auditoria/dtos/TipoEventoDto(String codigo, String rotulo, String categoria, String categoriaRotulo, boolean falha)`.

### 2.4 Mapper
- `UsuarioMapper`: telefone em `toEntity`, `atualizarEntidade`, `toResponseDto`; `normalizarTelefone` (vazio → null, só dígitos).
- `AuthMapper.toMeuPerfilDto(Usuario, String tenantNome)`; `EventoSegurancaMapper.toTipoDto(TipoEventoSeguranca)`.

### 2.5 Repository (`UsuarioRepository`)
- `buscarComFiltros(busca, ativo, Papel papel, Boolean bloqueado, Instant agora, Pageable)`: `(:papel IS NULL OR u.papel = :papel)` e `(:bloqueado IS NULL OR (:bloqueado = true AND u.bloqueadoAte > :agora) OR (:bloqueado = false AND (u.bloqueadoAte IS NULL OR u.bloqueadoAte <= :agora)))`. `CAST(:p AS string)` em String opcional.
- `buscarParaSelecao(boolean incluirInativos)`: `(:incluirInativos = true OR u.ativo = true)`, sem SUPERADMIN, `ORDER BY u.nome`.
- `contarAdminsAtivos()`: `papel = ADMIN AND ativo = true` (tenant automático).

### 2.6 Service
- `UsuarioService`: `listar(busca, ativo, papel, bloqueado, pageable)` com `Instant.now()`; `buscarParaSelecao(incluirInativos)`; telefone em criar/atualizar; `exigirOutroAdminAtivo(u)` ao rebaixar um ADMIN (atualizar) e ao inativar um ADMIN ativo (422 `RegraNegocioException`); `atualizarProprioPerfil(id, nome, telefone, version)` — version diferente → 409, `saveAndFlush`, `cache.invalidarUsuario(id)` (o nome do `/eu` vem do cache), evento `USUARIO_ALTERADO` detalhe "próprio perfil".
- `AuthService.meuPerfil()` (lê em `root()` pelo `eu.usuarioId()`; `tenantNome` do contratante do usuário, "Plataforma" para o superadmin) e `atualizarMeuPerfil(dto)` (id sempre do token).
- `ConsultaEventoService.listarTipos()`: todos os tipos na ordem do enum.

### 2.7 Controller
| Método | Rota | Authority | Situação |
|---|---|---|---|
| GET | `/api/usuarios?busca&ativo&papel&bloqueado&page&size&sort` | `USUARIOS_LER` | parâmetros novos |
| GET | `/api/usuarios/selecao?inativos=false` | `ACESSO_LIBERADO` | parâmetro novo |
| POST / PUT | `/api/usuarios`, `/{id}` | `USUARIOS_ESCREVER` | + telefone |
| GET / PUT | `/api/auth/eu/perfil` | `hasAuthority('ACESSO_LIBERADO')` | novas |
| GET | `/api/auditoria/tipos` | `AUDITORIA_LER` | nova |

Nenhum grupo novo. docs/03 e docs/04: regras do ADMIN, último administrador, `/api/auth/eu/perfil` na linha da Minha conta.

### 2.8 Testes
- `UsuarioIntegracaoTest`: telefone feliz e "123" → 400 `erros[campo=telefone]`; filtros `papel=ADMIN` e `bloqueado=true` (5 senhas erradas); `/selecao?inativos=true` traz o inativado e o padrão não; último ADMIN → 422 ao rebaixar e ao inativar; com dois ADMIN o segundo consegue.
- `auth/MeuPerfilIntegracaoTest` (novo): PUT nome+telefone → `/eu` com o nome novo **na hora**; nome vazio / 151 caracteres / telefone inválido → 400; version antiga → 409; corpo com `email`/`papel` extras não muda nada; pendência `TROCAR_SENHA` → 403; superadmin dentro de contratante altera o próprio nome e não aparece na lista do contratante.
- `AuditoriaIntegracaoTest`: `/tipos` 403 sem AUDITORIA e 200 com `AUDITORIA_LER`; `CODIGO_LIMITE_ATINGIDO` com rótulo e categoria; unidade: todo tipo tem rótulo.
- `./mvnw verify` verde (ArchUnit incluso, Docker ligado).

## 3. Front — kit (`glass-design-system`), antes das telas

| Peça | Para quê | Base |
|---|---|---|
| `TRadio` | nível por grupo (Sem acesso · Ler · Ler e escrever); tema na Minha conta | `role="radiogroup"`, setas; `opcoes[{valor, rotulo, desabilitada?, dica?}]`; horizontal por padrão |
| `TCheckBox` | ações extras (`USUARIOS_LIBERAR_ACESSO`) | caixa de marcar glass, ligada ao TForm |
| `TDate` | De · Até dos Logs | Popover, calendário pt-BR, valor `AAAA-MM-DD`, largura `data` |
| `TDBCombo` | Usuário e Contratante nos Logs | Combobox + `buscar()` + debounce + `rotuloInicial` |
| `TModal` | Redefinir senha | Dialogo existente |
| `TTabs` · `TTabPanel` | Minha conta | Tabs existente (pílula deslizante) |
| `TPanel somenteLeitura` | painel só leitura dentro de um Form editável | aplica o `SomenteLeituraDoForm` só no painel |
| `shell/SeletorContratante` | popover no chip do contratante: busca + "Voltar à plataforma" | props `opcoes`, `carregando`, `atual`, `onEscolher`, `onSair`; dados vêm da Casca |
| `AvisoContexto` | faixa do superadmin | já existe; conferir 360 px e impressão (`nao-imprime`) |

Cada peça com entrada no `/design-system` e no `kit/index.ts`; docs/07 §0 atualizado.

## 4. Front — movimento (`motion-designer`)

- `Raiz`/`TrocaDeArea`: coreografia `contexto` na troca casca → casca (tenant diferente), ver comentário em `TrocaDeArea.tsx`; a troca de tema em vídeo roda se o tema mudar.
- A faixa `AvisoContexto` entra depois da casca e sai antes dela.
- Troca de aba (`TTabs`): conteúdo entra como bloco curto.
- Movimento reduzido: só esmaecer. Tokens só em `motion/tokens.ts`.

## 5. Front — telas (`frontend-modulos`)

### 5.1 Sessão, menu e casca
- `app/menu.ts`: registro `TELAS_DO_MENU` com `usuario-list` → `/admin/usuarios` "Usuários" (`Users`, escopo `contratante`) e `auditoria-list` → `/admin/logs` "Logs" (`ScrollText`, escopo `ambos`). `menuAdministrativo(usuario)` = registro filtrado por `usuario.telas` e escopo + Contratantes se `naVisaoDePlataforma`. `menuDoUsuario` continua com Início. `TITULOS` + Usuários, Logs, Minha conta. `menu.test.ts`: USUARIO sem grupo; USUARIO com AUDITORIA; ADMIN; superadmin na plataforma (Logs + Contratantes, sem Usuários); superadmin dentro (Usuários + Logs, sem Contratantes).
- `modules/admin/components/ExigeTela.tsx` (`tela`, `escopo`): sem a tela ou fora do escopo → `<Navigate to="/" replace />`, como o `SoPlataforma`.
- `SessaoProvider`: `acessarContratante(id)` e `sairDoContratante()` → POST, `entrar(resposta)`, `navigate('/')`.
- `Casca.tsx`: chip do contratante (só SUPERADMIN) abre `SeletorContratante` (`GET /api/tenants/selecao`); `AvisoContexto` quando `superadminAtuando`; `MenuUsuario` com Minha conta; Ctrl+K com "Minha conta" e "Acessar contratante…".
- `ContratanteList`: ação de grade "Acessar contratante" (`TButton variant="secondary" icone={LogIn}`), só em ativos.
- `shared/util/agente.ts`: user agent → "Chrome no Windows" (Sessões e Logs).
- Início: o cartão "Em breve" vira "Atalhos" com os itens do menu liberados.

### 5.2 `/admin/usuarios` — cópia do List (`ContratanteList`)
- Guarda `ExigeTela tela="usuario-list" escopo="contratante"`; service `modules/admin/api/usuarios.ts`; schemas `schemas/usuario.ts`; `useSomenteLeitura('USUARIOS')`; breadcrumb `['Administrativo', 'Usuários']`.
- Filtros (um por `TRow`): `TEntry busca` "Nome ou e-mail" (`metade`); `TCombo papel` Administrador/Usuário, vazio "Todos"; `TCombo situacao` Ativos/Inativos/Bloqueados, vazio "Todas" (`paraConsulta` converte em `ativo`/`bloqueado`).
- Rodapé: Buscar · Limpar · Novo (sem só leitura) · Exportar · Pdf.
- Colunas: Nome (principal), E-mail (secundária), Telefone (formatado), Papel, Último acesso, Situação (`TBadge`: Bloqueado até HH:mm `alerta` > Inativo `erro` > Troca de senha pendente `info` > Ativo `sucesso`).
- Ações: editar; inativar/reativar (escondido na própria linha e para USUARIO numa linha de ADMIN); Desbloquear (só se eu for ADMIN/SUPERADMIN, alvo bloqueado e não sou eu). Vazio "Nenhum usuário encontrado". `DocumentoLista` com as mesmas colunas.

### 5.3 `/admin/usuarios/novo` e `/:id` — cópia do Form (`ContratanteForm`)
- Guarda `ExigeTela tela="usuario-form" escopo="contratante"`, coreografia `formulario`.
- **Painel "Dados do usuário"** (só leitura sem `USUARIOS_ESCREVER` ou se sou USUARIO e o alvo é ADMIN): Nome (required, 150, `metade`); E-mail (required, 255, `metade`; desabilitado na edição se sou USUARIO e o alvo é outro); Telefone (máscara celular); Papel (`TCombo`; Administrador só se eu for ADMIN/SUPERADMIN; desabilitado se o alvo sou eu); só na criação: Senha temporária com "Gerar" (`crypto.getRandomValues`, como no `ContratanteForm`).
- **Painel "Acesso aos módulos"**: ADMIN/SUPERADMIN → texto "Administradores acessam todos os módulos."; eu mesmo → "Você não pode alterar as próprias permissões." (só leitura); só leitura sem `USUARIOS_LIBERAR_ACESSO`. Para cada grupo do catálogo: `TRadio` Sem acesso · Ler · Ler e escrever (se sou USUARIO, opções acima do meu nível desabilitadas com dica "Você só libera o que tem") e um `TCheckBox` por ação (desabilitado com o grupo em Sem acesso). Inicial de `GET /api/permissoes/usuarios/{id}`.
- **Painel "Segurança"** (só edição, se sou ADMIN/SUPERADMIN e o alvo não sou eu): estado (bloqueado até, troca pendente, último acesso); "Redefinir senha" → `TModal` com senha + Gerar; "Desbloquear" só quando bloqueado.
- `TAuditoria`. Rodapé: Salvar · Novo · Voltar.
- Salvar: se os dados mudaram e tenho ESCREVER → POST/PUT (nova version); se o acesso mudou e tenho `LIBERAR_ACESSO` → PUT das permissões com a version nova. Se o 2º falhar, vai para `/:id` com "Dados salvos; o acesso não foi salvo: …". `TForm` só leitura apenas sem ESCREVER e sem `LIBERAR_ACESSO`. 409 → "Recarregar".

### 5.4 `/admin/logs` — cópia do List, sem Novo e sem ações
- Guarda `ExigeTela tela="auditoria-list" escopo="ambos"`; service `modules/admin/api/auditoria.ts` (`listar`, `tipos`).
- Filtros: De · Até (`TDate`, padrão hoje −6 dias até hoje; `paraConsulta` manda 00:00 local de `de` e 00:00 do dia seguinte a `ate`, em ISO UTC); Categoria (`TCombo` de `/api/auditoria/tipos`, vazio "Todas", largura `medio` → `tipos`; "Contratantes" só na plataforma); Usuário (`TDBCombo` com `/api/usuarios/selecao?inativos=true`, só dentro do contratante); Contratante (`TDBCombo` com `/api/tenants/selecao`, só na plataforma).
- Rodapé: Buscar · Limpar · Exportar · Pdf. Consulta e exportação com o **mesmo** `paraConsulta`. `size=50`.
- Colunas: Evento (principal, `TBadge` `erro` se falha, `info` se suporte, `neutro`; rótulo de `/tipos`, código de reserva); Usuário (nome / "Suporte da plataforma" / "—"); Autor (nome / "Suporte da plataforma" / "Sistema"); Contratante (só plataforma); IP; Navegador (`agente.ts`); Detalhe; Data/hora.

### 5.5 `/minha-conta` — `modules/conta/`, abas, sem guarda de tela
- **Meus dados**: Nome (required), Telefone, E-mail/Contratante/Papel só leitura, `TRadio` Tema (Seguir o contratante · Claro · Escuro; `null` = seguir). Salvar: PUT perfil com version → `PUT /eu/tema` se mudou → `atualizarEu()` (nome na barra na hora).
- **Senha**: Senha atual, Nova (ajuda "12 caracteres ou mais, sem o seu nome nem e-mail"), Confirmar. Sucesso: "Senha alterada. As outras sessões foram encerradas."; invalida `['sessoes']`.
- **Sessões**: `TDataGrid` Navegador · IP · Iniciada em · Último uso · `TBadge` "Este navegador"; Encerrar (nunca a atual); "Encerrar as outras" com `useQuestion`.
- Entrada no `MenuUsuario` e no Ctrl+K.

## 6. Riscos
- Tenant: Logs ignora `tenantId` fora da ROOT; acessar/sair limpa o cache; outra aba com token antigo é recusada e renova.
- Escalada: quem barra é a API (`PermissaoService`, `garantirPodeAlterar`); o front só esconde/desabilita; perfil próprio sem e-mail/papel/id.
- Contratante sem administrador: regra do último ADMIN.
- Concorrência: version em cadeia no Salvar; perfil próprio sobe a version (admin com a ficha aberta recebe 409).
- LGPD: telefone nunca em log nem em detalhe de evento; IP/navegador do suporte ocultos; sessões só as próprias.
- Desempenho: a faixa flutuante soma `backdrop-filter`; medir.

## 7. Ordem
1. Em paralelo: `dev-backend` (seção 2), `glass-design-system` (seção 3), `motion-designer` (seção 4).
2. `frontend-modulos` (seção 5): sessão/menu/casca → UsuarioList → UsuarioForm → Logs → Minha conta → Início.
3. Revisões em paralelo: `revisor-backend`, `seguranca`, `revisor-ui`, `guardiao-layout`; depois `qa`.
