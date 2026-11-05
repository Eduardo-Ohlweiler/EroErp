# Fundos de cena: escritório, cidade, marina, expediente e coworking

Fundo fotográfico que acompanha o tema, como um plano de cinema. Um shader WebGL mistura a foto de **noite** e a de **dia** (mesmo enquadramento) em espaço linear, como luz de verdade.

- **Escritório, tema claro:** a janela amanhece com luz quente e as luzes da cidade apagam uma a uma. As fileiras de luminárias acendem da frente para o fundo, com partida de lâmpada fluorescente. A câmera dá um leve estouro de exposição quando cada fileira firma e depois se ajusta.
- **Escritório, tema escuro:** o inverso. As fileiras apagam do fundo para a frente, a janela entardece e a cidade acende.
- **Cidade:** sem luminárias. O céu amanhece ou anoitece, as janelas dos prédios acendem ou apagam cada uma no seu tempo, e o reflexo na água ondula.
- **Durante a troca:** leve aproximação de câmera, respiro de foco, bloom nas luzes, vinheta e grão de filme. A interface troca de tema esmaecendo no meio da sequência (`cena.trocaInterface`), não no clique.
- **Movimento reduzido:** só esmaece. **Sem WebGL 2:** as duas fotos esmaecem uma sobre a outra.

## Onde está cada coisa

| O quê | Arquivo |
|---|---|
| Roteiro (tempo → quadro) | `prototipo/src/components/layout/SceneBackground.tsx` |
| Shader e texturas | `prototipo/src/components/layout/SceneShader.ts` |
| Dados das cenas (fotos, luminárias por fileira) | `prototipo/src/components/layout/cenas.ts` |
| Ponte com o botão de tema | `prototipo/src/components/layout/sceneSync.ts` e `Topbar.tsx` |
| Tempos e curvas | `prototipo/src/motion/tokens.ts` (`cena`) |
| Cores (gradação, aurora, bloom, tintas) | `prototipo/src/styles/tokens.css` (bloco "Fundo de cena") |
| Máscaras | `prototipo/scripts/cena-mascaras.py` → `public/cenas/<cena>/mascaras.png` |

Para conferir um ponto da sequência em desenvolvimento, rode no console do navegador `__cena.quadro(0.35)`. O segundo parâmetro `false` mostra o caminho de apagar.

## Escritório

Par gerado no Gemini em 05/11/2026, em `public/cenas/escritorio/` (`dia.webp`, `noite.webp`, 1672×941, alinhados pixel a pixel). São 20 luminárias em 6 fileiras.

Máscaras:

```bash
python -I scripts/cena-mascaras.py public/cenas/escritorio/dia.webp public/cenas/escritorio/noite.webp public/cenas/escritorio/mascaras.png --teto 0.38 --exterior "0,30 185,120 335,195 430,245 545,300 635,340 635,505 555,520 555,540 372,560 372,690 272,705 272,648 0,650"
```

## Cidade

Orla com prédios e reflexo na água. O par foi gerado no Gemini em 05/11/2026, com a foto de Singapura (`images.jpg`) só como referência de composição. Fica em `public/cenas/cidade/` (`dia.webp`, `noite.webp`, 1376×768, alinhados pixel a pixel).

Na foto de noite foram retocados os logotipos, a faixa de neon azul e os letreiros no topo das torres, copiando a fachada vizinha. As luzes vermelhas e azuis restantes, inclusive os reflexos na água, viraram luz quente de janela.

Realismo próprio das cenas externas:
- estrelas só no céu (máscara G), cintilando e surgindo com a noite;
- faixa quente do amanhecer acima dos prédios;
- neblina de luz sobre a cidade acesa;
- água com ondinhas irregulares, maiores perto da câmera;
- cada reflexo acende junto com a janela acima dele.

Máscaras:

```bash
python -I scripts/cena-mascaras.py public/cenas/cidade/dia.webp public/cenas/cidade/noite.webp public/cenas/cidade/mascaras.png --ceu --exterior "0,0 1376,0 1376,768 0,768" --agua "0,533 1376,537 1376,768 0,768"
```

### Prompts usados

**Dia**, com a referência anexada:

> Use the attached image only as a composition reference (waterfront skyline seen from the opposite shore). Create a new, original scene; do not copy it.
>
> Photorealistic wide cinematic photo of a modern city skyline on a calm waterfront in the morning, eye level from the opposite shore. The skyline fills the middle third of the frame, calm water in the lower third with soft reflections of the buildings, clear light-blue sky with a few thin clouds in the upper third. Muted natural palette: soft blues, warm greys, glass and concrete. Building windows unlit. No neon, no saturated colors, no logos, no text, no boats or people in the center. 16:9, the highest resolution available.

