# Módulo de Produtos, auxiliares e Estoque

> **Completo.** Do EroErp antigo, **sem a parte fiscal**: produto com custo
> opcional; unidade de medida global; grupo, subgrupo, categoria e marca por
> tenant; estoque só de produto, por filial, com o preço de venda dela, entrada,
> ajuste, transferência e o histórico. Serviço tem cadastro próprio
> ([docs/10](10-modulo-servicos.md)) e não aparece no estoque.

---

## 1. Produto

| Campo | Para quê |
|---|---|
| `codigo` | número curto por tenant (`tenant_sequencia`, chave `PRODUTO`), gerado e nunca editado |
| `nome` | único no tenant, sem diferenciar maiúscula nem acento |
| `descricao` | texto livre, até 2000; em branco vira nulo |
| `ean` | opcional; 8, 12, 13 ou 14 dígitos, **com o dígito verificador conferido**; único no tenant quando informado |
| `unidade_medida_id` | obrigatória — catálogo global |
| `subgrupo_id`, `categoria_id`, `marca_id` | opcionais, do tenant. O grupo vem do subgrupo |
| `fornecedor_id` | opcional; pessoa do tenant com o tipo de cadastro **Fornecedor** |
| `custo` | opcional — **vazio é `NULL`, não zero** |
| `ativo` | produto não se apaga, inativa-se |

**O preço de venda não mora no produto.** É por filial, na linha de estoque
(§3), como no antigo.

