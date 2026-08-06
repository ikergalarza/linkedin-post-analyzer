# -*- coding: utf-8 -*-
"""Mide la ANATOMIA de la referencia y la del remix, para calcarla con numeros.

    python scripts/anatomia-referencia.py original.txt mio.txt

Por que existe (Iker, 2026-08-06): al remixar el meme de Daniel Disney copie el
tema y el motor, pero no MEDI la referencia. Resultado:

    ORIGINAL  hook 34 car | 1 frase  | emoji 🤣
    EL MIO    hook 62 car | 2 frases | emoji 👇     <- el doble de largo

Iker: *"no puede ser que el gancho original sea tan corto con un emoji de risa
y el nuestro sea el doble de largo, dos frases en vez de una, y el emoji de la
mano en vez del suyo. Todo lo queremos validar en datos. En las referencias
igual: analiza su ritmo, su lenguaje, sus conjugaciones, su longitud, sus
emojis, todo. Y copiamos y mejoramos."*

QUE SE MIDE Y COMO SE USA:
  - LONGITUD DEL HOOK. El ingles dice lo mismo con menos, asi que se admite un
    margen, pero no el DOBLE. Si el suyo son 34 caracteres, el nuestro no puede
    irse a 62.
  - NUMERO DE FRASES DEL HOOK. Una frase es una frase. Partirla en dos cambia el
    ritmo y se pierde el golpe seco del original.
  - EMOJI DEL HOOK. Si el suyo lleva 🤣, el nuestro lleva 🤣. Cambiarlo por 👇
    es cambiar la promesa: la risa anuncia broma, la mano anuncia lista.
  - DONDE VIVE CADA EMOJI. En este original el 👇 esta en el CIERRE, no en el
    hook. Copiar el 👇 al hook es ponerlo donde el original no lo puso.
  - LONGITUD TOTAL Y NUMERO DE BLOQUES. Si el suyo tiene 1.289 caracteres y 17
    bloques y el nuestro 773 y 9, nos hemos dejado media publicacion.
  - RITMO DE BLOQUES. El nuestro deberia ser MEJOR que el suyo, no mas pobre:
    ahi si le ganamos siempre (bloques de 2 y 3 en escalera, lineas sueltas).

LO QUE NO SE CALCA, y se dice en la entrega para que sea una decision y no un
descuido: el CIERRE. El suyo remata con una pregunta + 👇; el nuestro remata con
un bold statement porque asi lo pide `global §4.5` (un solo CTA, y el hueco del
CTA ya lo ocupa el spam ninja).
"""
import io
import os
import re
import sys

EMOJI = r'[\U0001F000-\U0001FAFF☀-➿←-⇿]'


def anatomia(texto, nombre):
    t = texto.strip()
    bs = [b.split('\n') for b in t.split('\n\n')]
    hook = bs[0][0]
    frases = len([x for x in re.split(r'[.!?]+', hook) if x.strip()])
    out = [
        '%-9s hook: %2d car | %d frase(s) | emoji del hook: %s'
        % (nombre, len(hook), frases, ''.join(re.findall(EMOJI, hook)) or '-'),
        '          post: %4d car | %2d bloques | ritmo %s'
        % (len(t), len(bs), '-'.join(str(len(b)) for b in bs)),
        '          emojis del post: %s'
        % (''.join(dict.fromkeys(re.findall(EMOJI, t))) or '-'),
        '          cierre: %s' % bs[-1][-1][:62],
    ]
    return '\n'.join(out)


if __name__ == '__main__':
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    for nom, ruta in [('ORIGINAL', sys.argv[1]), ('EL MIO', sys.argv[2])]:
        print(anatomia(io.open(ruta, encoding='utf-8').read(), nom))
        print()
