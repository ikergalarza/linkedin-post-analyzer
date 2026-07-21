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

### 4.0b · ⭐ MAPA vs "LOS 10": criterios de selección OPUESTOS (2026-07-17)
> Los dos son PELOTEO y los dos mencionan empresas y personas, así que es fácil mezclarlos. **Lo que se busca en cada uno no se parece.**

| | **MAPA** | **"LOS 10"** |
|---|---|---|
| **El protagonista** | La **EMPRESA** | La **PERSONA** |
| **Criterio** | Que encaje con **nuestro ICP** (`aboutme`): industrial B2B, 100-700 empleados, exportadora | Que su empresa esté **CRECIENDO** en el último año, con logro verificado |
| **Filtro común** | De esa región · persona **activa** (<3 meses) | De esa región · persona **activa** (<3 meses) |
| **¿Importa el crecimiento?** | **NO** | **SÍ, es el criterio entero** |
| **¿Importa el encaje ICP?** | **SÍ, es el criterio entero** | Sí, pero manda el crecimiento |

**⚠️ EL ERROR QUE YA SE COMETIÓ (Cataluña):** llegó un aviso de que Esteban Espuña *"sigue en pérdidas, y mencionarla en un post de empresas que van bien es un riesgo"*, y estuve a punto de cambiarla. **Es aplicarle a un mapa el criterio de "Los 10".** El mapa no dice que vayan bien: dice que **sostienen la industria de esa región**. Una empresa puede tener un mal año y seguir siendo un exportador industrial de manual. Sus cuentas no son el criterio de este pilar.
- **En el MAPA no se pide ni un logro ni una cifra por empresa.** Por eso su bloque es `→ @Empresa - @Persona`, sin `· logro`: no hay que justificar nada (`§4.2` Paso 10).
- **En "LOS 10" el logro ES la ficha**, y por eso ahí sí va (`→ @Persona - @Empresa · logro`) y por eso ahí sí se descarta a quien decrece.

### 4.0c · ⭐ REPETIR REGIÓN: la lista NUNCA repite empresa, y si no llegan 20, van 16 (2026-07-17)

Aplica al **MAPA y a "LOS 10" por igual**. Una región se puede repetir. **Una empresa no.**

**LA REGLA.** Si vas a hacer un peloteo de una región que ya hemos tocado, **ninguna empresa ni persona de tu lista puede haber salido en NINGÚN post anterior de esa región**. Cruza contra:
- los **mapas** anteriores de esa región,
- los **"Los 10"** anteriores de esa región — **el otro formato también cuenta**,
- y **todas las cuentas**, no solo la que publica.

**POR QUÉ, que es lo que hace que no se negocie:** el peloteo no existe para tener razón sobre una región, existe para que **empresas NUEVAS de esa región nos conozcan**, porque son clientes potenciales. Repetir empresa es gastar una plaza en alguien que ya nos vio. El post te sale igual de bonito y no te trae a nadie nuevo.

**SI NO LLEGAS A 20, NO RELLENES: BAJA A 16.** Un bloque menos (4×4 en vez de 5×4). Pierdes 4 menciones de alcance y no pasa nada. **Lo que no vale es completar con repetidas, y lo que tampoco vale es no publicar.** Busca las 20 siempre, en serio y con fuentes locales, pero si la región está exprimida, 16 nuevas baten a 20 con 4 recicladas. Y si tampoco llegas a 16, ese es el aviso de que esa región ya está agotada para ese formato: cambia de región.

**CÓMO SE COMPRUEBA (no lo hagas a ojo):** baja los posts de las 3 cuentas, quédate con los que mencionan esa región, saca sus líneas `→` y cruza tu lista **normalizando** — sin acentos, en minúscula y sin sufijos legales (`SA`, `SAU`, `SL`, `Group`, `Grupo`). Sin normalizar se cuela "Bioibérica" contra "Bioiberica" y "Prefabricados Pujol" contra "Prefabricats Pujol". Medido en Cataluña el 2026-07-17: **83 empresas y personas ya mencionadas** entre el mapa de Iker y el "Los 10" de Unai. Eso es lo que hay que esquivar, y a ojo no se esquiva.

**⚠️ Y LO CARO NO ES LA REGLA, ES LA BÚSQUEDA.** Cuando falten empresas, el reflejo es dar la región por agotada. En Cataluña un investigador devolvió *"0 de Girona, ninguna pasó el listón"* y **era falso**: buscando "Cataluña" a nivel autonómico, Barcelona se come los resultados. Atacando fuentes locales (el ranking provincial, el directorio del polígono de Riudellots, la prensa comarcal) salieron 8 gerundinas a la primera. **Antes de bajar a 16, busca por provincia y con prensa local.**

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
   - **Meme:** **prompt de modificaciones** sobre la referencia (`§4.4` Pasos 6a-6b: primero se inventaría la foto, luego se escribe el prompt).
   - **Lead magnet / personal / founder:** **recomendación de foto natural** (selfie o grupo con compañeros; NO caricatura ni diseño elaborado).
   - **Deseo/números/conversación/métricas:** prompt de **screenshot documental** (iMessage, app del banco, dashboard de LinkedIn con nuestros datos).
   - Vídeo → skill `video`.
8. **Tag de viralidad:** `outliers-database §4` (Neety) primero; §3 solo etiquetado.
9. **Loop = pase de validación en silencio** (`global-instructions §8`): autocrítica hasta pasar el listón.
10. **Entrega:** 2-3 variantes en bloques cercados (`working-preferences §1`); empresas/menciones rellenas y marcadas (§4.0); lista de "revisa estas"; y **di qué esperas del usuario** para el siguiente paso.

### 4.2 · Runbook MAPA REGIONAL (encadenado) — RECETA DEFINITIVA
> **Input del usuario:** SOLO la región — **si no te la da, pídesela primero.** Todo lo demás (país de comparación, cifras, empresas, personas) lo verifica y rellena el workflow.
> **Output final (solo esto):** (1) el **TEXTO** del post copy-ready · (2) el **CSV** para importar en PamPam · (3) el **TÍTULO** y la **descripción de 2 líneas** para la web del mapa · (4) la **guía de menciones** (en el chat: enlaces CLICABLES fuera de cercado, Paso 10) · (5) una **FOTO de portada de la región** para la web del mapa (Paso 11).
> **Ojo, son DOS imágenes distintas y solo una la das tú:**
> - **Imagen del POST** = captura de la web PamPam → **la hace el USUARIO**. El workflow NO la genera ni la describe. (Por eso el mapa NO usa la skill `images`.)
> - **Foto de portada de la WEB del mapa** = foto de la región → **la entrega el workflow** (Paso 11).

