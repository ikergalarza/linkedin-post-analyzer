# SKILL: post-workflow — Cómo montar el workflow y la RECETA cronológica de un post

> **name:** post-workflow
> **description:** El marco de workflows de Neety (destilado del playbook interno) YA ADAPTADO a la creación de posts, más la receta cronológica paso a paso para devolver publicaciones casi listas. Define cómo orquestar, cuándo montar un workflow vs. un solo prompt, y dónde el "círculo" se para y te devuelve el control.
> **when-to-use:** Cargar al producir cualquier post de LinkedIn. Se apoya en todas las demás skills; NO las reemplaza — si algo aquí choca con `global-instructions` / `brand-voice` / `working-preferences` / `outliers-database` / `images` / `video`, **mandan ellas**.

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
- **Rellena** los bloques de empresas y las menciones @ con datos **reales y verificables**, tomados de una **fuente**: (a) los datos del **mapa de pampam** o la lista que te pase el usuario, (b) fuentes públicas con cita (ICEX, cámara de comercio, INE/Eurostat, autoridad portuaria, prensa sectorial), o (c) **búsqueda web**, siempre citando de dónde sale.
- **Marca cada entrada** con su fuente y un nivel de confianza, y añade una lista corta **"revisa estas"** con las dudosas. El usuario da el visto bueno final.
- **NUNCA inventes.** Si no puedes verificar una empresa/persona, deja ese hueco como `→ [PENDIENTE · no verificado]` en vez de rellenarlo con algo falso. Un nombre inventado o un dato mal envenena el hilo (mapa de 6x → 0.5x).
- **Menciones @:** solo personas con **actividad real reciente** (<3 meses: post/repost/comentarios). Descarta dormidos aunque sean el CEO. Si no puedes comprobar actividad, no la menciones.
- **Sin web ni fuente disponible** → compórtate como antes (deja el bloque vacío marcado y pídele la fuente al usuario). Mejor vacío que inventado.

### 4.1 · Esqueleto general (todo post pasa por aquí)
1. **Input:** pilar · cuenta (Iker/Unai/Asier) · idea semilla · objetivo (`alcance | pipeline`).
2. **Test gana/pierde + mecánica** (`global-instructions §0`, matriz §4.6) + **chequeo de riesgo** (`working-preferences §2-§3`: región baneada, fatiga de lead magnet, meme sin motor, exclusividad de formato del día). Si hay riesgo → **avisar ANTES** del borrador.
3. **Verificación de datos** (donde aplique): cifras contra fuente real + empresas/menciones según §4.0.
4. **Hook:** 2-3 candidatos (`global-instructions §2`) — copia la anatomía del pilar en `swipe-file` (varía las palabras). **En TODO hook, itera el VERBO hasta el más punchy CON TECHO: la escalera y los verbos validados están en `global-instructions §2.9`.** Medido en nuestras cuentas: "desmonto perfiles" 8.52x vs "destripo perfiles" 0.21x.
5. **Cuerpo:** `§3` + voz `brand-voice`, con `swipe-file` como molde de estructura (bloques, anáforas, staccato, reveal).
6. **CTA:** regla del UNO (`§4.5`).
7. **Imagen — SIEMPRE un prompt o una recomendación basada en datos** (según el registro correcto, `images §3`):
   - **Mapa:** captura de PamPam (la haces tú) → el workflow no da prompt, entrega el CSV.
   - **"Los 10":** orla de retratos con TU plantilla → el workflow entrega el ZIP de 10 fotos (no prompt).
   - **Meme:** **prompt de modificaciones** sobre la referencia (`§4.4` Paso 6).
   - **Lead magnet / personal / founder:** **recomendación de foto natural** (selfie o grupo con compañeros; NO caricatura ni diseño elaborado).
   - **Deseo/números/conversación/métricas:** prompt de **screenshot documental** (iMessage, app del banco, dashboard de LinkedIn con nuestros datos).
   - Vídeo → skill `video`.
8. **Tag de viralidad:** `outliers-database §4` (Neety) primero; §3 solo etiquetado.
9. **Loop = pase de validación en silencio** (`global-instructions §8`): autocrítica hasta pasar el listón.
10. **Entrega:** 2-3 variantes en bloques cercados (`working-preferences §1`); empresas/menciones rellenas y marcadas (§4.0); lista de "revisa estas"; y **di qué esperas del usuario** para el siguiente paso.

### 4.2 · Runbook MAPA REGIONAL (encadenado) — RECETA DEFINITIVA
> **Input del usuario:** SOLO la región — **si no te la da, pídesela primero.** Todo lo demás (país de comparación, cifras, empresas, personas) lo verifica y rellena el workflow.
> **Output final (solo esto):** (1) el **TEXTO** del post copy-ready · (2) el **CSV** para importar en PamPam · (3) el **TÍTULO** y la **descripción de 2 líneas** para la web del mapa · (4) la **guía de menciones** (bloque cercado, solo URLs) · (5) una **FOTO de portada de la región** para la web del mapa (Paso 11).
> **Ojo, son DOS imágenes distintas y solo una la das tú:**
> - **Imagen del POST** = captura de la web PamPam → **la hace el USUARIO**. El workflow NO la genera ni la describe. (Por eso el mapa NO usa la skill `images`.)
> - **Foto de portada de la WEB del mapa** = foto de la región → **la entrega el workflow** (Paso 11).

**Paso 1 — Iterar el GANCHO** (estructura archi-probada, ver `swipe-file §2.1`). Empieza SIEMPRE por aquí. Fórmula:
`[concepto original despectivo/gracioso de la zona] + [2-3 clichés locales] + [frase-rabia entre comillas] . Y exporta más que [PAÍS] entero 👇`
- **Concepto: DERIVADO DE LA GEOGRAFÍA de la región** (su posición en el mapa, accidentes geográficos, fronteras). Nunca "región/pueblo/tierra". Así lo hemos hecho siempre: Galicia = "la esquina del Atlántico" (arriba a la izquierda), Álava/País Vasco = "la trastienda del norte" (arriba, la olvidada del norte), Navarra = "el patio trasero de los Pirineos" (frontera con Francia). Inventa uno original y geográfico por región; no repitas concepto usado.
- **⚠️ NO criticar otras regiones/ciudades ESPAÑOLAS.** Estos posts buscan **HERMANDAD entre regiones, no dividir el país** (igual que nunca hablamos mal de otra empresa, tampoco de otra región). **Prohibido nombrar/pinchar a Madrid, Barcelona u otras ciudades/regiones españolas** en el concepto o el hook. El "desprecio" es (a) **auto-despectivo** de la propia región (sus clichés) o (b) apoyado en una **frontera extranjera** (los Pirineos están entre España y Francia → "patio trasero de los Pirineos" vale). Nada de "la sala de espera entre Madrid y Barcelona" ni "para media España": genera conflicto entre regiones.
- **Clichés:** de ESA región (Sevilla → feria y playa; Valencia → paella y Fallas).
- **Frase-rabia (OBLIGATORIA — es el motor de la rabia, no un adorno):** el remate que despacha la región en cuatro palabras y hace que el local comente para defenderla. **NUNCA la escribas igual que la vez anterior, pero NUNCA la omitas.** Validadas: Navarra `toro, txistorra y poco más` · Álava `buena para un pintxo-pote y para irse` · Aragón `un ternasco antes de seguir carretera`. Familia de variantes para rotar: "y para de contar", "y gracias", "y poco que rascar", "buena para [comer X] y [largarse]", "sitio de parar y seguir". El patrón es: **[cliché de comida/fiesta] + [gesto de despacharla]**. Si el hook no tiene este beat, el local no siente el desprecio → no comenta → no hay motor.
- **Cierre:** `Y exporta más que [PAÍS] entero 👇` (el país sale del Paso 2).
- **Verbo punchy con techo** (`global §2.9`) donde el hook lleve verbo (exportar, vender, cargar…).

