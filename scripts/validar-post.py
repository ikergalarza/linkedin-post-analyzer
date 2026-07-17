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
# §2.3 — El ancla. OJO: la lista es un PROXY, no el test. El test de verdad es
# "¿esto solo puede publicarlo una cuenta de VENTAS?" y eso es criterio (§8).
# Por eso el ancla va partida en dos: hay palabras del oficio que NO son solo
# nuestras.
#
# FUERTE = inequívocamente ventas. Nadie más las dice así.
# OJO con la conjugación: la primera versión listaba formas sueltas (vender|vendes|
# vende|vendo|vendiendo|vendid\w+) y NO tenía ni un pretérito. "Las empresas que más
# VENDIERON este año…" — el hook del 4.82x del País Vasco — fallaba el check del ancla.
# Nuestro mejor "Los 10" no anclaba a ventas según su propio validador (2026-07-17).
# `vend[eio]\w*` coge la conjugación entera (vende, vendió, vendieron, vendemos,
# vendedor…) y deja fuera lo que solo se le parece: venda y vendaje (vend+a) y vendrá,
# que es de venir (vend+r).
ANCLA_FUERTE = (r'\b(vend[eio]\w*|venta|ventas'
                r'|comercial|comerciales|cuota|comisi[oó]n|prospectar|deal|deals|propuesta comercial)\b')
# AMBIGUA = las comparte media empresa. "pedido" lo dicen logística, compras,
# almacén y producción; "cartera" la dice finanzas; "cliente" y "precio" los dice
# cualquiera. Un hook anclado SOLO en estas es candidato a post huérfano.
# Caso real (2026-07-16): "El pedido encoge cada vez que sube un piso" pasó el
# check con ancla="pedido" y el usuario preguntó, con razón, si eso se sabe que
# es de ventas. No se sabe: lo puede publicar un jefe de logística tal cual.
ANCLA_AMBIGUA = (r'\b(cliente|clientes|cerrar|cierras|cierra|cierro|cerrand\w+|comprar|compra|compras'
                 r'|comprando|precio|precios|facturar|factura|facturas|facturaci[oó]n|exportar|exporta'
                 r'|exportas|exportaci[oó]n|cartera|pedido|pedidos)\b')
ANCLA_VENTAS = f'({ANCLA_FUERTE}|{ANCLA_AMBIGUA})'
# §2.3 — estrechan el alcance, FUERA del hook. Lista canónica: gana a la de
# "términos naturalizados" de brand-voice §2, que decía lo contrario. El ICP de
# aboutme desempata: lleva vendiendo desde antes de que existiera Salesforce.
# CRM y forecast añadidos el 2026-07-14 (se coló "Tu CRM…" en un hook de meme).
DEMASIADO_NICHO = r'\b(b2b|outbound|inbound|pipeline|cadencia|reply rate|touchpoints?|sdr|aes?|cold email|discovery|gtm|icp|crm|forecast|saas|leads?|follow-?up)\b'
# §2.9 — delatores de verbo flojo: describen en vez de frenar el scroll
# Ojo con "pasa": "pasa factura" es un MODISMO punchy, no un verbo flojo, y es el
# gancho de "Subir en ventas siempre pasa factura" (13.61x). El check lo tumbaba.
VERBO_FLOJO = (r'(\bse cae\b|\bse caen\b|\bse pierde\b|\bse pierden\b|\bocurre\b|\bocurren\b'
               r'|\bpasa\b(?! factura)|\bpasan\b(?! factura)'
               r'|\bno funciona\b|\bexiste\b|\bexisten\b|\bhay que\b|\btiene que\b|\bes importante\b|\bes clave\b'
               # gerundios que DESCRIBEN en vez de frenar el scroll (§2.9). Solo se miden en el HOOK.
               r'|\bcolgando\b|\bvolviendo a\b|\bintentando\b|\btrabajando\b|\bdando vueltas\b|\bhaciendo\b)')
# §2.8 — openers quemados
OPENERS_QUEMADOS = r'(nadie te dice esto|lo que nadie te cuenta|me ha costado \w+ a[nñ]os|este es el error m[aá]s grande|el problema eres t[uú]|spoiler:|plot twist:)'

