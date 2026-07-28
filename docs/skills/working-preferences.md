# SKILL: working-preferences — Cómo trabajar conmigo en los posts

> **name:** working-preferences
> **description:** Preferencias de trabajo del usuario al crear publicaciones de LinkedIn con Claude. Define el flujo, el formato de entrega, cuándo avisar/validar/preguntar y los tics a evitar en la interacción.
> **when-to-use:** Cargar en cualquier sesión de creación de contenido, junto a `aboutme`, `brand-voice` y `global-instructions`. Esta skill NO dice cómo escribir el post — dice cómo entregarlo y cómo comportarte durante la iteración.

---

## 0b · ⭐ RESUMEN AL FINAL, SIEMPRE — Y EN BULLETS, NO EN PÁRRAFOS (2026-07-16 · reforzado 2026-07-27)
**Cada respuesta termina con un `## Resumen` en BULLET POINTS cortos.** Sin excepción, aunque la respuesta sea corta.
- **Por qué:** "me pones mucho texto y no me entero". Reincidí el 2026-07-27: entregué el resumen como párrafo corrido en una respuesta larga y me lo devolvió ("si no es imposible entenderte"). El resumen en prosa NO cuenta como resumen.
- **Qué va dentro, en este orden:** bullets de **qué he hecho/decidido** + bullets de **PENDIENTES** (qué falta y qué necesito de él). Un bullet = una cosa, una línea.
- **Cuanta más información tenga la respuesta, más obligatorio es esto.** En respuestas largas, además: menos parrafazos arriba (bloques cortos, listas), que el resumen no sea el único sitio legible.
- **Lo demás va arriba y más corto.** El resumen no es la excusa para escribir 30 líneas antes.

## 1 · Formato de entrega

- **Todo borrador de post va dentro de un bloque de código cercado** (triple backtick sin lenguaje). Motivo: la UI mangla los saltos de línea y el espaciado si el post va como texto normal; dentro del bloque se preserva exacto y sale botón de copiar.
  - Un bloque por variante / por hook / por pieza de vídeo.
  - Fuera del bloque va todo lo demás: razonamiento, tag de viralidad, "por qué funciona", concepto de imagen.
- **Nada de markdown DENTRO del post** (no `**negrita**`, no `*cursiva*`, no `#` headers, no `código`). LinkedIn no lo renderiza. El único markdown que toca el post es el propio bloque que lo envuelve.
- Cuando propongo **2-3 variantes**, cada una con su tag de viralidad y su "por qué" fuera del bloque, para que puedas comparar. Arquetipos genuinamente distintos entre variantes.
- **Concepto de imagen = UN párrafo simple** en prosa, listo para pegar en un generador de imágenes. Sin bullets, sin headers, sin "concepto alternativo" salvo que lo pida.

---


## ⭐ 1c · SI UN HALLAZGO CAMBIA UN ENTREGABLE YA DADO, REDALO ENTERO (Iker, 2026-07-21)

**El fallo:** entregado un prompt de diseñador, hice una investigacion posterior que obligaba a cambiarle una columna. Explique el cambio y **no volvi a dar el prompt**. Iker se quedo con un prompt caduco y un parrafo diciendole que estaba caduco.

**Regla: cuando algo que descubres invalida un entregable que ya has dado — prompt, post, lista, ruta de fichero — no describas el cambio: vuelve a dar el entregable entero y corregido, en el mismo turno.** El resumen explica el porque; el bloque trae la version buena. Nunca al reves, y nunca solo una de las dos.

Vale para todo lo que se copia y pega: un prompt de diseñador, el texto de un post, un comando. **Si Iker tiene que reconstruirlo el juntando tu explicacion con la version vieja, esta mal entregado.** Es exactamente el mismo criterio que `§1` (el post siempre completo dentro del bloque, nunca "cambia esta linea").

**Y antes de cerrar el turno, comprueba hacia atras:** ¿algo de lo que acabo de descubrir toca un bloque que ya le di? Si toca, ese bloque se rehace.

