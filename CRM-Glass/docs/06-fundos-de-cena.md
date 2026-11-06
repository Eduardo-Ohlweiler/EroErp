# 06 — Fundos de cena: como incluir uma cena nova

Uma **cena** é um fundo fotográfico que acompanha o tema como um plano de cinema: um shader WebGL 2 mistura a foto de **noite** e a de **dia** (mesmo enquadramento) e acende ou apaga as luzes aos poucos na troca de tema. Como cada cena se comporta, os prompts usados e os comandos de máscara das cenas atuais estão em `design/CENA-ESCRITORIO.md`. Este documento é o passo a passo para colocar uma cena nova no ar, pública ou **exclusiva** de um contratante.

## Onde está cada coisa

| O quê | Arquivo |
|---|---|
| Dados das cenas (fotos, luminárias, janelas, vidro) | `ero-web/src/motion/cena/cenas.ts` |
| Roteiro da troca (tempo → quadro) | `ero-web/src/motion/cena/SceneBackground.tsx` |
| Shader | `ero-web/src/motion/cena/SceneShader.ts` |
| Troca de tema em vídeo | `ero-web/src/motion/cena/trocarTema.ts` e `sceneSync.ts` |
| Tempos e curvas | `ero-web/src/motion/tokens.ts` (`cena`, `fundo`) |
| Cores da gradação, aurora, bloom e tintas | `ero-web/src/styles/tokens.css` (bloco "Fundo de cena") |
| Lista branca do front (id ↔ código da API) | `ero-web/src/shared/aparencia/mapear.ts` (`Fundo`, `FUNDOS`, `FundoApi`) |
| Catálogo do backend | `ero-api/src/main/java/com/api/ero_api/tenant/enums/Fundo.java` |
| Fotos e máscaras | `ero-web/public/cenas/<id>/{dia.webp, noite.webp, mascaras.png}` |
| Scripts | `ero-web/scripts/cena-mascaras.py`, `ero-web/scripts/cena-bokeh.py` |

## Cena pública ou exclusiva?

- **Pública:** aparece no catálogo de todos os contratantes. Entra em `CENAS` (no pacote principal).
- **Exclusiva:** feita para um contratante só (foto da fachada, do escritório dele). Só pode ser usada por quem estiver vinculado a ela (`tenant.fundo_exclusivo`, com índice único: uma cena exclusiva pertence a no máximo um contratante). Regras:
  - **nome neutro**, sem o nome do cliente: `exclusiva-01`, `exclusiva-02`… (no front) e `EXCLUSIVA_01`… (no backend). O pacote do front é público; o nome não pode revelar quem é o cliente;
  - **carregada sob demanda**: o objeto da cena fica num módulo próprio, importado só quando o fundo é escolhido (`CENAS_EXCLUSIVAS` em `cenas.ts`). Quem não usa nunca baixa os dados nem as fotos;
  - rótulo também neutro no `Fundo.java` ("Exclusiva 01"): o catálogo `GET /api/tenants/fundos` é só do superadmin, mas o rótulo aparece em telas e logs.

## Passo a passo (exemplo: `exclusiva-01`, a recepção do escritório de um cliente)

### 1. Fotos de dia e de noite, alinhadas

- Mesmo enquadramento, mesma câmera, **alinhadas pixel a pixel** e do mesmo tamanho. Qualquer deslocamento aparece como "fantasma" no meio da troca.
- Caminhos que já funcionaram (ver `design/CENA-ESCRITORIO.md`):
  - gerar o dia e, **na mesma conversa**, pedir a noite como edição do dia ("Same image, exact same framing… Change to night… Do not move, add or remove anything");
  - editar uma foto real para dia e depois para noite;
  - foto desfocada (bokeh) de uma versão só: `scripts/cena-bokeh.py` amplia 3× e deriva a outra.
- Sem logotipos, letreiros, neon ou texto legível. Prédios reais com silhueta registrada (ex.: Burj Al Arab na Marina) não vão para venda.
- Exporte em **WebP**, largura entre 1300 e 1900 px, qualidade ~80 (cada arquivo idealmente abaixo de 400 KB). A cena é desfocada pelo foco do fundo; resolução maior só pesa.
- Confira o alinhamento sobrepondo as duas em modo "diferença" num editor de imagem: o que não é luz deve ficar preto.

Arquivos: `ero-web/public/cenas/exclusiva-01/dia.webp` e `noite.webp`.

### 2. Máscaras (`scripts/cena-mascaras.py`)

O script gera um PNG RGBA na metade da resolução da foto. Cada canal diz ao shader onde cada efeito acontece:

| Canal | Significa |
|---|---|
| R | exterior (janela ou céu): muda com o dia, não com as luminárias |
| G | brilho das luminárias (cena interna) ou céu (cena externa, com `--ceu`: onde surgem estrelas) |
| B | luzes da cidade / janelas: pontos que acendem cada um no seu tempo |
| A | água (reflexos que ondulam), guardada invertida (`255 − água/2`) |

