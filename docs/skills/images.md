# SKILL: images — El concepto de imagen de cada post

> **name:** images
> **description:** Cómo se propone la imagen de un post de Neety: formato de salida, los 3 registros (meme dibujado / screenshot documental / foto real), constraints de marca (paleta + tipografía + regla de la palabra naranja), la variante "calcar la referencia", el sistema visual del meme desde cero, y el formato quemado de infografías. Fuente: `IMAGE_PRINCIPLES` + `MEME_VISUAL_SYSTEM` de `postPrompt.ts` + histórico de la cuenta.
> **when-to-use:** Cargar cuando un post vaya a llevar imagen (la mayoría). Trabaja junto a `global-instructions` (mecánica del post) y `outliers-database` (qué formato tiró). Para vídeo NO — eso es la skill `video`.

---

## 0 · Realidad de LinkedIn (por qué hay que clavarla)
Una vez publicado un post con foto, la foto **NO se puede cambiar** (habría que borrar y republicar, perdiendo todo el alcance). No hay A/B post-publicación. Se clava antes de publicar. Si la idea cruda no la puede cargar UNA sola imagen fuerte, dilo en vez de forzar una mediocre.

---

## 0b · ⬛ TODA imagen va CUADRADA (1:1). SIN EXCEPCIONES.
> Aplica a **los 4 pilares y a cualquier foto que publiquemos**: meme, mapa, "Los 10", lead magnet, evento. Es lo primero que se comprueba y lo último que se negocia.

- **Por qué:** LinkedIn recorta la previsualización del feed. Una imagen **vertical alargada pierde la parte de arriba y la de abajo**, que suele ser justo donde está el titular y el remate. La imagen la ve el 100% del que scrollea; el post entero, solo el que abre "ver más".
- **Medido en nuestro histórico (2026-07-14): 19 de 20 imágenes de outliers son exactamente 1:1.** Cold calling 16.45x, wojak 16.56x, Gipuzkoa 12.92x, Navarra 7.72x, Galicia 7.28x, "Los 10" 4.81x… todas 800x800 o 480x480. **La única foto que NO es cuadrada (800x450, 16:9) es el lead magnet de las llaves: 4.10x**, el más flojo del grupo. (Las otras dos excepciones son un vídeo y un documento, que no cuentan.)
- **Tamaño recomendado: 800x800** (es el que más se repite en los que funcionaron). 480x480 también vale.
- **⚠️ AL CALCAR UNA REFERENCIA, el formato es NUESTRO, no suyo.** Si el original es vertical (la referencia del meme del perro era **480x720**, ratio 0,67), el remix **se recompone a 1:1**: se calca la esencia, nunca el encuadre malo (`post-workflow §4.4`, tabla de qué se calca). Calcar un 2:3 es entregar un post recortado.
- **En el prompt de imagen va escrito siempre**, con estas palabras: `en formato cuadrado 1:1`.

## 0c · 🎯 CÓMO SE LE PIDE UNA COLOCACIÓN (nunca digas "céntralo")
> Técnica validada peleándose con la herramienta. Aplica a cualquier prompt de imagen, de cualquier pilar.

**El fallo:** pedirle un JUICIO. `céntralo` · `alinéalo` · `ponlo en el centro` · `equilíbralo`. La herramienta **no mide, mueve**. Si le pides que evalúe si algo está centrado, se equivoca **siempre**.

**Lo que funciona: dale una OPERACIÓN, no un resultado.** Nómbrale el **espacio disponible** y la **dirección**:
- ❌ `Centra el título "Realidad".`
- ❌ `El título está descentrado, muévelo a la izquierda.`
- ✅ `Aprovecha el espacio que le queda a la izquierda al título "Realidad" para que quede centrado.`

**Validado (2026-07-14):** en la referencia del meme del perro, el título "Realidad" tiraba al centro en vez de a la izquierda. Con `céntralo` fallaba; con **"aprovecha el espacio que tiene a la izquierda para centrarlo"** salió perfecto a la primera.

**La plantilla:** `aprovecha el espacio que [elemento] tiene hacia [la izquierda/la derecha/arriba/abajo] para que [quede centrado / respire / llene el ancho]`.
Sirve para todo lo espacial: separar del borde, llenar un hueco, subir algo que cuelga. **Describe el movimiento y el espacio, nunca el resultado abstracto.**

## 0d · ⭐ EL OBJETIVO NO ES CALCAR: ES CALCAR Y MEJORAR
> Al remixar una referencia se copia la **esencia** (`post-workflow §4.4`), pero **los DEFECTOS del original no se heredan: se arreglan**. Ser fiel no es ser fiel a sus fallos.

