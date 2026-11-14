# Decisões do dono (cronológico)

Data · decisão · porquê · nota

- 06/11/2026 · Visão de movimento: telas montam e desmontam em blocos; manter a troca de tema em vídeo · experiência, não só funcionalidade · [[aparencia-e-movimento]]
- 06/11/2026 · Backend Java 25 + Spring Boot 4.1, multi-tenant com `@TenantId`, OWASP desde o início · base comercial segura · [[contratantes]]
- 06/11/2026 · Front definitivo em `ero-web/`; protótipo congelado · separar laboratório do produto · [[aparencia-e-movimento]]
- 06/11/2026 · Aparência fixa por contratante, só o superadmin muda; login usa a aparência padrão · identidade do cliente · [[contratantes]]
- 06/11/2026 · Logs = trilha de segurança; retenção de 12 meses · [[logs-e-auditoria]]
- 11/11/2026 · 2FA só por código de e-mail, para todos, sempre · simplicidade e segurança uniforme · [[login-e-sessao]]
- 11/11/2026 · Limite de usuários ativos por contratante, definido pelo superadmin · modelo comercial · [[contratantes]]
- 11/11/2026 · Manter permissões por usuário + grupo, sem perfis · já melhor que o EroErp e o 2.0 · [[usuarios-e-acesso]]
- 12/11/2026 · Telas no padrão do EroErp 2.0 (kit T*, List/Form/FormList) com visual glass · fazer tela é copiar modelo · [[aparencia-e-movimento]]
- 14/11/2026 · Claro/escuro por usuário (revisa a decisão de 06/11) · preferência pessoal · [[contratantes]]
- 14/11/2026 · Fatia 3 aprovada: ADMIN faz tudo no contratante, último ADMIN protegido, telefone, Minha conta, acessar contratante, Logs com Exportar e Pdf · fechar o Administrativo · [[usuarios-e-acesso]], [[logs-e-auditoria]]
- 14/11/2026 · `codigo` sequencial por contratante em toda entidade com tela (entrega própria antes de pessoas) · número falável e imprimível · [[codigo-sequencial]]
- 14/11/2026 · Código revisado: coluna `cod_<entidade>` só nos cadastros de negócio (pessoa, emitente, pedido...), maior + 1 por contratante com índice único, sem tabela de contadores; contratante e usuário sem código · simples, e o código é para quem contratou o sistema · [[codigo-sequencial]]
- 14/11/2026 · Otimizações do custo do time aplicadas (um construtor por tela, Sonnet em frontend-modulos e revisor-ui, passada visual única) · custo alto · [[aparencia-e-movimento]]
