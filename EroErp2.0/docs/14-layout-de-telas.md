# Layout de telas — larguras e disposição dos campos

> Leia antes de criar ou mexer em qualquer formulário, filtro de listagem ou
> FormList. **Este documento prevalece sobre os exemplos de grid do
> [doc 04](04-arquitetura-frontend.md)**: lá a forma de buscar dados, validar e
> salvar; aqui onde cada campo fica e de que tamanho ele é.
>
> Quem decide o padrão é o Eduardo. Os números abaixo vieram do EroErp antigo
> (`.claude/agents/eroerp-dev.md`, "Regras de largura de campos") e são o ponto
> de partida: ajuste **aqui**, nunca tela por tela.

---

## 1. O problema que este documento resolve

No EroErp antigo cada campo tinha largura semântica — data com 160 px, CPF com
180 px, CEP com 160 px — e a tela tinha cara de sistema. O 2.0 trocou isso por
`grid sm:grid-cols-N` com o `TEntry` em `w-full`: **toda coluna tem a mesma
largura**, então o campo ocupa a fatia que sobrou, e não o que o dado precisa.

Exemplos reais, de antes deste documento:

| Tela | O que acontece |
|---|---|
| `CompromissoForm` | Dia, Das e Às dividem o painel em três terços — uma hora com 300 px |
| `MovimentacaoList` | cinco filtros iguais, a data do mesmo tamanho que a busca de produto |
| `ProdutoForm` | `grid-cols-[8rem_minmax(0,1fr)]` improvisado — certo no tamanho, mas inventado na tela |

A regra é: **campo curto tem largura fixa do tamanho do dado; campo longo
cresce; a sobra da linha fica vazia.** Campo curto nunca estica para preencher
linha.

---

## 2. Escala de larguras

Vale a partir de `sm` (≥ 640 px). Abaixo disso **todo campo é 100 %** — a regra
6 do CLAUDE.md continua mandando no celular.

| `largura` | Para | Classe (sm+) | px |
|---|---|---|---|
| `uf` | UF, sigla de 2–3 letras | `sm:w-20` | 80 |
| `codigo` | código curto por tenant (serviço, produto), número do registro | `sm:w-32` | 128 |
| `hora` | `type="time"` | `sm:w-32` | 128 |
| `quantidade` | quantidade, percentual, inteiro pequeno (`mascara="inteiro"`, `%`) | `sm:w-32` | 128 |
| `data` | `type="date"` | `sm:w-40` | 160 |
| `cep` | CEP | `sm:w-40` | 160 |
| `valor` | dinheiro e decimal com sufixo (`mascara="decimal"`, `R$`) | `sm:w-40` | 160 |
| `cpf` | CPF, telefone, celular | `sm:w-44` | 176 |
| `situacao` | `TSelect` curto: situação, sim/não, tipo com 2–5 opções | `sm:w-48` | 192 |
| `cnpj` | CNPJ, e o campo CPF/CNPJ que alterna | `sm:w-52` | 208 |
| `dataHora` | `type="datetime-local"` | `sm:w-56` | 224 |
| `curto` | texto curto livre: número do endereço, complemento, bairro, EAN | `sm:w-56` | 224 |
| `medio` | `TSelect` de enum com rótulos longos, cidade, e-mail secundário | `sm:w-80` | 320 |
| `longo` | nome, razão social, descrição, logradouro, e-mail, `TCombo` de pessoa/produto | `sm:flex-1 sm:min-w-64` | cresce, mínimo 256 |
| `total` | `TTextArea`, observação, endereço completo numa linha só | `sm:basis-full` | linha inteira |

Na dúvida entre duas, a menor — campo que "parece apertado" no olho costuma
caber o dado; campo largo demais é o que destoa.

---

## 3. Como se escreve (o alvo da biblioteca)

> **Estado:** a prop `largura` e o `TLinha` **ainda não existem** no código. Eles
> nascem na primeira tarefa de correção (`/padronizar-layout`), junto com a
> primeira tela corrigida. Até lá, tela nova usa as classes da tabela acima
> direto no `className` do campo, dentro de uma linha `flex` — e é trocada pela
> prop quando ela existir.

### 3.1 `largura` nos campos

`TEntry`, `TSelect`, `TCombo`, `TComboMulti` e `TTextArea` recebem
`largura?: Largura`. O mapa mora num arquivo só,
`components/common/larguras.ts`:

```ts
export type Largura =
  | 'uf' | 'codigo' | 'hora' | 'quantidade' | 'data' | 'cep' | 'valor' | 'cpf'
  | 'situacao' | 'cnpj' | 'dataHora' | 'curto' | 'medio' | 'longo' | 'total'

/** Abaixo de `sm` todo campo é 100 %; daqui para cima, o tamanho do dado. */
export const CLASSE_LARGURA: Record<Largura, string> = {
  uf:         'sm:w-20 sm:flex-none',
  codigo:     'sm:w-32 sm:flex-none',
  hora:       'sm:w-32 sm:flex-none',
  quantidade: 'sm:w-32 sm:flex-none',
  data:       'sm:w-40 sm:flex-none',
  cep:        'sm:w-40 sm:flex-none',
  valor:      'sm:w-40 sm:flex-none',
  cpf:        'sm:w-44 sm:flex-none',
  situacao:   'sm:w-48 sm:flex-none',
  cnpj:       'sm:w-52 sm:flex-none',
  dataHora:   'sm:w-56 sm:flex-none',
  curto:      'sm:w-56 sm:flex-none',
  medio:      'sm:w-80 sm:flex-none',
  longo:      'sm:min-w-64 sm:flex-1',
  total:      'sm:basis-full',
}
```