**Paso 2 — Elegir y VERIFICAR el PAÍS de comparación** (sub-procedimiento — antes NO lo tenía):
1. Busca el **dato oficial más reciente de exportaciones de la provincia/región** en euros, **citando fuente** (EUSTAT / ICEX / Datacomex).
2. Lista los países que exportan **un poco MENOS** que esa cifra → candidatos a "XXX exporta más que [país] entero". Para cada candidato: **nombre, cifra y año**.
3. **Elige el país que MÁS frene el scroll** para nuestra audiencia (director industrial español de 50-60): prioriza países **conocidos** y que **sorprendan** (que parezcan "más grandes/importantes" que una provincia — Bolivia, Croacia, Portugal, Luxemburgo, Honduras, Italia han funcionado). Itera varios y quédate con el más impactante.
4. **INNEGOCIABLE — el dato tiene que ser real y verificable, con fuente.** Nunca sacrifiques veracidad por impacto: un dato mal → el primer comentario de un local corrigiéndote hunde el post (de 6x a 0.5x). Entre dos países igual de impactantes, el de dato más sólido.

**Paso 3 — CUERPO** (fiel a `swipe-file §2.1` + voz `brand-voice`, VARIANDO expresiones):
1. Setup corto justo tras el gancho (sin preámbulo en la línea 2).
2. **Los 3 datos numéricos en lista (1/2/3), cada uno con FUENTE citada** (Eurostat, EUSTAT, Banco Mundial, Datacomex…). El primero suele ampliar la comparación del gancho.
   - **NUNCA pongas la FECHA/AÑO de la fuente en el cuerpo.** Cita el nombre (`(IAEST y Banco Mundial)`), nunca `(EUSTAT 2024)` ni "vendieron 15.615M€ **en 2025**". Motivo: el lector ve un año y lee el post como viejo aunque se publique hoy → rechazo y scroll. El dato SIEMPRE va verificado y con su año registrado **fuera del post** (entrega interna); si alguien pregunta el año en comentarios, se le responde ahí y suma credibilidad. Usa referencias temporales relativas o ninguna: "ya adelantó", "en un año", presente ("venden al mundo").
3. Cuerpo saturado de **clichés de la zona nueva** (4-8, tejidos), anáfora de negación ("No paga X. No las pagan Y."), frases-oficio, y variedad de formato (bloques de 2/3, líneas sueltas, escalera).
4. **Reveal tardío:** "Sí, hablo de [región]."
5. **🚫 EL EJE "CALLADO" ESTÁ QUEMADO — prohibido.** Nada de "aquí se vende callado", "trabajan en silencio", "no lo cuentan", "no salen en la foto", "nadie los conoce", "sin hacer ruido" en el cuerpo, el spam ninja NI el cierre. Lo hemos usado en TODAS las regiones y quien nos lee lo tiene fichado: **no puede ser que todas las regiones estén calladas, alguna hablará**. Además es un ángulo de lástima ("pobrecitos, nadie les hace caso") cuando lo que queremos es dar **mérito y protagonismo**. (Ojo: el silencio SÍ es el eje propio de "Los 10" §4.3 — la persona invisible. En mapas, no.)
   **Ejes de mérito para rotar** (uno por mapa, nunca repetir el del anterior): **carácter forjado por la geografía** (Aragón: "el cierzo no deja crecer nada flojo") · **ubicuidad invisible** ("lo tienes en casa y no sabes ni cómo se llaman") · **exigencia del cliente** ("aquí te compra quien no perdona un retraso") · **oficio heredado** ("empezó barriendo la nave y acabó dirigiéndola") · **récord contra pronóstico**. El local tiene que pensar "qué bien, nos están dando mérito", no "qué pena damos".
6. **VARÍA las expresiones** frente a mapas anteriores: mismo formato/pilar (mismos bloques de 2/3, mismas ideas), pero **palabras, ángulos y ARRANQUES de bloque distintos**. No abras siempre igual — ni todos los bloques con "No es X, no es Y" (la anáfora de negación), ni repitas comodines ("La gente y las empresas que mueven todo esto:" → dilo distinto cada vez). Rota el arranque: verbo, nombre, lugar, número (`working-preferences §4`). Que se note que es un mapa NUEVO, no un calco.

