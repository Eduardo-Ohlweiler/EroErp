"""
Gera a textura de máscaras de uma cena do fundo (usada pelo shader em SceneShader.tsx).

Canais de saída (PNG RGBA, metade da resolução da foto):
  R = exterior (janela ou céu): onde a cena muda com o dia, não com as luminárias
  G = brilho das luminárias (realces da foto de dia, desfocados)
  B = luzes da cidade (pontos claros da foto noturna dentro do exterior)
  A = 255 − água/2 (reflexos que ondulam). Guardado invertido e nunca abaixo de 128 para o
      navegador não descartar o RGB de pixels transparentes; o shader desfaz: água = (1 − a) × 2.

Uso:
  python -I scripts/cena-mascaras.py <dia> <noite> <saida.png> --exterior "x,y x,y ..." [--agua "x,y ..."]
Coordenadas em pixels da foto original.
"""
import argparse
from PIL import Image, ImageChops, ImageDraw, ImageFilter


def poligono(tam, texto, desfoque):
    m = Image.new('L', tam, 0)
    if texto:
        pts = [tuple(float(v) for v in p.split(',')) for p in texto.split()]
        ImageDraw.Draw(m).polygon(pts, fill=255)
    return m.filter(ImageFilter.GaussianBlur(desfoque)) if desfoque else m


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('dia')
    ap.add_argument('noite')
    ap.add_argument('saida')
    ap.add_argument('--exterior', default='')
    ap.add_argument('--agua', default='')
    ap.add_argument('--teto', type=float, default=1.0, help='fração da altura abaixo da qual não há luminárias (0–1)')
    a = ap.parse_args()

    dia = Image.open(a.dia).convert('L')
    noite_rgb = Image.open(a.noite).convert('RGB')
    noite = noite_rgb.convert('L')
    W, H = dia.size

    exterior = poligono((W, H), a.exterior, 3)

    # Luminárias: só o que é quase branco puro na foto de dia, fora do exterior, bem desfocado.
    realce = dia.point(lambda v: 255 if v >= 250 else 0)
    realce = ImageChops.multiply(realce, ImageChops.invert(exterior))
    teto = Image.new('L', (W, H), 0)
    ImageDraw.Draw(teto).rectangle([0, 0, W, int(H * a.teto)], fill=255)
    realce = ImageChops.multiply(realce, teto.filter(ImageFilter.GaussianBlur(H * 0.02)))
    brilho = realce.filter(ImageFilter.GaussianBlur(W / 90))
    brilho = brilho.point(lambda v: min(255, int(v * 3.2)))

    # Luzes da cidade: pontos mais claros que a vizinhança na foto noturna, dentro do exterior.
    viz = noite.filter(ImageFilter.GaussianBlur(6))
    pontos = ImageChops.subtract(noite, viz).point(lambda v: min(255, max(0, (v - 6) * 9)))
    # só luz quente (janelas acesas, postes); caixilhos e céu são azulados
    r, _, b = noite_rgb.split()
    quente = ImageChops.subtract(r, b).point(lambda v: min(255, max(0, (v - 4) * 12)))
    pontos = ImageChops.multiply(ImageChops.multiply(pontos, exterior), quente)

    agua = poligono((W, H), a.agua, 6).point(lambda v: 255 - v // 2)

    meio = (W // 2, H // 2)
    saida = Image.merge('RGBA', [c.resize(meio, Image.LANCZOS) for c in (exterior, brilho, pontos, agua)])
    saida.save(a.saida, optimize=True)
    print(a.saida, meio)


if __name__ == '__main__':
    main()