- El original lo hizo un humano con prisa. Que algo esté ahí no significa que sea lo que funcionó: puede ser simplemente lo que le salió.
- **Lo que se arregla siempre, sin preguntar:** encuadre alargado → **1:1** (`§0b`) · textos descentrados → colocados con la técnica de `§0c` · nuestra paleta y nuestros detalles de marca (`§4`).
- **Lo que NO se toca aunque te pique:** la mecánica cómica, el sujeto, el layout, el estilo de dibujo. Eso es el motor.
- **La pregunta:** ¿esto es lo que hizo volar al post, o es un defecto que nadie ha mirado? Lo primero se calca. Lo segundo se mejora. **Estos detalles de diseño marcan la diferencia entre un remix y una copia peor que el original.**

## 0e · 🏷️ NOMBRES DENTRO DE UNA IMAGEN (orla de "Los 10"): NO son la @ del post
> **El fallo (2026-07-15):** metí `OUAZZANI TOUHAMI ASMA` tal cual en la orla porque así lo tiene en LinkedIn, y salió gritando en mayúsculas al lado de 9 nombres en Title Case.

**La distinción que lo explica, y que hay que tener siempre presente:**
| Artefacto | Regla del nombre | Por qué |
|---|---|---|
| **La @ del POST** | **EXACTO como LinkedIn**, sin tocar una letra (`post-workflow §4.0`) | Si no coincide, no salta el autocompletado y **la mención muere** |
| **La IMAGEN (orla)** | **Normalizado** (abajo) | Es texto DIBUJADO: no hay mención, no hay autocompletado, no hay nada que romper. Manda el diseño |

Son artefactos distintos con reglas opuestas. **No apliques la del post a la imagen.**

**Las 3 reglas de la orla:**
1. **Title Case siempre.** Solo la inicial de cada palabra. `OUAZZANI TOUHAMI ASMA` → `Asma Ouazzani`. Un nombre en mayúsculas rompe la coherencia visual de toda la plantilla.
2. **Nombre completo + PRIMER apellido.** Todos con un apellido, para que ninguno desborde. ⚠️ **El nombre COMPUESTO no se parte**: `Jose Antonio Garcia Sanchez` → `Jose Antonio Garcia`, **nunca** `Jose Garcia`. "Antonio" no es su apellido.
   - **No lo adivines partiendo la cadena: Unipile ya te lo da resuelto** en `first_name` y `last_name`. `first_name="Jose Antonio"`, `last_name="Garcia Sanchez"` → nombre completo + `last_name.split()[0]`. Cero heurística.
   - **El guion NO separa apellidos:** `Fernández-Catuxo García` es UN primer apellido (`Javier Fernández-Catuxo`), no dos.
3. **⚠️ Comprueba que los campos no estén INVERTIDOS.** Mucha gente rellena LinkedIn al revés, sobre todo con convenciones no españolas. Caso real: Asma tenía `first_name="OUAZZANI TOUHAMI"` y `last_name="ASMA"`. **El desempate lo da su `public_identifier`**, que es lo que ella misma eligió: `asma-ouazzani` → Asma es el NOMBRE. Aplicar la regla a ciegas habría puesto el apellido delante del nombre en la orla.

**Lo que NO se toca: las tildes.** Si escribe `Jose Antonio Garcia` sin tildes, va sin tildes. Así escribe él su nombre y corregírselo es inventar. La incoherencia de tildes no canta; la de MAYÚSCULAS sí.

## 0f · ⛔ LO QUE UN MODELO DE IMAGEN NO PUEDE HACER: PEGAR
**Un modelo generativo no compone capas, sintetiza píxeles.** No tiene una operación de "pegar esta foto aquí": mira tu foto, la interpreta y **dibuja una parecida**. Por eso, al pedirle que metiera 10 retratos en una plantilla, devolvía caras de otras personas, cambiaba el color de los ojos, suavizaba las fotos malas hasta convertirlas en modelos, metía ruido en los fondos oscuros y descentraba el título. **Todo eso es la MISMA causa y ninguna es un fallo de instrucción.**
- **No se arregla con prompt.** Cada "no toques" que añades lo alarga y le hace menos caso a todo. Si te ves escribiendo la tercera ronda de "no lo suavices", el problema es la herramienta.
- **La regla:** si la operación es **determinista** (pegar, recortar, enmascarar, colocar, redimensionar), la hace un **script**; el modelo es para lo que hay que **inventar** (un meme nuevo, una escena). Caso: `scripts/montar-orla.py` (`post-workflow §4.3` Paso 6b) → 0 píxeles de la plantilla tocados, foto idéntica al original.
- Es la misma lección que el validador de posts y que el sorteo del agradecimiento en `replyGenerator`: **lo que se puede comprobar o ejecutar mecánicamente no se le pide por favor a un modelo.**