# §3.6 — cifras SIEMPRE en dígito, nunca en letra (universal). "un/una" son artículos y no cuentan.
NUMERO_EN_LETRA = (r'\b(dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|trece|catorce|quince'
                   r'|diecis[eé]is|diecisiete|dieciocho|diecinueve|veinte|treinta|cuarenta|cincuenta'
                   r'|sesenta|setenta|ochenta|noventa|cien|ciento|doscientos|trescientos|cuatrocientos'
                   r'|quinientos|seiscientos|setecientos|ochocientos|novecientos)\b')

# §2.3 — "En ventas," de PREFIJO se convirtió en muletilla: 3 hooks seguidos
# empezando igual. Es ancla legítima (el 16.55x lo usa) pero NO puede ser el
# reflejo: solo 1 de nuestros 11 ganadores empieza así. El resto ancla por el rol,
# el oficio, el verbo o la acción. Y ojo: esta muletilla la creó ESTE script — la
# forma más barata de aprobar el check del ancla es pegar "En ventas," delante.
MULETILLA_ANCLA = r'^\s*En ventas[,:]'

# §4.1 — comodines de peloteo gastados: 4/4 posts reales los usan LITERAL (working-preferences §4)
REVEAL_QUEMADO = r'\bs[ií],?\s+hablo\s+d'
COMODIN_LISTA = r'la gente y las empresas que mueven todo esto'
# post-workflow §4.2 Paso 3 — el eje "callado" está PROHIBIDO en mapas
EJE_CALLADO = r'(se vende callad|venden callad|en silencio|no lo cuentan|no lo cuenta|sin hacer ruido|nadie los conoce|no salen en la foto|trabajan callad)'

# post-workflow §4.3 Paso 3d — "Los 10": la EMPRESA no puede ser el sujeto que le
# quita el sitio a la persona. Es la única diferencia de texto entre el 4.82x del
# País Vasco (cero quejas) y el 0.66x de Cataluña (un trabajador pidió por privado
# que le quitáramos la mención):
#   País Vasco: "le HACEMOS fotos por fuera" (nosotros) · "no sale en la NOTA DE
#               PRENSA" (la prensa) · "nunca le PONEN el nombre delante" (impersonal)
#   Asturias:   "el número sale en la PRENSA" · "las cifras ya salieron en la
#               prensa, los nombres los pongo yo"
#   Cataluña:   "el nombre que se dice siempre es EL DE LA EMPRESA. Hoy le doy la
#               vuelta" → ahí hay un despojo con culpable, y el culpable está
#               etiquetado en el post.
# La persona invisible SIGUE siendo el eje del pilar (§4.3). Lo que se prohíbe no
# es la invisibilidad: es que la empresa sea quien la causa. El antagonista tiene
# que ser la prensa, el titular, la cifra, el foco o nosotros — algo que no tenga
# ego ni pueda mandarte un DM.
# Ojo: "ninguna empresa vende sola" NO es el beat de equipo, es su reverso. Dice
# que la empresa le debe a la persona. El beat de equipo dice que la persona le
# debe al equipo, que es lo que la audiencia pide en comentarios.
EMPRESA_LADRONA = (r'((la|las)\s+empresas?[^.\n]{0,40}(se\s+llevan?|acaparan?|roban?|tapan?|esconden?|eclipsan?|oculta)'
                   r'|el\s+nombre\s+que\s+se\s+dice\s+siempre\s+es\s+el\s+de\s+la\s+empresa'
                   r'|ninguna\s+empresa\s+vende\s+sola'
                   r'|el\s+m[eé]rito\s+se\s+lo\s+llevan?\s+(la|las|el|los)'
                   r'|le\s+doy\s+la\s+vuelta'
                   r'|detr[aá]s\s+del\s+logo)')
