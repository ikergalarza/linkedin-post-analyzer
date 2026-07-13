# SKILL: post-workflow — Cómo montar el workflow y la RECETA cronológica de un post

> **name:** post-workflow
> **description:** El marco de workflows de Neety (destilado del playbook interno) YA ADAPTADO a la creación de posts, más la receta cronológica paso a paso para devolver publicaciones casi listas. Define cómo orquestar, cuándo montar un workflow vs. un solo prompt, y dónde el "círculo" se para y te devuelve el control.
> **when-to-use:** Cargar al montar el workflow de LinkedIn en Cowork y al producir cualquier post. Se apoya en todas las demás skills; NO las reemplaza — si algo aquí choca con `global-instructions` / `brand-voice` / `working-preferences` / `outliers-database` / `images` / `video`, **mandan ellas**.

---

## 0 · Regla de oro (precedencia)
Este archivo adapta el marco de "workflows" del playbook interno a la creación de posts. **Las skills basadas en datos mandan siempre.** El playbook está pensado para tareas abiertas (prospección, listas, webs); un post NO es una tarea 100% autónoma: tiene puntos donde, por diseño, el sistema se para y te devuelve el control (ver §5). No dejes que la idea de "que corra solo hasta el final" pise esas paradas.

---

## 1 · El marco, traducido a posts
Un solo concepto (el **workflow**) y dentro viven el resto:
- **Workflow** = el guion que ordena el trabajo, estructura fija (no improvisa el proceso a mitad).
- **Contexto** = de qué come. Aquí = **las demás skills** (una skill es contexto en MD) + la idea semilla que le das. Sin contexto, trabaja a ciegas.
- **Goal** = objetivo que no se suelta. En posts **no hay métrica autónoma que perseguir** (la viralidad no se mide antes de publicar) → los posts caen en el lado "objetivo abierto/creativo = puntos de control", NO en "persigue una métrica". El "objetivo" real de un post es pasar el pase de validación y darte 2-3 variantes para elegir.
- **Loop** = una etapa critica su propio resultado y lo rehace hasta pasar el listón de calidad. **Aquí el "listón" ES el pase de validación** (`global-instructions §8` + `working-preferences §2`). Este es el encaje perfecto del marco: corre el Loop en silencio antes de entregar.

---

## 2 · ¿Workflow o un solo prompt? (no sobre-ingenierices)
- **UN post suelto → suele bastar UN prompt bien dado** (pilar + cuenta + idea + objetivo). Con las skills cargadas, el modelo ya devuelve 2-3 variantes buenas. Montar un multi-agente para un tuit es matar moscas a cañonazos de verdad.
- **Monta workflow cuando pasa de 2-3 pasos y ves la película:**
  - **⭐ EL objetivo real = planificador semanal de las 3 cuentas** ("planifícame la semana"): workflow **paralelo** (una rama por cuenta) que intercala categorías de pilar entre cuentas. Es el workflow complejo que da sentido a todo esto — **detallado en §8**. NO montes uno por tipo de post; montas UNO que planifica la semana entera.
  - **Un post o un mapa suelto** → workflow **encadenado** (o incluso un solo prompt), con el runbook del pilar (§4).
- **Regla previa del playbook (válida):** antes de montar, imagina "si lo hiciera yo a mano, ¿qué pasos daría?" = el esqueleto (que es justo la receta de §4). Y si algo no está claro, pídele a Claude que te **haga preguntas** para validar el sistema antes de lanzarlo.

---

## 3 · Los 2 patrones aplicados a posts
- **Encadenado (en serie):** un objetivo, camino secuencial, cada paso necesita el anterior. Ej. mapa: idea → **verificar cifras** → hook → cuerpo → imagen → validación. Es el patrón por defecto de un post individual con verificación.
- **Paralelizado (en abanico):** ramas independientes que corren a la vez y al final se juntan. Ej. el planificador semanal (§8): rama Iker + rama Unai + rama Asier en paralelo → al final, un chequeo que aplica el intercalado de categorías del día.
- Dentro de cada rama, los pasos van encadenados (el runbook del pilar, §4).

---

## 4 · LA RECETA cronológica (esqueleto general + un runbook por pilar)

### 4.0 · Política de empresas y menciones @ (CORREGIDA — leer primero)
Antes se dejaban SIEMPRE vacías. **Ya no.** La regla nueva:
- **Rellena** los bloques de empresas y las menciones @ con datos **reales y verificables**, tomados de una **fuente**: (a) los datos del **mapa de pampam** o la lista que te pase el usuario, (b) fuentes públicas con cita (ICEX, cámara de comercio, INE/Eurostat, autoridad portuaria, prensa sectorial), o (c) **búsqueda web** en el entorno de Cowork, siempre citando de dónde sale.
- **Marca cada entrada** con su fuente y un nivel de confianza, y añade una lista corta **"revisa estas"** con las dudosas. El usuario da el visto bueno final.
- **NUNCA inventes.** Si no puedes verificar una empresa/persona, deja ese hueco como `→ [PENDIENTE · no verificado]` en vez de rellenarlo con algo falso. Un nombre inventado o un dato mal envenena el hilo (mapa de 6x → 0.5x).
- **Menciones @:** solo personas con **actividad real reciente** (<3 meses: post/repost/comentarios). Descarta dormidos aunque sean el CEO. Si no puedes comprobar actividad, no la menciones.
- **Sin web ni fuente disponible** → compórtate como antes (deja el bloque vacío marcado y pídele la fuente al usuario). Mejor vacío que inventado.

