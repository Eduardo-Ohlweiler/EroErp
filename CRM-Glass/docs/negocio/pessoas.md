# Pessoas

**Status: entregue em 20/11/2026 (branch `timeero/pessoas`, já mesclada na `main` local). Primeiro cadastro de negócio do CRM Glass.**
**Dados complementares: entregues em 21/11/2026 (branch `timeero/pessoas-complemento`).**

Planos de origem: `PLANO-PESSOAS.md` e `PLANO-PESSOAS-COMPLEMENTO.md`. Regra de código: [[codigo-sequencial]]. Os tipos escolhidos em listas moram em [[cadastros-auxiliares]].

## Regras vigentes

**Cadastro**
- Pessoa física e jurídica na mesma tabela. O tipo de pessoa é um enum fixo: Física ou Jurídica.
- A tela mostra só os campos do tipo escolhido. Trocar o tipo limpa os campos do outro.
- Na jurídica não há "razão social" separada: o campo Nome vira "Razão social".
- Toda pessoa tem ao menos um tipo de cadastro (Cliente, Fornecedor, Funcionário, Lead, Outros ou um tipo do contratante).
- CPF e CNPJ: dígito verificador conferido, únicos por contratante. Duplicado devolve 409 dizendo o código de quem já tem.
- CPF, RG e CNH ficam em claro no banco. RG e CNH não são únicos (RG de 6 a 10 caracteres).
- Sem consulta de CNPJ na Receita.
- Código `cod_pessoa` sequencial por contratante, só leitura na tela ([[codigo-sequencial]]).
- Nada de excluir: só inativar e reativar.

**Documentos da pessoa física** (migration 020)
- RG com órgão emissor (maiúsculas), UF (FK para `estado`) e data de emissão. Órgão, UF e emissão só existem com o RG preenchido.
- A emissão não pode ser futura, nem anterior a 1900 ou ao nascimento.
- CNH: número de 11 dígitos com dígito verificador conferido (algoritmo do DETRAN). Não é única.
  - O número pode ir sozinho. Categoria (A, B, AB, C, D, E, AC, AD, AE) e validade são opcionais, mas só existem com o número (trava no banco e no service).
  - CNH vencida é aceita e a tela mostra "Vencida". A validade fica entre 1900 e hoje + 15 anos, contra erro de digitação.
- Os campos do mesmo documento ficam na mesma linha (RG: número, órgão, UF, emissão; CNH: número, categoria, validade), pela regra do `docs/07`.

**Dados civis (pessoa física)**
- Estado civil e profissão: cadastros auxiliares ([[cadastros-auxiliares]]), com itens do sistema e do contratante. Item inativo já gravado continua aceito, como "Nome (inativo)"; inativo novo é recusado.
- Nacionalidade: texto livre de 2 a 40 caracteres, vazia no cadastro novo.
- Naturalidade: cidade do IBGE.
- Nome da mãe e nome do pai (até 255 caracteres).

**Pessoa jurídica**
- Data de abertura: não pode ser futura nem anterior a 1800.
- **Representante legal** é um tipo de vínculo novo: `REPRESENTANTE_LEGAL`, com o inverso `REPRESENTADA` ("Empresa representada"). Migration 021.
  - O representante é sempre pessoa física e o representado, pessoa jurídica.
  - Uma empresa pode ter vários representantes. Continua um vínculo por par de pessoas.
  - Aparece nos dois lados: na ficha da empresa, "Fulano é Representante legal"; na de Fulano, "ACME é Empresa representada".

**Campos de um tipo só**
- Campo de PF numa PJ (e a data de abertura numa PF) dá 400 no campo. O `ck_pessoa_campos_do_tipo` foi recriado com as colunas novas.
- Trocar o tipo na tela limpa o outro bloco, e o mapper limpa no PUT.

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
- O filtro Situação abre em "Ativo". Exportar e Pdf valem para quem tem `PESSOAS_LER`, **sem data de nascimento, CNH, filiação nem estado civil**.
- Cadastro novo abre como Física e sem tipo de cadastro marcado.

## LGPD

- CNH, filiação (nome da mãe e do pai) e estado civil aparecem **só na ficha**. Ficam fora da lista, do Exportar, do Pdf e de qualquer log. A lista, a seleção e o vínculo usam DTOs que não têm esses campos.
- **Nada novo é cifrado** (`CriptoConverter`):
  - o dono decidiu CPF e RG em claro, e a CNH é um identificador da mesma classe: cifrar uma com a outra ao lado não reduz o risco;
  - estado civil e profissão são FK, e FK não se cifra;
  - a proteção está no acesso (`PESSOAS_LER`), no `toString` sem os campos, na ausência de log e no backup cifrado do deploy.
- Se o dono quiser cifrar algo, o candidato razoável é `nome_mae`: ninguém busca por ele e ele é usado em fraude de identidade.
- Risco aberto: um CHECK da `pessoa` violado leva CNH e filiação ao log do `SqlExceptionHelper` (ver `docs/02`, "Pendências conhecidas").

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

20 e 21/11/2026 (dados complementares):
- Escopo: documentos da PF (RG completo e CNH), dados civis, data de abertura e representante legal como vínculo. Fiscais e bancários ficam para quando houver nota fiscal e cobrança.
- CNH: número sozinho é aceito; categoria e validade são opcionais, mas só com o número (a trava que ele quis manter); vencida é aceita e mostra "Vencida".
- Representante legal sempre pessoa física, vários por empresa.
- Estado civil e profissão com itens do sistema, sem a tabela CBO. Nacionalidade em texto livre.
- Campos do mesmo documento na mesma linha.
- CNH, filiação e estado civil fora da lista, do Exportar e do Pdf (LGPD).
- Camadas flutuantes e combo estreito: ver [[aparencia-e-movimento]] e [[decisoes]].

## Em aberto

- Inscrição estadual "ISENTO".
- Código do país no telefone (com o WhatsApp).
- Resumo (total, físicas, ativas) no Pdf de pessoas.
- Consulta de CNPJ.
- Dados fiscais da empresa (regime tributário, contribuinte de ICMS, CNAE), quando houver nota fiscal.
- Dados bancários e PIX, quando houver cobrança (conta e chave PIX com o `CriptoConverter`).
- Gerador de contratos (tags, flexão "(a)" pelo sexo e pela `chave` do estado civil). Ver [[eroerp-referencias]].
- Cifrar `nome_mae`, se o dono quiser.
- Limite de 5 ícones na barra do celular quando entrar o próximo módulo.
- Pendências técnicas: `CONTINUAR.md`, "Pendências de Pessoas", e `docs/02`.

## Doc técnico

- `docs/01-arquitetura-backend.md`: `CampoInvalidoException`, código do registro, `SelectDto` de pessoa.
- `docs/03-multitenant.md`: `Estado`/`Cidade` sem tenant; itens do sistema por contratante.
- `docs/04-permissoes.md`: grupos `PESSOAS` e `CADASTROS_AUXILIARES`, rotas.
- `docs/05-banco-liquibase.md`: FK composta e item novo do sistema.
- `docs/07-layout-de-telas.md`: kit novo, `TCombo` automático, submenu da casca, máscara `cnh`.
- `docs/02-seguranca-owasp.md`: saída para o ViaCEP.
