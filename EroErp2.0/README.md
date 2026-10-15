# EroErp 2.0

ERP **multi-tenant** — a reescrita do EroErp, um módulo de cada vez.

```
EroErp2.0/
├── ero-erp-api/              Java 21 · Spring Boot 3.5 · PostgreSQL 16
├── ero/                      React 19 · TypeScript · Vite · Tailwind v4
├── docs/                     padrões do projeto (ler antes de codar)
└── CLAUDE.md                 regras para agentes de IA
```

**Sem Docker.** PostgreSQL instalado localmente, variáveis em `.env`.

---

## 1. Pré-requisitos

| Ferramenta | Versão | Observação |
|---|---|---|
| **JDK** | **21** | obrigatório — o build falha no 17 |
| **PostgreSQL** | 16+ | rodando em `localhost:5432` |
| **Node.js** | 20+ | testado no 22 |
| Maven | — | não precisa instalar se houver `./mvnw` |

Confira:

```bash
java -version     # precisa dizer 21
node -v
pg_isready
```

> **Atenção ao `JAVA_HOME`.** Se a máquina tiver mais de um JDK, é comum o
> `JAVA_HOME` apontar para o 17 mesmo com o `java` do PATH sendo 21 — e o Maven
> usa o `JAVA_HOME`. O `run-dev.sh` localiza o JDK 21 sozinho. Para rodar o Maven
> na mão, exporte antes:
>
> ```bash
> export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64
> ```

---

## 2. Banco de dados

Crie os dois bancos vazios. As tabelas são criadas pelo **Liquibase** na primeira
subida — nunca altere o banco na mão.

```bash
createdb -U postgres -h localhost ero_erp
createdb -U postgres -h localhost ero_erp_test    # usado pelos testes
```

Se o `createdb` pedir senha e você não tiver o `.pgpass` configurado:

```bash
PGPASSWORD=suasenha createdb -U postgres -h localhost ero_erp
PGPASSWORD=suasenha createdb -U postgres -h localhost ero_erp_test
```

---

## 3. Variáveis de ambiente

### Backend — `ero-erp-api/.env`

```bash
cd ero-erp-api
cp .env.example .env      # e ajuste os valores
```

| Variável | Obrigatória | Descrição |
|---|---|---|
| `DB_URL` | **sim** | `jdbc:postgresql://localhost:5432/ero_erp` |
| `DB_USER` | **sim** | usuário do PostgreSQL (ex.: `postgres`) |
| `DB_PASSWORD` | **sim** | senha do PostgreSQL |
| `JWT_SECRET` | **sim** | chave HMAC do JWT — **mínimo 32 caracteres**; a aplicação se recusa a subir com menos |
| `SUPERADMIN_NAME` | **sim** | nome do superadmin criado na primeira subida |
| `SUPERADMIN_EMAIL` | **sim** | e-mail de login do superadmin |
| `SUPERADMIN_PASSWORD` | **sim** | senha do superadmin — **mínimo 10 caracteres** |
| `SUPERADMIN_TENANT_NOME` | não | nome do tenant raiz (padrão: `EroErp Admin`) |
| `CORS_ALLOWED_ORIGINS` | não em dev<br>**sim em prod** | origens do front, separadas por vírgula (padrão em dev: `http://localhost:5173,http://localhost:4173`) |
| `SPRING_PROFILES_ACTIVE` | não | `dev` (padrão) ou `prod` |
| `TEST_DB_URL` | não | banco de teste; cai em `ero_erp_test` |

**Duas armadilhas que já custaram tempo:**

1. **Valor com espaço precisa de aspas.** O `run-dev.sh` faz `source .env`, então
   `SUPERADMIN_NAME=Eduardo Ohlweiler` quebra o shell. Escreva
   `SUPERADMIN_NAME="Eduardo Ohlweiler"`.
2. **A senha do superadmin precisa de 10 caracteres.** Com menos, a aplicação
   sobe e morre no `DataSeeder`, de propósito — é a conta que atravessa todos
   os tenants, e a política é rígida.

### Frontend — `ero/.env.local`

```bash
cd ero
cp .env.example .env.local
```

| Variável | Obrigatória | Descrição |
|---|---|---|
| `VITE_API_URL` | não em dev | base das chamadas à API. Em dev use `/api`, que passa pelo proxy do Vite. Em produção, a URL real (`https://api.seudominio.com`). |

