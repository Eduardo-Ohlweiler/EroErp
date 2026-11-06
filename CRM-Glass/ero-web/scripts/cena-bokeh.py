"""
Prepara um par dia/noite a partir de UMA foto desfocada (bokeh), para os fundos de cena.
Amplia 3× (o desfoque esconde a resolução baixa) e deriva a versão que falta:

  noite  a foto é a noite (escura, luzes acesas): o dia é derivado (mais exposição, branco neutro, lâmpadas fracas)
  dia    a foto é o dia (clara): a noite é derivada (ambiente escuro e frio, só os pontos de luz acesos)

Uso:
  python -I scripts/cena-bokeh.py noite <foto> public/cenas/<cena>
  python -I scripts/cena-bokeh.py dia <foto> public/cenas/<cena>
Gera dia.webp e noite.webp na pasta; as máscaras saem depois com cena-mascaras.py (--luz-noite).
"""
import sys
import numpy as np
from PIL import Image, ImageFilter

def lin(im): return (np.asarray(im, dtype=np.float32) / 255.0) ** 2.2
def srgb(a, ruido=0.0):
    a = np.clip(a, 0, 1) ** (1 / 2.2)
    if ruido:  # pontilhado leve contra degraus de 8 bits
        a = a + np.random.default_rng(3).uniform(-ruido, ruido, a.shape[:2])[..., None]
    return Image.fromarray((np.clip(a, 0, 1) * 255 + 0.5).astype(np.uint8))
def ampliar(im, f, suave):
    w, h = im.size
    return im.resize((w * f, h * f), Image.LANCZOS).filter(ImageFilter.GaussianBlur(f * suave))
def joelho(a, k=0.7):
    e = np.maximum(a - k, 0); return np.minimum(a, k) + e / (1 + e / (1 - k))
def _caixa(a, r, eixo):
    if r < 1: return a
    pad = [(0, 0)] * a.ndim; pad[eixo] = (r + 1, r)
    c = np.cumsum(np.pad(a, pad, mode='edge'), axis=eixo)
    n = a.shape[eixo]
    return (np.take(c, range(2 * r + 1, 2 * r + 1 + n), axis=eixo) - np.take(c, range(0, n), axis=eixo)) / (2 * r + 1)
def borrar(a, sigma):
    # gaussiana aproximada: três passadas de caixa em cada eixo (float, sem degraus)
    r = max(1, int(round((np.sqrt(12 * sigma * sigma / 3 + 1) - 1) / 2)))
    for _ in range(3):
        a = _caixa(_caixa(a, r, 0), r, 1)
    return a
def luz_mask(a, lim, r_viz=10, abre=7):
    # só pontos de luz compactos (lâmpadas e seus reflexos); áreas claras grandes (janelas) não contam
    l = (a * [0.2126, 0.7152, 0.0722]).sum(-1)
    viz = borrar(l, r_viz)
    grande = borrar(l, r_viz * 3)
    m = np.clip((l - viz - lim) * 8, 0, 1) * np.clip(1.6 - grande * 2.2, 0, 1)
    # abertura morfológica: some o que é fino (bordas de cadeira, vidro), ficam os pontos redondos
    m8 = Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(abre)).filter(ImageFilter.MaxFilter(abre + 2))
    m = borrar(np.asarray(m8, np.float32) / 255, 2)
    return np.clip(m * 1.5, 0, 1)[..., None]


def salvar(im, caminho):
    im.save(caminho, quality=90, method=6)


def main():
    modo, foto, destino = sys.argv[1], sys.argv[2], sys.argv[3]
    a = lin(ampliar(Image.open(foto).convert('RGB'), 3, 0.6))
    if modo == 'noite':
        m = luz_mask(a, 0.015)
        dia = borrar(a, 5) * 3.2                # base suave (esconde os degraus do JPEG) e exposição
        dia = dia * [0.84, 0.97, 1.18]          # balanço de branco: tira o laranja
        l = (dia * [0.2126, 0.7152, 0.0722]).sum(-1, keepdims=True)
        dia = l + (dia - l) * 0.6
        dia = dia * (1 - m * 0.5)               # lâmpadas perdem força de dia
        dia = 0.05 + dia * 0.95                 # luz difusa de janela
        salvar(srgb(joelho(a, 0.8)), destino + '/noite.webp')
        salvar(srgb(joelho(dia), 0.004), destino + '/dia.webp')
    elif modo == 'dia':
        m = luz_mask(a, 0.05, abre=11)
        base = borrar(a, 3) * 0.12 * np.array([0.7, 0.82, 1.15])   # ambiente escuro e frio
        luz = m * (a * 0.9 + 0.2) * np.array([1.0, 0.8, 0.55])      # lâmpadas acesas, quentes
        salvar(srgb(joelho(a, 0.8)), destino + '/dia.webp')
        salvar(srgb(joelho(base + luz, 0.8), 0.004), destino + '/noite.webp')
    else:
        sys.exit('modo deve ser "noite" ou "dia"')
    print(destino, a.shape[1], 'x', a.shape[0])


if __name__ == '__main__':
    main()
