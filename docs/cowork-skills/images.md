# SKILL: images — El concepto de imagen de cada post

> **name:** images
> **description:** Cómo se propone la imagen de un post de Neety: formato de salida, los 3 registros (meme dibujado / screenshot documental / foto real), constraints de marca (paleta + tipografía + regla de la palabra naranja), la variante "calcar la referencia", el sistema visual del meme desde cero, y el formato quemado de infografías. Fuente: `IMAGE_PRINCIPLES` + `MEME_VISUAL_SYSTEM` de `postPrompt.ts` + histórico de la cuenta.
> **when-to-use:** Cargar cuando un post vaya a llevar imagen (la mayoría). Trabaja junto a `global-instructions` (mecánica del post) y `outliers-database` (qué formato tiró). Para vídeo NO — eso es la skill `video`.

---

## 0 · Realidad de LinkedIn (por qué hay que clavarla)
Una vez publicado un post con foto, la foto **NO se puede cambiar** (habría que borrar y republicar, perdiendo todo el alcance). No hay A/B post-publicación. Se clava antes de publicar. Si la idea cruda no la puede cargar UNA sola imagen fuerte, dilo en vez de forzar una mediocre.

---

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
1. **MEME** → ilustración wojak / cambio corporal (sistema meme, §5). Dibujado es correcto AQUÍ.
2. **DESEO / NÚMEROS** → **screenshot documental real** (banco, Stripe, calendario, CRM, factura). Prueba real, no ilustración. Conserva el chrome visible (logo del banco, tipografía real, números en su formato) — eso carga la credibilidad. La credibilidad está en que el FORMATO calca una pantalla real, no en que el dato sea literalmente cierto.
3. **PERSONAL / LEAD-MAGNET / FOUNDER** → **foto natural real** del autor (cara, oficina), NO caricatura dibujada. La cara real es el motor de credibilidad (Iker "desmonto perfiles" foto real 9.13x vs caricatura 0.2x).

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
- **Mapa regional** → la imagen la hace el USUARIO (captura de la web PamPam); el workflow NO genera imagen para mapas (entrega un CSV para PamPam en su lugar — ver `post-workflow §4.2`). Esta skill no aplica al mapa.
- **"Los 10"** → orla de retratos (cabezas), NO personas sobre mapa. Cabecera fuerte en paleta Neety, palabra clave en naranja. **El usuario la monta con SU plantilla**; el workflow NO genera la imagen — entrega las **10 fotos en un ZIP en orden de mención** (`post-workflow §4.3`).
- **Meme** → §6 (o calcar referencia, §5-B).
- **Deseo / números** → screenshot documental real (registro 2).
- **Personal / founder / lead-magnet / evento** → foto natural real (registro 3). En eventos: selfie/grupo/microfonados/detalle (vino en mano).