**O EAN diz o que está errado.** Só dígitos → tamanho → verificador, cada um com
a sua frase; o do verificador diz qual dígito seria (*"o dígito verificador
seria 7. Confira a digitação"*). EAN repetido diz de qual produto é
(*"O EAN … já é do produto 12"*). O mesmo EAN em tenants diferentes passa.

**Referência que entra tem de estar ativa; a que já estava fica.** Unidade,
subgrupo (e o grupo dele), categoria, marca e fornecedor são conferidos quando
**entram** no produto. Inativados depois, continuam lá, e o produto ainda se
altera — como a filial do serviço.

### Fora, de propósito

NCM, CEST, origem, substituição tributária, GTIN à parte, `tipo_produto` (a
"classificação" PRODUTO/SERVICO morreu com a tabela própria do serviço),
`quantidade_sessoes_padrao` (clínica) e a coluna órfã `produto.baixar_estoque`.

---

## 2. Auxiliares

| Tabela | Escopo | Regra |
|---|---|---|
| `unidade_medida` | **global**, seed na 021: UN, KG, G, LT, ML, CX, PC, MT, M2, M3 | só leitura (`/unidades-medida/select`); sigla única. H e SV do antigo não vieram |
| `grupo_produto` | tenant | nome único no tenant |
| `subgrupo_produto` | tenant, de um grupo | nome único **dentro do grupo** — "Diversos" pode existir em dois grupos |
| `categoria_produto` | tenant | nome único no tenant |
| `marca_produto` | tenant | nome único no tenant |

Nenhum se apaga — inativa-se. O combo (`/select`) só traz ativos; o de
subgrupo, só os de grupo ativo. O subgrupo pode mudar de grupo: os produtos vão
junto, porque apontam para o subgrupo. Grupo, categoria e marca têm o mesmo
serviço-base (`AuxiliarSimplesService`), que só recebe o nome da coisa para as
frases saírem certas ("uma categoria", "o grupo").

---

## 3. Estoque

Uma linha por **produto × filial** (`estoque`, único em `produto_id, filial_id`).

| Campo | Para quê |
|---|---|
| `quantidade` | `NUMERIC(15,3)`, `CHECK >= 0`. **Só muda por movimentação** — o PUT do cadastro não toca nela |
| `preco_venda` | o preço daquela filial. Opcional: vazio é `NULL` |
| `controla_estoque` | decidido no cadastro do estoque (§3.1) |
| `quantidade_minima` | opcional, só guardada — **sem alerta por enquanto**; o painel futuro a usa |
| `ativo` | linha não se apaga, inativa-se |
| `versao` | `@Version` |

### 3.1 Sem controle de estoque

A linha **existe** e vale pelo preço e pela situação, mas:
- não se movimenta (entrada, ajuste e transferência respondem 409);
- **não aparece** no combo das movimentações (`/estoques/movimentaveis`);
- a lista mostra "Não controla" no lugar do saldo, e o filtro Controle a separa.

### 3.2 Movimentação

`estoque_movimentacao` é o histórico, imutável. A quantidade é **com sinal**:

| Tipo | Quantidade |
|---|---|
| `ENTRADA` | positiva (inclui o "Saldo inicial" do cadastro) |
| `AJUSTE` | a diferença `nova − anterior`, com o sinal dela |
| `TRANSFERENCIA_SAIDA` | negativa, na origem |
| `TRANSFERENCIA_ENTRADA` | positiva, no destino |

CHECKs na migration 024 amarram `posterior = anterior + quantidade`, o sinal ao
tipo e o `transferencia_id` + `filial_contraparte_id` aos dois tipos de
transferência. `SAIDA` entra quando houver venda ou consumo.

**Toda movimentação trava a linha** (`SELECT … FOR UPDATE`, `EstoqueRepository.travar`)
antes de ler o saldo. A trava é só da linha do estoque, sem join — travar
produto e filial serializaria todo o movimento da filial. O `@Version` é a
segunda rede, e é ele que recusa o PUT do cadastro que leu uma versão velha
(409, *"Recarregue e tente de novo"* — `GlobalExceptionHandler`). Há teste de
12 entradas simultâneas: o saldo fecha e cada movimento parte de onde o anterior
parou.

**Ajuste** recebe a quantidade **contada** e exige motivo. Igual à atual é 400.

**Transferência** são dois movimentos com o mesmo `transferencia_id`, sem
cabeçalho. A filial de destino que ainda não tem o produto ganha a linha (com
controle, sem preço). As duas linhas são travadas **em ordem de id**: A→B e B→A
simultâneas não se travam uma à outra.

### 3.3 Regras

| Situação | Resposta |
|---|---|
| produto ou filial de outro tenant | 404, nada gravado |
| o mesmo produto duas vezes na filial | 409 |
| produto inativo ou filial inativa abrindo estoque | 409 |
| saldo inicial sem controle de estoque | 400 |
| movimentar linha sem controle, inativa, de produto ou filial inativos | 409, com a razão |
| entrada ou transferência com zero, negativo ou 4 casas | 400 |
| ajuste igual ao saldo, sem motivo ou negativo | 400 |
| transferir mais do que há | 409, *"Saldo insuficiente na filial X: há N UN"* |
| origem = destino | 400 |
| PUT concorrente com uma movimentação | 409 |

---

## 4. O que mudou em relação ao antigo

| EroErp antigo | EroErp 2.0 |
|---|---|
| `codigo` Integer digitado, sem unicidade | gerado, único e contado por tenant |
| nome, EAN e GTIN sem unicidade; EAN sem dígito verificador | nome e EAN únicos no tenant; verificador conferido |
| custo nulo virava 0 no `@PrePersist` | vazio é vazio |
| delete físico em produto e auxiliares (500 com FK) | sem delete |
| `/produtos/select` devolvia o DTO inteiro, com custo | id, código, nome e sigla da unidade |
| N+1 na lista de produto (grupo, fornecedor…) | ids paginados pela native, linhas carregadas numa consulta com tudo |
| busca de estoque por (emitente, produto) **sem tenant**; `/estoque/preco-venda` de qualquer cliente | toda consulta com tenant; não há rota de preço avulsa |
| saldo sem lock nem versão | `FOR UPDATE` + `@Version` |
| ajuste gravava `|nova − anterior|` | diferença com sinal; CHECK no banco |
| PUT do estoque zerava o mínimo de quem mandava só o bloqueio | PUT leva o estado completo; inativar tem rota própria |
| `custo_medio` copiado uma vez e nunca recalculado | não veio — volta com a compra |
| alerta de mínimo no dashboard | só o campo; o alerta vem com o painel |
| fornecedor: qualquer pessoa | pessoa com o tipo Fornecedor |

---

## 5. API

| Método | Rota | Permissão |
|---|---|---|
| `GET` | `/produtos?termo=&grupoId=&subgrupoId=&categoriaId=&marcaId=&ativo=` | `PRODUTOS_LER` |
| `GET` | `/produtos/{id}` | `PRODUTOS_LER` |
| `GET` | `/produtos/select?termo=` | autenticado — sem custo |
| `POST` · `PUT /{id}` · `PATCH /{id}/ativo` | `/produtos` | `PRODUTOS_ESCREVER` |
| `GET` | `/unidades-medida/select` | autenticado |
| `GET` | `/grupos-produto`, `/categorias-produto`, `/marcas-produto` (`?termo=&ativo=`), `/subgrupos-produto` (`+grupoId`) | `AUXILIARES_PRODUTO_LER` |
| `GET` | `…/select` dos quatro | autenticado |
| `POST` · `PUT /{id}` · `PATCH /{id}/ativo` | os quatro | `AUXILIARES_PRODUTO_ESCREVER` |
| `GET` | `/estoques?termo=&filialId=&produtoId=&controla=&ativo=` | `ESTOQUE_LER` |
| `GET` | `/estoques/{id}` | `ESTOQUE_LER` |
| `GET` | `/estoques/movimentaveis?filialId=&termo=` | `ESTOQUE_LER` — traz saldo |
| `GET` | `/estoques/movimentacoes?estoqueId=&filialId=&produtoId=&tipo=&de=&ate=` | `ESTOQUE_LER` — `ate` exclusivo |
| `POST` · `PUT /{id}` · `PATCH /{id}/ativo` | `/estoques` | `ESTOQUE_ESCREVER` |
| `POST` | `/estoques/{id}/entradas`, `/estoques/{id}/ajustes`, `/estoques/transferencias` | `ESTOQUE_ESCREVER` |

## 6. Permissão

Dois módulos: **Produtos** (telas `PRODUTOS` e `AUXILIARES_PRODUTO`) e
**Estoque** (tela `ESTOQUE`). Liberar Produtos não abre os auxiliares nem o
estoque; o `/select` de produto e dos auxiliares é de qualquer autenticado,
o `movimentaveis` não (traz saldo).

## 7. As telas

- **Produtos** (`/app/produtos`): busca por nome, código ou EAN; filtro por
  grupo, marca e situação. Cadastro com código "Automático", unidade, EAN,
  descrição, Classificação (grupo › subgrupo, categoria, marca) e Compra
  (fornecedor, custo com máscara de centavos, vazio continuando vazio).
- **Auxiliares de produto** (`/app/auxiliares-produto?aba=…`): uma aba para
  grupos, subgrupos, categorias e marcas; cadastro em linha, clique na linha
  edita. Rota própria, fora de `/produtos`, para o item de menu não acender
  junto.
- **Estoque** (`/app/estoque`): saldo e preço por produto × filial; filtros
  filial, controle e situação. O cadastro escolhe produto e filial (que não
  mudam depois), preço, controle, mínimo e saldo inicial; aberto, mostra o
  saldo e as últimas movimentações.
- **Movimentações** (`/app/estoque-movimentacoes`): o histórico com filtros de
  filial, produto, tipo e período, e os botões Entrada, Ajuste e Transferência
  (modais). O combo de produto é o `movimentaveis` da filial escolhida.

**A máscara da quantidade é pela unidade.** O banco guarda 3 casas para todas;
UN, CX e PC usam máscara inteira, o resto 3 casas (`utils/estoque.ts`). Com 3
casas numa unidade contável, quem digita "10" teria 0,010 — o erro provável é o
número pequeno, e ele passaria pela guarda do servidor.