**Paso 1 — Iterar el GANCHO** (estructura archi-probada, ver `swipe-file §2.1`). Empieza SIEMPRE por aquí. Fórmula:
`[concepto original despectivo/gracioso de la zona] + [2-3 clichés locales] + [frase-rabia entre comillas] . Y exporta más que [PAÍS] entero 👇`
- **Concepto: DERIVADO DE LA GEOGRAFÍA de la región** (su posición en el mapa, accidentes geográficos, fronteras). Nunca "región/pueblo/tierra". Así lo hemos hecho siempre: Galicia = "la esquina del Atlántico" (arriba a la izquierda), Álava/País Vasco = "la trastienda del norte" (arriba, la olvidada del norte), Navarra = "el patio trasero de los Pirineos" (frontera con Francia). Inventa uno original y geográfico por región; no repitas concepto usado.
- **⚠️ NO criticar otras regiones/ciudades ESPAÑOLAS.** Estos posts buscan **HERMANDAD entre regiones, no dividir el país** (igual que nunca hablamos mal de otra empresa, tampoco de otra región). **Prohibido nombrar/pinchar a Madrid, Barcelona u otras ciudades/regiones españolas** en el concepto o el hook. El "desprecio" es (a) **auto-despectivo** de la propia región (sus clichés) o (b) apoyado en una **frontera extranjera** (los Pirineos están entre España y Francia → "patio trasero de los Pirineos" vale). Nada de "la sala de espera entre Madrid y Barcelona" ni "para media España": genera conflicto entre regiones.
- **⭐ Clichés del GANCHO: los 2 más UNIVERSALES que tenga la región. Los específicos van al CUERPO** (2026-07-17).
  - **El gancho lo lee TODO el mundo; el cuerpo solo el que ya ha pulsado "ver más".** Cada palabra que un señor de Cuenca no entiende es fricción en el sitio donde más cara sale. `pan con tomate` y `playa` los pilla toda España; `calçots` y `cava` no, así que esos bajan al cuerpo, donde además identifican mejor porque el que lee ya está dentro.
  - **Es la MISMA regla de `global §2.3`**, que ya decía *"cuanto más genérico el gancho, más lejos llega; la especificidad va en el cuerpo"*. Aquello se escribió para la jerga de ventas (CRM, ICP); esto lo extiende al vocabulario regional. Mismo principio, otro eje.
  - ⚠️ **Esto NO está probado con datos, y conviene saberlo.** Los ganchos con clichés universales (Galicia `pulpo y el Camino` 7.29x · Valencia `playa y paella` 6.77x) baten a los locales (Álava `pintxo-pote` 3.59x · Aragón `jota, Pilar y ternasco` 2.53x)… **pero todos los universales son de Iker y todos los locales son de Unai y Asier**. Está confundido con la cuenta: los 3 mapas de Unai caen entre 3.2x y 3.7x hagan lo que hagan, y los 6 de Iker entre 5.4x y 12.9x. **La comparación limpia exige la MISMA cuenta.** Se adopta por coherencia con §2.3 y porque no cuesta nada, no porque el dato lo diga.
  - Los clichés siguen siendo de ESA región (Sevilla → feria y playa; Valencia → paella y Fallas): universal no es genérico, es que se entienda fuera.
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
- **⭐ Logo de cada empresa (para el CSV) — EL CAMPO ES `logo_large`, verificado 2026-07-17:**
  ```
  GET {BASE}/api/v1/linkedin/company/{id}?account_id={A}   →   logo_large
  ```
  Devuelve una URL de `media.licdn.com/dms/image/…/company-logo_400_400/…`. Esa URL va **tal cual** en la columna **`Media`** del CSV (Paso 8). Medido en Cataluña: **16 de 16**, ninguna en blanco.
  - **UNA EMPRESA NO SE SACA COMO UNA PERSONA.** Son dos endpoints y dos campos distintos, y confundirlos devuelve vacío:
    | | endpoint | campo |
    |---|---|---|
    | **EMPRESA** | `/api/v1/linkedin/company/{id}` | **`logo_large`** |
    | **PERSONA** | `/api/v1/users/{id}` | `profile_picture_url_large` |
  - **⚠️ Este Paso decía `logoUrl` o `pictureUrl` y NINGUNO DE LOS DOS EXISTE.** Por eso el CSV de Cataluña se entregó el 2026-07-17 con la columna `Media` vacía en las 16 filas y lo pilló el usuario: la regla estaba escrita, pero con un nombre de campo inventado, así que cumplirla al pie de la letra daba vacío igual. **Un nombre de campo no se escribe de memoria: se comprueba contra la API y se anota el día que se comprobó.**
  - No uses favicons de la web oficial: salían en blanco.
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
- **⭐ Logo → columna `Media`, la ÚLTIMA, y NUNCA se entrega vacía.** Pega ahí el **`logo_large`** de cada empresa (Paso 4). Es la columna que el usuario mira primero, y **el CSV de Cataluña se entregó con las 16 vacías** (2026-07-17). Referencia real: `mapa_aragon_pampam.csv` en el Escritorio, donde `Media` lleva `https://media.licdn.com/dms/image/v2/…/company-logo_400_400/…`. NO uses favicons de la web (salían en blanco). `Sticker` = 🏢.
- **Antes de entregar el CSV, cuenta las filas con `Media` no vacío y dilo en la entrega** (`16/16 con logo`). Si alguna se queda sin logo, va marcada y avisada — en Aragón se coló una vacía sin avisar.
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
**Así en el CHAT** (suelto, sin cercar, para que se renderice y se pueda clicar):
`→ [Empresa](https://www.linkedin.com/company/…) - [Persona](https://www.linkedin.com/in/…)`

**Así en un FICHERO** (cercado, URLs desnudas):
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

**OUTPUT FINAL del workflow para este pilar (SOLO esto):** (1) el **TEXTO** del post en bloque cercado · (2) el **CSV** listo para importar en PamPam · (3) el **TÍTULO** (`[Región]: el músculo industrial`) + la **descripción de 2 líneas** · (4) la **guía de menciones** con enlaces CLICABLES fuera de cercado (Paso 10), calcando el orden del post · (5) la **FOTO de portada** de la región con su licencia y autor. Ninguna imagen del POST (esa es la captura de PamPam, la hace el usuario).

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
- **NUNCA crítica ni reproche a las empresas.** Regla precisa y su evidencia en el **Paso 3d** — no basta con "que no suene mal": lo que se prohíbe es que la **empresa sea el sujeto** que tapa a la persona.
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

**Paso 3b — CLICHÉS + REVEAL (importado del mapa, va DESPUÉS de la lista):** el hueco está entre la lista y el reveal, y el 4.81x del País Vasco ya lo usaba (txoko, caserío, cooperativa) pero solo con 2 clichés. **Satúralo con 4-8 tejidos** (`global §4.1` regla 2): el cliché es lo que hace que el local repostee para defender a los suyos, y esa es la carencia medida de este pilar — el "Los 10" del País Vasco sacó **12 reposts** frente a los 46 de Navarra, 60 de Galicia y 90 de Gipuzkoa. Los dos motores no compiten: la identificación del comercial abre el post, el orgullo regional lo reparte.
- Mete aquí el **concepto despectivo original + "y poco más"** (`global §4.1`). **La región NO se nombra hasta el reveal**: los clichés van todos antes y solos ya la insinúan, igual que en el hook del mapa ("el patio trasero de los Pirineos" nunca dice Navarra).
- ⛔ **DEL MAPA SE IMPORTA EL CLICHÉ, NO EL SHOCK CONTRA UN PAÍS.** Nada de "exporta más que Bolivia entera" ni ninguna cifra regional. Motivos, por orden: (a) **la prioridad de este pilar son las PERSONAS**, y en el gancho ni se menciona un país, así que meterlo en el cuerpo lo descentra; (b) **canibaliza el mapa** — es su firma, y lo que hace que un mapa y un "Los 10" del mismo territorio no se quemen entre sí es justo que uno pelotea empresas y el otro personas (`historial-publicaciones`); (c) **alarga el cuerpo después de la lista**, que es donde el post ya va cuesta abajo; (d) el **País Vasco 4.81x no llevaba NI UNA cifra regional**. El único dato numérico de este pilar es el **logro de cada persona** en su ficha. Corregido el 2026-07-15: la primera versión de este Paso 3b lo permitía "si tienes el dato verificado" y el usuario lo tumbó.
- ⚠️ **Nunca en registro de reproche a las empresas** (lo que mató a Cataluña 0.66x). El cliché va contra el tópico de fuera, no contra la empresa que no reconoce a nadie. Regla exacta y evidencia: **Paso 3d**.
- **⭐ Justo DESPUÉS del reveal, nombra ciudades Y pueblos** (`global §4.1` regla 2b). No solo la capital: es una queja real de nuestros comentarios. **Sácalos de las sedes de tus 10 empresas**, que ya están verificadas, así no inventas nada. Asturias: *"Y no salen todos de Gijón ni de Oviedo. Salen de Tineo, de Llanera, de Castropol y del puerto de Avilés."* Es el mismo hueco donde el mapa pone *"De Pamplona a la Ribera"*.

