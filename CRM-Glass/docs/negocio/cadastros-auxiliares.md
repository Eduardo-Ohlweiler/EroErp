# Cadastros auxiliares

**Status: entregue em 20/11/2026 junto com [[pessoas]].**

São as listas de tipos que a pessoa escolhe. Menu: **Cadastros › Auxiliares**.

## Regras vigentes

- Cinco cadastros, cada um com a sua tabela e a sua tela (modelo FormList):
  - Tipo de cadastro: Cliente, Fornecedor, Funcionário, Lead, Outros;
  - Tipo de telefone: Celular, WhatsApp, Residencial, Comercial;
  - Tipo de e-mail: Particular, Comercial;
  - Tipo de endereço: Residencial, Comercial, Cobrança;
  - Tipo de rede social: Instagram, Facebook, LinkedIn, TikTok, X.
- **Itens do sistema** vêm pré-cadastrados em cada contratante. Não se editam, não se inativam (imutáveis, com trava no banco).
- **Itens do contratante**: ele cria, edita e inativa. "Excluir" é inativar; não há exclusão física.
- Nome de 1 a 25 caracteres, único no contratante sem diferenciar maiúsculas nem acento ("celular" = "Celular"), contando os do sistema.
- Item inativo some dos combos e continua aparecendo nas pessoas que já o usam, como "Nome (inativo)". Só aquela pessoa pode mantê-lo; tipo inativo novo é recusado.
- Código por tipo (`cod_tipo_telefone`, etc.): os do sistema são 1..N na ordem do enum, e o primeiro do contratante continua do N+1 ([[codigo-sequencial]]).
- Um grupo de permissão só, `CADASTROS_AUXILIARES`, com as 5 telas (LER e ESCREVER). Os combos leem pela rota `/selecao`, aberta a quem tem acesso liberado.
- Menu: o ícone "Auxiliares" abre um submenu flutuante com as 5 telas; a rota `/cadastros/auxiliares` sozinha leva à primeira tela liberada.

## Item novo do sistema

- Constante nova no **fim** do enum do tipo, mais uma migration que semeia os contratantes existentes. Se o contratante já tem um item com o mesmo nome, a migration o adota (preenche a `chave`) em vez de duplicar.
- Contratante novo recebe os itens na criação.

## Decisões do dono

- 16/11/2026: itens do sistema imutáveis, itens do contratante editáveis e inativáveis; tipo de pessoa fica em enum e os outros cinco viram auxiliares.
- 16/11/2026 (P2): item do sistema não pode ser inativado.

## Doc técnico

- `docs/03-multitenant.md` e `docs/05-banco-liquibase.md` (itens do sistema semeados por contratante).
- `docs/04-permissoes.md` (grupo e rotas).
- `docs/07-layout-de-telas.md` (modelo FormList e submenu).
