#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
montar-compartir.py — la imagen de COMPARTIR de un recurso web (Open Graph).

Por que existe (Iker, 2026-08-14): hasta hoy cada lead magnet nuevo pedia DOS
imagenes generadas a mano, la del post y la de compartir, y la segunda es
siempre la MISMA plantilla con otro texto. Generarla con IA cada vez costaba
varias pasadas, salia con el acabado de render y habia que limpiarla. Con la
plantilla PSD que hizo Iker, esto la compone en un segundo, calcada al pixel y
sin metadatos que borrar, igual que `montar-orla.py` hace la orla de "Los 10".

    python scripts/montar-compartir.py \
        --linea1 "Buscar empresas es facil" \
        --linea2 "Tacharlas no" \
        --salida "C:/Users/.../criba-compartir.png"

Lo que NO hace y es a proposito:
  · No pone el logo. Lo inserta despues el chat de la web de recursos
    (`images §0b-OG`), que es quien la sube.
  · No inventa el diseño. Fondo, posiciones, cuerpos y colores salen del PSD:
    si Iker cambia la plantilla, esto cambia solo.
  · No encoge el texto para que quepa. Si no cabe, ABORTA con la medida exacta,
    porque la regla es que se acorta el COPY y nunca se toca el diseño
    (`lead-magnet-web §4c`). `--forzar` existe para una urgencia, avisando.

Lo unico que hay que saber del PSD: el `FontSize` de una capa de texto va en
unidades del documento, no en pixeles, asi que se multiplica por la escala de
la matriz de transformacion de la capa (`layer.transform`), y de esa misma
matriz salen la x y la LINEA BASE. Es la misma trampa que ya se documento en
`montar-llanta.py` con el titulo de la llanta.
"""

import argparse
import os
import sys

from PIL import Image, ImageDraw, ImageFont
from psd_tools import PSDImage

PLANTILLA = os.path.join(
    os.path.expanduser('~'), 'Documents', 'Mario', 'LINKEDIN GROWTH',
    'LEAD MAGNETS', 'PLANTILLA COMPARTIR.psd')

# La variable de Bricolage trae el ExtraBold como instancia con nombre, que es
# el peso que usa la plantilla (BricolageGrotesque-ExtraBold).
FUENTE = os.path.join(os.environ.get('LOCALAPPDATA', ''), 'Microsoft', 'Windows',
                      'Fonts', 'BricolageGrotesque-VariableFont_opsz,wdth,wght.ttf')

# Open Graph. NO es 1:1 y es la unica excepcion a `images §0b`, porque esta
# imagen no pasa por el feed: la recorta el previsualizador del enlace.
SALIDA_W, SALIDA_H = 1200, 630

# Margen derecho minimo, en proporcion del ancho del lienzo. La plantilla
# arranca el texto en x=113 de 1731, asi que se le exige el mismo aire al otro
# lado; si una linea lo invade, el titulo se lee pegado al borde.
MARGEN = 113 / 1731


def estilo(capa):
    """Cuerpo en pixeles, color RGB y linea base de una capa de texto del PSD."""
    hoja = capa.engine_dict['StyleRun']['RunArray'][0]['StyleSheet']['StyleSheetData']
    escala = capa.transform[0]
    cuerpo = float(hoja['FontSize']) * escala
    a, r, g, b = [float(v) for v in hoja['FillColor']['Values']]
    color = tuple(int(round(c * 255)) for c in (r, g, b))
    return cuerpo, color, (capa.transform[4], capa.transform[5])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--linea1', required=True, help='La de arriba, en mint claro. El problema o la situacion')
    ap.add_argument('--linea2', required=True, help='La de abajo, ENTERA en naranja. El remate')
    ap.add_argument('--salida', required=True)
    ap.add_argument('--plantilla', default=PLANTILLA)
    ap.add_argument('--fuente', default=FUENTE)
    ap.add_argument('--forzar', action='store_true',
                    help='Encoge el texto si no cabe en vez de abortar. Para una urgencia; lo correcto es acortar el copy')
    a = ap.parse_args()

    for ruta, que in ((a.plantilla, 'la plantilla PSD'), (a.fuente, 'la fuente Bricolage Grotesque')):
        if not os.path.exists(ruta):
            sys.exit('ERROR: no encuentro %s en %s' % (que, ruta))

    psd = PSDImage.open(a.plantilla)
    capas = {c.name: c for c in psd if c.kind == 'type'}
    try:
        c1, c2 = capas['Texto linea 1'], capas['Texto linea 2']
    except KeyError:
        sys.exit('ERROR: la plantilla tiene que traer las capas "Texto linea 1" y "Texto linea 2". '
                 'Hay: %s' % ', '.join(c.name for c in psd))

    # El fondo es la plantilla con los textos apagados: asi el degradado, el
    # halo y las formas azules salen tal cual los dejo el diseñador.
    for c in (c1, c2):
        c.visible = False
    fondo = psd.composite(force=True).convert('RGB')
    lienzo = ImageDraw.Draw(fondo)

    dibujo = []
    for capa, texto in ((c1, a.linea1), (c2, a.linea2)):
        cuerpo, color, (x, base) = estilo(capa)
        dibujo.append([texto, cuerpo, color, x, base])

    # ¿Cabe? Se mide de verdad, no se estima (`lead-magnet-web §4c`).
    limite = fondo.width * (1 - MARGEN)
    factor = 1.0
    for texto, cuerpo, _, x, _ in dibujo:
        f = ImageFont.truetype(a.fuente, int(round(cuerpo)))
        f.set_variation_by_name('ExtraBold')
        ancho = x + lienzo.textlength(texto, font=f)
        if ancho > limite:
            if not a.forzar:
                sobran = max(1, round((ancho - limite) / (lienzo.textlength(texto, font=f) / max(1, len(texto)))))
                sys.exit('ERROR: "%s" mide %d px y el limite son %d. ACORTA EL COPY, no el diseño '
                         '(sobra ~%d caracter/es). Con --forzar lo encojo, pero entonces las dos '
                         'lineas dejan de tener el cuerpo de la plantilla.'
                         % (texto, ancho, limite, sobran))
            factor = min(factor, (limite - x) / lienzo.textlength(texto, font=f))

    for texto, cuerpo, color, x, base in dibujo:
        f = ImageFont.truetype(a.fuente, int(round(cuerpo * factor)))
        f.set_variation_by_name('ExtraBold')
        # anchor 'ls' = izquierda + linea base, que es justo lo que guarda el PSD.
        lienzo.text((x, base), texto, font=f, fill=color, anchor='ls')

    fondo.resize((SALIDA_W, SALIDA_H), Image.LANCZOS).save(a.salida, 'PNG', optimize=True)
    print('OK  %s  %dx%d' % (a.salida, SALIDA_W, SALIDA_H))
    print('    linea 1  %s  cuerpo %.0f px  color #%02x%02x%02x' % (
        a.linea1, dibujo[0][1] * factor, *dibujo[0][2]))
    print('    linea 2  %s  cuerpo %.0f px  color #%02x%02x%02x' % (
        a.linea2, dibujo[1][1] * factor, *dibujo[1][2]))
    if factor < 1:
        print('    AVISO: texto encogido al %.0f%% con --forzar. Lo correcto era acortar el copy' % (factor * 100))
    print('    Sin logo a proposito: lo inserta el chat de la web de recursos al subirla (images 0b-OG)')


if __name__ == '__main__':
    main()
