# Regras de negócio do CRM Glass (segundo cérebro)

Notas curtas, em markdown simples, com links `[[nome-da-nota]]`. O cofre do Obsidian é a pasta `CRM-Glass/docs/`; as notas ficam aqui em `negocio/`. Nada depende de plugin.

Regra de ouro: **aqui mora a regra de negócio (o quê e por quê); a implementação mora nos docs técnicos** (`docs/01` a `docs/08`). Cada nota aponta a seção técnica em vez de copiá-la.

## Índice

| Nota | Assunto |
|---|---|
| [[login-e-sessao]] | Código por e-mail, tokens, refresh, senha temporária |
| [[usuarios-e-acesso]] | Papéis, regras do ADMIN, grupos LER/ESCREVER, Minha conta |
| [[contratantes]] | Limite de usuários, aparência, tema por usuário, acessar contratante |
| [[logs-e-auditoria]] | Trilha de segurança, categorias, retenção, o que o suporte esconde |
| [[pessoas]] | Cadastro de pessoas: física e jurídica, contatos, endereços, vínculos, cadastro rápido |
| [[filiais]] | Matrizes e filiais: apontam para uma pessoa, cor de registro, combo aberto sem documento |
| [[servicos]] | Serviços: preço só por filial, filiais onde é prestado, duração e categoria opcionais |
| [[cadastros-auxiliares]] | Os tipos da pessoa e a categoria de serviço, itens do sistema e do contratante |
| [[codigo-sequencial]] | `cod_<entidade>` por contratante nos cadastros de negócio (regra nos docs; nasce com pessoas) |
| [[aparencia-e-movimento]] | Decisões visuais e de movimento do dono |
| [[decisoes]] | Registro cronológico de tudo que o dono decidiu |
| [[eroerp-referencias]] | O que já foi pesquisado no EroErp e no EroErp 2.0 |

## Como usar

- **Planejador:** antes de planejar, leia a nota do domínio tocado e o [[decisoes]]. Se o pedido contradiz uma decisão, pergunte ao dono em vez de assumir.
- **Demais agentes:** consultem a nota em vez de redescobrir a regra no código. Se a nota e o código divergirem, avise o dono; não escolha sozinho.
- **Ao fim de cada entrega:** as decisões aprovadas pelo dono entram na nota do domínio (seção "Decisões do dono", com data) e uma linha em [[decisoes]]. O que ficou sem resposta entra em "Em aberto".
- **Domínio novo:** crie `<dominio>.md` copiando a forma das notas existentes (Regras vigentes, Decisões do dono, Em aberto, Doc técnico) e acrescente ao índice acima.
- Nunca escreva senha, segredo, e-mail real ou conteúdo de `.env` aqui. No máximo "o superadmin de dev fica em `ero-api/.env`".
