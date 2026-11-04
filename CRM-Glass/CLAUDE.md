# CRM Glass — instruções do projeto

Produto comercial (SaaS web): CRM com visual glass, que vai crescer para agenda, cadastros (pessoas, filiais, produtos) e outros módulos. A direção visual está em `design/DIRECAO-VISUAL.md` e vale para tudo.

Estado atual: só front-end. Backend (NestJS ou Spring Boot, PostgreSQL) e multiempresa ainda não decididos.
Onde paramos, decisões em aberto e próximos passos: `CONTINUAR.md`.

## Pastas

| Pasta | Conteúdo |
|---|---|
| `design/` | Direção visual (fonte da verdade de estilo) |
| `prototipo/` | Protótipo visual com dados fictícios — ver `prototipo/README.md` |
| `.claude/agents/` | Time de agentes de front-end |
| `.claude/launch.json` | Configuração para abrir o protótipo no preview do app |

## Time de front-end (`.claude/agents/`)

| Agente | Papel |
|---|---|
| `glass-design-system` | Tokens, temas escuro/claro, destaque configurável, componentes base e casca do app |
| `motion-designer` | Transições de tela, elementos compartilhados, microanimações, fundo vivo, movimento reduzido |
| `frontend-modulos` | Telas de negócio (CRM, agenda, cadastros), rotas, formulários, tabelas, gráficos, API simulada |
| `revisor-ui` | Revisão somente leitura: fidelidade visual, contraste, acessibilidade, desempenho, consistência |

## Fluxo para uma tela nova

1. `frontend-modulos` levanta o que a tela precisa e lista componentes ou movimentos que faltam.
2. `glass-design-system` e `motion-designer` criam o que falta (podem rodar em paralelo, arquivos separados).
3. `frontend-modulos` monta a tela.
4. `revisor-ui` revisa; os achados voltam para quem é dono do arquivo.
5. O dono do produto aprova visualmente rodando a tela.

## Regras que valem para todos

- Nenhuma cor, sombra ou desfoque literal fora de `prototipo/src/styles/tokens.css`.
- Nenhuma duração ou curva de animação solta fora de `prototipo/src/motion/tokens.ts`.
- Textos da interface em português do Brasil; números, moeda e datas em pt-BR.
