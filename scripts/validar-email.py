#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
validar-email.py — el pase de validación MECÁNICO de un email de la newsletter de Neety.

Mismo espíritu que validar-post.py: las reglas viven en docs/skills/email-marketing.md,
pero estar escritas no basta. Esto hace determinista lo mecanizable.

Lo que NO hace: no juzga si el asunto abre un gap real, si la historia es buena o
si el caso es verdadero. Eso es criterio y vive en email-marketing §9.

Formato esperado del fichero:
    REMITENTE: Iker|Asier|Unai|Kaixito
    ASUNTO: ...
    PREVIEW: ...
    <línea en blanco>
    (cuerpo)

Uso:
    python scripts/validar-email.py <fichero.txt>

Salida: tabla de checks + "N/M". Exit 1 si hay violaciones.
"""
import sys, os, re, io

REMITENTES = ('iker', 'asier', 'unai', 'kaixito')

# brand-voice §3 — misma lista literal que validar-post.py (AI-tells)
AI_TELLS = (r'(lo m[aá]s importante|lo fundamental|lo esencial|es (fundamental|crucial|clave) que'
            r'|hoy en d[ií]a|en la actualidad|en el mundo actual|sin embargo|no obstante|asimismo'
            r'|por lo tanto|en consecuencia|de esta manera|posibilita|optimizar|maximizar|potenciar'
            r'|numerosos|en definitiva|en resumen|en conclusi[oó]n|la clave est[aá] en|el secreto es)')

# email-marketing §2 — palabras que huelen a promoción en el ASUNTO
SPAM_ASUNTO = r'(gratis|oferta|descuento|[uú]ltima oportunidad|urgente|no te lo pierdas|newsletter de)'

# email-marketing §4 — CTA floja prohibida (apuntes de expertos)
CTA_FLOJA = r'(ya me dices|ya me cuentas|qu[eé]date atento|estamos en contacto)'

# global §3.6 — cifras en dígito, nunca en letra
NUMERO_EN_LETRA = (r'\b(dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|trece|catorce|quince'
                   r'|diecis[eé]is|diecisiete|dieciocho|diecinueve|veinte|treinta|cuarenta|cincuenta'
                   r'|sesenta|setenta|ochenta|noventa|cien|ciento|doscientos|trescientos|cuatrocientos'
                   r'|quinientos|seiscientos|setecientos|ochocientos|novecientos)\b')

EMOJI = re.compile('[\U0001F000-\U0001FAFF☀-➿]')

# Corpus Timepack (353 asuntos, medido 2026-07-27): mediana 43 chars, media 43.6,
# p90 62, mediana 8 palabras. Solo el 10% lleva número y 1 de 353 acaba en puntuación.
# El techo se pone en el p90: pasarse no es "estilo", es salirse del corpus ganador.
ASUNTO_MAX = 62


def fallo(msg):
    return ('❌', msg)

def ok(msg):
    return ('✅', msg)

def aviso(msg):
    return ('⚠️', msg)


def main():
    # Windows saca cp1252 por defecto y los emojis del informe lo tiran
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(2)
    ruta = sys.argv[1]
    with io.open(ruta, encoding='utf-8') as f:
        crudo = f.read()

    lineas = crudo.splitlines()
    cab = {}
    cuerpo_desde = 0
    for i, l in enumerate(lineas[:6]):
        m = re.match(r'^(REMITENTE|ASUNTO|PREVIEW)\s*:\s*(.*)$', l.strip(), re.I)
        if m:
            cab[m.group(1).upper()] = m.group(2).strip()
            cuerpo_desde = i + 1
    cuerpo_lineas = lineas[cuerpo_desde:]
    # quitar blancos iniciales
    while cuerpo_lineas and not cuerpo_lineas[0].strip():
        cuerpo_lineas = cuerpo_lineas[1:]
    cuerpo = '\n'.join(cuerpo_lineas)
    cuerpo_low = cuerpo.lower()

    checks = []

    # --- cabecera ---
    if all(k in cab for k in ('REMITENTE', 'ASUNTO', 'PREVIEW')):
        checks.append(ok('Cabecera REMITENTE/ASUNTO/PREVIEW completa'))
    else:
        checks.append(fallo('Faltan campos de cabecera (REMITENTE/ASUNTO/PREVIEW)'))

    rem = cab.get('REMITENTE', '').lower()
    # match por prefijo: el From va con marca ("Kaixito de Neety", email-marketing §1)
    rem_base = next((r for r in REMITENTES if rem.startswith(r)), '')
    if rem_base:
        checks.append(ok(f'Remitente válido ({cab["REMITENTE"]})'))
    else:
        checks.append(fallo(f'Remitente "{cab.get("REMITENTE", "?")}" no es Iker/Asier/Unai/Kaixito'))

    asunto = cab.get('ASUNTO', '')
    # --- asunto ---
    if asunto:
        if len(asunto) <= ASUNTO_MAX:
            checks.append(ok(f'Asunto {len(asunto)} chars (techo {ASUNTO_MAX}, corpus Timepack)'))
        else:
            checks.append(fallo(f'Asunto {len(asunto)} chars > {ASUNTO_MAX} (mediana Timepack: 43)'))
        cifras = re.findall(r'\d+[.,]?\d*', asunto)
        if len(cifras) <= 1:
            checks.append(ok('Asunto con ≤1 número'))
        else:
            checks.append(fallo(f'Asunto con {len(cifras)} números (máx 1, como el hook)'))
        # Corpus: 7% lleva UNA palabra en mayúsculas como golpe; ninguno lleva dos o más
        mayus = re.findall(r'\b[A-ZÁÉÍÓÚÑ]{4,}\b', asunto)
        if len(mayus) <= 1:
            checks.append(ok('Asunto con ≤1 palabra en mayúsculas'))
        else:
            checks.append(fallo(f'Asunto con {len(mayus)} palabras en MAYÚSCULAS (máx 1, corpus Timepack)'))
        if '!' in asunto or '¡' in asunto:
            checks.append(fallo('Asunto con exclamación (0 de 353 en el corpus)'))
        else:
            checks.append(ok('Asunto sin exclamaciones'))
        if re.search(SPAM_ASUNTO, asunto, re.I):
            checks.append(fallo('Asunto con palabra de promoción/spam'))
        else:
            checks.append(ok('Asunto sin palabras de promoción'))
        if len(EMOJI.findall(asunto)) <= 1:
            checks.append(ok('Asunto con ≤1 emoji'))
        else:
            checks.append(fallo('Asunto con 2+ emojis'))
        if asunto.rstrip().endswith(('.', ':')) is False:
            checks.append(ok('Asunto sin punto final (corpus: los asuntos no cierran)'))
        else:
            checks.append(aviso('Asunto acaba en puntuación de cierre; Timepack casi nunca lo hace'))

    preview = cab.get('PREVIEW', '')
    primera = cuerpo_lineas[0].strip() if cuerpo_lineas else ''
    if preview and primera and preview.lower() != primera.lower():
        checks.append(ok('Preview manual y distinto de la primera línea'))
    else:
        checks.append(fallo('Preview vacío o idéntico a la primera línea del cuerpo'))

    # --- cuerpo: puntuación delatora (brand-voice §3) ---
    if '—' in crudo or '–' in crudo:
        checks.append(fallo('Guion largo — encontrado (delator IA nº 1)'))
    else:
        checks.append(ok('Cero guiones largos'))
    if re.search(r',\s+(y|e)\s', cuerpo):
        checks.append(fallo('Coma antes de "y"/"e" en el cuerpo'))
    else:
        checks.append(ok('Cero comas antes de "y"'))

    # --- cuerpo: markdown (el email va en texto plano) ---
    if re.search(r'(\*\*|__|^#{1,3}\s|```)', cuerpo, re.M):
        checks.append(fallo('Markdown dentro del email'))
    else:
        checks.append(ok('Sin markdown en el cuerpo'))

    # --- apertura (email-marketing §3: sin saludo, sin presentación) ---
    if re.match(r'^(hola|buenas|buenos d[ií]as|querido|estimado|hey|hello)\b', primera, re.I):
        checks.append(fallo('El cuerpo abre con saludo (la norma de la casa es entrar sin "hola")'))
    else:
        checks.append(ok('Abre sin saludo, directo a la primera línea'))
    if re.match(r'^(somos neety|soy \w+ de neety|en neety somos)', primera, re.I):
        checks.append(fallo('Abre presentándose (la primera línea recompensa, no se presenta)'))
    else:
        checks.append(ok('No abre con presentación'))

    # --- párrafos de prosa ≤3 líneas (global §3.2 heredado) ---
    # Excepción, la misma que en LinkedIn (global §3.2): SOLO las listas con MARCADOR
    # (→, guion, viñeta, numeradas) quedan fuera del tope, porque son el bloque de
    # empresas de los mapas, que va en bloques de 4.
    # ⛔ Una enumeración de PROSA con anáfora NO está exenta: el tope de 3 líneas
    # también le aplica (Mario, 2026-08-03, corrigiendo una versión de este check que
    # la dejaba pasar con 4). En LinkedIn no se hacen bloques de 4 de prosa, nunca.
    def es_lista_con_marcador(b):
        ls = [l.strip() for l in b.splitlines() if l.strip()]
        return len(ls) >= 3 and all(re.match(r'^(→|-|•|\d+[.)])', l) for l in ls)

    bloques = [b for b in cuerpo.split('\n\n') if b.strip()]
    gordos = [b for b in bloques
              if len([l for l in b.splitlines() if l.strip()]) > 3
              and not es_lista_con_marcador(b)]
    if gordos:
        checks.append(fallo(f'{len(gordos)} bloque(s) de prosa con 4+ líneas (máx 3)'))
    else:
        checks.append(ok('Todos los bloques de prosa ≤3 líneas'))

    # --- enlaces: 1 principal como máximo ---
    links = re.findall(r'https?://\S+', cuerpo)
    if len(links) <= 1:
        checks.append(ok(f'{len(links)} enlace(s) (máx 1)'))
    else:
        checks.append(fallo(f'{len(links)} enlaces compitiendo (máx 1 principal)'))

    # --- AI-tells ---
    m = re.search(AI_TELLS, cuerpo_low)
    if m:
        checks.append(fallo(f'AI-tell encontrado: "{m.group(0)}" (brand-voice §3)'))
    else:
        checks.append(ok('Sin AI-tells de la tabla'))

    # --- CTA floja ---
    m = re.search(CTA_FLOJA, cuerpo_low)
    if m:
        checks.append(fallo(f'CTA floja: "{m.group(0)}"'))
    else:
        checks.append(ok('Sin CTA floja ("ya me dices"…)'))

    # --- cifras en letra ---
    m = re.search(NUMERO_EN_LETRA, cuerpo_low)
    if m:
        checks.append(fallo(f'Número en letra: "{m.group(0)}" (global §3.6: en dígito)'))
    else:
        checks.append(ok('Cifras en dígito'))

    # --- PD (aviso, no fallo: Kaixito puede no llevarlo) ---
    # En ESPAÑOL la postdata es PD, no P.S. Medido el 2026-08-06 sobre el corpus
    # español entero (Timepack + Hugo López + Sales Hackers + newsletters):
    # 453 "PD" y 141 "PPD" contra CERO "P.S.". El P.S. es un anglicismo.
    tiene_pd = re.search(r'^\s*p\.?\s?d\.?[:. ]', cuerpo_low, re.M)
    tiene_ps = re.search(r'^\s*p\.?\s?s\.?[:. ]', cuerpo_low, re.M)
    if tiene_ps and not tiene_pd:
        checks.append(fallo('Usa "P.S." en vez de "PD" (corpus español: 453 PD, 0 P.S.)'))
    elif tiene_pd:
        checks.append(ok('Lleva PD'))
    elif rem == 'kaixito':
        checks.append(aviso('Sin PD (en Kaixito es opcional)'))
    else:
        checks.append(fallo('Sin PD (email-marketing §4b: en emails importantes, siempre)'))

    # --- preview: sin techo medido, aviso a partir de 100 chars ---
    if preview and len(preview) > 100:
        checks.append(aviso(f'Preview de {len(preview)} chars; en móvil se corta mucho antes'))

    # --- firma humana (ventana de 10 líneas: P.S.+P.P.S.+baja pueden empujarla) ---
    ultimas = '\n'.join(cuerpo_lineas[-10:]).lower()
    if rem_base and rem_base in ultimas:
        checks.append(ok('Firma con el nombre del remitente'))
    else:
        checks.append(fallo('No se ve la firma humana con el nombre del remitente al final'))

    # --- salida ---
    fallos = sum(1 for s, _ in checks if s == '❌')
    total = len(checks)
    for s, msg in checks:
        print(f'{s} {msg}')
    print()
    print(f'{"❌" if fallos else "✅"} Validador email {total - fallos}/{total}')
    sys.exit(1 if fallos else 0)


if __name__ == '__main__':
    main()