**Paso 4 — EMPRESAS y PERSONAS a mencionar** (las rellena el workflow vía Unipile — antes se dejaba vacío):
Objetivo: 20 empresas industriales B2B de la región, cada una con UNA persona concreta mencionable y **activa** en LinkedIn, ordenadas de mayor a menor probabilidad de interactuar.
- **Criterios de empresa:** 100-700 empleados (evita megaempresas demasiado corporativas); medianas/grandes, familiares, founder-led o con directivos visibles; sectores industriales (metalurgia, máquina-herramienta, bienes de equipo, automoción, aeronáutica, energía/oil&gas, forja, fundición, calderería, naval/offshore, electrónica, ingeniería, química, caucho, plástico, alimentación industrial…); cubre TODO el territorio (no solo la capital); prioriza exportadoras / presencia internacional. (Para el País Vasco hay una semilla de 346 empresas ICP: `ref_empresas_industriales_pais-vasco.csv` — úsala como punto de partida pero verifica igual con Unipile.)
- **Persona (en este orden):** 1) CEO / director general / gerente; 2) fundador / presidente / propietario; 3) director comercial / marketing / desarrollo de negocio / export manager.
- **Actividad (filtro duro):** que en los **últimos 3 meses** haya publicado, comentado o reposteado en LinkedIn. Más de 3 meses inactivo = mención desperdiciada (no nos va a hacer caso) → **descártalo**. Si nadie de la empresa está activo, **descarta esa empresa** y coge otra. Verifica que el cargo sea ACTUAL.
- **Logo de cada empresa (para el CSV):** para cada una de las 20, saca la **URL de la foto de perfil (logo) de su página de empresa en LinkedIn** vía Unipile: `GET /api/v1/linkedin/company/{identifier}` (con `account_id`) → lee el campo `logoUrl` o `pictureUrl` del JSON. Esa URL va en la columna de imagen del CSV (Paso 8). (No uses favicons de la web oficial — salían en blanco.)
- **Orden:** por probabilidad de interacción (actividad reciente > cercanía industria/territorio/exportación > perfil personal visible > tamaño adecuado).
- **⚠️ NOMBRES EXACTOS DE LINKEDIN, ni uno retocado.** Copia el campo `name` que devuelve Unipile (empresa y persona) **literal**: mayúsculas, tildes, `S.A.`/`S.A.U.`, y hasta el tagline si la página lo lleva en el nombre (`Cartonajes Barco | Soluciones de embalaje`). **Prohibido "embellecerlos"**: nada de `ARPA EMC` por `ARPA Equipos Móviles de Campaña`, ni `Nurel` por `NUREL`, ni quitar el `S.A.`.
  **Por qué importa (no es cosmético):** el usuario pega las @ a mano y LinkedIn autocompleta **por el nombre exacto**. Si el nombre no coincide, no salta el autocompletado → la mención se queda en texto muerto → esa empresa no recibe notificación → mención perdida y, con ella, el alcance que el mapa presta. Y como LinkedIn inserta el nombre real al mencionar, el post publicado acabaría distinto del que validaste.
  Lo mismo para las personas (`first_name + last_name` tal cual: `Oscar Fernandez Feito`, sin ponerle las tildes que su perfil no tiene).
- **@ DELANTE DE CADA NOMBRE**, empresa y persona: `→ @Empresa - @Persona`. No es cosmético: el usuario pega el post en LinkedIn y clica detrás de cada @; con la arroba ya puesta, LinkedIn dispara el buscador de menciones solo. Sin ella tiene que ir escribiendo arroba por arroba, 40 veces.
- **LÍNEA EN BLANCO entre la frase de entrada y la primera empresa.** La frase que presenta la lista (`Estas son las 20 que lo sostienen, y quien hay detrás:`) va **sola, con un salto en blanco detrás de los dos puntos**. Nunca pegada a la primera `→`: pegada, la lista se lee como un muro y la frase pierde el efecto de anuncio.
```
❌ MAL                          ✅ BIEN
Estas son las 20:               Estas son las 20:
→ @Fersa - @Rafael Paniagua
                                → @Fersa - @Rafael Paniagua
```
- **Salida:** lista limpia, sin explicación, en **5 bloques de 4 líneas** (20 en total), formato exacto:
```
Frase de entrada:

→ @Empresa - @Persona
→ @Empresa - @Persona
→ @Empresa - @Persona
→ @Empresa - @Persona

→ @Empresa - @Persona
(… ×5 bloques)
```
- **Avisa de los nombres que llevan tagline o símbolos** (`@Cartonajes Barco | Soluciones de embalaje`): al clicar, LinkedIn busca con todo lo que sigue a la @ y la barra/el eslogan no matchean. Dile al usuario que recorte a la parte corta (`@Cartonajes Barco`) y elija en el desplegable, que LinkedIn ya inserta el nombre completo. El nombre en el post va completo igualmente (Paso 4, nombres exactos).
- **Ejecución y credenciales:** **Claude lo ejecuta** vía Unipile. Las credenciales **NO van en el repo** — ya están puestas como **variables de entorno**: la **API key** de Unipile, la **URL/DSN base** (host + puerto) y el **account_id**. Léelas de ahí en el runtime (nombres del tipo `UNIPILE_API_KEY`, `UNIPILE_DSN`/URL, `UNIPILE_ACCOUNT_ID` — usa las que estén configuradas; si no las encuentras, lista las env vars del entorno). Construye las llamadas (`GET {DSN}/api/v1/linkedin/company/{identifier}`, cabecera `X-API-KEY`) con esos valores. Nunca hardcodees la key. (Respaldo si el account_id no estuviera en env: `7F9jXBHXQJyR--5uTD62OQ` — no es secreto sin la key.)
- **URLs de LinkedIn:** al sacar cada empresa+persona, captura también la **URL de LinkedIn de la empresa** (su página) y la **URL del perfil de la persona**. Sirven para la guía de menciones del output (Paso 10).
- **Menciones:** las @-menciones reales las pone el usuario a mano en LinkedIn (copiar/pegar no arrastra los tags). El workflow entrega los NOMBRES en el bloque del cuerpo **y, aparte, la guía de menciones con los enlaces** (Paso 10) para que el usuario encuentre a la persona/empresa correcta sin confundirse con homónimos.

**Paso 5 — SPAM NINJA (link de agendar) — NO es el cierre:**
> **Las 7 reglas duras están en `global-instructions §4.4b` y son de obligado cumplimiento. Léelas ahí, no de memoria.** Aquí solo lo específico del mapa:
- **Colocación fija: justo DESPUÉS del bloque de menciones.** En este pilar no es "donde quede coherente".
- **Aterriza el dolor en el industrial de ESA región** con un diferenciador de `aboutme §1b`, y gira la palabra del hook para nombrarlo. Validado (Aragón, hook de "secarral"): *"Llamar a 500 a puerta fría para que compre uno. Eso sí que es un secarral."*

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

**Paso 9 — TÍTULO y DESCRIPCIÓN para la web del mapa** (van juntos, los dos siempre):
- **Título — plantilla FIJA, no la reinventes:** `[Región]: el músculo industrial`. Ej.: `Álava: el músculo industrial` · `Aragón: el músculo industrial`. Aquí no toca creatividad: es el formato de la web y se repite mapa a mapa.
- **Descripción de 2 líneas:** corta y concisa, tipo "20 empresas industriales de [región] de los sectores X, Y, Z…". Sin florituras. Sin fechas (`global §3.5b`).

**Paso 10 — Guía de menciones** (fuera del post, para pegar las @ a mano): las 20, para que el usuario encuentre a la persona/empresa correcta sin confundirse con homónimos.
- **NUNCA en tabla markdown.** El usuario la usa línea a línea; la tabla estorba y no se copia bien.
- **Tiene DOS usos y por eso DOS formatos. Da el que toca según dónde la entregues:**
  - **En el CHAT (revisión):** enlaces **CLICABLES** (markdown `[texto](url)`), **fuera** de bloque cercado. Es la única forma de que el usuario abra las 20 fichas de una en una y confirme que la persona sigue ahí, que el cargo cuadra y que es de la región. Dentro de un bloque cercado NO se puede clicar → inservible para revisar.
  - **En un fichero de entrega:** **bloque cercado de texto plano** con las URLs desnudas, para copiar/pegar limpio.
  - Es la excepción a `working-preferences §1` (que pide bloque cercado): esa regla existe porque LinkedIn mangla los saltos del POST, y la guía de menciones no se pega en LinkedIn.
