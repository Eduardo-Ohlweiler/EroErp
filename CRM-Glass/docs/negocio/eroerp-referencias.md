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

## Pesquisa de 16/11/2026: Pessoas

Fonte: EroErp 2.0 (`EroErp2.0/ero-erp-api` e `EroErp2.0/ero`). Detalhes de regra em [[pessoas]] e [[cadastros-auxiliares]].

**Trazido**
- Física e jurídica na mesma tabela, vários tipos de cadastro por pessoa.
- Telefones, e-mails, redes sociais e endereços, cada um com tipo, e um item principal por lista.
- Cidade do IBGE e CEP pelo ViaCEP.
- Vínculos entre pessoas (4 tipos do 2.0, mais Contato ↔ Empresa), cadastro rápido em modal e seleção para combos.
- Os 5 tipos auxiliares, com os valores iniciais do 2.0.
- Lista com filtros, Exportar e Pdf.

**Não copiado**
- Catálogos globais de tipos sem contratante: aqui os itens do sistema são semeados por contratante, e o filtro de tenant fica automático.
- `razao_social` separada: na jurídica o Nome vira "Razão social".
- RG recusado com 409 sem índice por trás: aqui o RG não é único.
- `/select` de pessoas aberto a qualquer um: aqui exige `PESSOAS_LER`.
- `unaccent` do banco: aqui a busca usa `nome_busca`, calculado no Java.
- Filhas (telefone, e-mail...) casadas por `id`: aqui a lista é o estado completo e substitui a anterior.
- Tenant filtrado à mão em cada consulta.

## Pesquisa de 20/11/2026: dados complementares de Pessoas

Caminhos relativos a `ero-erp-api/src/main/java/com/api/ero_erp` (antigo) e `EroErp2.0` (2.0).

**Conclusão:** o antigo (`ero/`, `ero-erp-api/`) só tinha CNH, Categoria e Validade. O 2.0 não tinha nada disso. Estado civil, profissão, nacionalidade, naturalidade, filiação, representante legal, banco, PIX, CNAE e regime tributário não existem em nenhum dos dois: são projeto novo, sem cópia.

**O que veio do antigo**
- CNH: `pessoa.cnh`, `cnh_categoria` e `cnh_validade` (migration 012 de lá), só pessoa física.

**O que não foi copiado**
- Categoria da CNH em texto livre (VARCHAR 5): aqui é enum (A, B, AB, C, D, E, AC, AD, AE).
- CNH sem dígito verificador, só "11 dígitos": aqui o DV é conferido.
- O "só grava se preenchido" do `PessoaService`, que não deixava limpar o campo.
- CNH no filtro da lista: aqui fica só na ficha (LGPD).
- A `razao_social` separada do nome (decisão de 16/11: o Nome vira "Razão social").
- Título de eleitor, PIS, CTPS e escolaridade (só RH), limite de crédito, condição de pagamento e vendedor (pertencem ao pedido), foto e anexos (módulo de arquivos).

**Ficou para depois**
- Fiscais (regime, contribuinte de ICMS, CNAE principal e secundários): quando houver nota fiscal. O `docs/09` do 2.0 diz o mesmo.
- Bancários e PIX: quando houver cobrança, em tabela ligada, com número da conta e chave PIX cifrados.

**Gerador de contratos do antigo (referência futura)**
- `ModeloDocumento`: nome, descrição, `conteudo` (TEXT) e ativo.
- `Documento`: modelo, emitente, pessoa cliente, valores, forma de pagamento, parcelas, status e **`conteudoGerado`**, o texto final congelado na emissão. O contrato emitido não muda se o modelo mudar.
- `DocumentoTagService` troca tags por `String.replace`: `[cliente_pessoa_nome]`, `_cpf`, `_rg`, `_razao_social`, `[emitente_pessoa_*]`, `[contrato_valor_final]`, `[data_atual]`.
- Faltavam tags de endereço, telefone, e-mail, estado civil, profissão, CNH e representante: exatamente os campos novos.
- Defeitos a evitar: tag desconhecida fica no texto sem aviso; `replace` em cadeia (valor com colchetes vira tag); CPF sem máscara; número do contrato igual ao id.
- Aqui, a flexão "(a)" virá do sexo e da `chave` do estado civil.