# post-workflow §4.3 Paso 3e — "Los 10" DEBE conceder que es trabajo en equipo.
# Decisión del usuario (2026-07-17), que corrige la lectura de este script: yo conté
# el "gracias por dar visibilidad, PERO esto es trabajo en equipo" como alcance,
# porque llega en comentarios. Es alcance Y es una crítica: el apoyo la envuelve, y
# lo que se queda es la crítica. Si no lo decimos nosotros, "se nos van a echar
# encima". Quien lee los DMs es el usuario.
#
# ⚠️ EL SUJETO ES LA PERSONA, NUNCA LA EMPRESA. Aquí está el filo:
#   ⛔ "una fábrica no factura sola" (1º) · "ninguna empresa vende sola" (2º)
#      → suenan al matiz, pero dicen que la EMPRESA depende de la persona: es el
#        marco de despojo de EMPRESA_LADRONA, no la concesión. Apuntan al revés.
#   ✅ "Ninguno de estos 10 vendió solo" · "Detrás de cada nombre hay una fábrica
#      entera" · "No lo firmó solo" · "con un taller entero detrás"
# Por eso el regex exige a la PERSONA de sujeto y no se conforma con "solo" suelto.
#
# ⚠️ RIESGO DE MULETILLA, asumido a sabiendas: la forma más barata de aprobar este
# check es pegar siempre la misma frase, que es exactamente como este script creó el
# tic de "En ventas," (ver MULETILLA_ANCLA). Mitigación: la lista de abajo tiene 4
# familias distintas, y `working-preferences §4` obliga a no repetir la formulación
# del "Los 10" anterior. Si en 3 posts sale la misma frase, el tic ya está aquí.
BEAT_EQUIPO = (r'((ningun[oa]|nadie|ni\s+uno)\s+de\s+(est[oa]s|ell[oa]s|la\s+lista|los\s+10)[^.\n]{0,40}\bsol[oa]\b'
               r'|no\s+(l[oa]\s+)?(hizo|hicieron|vendi[oó]|vendieron|firm[oó]|firmaron|cerr[oó]|cerraron|levant[oó]|levantaron)\s+sol[oa]s?\b'
               r'|detr[aá]s\s+de\s+cada\s+\w+\s+(hay|est[aá])'
               r'|(equipo|f[aá]brica|plantilla|nave|taller|oficina)\s+(enter[oa]\s+)?detr[aá]s)')

# NO existe un check de "atribución única", y no es un olvido: los datos lo tumban.
# El post que MÁS fuerte atribuye a una sola persona ("las 10 personas que más han
# hecho vender", "esa persona es la razón por la que la empresa factura lo que
# factura") es el País Vasco 4.82x, el ÚNICO de los tres sin una sola queja. El que
# más suave atribuye ("los 10 nombres que hay detrás de las cifras") es Asturias, y
# es el que se comió el DM del CEO. La atribución única ANTI-correlaciona con las
# quejas. Prohibirla habría sido prohibir las frases de nuestro mejor post de este
# pilar por una regla que suena sensata y que la evidencia contradice.
# Y el "gracias, pero esto es trabajo en equipo" que llega en comentarios NO es una
# queja: es un COMENTARIO, o sea alcance, y sale sobre todo en la 1ª y la 3ª, las dos
# que funcionan. Meter el matiz del equipo DENTRO del post le quita a la audiencia lo
# que iba a escribir. Sería cambiar DMs por comentarios. No se hace.

def norm(s):
    return s.replace('\r\n', '\n').replace('\r', '\n').strip('\n')

def bloques(texto):
    """Parte el post en bloques separados por línea en blanco."""
    return [b.split('\n') for b in re.split(r'\n\s*\n', texto) if b.strip()]

