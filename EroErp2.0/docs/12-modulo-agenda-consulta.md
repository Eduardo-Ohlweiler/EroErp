# Módulo de Agenda e Consulta

> **Agenda completa; consulta é a próxima fatia.** Vem do `compromisso` do
> EroErp antigo, redesenhado: o responsável é **escolhido** (a recepção agenda
> para o profissional), há **convidados**, e o conflito de horário é **por
> usuário** — o antigo travava o tenant inteiro. A consulta (serviços,
> produtos e baixa de estoque) entra em cima do compromisso, sem copiar o
> horário. Avisos por WhatsApp, pós-atendimento e pacotes vêm depois
> (docs/13 e docs/14, quando chegarem).

---

## 1. O compromisso

| Campo | Para quê |
|---|---|
| `filial_id` | obrigatória — de onde é o atendimento, e a cor padrão |
| `responsavel_id` | o **usuário** que vai atender. A tela começa com o logado e deixa trocar |
| `pessoa_id` | o cliente; compromisso interno (reunião) não tem |
| `titulo`, `descricao` | até 255 e 2000 caracteres |
| `cor` | opcional; vazia **herda a da filial** (`corExibicao` na resposta) |
| `inicio`, `fim` | `timestamptz`, `fim > inicio`, no máximo 24 horas |
| `status` | `AGENDADO · CONFIRMADO · CONCLUIDO · CANCELADO · FALTOU` |
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

**Situação.** Só os abertos (`AGENDADO`, `CONFIRMADO`) mudam:

- confirmar: de agendado;
- concluir: de qualquer aberto;
- faltou: só depois do horário de início;
- cancelar: com motivo opcional; numa série, "este e os seguintes ainda abertos";
- alterar o horário de um confirmado o devolve a agendado — a confirmação era
  do horário anterior.

Concluído, cancelado e falta não voltam e não se alteram.

**Referências.** Filial, responsável, cliente e convidados novos têm de estar
ativos e no tenant. O que já estava gravado não é reconferido ao alterar: o
compromisso de um responsável inativado ainda tem a descrição corrigida.

---

## 3. O que mudou em relação ao antigo

| Antigo | Aqui |
|---|---|
| responsável = quem digitou | responsável escolhido; quem digitou em `created_by` |
| sem convidados | `compromisso_convidado` |
| conflito global no tenant | por usuário; convidado só avisa |
| `cancelado` + `concluido` booleanos | um `status` com CHECK, mais confirmado e falta |
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

## 5. Permissão

Módulo `ATENDIMENTO` ("Agenda e atendimento"), tela `AGENDA`. A consulta entra
como outra tela do mesmo módulo.

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
  encerrado). O "+N mais" leva à visão Dia daquele dia. Quem só lê vai à
  visão Dia ao clicar no dia.
- **Dia e Semana**: bloco com altura pela duração, sobrepostos em colunas,
  linha da hora atual, e a grade abre rolada no primeiro compromisso do
  período. Clicar no horário vazio abre o cadastro naquela meia hora
  (`?inicio=`); clicar no bloco abre o resumo com as ações de situação.
- **No celular** vale o mesmo no Mês (pontos no lugar dos títulos; tocar no
  dia abre o cadastro), e a semana vira uma faixa de dias tocáveis com a grade
  do dia escolhido.
- **`/app/agenda/novo`** e **`/app/agenda/:id`** — responsável (primeiro
  campo; o logado no cadastro novo, o salvo na edição), convidados
  (`TComboMulti`, chips com busca), título, filial, cliente (com cadastro
  rápido), dia e horas, recorrência (só ao criar) e cor. Enquanto se preenche,
  a disponibilidade atualiza sozinha: choque do responsável em vermelho, de
  convidado em aviso.
- **A prévia da série** (`PreviaSerie`) lista as datas marcando as que chocam.
  Em cada uma, o lápis muda o dia e as horas ali mesmo, e o × a tira (a última
  não sai). Em cima aparece "N alteradas · M tiradas", com **Desfazer
  alterações**. Mexer no dia, nas horas, no tipo ou na quantidade refaz a
  lista, e um aviso diz isso enquanto houver mudanças.