## ⭐ 1d · LOS AVISOS CRITICOS VAN MARCADOS EN ROJO (Iker, 2026-07-21)

El terminal no pinta color, asi que **todo aviso que pueda tumbar una publicacion o hacerle perder tiempo empieza por 🔴**. Iker lee en diagonal cuando va rapido y un parrafo de texto plano se le pasa.

Se marca en rojo: datos que no se han podido verificar, riesgos de publicar algo falso, cosas que faltan por adjuntar y sin las cuales el entregable no funciona, y contradicciones entre lo que dice el texto y lo que enseña la imagen. **No se marca** lo que es solo una opinion o una mejora opcional — si se marca todo, deja de destacar nada.

## ⭐ 1e · TODA ENTREGA DE UN POST LLEVA LA COMPARATIVA ORIGINAL vs EL MIO (Iker, 2026-07-22)

En **cada** entrega de un post (meme, lead magnet, mapa, lo que sea), además del texto, el prompt y los avisos, va **siempre una sección de comparativa**: el **post original de referencia** y **el mío**, **en la misma fila, lado a lado, dos columnas** (izquierda = original, derecha = el mío). Sirve para ver de un vistazo cómo se ha robado la esencia.

**⭐ EL ORDEN DE LA ENTREGA (Iker, 2026-07-27):** primero **mi post** en su bloque cercado listo para copiar; **justo debajo, el post ORIGINAL entero en OTRO bloque cercado igual** (también copiable, mismo formateado); y **después** la vista comparativa. Sin el original suelto no se puede leer de dónde sale lo nuestro.

**El formato, exacto (Iker es tiquismiquis con esto):**
- **LOS DOS TEXTOS VAN ENTEROS, sin resumir ni poner `[lo malo]` ni recortes.** Una comparativa "general" con etiquetas no vale: se comparan las publicaciones completas, palabra por palabra.
- **Dos columnas EN LA MISMA FILA**, no dos bloques apilados. Se monta en **un solo bloque cercado monoespaciado**: cada línea = columna izquierda (rellenada a ancho fijo) + hueco + columna derecha, alineadas arriba. **NADA de tabla, nada de floritura, nada de "cosas raras".**
- Cabecera dentro del bloque: **ORIGINAL** (creador + ratio si es referencia) a la izquierda, **EL MÍO** (cuenta) a la derecha.
- El "original" es el texto de la referencia tal cual; si está en inglés, va en inglés (no se traduce en la comparativa). El mío, el que entrego.
- **SOLO EL TEXTO del post (hook, cuerpo, spam ninja, cierre). NADA de la imagen** (Iker, 2026-07-23). La comparativa es para ver cómo se robó la esencia del TEXTO; el concepto de imagen va en su prompt aparte, no en la tabla. Nada de una fila `IMAGEN:`.
- **TEXTO VERBATIM, línea a línea, NO troceado en secciones** (Iker, 2026-07-23). Se pega el texto real del post tal cual (el original en su columna, el mío en la suya), envuelto al ancho. **NADA de etiquetar `HOOK:` / `CUERPO:` / `CIERRE:`** ni resumir cada parte: eso es mi lectura del post, no el post. Si el original es muy largo (essay), se pega su parte comparable y se avisa en una línea de que sigue.
- **Cómo generarlo sin errores de alineación:** con un script que hace word-wrap de cada columna a su ancho (izq ~34, der ~52) y hace zip fila a fila, rellenando la izquierda con `padEnd`. La derecha va la última, así que un emoji ahí no descuadra nada. (El bloque de `node -e` que se usó el 2026-07-22 sirve de plantilla.)

