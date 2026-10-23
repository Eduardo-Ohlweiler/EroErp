# Deploy — runbook

Memória do `operador-deploy` entre sessões: o que ele já sabe de cada servidor,
para **não perguntar de novo**. Versionado no git, vale nas duas máquinas.

**Sem segredo aqui.** Senhas e chaves (`JWT_SECRET`, senha do banco,
`APP_CRIPTO_CHAVE`, senha do superadmin) moram no `.env` **dentro do servidor**.
O IP da VPS mora só no `~/.ssh/config` da máquina de casa (alias abaixo),
nunca neste arquivo.

**O deploy roda só da máquina de casa.** Na empresa não há deploy: lá o alias
`ero-hostinger` não existe, e o `operador-deploy` para se não o encontrar.

---

## Hostinger (VPS) — status: **em preparação**

| Item | Valor |
|---|---|
| Acesso | SSH como **root**. Hoje por senha; o deploy usa **chave SSH** pelo alias `ero-hostinger` (`~/.ssh/config` da máquina de casa) |
| De onde publicar | **só da máquina de casa** — na empresa, não |
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

- [ ] Chave SSH criada na **máquina de casa** e cadastrada em
      `/root/.ssh/authorized_keys`; `ssh ero-hostinger` entra sem senha.
- [ ] Confirmar SO, Docker/Compose, `listen_addresses` e o que já roda.
- [ ] Domínio e HTTPS.
- [ ] Decidir como a API alcança o Postgres do host: (a) API em Docker e o
      Postgres liberado para a rede do Docker (`listen_addresses` +
      `pg_hba.conf`), ou (b) API como serviço `systemd` falando com
      `localhost`. Por padrão o Postgres só escuta `localhost`, e um container
      **não** o alcança sem esse ajuste.

### Requisito: a API não tem porta pública (decidido em 2026-10-22)

Front e API ficam na **mesma VPS**. Só o servidor que entrega o front (nginx ou
Caddy, ou o container dele) alcança a API, repassando `/api` para a API local —
o mesmo papel do proxy do Vite em dev.

**Por quê.** A API enxerga o IP do proxy para todo mundo. O IP real do cliente
(rate limit de login e log de acesso) vem do `X-Forwarded-For`, e a API só
confia nele vindo de proxy interno. Sem isto, ou o rate limit vira um balde só
para todos os usuários (todos com o IP do proxy), ou volta a ser driblado
trocando o cabeçalho.

**Na API** (`application-prod.yml`, mudança do `dev-backend`):
`server.forward-headers-strategy: native` e
`server.tomcat.remoteip.internal-proxies` com loopback e faixas privadas,
incluindo a rede do Docker.

**Obrigatório no proxy: sobrescrever o cabeçalho, nunca acrescentar.**

- nginx: `proxy_set_header X-Forwarded-For $remote_addr;` (**não**
  `$proxy_add_x_forwarded_for`) e `proxy_set_header X-Forwarded-Proto $scheme;`
- Caddy: `header_up X-Forwarded-For {remote_host}`

**Obrigatório no Docker e no host:**

- não publicar a 8080 da API: `ports:` ausente no compose (o proxy a alcança
  pela rede interna) ou, no máximo, `127.0.0.1:8080:8080`;
- firewall sem a 8080 aberta.

**Conferência pós-deploy (entra no passo 7 de toda publicação):**

- [ ] login com `X-Forwarded-For: 203.0.113.77` forjado pelo cliente aparece no
      log de acesso com o **IP real**, não com `203.0.113.77`;
- [ ] `curl http://<ip-publico>:8080` de fora **recusa a conexão**.

---

## Integrator — status: **não iniciado**