### Paso 3d — ⭐ EL SUJETO QUE TAPA A LA PERSONA NUNCA ES LA EMPRESA (2026-07-17)

Este pilar es el único que menciona a alguien **por su mérito personal dentro de una empresa que no es la nuestra**, y eso genera peticiones de retirada por privado. Van 3 posts y 2 peticiones. Lo que sigue sale de comparar los tres, no de lo que suena sensato.

| | 1º País Vasco 4.82x | 2º Cataluña 0.66x | 3º Asturias |
|---|---|---|---|
| Quejas | **ninguna** | un trabajador pidió retirar su mención | el CEO pidió retirar empresa Y persona |
| ¿La empresa tapa a la persona? | no | **sí** | no |
| Link comercial | **no** | sí | sí |

**LA REGLA (la única que la evidencia soporta).** La persona invisible **sigue siendo el eje** del pilar. Lo que se prohíbe no es la invisibilidad: es que **la empresa sea quien la causa**. El antagonista tiene que ser algo sin ego y sin capacidad de mandarte un DM — la prensa, el titular, la cifra, el foco, o nosotros mismos.

- ✅ *"A una empresa que crece le **hacemos** fotos por fuera"* (nosotros) · *"no sale en la **nota de prensa**"* (la prensa) · *"nunca le **ponen** el nombre delante"* (impersonal) · *"el número sale en la **prensa**. La persona que lo firmó, casi nunca"* · *"Las cifras ya salieron en la prensa. Los nombres los pongo yo."*
- ⛔ *"El nombre que se dice siempre es **el de la empresa**. Hoy le doy la vuelta."* · *"ninguna empresa vende sola"* · *"el mérito se lo llevan las empresas"* · *"detrás del logo"*.

La diferencia es de sujeto, no de tono. En la columna ✅ la persona no sale por cómo funciona la atención; en la ⛔ hay un despojo con culpable, y el culpable está etiquetado en el post. Lo vigila `validar-post.py --pilar los10` (`EMPRESA_LADRONA`), y los 3 posts están clavados en `scripts/test-validador.py`.

**LO QUE NO SE ARREGLA CON PALABRAS — no lo intentes otra vez:**

1. **La atribución única NO es el problema.** Suena a que sí, y es mentira. El post que más fuerte atribuye a una sola persona (*"las 10 personas que **más han hecho vender**"*, *"esa persona **es la razón por la que la empresa factura** lo que factura"*) es el 4.82x, el único sin una sola queja. El que más suave atribuye (*"los 10 nombres que hay **detrás de** las cifras"*) es el que se comió el DM del CEO. **Anti-correlaciona.** Suavizar la atribución es pagar punchy por nada.
2. **El beat de equipo SÍ va, y es obligatorio. Ver Paso 3e.** (Aquí estuvo escrito lo contrario durante media hora: que ese *"pero esto es trabajo en equipo"* llega en comentarios, o sea alcance, y que escribirlo nos lo quitaba. **El usuario lo corrigió y tenía razón**: es alcance *y* es la crítica más repetida del pilar. El apoyo la envuelve y lo que se queda es la crítica. Contar comentarios no mide el enfado que hay dentro de ellos.)
3. **El link se queda.** La única diferencia limpia entre el post sin quejas y los dos con quejas es que aquel no llevaba spam ninja. La lectura probable: un homenaje que acaba en un enlace convierte a la empresa mencionada en decorado de un anuncio, y un CEO que ve el EBITDA de su empresa ahí no está ofendido, está viendo su marca en publicidad de un tercero — por eso lo exige por privado en vez de comentarlo. Es n=3 y confundido (el 2º además flopeó). **Decisión del usuario, 2026-07-17: el link es el negocio y se queda**, asumiendo el peaje. Si algún día hay un 4º "Los 10", esta es la casilla que hay que mirar primero.
4. **Etiquetamos con @ a la empresa Y a la persona.** Se propuso dejar la empresa en texto plano (etiquetar la página notifica a sus admins, que es la vía por la que llegó el DM) y **el usuario lo tumbó el 2026-07-17**: 2 quejas en 3 posts no justifica tocar un formato que funciona por una inferencia sin medir.
5. **La tasa de quejas no baja a cero, y perseguirlo cuesta rendimiento.** La premisa del pilar (la persona está en la sombra) selecciona a gente que eligió la sombra, y su éxito garantiza que la dirección de su empresa lo vea. El objetivo no es que nadie escriba: es que **quien escriba lo haga por ego y no porque tenga razón**. Contra el ego no hay redacción que valga, y el usuario ya lo tiene asumido: *"no podemos controlar cómo cada uno percibe una publicación"*.

### Paso 3e — ⭐ CONCEDE QUE ES TRABAJO EN EQUIPO (obligatorio, 2026-07-17)

**Es la crítica más repetida de este pilar**, y viene disfrazada de apoyo: *"gracias por dar visibilidad a las personas, **pero** esto es trabajo en equipo"*. Sale sobre todo en la 1ª y la 3ª — las dos que funcionan. Si no lo decimos nosotros, se nos echan encima. **Una línea en el cuerpo dice que no es solo mérito de esas 10 personas.**

**⚠️ EL SUJETO ES LA PERSONA, NUNCA LA EMPRESA.** Aquí está el filo, y es fino:

- ⛔ *"una fábrica no factura sola"* (1º) · *"ninguna empresa vende sola"* (2º) → **suenan** a la concesión y apuntan al revés: dicen que la EMPRESA depende de la persona. Eso es el despojo del Paso 3d, no la concesión.
- ✅ *"Ninguno de estos 10 vendió solo."* · *"Detrás de cada nombre hay una fábrica entera."* · *"No lo firmó solo: detrás había un taller entero."* · *"Cada uno tiene una plantilla detrás."*

**Dónde:** en el **setup, antes de la lista**. Ahí enmarca y el lector nunca llega a formular la objeción; después de la lista solo la corrige, y además alarga el tramo donde el post ya va cuesta abajo (Paso 3b). **Nunca de cierre**: el cierre es el bold statement (Paso 5).