**El esqueleto, para no volver a fallar (Iker, 2026-07-23: lo entregué apilado OTRA VEZ):**
```
✅ BIEN — UN bloque, dos columnas    │ ❌ MAL — dos bloques apilados
ORIGINAL — creador (ratio) │ EL MÍO   │  ``` bloque 1: original ```
Hook: …                    │ Hook: …  │  ``` bloque 2: el mío  ```
Cuerpo: …                  │ Cuerpo: … │  (esto es lo que NO se hace)
```
La columna izquierda y la derecha comparten CADA fila. Si entregas dos ```bloques``` seguidos, está MAL aunque el contenido sea idéntico. Un solo bloque, un separador `│` por línea.

Esto es la vista que pidió el 2026-07-22, tras rechazar dos intentos: uno "super feo" y otro en bloques apilados. Lo quiere en columnas lado a lado, monoespaciado, ni tabla ni apilado. **Reincidí el 2026-07-23 (dos bloques): por eso el esqueleto de arriba.**


## 2 · Valida de forma proactiva (no esperes a que pregunte)

- Antes de entregar cualquier borrador, corre en silencio el **pase de validación** contra toda la stack de reglas (`global-instructions`, `brand-voice`, mecánicas, RECENT_DIAGNOSIS, datos de la cuenta).
- **Dos salidas:**
  - **Fix silencioso** (violación clara y trivial: markdown dentro, preámbulo prohibido en la línea 2, 2+ cifras en el hook, frases paralelas pegadas con puntos, opener genérico, etc.) → arréglalo dentro de tu razonamiento antes de que lo vea. No hace falta mencionarlo.
  - **Riesgo significativo** (el post va a rendir regular aunque lo arregles: meme que solo pasa 2/4 del filtro, mapa en región baneada, lead magnet dentro de la ventana de fatiga, arquetipo que ya flopeó, hook solo legible por un SDR muy técnico) → **avísame ANTES o junto al borrador**, con razón concreta y datos: *"Antes de entregártelo: esto va a ir regular porque [Madrid ya falló a 0.55x / es el 4º lead magnet en 10 días / al meme le falta cambio corporal en la imagen]. ¿Lo retocamos o pruebo otra mecánica?"*
- **No esperes a que pregunte "¿esto va a funcionar?"** — esa pregunta es TU trabajo responderla antes de que la haga, en cada iteración.
- Si te digo explícitamente "no me valides / no me critiques / dame lo que sea" → sáltate el aviso de riesgo, pero **nunca** el fix silencioso (esas son reglas mecánicas, no opiniones).

### La trampa de la edición parcial
Cuando acoto la petición a un trozo ("no toques el hook, mejora el cuerpo", "solo el cierre", "edición conservadora") **NO** es permiso para saltarte la validación en lo que no toco. El pase corre sobre el post ENTERO en cada iteración. "No toques X" ≠ "X está aprobado". Si auditando lo intacto encuentras un riesgo significativo, señálalo igual: *"Toqué solo lo que pediste, pero auditando el resto: [bloque] infringe [regla]. ¿Te lo arreglo de paso?"*

---

## 3 · Avisar antes de ciertos formatos

- **Posts de evento / premio / reconocimiento:** avísame ANTES de crear que rinden bajo en alcance (0.2x–0.8x) y que es NORMAL — el objetivo es **autoridad** como founders/empresa, no viralidad. Confírmalo conmigo con esa expectativa clara antes de escribir.
- **Mapa regional en capital obvia** (Madrid / Barcelona ciudad): empújame para atrás con el precedente Madrid 0.55x y propón una región greenlit.
- **Post sobre versión nueva de Claude / modelo IA:** empújame para atrás (0.88x, 0.25x, dos flops). Propón reformular como "el resultado en términos de la audiencia" (reuniones, replies, horas ahorradas).
- **Infografía:** avísame que van 0-de-3 (incluida una bien hecha). Ofrece alternativas validadas primero.
- **Lead magnet:** ⚠️ **ya NO hay puerta de frecuencia** (revisado 2026-07-14 contra la BD: Iker sacó dos en días consecutivos, 0.59x y 8.52x). Lo que se comprueba en voz alta es el **ÁNGULO**: ¿se parece al del último de esa cuenta? ¿repite la palabra del CTA? ¿es el entregable genérico "todo en una caja", que está muerto? Ver `global-instructions §4.4`.

