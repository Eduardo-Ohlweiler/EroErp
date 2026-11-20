# Pessoas

**Status: entregue em 20/11/2026 (branch `timeero/pessoas`). Primeiro cadastro de negócio do CRM Glass.**

Plano de origem: `PLANO-PESSOAS.md`. Regra de código: [[codigo-sequencial]]. Os tipos escolhidos em listas moram em [[cadastros-auxiliares]].

## Regras vigentes

**Cadastro**
- Pessoa física e jurídica na mesma tabela. O tipo de pessoa é um enum fixo: Física ou Jurídica.
- A tela mostra só os campos do tipo escolhido. Trocar o tipo limpa os campos do outro.
- Na jurídica não há "razão social" separada: o campo Nome vira "Razão social".
- Toda pessoa tem ao menos um tipo de cadastro (Cliente, Fornecedor, Funcionário, Lead, Outros ou um tipo do contratante).
- CPF e CNPJ: dígito verificador conferido, únicos por contratante. Duplicado devolve 409 dizendo o código de quem já tem.
- CPF e RG ficam em claro no banco. RG não é único (de 6 a 10 caracteres).
- Sem consulta de CNPJ na Receita.
- Código `cod_pessoa` sequencial por contratante, só leitura na tela ([[codigo-sequencial]]).
- Nada de excluir: só inativar e reativar.

**Contatos e endereços**
- Telefones, e-mails, redes sociais e endereços, cada um com o seu tipo (auxiliar). Um principal por lista; se ninguém for marcado, o primeiro vira principal.
- Telefone sem código do país (10 ou 11 dígitos).
- Link de rede social só aceita `http://` ou `https://`.
- CEP é consultado pelo backend no ViaCEP; a cidade vem da tabela do IBGE (27 UFs, 5.571 municípios). Se o ViaCEP cair, a tela avisa e o endereço se preenche à mão.

**Busca**
- Nome e fantasia são buscados sem acento nem caixa (coluna `nome_busca`, calculada no Java).
- A seleção para combos (`/api/pessoas/selecao`) exige `PESSOAS_LER`, porque nome de pessoa é dado pessoal. Mostra "código · nome".

**Vínculos entre pessoas**
- Tipos: Responsável ↔ Dependente, Cônjuge, Familiar, Contato ↔ Empresa.
- Uma linha serve os dois cadastros: quem abre a outra pessoa vê o vínculo invertido ("B é Dependente de A").
- Empresa precisa ser pessoa jurídica, e só pessoa jurídica tem Contato.
- O PUT substitui a lista inteira de vínculos (ver "Decisões do dono", 20/11/2026).
- Alterar o vínculo sobe a versão da outra pessoa e trava as duas, para não haver edição simultânea.

**Cadastro rápido**
- Modal dentro do cadastro, para criar uma pessoa sem sair do vínculo.
- A pessoa física nasce como "Cliente" e o telefone entra como Celular principal.

**Tela**
- Lista (modelo List) com filtros: código, nome ou fantasia, CPF ou CNPJ, tipo de pessoa, tipo de cadastro e situação.
- O filtro Situação abre em "Ativo". Exportar e Pdf valem para quem tem `PESSOAS_LER`, **sem data de nascimento**.
- Cadastro novo abre como Física e sem tipo de cadastro marcado.

## Decisões do dono

16/11/2026 (respostas 1 a 7 do plano):
- Tudo do EroErp 2.0 numa entrega: vínculos, cadastro rápido e seleção entram.
- Cidade pelas tabelas `estado`/`cidade` do IBGE.
- Tipo de pessoa em enum; os outros 5 tipos são cadastros auxiliares ([[cadastros-auxiliares]]).
- Busca sem acento por coluna normalizada no Java.
- CPF e RG em claro.
- Exportar para quem tem `PESSOAS_LER`, sem data de nascimento.
- Aceitos: CEP pelo ViaCEP via backend, sem consulta de CNPJ, sem `razao_social`, RG não único, campos só do tipo escolhido.
- P1: vínculos do 2.0 mais Contato ↔ Empresa. P2: item do sistema não pode ser inativado. P3: cadastro rápido com "Cliente" marcado.

20/11/2026:
- O filtro Situação da lista abre em "Ativo", e o Limpar volta para "Ativo".
- O PUT de pessoa reenvia os vínculos, porque a API substitui a lista inteira.
- Cadastro novo abre como Física e sem tipo de cadastro marcado.
- No cadastro rápido, a pessoa física nasce como "Cliente" e o telefone entra como Celular principal.
- O rate limit classifica as rotas pelo caminho decodificado (ver `docs/02`).

## Em aberto

- Inscrição estadual "ISENTO".
- Código do país no telefone (com o WhatsApp).
- Resumo (total, físicas, ativas) no Pdf de pessoas.
- Consulta de CNPJ.
- Limite de 5 ícones na barra do celular quando entrar o próximo módulo.
- Pendências técnicas: `CONTINUAR.md`, "Pendências de Pessoas", e `docs/02`.

## Doc técnico

- `docs/01-arquitetura-backend.md`: `CampoInvalidoException`, código do registro, `SelectDto` de pessoa.
- `docs/03-multitenant.md`: `Estado`/`Cidade` sem tenant; itens do sistema por contratante.
- `docs/04-permissoes.md`: grupos `PESSOAS` e `CADASTROS_AUXILIARES`, rotas.
- `docs/05-banco-liquibase.md`: FK composta e item novo do sistema.
- `docs/07-layout-de-telas.md`: kit novo, `TCombo` automático, submenu da casca.
- `docs/02-seguranca-owasp.md`: saída para o ViaCEP.
