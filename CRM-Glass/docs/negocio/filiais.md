# Filiais

**Status: entregue em 21/11/2026 (branch `claude/filiais-439d4b`, migration 022). Segundo cadastro de negócio do CRM Glass.**

Plano de origem: `PLANO-FILIAIS.md`. A filial aponta para uma [[pessoas|pessoa]]. Regra de código: [[codigo-sequencial]]. Pesquisa no 2.0: [[eroerp-referencias]], "Pesquisa de 20/11/2026: Filiais".

## Regras vigentes

**Cadastro**
- A filial **não duplica cadastro**: aponta para uma pessoa, física ou jurídica. Endereço, contatos, documentos, IE e IM são da pessoa.
- A filial guarda só: tipo (Matriz ou Filial), a matriz, a cor e a situação.
- Uma pessoa é uma filial só, por contratante. A mesma pessoa (CNPJ igual) pode ser filial em dois contratantes.
- Pode haver várias matrizes por contratante, cada uma com as suas filiais. Profundidade 1: a matriz de uma filial é sempre do tipo Matriz.
- Código `cod_filial` sequencial por contratante, só leitura na tela ([[codigo-sequencial]]).
- Nada de excluir: só inativar e reativar.
- Nada fiscal (logo, regime, CNAE, série de nota, certificado): entra quando houver nota fiscal, como no 2.0.

**Cor**
- Cor livre `#RRGGBB`, obrigatória ("Escolha a cor"), gravada em maiúsculas.
- É **dado do usuário**, não token: ver [[aparencia-e-movimento]], "Cor de registro".
- Conferida em três lugares: no DTO, no banco (CHECK) e no kit, antes de aplicar.

**Regras da pessoa e da matriz**
- A pessoa escolhida precisa ser do contratante, ativa e ainda não ser filial.
  - 409 no campo: "Esta pessoa está inativa." e "Esta pessoa já é a filial código N.". Numa corrida rara, sai sem o código: "Esta pessoa já é uma filial.".
- Trocar a pessoa de uma filial já gravada é permitido. A pessoa nova passa pelas mesmas regras.
- A pessoa que não mudou não é reconferida: pessoa inativa continua.
- Matriz não tem matriz; filial tem (400 no campo Matriz). A filial não pode ser a própria matriz (400).
- A matriz escolhida precisa ser do tipo Matriz e estar ativa (409 no campo Matriz).
- A matriz que não mudou não é reconferida: filial inativa de matriz inativa ainda troca a cor.
- Matriz com filiais não vira filial: "Esta matriz tem N filiais. Mude a matriz delas antes de transformá-la em filial." (409 no campo Tipo).
- Inativar matriz com filial ativa: 409 com a contagem ("Esta matriz tem 2 filiais ativas. Inative-as antes.").
- Reativar filial de matriz inativa: 409 ("A matriz desta filial está inativa. Reative a matriz antes.").
- Se a matriz mudar entre a leitura e a trava, reativar dá 409 ("A matriz desta filial acabou de ser alterada por outro usuário. Recarregue e tente de novo."). É raro.
- Pessoa ou matriz que não existe no contratante dá **404** ("Pessoa não encontrada.", "Matriz não encontrada."). Pela tela não acontece; só por chamada direta. Ver `docs/01`, "Referência inexistente no corpo".
- As regras com outra linha (matriz ativa e do tipo Matriz) são conferidas com a matriz travada. Assim duas pessoas salvando juntas não deixam filial ativa em matriz inativa.

**Pessoa inativa**
- Inativar a pessoa **não olha a filial**: a filial continua ativa e usável (P1, como no 2.0).
- A lista e o cadastro da filial mostram o aviso "Pessoa inativa" ao lado do nome.
- Reativar a filial não confere a pessoa.

**Acesso**
- Grupo próprio `FILIAIS` (LER e ESCREVER). Liberar Pessoas não abre Filiais.
- O combo de filiais das outras telas (`/api/filiais/selecao`) é aberto a quem está logado. Por isso **não leva CPF nem CNPJ**: só código, nome, tipo e cor. A busca é por nome ou fantasia.
- **Escolher a pessoa da filial exige também `PESSOAS_LER`**, conferido na API: no cadastro novo e quando o PUT troca a pessoa. Sem ele, 403: "Você não tem permissão para escolher a pessoa da filial. Peça ao administrador o acesso a Pessoas.".
- O PUT com a mesma pessoa (cor, tipo, matriz) não exige `PESSOAS_LER`.
- Na tela, quem não lê Pessoas vê o combo Pessoa travado, com ajuda. Numa filial já gravada, ainda altera a cor e a matriz.

**Tela**
- Lista (modelo List) em **ordem fixa e agrupada**: cada matriz seguida das suas filiais. Matrizes pelo nome, filiais pelo nome dentro da matriz. A grade não ordena por coluna, e a API recusa `sort`.
- Filtros: código, nome ou fantasia, CPF ou CNPJ, tipo e situação. A Situação abre em "Ativo".
- A bolinha da cor fica ao lado do nome. Exportar e Pdf não levam a cor.
- Cadastro (modelo Form): Pessoa (com cadastro rápido), Tipo, Matriz (só na filial) e Cor.
- Cadastro novo abre com Tipo = Matriz e **sem cor**: a escolha da cor é consciente.
- Painel "Dados da pessoa", só leitura: CPF ou CNPJ; na jurídica, razão social, fantasia, Data de abertura, IE e IM; o endereço principal. Botão "Abrir em Pessoas". Sem `PESSOAS_LER`, o painel mostra só o aviso.
- O celular ganhou o "Mais" na barra inferior: acima de 5 itens, o 5º lugar abre o resto (P2).
- Inativar a filial não olha os serviços; o serviço que já a tinha mostra "Filial inativa" ([[servicos]]).

## Decisões do dono

20/11/2026 (antes do plano):
- Como no 2.0: **sem vínculo usuário-filial** e sem "filial atual" na sessão ou no token. Os movimentos futuros guardam o seu `filialId`, com filtro opcional nas listas deles.
- **Cor livre** `#RRGGBB`, escolhida pelo usuário. É dado do usuário, não token do sistema.
- A branch de Filiais parte da `main` depois do merge de Pessoas. Com a mudança de ordem do mesmo dia, depois dos dados complementares de Pessoas: a migration passou a ser a 022.

20/11/2026 (respostas do plano):
- P1: pessoa inativada que é filial ativa segue o 2.0. Pessoas não bloqueia, e a filial mostra "Pessoa inativa".
- P2: barra inferior do celular acima de 5 itens: o 5º lugar vira "Mais", que abre o submenu flutuante que já existe.

## Em aberto

- `FilialService.buscarAtiva(id)` para um módulo que precise de uma filial só (agenda, negócio). Nasce com o primeiro que precisar.
- Resolvido em 21/11/2026, com [[servicos]]: `FilialService.buscarPorIds(ids)` (o primeiro módulo que usa filial) e a bolinha da cor no `TDBCombo` (o combo Matriz já mostra).

## Doc técnico

- `docs/01-arquitetura-backend.md`: referência inexistente no corpo (404 aqui, 400 nas filhas de pessoa).
- `docs/04-permissoes.md`: grupo `FILIAIS`, rotas, `/selecao` aberto, `PESSOAS_LER` para escolher a pessoa.
- `docs/05-banco-liquibase.md`: FK composta autorreferente (`matriz_id`).
- `docs/07-layout-de-telas.md`: `TCor`, `TCorMarca`, nota "Cor de registro" e o "Mais" da casca.
