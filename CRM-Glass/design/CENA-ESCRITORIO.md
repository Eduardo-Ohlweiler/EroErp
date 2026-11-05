# Fundo de cena: escritório

Fundo fotográfico que acompanha o tema: no **claro** a janela amanhece e as luminárias acendem uma a uma (da frente para o fundo); no **escuro** apagam na ordem inversa. Código em `prototipo/src/components/layout/SceneBackground.tsx`, dados em `cenas.ts`, tempos em `motion/tokens.ts` (`cena`), cores em `styles/tokens.css` (bloco "Fundo de cena").

Hoje roda com uma **imagem provisória** (prévia de banco, sem licença, em `prototipo/public/cenas/_provisorio/`, fora do git) e a noite é derivada por filtro. A definitiva será um par dia/noite gerado por IA.

## Como gerar o par (Gemini, plano gratuito)

1. Anexe a imagem de referência de composição e use o prompt **Dia**.
2. **Na mesma conversa**, anexe a imagem do dia que saiu (não a referência) e use o prompt **Noite**.
3. Salve como `escritorio-dia.png` e `escritorio-noite.png`. O alinhamento é conferido antes de entrar no sistema.

Por que estes cuidados: o fundo fica atrás de cartões de vidro, então **nada muito escuro ou saturado** pode ficar no terço de baixo e no centro (onde ficam os cartões). Monitores escuros e móveis amarelos viravam manchas no tema claro.

### Dia

> Use the attached image only as a composition reference (camera angle, window wall on the left, rows of ceiling lights). Create a new, original scene; do not copy it.
>
> Photorealistic wide-angle photo of a modern open-plan office interior, eye level, symmetric one-point perspective toward the back wall. Floor-to-ceiling window wall on the left showing a city skyline under a clear daytime sky. White ceiling with 4 rows of rectangular recessed LED panel lights receding into the distance, all switched ON. Low white desks with light grey chairs; no desktop monitors. A few laptops, closed or showing a soft light-grey screen. Nothing dark or high-contrast in the lower third or in the center of the image. A glass-walled meeting room on the right with light grey chairs. Neutral palette: white, light grey, soft natural wood, a few green plants. No saturated colors, no yellow furniture, no black objects, no logos, no text, no people. Calm, uncluttered, evenly lit. 16:9, the highest resolution available.

### Noite (edição da imagem do dia)

> Same image, exact same framing, camera and objects. Change to night: every ceiling light switched OFF, laptop screens off, office interior dark with faint cool blue light coming from the window, city outside at night with scattered lit windows, deep navy sky. Do not move, add or remove anything.

## Ao receber as imagens

- Converter para AVIF/WebP em 1280 e 2560 px (ou o que o gerador entregar) em `prototipo/public/cenas/escritorio/`.
- Em `cenas.ts`: trocar `dia`, preencher `noite` e **remapear as luminárias** (x, y, largura em % da foto) e a elipse da janela.
- Repetir a conferência: escuro, claro, troca de tema, movimento reduzido, 375 px, contraste.