- **Calca el formato y el orden del bloque de empresas del post** (mismas 5×4, mismo orden), pero cambiando cada nombre por su URL. Así cada línea de la guía cae en la MISMA posición que su línea del post y se va bajando a la vez por los dos.
- **Solo las dos URLs, nada más.** Sin cargo, sin fecha de actividad, sin por qué está elegida: en el MAPA no hay que justificar cada ficha (la justificación va aparte, en la lista de "revisa estas"). El nombre ya viaja dentro de la URL.
```
→ linkedin.com/company/… - linkedin.com/in/…
→ linkedin.com/company/… - linkedin.com/in/…
(… 5 bloques de 4, en el orden exacto del post)
```

**Paso 11 — FOTO de portada para la web del mapa** (no es la imagen del post):
- Una foto **icónica y reconocible de la región** (lo primero que a alguien le viene a la cabeza con "Aragón"): capital/skyline, río, monumento o paisaje-marca. Horizontal, ≥1200px de ancho, que funcione recortada como cabecera.
- **🚫 NUNCA "la primera que salga en Google Imágenes".** Casi todo lo que devuelve Google es **material con copyright** (bancos de imágenes, prensa, fotógrafos). Esta foto va a la **web pública de una empresa** = uso comercial: una reclamación es dinero real y llega por burofax. Que sea fácil de coger no la hace libre.
- **Busca solo en fuentes de licencia libre y comprueba la licencia una por una:** **Wikimedia Commons** (usa su API: `action=query&generator=search&gsrnamespace=6&prop=imageinfo&iiprop=url|extmetadata` → lee `LicenseShortName` y `Artist`), Unsplash, Pexels. Sirven: **CC0 / dominio público** (lo mejor: sin obligaciones), **CC BY** y **CC BY-SA** (obligan a atribuir). **NO sirve** ningún **CC NC** (prohíbe uso comercial) ni nada sin licencia explícita.
- **MÍRALA antes de entregarla** (descárgala y ábrela). No entregues una foto por su título: los buscadores devuelven escaneos de libros, cuadros y fotos mal encuadradas mezclados con las buenas.
- **Entrega:** el fichero + la URL de descarga + **licencia y autor listos para pegar**. Si hay una CC0 decente, ofrécela como alternativa aunque la bonita sea CC BY-SA: al usuario le puede compensar no tener que atribuir.
- Validado (Aragón): `Zaragoza Rio Ebro and Catedral-Basílica del Pilar upstream from Puente de Piedra.jpg` (CC BY-SA 4.0, Ymblanter) y la alternativa CC0 `Zaragoza shel.JPG`.

**OUTPUT FINAL del workflow para este pilar (SOLO esto):** (1) el **TEXTO** del post en bloque cercado · (2) el **CSV** listo para importar en PamPam · (3) el **TÍTULO** (`[Región]: el músculo industrial`) + la **descripción de 2 líneas** · (4) la **guía de menciones** en bloque cercado, solo URLs, calcando el orden del post · (5) la **FOTO de portada** de la región con su licencia y autor. Ninguna imagen del POST (esa es la captura de PamPam, la hace el usuario).

**Guardarraíles de elección de región (Paso 0):**
- **⚠️ PREGUNTA PRIMERO PARA QUÉ CUENTA ES.** La región no se elige en abstracto: **las regiones quemadas son POR CUENTA**, no globales. Iker ya hizo Cataluña → Iker no la repite jamás, pero **Unai y Asier sí pueden hacerla**. El plan es que cada cuenta acabe tocando todas las regiones (España se acaba). Mira la cobertura por cuenta en `docs/skills/historial-publicaciones.md` **antes** de proponer nada.
- **El CONCEPTO, en cambio, no se repite NUNCA ni entre cuentas** (medido: "país inventado" 7.87x en Unai → 1.2x al repetirlo Iker). Y si una cuenta hace una región que ya hizo otra, el concepto, el país de comparación y los clichés van **todos nuevos**.
- **Prefiere la COMUNIDAD AUTÓNOMA a la provincia/ciudad** — más alcance. Validado: elegimos Cataluña (no Barcelona); y Álava (provincia) rindió MENOS que País Vasco (comunidad). Baja a provincia solo si tiene identidad muy fuerte y ya tocaste la comunidad.
- Greenlit (comunidades sin tocar): Aragón, Asturias, Murcia, Castilla y León, Castilla-La Mancha, Extremadura, La Rioja, Cantabria, Canarias, Baleares…
- Baneadas: capitales/ciudades obvias (Madrid 0.55x) y cualquier cosa que critique a otra región española.
- ≥2 semanas desde el último mapa de esa cuenta. **Región: no repetir DENTRO de esa cuenta** (otra cuenta sí puede hacerla). **Concepto: no repetir NUNCA, ni entre cuentas** (medido: 7.87x → 1.2x al repetirlo otra cuenta).

### 4.3 · Runbook "LOS 10" (encadenado) — RECETA DEFINITIVA
> **Casi idéntico al mapa (§4.2)** en formato y flujo (hook → cuerpo → menciones → spam ninja → cierre punchy). La diferencia de fondo: **la importancia va a las PERSONAS, no a la región.**
> **Input del usuario:** SOLO la región (o sector) — **si no te la da, pídesela primero** (igual que el mapa). El resto lo verifica y rellena el workflow.
> **Diferencias de OUTPUT vs mapa:** (a) **NO hay CSV** (no se dibuja mapa) · (b) en su lugar, las **10 FOTOS en un ZIP/carpeta, en el ORDEN de mención** (el usuario las mete en SU plantilla de imagen con otra herramienta) · (c) **los 2 PROMPTS de imagen** literales, adaptados a la región (Paso 6b) · (d) el resto igual: texto copy-ready + guía de menciones con enlaces.

**Paso 0 — Región + guardarraíles:** **PREGUNTA PRIMERO PARA QUÉ CUENTA ES** (igual que el mapa, §4.2). Los guardarraíles son los mismos y **todos se miden POR CUENTA**:
- **≥2 semanas desde el último PELOTEO de esa cuenta.** Mapa y "Los 10" son la MISMA categoría a efectos de espaciado: cuentan juntos.
- **Región: no repetir DENTRO de esa cuenta.** Entre cuentas SÍ se puede (si Iker ya hizo "Los 10" del País Vasco, Unai y Asier todavía pueden). Cobertura por cuenta en `docs/skills/historial-publicaciones.md`.
- **Un mapa y un "Los 10" del mismo territorio NO se queman entre sí** — validado: Iker hizo el mapa de Gipuzkoa (12.92x, abril) y "Los 10" del País Vasco (4.81x, junio), 10 semanas después y sin penalización. Son pilares distintos (uno pelotea empresas, el otro personas). Pero **no los pegues en el tiempo**.
- **Concepto y personas: no repetir NUNCA, ni entre cuentas.** Y jamás menciones dos veces a la misma persona en dos "Los 10".

