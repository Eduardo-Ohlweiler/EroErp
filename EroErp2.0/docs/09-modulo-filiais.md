# Módulo de Filiais

> **Completo.** Redesenho do módulo `emitente` do EroErp antigo. Lá a tela se
> chamava "Emitentes"; aqui é **Filiais**, e o papel é o mesmo: a empresa (ou o
> profissional) em nome de quem o tenant opera. Pedido, estoque e financeiro,
> quando vierem, apontam para cá.
>
> Leia junto com [08-modulo-pessoas.md](08-modulo-pessoas.md) — a filial é uma
> pessoa com um papel.

---

## 1. O que é uma filial aqui

**A filial não duplica cadastro.** Ela aponta para uma **pessoa** já cadastrada
(PF ou PJ — um consultório pode operar com CPF), e é na pessoa que moram CNPJ,
inscrições, razão social, fantasia e endereço. A filial guarda só:

| Campo | Para quê |
|---|---|
| `pessoa_id` | quem é — único por tenant: uma pessoa é uma filial só |
| `tipo` | `MATRIZ` ou `FILIAL` |
| `matriz_id` | a matriz a que a filial responde; nulo na matriz |
| `cor` | `#RRGGBB`, identifica a filial nas listas e combos das outras telas |
| `ativo` | filial não se apaga, inativa-se |

**Várias matrizes por tenant, de propósito.** Um cliente pode contratar o
sistema para negócios separados — uma loja de vendas e um consultório. Cada um é
uma matriz com as suas filiais. A listagem agrupa: cada matriz seguida das
filiais dela.

A tela mostra os dados da pessoa em leitura, com o atalho "Abrir em Pessoas",
para quem tem acesso a Pessoas. Quem não tem vê só a filial.

---

## 2. Regras

| Situação | Resposta |
|---|---|
| pessoa de outro tenant | 404 |
| pessoa inativa | 409 |
| pessoa que já é filial | 409 |
| `FILIAL` sem matriz | 400 |
| `MATRIZ` com matriz | 400 |
| a própria filial como matriz | 400 |
| matriz de outro tenant | 404 |
| matriz que é `FILIAL`, ou inativa | 409 |
| `MATRIZ` com filiais virando `FILIAL` | 409 |
| inativar matriz com filial ativa | 409, dizendo quantas |
| reativar filial de matriz inativa | 409 |
| cor fora de `#RRGGBB` (cadastro **e** alteração) | 400 |

A matriz que já estava não é reconferida na alteração: uma filial inativa de
matriz inativa ainda pode ter a cor corrigida.

O banco repete o essencial em `CHECK`: tipo válido, `MATRIZ` sem matriz e
`FILIAL` com, matriz diferente de si mesma (migration `018`).

---

## 3. O que mudou em relação ao antigo

| EroErp antigo (Emitente) | EroErp 2.0 (Filial) |
|---|---|
| `pessoa_matriz_id` → pessoa | `matriz_id` → filial (autorreferência) |
| matriz qualquer, até a própria pessoa | matriz `MATRIZ`, ativa, do mesmo tenant, outra |
| `bloqueado` respeitado só no `/select` | `ativo`, com as regras de estado acima |
| delete físico, 500 com SQL quando em uso | sem delete |
| `tipo` sem `CHECK` depois da migration 017 de lá | `CHECK` |
| cor `@NotBlank` só no create | mesma guarda nos dois DTOs |
| N+1 no `/select` (matriz preguiçosa) | ids pela native, linhas com `JOIN FETCH` |
| sem `created_by`/`updated_by` | com, como a pessoa |
| item de menu herdado do grupo, visível a quem não tinha acesso | item com `tela: 'FILIAIS'` |

Nada fiscal veio porque nada fiscal existia: regime tributário, CNAE, série de
NF-e e certificado entram quando houver emissão de nota.

---

## 4. API

| Método | Rota | Permissão |
|---|---|---|
| `GET` | `/filiais?nome=&documento=&tipo=&ativo=` | `FILIAIS_LER` |
| `GET` | `/filiais/{id}` | `FILIAIS_LER` |
| `GET` | `/filiais/select?termo=&tipo=&ignorarId=` | autenticado — combo de outras telas |
| `POST` | `/filiais` | `FILIAIS_ESCREVER` |
| `PUT` | `/filiais/{id}` | `FILIAIS_ESCREVER` |
| `PATCH` | `/filiais/{id}/ativo?ativo=` | `FILIAIS_ESCREVER` |

A listagem é paginada por **ids** (native com `CAST`, regra 2) e as linhas vêm
depois numa consulta só, com pessoa e matriz já carregadas: devolver a entidade
da native faria uma ida ao banco por linha.

## 5. Permissão

`Tela.FILIAIS`, no módulo próprio `Modulo.FILIAIS` — separado de Pessoas
([02 §1.2](02-modulo-usuarios.md)). Liberar Pessoas não abre Filiais. O item do
menu fica em **Cadastros** e só aparece para quem lê a tela.

## 6. Quando outro módulo usar filial

O combo usa `GET /filiais/select` e mostra a cor. O service do módulo novo
confere que a filial é do tenant **e está ativa** — o antigo deixava usar
emitente bloqueado em toda parte. Esse método nasce junto com o primeiro módulo
que precisar dele, não antes.