def es_lista(bloque):
    """¿Es una enumeración y no un bloque de prosa? Las enumeraciones están
    exentas de las reglas de tamaño de §3.2: van pegadas a propósito.

    Tres formas de serlo:
    1. Marcadores clásicos (→, ✅, 1., -).
    2. Patrón de ETIQUETA al final: 2+ líneas que acaban en ":" (Realidad: /
       CRM: / Traducción:). Es la unidad (c) de §3.3, "enumeración vertical
       paralela con sintaxis repetida, sin blanco entre líneas".
    3. Patrón de ETIQUETA en medio: 2+ líneas tipo "Comercial: cerrado." Es la
       MISMA unidad (c), pero con los dos puntos en medio en vez de al final.
       Faltaba, y por eso este script tumbaba por "bloque de 4+ líneas" la
       estructura del 13.61x ("SDR: ilusión y pelo intactos. / AE: primeras
       cuotas…"), que es el 3er mejor post del histórico. Lo destapó correr el
       validador contra nuestros propios ganadores, que es el test que nunca se
       había hecho.
    """
    lineas = [l for l in bloque if l.strip()]
    if not lineas:
        return True
    if all(re.match(r'\s*(→|✅|[0-9]+[\.\)]|-|•|1️⃣|[2-9]️⃣)', l) for l in lineas):
        return True
    if sum(1 for l in lineas if l.rstrip().endswith(':')) >= 2:
        return True
    return sum(1 for l in lineas if re.match(r'\s*[^:\n]{2,28}:\s+\S', l)) >= 2

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
    m = re.search(MULETILLA_ANCLA, hook_txt, re.I)
    chk(not m, 'Hook sin la muletilla "En ventas," de prefijo (§2.3)',
        'ancla legítima pero es tu reflejo: 1 de 11 ganadores empieza así. Ancla por el ROL '
        '("la vida del comercial"), el OFICIO ("el cold calling"), el VERBO ("se vende") o '
        'métela EMBEBIDA ("Subir en ventas pasa factura")' if m else '')
    fuerte = re.search(ANCLA_FUERTE, hook_txt, re.I)
    ambigua = re.search(ANCLA_AMBIGUA, hook_txt, re.I)
    if fuerte:
        detalle = f'ancla FUERTE: "{fuerte.group(0)}"'
    elif ambigua:
        # No se falla: Navarra (7.72x, el molde gold) ancla en "exporta", que es
        # ambigua, y voló. Pero se canta, porque es donde se cuela el post
        # huérfano y el script NO puede correr el test de §2.3 por ti.
        detalle = (f'⚠️ ancla solo AMBIGUA: "{ambigua.group(0)}" — la comparten logística/compras/'
                   f'finanzas. LEE el hook y pregúntate: ¿esto SOLO puede subirlo una cuenta de '
                   f'ventas? Si cuela en otra, añade "ventas"/"comercial" (§2.3)')
    else:
        detalle = 'NINGUNA palabra de ventas en el hook → lo podría subir cualquier cuenta'
    chk(bool(fuerte or ambigua), 'Hook anclado a VENTAS (§2.3)', detalle)
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
    ms = re.findall(NUMERO_EN_LETRA, cuerpo, re.I)
    chk(not ms, 'Cifras en dígito, nunca en letra (§3.6)',
        f'{len(ms)} en letra: {ms[:4]} → mezclar "10" y "seiscientos" en un mismo post canta' if ms else '')
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

    # escalera: todo bloque de prosa de 2-3 líneas va en longitud monótona,
    # recta (corta→larga) o invertida (larga→corta). Zigzag = no hay escalera (§3.2)
    zigzag = []
    for i, b in enumerate(bs):
        if es_lista(b) or not 2 <= len(b) <= 3:
            continue
        L = [len(l.strip()) for l in b]
        sube = all(L[j] < L[j + 1] for j in range(len(L) - 1))
        baja = all(L[j] > L[j + 1] for j in range(len(L) - 1))
        if not (sube or baja):
            zigzag.append(f'bloque {i} {L}')
    chk(not zigzag, 'Bloques de 2-3 en escalera, recta o invertida (§3.2)',
        f'{zigzag} → cada línea más larga que la anterior, o cada una más corta' if zigzag else '')

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
    if pilar == 'los10':
        m = re.search(BEAT_EQUIPO, cuerpo, re.I)
        chk(bool(m), 'Concede que es trabajo en equipo (§4.3 Paso 3e)',
            'sin esta línea se nos echan encima: el "gracias, PERO esto es trabajo en '
            'equipo" es la crítica más repetida de este pilar. Sujeto = la PERSONA '
            '("ninguno de los 10 lo hizo solo"), NUNCA la empresa ("ninguna empresa '
            'vende sola" es el marco de despojo, apunta al revés)' if not m else '')
        m = re.search(EMPRESA_LADRONA, cuerpo, re.I)
        chk(not m, 'La EMPRESA no es quien tapa a la persona (§4.3 Paso 3d)',
            f'"{m.group(0)}" → único rasgo de texto que separa el 4.82x sin quejas del '
            f'0.66x que sí las tuvo. La persona invisible se queda; el culpable, fuera: '
            f'que tape la prensa, el titular, la cifra o nosotros' if m else '')
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
