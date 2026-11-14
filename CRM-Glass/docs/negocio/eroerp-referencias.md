# Referências do EroErp e do EroErp 2.0

Para não pesquisar de novo. O agente `pesquisa-eroerp` procura só o que não estiver aqui.

## O que o CRM Glass trouxe

- **Padrão de telas do 2.0:** kit `T*` com os mesmos nomes e props, larguras por escala, modelos List/Form/FormList, label em cima, botões de ação com as cores do 2.0 (`docs/07`).
- **Padrão de relatórios do 2.0** (`docs/15` de lá): moldura com logo, barra na cor do contratante, filtros na 1ª página, rodapé com "Página X de Y" (`docs/08`).
- **Estrutura de pastas do backend por módulo** (`entity/ repository/ dtos/ mapper/ service/ controller/`) e grupos de liberação LER/ESCREVER com ações extras.
- **Auditoria "criado por / alterado por"** nas respostas (`criadoPorNome`, `alteradoPorNome`).
- **Gerar senha temporária no cadastro** (como no formulário de contratante).

## O que não copiar

- Filtro de tenant manual: o CRM Glass usa `@TenantId` automático.
- `findById` e `findAll` soltos: aqui toda consulta tem JPQL com nome.
- TOTP e códigos de recuperação do login: saíram em 11/11/2026.
- Perfis de permissão: mantido o modelo por usuário + grupo (já melhor que os dois ERPs).

## Pesquisa de 14/11/2026: usuários, acesso, menu, conta e logs (Fatia 3)

Caminhos de front relativos a `EroErp2.0/ero/src/`.

**Usuários**
- Lista: `pages/usuario/UsuarioList.tsx`.
  - Situação em badge com três estados (Bloqueado, Ativo, Inativo).
  - Filtros: nome com debounce, cliente, nível e situação.
  - Ação "Desbloquear" na grade, só quando a conta está bloqueada.
- Form: `pages/usuario/UsuarioForm.tsx`.
  - Painéis empilhados (Dados, Acesso aos módulos, Senha), com o tenant fixo na edição.
- **Trazido:** badge de três estados, Desbloquear, painéis, senha redefinida revogando sessões.
- **Não copiado:**
  - lá não há Inativar/Reativar na tela; aqui nasceu, e ninguém inativa a si mesmo;
  - lá só o superadmin cadastra usuários; aqui o ADMIN cadastra até o limite.

**Grade de permissões**
- Lá: `components/usuario/PermissoesUsuario.tsx`. É por **tela** (Sem acesso, Leitura, Escrita), agrupada por módulo.
- Não serve de modelo, porque aqui são **grupos LER/ESCREVER + ações extras**. Desenho próprio: `TRadio` por grupo e `TCheckBox` por ação.

**Acessar contratante**
- `components/layout/TenantSwitcher.tsx`: seletor com busca, faixa "navegando como o tenant X" e Sair, sem recarregar a página (token em memória).
- **Trazido**, com faixa, seletor no chip e ação na grade.
- **Armadilha:** o switch de lá não reemite o refresh token.

**Menu**
- `components/layout/Sidebar.tsx`: constante `GRUPOS` fixa no front.
- **Defeito, não copiado:** é um catálogo duplicado entre front, enum e menu. Aqui o menu sai de `eu.telas`.

**Minha conta**
- `pages/perfil/Perfil.tsx`: nome e telefone editáveis.
- **Defeito, não copiado:** "o nome no topo atualiza no próximo acesso". Aqui o nome atualiza na hora.

**Logs**
- `pages/loginlog/LoginLogList.tsx`: só log de acesso, com filtros de escopo, resultado, De/Até e IP. Relatório com `DocumentoLista` e resumo.
- **Trazido:**
  - motivo da falha por enum com rótulo;
  - retenção;
  - consulta e exportação com o **mesmo** objeto de filtro (lá a lógica era duplicada em `carregarTudo`).

## Onde olhar

EroErp antigo em `../ero-erp-api` e `../ero`; EroErp 2.0 em `../EroErp2.0`.

Ver [[aparencia-e-movimento]] e [[usuarios-e-acesso]].
