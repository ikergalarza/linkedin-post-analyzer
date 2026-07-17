#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Regresión del validador contra NUESTROS mejores posts reales.

POR QUÉ EXISTE: el validador se escribió a partir de las reglas y nunca se probó
contra los posts que las reglas dicen imitar. Al hacerlo (2026-07-16) salieron dos
bugs que llevaban semanas ahí:

  1. es_lista() no reconocía la enumeración "Comercial: cerrado." (dos puntos EN
     MEDIO), así que tumbaba por "bloque de 4+ líneas" la estructura del 13.61x,
     el 3er mejor post del histórico.
  2. VERBO_FLOJO contenía "pasa" a secas y marcaba "Subir en ventas siempre pasa
     factura" (13.61x) como verbo flojo. Es un modismo punchy, no un verbo flojo.

La lección: un validador que nunca ha visto un ganador solo comprueba que las
reglas son coherentes consigo mismas, no que sirvan.

QUÉ COMPRUEBA: que ninguno de nuestros ganadores falle un check por un BUG. Los
checks que fallan por una regla ADOPTADA DESPUÉS (y a sabiendas) se declaran aquí
como esperados, con su motivo. Si un post empieza a fallar algo que no está en su
lista, el test se queja: o es un bug nuevo, o es una regla nueva que hay que
decidir conscientemente y documentar aquí.

