# Usuários e acesso

## Papéis

| Papel | Regra |
|---|---|
| `SUPERADMIN` | Dono da plataforma. Só existe pelo seed, nunca pela API. Não conta no limite de usuários e fica invisível para o contratante. |
| `ADMIN` | Administrador do contratante. Recebe todos os grupos e ações do contratante. |
| `USUARIO` | Só o que estiver liberado nos grupos. |

## Regras vigentes do ADMIN

- Cadastra usuários **até o limite de usuários ativos** ([[contratantes]]), edita, inativa e reativa, **cria e promove outro ADMIN**, redefine senha e desbloqueia. **Nunca em si mesmo.**
- Não vê Contratantes nem Aparência (são da plataforma).
- **Último administrador ativo:** o contratante sempre tem pelo menos um ADMIN ativo. Rebaixar ou inativar o último dá 422 "O contratante precisa de pelo menos um administrador ativo." Vale também para o superadmin atuando no contratante (ele não conta como administrador de lá). ADMIN inativo não conta.

## Grupos de liberação

- O administrador libera **grupos** por usuário, com nível **LER** ou **ESCREVER** (ESCREVER inclui LER). Hoje: `USUARIOS` (telas usuario-list e usuario-form; ação "Liberar acesso de outros usuários") e `AUDITORIA` (auditoria-list).
- **Ações extras** são concedidas uma a uma e só se o grupo estiver liberado.
- ADMIN e SUPERADMIN não têm lista de liberações (já têm tudo).

## Quem libera o quê

- Ninguém altera as **próprias** permissões nem o próprio papel.
- Só ADMIN/SUPERADMIN criam ou promovem ADMIN.
- Só ADMIN/SUPERADMIN **redefinem senha ou trocam o e-mail** de outra pessoa (é tomar a conta dela).
- Usuário comum com `USUARIOS_LIBERAR_ACESSO` só concede o que ele mesmo tem e só altera ou inativa colega cujo acesso esteja contido no dele. Pode distribuir acesso sem poder editar cadastro (de propósito).
- Modelo mantido: permissão por usuário + grupo; **sem perfis**.

## Senha temporária, desbloqueio, telefone

- Cadastro e redefinição geram senha temporária (a tela tem "Gerar"); o usuário é obrigado a trocá-la no primeiro acesso ([[login-e-sessao]]).
- Desbloquear (conta travada por 5 erros): só ADMIN/SUPERADMIN, nunca em si mesmo.
- **Telefone** opcional, 10 ou 11 dígitos, gravado só com dígitos; aparece no cadastro, na lista e na Minha conta. Nunca vai para log nem detalhe de evento.

## Minha conta

- Abas: Meus dados, Senha, Sessões. Cada uma grava na sua rota.
- O usuário edita **nome e telefone** (e o **tema**: seguir o contratante, claro ou escuro). **E-mail, papel e contratante são só leitura**: o e-mail é o segundo fator, quem troca é o administrador. O nome muda na barra na hora.
- Sessões: só as próprias; encerrar uma ou "encerrar as outras" (nunca a atual).
- Sem grupo de liberação: cada um mexe só no que é seu.

## Cadastro de usuário (forma da tela)

Form com painéis empilhados (Dados do usuário, Acesso aos módulos, Segurança) e **um** Salvar. Usuários só existem dentro do contratante: o superadmin acessa o contratante antes ([[contratantes]]).

## Decisões do dono

- 11/11/2026: manter o modelo de permissões por usuário + grupo; sem perfis.
- 14/11/2026 (Fatia 3): todas as regras do ADMIN acima, incluindo o último administrador; telefone opcional; Minha conta edita nome e telefone.

## Em aberto

- Nenhuma regra do ADMIN pendente (o "a definir" antigo do `CONTINUAR.md`, seção 5 item 6, foi resolvido na Fatia 3).

## Doc técnico

`docs/04-permissoes.md` (papéis, escalada, último administrador, endpoints), `docs/03-multitenant.md` (Meus dados, Telefone), `PLANO-FATIA-3.md` §0 e §5.