Opções: `--exterior "x,y x,y …"` (polígono da janela ou do céu, em pixels da foto), `--teto 0.38` (abaixo dessa fração da altura não há luminárias), `--ceu` (cena externa), `--agua "x,y …"` (polígono da água), `--luz-noite 0.4` (luz artificial de qualquer cor na foto noturna, para holofotes e fachadas coloridas).

Requer Python 3 com Pillow. Rode de dentro de `ero-web/`:

```bash
python -I scripts/cena-mascaras.py public/cenas/exclusiva-01/dia.webp public/cenas/exclusiva-01/noite.webp \
  public/cenas/exclusiva-01/mascaras.png --teto 0.4 --exterior "1020,40 1500,40 1500,520 1020,520"
```

Abra o `mascaras.png` canal por canal e confira: o R cobre só a janela, o G só as lâmpadas, o B só pontos de luz.

### 3. Luminárias e janelas (medidas na foto de dia)

- **Cena interna:** liste as luminárias com centro `x`, `y` e largura `w` em **% da foto** (px ÷ largura × 100) e a `fileira` (0 = a mais próxima da câmera). Lâmpadas da mesma fileira acendem juntas, como um circuito; as fileiras acendem da frente para o fundo. Máximo de 24 (`MAX_LUZES` em `SceneShader.ts`). `alcance` controla quanto cada uma ilumina em volta (`{ base: 0.1, fator: 1.1 }` serve para escritórios).
- **Cena externa:** sem luminárias (`luzes: []`); as luzes do canal B acendem pela grade `janelas`: `colunas × linhas` células, cada uma no seu tempo; `subida` (0–1) faz os andares de baixo acenderem primeiro; `suave: true` para fotos desfocadas (cada ponto de luz acende inteiro). Sem `janelas`, vale `JANELAS_PADRAO` (janelas pequenas, ordem sorteada). `horizonte` é a linha d'água em fração da altura, quando há reflexo.
- **`vidro: 'denso'`** quando a foto tem cores fortes: os cartões ficam mais opacos enquanto a cena está ativa (tokens `[data-vidro='denso']` em `tokens.css`), para o texto continuar legível (contraste AA é inegociável).

### 4. Registrar no front

Cena **exclusiva**, módulo próprio `ero-web/src/motion/cena/exclusivas/exclusiva-01.ts`:

```ts
import type { Cena } from '../cenas';

const base = import.meta.env.BASE_URL;

/** Exclusiva 01 (contratante: ver vínculo no banco). Par gerado em <data>; licença: <origem>. 1600×900, WebP. */
const cena: Cena = {
  id: 'exclusiva-01',
  nome: 'Exclusiva 01',
  tipo: 'interior',
  dia: `${base}cenas/exclusiva-01/dia.webp`,
  noite: `${base}cenas/exclusiva-01/noite.webp`,
  mascaras: `${base}cenas/exclusiva-01/mascaras.png`,
  proporcao: 1600 / 900,
  luzes: [
    { x: 30.5, y: 8.2, w: 10.4, fileira: 0 },
    { x: 68.0, y: 8.0, w: 10.9, fileira: 0 },
    { x: 41.2, y: 22.6, w: 5.8, fileira: 1 },
    { x: 58.9, y: 22.4, w: 6.1, fileira: 1 },
  ],
  alcance: { base: 0.1, fator: 1.1 },
};
export default cena;
```

E em `cenas.ts`:

```ts
export const CENAS_EXCLUSIVAS: Record<string, () => Promise<Cena>> = {
  'exclusiva-01': () => import('./exclusivas/exclusiva-01').then((m) => m.default),
};
```

Cena **pública**: o mesmo objeto direto em `cenas.ts` (`export const NOVA: Cena = {…}`) e acrescentado a `CENAS`.

Depois, a lista branca em `shared/aparencia/mapear.ts` (sem isso o front descarta o código vindo da API):

```ts
export type Fundo = 'orbs' | … | 'coworking' | 'exclusiva-01';
export const FUNDOS: readonly Fundo[] = [ …, 'exclusiva-01' ];
export type FundoApi = 'ORBS' | … | 'COWORKING' | 'EXCLUSIVA_01';
```

`fundoDeCodigo` já converte `EXCLUSIVA_01` → `exclusiva-01`. O TypeScript aponta os outros lugares que listam todos os fundos (ex.: os rótulos da seção Movimento do catálogo, `design-system/catalogo/SecaoMovimento.tsx`).

Enquanto a cena exclusiva carrega, o `LiveBackground` mantém o fundo anterior e troca com o esmaecimento de sempre quando ela chega. A troca de contratante espera as fotos (até `cena.esperaFotos`) antes de começar a sequência de luzes.

### 5. Registrar no backend

Em `Fundo.java`, com `exclusiva = true`:

```java
EXCLUSIVA_01("Exclusiva 01", TipoFundo.CENA, true);
```

Não precisa de migration: `tenant.fundo` e `tenant.fundo_exclusivo` são VARCHAR sem CHECK justamente para o catálogo crescer. As regras já estão no `TenantService` (`validarFundos`):