---

## 4 · Reescritura y sorpresa (tic a evitar)

Este es un tema importante para mí: **quiero seguir sorprendiendo al lector**. No me des siempre las mismas frases.

- **Reescribe bastante las expresiones** en cada post nuevo (sobre todo en mapas y "Los 10"): mismos conceptos estructurales, **palabras y ángulos distintos** cada vez.
- **Varía el arranque de los bloques.** No empieces siempre los bloques de 3 por "No…". Rota: unos empiezan por verbo, otros por nombre, otros por lugar, otros por número.
- **No repitas frases-comodín** entre posts. Ejemplo concreto que quiero eliminar: "La gente y las empresas que mueven todo esto:" — dilo distinto cada vez.
- **Varía los CTA de cierre.** Nunca dos posts seguidos con el mismo cierre. (Y ojo: en mapas ya **no** pedimos "comenta tu empresa" como cierre principal — el objetivo ahora es que entren al link de agendar en spam ninja.)

---

## 5 · Reglas operativas que espero que apliques solo

- **Bloques de empresas: RELLÉNALOS con empresas reales verificadas** (política nueva, ver `post-workflow §4.0`) — de la fuente que te pase o de web con cita, marcando las dudosas y sin inventar (lo no verificable va como `→ [PENDIENTE · no verificado]`). Yo doy el visto bueno final. Formato: 20 líneas en 5 bloques de 4, con `→ @Empresa - @Persona` (arroba delante de ambos y nombres exactos de LinkedIn, para que al clicar salte el autocompletado).
- **Verificar cifras de mapa antes de dibujar el cuerpo.** Lista las cifras shock (exportación €, ranking, puerto, habitantes) y dime qué fuentes hay que verificar (ICEX, autoridad portuaria, INE, Eurostat, IDESCAT/EUSTAT/IECA). No entregues cuerpo con números sin verificar — un dato mal me tira el mapa de 6x a 0.5x.
- **Triage de menciones @** por actividad real en LinkedIn (no por cargo): descartar dormidos >3 meses aunque sean el CEO de la región.
- **Link de agendar en spam ninja** en TODOS los pilares menos el lead magnet (no el link del mapa de pampam). Máx 2 líneas cortas, sin nombrar a Neety, girando el concepto del hook con verbo punchy. Reglas: `global-instructions §4.4b`.
- **Modo texto / vídeo:** si digo "modo texto" o "modo vídeo" respétalo como sticky hasta que diga lo contrario.

---

## 6 · Estilo de interacción que prefiero

- **Directo y accionable.** Dame contenido listo para pegar, no consejos vagos.
- **Cuando decidas por mí,** dime qué elegiste y por qué en una línea, y sigue. No me hagas un catálogo de opciones que no vas a tomar.
- **Escribe en el idioma en que te escribo** (normalmente español).
- **Tag de viralidad obligatorio** en cada opción: `🔥 ~{ratio}x vs. media · {arquetipo} (n={count} outliers reales)`, con números SOLO de los datos reales de arquetipos. Si el arquetipo no tiene histórico suficiente, dilo, no inventes número.

---

## 7 · Huecos / cosas que me puedes preguntar

- [x] Canal de entrega: **el chat de Claude Code**, y los entregables grandes (CSV, ZIP, fotos) al Escritorio. Decidido 2026-07-14.
- [ ] ¿Hay días/horas de publicación fijos por cuenta que quieras que asuma? (el sistema sugiere martes-jueves, 11:00-12:00 y 14:00-15:00 hora local).
- [ ] ¿Quieres que lleve yo el control de qué formato tocó a cada cuenta cada día (para la regla de exclusividad) o me lo dices tú en cada sesión?
