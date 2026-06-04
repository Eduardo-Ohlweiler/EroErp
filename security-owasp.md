# Skill: Segurança — OWASP Top 10

Aplique este guia em **todo código gerado**. Cada item do OWASP Top 10 tem
regras práticas e exemplos no contexto da stack React + Node (Express/Fastify).

---

## A01 — Broken Access Control

**Regra:** Todo recurso deve verificar se o usuário autenticado tem permissão
para acessar aquele dado específico, não apenas se está autenticado.

```javascript
// ❌ ERRADO — verifica apenas autenticação
router.get('/ticket/:id', authMiddleware, async (req, res) => {
  const ticket = await TicketRepository.findById(req.params.id)
  return res.json(ticket)
})

// ✅ CORRETO — verifica propriedade do recurso
router.get('/ticket/:id', authMiddleware, async (req, res) => {
  const ticket = await TicketRepository.findById(req.params.id)
  if (!ticket) return res.status(404).json({ error: 'Não encontrado' })
  if (ticket.userId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado' })
  }
  return res.json(ticket)
})
```

**Regras adicionais:**
- Nunca confiar em IDs vindos do corpo da requisição para determinar propriedade
- Sempre filtrar queries pelo `userId` do token JWT, não do body
- Endpoints administrativos devem verificar role explicitamente

---

## A02 — Cryptographic Failures

**Regra:** Dados sensíveis devem ser protegidos em trânsito e em repouso.

```javascript
// ❌ ERRADO — senha em texto plano
const user = await UserRepository.create({ password: req.body.password })

// ✅ CORRETO — senha com hash
import bcrypt from 'bcrypt'
const hash = await bcrypt.hash(req.body.password, 12)
const user = await UserRepository.create({ password: hash })

// ✅ CORRETO — verificação de senha
const valid = await bcrypt.compare(req.body.password, user.password)
```

**Regras adicionais:**
- Nunca usar MD5 ou SHA1 para senhas
- Tokens JWT devem ter expiração máxima de 8 horas para sessões normais
- Secrets JWT com mínimo 32 caracteres aleatórios
- HTTPS obrigatório em produção — nunca transmitir dados sensíveis em HTTP
- Campos sensíveis no banco (CPF, dados de saúde) devem usar criptografia a nível de aplicação

---

## A03 — Injection

**Regra:** Nunca concatenar input do usuário em queries, comandos ou expressões.

```javascript
// ❌ ERRADO — SQL Injection
const user = await db.query(`SELECT * FROM users WHERE email = '${email}'`)

// ✅ CORRETO — query parametrizada
const user = await db.query('SELECT * FROM users WHERE email = $1', [email])

// ❌ ERRADO — NoSQL Injection
const user = await User.findOne({ email: req.body.email })
// (se req.body.email for { $gt: '' }, retorna qualquer usuário)

// ✅ CORRETO — validar tipo antes
const email = String(req.body.email).trim()
const user = await User.findOne({ email })
```

**Regras adicionais:**
- Usar Zod ou Joi para validação e tipagem de todo input externo
- Sanitizar HTML com `DOMPurify` antes de renderizar conteúdo gerado por usuário
- Nunca usar `eval()`, `new Function()`, ou `exec()` com dados externos

---

## A04 — Insecure Design

**Regra:** Implementar rate limiting, bloqueio de brute force e limites de uso.

```javascript
// ✅ CORRETO — rate limiting com express-rate-limit
import rateLimit from 'express-rate-limit'

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5,                    // máximo 5 tentativas
  message: { error: 'Muitas tentativas. Tente novamente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
})

// Aplicar apenas nas rotas de autenticação
app.use('/api/auth', authLimiter)
```

**Regras adicionais:**
- Rotas de autenticação e OTP sempre com rate limiting
- Endpoints de busca com paginação obrigatória (nunca retornar coleções ilimitadas)
- Tempo de expiração de OTP máximo de 10 minutos

---

## A05 — Security Misconfiguration

**Regra:** Configurar headers de segurança e remover informações desnecessárias.

