# Módulo de WhatsApp

> **Fase 3 completa: a conexão.** Um servidor Evolution API (v2) global, do
> superadmin; o modo de cada tenant (um número para o tenant inteiro ou um por
> filial); a conexão por QR, o status e o desconectar. Os envios — avisos da
> agenda, lembrete e pós-atendimento pela fila — são a Fase 4, e entram neste
> mesmo doc. O `EvolutionApi.enviarTexto` e o `WhatsappService.conexaoPara`
> já existem para ela, ainda sem quem os chame.
>
> No EroErp antigo havia dois caminhos para a Evolution: a "Configuração CRM",
> uma linha por cliente com URL, apikey e instância digitadas, e as instâncias
> de aviso por usuário, sobre uma configuração global. Aqui é um caminho só.

---

## 1. As três tabelas (migration 028)

| Tabela | Escopo | Para quê |
|---|---|---|
| `whatsapp_servidor` | global, **linha única** | URL e apikey do servidor Evolution, e se está ativo |
| `whatsapp_configuracao` | uma por tenant | o `modo`: `TENANT` ou `POR_FILIAL`. Sem linha, vale `TENANT` |
| `whatsapp_conexao` | tenant | a instância na Evolution: do tenant inteiro (`filial_id` nulo) ou de uma filial |

A linha única do servidor é um índice sobre constante
(`uk_whatsapp_servidor_unico ON ((true))`). As duas formas de conexão são
índices únicos **parciais** — `(tenant_id) WHERE filial_id IS NULL` e
`(tenant_id, filial_id) WHERE filial_id IS NOT NULL` —, porque `NULL` não
colide com `NULL` numa constraint única comum.

Na conexão:

| Campo | Para quê |
|---|---|
| `instancia` | gerada, `ero-<8 do tenant>-<8 aleatórios>`, **única no banco**: o servidor é de todos os tenants |
| `url`, `api_key` | sobrescrita do servidor global, só do superadmin. Nulas = o global |
| `numero` | só dígitos, com DDI, **como a Evolution informou** ao conectar |
| `status`, `status_em` | o último estado visto e quando mudou: `DESCONECTADO`, `AGUARDANDO_QR`, `CONECTADO` |
| `webhook_segredo` | 32 bytes aleatórios em base64url: o caminho do webhook |
| `ativo` | desativada pelo superadmin, não conecta nem envia |

---

## 2. A apikey é criptografada — `CriptoConverter`

O primeiro segredo de terceiro que o sistema guarda e precisa **reler**, então
hash não serve. `config/CriptoConverter` é um `AttributeConverter` AES-256-GCM:
IV aleatório de 12 bytes por gravação e a tag que denuncia cifra adulterada. A
coluna leva `v1:` + base64(iv ‖ cifra ‖ tag); o prefixo deixa trocar de
algoritmo ou de chave sem adivinhar o formato.

- A chave é `APP_CRIPTO_CHAVE`: 32 bytes em base64 (`openssl rand -base64 32`).
  **Sem ela, a API não sobe**, e o `run-dev.sh` já recusa antes. Os testes usam
  um valor fixo do `application-test.yml`.
- **Trocar a chave torna ilegível o que já foi gravado**: as apikeys precisam
  ser digitadas de novo.
- **Nenhuma resposta devolve apikey**, nem cifrada: só `possuiApiKey`. Apikey
  vazia num PUT ou PATCH mantém a gravada.
- O `DestinoEvolution` (URL + apikey de uma chamada) tem `toString` sem a
  chave, para ela não vazar num log ou numa exceção.

O teste que prova a cifra lê a **linha crua** com `JdbcTemplate` e confere que
ela começa com `v1:` e não contém a chave.

---

## 3. Quem vê o quê

| Quem | Vê | Faz |
|---|---|---|
| **Superadmin** | o servidor (URL, "apikey salva", webhook ligado ou não), o modo do tenant, e por conexão a instância e a sobrescrita, mais as conexões **fora do modo** | grava o servidor, troca o modo, ajusta e exclui conexões |
| **`WHATSAPP_ESCREVER`** e todo ADMIN | as conexões, com status e número | **Conectar (QR)** e **Desconectar** |
| **`WHATSAPP_LER`** | as conexões, com status e número | consulta o status |

São dois DTOs de conexão, e o `WhatsappMapper.toLinha` escolhe pela role:
`ConexaoResponseDto` para quem tem a permissão e `ConexaoAdminResponseDto`
(com `instancia`, `url`, `possuiApiKey`) para o superadmin. Os dois implementam
a interface selada `ConexaoDto`.

O superadmin mora no tenant do sistema: para ver o WhatsApp de um cliente, ele
**entra no tenant** pelo seletor do topo, como em qualquer módulo. O servidor é
global e aparece igual em qualquer tenant.

---

## 4. Modo e linhas da tela

- **`TENANT`**: uma linha, a conexão do tenant inteiro, que serve a todas as
  filiais.
- **`POR_FILIAL`**: uma linha por **filial ativa**, em ordem de nome.

