# Deploy — runbook

Memória do `operador-deploy` entre sessões: o que ele já sabe de cada servidor,
para **não perguntar de novo**. Versionado no git, vale nas duas máquinas.

**Sem segredo aqui.** Senhas e chaves (`JWT_SECRET`, senha do banco,
`APP_CRIPTO_CHAVE`, senha do superadmin) moram no `.env` **dentro do servidor**.
O IP da VPS mora só no `~/.ssh/config` de cada máquina (alias abaixo), nunca
neste arquivo.

---

## Hostinger (VPS) — status: **em preparação**

| Item | Valor |
|---|---|
| Acesso | SSH como **root**. Hoje por senha; o deploy usa **chave SSH** pelo alias `ero-hostinger` (`~/.ssh/config` nas duas máquinas) |
| Forma | Docker (escolha do Eduardo) |
| PostgreSQL | instalado **direto no servidor** (não em container), configuração padrão: porta 5432, usuário `postgres`. Senha definida na instalação — vai no `.env` do servidor |
| Banco do sistema | a criar: `ero_erp`, com usuário próprio da aplicação (não o `postgres`) |
| Sistema operacional | a confirmar |
| Docker / Compose instalados? | a confirmar |
| O Postgres escuta onde? (`listen_addresses`) | a confirmar — padrão é só `localhost` |
| O que já roda lá (portas 80/443/5432/8080) | a confirmar |
| Domínio / subdomínios | a definir |
| HTTPS | a definir |
| Pasta do sistema no servidor | proposta: `/opt/eroerp` |

### Pendências da primeira vez

- [ ] Chave SSH criada nas **duas** máquinas e cadastrada em
      `/root/.ssh/authorized_keys`; `ssh ero-hostinger` entra sem senha.
- [ ] Confirmar SO, Docker/Compose, `listen_addresses` e o que já roda.
- [ ] Domínio e HTTPS.
- [ ] Decidir como a API alcança o Postgres do host: (a) API em Docker e o
      Postgres liberado para a rede do Docker (`listen_addresses` +
      `pg_hba.conf`), ou (b) API como serviço `systemd` falando com
      `localhost`. Por padrão o Postgres só escuta `localhost`, e um container
      **não** o alcança sem esse ajuste.

---

## Integrator — status: **não iniciado**