**Cómo no perder punchy:** es una concesión, no una disculpa. No pide perdón por publicar el post ni rebaja a los 10 — reconoce al equipo **y sigue defendiendo que alguien dio la cara**. *"Ninguno de estos 10 vendió solo. Pero alguien tuvo que coger el teléfono el día 40."*

Lo vigila `validar-post.py --pilar los10` (`BEAT_EQUIPO`). **Riesgo asumido:** un check positivo se aprueba barato repitiendo una frase, que es como este mismo script creó el tic de *"En ventas,"*. Por eso hay 4 familias arriba y `working-preferences §4` obliga a no repetir la del "Los 10" anterior. **Si en 3 posts sale la misma frase, el tic ya está aquí.**

**Paso 4 — SPAM NINJA:** reglas canónicas en **`global-instructions §4.4b`** (mándalas siempre). **En este pilar va después del REVEAL, no "justo después de las menciones"** (el orden es lista → clichés → reveal → spam ninja → cierre): el reveal es lo que cierra el bloque de la lista, y meter el link antes lo parte. Resumen: máx **2 líneas CORTAS**, **NUNCA nombrar a Neety**, chiste con **verbo punchy con techo** que gira el concepto del hook, dolor concreto + diferenciador aterrizado (`aboutme §1b`), colocado **justo después de las menciones** y nunca como última línea. Aquí el giro va al dolor del comercial de la región, no al de la empresa.

**Paso 5 — CIERRE punchy** (bold statement, sin pedir comentarios ni preguntar; §4.2 Paso 6). Ej. "Hoy, al menos, sabes su nombre." Corre la validación (§8).

**Paso 6 — FOTOS de las 10 personas (en vez del CSV):** para cada persona, saca su **foto de perfil de LinkedIn** vía Unipile (endpoint de perfil de persona → campo de foto de perfil, `profile_picture_url`/`picture_url`), descárgala, y entrega las 10 en un **ZIP/carpeta nombradas en ORDEN de mención**: `01_Nombre-Apellido.jpg`, `02_…`, … `10_…`. (El usuario las coloca en su plantilla; nosotros NO montamos la imagen — imagen = orla de retratos, `images §8`.)

**Paso 6b — LA ORLA: la monta un SCRIPT, no el robot de diseño (2026-07-16).**
```
python scripts/montar-orla.py   --plantilla "C:/Users/LENOVO/Documents/Mario/LINKEDIN GROWTH/LOS 10/LOS 10 PLANTILLA v2.psd"   --fotos "C:/Users/LENOVO/Desktop/los10-<region>"   --fuente "C:/Users/LENOVO/Documents/Mario/LINKEDIN GROWTH/Bricolage_Grotesque/static/BricolageGrotesque-ExtraBold.ttf"   --nombres "Nombre 1 | Nombre 2 | … | Nombre 10"   --salida "C:/Users/LENOVO/Desktop/orla-<region>.png"
```
**Por qué se cambió, que es lo que no hay que olvidar:** los 2 prompts de imagen que había aquí **NO se podían arreglar escribiéndolos mejor**. Un modelo generativo no pega una foto, la **REDIBUJA**: sintetiza píxeles nuevos en todo el lienzo. Por eso devolvía caras que no eran de esas personas, cambiaba el color de los ojos, convertía las fotos malas en fotos de modelo, metía ruido en el azul del header y lo descentraba. **No era un fallo de prompt: era lo único que sabe hacer.** Cada "no toques" que le añadías alargaba el prompt y le hacía menos caso a todo.
- El script detecta **solo** los huecos transparentes, escala con Lanczos (que reduce información, no la inventa), recorta centrado y pone la foto **DEBAJO** con la plantilla encima: la máscara del círculo es la que dibujó el diseñador. Los nombres, la fuente, el cuerpo y el color se **leen del propio PSD**, así que si el diseñador cambia el estilo, el script le sigue.
- **Medido:** 0 píxeles de la plantilla tocados fuera de las cajas de nombre, y dif. media 0.00 entre foto original y círculo. No "parecida": idéntica.
- **La foto fea se queda fea, y es lo correcto.** Es su foto de LinkedIn. Si está borrosa, sale borrosa: eso NO se toca.
- **🔍 ENCUADRE: lo único que el script sí decide.** Hay quien tiene la foto de LinkedIn hecha desde la otra punta de la sala y en la orla, al lado de 9 primeros planos, no se le ve. El script mide cuánto ocupa cada cara, saca la **mediana del grupo** y **acerca solo a las que bajan del 60% de esa mediana**. Al que ya está bien no se le toca.
  - **No es un retoque, es el encuadre que haría un humano en Photoshop:** elegir qué trozo de la foto original se ve. No suaviza, no deforma, no inventa un píxel. Es la misma lógica de coherencia que el apellido único (`images §0e`).
  - Caso Asturias: Alvaro Vallaure tenía la cara al **11,7%** contra una mediana del 40,7% → acercado. Los otros 9, intactos. El peaje es que su recorte hay que ampliarlo x1.98 y se nota; el script lo avisa con ⚠️ en cada ejecución.
  - Se desactiva con `--sin-encuadre` y el umbral se mueve con `--umbral-cara`.
- **⚠️ El detector de caras es YuNet, NUNCA las cascadas Haar.** Haar se probó y era inservible: en la foto de Alvaro Platero (blanco y negro, poco contraste, de tres cuartos) devolvió **3 "caras" y las 3 eran fondo desenfocado**, así que le recortó la nuca. Y lo peligroso no fue eso, fue que **midió su cara al 15% cuando ocupa el 35%**: iba a "arreglar" una foto que estaba perfecta. YuNet da confianza (0.89-0.96 en las 10) y encuentra exactamente una cara por foto. **Una medición mala no se nota, se cuela.**
- **Nombres:** normalizados según `images §0e` (Title Case + nombre completo y PRIMER apellido), no el exacto de LinkedIn (eso es solo para la @ del post).
- Si algún día la plantilla cambia de huecos o de placeholders, el script **avisa y sale con error** en vez de dibujar de más.
- **La plantilla buena es `LOS 10 PLANTILLA v2.psd`** (2026-07-16): círculos más grandes y **sin aro** (los aros finos azules de la v1 quedaban feos). La `DEF` es la vieja, no la uses.
  - **Cambiar de plantilla NO costó tocar una línea del script:** los huecos se detectan solos y pasaron de 209x220 a 213x224 sin que nadie los midiera. Esa es la prueba de que detectarlos automáticamente valía la pena frente a hardcodear coordenadas, que habría roto la orla en silencio.
  - Ojo con la capa `placeholders`: va **oculta a propósito** (es la guía del diseñador). Los huecos de verdad son la transparencia del compuesto, que es lo que lee el script. Que esté invisible NO es un error.

**Paso 7 — Guía de menciones con enlaces** (mismas reglas de formato que el mapa, §4.2 Paso 10): calcando el orden del bloque de personas del post. Aquí el orden es **persona primero** (como en el cuerpo, `→ Persona - Empresa`), y **se mantiene el logro** al final: en este pilar el logro SÍ justifica la ficha (es el criterio de selección) y el usuario lo necesita a mano para responder comentarios. Esa es la única diferencia con el mapa, donde no se justifica nada.

