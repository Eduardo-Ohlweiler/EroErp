# Código sequencial por contratante

**Status: regra fechada em 14/11/2026 e escrita nos docs técnicos. O primeiro cadastro a usar é pessoas.**

## Regras vigentes

- Todo cadastro de negócio usado pelos clientes que contrataram o sistema (pessoa, emitente, pedido, estoque...) tem uma coluna de código com o nome da tabela: `cod_pessoa` em `pessoa`, `cod_emitente` em `emitente`, `cod_pedido` em `pedido`, e assim por diante.
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

## Em aberto

- A peça comum que repete o salvar quando o índice único recusa nasce com o cadastro de pessoas.

## Doc técnico

- `docs/01-arquitetura-backend.md`, seção "Código do registro".
- `docs/05-banco-liquibase.md`, seção "Código do registro em cadastro de negócio".
- `docs/07-layout-de-telas.md`, §4.1 (filtro e coluna) e §4.2 (campo só leitura).
