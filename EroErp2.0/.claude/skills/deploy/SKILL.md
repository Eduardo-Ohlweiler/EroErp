---
name: deploy
description: Publica o EroErp 2.0 num dos servidores (hostinger ou integrator), ou prepara a infraestrutura de publicação deles, pelo operador de deploy. Só roda quando o Eduardo chama.
argument-hint: "<hostinger | integrator | preparar hostinger | preparar integrator>"
disable-model-invocation: true
---

# /deploy

Pedido: **$ARGUMENTS**

## Preparar (`preparar <alvo>`)

Chame o `operador-deploy` para preparar o alvo: ele lê `deploy/README.md` (se
existir), faz as perguntas da primeira vez — leve-as ao Eduardo pelo
AskUserQuestion —, inspeciona o servidor só com comandos de leitura, e propõe os
arquivos. Os arquivos só são criados depois de o Eduardo aprovar a proposta, e
num commit numa branch `deploy/<alvo>`.

## Publicar (`hostinger` ou `integrator`)

1. Se `deploy/README.md` não tem o alvo como **pronto**, pare e sugira
   `/deploy preparar <alvo>`.
2. **Só da máquina de casa:** se `grep -q "^Host ero-hostinger" ~/.ssh/config`
   falhar (alias inexistente — é a máquina da empresa), pare e diga que o
   deploy é só de casa. Depois: `git status` limpo, branch `main`, `git pull` em dia. Senão,
   pare e diga o que falta.
3. Chame o `qa` só com os passos 1 e 2 dele (build e suíte). Vermelho, pare.
4. Chame o `operador-deploy` com o alvo e o relatório do `qa`. Ele mostra
   versão, commits, migrations e comandos e **espera o OK do Eduardo** antes de
   tocar no servidor — repasse a pergunta dele e a resposta do Eduardo, sem
   responder por ele.
5. Para o Eduardo: alvo, tag, backup, health, e o que ele deve conferir no
   navegador.

Nunca publique nos dois alvos numa execução só: um `/deploy` por alvo.