**Paso 1 — HOOK (foco en la persona):**
- Fórmula = **verbo físico + la herida propia del comercial** para que se IDENTIFIQUE al leerlo ("personas desconocidas quemando el teléfono", "aguantando el no", "marcando nombres que nadie conoce") + `👇`.
- El comercial anónimo tiene que pensar "ese soy yo". Nada abstracto.
- **NUNCA crítica ni reproche a las empresas** (eso mató la versión de Cataluña 0.7x y molestó a los mencionados). Este formato PELOTEA a personas y empresas, no las señala.
- **Verbo físico punchy con techo** (`global §2.9`): "quemando el teléfono", "aguantando el no".
- Aplica el resto de reglas de hook (`global-instructions §2` + `swipe-file §3.1`).

**Paso 2 — Las 10 PERSONAS (vía Unipile — como en §4.2, pero personas):**
- **La empresa de cada persona DEBE encajar con nuestro ICP** (`aboutme`): **B2B industrial** (máquina-herramienta, bienes de equipo, automoción, aeronáutica, metalurgia, química, alimentación industrial…) o **servicios B2B**; medianas/grandes (≈100-700 empleados), familiares/founder-led/con directivos visibles, exportadoras. Mismos criterios de empresa que el mapa (§4.2 Paso 4). No metas a alguien de una empresa fuera de ICP aunque sea buen comercial.
- **Criterio de selección = CRECIMIENTO de la empresa en el último año** (el proxy). La lógica: si la empresa ha crecido mucho, su director/equipo comercial es bueno → es a quien queremos pelotear. Elige las 10 empresas ICP que más han crecido y coge a su responsable comercial.
- **Verificación (obligatoria, con fuente pública reciente):** confirma ese crecimiento con noticias/datos públicos del último año. Señales válidas: **facturación/ingresos al alza**, **récord de facturación**, **beneficio neto ↑**, **EBITDA ↑**, **subida de puestos en un ranking**, **% de ventas ↑**, **inversión recibida**, **internacionalización/nueva filial**, **premio**. Cada persona lleva su **logro concreto** citado (ej. `+77% bº (EBITDA +34%)`, `récord €344M`, `€54M → €60M`). Real y verificable, sin polémica; marca los dudosos.
- **Semilla opcional:** `ref_empresas_industriales_pais-vasco.csv` (346 empresas industriales del País Vasco con sector, nº empleados, tier A/B/C, "por qué encaja", señales y fuentes) sirve de punto de partida para el País Vasco. **Aun usándola, verifica SIEMPRE empresa + persona + actividad con Unipile** (no publiques directamente de la lista). Para otras regiones, arranca de cero con los criterios de arriba.
- **Activos en LinkedIn** (últimos 3 meses: post/comentario/repost); si no está activo, se descarta (mención desperdiciada).
- Ordena por probabilidad de interacción / relevancia del logro.
- **Ejecución:** Claude vía Unipile (credenciales de las env vars del entorno "Iker", como §4.2).
- **Formato en el cuerpo:** `→ @Persona - @Empresa · logro concreto` (ej. `→ @Edorta Arriet Azpiroz - @Geminis Lathes · +77% bº`). **Con @ delante de los dos nombres**, igual que el mapa (§4.2 Paso 4): el usuario clica detrás de la arroba y LinkedIn abre el buscador de menciones solo. El logro va DESPUÉS del `·`, sin arroba.
- **⚠️ NOMBRES EXACTOS DE LINKEDIN**, igual que en el mapa (§4.2 Paso 4): copia el `name` de Unipile literal, sin embellecer. Si el nombre no coincide, no salta el autocompletado de la @ y la mención muere.

**Paso 3 — CUERPO** (pelotea a la persona invisible, `swipe-file §3.1`):
- Setup que pinta al que decide de verdad y no sale en la foto (una anáfora tipo "No publica. No da charlas. No sale en la nota de prensa." — **es UNA opción, no la plantilla fija**).
- La **lista de las 10** (`→ @Persona - @Empresa · logro`), con **línea en blanco entre la frase de entrada y la primera persona** (igual que el mapa, §4.2 Paso 4): la frase que presenta la lista va sola, nunca pegada a la primera `→`.
- **Reveal tardío:** "Sí, hablo de [región]. Pero esto va de las personas."
- Eje emocional: "le pongo cara al que estuvo detrás del salto".
- **QUE SE NOTE QUE ES UN POST NUEVO (clave):** mantén la ESENCIA del formato (mismos bloques de 2/3, misma estructura, mismas ideas) pero **cambia las expresiones y sobre todo cómo ABRES los bloques**. No arranques siempre igual — ni todos los bloques con "No publica / No da charlas", ni con "No es por X, no es por Y" (esa anáfora de negación es la del mapa; no la calques). Rota el arranque: unos por verbo, otros por nombre, otros por número, otros por lugar (`working-preferences §4`). Mismo pilar, palabras distintas cada vez.

**Paso 4 — SPAM NINJA:** reglas canónicas en **`global-instructions §4.4b`** (mándalas siempre). Resumen: máx **2 líneas CORTAS**, **NUNCA nombrar a Neety**, chiste con **verbo punchy con techo** que gira el concepto del hook, dolor concreto + diferenciador aterrizado (`aboutme §1b`), colocado **justo después de las menciones** y nunca como última línea. Aquí el giro va al dolor del comercial de la región, no al de la empresa.

**Paso 5 — CIERRE punchy** (bold statement, sin pedir comentarios ni preguntar; §4.2 Paso 6). Ej. "Hoy, al menos, sabes su nombre." Corre la validación (§8).

**Paso 6 — FOTOS de las 10 personas (en vez del CSV):** para cada persona, saca su **foto de perfil de LinkedIn** vía Unipile (endpoint de perfil de persona → campo de foto de perfil, `profile_picture_url`/`picture_url`), descárgala, y entrega las 10 en un **ZIP/carpeta nombradas en ORDEN de mención**: `01_Nombre-Apellido.jpg`, `02_…`, … `10_…`. (El usuario las coloca en su plantilla; nosotros NO montamos la imagen — imagen = orla de retratos, `images §8`.)

**Paso 6b — LOS 2 PROMPTS DE IMAGEN (output fijo, se entregan SIEMPRE).**
El usuario monta la imagen con SU plantilla en otra herramienta y le pasa estos dos prompts. **Van literales, palabra por palabra**: no los reescribas, no los "mejores", no los resumas. Lo único que cambia son los `XXX`. Cada uno en su bloque cercado, para copiar de un clic.