Em desenvolvimento **não precisa mexer em nada**: o Vite faz proxy de `/api` para
`http://localhost:8080`, então o front chama a própria origem e não há CORS no
caminho.

> Só variáveis com prefixo `VITE_` chegam ao navegador — e tudo que chega vai no
> bundle, à vista de qualquer um. **Nunca** coloque segredo no `.env.local` do
> front.

Nenhum dos dois `.env` vai para o repositório (estão no `.gitignore`).

---

## 4. Rodar

Precisa de **dois terminais**.

### Terminal 1 — backend

```bash
cd ero-erp-api
./run-dev.sh
```

O script valida as variáveis obrigatórias e o tamanho do `JWT_SECRET` antes de
subir, e localiza o JDK 21 sozinho.

- API: `http://localhost:8080`
- Swagger: `http://localhost:8080/swagger-ui.html`
- Health: `http://localhost:8080/actuator/health`

Na primeira subida o `DataSeeder` cria o tenant raiz e o superadmin com as
credenciais do `.env`. É idempotente — nas próximas não faz nada.

### Terminal 2 — frontend

```bash
cd ero
npm install       # só na primeira vez
npm run dev
```

- Aplicação: `http://localhost:5173`

### Entrar

Use o `SUPERADMIN_EMAIL` e o `SUPERADMIN_PASSWORD` do `.env` do backend.

---

## 5. Outros comandos

### Backend

```bash
./run-dev.sh test                      # 111 testes contra ero_erp_test
./run-dev.sh package                   # gera o jar em target/
./mvnw -Psecurity dependency-check:check   # OWASP A06 (a 1ª vez baixa a base do NVD)
```

Os testes rodam contra o PostgreSQL local, com o Liquibase recriando o schema a
cada execução. Não usamos H2 nem Testcontainers — o porquê está no
[README da API](ero-erp-api/README.md).

### Frontend

```bash
npm run build     # tsc + build de produção em dist/
npm run preview   # serve o dist/ em :4173
npm run lint      # oxlint
npm run paletas   # contraste e cascata das 20 paletas
```

---

## 6. Modelo de acesso

Nível único por usuário, enum na coluna `usuario.role`:

| Nível | Alcance |
|---|---|
| `SUPERADMIN` | administra o sistema; **único que atravessa tenants** |
| `ADMIN` | administra o próprio tenant |
| `USER` | opera dentro do próprio tenant |

A área administrativa — `/tenants`, `/usuarios`, `/login-logs` — é exclusiva do
`SUPERADMIN`. `ADMIN` e `USER` acessam os módulos de negócio e o próprio perfil.

**Não há autocadastro.** Não existe rota pública de registro: toda conta é
provisionada pelo superadmin em `POST /usuarios`. Um cliente (tenant) nasce por
dois caminhos, ambos do superadmin: pela tela de tenants ("Novo tenant"), sem
usuário — e depois o atalho "Novo usuário neste tenant" cria a equipe —, ou
junto do seu primeiro usuário, quando o superadmin cadastra alguém sem indicar
tenant. O primeiro superadmin vem do `DataSeeder`, por variável de ambiente.

**Isolamento por tenant é a regra máxima do projeto.** Toda consulta filtra por
`tenant_id`, e recurso de outro tenant devolve 404 — nunca 403. O superadmin não
fura o filtro: ele troca o *valor* do filtro via `switch-tenant`.
Detalhes em [docs/01-multitenant.md](docs/01-multitenant.md).

---

## 7. Estado do projeto

O EroErp 2.0 é a reescrita do EroErp antigo. Começa por um **esqueleto** herdado
de um projeto anterior, mais bem construído, e recebe os módulos do antigo **um
de cada vez**, melhorados na passagem.

| Fatia | Situação |
|---|---|
| **0 — Esqueleto** | ✅ pronto · 111 testes |
| Módulos do EroErp antigo | a migrar, um de cada vez |

### O que já dá para usar

Entre com o `SUPERADMIN_EMAIL` do `.env` e você tem:

| Tela | Rota |
|---|---|
| Login, com alternador de tema | `/app/login` |
| Início — atalhos para o que existe | `/app` |
| Pessoas — PF/PJ, contatos, endereços (IBGE) e vínculos | `/app/pessoas` |
| Meu perfil e troca de senha | `/app/perfil` |
| Usuários — lista global com filtro de cliente, criação, edição e redefinição de senha | `/app/usuarios` |
| Tenants — criar, listar, entrar, ativar/desativar, período de acesso, paleta e "Novo usuário neste tenant" | `/app/tenants` |
| Log de acesso — por tenant ou global | `/app/log-acesso` |

