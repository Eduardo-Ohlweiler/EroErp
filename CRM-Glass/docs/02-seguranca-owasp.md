# 02 — Segurança (OWASP Top 10 2025)

Como cada risco está coberto no `ero-api` e o checklist que o agente
`seguranca` passa em toda entrega.

## Mapa OWASP → implementação

| Risco | Como está coberto | Onde |
|---|---|---|
| **A01 Controle de acesso** | Todo endpoint declara quem pode chamar (`@PreAuthorize`/`@PermitAll`; o ArchUnit barra rota sem isso). Tenant filtrado automaticamente pelo Hibernate em todo JPQL. Registro de outro tenant dá **404** (não revela que existe). IDs UUID v7. Permissões relidas do banco (cache de 30 s, invalidado ao alterar). Ninguém altera as próprias permissões; quem não é admin só concede o que tem; só admin cria admin; só admin redefine senha, troca e-mail ou reseta o 2FA de outra pessoa; usuário comum só altera colega com acesso menor ou igual ao seu. Usuário com pendência só acessa `/api/auth/*` (rotas comuns exigem `ACESSO_LIBERADO`). Superadmin só entra num contratante por ação explícita, que fica na auditoria. | `SecurityConfig`, `TenantEntity`, `TenantIdentifierResolver`, `AutorizacaoService`, `PermissaoService`, `UsuarioService` |
| **A02 Configuração** | Configuração base segura; dev só afrouxa. Actuator público só com `health`, sem detalhes. Swagger desligado fora de dev. Cabeçalhos: CSP, HSTS, nosniff, X-Frame-Options DENY, Referrer-Policy no-referrer, Permissions-Policy, COOP. CORS com lista exata vinda do ambiente. Erro sem stack trace e sem mensagem interna. Sessão HTTP desligada. | `application.yaml`, `SecurityConfig`, `CorsConfig` |
| **A03 Cadeia de suprimentos** | Versões gerenciadas pelo BOM do Spring Boot. `mvnw verify -Pseguranca` roda o OWASP dependency-check e falha com CVSS ≥ 7 (variável `NVD_API_KEY` recomendada). Imagem Docker JRE mínima e usuário não-root. | `pom.xml`, `Dockerfile` |
| **A04 Criptografia** | Senha com Argon2id (BCrypt só para migrar hash antigo, regravado no login). Refresh token e código de recuperação guardados como SHA-256. Segredo TOTP cifrado com AES-256-GCM. Chaves só por variável de ambiente; a aplicação não sobe com chave curta. | `SenhaService`, `SessaoService`, `CriptoService` |
| **A05 Injeção** | Só JPQL parametrizado. SQL nativo só em repository com `@SqlNativoRevisado` (justificado). Bean Validation em todo DTO. Corpo limitado a 1 MB, inclusive envio chunked (o corpo é contado enquanto é lido). Ordenação por lista branca. `busca` com `@Size`. | repositories, `LimiteTamanhoFilter`, `PaginacaoUtils` |
| **A06 Design inseguro** | Regras no service. DTO de entrada sem campo sensível (sem mass assignment). Lock otimista (`version`). Bloqueio de conta após 5 erros por 15 min, com a linha do usuário travada (`SELECT … FOR UPDATE`) para que tentativas em paralelo sejam contadas uma a uma; limite por IP (IPv6 agrupado por /64). | services, `AuthService`, `RateLimitFilter` |
| **A07 Autenticação** | Token de acesso de 15 min, guardado só em memória no front. Refresh em cookie `HttpOnly; Secure; SameSite=Strict; Path=/api/auth`, que gira a cada uso: reutilizar um token já usado derruba a sessão. Logout, troca de senha, inativação e mudança de 2FA derrubam as sessões. Senha com mínimo de 12 caracteres, recusando lista de senhas comuns e senha que contenha e-mail ou nome. 2FA TOTP com códigos de recuperação de uso único, opcional por usuário, exigível pelo contratante e **obrigatório para o superadmin** (`app.seguranca.superadmin-exige-2fa`, desligado só em dev/teste). Ligar e desligar o 2FA pedem a senha e derrubam as outras sessões; admin pode resetar o 2FA de quem perdeu o celular. A troca de senha respeita o bloqueio. Mensagem de falha genérica, com o mesmo tempo para e-mail inexistente. Senha temporária obriga troca. | `auth/`, `sessao/`, `SenhaService` |
| **A08 Integridade** | `@Version` em toda entidade. Desserialização só para records tipados (Jackson). JWT HS256 validando emissor, validade e tipo (`acesso` ≠ `desafio-2fa`). | `BaseEntity`, `JwtService` |
| **A09 Log e alerta** | Trilha `evento_seguranca`: login ok/falha, bloqueio, logout, reuso de refresh, senha, 2FA, permissões, usuário e contratante criados ou alterados, superadmin acessando contratante. Retenção de 12 meses (`app.auditoria.retencao`, padrão `P365D`): o `RetencaoEventoService` apaga todo dia às 3h30 os eventos mais antigos e, no mesmo job, as sessões e refresh tokens já expirados. `LogSeguro` mascara e-mail, documento e telefone. `X-Correlation-Id` em toda resposta e no log. Log JSON (ECS) em prod. | `auditoria/`, `RetencaoEventoService`, `LogSeguro`, `CorrelationIdFilter` |
| **A10 Tratamento de erros** | Um único `GlobalExceptionHandler` (ProblemDetail). Erro inesperado devolve texto genérico com o código para o suporte. Falha sempre fechada: sem tenant no contexto, nenhuma linha é visível; sessão inválida dá 401. | `GlobalExceptionHandler`, `TenantContext.NENHUM` |

