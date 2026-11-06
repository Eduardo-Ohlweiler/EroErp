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

## O que NÃO é filtrado automaticamente

- **SQL nativo.** Só é permitido em repository com `@SqlNativoRevisado`, e a consulta filtra `tenant_id` à mão (ou é global de propósito, como a checagem de e-mail único).
- **Entidades da plataforma**, que não estendem `TenantEntity`: `Tenant`, `SessaoUsuario`, `RefreshToken`, `EventoSeguranca`. As consultas delas são por id ou hash, ou filtram à mão, como `EventoSegurancaService.listar`.

## E se for um container por contratante?

Nada muda no código. Cada container sobe com o próprio banco e variáveis
próprias, e lá dentro existem só a Plataforma e um contratante. O filtro
continua ligado como defesa extra. Para provisionar:

1. Um banco (ou schema) e um conjunto de segredos (`APP_JWT_SEGREDO`, `APP_CRIPTO_CHAVE`) por contratante.
2. A mesma imagem Docker com variáveis diferentes.
3. O superadmin cria o contratante e o primeiro admin pela API.

Os dois modelos podem coexistir: clientes pequenos no banco compartilhado e
clientes grandes no próprio container.
