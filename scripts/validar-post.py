#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
validar-post.py — el pase de validación MECÁNICO de un post de LinkedIn de Neety.

Por qué existe: las reglas están escritas en docs/skills/ (~61.000 tokens), pero
estar escritas no basta. El 2026-07-14 se entregaron tres posts saltándose reglas
que YA existían (coma antes de "y", ancla de ventas, verbo punchy). Ninguna de las
tres estaba en el pase de validación, y confiar en releer 61k tokens de memoria no
es un plan. Esto lo hace determinista.

Lo que NO hace: no juzga si un dato es cierto, si el ángulo es aburrido o si el
hueso del remix está bien robado. Eso es criterio y vive en global-instructions §8.

Uso:
    python scripts/validar-post.py <fichero.txt> --pilar mapa|los10|meme|leadmagnet
                                   [--cuenta Iker|Unai|Asier]

Salida: tabla de checks + "N/M". Exit 1 si hay violaciones.
"""
import sys, os, re, argparse, io

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HISTORIAL = os.path.join(RAIZ, 'docs', 'skills', 'historial-publicaciones.md')

# --- vocabularios (de docs/skills/) -----------------------------------------
# §2.3 — el hook debe leerse inequívocamente sobre VENDER
ANCLA_VENTAS = r'\b(vender|vendes|vende|vendo|vendiendo|venta|ventas|vendid\w+|cliente|clientes|cerrar|cierras|cierra|cierro|cerrand\w+|comercial|comerciales|comprar|compra|compras|comprando|precio|precios|cuota|comisi[oó]n|facturar|factura|facturas|facturaci[oó]n|exportar|exporta|exportas|exportaci[oó]n|prospectar|cartera|deal|deals|pedido|pedidos|propuesta comercial)\b'
# §2.3 — estrechan el alcance, FUERA del hook. Lista canónica: gana a la de
# "términos naturalizados" de brand-voice §2, que decía lo contrario. El ICP de
# aboutme desempata: lleva vendiendo desde antes de que existiera Salesforce.
# CRM y forecast añadidos el 2026-07-14 (se coló "Tu CRM…" en un hook de meme).
DEMASIADO_NICHO = r'\b(b2b|outbound|inbound|pipeline|cadencia|reply rate|touchpoints?|sdr|aes?|cold email|discovery|gtm|icp|crm|forecast|saas|leads?|follow-?up)\b'
# §2.9 — delatores de verbo flojo: describen en vez de frenar el scroll
VERBO_FLOJO = r'(\bse cae\b|\bse caen\b|\bse pierde\b|\bse pierden\b|\bocurre\b|\bocurren\b|\bpasa\b|\bpasan\b|\bno funciona\b|\bexiste\b|\bexisten\b|\bhay que\b|\btiene que\b|\bes importante\b|\bes clave\b)'
# §2.8 — openers quemados
OPENERS_QUEMADOS = r'(nadie te dice esto|lo que nadie te cuenta|me ha costado \w+ a[nñ]os|este es el error m[aá]s grande|el problema eres t[uú]|spoiler:|plot twist:)'

# §4.1 — comodines de peloteo gastados: 4/4 posts reales los usan LITERAL (working-preferences §4)
REVEAL_QUEMADO = r'\bs[ií],?\s+hablo\s+d'
COMODIN_LISTA = r'la gente y las empresas que mueven todo esto'
# post-workflow §4.2 Paso 3 — el eje "callado" está PROHIBIDO en mapas
EJE_CALLADO = r'(se vende callad|venden callad|en silencio|no lo cuentan|no lo cuenta|sin hacer ruido|nadie los conoce|no salen en la foto|trabajan callad)'

def norm(s):
    return s.replace('\r\n', '\n').replace('\r', '\n').strip('\n')

def bloques(texto):
    """Parte el post en bloques separados por línea en blanco."""
    return [b.split('\n') for b in re.split(r'\n\s*\n', texto) if b.strip()]

def es_lista(bloque):
    """¿Es una enumeración y no un bloque de prosa? Las enumeraciones están
    exentas de las reglas de tamaño de §3.2: van pegadas a propósito.

    Dos formas de serlo:
    1. Marcadores clásicos (→, ✅, 1., -).
    2. Patrón de ETIQUETA: 2+ líneas que acaban en ":" (Realidad: / CRM: /
       Traducción:). Es la unidad (c) de §3.3, "enumeración vertical paralela
       con sintaxis repetida, sin blanco entre líneas". Faltaba, y marcaba como
       prosa mal formateado un remix que calcaba bien a su referencia.
    """
    lineas = [l for l in bloque if l.strip()]
    if not lineas:
        return True
    if all(re.match(r'\s*(→|✅|[0-9]+[\.\)]|-|•|1️⃣|[2-9]️⃣)', l) for l in lineas):
        return True
    return sum(1 for l in lineas if l.rstrip().endswith(':')) >= 2

def leer_historial():
    if not os.path.exists(HISTORIAL):
        return ''
    return io.open(HISTORIAL, encoding='utf-8').read()

def validar_entregable(texto):
    """Cualquier cosa que entregamos y que un humano va a leer: prompt para el
    programador, descripciones del CSV, copy del gate. NO es un post de LinkedIn,
    así que no aplican hook ni bloques, pero SÍ la puntuación anti-IA: el copy del
    gate lo lee un cliente, y el prompt lo lee el programador."""
    r = []
    m = re.search(r'[—–]', texto)
    r.append((not m, 'Sin guion largo (brand-voice §3)', 'delator de IA nº1' if m else ''))
    # OJO: aquí NO se prohíbe la coma antes de "y" como en un post.
    # Decidido el 2026-07-14: la regla depende del ARTEFACTO. En un post de
    # LinkedIn está vetada (registro corto y hablado, canta a IA). En la WEB es
    # correcta en español uniendo dos oraciones independientes largas, y los seis
    # gates publicados la usan. Lo que sí está mal en los dos sitios es la coma
    # antes de "y" en una ENUMERACIÓN ("LinkedIn, email, y automatización"),
    # que es lo único que se marca aquí.
    ms = re.findall(r',\s*\w[\w\s]{0,30},\s+[ye]\s', texto)
    r.append((not ms, 'Sin coma antes de "y" en ENUMERACIONES (playbook §12)',
              f'{len(ms)}: {ms[:2]}' if ms else 'la coma uniendo 2 oraciones largas sí vale en web'))
    m = re.search(OPENERS_QUEMADOS, texto, re.I)
    r.append((not m, 'Sin openers quemados (§2.8)', f'"{m.group(0)}"' if m else ''))
    return r

def validar(texto, pilar, cuenta=None):
    texto = norm(texto)
    if pilar == 'entregable':
        return validar_entregable(texto)
    bs = bloques(texto)
    hook = bs[0] if bs else []
    hook_txt = ' '.join(hook)
    cuerpo = texto
    r = []          # (ok, nombre, detalle)
    def chk(ok, nombre, detalle=''):
        r.append((ok, nombre, detalle))

    # ---------- UNIVERSALES ----------
    chk(len(hook_txt) <= 210, 'Hook ≤210 caracteres (§2.1)', f'{len(hook_txt)} caracteres')
    chk(len(hook) == 1, 'Hook es UN bloque, sin salto dentro (§2.1)',
        f'{len(hook)} líneas en el bloque del hook' if len(hook) != 1 else '')
    nums = re.findall(r'\d+(?:[.,]\d+)?', hook_txt)
    chk(len(nums) <= 1, 'Hook con ≤1 cifra (§2.5)', f'{len(nums)} cifras: {nums}' if len(nums) > 1 else '')
    m = re.search(ANCLA_VENTAS, hook_txt, re.I)
    chk(bool(m), 'Hook anclado a VENTAS (§2.3)',
        f'ancla: "{m.group(0)}"' if m else 'NINGUNA palabra de ventas en el hook → lo podría subir cualquier cuenta')
    m = re.search(VERBO_FLOJO, hook_txt, re.I)
    chk(not m, 'Hook sin verbo flojo (§2.9)',
        f'verbo flojo: "{m.group(0)}" → sube un peldaño (criticar→desmontar)' if m else '')
    m = re.search(DEMASIADO_NICHO, hook_txt, re.I)
    chk(not m, 'Hook sin jerga que estrecha alcance (§2.3)', f'"{m.group(0)}" fuera del hook' if m else '')
    m = re.search(r'[—–]', cuerpo)
    chk(not m, 'Sin guion largo (brand-voice §3)', 'delator de IA nº1' if m else '')
    ms = re.findall(r'[^\s]+,\s+[ye]\s', cuerpo)
    chk(not ms, 'Sin coma antes de "y"/"e" (brand-voice §3)', f'{len(ms)}: {ms[:3]}' if ms else '')
    ms = re.findall(r'\*\*|__|^#{1,6}\s|`', cuerpo, re.M)
    chk(not ms, 'Sin markdown dentro del post (working-preferences §1)', f'{ms[:3]}' if ms else '')
    m = re.search(OPENERS_QUEMADOS, cuerpo, re.I)
    chk(not m, 'Sin openers quemados (§2.8)', f'"{m.group(0)}"' if m else '')
    ms = re.findall(r'\((?:[^()]*\b(?:19|20)\d{2}\b[^()]*)\)', cuerpo)
    chk(not ms, 'Sin AÑO de fuente en el cuerpo (§3.5b)',
        f'{ms[:2]} → cita el nombre, nunca el año' if ms else '')

    # bloques de prosa: ≤3 líneas, y línea individual detrás (§3.2)
    largos = [i for i, b in enumerate(bs) if not es_lista(b) and len(b) >= 4]
    chk(not largos, 'Bloques de prosa ≤3 líneas (§3.2)',
        f'bloques con 4+ líneas en posición {largos}' if largos else '')
    fallos = []
    for i, b in enumerate(bs[:-1]):
        if es_lista(b) or len(b) == 1 or i == 0:
            continue
        sig = bs[i + 1]
        if not es_lista(sig) and len(sig) > 1:
            fallos.append(i)
    chk(not fallos, 'Línea individual tras cada bloque de 2-3 (§3.2)',
        f'bloque pegado a otro bloque en posición {fallos}' if fallos else '')

    # ---------- POR PILAR ----------
    tiene_link = 'recursos.neety.com' in cuerpo
    if pilar in ('mapa', 'los10', 'meme'):
        chk(tiene_link, 'Spam ninja presente (§4.4b)', 'falta el link de agendar' if not tiene_link else '')
        if tiene_link:
            chk('Neety' not in cuerpo.split('recursos.neety.com')[0].split('\n')[-1],
                'Spam ninja NO nombra a Neety (§4.4b)', 'nombrar la marca = publicidad encubierta')
            lineas = [l for l in cuerpo.split('\n') if l.strip()]
            idx = next(i for i, l in enumerate(lineas) if 'recursos.neety.com' in l)
            chk(idx != len(lineas) - 1, 'Spam ninja NO es la última línea (§4.4b)',
                'el cierre va después' if idx == len(lineas) - 1 else '')
            for i, b in enumerate(bs):
                if any('recursos.neety.com' in l for l in b):
                    chk(len(b) == 1, 'Las 2 líneas del spam ninja van separadas (§4.4b)',
                        f'{len(b)} líneas pegadas en el mismo bloque' if len(b) != 1 else '')
                    break
    if pilar in ('mapa', 'los10'):
        m = re.search(REVEAL_QUEMADO, cuerpo, re.I)
        chk(not m, 'Reveal de región sin el comodín "Sí, hablo de" (§4.1)',
            f'"{m.group(0)}…" → lo usan LITERAL los 4 posts reales; di lo mismo con otras palabras' if m else '')
        m = re.search(COMODIN_LISTA, cuerpo, re.I)
        chk(not m, 'Frase de entrada a la lista sin comodín (§4.1)',
            f'"{m.group(0)}" → ya repetida entre mapas' if m else '')
    if pilar == 'mapa':
        m = re.search(EJE_CALLADO, cuerpo, re.I)
        chk(not m, 'Eje "callado" PROHIBIDO en mapas (post-workflow §4.2)',
            f'"{m.group(0)}" → rota a otro eje de mérito' if m else '')
        menciones = [b for b in bs if b and b[0].strip().startswith('→')]
        chk(bool(menciones), 'Bloque de menciones presente', '')
        if menciones:
            todas = [l for b in menciones for l in b]
            sin_arroba = [l for l in todas if l.count('@') < 2]
            chk(not sin_arroba, 'Menciones con @ en empresa Y persona (§4.2 Paso 4)',
                f'{len(sin_arroba)} líneas sin las 2 arrobas' if sin_arroba else '')
            chk(all(len(b) == 4 for b in menciones), 'Menciones en bloques de 4 (5×4)',
                f'bloques de {[len(b) for b in menciones]}')
    if pilar == 'leadmagnet':
        chk(not tiene_link, 'Lead magnet SIN spam ninja (§4.4b, única excepción)',
            'el link apila un 2º CTA y hunde los comentarios' if tiene_link else '')
        m = re.search(r'\bcomenta\b', cuerpo, re.I)
        chk(bool(m), 'CTA con "Comenta" EXPLÍCITO (§4.4)',
            'sin la palabra, la gente no comenta: 20 vs 483 com.' if not m else '')
        m2 = re.search(r'comenta\s+"([^"]+)"', cuerpo, re.I)
        chk(bool(m2), 'CTA con la PALABRA entre comillas (§4.4)', '')
        chk(bool(re.search(r'\+\s*(tu|su)\s+(sector|departamento)', cuerpo, re.I)),
            'CTA con "+ tu sector/departamento" (§4.4)',
            'el "mes de cumpleaños" ya flopeó a 0.57x')

    # ---------- CONTRA EL HISTORIAL ----------
    h = leer_historial()
    if h:
        if pilar == 'leadmagnet':
            m2 = re.search(r'comenta\s+"([^"]+)"', cuerpo, re.I)
            if m2:
                pal = m2.group(1).lower()
                usada = re.search(r'"%s"' % re.escape(pal), h, re.I)
                chk(not usada, 'La palabra del CTA no se ha usado antes',
                    f'"{pal}" ya aparece en el historial' if usada else f'"{pal}" limpia')
        if pilar in ('mapa', 'los10') and cuenta:
            fila = re.search(r'\|\s*\*\*%s\*\*\s*\|([^|]*)\|([^|]*)\|' % cuenta, h)
            if fila:
                usadas = (fila.group(1) if pilar == 'mapa' else fila.group(2)).strip()
                chk(True, f'Regiones ya usadas por {cuenta} ({pilar})', f'NO repetir: {usadas}')
    return r

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('fichero')
    ap.add_argument('--pilar', required=True,
                    choices=['mapa', 'los10', 'meme', 'leadmagnet', 'entregable'])
    ap.add_argument('--cuenta', default=None)
    a = ap.parse_args()
    texto = io.open(a.fichero, encoding='utf-8').read()
    res = validar(texto, a.pilar, a.cuenta)
    ok = sum(1 for x in res if x[0])
    print(f"\n  VALIDADOR — pilar={a.pilar}" + (f" cuenta={a.cuenta}" if a.cuenta else "") + "\n")
    for bien, nombre, det in res:
        print(f"  {'OK  ' if bien else 'FALLA'} {nombre}")
        if det:
            print(f"        └─ {det}")
    print(f"\n  {ok}/{len(res)} checks\n")
    sys.exit(0 if ok == len(res) else 1)

if __name__ == '__main__':
    main()
