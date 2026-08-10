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
# ============ REGLAS AÑADIDAS EN LA AUDITORIA DEL 2026-07-20 ============
# Salieron de leer las 6 skills enteras buscando lo que estaba escrito pero
# nadie comprobaba. Criterio de admision: dato detras Y cero ambiguedad. Lo que
# dependia de la POLARIDAD de una frase (pinchar una region, criticar al lector)
# se descarto: un falso positivo enseña a ignorar el validador.

# brand-voice §3 — tabla de AI-tells, "en cuanto uno aparezca en un borrador,
# cambialo antes de entregar". Lista literal cerrada.
AI_TELLS = (r'\b(lo m[aá]s importante|lo fundamental|lo esencial|es (fundamental|crucial|clave) que'
            r'|hoy en d[ií]a|en la actualidad|en el mundo actual|sin embargo|no obstante|asimismo'
            r'|por lo tanto|en consecuencia|de esta manera|posibilita|optimizar|maximizar|potenciar'
            r'|numerosos|en definitiva|en resumen|en conclusi[oó]n|la clave est[aá] en|el secreto es)\b')

# global §2.8 y §6 — cierres quemados. El validador ya miraba OPENERS; estos
# viven al FINAL y no los veia nadie.
CIERRE_QUEMADO = r'^\s*(spoiler|plot twist|p\.?\s?d\.?|posdata)\s*:'

# global §6 — listicles con negrita Unicode. El check de markdown NO los caza:
# no son asteriscos, son otro bloque Unicode (Mathematical Alphanumeric Symbols).
NEGRITA_UNICODE = r'[𝐀-𝟿]'

# post-workflow §4.5 Paso 2 — el entregable generico esta MUERTO.
# Medido: "biblia de ventas" 1.2x · 2.3K impresiones, contra 8.52x y 9.85x de
# los entregables de UNA cosa concreta.
ENTREGABLE_GENERICO = (r'\b(biblia|todo mi material|todos mis recursos|toda mi (caja|carpeta|colecci[oó]n)'
                       r'|en una caja|el pack completo|arsenal)\b')

# post-workflow §4.5 puerta 4 — CTA implicita DEPRECADA: "hundieron el conteo de
# comentarios en dos A/B independientes".
CTA_IMPLICITA = r'(d[ií]melo abajo|levanto la mano|aqu[ií] abajo|te leo abajo)'

# post-workflow §4.5.0 — en el hook de ULTIMA HORA el sujeto es el TRABAJO del
# lector, nunca el modelo. Es el dato mas fuerte de todo el corpus: mismo hook,
# mismo emoji, mismo mes, 40x de diferencia.
#   trabajo -> 9.96x (632 com.) y 2.72x (167 com.)
#   modelo  -> 0.70x, 0.23x, 0.22x
SUJETO_ES_MODELO = (r'(claude\s*(opus|sonnet|haiku)?\s*\d|gpt-?\d|gemini\s*\d'
                    r'|el nuevo claude|ha salido \w+ ?\d|sonnet|opus)')


# §4.2 Paso 1 — En el peloteo el prejuicio SIEMPRE lo dice otro: "la ven como…",
# "nadie habla de…". Sin ese sujeto, el desprecio se lee como NUESTRO y ofende a
# quien queriamos que comentara defendiendo lo suyo (Iker, 2026-07-30).
SUJETO_AJENO = r'(nadie (?:habla|la tiene|la cuenta|sabe)|todos? (?:ven|la)|l[ao] (?:ven|llaman|conocen|tienen|despachan|colocan|cuentan|archivan|entierran|resumen|reducen|dan por|sitúan|situan)|le[s]? suena a|para el resto|en el mapa es|la pintan|se la imagina)'

# §4.2 Paso 1 — VERBOS DE PREJUICIO QUEMADOS. El sujeto ajeno es obligatorio,
# pero el VERBO tiene que rotar. "Fichada" salio el 30/07 en el despiece de
# Euskadi ("nadie lo tiene fichado como tierra de coches") y al dia siguiente
# volvia a abrir el mapa de Asturias, ademas DOS veces en el mismo post. El
# verbo es lo primero que se lee: repetirlo convierte el pilar en plantilla y
# el lector deja de notar el desprecio, que es el motor entero (Iker,
# 2026-07-31). No es que el verbo sea malo, es que ya esta gastado.
#
# COMO SE MANTIENE: cuando publiques un peloteo, mete aqui el verbo que hayas
# usado. La lista solo crece.
VERBO_PREJUICIO_QUEMADO = {
    'despachan': 'Murcia (Iker)',
    'fichada': 'Asturias (Unai)',
    'fichado': 'Euskadi (Iker)',
    'jubilada': 'Asturias (Unai)',
    'la ven como': 'Navarra, Cataluña y Aragón',
    'la llaman': 'Álava (Unai)',
    'la conocen por': 'País Vasco (Unai)',
    'nadie habla': 'Gipuzkoa (Iker) y País Vasco (Unai)',
    'en el mapa es': 'Euskadi (Iker)',
    'resumen': 'Castilla y León (Iker)',
    'todos ven': 'Valencia (Iker)',
}

# §4.2 Paso 1 — la frase-rabia es el motor: sin ella el local no siente el
# desprecio, no comenta y no hay alcance. Familia validada + variantes.
FRASE_RABIA = r'(y para de contar|y poco m[aá]s|y poco que rascar|y gracias|para irse|antes de seguir carretera|de vuelta a|y a otra cosa|y ya|y punto|y hasta ah[ií])'

# §4.4b — FRASES DEL SPAM NINJA QUEMADAS. El dolor es SIEMPRE el mismo (dar con
# el cliente ideal, empresa y persona), pero la FORMA rota en cada post. Iker,
# 2026-07-31: "seguro que hay miles de variantes, no puede ser que siempre me
# digas es dar con el que decide". Un cierre repetido hace que la publicacion
# nueva no se note nueva, que es justo lo contrario de para lo que existe.
# Al publicar, mete aqui la frase que hayas usado. La lista solo crece.
SPAM_QUEMADO = {
    'dar con el que decide': 'meme Unai 29/07, historia Iker 29/07, mapa Asturias 31/07',
    'son meses a mano': 'lo mismo, en los tres',
    'te lo damos hecho': 'lo mismo, en los tres',
}

# §4.2 Paso 1 — CONCEPTOS DE GANCHO YA USADOS. La receta decia "no repitas
# concepto usado" y no habia lista: dependia de que yo recordara diez posts.
# Auditoria del 2026-07-31.
# §4.2 Paso 2 — PAISES YA USADOS EN LA COMPARACION. Lista nueva del 2026-08-03:
# no existia y por eso propuse Bolivia para Castilla y Leon sin darme cuenta de
# que ya era el pais del mapa de Navarra. La comparacion es lo que se comparte,
# asi que repetirla se nota mas que ninguna otra cosa.
PAIS_QUEMADO = {
    'uruguay': 'Murcia',
    'bolivia': 'Navarra',
    'croacia': 'Galicia',
    'luxemburgo': 'Valencia',
    'italia': 'Andalucía',
    'portugal': 'Cataluña (Iker)',
    'chipre': 'Asturias',
    'finlandia': 'Cataluña (Unai)',
    'honduras': 'Álava',
    'kenia': 'Aragón',
    'paraguay': 'Castilla y León',
}

CONCEPTO_QUEMADO = {
    'sitio de comer': 'Euskadi',
    'desierto': 'Murcia',
    'patio trasero': 'Navarra',
    'esquina del atl': 'Galicia',
    'museo minero': 'Asturias',
    'ltima parada': 'Cataluña',
    'trastienda del norte': 'Álava',
    'secarral': 'Aragón',
    'pasillo de espa': 'descartado por Iker: critica a España',
    'tejado de la pen': 'Castilla y León',
}

# §4.2 Paso 1 — FRASES-RABIA YA USADAS. Misma historia: la receta pedia no
# repetirla y no habia con que comprobarlo.
FRASE_RABIA_USADA = {
    'de vuelta al aeropuerto': 'Euskadi',
    'y para de contar': 'Murcia',
    'y poco m': 'Navarra',
    'poco que rascar': 'Asturias',
    'y a seguir': 'Cataluña',
    'para irse': 'Álava',
    'antes de seguir carretera': 'Aragón',
    'y a otra cosa': 'Castilla y León',
}

# §4.5.0a — MOLDE B del lead magnet: Claude (o yo) + VERBO PUNCHY + resultado.
# Sacado de los cinco lead magnets NUESTROS con mas comentarios, no de memoria.
# Lo habia escrito tres veces a ojo y las tres se me quedo corto, la ultima
# rechazando "Claude acaba de destapar" cuando "Claude ACABA DE MATAR el cold
# outbound" es literalmente nuestro numero 1 (632 comentarios). Metodo nuevo:
# el regex sale de la lista de ganadores, y si se anade un ganador se reabre.
#   632c "Claude ACABA DE matar…"   285c "LE PASE las llaves…"
#   232c "LE TIRE las llaves…"      183c "CLAUDE ME HA AYUDADO a cazar…"
#   167c "Claude HA REDUCIDO toda mi prospeccion…"
MOLDE_EXPERIMENTO = (
    r'\b('
    r'claude (?:acaba de|ahora|ya|me|nunca|ha|se)\s*\w*'   # Claude acaba de matar / Claude ahora destapa
    r'|le (?:di|pas[eé]|tir[eé]|dej[eé])'                  # Le tiré / Le pasé las llaves
    r'|hoy (?:desmonto|comparto|regalo|te doy|le)'
    r'|llevo (?:\w+ )?(?:meses|semanas|d[ií]as|a[ñn]os)'
    r'|nunca hab[ií]a|me ha ayudado|acaba de \w+'
    r'|me (?:destapa|caza|saca|desentierra|pone|encuentra|dice)'
    r'|cada semana (?:publico|hago|le)|(?:le )?paso a claude'
    r')\b')