### 4.1 · Esqueleto general (todo post pasa por aquí)
1. **Input:** pilar · cuenta (Iker/Unai/Asier) · idea semilla · objetivo (`alcance | pipeline`).
2. **Test gana/pierde + mecánica** (`global-instructions §0`, matriz §4.6) + **chequeo de riesgo** (`working-preferences §2-§3`: región baneada, fatiga de lead magnet, meme sin motor, exclusividad de formato del día). Si hay riesgo → **avisar ANTES** del borrador.
3. **Verificación de datos** (donde aplique): cifras contra fuente real + empresas/menciones según §4.0.
4. **Hook:** 2-3 candidatos (`global-instructions §2`) — copia la anatomía del pilar en `swipe-file` (varía las palabras).
5. **Cuerpo:** `§3` + voz `brand-voice`, con `swipe-file` como molde de estructura (bloques, anáforas, staccato, reveal).
6. **CTA:** regla del UNO (`§4.5`).
7. **Imagen:** skill `images` (o `video` si es vídeo).
8. **Tag de viralidad:** `outliers-database §4` (Neety) primero; §3 solo etiquetado.
9. **Loop = pase de validación en silencio** (`global-instructions §8`): autocrítica hasta pasar el listón.
10. **Entrega:** 2-3 variantes en bloques cercados (`working-preferences §1`); empresas/menciones rellenas y marcadas (§4.0); lista de "revisa estas"; y **di qué esperas del usuario** para el siguiente paso.

### 4.2 · Runbook MAPA REGIONAL (encadenado) — RECETA DEFINITIVA
> **Input del usuario:** SOLO la región — **si no te la da, pídesela primero.** Todo lo demás (país de comparación, cifras, empresas, personas) lo verifica y rellena el workflow.
> **Output final (solo esto):** (1) el **TEXTO** del post copy-ready · (2) el **CSV** para importar en PamPam · (3) una **descripción de 2 líneas** para la web del mapa.
> **La IMAGEN la hace el usuario** (captura de la web PamPam). El workflow **NO genera ni menciona imagen** para mapas. (Por eso el mapa NO usa la skill `images`.)

**Paso 1 — Iterar el GANCHO** (estructura archi-probada, ver `swipe-file §2.1`). Empieza SIEMPRE por aquí. Fórmula:
`[concepto original despectivo/gracioso de la zona] + [2-3 clichés locales] + [frase-rabia entre comillas] . Y exporta más que [PAÍS] entero 👇`
- **Concepto:** nunca "región/pueblo/tierra". Inventa uno gracioso/despectivo (validados: "esquina del Atlántico", "patio trasero de los Pirineos", "trastienda del norte"). No repitas un concepto ya usado.
- **Clichés:** de ESA región (Sevilla → feria y playa; Valencia → paella y Fallas).
- **Frase-rabia entre comillas:** "y poco más" / "buena para un pintxo-pote y para irse" → sube la indignación defensiva del local (lo que le hace comentar). Está validado en Navarra y Álava.
- **Cierre:** `Y exporta más que [PAÍS] entero 👇` (el país sale del Paso 2).

**Paso 2 — Elegir y VERIFICAR el PAÍS de comparación** (sub-procedimiento — antes NO lo tenía):
1. Busca el **dato oficial más reciente de exportaciones de la provincia/región** en euros, **citando fuente** (EUSTAT / ICEX / Datacomex).
2. Lista los países que exportan **un poco MENOS** que esa cifra → candidatos a "XXX exporta más que [país] entero". Para cada candidato: **nombre, cifra y año**.
3. **Elige el país que MÁS frene el scroll** para nuestra audiencia (director industrial español de 50-60): prioriza países **conocidos** y que **sorprendan** (que parezcan "más grandes/importantes" que una provincia — Bolivia, Croacia, Portugal, Luxemburgo, Honduras, Italia han funcionado). Itera varios y quédate con el más impactante.
4. **INNEGOCIABLE — el dato tiene que ser real y verificable, con fuente.** Nunca sacrifiques veracidad por impacto: un dato mal → el primer comentario de un local corrigiéndote hunde el post (de 6x a 0.5x). Entre dos países igual de impactantes, el de dato más sólido.

**Paso 3 — CUERPO** (fiel a `swipe-file §2.1` + voz `brand-voice`, VARIANDO expresiones):
1. Setup corto justo tras el gancho (sin preámbulo en la línea 2).
2. **Los 3 datos numéricos en lista (1/2/3), cada uno con FUENTE citada** (Eurostat, EUSTAT, Banco Mundial, Datacomex…). El primero suele ampliar la comparación del gancho.
3. Cuerpo saturado de **clichés de la zona nueva** (4-8, tejidos), anáfora de negación ("No paga X. No las pagan Y."), frases-oficio, y variedad de formato (bloques de 2/3, líneas sueltas, escalera).
4. **Reveal tardío:** "Sí, hablo de [región]."
5. **VARÍA las expresiones** frente a mapas anteriores: mismo formato/pilar (mismos bloques de 2/3, mismas ideas), pero **palabras, ángulos y ARRANQUES de bloque distintos**. No abras siempre igual — ni todos los bloques con "No es X, no es Y" (la anáfora de negación), ni repitas comodines ("La gente y las empresas que mueven todo esto:" → dilo distinto cada vez). Rota el arranque: verbo, nombre, lugar, número (`working-preferences §4`). Que se note que es un mapa NUEVO, no un calco.

