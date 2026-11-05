# Fundos de cena: escritório e cidade

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