```javascript
// ✅ CORRETO — Express com Helmet
import helmet from 'helmet'
app.use(helmet())

// ✅ CORRETO — Fastify com @fastify/helmet
import helmet from '@fastify/helmet'
await fastify.register(helmet)

// ✅ CORRETO — remover header que expõe tecnologia
app.disable('x-powered-by') // Express
// Fastify já não expõe por padrão

// ✅ CORRETO — CORS restritivo
import cors from 'cors'
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') ?? [],
  credentials: true,
}))
```

**Regras adicionais:**
- Nunca usar `cors({ origin: '*' })` em produção
- Variáveis `NODE_ENV`, `DEBUG` configuradas corretamente por ambiente
- Stack traces nunca expostos em respostas de produção

---

## A06 — Vulnerable and Outdated Components

**Regra:** Manter dependências atualizadas e sem vulnerabilidades conhecidas.

```bash
# Verificar vulnerabilidades após qualquer instalação
npm audit

# Corrigir automaticamente quando possível
npm audit fix

# Verificar dependências desatualizadas
npm outdated
```

**Regras adicionais:**
- Rodar `npm audit` no pipeline CI/CD — falhar build se houver vulnerabilidades críticas
- Revisar `package.json` antes de aceitar código gerado por IA
- Nunca instalar pacote sem verificar no npmjs.com: downloads semanais e data de atualização

---

## A07 — Identification and Authentication Failures

**Regra:** Implementar autenticação robusta com OTP ou OAuth.

```javascript
// ✅ CORRETO — middleware de autenticação JWT
import jwt from 'jsonwebtoken'

export const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Token não fornecido' })

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.user = payload
    next()
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado' })
  }
}

// ✅ CORRETO — geração de OTP
import crypto from 'crypto'

export const generateOTP = () => {
  const otp = crypto.randomInt(100000, 999999).toString()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutos
  return { otp, expiresAt }
}
```

**Regras adicionais:**
- OTP nunca deve ser retornado na resposta da API — apenas enviado ao canal do usuário
- Invalidar OTP após uso bem-sucedido
- Bloquear conta após 5 tentativas inválidas consecutivas

---

## A08 — Software and Data Integrity Failures

**Regra:** Verificar integridade de dados recebidos de sistemas externos.

```javascript
// ✅ CORRETO — validar webhook com assinatura HMAC
import crypto from 'crypto'

export const validateWebhookSignature = (payload, signature, secret) => {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex')
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  )
}
```

**Regras adicionais:**
- Webhooks da Evolution API e Chatwoot devem ter assinatura validada
- Nunca executar código recebido de fonte externa
- Validar schema de payloads externos com Zod antes de processar

---

## A09 — Security Logging and Monitoring Failures

**Regra:** Registrar eventos de segurança relevantes. Ver `audit-logging.md`.

Eventos que SEMPRE devem ser logados:
- Tentativas de login (sucesso e falha)
- Alterações de permissão ou role de usuário
- Acesso negado (403)
- Erros de autenticação (401) em volume
- Operações de exclusão de dados

---

## A10 — Server-Side Request Forgery (SSRF)

**Regra:** Nunca fazer requisições HTTP com URLs fornecidas pelo usuário sem validação.

```javascript
// ❌ ERRADO — SSRF
const response = await fetch(req.body.webhookUrl)

// ✅ CORRETO — validar URL antes de usar
import { URL } from 'url'

const ALLOWED_HOSTS = ['api.evolution.com', 'sua-instancia.chatwoot.com']

export const isSafeUrl = (urlString) => {
  try {
    const url = new URL(urlString)
    return (
      ['http:', 'https:'].includes(url.protocol) &&
      ALLOWED_HOSTS.includes(url.hostname)
    )
  } catch {
    return false
  }
}
```

---

## Checklist OWASP por PR

Antes de aprovar qualquer Pull Request com código gerado por IA:

- [ ] A01: Verificação de propriedade do recurso implementada
- [ ] A02: Senhas com hash, dados sensíveis criptografados
- [ ] A03: Zero concatenação de input em queries
- [ ] A04: Rate limiting em rotas públicas e de autenticação
- [ ] A05: Headers de segurança configurados (Helmet)
- [ ] A06: `npm audit` sem vulnerabilidades críticas
- [ ] A07: Autenticação em todas as rotas protegidas
- [ ] A08: Webhooks com validação de assinatura
- [ ] A09: Eventos de segurança sendo logados
- [ ] A10: URLs externas validadas antes do uso