**Paso 4 — EMPRESAS y PERSONAS a mencionar** (las rellena el workflow vía Unipile — antes se dejaba vacío):
Objetivo: 20 empresas industriales B2B de la región, cada una con UNA persona concreta mencionable y **activa** en LinkedIn, ordenadas de mayor a menor probabilidad de interactuar.
- **Criterios de empresa:** 100-700 empleados (evita megaempresas demasiado corporativas); medianas/grandes, familiares, founder-led o con directivos visibles; sectores industriales (metalurgia, máquina-herramienta, bienes de equipo, automoción, aeronáutica, energía/oil&gas, forja, fundición, calderería, naval/offshore, electrónica, ingeniería, química, caucho, plástico, alimentación industrial…); cubre TODO el territorio (no solo la capital); prioriza exportadoras / presencia internacional. (Para el País Vasco hay una semilla de 346 empresas ICP: `ref_empresas_industriales_pais-vasco.csv` — úsala como punto de partida pero verifica igual con Unipile.)
- **Persona (en este orden):** 1) CEO / director general / gerente; 2) fundador / presidente / propietario; 3) director comercial / marketing / desarrollo de negocio / export manager.
- **Actividad (filtro duro):** que en los **últimos 3 meses** haya publicado, comentado o reposteado en LinkedIn. Más de 3 meses inactivo = mención desperdiciada (no nos va a hacer caso) → **descártalo**. Si nadie de la empresa está activo, **descarta esa empresa** y coge otra. Verifica que el cargo sea ACTUAL.
- **Logo de cada empresa (para el CSV):** para cada una de las 20, saca la **URL de la foto de perfil (logo) de su página de empresa en LinkedIn** vía Unipile: `GET /api/v1/linkedin/company/{identifier}` (con `account_id`) → lee el campo `logoUrl` o `pictureUrl` del JSON. Esa URL va en la columna de imagen del CSV (Paso 8). (No uses favicons de la web oficial — salían en blanco.)
- **Orden:** por probabilidad de interacción (actividad reciente > cercanía industria/territorio/exportación > perfil personal visible > tamaño adecuado).
- **Salida:** lista limpia, sin explicación, en **5 bloques de 4 líneas** (20 en total), formato exacto:
```
→ Empresa - Persona
→ Empresa - Persona
→ Empresa - Persona
→ Empresa - Persona
```
- **Ejecución y credenciales:** **Claude lo ejecuta** vía Unipile. Las credenciales **NO van en el repo** — ya están puestas como **variables de entorno del entorno de Cowork "Iker"**: la **API key** de Unipile, la **URL/DSN base** (host + puerto) y el **account_id**. Léelas de ahí en el runtime (nombres del tipo `UNIPILE_API_KEY`, `UNIPILE_DSN`/URL, `UNIPILE_ACCOUNT_ID` — usa las que estén configuradas; si no las encuentras, lista las env vars del entorno). Construye las llamadas (`GET {DSN}/api/v1/linkedin/company/{identifier}`, cabecera `X-API-KEY`) con esos valores. Nunca hardcodees la key. (Respaldo si el account_id no estuviera en env: `7F9jXBHXQJyR--5uTD62OQ` — no es secreto sin la key.)
- **URLs de LinkedIn:** al sacar cada empresa+persona, captura también la **URL de LinkedIn de la empresa** (su página) y la **URL del perfil de la persona**. Sirven para la guía de menciones del output (Paso 10).
- **Menciones:** las @-menciones reales las pone el usuario a mano en LinkedIn (copiar/pegar no arrastra los tags). El workflow entrega los NOMBRES en el bloque del cuerpo **y, aparte, la guía de menciones con los enlaces** (Paso 10) para que el usuario encuentre a la persona/empresa correcta sin confundirse con homónimos.

**Paso 5 — SPAM NINJA (link de agendar) — NO es el cierre:**
- El link de agendar (`https://recursos.neety.com/agendar/`) va **tejido de forma natural y graciosa**, atacando un **punto de dolor** del cliente y ofreciendo la solución — usando los **diferenciadores de Neety** (`aboutme §1b`: listado con confianza, contacto por señal, el comercial valida y enseña) para introducirlo. Ni venta directa ni frase corporativa.
- **Colocación:** **después del bloque de menciones** (o en el punto del cuerpo que quede más coherente para ESE post). **Nunca como última línea.**
- Ejemplo de tono (variar): *"Vender callado está bien, hasta que otro te roba el cliente. Nosotros te lo cazamos por señal y tú solo cierras: [link]"*.

**Paso 6 — CIERRE del post:** una **frase punchy tipo bold statement** que remate el post. **NO** pide comentarios, **NO** hace pregunta, **NO** repite el link. Es un claim fuerte que cierra (p. ej. "Al final las que más venden son las que menos lo cuentan.").