## Pontos de atenção (decisões conscientes)

- **Rate limit e cache de autorização ficam em memória.** Com várias instâncias, cada uma conta o seu limite e as outras levam até 30 s para ver uma permissão revogada. No modelo "container por contratante" isso não importa. Para escalar horizontalmente, troque por Redis.
- **CSRF desligado** porque o token vai em header. As duas rotas que usam cookie (refresh e logout) exigem `SameSite=Strict` e o header `X-Ero-Refresh: 1`, que outro site não consegue enviar sem passar pelo CORS.
- **Contexto ROOT** (`TenantContext.comoRoot`) enxerga todos os tenants. Só pode ser usado em `auth`, `seguranca`, seed e fluxos de plataforma do superadmin, sempre buscando pelo id que veio do token. Uso novo de `comoRoot` precisa de revisão do agente `seguranca`.
- **Pendências conhecidas** (endurecimento, sem caminho de exploração hoje):
  - o desafio 2FA vale por 5 minutos e pode ser reaproveitado nesse intervalo (contido pelo bloqueio de conta). Uso único por `jti` fica para depois;
  - em produção, fixar `server.tomcat.remoteip.internal-proxies` no IP do proxy reverso (hoje vale a faixa privada padrão);
  - fixar as imagens base do `Dockerfile` por digest;
  - rodar `mvnw verify -Pseguranca` com `NVD_API_KEY` (ainda não rodado);
  - o `FOR UPDATE` do login só trava quando o e-mail existe: sob requisições simultâneas, o tempo de resposta denuncia se o e-mail existe e cada uma segura uma conexão pelo tempo do Argon2. Trocar por `pg_advisory_xact_lock(hashtext(email))` com timeout curto;
  - a invalidação do cache por usuário não enxerga uma carga em andamento (janela de milissegundos). Se preciso, usar um contador de geração por usuário.
- **Chave de criptografia** (`APP_CRIPTO_CHAVE`): perder ou trocar a chave torna ilegíveis os segredos 2FA gravados. Guarde a chave num cofre e, por contratante, junto com o backup do banco.

## Checklist por entrega (agente `seguranca`)

Marque cada item como ✅, ❌ ou "não se aplica", sempre com arquivo:linha.

**Controle de acesso e tenant**
- [ ] Toda entidade nova de negócio estende `TenantEntity`.
- [ ] Nenhum SQL nativo novo; se houver, tem `@SqlNativoRevisado` com motivo e filtra `tenant_id` (ou é global de propósito).
- [ ] Nenhum `TenantContext.comoRoot` novo fora de auth/seguranca/plataforma.
- [ ] Todo endpoint novo tem `@PreAuthorize` com o grupo certo: LER nos GET, ESCREVER nas escritas.
- [ ] Ações sensíveis têm checagem fina no service (dono do registro, papel, "não pode em si mesmo").
- [ ] Existe teste de isolamento entre dois tenants e teste do par LER/ESCREVER.

**Entrada e saída**
- [ ] DTO de entrada sem `id`, `tenantId`, auditoria ou flags que o usuário não deveria controlar.
- [ ] Bean Validation com limite de tamanho em todo String.
- [ ] ResponseDto não expõe hash, segredo, token ou dado de outro tenant.
- [ ] Ordenação nova entra na lista branca, nunca aceita campo livre.

**Dados sensíveis**
- [ ] Nada de senha, token, CPF, e-mail ou telefone inteiro em log (`LogSeguro`).
- [ ] Segredo de integração guardado com `@Convert(converter = CriptoConverter.class)`.
- [ ] DTO com senha ou código sobrescreve `toString()`.
- [ ] Nenhum segredo no código, YAML versionado ou teste reaproveitável (só variável de ambiente).

**Autenticação e sessão** (se mexeu em `auth`, `sessao` ou `seguranca`)
- [ ] Mensagens de falha continuam genéricas.
- [ ] Mudança que afeta acesso invalida `AutorizacaoCache` e, se for o caso, revoga sessões.
- [ ] Evento novo de segurança registrado em `EventoSegurancaService`.

**Dependências e configuração**
- [ ] Dependência nova justificada e com versão do BOM ou fixa e atual.
- [ ] Nada afrouxado em `application.yaml` (só em `application-dev.yaml`).
- [ ] `mvnw verify` verde. Se mexeu em dependências, também `-Pseguranca`.
