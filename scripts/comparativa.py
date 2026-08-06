# -*- coding: utf-8 -*-
"""Monta la vista comparativa ORIGINAL vs EL MIO en dos columnas.

    python scripts/comparativa.py original.txt mio.txt "Daniel Disney - 1.853 r." "Unai"

Por que existe (Iker, 2026-08-06): la comparativa lleva pedida desde el 22 de
julio y la he entregado mal CUATRO veces seguidas, cada vez por un motivo
distinto y todos de maquetado, no de criterio:

  1. dos bloques cercados apilados en vez de dos columnas
  2. otra vez apilados
  3. en <pre>, que este terminal no renderiza: se vio la etiqueta literal y el
     texto en fuente proporcional, con las columnas descuadradas
  4. la regla horizontal mas ancha que las columnas (se partia en dos lineas) y
     encima continua en vez de discontinua

El patron es obvio: maquetar a mano falla siempre. Esto lo hace el script y ya.

LAS REGLAS, que son de `working-preferences §1e`:
  - las dos publicaciones ENTERAS y verbatim, sin resumir ni trocear ni etiquetar
  - dos columnas en la MISMA fila, separadas por una linea DISCONTINUA vertical
  - la regla horizontal bajo la cabecera tambien DISCONTINUA y del mismo ancho
    exacto que las columnas, para que no se parta
  - columnas estrechas y muy largas estan bien: no se recorta para que quepa
  - se pega en un BLOQUE CERCADO de tres comillas, que es lo unico que este
    terminal pinta monoespaciado, y el monoespaciado es lo que sostiene todo

W=36 por columna da 75 de ancho total, que es lo que entra sin partirse.
"""
import io
import sys
import unicodedata

W = 36


def ancho(s):
    """Ancho REAL en celdas de terminal.

    Un emoji ocupa DOS. Contarlo como uno era lo que desplazaba la linea
    discontinua justo en las lineas con 🤣 o 👇, y a simple vista parecia que
    el espaciado entre separadores era irregular.
    """
    return sum(2 if unicodedata.east_asian_width(c) in 'WF' or ord(c) > 0x1F000 else 1
               for c in s)


def envolver(texto):
    """Word-wrap propio: textwrap corta por len() y aqui manda ancho()."""
    out = []
    for linea in texto.split('\n'):
        if not linea.strip():
            out.append('')
            continue
        cur = ''
        for palabra in linea.split(' '):
            if cur and ancho(cur + ' ' + palabra) > W:
                out.append(cur)
                cur = palabra
            else:
                cur = (cur + ' ' + palabra).strip()
        out.append(cur)
    return out


def comparativa(izq, der, cab_izq='ORIGINAL', cab_der='EL MÍO'):
    a, b = envolver(izq.strip()), envolver(der.strip())
    n = max(len(a), len(b))
    a += [''] * (n - len(a))
    b += [''] * (n - len(b))
    pad = lambda s: s + ' ' * (W - ancho(s))
    # La regla horizontal, discontinua con POCOS cortes (Iker, 2026-08-06): con
    # '┄' salian demasiados y quedaba sucia. Trazos largos y huecos escasos.
    regla = ('──── ' * (W // 5 + 2))[:W]
    return '\n'.join(
        [pad(cab_izq) + ' ┊ ' + cab_der, regla + '─┼─' + regla] +
        [(pad(a[i]) + ' ┊ ' + b[i]).rstrip() for i in range(n)]
    )


if __name__ == '__main__':
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    izq = io.open(sys.argv[1], encoding='utf-8').read()
    der = io.open(sys.argv[2], encoding='utf-8').read()
    ci = 'ORIGINAL · ' + sys.argv[3] if len(sys.argv) > 3 else 'ORIGINAL'
    cd = 'EL MÍO · ' + sys.argv[4] if len(sys.argv) > 4 else 'EL MÍO'
    print(comparativa(izq, der, ci, cd))
