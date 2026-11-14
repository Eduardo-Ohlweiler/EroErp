# Código sequencial por contratante

**Status: decisão aprovada em 14/11/2026, ainda não implementada.**

## Regra aprovada

Além do UUID (que continua a chave, a FK e o id na URL/API), toda entidade com tela própria ganha um `codigo` numérico sequencial **por contratante**. É só leitura no Form, filtro na List, primeira coluna da grade e aparece nos relatórios. Usuário e contratante ([[usuarios-e-acesso]], [[contratantes]]) serão os primeiros.

## Desenho combinado

- Tabela de contadores `sequencia(tenant_id, entidade, ultimo)` com `UPDATE ... RETURNING` na mesma transação do insert. Nada de `MAX()+1` nem sequence por tenant.
- Índice único `(tenant_id, codigo)`. O código nunca vem na entrada, nunca é reaproveitado e nunca é FK.
- Coluna chamada `codigo` em toda tabela (em vez de `cod_pessoa`). Peça única em `compartilhado` chamada no `criar`; a regra vai para `docs/01` e `docs/05`.
- O contratante usa um contador global. A migration preenche os dados existentes com `row_number()` por tenant.

## Quando

Entrega própria **depois da Fatia 3 e antes do 1º cadastro de negócio (pessoas)**. Todo módulo novo já nasce com `codigo`.

## Em aberto

- Só agendar a entrega.