Linha sem conexão gravada (nunca conectada) vem com `id` nulo e
`DESCONECTADO`: é nela que aparece o Conectar.

**Trocar de modo não apaga conexão.** A do outro modo, e a de filial que foi
inativada, vão para `foraDoModo` — só o superadmin as vê, para excluí-las. Quem
envia usa só a do modo atual.

**A resolução que a fila de envio vai usar** é `conexaoPara(tenantId, filialId)`:
no `TENANT`, a do tenant; no `POR_FILIAL`, a da filial; só a ativa. Recebe o
tenant porque a fila roda sem usuário logado.

---

## 5. Conectar, status, desconectar

**Conectar** (`POST /conexoes/conectar {filialId?}`):

1. Cria a linha se ainda não existe. `filialId` é recusado no `TENANT` e
   exigido no `POR_FILIAL` (400); filial inativa é 400. Sem servidor ativo, a
   linha nova nem nasce (409).
2. `criarInstancia`, idempotente: pergunta antes ao `connectionState`, e só
   cria no 404. O antigo tratava **qualquer** 403 como "já existe", o que
   engolia a apikey errada.
3. `configurarWebhook`, **só se houver `APP_PUBLIC_URL`**. Falhar aqui não
   impede o QR (o status segue pela tela) e vai para o log.
4. `conectar`: devolve o QR (`base64`, em geral já com `data:image/png;base64,`)
   e o `pairingCode`. Se a instância já estava conectada, vem sem QR e o status
   é gravado como `CONECTADO`.

Chamar de novo **renova o QR**: reaproveita a linha e a instância.

**Status** (`GET /conexoes/{id}/status`) pergunta à Evolution agora, grava e
devolve. É **o que faz a tela funcionar sem webhook**: o painel abre com o
último status gravado e logo pergunta por cada conexão; o modal do QR pergunta
a cada 3 s. Instância que o servidor não conhece está desconectada. Quando
conectada, o número vem do `fetchInstances` (`ownerJid`).

**Desconectar** faz `logout`, grava `DESCONECTADO` e limpa o número. A
instância fica no servidor, para conectar de novo.

**Excluir** (superadmin) apaga a instância no servidor e a linha aqui. Se o
servidor não responde, **nada é apagado**: a linha é o único caminho de volta
para uma instância que ficaria viva lá, com o número dentro.

**Sem transação em volta do HTTP.** Conectar, status, desconectar e excluir não
são `@Transactional`: a chamada à Evolution leva até 15 s, e segurar conexão do
banco durante ela esgotaria o pool. O banco vai em transações curtas pelo
`transacaoIndependente`, e o status é gravado relendo a linha, sem atropelar o
que o webhook gravou nesse meio-tempo.

**Timeouts** de 5 s para abrir e 15 s para responder (`EvolutionHttp`). Falha de
rede, de chave ou do servidor sai como `ServicoIndisponivelException` (503) com
a frase da tela: "não respondeu", "recusou a chave de acesso", "recusou a
operação (HTTP n)".

---

## 6. Webhook

`POST /integracoes/whatsapp/webhook/{segredo}`, **sem token** (`permitAll`). A
credencial é o segredo do caminho, um por conexão:

- segredo que não existe é **404**, como rota que não existe;
- só o `CONNECTION_UPDATE` (ou `connection.update`) é tratado: `data.state`
  vira o status, e no `open` o `data.wuid` vira o número. Os demais eventos
  respondem 200 e são ignorados;
- corpo com outra `instance` que não a da conexão é ignorado;
- o log leva o id da conexão, nunca o segredo nem o número (regra 5).

O `RateLimitFilter` cobre o caminho com um balde **por IP para todos os
segredos** (chutar segredos diferentes gasta do mesmo), e um teto próprio,
`app.seguranca.rate-limit-webhook-por-minuto` (120), porque a Evolution chama
em rajada.