**Paso 7 — Ensamblar el TEXTO** copy-ready, en este orden: **gancho → cuerpo (3 datos + clichés + reveal) → 20 empresas en 5×4 → spam ninja (link agendar) → cierre punchy**. Corre el pase de validación (§8) en silencio.

**Paso 8 — CSV para PamPam** (clonar `ref_import_navarra.csv`, en esta misma carpeta — plantilla de referencia sobre Navarra):
- **Cálcalo tal cual:** misma estructura de columnas, mismo orden, mismas comillas, mismo formato (incluida la columna `Section` que aparece DOS veces — se mantiene). Cambia solo la info por ser otra ubicación.
- Solo las 20 empresas que has elegido para el post.
- **Coordenadas:** formato `"lat, lng"` como string entre comillas, **verificadas** según la dirección real de la sede (se matchea como coordenadas, nunca como dirección, para que Google Places no sobrescriba).
- **Descripciones:** en español, **una sola frase** por empresa, foco industrial/exportador, sin relleno.
- **Agrupa por `Section`** en categorías limpias de sector.
- **Logo (columna de imagen):** rellena la columna de imagen del CSV (en la plantilla de referencia es **`Media`**, la última) con la **URL del logo de LinkedIn** de cada empresa (el `logoUrl`/`pictureUrl` que sacaste en el Paso 4). NO uses favicons de la web (salían en blanco). Si PamPam esperara la imagen en otra columna, ponla ahí; por defecto = `Media`. `Sticker` = 🏢.
- Incluye TODAS las columnas del archivo de referencia (el Match mode sobrescribe el registro entero).

**Paso 9 — Descripción de 2 líneas** para la web del mapa: corta y concisa, tipo "20 empresas industriales de [región] de los sectores X, Y, Z…". Sin florituras.

**Paso 10 — Guía de menciones** (fuera del post, para pegar las @ a mano): lista de las 20, cada una con el **enlace de LinkedIn de la empresa** y el **enlace del perfil de la persona**, para que el usuario encuentre a la correcta sin confundirse con homónimos. Formato:
```
1. Empresa — [nombre] · linkedin.com/company/…  |  Persona — [nombre] · linkedin.com/in/…
2. …
```

**OUTPUT FINAL del workflow para este pilar (SOLO esto):** (1) el **TEXTO** del post en bloque cercado · (2) el **CSV** listo para importar en PamPam · (3) la **descripción de 2 líneas** · (4) la **guía de menciones con enlaces** (empresa + persona). Nada de imagen.

**Guardarraíles de elección de región (Paso 0):** greenlit (La Rioja, Asturias, Murcia, Aragón, Cantabria, Extremadura, Castilla-La Mancha…); baneadas capitales obvias (Madrid 0.55x); ≥2 semanas desde el último mapa de esa cuenta; nunca repetir región.

### 4.3 · Runbook "LOS 10" (encadenado) — RECETA DEFINITIVA
> **Casi idéntico al mapa (§4.2)** en formato y flujo (hook → cuerpo → menciones → spam ninja → cierre punchy). La diferencia de fondo: **la importancia va a las PERSONAS, no a la región.**
> **Input del usuario:** SOLO la región (o sector) — **si no te la da, pídesela primero** (igual que el mapa). El resto lo verifica y rellena el workflow.
> **Diferencias de OUTPUT vs mapa:** (a) **NO hay CSV** (no se dibuja mapa) · (b) en su lugar, las **10 FOTOS en un ZIP/carpeta, en el ORDEN de mención** (el usuario las mete en SU plantilla de imagen con otra herramienta) · (c) el resto igual: texto copy-ready + guía de menciones con enlaces.

**Paso 0 — Región + guardarraíles:** como en mapa (peloteo: ≥2 semanas desde el último peloteo de esa cuenta, no repetir región/tema).

**Paso 1 — HOOK (foco en la persona):**
- Fórmula = **verbo físico + la herida propia del comercial** para que se IDENTIFIQUE al leerlo ("personas desconocidas quemando el teléfono", "aguantando el no", "marcando nombres que nadie conoce") + `👇`.
- El comercial anónimo tiene que pensar "ese soy yo". Nada abstracto.
- **NUNCA crítica ni reproche a las empresas** (eso mató la versión de Cataluña 0.7x y molestó a los mencionados). Este formato PELOTEA a personas y empresas, no las señala.
- Aplica el resto de reglas de hook (`global-instructions §2` + `swipe-file §3.1`).