Tema claro e escuro, 20 paletas escolhidas pelo superadmin para cada tenant, seletor de tenant do
superadmin no header, faixa de aviso quando está dentro de outro tenant, relatório
impresso e planilha CSV nas listas, e tudo responsivo até 360px — grid vira
cartão no mobile, sidebar vira *drawer*.

**Não implementado ainda**, registrado para não virar surpresa:

- **Recuperação de senha por e-mail** — depende de definir o serviço de e-mail.
  Enquanto isso o superadmin redefine a senha pelo formulário do usuário, e o
  usuário troca a própria senha no perfil, informando a atual.
- **Auditoria de operações de negócio** (`audit_log`) — hoje só existe o
  `login_log`. Especificação em [docs/06 §A09](docs/06-seguranca-owasp.md).
- **Marca** — o logo do EroErp está no menu e no login; os favicons ainda são
  os do projeto anterior.

---

## 8. Documentação

Leia antes de escrever código. O [CLAUDE.md](CLAUDE.md) é o resumo carregado em
toda sessão de IA.

| Doc | Assunto |
|---|---|
| [docs/00-PROMPT-MESTRE.md](docs/00-PROMPT-MESTRE.md) | visão do sistema, ordem de construção, glossário |
| [docs/01-multitenant.md](docs/01-multitenant.md) | isolamento por tenant — a regra máxima |
| [docs/02-modulo-usuarios.md](docs/02-modulo-usuarios.md) | usuários, níveis de acesso, log de acesso, troca de tenant |
| [docs/03-arquitetura-backend.md](docs/03-arquitetura-backend.md) | padrão Java 21 + Spring Boot |
| [docs/04-arquitetura-frontend.md](docs/04-arquitetura-frontend.md) | padrão React 19 + TS + Tailwind |
| [docs/05-identidade-visual.md](docs/05-identidade-visual.md) | paleta, tipografia, tokens, marca |
| [docs/06-seguranca-owasp.md](docs/06-seguranca-owasp.md) | OWASP Top 10 aplicado a Java/Spring + LGPD |
| [docs/07-banco-liquibase.md](docs/07-banco-liquibase.md) | PostgreSQL + Liquibase |
| [docs/08-modulo-pessoas.md](docs/08-modulo-pessoas.md) | cadastro de pessoas — PF/PJ, contatos, endereços e vínculos |

---

## 9. Problemas comuns

| Sintoma | Causa e solução |
|---|---|
| `release version 21 not supported` | O Maven está usando o JDK 17. Use `./run-dev.sh`, ou exporte `JAVA_HOME` para o JDK 21. No VS Code, o [.vscode/settings.json](.vscode/settings.json) já aponta o 21 — reinicie o language server: `Ctrl+Shift+P` → *Java: Clean Java Language Server Workspace*. |
| Erros vermelhos no VS Code que o `mvn` não reproduz | Cache velho do language server. Mesma limpeza acima. |
| `.env: linha N: comando não encontrado` | Valor com espaço sem aspas no `.env`. Ver §3. |
| `SUPERADMIN_PASSWORD precisa de no mínimo 10 caracteres` | É proposital. Aumente a senha no `.env`. |
| `JWT_SECRET precisa de no mínimo 32 caracteres` | Idem. |
| `FATAL: database "ero_erp" does not exist` | Falta criar os bancos. Ver §2. |
| `fe_sendauth: no password supplied` | O `DB_PASSWORD` do `.env` está vazio ou errado. |
| Front carrega mas as chamadas à API falham | O backend não está no ar. Confira `curl http://localhost:8080/actuator/health`. |
| Porta 8080 ou 5173 ocupada | `fuser -k 8080/tcp` (ou `5173`). |
| `Unable to establish loopback connection` ao subir a API (Windows) | O JDK 21 não consegue abrir o socket local na pasta temporária do usuário. Suba pelo `./run-dev.sh`, que aponta `jdk.net.unixdomain.tmpdir` para `ero-erp-api/.tmp/`; pela IDE, acrescente `-Djdk.net.unixdomain.tmpdir=<pasta do projeto>\.tmp` às opções da JVM. |
| `Conta temporariamente bloqueada` no login | Cinco senhas erradas bloqueiam por 15 minutos. Espere, ou libere em `PATCH /usuarios/{id}/desbloquear` com o superadmin. |
