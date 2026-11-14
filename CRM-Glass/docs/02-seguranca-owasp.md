# 02 — Segurança (OWASP Top 10 2025)

Como cada risco está coberto no `ero-api` e o checklist que o agente
`seguranca` passa em toda entrega.

## Mapa OWASP → implementação

| Risco | Como está coberto | Onde |
|---|---|---|
| **A01 Controle de acesso** | Todo endpoint declara quem pode chamar (`@PreAuthorize`/`@PermitAll`; o ArchUnit barra rota sem isso). Tenant filtrado automaticamente pelo Hibernate em todo JPQL. Registro de outro tenant dá **404** (não revela que existe). IDs UUID v7. Permissões relidas do banco (cache de 30 s, invalidado ao alterar). Ninguém altera as próprias permissões; quem não é admin só concede o que tem; só admin cria admin; só admin redefine senha ou troca o e-mail de outra pessoa; usuário comum só altera colega com acesso menor ou igual ao seu. Usuário com pendência só acessa `/api/auth/*` (rotas comuns exigem `ACESSO_LIBERADO`). Superadmin só entra num contratante por ação explícita, que fica na auditoria. | `SecurityConfig`, `TenantEntity`, `TenantIdentifierResolver`, `AutorizacaoService`, `PermissaoService`, `UsuarioService` |
| **A02 Configuração** | Configuração base segura; dev só afrouxa. Actuator público só com `health`, sem detalhes. Swagger desligado fora de dev. Cabeçalhos: CSP, HSTS, nosniff, X-Frame-Options DENY, Referrer-Policy no-referrer, Permissions-Policy, COOP. CORS com lista exata vinda do ambiente. Erro sem stack trace e sem mensagem interna. Sessão HTTP desligada. | `application.yaml`, `SecurityConfig`, `CorsConfig` |
| **A03 Cadeia de suprimentos** | Versões gerenciadas pelo BOM do Spring Boot. `mvnw verify -Pseguranca` roda o OWASP dependency-check e falha com CVSS ≥ 7 (variável `NVD_API_KEY` recomendada). Imagem Docker JRE mínima e usuário não-root. | `pom.xml`, `Dockerfile` |
| **A04 Criptografia** | Senha com Argon2id (BCrypt só para migrar hash antigo, regravado no login). Refresh token guardado como SHA-256. Código de verificação do login cifrado com AES-256-GCM (`CriptoConverter`; cifrado e não em hash porque o "reenviar" manda o mesmo código), sorteado com `SecureRandom` e comparado em tempo constante. E-mail só por SMTP com STARTTLS obrigatório (padrão; Gmail com senha de app vinda do ambiente); fora de dev/test, login no SMTP sem STARTTLS (`MAIL_STARTTLS=false`) gera ERRO no log ao subir. Chaves e senhas só por variável de ambiente; a aplicação não sobe com chave curta. | `SenhaService`, `SessaoService`, `CriptoService`, `CodigoVerificacaoService`, `EmailService` |
| **A05 Injeção** | Só JPQL parametrizado. SQL nativo só em repository com `@SqlNativoRevisado` (justificado). Bean Validation em todo DTO. Corpo limitado a 1 MB, inclusive envio chunked (o corpo é contado enquanto é lido). Ordenação por lista branca. `busca` com `@Size`. | repositories, `LimiteTamanhoFilter`, `PaginacaoUtils` |
| **A06 Design inseguro** | Regras no service. DTO de entrada sem campo sensível (sem mass assignment). Lock otimista (`version`). Bloqueio de conta após 5 erros por 15 min, com a linha do usuário travada (`SELECT … FOR UPDATE`) para que tentativas em paralelo sejam contadas uma a uma; limite por IP (IPv6 agrupado por /64). Limite de usuários ativos por contratante, com a linha do contratante travada ao criar e reativar (a última vaga não é ocupada duas vezes). | services, `AuthService`, `RateLimitFilter`, `LimiteUsuariosService` |
| **A07 Autenticação** | Token de acesso de 15 min, guardado só em memória no front. Refresh em cookie `HttpOnly; Secure; SameSite=Strict; Path=/api/auth`, que gira a cada uso: reutilizar um token já usado derruba a sessão. Logout, troca de senha e inativação derrubam as sessões. Senha com mínimo de 12 caracteres, recusando lista de senhas comuns e senha que contenha e-mail ou nome. **Verificação em duas etapas por código enviado por e-mail, para todos os usuários, sempre** (superadmin incluído, também em dev): a senha certa só devolve um desafio (JWT `desafio-2fa`) e manda um código de 6 dígitos; a sessão só abre com o código. O código vale 10 min desde o 1º envio, é de uso único e login novo apaga os códigos anteriores do usuário. Trocar ou redefinir a senha invalida o código pendente (código emitido antes de `senha_alterada_em` conta como vencido) e o bloqueio da conta o apaga, então o desbloqueio não devolve chutes a ele. Usuário ou contratante inativado entre a senha e o código não entra. Os 401 do `/2fa/verificar` têm `codigo` próprio: `DESAFIO_EXPIRADO` (entre de novo) e `CODIGO_INVALIDO` (código errado; também conta bloqueada ou inativa, sem dizer qual). "Reenviar" manda o mesmo código, sem estender a validade, no mínimo 60 s entre envios (429 com `Retry-After` = o que falta do intervalo) e no máximo 5 envios (depois, 422 "entre de novo"). No máximo 10 códigos **novos** por usuário por hora (`app.seguranca.codigo-max-emissoes-por-hora`, teto 1000 pelo `@Max`; acima de 10 fora dos perfis dev/test a subida registra um `log.error`, como o SMTP sem STARTTLS; contados pelos eventos `CODIGO_ENVIADO`; reenvios não contam): o 11º login com a senha certa recebe 429 "Muitos códigos pedidos. Tente de novo mais tarde." com `Retry-After` até o mais antigo da janela sair dela, e o código pendente **não** é apagado (quem sabe a senha não derruba o login do dono da conta pedindo código atrás de código, nem enche a caixa dele). A vaga é reservada antes do e-mail sair, na mesma transação que trava a linha do usuário: logins em paralelo passam um de cada vez pela contagem e não furam o limite. Envio que falhou (503) devolve a vaga. A janela começa na última troca de senha, se for mais recente: quando o administrador redefine a senha, a cota gasta com a senha antiga deixa de valer. Código errado conta no mesmo contador da senha (5 erros bloqueiam a conta por 15 min) e verificar e reenviar dividem o balde de limite por IP. Sem e-mail configurado o login responde 503 a todos, antes de olhar a senha; se o envio falha, o código é apagado e o login responde 503 sem abrir sessão; no reenvio, o código continua valendo e o envio que falhou não conta (nem para o intervalo nem para o máximo). Quem perdeu o acesso ao e-mail tem o e-mail trocado pelo administrador (não existe app autenticador nem código de recuperação). A troca de senha respeita o bloqueio. Mensagem de falha genérica, com o mesmo tempo para e-mail inexistente; nenhum e-mail sai para senha errada ou conta bloqueada. Senha temporária obriga troca. | `auth/`, `sessao/`, `SenhaService`, `EmailService` |
| **A08 Integridade** | `@Version` em toda entidade. Desserialização só para records tipados (Jackson); enum só pelo nome (número no lugar do enum dá 400, `spring.jackson.datatype.enum.fail-on-numbers-for-enums`). JWT HS256 validando emissor, validade e tipo (`acesso` ≠ `desafio-2fa`). O `jti` do desafio aponta para a linha do código: o desafio é de uso único e não serve para outro usuário. | `BaseEntity`, `JwtService` |
| **A09 Log e alerta** | Trilha `evento_seguranca`: login ok/falha, código enviado/reenviado, código errado ou vencido (`DOIS_FATORES_FALHA`), senha certa barrada pelo limite de códigos por hora (`CODIGO_LIMITE_ATINGIDO`, no máximo um por usuário na janela de 1 hora, gravado na transação que trava a linha do usuário, que termina com commit; o 429 só é lançado depois), falha no envio do e-mail, bloqueio, logout, reuso de refresh, senha, permissões, usuário e contratante criados ou alterados, superadmin acessando contratante. Dentro de um contratante, evento do suporte sai com `suporte = true` e sem id, IP e navegador do superadmin; pela mesma regra, `GET /api/usuarios` e a ficha não trazem o id nem o nome do superadmin em `createdBy`/`updatedBy`/`criadoPorNome`/`alteradoPorNome` (saem vazios). Alerta de SMTP fora do ar: 5 falhas de envio seguidas em 10 min geram **um** `log.error("alerta smtp_falhas_seguidas=N janela=10m")` por janela, sem e-mail nem id (o monitoramento procura esse texto). Retenção de 12 meses (`app.auditoria.retencao`, padrão `P365D`, mínimo `P30D`, senão a aplicação não sobe): o `RetencaoEventoService` apaga todo dia às 3h30 os eventos mais antigos e, no mesmo job, as sessões e refresh tokens já expirados; no mesmo horário, o `CodigoVerificacaoService` apaga os códigos de verificação vencidos ou usados. `LogSeguro` mascara e-mail, documento e telefone. `X-Correlation-Id` em toda resposta e no log. Log JSON (ECS) em prod. | `auditoria/`, `RetencaoEventoService`, `LogSeguro`, `CorrelationIdFilter` |
| **A10 Tratamento de erros** | Um único `GlobalExceptionHandler` (ProblemDetail). Erro inesperado devolve texto genérico com o código para o suporte. Falha sempre fechada: sem tenant no contexto, nenhuma linha é visível; sessão inválida dá 401. | `GlobalExceptionHandler`, `TenantContext.NENHUM` |