O componente aplica `w-full ${CLASSE_LARGURA[largura]}` no `div` de fora (o que
já recebe `className`). Sem `largura`, nada muda — as telas antigas continuam
como estão até serem corrigidas.

### 3.2 `TLinha`

Uma linha de campos. Empilha no celular, quebra sozinha no desktop:

```tsx
export function TLinha({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start">{children}</div>
}
```

`items-start` porque um campo com erro ou ajuda fica mais alto que o vizinho, e
o vizinho não deve esticar.

### 3.3 Exemplo

```tsx
<TPanel title="Identificação">
  <div className="flex flex-col gap-4">
    <TLinha>
      <TEntry label="Código" largura="codigo" readOnly {...register('codigo')} />
      <TEntry label="Nome" largura="longo" autoFocus {...register('nome')} />
      <TSelect label="Situação" largura="situacao" opcoes={SITUACAO_OPCOES} {...register('ativo')} />
    </TLinha>
    <TLinha>
      <TEntry label="CPF" largura="cpf" {...register('cpf')} />
      <TEntry label="Nascimento" type="date" largura="data" {...register('dataNascimento')} />
      <TEntry label="Limite de crédito" largura="valor" mascara="decimal" suffix="R$" {...register('limite')} />
    </TLinha>
  </div>
</TPanel>
```

---

## 4. Disposição — formulário (Form/List, tela de cadastro)

1. **Painéis por assunto, na ordem em que se preenche:** Identificação → dados
   próprios do cadastro → Contato e Endereço → Observações. Painel com um campo
   só se junta ao vizinho.
2. **Primeira linha da Identificação:** Código (se houver, só leitura) · o campo
   principal (`longo`: nome, descrição) · Situação no **fim** da linha.
3. **O que forma uma coisa só fica junto, na ordem natural:**
   CEP → Logradouro → Número → Complemento; Bairro → Cidade → UF;
   Dia → Das → Às; De → Até; Valor → Unidade.
4. **Um `longo` por linha, acompanhado dos curtos que pertencem a ele** —
   Nome + CPF + Nascimento, e não Nome + E-mail lado a lado dividindo a tela ao
   meio.
5. **Curto não estica.** Linha só de curtos termina onde eles terminam; a sobra
   à direita fica vazia.
6. **`TTextArea` e observação: última linha do painel, `total`.**
7. **Botões no rodapé do `<form>`**, Cancelar (`secondary`) e Salvar
   (`primary`), em `flex flex-col-reverse gap-2 sm:flex-row` — como no
   `UsuarioForm`. Ação que não é salvar (Redefinir senha, Inativar) vai num
   painel próprio, **abaixo** do formulário.
8. **Tela de cálculo** segue o doc 04 §7 (abas autocontidas); as larguras daqui
   valem dentro de cada aba.

## 5. Disposição — listagem (List com filtros)

1. **Ações no topo, pelo `actions` da `TPage`:** Novo (`primary`) e
   exportação/impressão.
2. **Um `TPanel` de filtros, sem título**, na ordem: busca principal (`longo`)
   → selects (`situacao`, `medio`) → período De/Até (`data` + `data`, juntos).
   Sem botão Filtrar: a busca é por `useDebounce`, e todo filtro faz
   `setPagina(0)`.
3. **Colunas do `TDataGrid` nesta ordem:** código · principal (nome) · demais
   textos · datas · valores (`numerica`) · situação (`TBadge`) por último.
4. **Coluna de código, data, valor e situação ocupa só o necessário:**
   `className: 'w-px whitespace-nowrap'`. A principal fica sem largura e leva a
   sobra.
5. `secundaria: true` nas colunas que podem sumir em telas médias — nunca na
   principal.

## 6. Disposição — FormList (tabelas de apoio)

Referência: `AuxiliaresProduto`. Formulário compacto em cima (uma ou duas
`TLinha`, com larguras), grade embaixo, na mesma tela. Botão de salvar ao lado
dos campos quando couber numa linha só.

## 7. Modal

`TModal` com formulário segue as mesmas larguras. O modal nunca passa de
`calc(100vw - 2rem)`; dentro dele, `longo` ocupa o que sobra.

---

## 8. Como se confere

O agente `guardiao-layout` reprova a tela que fugir deste documento. A medida
automática é o `medir-campos.mjs` da skill `olhar-telas`:

```bash
MSYS_NO_PATHCONV=1 node .claude/skills/olhar-telas/medir-campos.mjs /app/agenda/novo
```

Ele mede cada campo visível a 1440 px e aponta data, hora, valor, CPF, CEP, UF e
select curto mais largos que o limite. A régua cobre o **tamanho**; a
**disposição** (§4–§6) se confere olhando o screenshot.

## 9. Checklist

- [ ] Todo campo novo tem `largura` (ou a classe equivalente, enquanto a prop não existe)
- [ ] Nenhum curto esticado para preencher linha
- [ ] Um `longo` por linha, com os curtos que pertencem a ele
- [ ] Grupos naturais juntos e na ordem (endereço, período, dia e hora)
- [ ] Situação no fim da primeira linha; observação na última, `total`
- [ ] `medir-campos.mjs` sem violação a 1440 px
- [ ] 360 px sem rolagem horizontal (`olhar.mjs … --360`)
