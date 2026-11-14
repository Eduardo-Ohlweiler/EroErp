# Plano: código sequencial por contratante (regra nos docs)

Branch: `timeero/codigo-sequencial`. Aprovado pelo Eduardo em 14/11/2026, depois de duas revisões de escopo.

## O que o Eduardo decidiu
- Nada de tabela `sequencia`. Cada cadastro de negócio futuro tem a coluna com o nome da tabela: `cod_pessoa` em `pessoa`, `cod_emitente` em `emitente`, `cod_pedido` em `pedido`, e assim por diante.
- Numeração: maior + 1 do contratante no salvar; o índice único `(tenant_id, cod_<tabela>)` recusa o repetido e o sistema tenta de novo.
- Contratante e usuário não ganham código.
- Form Novo: Código desabilitado, vazio, "Automático". Combos e buscas de texto sem código por enquanto.
- Nesta entrega: só a regra nos docs. O código nasce com o cadastro de pessoas.

## Entrega
- `docs/01`: seção "Código do registro" (entidade, `buscarProximoCodigo`, onde chamar no `criar`, nova tentativa, DTO, filtro, testes) e passo a passo.
- `docs/05`: coluna, índice único `uk_<tabela>_tenant_cod_<tabela>`, check `> 0`, preenchimento por `row_number()` quando a tabela já tem dados, linha na tabela de nomes.
- `docs/07`: filtro, primeira coluna e exportação na List (§4.1); campo só leitura com "Automático" no Form (§4.2).
- `docs/negocio`: `codigo-sequencial.md` reescrita, linha em `decisoes.md`, índice do README.
- Nenhum código de backend ou front muda.

## Conferência
- `revisor-backend` e `seguranca` leem o diff dos docs.
- `./mvnw verify` e vitest continuam verdes.
