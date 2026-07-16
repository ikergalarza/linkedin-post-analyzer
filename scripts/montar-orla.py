#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Monta la orla de "Los 10" pegando las fotos en los huecos de la plantilla.

POR QUÉ EXISTE: esto lo hacía un modelo generativo de imagen y no puede hacerlo.
Un modelo así no pega, REDIBUJA: sintetiza píxeles nuevos en todo el lienzo, así
que reinterpreta las caras (llegó a cambiar el color de los ojos y a devolver
personas que no eran), suaviza las fotos malas hasta convertirlas en modelos,
mete ruido en los fondos oscuros y descentra el título. No es un fallo de prompt:
es lo único que sabe hacer. Aquí las fotos entran píxel a píxel y la plantilla no
se toca, así que el resultado es idéntico cada semana.

QUÉ HACE, Y NADA MÁS:
  1. Localiza los huecos TRANSPARENTES de la plantilla (los detecta solos).
  2. Escala cada foto lo justo para cubrir su hueco y recorta el sobrante
     centrado (las fotos de LinkedIn son cuadradas y los huecos redondos).
  3. Pone las fotos DEBAJO y la plantilla ENCIMA. La máscara del círculo es la
     que dibujó el diseñador, no una que me invente yo, y el aro y el título
     quedan intactos porque nadie los reescribe.

Lo que NO hace, a propósito: retocar, suavizar, mejorar, iluminar ni reencuadrar.
Si alguien tiene una foto borrosa o en la que no se le ve la cara, sale así. Es
su foto de LinkedIn y ese es justo el punto.

USO:
  python scripts/montar-orla.py --plantilla "…/PLANTILLA.psd" \
      --fotos "…/los10-asturias" --salida "…/orla-asturias.png"