⚠️ **El formato manda desde `§4.2` Paso 10 y NO se reescribe aquí.** Resumen: en el CHAT van **enlaces markdown CLICABLES con `https://`, FUERA de todo bloque cercado**; cercado solo si va a un fichero. **Fallado dos veces (2026-07-15)** por el mismo motivo: este Paso decía "mismas reglas que el mapa" y acto seguido las contradecía con un "bloque cercado", heredado del POST. Son cosas opuestas: **el post va cercado porque se copia y pega en LinkedIn sin markdown** (`working-preferences §1`); **la guía no se pega en ningún sitio, se CLICA**. El texto del enlace es el NOMBRE (legible), el href la URL:
```
→ [Javier Soto](https://www.linkedin.com/in/javier-soto-639657b3) - [Esnova](https://www.linkedin.com/company/4999804) · de €30M a rozar €100M
(… 10 líneas, en el orden exacto del post, FUERA de todo bloque cercado)
```
(Ese ejemplo va cercado aquí solo para que veas la sintaxis. En la ENTREGA va suelto, para que se renderice.)

**OUTPUT FINAL (SOLO esto):** (1) el **TEXTO** del post copy-ready · (2) el **ZIP con las 10 fotos** en orden de mención · (3) la **guía de menciones con enlaces** · (4) **los 2 PROMPTS de imagen** literales con sus `XXX` rellenos (Paso 6b). **Sin CSV** y sin montar la imagen: eso lo hace el usuario con su plantilla.

### 4.4 · Runbook MEME (REMIX de una referencia) — receta definitiva
> **Input del usuario:** SIEMPRE un **enlace a un post-meme de LinkedIn** de referencia (un caso de éxito). **Si no te lo pasa, PÍDESELO por chat antes de nada.**
> **⚠️ PREGUNTA TAMBIÉN PARA QUÉ CUENTA ES, y hazlo ANTES de elegir la referencia** (`brand-voice §1b` · `images §0g`). **Son dos cajones:**
> - **Unai y Asier** → meme **inteligente, para industriales, inequívocamente de ventas y NUNCA infantil**. Ni dibujos de animales ni caricaturas monas. No es que no puedan llevar meme (el mejor post de Unai, 16.62x, ES un meme: el wojak); es que el wojak es feo y un border collie dibujado es mono.
> - **Iker** → **cualquier meme outlier**, con la condición de siempre: adaptado a ventas (`global §2.3`). Sin restricción extra.
>
> Si la referencia es buenísima pero su imagen es tierna, **va a Iker**. Cambiar de cuenta es gratis; forzar el registro, no. Y ojo: **"específico de ventas" no es "de nicho"** — `global §2.4` sigue mandando y un meme que solo pilla el 1% no viaja en ninguna cuenta.
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
>
> ## EL ORDEN IMPORTA: PRIMERO CALCAR, DESPUES MEJORAR (Iker, 2026-07-20)
> **Calcar un outlier no es la meta, es el suelo.** El objetivo minimo es estar a la altura del original; si se puede mejorar, se mejora. Pero **en ese orden**: primero se calca la mecanica entera (gancho, imagen, esqueleto del cuerpo), y solo entonces se pasa el envase por nuestras reglas.
>
> **Los BLOQUES DE DOS tambien aplican al meme.** El 20-jul se entrego un meme con todo el cuerpo en lineas sueltas porque la referencia iba asi. Mal: el formateado es nuestro (`global §3.2`). Al meterle un bloque de dos en las lineas de Ferran Torres, la anafora ("El que fallaba los faciles / El que se comia las criticas") gano un ritmo que en linea corrida se perdia.
>
> **⚠️ Con una condicion: solo si MEJORA.** No metas un bloque de dos por cumplir. La enumeracion paralela (la escalera de 6 roles) es una unidad y se queda junta. Si partir algo lo hace mas pesado en vez de mas ritmico, no lo partas.
>
> **Y el cierre punchy es SIEMPRE una linea.** Dos oraciones largas al final diluyen el remate: un cierre no admite explicacion detras.

**Paso 0 — Conseguir la referencia:** accede al enlace y extrae (a) el **TEXTO** del post (gancho/1ª línea + cuerpo) y (b) la **FOTO**.

**Paso 1 — Traducir (si está en inglés, que es lo habitual):** EN→ES **fiel al original** en formato, longitud y estructura, pero con **expresiones naturales en español** donde suenen mejor (no traducción literal robótica).

**Paso 2 — HOOK: ⭐ CALCA LA MECÁNICA DEL GANCHO ORIGINAL, igual que calcas la foto.**
- **El gancho se roba con la misma fidelidad que la imagen.** Si calcas el layout de la foto pero te inventas un gancho nuevo, has tirado la mitad del outlier: el gancho original es parte del motor que lo hizo volar, no un envoltorio.
- **Método:** escribe en una frase QUÉ hace el gancho original (su mecánica), y reprodúcela. Ej. real: *"LinkedIn es mágico ✨"* = **afirmación corta, irónica, sobre la herramienta, que monta el marco sin destripar el chiste**. El remix mantiene esa mecánica (corta + irónica + sobre la herramienta) y cambia la piel a ventas: *"Tu CRM resucita clientes muertos ✨"*.
- **Mismo o mejor, nunca distinto.** "Mejor" = el verbo sube un peldaño (`global §2.9`) y se ancla a ventas (`§2.3`). "Distinto" = un gancho tuyo pegado a una foto ajena.
- ❌ **Fallo real (2026-07-14):** referencia con gancho *"LinkedIn es mágico ✨"* y el remix salió *"Tu cliente no te cogió el teléfono. El CRM lo asciende a oportunidad en fase avanzada 👇"*. Largo, específico, destripa el chiste que cuenta la foto y no se parece en nada al original. El validador dio 17/17 porque **esto el script no lo ve**: es criterio.
- **EL 👇 VA SIEMPRE, aunque la referencia no lo lleve** (corregido 2026-07-20 con datos, antes decia lo contrario).
  Aqui ponia que no se lo metieras a la fuerza si el original no lo tenia, citando "Subir en ventas siempre pasa factura." (13.51x) como validacion. **Generalizaba desde UN caso.** Mirando los 3 memes grandes de Iker:

  | Hook | lleva 👇 | Ratio |
  |---|---|---|
  | "El cold calling no ha muerto. Lo hemos enterrado en vida **👇**" | Si | **16.44x** |
  | "Esta es la vida del comercial **👇**" | Si | 8.45x |
  | "Subir en ventas siempre pasa factura." | No | 13.51x |

  **Dos de tres lo llevan, incluido el mejor.** Y hay un motivo mecanico: el 👇 marca el punto donde el lector decide pulsar "ver mas", justo antes del corte de la vista previa. El emoji es NUESTRA convencion y va en el envase, no en el motor: se calca la mecanica del gancho, no su puntuacion final.
- **Itera VERBOS** hasta el más punchy **sin perder el significado original** (escalera y techo: `global-instructions §2.9`).
- Aplica TODAS las reglas de hook (`global-instructions §2` + `swipe-file`): bloque único ≤210, imagen mental, ≤1 número, corto.
- **Ancla a VENTAS siempre**, aunque la referencia no vaya de ventas: desde el lado de vender, del cliente o del comercial. Amplifica el alcance al máximo sin perder la esencia de ventas.