O endereço vem de `APP_PUBLIC_URL` (`app.public-url`) +
`/integracoes/whatsapp/webhook/<segredo>`. Sem ela, o webhook não é
configurado, e a tela do superadmin diz isso ("Webhook desligado… o status é
consultado pela tela").

---

## 7. API

| Rota | Permissão |
|---|---|
| `GET` / `PUT /integracoes/whatsapp/servidor` | `SUPERADMIN` |
| `GET /integracoes/whatsapp` (modo e conexões) | `WHATSAPP_LER` |
| `PATCH /integracoes/whatsapp/modo` | `SUPERADMIN` |
| `POST /integracoes/whatsapp/conexoes/conectar` | `WHATSAPP_ESCREVER` |
| `GET /integracoes/whatsapp/conexoes/{id}/status` | `WHATSAPP_LER` |
| `POST /integracoes/whatsapp/conexoes/{id}/desconectar` | `WHATSAPP_ESCREVER` |
| `PATCH /integracoes/whatsapp/conexoes/{id}` (sobrescrita, ativo) | `SUPERADMIN` |
| `DELETE /integracoes/whatsapp/conexoes/{id}` | `SUPERADMIN` |
| `POST /integracoes/whatsapp/webhook/{segredo}` | público, pelo segredo |

Toda rota de conexão filtra pelo tenant efetivo: a conexão de outro tenant é
404, inclusive para o superadmin parado em outro tenant.

---

## 8. Permissão

`Modulo.WHATSAPP` ("WhatsApp") com `Tela.WHATSAPP`. As telas de mensagens
(avisos e pós-atendimento) entram no mesmo módulo na Fase 4.

---

## 9. A tela — Integrações › WhatsApp

`pages/integracoes/WhatsappConfig.tsx`, uma tela só:

- **Servidor Evolution** e **Modo deste tenant**, só com `hasRole('SUPERADMIN')`.
  A apikey é campo de senha, com "•••••••• salva" e "deixe em branco para
  manter".
- **Conexões**: uma linha por conexão, com a bolinha da cor da filial, o status,
  o número (`+55 (51) 99999-8888`) e desde quando. Conectar e Desconectar só com
  `podeEscrever('WHATSAPP')`; quem só lê vê uma frase dizendo isso. Para o
  superadmin, a instância, a sobrescrita, **Ajustes** e **Excluir**.
- **Fora do modo**, só para o superadmin e só quando houver.
- Falha ao consultar o status vira **uma frase** ("…o status mostrado é o
  último conhecido"), não um toast por linha.

**O modal do QR** (`components/whatsapp/QrCodeModal.tsx`) pergunta o status a
cada 3 s, pede outro QR a cada 35 s (o da Evolution vence em ~40 s) e na hora
em que a tentativa fecha sem leitura, e **fecha sozinho** ao conectar. O QR fica
em fundo branco fixo nos dois temas: o leitor do celular precisa do contraste.
Erro durante o polling aparece inline, e ele segue tentando. O antigo mostrava
o QR uma vez e pedia para apertar "Atualizar status".

Responsiva em 360 px: a linha empilha os botões debaixo dos dados.

---

## 10. O que mudou em relação ao antigo

| Antigo | Aqui |
|---|---|
| apikey em texto puro, `TEXT` | AES-GCM na coluna, nunca devolvida |
| instância digitada, sem unicidade; o webhook achava o tenant pelo nome | instância gerada, única; o webhook acha a conexão pelo segredo |
| webhook público em rota fixa, sem segredo | um segredo por conexão no caminho; errado é 404; rate limit |
| `CONNECTION_UPDATE` assinado e descartado | tratado: status e número |
| número digitado à mão | o da Evolution (`fetchInstances`, `wuid`) |
| sem desconectar nem excluir; apagar a linha deixava a instância viva | logout, e exclusão que apaga no servidor antes |
| qualquer 403 era "já existe" | pergunta antes; chave recusada é chave recusada |
| `RestClient` sem timeout, HTTP dentro de `@Transactional` | 5 s/15 s, HTTP fora de transação |
| `app.public-url` vazio conectava sem webhook, calado | sem URL pública o status vem pela tela, e a tela do superadmin diz |
| QR sem atualização; "Atualizar status" manual | polling de 3 s, QR renovado, modal fecha sozinho |
| URL, apikey e instância por cliente; e outra configuração global para avisos | um servidor global; a conexão só tem a instância, com sobrescrita opcional |

---

## 11. Testar com a Evolution de verdade

No `ero-erp-api/.env`:

```bash
APP_CRIPTO_CHAVE=...        # já gerada nesta máquina; em outra, openssl rand -base64 32
APP_PUBLIC_URL=             # opcional: https://... onde a Evolution alcança esta API
```

Subir a API, entrar como superadmin em Integrações › WhatsApp, gravar a URL e a
apikey global do servidor Evolution, e conectar pelo QR com o celular. Sem
`APP_PUBLIC_URL` (API só em `localhost`), tudo funciona pela consulta da tela;
com ela (um túnel, por exemplo), a Evolution também avisa pelo webhook.

---

## 12. Testes

`WhatsappTest` (Evolution mockada com `@MockitoBean`): apikey cifrada na linha
crua e ausente das respostas; apikey vazia mantém; painel inicial sem nada do
servidor para o ADMIN; conectar devolve o QR e reaproveita a linha; webhook
configurado só com URL pública; sem servidor, 409 e nenhuma linha; Evolution
fora, 503; status e desconectar; leitura não desconecta; sobrescrita do
superadmin cifrada e usada nas chamadas; desativada não conecta; excluir só do
superadmin; modo por filial, fora do modo e `conexaoPara`; isolamento entre
tenants; webhook com segredo errado (404), com o certo, com outro evento e com
outra instância.

`EvolutionHttpTest` roda o cliente contra um servidor HTTP local: caminhos, o
header `apikey`, os corpos da v2 (`WHATSAPP-BAILEYS`, `webhook` embrulhado,
`{number, text}`), o 401 que não vira "já existe", o número do `ownerJid`, o
404 e o 400 idempotentes do logout e da exclusão, e o servidor fora do ar.

`PermissaoTest`: o par leitura/escrita da tela, e servidor e modo fechados
mesmo para quem escreve.
