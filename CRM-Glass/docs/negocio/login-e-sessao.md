# Login e sessão

## Regras vigentes

- **Sem autocadastro.** Quem cria usuários é o ADMIN do contratante (ver [[usuarios-e-acesso]]); o contratante e o primeiro administrador nascem pelo superadmin ([[contratantes]]).
- **Todo login tem duas etapas, para todos, sempre** (superadmin incluído, também em dev): senha certa devolve só um desafio e manda um **código de 6 dígitos por e-mail**; a sessão só abre com o código. Não existe TOTP, QR nem código de recuperação.
- O código vale **10 minutos desde o 1º envio** e é de uso único. "Reenviar" manda o **mesmo** código, no mínimo 60 s entre envios e no máximo 5 envios.
- Limite de 10 códigos novos por usuário por hora (a 11ª tentativa com a senha certa recebe 429).
- Erros de senha ou de código contam juntos: **5 erros bloqueiam a conta por 15 minutos**. A mensagem de falha é genérica (não diz se o e-mail existe).
- **Token de acesso de 15 minutos**, só em memória no navegador (nunca localStorage). **Refresh** em cookie httpOnly que gira a cada uso; reutilizar um refresh já usado derruba a sessão.
- Logout, troca de senha e inativação do usuário derrubam as sessões. Trocar a senha encerra as outras sessões.
- **Senha temporária:** o usuário criado (ou com senha redefinida) fica com a pendência `TROCAR_SENHA`. Enquanto ela existir, ele não recebe nenhuma permissão e só alcança a troca de senha e o próprio `/eu`.
- Senha: mínimo de 12 caracteres, sem lista de senhas comuns, sem conter o nome nem o e-mail.
- Quem perdeu o acesso ao e-mail tem o e-mail trocado pelo administrador (o e-mail é o segundo fator).
- A tela de login usa **sempre a aparência padrão do sistema** (nada do contratante, nada guardado no navegador).
- Falha na renovação do token: volta ao login e depois à rota em que estava.

## Decisões do dono

- 11/11/2026: 2FA só por código de e-mail, para todos, sempre; saem TOTP e códigos de recuperação.
- 11/11/2026: e-mail pelo Gmail com senha de app no `ero-api/.env` (provedor pode mudar depois). Fora por ora: "lembrar navegador" e recuperar senha por e-mail.
- 12/11/2026: no dev, testar o login com Mailpit (passo a passo no `CONTINUAR.md`, seção "Rodar tudo com Docker").

## Em aberto

- Recuperar senha por e-mail e "lembrar este navegador" (adiados).
- Troca do provedor de e-mail.

## Doc técnico

`docs/02-seguranca-owasp.md` (A04, A06, A07), `docs/04-permissoes.md` (pendência e `ACESSO_LIBERADO`), `PLANO-FATIA-2.md` §2.3 (sessão no front). O superadmin de dev fica em `ero-api/.env`.
