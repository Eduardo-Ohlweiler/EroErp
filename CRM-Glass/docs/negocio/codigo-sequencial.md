# Código sequencial por contratante

**Status: regra fechada em 14/11/2026 e escrita nos docs técnicos. Em uso desde 20/11/2026, em [[pessoas]] e nos [[cadastros-auxiliares]]; em [[filiais]] desde 21/11/2026; em [[servicos]] desde 21/11/2026.**

## Regras vigentes

- Todo cadastro de negócio usado pelos clientes que contrataram o sistema (pessoa, filial, pedido, estoque...) tem uma coluna de código com o nome da tabela: `cod_pessoa` em `pessoa`, `cod_filial` em `filial`, `cod_pedido` em `pedido`, e assim por diante.
- Em uso: `cod_pessoa`, `cod_filial`, `cod_servico` e os códigos dos cadastros auxiliares (`cod_tipo_telefone`, `cod_categoria_servico` etc.).
- O código é sequencial **por contratante**: cada contratante começa no 1.
- Numeração: no salvar, o maior código do contratante + 1. Não há tabela de contadores nem sequence.
- Um índice único (contratante, código) impede número repetido quando dois salvam juntos. O sistema tenta de novo sozinho.
- Cadastro não é excluído (só inativado), então o número não volta a ser usado.
- O UUID continua sendo a chave, a ligação entre tabelas e o id na URL. O código é para falar e imprimir: nunca é digitado, nunca muda e nunca liga tabelas.
- Na tela: só leitura no Form (no Novo aparece vazio, com "Automático"), filtro "Código" com busca exata na List, primeira coluna da grade e dos relatórios.
- Contratante e usuário ([[contratantes]], [[usuarios-e-acesso]]) **não** têm código: são do Administrativo, não cadastros de negócio.

## Decisões do dono

- 14/11/2026: código sequencial por contratante em todo cadastro com tela.
- 14/11/2026 (revisão no mesmo dia): coluna `cod_<entidade>` (e não `codigo`), sem tabela de contadores, numerada por maior + 1 com índice único. Contratante e usuário ficam sem código. Combos e buscas de texto não aceitam o código por enquanto; combo "código · nome" pode entrar com pessoas.

- 16/11/2026: os cadastros auxiliares também têm código (`cod_tipo_telefone` etc.). Os itens do sistema recebem 1..N na ordem do enum, e o primeiro item do contratante continua do N+1.
- 20/11/2026: o combo "código · nome" entrou na seleção de pessoas (`PessoaSelectDto` leva `codPessoa`).
- 20/11/2026: Filiais ganhou `cod_filial` (o 2.0 não tinha), com o combo "código · nome" (`FilialSelectDto` leva `codFilial`).

## Em aberto

- Nada por enquanto. A peça comum que repete o salvar quando o índice único recusa nasceu (`RepetirSeCodigoRepetido`, até 3 tentativas).

## Doc técnico

- `docs/01-arquitetura-backend.md`, seção "Código do registro".
- `docs/05-banco-liquibase.md`, seção "Código do registro em cadastro de negócio".
- `docs/07-layout-de-telas.md`, §4.1 (filtro e coluna) e §4.2 (campo só leitura).