**Noite**, como edição da imagem do dia:

> Same image, exact same framing, camera and buildings. Change to night: deep navy sky, warm lights on in many building windows (scattered, not all of them), soft reflections of those lights on the water, a few warm street lights along the shore. No neon colors, no fireworks. Do not move, add or remove anything.

Em uma nova geração, acrescentar ao prompt de noite: *"No logos, brand signs, neon strips or text on any building; no red or blue lights."*

## Marina

Baía com iates e cores fortes. O par foi **editado** no Gemini em 05/11/2026 a partir de uma foto de Dubai (`HAzlPE.webp`, 500×336): primeiro a versão de dia da própria foto e, na mesma conversa, a noite a partir do dia. Fica em `public/cenas/marina/` (`dia.webp`, `noite.webp`, 1262×848, alinhados pixel a pixel).

**Atenção:** a cena mostra o Burj Al Arab e o Jumeirah Beach Hotel, prédios reais com silhueta registrada como marca. Serve para o protótipo; antes de vender, trocar a cena ou mudar a torre.

- Retoque para tirar o ar de cartão-postal gerado por IA: dia com saturação 0,8, menos contraste local e curva de filme; noite quase original (saturação 0,93).
- Como a foto tem cores fortes, a cena deixa os cartões mais opacos enquanto está ativa (`vidro: 'denso'` em `cenas.ts`, tokens `[data-vidro='denso']` em `tokens.css`).
- As luzes acendem **andar por andar, de baixo para cima**, e apagam no sentido inverso (`janelas` em `cenas.ts`). A máscara inclui luz de qualquer cor (`--luz-noite`), para o holofote violeta da torre e os reflexos coloridos entrarem na sequência.
- Só a água aberta à direita ondula; os barcos ficam parados.

Máscaras:

```bash
python -I scripts/cena-mascaras.py public/cenas/marina/dia.webp public/cenas/marina/noite.webp public/cenas/marina/mascaras.png --ceu --luz-noite 0.4 --exterior "0,0 1262,0 1262,848 0,848" --agua "950,630 1130,628 1130,710 1262,710 1262,848 795,848 800,770 890,758 890,695 950,688"
```

Prompts de edição (com a foto anexada):

> Edit this exact photo. Keep every building, boat, pier and the exact framing and camera position unchanged. Only change the time of day to a bright sunny morning: blue sky with a few thin clouds, turquoise water, sunlight on the buildings, all lights off. Output at the highest resolution available, sharp and photorealistic.

> Same image, exact same framing, buildings and boats. Change to night, like the original photo: deep blue and violet sky, the tower lit with blue and violet floodlights, warm lights in the hotel windows, colorful reflections on the water. Do not move, add or remove anything.

## Expediente e Coworking (fotos desfocadas)

Duas fotos desfocadas (bokeh) de banco de imagens gratuito, baixadas em 05/11/2026: um escritório envidraçado no fim do dia, com luzes quentes (Expediente), e um open space claro (Coworking). Combinam bem com o vidro: o desfoque já vem pronto e não há detalhe duro competindo com os cartões.

**Licença:** são versões gratuitas de banco de imagens. Antes de vender, licenciar a versão em alta ou gerar equivalentes.

Cada uma tinha só uma versão (500 a 600 px de largura). O script `scripts/cena-bokeh.py` amplia 3× e deriva a outra:

- **Expediente:** a foto é a noite; o dia sai com mais exposição, branco neutro e lâmpadas mais fracas (1575×1050).
- **Coworking:** a foto é o dia; a noite sai com o ambiente escuro e frio e só os pontos de luz acesos. As bordas finas de cadeiras e vidro ficam de fora (1875×1050).

Nessas cenas, **no tema escuro as luzes acendem ponto a ponto** e no claro apagam. As luzes acendem em manchas de borda suave (`janelas.suave` em `cenas.ts`), não em células quadradas, para cada ponto de luz e cada brilho grande acenderem inteiros.

```bash
python -I scripts/cena-bokeh.py noite <foto-expediente> public/cenas/expediente
python -I scripts/cena-mascaras.py public/cenas/expediente/dia.webp public/cenas/expediente/noite.webp public/cenas/expediente/mascaras.png --luz-noite 0.55 --exterior "0,0 1575,0 1575,1050 0,1050"

python -I scripts/cena-bokeh.py dia <foto-coworking> public/cenas/coworking
python -I scripts/cena-mascaras.py public/cenas/coworking/dia.webp public/cenas/coworking/noite.webp public/cenas/coworking/mascaras.png --luz-noite 0.4 --exterior "0,0 1875,0 1875,1050 0,1050"
```