**Paso 2 — Las 10 PERSONAS (vía Unipile — como en §4.2, pero personas):**
- **La empresa de cada persona DEBE encajar con nuestro ICP** (`aboutme`): **B2B industrial** (máquina-herramienta, bienes de equipo, automoción, aeronáutica, metalurgia, química, alimentación industrial…) o **servicios B2B**; medianas/grandes (≈100-700 empleados), familiares/founder-led/con directivos visibles, exportadoras. Mismos criterios de empresa que el mapa (§4.2 Paso 4). No metas a alguien de una empresa fuera de ICP aunque sea buen comercial.
- **Criterio de selección = CRECIMIENTO de la empresa en el último año** (el proxy). La lógica: si la empresa ha crecido mucho, su director/equipo comercial es bueno → es a quien queremos pelotear. Elige las 10 empresas ICP que más han crecido y coge a su responsable comercial.
- **Verificación (obligatoria, con fuente pública reciente):** confirma ese crecimiento con noticias/datos públicos del último año. Señales válidas: **facturación/ingresos al alza**, **récord de facturación**, **beneficio neto ↑**, **EBITDA ↑**, **subida de puestos en un ranking**, **% de ventas ↑**, **inversión recibida**, **internacionalización/nueva filial**, **premio**. Cada persona lleva su **logro concreto** citado (ej. `+77% bº (EBITDA +34%)`, `récord €344M`, `€54M → €60M`). Real y verificable, sin polémica; marca los dudosos.
- **Semilla opcional:** `ref_empresas_industriales_pais-vasco.csv` (346 empresas industriales del País Vasco con sector, nº empleados, tier A/B/C, "por qué encaja", señales y fuentes) sirve de punto de partida para el País Vasco. **Aun usándola, verifica SIEMPRE empresa + persona + actividad con Unipile** (no publiques directamente de la lista). Para otras regiones, arranca de cero con los criterios de arriba.
- **Activos en LinkedIn** (últimos 3 meses: post/comentario/repost); si no está activo, se descarta (mención desperdiciada).
- Ordena por probabilidad de interacción / relevancia del logro.
- **Ejecución:** Claude vía Unipile (credenciales de las env vars del entorno "Iker", como §4.2).
- **Formato en el cuerpo:** `→ Persona - Empresa · logro concreto` (ej. `→ Edorta Arriet Azpiroz - Geminis Lathes · +77% bº`).

**Paso 3 — CUERPO** (pelotea a la persona invisible, `swipe-file §3.1`):
- Setup que pinta al que decide de verdad y no sale en la foto (una anáfora tipo "No publica. No da charlas. No sale en la nota de prensa." — **es UNA opción, no la plantilla fija**).
- La **lista de las 10** (`→ Persona - Empresa · logro`).
- **Reveal tardío:** "Sí, hablo de [región]. Pero esto va de las personas."
- Eje emocional: "le pongo cara al que estuvo detrás del salto".
- **QUE SE NOTE QUE ES UN POST NUEVO (clave):** mantén la ESENCIA del formato (mismos bloques de 2/3, misma estructura, mismas ideas) pero **cambia las expresiones y sobre todo cómo ABRES los bloques**. No arranques siempre igual — ni todos los bloques con "No publica / No da charlas", ni con "No es por X, no es por Y" (esa anáfora de negación es la del mapa; no la calques). Rota el arranque: unos por verbo, otros por nombre, otros por número, otros por lugar (`working-preferences §4`). Mismo pilar, palabras distintas cada vez.

**Paso 4 — SPAM NINJA:** igual que mapa (§4.2 Paso 5): link de agendar tejido tras las menciones, nunca última línea, con diferenciadores de Neety.

**Paso 5 — CIERRE punchy** (bold statement, sin pedir comentarios ni preguntar; §4.2 Paso 6). Ej. "Hoy, al menos, sabes su nombre." Corre la validación (§8).

**Paso 6 — FOTOS de las 10 personas (en vez del CSV):** para cada persona, saca su **foto de perfil de LinkedIn** vía Unipile (endpoint de perfil de persona → campo de foto de perfil, `profile_picture_url`/`picture_url`), descárgala, y entrega las 10 en un **ZIP/carpeta nombradas en ORDEN de mención**: `01_Nombre-Apellido.jpg`, `02_…`, … `10_…`. (El usuario las coloca en su plantilla; nosotros NO montamos la imagen — imagen = orla de retratos, `images §8`.)

**Paso 7 — Guía de menciones con enlaces** (igual que mapa, §4.2 Paso 10): las 10 con el enlace de perfil de LinkedIn de la persona y el de la empresa, para pegar las @ sin confundir homónimos.

**OUTPUT FINAL (SOLO esto):** (1) el **TEXTO** del post copy-ready · (2) el **ZIP con las 10 fotos** en orden de mención · (3) la **guía de menciones con enlaces**. **Sin CSV** y sin montar imagen.

### 4.4 · Runbook MEME (REMIX de una referencia) — receta definitiva
> **Input del usuario:** SIEMPRE un **enlace a un post-meme de LinkedIn** de referencia (un caso de éxito). **Si no te lo pasa, PÍDESELO por chat antes de nada.**
> **Output final:** (1) el **TEXTO** del post copy-ready + (2) un **PROMPT de modificaciones para la foto** (Claude **NO genera la imagen**; el usuario la edita a partir de la referencia).
> **Prioridad:** la FOTO es el motor. El texto (gancho + cuerpo) va **corto**.

**Paso 0 — Conseguir la referencia:** accede al enlace y extrae (a) el **TEXTO** del post (gancho/1ª línea + cuerpo) y (b) la **FOTO**.

**Paso 1 — Traducir (si está en inglés, que es lo habitual):** EN→ES **fiel al original** en formato, longitud y estructura, pero con **expresiones naturales en español** donde suenen mejor (no traducción literal robótica).

