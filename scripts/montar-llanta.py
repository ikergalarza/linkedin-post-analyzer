#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Monta la imagen del pilar DESPIECE pegando los logos en los huecos de la llanta.

POR QUÉ EXISTE, y es el mismo motivo que `montar-orla.py`: un modelo generativo
de imagen NO pega, REDIBUJA. Con logos es aún peor que con caras, porque además
los rechaza por copyright (`images §0i-2`): al pedirle logos de terceros o se
niega o se los inventa. Aquí entran píxel a píxel y la plantilla no se toca.

QUÉ HACE, Y NADA MÁS:
  1. Localiza los huecos TRANSPARENTES de la plantilla (los detecta solos).
  2. Los ordena por ÁNGULO desde el centro, empezando arriba y en el sentido
     del reloj. Esto es lo único que cambia de verdad frente a la orla: una
     orla se lee por filas, una rueda se lee como un reloj, así que el orden
     de mención del post cae en las 12 posiciones en el orden que espera el ojo.
  3. Mete cada logo CONTENIDO dentro de su hueco, sin deformar y sin recortar,
     sobre un disco blanco. Un logo no es un retrato: si lo escalas para CUBRIR
     el círculo le cortas el nombre, que es justo lo que hay que leer.
  4. Pone los logos DEBAJO y la plantilla ENCIMA, así que la máscara redonda es
     la que dibujó el diseñador.
  5. Redibuja el título cambiando el marcador XXX por la región, respetando los
     colores que ya trae el PSD (la palabra punchy en naranja).

USO:
  python scripts/montar-llanta.py \
      --plantilla "…/PLANTILLA OBJETO.psd" \
      --logos "…/logos-despiece-euskadi" \
      --region VASCA \
      --salida "…/despiece-euskadi.png"

