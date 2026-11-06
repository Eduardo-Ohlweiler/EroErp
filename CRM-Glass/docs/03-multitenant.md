# 03 — Multi-tenant

## Modelo

Um banco e uma aplicação para todos os contratantes. Cada tabela de negócio
tem `tenant_id` e o **Hibernate filtra sozinho**:

- `TenantEntity` tem o campo `tenantId` anotado com `@TenantId`.
- No insert, o Hibernate preenche `tenant_id` com o tenant atual.
- Em toda consulta JPQL/Criteria daquela entidade, o Hibernate acrescenta `tenant_id = :atual`.
- O tenant atual vem do `TenantIdentifierResolver`, nesta ordem:
  1. tenant forçado pelo `TenantContext`;
  2. tenant do token do usuário logado;
  3. `NENHUM`, que não enxerga nenhuma linha (falha fechada).

Ninguém escreve `WHERE tenant_id = ...` em JPQL e o service nunca recebe
tenant como parâmetro.

## Tenants especiais

| Id | Nome | Uso |
|---|---|---|
| `00000000-0000-0000-0000-000000000000` | `ROOT` / Plataforma | Dono do superadmin. Sessão ROOT enxerga todos os tenants (`isRoot`). |
| `ffffffff-ffff-ffff-ffff-ffffffffffff` | `NENHUM` | Sem usuário: não casa com nada. |

## Quando o contexto ROOT é usado

Só onde ainda não se sabe o tenant, ou onde a plataforma age sobre um contratante:

- **Login, 2FA, refresh e logout** (`AuthService`): o e-mail ou o cookie ainda não dizem o tenant.
- **Montar o usuário da requisição** (`AutorizacaoService`): sempre pelo id do token assinado.
- **Operações do próprio usuário** (trocar senha, 2FA): funcionam até para o superadmin dentro de um contratante.
- **Seed do superadmin.**
- **Superadmin na visão de plataforma** (token com tenant ROOT): cria e altera contratantes e o primeiro admin, com `atribuirTenant` explícito.

`TenantContext.comoRoot(...)` precisa ser chamado **antes** de a transação abrir,
porque o Hibernate lê o tenant quando abre a sessão. Por isso esses fluxos usam
`TransactionTemplate` dentro do `comoRoot`, e não `@Transactional`.

## Superadmin

- Na visão de plataforma pode ler tudo. Escrever em dados de contratante é recusado (`SecurityUtils.exigirTenantSelecionado`).
- Para trabalhar num contratante: `POST /api/auth/superadmin/acessar/{tenantId}`. A sessão passa a ter `tenant_atuacao_id`, sai um token novo e o anterior deixa de valer. Fica registrado como `SUPERADMIN_ACESSOU_TENANT`.
- `POST /api/auth/superadmin/sair` volta para a plataforma.

## Aparência do contratante

A aparência é **do contratante** e vale para todos os usuários dele. Não existe
preferência por usuário nem nada guardado no navegador; a tela de login usa
sempre o padrão do sistema. Só o superadmin muda (tela Configuração).

Campos (`AparenciaDto`, em `tenant`):

| Campo | Tipo | Valores | Padrão |
|---|---|---|---|
| `corDestaque` | texto | `violeta`, `azul`, `laranja`, `esmeralda`, `rosa`, `ambar` | `violeta` |
| `temaPadrao` | `TemaInterface` | `ESCURO`, `CLARO` | `ESCURO` |
| `fundo` | `Fundo` | `ORBS`, `AURORA`, `ONDAS`, `MINIMO` (VIVO); `ESCRITORIO`, `CIDADE`, `MARINA`, `EXPEDIENTE`, `COWORKING` (CENA) | `ORBS` |
| `fundoAnimado` | booleano | | `true` |
| `vidroDesfoque` | inteiro | 0 a 40 | 12 |
| `fundoFoco` | decimal | 0 a 10, uma casa (passo 0,5 na tela) | 3.0 |
| `animacoes` | `NivelAnimacao` | `COMPLETAS`, `REDUZIDAS` | `COMPLETAS` |

`tenant.fundo_exclusivo` (enum `Fundo`, nulo = nenhuma) vincula uma **cena
exclusiva** ao contratante. Cena exclusiva é marcada com `exclusiva = true` no
enum `Fundo`, tem no máximo um dono (índice único `uk_tenant_fundo_exclusivo`) e
só pode ser o `fundo` de quem é dono dela.