## 0g · 🎭 EL REGISTRO DE LA IMAGEN VA POR CUENTA (Unai ≠ Iker)
> La escala de voz de `brand-voice §1b` **también aplica a la imagen**, y aquí es donde más se nota. Fue lo que falló con el meme del perro en la cuenta de Unai.

**Son DOS cajones, no tres** (matizado por el usuario el 2026-07-16):

| Cuenta | Qué meme le pega |
|---|---|
| **Unai** (fundador) y **Asier** | **Meme INTELIGENTE, para industriales, inequívocamente de ventas, y NUNCA infantil.** El chiste lo tiene que pillar un director comercial de 50 años y tiene que pensar "esto lo ha escrito alguien que ha vendido". Sirven: capturas reales, informes, gráficos, fotos, un wojak (que es feo, no mono). **No sirven:** dibujos de animales, caricaturas tiernas, cualquier cosa con pinta de canal de memes |
| **Iker** | **Cualquier meme outlier**, del formato que sea, con la única condición de siempre: **adaptado a ventas** (`global §2.3`, el test del ancla). Aquí no hay restricción extra: es la regla estándar de cualquier post |

- **El meme NO se le prohíbe a Unai ni a Asier**, y confundirlo saldría carísimo: el mejor post de la historia de Unai (**16.62x**) ES un meme, el wojak de la caja de herramientas. Lo que se les prohíbe es el **registro infantil**. Un wojak es feo; un border collie dibujado es mono. Esa es toda la frontera.
- **El texto de Unai ya era sobrio en ese 16.62x.** En su cuenta la sobriedad se juega en la IMAGEN, no en el texto.
- Si una referencia es buenísima pero su imagen es un dibujo tierno, **va a la cuenta de Iker**, no a la de Unai ni a la de Asier. Cambiar de cuenta es gratis; forzar el registro, no.
- ⚠️ **"Inteligente y específico de ventas" NO significa "de nicho".** `global §2.4` sigue mandando: el claim tiene que aterrizar en CUALQUIERA cerca del B2B comercial. Un meme que solo pilla el SDR ultratécnico es un meme del 1% y no viaja, en la cuenta de quien sea. El modelo es el 16.62x: *"cada año la caja de herramientas engorda pero el comercial cierra menos"* lo entiende cualquier comercial, y aun así suena a industrial y no a creador. **Específico de ventas = pasa el test del ancla; no = jerga que estrecha el alcance.**

## 1 · Formato de salida
UN párrafo simple en prosa, listo para pegar en un generador de imágenes. Nombra (tejido natural, en este orden): **sujeto principal · acción/expresión · prop clave · texto overlay (con la palabra EXACTA que va en naranja) · layout/composición · mapeo de roles de color.** Sin bullets, sin headers, sin "concepto alternativo" salvo que se pida.

---

## 2 · Principios (comprimir mentalmente antes de escribir el párrafo)
- **Curiosity gap** que la imagen abre y solo el post cierra.
- **1–2 scroll-stoppers máx.**: cara con emoción fuerte · un número redondo grande · dinero · una interfaz/herramienta/logo que nuestro ICP reconoce · algo genuinamente inesperado. Más de dos = ruido.
- **Claridad en menos de 2 segundos.** Un sujeto principal. Todo lo demás lo apoya o se borra.
- **Texto solo cuando suma** (≤5 palabras, nunca repite el hook). Grande, legible, alto contraste.
- **Legible a miniatura.** Interrumpe el patrón del feed.

---

## 3 · Los 3 registros de imagen (elige por tipo de post, no los cruces)
1. **MEME** → ilustración / cambio corporal, o **calcar la referencia** (§5-B). Dibujado es correcto AQUÍ. (El meme es la EXCEPCIÓN: si la referencia es dibujo, nuestra foto es dibujo.)
2. **DESEO / NÚMEROS / CONVERSACIÓN** → **screenshot documental real** que calca una pantalla reconocible: **iMessage de iPhone** (conversación/mensajes simulados), **captura de la app del banco**, Stripe, calendario, CRM, factura. Y para un **post de métricas**: **captura del dashboard oficial de analíticas de LinkedIn** con NUESTROS datos. Prueba real, no ilustración. Conserva el chrome visible (logo, tipografía real, números en su formato) — ahí está la credibilidad. La credibilidad está en que el FORMATO calca una pantalla real, no en que el dato sea literalmente cierto. Funciona muy bien tanto en memes (motor B) como fuera.
3. **PERSONAL / LEAD-MAGNET / FOUNDER** → **foto natural real** del autor, NO caricatura ni diseño elaborado/complejo. Rinden mejor las **fotos naturales tipo selfie o foto en grupo con compañeros** (cara real, oficina) que las ilustraciones. La cara real es el motor de credibilidad (Iker "desmonto perfiles" foto real 9.13x vs caricatura 0.2x). Especialmente en **lead magnets**: selfie / grupo con el equipo > cualquier caricatura.