## Pontos de atenção (decisões conscientes)

- **Rate limit e cache de autorização ficam em memória.** Com várias instâncias, cada uma conta o seu limite e as outras levam até 30 s para ver uma permissão revogada. No modelo "container por contratante" isso não importa. Para escalar horizontalmente, troque por Redis.
- **CSRF desligado** porque o token vai em header. As duas rotas que usam cookie (refresh e logout) exigem `SameSite=Strict` e o header `X-Ero-Refresh: 1`, que outro site não consegue enviar sem passar pelo CORS.
- **Corpo inválido responde 400 antes do 403.** Um `PUT`/`POST` com corpo malformado (JSON quebrado ou campo recusado pelo Bean Validation) de quem está logado mas não tem a permissão da rota recebe 400, não 403. O filtro do Spring Security só exige login (`anyRequest().authenticated()`); o `@PreAuthorize` é checado no proxy do controller, e o Spring MVC lê e valida o corpo (`@Valid @RequestBody`, restrições em parâmetro) antes de chamar o método. Não vaza dado: o 400 só descreve o formato do DTO (o mesmo que o front já conhece), nunca registro de ninguém, e sem login a resposta continua sendo 401 antes de tudo. Com corpo válido, quem não tem permissão recebe 403 sem o service rodar.
- **Contexto ROOT** (`TenantContext.comoRoot`) enxerga todos os tenants. Só pode ser usado em `auth`, `seguranca`, seed e fluxos de plataforma do superadmin, sempre buscando pelo id que veio do token. Uso novo de `comoRoot` precisa de revisão do agente `seguranca`.
- **Pendências conhecidas** (endurecimento, sem caminho de exploração hoje):
  - ~~o desafio 2FA podia ser reaproveitado~~ **resolvido:** o `jti` do desafio aponta para a linha do código, que é de uso único (`usado_em`) e é apagada quando o usuário faz login de novo;
  - o código vai por e-mail: quem controla a caixa de e-mail do usuário E sabe a senha entra. O e-mail de login é o segundo fator; trocar o e-mail de outra pessoa é só para administrador;
  - o envio do e-mail é síncrono (até 10 s de timeout do SMTP segurando a requisição). Com volume alto, trocar por fila;
  - **SMTP fora do ar → nem o código nem um alerta por e-mail chegam.** O login inteiro para (503) e o único aviso é o log de erro `alerta smtp_falhas_seguidas` (contador em memória, por instância). O monitoramento do servidor precisa procurar esse texto no log;
  - em produção, fixar `server.tomcat.remoteip.internal-proxies` no IP do proxy reverso (hoje vale a faixa privada padrão);
  - fixar as imagens base do `Dockerfile` por digest;
  - rodar `mvnw verify -Pseguranca` com `NVD_API_KEY` (ainda não rodado);
  - o `FOR UPDATE` do login só trava quando o e-mail existe: sob requisições simultâneas, o tempo de resposta denuncia se o e-mail existe e cada uma segura uma conexão pelo tempo do Argon2. Trocar por `pg_advisory_xact_lock(hashtext(email))` com timeout curto;
  - a invalidação do cache por usuário não enxerga uma carga em andamento (janela de milissegundos). Se preciso, usar um contador de geração por usuário.
- **Chave de criptografia** (`APP_CRIPTO_CHAVE`): perder ou trocar a chave torna ilegíveis os campos cifrados gravados (hoje, os códigos de verificação pendentes, que valem 10 min). Guarde a chave num cofre e, por contratante, junto com o backup do banco.

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
