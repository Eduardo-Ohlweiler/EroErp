# Serviços

**Status: entregue em 21/11/2026 (branch `timeero/servicos`, migration 023). Plano: `PLANO-SERVICOS.md`.**

O que o contratante presta, em quais filiais e por quanto. Menu: **Cadastros › Serviços**. Categoria de serviço é um dos [[cadastros-auxiliares]].

## Regras vigentes

**Cadastro**
- Tabela própria, `servico`. Nunca um produto com tipo "serviço", como era no EroErp antigo.
- Campos: código, nome, categoria, duração, descrição, as filiais com o seu preço, situação e auditoria.
- **Obrigatórios: nome e pelo menos uma filial.** Categoria, duração, preço e descrição são opcionais.
- **Código** `cod_servico` por contratante ([[codigo-sequencial]]). É o **primeiro campo da tela**, visível e não editável, e mostra "Automático" até salvar.
- Nome com até 150 caracteres, único no contratante sem diferenciar acento nem maiúsculas. O 409 diz o código do serviço que já tem o nome.
- **Duração** em minutos, de 1 a 1440. A agenda vai usar para reservar o horário.
- Sem exclusão: só inativar e reativar.

**Filiais e preços**
- A lista de filiais do serviço diz **onde ele é prestado**. Filial fora da lista não oferece aquele serviço.
- **O preço é só por filial**, como no 2.0. Não há valor padrão no serviço.
- O preço é opcional. Vazio quer dizer "não informado" (será digitado no movimento); 0 quer dizer gratuito. Vazio nunca vira 0.
- **A filial não depende do serviço.** Filial sem nenhum serviço continua aparecendo em todo lugar: no combo do próprio cadastro e na agenda futura, que também serve para reuniões e outros compromissos.
- Filial já gravada e inativada depois continua na lista, com o selo "Filial inativa", e o preço dela ainda se corrige. Filial inativa nova é recusada. Inativar a filial não olha os serviços.
- O botão "Todas as filiais" acrescenta as filiais ativas que faltam. Ele traz no máximo 20 (o limite do `/api/filiais/selecao`) e avisa quando chega ao limite.

**Categoria**
- Auxiliar própria, "Categoria de serviço", **sem itens do sistema** (cada negócio fala de um jeito). Nome até 40 caracteres.
- Categoria inativa já gravada continua como "Nome (inativo)"; inativa nova é recusada.
- Cadastro rápido pelo "+" do combo, só para quem também escreve em Cadastros auxiliares (a API barra).

**Lista**
- Filtros: código, nome (sem acento), categoria, filial e situação (abre em "Ativo").
- Coluna Preço: a faixa entre as filiais ("R$ 90,00 – R$ 120,00", ou "—" se nenhuma tem preço) e, embaixo, "N filiais · M sem preço".
- Com uma filial no filtro: aparecem só os serviços prestados nela, a coluna vira "Preço na filial", e o Pdf vira a tabela de preços daquela filial.

**Acesso**
- Grupo `SERVICOS` (LER e ESCREVER), separado de Filiais.
- O combo de serviços (`/api/servicos/selecao`) é aberto a quem está logado e mostra **código e nome**, nunca preço nem duração.

## Regra para quem for consumir serviço (agenda, negócio, proposta)

- O movimento guarda o `servico_id` **e o retrato** do nome e do preço unitário, como o 2.0. Renomear ou mudar o preço do serviço não muda movimento passado.
- Serviço inativo, ou não prestado na filial do movimento, é recusado.
- Preço = o informado no movimento ou o da filial. Sem nenhum dos dois, a tela pede o valor.
- `ServicoService.buscarAtivo(id)` e `precoNaFilial(servicoId, filialId)` nascem com o primeiro consumidor, sem devolver entidade para o outro módulo.

## Decisões do dono

21/11/2026 (respostas do plano):
- Preço só por filial, como no 2.0, e opcional (vazio = não informado; 0 = gratuito).
- A filial entra já no cadastro: é onde o serviço é prestado. A agenda mostra toda filial, com ou sem serviço.
- Duração entra agora, opcional.
- Categoria entra agora, opcional.
- Obrigatórios: nome e filial. Código como primeiro campo, não editável. Combo mostra código e nome.
- Ficam para depois: profissionais habilitados, insumos, comissão, unidade de cobrança (hora, m²), sessões e pacotes.

## Em aberto

- Profissionais habilitados ("quem presta"): decidir antes se o profissional é pessoa ou usuário. Entra com a agenda.
- Insumos (com produtos e estoque), comissão (com vendas e financeiro), unidade de cobrança e pacotes.
- "Todas as filiais" para contratante com mais de 20 filiais: rota própria, se aparecer o caso.

## Doc técnico

- `docs/01-arquitetura-backend.md`: listas filhas (lista obrigatória no corpo), vários erros de campo num 400.
- `docs/04-permissoes.md`: grupo `SERVICOS`, rotas de `/api/servicos` e `/api/categorias-servico`.
- `docs/07-layout-de-telas.md`: `TDBCombo` com a bolinha da cor (`cor`, `corInicial`) e `TFieldList` com `acoes`.
