"""
Gera a textura de máscaras de uma cena do fundo (usada pelo shader em SceneShader.tsx).

Canais de saída (PNG RGBA, metade da resolução da foto):
  R = exterior (janela ou céu): onde a cena muda com o dia, não com as luminárias
  G = brilho das luminárias (cenas internas) ou céu (cenas externas, com --ceu): onde podem surgir estrelas
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
    ap.add_argument('--ceu', action='store_true', help='cena externa: G vira a máscara do céu (acima da linha dos prédios)')
    ap.add_argument('--luz-noite', type=float, default=0.0,
                    help='0–1: tudo que na foto noturna for mais claro que isso (fora do céu) é luz artificial, de qualquer cor '
                         '(holofotes, fachadas iluminadas, reflexos coloridos); soma-se às luzes quentes')
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

    if a.ceu:
        # Linha dos prédios: em cada coluna, o primeiro contorno forte de cima para baixo na foto de dia
        # (nuvens têm borda suave e não contam). Suavizada entre colunas e com margem para não pegar telhado.
        bordas = dia.filter(ImageFilter.FIND_EDGES).filter(ImageFilter.MaxFilter(3))
        px = bordas.load()
        limite = [H] * W
        for x in range(W):
            for y in range(4, H):  # as primeiras linhas têm a borda da própria imagem
                if px[x, y] > 38:
                    limite[x] = y
                    break
        raio = 3
        limite = [min(limite[max(0, x - raio):x + raio + 1]) for x in range(W)]
        ceu = Image.new('L', (W, H), 0)
        d = ImageDraw.Draw(ceu)
        for x in range(W):
            if limite[x] > 6:
                d.line([(x, 0), (x, limite[x] - 6)], fill=255)
        brilho = ceu.filter(ImageFilter.GaussianBlur(2))

    if a.luz_noite > 0:
        # À noite, o que é claro fora do céu só pode ser luz artificial, de qualquer cor.
        lim = a.luz_noite * 255
        claro = noite.point(lambda v: min(255, max(0, int((v - lim) * 6))))
        claro = ImageChops.multiply(claro, exterior)
        if a.ceu:
            claro = ImageChops.multiply(claro, ImageChops.invert(brilho))
        pontos = ImageChops.lighter(pontos, claro)

    meio = (W // 2, H // 2)
    saida = Image.merge('RGBA', [c.resize(meio, Image.LANCZOS) for c in (exterior, brilho, pontos, agua)])
    saida.save(a.saida, optimize=True)
    print(a.saida, meio)


if __name__ == '__main__':
    main()
