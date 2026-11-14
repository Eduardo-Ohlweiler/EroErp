# Logs e auditoria

## Regras vigentes

- A tela Logs mostra a **trilha de segurança** (login, falhas, bloqueios, código enviado, senha, permissões, usuários e contratantes alterados, suporte acessando contratante).
- Filtros: período (padrão últimos 7 dias, máximo 1 ano), categoria, usuário (dentro do contratante) e contratante (só na plataforma). **Sem filtro por IP.**
- **Categorias:** Acessos, Falhas e bloqueios, Senha, Usuários e permissões, Contratantes (só na plataforma) e Suporte da plataforma.
- Exportar (CSV) e Pdf usam o mesmo filtro da consulta; sem resumo agrupado.
- **Retenção de 12 meses**, com limpeza diária (no mesmo job saem sessões e refresh tokens expirados). Piso de 30 dias: abaixo disso a aplicação não sobe.
- **O que o contratante não vê do suporte:** o que o superadmin faz dentro do contratante aparece como "Suporte da plataforma", **sem id, IP nem navegador**; também não aparece como autor ("criado por") nos cadastros. Na plataforma tudo aparece.
- Nada sensível em log de aplicação: senha, token, CPF, e-mail inteiro e telefone são mascarados (`LogSeguro`).
- Quem tem `AUDITORIA_LER` consulta; a tela `auditoria-list` vale para contratante e plataforma.

## Decisões do dono

- 06/11/2026 (P5 e P6): Logs = trilha de segurança atual; retenção de 12 meses.
- 14/11/2026 (Fatia 3): Exportar e Pdf; sem filtro por IP; sem resumo agrupado.

## Em aberto

- Auditoria de negócio (quem alterou o quê nos cadastros) ainda não existe além de criado por e alterado por.

## Doc técnico

`docs/03-multitenant.md` (Trilha de segurança), `docs/02-seguranca-owasp.md` (A09), `docs/08-relatorios.md` (Pdf).