- **`XXX` del PROMPT 1 = el GENTILICIO de la región, no su nombre.** La plantilla dice "LA INDUSTRIA VASCA", así que se sustituye adjetivo por adjetivo: Cataluña → `catalana` · Valencia → `valenciana` · Aragón → `aragonesa` · Navarra → `navarra` · Galicia → `gallega` · Andalucía → `andaluza` · Asturias → `asturiana` · Murcia → `murciana`. Poner el nombre daría "LA INDUSTRIA CATALUÑA".
- **`XXX` del PROMPT 2 = los 10 nombres en ORDEN de mención**, los mismos y en el mismo orden que el bloque del post y que los ficheros `01_…`-`10_…` del ZIP.

```
cambia del segundo titulo la palabra "vasca" por "XXX" y deja luego el titulo centrado ya que la frase será más larga, deja el resto de la imagen intacta solo haz ese cambio
```

```
inserta en los placeholders de las imagenes las fotos de personas en el orden que te paso con sus nombres: XXX solo haz este cambio no suavices las caras ni las deformes insertalas tal cual asegurándote que esta condición se cumple en TODAS las filas ya que sueles insertar las fotos en la primera fila perfectas sin deformar y en la ultima siempre haces lo que quieres (aunque la foto original tenga baja calidad insertala tal cual)
```

**Paso 7 — Guía de menciones con enlaces** (mismas reglas de formato que el mapa, §4.2 Paso 10): **bloque cercado de texto plano, NUNCA tabla**, calcando el orden y el formato del bloque de personas del post pero con URLs en vez de nombres. Aquí el orden es **persona primero** (como en el cuerpo, `→ Persona - Empresa`), y **se mantiene el logro** al final: en este pilar el logro SÍ justifica la ficha (es el criterio de selección) y el usuario lo necesita a mano para responder comentarios. Esa es la única diferencia con el mapa, donde no se justifica nada.
```
→ linkedin.com/in/… - linkedin.com/company/… · logro concreto
(… 10 líneas, en el orden exacto del post)
```

**OUTPUT FINAL (SOLO esto):** (1) el **TEXTO** del post copy-ready · (2) el **ZIP con las 10 fotos** en orden de mención · (3) la **guía de menciones con enlaces** · (4) **los 2 PROMPTS de imagen** literales con sus `XXX` rellenos (Paso 6b). **Sin CSV** y sin montar la imagen: eso lo hace el usuario con su plantilla.

### 4.4 · Runbook MEME (REMIX de una referencia) — receta definitiva
> **Input del usuario:** SIEMPRE un **enlace a un post-meme de LinkedIn** de referencia (un caso de éxito). **Si no te lo pasa, PÍDESELO por chat antes de nada.**
> **Output final:** (1) el **TEXTO** del post copy-ready + (2) un **PROMPT de modificaciones para la foto** (Claude **NO genera la imagen**; el usuario la edita a partir de la referencia).
> **Prioridad:** la FOTO es el motor. El texto (gancho + cuerpo) va **corto**.

> ## ⚖️ QUÉ SE CALCA Y QUÉ NO (leer antes del Paso 0)
> "Fiel a la referencia" **no** significa copiarlo todo. Se calca la **ESENCIA**; el **formateado siempre es nuestro**. Si ser fiel te obliga a romper nuestras reglas, **ganan las nuestras** (es la regla de oro de §0: las skills de datos mandan sobre este archivo).
>
> | Se calca A MUERTE (es el motor) | Manda SIEMPRE lo nuestro (es el envase) |
> |---|---|
> | La **mecánica del GANCHO** (Paso 2) | **Formateado:** bloques de 2/3, línea individual detrás, líneas cortas, el cierre respira (`global §3.2-§3.3`) |
> | La **IMAGEN**: layout, paneles, estilo de dibujo, mecánica cómica (Paso 6) | **Puntuación anti-IA:** cero guion largo, cero coma antes de "y" (`brand-voice §3`) |
> | La **temática y el esqueleto del cuerpo**: sus etiquetas, su orden (Paso 3) | **Ancla de ventas** y **verbo con techo** (`global §2.3`, `§2.9`) |
> | La **emoción**: contraste, curiosidad, reto (`outliers-database §3.9c` Paso 5) | **Spam ninja** (`global §4.4b`) y la jerga vetada del hook |
>
> **El caso real (2026-07-14):** la referencia del meme del perro venía **sin un solo salto de línea**, ocho líneas seguidas de corrido. Calcarla al pie de la letra habría sido entregar un parrafazo ilegible. Se calcó su esqueleto (`Realidad: / LinkedIn: / Traducción: / Pero hey… / PD:`) y se le metieron **nuestros** saltos: el bloque de etiquetas junto (es enumeración paralela, `§3.3` unidad c) y aire entre secciones.
>
> **La pregunta que lo resuelve siempre:** ¿esto que estoy copiando es lo que hizo volar al post, o es solo cómo lo tecleó su autor? Lo primero se calca. Lo segundo, ni de broma.

**Paso 0 — Conseguir la referencia:** accede al enlace y extrae (a) el **TEXTO** del post (gancho/1ª línea + cuerpo) y (b) la **FOTO**.

**Paso 1 — Traducir (si está en inglés, que es lo habitual):** EN→ES **fiel al original** en formato, longitud y estructura, pero con **expresiones naturales en español** donde suenen mejor (no traducción literal robótica).

**Paso 2 — HOOK: ⭐ CALCA LA MECÁNICA DEL GANCHO ORIGINAL, igual que calcas la foto.**
- **El gancho se roba con la misma fidelidad que la imagen.** Si calcas el layout de la foto pero te inventas un gancho nuevo, has tirado la mitad del outlier: el gancho original es parte del motor que lo hizo volar, no un envoltorio.
- **Método:** escribe en una frase QUÉ hace el gancho original (su mecánica), y reprodúcela. Ej. real: *"LinkedIn es mágico ✨"* = **afirmación corta, irónica, sobre la herramienta, que monta el marco sin destripar el chiste**. El remix mantiene esa mecánica (corta + irónica + sobre la herramienta) y cambia la piel a ventas: *"Tu CRM resucita clientes muertos ✨"*.
- **Mismo o mejor, nunca distinto.** "Mejor" = el verbo sube un peldaño (`global §2.9`) y se ancla a ventas (`§2.3`). "Distinto" = un gancho tuyo pegado a una foto ajena.
- ❌ **Fallo real (2026-07-14):** referencia con gancho *"LinkedIn es mágico ✨"* y el remix salió *"Tu cliente no te cogió el teléfono. El CRM lo asciende a oportunidad en fase avanzada 👇"*. Largo, específico, destripa el chiste que cuenta la foto y no se parece en nada al original. El validador dio 17/17 porque **esto el script no lo ve**: es criterio.
- **Si el gancho original no lleva 👇** (muchos memes cierran con un emoji irónico o un punto), no se lo metas a la fuerza: la fidelidad manda sobre la convención. Validado: "Subir en ventas siempre pasa factura." (13.52x) cierra con punto.
- **Itera VERBOS** hasta el más punchy **sin perder el significado original** (escalera y techo: `global-instructions §2.9`).
- Aplica TODAS las reglas de hook (`global-instructions §2` + `swipe-file`): bloque único ≤210, imagen mental, ≤1 número, corto.
- **Ancla a VENTAS siempre**, aunque la referencia no vaya de ventas: desde el lado de vender, del cliente o del comercial. Amplifica el alcance al máximo sin perder la esencia de ventas.