def normalizar_kw(k):
    """La palabra del CTA, en minusculas y sin tildes, para compararla."""
    import unicodedata
    k = unicodedata.normalize('NFD', k.strip().lower())
    return ''.join(c for c in k if unicodedata.category(c) != 'Mn')


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
# La cuenta de Mario NO es de ventas: es la de MARKETING/growth (aboutme §2). Su
# hook ancla en marketing, no en "vender". Sin esto, todo post suyo falla el ancla.
MARKETING_ANCLA = (r'\b(marketing|contenido|redes|crecer|crecimiento|alcance|impresiones'
                   r'|audiencia|viral|engagement|seguidores|marca personal|perfil|linkedin)\b')
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
    4. Item NUMERADO DESARROLLADO: la primera linea abre con "1." y debajo van
       2-4 lineas de desarrollo. Faltaba, y por eso este script tumbaba NUESTRO
       MEJOR LEAD MAGNET, el de 632 comentarios, cuyos 5 puntos son justo eso
       ("1. Lenguaje natural > filtros rigidos" + tres lineas explicandolo).
       Un item de lista es una unidad estructural aunque su desarrollo sea
       prosa: lo que lo hace lista es el numero de delante, no que todas las
       lineas lleven marcador. Mismo hallazgo y mismo metodo que el caso 3:
       correr el validador contra nuestros propios ganadores.
    """
    lineas = [l for l in bloque if l.strip()]
    if not lineas:
        return True
    if re.match(r'\s*(?:[0-9]+[\.\)]|1️⃣|[2-9]️⃣)\s', lineas[0]) and len(lineas) <= 5:
        return True
    if all(re.match(r'\s*(→|✅|[0-9]+[\.\)]|-|•|1️⃣|[2-9]️⃣)', l) for l in lineas):
        return True
    if sum(1 for l in lineas if l.rstrip().endswith(':')) >= 2:
        return True
    return sum(1 for l in lineas if re.match(r'\s*[^:\n]{2,28}:\s+\S', l)) >= 2


def leer_menciones_usadas():
    """Entidades ya mencionadas en posts de peloteo, de las TRES cuentas.
    Se regenera con `node scripts/extraer-menciones.mjs`. Si no existe, el
    check se salta en vez de fallar: no tener el fichero no es un error del post.
    """
    import json
    f = os.path.join(RAIZ, 'docs', 'skills', 'menciones-usadas.json')
    if not os.path.exists(f):
        return None
    try:
        return json.load(io.open(f, encoding='utf-8'))
    except Exception:
        return None


def normalizar_entidad(x):
    """Misma normalizacion que extraer-menciones.mjs. Sin ella se cuela
    'Bioiberica' contra 'Bioiberica' y 'Prefabricados Pujol' contra
    'Prefabricats Pujol', que es el fallo real documentado en §4.0c."""
    import unicodedata
    x = unicodedata.normalize('NFD', x or '')
    x = ''.join(c for c in x if unicodedata.category(c) != 'Mn').lower()
    x = re.sub(r'\b(s\.?a\.?u?\.?|s\.?l\.?u?\.?|group|grupo|holding|company)\b', '', x)
    x = re.sub(r'[^a-z0-9ñ ]', ' ', x)
    return re.sub(r'\s+', ' ', x).strip()


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

# ⚠️ AL AÑADIR UN PILAR NUEVO, CABLEALO A LOS GATES QUE YA EXISTEN.
# Iker, 2026-08-05: meti el pilar `evento` y solo le escribi SUS checks nuevos,
# sin revisar los 22 `if pilar in (...)` que ya habia. Resultado: el validador
# aprobo 28/28 un post sin un solo bloque de dos, porque ese check estaba
# limitado a mapa/los10/leadmagnet. Lo pillo el a ojo, que es justo lo que el
# validador existe para evitar.
# EL PROCEDIMIENTO: grep "if pilar" y decidir SI o NO para cada uno, por escrito.

def validar(texto, pilar, cuenta=None, generico=False, meme_sobrio=False, ref_fuera=False, remix=False):
    texto = norm(texto)
    if pilar == 'entregable':
        return validar_entregable(texto)
    bs = bloques(texto)
    hook = bs[0] if bs else []
    hook_txt = ' '.join(hook)
    cuerpo = texto
    r = []          # (ok, nombre, detalle, es_aviso)
    def chk(ok, nombre, detalle='', aviso=False):
        # aviso=True: se imprime pero NO cuenta en el marcador. Es para lo que
        # es SOSPECHOSO pero no prohibido — mezclarlo con las reglas duras
        # vaciaria de significado el "20/20", que es justo lo que pasa cuando
        # un post con 20/20 esta mal por criterio.
        r.append((ok, nombre, detalle, aviso))

    # ---------- UNIVERSALES ----------
    chk(len(hook_txt) <= 210, 'Hook ≤210 caracteres (§2.1)', f'{len(hook_txt)} caracteres')
    chk(len(hook) == 1, 'Hook es UN bloque, sin salto dentro (§2.1)',
        f'{len(hook)} líneas en el bloque del hook' if len(hook) != 1 else '')
    # §2.10 — UNA O DOS ORACIONES, NUNCA TRES. Medido sobre 224 posts el
    # 2026-07-20: 1 oracion -> 8,4% de outliers · 2 -> 17,0% · 3 -> 0 de 5.
    # Ninguna de tres ha volado jamas. Y el motivo es fisico: con tres te comes
    # el corte de la vista previa de LinkedIn y el lector no llega al gancho.
    # Se colo un hook de tres frases con 20/20 porque el script contaba
    # caracteres, no oraciones.
    _h = re.sub(r'https?://\S+', '', hook_txt)
    _orac = [t for t in re.split(r'(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÑ¿¡])', _h) if len(t.strip()) > 3]
    chk(len(_orac) <= 2, 'Hook de 1 o 2 oraciones, nunca 3 (§2.10)',
        f'{len(_orac)} oraciones. Ninguna de 3 ha sido outlier (0 de 5)' if len(_orac) > 2 else '')

    # §2.10 — la ZONA donde vive lo que funciona. El tope de 210 es el maximo
    # tecnico, pero la mediana de nuestros outliers es 75 (hook de 1 oracion) y
    # 93 (de 2). Aviso, no prohibicion: el mapa de 12.9x tiene 115.
    chk(len(hook_txt) <= 110, 'Hook en la zona de los outliers, ≤110 (§2.10)',
        f'{len(hook_txt)} car. Los ganadores viven en 75-93; el mas largo que ha '
        f'funcionado tiene 115' if len(hook_txt) > 110 else '', aviso=True)

    nums = re.findall(r'\d+(?:[.,]\d+)?', hook_txt)
    chk(len(nums) <= 1, 'Hook con ≤1 cifra (§2.5)', f'{len(nums)} cifras: {nums}' if len(nums) > 1 else '')
    if generico:
        # Los hooks de Martín Arosa y Guillermo Flor son CORTOS y SIN cifras
        # (`§4.5.0b`). Iker NUNCA quiere cifras en el hook y los suyos son de pocas
        # palabras; las cifras (60%, 100.000€) van al CUERPO.
        chk(len(nums) == 0, 'GENÉRICO: hook SIN cifras (Martín Arosa/Guillermo, §4.5.0b)',
            f'{len(nums)} cifra(s) {nums} — al hook no; van al cuerpo' if nums else '')
        chk(len(hook_txt) <= 90, 'GENÉRICO: hook CORTO ≤90 car (§4.5.0b)',
            f'{len(hook_txt)} car — los suyos son de pocas palabras, corta' if len(hook_txt) > 90 else '')
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
    # Mario = cuenta de MARKETING: ancla en marketing, no en ventas. El resto de
    # cuentas (Iker/Unai/Asier) sí anclan a ventas. En el GENÉRICO no se fuerza
    # ancla (los hooks de Martín/Guillermo van de IA/tendencia, §4.5.0b).
    _es_mario = (cuenta or '').strip().lower() == 'mario'
    if _es_mario:
        _mk = re.search(MARKETING_ANCLA, hook_txt, re.I)
        chk(bool(_mk), 'Hook anclado a MARKETING (cuenta Mario, aboutme §2)',
            'Mario es la cuenta de marketing/growth: el hook ancla en contenido/redes/marketing, '
            'no en "vender"' if not _mk else f'ancla marketing: "{_mk.group(0)}"')
    elif not generico:
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

    # ── menciones: colocación y unicidad (transversal, Iker 2026-07-24) ──
    # mapa/los10 quedan fuera: sus 20 fichas ya son empresas distintas por
    # construcción, y sus @ multi-palabra ("@Grupo X / @Grupo Y") darían falso
    # positivo. En los pilares de prosa (historia, leadmagnet) las menciones se
    # tejen, y ahí es donde muerden estas dos reglas.
    if pilar not in ('meme', 'mapa', 'los10'):
        # 1) NUNCA una @ pegada al gancho: el bloque justo tras el hook es para
        # la tensión de la historia o el claim, no para etiquetar. Una @ ahí se
        # lee como cebo de engagement; las menciones van tejidas más adelante.
        if len(bs) >= 2:
            _tras = ' '.join(bs[1])
            chk('@' not in _tras, 'Ninguna mención pegada al gancho (menciones §2.9)',
                'hay una @ en el bloque justo tras el hook: téjela más adelante' if '@' in _tras else '')
        # 2) cada persona/marca se menciona UNA sola vez: repetir el mismo @
        # (p.ej. @Iker arriba y otra vez en la línea de resultados) gasta alcance
        # y suena a peloteo. Token = @ + primer run de letras.
        _ats = [a.lower() for a in re.findall(r'@([A-Za-zÁÉÍÓÚÑÜáéíóúñü]+)', cuerpo)]
        _dups = sorted({a for a in _ats if _ats.count(a) > 1})
        chk(not _dups, 'Cada persona se menciona UNA sola vez (menciones §2.9)',
            f'repetidas: {_dups} → una mención por persona' if _dups else '')

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
    # §3.2 — TIENE que haber al menos un bloque de DOS. El ritmo de LinkedIn es
    # suelta → par → suelta → terna → sueltas, y sin pares se convierte en una
    # lista de frases sueltas con algún bloque de 3, que es exactamente lo que
    # salía: medido el 2026-07-17, el lead magnet de Iker tenía 1 bloque de 3 y
    # 10 líneas individuales, y CERO pares. El mapa de Cataluña, lo mismo.
    #
    # Por qué este check positivo SÍ y el del verbo punchy NO: este es
    # ESTRUCTURAL, no léxico. Exigir "un bloque de 2" no me empuja a escribir
    # siempre la misma frase — el contenido sigue siendo libre. Exigir "un verbo
    # de esta lista" sí, y así nació la muletilla de "En ventas,".
    #
    # ⛔ EL MEME QUEDA FUERA (usuario, 2026-07-17), y no es una excepción de
    # conveniencia: el meme CALCA SU REFERENCIA y punto, así que su forma la
    # decide el post que estamos remixando, no nuestro ritmo. La evidencia iba por
    # delante de la decisión — al meter el check, los 2 memes ganadores (13.51x y
    # 16.46x) lo fallaron mientras el mapa de Navarra 7.72x lo pasaba. Se anotó
    # como conflicto sin taparlo y el usuario lo resolvió así.
    if pilar in ('mapa', 'los10', 'leadmagnet', 'evento'):
        pares = [i for i, b in enumerate(bs) if not es_lista(b) and len(b) == 2]
        chk(bool(pares), 'Al menos un bloque de DOS (§3.2)',
            'todo son líneas sueltas y bloques de 3: el par es el ritmo típico de LinkedIn y no aparece nunca'
            if not pares else f'{len(pares)} par(es)')

    chk(not zigzag, 'Bloques de 2-3 en escalera, recta o invertida (§3.2)',
        f'{zigzag} → cada línea más larga que la anterior, o cada una más corta' if zigzag else '')

    # ---------- AUDITORIA 2026-07-20: lo que estaba escrito y nadie miraba ----------
    m = re.search(AI_TELLS, cuerpo, re.I)
    chk(not m, 'Sin AI-tells de la tabla (brand-voice §3)',
        f'"{m.group(0)}" — la tabla dice "cambialo antes de entregar"' if m else '')

    _ultimas = [l for l in cuerpo.splitlines() if l.strip()][-3:]
    m = next((re.search(CIERRE_QUEMADO, l, re.I) for l in _ultimas
              if re.search(CIERRE_QUEMADO, l, re.I)), None)
    chk(not m, 'Sin cierres quemados: Spoiler / Plot twist / P.D. (§2.8, §6)',
        f'"{m.group(0)}" al final' if m else '')

    m = re.search(NEGRITA_UNICODE, cuerpo)
    chk(not m, 'Sin negrita Unicode tipo 𝗟𝗮𝘀 𝟭𝟬 (§6)',
        'el check de markdown no la caza: es otro bloque Unicode' if m else '')

    # brand-voice §4.5 — el nombre del founder gana al del producto. Como mucho
    # UNA vez y nunca en el hook. El check viejo solo miraba el spam ninja.
    _neety = len(re.findall(r'\bNeety\b', cuerpo, re.I))
    chk(_neety <= 1, 'Neety se nombra como mucho UNA vez (brand-voice §4.5)',
        f'{_neety} veces' if _neety > 1 else '')
    chk(not re.search(r'\bNeety\b', hook_txt, re.I), 'Neety NUNCA en el hook (brand-voice §4.5)',
        'el post vende al pensador, no al producto' if re.search(r'\bNeety\b', hook_txt, re.I) else '')

    # global §4.4b + outliers §3.14 — el link va SIEMPRE a recursos.neety.com
    # (dominio propio), nunca a web ajena. Los CTR mas altos del historico no
    # valian: iban a pampam.city. 727 clics regalados entre tres mapas.
    # Desde 2026-07-23 el mapa enlaza a recursos.neety.com/mapas/{region} (la web
    # embebe el mapa completo, el jefe ya pago PamPam) en vez de a /agendar/:
    # ambos son recursos.neety.com, asi que este check los acepta igual.
    _urls = re.findall(r'https?://\S+|\b[\w.-]+\.(?:com|es|city|io)\S*', cuerpo)
    _fuera = [u for u in _urls if 'recursos.neety.com' not in u and 'linkedin.com' not in u]
    # ⭐ EL EVENTO ENLAZA DIRECTO A LUMA Y NO SE AVISA DE NADA (Iker, 2026-08-05).
    # Propuse montar recursos.neety.com/evento para que el clic fuera nuestro, y
    # lo descarto con razon: "cada clic intermedio es friccion, y aqui no busco
    # trafico, busco inscripciones". Un evento PRESENCIAL en Euskadi ya tiene
    # bastante barrera como para meterle un salto mas. Asi que el check ni salta:
    # no es una mejora pendiente, es una decision tomada.
    _solo_luma = bool(_fuera) and all('luma.com' in u for u in _fuera)
    if not (pilar == 'evento' and _solo_luma):
        chk(not _fuera, 'El enlace apunta a recursos.neety.com, no fuera (outliers §3.14)',
            f'{_fuera[:2]} — un clic a web ajena no es un clic nuestro' if _fuera else '')

    # global §2.10 — la mano abajo. DURA en peloteo (su formula de hook la lleva
    # literal), AVISO en meme y lead magnet: 2 de 3 memes grandes la llevan pero
    # el 15.0x cierra con ✨ y funciona igual. Y forzarla en todo es como se
    # fabrico la muletilla "En ventas,".
    _mano = hook_txt.rstrip().endswith('👇')
    if pilar in ('mapa', 'los10'):
        chk(_mano, 'El hook cierra con 👇 (§4.2/§4.3, formula del pilar)',
            'en peloteo la formula del hook lo lleva literal' if not _mano else '')
    elif pilar in ('meme', 'leadmagnet'):
        chk(_mano, 'El hook cierra con 👇 (§2.10)',
            'no es obligatorio (el 15.0x cierra con ✨) pero es la opcion por defecto'
            if not _mano else '', aviso=True)

    # ⛔ ANGLICISMOS CON TRADUCCION LLANA (Iker, 2026-08-07). Solo se prohiben los
    # que el lector YA dice en espanol: CRM, B2B, SDR, lead o deal no tienen
    # equivalente llano y siguen valiendo en el cuerpo (`brand-voice §2`).
    # `pipeline` si lo tiene, y ni siquiera estaba en la lista: se me colo en el
    # cuerpo del meme de Unai del 06/08 y se publico. El lector es un director
    # comercial de 55 anos que vende maquinaria y puede no tener CRM.
    ANGLICISMOS = {
        # `prompt` ya estaba en la lista de anglicismos prohibidos de
        # brand-voice §2 desde hacia semanas y ayer NO la meti aqui: fallo mio.
        # Iker la quita del lead magnet del 07/08. ⚠️ Honestidad sobre el dato:
        # NO hay indicio de que LinkedIn la penalice —7 posts nuestros con ella
        # se repartieron bien y Martin Arosa la usa en 15 de sus 50 ultimos—.
        # Se prohibe por AUDIENCIA, no por algoritmo: un director comercial de
        # 55 anos que vende maquinaria no dice "prompt".
        'prompt': 'el mensaje / la instruccion que le mandas',
        'prompts': 'los mensajes / las instrucciones',
        'pipeline': 'la cartera / las oportunidades abiertas',
        'funnel': 'el embudo', 'forecast': 'la prevision',
        'workflow': 'el proceso / la rutina', 'engagement': 'la respuesta',
        'insight': 'el hallazgo', 'insights': 'los hallazgos',
        'pitch': 'el discurso', 'closing': 'el cierre',
    }
    _ang = [w for w in ANGLICISMOS if re.search(r'\b' + w + r'\b', cuerpo, re.I)]
    chk(not _ang, 'Sin anglicismos que tengan traduccion llana (brand-voice §2b)',
        ' · '.join(f'"{w}" → {ANGLICISMOS[w]}' for w in _ang) if _ang else '')

    # ⛔ MARCAS TEMPORALES (Iker, 2026-08-06). El original de Daniel Disney lleva
    # una lista Monday…Friday, me quedé con ese ritmo de semana y escribí "y aun
    # no es ni jueves" en un post que se publico un JUEVES. Lo pillo Iker al
    # subirlo. Un dia de la semana o un mes son DATOS y se verifican igual que una
    # cifra: que el original diga miercoles no hace verdad nuestro miercoles.
    # Aviso y no fallo, porque a veces la marca temporal es correcta a proposito.
    _tiempo = re.search(r'\b(lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo'
                        r'|enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre'
                        r'|octubre|noviembre|diciembre)\b', cuerpo, re.I)
    chk(not _tiempo, 'Marca temporal verificada contra la fecha REAL de publicacion',
        (f'dice "{_tiempo.group(0)}" — comprueba que es cierto el dia que se publica, no hoy '
         'ni el dia que lo decia la referencia. Si el post aguanta dos dias en el feed, mejor '
         'una marca que no caduque (global §2.2b-CAPAS)') if _tiempo else '', aviso=True)

    # ── §3.2 · ANCHO DE LINEA y RITMO (Iker, 2026-08-06) ─────────────────────
    # Dos cosas que la receta pedia desde siempre y que el validador NO miraba,
    # y por eso se me colaron en verde tres veces en una semana.
    #
    # 1) ANCHO. Contaba las lineas que YO escribo, no las que LinkedIn PINTA.
    #    Una linea de 95 caracteres es una linea aqui y dos en el movil, asi que
    #    un "bloque de dos" acaba leyendose como cuatro.
    #    ⚠️ HONESTIDAD SOBRE EL DATO: medido en 651 lineas de outliers y 2.874 de
    #    flops, las lineas largas NO correlacionan con el rendimiento — 17,8% de
    #    lineas >80 en los outliers contra 14,8% en los flops. Es CRITERIO DE
    #    OFICIO de Iker, no una palanca de alcance, asi que va como AVISO y no
    #    cuenta en el marcador. Los enlaces se saltan: miden lo que miden.
    # El GANCHO se excluye: tiene su propia medida (§2.1 ≤210 y la zona de
    # outliers ≤110) y va en una sola linea a proposito. Incluirlo hacia que
    # este aviso saltara en CASI TODOS los posts, y un aviso que salta siempre
    # es ruido: es la razon por la que el 2026-08-07 me lo salte teniendo una
    # linea de 82 caracteres delante (Iker me la pillo).
    _largas = [l for b in bloques(texto)[1:] for l in b
               if len(l.strip()) > 80 and 'http' not in l
               and not l.strip().startswith(('→', '❌', '✅'))]
    chk(not _largas, 'Ninguna linea pasa de 80 caracteres (§3.2)',
        (f'{len(_largas)} linea(s) se parten en dos en el movil, y ahi un bloque de dos '
         f'se lee como cuatro. La peor: "{max(_largas, key=len).strip()[:60]}…"')
        if _largas else '', aviso=True)

    # 2) RITMO. `1-2-1-2-1-2` es un metronomo: el lector coge el patron y deja de
    #    leer. Iker, 2026-08-06: "superpredecible, es horrible". Se exige AL MENOS
    #    UN BLOQUE DE TRES y que no se alterne 1-2 mas de dos veces seguidas.
    #    ⭐ AMPLIADO EL 2026-08-06: la primera version solo prohibia el 1-2-1-2, y
    #    a la siguiente entrega le colé un 1-3-1-2-1-3-1-2, que es igual de
    #    predecible pero con ciclo de CUATRO. Iker: "superpredecible. Siempre tiene
    #    que haber mas lineas individuales y mas irregular". Asi que ahora se mira
    #    la PERIODICIDAD en general, no un patron concreto, y se exige que la linea
    #    suelta domine — la misma prioridad que ya estaba escrita para el email
    #    (`email-marketing`: 1º lineas individuales, 2º bloques de dos, 3º de tres).
    # Un item de lista numerada DESARROLLADO (titulo + 2-3 lineas) es una
    # unidad estructural, no un bloque de prosa, asi que no entra en las
    # reglas de ritmo ni de escalera. Sin esto, la lista de 5 items cuenta
    # como 3-3-3-3-3 y dispara el check de patron repetido. Y es justo la
    # estructura de nuestro mejor lead magnet, el de 632 comentarios.
    _pat = [len(b) for b in bloques(texto) if not es_lista(b)]
    if pilar == 'objeto':
        _pat = [n for n, bl in zip(_pat, bloques(texto))
                if not any(l.strip().startswith('→') for l in bl)]
    # `objeto` estaba FUERA de esta lista y no deberia haberlo estado nunca
    # (Iker, 2026-08-07): el ritmo es regla de formateado, o sea GLOBAL, y el
    # despiece es un post como cualquier otro. Se le excluye solo el tramo de
    # fichas, que va en bloques de 4 por diseño del pilar.
    if pilar in ('meme', 'mapa', 'los10', 'historia', 'leadmagnet', 'evento', 'objeto') and len(_pat) >= 6:
        _ritmo = '-'.join(map(str, _pat))
        chk(any(n >= 3 for n in _pat), 'RITMO: al menos un bloque de TRES (§3.2)',
            f'ritmo {_ritmo} — todo unos y doses se lee plano')
        # Ciclo de 2: a-b-a-b con a distinto de b. Ciclo de 4: a-b-c-d-a-b-c-d.
        _ciclo2 = any(_pat[i] == _pat[i + 2] and _pat[i + 1] == _pat[i + 3]
                      and _pat[i] != _pat[i + 1] for i in range(len(_pat) - 3))
        _ciclo4 = any(_pat[i:i + 4] == _pat[i + 4:i + 8] and len(set(_pat[i:i + 4])) > 1
                      for i in range(len(_pat) - 7))
        chk(not (_ciclo2 or _ciclo4), 'RITMO: sin patron que se repita (§3.2)',
            f'ritmo {_ritmo} — se repite un ciclo de {"dos" if _ciclo2 else "cuatro"} bloques. '
            'El lector lo coge y deja de leer. Rompelo metiendo lineas sueltas seguidas')
        _sueltas = sum(1 for n in _pat if n == 1) / len(_pat)
        chk(_sueltas >= 0.55, 'RITMO: la linea suelta domina, +55% de los bloques (§3.2)',
            f'ritmo {_ritmo} — solo {_sueltas:.0%} son lineas sueltas. La suelta es la base y '
            'los bloques son la variedad, no al reves')

    # ⚠️ RECORDATORIO DE ENTREGA, en TODOS los pilares (Iker, 2026-08-06). El
    # validador solo ve el texto, asi que la forma de la ENTREGA no la puede
    # comprobar; pero puede recordarmela, que es donde reincido. La comparativa
    # original-vs-el-mio lleva escrita en working-preferences §1e desde el 22 de
    # julio y la he entregado mal tres veces: dos bloques apilados en vez de dos
    # columnas en la misma fila.
    # Si el post CALCA una referencia, su anatomia se mide, no se mira. Vale para
    # cualquier pilar (global §2.2b-MEDIR), por eso el aviso sale con --remix y
    # tambien en meme, que siempre parte de una referencia.
    if remix or pilar == 'meme':
        chk(False, 'ENTREGA: mide la anatomia de la referencia antes de entregar',
            'python scripts/anatomia-referencia.py original.txt mio.txt — compara longitud '
            'del gancho, numero de frases, emoji y DONDE vive, longitud total, bloques y '
            'ritmo. El 2026-08-06 entregue un gancho del DOBLE de largo que el original, '
            'con dos frases en vez de una y el emoji cambiado. La salida va en la entrega '
            '(global §2.2b-MEDIR)', aviso=True)
        chk(False, 'ENTREGA: adjunta la FOTO de la referencia, no solo su enlace',
            'bajala y mandala como fichero en el mismo turno que el prompt del disenador. '
            'El enlace es para Iker; la foto es para el disenador, que la necesita adjunta '
            '(working-preferences §1d-ter)', aviso=True)

    chk(False, 'ENTREGA: comparativa en DOS COLUMNAS, misma fila, separador discontinuo',
        'los dos textos ENTEROS y verbatim, izquierda el original y derecha el mio, '
        'separados por una linea discontinua vertical. Sin etiquetas de gancho ni cuerpo '
        'dentro de las columnas, y sin trocear. No hace falta que sea copiable: es para '
        'mirarla (working-preferences §1e)', aviso=True)

    # ---------- POR PILAR ----------
    # En EVENTO el enlace de inscripcion hace de spam ninja: es el CTA del post.
    tiene_link = 'recursos.neety.com' in cuerpo or (pilar == 'evento' and 'luma.com' in cuerpo)
    if pilar in ('mapa', 'los10', 'meme', 'evento'):
        chk(tiene_link, 'Spam ninja presente (§4.4b)', 'falta el link de agendar' if not tiene_link else '')
        # ⛔ 2026-08-06, Iker: este check decia "falta el link de agendar" pero se
        # conformaba con CUALQUIER url de recursos.neety.com, asi que me colo un
        # meme cuyo ninja apuntaba a /prospeccion-manual/. §4.4b es tajante: el
        # spam ninja ES el enlace de agendar. Y el orden de prioridad de conversion
        # no es opinable (Iker, 2026-08-06):
        #   1. AGENDAR — la web con el buscador de clientes que acaba en demo y venta
        #   2. LEAD MAGNET — captura el correo para email marketing, menos friccion
        #      pero tambien menos valor por lead
        # Un lead magnet en el hueco del ninja cambia lo primero por lo segundo sin
        # que nadie lo haya decidido. El MAPA es la unica excepcion y ya la valida
        # su propio check: va a la pagina del mapa, que lleva su CTA a agendar.
        if pilar in ('los10', 'meme'):
            _dest_ok = 'recursos.neety.com/agendar' in cuerpo
            chk(_dest_ok, 'El spam ninja apunta a /agendar/, no a un lead magnet (§4.4b)',
                'hay enlace pero no es el de agendar. Prioridad 1 = agendar (demo y venta), '
                'prioridad 2 = lead magnet (correo). Solo el mapa enlaza a otro sitio, y '
                'porque su pagina ya lleva el CTA a agendar dentro' if not _dest_ok else '')
        if tiene_link:
            # El enlace SIEMPRE con https:// delante, o LinkedIn puede no detectarlo
            # como clicable (Iker, 2026-07-22). Mismo criterio que los DMs.
            # Que dominio hace de CTA en ESTE post: en evento es luma.com, en el
            # resto recursos.neety.com. Antes estaba escrito a fuego y al meter el
            # pilar evento esto reventaba con StopIteration (Iker, 2026-08-05).
            _dom = 'luma.com' if (pilar == 'evento' and 'luma.com' in cuerpo) else 'recursos.neety.com'
            _bare_link = re.search(r'(?<!https://)' + re.escape(_dom), cuerpo)
            chk(not _bare_link, 'El enlace lleva https:// delante (§4.4b regla 8)',
                f'falta https:// delante de {_dom}' if _bare_link else '')
            chk('Neety' not in cuerpo.split(_dom)[0].split('\n')[-1],
                'Spam ninja NO nombra a Neety (§4.4b)', 'nombrar la marca = publicidad encubierta')
            lineas = [l for l in cuerpo.split('\n') if l.strip()]
            idx = next(i for i, l in enumerate(lineas) if _dom in l)
            chk(idx != len(lineas) - 1, 'Spam ninja NO es la última línea (§4.4b)',
                'el cierre va después' if idx == len(lineas) - 1 else '')
            for i, b in enumerate(bs):
                if any(_dom in l for l in b):
                    # El spam ninja va FUSIONADO: la broma pegada al CTA + enlace,
                    # máx 2 líneas (Iker, 2026-07-22). Antes se exigía separarlas
                    # con un blanco; ahora se permite el bloque de 2 (broma / CTA+link)
                    # y también el de 1. Lo que NO vale es un bloque de 3+.
                    chk(len(b) <= 2, 'Spam ninja máx 2 líneas (§4.4b)',
                        f'{len(b)} líneas en el bloque del spam ninja, máx 2' if len(b) > 2 else '')
                    # ⛔ LOS TRES DE ABAJO SALEN DE MEDIR LOS CLICS REALES (2026-08-10).
                    # El mapa es el pilar que mas convierte (mediana 84 clics, CTR
                    # 0,315%) y el meme el segundo (0,151%), pero el meme del 06/08
                    # saco 13 clics con 77.006 impresiones: 0,017%, el peor CTR del
                    # ano con alcance real. Los tres motivos, medidos:
                    #
                    # 1) DONDE CAE EL ENLACE. En los 6 memes con datos, los 4 que
                    #    ponen el enlace antes del caracter 511 dan 0,050-0,151%; los
                    #    2 que lo pasan de 650 dan 0,042% y 0,017%. Son justo los dos
                    #    cuerpos mas largos. El cuerpo largo gana interaccion y pierde
                    #    clics: para cuando llega el enlace, ya se han ido.
                    #    OJO: solo aplica donde el cuerpo es PROSA. En el mapa y en
                    #    los 10 la lista de empresas empuja el enlace mucho mas alla
                    #    del 650 y aun asi convierten (el mapa de Asier del 14/07 lo
                    #    pone en el 1.400 y saca 0,415%): alli la lista ES el contenido
                    #    y el lector la baja entera. En prosa, no.
                    _pos = cuerpo.find(_dom) if pilar in ('meme', 'historia', 'entregable') else 0
                    chk(_pos <= 650, 'Spam ninja: el enlace cae antes del caracter 650 (§4.4b)',
                        'el enlace cae en el %d. Los 2 unicos posts que lo pasaron de 650 '
                        'son los 2 peores CTR del ano (0,042%% y 0,017%%) frente al '
                        '0,050-0,151%% de los que lo ponen antes del 511' % _pos
                        if _pos > 650 else '')
                    # 2) EL ENLACE VA EN LA SEGUNDA LINEA Y ESA LINEA ES CORTA. El
                    #    bloque de dos (dolor / promesa corta + enlace) da 0,415% en el
                    #    mapa de Asier del 14/07. Fusionarlo todo en UNA linea larga da
                    #    0,172% (Unai 07/07). Iker, 2026-08-10: "que el enlace siempre
                    #    este en la segunda linea, que esa linea sea corta y punchy".
                    #    Se mide SIN la URL: el lector no lee la URL, lee la promesa.
                    _lin = [l for l in b if _dom in l][0]
                    _lin = re.sub(r'https?://\S+', '', _lin).strip()
                    chk(len(_lin) <= 80, 'Spam ninja: la linea del enlace es corta (§4.4b)',
                        '%d caracteres sin contar la URL. La del 0,415%% ocupa 69 y la '
                        'del 0,172%%, que fusiona dolor y promesa en una sola linea, '
                        'ocupa 101' % len(_lin) if len(_lin) > 80 else '')
                    # 3) QUE PROMETE. El dolor validado por los clientes en reunion es
                    #    ENCONTRAR AL CLIENTE IDEAL, empresa y persona. No el momento.
                    #    El ninja de 0,415% dice "te marcamos quien va a comprar y
                    #    cuando": identifica primero. El de 0,017% dice "de montar esa
                    #    lista nos encargamos nosotros": no identifica a nadie.
                    _blo = ' '.join(b).lower()
                    _iden = re.search(r'qui[eé]n|persona|empresa|nombre|decide|firma|compra', _blo)
                    chk(bool(_iden), 'Spam ninja: promete IDENTIFICAR, no solo el momento (§4.4b)',
                        'el bloque no nombra a quien vas a encontrar. El momento es el '
                        'dolor secundario: los clientes compran la identificacion de la '
                        'empresa y la persona' if not _iden else '')
                    break
            # post-workflow §4.4 Paso 5 — SI HAY SPAM NINJA, EL CIERRE NO ES OTRO CTA.
            # Aunque global §4.4b diga que el spam ninja no consume la regla del UNO,
            # en la practica compite: el que iba a clicar se va a comentar, y la
            # prioridad es el clic. El cierre es un bold statement, no otro CTA.
            m = re.search(r'\b(etiqueta|etiquetad|menciona|comenta|comparte)\w*\b', cuerpo, re.I)
            chk(not m, 'Con spam ninja, el cierre NO es otro CTA (§4.4 Paso 5)',
                f'"{m.group(0)}" apila un 2o CTA sobre el enlace. Cierra con bold statement'
                if m else '')

    # global §2.10 — EL CIERRE PUNCHY ES UNA SOLA LINEA. Dos oraciones largas al
    # final diluyen el remate: un cierre no admite explicacion detras.
    _ult = [l for l in cuerpo.splitlines() if l.strip()][-1] if cuerpo.strip() else ''
    _uo = [t for t in re.split(r'(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÑ¿¡])', _ult) if len(t.strip()) > 3]
    chk(len(_uo) <= 1 or len(_ult) <= 90, 'Cierre punchy de UNA linea (§2.10)',
        f'{len(_uo)} oraciones y {len(_ult)} car. en el cierre' if len(_uo) > 1 and len(_ult) > 90 else '')

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
    # ---------- GANCHO DEL PELOTEO (§4.2 Paso 1) ----------
    # Mecanizado el 2026-07-30 porque como criterio se me olvidaba.
    # SOLO mapa y objeto. "Los 10" NO usa el gancho de prejuicio regional: su
    # foco es LA PERSONA, el comercial invisible (§4.3). Aplicarselo tumbaba los
    # cuatro "Los 10" del historico, incluido el 4.83x.
    if pilar in ('mapa', 'objeto'):
        chk(bool(re.search(SUJETO_AJENO, hook_txt, re.I)),
            'GANCHO: el prejuicio lo dice OTRO, no nosotros (§4.2 Paso 1)',
            'el hook afirma el desprecio en seco y se lee como NUESTRO. Necesita un sujeto '
            'ajeno: "la ven como", "la llaman", "nadie habla de", "todos ven", "la conocen por", '
            '"la tienen jubilada", "la despachan como", "la dan por"')
        # ⭐ LA PALABRA "EXPORTA" ES INAMOVIBLE EN TODO PELOTEO REGIONAL
        # (Iker, 2026-07-31). Es lo que ancla el pilar a VENTAS de forma
        # indirecta: si alguien exporta es porque VENDE. Sin ella el post se
        # queda en peloteo bonito y lo podria subir cualquiera.
        # Dos fallos reales seguidos: el despiece de Euskadi del 30/07 la quito
        # y esta rindiendo peor, y el mapa de Asturias del 31/07 la cambio por
        # un shock de produccion. En los dos casos yo justifique el cambio y en
        # los dos me equivoque. NO se negocia por muy punchy que sea la
        # alternativa.
        chk(bool(re.search(r'\bexporta\b', hook_txt, re.I)),
            'GANCHO: lleva la palabra "exporta" (§4.2 Paso 1)',
            'es lo que ata el peloteo a VENTAS: si alguien exporta es porque vende. '
            'El remate va "Y exporta más que [PAÍS] entero" en el mapa y "Y exporta más '
            'que [PAÍS] entero" tambien en el despiece, antes del objeto. Sin esa palabra '
            'el post lo podria subir cualquier cuenta')
        # El DESPIECE mete el objeto entre medias — la plantilla de §4.7 es
        # "exporta mas [piezas de coche] que [PAIS] entero" — asi que exigir
        # "mas que" pegado tumbaba un gancho que seguia la receta al pie.
        chk(bool(re.search(r'm[aá]s (?:\w+ ){0,4}que .+\benter[oa]s?\b', hook_txt, re.I)),
            'GANCHO: lleva la COMPARACIÓN con un país concreto (§4.2 Paso 1)',
            'falta el "más que [PAÍS] entero". Un país CONCRETO y verificado, nunca '
            '"medio mundo" ni "países enteros" en vago: la comparacion es el dato que '
            'hace que se comparta')
        _pais = sorted(p for p in PAIS_QUEMADO if p in hook_txt.lower())
        chk(not _pais, 'GANCHO: el país de la comparación no está usado (§4.2 Paso 2)',
            ' · '.join(f'"{p}" fue {PAIS_QUEMADO[p]}' for p in _pais) +
            '. La comparacion es lo que se comparte, asi que repetir pais se nota mas '
            'que ninguna otra cosa. Busca otro con >=15% de margen y fuente oficial')
        _conc = sorted(c for c in CONCEPTO_QUEMADO if c in hook_txt.lower())
        chk(not _conc, 'GANCHO: el concepto no está usado (§4.2 Paso 1)',
            ' · '.join(f'"{c}" fue {CONCEPTO_QUEMADO[c]}' for c in _conc) +
            '. El concepto se inventa nuevo por region, derivado de su GEOGRAFIA')
        _rabia = sorted(f for f in FRASE_RABIA_USADA if f in hook_txt.lower())
        chk(not _rabia, 'GANCHO: la frase-rabia no está usada (§4.2 Paso 1)',
            ' · '.join(f'"{f}" fue {FRASE_RABIA_USADA[f]}' for f in _rabia) +
            '. El beat se mantiene siempre, las palabras cambian siempre')
        _quemados = sorted(v for v in VERBO_PREJUICIO_QUEMADO
                           if re.search(r'\b' + v + r'\b', texto, re.I))
        chk(not _quemados,
            'GANCHO: el verbo del prejuicio no está quemado (§4.2 Paso 1)',
            ' · '.join(f'"{v}" ya salió en {VERBO_PREJUICIO_QUEMADO[v]}' for v in _quemados) +
            '. El sujeto ajeno es obligatorio, el VERBO rota. Busca otro del mismo nivel: '
            '"la tienen jubilada", "la despachan como", "la dan por amortizada", '
            '"la entierran con", "nadie la cuenta como"')
        # AVISO y no fallo: el mejor mapa del historico (12.89x, "Nadie habla del
        # pueblo de 7.000 habitantes") NO la lleva. La receta la pide y suele
        # ayudar, pero la evidencia no soporta convertirla en obligatoria.
        chk(bool(re.search(FRASE_RABIA, hook_txt, re.I)),
            'GANCHO: lleva frase-rabia que despacha la región (§4.2 Paso 1)',
            'sin ese remate el local no siente el desprecio, no comenta y no hay motor. '
            'Familia: "y para de contar", "y poco mas", "y poco que rascar", '
            '"buena para [comer X] y para irse", "un [plato] antes de seguir carretera"', aviso=True)
        _cif = re.findall(r'\d[\d.,]*', hook_txt)
        # AVISO y no fallo, por lo mismo: el 12.89x lleva "7.000 habitantes" y el
        # 5.38x lleva "8,7 millones", y en los dos la cifra ES el concepto. Iker
        # prefiere el gancho sin cifra (2026-07-30), asi que avisa, pero no tumba.
        chk(len(_cif) == 0, 'GANCHO: sin cifras, van al cuerpo (§2.10)',
            f'{_cif} en el hook. Iker lo prefiere sin cifra: el gancho lo lee todo el mundo antes '
            'del "ver mas" y un numero ahi frena. Excepcion medida: si la cifra ES el concepto '
            '(el 12.89x con "pueblo de 7.000 habitantes"), se queda', aviso=True)

    # ---------- CTA DEL MAPA (§4.2 Paso 5) ----------
    # El jefe ya pago PamPam y la web de recursos embebe el mapa completo, asi
    # que el enlace va AHI: se lee como recurso y no como venta, y captura igual
    # porque esa pagina lleva su propio CTA a agendar. Mecanizado el 2026-07-31
    # tras entregarlo mal aun teniendolo escrito desde el 23/07.
    _spam = sorted(f for f in SPAM_QUEMADO if f in texto.lower())
    chk(not _spam, 'SPAM NINJA: la frase no está quemada (§4.4b)',
        ' · '.join(f'"{f}" ya salió en {SPAM_QUEMADO[f]}' for f in _spam) +
        '. El dolor es el mismo siempre (dar con el cliente ideal, empresa Y persona) pero la '
        'forma rota en cada post. Lo mejor es colgarlo de la broma del gancho: si el post va de '
        'un tatuaje, "Tatuarse es lo facil. Lo caro es saber de quien tiene que ser el logo"')

    # ---------- PILAR EVENTO (Iker, 2026-08-05) ----------
    # El evento se vende DENTRO de formatos que ya funcionan; este pilar es para
    # el post de anuncio puro. Motor validado: la SALA, no el programa
    # (Grace Gong 11.6x y 14.4x en el corpus de competencia).
    if pilar == 'evento':
        # Aviso fijo, no es un check: siempre sale y siempre hay que pegarlo en la
        # entrega. Iker subio el post del evento el 05/08 y hubo que BORRARLO
        # porque el jefe pidio el visto bueno previo de los mencionados.
        # El porque: en un mapa mencionas empresas frias y es informacion publica;
        # en un evento la mencion ASOCIA a esa persona con el acto, y eso necesita
        # su permiso.
        chk(False, '⚠️ EVENTO: NO PUBLICAR SIN EL OK DE LOS MENCIONADOS',
            'antes de subir, que los mencionados (partners, clientes, sede) den el '
            'visto bueno. Una mencion en un post de evento les asocia al acto, y eso '
            'no es informacion publica como en un mapa. El 05/08 hubo que borrar un '
            'post ya publicado por saltarse esto', aviso=True)
        chk('luma.com/ujffj66o' in texto,
            'EVENTO: lleva el enlace de inscripción (§4.4b)',
            'falta https://luma.com/ujffj66o. Un post de evento sin el enlace no sirve de nada')
        _agenda = re.search(r'\b(agenda|programa|ponencias?|horario|charlas?)\b.{0,40}\b(ser[aá]|habr[aá]|incluye)',
                            texto, re.I)
        chk(not _agenda, 'EVENTO: vende la SALA, no el programa (§4.4b)',
            'el motor validado es QUIEN esta dentro y por que se ha elegido a mano, '
            'no la agenda ni los ponentes. Grace Gong hizo 11.6x y 14.4x contando la sala')

    if pilar == 'mapa':
        chk('recursos.neety.com/mapas/' in texto,
            'MAPA: el CTA enlaza a /mapas/{region}/ (§4.2 Paso 5)',
            'el mapa NO enlaza a /agendar/. Va "Mapa completo aquí: '
            'https://recursos.neety.com/mapas/{region}/", con la region en minuscula y sin '
            'tildes. El enlace a agendar se olia a venta; el del mapa se lee como recurso')
        chk('recursos.neety.com/agendar' not in texto,
            'MAPA: sin enlace a /agendar/ (§4.2 Paso 5)',
            'queda el CTA viejo a agendar. Se sustituye por el enlace a la pagina del mapa')

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
    # ---------- GARANTIA DE VIRALIDAD · LEAD MAGNET (Iker, 2026-08-05) ----------
    # Estos tres checks NO son de forma: comprueban que el post repite lo que
    # YA nos ha funcionado a NOSOTROS. La evidencia esta en nuestras cuentas:
    #   · 5 lead magnets con Claude, los 5 con +100 comentarios (632/285/232/183/167)
    #   · mediana con IA 167 comentarios, sin IA 20
    #   · los 5 mejores son EXPERIMENTOS en primera persona, no paquetes
    #   · mediana de comentarios: mayo 208 -> junio 18, justo cuando dejamos de
    #     contar experimentos y empezamos a repartir "biblias" y "arsenales"
    if pilar == 'leadmagnet':
        _hook_l = hook_txt.lower()
        chk('claude' in _hook_l,
            'GARANTIA: Claude nombrado en el GANCHO (§4.5.0a)',
            'los 5 lead magnets nuestros con Claude pasaron de 100 comentarios; los que no '
            'lo llevan se quedan en 20 de mediana. Va en la PRIMERA linea, no solo en el cuerpo')
        # ⭐ 2026-08-05, Iker: yo tenia esto como DOS moldes rivales y basta-con-uno.
        # Es falso. Los 5 lead magnets nuestros de Claude, por comentarios:
        #   632c  🚨 ÚLTIMA HORA: Claude ACABA DE MATAR el cold outbound       <- los dos
        #   285c  LE PASE las llaves de mi LinkedIn a Claude…
        #   232c  LE TIRE las llaves de mi LinkedIn a Claude…
        #   183c  CLAUDE ME HA AYUDADO a cazar miles de leads…
        #   167c  🚨 ÚLTIMA HORA: Claude HA REDUCIDO toda mi prospeccion…      <- los dos
        # El #1 y el #5 llevan DISPARADOR *y* Claude+verbo. Y el disparador no es
        # "el molde de ellos": es el nuestro tambien, y ademas coincide con lo que
        # usan Martin Arosa y Guillermo Flor. Eso es DOBLE validacion (dentro y
        # fuera), asi que llevar los dos no es redundante, es la maxima garantia
        # que sabemos comprar. Uno solo pasa; los dos se aplauden.
        # ⛔ 2026-08-05, Iker: se me colo "te saca su nombre y su perfil SIN PAGAR
        # una herramienta" cuando a esa persona la encontramos con Sales Navigator
        # (de pago) y Unipile (49 €/mes minimo, 7 dias de prueba y ya). Es la misma
        # familia de mentira que inventarse una empresa, y encima la desmonta
        # cualquiera que lo intente. NUESTRO STACK REAL: Claude + LinkedIn Premium
        # + Sales Navigator + Unipile. Todo menos Claude a secas se paga.
        _gratis = re.search(r'sin pagar|sin gastar|gratis y sin|sin (?:ninguna |ninguna otra )?herramienta'
                            r'|no (?:hace falta|necesitas) (?:pagar|ninguna herramienta|herramientas)'
                            r'|sin suscri|sin licencia|cero herramientas', cuerpo, re.I)
        chk(not _gratis,
            'Ninguna promesa de "sin pagar/sin herramientas" (§4.5.0a)',
            (f'dice "{_gratis.group(0)}" y a la persona la sacamos con Sales Navigator + Unipile, '
             'que se pagan los dos. Di lo que el prompt SI hace ("te da el filtro exacto"), '
             'no lo que te ahorra. Regla general: toda promesa del cuerpo se verifica contra '
             'el stack que usamos DE VERDAD, igual que se verifica una cifra') if _gratis else '')
        _disp = re.search(r'ÚLTIMA HORA|ULTIMA HORA|D\.?E\.?P\.?|BREAKING|ADIÓS|ADIOS', hook_txt, re.I)
        _exp = re.search(MOLDE_EXPERIMENTO, hook_txt, re.I)
        chk(bool(_disp) or bool(_exp),
            'GARANTIA: el gancho usa uno de los DOS moldes validados (§4.5.0a)',
            'ni DISPARADOR ("🚨 ÚLTIMA HORA…", nuestro #1 y nuestro #5) ni Claude+VERBO '
            '("Claude acaba de matar…", "Le tiré las llaves a Claude…"). '
            'LO IDEAL ES LLEVAR LOS DOS: es la estructura exacta del de 632 comentarios')
        chk(bool(_disp) and bool(_exp),
            'GARANTIA MAXIMA: el gancho combina DISPARADOR + Claude+VERBO (§4.5.0a)',
            'llevas solo uno de los dos. El de 632 comentarios (y el de 167) llevan los dos '
            'en la misma linea: "🚨 ÚLTIMA HORA: Claude acaba de matar el cold outbound". '
            'Doble validacion: nuestro historial Y el de Martín Arosa/Guillermo Flor',
            aviso=True)
        _yo = len(re.findall(r'\b(yo|mi|mis|me|uso|hago|publico|llevo|prob[eé]|le (?:di|pas[eé]|tir[eé]))\b',
                             cuerpo, re.I))
        chk(_yo >= 4, 'GARANTIA: es un EXPERIMENTO en primera persona, no un paquete (§4.5.0a)',
            f'solo {_yo} marcas de primera persona. Nuestros 5 mejores son "YO hice X, me paso Y, '
            'te doy lo que use" (632/483/285/232/183 comentarios). Los paquetes ("la biblia", '
            '"el arsenal", "la lista definitiva") se hundieron a 18 de mediana en junio')

    if pilar == 'leadmagnet':
        # El gancho abre SIEMPRE con el disparador de última hora + emoji de alarma
        # (post-workflow §4.5.0). Es la estructura de nuestros 2 mejores (9.96x y
        # 2.72x) y la que usan SIN FALTA Guillermo Flor y Martín Arosa. Como
        # "exporta" en los mapas: obligatorio, no decorativo (Iker, 2026-07-23). La
        # lista de Unai (22/07) arrancó fría por saltárselo.
        # ⭐ CORREGIDO EL 2026-08-05: esto exigia que el hook EMPEZARA por alarma,
        # y era verdad mientras la referencia fueran Martin Arosa y Guillermo Flor.
        # Al mirar NUESTROS datos resulta que 4 de nuestros 5 mejores NO abren con
        # alarma, abren con un experimento en primera persona. Los dos moldes valen,
        # y el de experimento tiene mas respaldo interno.
        h = hook_txt.strip()
        _experimento = bool(re.search(MOLDE_EXPERIMENTO, h, re.I))
        alarma = h.startswith('🚨') or h.startswith('⚰') or h.startswith('⚰️') or _experimento
        chk(alarma, 'Hook: alarma 🚨/⚰️ o EXPERIMENTO en 1a persona (§4.5.0)',
            'los 2 mejores lead magnets abren con "🚨 ÚLTIMA HORA:" / "⚰️ D.E.P."; '
            'sin el disparador el post arranca frío' if not alarma else '')
        if generico:
            # La vara de medir de este pilar es Martín Arosa y Guillermo Flor (los
            # que MÁS comentarios sacan del sector), NO nuestro historial de flops
            # —que no vale, salvo el 9.85x de Unai, que además usó ESTE formato—.
            # Su cuerpo SIEMPRE lleva una LISTA NUMERADA de lo que hay dentro del
            # recurso, y es LARGO (setup + malo/bueno + lista + ancla de valor). El
            # nuestro se quedaba corto (`§4.5.0b`).
            _numerados = re.findall(r'^\s*\d+[.)]\s', cuerpo, re.M)
            chk(len(_numerados) >= 3, 'GENÉRICO: lista numerada de lo que hay dentro (§4.5.0b)',
                f'{len(_numerados)} ítems numerados — ellos enumeran los componentes del recurso, mínimo 3'
                if len(_numerados) < 3 else '')
            chk(len(cuerpo) >= 320, 'GENÉRICO: cuerpo LARGO como el suyo (§4.5.0b)',
                f'{len(cuerpo)} car — el suyo es largo (setup + malo/bueno + lista + ancla de valor); no te quedes corto'
                if len(cuerpo) < 320 else '')
        chk(not tiene_link, 'Lead magnet SIN spam ninja (§4.4b, única excepción)',
            'el link apila un 2º CTA y hunde los comentarios' if tiene_link else '')
        # ⛔⛔ EL CTA DEL LEAD MAGNET CAMBIO EL 2026-08-10 (ver §4.5.0-CTA).
        #
        # Aqui vivian ocho checks alrededor de `Comenta "palabra"`: que estuviera
        # explicito, entre comillas, en minusculas, sin tildes, con 2o dato, sin
        # repetir, sin gastar y reconectando con el gancho. TODOS EN SUSPENSO.
        #
        # LinkedIn dejo de repartir ese mecanismo entre el 4 y el 5 de agosto de
        # 2026. Medido en la cuenta de Martin Arosa: del 13/07 al 31/07 usa el
        # gate en todos sus lead magnets y saca entre 527 y 1.398 comentarios; el
        # 03/08 saca 7 y el 04/08 saca 41, los dos con gate; y desde el 05/08 no
        # lo vuelve a usar ni una vez y recupera 543, 402, 483 y 145. A nosotros
        # nos costo CUATRO publicaciones capadas antes de verlo.
        #
        # No se borra de la historia porque el mecanismo puede volver. Hoy el CTA
        # es el suyo: pregunta directa + regalarlo + conectar.
        _gate = re.search(r'coment[a\u00e1]\w*\s+["\u201c\u00ab\']', cuerpo, re.I)
        chk(not _gate, 'CTA: SIN "Comenta la palabra X", el mecanismo esta capado (§4.5.0-CTA)',
            'LinkedIn dejo de repartirlo el 05/08/2026: a Martin Arosa lo hundio de 1.254 a 7 '
            'comentarios y a nosotros nos costo 4 posts. Usa la pregunta' if _gate else '')
        _preg = re.search(r'\u00bf[^?]{5,90}\?', cuerpo)
        chk(bool(_preg), 'CTA: una PREGUNTA directa ofreciendo el recurso (§4.5.0-CTA)',
            'el CTA nuevo abre con una pregunta tipo "\u00bfQuieres los 5 mensajes?". La gente '
            'comenta igual, pero el comentario sale de ellos y cada uno escribe algo distinto, '
            'que ademas es lo que evita que parezcan comentarios coordinados' if not _preg else '')
        _regalo = re.search(r'gratuit|gratis|acceso libre|sin coste', cuerpo, re.I)
        chk(bool(_regalo), 'CTA: se dice que se comparte GRATIS (§4.5.0-CTA)',
            'sus tres ultimos lo dicen dos veces, "de forma gratuita" y "acceso libre". '
            'La palabra gratis no penaliza: medida en 15 posts nuestros, mediana 3.884 '
            'impresiones y ninguno por debajo de 500' if not _regalo else '')
        _conecta = re.search(r'conecta conmigo', cuerpo, re.I)
        chk(bool(_conecta), 'CTA: cierra con "(Conecta conmigo para que pueda escribirte)" (§4.5.0-CTA)',
            'entre parentesis y al final. Sin el gate ya no compite con ningun otro CTA, y hace '
            'falta para poder mandarle el recurso por privado' if not _conecta else '')

        _pref = re.search(r'\b(instalar|instalaci[oó]n|descargar|descarga)\b', cuerpo, re.I)
        chk(not _pref, 'Sin "instalar"/"descargar" (preferencia de marca de Iker)',
            (f'dice "{_pref.group(0)}". No hay dato de que penalicen (3 y 1 post en todo el '
             'corpus), pero Iker las tiene vetadas y suelen sobrar: "No hay nada que montar" '
             'dice lo mismo. Ojo, "gratis" SI vale: 3.884 de mediana y esta en el gancho '
             'del de 483 comentarios') if _pref else '', aviso=True)

    # ---------- AUDITORIA 2026-07-20 · POR PILAR ----------
    _flechas = [l for l in cuerpo.splitlines() if re.match(r'^\s*→\s', l)]

    # ---------- DESPIECE / OBJETO (4.7) ----------
    if pilar == 'objeto':
        _piezas = [l for l in _flechas if ':' in l and re.search(r' - | – | — ', l.split(':', 1)[1])]
        chk(len(_piezas) == len(_flechas) and len(_flechas) > 0,
            'OBJETO: cada ficha lleva la pieza delante y los dos puntos (4.7)',
            f'{len(_flechas) - len(_piezas)} de {len(_flechas)} sin ese formato. Es la firma '
            'del pilar y lo que lo distingue del mapa en el clasificador')
        # ⛔ SON 12 EXACTAS, no "10 minimo" (Iker, 2026-08-07). No es una
        # preferencia de texto: la PLANTILLA de la llanta tiene 12 huecos, asi
        # que 11 deja un hueco vacio y 13 no cabe. El texto y la imagen son la
        # misma pieza y el numero lo manda la imagen. Vale para el despiece de
        # cualquier objeto y cualquier sector, no solo la llanta de automocion.
        chk(len(_piezas) == 12,
            'OBJETO: EXACTAMENTE 12 piezas, las que tiene la plantilla (4.7)',
            f'{len(_piezas)}. Por debajo de 10 no se publica: se cambia de region, no se rellena'
            if len(_piezas) < 10 else f'{len(_piezas)} (apunta siempre a 20)')
        # Bloques de 4, y el ultimo puede bajar a 2 o 3. Nunca uno de 1, y nunca
        # un 5 pegado a un 2: eso es lo que se lee como descuadre.
        _bl, _act = [], 0
        for _l in cuerpo.splitlines():
            if _l.strip().startswith('→'):
                _act += 1
            elif _act:
                _bl.append(_act)
                _act = 0
        if _act:
            _bl.append(_act)
        _ok_bl = bool(_bl) and all(b == 4 for b in _bl[:-1]) and _bl[-1] in (2, 3, 4)
        chk(_ok_bl, 'OBJETO: bloques de 4 y el ultimo de 2, 3 o 4 (4.7)',
            f'bloques de {_bl}. Todos de 4 salvo el ultimo, que puede bajar a 2 o 3')
        # ⛔ CHECK RETIRADO EL 2026-08-07 · CONTRADECIA A §4.2 PASO 1.
        # Aqui se exigia que el despiece NO llevara la comparacion con otro pais
        # ("es la firma del mapa"), mientras que §4.2 Paso 1 la EXIGE. Los dos
        # checks corrian a la vez, asi que ningun despiece podia pasar el
        # validador: si metias el pais fallaba este y si lo quitabas fallaba el
        # otro. Manda §4.2, porque su texto es una CORRECCION posterior del
        # 31/07 que dice literalmente que la version de aqui estaba mal: lo que
        # diferencia al despiece del mapa no es quitar `exporta`, es el objeto,
        # el despiece por piezas y la imagen de la llanta.
        chk(True, 'OBJETO: la comparacion con otro pais SI va (§4.2 Paso 1)',
            'esa es la firma del MAPA. Aqui el remate del gancho es el OBJETO')

    if pilar in ('mapa', 'los10') and _flechas:
        # §4.2/§4.3 — la frase de entrada va SOLA. Pegada a la lista, el bloque
        # se lee como un muro.
        _lineas = cuerpo.splitlines()
        _i = next(i for i, l in enumerate(_lineas) if re.match(r'^\s*→\s', l))
        chk(_i > 0 and not _lineas[_i - 1].strip(),
            'Linea en blanco antes de la primera → (§4.2 Paso 4)',
            'pegada a la entrada, la lista se lee como un muro' if _i > 0 and _lineas[_i-1].strip() else '')

        # §4.0c — ni una entidad repetida de posts anteriores. El cruce cuenta
        # las TRES cuentas y los DOS formatos: en Cataluña habia 83 ya usadas
        # entre el mapa de Iker y el "Los 10" de Unai. El objetivo es traer
        # clientes NUEVOS, no repetir a los de siempre.
        _mm = leer_menciones_usadas()
        if _mm:
            _rep = []
            for l in _flechas:
                for e in l.replace('→', '').split('·')[0].split(' - '):
                    e = e.strip()
                    if len(e) < 3:
                        continue
                    k = normalizar_entidad(e)
                    if k in _mm.get('entidades', {}):
                        _rep.append(f"{e} ({', '.join(_mm['entidades'][k]['posts'][:2])})")
            chk(not _rep, 'Ninguna empresa ni persona repetida (§4.0c)',
                f"{len(_rep)} repetida(s): {'; '.join(_rep[:3])}" if _rep else
                f"cruzado contra {_mm.get('total', 0)} ya mencionadas")

    if pilar == 'mapa':
        # §4.2 Paso 4 — el objetivo son 20. Si la region no da, se baja, pero el
        # SUELO son 10 (Iker, 2026-07-29): por debajo de 10 el post no se hace,
        # y nunca se rellena con inventadas para llegar a una cifra bonita.
        _n = len(_flechas)
        chk(_n >= 10, 'Mapa con 10 menciones como MÍNIMO (§4.0c)',
            f'{_n}. Por debajo de 10 la publicacion NO se hace. Nunca rellenes con inventadas'
            if _n < 10 else (f'{_n} (el objetivo son 20; con menos vale, pero apunta siempre a 20)'))
        # §4.0b — en el mapa la ficha NO lleva logro. Ese es el formato de "Los 10".
        _con_logro = [l for l in _flechas if '·' in l]
        chk(not _con_logro, 'Mapa sin logro en la ficha (§4.0b)',
            f'{len(_con_logro)} llevan "·": eso es formato de "Los 10"' if _con_logro else '')

    if pilar == 'los10':
        chk(len(_flechas) == 10, '"Los 10" con exactamente 10 fichas (§4.3 Paso 2)',
            f'{len(_flechas)}' if len(_flechas) != 10 else '')
        _sin_logro = [l for l in _flechas if '·' not in l]
        chk(not _sin_logro, 'Cada ficha lleva su logro tras "·" (§4.3 Paso 2)',
            f'{len(_sin_logro)} sin logro' if _sin_logro else '')
        # §4.3 Paso 3b — el unico numero del pilar es el logro. El 4.81x del Pais
        # Vasco no llevaba NI UNA cifra regional: descentra el post de las
        # personas y canibaliza el mapa.
        _fuera = [l for l in cuerpo.splitlines()
                  if l.strip() and not re.match(r'^\s*→\s', l) and re.search(r'\d', l)
                  and 'recursos.neety.com' not in l]
        chk(not _fuera, 'Sin cifras regionales fuera de las fichas (§4.3 Paso 3b)',
            f'{len(_fuera)}: "{_fuera[0][:52]}"' if _fuera else '')
        # §4.3 Paso 3e — el beat de equipo va en el SETUP, antes de la lista.
        # Despues solo corrige la objecion; antes, la evita.
        _mb = re.search(BEAT_EQUIPO, cuerpo, re.I)
        if _mb and _flechas:
            _pos_beat = cuerpo.index(_mb.group(0))
            _pos_lista = cuerpo.index(_flechas[0])
            chk(_pos_beat < _pos_lista, 'El beat de equipo va ANTES de la lista (§4.3 Paso 3e)',
                'despues de la lista solo corrige la objecion; antes la evita' if _pos_beat > _pos_lista else '')

    if pilar == 'leadmagnet':
        # ⚠️ RECORDATORIO DE ENTREGA (Iker, 2026-08-06). La receta dice desde
        # hace semanas que este pilar entrega TRES piezas y yo entregue dos: me
        # deje la imagen, y encima con un dato claro sobre cual va (§4.5.-1: se
        # ensena el ARTEFACTO, no la cara, como el 12.3x de Guillermo Flor).
        # El validador solo puede mirar el texto, asi que esto no es un check:
        # es un recordatorio que se imprime siempre para que no se me pase.
        chk(False, 'ENTREGA: ¿las CUATRO piezas? texto + imagen del POST + imagen OG + prompt',
            'son CUATRO, no tres (Iker, 2026-08-06): (1) el texto · (2) la imagen del post '
            'de LinkedIn, 1:1 · (3) la imagen de COMPARTIR del recurso web, 1200x630, que la '
            'mete el programador y sin ella el enlace llega como caja gris (images §0b-OG) · '
            '(4) el prompt del programador. Y CADA brief de imagen va CON EL ENLACE a la '
            'referencia real que calca (images §0b-REF): sin enlace me la estoy inventando. '
            'Los 4 formatos validados y sus enlaces, en images §0b-REF-bis', aviso=True)
        m = re.search(ENTREGABLE_GENERICO, cuerpo, re.I)
        chk(not m, 'Entregable UNO y concreto, no generico (§4.5 Paso 2)',
            f'"{m.group(0)}" — la biblia hizo 1.2x · 2.3K' if m else '')
        m = re.search(CTA_IMPLICITA, cuerpo, re.I)
        chk(not m, 'CTA explicita, nunca implicita (§4.5 puerta 4)',
            f'"{m.group(0)}" hundio comentarios en dos A/B' if m else '')
        # §4.5.0 — el sujeto es el TRABAJO del lector, nunca el modelo. 40x.
        if re.search(r'(ÚLTIMA HORA|ULTIMA HORA|URGENTE|Acaba de pasar)', hook_txt, re.I):
            m = re.search(SUJETO_ES_MODELO, hook_txt, re.I)
            chk(not m, 'El sujeto es el TRABAJO del lector, no el modelo (§4.5.0)',
                f'"{m.group(0)}" — sujeto=trabajo 9.96x vs sujeto=modelo 0.70x. 40x' if m else '')
        # §4.5 Paso 5 — la palabra del CTA remata la gracia del hook.
        m2 = re.search(r'comenta\s+"([^"]+)"', cuerpo, re.I)
        if m2:
            _raiz = normalizar_entidad(m2.group(1))[:5]
            # En el GENÉRICO la palabra no tiene por qué estar en el hook: la de
            # Martín Arosa es "agente" (el tema del recurso) y su hook es "⚰️ D.E.P.
            # prospección manual" — no reconectan literal (§4.5.0b).
            if not generico:
                chk(bool(_raiz) and _raiz in normalizar_entidad(hook_txt),
                    'La palabra del CTA reconecta con el hook (§4.5 Paso 5)',
                    f'"{m2.group(1)}" no aparece en el hook' if _raiz not in normalizar_entidad(hook_txt) else '')

    if pilar == 'historia':
        # Pilar HISTORIA PERSONAL / ANÉCDOTA (§4.6). Vara: Josh Braun (39x, 29x),
        # Daniel Disney (16 outliers). NO es autoridad ("mira qué importante soy"):
        # es una anécdota REAL en primera persona, frases cortas, mucho aire, y
        # remate con una LECCIÓN corta. En la BD se eligen por likes >> comentarios
        # (si comentarios > likes es un lead magnet disfrazado, no una historia).
        h = hook_txt.strip()
        chk(not (h.startswith('🚨') or h.startswith('⚰')),
            'HISTORIA: el hook NO abre con alarma 🚨/⚰️ (§4.6)',
            'eso es lead magnet; una historia abre con una ESCENA personal, no gritando')
        _personal = re.search(r'(^|\s)(yo|mi|mis|me|nunca|cuando|hace \w+|aquel\w*|la primera vez|acab[eé]|sub[ií]|di mi|ten[ií]a|hab[ií]a|recuerdo|empec[eé]|\bi\b|\bmy\b)(\s|,|\.)', ' '+h.lower())
        chk(bool(_personal), 'HISTORIA: hook personal, en primera persona (§4.6)',
            'la vara abre "I [algo que me pasó]" / "Cuando…" / "Nunca…": una escena TUYA, no un claim ni un dato')
        _ls = [l for l in cuerpo.splitlines() if l.strip()]
        _media = sum(len(l) for l in _ls)/max(len(_ls), 1)
        chk(len(_ls) >= 8 and _media <= 78,
            'HISTORIA: ritmo de historia (frases cortas, mucho aire) (§4.6)',
            f'{len(_ls)} líneas, media {int(_media)} car — va en líneas cortas de una frase, no en párrafos densos')
        chk(bool(_ls) and len(_ls[-1]) <= 78,
            'HISTORIA: cierra con una LECCIÓN corta y punchy (§4.6)',
            (f'la última línea {len(_ls[-1])} car' if _ls else 'sin cuerpo') + ' — la moraleja es corta ("Moments do", "El método sirve para cualquiera")')
        chk(not re.search(r'comenta\s+"', cuerpo, re.I),
            'HISTORIA: sin comment-gate — no pide comentar una palabra (§4.6)',
            'pedir "comenta X" la convierte en lead magnet; la historia cierra en la lección o lleva un CTA suave')

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

    # ------------------------------------------------------------------
    # MEME + UNAI: bloqueo duro (Iker, 2026-07-29)
    # Unai es el FUNDADOR y CEO: firma la casa. Un meme controversial en su
    # cuenta ya nos costó que un directivo nos insultara CON SU NOMBRE REAL
    # creyéndose que el tatuaje era de verdad. La doctrina ya lo decía
    # (post-workflow §4.4, brand-voice §1b) y aun así se publicó, así que
    # deja de ser doctrina y pasa a ser un check que hay que desactivar a mano.
    # ------------------------------------------------------------------
    # MEME: creditos al autor de la referencia (Iker, 2026-07-29)
    # El meme del tatuaje se viralizo Y el autor original lo vio: bloqueo la
    # cuenta de Unai. Bloquear es el aviso barato; el caro es un reporte por
    # copia. Mismo blindaje que se le puso al dato regional de los mapas
    # despues del "Andalucia es mas grande que Italia".
    # El credito se comprueba en el meme siempre, y en cualquier otro pilar
    # si se declara que es un remix (--remix). Remixar es universal.
    if pilar == 'meme' or remix:
        cred = re.search(
            r'(se lo (?:vi|rob[eé])|idea (?:original )?de|el original es de|visto en|gracias a|'
            r'v[ií] esto en|me lo (?:encontr[eé]|top[eé]) en|cr[eé]dito)\s*@?',
            cuerpo, re.I)
        lineas_ne = [l for l in cuerpo.splitlines() if l.strip()]
        pos = None
        if cred:
            linea_cred = cuerpo[:cred.start()].count('\n')
            todas = cuerpo.splitlines()
            texto_cred = todas[linea_cred] if linea_cred < len(todas) else ''
            pos = next((i for i, l in enumerate(lineas_ne) if l == texto_cred), None)
        chk(bool(cred) or ref_fuera,
            'MEME: da CRÉDITO al autor de la referencia (§4.4-CREDITO)',
            'si la referencia es ESPAÑOLA y de VENTAS, el autor te va a ver. Mencionalo con @ '
            'en una linea suelta del cuerpo. Si la referencia es de fuera o de otro sector, '
            'pasa --referencia-fuera.' if not cred else 'linea de credito presente')
        if cred and pos is not None and lineas_ne:
            ok_pos = 2 <= pos <= len(lineas_ne) - 2
            chk(ok_pos,
                'MEME: el crédito NO va ni al principio ni de cierre (§4.4-CREDITO)',
                f'esta en la linea {pos + 1} de {len(lineas_ne)}. No puede ir en el gancho ni justo '
                'despues (mata el chiste antes de contarlo) ni en la ultima linea (se come el '
                'bold statement). Va en medio, despues de que el chiste haya aterrizado.')

    if pilar == 'meme' and (cuenta or '').strip().lower() == 'unai':
        chk(meme_sobrio,
            'MEME en Unai: confirmado que NO es controversial (§4.4)',
            'Unai es el CEO y firma la casa. Un meme controversial ahi NO se publica: '
            'va a Iker, y si Iker ya tiene meme esa semana, a Asier. Si de verdad es '
            'sobrio, pasa --meme-sobrio y quedara constancia de que lo decidiste.')

    return r

def _autochequeo():
    """El validador se valida a si mismo antes de validar nada.

    2026-08-06: 12 regex del fichero tenian un 0x08 (BACKSPACE) donde debia ir
    un \\b. Un regex que empieza por 0x08 exige un byte que no aparece nunca en
    un post, asi que NO CASA JAMAS y el check sale OK sin comprobar nada. Habia
    checks muertos desde hacia semanas: AI_TELLS, "Neety NUNCA en el hook",
    ENTREGABLE_GENERICO, el de menciones y el de la agenda del evento.

    CAUSA: parchear este fichero escribiendo Python por heredoc de shell. El
    '\\\\b' del parche llega a Python como '\\b' y Python lo escribe como el
    caracter de control. Por eso los parches van con la herramienta de edicion,
    nunca por heredoc. Un fallo silencioso en el validador es peor que no tener
    validador: da un 45/45 falso y encima te deja tranquilo.
    """
    import inspect
    src = inspect.getsource(inspect.getmodule(_autochequeo))
    malos = sorted({hex(ord(c)) for c in src if ord(c) < 9 or ord(c) == 11 or ord(c) == 12})
    if malos:
        print(f'\n  ⛔ VALIDADOR CORRUPTO: caracteres de control {malos} en el propio script.')
        print('     Son \\b de regex que se convirtieron en bytes literales.')
        print('     Los checks que los usan NO CASAN NUNCA y salen OK en falso.')
        print('     Arregla el script antes de fiarte de ningun resultado.\n')
        sys.exit(2)


def main():
    _autochequeo()
    ap = argparse.ArgumentParser()
    ap.add_argument('fichero')
    ap.add_argument('--pilar', required=True,
                    choices=['mapa', 'los10', 'objeto', 'meme', 'leadmagnet', 'historia', 'entregable', 'evento'])
    ap.add_argument('--cuenta', default=None)
    ap.add_argument('--meme-sobrio', action='store_true', dest='meme_sobrio',
                    help='Confirma que un meme para la cuenta de UNAI no es controversial. '
                         'Es controversial si CUALQUIERA de estas es que si: el chiste depende de '
                         'que alguien se crea que paso de verdad; hay un acto ridiculo o humillante '
                         'atribuido al que publica; alguien podria insultarnos por creerselo; hay '
                         'tacos, escatologia, sexo, politica o religion; se rie de un colectivo.')
    ap.add_argument('--referencia-fuera', action='store_true', dest='ref_fuera',
                    help='La referencia del meme NO es española ni del sector de ventas, asi que su '
                         'autor no comparte audiencia con nosotros y no hace falta acreditarlo en el '
                         'cuerpo. Si es española Y de ventas, NO pases este flag: acredita.')
    ap.add_argument('--remix', action='store_true',
                    help='Este post calca una referencia ajena aunque NO sea un meme (lead magnet, '
                         'mapa, historia...). Activa el check de credito al autor, que si no solo '
                         'corre en --pilar meme. Remixar es universal (global §2.2b).')
    ap.add_argument('--generico', action='store_true',
                    help='Lead magnet modelo GENÉRICO (Martín Arosa/Guillermo): una palabra igual para '
                         'todos + recurso genérico + landing que captura. Salta el check del 2º dato.')
    a = ap.parse_args()
    texto = io.open(a.fichero, encoding='utf-8').read()
    res = validar(texto, a.pilar, a.cuenta, a.generico, a.meme_sobrio, a.ref_fuera, a.remix)
    # Los avisos se imprimen pero NO cuentan: son sospechas, no infracciones.
    # Mezclarlos vaciaría de significado el marcador, y el marcador es lo único
    # que se pega en la entrega.
    duras = [x for x in res if not x[3]]
    ok = sum(1 for x in duras if x[0])
    print(f"\n  VALIDADOR — pilar={a.pilar}" + (f" cuenta={a.cuenta}" if a.cuenta else "") + "\n")
    for bien, nombre, det, es_aviso in res:
        etiqueta = ('OK  ' if bien else 'AVISO') if es_aviso else ('OK  ' if bien else 'FALLA')
        print(f"  {etiqueta} {nombre}")
        if det:
            print(f"        └─ {det}")
    avisos = [x for x in res if x[3] and not x[0]]
    print(f"\n  {ok}/{len(duras)} checks" + (f" · {len(avisos)} aviso(s) que NO cuentan" if avisos else "") + "\n")
    if avisos:
        print("  Los avisos no bloquean, pero míralos: son cosas que han funcionado")
        print("  alguna vez y aun así están fuera de donde vive lo que gana.\n")
    sys.exit(0 if ok == len(duras) else 1)

if __name__ == '__main__':
    main()