**Paso 3 — CUERPO: fiel al original en ESTRUCTURA, no solo en tono.** Copia su esqueleto etiqueta por etiqueta y cambia solo el contenido. Ej. real: si el original va `Realidad: / LinkedIn: / Traducción: / Pero hey… / PD:`, el remix va `Realidad: / CRM: / Traducción: / Pero oye… / PD:`. **Escribir un cuerpo propio "en el mismo espíritu" NO es calcar: es otro post.**
- **Longitud: la del original.** La regla de 3-6 líneas es el DEFAULT del pilar; si la referencia tiene 10 líneas cortas, el remix tiene 10 líneas cortas. Manda la fidelidad.
- Adaptado a ventas B2B (`§2.3`), pero sin destripar el chiste que cuenta la foto: el texto monta el marco, la foto remata.
- **Roles de trabajadores:** sin anglicismos ni títulos complejos. Español genérico que un **industrial de 50+ entienda** (comercial, jefe de ventas, director comercial, gerente…) — lo más genérico = más alcance. (Mismo criterio en la foto, Paso 6.)

**Paso 3b — SI EL MEME VA DE ACTUALIDAD, DOS COSAS OBLIGATORIAS** (Iker, 2026-07-20):
1. **DESVELA a la persona o la referencia dentro del cuerpo.** Si el hook usa un apodo, una cara o un guiño ("el tiburon"), **siempre habra alguien que no lo pille**, y ese se va. Una linea basta, y encima puede hacer doble trabajo: *"Ferran Torres. El que fallaba los faciles."* resuelve quien es Y monta la historia.
2. **Robale al peloteo regional su cliche de orgullo** cuando el tema lo permita. El mecanismo del mapa (*"toro, txistorra y poco mas"* → giro) funciona igual aqui: *"Nos ven como siesta y sangria. Y la estrella la mete el que todos daban por amortizado."* Ojo, solo si hay paralelismo real — ahi lo habia (a España la infravaloran, a el tambien). Forzado queda pegote.

**Paso 4 — SPAM NINJA:** reglas canónicas en **`global-instructions §4.4b`** (mándalas siempre). Máx **2 líneas CORTAS**, **NUNCA nombrar a Neety**, chiste con **verbo punchy con techo** que gira el concepto del hook, dolor concreto + diferenciador aterrizado (`aboutme §1b`), nunca última línea. Aquí no hay menciones, así que va en el punto más natural del cuerpo — y ojo: el cuerpo del meme es de 3-6 líneas, así que el spam ninja **no puede comerse el post**. Validado: el iMessage "El de Ventas" (7.9x · 80.9K) llevaba link de agendar en spam ninja sin matar alcance.

**Paso 5 — Cierre + validación:** el post cierra con el **punchline del meme** (regla del UNO, sin apilar CTAs).

> **⛔ SI HAY SPAM NINJA, EL CIERRE NO PUEDE SER OTRO CTA** (Iker, 2026-07-20). Nada de "Etiqueta al compi que…" ni "Comenta X". Aunque `global §4.4b` diga que el spam ninja no consume la regla del UNO, **en la practica compite**: el lector que iba a clicar el enlace se va a comentar, y la prioridad es el clic. El cierre es un **bold statement de UNA linea**, y punto.
>
> ⚠️ **Tiene un coste y hay que saberlo:** la referencia de la calvicie hizo 13.51x cerrando con "Etiqueta al compi que ya empezo a mirar champus anticaida", y el etiquetado es motor de alcance en memes. Se cambia alcance por intencion **a proposito**, no por descuido. Corre el pase de validación (§8). **Output 1 = el TEXTO copy-ready.**

**Paso 6a — ⭐ INVENTARIO DE LA IMAGEN (antes de escribir una sola línea del prompt).**
> **El objetivo es UN prompt que salga a la primera, no una cadena de prompts de edición.** Cuando hacen falta 3 rondas, el fallo casi nunca es del diseñador: es que el primer prompt pedía mal las cosas.

Mira la foto **sola**, tapando el texto del post, y escribe en literal:
1. **¿Cuántos paneles / filas / columnas tiene?** → el remix lleva **EXACTAMENTE los mismos**. No es orientativo.
2. **¿Qué hay en cada panel y quién es?** (mismo par repetido, escalera de personas, antes/después…)
3. **¿La imagen lleva texto? ¿De quién y qué dice?** ¿Es diálogo, son etiquetas, es un titular?
4. **¿Qué NO lleva la imagen?** ← el más importante. Aquí es donde se cuela lo que solo estaba en el post.

**⛔ LA TRAMPA QUE YA CAYÓ (2026-07-16): el texto del post y el texto de la imagen son DOS MITADES DISTINTAS. No se mezclan.**
- La referencia (The Office, 8.57x) tenía **`Manager: / SDR: / AE:` en el TEXTO** del post y **diálogo puro en la IMAGEN** (`CALL THE PROSPECT.` → `I EMAILED THEM.`). **La foto no llevaba ni un rol.**
- El prompt salió pidiendo **6 filas con los roles como etiquetas**: conté los roles del TEXTO en vez de los paneles de la FOTO, y convertí un meme de diálogo en un gráfico de etiquetas. Costó 3 rondas de edición arreglarlo.
- **El reparto correcto, que es el que hace la referencia:** el **TEXTO** lleva la escalera de roles · la **IMAGEN** lleva el diálogo. Cada uno cuenta una mitad. Con los roles metidos en la foto, la imagen **repetía lo que ya decía el texto** y dejaba de aportar (es la misma regla que "el título no repite el hook", `images §0h`).
- **Regla de pulgar:** si algo lo sabes por haber leído el post y NO se ve en la foto, **no va en el prompt**.

**Si la imagen es un DIÁLOGO, se calca la mecánica del diálogo,** no solo el hecho de que hablen: el original **escala la MISMA frase** (`CALL THE PROSPECT.` / `CALL THEM.` / `CALL THEM!` / `JUST CALL THEM!!!`) mientras el otro se desinfla. El remix escala la misma frase (`¿El pedido está cerrado?` → `¡¡¿ESTÁ CERRADO O NO?!!`). Cambia la piel, nunca el mecanismo.

**⚠️ DE VERTICAL A 1:1 SE COMPRIME, y ahí se muere el motor.** Casi todas las referencias son verticales y nosotros publicamos 1:1 (`images §0b`), así que los paneles se aplastan. `global §4.3` exige que el cambio corporal sea **legible a tamaño miniatura**: si al reencuadrar la calvicie deja de verse, el post sale **sin motor**, con el chiste técnicamente dentro pero invisible en el feed. **Si el original es vertical y lleva cambio corporal, pídele explícitamente que ese cambio se note a simple vista** y dile de dónde sacar el espacio (quitar el footer libera alto: `images §0h`).

**Paso 6b — FOTO: PROMPT de modificaciones (NO generar la imagen).** Con el inventario delante, entrega **UN SOLO PÁRRAFO** con los cambios a aplicar sobre ella. Nada de listas ni de secciones: un párrafo, simple de leer y **lo más específico posible, para que el diseñador lo entienda a la primera**.