---

## 4 · Constraints de marca (SIEMPRE, en cualquier variante)
- **Paleta (solo estas tres):** Alabastro `#f9f3ef` (fondo dominante — todas las imágenes se apoyan en esta superficie clara) · Dark Blue `#0c202e` (títulos, texto, linework — la "tinta") · Persian Orange `#ee9363` (highlight / scroll-stop — a cuentagotas, a la palabra o elemento más importante).
- **Tipografía (solo si la imagen lleva texto):** Bricolage Grotesque para títulos (bold, display) · Switzer para cuerpo. Ninguna otra fuente bajo ningún concepto.
- **Regla de la palabra naranja:** cuando hay texto, la ÚNICA palabra más importante va en Persian Orange; el resto en Dark Blue sobre Alabastro. Elígela deliberadamente (es el scroll-stop) y nómbrala explícitamente en el párrafo.

---

## 5 · Dos variantes — elige una por contexto

### (A) POST NORMAL (data shock, before/after, producto, foto founder, contenido regular) → MINIMALISTA + BRANDED
Un sujeto principal, un scroll-stopper, composición limpia, paleta de marca. Los principios de §2 aplican directos.

### (B) MEME CON IMAGEN DE REFERENCIA que pasa el usuario → CALCAR LA REFERENCIA
La referencia manda: layout, nº de paneles, escena, expresiones, lenguaje corporal, mecánica cómica, el chiste, y el **estilo de dibujo** (si es minimalista → minimalista; si es recargado → recargado). Cópiala lo más fielmente posible e **IGNORA la regla minimalista de (A)**. Sea cual sea su forma (un panel, tres, un sketch, una tira, un screenshot, una foto candid, incluso un meme no-Neety) → clávala. Sobrescribe SOLO esto:
1. **Remapea los colores** a la paleta Neety **y añade detalles de marca** (no solo recolorear): corbatas naranjas, patrones, siluetas, props narrativos en naranja.
2. **Textos:** si los hay, tradúcelos al español (adaptados a ventas) en Bricolage Grotesque (títulos) + Switzer (cuerpo) con la regla de la palabra naranja.
3. **Props específicos:** conserva el elemento pero varía el detalle (café → otro café, avión → otro avión).
4. **Roles de trabajadores:** en español genérico, sin anglicismos ni títulos complejos, entendibles por un industrial de 50+.
Todo lo demás de la referencia se preserva. No fuerces el uniforme camisa-blanca+corbata-naranja ni el grid simétrico si la referencia no los tiene. (Runbook operativo completo en `post-workflow §4.4`.)

### (B-fallback) MEME SIN REFERENCIA → sistema meme desde cero (§6)
Aplica el filtro de 4 puntos del meme (`global-instructions §4.3`: jerarquía de roles B2B + cambio corporal que DUELE y es LEGIBLE a miniatura + punchline citable + el lector ríe CON nosotros) y el sistema visual de §6.

---

## 6 · Sistema visual del meme (SOLO memes SIN referencia)
Cuando hay referencia → la referencia manda (§5-B). Esto es solo para memes desde cero.

**Color + fondo**
- Fondo Alabastro `#f9f3ef` SIEMPRE (nunca invertir a Dark Blue).
- Linework/outlines Dark Blue `#0c202e` para todo (caras, ropa, bordes de panel, tipografía del título salvo la palabra naranja).
- Persian Orange RESERVADO a exactamente 3 slots: (a) la **corbata** del personaje (todos los personajes Neety la llevan = firma visual), (b) **UNA palabra** del título (la última o casi), (c) **props narrativos** del chiste (rayos de grito ⚡, taza, teléfono, billetes). Nada más va naranja.

**Layout**
- Grid simétrico (2 columnas × 3-4 filas) u orla de retratos completa. NO viñetas de cómic con bocadillos y escenografía compleja.
- Cada panel con línea fina Dark Blue, sin relleno más que el Alabastro.
- Etiqueta de rol bajo cada personaje SIEMPRE en Switzer bold Dark Blue. Grande, plana, sin sombras.