Los logos se ordenan por nombre de fichero (01-…, 02-…, …), que es el mismo
orden en que salen las piezas en el post.
"""
import argparse
import os
import sys
from collections import deque

import numpy as np
from PIL import Image, ImageDraw, ImageFont

# Alpha por debajo de esto = agujero. No es 0 exacto por el antialiasing del borde.
UMBRAL_ALPHA = 8
# Un hueco de verdad son ~9.000 px en la plantilla de 1254x1254. Por debajo de
# esto son pinholes del borde de los círculos, no huecos.
MIN_PX_HUECO = 1500
# Aire entre el logo y el borde del círculo, en tanto por uno del diámetro. Un
# logo pegado al borde se lee como un error de montaje.
# Bajado de 0.20 a 0.08 el 2026-08-07: con 0.20 el logo solo ocupaba el 60%
# del diametro y en la llanta de 12 huecos se veian diminutos. Con 0.08 usa el
# 84%. El disco blanco sigue dando aire suficiente para que no parezca un fallo.
MARGEN = 0.08
# Marcador que el diseñador deja en el PSD para la región.
MARCADOR_REGION = 'XXX'
FUENTE_DEF = ('C:/Users/LENOVO/Documents/Mario/LINKEDIN GROWTH/TIPOGRAFÍAS/'
              'Bricolage Grotesque/static/BricolageGrotesque-ExtraBold.ttf')


def buscar_huecos(alpha: np.ndarray) -> list[dict]:
    """Componentes conexas de píxeles transparentes, ordenadas como un reloj."""
    mask = alpha < UMBRAL_ALPHA
    alto, ancho = mask.shape
    visto = np.zeros((alto, ancho), bool)
    huecos = []
    for y in range(alto):
        for x in np.nonzero(mask[y] & ~visto[y])[0]:
            if visto[y, x]:
                continue
            visto[y, x] = True
            cola = deque([(y, x)])
            ys, xs = [], []
            while cola:
                cy, cx = cola.popleft()
                ys.append(cy)
                xs.append(cx)
                for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    ny, nx = cy + dy, cx + dx
                    if 0 <= ny < alto and 0 <= nx < ancho and mask[ny, nx] and not visto[ny, nx]:
                        visto[ny, nx] = True
                        cola.append((ny, nx))
            if len(ys) >= MIN_PX_HUECO:
                huecos.append({'n': len(ys), 'y0': min(ys), 'y1': max(ys),
                               'x0': min(xs), 'x1': max(xs)})
    if not huecos:
        return huecos
    # Orden de RELOJ: arriba primero y luego en el sentido de las agujas. El
    # centro se calcula de los propios huecos, no se hardcodea, así que sirve
    # igual si el diseñador mueve la rueda o cambia el número de posiciones.
    cx = sum((h['x0'] + h['x1']) / 2 for h in huecos) / len(huecos)
    cy = sum((h['y0'] + h['y1']) / 2 for h in huecos) / len(huecos)
    for h in huecos:
        dx = (h['x0'] + h['x1']) / 2 - cx
        dy = (h['y0'] + h['y1']) / 2 - cy
        # atan2(dx, -dy): 0 arriba, creciendo hacia la derecha.
        h['ang'] = np.arctan2(dx, -dy) % (2 * np.pi)
    huecos.sort(key=lambda h: h['ang'])
    return huecos


def contener(logo: Image.Image, lado: int) -> Image.Image:
    """Disco blanco con el logo dentro, escalado para CABER y sin deformar.

    Contener y no cubrir: un logo recortado pierde el nombre de la empresa, que
    es lo único que hay que poder leer. El disco blanco existe porque el hueco
    es transparente y sin fondo se vería el menta a través, y un logo con fondo
    blanco propio sobre menta canta.
    """
    lienzo = Image.new('RGBA', (lado, lado), (255, 255, 255, 255))
    util = round(lado * (1 - 2 * MARGEN))
    logo = logo.convert('RGBA')
    # ⭐ RECORTE DEL BORDE BLANCO (Iker, 2026-08-07). Los logos de LinkedIn vienen
    # con MUCHO aire propio dentro del cuadrado: ICER, KYB o TI traen casi un 30%
    # de blanco alrededor de la marca. Al escalarlos tal cual estabamos metiendo
    # ese aire dentro del circulo y encima le sumabamos el nuestro, asi que la
    # marca acababa diminuta aunque el hueco fuese grande. Aqui se quita el aire
    # AJENO y se deja solo el nuestro, que es el que decide MARGEN.
    _gris = logo.convert('L')
    # Todo lo que no sea casi-blanco es marca. 246 y no 255 porque los JPG traen
    # el fondo sucio de compresion y con 255 no recortaria nada.
    _caja = _gris.point(lambda v: 0 if v > 246 else 255).getbbox()
    if _caja:
        _w, _h = logo.size
        # Guarda de seguridad: si el recorte se comiera casi todo, es que el logo
        # es casi blanco entero y algo ha ido mal. Mejor dejarlo como estaba.
        if (_caja[2] - _caja[0]) > _w * 0.12 and (_caja[3] - _caja[1]) > _h * 0.12:
            logo = logo.crop(_caja)
    # Los logos de LinkedIn vienen en JPG con fondo blanco: al pegarlos sobre
    # blanco el fondo desaparece solo y no hace falta recortarlo.
    escala = min(util / logo.width, util / logo.height)
    nuevo = (max(1, round(logo.width * escala)), max(1, round(logo.height * escala)))
    logo = logo.resize(nuevo, Image.LANCZOS)
    lienzo.paste(logo, ((lado - logo.width) // 2, (lado - logo.height) // 2), logo)
    return lienzo


def leer_titulo(ruta_psd: str) -> dict | None:
    """Saca del PSD el título, su caja y el color de cada tramo.

    Nada se hardcodea: si el diseñador cambia el texto, el color de la palabra
    punchy o la caja, el script le sigue sin tocar una línea.
    """
    from psd_tools import PSDImage

    psd = PSDImage.open(ruta_psd)
    for capa in psd.descendants():
        if getattr(capa, 'kind', '') != 'type':
            continue
        texto = capa.text.replace('\r', '\n')
        runs = capa.engine_dict['StyleRun']['RunArray']
        largos = capa.engine_dict['StyleRun']['RunLengthArray']
        tramos, i = [], 0
        for r, L in zip(runs, largos):
            d = r['StyleSheet']['StyleSheetData']
            v = d.get('FillColor', {}).get('Values', [1, 1, 1, 1])
            tramos.append({'txt': texto[i:i + L], 'color': tuple(round(c * 255) for c in v[1:4])})
            i += L
        # El cuerpo y el interlineado del PSD estan en unidades del DOCUMENTO,
        # no en pixeles: hay que multiplicarlos por la escala de la matriz de
        # transformacion de la capa. Aqui 29 x 2.82 = 81.8 px reales.
        # Iker, 2026-07-30: antes yo ajustaba el cuerpo a la caja por prueba y
        # error, y salia MAS PEQUENO que el que habia puesto el disenador. El
        # tamano no se recalcula, se respeta.
        import math
        tr = capa.transform or (1, 0, 0, 1, 0, 0)
        escala = math.hypot(tr[0], tr[1]) or 1
        d0 = runs[0]['StyleSheet']['StyleSheetData']
        cuerpo = float(d0.get('FontSize', 29)) * escala
        salto = float(d0.get('Leading') or d0.get('FontSize', 29) * 1.2) * escala
        return {'texto': texto, 'tramos': tramos, 'bbox': capa.bbox,
                'cuerpo': cuerpo, 'salto': salto, 'cx': tr[4], 'base': tr[5]}
    return None


def dibujar_titulo(img: Image.Image, titulo: dict, region: str, ruta_fuente: str) -> None:
    """Redibuja el título con la región puesta, en el MISMO cuerpo y sitio del PSD.

    No se ajusta nada a ojo: el cuerpo, el interlineado, el centro horizontal y
    la primera línea base salen de la capa de texto del diseñador.
    """
    # Los tramos llevan su color; se parten por línea manteniéndolo.
    lineas: list[list[dict]] = [[]]
    for t in titulo['tramos']:
        partes = t['txt'].replace(MARCADOR_REGION, region.upper()).split(chr(10))
        for j, p in enumerate(partes):
            if j:
                lineas.append([])
            if p:
                lineas[-1].append({'txt': p, 'color': t['color']})
    lineas = [l for l in lineas if l]

    fuente = ImageFont.truetype(ruta_fuente, round(titulo['cuerpo']))
    d = ImageDraw.Draw(img)
    base = titulo['base']
    for linea in lineas:
        ancho = sum(d.textlength(s['txt'], font=fuente) for s in linea)
        x = titulo['cx'] - ancho / 2
        for s in linea:
            # Ancla en la línea base izquierda, que es como posiciona Photoshop.
            d.text((x, base), s['txt'], font=fuente, fill=s['color'] + (255,), anchor='ls')
            x += d.textlength(s['txt'], font=fuente)
        base += titulo['salto']


def main() -> int:
    p = argparse.ArgumentParser(description='Monta la imagen del pilar despiece (objeto).')
    p.add_argument('--plantilla', required=True, help='PSD con los huecos transparentes')
    p.add_argument('--logos', required=True, help='Carpeta con 01-….jpg … NN-….jpg')
    p.add_argument('--salida', required=True, help='PNG de salida')
    p.add_argument('--region', help='Región que sustituye a XXX en el título (VASCA, GALLEGA…)')
    p.add_argument('--fuente', default=FUENTE_DEF, help='Ruta al .ttf del título')
    a = p.parse_args()

    plantilla = Image.open(a.plantilla).convert('RGBA')
    huecos = buscar_huecos(np.array(plantilla)[:, :, 3])
    ficheros = sorted(f for f in os.listdir(a.logos)
                      if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')))
    print(f'  plantilla {plantilla.size[0]}x{plantilla.size[1]} · {len(huecos)} huecos · {len(ficheros)} logos')
    if not huecos:
        print('✗ No hay huecos transparentes. ¿Has borrado los círculos magenta en el PSD?', file=sys.stderr)
        return 1
    if len(ficheros) != len(huecos):
        print(f'⚠️  {len(ficheros)} logos para {len(huecos)} huecos: se usan los primeros '
              f'{min(len(ficheros), len(huecos))} en orden de reloj.', file=sys.stderr)

    fondo = Image.new('RGBA', plantilla.size, (0, 0, 0, 0))
    for i, (h, nombre) in enumerate(zip(huecos, ficheros), 1):
        lado = max(h['x1'] - h['x0'], h['y1'] - h['y0']) + 1
        logo = Image.open(os.path.join(a.logos, nombre))
        if min(logo.size) < lado * (1 - 2 * MARGEN):
            print(f'  ⚠️  {nombre} es {logo.size[0]}px y el hueco pide '
                  f'{round(lado * (1 - 2 * MARGEN))}px: se amplía y pierde nitidez')
        fondo.paste(contener(logo, lado), (h['x0'], h['y0']))
        print(f'  {i:2}. {nombre[:34]:36} → hueco en ({h["x0"]},{h["y0"]}) {lado}px')

    out = Image.alpha_composite(fondo, plantilla)

    if a.region:
        titulo = leer_titulo(a.plantilla)
        if not titulo:
            print('⚠️  El PSD no tiene capa de texto: el título no se toca.', file=sys.stderr)
        elif MARCADOR_REGION not in titulo['texto']:
            print(f'⚠️  El título del PSD no lleva el marcador {MARCADOR_REGION}, '
                  f'así que no sé dónde va la región. Se deja como está.', file=sys.stderr)
        else:
            # El composite ya trae el título con XXX pintado. Se tapa su caja con
            # el berenjena de la franja (muestreado del propio PSD, no inventado)
            # y se redibuja con la región dentro.
            x0, y0, x1, y1 = titulo['bbox']
            berenjena = out.getpixel((12, max(4, y0 - 20)))
            ImageDraw.Draw(out).rectangle([x0 - 6, y0 - 10, x1 + 6, y1 + 10], fill=berenjena)
            dibujar_titulo(out, titulo, a.region, a.fuente)
            print(f'  título: {titulo["texto"].replace(chr(10), " / ").replace(MARCADOR_REGION, a.region.upper())}')

    out.convert('RGB').save(a.salida, 'PNG')
    print(f'\n✓ {a.salida}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