**Cómo se escribe el prompt (técnica validada por el usuario, funciona):**
- **⬛ SIEMPRE `en formato cuadrado 1:1`**, aunque la referencia sea vertical (`images §0b`). LinkedIn recorta arriba y abajo en el feed. 19 de 20 de nuestros outliers son 1:1. El formato es NUESTRO: se calca la esencia, no el encuadre.
- **UN párrafo, CORTO y en lenguaje llano.** Lo lee un diseñador que va a tardar en montarlo: cada frase de más le cuesta tiempo. Claro y corto bate a exhaustivo.
- **⭐ LA CONTENCION VA PARTIDA: ORDEN AL PRINCIPIO, PROHIBICIONES AL FINAL** (Iker, 2026-07-20).
  - **Abre** en MAYUSCULAS y con dos puntos: `SOLO HAZ LO QUE TE PIDO:`
  - **Cierra** en minusculas (solo la inicial en mayuscula), literal:
    `Deja todo lo demas intacto. No hagas nada que no te he pedido, ni toques colores ni suavices caras ni deformes.`
  - **Las mayusculas van solo en la apertura.** Gritar tambien el cierre reparte el enfasis entre dos sitios y ninguno destaca; en minusculas se lee como la coletilla que es, sin competir con la orden de entrada.
  - **Por que partido:** las herramientas de imagen pesan mas la ULTIMA instruccion. Metiendo "deja todo lo demas intacto" al principio, queda enterrada bajo los cambios que vienen despues; al final es lo ultimo que lee. Y agrupar ahi TODAS las prohibiciones (colores, caras, deformar) evita el goteo de "ah, y tampoco…" que alarga el prompt y se pierde.
- **Di "calca esta referencia".** Así, con esas palabras. Nada de "parte de la imagen de referencia y mantén el layout, los paneles, la línea divisoria…": eso es hablar complicado para decir "calca".
- **⛔ NUNCA enumeres lo que se queda igual.** Es el error que más engorda el prompt. el bloque de contencion del final **ya lo cubre entero**. Listar "los dos paneles, la línea divisoria, el fondo de papel, la etiqueta negra, el encuadre, el estilo de dibujo…" no añade precisión: añade ruido y esconde los cambios de verdad entre la paja.
- **Pide SOLO los cambios exactos**, numerados dentro del párrafo (1), (2), (3). Y en cada uno, solo lo que cambia: no repitas "con la misma pose, el mismo encuadre y el mismo tratamiento", que también es decir lo que NO cambia.
- **Las prohibiciones ya van todas en el bloque de cierre de arriba.** No las repartas por el prompt: las herramientas suelen clavar la primera fila y hacer lo que quieren en la ultima, asi que la contencion tiene que ser lo ultimo que lean.
- **La tipografía SOLO si la imagen lleva texto.** Si no lleva, no la menciones: le estás dando una instrucción sin objeto y la puede usar de excusa para añadir texto que nadie pidió.
- **Regla de pulgar:** si una frase describe algo que ya está en la referencia y no cambia, **bórrala**.
- **🎯 NUNCA le digas "céntralo"** (`images §0c`). Es un juicio y la herramienta no mide, mueve: falla siempre. Dale la operación: `aprovecha el espacio que tiene a la izquierda para que quede centrado`. Validado.
- **⭐ El objetivo es calcar Y MEJORAR** (`images §0d`). Los defectos del original **no se heredan**: encuadre alargado → 1:1, textos descentrados → colocados. Ser fiel no es ser fiel a sus fallos. Lo que no se toca es la mecánica, el sujeto y el estilo.
- **Textos (SOLO si la imagen lleva):** si van en inglés, traducirlos al español (adaptado a ventas si no lo estaba), con **nuestra tipografía** (Bricolage Grotesque títulos + Switzer cuerpo) y la **regla de la palabra naranja** (`images §4`). **Si la imagen no lleva texto, no menciones la tipografía.**
  - ⭐ **SIEMPRE que nombres las fuentes, di que le adjuntas los instaladores** (Iker, 2026-07-20). Literal: `Te adjunto los dos archivos instaladores de las fuentes.` Iker los manda con el prompt. Sin esa frase el diseñador tira de una fuente parecida que tenga a mano y la imagen sale con otra tipografía.
  - **Las 4 reglas del texto de la imagen están en `images §0h` y son de obligado cumplimiento:** (1) el **título de la imagen también se ancla a ventas** (el test de §2.3 no es solo del hook); (2) el título **no repite el hook**, es otra frase del mismo chiste; (3) **cero footer** aunque la referencia lo lleve, y cero logos; (4) se traduce **TODO**, incluidos los rincones (badges, botones, `Delivered`, `Send`), no solo las etiquetas grandes.
- **Roles en la imagen:** español genérico, sin anglicismos, entendibles por industrial 50+ (igual que el cuerpo).
- **Paleta + detalles de marca:** aplica Alabastro (fondo) · Dark Blue (tinta) · Persian Orange (highlight), y **añade detalles nuestros** (corbatas naranjas, patrones, siluetas, props en naranja…) — no solo recolorear.
- **Fidelidad al diseño original:** mantén el **estilo de dibujo** (minimalista→minimalista, recargado→recargado), el **layout, paneles, escena y mecánica cómica** de la referencia.
- **⛔ EL SUJETO NO SE CAMBIA. Es el motor, no el decorado.** Conserva el elemento y varía solo el detalle: si el original tiene un perro → **otro perro**; café → otro café; avión → otro avión; camión → otro camión, **nunca un gato**. Un perro nuevo con nuestros colores haciendo lo mismo. Punto.
  ❌ **Fallo real (2026-07-14):** referencia con un perro (1.307 likes, 96 reposts) y el prompt salió "el perro pasa a ser un COMERCIAL", razonando que había que anclar la imagen a ventas. **La gracia ERA el perro**; sin él no hay meme, hay una viñeta corporativa. El ancla de ventas se pone en el TEXTO (el del post y el de la imagen), nunca cambiando el sujeto.
  **La regla de "roles en español genérico" NO es permiso para sustituir al protagonista**: aplica cuando el original YA tiene roles, no para meterlos donde no los había.
- **Objetivo:** replicar el caso de éxito del original, **misma esencia**, remix a nuestro sector + Neety. (Sistema visual completo en `images §5-B` y `§6`.)

**Sanity check (antes de entregar):** ¿la referencia tiene un motor que transfiere a ventas (filtro de 4 puntos, `global-instructions §4.3`)? Si el meme no puede anclarse a ventas o pierde la gracia al remixarlo, dilo en vez de forzarlo.

**OUTPUT FINAL (SOLO esto):** (1) el **TEXTO** del post en bloque cercado · (2) el **PROMPT de modificaciones de la foto**. Sin CSV ni menciones (eso es del mapa).

### 4.5 · Runbook LEAD MAGNET (comment-gated) — RECETA DEFINITIVA

#### ⭐ 4.5.0 · EL HOOK "ÚLTIMA HORA" (medido, y NO estaba en esta receta hasta el 2026-07-20)

Nuestros 2 mejores lead magnets usan la misma estructura de gancho y **la receta no la recogía**: solo aparecía como ejemplo suelto en `swipe-file`. Por eso se dejó de usar sin que nadie lo decidiera. **Sin usar desde el 2026-05-15.**

**LO QUE DECIDE NO ES EL TEMA, ES EL SUJETO DE LA FRASE.** Verificado sobre 5 posts nuestros:

| Sujeto | Post | Resultado |
|---|---|---|
| ✅ **lo que le pasa a TU TRABAJO** | "🚨 ÚLTIMA HORA: Claude acaba de matar **el cold outbound**" | **9.96x · 632 com.** |
| ✅ **lo que le pasa a TU TRABAJO** | "🚨 ÚLTIMA HORA: Claude ha reducido **toda mi prospección** a una frase" | **2.72x · 167 com.** |
| ⛔ el MODELO | "🚨 ÚLTIMA HORA: **Claude Opus 4.7** acaba de romper las…" | 0.70x |
| ⛔ el MODELO | "**Hoy ha salido Sonnet 4.5.** Y no es una actualización…" | 0.22x |
| ⛔ el MODELO | "🚨 URGENTE: **El nuevo Claude** acaba de tachar…" | 0.23x |

Mismo hook, mismo emoji, mismo mes, **40x de diferencia**. La noticia de IA es la EXCUSA para escribir; el sujeto del titular es siempre el trabajo del lector.

**Variantes del disparador de urgencia** (para no repetir el mismo literal, `working-preferences §4`). "ÚLTIMA HORA" es la que tiene los datos y es la traducción que decidimos para el *breaking* inglés — **nunca dejarlo en inglés**, nuestro lector es un director industrial español:
- `🚨 ÚLTIMA HORA:` ← la probada, 9.96x y 2.72x
- `🚨 Acaba de pasar:`
- `🚨 Esto cambió ayer:`
- `🚨 Nadie lo ha contado todavía:`
- `🚨 Llevo 24 horas dándole vueltas a esto:`

**⚠️ CONFLICTO SIN RESOLVER, no lo tapes:** `brand-voice §1b` dice que este registro es lo contrario de sobrio y que "si hace falta, va en la cuenta de Iker". Pero los datos dicen lo contrario: en **Unai** hizo 9.96x y 2.72x, y el único de **Iker** hizo 0.70x. Puede ser el sujeto de la frase y no la cuenta (el de Iker hablaba del modelo). **n=1 por cuenta: no está decidido.** Si se vuelve a usar, decidir a conciencia y anotar el resultado.

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

### ⭐ LA VENTANA DE PUBLICACIÓN (CORREGIDO 2026-07-20, la 1ª versión estaba MAL)

**⚠️ AVISO SOBRE LA VERSIÓN ANTERIOR.** Aquí ponía *"los 10 posts que han pasado de 6x están todos entre las 10:00 y las 13:00"* y *"después de las 13:00 nada ha pasado de 3.57x"*. **Las dos frases eran FALSAS.** Salieron de un análisis cuyo filtro de pilares **no reconocía los memes**, así que tiraba a la basura justo los posts de más alcance. Corregido sobre los **90 posts desde abril de 2026**, sin filtrar por pilar.

| Franja | n | Mediana | Media | **Impresiones medianas** |
|---|---|---|---|---|
| antes de 10h | 4 | 0.70x | 1.07x | 4.475 |
| **10:00-11:00** | 25 | **1.29x** | **3.38x** | **11.065** |
| 11:00-12:00 | 10 | 1.02x | 2.39x | 5.221 |
| 12:00-13:00 | 29 | 0.72x | 2.79x | 4.082 |
| 13:00-14:00 | 16 | 0.69x | 1.87x | 5.247 |
| 14:00+ | 6 | 0.48x | 0.92x | 3.611 |

**LO QUE SÍ SE SOSTIENE:**
- **La franja 10:00-11:00 es la mejor**, y por bastante: sus impresiones medianas (11.065) **doblan a las de cualquier otra franja**. Ahí están el 16.44x, el 12.90x, el 9.96x y el 8.51x.
- **Después de las 14:00 no hemos hecho nada bueno nunca**: n=6, el mejor 2.16x. Muestra pequeña, pero es lo único que hay.

**⛔ LO QUE NO SE SOSTIENE Y NO SE PUEDE USAR DE EXCUSA:**
- **Las 13:00 NO son la muerte.** A esa hora están el **8.45x** (86.815 impresiones) y el **7.82x** (78.711). Si un post publicado a las 13:30 hace 0.59x, **la hora no lo explica**: a esa misma hora hemos hecho 8x.
- **El VIERNES no es mal día.** Medido sobre **20 viernes**: nuestros **dos mejores posts de la historia** (16.45x y 16.44x, ~166.000 impresiones cada uno) son los dos de viernes, y uno de ellos a las 13h. La primera versión decía n=3 porque el filtro roto se comía los memes, que era justo lo que se publicaba los viernes.

**EL VIERNES Y EL MEME (decisión del usuario, 2026-07-20 — NO se hardcodea):** los datos dicen que viernes + meme es nuestra combinación más potente (16.45x y 16.44x, ~166.000 impresiones cada uno). **Aun así NO se convierte en regla**, y el motivo es de planificación, no de rendimiento: **las 3 cuentas no pueden publicar el mismo pilar el mismo día** (exclusividad de categoría por día, §8). Si el viernes fuera "día de meme", o lo monopoliza una cuenta o las tres hacen lo mismo, que es justo lo que se quiere evitar con 3 cuentas.
- **Lo que sí vale:** recomendar el viernes-meme **a UNA cuenta concreta** (p. ej. Iker) y dejar el resto libre.
- **Lo que no vale:** escribirlo como regla general para las tres.

**Regla operativa:** apunta a **10:00-11:00** si puedes, porque es donde está el doble de alcance. Pasadas las **14:00**, sabes que vas con la muestra en contra. Entre medias, la hora **no** es una explicación válida de un flop: busca la causa en el ángulo o en el motor del pilar (`outliers-database §3.10`).

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
- **Lead magnet: NO hay espaciado.** ⚠️ Aquí ponía "≥2 semanas por cuenta; nunca dos seguidos" y **es falso** (se corrigió en `global §4.4` y `§4.5` el 2026-07-14 pero esta línea se quedó sin tocar). **La fatiga de lead magnet no existe:** Iker publicó uno el **27-may (0.59x)** y otro el **28-may (8.52x, el 2º mejor post del histórico)**, días consecutivos y en la misma cuenta. La única diferencia fue el CTA ("Comenta" explícito), no el calendario. **Si un lead magnet flopea, mira el ángulo y el CTA, nunca la fecha.** Lo único que se mantiene: no solapar dos cuentas el MISMO día, que ya lo impide el cuadro latino.
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

---

## ⚙️ EL CRUCE DE MENCIONES (añadido 2026-07-20)

`§4.0c` prohíbe repetir empresa o persona entre posts de la misma región, contando
las TRES cuentas y los DOS formatos. A ojo no escala: en Cataluña había **83
entidades ya mencionadas** entre el mapa de Iker y el "Los 10" de Unai.

**Ahora lo comprueba el validador.** Fuente: `docs/skills/menciones-usadas.json`
(518 entidades de 22 posts de peloteo), con normalización que caza `Bioibérica`
contra `Bioiberica` y `Prefabricados Pujol` contra `Prefabricats Pujol`.

```
node scripts/extraer-menciones.mjs     # regenerar tras publicar un peloteo
```

⚠️ **Regenéralo DESPUÉS de publicar, no antes.** Si lo regeneras con el borrador
ya publicado dentro, al revalidar ese mismo post se detectará a sí mismo.