| Situação | Resposta |
|---|---|
| `fundoExclusivo` com uma cena que não é exclusiva | 422 "Esta cena não é exclusiva." |
| `fundoExclusivo` já vinculado a outro contratante | 409 "Esta cena exclusiva já pertence a outro contratante." (o índice único do banco segura a corrida) |
| `fundo` exclusivo sem ser o `fundoExclusivo` do contratante | 422 "Este fundo não está disponível para este contratante." |

`GET /api/tenants/fundos?tenantId=` devolve as públicas, as exclusivas livres e a exclusiva do próprio contratante.

### 6. Teste da exclusividade pela API

Quando a primeira cena exclusiva existir, acrescente em `TenantAparenciaIntegracaoTest` (os auxiliares `novoContratante`, `loginSuperadmin`, `versao`, `aparencia`, `put`, `get`, `status` e `corpo` já estão lá):

```java
@Test
void cenaExclusivaPertenceAUmContratanteSo() {
    Contratante a = novoContratante();
    Contratante b = novoContratante();
    Sessao s = loginSuperadmin();
    Map<String, Object> visual = aparencia("azul", "ESCURO", "EXCLUSIVA_01", true, 12, new BigDecimal("3"), "COMPLETAS");

    // A recebe a cena e passa a usá-la como fundo
    assertThat(status(put("/api/tenants/" + a.id() + "/configuracao", s.token(),
            Map.of("aparencia", visual, "fundoExclusivo", "EXCLUSIVA_01", "version", versao(s, a.id()))))).isEqualTo(200);

    // B não pode receber a mesma cena: 409
    MvcTestResult outra = put("/api/tenants/" + b.id() + "/configuracao", s.token(),
            Map.of("aparencia", visual, "fundoExclusivo", "EXCLUSIVA_01", "version", versao(s, b.id())));
    assertThat(status(outra)).isEqualTo(409);
    assertThat(corpo(outra).path("detail").asString()).isEqualTo("Esta cena exclusiva já pertence a outro contratante.");

    // nem usá-la como fundo sem o vínculo: 422
    assertThat(status(put("/api/tenants/" + b.id() + "/configuracao", s.token(),
            Map.of("aparencia", visual, "version", versao(s, b.id()))))).isEqualTo(422);

    // o catálogo de B não mostra a cena de A
    assertThat(corpo(get("/api/tenants/fundos?tenantId=" + b.id(), s.token())).valueStream()
            .map(f -> f.path("codigo").asString())).doesNotContain("EXCLUSIVA_01");
}
```

`./mvnw verify` verde (com o Docker ligado) antes de entregar.

### 7. Vincular ao contratante

Superadmin → Contratantes → **Configurar aparência** do cliente:

1. em **Cena exclusiva** (só aparece para o superadmin e só quando há alguma livre no catálogo), escolha "Exclusiva 01";
2. a cena aparece na grade de **Fundo**: escolha-a; a prévia já mostra a cena na interface inteira;
3. ajuste **Foco do fundo** e **Intensidade do vidro** olhando a legibilidade dos cartões nos dois temas;
4. **Salvar**. O vínculo e o fundo vão no mesmo `PUT /api/tenants/{id}/configuracao`.

### 8. Conferir antes de entregar

- `/design-system` (só em desenvolvimento), seção **Movimento**: escolha a cena e troque o tema várias vezes. A luz muda primeiro e a interface troca no meio da sequência; inverter no meio não pode dar salto.
- No console, `__cena.quadro(0.35)` desenha um ponto qualquer da sequência (o segundo parâmetro `false` mostra o caminho de apagar). Passe por 0, 0.25, 0.5, 0.75 e 1.
- Medidor de fps (canto inferior do catálogo e da demonstração): a sequência deve ficar fluida num notebook comum.
- Movimento reduzido (Animações "Reduzidas" no catálogo, ou `prefers-reduced-motion` no sistema): a cena só esmaece (`cena.duracaoReduzida`).
- Sem WebGL 2 (ex.: Firefox com `webgl.enable-webgl2 = false` em `about:config`): as duas fotos esmaecem uma sobre a outra.
- Contraste AA do texto sobre os cartões nos dois temas, no ponto mais claro e no mais escuro da foto.
- Na troca de contratante, a prévia da Configuração e várias trocas seguidas de cena não podem acumular contextos WebGL (o `Renderizador.destruir()` libera o contexto quando o canvas sai da página; no console não deve aparecer "Too many active WebGL contexts").

### 9. Licença e registro

- Anote no comentário da cena (e numa seção nova de `design/CENA-ESCRITORIO.md` quando for pública) a **origem** das fotos, a data, os prompts ou a edição feita.
- Foto do próprio cliente: autorização por escrito para uso no sistema.
- Banco de imagens gratuito (como Expediente e Coworking): antes de vender, licenciar a versão em alta ou gerar equivalente.
- Gerada por IA: guardar os prompts; conferir que não há marca, pessoa reconhecível ou prédio com silhueta registrada.
- Cena exclusiva: o vínculo com o cliente fica **só no banco** (`tenant.fundo_exclusivo`), nunca no código, no nome do arquivo ou no commit.