**Paso 3 — CUERPO: fiel al original en ESTRUCTURA, no solo en tono.** Copia su esqueleto etiqueta por etiqueta y cambia solo el contenido. Ej. real: si el original va `Realidad: / LinkedIn: / Traducción: / Pero hey… / PD:`, el remix va `Realidad: / CRM: / Traducción: / Pero oye… / PD:`. **Escribir un cuerpo propio "en el mismo espíritu" NO es calcar: es otro post.**
- **Longitud: la del original.** La regla de 3-6 líneas es el DEFAULT del pilar; si la referencia tiene 10 líneas cortas, el remix tiene 10 líneas cortas. Manda la fidelidad.
- Adaptado a ventas B2B (`§2.3`), pero sin destripar el chiste que cuenta la foto: el texto monta el marco, la foto remata.
- **Roles de trabajadores:** sin anglicismos ni títulos complejos. Español genérico que un **industrial de 50+ entienda** (comercial, jefe de ventas, director comercial, gerente…) — lo más genérico = más alcance. (Mismo criterio en la foto, Paso 6.)

**Paso 4 — SPAM NINJA:** reglas canónicas en **`global-instructions §4.4b`** (mándalas siempre). Máx **2 líneas CORTAS**, **NUNCA nombrar a Neety**, chiste con **verbo punchy con techo** que gira el concepto del hook, dolor concreto + diferenciador aterrizado (`aboutme §1b`), nunca última línea. Aquí no hay menciones, así que va en el punto más natural del cuerpo — y ojo: el cuerpo del meme es de 3-6 líneas, así que el spam ninja **no puede comerse el post**. Validado: el iMessage "El de Ventas" (7.9x · 80.9K) llevaba link de agendar en spam ninja sin matar alcance.

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
> **⛔ Diferencia clave con los otros pilares: NO lleva spam ninja. Es la ÚNICA excepción y no se "arregla".** El CTA de comentar ES el cierre (regla del UNO). Meter el link de agendar aquí **apila dos CTAs**: el lector que iba a comentar duda entre comentar o clicar, y el conteo de comentarios —que es TODO el motor del formato (632 com. vibe prospecting · 483 desmonto perfiles)— se hunde. El resto de reglas de spam ninja viven en `global-instructions §4.4b`; aquí NO aplica ninguna. Si algún día se prueba, es un A/B consciente con expectativa de caída, no el default.
> **Output (TRES piezas, no una):** (1) el **TEXTO** copy-ready · (2) una **recomendación de imagen** (registro personal/founder: **foto natural real, selfie o foto en grupo con compañeros** — NO caricatura ni diseño elaborado; `images §3`. El mejor del histórico, 8.52x, lleva un selfie de oficina) · (3) el **PROMPT PARA EL PROGRAMADOR** con el gate y el recurso de `recursos.neety.com` → **carga la skill `lead-magnet-web` y sigue su §5**. Sin CSV, sin ZIP, sin spam ninja.
> **El post NO es el lead magnet entero.** El post consigue el comentario; el dinero está en la página: gate que regala un poco + pide el correo → recurso que resuelve el PASO 1 → secuencia de emails → demo. Si entregas solo el texto, has hecho medio trabajo.

**Paso 0 — Input:** la idea/recurso a regalar. Si no te la da, pregúntale qué entregable quiere.

**Paso 1 — ⚠️ NO hay puerta de frecuencia (revisado 2026-07-14).** Aquí había una que pedía ≥2 semanas por cuenta y avisaba de "fatiga". **La BD la desmiente:** Iker publicó lead magnet el 27-may (0.59x) y otro el 28-may (**8.52x · 483 com.**), días consecutivos y misma cuenta. Detalle y los 5 flops de junio explicados uno a uno en `global-instructions §4.4` puerta 1.
**Lo que SÍ se comprueba antes de escribir:** que el ÁNGULO no se parezca al del último lead magnet de esa cuenta y que la PALABRA del CTA no se repita. El calendario no es el problema; el ángulo sí.

**Paso 2 — ÁNGULO ORIGINAL (aquí se gana o se pierde):**
- El entregable = **UNA cosa concreta y específica**. El genérico "toda mi biblia / todos mis recursos en una caja" está **MUERTO** (biblia 1.2x): comentan poco y LinkedIn no amplifica.
- **Evita temas quemados:** "plantillas de mensajes", "los mejores recursos", cosas que TODO el mundo regala → nadie comenta porque ya lo han visto mil veces.
- **Busca el ángulo fresco en la competencia** (ahora con acceso a la DB): mira lead magnets outlier en `/api/analysis/cross-creators` y en otros nichos (no solo ventas) para encontrar mecánicas originales que aún no estén quemadas en nuestro sector. Los ángulos se queman rápido → esto se investiga en cada post, no se hardcodea.

**Paso 3 — HOOK (lo más crítico del formato):**
- Tiene que **frenar el scroll** y, sobre todo, **pintar una imagen física/visual** (acción concreta sobre un objeto): "le tiré las **llaves** de mi LinkedIn a Claude" (tirar un objeto) genera un frame mental. `global-instructions §2.2`.
- ⚠️ **Corrección (BD en vivo, 2026-07-14):** aquí ponía que el de las llaves "fue el mejor". **No lo es.** Lo publicaron las dos cuentas y se quedó en **4.10x (Iker, 232 com.)** y **4.52x (Unai, 285 com.)**. Los que reventaron de verdad: **"vibe prospecting" 9.85x · 632 com.** (urgencia + bandwagon) y **"desmonto perfiles" 8.52x · 483 com.** (entrega LIVE). La imagen física del gancho ayuda, pero lo que dobla los comentarios es el **MECANISMO** (entrega live > PDF, urgencia), no el objeto del hook. No sobreoptimices el gancho a costa del mecanismo.
- **Original** (no un hook visto mil veces), corto, anclado a ventas, ≤1 número, `👇`.
- **Verbo punchy con techo** (`global §2.9`): "le **tiré** las llaves a Claude" (tirar).
- **El hook lleva una PALABRA-gancho con gracia** que luego será la palabra a comentar (ver Paso 5). Ej.: hook "para mandar buenos mensajes tienes que ser **psicólogo**" → palabra = "psicólogo".