## Pesquisa de 20/11/2026: Filiais

Fonte: `EroErp2.0/docs/09-modulo-filiais.md` (e `10` a `12`, que usam filial) e o código do 2.0. Próximo módulo do CRM Glass (ver `CONTINUAR.md`).

**O que trazer**
- A filial **não duplica cadastro**: aponta para uma Pessoa (física ou jurídica). Endereço, contatos, IE, IM, razão e fantasia são da pessoa; a tela mostra em leitura, com o link "Abrir em Pessoas" (só com `PESSOAS_LER`).
- Tabela `filial`: pessoa (obrigatória), tipo MATRIZ ou FILIAL, matriz (autorreferência), cor `#RRGGBB`, ativo, auditoria. Único por (contratante, pessoa): uma pessoa é uma filial só.
- Trava no banco: MATRIZ sem matriz e FILIAL com matriz; matriz diferente dela mesma.
- Regras:
  - pode haver várias matrizes por contratante;
  - a pessoa precisa ser do contratante, ativa e ainda não ser filial (409);
  - a matriz da filial precisa ser do tipo MATRIZ, ativa e do contratante;
  - matriz com filhas não vira FILIAL;
  - matriz com filial ativa não inativa (409 com a contagem) e filial de matriz inativa não reativa;
  - sem exclusão, só inativar.
- Cor obrigatória, `^#[0-9A-Fa-f]{6}$`, gravada em maiúsculas.
- Lista agrupando cada matriz seguida das suas filiais; filtros Nome, CPF/CNPJ, Tipo e Situação (padrão Ativa); bolinha de cor ao lado do nome.
- Form: combo de Pessoa com botão de cadastro rápido, Tipo, Matriz (só se FILIAL), Cor e o painel "Dados da pessoa" em leitura.
- Combo de filiais (`/filiais/select`, só ativas) aberto a quem está logado, para outras telas.
- Grupo de permissão próprio (`FILIAIS_LER` e `FILIAIS_ESCREVER`), separado de Pessoas; item em Cadastros.
- Código `cod_filial` pela regra do [[codigo-sequencial]] (o 2.0 não tinha).
- Outros módulos recebem a filial por registro e conferem se é do contratante e ativa. Não existe filial padrão nem filtro automático por filial.

**O que não copiar**
- Do ERP antigo (emitente): matriz podia ser qualquer pessoa, até ela mesma; "bloqueado" só valia no combo; exclusão física com erro 500; N+1 no combo; sem trava no banco; cor validada só no cadastro.
- Do 2.0: SQL nativo com `unaccent` e segunda consulta por ids (aqui, JPQL com nome e `CAST`); tenant lido à mão.
- Logo, regime tributário, CNAE, numeração de nota e certificado: só entram quando houver emissão de nota. Não fazem sentido no CRM.

**Decisões em aberto (perguntar ao dono)**
- **Usuário preso a filial.** O 2.0 não tem vínculo usuário-filial nem "filial atual" na sessão: cada registro carrega a sua filial. Decidir se o CRM Glass segue assim ou prende o usuário a uma ou mais filiais, com filial atual no token e filtro automático.
- **Cor da filial contra a regra de tokens.** A regra do projeto proíbe cor literal fora de `tokens.css`, mas a filial guarda uma cor `#RRGGBB` escolhida pelo contratante. Decidir como exibir: paleta fixa de tokens (guarda a chave, não o hex) ou cor livre aplicada como dado, com contraste conferido.

## Onde olhar

EroErp antigo em `../ero-erp-api` e `../ero`; EroErp 2.0 em `../EroErp2.0`.

Ver [[aparencia-e-movimento]] e [[usuarios-e-acesso]].