**Personajes**
- Ilustración vectorial plana, líneas limpias — "corporate illustration" con personalidad (NO figuras planas genéricas tipo Notion).
- El MISMO personaje base repetido y modificado panel a panel (NO 6 personas distintas). La reutilización construye el efecto de cambio corporal.
- Encuadre busto/hombros + cabeza. Nunca cuerpo entero. La cara domina.
- Uniforme en TODOS los memes Neety: camisa blanca + corbata Persian Orange. Constrúyelo como firma reconocible.
- Expresión base neutra. El CAMBIO CORPORAL comunica la emoción (calvicie, ojeras, encorvamiento, sudor), no sonrisas/muecas exageradas. Única excepción: el personaje que carga la emoción extrema del chiste (el manager gritando en "Coge el teléfono") puede tener la boca abierta gritando.

**Tipografía**
- Título arriba: Bricolage Grotesque BOLD, MAYÚSCULAS, máx. 2 líneas, centrado, ~15-20% de la altura.
- Estructura: [PARTE DARK BLUE] + [UNA palabra Persian Orange al final o casi]. Validados: "EN VENTAS TODOS HUYEN DEL TELÉFONO" (naranja = TELÉFONO) · "AHORA LA IA LES ROBA EL SUEÑO" (naranja = SUEÑO). La palabra naranja SIEMPRE cierra el concepto, nunca a mitad de frase.
- Texto interior (diálogo, etiquetas): Switzer bold Dark Blue, legible a miniatura.

**Elementos narrativos recurrentes**
- Rayos de grito ⚡ en Persian Orange para tensión/volumen.
- Cambio corporal progresivo a lo largo de paneles (calvicie, ojeras, encorvamiento, sudor) — el motor del meme (`global-instructions §4.3`, MOTOR A).
- "Personaje de contraste" en el último panel (el "Mikel" con taza de café, el AE impasible) = punchline visual.

**Checklist al proponer un meme desde cero (dilo explícito):** 1) fondo Alabastro · 2) layout grid simétrico (nº de paneles) · 3) personaje base camisa blanca + corbata naranja · 4) título 2 líneas Bricolage bold MAYÚSCULAS + la palabra EXACTA en naranja (última o casi) · 5) texto interior Switzer bold Dark Blue · 6) qué cambio corporal y en qué paneles · 7) personaje de contraste y su prop · 8) lista de todos los sitios donde aparece el naranja.

**NO proponer:** fondos oscuros · personajes sin el uniforme · más de UNA palabra naranja en el título · viñetas de cómic con bocadillos · fuentes distintas de Bricolage/Switzer · personas distintas entre paneles (debe ser el MISMO personaje cambiando).

---

## 7 · Infografías: FORMATO QUEMADO (0 de 3)
Una infografía (tabla/diagrama/multi-caja resumiendo herramientas/pasos) va 0-de-3 incluso bien hecha — se lee como "deberes", no scroll-stop. Avisa en voz alta y ofrece alternativa: screenshot documental (para números) o meme wojak (para insight). Coherente con `outliers-database §3.8` (doc/carrusel rinden por debajo de foto/texto).

---

## 8 · Registro de imagen por tipo de post (atajo)
- **Mapa regional** → la imagen del POST la hace el USUARIO (captura de la web PamPam); el workflow NO genera imagen de post para mapas (entrega un CSV para PamPam en su lugar — ver `post-workflow §4.2`). Esta skill no aplica al mapa. **Excepción que NO es imagen de post:** el workflow sí entrega una **foto de portada de la región para la web del mapa** (`post-workflow §4.2` Paso 11) — no se genera ni se diseña, se busca en **fuentes de licencia libre** (Wikimedia Commons / Unsplash / Pexels), nunca en Google Imágenes, y se entrega con licencia y autor.
- **"Los 10"** → orla de retratos (cabezas), NO personas sobre mapa. Cabecera fuerte en paleta Neety, palabra clave en naranja (validado: "LOS 10 QUE **LEVANTAN** LA INDUSTRIA VASCA", 4.81x). **El usuario la monta con SU plantilla en otra herramienta**; el workflow NO genera la imagen — entrega las **10 fotos en un ZIP en orden de mención** + **los 2 PROMPTS literales** para su plantilla (`post-workflow §4.3` Paso 6b: uno cambia el gentilicio de la cabecera, otro inserta las caras sin deformarlas).
- **Meme** → §6 (o calcar referencia, §5-B).
- **Deseo / números** → screenshot documental real (registro 2).
- **Personal / founder / lead-magnet / evento** → foto natural real (registro 3). En eventos: selfie/grupo/microfonados/detalle (vino en mano).