Onde a aparência aparece:

| Rota | Quem | Entrada / saída |
|---|---|---|
| `GET /api/auth/eu` e o `usuario` de login, 2FA, refresh, `superadmin/acessar` e `superadmin/sair` | logado (até com pendência) | `UsuarioLogadoDto.aparencia` = aparência do contratante **em que está atuando** (Plataforma usa o padrão). Também traz `doisFatoresAtivo` e `doisFatoresObrigatorio`. |
| `GET /api/tenants/atual` | `ACESSO_LIBERADO` | `{ id, nome, exige2fa, aparencia }` |
| `GET /api/tenants`, `GET /api/tenants/{id}` | `hasRole('SUPERADMIN')` | `TenantResponseDto` com `aparencia` e `fundoExclusivo` |
| `POST /api/tenants` | `hasRole('SUPERADMIN')` | `aparencia` opcional (ausente = padrão) |
| `PUT /api/tenants/{id}` | `hasRole('SUPERADMIN')` | só cadastrais: `{ nome, documento, email, exige2fa, version }` |
| `PUT /api/tenants/{id}/configuracao` | `hasRole('SUPERADMIN')`, na visão de plataforma | `{ aparencia, fundoExclusivo, version }` → `TenantResponseDto`. 400 com `erros[].campo` = `aparencia.vidroDesfoque` etc.; 409 versão antiga ou cena exclusiva de outro; 422 superadmin dentro de contratante, cena comum como exclusiva ou fundo exclusivo que não é o dele; 404 para a Plataforma. |
| `GET /api/tenants/fundos?tenantId=` | `hasRole('SUPERADMIN')` | `[{ codigo, rotulo, tipo, exclusiva }]`: comuns + exclusivas livres + a exclusiva do próprio `tenantId` |

## Trilha de segurança (tela Logs)

`GET /api/auditoria/eventos` (`AUDITORIA_LER`), consultada pelo `ConsultaEventoService`:

| Parâmetro | Regra |
|---|---|
| `tipos` | lista de `TipoEventoSeguranca` (repetido ou separado por vírgula); vazio = todos |
| `usuarioId` | usuário afetado |
| `tenantId` | só vale para o superadmin na visão de plataforma; **dentro de um contratante é ignorado** |
| `de`, `ate` | ISO-8601 UTC; `de` inclusivo, `ate` exclusivo. Padrão: últimos 7 dias. `de >= ate` → 422 "Período inválido."; mais de 366 dias → 422 "Escolha um período de até 1 ano." |
| `page`, `size`, `sort` | `sort` só `createdAt` ou `tipo`; padrão `createdAt` decrescente; no máximo 100 por página |

Cada evento traz `usuarioNome` e `autorNome` (e `tenantNome` só na visão de
plataforma), resolvidos numa consulta por página. O nome é buscado com o filtro
de tenant ligado: dentro de um contratante o superadmin não é visível, então um
evento feito pelo suporte chega com `autorId` preenchido e `autorNome` nulo (o
front mostra "Suporte da plataforma").

Retenção: 12 meses (`app.auditoria.retencao`, padrão `P365D`; horário em
`app.auditoria.retencao-cron`, padrão `0 30 3 * * *`).

## O que NÃO é filtrado automaticamente

- **SQL nativo.** Só é permitido em repository com `@SqlNativoRevisado`, e a consulta filtra `tenant_id` à mão (ou é global de propósito, como a checagem de e-mail único).
- **Entidades da plataforma**, que não estendem `TenantEntity`: `Tenant`, `SessaoUsuario`, `RefreshToken`, `EventoSeguranca`. As consultas delas são por id ou hash, ou filtram à mão, como `ConsultaEventoService.listar`.

## E se for um container por contratante?

Nada muda no código. Cada container sobe com o próprio banco e variáveis
próprias, e lá dentro existem só a Plataforma e um contratante. O filtro
continua ligado como defesa extra. Para provisionar:

1. Um banco (ou schema) e um conjunto de segredos (`APP_JWT_SEGREDO`, `APP_CRIPTO_CHAVE`) por contratante.
2. A mesma imagem Docker com variáveis diferentes.
3. O superadmin cria o contratante e o primeiro admin pela API.

Os dois modelos podem coexistir: clientes pequenos no banco compartilhado e
clientes grandes no próprio container.