**Paso 2 — HOOK:**
- **Itera VERBOS** hasta el más punchy **sin perder el significado original**: criticar (flojo) → **desmontar** (punch limpio, punto dulce) → destrozar/destripar (se pasan, pierden la esencia). Quédate con el del punto dulce.
- Aplica TODAS las reglas de hook (`global-instructions §2` + `swipe-file`): bloque único ≤210, imagen mental, ≤1 número, corto.
- **Ancla a VENTAS siempre**, aunque la referencia no vaya de ventas: desde el lado de vender, del cliente o del comercial. Amplifica el alcance al máximo sin perder la esencia de ventas.

**Paso 3 — CUERPO:** lo más **fiel al original** en formato/longitud/formateado, pero **adaptado a ventas B2B**. Corto (3-6 líneas; el motor es la foto, no el texto).
- **Roles de trabajadores:** sin anglicismos ni títulos complejos. Español genérico que un **industrial de 50+ entienda** (comercial, jefe de ventas, director comercial, gerente…) — lo más genérico = más alcance. (Mismo criterio en la foto, Paso 6.)

**Paso 4 — SPAM NINJA:** link de agendar tejido en el **lugar más adecuado del cuerpo** (nunca la última línea), de forma **original y divertida**, con los **diferenciadores de Neety** (`aboutme §1b`). Igual que en mapas.

**Paso 5 — Cierre + validación:** el post cierra con el **punchline del meme** (regla del UNO, sin apilar CTAs). Corre el pase de validación (§8). **Output 1 = el TEXTO copy-ready.**

**Paso 6 — FOTO: PROMPT de modificaciones (NO generar la imagen).** Observa la foto de referencia y entrega **UN párrafo simple** con los cambios a aplicar sobre ella:
- **Textos:** si la foto lleva texto en inglés, traducirlo al español (adaptado a ventas si no lo estaba), con **nuestra tipografía** (Bricolage Grotesque títulos + Switzer cuerpo) y la **regla de la palabra naranja** (`images §4`).
- **Roles en la imagen:** español genérico, sin anglicismos, entendibles por industrial 50+ (igual que el cuerpo).
- **Paleta + detalles de marca:** aplica Alabastro (fondo) · Dark Blue (tinta) · Persian Orange (highlight), y **añade detalles nuestros** (corbatas naranjas, patrones, siluetas, props en naranja…) — no solo recolorear.
- **Fidelidad al diseño original:** mantén el **estilo de dibujo** (minimalista→minimalista, recargado→recargado), el **layout, paneles, escena y mecánica cómica** de la referencia.
- **Cambia solo los específicos:** conserva el elemento pero varía el detalle (si el original tiene café o avión → nosotros también, pero otro café u otro avión).
- **Objetivo:** replicar el caso de éxito del original, **misma esencia**, remix a nuestro sector + Neety. (Sistema visual completo en `images §5-B` y `§6`.)

**Sanity check (antes de entregar):** ¿la referencia tiene un motor que transfiere a ventas (filtro de 4 puntos, `global-instructions §4.3`)? Si el meme no puede anclarse a ventas o pierde la gracia al remixarlo, dilo en vez de forzarlo.

**OUTPUT FINAL (SOLO esto):** (1) el **TEXTO** del post en bloque cercado · (2) el **PROMPT de modificaciones de la foto**. Sin CSV ni menciones (eso es del mapa).

### 4.5 · Runbook LEAD MAGNET (comment-gated) — RECETA DEFINITIVA
> Se reconoce el outlier de lead magnet en la DB porque **se disparan los COMENTARIOS** (vibe prospecting 632 · desmonto perfiles 483). El objetivo del formato es EL comentario.
> **Diferencia clave con los otros pilares: NO lleva spam ninja.** El CTA de comentar ES el cierre (regla del UNO); meter el link de agendar aquí apila CTAs y lo rompe.
> **Output:** solo el **TEXTO** copy-ready. (Imagen = foto real del founder si aplica, `images §3`; la pones tú.) Sin CSV, sin ZIP, sin spam ninja.

**Paso 0 — Input:** la idea/recurso a regalar. Si no te la da, pregúntale qué entregable quiere.

**Paso 1 — Puerta de frecuencia:** ¿≥2 semanas desde el último lead magnet de esta cuenta? ¿no solapa otra cuenta hoy/esta semana? Si no → **avisar de fatiga** (3 en pocos días hunden el alcance).

**Paso 2 — ÁNGULO ORIGINAL (aquí se gana o se pierde):**
- El entregable = **UNA cosa concreta y específica**. El genérico "toda mi biblia / todos mis recursos en una caja" está **MUERTO** (biblia 1.2x): comentan poco y LinkedIn no amplifica.
- **Evita temas quemados:** "plantillas de mensajes", "los mejores recursos", cosas que TODO el mundo regala → nadie comenta porque ya lo han visto mil veces.
- **Busca el ángulo fresco en la competencia** (ahora con acceso a la DB): mira lead magnets outlier en `/api/analysis/cross-creators` y en otros nichos (no solo ventas) para encontrar mecánicas originales que aún no estén quemadas en nuestro sector. Los ángulos se queman rápido → esto se investiga en cada post, no se hardcodea.