USO:  python scripts/test-validador.py
"""
import base64
import io
import json
import os
import subprocess
import sys
import urllib.request

BASE = 'https://linkedin-post-analyzer-production.up.railway.app'
CREADORES = {
    'Iker': '3d545376-057c-48db-8b45-c5c5510110bb',
    'Unai': '88d272b7-0f93-49cf-bac1-1334965f361d',
}

# (fragmento para localizar el post, pilar, cuenta, fallos ESPERADOS y por qué)
CASOS = [
    ('pasa factura', 'meme', 'Iker', {
        'Spam ninja presente': 'el spam ninja se adoptó después de este post',
    }),
    ('cold calling no ha muerto', 'meme', 'Iker', {
        'Spam ninja presente': 'el spam ninja se adoptó después de este post',
        'Hook anclado a VENTAS': (
            'PENDIENTE DE DECIDIR: el hook es "El cold calling no ha muerto", que es '
            'lo más de ventas que hay, pero "cold calling" no está en ANCLA_VENTAS y '
            '§2.3 veta "cold email" en el hook. O la lista se queda corta, o la regla '
            'se contradice con nuestro mejor post. Sin resolver: no lo tapes.'
        ),
    }),
    ('caja de herramientas engorda', 'meme', 'Unai', {
        'muletilla "En ventas,"': (
            'ESPERADO: este post la usa y hace 16.55x. No es un bug, es que el check vigila el '
            'REFLEJO, no la forma. Cuando lo escribió era el primero; el problema es que luego se '
            'usó 3 veces seguidas. Si algún día vuelve a ser raro, se quita el check.'
        ),
        'Spam ninja presente': 'el spam ninja se adoptó después de este post',
        'Cifras en dígito': 'regla §3.6, adoptada el 2026-07-16 a sabiendas de que toca el molde',
        'Línea individual tras cada bloque': 'formateado anterior a §3.2',
    }),
    # --- "Los 10": los 3 que existen. Se metieron el 2026-07-17, cuando el 3º se comió
    # un DM de un CEO pidiendo que quitáramos su empresa y a su empleado. Están los tres
    # a propósito, incluido el que flopeó: el valor de este bloque es que el check nuevo
    # (EMPRESA_LADRONA) SEPARE al 4.82x sin quejas del 0.66x que sí las tuvo. Un check
    # que tumbara a los tres, o que no tumbara a ninguno, no mediría nada.
    ('hacemos fotos por fuera', 'los10', 'Iker', {
        'Spam ninja presente': (
            'ESPERADO Y CARGADO DE SENTIDO: este post NO lleva link, y es el único de los '
            'tres sin una sola queja. Los otros dos sí lo llevan y ambos recibieron petición '
            'de retirada. n=3 y confundido, pero es la única diferencia limpia que hay. El '
            'link se queda (decisión del usuario, 2026-07-17: es el negocio). Si algún día '
            'hay un 4º "Los 10", MIRA ESTA CASILLA antes que ninguna otra.'
        ),
        'Cifras en dígito': 'regla §3.6, adoptada el 2026-07-16 a sabiendas de que toca el molde',
        'Reveal de región sin el comodín': '"Sí, hablo del País Vasco" — prohibido DESPUÉS, por repetirse 4/4',
        'Concede que es trabajo en equipo': (
            'ESPERADO: regla §4.3 Paso 3e, adoptada el 2026-07-17. Ninguno de los 3 la '
            'cumple, y por eso los 3 se comieron el "gracias, PERO esto es trabajo en '
            'equipo". Ojo: este post dice "una fábrica no factura sola", que SUENA a la '
            'concesión y no lo es (sujeto = empresa). Que el check no se deje engañar por '
            'esa frase es justo lo que se está probando aquí.'
        ),
    }),
    ('le doy la vuelta', 'los10', 'Unai', {
        'La EMPRESA no es quien tapa a la persona': (
            'FALLA A PROPÓSITO. Es el 0.66x de Cataluña: flopeó Y un trabajador pidió por '
            'privado que le quitáramos la mención. "El nombre que se dice siempre es el de '
            'la empresa. Hoy le doy la vuelta." Si este caso deja de fallar, el check se ha '
            'roto y no queda nada vigilando lo único que la evidencia soporta.'
        ),
        'Spam ninja presente': 'mismo artefacto del lnkd.in que el de Asturias, ver abajo',
        'Concede que es trabajo en equipo': 'regla §4.3 Paso 3e, adoptada el 2026-07-17; ninguno de los 3 la cumple',
        'Bloques de 2-3 en escalera': 'regla §3.2 afinada después',
    }),
    ('comiéndose noes', 'los10', 'Iker', {
        'Spam ninja presente': (
            'ARTEFACTO DEL TEST, no un fallo del post: sí lleva spam ninja, pero LinkedIn ya '
            'reescribió el link a lnkd.in y el check busca "recursos.neety.com". Los borradores '
            'que valida el script de verdad llevan la URL cruda, así que en uso real no pasa. '
            'No "arregles" el validador por esto.'
        ),
        'Concede que es trabajo en equipo': 'regla §4.3 Paso 3e, adoptada el 2026-07-17; ninguno de los 3 la cumple',
    }),
    ('patio trasero de los Pirineos', 'mapa', 'Iker', {
        'Spam ninja presente': 'este mapa llevaba link de PamPam, no el de agendar',
        'Cifras en dígito': '"Les pasé tres números" — §3.6, coste conocido y documentado',
        'Reveal de región sin el comodín': '"Sí, hablo de Navarra" — prohibido DESPUÉS, por repetirse 4/4',
        'Frase de entrada a la lista sin comodín': 'mismo caso, prohibido después',
        'Eje "callado" PROHIBIDO': 'regla posterior',
        'Menciones con @': 'las @ se empezaron a pedir después',
        'Bloques de 2-3 en escalera': 'regla §3.2 afinada después',
    }),
]


def bajar(cuenta: str) -> list:
    req = urllib.request.Request(f'{BASE}/api/creators/{CREADORES[cuenta]}/posts?limit=200')
    cred = f"{os.environ['APP_BASIC_USER']}:{os.environ['APP_BASIC_PASS']}"
    req.add_header('Authorization', 'Basic ' + base64.b64encode(cred.encode()).decode())
    return json.load(urllib.request.urlopen(req, timeout=90))['posts']


def main() -> int:
    if not os.environ.get('APP_BASIC_USER'):
        print('Faltan APP_BASIC_USER / APP_BASIC_PASS en el entorno.', file=sys.stderr)
        return 2
    cache, tmp, malo = {}, os.path.join(os.environ.get('TMP', '/tmp'), '_reg.txt'), False
    for frag, pilar, cuenta, esperados in CASOS:
        if cuenta not in cache:
            cache[cuenta] = bajar(cuenta)
        post = next((x for x in cache[cuenta] if frag in (x.get('content_text') or '')), None)
        if not post:
            print(f'❌ no encuentro el post "{frag}" de {cuenta}')
            malo = True
            continue
        io.open(tmp, 'w', encoding='utf-8', newline='').write(post['content_text'])
        salida = subprocess.run(
            [sys.executable, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'validar-post.py'),
             tmp, '--pilar', pilar, '--cuenta', cuenta],
            capture_output=True, text=True, encoding='utf-8').stdout
        fallos = [l.strip().replace('FALLA', '').strip() for l in salida.split('\n') if 'FALLA' in l]
        print(f"\n{cuenta} · {post.get('outlier_ratio')}x · {frag}")
        for f in fallos:
            motivo = next((v for k, v in esperados.items() if k in f), None)
            if motivo:
                print(f'   ok (esperado)  {f}\n                  └─ {motivo}')
            else:
                print(f'   ❌ INESPERADO  {f}')
                print('                  └─ o es un BUG del validador, o una regla nueva que hay que documentar aquí')
                malo = True
    print('\n' + ('❌ hay fallos inesperados' if malo else '✅ ningún ganador falla por un bug'))
    return 1 if malo else 0


if __name__ == '__main__':
    sys.exit(main())
