# CRM Glass — instruções do projeto

Produto comercial (SaaS web): CRM com visual glass, que vai crescer para agenda, cadastros (pessoas, filiais, produtos) e outros módulos. A direção visual está em `design/DIRECAO-VISUAL.md` e vale para tudo.

Estado atual:
- **Front:** o definitivo nasce em `ero-web/`, por fatias (a 1ª é login, casca, Minha conta e módulo administrativo). O `prototipo/` fica congelado como laboratório visual e referência de movimento.
- **Backend:** fundação pronta em `ero-api/` (Java 25 + Spring Boot 4.1, PostgreSQL, multi-tenant). Já tem segurança OWASP, login com 2FA, contratantes, usuários e permissões.

Onde paramos, decisões em aberto e próximos passos: `CONTINUAR.md`.

## Pastas

| Pasta | Conteúdo |
|---|---|
| `design/` | Direção visual (fonte da verdade de estilo) |
| `ero-web/` | Front definitivo (React 19 + Vite + React Router 7 + TanStack Query), ligado à ero-api |
| `prototipo/` | Protótipo visual congelado (dados fictícios). Referência de movimento. Ver `prototipo/README.md` |
| `ero-api/` | Backend Spring Boot (API REST) |
| `docs/` | Arquitetura e regras do backend (01 a 05) |
| `.claude/agents/` | Time de agentes |
| `.claude/skills/timeero/` | Orquestração do time (`/timeero`) |
| `.claude/launch.json` | `ero-web` (porta 5173), `prototipo` (porta 5180) e `ero-api` (porta 8080) no preview do app |

## Backend: regras inegociáveis

Detalhes em `docs/01` a `docs/05`. O `ArquiteturaTest` reprova o build quando alguma destas regras de estrutura é quebrada.

1. **Estrutura fixa por módulo:** `entity/ enums/ repository/ dtos/ mapper/ service/ controller/ util/`, nada além disso. Módulo novo copia a forma do módulo-modelo **`usuario`**. Não se inventa pasta, padrão ou camada nova (nada de `usecase/`, `dto/`, `impl/`).
2. **Tenant automático:** entidade de negócio estende `TenantEntity`. Ninguém filtra nem recebe `tenantId` à mão. SQL nativo só em repository com `@SqlNativoRevisado`. `TenantContext.comoRoot` só em auth, seguranca ou plataforma.
3. **DTO sempre:** controller recebe e devolve só `record ...Dto`. Conversão só no mapper estático. Entrada nunca traz `id`, `tenantId` nem auditoria.
4. **Toda rota declara quem pode:** `@PreAuthorize` com `<GRUPO>_LER` nos GET e `<GRUPO>_ESCREVER` no resto. Tela nova nasce com seu grupo em `GrupoLiberacao` (ver `docs/04-permissoes.md`).
5. **Consultas com nome:** JPQL explícito no repository (`buscarPorId`, `buscarComFiltros`...). Nada de `findById`/`findAll`. Parâmetro String opcional em função SQL sempre com `CAST(:p AS string)`.
6. **Banco só por Liquibase:** `changes/NNN-descricao.xml`. Migration aplicada não se edita.
7. **Nada sensível em log:** senha, token, CPF, e-mail inteiro. Use `LogSeguro` e prefira o id.
8. **Teste mínimo por módulo:** caminho feliz, validação recusada, isolamento entre dois tenants e o par LER/ESCREVER. `mvnw verify` verde antes de entregar (precisa do Docker ligado).

Rodar: `ero-api/run-dev.cmd` (Windows) ou `cd ero-api && ./mvnw spring-boot:run -Dspring-boot.run.profiles=dev`. Os segredos de dev ficam em `ero-api/.env` (fora do git; o modelo é o `.env.example`).

## Time (`.claude/agents/`) e o `/timeero`

| Agente | Papel | Escreve em |
|---|---|---|
| `planejador` | Transforma o pedido em plano (back + front + permissões + testes) e levanta dúvidas | nada |
| `dev-backend` | Implementa o backend seguindo `docs/01` e o módulo `usuario` | `ero-api/` |
| `glass-design-system` | Tokens, temas, destaque configurável, componentes base e casca do app | front: design system |
| `motion-designer` | Transições de tela, microanimações, fundo vivo, movimento reduzido | front: `motion/` |
| `frontend-modulos` | Telas de negócio, rotas, formulários, tabelas, gráficos, integração com a API | front: módulos |
| `revisor-backend` | Revisão do backend contra o padrão (só lê) | nada |
| `seguranca` | Checklist OWASP de `docs/02` em toda entrega; achado de segurança bloqueia (só lê) | nada |
| `revisor-ui` | Fidelidade visual, contraste, acessibilidade, desempenho (só lê) | nada |
| `qa` | Build, testes, API rodando, bateria entre tenants, uso como usuário | só pasta temporária |
| `operador-deploy` | Imagem Docker, compose por contratante, backup. Servidor só com OK do dono | `deploy/` |
| `pesquisa-eroerp` | Procura no EroErp e no EroErp2.0 o que já foi resolvido (só lê) | nada |

`/timeero <pedido>` executa a esteira completa: pesquisa → plano aprovado pelo dono → backend → front → revisões em paralelo → QA → correções (no máximo 2 voltas) → resumo com quem fez o quê. Push e merge são sempre do dono.

### Fluxo de uma tela nova (front)

1. `frontend-modulos` levanta o que a tela precisa e lista os componentes ou movimentos que faltam.
2. `glass-design-system` e `motion-designer` criam o que falta (podem rodar em paralelo, arquivos separados).
3. `frontend-modulos` monta a tela.
4. `revisor-ui` revisa e os achados voltam para quem é dono do arquivo.
5. O dono do produto aprova visualmente rodando a tela.

## Regras que valem para todos

- Nenhuma cor, sombra ou desfoque literal fora de `ero-web/src/styles/tokens.css`.
- Nenhuma duração ou curva de animação solta fora de `ero-web/src/motion/tokens.ts`.
- Textos da interface e mensagens da API em português do Brasil; números, moeda e datas em pt-BR (a API manda ISO-8601 e o front formata).
- Na dúvida sobre regra de negócio, pergunte ao dono do produto (Eduardo) em vez de assumir.