Las fotos se ordenan por nombre de fichero (01_…, 02_…, …), que es el mismo
orden de mención del post y el de los nombres de la plantilla.
"""
import argparse
import os
import sys
from collections import deque

import numpy as np
from PIL import Image, ImageDraw, ImageFont

# La plantilla trae los nombres como capas de texto con el literal "Nombre".
# Se localizan por ese literal, así que si el diseñador renombra el placeholder
# hay que tocar esto (el script avisa en vez de dibujar "Nombre" 10 veces).
PLACEHOLDER = 'Nombre'

# Un hueco de verdad son ~35.000 px. Por debajo de esto son pinholes de
# antialiasing en el borde de los círculos (en la plantilla DEF hay 20 sueltos).
MIN_PX_HUECO = 2000
# Alpha por debajo de esto = agujero. No es 0 exacto por el antialiasing del borde.
UMBRAL_ALPHA = 8


def buscar_huecos(alpha: np.ndarray) -> list[dict]:
    """Componentes conexas de píxeles transparentes, ordenadas como se lee."""
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
                huecos.append({'n': len(ys), 'y0': min(ys), 'y1': max(ys), 'x0': min(xs), 'x1': max(xs)})
    # Orden de lectura. Agrupar la Y por filas antes de ordenar por X: si no, una
    # fila con los círculos a distinta altura se barajaría.
    if huecos:
        alto_medio = sum(h['y1'] - h['y0'] for h in huecos) / len(huecos)
        huecos.sort(key=lambda h: (round(h['y0'] / max(alto_medio, 1)), h['x0']))
    return huecos


def encajar(foto: Image.Image, ancho: int, alto: int) -> Image.Image:
    """Escala para CUBRIR el hueco y recorta el sobrante centrado.

    Lanczos solo reduce información, no la inventa. Si una foto es más pequeña
    que su hueco hay que ampliarla y ahí sí se pierde nitidez: se avisa fuera.
    """
    escala = max(ancho / foto.width, alto / foto.height)
    nuevo = (max(1, round(foto.width * escala)), max(1, round(foto.height * escala)))
    foto = foto.resize(nuevo, Image.LANCZOS)
    izq = (foto.width - ancho) // 2
    arr = (foto.height - alto) // 2
    return foto.crop((izq, arr, izq + ancho, arr + alto))


def leer_placeholders(ruta_psd: str) -> tuple[list[dict], dict]:
    """Saca del PSD los placeholders de nombre y su estilo REAL.

    Nada de esto se hardcodea: la fuente, el cuerpo, el color y la posición se
    leen del propio PSD, así que si el diseñador cambia el estilo, el script le
    sigue sin tocar una línea.
    """
    from psd_tools import PSDImage

    psd = PSDImage.open(ruta_psd)
    cajas, estilo = [], {}
    for capa in psd.descendants():
        if getattr(capa, 'kind', '') != 'type' or capa.text.strip() != PLACEHOLDER:
            continue
        cajas.append({'x0': capa.bbox[0], 'y0': capa.bbox[1], 'x1': capa.bbox[2], 'y1': capa.bbox[3]})
        if not estilo:
            datos = capa.engine_dict['StyleRun']['RunArray'][0]['StyleSheet']['StyleSheetData']
            rgba = datos.get('FillColor', {}).get('Values', [1, 0, 0, 0])
            estilo = {
                'fuente': str(capa.resource_dict['FontSet'][0].get('Name')).strip("'"),
                'cuerpo': float(datos.get('FontSize', 29)),
                'color': tuple(round(c * 255) for c in rgba[1:4]),
            }
    cajas.sort(key=lambda c: (round(c['y0'] / 100), c['x0']))
    return cajas, estilo


def main() -> int:
    p = argparse.ArgumentParser(description='Monta la orla de "Los 10" sin retocar las fotos.')
    p.add_argument('--plantilla', required=True, help='PSD o PNG con los huecos transparentes')
    p.add_argument('--fotos', required=True, help='Carpeta con 01_….jpg … 10_….jpg')
    p.add_argument('--salida', required=True, help='PNG de salida')
    p.add_argument('--nombres', help='Los 10 nombres separados por " | ", en orden de mención')
    p.add_argument('--fuente', help='Ruta al .ttf (por defecto, el Bricolage Grotesque ExtraBold del sistema)')
    a = p.parse_args()

    plantilla = Image.open(a.plantilla).convert('RGBA')
    huecos = buscar_huecos(np.array(plantilla.split()[3]))
    ficheros = sorted(
        f for f in os.listdir(a.fotos) if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp'))
    )

    print(f'plantilla : {os.path.basename(a.plantilla)}  {plantilla.width}x{plantilla.height}')
    print(f'huecos    : {len(huecos)}')
    print(f'fotos     : {len(ficheros)}')
    if len(huecos) != len(ficheros):
        print(f'\nERROR: {len(huecos)} huecos y {len(ficheros)} fotos. Tienen que ser iguales.', file=sys.stderr)
        return 1
    if not huecos:
        print('\nERROR: la plantilla no tiene huecos transparentes.', file=sys.stderr)
        return 1

    # Las fotos van en una capa DEBAJO; la plantilla se superpone encima y su
    # propio alpha recorta el círculo. Así el aro, el título y el fondo salen
    # bit a bit idénticos: este script no escribe un solo píxel sobre ellos.
    capa = Image.new('RGBA', plantilla.size, (0, 0, 0, 0))
    print()
    for hueco, fichero in zip(huecos, ficheros):
        ancho = hueco['x1'] - hueco['x0'] + 1
        alto = hueco['y1'] - hueco['y0'] + 1
        foto = Image.open(os.path.join(a.fotos, fichero)).convert('RGBA')
        escala = max(ancho / foto.width, alto / foto.height)
        aviso = '  ⚠️ AMPLIADA, pierde nitidez' if escala > 1 else ''
        capa.paste(encajar(foto, ancho, alto), (hueco['x0'], hueco['y0']))
        print(f"  ({hueco['x0']:4d},{hueco['y0']:4d})  {foto.width}x{foto.height} → {ancho}x{alto}  x{escala:.2f}  {fichero}{aviso}")

    final = Image.alpha_composite(capa, plantilla)

    # Los nombres. La plantilla los trae como "Nombre" ×10, así que hay que
    # escribirlos encima: es lo ÚNICO que se dibuja sobre la plantilla, y solo
    # dentro de la caja de su propio placeholder.
    if a.nombres:
        nombres = [n.strip() for n in a.nombres.split('|')]
        cajas, estilo = leer_placeholders(a.plantilla)
        if len(nombres) != len(cajas):
            print(f'\nERROR: {len(nombres)} nombres y {len(cajas)} placeholders "{PLACEHOLDER}".', file=sys.stderr)
            return 1
        ruta = a.fuente or r'C:\Windows\Fonts\BricolageGrotesque-VariableFont_opsz,wdth,wght.ttf'
        try:
            fuente = ImageFont.truetype(ruta, round(estilo['cuerpo']))
        except OSError:
            print(f'\nERROR: no encuentro la fuente {ruta}. Pásala con --fuente.', file=sys.stderr)
            return 1
        print(f"\nnombres   : {estilo['fuente']} {estilo['cuerpo']:.0f}px  rgb{estilo['color']}")
        lienzo = ImageDraw.Draw(final)
        # DOS pasadas, y el orden importa: si se tapa y se escribe en el mismo
        # bucle, el rectángulo que borra un placeholder se come el final del
        # nombre anterior (un nombre largo invade la caja de al lado). Primero
        # se borran los 10 "Nombre", y solo después se escribe encima.
        for caja in cajas:
            fondo_txt = plantilla.getpixel((8, (caja['y0'] + caja['y1']) // 2))[:3]
            lienzo.rectangle((caja['x0'] - 2, caja['y0'] - 4, caja['x1'] + 2, caja['y1'] + 4), fill=fondo_txt)
        for caja, nombre in zip(cajas, nombres):
            cx = (caja['x0'] + caja['x1']) / 2
            cy = (caja['y0'] + caja['y1']) / 2
            lienzo.text((cx, cy), nombre, font=fuente, fill=estilo['color'], anchor='mm')
            ancho_txt = lienzo.textlength(nombre, font=fuente)
            print(f"  ({caja['x0']:4d},{caja['y0']:4d})  {nombre:24s} ancho {ancho_txt:.0f}px")

    # Quedan los pinholes de antialiasing (20 px sueltos en el borde de los
    # círculos). Se aplanan sobre el color de fondo de la propia plantilla, no
    # sobre blanco: sobre negro cantarían como puntitos.
    fondo = plantilla.getpixel((8, plantilla.height // 2))[:3]
    plano = Image.new('RGB', final.size, fondo)
    plano.paste(final, mask=final.split()[3])
    plano.save(a.salida)
    print(f'\n✅ {a.salida}  {plano.width}x{plano.height}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
