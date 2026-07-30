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
MARGEN = 0.20
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
        return {'texto': texto, 'tramos': tramos, 'bbox': capa.bbox}
    return None


def dibujar_titulo(img: Image.Image, titulo: dict, region: str, ruta_fuente: str) -> None:
    """Redibuja el título con la región puesta, centrado en su caja original."""
    x0, y0, x1, y1 = titulo['bbox']
    # Los tramos llevan el color; se parten por línea manteniendo el color.
    lineas: list[list[dict]] = [[]]
    for t in titulo['tramos']:
        partes = t['txt'].replace(MARCADOR_REGION, region.upper()).split('\n')
        for j, p in enumerate(partes):
            if j:
                lineas.append([])
            if p:
                lineas[-1].append({'txt': p, 'color': t['color']})
    lineas = [l for l in lineas if l]

    # Cuerpo por búsqueda: el FontSize del PSD está en las unidades del
    # documento y no se traduce a píxeles de PIL, así que se ajusta al ancho y
    # al alto reales de la caja que dibujó el diseñador.
    ancho_caja, alto_caja = x1 - x0, y1 - y0
    cuerpo = 8
    while cuerpo < 400:
        f = ImageFont.truetype(ruta_fuente, cuerpo + 2)
        anchos = [sum(f.getbbox(s['txt'])[2] - f.getbbox(s['txt'])[0] for s in l) for l in lineas]
        alto_linea = f.getbbox('Hg')[3] - f.getbbox('Hg')[1]
        if max(anchos) > ancho_caja or alto_linea * len(lineas) * 1.22 > alto_caja:
            break
        cuerpo += 2
    fuente = ImageFont.truetype(ruta_fuente, cuerpo)
    d = ImageDraw.Draw(img)
    alto_linea = (fuente.getbbox('Hg')[3] - fuente.getbbox('Hg')[1]) * 1.22
    total = alto_linea * len(lineas)
    y = y0 + (alto_caja - total) / 2

    for linea in lineas:
        ancho = sum(fuente.getbbox(s['txt'])[2] - fuente.getbbox(s['txt'])[0] for s in linea)
        x = x0 + (ancho_caja - ancho) / 2
        for s in linea:
            d.text((x, y), s['txt'], font=fuente, fill=s['color'] + (255,))
            b = fuente.getbbox(s['txt'])
            x += b[2] - b[0]
        y += alto_linea


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
