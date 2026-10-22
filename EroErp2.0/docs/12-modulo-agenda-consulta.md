# Módulo de Agenda e Consulta

> **Agenda e consulta completas.** A agenda vem do `compromisso` do EroErp
> antigo, redesenhado: o responsável é **escolhido** (a recepção agenda para o
> profissional), há **convidados**, e o conflito de horário é **por usuário** —
> o antigo travava o tenant inteiro. A consulta (§7: serviços, produtos e baixa
> de estoque) vem da `clinica/consulta` de lá e mora em cima do compromisso,
> sem copiar o horário nem ter status próprio. Avisos por WhatsApp,
> pós-atendimento e pacotes vêm depois (docs/13 e docs/14, quando chegarem).

---

## 1. O compromisso

| Campo | Para quê |
|---|---|
| `filial_id` | obrigatória — de onde é o atendimento, e a cor padrão |
| `responsavel_id` | o **usuário** que vai atender. A tela começa com o logado e deixa trocar |
| `pessoa_id` | o cliente; compromisso interno (reunião) não tem. O de uma consulta tem sempre |
| `titulo`, `descricao` | até 255 e 2000 caracteres |
| `cor` | opcional; vazia **herda a da filial** (`corExibicao` na resposta) |
| `inicio`, `fim` | `timestamptz`, `fim > inicio`, no máximo 24 horas |
| `status` | `AGENDADO · CONFIRMADO · EM_ATENDIMENTO · CONCLUIDO · CANCELADO · FALTOU` — em atendimento só na consulta (§7) |
| `motivo_cancelamento` | só existe no cancelado (CHECK) |
| `serie_id`, `tipo_recorrencia` | as ocorrências de uma recorrência; andam juntos (CHECK) |
| `compromisso_convidado` | outros usuários do tenant que participam; até 20 |

Quem digitou fica em `created_by` e aparece na tela como "Agendado por…" — não
se confunde com o responsável.

### Fora, de propósito

- **Delete físico.** Cancela-se. O antigo apagava a série inteira e estourava a
  FK quando havia consulta ligada.
- **Duração por serviço, horário de funcionamento, bloqueio de agenda.** Não
  havia no antigo e não foram pedidos; entram quando houver uso.
- **Editar a série inteira.** Alterar mexe só na ocorrência; cancelar oferece
  "este e os seguintes".

---

## 2. Regras

**Conflito é por usuário.** Um usuário está ocupado num intervalo quando é
responsável **ou convidado** de um compromisso que não está cancelado nem
marcado como falta e que se sobrepõe (`inicio < fim' AND fim > inicio'`;
encostado não conta).

- Choque do **responsável** recusa com 409, nomeando o compromisso e a hora.
- Choque de **convidado** não bloqueia: a tela avisa e deixa salvar.

`POST /compromissos/disponibilidade` responde, sem gravar, quem está ocupado
nos horários do formulário — uma linha por ocorrência — e `bloqueia` quando
algum choque é do responsável. É o mesmo cálculo que o salvar usa para recusar.
Usuário de outro tenant não ganha nome nem choque.

**Recorrência.** Diário, semanal, quinzenal (14 dias, mesmo dia da semana — o
antigo somava 15), mensal, trimestral, semestral e anual, de 2 a 52
ocorrências. A n-ésima é calculada **a partir da primeira**, no fuso
`app.acesso.fuso-horario`: "todo dia 31" volta ao 31 depois de fevereiro, e
"toda semana às 14h" fica às 14h de parede. Choque do responsável em qualquer
ocorrência recusa a série inteira. Domingo não é empurrado em silêncio: a
prévia mostra o dia da semana.

**Datas editadas na prévia.** Antes de salvar, cada data da série pode ter o
dia e as horas mudados, ou ser tirada (um feriado no meio não vira um
compromisso cancelado depois). A tela manda então `ocorrencias`, a lista como
ficou, e o servidor grava **exatamente ela**, não a que regeneraria:

- cada data passa pelas mesmas guardas (fim depois do início, até 24 horas) e
  pelo mesmo conflito do responsável;
- duas datas da lista que se sobrepõem são recusadas, nomeando as duas;
- `ocorrencias` sem `recorrencia` é 400;
- se sobra uma data só, ela vira um compromisso avulso, sem série.