**Paso 4 — CUERPO (corto):**
- **CORTO:** no un ensayo. Un setup breve del problema + **~5 bullets de "lo que te vas a encontrar dentro"** y poco más. La mayor parte del peso está en el hook y el CTA, no en el cuerpo.
- **TEASEA, NUNCA DESVELES el contenido:** los bullets dicen QUÉ se va a cubrir (el titular de cada cosa), pero **NO dan la respuesta/el contenido** — si lo desvelas, ya no hay razón para comentar. Se mantiene el curiosity gap: el contenido está DENTRO del recurso, que se consigue comentando. (Ej.: "✅ Cómo convertir tu banner en una máquina de leads" — dice qué, no cómo.)
- Formateado completo (bloques de 2/3, líneas sueltas, staccato) y voz `brand-voice`.
- **NO repitas las mismas expresiones** de otros lead magnets: que se note que es un post NUEVO (varía arranques y comodines, `working-preferences §4`).
- **Entrega LIVE en comentarios** (audit/roast/consejo one-liner público) bate al PDF (desmonto perfiles 8.5x/483 com.) — la recompensa pública e inmediata dispara el loop de comentarios. Sanity: el entregable live tiene que dar VALOR REAL, no ser un chiste a costa del que comenta.
- **NADA de spam ninja / link de agendar aquí.**

**Paso 5 — CTA (crítico, fórmula exacta):**
- Literal y explícito: **`Comenta "[PALABRA]" + [tu sector/departamento] y te lo paso`**.
- **PALABRA** = la que remata la gracia del hook (psicólogo, llaves, vibe, desmonta…). Si el CTA no reconecta con el chiste del hook, pierde fuerza.
- **+ sector/departamento** = el añadido que varía por persona (cada uno trabaja en un sector/depto distinto) → cada comentario es único y LinkedIn no lo nerfea por spam. Preferimos **sector/departamento** (mundo empresarial/ventas) antes que "día favorito / mes de cumple" (descartados: no encajan con el tono).
- **Di SIEMPRE la palabra "Comenta" de forma explícita.** FAIL confirmado: cuando pusimos formas implícitas (rollo *si lo quieres, "[palabra]"*) la gente **no entendía que tenía que comentar** y se hundió el conteo. Nada de implícitos.

**Paso 6 — LA PÁGINA DEL RECURSO (`lead-magnet-web`, obligatorio).** Carga la skill `lead-magnet-web` y entrega el **prompt para el programador** (su §5) con el gate y el recurso.
La regla que más se falla, de su §1: **ni todo ni nada.** Regalar todo en el gate = no hay motivo para dejar el correo. Formulario pelado sin regalar nada = nadie paga por adelantado. **Hay que regalar UNA MUESTRA antes del formulario.** Y el recurso resuelve el **paso 1**, no todo el camino: da el QUÉ y vende el CÓMO, que es donde entra Neety.

**Paso 7 — Validación (§8) → entregar las 3 piezas: TEXTO copy-ready + recomendación de foto + prompt del programador.**

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
- **Rota semana a semana** quién hace qué (que no salga idéntico).
- **⭐ Dentro de PELOTEO, cada cuenta ALTERNA semana a semana: mapa → "Los 10" → mapa → "Los 10"…** Si la semana pasada esa cuenta sacó mapa, esta semana le toca "Los 10", y al revés. **Esa alternancia ES lo que produce el espaciado de ≥2 semanas entre mapas** (§8.3): no hay que calcularlo aparte, sale solo. Cambia siempre región/tema.
- **La única regla dura entre semanas es POR CUENTA: que no repita el mismo pilar que ella misma sacó la semana pasada.** No hay regla de "una sola cuenta por pilar y semana".
- **SÍ pueden coincidir dos cuentas en el mismo pilar la MISMA semana** (p. ej. Unai y Asier con "Los 10"). Con 3 cuentas alternando es inevitable y **no pasa nada**: lo que está prohibido es coincidir el mismo **DÍA** en la misma **categoría**, y de eso ya se encarga el cuadro latino (peloteo es una sola categoría, así que dos peloteos caen por fuerza en días distintos). Si dos cuentas hacen "Los 10" esa semana, que sean **regiones distintas** y **personas distintas**.

### 8.3 · Guardarraíles de espaciado (entre semanas) → vía el HISTORIAL
> **Todo se mide POR CUENTA.** Ninguna de estas reglas es global entre cuentas.
- **Mapa:** ≥2 semanas entre mapas de la MISMA cuenta — **lo cumple solo si respetas la alternancia mapa/"Los 10" de §8.2**, no hace falta contar nada. Nunca dos semanas seguidas de mapa en la misma cuenta. **No repetir región EN ESA CUENTA** (la cobertura por cuenta está en `docs/skills/historial-publicaciones.md`; entre cuentas sí se puede repetir región, pero nunca el concepto).
- **Lead magnet:** ≥2 semanas por cuenta; nunca dos seguidos ni solapar dos cuentas el mismo día.
- **Mecanismo:** el planificador LEE el archivo **`historial-publicaciones.md`** (registro vivo) al empezar, respeta el espaciado a partir de él, y **añade la semana nueva** cuando la apruebas. Hay que **commitear** ese archivo cada vez que cambie para que el historial no se pierda. Si el historial está vacío o desactualizado, el workflow **te pregunta** qué hizo cada cuenta las últimas 2 semanas antes de asignar.

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
- **La imagen en sí:** el párrafo/prompt de imagen es el entregable y la generas tú. **No hay que pedirlo aparte** — el concepto de imagen sale del propio runbook del pilar.

---

## 9 · Cerrar el bucle: medir y aprender (después de publicar)
El sistema no termina al entregar el post. Para que mejore con el tiempo:
1. **Registrar el resultado:** cuando un post lleva unos días, apunta en `historial-publicaciones` su **ratio real** (y likes/comentarios/reposts). Así el planificador tiene datos frescos y el espaciado sigue teniendo sentido.
2. **Destilar el aprendizaje:** si un post **rompe** (muy por encima) o **flopea** (muy por debajo) de lo esperado, saca UNA frase de aprendizaje y proponla para la skill que toque (`outliers-database §4` si es un ratio/patrón, `swipe-file` si es un molde de texto, `global-instructions` si es una regla nueva). No lo dejes solo en la memoria de la conversación.
3. **Persistir:** el aprendizaje solo cuenta si se guarda en el archivo y se **commitea**. Memoria ≠ archivo (ver README, flujo de actualización).
4. **Refrescar los ratios:** cada 1-2 meses, reexporta "Top posts" y el Explorer y actualiza §4 y §3 — los ratios decaen y las mecánicas se queman.
