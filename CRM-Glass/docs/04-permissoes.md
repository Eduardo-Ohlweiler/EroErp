# 04 — Permissões

## Papéis (`usuario.enums.Papel`)

| Papel | O que pode |
|---|---|
| `SUPERADMIN` | Dono da plataforma (o Eduardo). Tudo, inclusive contratantes. Só existe pelo seed, nunca pela API. |
| `ADMIN` | Administrador do contratante. **Provisório:** recebe todos os grupos e ações do contratante. As regras específicas serão definidas pelo dono do produto. |
| `USUARIO` | Só o que estiver liberado nos grupos. |

## Grupos de liberação (`permissao.enums.GrupoLiberacao`)

O administrador libera **grupos** para cada usuário, com o nível **LER** ou
**ESCREVER** (ESCREVER inclui LER). Liberar um grupo libera as **telas** dele.
Alguns grupos têm **ações extras**, concedidas uma a uma.

```
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
- Só ADMIN ou SUPERADMIN **redefinem a senha, trocam o e-mail ou resetam o 2FA** de outra pessoa (fazer isso é tomar a conta dela).
- Usuário comum só altera ou inativa colega cujo acesso esteja **contido** no dele.
- Usuário com **pendência** (senha temporária, ou 2FA exigido e ainda não configurado) não recebe nenhuma permissão, nem `ACESSO_LIBERADO`, até resolver. Ele só alcança `/api/auth/eu`, `/senha` e `/2fa/*`.

## `ACESSO_LIBERADO`

Authority de todo usuário logado **sem pendência**. Rotas que qualquer usuário
pode chamar (combos `/selecao`, catálogo, `/tenants/atual`, sessões) usam
`@PreAuthorize("hasAuthority('ACESSO_LIBERADO')")`. Não use `isAuthenticated()`
fora de `/api/auth/*`.

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
| `PATCH /api/usuarios/{id}/redefinir-senha`, `/redefinir-2fa` e `/desbloquear` | `USUARIOS_ESCREVER` **e** papel ADMIN/SUPERADMIN (nunca em si mesmo) |

O `PUT` de permissões exige só `USUARIOS_LIBERAR_ACESSO` (sem `_ESCREVER`) **de propósito**:
um gerente pode distribuir acesso sem poder editar cadastro. A regra que segura
abuso está no service: ele só mexe em quem tem acesso contido no dele e só
concede o que tem.