**Paso 3 — HOOK (lo más crítico del formato):**
- Tiene que **frenar el scroll** y, sobre todo, **pintar una imagen física/visual** (acción concreta sobre un objeto): "le tiré las **llaves** de mi LinkedIn a Claude" (tirar un objeto) fue el mejor — genera un frame mental. `global-instructions §2.2`.
- **Original** (no un hook visto mil veces), corto, anclado a ventas, ≤1 número, `👇`.
- **El hook lleva una PALABRA-gancho con gracia** que luego será la palabra a comentar (ver Paso 5). Ej.: hook "para mandar buenos mensajes tienes que ser **psicólogo**" → palabra = "psicólogo".

**Paso 4 — CUERPO:**
- Problema → el sistema/valor (a menudo en lista numerada de pasos) → prueba de que funciona. Aplica todo el formateado (bloques de 2/3, líneas sueltas, staccato) y voz `brand-voice`.
- **NO repitas las mismas expresiones** de otros lead magnets: que se note que es un post NUEVO (varía arranques y comodines, `working-preferences §4`).
- **Entrega LIVE en comentarios** (audit/roast/consejo one-liner público) bate al PDF (desmonto perfiles 8.5x/483 com.) — la recompensa pública e inmediata dispara el loop de comentarios. Sanity: el entregable live tiene que dar VALOR REAL, no ser un chiste a costa del que comenta.
- **NADA de spam ninja / link de agendar aquí.**

**Paso 5 — CTA (crítico, fórmula exacta):**
- Literal y explícito: **`Comenta "[PALABRA]" + [tu sector/departamento] y te lo paso`**.
- **PALABRA** = la que remata la gracia del hook (psicólogo, llaves, vibe, desmonta…). Si el CTA no reconecta con el chiste del hook, pierde fuerza.
- **+ sector/departamento** = el añadido que varía por persona (cada uno trabaja en un sector/depto distinto) → cada comentario es único y LinkedIn no lo nerfea por spam. Preferimos **sector/departamento** (mundo empresarial/ventas) antes que "día favorito / mes de cumple" (descartados: no encajan con el tono).
- **Di SIEMPRE la palabra "Comenta" de forma explícita.** FAIL confirmado: cuando pusimos formas implícitas (rollo *si lo quieres, "[palabra]"*) la gente **no entendía que tenía que comentar** y se hundió el conteo. Nada de implícitos.

**Paso 6 — Validación (§8) → entregar el TEXTO copy-ready.**

---

## 5 · Dónde el círculo SE PARA y te devuelve (gates humanos — aquí mandan las skills)
El playbook empuja autonomía total; para posts quedan estas paradas, pero **más ligeras que antes** (ahora Claude rellena, tú validas, no rellenas desde cero):
1. **Empresas y menciones @:** Claude las **rellena con reales verificadas** (§4.0) y te da la lista "revisa estas". Tu trabajo pasa de *rellenar* a *dar el visto bueno* — salvo lo que quede marcado `[PENDIENTE · no verificado]`, que sí completas tú.
2. **Cifras (mapa):** Claude propone y cita fuente; la **confirmación final antes de publicar es tuya**.
3. **Elegir variante + avisos de riesgo:** el sistema entrega 2-3 y AVISA; no auto-publica ni auto-elige.
4. **Imagen:** el sistema da el párrafo/concepto; **generarla** (pegarlo en tu generador) y subirla es tuyo.

Todo lo demás (investigar, verificar, rellenar con reales, redactar, autocriticar) corre solo. El objetivo real: **de idea a borrador ya casi listo que revisas y publicas**, no "de idea a post publicado sin ti".

---

## 6 · Formato de salida (override del playbook)
El playbook dice "output = acción ejecutada o HTML estudio". Para posts **no**: el output es el de `working-preferences §1` (un bloque cercado por variante, sin markdown dentro del post, "por qué" + tag + concepto de imagen fuera). El HTML briefing solo tendría sentido para un plan de contenido semanal, no para el post en sí.

---

## 7 · Cosas del playbook que SÍ adoptamos tal cual
- **Pensar "si lo hiciera a mano, ¿qué pasos?"** antes de montar (= la receta §4).
- **Que Claude te diga siempre qué espera de ti para el siguiente paso** (paso 10) → puedes llevar varios hilos a la vez sin recoger contexto de cero.
- **Dictar por audio** al montar/pedir: das más contexto que tecleando.
- **Encadenado vs paralelo** como las dos únicas formas de organizar el trabajo.

---

## 8 · EL WORKFLOW REAL: planificador semanal de las 3 cuentas
> Este es el objetivo de todo lo anterior: **UN solo workflow complejo** que planifica y produce la semana entera para las 3 cuentas a la vez. NO uno por pilar. Los runbooks de §4 son las piezas que este planificador ensambla.

**Por qué se planifican juntas:** Iker, Unai y Asier son fundadores/cofundadores de la MISMA empresa (Neety), sobre el MISMO sector (ventas B2B), con la MISMA voz y los MISMOS pilares. El contenido es prácticamente el mismo entre las 3 siguiendo los mismos outliers → por eso se planifican en bloque y se **intercalan** para no pisarse.

### 8.1 · Las 3 categorías de pilar (unidad de rotación)
- **PELOTEO (regional)** = { **Mapa regional** | **"Los 10"** directores/comerciales regionales }. Ensalzan una zona o a personas. Los dos formatos cuentan como **la MISMA categoría** a efectos de intercalado (no pueden coincidir dos peloteos el mismo día).
- **LEAD MAGNET** (comment-gated).
- **MEME** (con motor).