A disponibilidade aceita a mesma lista, para o choque da data editada aparecer
antes de salvar.

**Situação.** Só os abertos (`AGENDADO`, `CONFIRMADO`, `EM_ATENDIMENTO`) mudam:

- confirmar: de agendado;
- concluir: de qualquer aberto — **menos o compromisso que é consulta**, que se
  conclui pela consulta (409 *"Este compromisso é uma consulta: conclua pela
  consulta"*), porque é lá que o estoque baixa;
- faltou: só depois do horário de início, e nunca em atendimento (409 *"Em
  atendimento: conclua ou cancele"* — a pessoa veio);
- cancelar: com motivo opcional; numa série, "este e os seguintes ainda abertos";
- alterar o horário de um confirmado o devolve a agendado — a confirmação era
  do horário anterior.

Concluído, cancelado e falta não voltam e não se alteram. Em atendimento ocupa
o horário como os outros abertos.

**Referências.** Filial, responsável, cliente e convidados novos têm de estar
ativos e no tenant. O que já estava gravado não é reconferido ao alterar: o
compromisso de um responsável inativado ainda tem a descrição corrigida. O
compromisso de uma consulta não perde o cliente (400 *"A consulta precisa de um
cliente"*), nem pela agenda. E a agenda não troca a filial dele (409 *"Este
compromisso é uma consulta: mude a filial pela consulta"*): os produtos precisam
de estoque na filial nova, e quem confere isso é a consulta (§7.4). O resto do
compromisso continua se alterando pela agenda.

---

## 3. O que mudou em relação ao antigo

| Antigo | Aqui |
|---|---|
| responsável = quem digitou | responsável escolhido; quem digitou em `created_by` |
| sem convidados | `compromisso_convidado` |
| conflito global no tenant | por usuário; convidado só avisa |
| `cancelado` + `concluido` booleanos | um `status` com CHECK, mais confirmado, em atendimento e falta |
| `TIMESTAMP` sem fuso | `timestamptz`; recorrência calculada no fuso do sistema |
| série por autorreferência | `serie_id` comum |
| quantidade de recorrência sem teto; domingo empurrado | 2 a 52; sem empurrar |
| delete físico | cancelamento |
| calendário só na hora de início, 24 h fixas, sem celular | altura pela duração, sobrepostos lado a lado, quatro visões responsivas |

---

## 4. API

| Método | Rota | Permissão |
|---|---|---|
| GET | `/compromissos/calendario?inicio&fim&filialId&usuarioId` — até 62 dias; `usuarioId` casa responsável ou convidado | `AGENDA_LER` |
| POST | `/compromissos/disponibilidade` — não grava | `AGENDA_LER` |
| GET | `/compromissos/{id}` | `AGENDA_LER` |
| POST | `/compromissos` — devolve a lista de ocorrências | `AGENDA_ESCREVER` |
| PUT | `/compromissos/{id}` | `AGENDA_ESCREVER` |
| PATCH | `/compromissos/{id}/confirmar` · `/concluir` · `/faltou` · `/cancelar` | `AGENDA_ESCREVER` |
| GET | `/usuarios/select` — responsável e convidados; aberto a autenticado, só id e nome do tenant efetivo | autenticado |

O detalhe e o calendário trazem `consultaId` quando o compromisso é consulta. A
API da consulta está no §7.

## 5. Permissão

Módulo `ATENDIMENTO` ("Agenda e atendimento"), telas `AGENDA` e `CONSULTAS`.
São liberadas à parte: quem só tem Consultas abre, edita e conclui a consulta —
e o compromisso dela — sem abrir o calendário; quem só tem Agenda vê o
compromisso, mas não o converte.

No cadastro novo o responsável já vem com o usuário logado, e na edição, com o
responsável salvo. A exceção é o superadmin **dentro de outro tenant** (troca
de tenant): lá ele não é usuário, o servidor recusaria (404), e por isso a tela
não o pré-seleciona nem mostra "Meus". No tenant do sistema ele é usuário como
qualquer outro.

## 6. As telas

- **`/app/agenda`** — Dia, Semana, Mês e Lista sobre a mesma consulta da
  janela visível; **abre sempre no Mês**. Filtros de filial e de "responsável
  ou convidado" (com atalho **Meus**) vão ao servidor; "Mostrar cancelados"
  filtra na tela. Imprimir sai como relatório da janela, com os filtros
  escritos.
- **No Mês se agenda e se edita direto.** Clicar num dia abre o cadastro com
  aquele dia, início na hora atual e fim uma hora depois (`?dia=`); clicar num
  compromisso abre o formulário dele (em edição se aberto, travado se
  encerrado) — ou a consulta, se ele é uma e o usuário lê Consultas. O "+N
  mais" leva à visão Dia daquele dia. Quem só lê vai à visão Dia ao clicar no
  dia.
- **Dia e Semana**: bloco com altura pela duração, sobrepostos em colunas,
  linha da hora atual, e a grade abre rolada no primeiro compromisso do
  período. Clicar no horário vazio abre o cadastro naquela meia hora
  (`?inicio=`); clicar no bloco abre o resumo com as ações de situação.
- **O bloco que é consulta** leva o ícone da ficha, em todas as visões. O
  resumo dele oferece **Abrir consulta**; o de um compromisso aberto com
  cliente, **Iniciar consulta** (a quem escreve em Consultas). Concluir não
  aparece no compromisso que é consulta, e no formulário da agenda a Filial dele
  vem travada, com a dica de que se muda pela consulta.
- **No celular** vale o mesmo no Mês (pontos no lugar dos títulos; tocar no
  dia abre o cadastro), e a semana vira uma faixa de dias tocáveis com a grade
  do dia escolhido.
- **`/app/agenda/novo`** e **`/app/agenda/:id`** — responsável (primeiro
  campo; o logado no cadastro novo, o salvo na edição), convidados
  (`TComboMulti`, chips com busca), título, filial, cliente (com cadastro
  rápido), dia e horas, recorrência (só ao criar) e cor. Enquanto se preenche,
  a disponibilidade atualiza sozinha: choque do responsável em vermelho, de
  convidado em aviso. Esses campos são o `CamposCompromisso`, o mesmo da
  consulta.
- **A prévia da série** (`PreviaSerie`) lista as datas marcando as que chocam.
  Em cada uma, o lápis muda o dia e as horas ali mesmo, e o × a tira (a última
  não sai). Em cima aparece "N alteradas · M tiradas", com **Desfazer
  alterações**. Mexer no dia, nas horas, no tipo ou na quantidade refaz a
  lista, e um aviso diz isso enquanto houver mudanças.

---

## 7. A consulta

A consulta é o atendimento sobre um compromisso, com serviços e produtos. Ela
guarda **só o que é do atendimento**; horário, filial, cliente, responsável,
convidados e a situação moram no compromisso. Duplicados, divergiriam — no
antigo divergiam.

### 7.1 Modelo (migrations 026 e 027)

| Tabela | Campos |
|---|---|
| `consulta` | `compromisso_id` NOT NULL **UNIQUE**, `observacao` (2000), ajuste geral (`tipo_ajuste_geral`, `tipo_calculo_geral`, `valor_ajuste_geral`), `consulta_origem_id` (reconsulta), `created_by`/`updated_by` |
| `consulta_servico` | `servico_id`, `descricao` (retrato do nome), `quantidade` INT > 0, `preco_unitario` NUMERIC(15,2) ≥ 0 (retrato), ajuste do item, `ordem` |
| `consulta_produto` | o mesmo com `produto_id` e `quantidade` NUMERIC(15,3) > 0 (as casas da tela vêm da unidade) |

Os itens saem com a consulta (ON DELETE CASCADE). Os três campos de ajuste andam
juntos (CHECK): `DESCONTO`/`ACRESCIMO`, `FIXO`/`PERCENTUAL`, valor > 0 e
percentual até 100. A 026 refaz `ck_compromisso_status` com `EM_ATENDIMENTO`;
a 027 dá a `estoque_movimentacao` o tipo `SAIDA_CONSULTA` e o `consulta_id`
(docs/11 §3.2).

A agenda sabe da consulta pelo `Compromisso.consultaId`, uma `@Formula` lida no
mesmo SELECT — um `@OneToOne` inverso seria uma ida ao banco por bloco do
calendário.

### 7.2 Nascer

`POST /consultas` de um dos dois jeitos, nunca dos dois (400):

- `{ compromissoId }` **converte** um compromisso aberto que ainda não é consulta
  (já é: 409; encerrado: 409 com a frase da situação);
- `{ compromisso: {...} }` **cria o compromisso junto**, com o corpo do PUT da
  agenda. O `CompromissoService.criarAvulso` reaproveita as validações e o
  conflito do responsável do `create`, sem copiar regra.

Junto vêm a observação, os itens e o ajuste geral. **Cliente obrigatório**: sem
pessoa, 400 *"A consulta precisa de um cliente"*.

### 7.3 Itens e permissão

Os itens vão no `POST` e num `PUT /consultas/{id}` só, com o compromisso — como
a pessoa e os contatos. Cada lista é o **estado completo**, e:

- lista **nula não mexe**: quem não vê serviços não apaga os que existem;
- lista **enviada** sem `SERVICOS_LER` (ou `PRODUTOS_LER`) é **403** — também no
  `/calculo` e no `/preco`;
- a resposta **omite** a lista que o usuário não lê. Os totais vêm sempre, e a
  tela diz que incluem o que ele não vê;
- itens só mudam com o compromisso aberto.

O item que volta com o `id` (e o mesmo serviço) mantém o retrato da descrição;
o mesmo id duas vezes na lista é 400.

### 7.4 Preço

- `precoUnitario` nulo → o catálogo da filial do compromisso: serviço em
  `ServicoFilial.valor`, produto em `Estoque.precoVenda`. Num item já gravado,
  o preço que ele tinha.
- Informado → vale, com guarda ≥ 0 (zero é zero).
- Nulo e catálogo vazio → 400 nomeando o item: *"Informe o preço de X: a filial
  não tem valor para ele"*. Vazio não é zero.
- Fica gravado como **retrato**, com a descrição: mudar o catálogo depois não
  reescreve a consulta.

**Produto** precisa de linha de estoque **ativa** na filial (409 *"X não tem
estoque nesta filial"*) — o combo da tela já só traz esses
(`GET /consultas/produtos`). Mudar a filial do compromisso — só pela consulta —
reconfere os produtos que já estavam, mandando a lista ou não; a prévia
`/consultas/calculo` faz a mesma conferência. A resposta publica `controlaEstoque` e, quando
controla, `saldoDisponivel`, para a tela avisar a falta antes de concluir; o
aviso não bloqueia.

### 7.5 Ajuste e totais

Por item e no total, com as guardas do CHECK e mais uma: **o desconto não passa
da base** (*"Desconto de X passa do valor do item (R$ 150,00)"*, *"Desconto
geral passa do subtotal"*). A conta mora num lugar só, `CalculoConsulta`, e é
o servidor que publica:

- por item: `subtotal = quantidade × preço`, `ajuste` **com sinal** (desconto
  negativo) e `total = subtotal + ajuste`;
- na consulta: `subtotalServicos`, `subtotalProdutos`, `subtotal` (a soma dos
  totais dos itens), `ajusteGeral` com sinal e `total = subtotal + ajusteGeral`.

Duas casas, HALF_UP, a cada passo — o número que se lê é o que entra na soma. O
teste trava a invariante somando o que veio publicado.

**`POST /consultas/calculo`** faz a mesma conta, com as mesmas guardas, **sem
gravar**, e devolve também o preço que entrou em cada item. Com `consultaId`, a
lista que não veio vale a gravada: o total de quem não vê serviços continua
certo.

### 7.6 Situação — a do compromisso

| Ação | De | Para |
|---|---|---|
| `PATCH /consultas/{id}/iniciar` | agendado, confirmado | em atendimento |
| `PATCH /consultas/{id}/concluir` | qualquer aberto | concluído, **com a baixa** |
| `PATCH /consultas/{id}/cancelar` · `/faltou` | delegam ao `CompromissoService` | |

Itens, observação e ajustes ainda mudam em atendimento: o que se usou se acerta
durante a consulta.

**Cancelar pela consulta cancela só ela.** "Este e os seguintes" é da série, e a
série é da agenda: `escopo=SEGUINTES` aqui é 400, e quem só escreve em Consultas
não cancela as outras datas. **Falta não vale em atendimento** (409, §2).

Confirmar segue pela agenda; cancelar e falta também podem ir por lá — com a
situação única, não há o que sincronizar.

**Concluir** trava a consulta (a segunda conclusão simultânea espera e lê a
primeira já feita), soma as quantidades por produto e, **em ordem de produto**,
chama `EstoqueService.saidaPorConsulta`: o mesmo caminho das outras
movimentações (achar a linha → travar → conferir → movimentar). Produto sem
controle de estoque não baixa. Saldo insuficiente é 409 *"Saldo insuficiente de
X na filial Y: há N UN"*, e a transação inteira volta — inclusive a baixa de um
produto anterior que já tinha passado. Concluída não volta nem se altera.

**Reconsulta** (`POST /consultas/{id}/reconsulta {inicio, fim, responsavelId?}`)
agenda uma consulta nova com a mesma filial e o mesmo cliente, o responsável
original salvo outro indicado, e passa pelo conflito dele. Os itens vêm
copiados **sem ajuste**, com o preço do catálogo de hoje — ou o retrato antigo,
se o catálogo está vazio. Só se copia o que ainda se usa: serviço ativo,
produto ativo com estoque ativo na filial. Vale de qualquer consulta, inclusive
cancelada ou com falta — é como se remarca quem faltou.

### 7.7 API

| Rota | Permissão |
|---|---|
| `GET /consultas?filialId&responsavelId&pessoaId&status&de&ate` — native com `CAST`, da mais recente; `ate` exclusivo | `CONSULTAS_LER` |
| `GET /consultas/{id}` | `CONSULTAS_LER` |
| `POST /consultas/calculo` — não grava | `CONSULTAS_LER` (+ Serviços/Produtos para mandar as listas) |
| `GET /consultas/preco?filialId&servicoId\|produtoId` — filtrado por tenant (o antigo vazava entre tenants) | `CONSULTAS_LER` + `SERVICOS_LER` ou `PRODUTOS_LER` |
| `GET /consultas/produtos?filialId&termo` — o combo: estoque ativo na filial | `CONSULTAS_LER` + `PRODUTOS_LER` |
| `POST /consultas` · `PUT /consultas/{id}` | `CONSULTAS_ESCREVER` |
| `PATCH /consultas/{id}/iniciar` · `/concluir` · `/cancelar` · `/faltou` | `CONSULTAS_ESCREVER` |
| `POST /consultas/{id}/reconsulta` | `CONSULTAS_ESCREVER` |

### 7.8 As telas

- **`/app/consultas`** — filtros de filial, responsável, cliente, situação e
  período (sobre o compromisso); grade que vira cartão no celular; total por
  linha; Relatório e Planilha cobrindo o filtro inteiro.
- **`/app/consultas/nova`** e **`/app/consultas/:id`**, em abas:
  - **Atendimento**: o `CamposCompromisso` (o mesmo da agenda, cliente
    obrigatório) e a observação. Vindo da agenda (`?compromissoId=`), os campos
    do compromisso ficam travados até salvar: ele já existe, e a conversão só
    grava ao salvar;
  - **Serviços** — só com `podeLer('SERVICOS')`: combo de `/servicos/select`,
    e cada item com quantidade, preço (preenchido por `/consultas/preco`; vazio
    diz *"Sem preço nesta filial: informe"*), ajuste e os valores publicados;
  - **Produtos** — só com `podeLer('PRODUTOS')`: o combo da filial, a
    quantidade pela unidade, o saldo, e o aviso quando falta;
  - **Resumo**: o ajuste no total e os totais de `/consultas/calculo` (debounce;
    a recusa aparece inline, também nas abas de itens, e não no toast).
- **Botões por situação**: Iniciar atendimento; Concluir (confirma listando o
  que vai baixar e quanto há; com alteração não salva, pede para salvar antes);
  Cancelar e Faltou (o `AcoesCompromisso` da agenda, com as ações da consulta —
  sem a escolha "este e os seguintes", e sem Faltou em atendimento);
  Reconsulta (dia e horas); Na agenda.
- **Imprimir** sai como "Resumo da consulta": situação e totais na tira,
  serviços e produtos (os que o usuário vê) e a observação.
