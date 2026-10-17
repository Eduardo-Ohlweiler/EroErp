# Módulo de Serviços

> **Completo.** No EroErp antigo, serviço era uma linha de `produto` com
> `tipo_produto.classificacao = 'SERVICO'`. Aqui serviço e produto se separam:
> cada um tem cadastro e tela próprios, e **estoque é só de produto** — serviço
> não aparece na lista de estoque porque não está na tabela dele.
>
> Produto, auxiliares e estoque vieram na fatia seguinte
> ([docs/11](11-modulo-produtos-estoque.md)), com o preço de venda por filial
> **no estoque** (como no antigo) e o custo opcional no produto.

---

## 1. O que é um serviço aqui

| Campo | Para quê |
|---|---|
| `codigo` | número curto que gente lê — 1, 2, 3… **dentro do tenant**. Gerado pelo sistema, nunca editado |
| `nome` | único no tenant, sem diferenciar maiúscula nem acento |
| `observacao` | texto livre, até 2000 caracteres; em branco vira nulo |
| `ativo` | serviço não se apaga, inativa-se |
| valores por filial | `servico_filial`: uma linha por filial, com o valor **opcional** |

**O id é UUID e o código é outra coisa.** UUID ninguém dita ao telefone; o
código é para a lista, a busca e a conversa. No antigo, o `id` Long fazia esse
papel, e era global — o segundo cliente começava no 47.

**Vazio não é zero.** Valor em branco é gravado `NULL`, "não informado"; zero
digitado é zero — um retorno gratuito, por exemplo. A tela mostra o vazio como
o traço `AUSENTE`, nunca `R$ 0,00`. A API omite campo nulo no JSON (`non_null`),
então a ausência de `valor` é o "não informado".

**Serviço sem filial é válido.** A lista de valores é opcional; o que cada
módulo faz com um serviço sem valor naquela filial (pedido, ordem de serviço) é
decisão dele quando chegar.

---

## 2. O código por tenant — `tenant_sequencia`

Contador genérico (migration `019`), uma linha por `(tenant_id, chave)`. O
próximo número sai de um comando só:

```sql
INSERT INTO tenant_sequencia (tenant_id, chave, ultimo) VALUES (?, ?, 1)
ON CONFLICT (tenant_id, chave) DO UPDATE SET ultimo = tenant_sequencia.ultimo + 1
RETURNING ultimo
```

- trava a linha do contador até o commit: duas gravações simultâneas não
  repetem número;
- o `SequenciaService.proximo` é `@Transactional(MANDATORY)`: só se pede número
  de dentro da gravação que o consome, e um rollback o devolve — **sem buraco**
  (há teste: a gravação recusada depois de pegar o código não o gasta);
- a chave é constante em `SequenciaService` (`SERVICO`; `PRODUTO` quando vier).
  Renomear chave exige migration.

---

## 3. Regras

| Situação | Resposta |
|---|---|
| nome em branco, ou com mais de 150 caracteres | 400 |
| nome repetido no tenant (`INSTALACAO` × `Instalação`) | 409 |
| a mesma filial duas vezes na lista | 400 |
| filial de outro tenant | 404, e nada é gravado |
| filial inativa entrando na lista | 409 |
| valor negativo, ou com mais de 2 casas | 400 |
| serviço de outro tenant (GET, PUT, PATCH) | 404 |

A lista de filiais é o **estado completo**, como os contatos da pessoa: a filial
que veio grava, a que não veio sai. A filial é a chave da linha — não há id de
linha a mandar. A filial **que já estava** não é reconferida: inativada depois,
continua na lista, sinalizada (`filialAtiva: false`), e o valor dela ainda se
corrige.

O nome é conferido **antes** de mexer na entidade: a native da conferência
descarrega a sessão, e um nome repetido já sujo bateria no índice único antes
da frase. O índice `(tenant_id, lower(nome))` fica como rede para a corrida;
`unaccent` não é `IMMUTABLE` e não entra em índice.

---

## 4. O que mudou em relação ao antigo

| EroErp antigo (produto SERVICO) | EroErp 2.0 (Serviço) |
|---|---|
| linha de `produto`, com unidade, NCM, CEST, custo | tabela própria, só o que serviço tem |
| distinção por `tipo_produto.classificacao`, texto | tabela diferente — não há como confundir |
| preço de venda no `estoque`, por emitente; sem estoque, vendia a R$ 0,00 | `servico_filial.valor`, opcional; vazio é vazio |
| `codigo` Integer digitado, sem unicidade | código gerado, único e contado por tenant |
| nome sem unicidade | nome único no tenant |
| delete físico, 500 com FK quando em uso | sem delete |
| `/produtos/select` devolvia o DTO inteiro, com custo | `/servicos/select` traz só id, código e nome |
| `quantidade_sessoes_padrao` (clínica) | não veio — volta se a clínica vier |

---

## 5. API

| Método | Rota | Permissão |
|---|---|---|
| `GET` | `/servicos?termo=&filialId=&ativo=` | `SERVICOS_LER` |
| `GET` | `/servicos/{id}` | `SERVICOS_LER` |
| `GET` | `/servicos/select?termo=` | autenticado — combo de outras telas |
| `POST` | `/servicos` | `SERVICOS_ESCREVER` |
| `PUT` | `/servicos/{id}` | `SERVICOS_ESCREVER` |
| `PATCH` | `/servicos/{id}/ativo?ativo=` | `SERVICOS_ESCREVER` |

`termo` procura no nome (com `unaccent`) e, quando é só dígitos, também no
código exato. `filialId` traz os serviços que têm linha naquela filial, com
valor ou sem. Como a filial, a listagem pagina **ids** (native com `CAST`) e
carrega as linhas depois numa consulta só, com as filiais.

## 6. Permissão

`Tela.SERVICOS`, no módulo próprio `Modulo.SERVICOS`. Liberar Filiais não abre
Serviços, embora o serviço tenha valor por filial. O item do menu fica em
**Cadastros**, depois de Filiais, e só aparece para quem lê a tela.

## 7. A tela

- **Lista** (`/app/servicos`): busca por nome ou código, filtro por filial e
  situação. A coluna Valor mostra o valor único, a faixa "R$ 40,00 – R$ 60,00"
  quando há vários, ou o traço; com uma filial no filtro, o valor dela.
  Exporta e imprime o filtro inteiro, com os valores de cada filial.
- **Cadastro** (`/app/servicos/novo`, `/app/servicos/:id`): código em leitura
  ("Automático" até salvar), nome, observação e **Valores por filial** — cada
  linha com o combo de filial (as já escolhidas saem do combo das outras) e o
  valor com máscara de centavos, vazio continuando vazio. No celular, a linha
  empilha.