Vídeo, evento y formatos nuevos quedan **fuera de la rotación por defecto**; entran solo si tú lo pides (8.4).

### 8.2 · La regla de intercalado (exclusividad por día = cuadro latino 3×3)
Cada día de publicación, las 3 cuentas cubren las **3 categorías DISTINTAS** (nunca dos cuentas la misma categoría el mismo día), y a lo largo de la semana **cada cuenta pasa por las 3**. Ejemplo de reparto:

| Día | Iker | Unai | Asier |
|-----|------|------|-------|
| Martes | Peloteo | Lead magnet | Meme |
| Miércoles | Meme | Peloteo | Lead magnet |
| Jueves | Lead magnet | Meme | Peloteo |

- **Frecuencia por defecto:** 3 posts/semana/cuenta (tú confirmas la frecuencia al lanzar).
- **Días/horas por defecto:** martes-jueves; 11:00-12:00 y 14:00-15:00 (hora local). Configurable.
- **Rota semana a semana** quién hace qué (que no salga idéntico), y **dentro de PELOTEO alterna** mapa vs "Los 10" y cambia región/tema.

### 8.3 · Guardarraíles de espaciado (entre semanas) → vía el HISTORIAL
- **Mapa:** ≥2 semanas entre mapas de la MISMA cuenta; nunca repetir región.
- **Lead magnet:** ≥2 semanas por cuenta; nunca dos seguidos ni solapar dos cuentas el mismo día.
- **Mecanismo:** el planificador LEE el archivo **`historial-publicaciones.md`** (registro vivo) al empezar, respeta el espaciado a partir de él, y **añade la semana nueva** cuando la apruebas. Hay que **persistir** ese archivo cada semana (re-subirlo a Cowork / commit al repo) para que el historial no se pierda. Si el historial está vacío o desactualizado, el workflow **te pregunta** qué hizo cada cuenta las últimas 2 semanas antes de asignar.

### 8.4 · LA PREGUNTA PREVIA (obligatoria, antes de planificar nada)
El workflow SIEMPRE arranca preguntando:
> *"¿Planificamos la semana con los 3 pilares de siempre (peloteo / lead magnet / meme) o quieres meter o probar un formato nuevo esta semana (vídeo, evento, otro)?"*
- **"Lo de siempre"** → aplica el cuadro latino de 8.2.
- **"Formato nuevo X"** → lo encaja donde digas y recoloca el resto respetando el intercalado.

### 8.5 · Flujo del workflow (paralelo por cuenta)
1. **Pregunta previa** (8.4) + confirmar frecuencia y días.
2. **Proponer la MATRIZ semanal** (tabla cuenta × día × categoría) aplicando 8.2 + 8.3. Para cada celda de PELOTEO, decidir si mapa o "Los 10" y la región/tema.
3. **[Checkpoint] Enseñarte la matriz** para aprobar o ajustar ANTES de generar (recomendado siempre; imprescindible las primeras semanas).
4. **Generar los posts en PARALELO** (una rama por cuenta; dentro de cada post, el runbook del pilar §4.2-4.5, encadenado): verificar datos → hook → cuerpo → CTA → concepto de imagen → Loop de validación (§8).
5. **Entregar:** la matriz + todos los posts, cada uno con su texto en bloque cercado, tag, "por qué", riesgos, concepto de imagen y "revisa estas" (empresas/cifras/menciones). Y **di qué esperas de mí** para el siguiente paso.

### 8.6 · El output por post (lo que te devuelve)
- **PRIMERO el TEXTO perfecto (gancho + cuerpo)** en bloque cercado, listo para copiar.
- **Fuera del bloque:** tag de viralidad, "por qué funciona", riesgos y el **CONCEPTO DE IMAGEN** (un párrafo listo para el generador).
- **La imagen en sí:** si Cowork puede generarla, en el mismo run; si no, el párrafo es el entregable y la generas tú. **No tienes que "decírselo a Cowork" aparte** — el concepto de imagen sale con cada post porque el runbook lo incluye (paso 7 / paso imagen de cada runbook).

---

## 9 · Cerrar el bucle: medir y aprender (después de publicar)
El sistema no termina al entregar el post. Para que mejore con el tiempo:
1. **Registrar el resultado:** cuando un post lleva unos días, apunta en `historial-publicaciones` su **ratio real** (y likes/comentarios/reposts). Así el planificador tiene datos frescos y el espaciado sigue teniendo sentido.
2. **Destilar el aprendizaje:** si un post **rompe** (muy por encima) o **flopea** (muy por debajo) de lo esperado, saca UNA frase de aprendizaje y proponla para la skill que toque (`outliers-database §4` si es un ratio/patrón, `swipe-file` si es un molde de texto, `global-instructions` si es una regla nueva). No lo dejes solo en la memoria de la conversación.
3. **Persistir:** el aprendizaje solo cuenta si se guarda en el archivo (commit al repo / re-subida a Cowork). Memoria ≠ archivo (ver README, flujo de actualización).
4. **Refrescar los ratios:** cada 1-2 meses, reexporta "Top posts" y el Explorer y actualiza §4 y §3 — los ratios decaen y las mecánicas se queman.
