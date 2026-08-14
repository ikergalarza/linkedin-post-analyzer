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
  · No encoge el texto ni mueve nada. Iker, 2026-08-14: "todas tienen que
    empezar en la misma posicion y tamaño para coherencia de diseño, asi que tu
    solucion tiene que ser simplemente poner frases mas cortas". Si no cabe,
    ABORTA con la medida exacta en pixeles. Para eso esta la plantilla.

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

# ⛔ PERO EL BORDE DEL LIENZO NO ES EL OBSTACULO REAL: LO SON LAS PIEZAS AZULES
# (medido el 2026-08-14, con tres de las once imagenes ya montadas y pisadas).
# Entran en diagonal por la derecha y bajan, asi que el ancho libre DEPENDE DE
# LA ALTURA a la que caiga cada linea. Con el margen a secas pasaban el check
# `Es lo que mandas` y `Mientras duermes`, y las dos se comian la pieza.
# Se mide el fondo de verdad: en la banda vertical de cada linea se busca el
# primer pixel CLARO viniendo desde la derecha, y ese es el limite.
# ⚠️ Y se busca el AZUL, no lo "claro" a secas: el halo magenta de la esquina
# inferior izquierda tambien es brillante, y midiendo por luminancia daba la
# columna 260 como limite, o sea que no cabia ni "La corta no". El azul bebe
# tiene el verde y el azul altos; el magenta tiene el verde por los suelos.
HUECO = 0.015   # aire minimo entre la ultima letra y la pieza, en % del ancho


def es_pieza(r, g, b):
    return b > 150 and g > 120 and b >= r


def limite_libre(fondo, base, arriba, abajo):
    """Hasta que x puede llegar una linea sin pisar las piezas azules.

    Recorre la banda vertical que ocupa el texto y devuelve la x del pixel
    claro mas a la izquierda: de ahi para la derecha ya hay dibujo.
    """
    ancho, alto = fondo.size
    y0, y1 = max(0, int(base - arriba)), min(alto, int(base + abajo) + 1)
    pix = fondo.load()
    tope = ancho * (1 - MARGEN)
    for y in range(y0, y1, 4):        # de 4 en 4: las piezas son masas grandes
        for x in range(int(tope)):
            if es_pieza(*pix[x, y][:3]):
                tope = min(tope, x - ancho * HUECO)
                break
    return tope


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

    # ⛔ NI SE ENCOGE NI SE MUEVE NADA (Iker, 2026-08-14): "todas tienen que
    # empezar en la misma posicion y tamaño para coherencia de diseño, asi que
    # tu solucion tiene que ser simplemente poner frases mas cortas". Por eso
    # aqui no hay ningun --forzar: si no cabe, se aborta y se acorta el copy.
    # ⚠️ Las DOS medidas se toman sobre el fondo LIMPIO, antes de dibujar nada.
    # Midiendo sobre la marcha, la linea 1 ya pintada se detectaba como pieza
    # —el mint #ebfff6 tambien tiene el azul y el verde altos— y el limite de la
    # linea 2 salia en la columna 260, o sea que no cabia ni "La corta no".
    plan = []
    for capa, texto in ((c1, a.linea1), (c2, a.linea2)):
        cuerpo, color, (x, base) = estilo(capa)
        f = ImageFont.truetype(a.fuente, int(round(cuerpo)))
        f.set_variation_by_name('ExtraBold')
        arriba, abajo = f.getmetrics()
        # Solo la mitad del descendente: la pieza entra en diagonal desde
        # abajo a la derecha, asi que contando el descendente entero el limite
        # lo fijaba la punta del triangulo y tumbaba hasta el copy que ya
        # estaba publicado y se ve bien.
        plan.append((capa, texto, f, cuerpo, color, x, base,
                     limite_libre(fondo, base, arriba, abajo // 2)))

    for capa, texto, f, cuerpo, color, x, base, limite in plan:
        largo = lienzo.textlength(texto, font=f)
        if x + largo > limite:
            sobran = max(1, round((x + largo - limite) / (largo / max(1, len(texto)))))
            sys.exit('ERROR: "%s" llega hasta el pixel %d y ahi ya empieza la pieza azul, que manda '
                     'a partir del %d. ACORTA EL COPY: sobran unos %d caracteres. El cuerpo y la '
                     'posicion NO se tocan, son los mismos en las once imagenes.'
                     % (texto, x + largo, limite, sobran))
        # anchor 'ls' = izquierda + linea base, que es justo lo que guarda el PSD.
        lienzo.text((x, base), texto, font=f, fill=color, anchor='ls')
        print('    %-9s %-26s cuerpo %3.0f px  color #%02x%02x%02x  libre hasta %d' % (
            capa.name[-1] + ')', texto, cuerpo, color[0], color[1], color[2], limite))

    fondo.resize((SALIDA_W, SALIDA_H), Image.LANCZOS).save(a.salida, 'PNG', optimize=True)
    print('OK  %s  %dx%d' % (a.salida, SALIDA_W, SALIDA_H))
    print('    Sin logo a proposito: lo inserta el chat de la web de recursos al subirla (images 0b-OG)')


if __name__ == '__main__':
    main()
