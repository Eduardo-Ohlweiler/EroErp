# 04 — Permissões

## Papéis (`usuario.enums.Papel`)

| Papel | O que pode |
|---|---|
| `SUPERADMIN` | Dono da plataforma (o Eduardo). Tudo, inclusive contratantes. Só existe pelo seed, nunca pela API. |
| `ADMIN` | Administrador do contratante. Recebe todos os grupos e ações do contratante e faz tudo com os usuários dele: cadastra (até o **limite de usuários ativos**, que só o superadmin muda; ver `03-multitenant.md`), edita, inativa e reativa, cria e promove outro ADMIN, redefine senha e desbloqueia. **Nunca em si mesmo.** Não vê Contratantes nem a configuração de aparência (são da plataforma). O contratante tem **sempre pelo menos um ADMIN ativo** (ver "Último administrador"). |
| `USUARIO` | Só o que estiver liberado nos grupos. |

## Grupos de liberação (`permissao.enums.GrupoLiberacao`)

O administrador libera **grupos** para cada usuário, com o nível **LER** ou
**ESCREVER** (ESCREVER inclui LER). Liberar um grupo libera as **telas** dele.
Alguns grupos têm **ações extras**, concedidas uma a uma.

```
GrupoLiberacao.PESSOAS                (cadastro de pessoas; menu Cadastros › Pessoas)
  telas:  pessoa-list, pessoa-form
GrupoLiberacao.CADASTROS_AUXILIARES   (os 5 cadastros auxiliares da pessoa; menu Cadastros › Auxiliares)
  telas:  tipo-cadastro-formlist, tipo-telefone-formlist, tipo-email-formlist,
          tipo-endereco-formlist, tipo-rede-social-formlist
GrupoLiberacao.USUARIOS
  telas:  usuario-list, usuario-form
  ações:  USUARIOS_LIBERAR_ACESSO  ("Liberar acesso de outros usuários")
GrupoLiberacao.AUDITORIA
  telas:  auditoria-list
```

Cada grupo gera as authorities `<GRUPO>_LER` e `<GRUPO>_ESCREVER`, e cada ação
gera uma authority com o próprio nome. No controller:

```java
@GetMapping       @PreAuthorize("hasAuthority('USUARIOS_LER')")
@PostMapping      @PreAuthorize("hasAuthority('USUARIOS_ESCREVER')")
@PutMapping(...)  @PreAuthorize("hasAuthority('USUARIOS_LIBERAR_ACESSO')")
@GetMapping(...)  @PreAuthorize("hasRole('SUPERADMIN')")   // plataforma
```

O front recebe, em `GET /api/auth/eu`, a lista `permissoes` (para mostrar ou
esconder botões) e `telas` (para montar o menu).

## Regras contra escalada de privilégio

- Ninguém altera as **próprias** permissões nem o próprio papel.
- Só ADMIN ou SUPERADMIN criam ou promovem um ADMIN.
- Usuário comum com `USUARIOS_LIBERAR_ACESSO` só concede o que ele mesmo tem.
- Uma ação só pode ser concedida se o grupo dela estiver liberado.
- ADMIN e SUPERADMIN não têm lista de liberações (já têm tudo).
- Só ADMIN ou SUPERADMIN **redefinem a senha ou trocam o e-mail** de outra pessoa (fazer isso é tomar a conta dela; o e-mail também é para onde vai o código do login).
- Usuário comum só altera ou inativa colega cujo acesso esteja **contido** no dele.
- Usuário com **pendência** (hoje só a senha temporária: `TROCAR_SENHA`) não recebe nenhuma permissão, nem `ACESSO_LIBERADO`, até resolver. Ele só alcança `/api/auth/eu`, `/api/auth/senha` e `/api/auth/eu/tema` (o `/api/auth/eu/perfil` exige `ACESSO_LIBERADO`: 403). O código por e-mail não é pendência: é a segunda etapa do login, antes de existir sessão.
- Nos **meus dados** (`PUT /api/auth/eu/perfil`) o usuário só muda nome e telefone. O corpo não tem id, e-mail nem papel (campos extras são ignorados): o id vem da sessão, o e-mail é o segundo fator do login e só o administrador troca.

## Último administrador

O contratante nunca fica sem administrador ativo. Rebaixar (`PUT /api/usuarios/{id}` com
`papel` diferente de `ADMIN`) ou inativar (`PATCH /api/usuarios/{id}/inativar`) o **último
ADMIN ativo** dá **422** "O contratante precisa de pelo menos um administrador ativo.". Vale
para todos, inclusive o superadmin atuando no contratante (ele não conta como administrador
de lá). ADMIN inativo não conta. A linha do contratante é travada antes de contar
(`UsuarioService.exigirOutroAdminAtivo`): dois administradores rebaixando um ao outro ao
mesmo tempo não deixam o contratante sem nenhum.

## `ACESSO_LIBERADO`

Authority de todo usuário logado **sem pendência**. Rotas que qualquer usuário
pode chamar (combos `/selecao`, catálogo, `/tenants/atual`, sessões) usam
`@PreAuthorize("hasAuthority('ACESSO_LIBERADO')")`. Não use `isAuthenticated()`
fora de `/api/auth/*`.

## Telas sem grupo (presas ao papel)

Algumas telas **não têm grupo de liberação de propósito**. Elas ficam presas ao
papel no controller e não aparecem em `GET /api/permissoes/catalogo`:

| Tela | Rotas | Quem | Por quê |
|---|---|---|---|
| Contratantes | `GET/POST /api/tenants`, `GET/PUT /api/tenants/{id}`, `PATCH /{id}/inativar` e `/ativar`, `GET /api/tenants/selecao` | `hasRole('SUPERADMIN')` | É a plataforma, não o contratante. |
| Configuração do contratante (aparência e cena exclusiva) | `PUT /api/tenants/{id}/configuracao`, `GET /api/tenants/fundos` | `hasRole('SUPERADMIN')` | Idem. |
| Minha conta (meus dados, senha, tema, sessões) | `GET/PUT /api/auth/eu/perfil` (`ACESSO_LIBERADO`), `/api/auth/senha`, `/api/auth/eu/tema`, `/api/sessoes/*` | o próprio usuário | Cada um só mexe no que é seu. |

Por que não um grupo: todo grupo é concedido automaticamente ao `ADMIN` do
contratante (ver Papéis). Um grupo `CONTRATANTES` daria a qualquer administrador
de cliente o poder de ver e alterar **outros** contratantes, ou de mudar a
aparência que vale para todos: escalada de privilégio. Por isso essas rotas
usam o papel. Nas escritas (criar, alterar, configurar, inativar, ativar) e na
lista e ficha (`GET /api/tenants`, `/{id}`, que trazem os usuários ativos de cada
contratante), o service ainda exige a visão de plataforma (`exigirVisaoPlataforma`):
o superadmin dentro de um contratante recebe 422. `/selecao` e `/fundos` só exigem
o papel.

No front, essas telas entram no menu pelo papel (`papel === 'SUPERADMIN'` e
fora de um contratante), não por `telas`.

## Criando o grupo de uma tela nova

1. Em `Tela`, declare as telas com o código usado no front (`pessoa-list`, `pessoa-form`).
2. Em `GrupoLiberacao`, crie o grupo (ex.: `PESSOAS("Pessoas", List.of(...telas), List.of(...ações))`).
3. Se houver ação extra, declare em `Acao` (prefixo do grupo: `PESSOAS_EXPORTAR`) e coloque na lista do grupo.
4. Proteja o controller com `<GRUPO>_LER` e `<GRUPO>_ESCREVER`.
5. Teste o par LER/ESCREVER (ver `UsuarioIntegracaoTest.parLerEscrever`).

O nome da constante vai para o banco (`usuario_liberacao.grupo`) e para o
front. Renomear exige migration.

## Endpoints

| Rota | Quem |
|---|---|
| `GET /api/permissoes/catalogo` | `ACESSO_LIBERADO` |
| `GET /api/permissoes/usuarios/{id}` | `USUARIOS_LER` |
| `PUT /api/permissoes/usuarios/{id}` (substitui tudo; manda a `version` do GET, 409 se outra pessoa alterou antes) | `USUARIOS_LIBERAR_ACESSO` |
| `PATCH /api/usuarios/{id}/redefinir-senha` e `/desbloquear` | `USUARIOS_ESCREVER` **e** papel ADMIN/SUPERADMIN (nunca em si mesmo). O `redefinir-2fa` saiu: não há app autenticador para resetar; quem perdeu o acesso ao e-mail tem o e-mail trocado pelo administrador. |
| `GET /api/sessoes`, `PATCH /api/sessoes/{id}/encerrar`, `PATCH /api/sessoes/encerrar-outras` | `ACESSO_LIBERADO` (só as próprias sessões) |
| `GET /api/auditoria/eventos`, `GET /api/auditoria/tipos` | `AUDITORIA_LER` |
| `GET /api/tipos-cadastro?page=&size=&sort=` (o mesmo em `/api/tipos-telefone`, `/api/tipos-email`, `/api/tipos-endereco` e `/api/tipos-rede-social`; ordena por `nome` ou pelo código) | `CADASTROS_AUXILIARES_LER` |
| `POST /api/tipos-cadastro`, `PUT /{id}`, `PATCH /{id}/inativar` e `/ativar` (idem nos outros 4; item do sistema: 422) | `CADASTROS_AUXILIARES_ESCREVER` |
| `GET /api/tipos-cadastro/selecao?inativos=` (idem nos outros 4) | `ACESSO_LIBERADO` (combo da pessoa) |
| `GET /api/pessoas?codPessoa=&busca=&documento=&tipoPessoa=&tipoCadastroId=&ativo=`, `GET /api/pessoas/{id}` | `PESSOAS_LER` |
| `GET /api/pessoas/selecao?busca=&ignorarId=` (até 20 ativas: id, código e nome) | `PESSOAS_LER` (**não** `ACESSO_LIBERADO`: nome de pessoa é dado pessoal) |
| `POST /api/pessoas`, `PUT /{id}`, `PATCH /{id}/inativar` e `/ativar` | `PESSOAS_ESCREVER` |
| `GET /api/cidades/selecao?busca=&uf=`, `GET /api/cep/{cep}` | `ACESSO_LIBERADO` (o CEP tem limite próprio por IP, `app.rate-limit.cep`) |
| `GET /api/usuarios?busca=&ativo=&papel=&bloqueado=` (`papel` = `ADMIN`/`USUARIO`; `bloqueado=true` = bloqueado agora por tentativas, `false` = não bloqueado; todos opcionais e somados) | `USUARIOS_LER` |
| `GET /api/usuarios/selecao?inativos=` | `ACESSO_LIBERADO` (`inativos=true` traz também os inativos; o superadmin nunca aparece) |
| `GET /api/auth/eu/perfil`, `PUT /api/auth/eu/perfil` | `ACESSO_LIBERADO` (só os próprios dados) |

O `PUT` de permissões exige só `USUARIOS_LIBERAR_ACESSO` (sem `_ESCREVER`) **de propósito**:
um gerente pode distribuir acesso sem poder editar cadastro. A regra que segura
abuso está no service: ele só mexe em quem tem acesso contido no dele e só
concede o que tem.
