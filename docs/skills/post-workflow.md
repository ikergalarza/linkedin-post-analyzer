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
- **Menciones @:** solo personas que **hayan COMENTADO a otros en los últimos 3 meses** (no basta con publicar/compartir en su perfil: el que solo emite no nos comenta). Se comprueba con `/users/{id}/comments`. Descarta a quien no comente aunque sea el CEO. Detalle y el porqué del "3 meses no 1", en `§4.2 Paso 4`.
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

**⭐ BUSCANDO EMPRESAS NO SE PARA NUNCA (Iker, 2026-07-31).** Si una no sirve o no salen suficientes, **se sigue: otra fuente, otra provincia, prensa local, otro endpoint**. Solo se para cuando es **imposible** encontrar más, y eso hay que haberlo intentado de verdad. La que no convence **se descarta sola, sin consultar**: no se devuelven dudas. Y **no se re-auditan empresas ya verificadas en la misma sesión** — eso es trabajo repetido, no rigor. Textual: *"no tienes que parar, tienes que seguir, seguir, seguir"*. Truco que salvó Asturias el 31/07: **adivinar el slug de LinkedIn no funciona** (fallaron 20 de 22); se busca por **keyword** con `category: companies`, y el endpoint `/linkedin/company/{x}` acepta también el **id numérico**, que a veces es la única forma de sacar una ficha.

**⚠️ Y LO CARO NO ES LA REGLA, ES LA BÚSQUEDA.** Cuando falten empresas, el reflejo es dar la región por agotada. En Cataluña un investigador devolvió *"0 de Girona, ninguna pasó el listón"* y **era falso**: buscando "Cataluña" a nivel autonómico, Barcelona se come los resultados. Atacando fuentes locales (el ranking provincial, el directorio del polígono de Riudellots, la prensa comarcal) salieron 8 gerundinas a la primera. **Antes de bajar a 16, busca por provincia y con prensa local.**

### ⛔ 4.1-GANCHO · SI EL PILAR NO ESTÁ DEFINIDO, PRIMERO SOLO EL GANCHO (Iker, 2026-08-05)

**LA PUERTA. Antes de escribir una sola línea de cuerpo, pregúntate: ¿este post pertenece a un pilar que ya tenemos validado con datos?** (mapa · "Los 10" · despiece · meme · lead magnet · historia). **Si la respuesta es NO —nos estamos inventando el formato— el flujo CAMBIA y no se entrega una publicación entera.**

**Lo que se entrega en esa casuística, y solo esto:**
1. **Un aviso explícito** de que ese formato **no está validado ni con nuestros datos ni con los de nadie**, así que lo único que puede sostenerlo es el gancho.
2. **DIEZ variantes de gancho, todas con metáfora** (`global §2.0a`), cada una con **un concepto distinto** y, a poder ser, **una perspectiva distinta**: el que vende, el que compra, el jefe, el oficio, el que mira desde el futuro, el que se queda fuera.
3. **Una tabla con el resultado del validador de cada uno** y mi recomendación razonada de dos o tres.
4. **Y ahí se para.** El cuerpo NO se escribe hasta que Iker elige o pide otra ronda.

**🚫 Y LAS DIEZ TIENEN QUE PASAR EL VALIDADOR. NO SE PRESENTA NADA QUE YA SABES QUE FALLA (Iker, 2026-08-05).** Le pasé una tanda con dos ganchos marcados por mí mismo como *"sin ancla de ventas"*. Su respuesta: ***"¿por qué me das esas opciones si tú sabías que no tenían ancla?"***. Tenía razón: **enseñar una opción rota le hace perder tiempo revisando algo que no podía salir**, y encima ensucia la comparación entre las que sí valen.
- **El flujo correcto:** genera **más de diez**, pásalas TODAS por el validador, **descarta las que fallen** y presenta solo las limpias. Si de doce sobreviven ocho, se entregan ocho y se dice por qué cayeron las otras cuatro.
- **Lo que sí se puede enseñar es el descarte**, en una línea (*"cayó por cifra en letra"*), porque eso es información. Lo que no vale es colarla en la lista de candidatas.

**POR QUÉ, con la prueba del mismo día en que se escribió:** el 05/08, montando el primer post del evento de septiembre, le entregué **la publicación completa seis veces seguidas** cambiando solo el gancho. Todo el cuerpo de las cinco primeras fue trabajo tirado, y por el camino se colaron dos datos falsos que había que ir corrigiendo en cada versión. **Iker: *"si el gancho no convence, nadie va a pulsar ver más, así que por mucho que nos curremos el cuerpo la publicación ya no sirve de nada"*.** Es como trabajaba él su primer mes en LinkedIn, cuando no tenía ningún pilar: mil iteraciones de gancho probando conceptos, metáforas y verbos punchy, y solo después el cuerpo.

**⚠️ OJO CON EL LÍMITE:** esto **NO aplica a los pilares definidos**. En un mapa o un meme la receta ya dice cómo va el gancho y el cuerpo, así que ahí se entrega el post completo como siempre. **La puerta es solo para lo que nos estamos inventando.**

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
> **Output final (solo esto):** (1) el **TEXTO** del post copy-ready · (2) el **CSV** para importar en PamPam · (3) el **TÍTULO** y la **descripción** para la web del mapa — la descripción va en **UN SOLO PÁRRAFO, sin saltos de línea** (Iker, 2026-07-22), y **tanto el título como la descripción se entregan cada uno en su bloque cercado** para poder copiarlos con el botón (igual que el texto del post) · (4) la **guía de menciones** (en el chat: enlaces CLICABLES fuera de cercado, Paso 10). **Son CUATRO piezas, ni una menos.**
> **DE LAS TRES IMÁGENES, TÚ SOLO DAS UNA (la de PamPam):**
> - **Imagen del POST** = captura de la web PamPam → **la hace el USUARIO**. El workflow NO la genera ni la describe. (Por eso el mapa NO usa la skill `images`.) **Pero SÍ lleva aviso: el de encuadre, ver justo debajo.**
> - **Portada de la WEB del mapa** = captura del propio mapa → **la saca el PROGRAMADOR** (confirmado por él el 2026-07-31).
> - **Portada de PAMPAM** = foto icónica de la región con licencia libre → **la das TÚ** (Paso 11).

**⛔⛔ LOS CUATRO INAMOVIBLES DEL GANCHO DE PELOTEO (Iker, 2026-07-31). Aplican al MAPA y al DESPIECE. NO a "LOS 10".** Se puede iterar todo lo demás, pero estas cuatro piezas **no se quitan, no se sustituyen y no se mejoran**, por muy punchy que parezca la alternativa:
> 1. **El PREJUICIO dicho por otro** (`la ven`, `la tienen`, `nadie la cuenta`). No se afirma en primera persona.
> 2. **EXACTAMENTE 2 clichés** de la región.
> 3. **La palabra `exporta`.** Es lo que ata el pilar a **VENTAS** de forma indirecta: **si alguien exporta es porque VENDE**. Sin ella el post es peloteo bonito que podría subir cualquiera.
> 4. **La COMPARACIÓN con un país CONCRETO y verificado** (`más que [PAÍS] entero`). Ni "medio mundo" ni "países enteros" en vago.
>
> **POR QUÉ ESTÁ AQUÍ EN MAYÚSCULAS: me las cargué dos días seguidos y las dos veces me pareció una mejora.** El **30/07**, en el despiece de Euskadi, cambié el remate de `exporta` por el objeto (*"Y ahí se hace tu coche"*), puse un concepto flojo (*"el sitio de comer"*) y me salté el prejuicio ajeno: **está rindiendo peor**. El **31/07**, en el mapa de Asturias, cambié `exporta más que [PAÍS]` por un shock de producción (*"y aún funde zinc para medio mundo"*) porque el total exportado no daba un titular redondo. **Las dos veces el validador me lo dijo con el fallo "Hook anclado a VENTAS" y las dos veces yo lo despaché como "fallo esperado del pilar".** No lo era: en cuanto volvió `exporta`, el check pasó solo. **Si el validador marca ancla de ventas en un peloteo, es que falta `exporta`. Punto.**
>
> **⛔ "LOS 10" QUEDA FUERA, y no por descuido (Iker, 2026-07-31).** Ahí el foco es **LA PERSONA**, el comercial invisible, no la región: su gancho es de otra familia y **el que más alcance nos ha dado no lleva `exporta` ni comparación de país**. Meterle estas cuatro reglas tumbaría los cuatro "Los 10" del histórico, incluido el 4.81x. En ese pilar el listón es otro (`§4.3`). Por eso los checks del validador van sobre `('mapa', 'objeto')` y no sobre `los10`.
>
> **Y si la comparación no sale redonda, se busca mejor, no se quita.** En Asturias di por muerta la comparación creyendo que solo batía a Chipre por un 1,8%, y era falso: **Chipre exporta 4.383 M$ en bienes (OMC, 2024) y Asturias 5.654 M€, casi un 40% más.** El error fue mío al comparar, no del dato. Mecanizado en `validar-post.py` como dos fallos duros.

**Paso 1 — Iterar el GANCHO** (estructura archi-probada, ver `swipe-file §2.1`). Empieza SIEMPRE por aquí. Fórmula:
`[concepto original despectivo/gracioso de la zona] + [EXACTAMENTE 2 clichés locales] + [frase-rabia entre comillas] . Y exporta más que [PAÍS] entero 👇`
- **⭐⭐⭐ CÓMO SE INVENTA EL CONCEPTO — LA FÓRMULA, que hasta el 2026-08-03 no estaba escrita.** Aquí ponía *"inventa uno original y geográfico"*, y eso no es un método, es un deseo. Por ese hueco entregué `el pasillo de España` (que además pincha al país) y `la región más extensa de la Unión Europea` (que es un DATO, no una metáfora). Iker: *"me parece una basura… trastienda del norte era superoriginal"*.
  - **📊 VALIDADO CONTRA IMPRESIONES REALES (autovalidación del 2026-08-03, solo mapas de IKER para que la comparación sea limpia):**

    | Impresiones | Concepto | Familia |
    |---|---|---|
    | **112.667** | `el pueblo de 7.000 habitantes` | dato-shock |
    | **79.224** | `el patio trasero de los Pirineos` | metáfora doméstica |
    | **64.566** | `la esquina del Atlántico` | metáfora doméstica |
    | 29.755 | `región de 8,7 millones de habitantes` | dato SIN contradicción |
    | 16.726 | `un desierto` | metáfora de PAISAJE |
    | 2.090 *(Unai)* | `un museo minero` | espacio, pero PÚBLICO |

    **Lo que dicen los números, y no estaba escrito:**
    1. **La metáfora de PAISAJE rinde ~4 veces peor que la doméstica.** `desierto` 16.726 y `secarral` 27.009 frente a `patio trasero` 79.224 y `esquina` 64.566. **No vale cualquier metáfora: tiene que ser de CASA.**
    2. **`museo minero` es el peor mapa del histórico (2.090).** Es un espacio, pero **público y turístico**. Lo que funciona no es "un sitio", es **un sitio de TU casa**, porque el lector se coloca dentro.
    3. **HAY UNA SEGUNDA FAMILIA QUE GANA A TODAS: el DATO-SHOCK**, y es la del mejor mapa de la historia. **Pero solo funciona si el número es PEQUEÑO y CONTRADICE**: `7.000 habitantes` hace 112.667 y `8,7 millones` hace 29.755. **El número tiene que ser tan pequeño que choque con "exporta más que países enteros".** Un número grande e impresionante (`la región más extensa de la UE`) no sorprende a nadie y por eso Iker lo tumbó el 03/08.
    - **⚠️ Y esto contradice a medias lo que escribo abajo:** la fórmula doméstica es la vía **fiable** (2º y 3º puestos), pero **el techo lo tiene el dato-shock**. Si aparece un número pequeño y contradictorio de esa región, **ese gana**. Si no aparece, se va a la fórmula.

  - **⬆️ ESTO ES UN CASO PARTICULAR DE UNA REGLA GENERAL (`global §2.0a`, 2026-08-05):** el gancho de CUALQUIER pilar se construye con una metáfora y no con una afirmación. Lo de abajo es cómo se aplica esa regla al mapa, donde el objeto sale de la geografía. En un meme, un lead magnet o un post de evento el objeto sale de otro sitio, pero **el procedimiento de 5 pasos es el mismo**.
  - **LA FÓRMULA DEL MAPA, sacada de los que funcionaron:** `[ESPACIO DOMÉSTICO HUMILDE] + de + [ACCIDENTE GEOGRÁFICO]`. Es una **palabra de casa aplicada al mapa**, y por eso la entiende todo el mundo y suena nueva a la vez.
    - `trastienda` + del norte (Álava) · `esquina` + del Atlántico (Galicia) · `patio trasero` + de los Pirineos (Navarra) · `tejado` + de la Península (Castilla y León).
    - **Los tres son sitios de una casa donde no se recibe a nadie.** Ese es el desprecio: no eres el salón.
  - **EL PROCEDIMIENTO, cuatro pasos y en este orden:**
    1. **Escribe la geografía REAL de la región en una frase**, sin adjetivos. Castilla y León: *"meseta alta cercada por cordilleras por los cuatro lados, de donde bajan los ríos"*.
    2. **Traduce esa forma a una parte de una casa.** ¿Alto y nadie sube? → tejado, azotea, desván. ¿Cerrado por los cuatro lados? → patio de luces, corral. ¿Detrás? → trastienda. ¿En una punta? → esquina, rincón.
    3. **Comprueba las dos cosas que lo tumban:** ¿la palabra la usa un señor de 55 años en un bar? ¿está en `CONCEPTO_QUEMADO`, aunque sea a medias (`patio` ya salió en Navarra)?
    4. **Y remátalo con el CIERRE del post**, que tiene que rebotar contra el concepto. Tejado → *"Del tejado nadie se acuerda. Pero es lo que aguanta la casa."* Si el cierre no rebota, el concepto no estaba bien elegido.
  - **🚫 LO QUE NO ES UN CONCEPTO:** un dato (`la región más extensa de la UE`), un adjetivo (`la olvidada`), el nombre real (`la meseta`), ni algo que critique a España o a otra región (`el pasillo de España`).
  - **🚫 PALABRAS QUEMADAS EN EL ARRANQUE:** `región`, `tierra`, `pueblo`. **Y el gancho NO empieza con el verbo** (`La ven`, `La despachan`, `La tienen`): eso ya se hizo en 6 de 10 mapas y canta. **Empieza por el CONCEPTO** (`Al tejado de la Península lo resumen en…`, `Esta esquina del Atlántico la ven como…`).
- **Concepto: DERIVADO DE LA GEOGRAFÍA de la región** (su posición en el mapa, accidentes geográficos, fronteras). Nunca "región/pueblo/tierra". Así lo hemos hecho siempre: Galicia = "la esquina del Atlántico" (arriba a la izquierda), Álava/País Vasco = "la trastienda del norte" (arriba, la olvidada del norte), Navarra = "el patio trasero de los Pirineos" (frontera con Francia). Inventa uno original y geográfico por región; no repitas concepto usado.
  - **🔴🔴 EL PREJUICIO SE ATRIBUYE A LA GENTE, NUNCA SE AFIRMA (Iker, 2026-07-30). Es LA regla del gancho y me la salté dos dias seguidos.** El gancho **no dice lo que pensamos nosotros**, dice **lo que piensa todo el mundo**. Sin ese sujeto colectivo, el desprecio se lee como NUESTRO y ofendes justo a quien querias que comentara defendiendo lo suyo.
  - **❌ Mal:** *"El museo de la mina: sidra, fabada y a hacer fotos"* · *"En el mapa es un paramo con catedrales"*. Afirman. Somos nosotros los que desprecian.
  - **✅ Bien, y son los que funcionaron:** *"Nadie habla del pueblo…"* · *"Todos ven esta tierra como playa y paella"* · *"A esta tierra la conocen por la lluvia"* · *"Esta esquina del Atlantico la ven como pulpo y el Camino"* · *"La ven como el patio trasero de los Pirineos"* · *"La llaman la trastienda del norte"*.
  - **La formula del sujeto:** `nadie habla de` · `todos ven` · `la conocen por` · `la ven como` · `la llaman` · `la tienen fichada como` · `la despachan como`. **Siempre hay alguien ajeno opinando.**
  - **Y la frase-rabia tiene que DESPRECIAR de verdad**, no ser simpatica. *"y a hacer fotos"* se queda corta. La familia que funciona: *`y para de contar`* · *`y poco mas`* · *`y poco que rascar`* · *`buena para [comer X] y para irse`* · *`un [plato] antes de seguir carretera`*. **Si el local no siente el desprecio, no comenta, y sin comentarios no hay motor.**
- **⭐ VARÍA EL ARRANQUE del gancho (Iker, 2026-07-22).** No abras SIEMPRE con "La ven como…". Es un tic: se ha usado en Navarra, Murcia y compañía. Alterna: *"La despachan como…"*, *"La colocan como…"*, *"La tienen fichada como…"*, *"En el mapa es…"*, *"Para el resto es…"*, o **empieza directamente por el concepto** (sin verbo de "ver"). Que dos mapas seguidos no abran igual.
  - **⭐ INNOVA el TIPO de concepto, no solo las palabras (Iker, 2026-07-22).** El molde de "esquina / rincón / posición en el mapa" ya está muy usado (Galicia "esquina del Atlántico", y el primer intento de Murcia era "la esquina de abajo a la derecha"). Sal de la metáfora de POSICIÓN: tira de otros accidentes geográficos o rasgos (clima, río, costa, aridez, un lago…). Murcia se resolvió con **"un desierto con playa"** (la paradoja: el sitio más seco que riega a media Europa) en vez de otra "esquina".
- **⚠️ NO criticar otras regiones/ciudades ESPAÑOLAS.** Estos posts buscan **HERMANDAD entre regiones, no dividir el país** (igual que nunca hablamos mal de otra empresa, tampoco de otra región). **Prohibido nombrar/pinchar a Madrid, Barcelona u otras ciudades/regiones españolas** en el concepto o el hook. El "desprecio" es (a) **auto-despectivo** de la propia región (sus clichés) o (b) apoyado en una **frontera extranjera** (los Pirineos están entre España y Francia → "patio trasero de los Pirineos" vale). Nada de "la sala de espera entre Madrid y Barcelona" ni "para media España": genera conflicto entre regiones.
- **⭐⭐ PARA ELEGIR REGIÓN MANDAN LAS IMPRESIONES, NO EL RATIO (Iker, 2026-07-29).** Yo estaba eligiendo por multiplicador y **es el criterio equivocado**: el ratio se mide contra la media de ESA cuenta, así que **se comprime según la cuenta crece** y no dice cuánta gente vio el post. Elegir región es una decisión de ALCANCE PURO, así que la vara es la **impresión absoluta**.
  - **La prueba está en nuestros propios datos:** Navarra 7.72x hizo **79.200** impresiones y Cataluña 7.11x hizo **48.900**. Ratio casi idéntico, **30.000 personas de diferencia**.
  - **Ranking real por impresiones:** Gipuzkoa **112.700** · Navarra **79.200** · Valencia **51.500** · Cataluña **48.900** · Andalucía **29.800** · Bizkaia **21.300**.
  - **⚠️ Y esto tumba una creencia que teníamos:** que "el País Vasco limita el alcance". **Gipuzkoa es el mapa con MÁS impresiones de todo el histórico.** La creencia venía de mirar Bizkaia (3.27x) y de confundir ratio con alcance.
  - El ratio sigue valiendo para comparar un post contra la media de su cuenta y su pilar. Para decidir territorio, no.
- **⭐⭐ CUÁNTAS EMPRESAS: 20 es el objetivo, 10 es el SUELO (Iker, 2026-07-29). Regla TRANSVERSAL de todo el peloteo.** Aquí ponía *"si no llegas a 20 baja a 16"* y se quedaba sin suelo, así que ante una región floja no había criterio para decidir entre publicar o no.
  - **Siempre se apunta a 20 empresas y 20 personas.** Cuantas más, más alcance y más gente que repostea.
  - **Encontrar menos NO descarta la publicación.** Se entrega con las que haya.
  - **Por debajo de 10 empresas y 10 personas, el post NO se hace.** Ese es el suelo.
  - **Y nunca se rellena con inventadas** para llegar a una cifra bonita (`aboutme`: jamás inventar). Antes 14 reales que 20 con seis dudosas.
  - **Excepción: "Los 10" son siempre 10**, ni uno más ni uno menos, como dice su propio nombre.
  - **Los bloques siguen siendo de 4.** Si el número no es múltiplo de 4, el último bloque es de 2 o de 3, nunca de 1: una ficha suelta al final se lee como que se te olvidó algo.
  - **Ojo con el despiece:** al fijar un sector (automoción) el universo se estrecha mucho más que en un mapa, que acepta cualquier industria de la región. **Es el pilar con más riesgo de quedarse corto**, y por eso este suelo importa aquí más que en ningún otro.
  - Mecanizado: `validar-post.py --pilar mapa` falla por debajo de 10 y te dice cuántas llevas.
- **⭐⭐ EL CONCEPTO TAMBIÉN VA EN PALABRA UNIVERSAL, no solo los clichés (Iker, 2026-07-29).** Aquí solo se pedía que fueran universales los 2 clichés, y por ese hueco colé *"un páramo con catedrales"*: **"páramo" no lo usa medio España**. El concepto lo lee TODO el mundo antes de pulsar "ver más", así que **una palabra rara ahí sale más cara que en ningún otro sitio del post**.
  - **La vara son los que ya funcionaron:** `esquina`, `trastienda`, `patio trasero`, `desierto`, `última parada`. **Palabras de andar por casa que cualquiera visualiza al instante.** Genérico en la PALABRA, original en la IMAGEN: `el pasillo con catedrales` es genérico de vocabulario y nuevo de concepto a la vez.
  - **⭐ Y LA ORTOGRAFÍA DEL GANCHO ES LA CASTELLANA (Iker, 2026-07-29).** Escribí `txuleton` en el gancho y **eso autolimita el alcance**: el gancho lo lee toda España y la grafía local añade fricción justo donde más cara sale. Va **`chuletón`**. La grafía de allí (`tx`, `pil-pil`, `txapela`) baja al CUERPO, donde el lector ya está dentro y encima identifica mejor. Es la misma regla que los clichés universales, aplicada a cómo se escriben.
  - **El test:** ¿la usaría un señor de 55 años hablando en un bar? Si dudas, no vale. Literario, técnico o de diccionario = fuera. Y sigue aplicando lo de siempre: **el concepto no se repite NUNCA, ni entre cuentas.**
- **⭐ Clichés del GANCHO: EXACTAMENTE los 2 más UNIVERSALES que tenga la región. Los específicos van al CUERPO** (2026-07-17). **Máximo 2, no 3 (Iker, 2026-07-22).**
  - **⚠️ El CONCEPTO no puede colar un 3er cliché sin que te des cuenta.** Murcia salió *"un desierto con playa: sol, tomate"* → "playa" iba en el concepto pero cuenta igual: son 3 (playa, sol, tomate). Se quitó → *"un desierto: sol, tomate"* (2). Cuenta TODAS las palabras-cliché del gancho, vengan del concepto o de la lista.
  - **⚠️ NO repitas una palabra-cliché ya usada en otro mapa.** "playa" ya se gastó en Valencia ("playa y paella"); por eso se cayó de Murcia. Antes de fijar los 2, cruza mentalmente contra los conceptos/clichés del `historial-publicaciones`.
  - **El gancho lo lee TODO el mundo; el cuerpo solo el que ya ha pulsado "ver más".** Cada palabra que un señor de Cuenca no entiende es fricción en el sitio donde más cara sale. `pan con tomate` y `playa` los pilla toda España; `calçots` y `cava` no, así que esos bajan al cuerpo, donde además identifican mejor porque el que lee ya está dentro.
  - **Es la MISMA regla de `global §2.3`**, que ya decía *"cuanto más genérico el gancho, más lejos llega; la especificidad va en el cuerpo"*. Aquello se escribió para la jerga de ventas (CRM, ICP); esto lo extiende al vocabulario regional. Mismo principio, otro eje.
  - ⚠️ **Esto NO está probado con datos, y conviene saberlo.** Los ganchos con clichés universales (Galicia `pulpo y el Camino` 7.29x · Valencia `playa y paella` 6.77x) baten a los locales (Álava `pintxo-pote` 3.59x · Aragón `jota, Pilar y ternasco` 2.53x)… **pero todos los universales son de Iker y todos los locales son de Unai y Asier**. Está confundido con la cuenta: los 3 mapas de Unai caen entre 3.2x y 3.7x hagan lo que hagan, y los 6 de Iker entre 5.4x y 12.9x. **La comparación limpia exige la MISMA cuenta.** Se adopta por coherencia con §2.3 y porque no cuesta nada, no porque el dato lo diga.
  - Los clichés siguen siendo de ESA región (Sevilla → feria y playa; Valencia → paella y Fallas): universal no es genérico, es que se entienda fuera.
- **⚠️ MATIZ MEDIDO EL 2026-07-30, al mecanizar esto en el validador:** al pasar los checks del gancho contra el histórico salieron **dos cosas que contradicen la receta**, y mandan los datos. **(a)** El mejor mapa de todos, *"Nadie habla del pueblo de 7.000 habitantes que exporta más que países enteros"* (**12.89x**), **NO lleva frase-rabia**. **(b)** Ese mismo y el de Andalucía (*"8,7 millones de habitantes"*, 5.38x) **llevan CIFRA en el gancho**, y en los dos la cifra ES el concepto. Así que las dos reglas van en el validador como **AVISO y no como fallo**: se recuerdan, no se imponen. **La única que sí es fallo duro es el sujeto ajeno**, porque esa la cumplen todos los ganchos buenos sin excepción.
- **⭐ EL VERBO DEL PREJUICIO ROTA SIEMPRE (Iker, 2026-07-31).** El **sujeto ajeno** es obligatorio y no se toca (`la ven`, `nadie habla de`, `la tienen`), pero **el VERBO que lo acompaña se gasta y hay que cambiarlo cada vez**. Pasó con `fichada`: la estrené el 30/07 en el despiece de Euskadi (*"nadie lo tiene fichado como tierra de coches"*), me gustó porque pega mucho más que `la ven`, y al día siguiente abrí el mapa de Asturias con *"la tienen fichada"* **y encima la repetí otra vez tres líneas más abajo**. El verbo es lo PRIMERO que se lee: repetirlo convierte el pilar en plantilla y el lector deja de notar el desprecio, que es el motor entero. **No es que el verbo sea malo, es que ya está gastado, y eso es peor.**
  - **Familia al mismo nivel de potencia, para rotar:** `la tienen jubilada` · `la despachan como` · `la dan por amortizada` · `la entierran con` · `nadie la cuenta como` · `la tienen archivada` · `la dan por vista`. El listón es *"¿duele tanto como fichada?"*; si el verbo es tibio (`la ven`, `la asocian a`) no vale, aunque el sujeto ajeno esté bien puesto.
  - **La PREPOSICIÓN va con el verbo, y cambiarla estropea la imagen (Iker, 2026-07-31).** `fichada`/`despachada`/`catalogada` piden **`como`** (son etiquetas: te clasifican *como* algo). `jubilada`/`enterrada`/`archivada` piden **`en`** (son destinos: te mandan *a* un sitio). *"La tienen jubilada **como** un museo"* se lee raro porque un museo no está jubilado; *"jubilada **en** un museo minero"* la convierte en **pieza expuesta**, que humilla mucho más que una comparación. **Y el que manda a un SITIO regala el cierre**: el remate *"El museo está muy bien. La fábrica de al lado, mejor"* rebota porque los dos son lugares.
  - **El mejor verbo es el que hace daño en ESA región concreta:** en Asturias `jubilada` gana a todos porque el prejuicio real es el de la cuenca cerrada. Búscalo así, no de la lista.
  - **Mecanizado:** `VERBO_PREJUICIO_QUEMADO` en `scripts/validar-post.py`. **Cuando publiques un peloteo, mete ahí el verbo que hayas usado.** La lista solo crece y el check es fallo duro.
- **Frase-rabia (OBLIGATORIA — es el motor de la rabia, no un adorno):** el remate que despacha la región en cuatro palabras y hace que el local comente para defenderla. **NUNCA la escribas igual que la vez anterior, pero NUNCA la omitas.** Validadas: Navarra `toro, txistorra y poco más` · Álava `buena para un pintxo-pote y para irse` · Aragón `un ternasco antes de seguir carretera`. Familia de variantes para rotar: "y para de contar", "y gracias", "y poco que rascar", "buena para [comer X] y [largarse]", "sitio de parar y seguir". El patrón es: **[cliché de comida/fiesta] + [gesto de despacharla]**. Si el hook no tiene este beat, el local no siente el desprecio → no comenta → no hay motor.
- **Cierre:** `Y exporta más que [PAÍS] entero 👇` (el país sale del Paso 2).
- **Verbo punchy con techo** (`global §2.9`) donde el hook lleve verbo (exportar, vender, cargar…).

**Paso 2 — Elegir y VERIFICAR el PAÍS de comparación** (sub-procedimiento — antes NO lo tenía):
1. Busca el **dato oficial más reciente de exportaciones de la provincia/región** en euros, **citando fuente** (EUSTAT / ICEX / Datacomex).
2. Lista los países que exportan **un poco MENOS** que esa cifra → candidatos a "XXX exporta más que [país] entero". Para cada candidato: **nombre, cifra y año**.
3. **Elige el país que MÁS frene el scroll** para nuestra audiencia (director industrial español de 50-60): prioriza países **conocidos** y que **sorprendan** (que parezcan "más grandes/importantes" que una provincia — Bolivia, Croacia, Portugal, Luxemburgo, Honduras, Italia han funcionado). Itera varios y quédate con el más impactante.
4. **INNEGOCIABLE — el dato tiene que ser real y verificable, con fuente.** Nunca sacrifiques veracidad por impacto: un dato mal → el primer comentario de un local corrigiéndote hunde el post (de 6x a 0.5x). Entre dos países igual de impactantes, el de dato más sólido.
5. **⚠️ VERIFICACIÓN DE LA COMPARACIÓN-PAÍS — la más traicionera** (auditoría 2026-07-23: se colaron DOS falsas en posts publicados). Reglas duras:
   - **Mercancías contra mercancías, mismo año.** Compara exportación de BIENES de la región contra exportación de BIENES del país (OEC/COMTRADE/Eurostat), no contra su PIB ni sus exportaciones de servicios. "Andalucía más que Italia" era falso (Italia ~600.000M€ vs Andalucía ~40.000M€, 15x). "Álava más que Honduras" era falso (Honduras ~10.200M€ > Álava 9.151M€).
   - **La fuente tiene que publicar ese país.** Citamos "(EUSTAT)" para un dato de Honduras que EUSTAT no publica jamás. La fuente del país es Banco Mundial/OEC/COMTRADE, y va citada como tal.
   - **Exige MARGEN, no empate.** Si el país queda a menos de ~15% por debajo, un comentarista con otra fuente (WITS vs COMTRADE dan cifras distintas) te lo invierte. Navarra vs Bolivia quedó casi en empate: evita esos. Elige un país claramente por debajo.
   - **Re-verifica al REUTILIZAR el mapa** (para la web u otra cuenta): las cifras caducan. Varias regiones publicaron un total de exportación que ya no cuadra con el último año oficial (Cataluña, Aragón, Navarra, Álava, Bizkaia). Antes de reciclar, recomprueba el último dato.

**Paso 3 — CUERPO** (fiel a `swipe-file §2.1` + voz `brand-voice`, VARIANDO expresiones):
1. Setup corto justo tras el gancho (sin preámbulo en la línea 2).
2. **Los 3 datos numéricos en lista (1/2/3), cada uno con FUENTE citada** (Eurostat, EUSTAT, Banco Mundial, Datacomex…). El primero suele ampliar la comparación del gancho.
   - **NUNCA pongas la FECHA/AÑO de la fuente en el cuerpo.** Cita el nombre (`(IAEST y Banco Mundial)`), nunca `(EUSTAT 2024)` ni "vendieron 15.615M€ **en 2025**". Motivo: el lector ve un año y lee el post como viejo aunque se publique hoy → rechazo y scroll. El dato SIEMPRE va verificado y con su año registrado **fuera del post** (entrega interna); si alguien pregunta el año en comentarios, se le responde ahí y suma credibilidad. Usa referencias temporales relativas o ninguna: "ya adelantó", "en un año", presente ("venden al mundo").
3. **⭐⭐⭐ LOS 4 INGREDIENTES DEL CUERPO, sacados del mapa de Navarra (79.224 impresiones) el 2026-08-03.** Aquí ponía *"cuerpo saturado de clichés, tejidos"*, y con esa frase entregué un cuerpo de Castilla y León que **no nombraba ni un solo sitio de Castilla y León**. Iker: *"tienes que desvelar el resto de cosas que hay dentro: ciudades, pueblos, lo que sea"*. Los cuatro, y ninguno es opcional:
   - **(a) LUGARES CONCRETOS de dentro de la región, con nombre.** Navarra dice *"montados en Landaben"*. No vale "en la región" ni "en sus fábricas". **Pueblos mejor que capitales**: el de Aguilar de Campoo se siente señalado; el de "Palencia" no tanto. Salen gratis de las fichas del CSV, que ya llevan la ubicación de cada empresa.
   - **(b) PRODUCTOS QUE EL LECTOR TIENE EN CASA.** Navarra: *"la ensalada en bolsa, las conservas, la pasta de tomate que tienes en la nevera"*. Es el eje de **ubicuidad invisible**, y es lo que convierte una lista de empresas en algo que te toca a ti. Formato: `[producto de casa], desde [pueblo]`.
   - **(c) ANÁFORA DE NEGACIÓN con clichés locales.** Navarra: *"No paga las nóminas San Fermín. No las pagan las subvenciones forales. No las paga el pacharán de sobremesa."* Es lo que da el mérito sin caer en el eje "callado", que está prohibido.
   - **(d) UNA LÍNEA DE MÉRITO HUMANA, con un oficio dentro.** Navarra: *"gente que empezó barriendo una nave y acabó dirigiéndola"*. Una persona haciendo algo concreto, nunca un adjetivo.
   - **🚫 Y LOS CLICHÉS DEL CUERPO NO SON LOS DEL GANCHO (Iker, 2026-08-03).** En el gancho van los **2 más universales**, y en el cuerpo van **otros, y más locales**, precisamente para que el de allí se sienta identificado. Yo puse `trigo` en el gancho **y lo repetí en la línea del reveal**. Castilla y León: gancho `trigo, castillos` → cuerpo `niebla, murallas de Ávila, acueducto, morcilla, cochinillo`. **Si una palabra ya salió arriba, abajo no vuelve.**
3. **⭐⭐ LA DENSIDAD DE CLICHÉS ES EL MOTOR, NO EL ADORNO. MÍNIMO OCHO (medido el 2026-08-05).** Aquí ponía "4-8" y ese suelo de 4 es el que hundió Asturias.
   - **La medida, con los dos extremos del histórico:** **Navarra, 79.224 impresiones, DIEZ guiños** (San Fermín · el pañuelo rojo · las subvenciones forales · el pacharán de sobremesa · Landaben · los Volkswagen · las palas de los molinos · la ensalada en bolsa · las conservas · la pasta de tomate). **Asturias, 2.297 impresiones, CUATRO** (sidra · fabada · las vacas · hórreos). Es el peor mapa de todo el histórico.
   - **Por qué es el motor y no decoración:** este pilar funciona porque **el local se siente aludido y comenta o repostea**. Cada cliché es un anzuelo distinto; con cuatro solo pican los de la capital, con diez pica el del pueblo, el que trabaja en esa fábrica y el que se ríe del tópico. **Menos clichés = menos gente que se da por aludida = menos alcance.**
   - **Y no valen cuatro genéricos:** tienen que mezclar comida, fiesta, paisaje, marcas locales, un barrio o polígono concreto y algo que solo sepa el de allí.
   - Cuerpo saturado de **clichés de la zona nueva** (mínimo 8, tejidos), anáfora de negación ("No paga X. No las pagan Y."), frases-oficio, y variedad de formato (bloques de 2/3, líneas sueltas, escalera).
4. **⭐⭐ EL REVEAL VA ANTES DE LA LISTA, Y DETRÁS DE ÉL EL BARRIDO GEOGRÁFICO (medido el 2026-08-03 sobre los 14 mapas publicados).**
   - **🔄 DECISIÓN DE IKER, 2026-08-03: el reveal pasa a ir DESPUÉS de la lista, y con él todo el bloque final.** Yo le puse delante los datos, que van al revés (**13 de 14 mapas publicados lo llevan ANTES**, y el único que lo lleva después es Asturias con 2.090 impresiones, el peor). **Pero esa evidencia es débil y hay que decirlo:** el de Asturias era de Unai, en viernes, con una empresa repetida y estrenando el ultra ninja, así que su fracaso no se puede achacar a la posición del reveal. Un solo caso confundido no es una regla.
   - **El argumento de Iker, que es estructural y no de datos:** *"si todo el peso está antes de las menciones, ¿para qué vas a seguir leyendo el post?"*. **El post tiene que quedar equilibrado**: gancho → bloque de datos → una línea → menciones → y el resto (clichés, mérito, reveal, barrido y spam ninja) DESPUÉS. Medido en el de Castilla y León: **589 caracteres antes de la lista y 617 después**. Ese es el reparto que se busca.
   - **🔴 Y OJO CON MEDIRLA MAL: el mapa de Castilla y León se publicó el 04/08, en AGOSTO, con media España de vacaciones.** Además llevaba **tres cambios experimentales a la vez** (reveal abajo, sin CTA de comentario, concepto de familia nueva). **Si rinde flojo, no sabremos cuál de las cuatro cosas fue.**
     - **Cómo se mide bien:** NO se compara contra Navarra (79.224, junio) ni Galicia (64.566, junio). Se compara contra **otro post de Iker de esas mismas semanas de agosto**, para que el mes se cancele. Si no lo hay, **la hipótesis se queda sin resolver y se vuelve a probar en septiembre**, con un solo cambio cada vez.
     - **La lección general:** meter varios cambios a la vez en el mismo post ahorra tiempo pero **destruye la posibilidad de aprender**. Cuando haya varias hipótesis, se reparten entre publicaciones.
   - **⚠️ QUEDA COMO HIPÓTESIS A MEDIR, no como verdad.** Es un cambio contra la mayoría del histórico, así que **cuando este mapa tenga números, se compara contra los de Iker con el reveal arriba** (Navarra 79.224, Galicia 64.566) y se decide con datos, no con preferencia.
   - **Y justo detrás del reveal va un BARRIDO GEOGRÁFICO de la región, nombrando dos extremos.** Navarra (79.224): *"De Pamplona a la Ribera, exportando… mientras el resto solo la recuerda en julio"*. Es lo que hace que el post no hable de una capital sino de un territorio entero, y es lo que engancha al de un pueblo pequeño. **Formato: `De [sitio A] a [sitio B], [lo que hacen]`.**
     - **⚠️ UNA LÍNEA, Y CORTA (Iker, 2026-08-03).** Es un **beat punchy**, no una frase explicativa: tiene que caber en una línea del móvil. Yo entregué *"De Aguilar de Campoo a la Ribera del Duero, cargando contenedores mientras el resto solo la cruza"* (**98 caracteres**, se parte en dos) y quedó en *"De Aguilar de Campoo a Peñafiel, cargando desde antes de amanecer"* (**66**). **El valor que NO se puede perder al acortar es el humano**: alguien haciendo algo concreto. Lo que se sacrifica es el contraste con "el resto", que ya lo lleva el gancho.
     - **⚠️ OJO, ESTO NO ES UN TOPE DE LONGITUD PARA TODO EL POST.** Medido el 03/08 sobre los mapas de Iker con más de 20.000 impresiones: hay **líneas de prosa de hasta 189 caracteres** y la mediana es 61. Un tope duro tumbaría al de 79.224 y al de 64.566. **Lo corto se exige en los BEATS punchy** (barrido, reveal, cierre), no en las líneas explicativas.
     - **🚫 Y la fórmula del barrido ROTA como todo lo demás.** Ya está usado: `exportando en silencio mientras el resto solo la recuerda en julio` (Navarra) y `cargando desde antes de amanecer` (Castilla y León). **No repitas "mientras el resto…" en el próximo**: cambia el verbo y el gesto (madrugar, cargar, soldar, salir de noche, no fallar una fecha). Ojo: la versión de Navarra lleva *"en silencio"*, que hoy está **prohibido** (`§4.2 Paso 3.5`); se copia la estructura, no ese eje.
   - **ORDEN EXACTO (Iker, 2026-08-03):** gancho → setup de 2 líneas → **bloque de 3 datos** → una línea → frase de entrada a la lista → **LISTA** → productos con su pueblo → línea → anáfora de negación → línea de mérito → clichés locales → **reveal** → **barrido geográfico** → **CTA al mapa** → cierre bold statement.
   - **🚫 NADA DE PEDIR COMENTARIOS (Iker, 2026-08-03).** Los mapas antiguos remataban con *"¿Falta la tuya? Coméntala y la añado al mapa"*, y **eso ya no se pone**: con el CTA del mapa ya hay un enlace, y **meter un segundo CTA rompe justo lo que hace fuerte al ultra ninja, que es no pedir nada** (`global §4.4b`). Un CTA que no pide no se puede declinar; dos se leen como anuncio.
4. **Reveal tardío:** "Sí, hablo de [región]."
5. **🚫 EL EJE "CALLADO" ESTÁ QUEMADO — prohibido.** Nada de "aquí se vende callado", "trabajan en silencio", "no lo cuentan", "no salen en la foto", "nadie los conoce", "sin hacer ruido" en el cuerpo, el spam ninja NI el cierre. Lo hemos usado en TODAS las regiones y quien nos lee lo tiene fichado: **no puede ser que todas las regiones estén calladas, alguna hablará**. Además es un ángulo de lástima ("pobrecitos, nadie les hace caso") cuando lo que queremos es dar **mérito y protagonismo**. (Ojo: el silencio SÍ es el eje propio de "Los 10" §4.3 — la persona invisible. En mapas, no.)
   **Ejes de mérito para rotar** (uno por mapa, nunca repetir el del anterior): **carácter forjado por la geografía** (Aragón: "el cierzo no deja crecer nada flojo") · **ubicuidad invisible** ("lo tienes en casa y no sabes ni cómo se llaman") · **exigencia del cliente** ("aquí te compra quien no perdona un retraso") · **oficio heredado** ("empezó barriendo la nave y acabó dirigiéndola") · **récord contra pronóstico**. El local tiene que pensar "qué bien, nos están dando mérito", no "qué pena damos".
6. **VARÍA las expresiones** frente a mapas anteriores: mismo formato/pilar (mismos bloques de 2/3, mismas ideas), pero **palabras, ángulos y ARRANQUES de bloque distintos**. No abras siempre igual — ni todos los bloques con "No es X, no es Y" (la anáfora de negación), ni repitas comodines ("La gente y las empresas que mueven todo esto:" → dilo distinto cada vez). Rota el arranque: verbo, nombre, lugar, número (`working-preferences §4`). Que se note que es un mapa NUEVO, no un calco.

**Paso 4 — EMPRESAS y PERSONAS a mencionar** (las rellena el workflow vía Unipile — antes se dejaba vacío):
Objetivo: 20 empresas industriales B2B de la región, cada una con UNA persona concreta mencionable y **activa** en LinkedIn, ordenadas de mayor a menor probabilidad de interactuar.
- **Criterios de empresa:** 100-700 empleados (evita megaempresas demasiado corporativas); medianas/grandes, familiares, founder-led o con directivos visibles; sectores industriales (metalurgia, máquina-herramienta, bienes de equipo, automoción, aeronáutica, energía/oil&gas, forja, fundición, calderería, naval/offshore, electrónica, ingeniería, química, caucho, plástico, alimentación industrial…); cubre TODO el territorio (no solo la capital); prioriza exportadoras / presencia internacional. (Para el País Vasco hay una semilla de 346 empresas ICP: `ref_empresas_industriales_pais-vasco.csv` — úsala como punto de partida pero verifica igual con Unipile.)
- **Persona (en este orden):** 1) CEO / director general / gerente; 2) fundador / presidente / propietario; 3) director comercial / marketing / desarrollo de negocio / export manager.
- **Actividad (filtro duro) — que COMENTE a otros, no solo que publique (Iker, 2026-07-24):** en los **últimos 3 meses** tiene que haber **comentado en el post de OTRA persona**. NO basta con que publique o comparta en su propio perfil: si solo emite y nunca comenta a nadie, la probabilidad de que nos comente a nosotros es bajísima, y una mención así es tirar el hueco. Se comprueba con `GET {BASE}/api/v1/users/{provider_id}/comments?account_id=…` (devuelve los comentarios que HA HECHO, con fecha). **Ordena por recencia del último comentario:** quien comentó esta semana bate a quien comentó hace 2 meses. Sin comentario en 3 meses = descártalo, aunque publique a diario. Si nadie de la empresa comenta, **descarta esa empresa** y coge otra. Verifica que el cargo sea ACTUAL. (Caso real: Jaione de ikale tenía el último POST hace 3 meses —parecía dormida por la regla vieja— pero había comentado hace 2 días y comenta sin parar → mención excelente.)
  - **⭐⭐ LA VENTANA ES FLEXIBLE, NO UN MURO (Iker, 2026-08-07).** Lo IDEAL es que haya comentado en el **último mes**. Pero **descartar una empresa buena porque su gente no comenta desde hace 40 días es tirar la empresa por culpa de la persona**, y eso no compensa. La escalera: se busca a 1 mes; si no hay nadie, se abre a 2; luego a 3; y **hasta 6 como techo**. Iker: *"más de 3 meses sin comentar no creo que nos convenga, o expandirías hasta 6"*. **Por encima de 6 meses no, ahí ya no comenta.**
  - **Y si ni a 6 meses hay nadie, la empresa NO se cae: va SOLO con el nombre de empresa.** Es lo que faltaba escrito. El 07/08 yo quité las 4 personas verificadas del despiece de Navarra porque a 8 empresas les faltaba, y eso es justo al revés: **se pone lo que se tiene**. Iker: *"como hay dos que no tienen, entonces no pones ninguna, eso no me parece bien"*. Una ficha sin persona sigue mencionando a la empresa.
  - **Agosto y Navidad son la excepción obvia:** medio sector está de vacaciones y la ventana corta deja el pilar sin gente. Ahí se abre a 6 sin pensarlo.
  - **¿3 meses o 1 mes?** 3 meses en el filtro duro. Comentar es más esporádico que publicar; exigir "comentó en el último mes" encoge demasiado el pool y deja fuera a gente válida que comenta cada 6-8 semanas. El mes se usa para RANKEAR (más reciente, mejor), no para descartar.
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
- **⛔⛔ LA EMPRESA CALIFICA POR DONDE FABRICA, NO POR LO QUE DICE SU PÁGINA (Iker, 2026-08-07).** Vale para **mapa, "Los 10" y despiece**, los tres.
  - **El fallo:** el 07/08, verificando automoción de Navarra, tumbé **14 de 23 candidatas** porque su página de LinkedIn devolvía la sede global — Benteler en Salzburgo, KYB en Tokio, SKF en Gotemburgo, Kromberg en Wolfsburgo, Weidplas en Suiza, Knorr-Bremse en Múnich—. **Todas tienen planta en Navarra.** Iker: *"con que la empresa tenga relación con la región, o sea que su planta siga estando ahí, la podemos mencionar igual, porque si no nunca vamos a tener empresas"*.
  - **Y ya había precedente nuestro:** en el mapa de Castilla y León entraron **CROPU** (sede en Cantabria) y **Campofrío** (sede en Madrid) porque su centro está en Burgos. La página muestra la SEDE, no la planta, y eso ya estaba escrito.
  - **⭐ EL ANCLA ES EL ORIGEN, NO LA PLANTA (Iker, 2026-08-07, precisando lo de arriba):** *"lo importante es que el origen de la empresa sea en esa región"*. **✅ CALIFICA la que NACIÓ allí**, aunque su página ponga hoy otra ciudad porque creció, la compraron o movió el domicilio social. **❌ NO califica la multinacional de fuera con planta allí**: Benteler es alemana, KYB japonesa, SKF sueca. Tienen fábrica en Navarra y aun así no son de Navarra.
  - **Y esto MEJORA el post, no lo empeora.** El motor del peloteo es el orgullo de pertenencia, y *"esta empresa es de aquí"* pega mucho más fuerte que *"esta multinacional tiene aquí una nave"*. La regla de origen no es una traba burocrática: es la que hace que el post funcione.
  - **Consecuencia práctica: no se descarta por la ciudad de la página.** `Lizarte` sale en Hospitalet y nació en Estella; `Seinsa` sale en Madrid y es navarra. Esas VUELVEN a entrar. Lo que decide es el origen, y se verifica: su web, su historia, el año y el sitio de fundación, o el topónimo en el propio nombre (`Frenos Iruña`, `Tafalla Iron Foundry`).
  - **Si existe la página LOCAL, se menciona esa y no la del grupo** (`GONVAUTO NAVARRA SA` antes que `Gonvauto`, `TI GROUP AUTOMOTIVE SYSTEMS PAMPLONA SA` antes que `TI Fluid Systems`): notifica a la gente que está allí, que es de quien queremos el comentario.
  - **🔴 LO QUE NO CAMBIA: la colisión de nombre sigue matando.** Buscando `MAPSA` sale una asociación de colegios de Michigan y buscando `SAKANA` sale Sakana AI, de Tokio. **Que ahora aceptemos sedes de fuera hace esto MÁS peligroso, no menos**, porque ya no puedo usar "la sede no es de la región" como señal de alarma. La descripción se lee siempre.
- **Orden:** por probabilidad de interacción (actividad reciente > cercanía industria/territorio/exportación > perfil personal visible > tamaño adecuado).
- **🔗 EL ENLACE DE LA GUÍA SE SACA DE `public_identifier`, NUNCA SE DEDUCE DEL NOMBRE (Iker, 2026-08-05).** Escribí a mano `linkedin.com/company/telpark/` a partir del nombre "Telpark" y **seis de los ocho enlaces de esa guía estaban rotos**: el de AFM es `afmcluster`, el de UPTEK es `uptek-afm`, el de Multiverse es `multiversecomputing`, el de Arania es `arania-s-a-` y el de Betsaide es `betsaide-sal`. Ninguno se parece a su nombre.
  - **Y el de Telpark era peor que un 404: apuntaba a OTRA EMPRESA.** `/company/telpark/` es una `TELPARK` de Bury, en Reino Unido, que gestiona un centro comercial. La nuestra vive en `/company/empark-aparcamientos-y-servicios-s-a/` porque Telpark es la marca de Empark. **Dos páginas con el mismo nombre y distinta empresa: deducir la URL te manda a la equivocada sin que te enteres.**
  - **Siempre así:** `GET /linkedin/company/{id}` → `public_identifier` → `https://www.linkedin.com/company/{public_identifier}/`. Es el mismo error de familia que el `logoUrl` inventado del Paso 4: **un campo no se escribe de memoria, se lee de la API**.
  - **Ojo, esto NO afecta a la mención del post**: ahí va el `name`, y LinkedIn lo resuelve solo en el desplegable. El `public_identifier` es solo para el enlace de la guía.
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
- **🚫 NO AVISES DE LOS NOMBRES CON SÍMBOLOS, PARÉNTESIS O TAGLINE. ERA FALSO (Iker, 2026-08-03).** Aquí ponía que `@Lingotes Especiales SA (LGT)` o `@Cartonajes Barco | Soluciones de embalaje` daban problemas al buscar la mención y que había que recortarlos. **No es verdad: con la @ delante, Iker hace clic y LinkedIn los encuentra perfectamente**, paréntesis y barras incluidos. El aviso solo metía ruido y le hacía dudar de nombres que funcionan. **Los nombres van completos y sin nota de ningún tipo**, que es justo lo que pide el Paso 4. Yo escribí esta regla sin comprobarla contra el uso real.
- **Ejecución y credenciales:** **Claude lo ejecuta** vía Unipile. Las credenciales **NO van en el repo** — ya están puestas como **variables de entorno**: la **API key** de Unipile, la **URL/DSN base** (host + puerto) y el **account_id**. Léelas de ahí en el runtime (nombres del tipo `UNIPILE_API_KEY`, `UNIPILE_DSN`/URL, `UNIPILE_ACCOUNT_ID` — usa las que estén configuradas; si no las encuentras, lista las env vars del entorno). Construye las llamadas (`GET {DSN}/api/v1/linkedin/company/{identifier}`, cabecera `X-API-KEY`) con esos valores. Nunca hardcodees la key. (Respaldo si el account_id no estuviera en env: `7F9jXBHXQJyR--5uTD62OQ` — no es secreto sin la key.)
- **URLs de LinkedIn:** al sacar cada empresa+persona, captura también la **URL de LinkedIn de la empresa** (su página) y la **URL del perfil de la persona**. Sirven para la guía de menciones del output (Paso 10).
- **Menciones:** las @-menciones reales las pone el usuario a mano en LinkedIn (copiar/pegar no arrastra los tags). El workflow entrega los NOMBRES en el bloque del cuerpo **y, aparte, la guía de menciones con los enlaces** (Paso 10) para que el usuario encuentre a la persona/empresa correcta sin confundirse con homónimos.

**Paso 5 — CTA AL MAPA (link a `recursos.neety.com/mapas/{región}`) — NO es el cierre:**
> **Las 7 reglas de forma del bloque están en `global-instructions §4.4b` (posición, máx 2 líneas, `https://` delante). Léelas ahí, no de memoria.** Aquí lo específico del mapa:
- **⚠️ EL ENLACE DEL MAPA VA A `recursos.neety.com/mapas/{región}/`, NO a agendar** (Iker, 2026-07-23). El jefe ya pagó PamPam, así que la web de recursos **embebe el mapa completo** de esa región. Se enlaza ESO. El CTA a `/agendar/` se olía a venta ("te decimos en cuál sembrar y cuándo" = demo); el enlace al mapa se lee como **recurso**, que es lo que el lector ya venía a buscar, y captura igual (la propia página de recursos lleva su gate/CTA a agendar). El slug es la región en minúscula y sin tildes: `/mapas/murcia/`, `/mapas/aragon/`, `/mapas/pais-vasco/`. **Verifica que la página existe antes de entregar** (WebFetch a `recursos.neety.com/mapas`); si aún no está subida, va como `[PENDIENTE · subir el mapa a recursos]`.
- **⭐⭐ ESTO NO ES UN SPAM NINJA MEJOR, ES DE OTRA CATEGORIA (Iker, 2026-07-31: "yo a esto lo llamaria ULTRA NINJA").** Merece entenderse, porque explica por que gana y que hay que vigilar. Cuatro cosas que se acumulan:
  1. **No pide nada.** Promete justo lo que el lector venia buscando tras leerse 12 empresas. Sin demo, sin "te ayudamos", sin nada que rechazar. **Un CTA que no pide no se puede declinar.**
  2. **El clic es autoseleccion pura.** Solo pincha a quien le interesa la industria de ESA region, que es exactamente el ICP. Ese clic vale mas que cien impresiones.
  3. **Aterrizan en NUESTRO dominio, no en PamPam.** El trafico es nuestro, el SEO es nuestro, y **quien vende es la pagina, no el post**.
  4. **Y ahi esta lo ultra:** la venta ocurre **DESPUES** del clic. El spam ninja normal todavia huele un poco a pitch; este no huele a nada. Descubren que es nuestra web cuando ya estan dentro.
- **🔴 LA CONSECUENCIA, Y ES LA PARTE QUE SE OLVIDA:** si el post ya no vende, **quien tiene que convertir es la PAGINA**. Todo el peso del gate y del CTA a agendar se ha mudado alli. **Si esa pagina no captura, el post entero se queda en alcance bonito.** Asi que al medir un mapa no basta el ratio: hay que mirar **clics al enlace** y **que hace la pagina con ellos**. Y si alguna vez hay que elegir donde invertir una hora, va antes la pagina que el post.
- **Colocación fija: justo DESPUÉS del bloque de menciones.** En este pilar no es "donde quede coherente".
- **Framing de recurso, no de anuncio. Forma corta exacta y COMPLETA: `Mapa completo aquí: {link}`** (sin coma, sin "empresa por empresa", y sin nada delante). Es el molde literal que dio los CTR más altos (Galicia, Valencia, Bizkaia). NO "te decimos", NO "reserva", NO "agenda", NO alargarlo.
- **🔴 CORREGIDO EL 2026-07-31: EN EL MAPA VA SOLO LA LINEA DEL ENLACE, SIN FRASE DE DOLOR DELANTE.** Es el **SPAM ULTRA NINJA** (`global §4.4b`), y el motivo esta ahi: el mapa es el pilar que mas clics genera **precisamente porque nada insinua que llevamos a nuestra web**, y una frase de dolor delante reintroduce el olor a venta que es lo que el ultra ninja elimina. **El bloque de DOS que pide §3.2 se saca de otro par natural del cuerpo.** Lo de abajo es la regla vieja, se conserva porque **sigue valiendo para el spam ninja normal de los demas pilares**:
- ~~**Bloque de DOS líneas pegadas (SIN salto en blanco entre ellas), no dos líneas sueltas**~~ (Iker, 2026-07-23). El chiste del hook va encima del CTA y se leen de un golpe: dolor → fix. Un enlace flotando solo con blanco alrededor tiene pinta de anuncio (ceguera de banner) y rompe el problema→solución; además el spam ninja va SIEMPRE fusionado (`global §4.4b`). El dolor aterriza en el industrial de ESA región con un diferenciador de `aboutme §1b`, girando la palabra del hook. Validado (Murcia, hook del desierto):
  > `Picar 500 puertas frías para sacar uno. Eso es sembrar en el desierto.`
  > `Mapa completo aquí: https://recursos.neety.com/mapas/murcia/`

**Paso 6 — CIERRE del post:** una **frase punchy tipo bold statement** que remate el post. **NO** pide comentarios, **NO** hace pregunta, **NO** repite el link. Es un claim fuerte que cierra (p. ej. "Al final las que más venden son las que menos lo cuentan.").

**Paso 7 — Ensamblar el TEXTO** copy-ready, en este orden: **gancho → cuerpo (3 datos + clichés + reveal) → 20 empresas en 5×4 → CTA al mapa (link `recursos.neety.com/mapas/{región}`, NO agendar) → cierre punchy**. Corre el pase de validación (§8) en silencio.

**⭐⭐ COORDENADAS: UNA DISTINTA POR EMPRESA, NUNCA LA DE LA CAPITAL (Iker, 2026-08-03).** En el CSV de Castilla y León le puse a las 4 empresas de Burgos **la misma coordenada, la de la capital** (`42.3400, -3.7000`). PamPam las apiló en el punto exacto y **salieron como puntos sin logo y sin nombre**: cuatro menciones tiradas. Se vio a simple vista en el mapa montado, porque las cuatro fallonas eran justo las cuatro pegadas.
- **Cada empresa lleva la coordenada de SU dirección**, que sale del campo `locations` de su propia página (`GET /linkedin/company/{id}` → `locations` con `street`, `city`, `postal_code`). Un polígono industrial y el centro de la capital están a 3-4 km, y con eso PamPam ya las separa.
- **Comprobación obligatoria antes de entregar el CSV:** que **no haya dos coordenadas iguales**. Es una línea de código y evita el fallo entero:
  ```python
  assert len({f[4] for f in filas}) == len(filas), 'coordenadas repetidas'
  ```
- **🚫 LOS MAPAS YA PUBLICADOS NO SE RETOCAN (Iker, 2026-08-04).** El de Asturias comparte coordenada en tres empresas y probablemente le pasó lo mismo, pero **ya está subido y rehacerlo no cambia nada**: la regla existe **de cara al futuro**. Vale para cualquier corrección de este tipo — se arregla la receta, no el pasado.
- **🔎 Y de paso, mirar la dirección revela cosas:** al sacarlas salió que **CROPU tiene la sede en Guarnizo (Cantabria)** y **Campofrío en Alcobendas (Madrid)**, aunque las dos tengan centro en Burgos. Es el patrón de siempre: **la página muestra la SEDE, no la planta**. No las tumba, pero se avisa en la entrega para que el usuario decida.

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

**Paso 9b — PROMPT PARA EL PROGRAMADOR de la página del mapa:**
- **⚠️ NO SE ESCRIBE DE MEMORIA NI MIRANDO LA WEB POR FUERA (Iker, 2026-07-31).** Escribí el de Asturias calcándolo de lo que se veía en la de Murcia ("reutiliza el mismo layout, la misma tipografía") y **contradecía cosas que el programador ya sabe de la web**: yo describía la fachada, no cómo está montada por dentro. Y encima me inventé un título cuando el **Paso 9 ya fija la plantilla** `[Región]: el músculo industrial`.
- **Un párrafo, explicado como a un amigo, específico y sin secciones** — igual que los prompts de imagen (`images §0a`). Nada de listas, ni bloques con encabezados, ni meta-título/meta-descripción sueltos si la web ya los genera.
- **⚠️ DEBAJO DEL PROMPT VA SIEMPRE EL AVISO A MARIO (Iker, 2026-08-03), en su propio bloque**, igual que el de postproducción en los prompts de imagen (`images §0a-penta`). Literal:
  > ⚠️ **Acuérdate Mario de pegarle al final del prompt el código embebido de PamPam.**
  **El disparador es ENTREGAR el prompt, no acordarse.** El hash es lo único que el programador no puede deducir de nada, y si se copia mal el mapa carga vacío sin dar error.
- **Lo que hay que darle cada vez** (esto sí lo pone el post): región, slug, título del Paso 9, descripción del Paso 9, los 3 datos del cuerpo y el **embed de PamPam**, que lo monta Iker desde el CSV y sin él el prompt no está cerrado.
- **📌 CÓMO ESTÁN HECHAS LAS PÁGINAS DE LOS MAPAS (respuesta del programador, 2026-07-31 — esto ya no se pregunta más):**
  - **No hay componente, ni JSON, ni panel.** Cada página es un **HTML estático de 227 líneas clonado a mano**. La master es **`mapas/murcia/index.html`**, que lleva dentro un comentario `PLANTILLA DE MAPA` con los campos marcados `<< EDITAR >>`.
  - Las **10 páginas de hoy comparten estructura idéntica** (cabecera a dos columnas con el mapa a toda altura) y solo cambian **~15 líneas**: título/SEO/OG/canonical, H1, lede, las 3 cifras con fuente, el iframe y el párrafo de valor.
  - Crear una región = copiar la carpeta a `mapas/{region}/`, editar lo marcado y **darla de alta en TRES sitios más**: la **tarjeta** en `mapas/index.html`, su **entrada en el JSON-LD** de esa misma página (*"es lo que se suele olvidar"*, dicho por él) y el **`sitemap.xml`**. Push a `main` y **Cloudflare publica solo en 2-3 minutos**.
  - **🔴 DE MÍ SOLO NECESITA DOS COSAS: la URL pública de PamPam con su hash, y las 3 cifras con fuente.** El `?fullPanelMobile=true`, el iframe y el CSS los pone él. **El SEO, el título, el H1, el canonical y el OG se derivan solos del nombre de la región: NO se los escribo.** El lede lo escribe él con el patrón `[Región]: el músculo industrial` **salvo que yo traiga ángulo**, y traerlo es lo que aporta el workflow.
  - **La portada `assets/mapas/{region}.jpg` la saca ÉL, y es una captura del propio mapa.** Por eso el Paso 11 está muerto (ver abajo).
  - **Tiempo:** menos de una hora desde que tiene URL y cifras, verificación en escritorio y móvil incluida.

**⛔ EL NOMBRE NUNCA SE ACORTA, NI EL DE LA PERSONA NI EL DE LA EMPRESA (Iker, 2026-07-31).** Va **tal cual lo devuelve LinkedIn**, en el cuerpo del post Y en la guía, en **todos los pilares**, no solo en el mapa. Aunque quede largo, aunque lleve `S.A.`, aunque el nombre de la página tenga un guion dentro y choque con el separador ` - ` de la línea.
- **Razón 1, la que él da:** con el nombre recortado **no encuentra el perfil** en el desplegable de la @ y pierde el tiempo buscándolo.
- **🔴 Razón 2, que es peor y la descubrimos en Asturias:** **acortar rompe el detector de repetidas de `§4.0c`.** Yo escribí `@TSK` y el cruce contra el "Los 10" de Asturias de Iker no saltaba; al poner el nombre real, **`TSK Electrónica y Electricidad` salió repetida al instante**. Lo mismo con `@Reny Picot`, que es la **marca comercial** y no el nombre de la página (`Industrias Lacteas Asturianas, S.A.`). **Un nombre acortado no es solo incómodo: esconde violaciones de reglas.**
- **Ojo con las marcas:** la empresa se menciona por el nombre de **su página**, no por la marca con la que la conoce la gente. Si quieres que se entienda, la marca va en la **descripción del CSV**, nunca en la mención.
- **Ojo con las tildes:** si el perfil está escrito sin ellas (`Jesus Angel Perez Fernandez`) se copia **sin ellas**. Manda el perfil, no la ortografía.

**Paso 10 — Guía de menciones** (fuera del post, para pegar las @ a mano): las 20, para que el usuario encuentre a la persona/empresa correcta sin confundirse con homónimos.
- **⚠️ ESTO APLICA AL MAPA (20 menciones). Con POCAS menciones, TABLA DE 4 COLUMNAS (Iker, 2026-07-29).** La frontera es el numero:
  - **Hasta 10 menciones** (historia con peloteo, "Los 10"): **tabla markdown de CUATRO columnas**, en este orden exacto: **nombre de la empresa | enlace de la empresa | nombre de la persona | enlace de la persona**. Se lee de un vistazo y se comprueba fila a fila.
  - **20 menciones (el mapa):** linea a linea, sin tabla, calcando la posicion del post, que es para lo que sirve ahi.
- **NUNCA en tabla markdown** *(solo en el mapa, ver el punto de arriba)*. El usuario la usa línea a línea; la tabla estorba y no se copia bien.
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

**Paso 11 — FOTO de portada, y es para PAMPAM, no para la web.**
> **🔴 ESTO LO MATÉ POR ERROR EL 31/07 Y LO REVIVE IKER EL 03/08.** El programador me dijo que la portada de la **página web** (`assets/mapas/{region}.jpg`) es una captura del propio mapa y la saca él, y yo di por muerto el paso entero. **Eran DOS fotos distintas y las confundí:**
> - **Portada de la WEB** → captura del mapa → **la saca el PROGRAMADOR**. Esa sí que no la doy yo.
> - **Portada de PAMPAM** → foto icónica de la región → **la doy YO**, y va en el output junto al título y la descripción, que son los tres campos que PamPam pide para el mapa.
>
> **Lección: cuando alguien me resuelve una tarea, compruebo QUÉ tarea exactamente antes de borrar el paso.** Borré de más por no distinguir dos cosas con el mismo nombre.
- Una foto **icónica y reconocible de la región** (lo primero que a alguien le viene a la cabeza con "Aragón"): capital/skyline, río, monumento o paisaje-marca. Horizontal, ≥1200px de ancho, que funcione recortada como cabecera.
- **🚫 NUNCA "la primera que salga en Google Imágenes".** Casi todo lo que devuelve Google es **material con copyright** (bancos de imágenes, prensa, fotógrafos). Esta foto va a la **web pública de una empresa** = uso comercial: una reclamación es dinero real y llega por burofax. Que sea fácil de coger no la hace libre.
- **Busca solo en fuentes de licencia libre y comprueba la licencia una por una:** **Wikimedia Commons** (usa su API: `action=query&generator=search&gsrnamespace=6&prop=imageinfo&iiprop=url|extmetadata` → lee `LicenseShortName` y `Artist`), Unsplash, Pexels. Sirven: **CC0 / dominio público** (lo mejor: sin obligaciones), **CC BY** y **CC BY-SA** (obligan a atribuir). **NO sirve** ningún **CC NC** (prohíbe uso comercial) ni nada sin licencia explícita.
- **MÍRALA antes de entregarla** (descárgala y ábrela). No entregues una foto por su título: los buscadores devuelven escaneos de libros, cuadros y fotos mal encuadradas mezclados con las buenas.
- **Entrega:** el fichero + la URL de descarga + **licencia y autor listos para pegar**. Si hay una CC0 decente, ofrécela como alternativa aunque la bonita sea CC BY-SA: al usuario le puede compensar no tener que atribuir.
- Validado (Aragón): `Zaragoza Rio Ebro and Catedral-Basílica del Pilar upstream from Puente de Piedra.jpg` (CC BY-SA 4.0, Ymblanter) y la alternativa CC0 `Zaragoza shel.JPG`.
- Validado (Castilla y León): `Burgos cathedral 1.JPG`, **CC0** (Jebulon), 4600x3316. **Prioriza CC0 siempre que la haya**: no obliga a atribuir y en una web comercial eso es una cosa menos de la que acordarse.

**⚠️ EL PROMPT DE LA WEB NECESITA LA URL DE PAMPAM, Y NO LA TENGO YO (Iker, 2026-07-30).** El orden real es: yo entrego el CSV → **Iker monta el mapa en PamPam** → Iker me pasa el **enlace** → y solo entonces el prompt del programador esta completo. **Si entrego el prompt sin ese enlace, va SIEMPRE con un aviso en la entrega pidiendoselo.** Si Iker manda el `<iframe>` entero, **el prompt lleva la URL de `src` sin parametros** (`https://www.pampam.city/{hash}`), porque el programador pone el `?fullPanelMobile=true`, el iframe y el CSS por su cuenta. **Pero el iframe crudo se pega igual al final del prompt, en una linea** (Iker, 2026-07-31): el **hash es lo unico que no se puede deducir de nada** y un caracter mal copiado no da error, carga el mapa vacio. Cuesta una linea y mata el unico fallo silencioso del proceso.

**⭐ ORDEN EXACTO DEL OUTPUT (Iker, 2026-08-03). No es cosmético: es el orden en que él lo ejecuta.**
> 1. **TEXTO** del post, en bloque cercado.
> 2. **GUÍA DE MENCIONES**, con enlaces clicables fuera de cercado (Paso 10), calcando el orden del post.
> 3. **CSV** para importar en PamPam.
> 4. **FOTO** de portada para PamPam (Paso 11), con su licencia y autor.
> 5. **TÍTULO** (`[Región]: el músculo industrial`), en su bloque cercado.
> 6. **DESCRIPCIÓN**, en su bloque cercado y en un solo párrafo.
> 7. **PROMPT PARA EL PROGRAMADOR** de la página web (Paso 9b), en un párrafo.
>
> **Los puntos 3, 4, 5 y 6 van juntos y en ese orden porque son las cuatro cosas que se meten en PamPam de una sentada**: importas el CSV, subes la foto, pones el título y pegas la descripción. Yo se lo daba con el título antes que el CSV, que es al revés de como se usa.
> La **imagen del POST** no la doy nunca: es la captura de PamPam que hace el usuario. La **portada de la WEB** tampoco: la saca el programador.

**⚠️ AVISO DE LA CAPTURA DEL MAPA — VA EN TODA ENTREGA DE MAPA (Iker, 2026-07-31).** En el mapa **NO se avisa de limpiar metadatos**: la captura sale de PamPam, que es una web, y no ensucia nada (`images §0` lo explica). Lo que sí se avisa es del **encuadre**, que es lo único que puede salir mal y solo lo ve el que hace la captura. **UNA LÍNEA, ni una más**, literal:
> ⚠️ Antes de capturar, comprueba que los logos se ven grandes y bien espaciados entre sí; si alguno queda muy lejos, muévele la ubicación a mano en PamPam.

**Nada de que se lean los nombres (Iker, 2026-07-31):** ese lo quitó él, así que no vuelve. El aviso es solo de espaciado y tamaño.

**Por qué es el aviso que importa aquí:** en el mapa la imagen ES el contenido. Un logo pisando a otro o un nombre cortado se lee como chapuza justo en el post que va de que conocemos a esas empresas. Y como la captura la hace el usuario, es el único punto del pilar que yo no puedo verificar.

**🔴 EL TÍTULO Y LA DESCRIPCIÓN NO SE OLVIDAN (Iker, 2026-07-31).** Es la pieza (3) y se me quedo fuera en la entrega de Asturias. **Repasa esta lista de cuatro antes de dar por cerrado el mapa**, aunque la conversacion venga larga y llena de retoques: precisamente cuando hay muchas iteraciones es cuando se cae una pieza.

**Guardarraíles de elección de región (Paso 0):**
- **🔔 ANTES DE NADA, RECUÉRDALE LO DEL ORGULLO DE PAÍS (encargo de Iker, 2026-07-29).** Antes de proponer región, dile que tiene aparcada la idea de hacer el peloteo con **orgullo de ESPAÑA frente a otros países** en vez de por comunidad: *"no conozco a nadie que se sienta orgulloso de ser europeo, pero de ser español sí"*. Motor de pique sano tipo Mundial (Argentina, México, Uruguay, Chile, Colombia, Perú), **jamás tirando mierda a nadie**, que ya tenemos clientes latinoamericanos y queremos más. Él decide si toca ya o sigue aparcada.
- **🔴🔴 VERIFICAR UNA MENCIÓN SON CUATRO COMPROBACIONES, NO UNA (Iker, 2026-07-29, tras el despiece de Euskadi).** Yo daba por bueno "trabaja en esa empresa" y le devolvía las dudas al usuario. **Eso es mi trabajo, no el suyo.** Las cuatro, todas, antes de escribir un nombre:
  1. **¿La EMPRESA hace esa pieza?** Se comprueba contra **su propia descripción de LinkedIn** (`GET /api/v1/linkedin/company/{slug}` → `description`), nunca por intuición. Ese día iban a colarse cinco falsas: **Copreci** hace electrodomésticos, **Orkli** climatización de edificios, **Goizper** bancos de ensayo, **Onapres** prensas hidráulicas y la página de **Grupo ELAY** es de recursos humanos. Ninguna hace piezas de coche. Si la descripción está vacía, la empresa se cae: **Mecaner** y **Megatech Amurrio** se quedaron fuera por eso.
  2. **¿La PERSONA está en esa región?** El `location` del PERFIL, no el titular. **En multinacionales el buscador te devuelve gente de otras plantas:** `Jasmin Gaši` (Mubea) está en **Suiza**, `Martha Melo` (Walter Pack) en **Barcelona** y `Àlex Rodríguez Aguado` en **Barcelona aunque su titular diga "Gestamp Bizkaia"**. **El titular dice dónde está la planta; el location dice dónde está la persona. Manda el location.**
  3. **¿Comenta?** El filtro de siempre (`§4.2` Paso 4).
  4. **¿Tiene el apellido completo?** Descarta los abreviados tipo `Daniel M.`: la mención se renderiza cortada y queda fatal. Y **el nombre exacto se saca del endpoint de USUARIO, no del buscador**, que trunca: el search devolvía `Josu Zaldua Saenz de Burua` y el perfil dice `Saenz de Buruaga`.
  - **Consecuencia práctica:** de 20 candidatas verificadas quedaron **12**. Y 12 salen en **3 bloques de 4 exactos**, que es mejor que 14 en 4+4+3+3. **Verificar de verdad no solo evita el error: a veces mejora el formato.**
- **⚠️ PREGUNTA PRIMERO PARA QUÉ CUENTA ES.** La región no se elige en abstracto: **las regiones quemadas son POR CUENTA**, no globales. Iker ya hizo Cataluña → Iker no la repite jamás, pero **Unai y Asier sí pueden hacerla**. El plan es que cada cuenta acabe tocando todas las regiones (España se acaba). Mira la cobertura por cuenta en `docs/skills/historial-publicaciones.md` **antes** de proponer nada.
- **El CONCEPTO, en cambio, no se repite NUNCA ni entre cuentas** (medido: "país inventado" 7.87x en Unai → 1.2x al repetirlo Iker). Y si una cuenta hace una región que ya hizo otra, el concepto, el país de comparación y los clichés van **todos nuevos**.
- **Prefiere la COMUNIDAD AUTÓNOMA a la provincia/ciudad** — más alcance. Validado: elegimos Cataluña (no Barcelona); y Álava (provincia) rindió MENOS que País Vasco (comunidad). Baja a provincia solo si tiene identidad muy fuerte y ya tocaste la comunidad.
- Greenlit (comunidades sin tocar): Aragón, Asturias, Murcia, Castilla y León, Castilla-La Mancha, Extremadura, La Rioja, Cantabria, Canarias, Baleares…
- Baneadas: capitales/ciudades obvias (Madrid 0.55x) y cualquier cosa que critique a otra región española.
- ≥2 semanas desde el último mapa de esa cuenta. **Región: no repetir DENTRO de esa cuenta** (otra cuenta sí puede hacerla). **Concepto: no repetir NUNCA, ni entre cuentas** (medido: 7.87x → 1.2x al repetirlo otra cuenta).

### 🚫 4.2-PAIS · ~~PELOTEO DE PAÍS POR ADIVINANZA~~ · NO EXISTE. ME LO INVENTÉ (2026-08-05)

**Lo dejo escrito porque el ERROR es más útil que la regla que quise poner.**

Auditando el cajón `otro` vi el post de Unai del 12/06 (*"Nadie habla de este país…"*, **78.711 impresiones**), no encontré bloque de menciones, vi **33 likes y 32 comentarios** y concluí que habíamos descubierto un pilar nuevo cuyo motor era la adivinanza. Se lo presenté a Iker como el segundo mejor post del histórico.

**Estaba mal en tres cosas, y las tres estaban ya escritas en `historial-publicaciones.md`:**
1. **No es peloteo, es un MEME.** La ficha lo dice literal: *"Mapa-meme dibujado (NO peloteo)"*. La imagen era un mapa dibujado y el país era **inventado**: humor y sarcasmo puros.
2. **El motor no era la adivinanza, era CONTROVERSIA INVOLUNTARIA.** *"Lo leyeron como burla a Baleares."* Esos 32 comentarios no eran gente jugando, era gente picada.
3. **No es un triunfo.** La ficha avisa: ***"alcance sin respaldo"***. 78.7K impresiones con **33 likes y 2 reposts** es un post hueco, no un modelo a copiar. Y el 2º intento (12.7K) murió justo porque *"el país ficticio cayó donde no había nada, nadie se sintió aludido, sin controversia y sin alcance"*.

**📌 LA LECCIÓN, que es la que hay que retener: LA BASE DE DATOS TIENE LOS NÚMEROS, EL HISTORIAL TIENE EL PORQUÉ.** Yo hice el análisis contra la BD y no abrí el historial, que ya tenía el diagnóstico correcto de los dos posts. **Antes de sacar cualquier conclusión sobre un post publicado, se lee su ficha del historial.** Un número sin su ficha te lleva a inventarte un pilar.

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
- **⭐ Activos COMENTANDO a otros EN LOS ÚLTIMOS 30 DÍAS (Iker, 2026-07-28; antes eran 3 meses y se quedó corto).** Vía `/users/{id}/comments`. La ventana de 30 días vale para **CUALQUIER formato que mencione a alguien**, no solo "Los 10": a los 3 meses se colaban perfiles que ya no comentan y la mención muere. Y ojo, actividad significa que **comenta en posts de otros**, no que publique en el suyo; si solo publican en su perfil pero no comentan a nadie, se descartan: no nos van a comentar (`§4.2 Paso 4`).
- **⭐⭐ CÓMO SE BUSCA DE VERDAD: POR PERSONAS, NO ADIVINANDO HANDLES DE EMPRESA (Iker, 2026-07-29).** El método que fallaba: pensar empresas de memoria y probar handles a ciegas (`grupo-ybarra`, `migasa`, `cunext`…). La mayoría da 404, y de las que resuelven casi ninguna tiene gente que comente. **Cinco tandas, ~40 empresas, cero fichas nuevas.**
  - **Lo que SÍ funciona:** `POST /linkedin/search` con `category: people` y **`keywords` en lenguaje natural**, del tipo *"director general fabrica Andalucia"*, *"director comercial aceite Jaen"*, *"gerente cooperativa agroalimentaria Almeria"*, una consulta por provincia y por sector. **En una sola tanda salieron 19 personas activas con foto**, y de ahí salió Bodegas Barbadillo.
  - El orden correcto es **persona → empresa**, no empresa → persona: primero encuentras a alguien que comenta de verdad, y luego verificas su empresa y su cifra.
  - Un handle inventado también puede devolver **otra empresa distinta** y colarse: `cunext` devolvía una compañía árabe, y varios IDs adivinados devolvieron gente de universidades de EE.UU. **Si no lo has resuelto por búsqueda, no lo uses.**
- **🔴 SI FALLA CUALQUIERA DE LAS TRES COMPROBACIONES, SE DESCARTA Y SE BUSCA OTRO. NUNCA se entrega la ficha con `[PENDIENTE]` (Iker, 2026-07-28, ya avisado antes).** Las tres son: (1) **actividad** — ha comentado a alguien en 90 días; (2) **logro verificable** — cifra de crecimiento con fuente pública del último año; (3) **foto en LinkedIn** — sin ella no se puede montar la orla, que necesita las 10.
  - **Un `[PENDIENTE]` en una mención NO es una entrega**: el post no se puede publicar así, y devolverlo obliga a Iker a hacer el trabajo que era mío. Si un candidato falla, **se sustituye por otro del barrido** y punto.
  - **Por eso el barrido se hace ANCHO desde el principio**: hacen falta bastantes más de 10 candidatos, porque entre inactivos, sin cifra pública y sin foto cae la mayoría. Medido el 2026-07-28 en Andalucía: de ~45 personas revisadas solo 4 pasaban el filtro de actividad, y de los que pasaban, 2 se cayeron por no tener foto y 1 por no tener cifra pública.
- Ordena por probabilidad de interacción / relevancia del logro.
- **Ejecución:** Claude vía Unipile (credenciales de las env vars del entorno "Iker", como §4.2).
- **Formato en el cuerpo:** `→ @Persona - @Empresa · logro concreto` (ej. `→ @Edorta Arriet Azpiroz - @Geminis Lathes · +77% bº`). **Con @ delante de los dos nombres**, igual que el mapa (§4.2 Paso 4): el usuario clica detrás de la arroba y LinkedIn abre el buscador de menciones solo. El logro va DESPUÉS del `·`, sin arroba.
- **⚠️ NOMBRES EXACTOS DE LINKEDIN**, igual que en el mapa (§4.2 Paso 4): copia el `name` de Unipile literal, sin embellecer. Si el nombre no coincide, no salta el autocompletado de la @ y la mención muere.

**Paso 3 — CUERPO** (pelotea a la persona invisible, `swipe-file §3.1`):
- Setup que pinta al que decide de verdad y no sale en la foto (una anáfora tipo "No publica. No da charlas. No sale en la nota de prensa." — **es UNA opción, no la plantilla fija**).
- **🔴 LAS 10 FICHAS SON 10 EMPRESAS DISTINTAS. NUNCA SE REPITE EMPRESA DENTRO DEL MISMO POST (Iker, 2026-07-28).** Vale para cualquier formato de menciones. Dos personas de la misma empresa desperdician una ficha: el peloteo se diluye y se pierde un repost potencial. Si de una empresa solo sale un candidato válido, se coge ese y se busca otra empresa; **no se rellena con un segundo de la misma casa**.
- **⭐ LAS 10 FICHAS VAN EN DOS BLOQUES DE 5, no en 4+4+2 (Iker, 2026-07-28).** Este pilar siempre lleva 10, así que se parten por la mitad: **5 + 5**, con una línea en blanco entre los dos bloques. (El mapa es distinto: 20 fichas en 5 bloques de 4.)
- La **lista de las 10** (`→ @Persona - @Empresa · logro`), con **línea en blanco entre la frase de entrada y la primera persona** (igual que el mapa, §4.2 Paso 4): la frase que presenta la lista va sola, nunca pegada a la primera `→`.
- **Reveal tardío:** "Sí, hablo de [región]. Pero esto va de las personas."
- Eje emocional: "le pongo cara al que estuvo detrás del salto".
- **⭐ LA COLA (de los clichés al cierre) TAMBIÉN ALTERNA BLOQUES (Iker, 2026-07-28).** Después del bloque de menciones es fácil dejarlo todo en líneas individuales, y el post se desinfla justo donde tiene que rematar. Mete **al menos un bloque de 2** ahí abajo. Y si una frase ocupa dos líneas al renderizar (típico del *"y no salen todas de X ni de Y. Salen de…"*), **se parte**: o bloque de 2 o dos líneas individuales, nunca una línea larga que envuelve sola.
- **⭐ CUÁNDO ANÁFORA Y CUÁNDO NO (criterio aprobado por Iker, 2026-07-29).** No es obligación fija en todos los posts, que se notaría el molde. **Misma palabra** cuando las tres líneas son **el mismo sujeto haciendo tres cosas** (Asturias 2.69x: `Se sabe… / Se sabe… / Se hace…`): ahí el eco martillea. **Arranques distintos** cuando son **tres ángulos diferentes**, porque forzar la anáfora obliga a retorcer la frase. Y la palabra elegida **rota entre publicaciones**.
- **⭐ LA ANÁFORA VA DENTRO DEL BLOQUE, LA VARIEDAD ENTRE PUBLICACIONES (Iker, 2026-07-28).** En un bloque de 3 (o de 2) **todas las líneas arrancan con la MISMA palabra** — eso es lo que le da el golpe. Lo que cambia de un post a otro es **cuál** es esa palabra: Asturias usó `Se / Se / Se`, Andalucía `Su / Su / Su`. **Error a evitar:** al corregir una repetición entre posts, romper la anáfora dentro del bloque y poner tres arranques distintos. Eso mata el ritmo.
- **QUE SE NOTE QUE ES UN POST NUEVO (clave):** mantén la ESENCIA del formato (mismos bloques de 2/3, misma estructura, mismas ideas) pero **cambia las expresiones y sobre todo cómo ABRES los bloques**. No arranques siempre igual — ni todos los bloques con "No publica / No da charlas", ni con "No es por X, no es por Y" (esa anáfora de negación es la del mapa; no la calques). Rota el arranque: unos por verbo, otros por nombre, otros por número, otros por lugar (`working-preferences §4`). Mismo pilar, palabras distintas cada vez.

**🔴 Paso 6b-quater — LAS FOTOS DE UNIPILE SON 100x100 Y NO HAY FORMA DE MEJORARLAS POR API (Iker, 2026-07-29).** Comprobado a fondo: el campo `profile_picture_url_large` **devuelve igualmente 100x100**, el endpoint de perfil completo `GET /users/{id}` tambien, y reescribir el tamano en la URL (`shrink_100_100` → `shrink_400_400`) da **403 deny-InvalidToken**, porque el token va firmado para ese tamano exacto.
- **Consecuencia:** el script las amplia x2,24 hasta el hueco de la plantilla y avisa `AMPLIADA, pierde nitidez`. Es inevitable por API.
- **La unica via para una foto nitida es MANUAL:** abrir el perfil en LinkedIn, descargar la foto grande y meterla en la carpeta con su numero. Asi se hizo con Alvaro Ales (400x400 frente a 100x100, ocho veces mas definicion).
- **Cuando una cara salga especialmente mal, pidele a Iker esa foto concreta** en vez de publicar el borron. No hace falta hacerlo con las 10, solo con las que canten.

**🔴 Paso 6b-ter — EL TÍTULO Y LA PALETA DE LA ORLA (Iker, 2026-07-28, tres intentos fallidos).**
- **El TÍTULO va incrustado en el PSD** (`LOS 10 QUE LEVANTAN / LA INDUSTRIA ASTURIANA`) y el script **solo sustituye los placeholders `Nombre`**. Si no lo cambias, sale la región del post anterior. Se cambia **solo la última palabra**, repintando únicamente la segunda línea.
- **Cómo es de verdad ese título:** texto en **CREMA sobre la banda oscura**, no texto oscuro sobre caja crema. Me equivoqué dos veces: primero tapé con un rectángulo blanco, y luego oculté la capa de texto (que se llevó por delante su propio fondo y dejó el texto invisible, oscuro sobre oscuro). **Mide los colores antes de pintar**: muestrea píxeles reales de la imagen generada.
- **Paleta nueva del Brandbook 2026** (`images §0a-ter`) sobre la orla: `azul marino #0c202e → berenjena #431b44` y `crema #f9f3ef → mint #ebfff6`.
- **⚠️ El remapeo de color NO puede tocar los retratos.** Aplicado a ciegas, los tonos oscuros del pelo y de las americanas se vuelven morados. La regla que funciona: **crema → mint en TODA la imagen** (apenas aparece en fotos) y **oscuro → berenjena SOLO fuera de las cajas de foto**, que el propio script imprime en su log.

**⚠️ Paso 6b-bis — LA ORLA SE MONTA CON `--nombres` Y CON LA RUTA DE LA FUENTE (Iker, 2026-07-28).** Dos fallos que costaron dos regeneraciones:
1. **`--nombres` no es opcional.** Sin ese parámetro el script pega las fotos y deja los placeholders "Nombre" de la plantilla. Van los 10 nombres separados por `|`, en orden de mención y con las reglas de orla de `images §0e` (nombre + primer apellido, compuestos sin partir, campos invertidos corregidos por el `public_identifier`).
2. **La fuente NO está en `C:\Windows\Fonts`.** Bricolage está instalada en la carpeta de usuario, así que hay que pasarle `--fuente "C:/Users/LENOVO/Documents/Mario/LINKEDIN GROWTH/TIPOGRAFÍAS/Bricolage Grotesque/static/BricolageGrotesque-Bold.ttf"`. Sin eso aborta con "no encuentro la fuente" **y el error sale ARRIBA del todo**, antes del log de fotos, así que con un `tail` no se ve y parece que ha ido bien.

Comando completo de referencia:
```
python scripts/montar-orla.py --plantilla ".../LOS 10 PLANTILLA v2.psd" --fotos ".../fotos"   --salida ".../orla.png" --fuente ".../BricolageGrotesque-Bold.ttf"   --nombres "Nombre1|Nombre2|...|Nombre10"
```

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

> **⭐ EL FLUJO EN 5 PASOS (la intuición, antes de los detalles). Costó 8 iteraciones sacarlo el 2026-07-23; que no vuelva a costar:**
> 1. **REFERENCIA = meme de VERDAD.** Riesgo de risa 25-56% (`GET /posts/{id}/reactions`, `ENTERTAINMENT`), ≥100 likes. **Viral aunque NO sea de ventas** — el dolor psicológico es universal y ya lo adaptamos. Mira la imagen antes de elegir.
> 2. **CALCA LA ESENCIA ENTERA**, no media: la mecánica del gancho, la estructura del cuerpo (flechas, numerada, dos cajas…), la longitud, la mecánica de la imagen **y el TIEMPO VERBAL** (si promete en futuro, tú en futuro). Fidelidad > "corto y punchy".
> 3. **ADÁPTALO A VENTAS** en el texto y en la imagen (`§2.3`), sin destripar el chiste que remata la foto.
> 4. **MEJÓRALO** (el paso que más olvido): verbo con techo (`§2.9`), **sin repetir verbo**, formato más limpio. Igualar el original es el SUELO; superarlo es la meta.
> 5. **VALIDA:** mecánico 30/30 (`validar-post.py --pilar meme`) + pase de criterio (`§8`). Entrega con comparativa (texto verbatim, dos columnas, `working-preferences §1e`).
>
> Los pasos 2-4 son la cadena que se me escapa: calco medio, olvido el tiempo verbal, o no mejoro el punch. Léelos SIEMPRE.
>
> **⭐ EN EL MEME, UNA BROMA YA VALIDADA DENTRO DE VENTAS BATE AL REMIX DE OTRO SECTOR (Iker, 2026-07-29).** La norma general es robar outliers de otro sector y traerlos al nuestro, porque el ángulo llega fresco. **En el meme es al revés:** si existe una broma universal que YA ha funcionado dentro de ventas, tiene más garantía, porque **el sector ya te la ha comprado** y no hay que traducir el dolor. Caso: el email del tatuaje de Félix Fernández (59% de risas, 3,38x) es dolor puro de ventas, y el remix salió redondo sin forzar la adaptación.
>
> **⭐ PASO 0 — ELIGE LA CUENTA QUE AGUANTA EL MEME, NO REBAJES EL MEME PARA LA CUENTA (Iker, 2026-07-27).** El nivel de burrada del original es parte del motor: si lo suavizas para que encaje en una cuenta sobria, te quedas con el tema y sin el chiste.
> - **Iker (2º jefe) = memes BRUTOS o informales.** Le da igual el registro mientras el post viaje.
> - **Unai (1º) y Asier (3º) = memes de ventas más normalitos y sobrios.** Y sí, eso les cuesta alcance: es una decisión asumida, no un descuido.
> - **El caso que lo demostró (0,31x, 1.003 impresiones):** el original de Gavin Fernand (corporatedudes, 425 reacciones, 45% risas) traducía **"I just shit my pants"** al lenguaje corporativo de LinkedIn. Nosotros, para que encajara en la cuenta sobria de Unai, pusimos arriba *"El cliente me dijo que no"* → *"Oportunidad en pausa estratégica"*. **La caja de arriba ya era corporativa, así que no había caída y no había chiste.** El motor de ese meme es la DISTANCIA entre la vulgaridad y el eufemismo. Ese meme tenía que haber ido en Iker, tal cual de bruto.
> - **Regla:** mide primero cuánto de bruto es el original. Si no cabe en la cuenta que te tocaba, **cambia de cuenta**, no de chiste.
>
> ### 🔴🔴 4.4-ESENCIA · LA ESENCIA SE EXTRAE DE LO QUE SE VE, NUNCA DE LO QUE YO CREA (Iker, 2026-07-30)
> **🗺️ Esta es la CAPA 1 (lo visual) de las tres que tiene una referencia. Las otras dos y el indice, en `global §2.2b-CAPAS`.**
> **⚠️ UNIVERSAL, no solo del meme.** Vale para remixar CUALQUIER cosa: un lead magnet, un mapa, una historia. La esencia se saca del texto palabra por palabra y del inventario de lo que se ve, nunca de mi teoria de por que funciono. Enlazada desde `global §2.2b`.
> **Iker, literal: "CLARO QUE QUEREMOS COPIAR AUNQUE SEA DESCARADO PERO MEJORANDO Y ADAPTANDO A VENTAS. NO TE VAYAS POR LAS RAMAS HACIENDO OTRA BROMA DISTINTA."**
>
> **⭐⭐ COPIA NO ES PLAGIO, Y NO PASA NADA POR QUE SE NOTE (Iker, 2026-07-30).** Yo arrastraba la idea de que habia que disimular el calco, y **eso es lo que me hacia buscar "el equivalente" en vez de copiar**. Aclarado: *"me da igual que se note que es una copia, lo importante es que no sea un plagio"*. **La ESENCIA se copia PALABRA POR PALABRA**; lo que no se copia es el gancho entero. Si el original dice `codigo de verificacion`, mi gancho dice **`codigo de verificacion`**. Si en la foto hay un tatuaje, en la mia hay un tatuaje. Si son calvos, son calvos. **Y luego se adapta a ventas y se mejora**, que es la otra mitad.
> - **⛔ Buscar el equivalente NO es adaptar.** "Alta de proveedor" era mi equivalente de "codigo de verificacion": mismo concepto abstracto, palabras distintas. **Mal.** Adaptar es conservar la palabra y cambiar el CONTEXTO en el que aparece.
> - **⭐ EL TEST DE LA RABIA, que es el que me faltaba.** Despues de adaptar, leelo en frio y pregunta: **¿esto sigue dando la misma rabia?** Mi version decia *"enhorabuena por la venta, te hemos enviado el alta de proveedor"* y Iker lo tumbo en una linea: **si te confirman que la venta salio bien, ir al correo no da rabia, son buenas noticias**. La rabia del original viene de que te BLOQUEAN justo cuando ibas a conseguir lo tuyo. **Si tu version no bloquea, no sirve.**
>
> **El fallo, tres veces en una semana, y siempre el mismo:** me quedaba con el FORMATO y cambiaba el elemento concreto que hacia el chiste.
> - **Tatuaje → tarta.** En la foto se veia un tatuaje. Puse una tarta.
> - **Calvos → otra cosa.** La escalera de calvicie era el chiste. La adapte a ventas y me lleve por delante a los calvos.
> - **Codigo de verificacion → "eso lo lleva otra persona".** Su texto decia codigo de verificacion. Yo escribi otra broma y encima me invente una teoria sobre bucles que **no estaba en ninguna parte** para justificarla.
>
> **⛔ LA CAUSA RAIZ: yo teorizaba POR QUE creia que habia funcionado, y construia el remix sobre esa teoria.** Eso es inventarse el dato. En marketing nos cenimos a lo medido; aqui igual.
>
> **EL PROCEDIMIENTO, y se hace por escrito ANTES de redactar nada:**
> 1. **Copia el texto del original PALABRA POR PALABRA.** Entero, sin resumir.
> 2. **Haz el inventario de lo que SE VE en la imagen.** Objetos, personas, gestos, texto dentro de la foto. Literal: *"mujer sentada en una mesa, dedos apretando los ojos cerrados, oficina detras"*.
> 3. **La esencia es ESO y nada mas.** Esas dos listas. **Pero leidas de verdad: lo que la cosa nombrada HACE literalmente** (Iker, 2026-07-30). Eso NO es teorizar, es entender la palabra.
>    - **Ejemplo, y es el que me costo tres intentos.** El original decia *"a verification code was just sent to your email"*. Un codigo de verificacion **literalmente significa**: creias que habias terminado, aparece un paso mas, tienes que ir a otro sitio, buscarlo y volver, y solo entonces consigues lo que ibas a buscar. **Eso es FRICCION**, y esta en el significado de la palabra, no en una hipotesis sobre por que gusto.
>    - **Yo entregue dos versiones sin friccion**: *"eso lo lleva otra persona"* (un corte de manga) y *"tu propuesta ha sido leida"* (un callejon sin salida). Ninguna tiene el paso extra, asi que ninguna golpea igual.
>    - **La frontera:** ✅ *"un codigo de verificacion obliga a dar un rodeo antes de conseguir lo que ibas a buscar"* es LEER. ❌ *"esto funciono porque la gente odia los bucles y el sistema te manda en circulos"* es INVENTAR. Lo primero sale de la palabra; lo segundo, de mi cabeza.
>    - **El test:** describe lo que hace el elemento del original **sin usar la palabra "funciona" ni "gusta"**. Si no puedes, todavia no lo has entendido. **Prohibido anadir una tercera linea que empiece por "lo que pasa es que" o "funciona porque".**
> 4. **Adaptar a ventas = cambiar SOLO el contexto.** Los elementos de las dos listas se quedan. Si el original dice `codigo de verificacion`, tu version lleva un aviso automatico del sistema. Si en la foto hay un tatuaje, en la tuya hay un tatuaje.
> 5. **Y ENTONCES se mejora**, que es la otra mitad del trabajo: mejor gancho, mejor cuerpo, mejor imagen, nuestro formateado. **Mejorar es sumar, nunca sustituir lo que ya funcionaba.**
>
> **El test antes de entregar:** pon las dos listas al lado de tu version. **Cada elemento de la lista tiene que tener su equivalente reconocible en el remix.** Si falta uno, no es un remix, es otro post.
>
> ### 📏 4.4-MEDIR · LA ANATOMIA DE LA REFERENCIA SE MIDE, NO SE MIRA (Iker, 2026-08-06)
> **🔒 ESTA REGLA ES UNIVERSAL Y VIVE EN `global §2.2b-MEDIR`.** Vale para CUALQUIER pilar que parta de una referencia, no solo el meme. Aqui queda el detalle porque el primer caso fue un meme; si algun dia choca con lo de alla, manda `global`.
> **`python scripts/anatomia-referencia.py original.txt mio.txt` antes de entregar.** Copié el tema y el motor del meme de Daniel Disney y no medí nada, y salió esto:
> ```
> ORIGINAL  hook 34 car | 1 frase  | emoji 🤣
> EL MIO    hook 62 car | 2 frases | emoji 👇
> ```
> Iker: *"no puede ser que el gancho original sea tan corto con un emoji de risa y el nuestro sea el doble de largo, dos frases en vez de una, y el emoji de la mano en vez del suyo. Todo lo queremos validar en datos. En las referencias igual: analiza su ritmo, su lenguaje, sus conjugaciones, su longitud, sus emojis, todo."*
> - **Longitud del hook:** el inglés dice lo mismo con menos palabras, así que se admite margen, **pero no el DOBLE**.
> - **Nº de frases del hook:** una frase es una frase. Partirla en dos se carga el golpe seco.
> - **El emoji del hook se calca**, no se sustituye: 🤣 anuncia broma y 👇 anuncia lista. **Y se mira DÓNDE vive cada emoji**: aquí el 👇 estaba en el CIERRE, no en el hook, así que copiarlo al hook es ponerlo donde el original no lo puso.
> - **Longitud total y nº de bloques:** 1.289 car y 17 bloques contra 773 y 9 es habernos dejado media publicación.
> - **El ritmo es donde SÍ mejoramos**: bloques de 2 y 3 en escalera y líneas sueltas. Su ritmo puede ser peor que el nuestro; la longitud y el hook, no.
> - **Lo que NO se calca se dice en la entrega, para que sea decisión y no descuido.** Aquí, el cierre: el suyo remata con pregunta + 👇 y el nuestro con un bold statement, porque `global §4.5` pide un solo CTA y ese hueco ya lo ocupa el spam ninja.
>
> ### 🔒 4.4-BUCLE · →→ ESTA REGLA SE MUDÓ A `global-instructions §2.0` (Iker, 2026-07-31)
> **El bucle abierto es de TODOS los pilares, no del meme ni del lead magnet.** La escribí aquí y en `§4.5` como si fuera de pilar, y por eso propuse un gancho de meme que desvelaba el chiste. **Vive en `global §2.0` y ahí se lee.** Lo único específico del meme: al haber imagen, el bucle es doble — el gancho tampoco cuenta lo que se ve.
>
> ### 🤐 4.4-CALLA · EL CUERPO NO NOMBRA EL CHISTE, Y SI LO NOMBRA ES TARDE (Iker, 2026-07-31)
> **⚠️ UNIVERSAL: vale para TODO post con imagen, no solo el meme. El principio esta en `global §2.0c`.** Aqui queda el detalle porque el primer caso fue un meme.
> **El cuerpo del meme habla del MÉTODO en abstracto. La broma la carga la imagen, entera.** Comprobado contra los dos originales: **ni el post de Félix ni el nuestro de Unai nombran el tatuaje una sola vez**. Unai habla de *"hacer algo imposible de ignorar"* y de *"el que no contesta también está contestando"*, y el tatuaje **no aparece en el texto en ningún momento**.
> - **Por qué funciona así:** el lector ve la imagen, entiende el chiste solo, y el texto le da **otra capa** en vez de repetirle lo que acaba de ver. Si el cuerpo explica la foto, el post pierde la mitad: la foto deja de aportar y el texto tampoco aporta.
> - **Y si hay que nombrarlo, NUNCA justo debajo del gancho.** Iker, 2026-07-31: en el double down yo puse *"El brazo tiene un fallo: hay que enseñarlo. / La cara sale sola en cada videollamada"* **en la segunda línea del post**, y eso mata el bucle en el sitio exacto donde más caro sale, el corte del "ver más". **Va después del crédito, ya metido en el cuerpo**, cuando el lector lleva rato dentro.
> - **Regla práctica:** de la mitad del post hacia arriba, se habla del método. De la mitad hacia abajo se puede guiñar a la imagen.

> ### 🔁 4.4-DOBLE · DOUBLE DOWN: SE REPITE EL ESQUELETO, SOLO ROTA EL INTENSIFICADOR (Iker, 2026-07-31)
> **⚠️ NO ES DEL MEME: vale para CUALQUIER pilar.** Se puede doblar un mapa, un lead magnet o una historia que acabe de petar. Está escrita aquí porque el primer caso fue un meme, pero al leerla sustituye "meme" por el pilar que toque.
> **Qué es.** Repetir en otra cuenta, **lo antes posible**, una idea que se acaba de hacer viral en la nuestra. No es un pilar y no lleva receta propia: es una jugada sobre un pilar que ya existe. Se hizo el 31/07 con el tatuaje (Unai, miércoles, ~100.000 impresiones → Iker, viernes).
> - **El cuerpo se copia casi entero.** Ya está adaptado a ventas y ya capturó la esencia. Tocarlo es rehacer trabajo que funcionó.
> - **El gancho MANTIENE el esqueleto validado y solo cambia la palabra de intensidad.** La escalera real de este caso: Félix puso `no, señor` → nosotros lo mejoramos con `Jamás` → el double down usa `Nunca`. **Tres palabras, misma frase.** Inventar un gancho nuevo es tirar lo único que ya sabes que funciona.
> - **La escalada va en la IMAGEN, no en el texto.** El brazo pasó a la cara. Ahí es donde se sube lo absurdo sin tocar lo que ya rinde.
> - **Y se marca que es broma en el cierre**, con una línea corta detrás del bold statement (`Silencio es no. El láser son 6 sesiones.`). El primero se comió insultos por leerse en serio.
> - **🔴 MEDIDO EL 2026-08-05, Y ES PEOR DE LO QUE YO AVISABA: el double down del tatuaje hizo 5.427 contra 93.744 del original. Un 5,8%.** Yo avisé de que rendiría "por debajo"; rindió **17 veces menos**.
> - **La causa, y es la lección:** el original funcionó **por polémica** (a Unai le insultaron y eso disparó los comentarios). Al repetir, lo hicimos **más absurdo a propósito para evitar los insultos**… y con eso le quitamos el motor. **Un double down suavizado no es un double down: es el mismo chiste sin lo que lo hizo viral.**
> - **La regla: o se repite CON el filo, o no se repite.** Si el original era controversial y no queremos volver a comerlo, la respuesta correcta no es limarlo, es **no hacer el double down** y buscar otro ángulo.
> - **Expectativa realista:** un double down rinde **por debajo** del original, porque la audiencia se solapa y parte ya lo vio. Se avisa en la entrega.
>
> ### 🎯 4.4-FUENTE · DE DÓNDE SE COGE LA REFERENCIA (Iker, 2026-08-05, tras el flop del código de verificación)
>
> **Qué pasó.** El meme del código de verificación de Asier hizo **196 impresiones en casi una semana**. Al resubirlo con caricatura y la cuenta ya verificada mejoró el arranque, **pero se quedó en 296 impresiones a las 3 horas: flop confirmado también en la segunda versión** (Iker, 2026-08-05). **O sea que ni la caricatura ni la cuenta verificada salvaron al meme: el problema estaba en la ELECCIÓN de la referencia.** Pero además costó una barbaridad adaptarlo: siete iteraciones para llevar "código de verificación" al terreno de ventas.
>
> **⚖️ LOS TRES EJES DE UNA REFERENCIA, y el mejor caso es el que tiene los tres (Iker, 2026-08-05):**
> | Eje | Por qué importa |
> |---|---|
> **1. ¿Ya está adaptada a VENTAS?** | Si el chiste nació en nuestro sector, **el puente ya está construido**. Ese es el coste que nadie ve: adaptar cuesta iteraciones y lo que llega, llega forzado. |
> **2. ¿Está en INGLÉS?** | Suelen tener **más alcance**, y sobre todo **no nos pillan la copia**: nuestro público no vio el original y el autor no se cruza con nosotros. |
> **3. ¿Ataca un problema PSICOLÓGICO universal?** | La calvicie le pasa a cualquiera, sea comercial o dentista. Eso es lo que hace que viaje fuera del nicho. |
>
> **El caso perfecto es el de la calvicie: los tres a la vez** (ya iba de ventas, estaba en inglés y el motor es psicológico), y son nuestros dos mejores memes del histórico, **16.45x y 13.52x**.
>
> **El contraejemplo es el del tatuaje:** ya estaba adaptado a ventas ✅ y era psicológico ✅, **pero en español** ❌. Resultado: nos pillaron la copia en menos de una hora, Félix bloqueó a Unai, y **la polémica nos dio alcance**. Iker, y esto es lo importante: ***"tampoco me conviene que se nos haga viral por polémica de copia"***. **El alcance por polémica de copia no es una estrategia, es una factura aplazada.**
>
> **LA REGLA, por orden de preferencia:**
> 1. **Lo primero: referencias que YA funcionaron EN VENTAS.** Si el chiste nació en nuestro sector, el puente no hay que construirlo, ya está hecho. Ese es el coste oculto que casi nadie ve: **un meme que hay que "adaptar a ventas" durante siete iteraciones es un meme que va a llegar forzado.**
> 2. **Y dentro de esas, mejor en INGLÉS que en español.** Dos motivos: la copia se nota menos (nuestro público no vio el original) y el autor tiene menos probabilidad de cruzarse con nosotros. Con un original español pasó lo que pasó: Félix Fernández bloqueó a Unai en menos de una hora.
> 3. **⭐ LA EXCEPCIÓN, y es la que da los mejores outliers: memes de OTRO sector adaptados a ventas.** Los dos mejores del histórico son de fuera (la escalera de calvicie, 16.45x y 13.52x). **Pero solo valen si atacan un problema PSICOLÓGICO UNIVERSAL del ser humano**, no una situación propia de ese sector. La calvicie funciona porque le pasa a cualquiera, sea comercial o dentista. Un chiste sobre una herramienta ajena, no.
> - **El test antes de elegir referencia:** *¿el problema del que se ríe le pasa a cualquier persona, o solo a alguien de ese oficio?* Si es lo segundo, el puente a ventas te va a costar siete iteraciones y va a quedar forzado.
>
> **⚠️ Y las dos cosas que arreglamos al resubir van juntas y no se pueden separar:** cuenta **verificada** y fichero **limpio** (caricatura a resolución completa en vez de foto de IA degradada). Cambiamos las dos a la vez, así que no sabemos cuál pesaba. **Ojo con el dato que descarta la explicación fácil: el meme del 22/07 también hizo 345 impresiones y ese no llevaba ninguna IA**, era un montaje a mano, pero sí iba degradado y con la cuenta sin verificar. Ver la cuarentena de `images §0`.
>
> ### ©️ 4.4-CREDITO · SI LA REFERENCIA ES ESPAÑOLA Y DE VENTAS, SE ACREDITA (Iker, 2026-07-29)
> **⚠️ UNIVERSAL, no solo del meme.** Si remixamos a un espanol del sector ventas, se le menciona, sea el pilar que sea. En el validador se activa solo con `--pilar meme`; para los demas pilares se pasa `--remix`.
> **Qué pasó.** El meme del tatuaje hizo casi 30.000 impresiones en menos de una hora, **y el autor original lo vio**. Bloqueó la cuenta de Unai. **Bloquear es el aviso barato: el caro es un reporte por copia.** Mismo patrón que el "Andalucía es más grande que Italia", que también nos costó insultos y también acabó en una regla dura del runbook del mapa.
>
> **⚠️ "ESPAÑOLA" ES EL IDIOMA DEL TEXTO, NO LA NACIONALIDAD DEL AUTOR (Iker, 2026-07-30).** Yo descarte acreditar a un autor "porque era frances" y **eso no es el criterio**: lo que decide es **en que idioma esta escrito el post**. Un post en ingles no lo va a ver nuestra audiencia aunque su autor viva en Bilbao, y uno en español lo van a ver todos aunque el autor sea de Buenos Aires. **Mira el idioma del texto y nada mas.**
>
> **La regla.** Si la referencia que calcamos es **ESPAÑOLA Y del sector de VENTAS**, va **una línea suelta en el cuerpo mencionando al autor con @**. Ese es justo el caso en el que el autor comparte audiencia con nosotros y va a verlo. Si la referencia es de fuera o de otro sector, no hace falta (el validador acepta `--referencia-fuera` para dejarlo por escrito).
>
> **⭐ Y el arreglo de verdad no es el crédito, es la MENCIÓN.** La diferencia entre que el autor se sienta copiado y que se sienta citado **es la notificación**. Un creador al que le llega un aviso de que has partido de su idea suele comentar o compartir, porque le confirma que su chiste funciona. A Félix se lo hicimos a su espalda, y por eso lo vivió como un robo. **Menciónalo con @, no lo nombres en texto plano.**
>
> **DÓNDE VA, que es lo delicado:**
> - **NUNCA en el gancho ni justo después.** Ahí matas el chiste antes de contarlo: el lector aún no se ha reído y ya le has dicho que no es tuyo.
> - **NUNCA de última línea.** Se come el bold statement del cierre, que es lo que da la fuerza final.
> - **VA EN MEDIO, después de que el chiste haya aterrizado y ANTES del spam ninja.** Para entonces el lector ya se ha reído y el crédito se lee como clase, no como disculpa.
>
> **Cómo se escribe:** con naturalidad y sin sonar a nota legal. *"Esto se lo vi a @Nombre y me lo he traído a mi terreno."* Nada de "créditos a" ni "fuente:". **Y que no nos reste**: no vale *"lo contó mucho mejor @Nombre"*.
>
> **Dónde está la frontera con otros pilares:** se acredita cuando lo que calcamos es **RECONOCIBLE como suyo** (el chiste concreto, la imagen concreta). Una mecánica genérica que usa medio LinkedIn (la escalera de calvicie, el wojak, un antes/después) no tiene autor identificable y no se acredita. El lead magnet calca **estructura**, no una pieza reconocible, así que tampoco.
>
> **Mecanizado:** `validar-post.py --pilar meme` **falla** si no encuentra línea de crédito, salvo que se pase `--referencia-fuera`. Y si la encuentra, comprueba **que no esté ni en las 2 primeras líneas ni en la última**.
>
> ### 🚫🚫 4.4-STOP · MEME CONTROVERSIAL EN UNAI: PROHIBIDO (Iker, 2026-07-29)
>
> **Lo de arriba ya estaba escrito y aun así recomendé el meme del tatuaje para Unai. Pasó lo que tenía que pasar.** El meme se viralizó (14.000 impresiones en horas) **y un directivo nos insultó CON SU NOMBRE REAL**, porque se creyó que el tatuaje era de verdad. Unai es el **FUNDADOR y CEO**: firma la casa, y lo que le llega a él no se borra con un buen ratio.
>
> **Deja de ser criterio y pasa a ser un bloqueo:** `validar-post.py --pilar meme --cuenta unai` **FALLA siempre** salvo que se pase `--meme-sobrio`. El flag no se pasa por inercia: se pasa después de contestar que NO a las cinco preguntas de abajo.
>
> **Un meme es CONTROVERSIAL si CUALQUIERA de estas es que sí:**
> 1. **¿El chiste depende de que alguien se crea que pasó de verdad?** (el tatuaje: sí, y ahí estuvo el insulto)
> 2. ¿Hay un acto ridículo o humillante atribuido a quien publica?
> 3. ¿Alguien podría respondernos enfadado por habérselo creído?
> 4. ¿Hay tacos, escatología, sexo, política o religión?
> 5. ¿Se ríe de un colectivo?
>
> **La cascada, en este orden y sin saltársela:**
> - **Iker (2º) casi siempre.** Es la cuenta que aguanta el registro bruto.
> - **Asier (3º) si Iker ya tiene meme esa semana.** Ahí cuela.
> - **Unai: nunca.** Si el chiste solo funciona siendo controversial y ni Iker ni Asier pueden esa semana, **no se publica**. Se cambia el chiste o se espera. No se suaviza para meterlo en Unai, que eso ya lo probamos y dio 0,31x.
>
> **⚠️ Y el coste oculto del realismo:** `images §0a-sexta-bis` dice que en un pantallazo documental el realismo ES la credibilidad, y es verdad, **pero esa credibilidad tiene precio**: cuanto más se lo cree la gente, más real es el enfado del que se lo cree. Ese precio lo paga la persona que firma el post. **Cuanto más creíble sea el montaje, más lejos tiene que estar de la cuenta de Unai.**
>
> **Y fuera del meme: cuidado con la REDACCIÓN de todo lo de Unai.** No es solo el pilar. Cualquier frase suya que se pueda leer como chulería, burla o exageración se revisa dos veces (`brand-voice §1b`: tiene que sonar como el director industrial de ~50 años que nos lee, y que le vea como un igual).

> **Input del usuario:** SIEMPRE un **enlace a un post-meme de LinkedIn** de referencia (un caso de éxito). **Si no te lo pasa, PÍDESELO por chat antes de nada.**
>
> 🔴 **NUNCA propongas un meme sin referencia real validada (Iker, 2026-07-22).** Un formato de meme genérico "que funciona en internet" (distracted boyfriend, midwit, drake…) **NO vale**: si no está validado como OUTLIER en un post real de LinkedIn (nuestro o de otro creador), no es un dato, es una apuesta, y no nos la jugamos. **Todo meme que entregues lleva el ENLACE al post de referencia y su ratio.** Si no encuentras una referencia real potente (p.ej. el banco de inspiración no tiene un meme de ventas fuerte), **DILO y pídele una a Iker** — no rellenes con un template genérico. "Siempre subimos cosas basadas en datos."
> - 🔴 **PISO DURO: la referencia necesita ≥100 likes (Iker, 2026-07-23).** El meme del Aquaman (Asier, 22/07) se remixó de una referencia de **80 likes** y flopeó. Regla de Iker validada en su cuenta: **con ~100 likes el post suele tener miles de impresiones** (en memes la interacción es baja, así que 100 likes = mucho alcance). **Menos de 100 likes NO se coge, por buena que parezca la plantilla.** El FIT (dolor psicológico, de ventas, no infantil, sin usar) manda sobre el nº de likes en el desempate, pero el piso de 100 no se salta.
> - 🔎 **DÓNDE BUSCAR cuando nuestra BD ya no tiene memes sin usar (los mejores ya se hicieron):** **Unipile posts-search.** `POST {BASE}/api/v1/linkedin/search?account_id=…` con `{"api":"classic","category":"posts","keywords":"…","limit":50}` (pagina con `cursor`). Devuelve `reaction_counter` (likes), `repost_counter`, `comment_counter`, `share_url`, `text` y `attachments` (la imagen). Filtra `reaction_counter>=100` + adjunto imagen. **Mejor que keywords sueltas:** ir a las **cuentas fábrica de memes** (ej. `corporatedudes`, creadores de memes de ventas) vía `GET /users/{provider_id}/posts` y filtrar su feed — el keyword-search sobre el TEXTO se pierde los memes visuales (llevan poco texto). **Descarga la imagen y MÍRALA** antes de elegir: el texto no te dice si es una plantilla limpia o un carrusel de consejos.
> - 🤣 **EL FILTRO QUE DICE SI ES UN MEME DE VERDAD: la reacción de RISA disparada (Iker, 2026-07-23).** No hay patrón en el texto ni en la foto; **el patrón es que un meme tiene la reacción de risa petada** en vez de "me gusta" normal. Se mide: `GET {BASE}/api/v1/posts/{social_id}/reactions?account_id=…&limit=100` (⚠️ el máximo es **100**; pedir 120 devuelve vacío) → cuenta los `value === 'ENTERTAINMENT'` sobre el total de la muestra. **Un meme de verdad tiene 25-56% de risa; un post de consejo/infografía tiene ~0%.** Rankea los candidatos por ese %, no por likes. Caso: el diagrama de zigzag que elegí primero (Noam) NO era un meme (0% risa, era un carrusel de consejos disfrazado); el traductor de LinkedIn de corporatedudes sí (45% risa). **Si dudas de si algo es meme, mira el % de risa antes de proponerlo.**
> - 🌍 **El meme NO tiene que ser DE ventas; tiene que ser VIRAL + dolor psicológico (Iker, 2026-07-23).** El dolor psicológico es UNIVERSAL (los calvos, el ridículo, la autodelusión, el pavor a que te pillen) y a ventas lo adaptamos NOSOTROS en el texto y la imagen. NO descartes un meme buenísimo por no ser "sales-native" — eso es sobre-filtrar (me pasó: rechacé memes de corporatedudes por "no ser de ventas"). Lo que importa: risa alta + dolor humano reconocible + que se pueda anclar a ventas al remixar. El de "los calvos" funcionó justo así: calvicie = dolor psicológico social, y encima resulta que en ventas también quema.
> - ♻️ **UN CONCEPTO QUEMADO COMO PROPUESTA NO está quemado como CHISTE (Iker, 2026-07-23).** El "traductor" flopeó como LEAD MAGNET (*"traduzco comentarios"* 0.43x, `global §2` flops): ahí el traductor ERA la propuesta de valor y no valía nada. Pero como MEME el traductor es el CHISTE (la autodelusión de maquillar el parte), y lo que vendemos en el spam ninja es otra cosa ("a quién llamar y cuándo"). Antes de reusar un concepto, mira en qué PAPEL cayó: quemado como propuesta ≠ quemado como broma. Lo que NO se hace: presentar el traductor como si fuera lo que ofrece Neety.
> - 📐 **FIDELIDAD > "corto y punchy" (Iker, 2026-07-23).** "Corto y conciso" es NUESTRO default, pero **manda la estructura del original** (`§4.4` Paso 3, "longitud: la del original"). Si la referencia lleva lista de flechas + lista numerada, el remix las lleva; si es un traductor de dos cajas, el remix es un traductor de dos cajas. Me pasó: cogí una referencia larga (flechas + numerada) y entregué un cuerpo corto "porque lo nuestro es corto" — mal, eso es escribir otro post, no calcar. Primero calca la estructura del original, LUEGO mejora el punch dentro de esa estructura.
> - 💥 **EN MEMES DE "GAP", LA ESENCIA ES EL TAMAÑO DEL SALTO, NO EL MOLDE (Iker, 2026-07-23).** Traductor, antes/después, expectativa vs realidad, "lo que digo / lo que quiero decir"… el motor es el CONTRASTE, y el contraste lo da lo CRUDO/absurdo/bestia del lado "real". El traductor original ponía una barbaridad (*"I just shit my pants"*) para que el salto a la versión LinkedIn fuera brutal. Yo puse *"El cliente me dijo que no"* — demasiado suave, un "no" ya esperas que se maquille, y el chiste se desinfla. **Calca ese REGISTRO: pon lo más crudo/humillante que la voz de la cuenta aguante** (un founder no suelta el taco literal, pero sí "el cliente me colgó a la cara" o "llevo 4 meses sin cerrar un pedido"). Cuanto más patética/real la entrada, más gordo el salto y más gracia. No suavices el input.
> - ⏳ **CALCA HASTA EL TIEMPO VERBAL (Iker, 2026-07-23).** La esencia incluye el TIEMPO del verbo (`§2.9b`). El traductor original va en FUTURO (*"this is GOING TO BE a million dollar business"*) y yo lo puse en presente (*"Esto factura millones"*) — mal. Corregido a futuro: *"Esto VA A FACTURAR millones"*. Si el original promete (futuro), tú prometes; si constata (presente), tú constatas. El tiempo verbal cambia el tono tanto como el verbo.
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
> **⭐ MEJORAR = VERBOS PUNCHY Y SIN REPETIR (Iker, 2026-07-23).** Calcar y adaptar a ventas es el suelo; el plus es que el resultado sea MÁS punchy que el original. Dos fallos que lo tiran: (1) **verbo flojo** (`global §2.9`, escalera y techo) — sube el verbo un peldaño; (2) **repetir el mismo verbo** en el hook. Ej. real que se rechazó: hook *"Te venden que vender es mandar la oferta y cerrar"* — `venden`+`vender` pegados, queda fatal. Arreglado: *"Te pintan la venta como una línea recta"* (`pintan` punchy, un solo `venta`, y encima monta la imagen del zigzag). Antes de entregar el hook, léelo en alto: si un verbo se repite o suena plano, otra pasada.
>
> **Y el cierre punchy es SIEMPRE una linea.** Dos oraciones largas al final diluyen el remate: un cierre no admite explicacion detras.

**Paso 0 — Conseguir la referencia:** accede al enlace y extrae (a) el **TEXTO** del post (gancho/1ª línea + cuerpo) y (b) la **FOTO**.

**⛔ PASO 0 — ¿ESTE TEMA YA LO HAN HECHO DOS CUENTAS DE VENTAS? ENTONCES ESTÁ QUEMADO (medido el 2026-08-05).** El lead magnet de Iker del 28/07 hizo **2.837 impresiones (0.82x)** siendo **el cuarto de nuestro sector en subir el mismo recurso**.
- **Y el dato que señala dónde estuvo el fallo:** sacó **31 comentarios sobre 23 likes**, más comentarios que likes. **El gate funcionó perfectamente.** Lo que no llegó fue la gente. O sea que **no fue la receta, fue el tema**: la mejoramos mucho y dio igual.
- **Por qué mata:** el lead magnet vive de que el lector quiera ESE recurso. Si ya lo ha visto pedir tres veces en su feed, **ya lo tiene o ya decidió que no lo quiere**. Un gancho mejor no arregla eso.
- **Comprobación obligatoria antes de elegir tema:** cruzar contra el banco de outliers de competencia (`/api/analysis/cross-creators`). **Si dos o más cuentas de ventas ya lo han hecho, se cambia de tema**, por muy validado que esté. Estar validado y estar quemado son la misma cosa vista con un mes de diferencia.

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

#### 🔴 4.5.-2 · TODO LEAD MAGNET TIENE QUE CAPTURAR ALGO — AVISO OBLIGATORIO AL ITERAR IDEAS (Iker, 2026-07-22)

**El objetivo NO es solo que se haga viral. Es que se haga viral Y capture, porque vendemos un producto de IA y hay que llevar a la gente hacia comprar.** Un lead magnet que se hace viral y no captura nada es **regalar valor como quien regala calabazas**: el peor resultado, porque gastas el mejor alcance en cero pipeline.

**Caso que no se repite:** "desmonto perfiles" 8.52x · 483 comentarios · **capturó CERO** (regalaba todo, sin gate, sin funnel). Alcance de lujo tirado.

**REGLA DE TRABAJO (esto es un aviso que doy YO, sin que Iker lo pida):** cada vez que se **itere una idea de lead magnet**, antes de escribir nada, comprobar: **si esta idea se hace viral, ¿capturamos algo — correo, lead o demo?** Si la respuesta es no, **AVISAR a Iker con esas palabras** ("esto, si pega, no captura nada") y proponer cómo cerrarlo, ANTES del borrador. No esperar a que pregunte.

**Las tres vías de captura (al menos una, siempre):**
1. **Gate de correo** en una web de recurso (`lead-magnet-web`) → captura email. El caso del recurso público.
2. **Funnel a `agendar`** dentro del entregable → demo/lead. En un lead magnet que entrega por DM y NO crea web ni gate (la lista de empresas), el DM cierra con spam ninja a agendar (`global §4.4b`, matiz del DM privado). Sin esto el DM captura cero.
3. **El propio DM/relación** como puerta comercial, si además lleva el funnel de (2).

**Ojo:** el aviso vale para CUALQUIER pilar viral, no solo el lead magnet — un meme que se dispara sin su spam ninja también es alcance tirado (`global §4.4b`). Pero en el lead magnet es donde más duele, porque ahí el alcance es escaso y caro y el objetivo declarado es pipeline.

#### ⭐ 4.5.-1 · LA IMAGEN DEL LEAD MAGNET: CALCAR SI, PERO NO COMO EN EL MEME (Iker, 2026-07-21)

**La diferencia que hay que tener clara:** en el meme **la foto ES el motor**, asi que se calca si o si (`§4.4`). En el lead magnet **el motor es el volumen de comentarios**, no la imagen. Por eso aqui la imagen es opcional y se decide mirando la referencia.

**Regla de decision:**
1. **¿La referencia lleva imagen y es buena?** → cálcala con todo lo de `§4.4` Paso 6 (inventario primero, un solo parrafo, contencion partida, `images §0h`).
2. **¿No lleva imagen, o la que lleva es mala?** → no la copies. Publica sin foto o con una nuestra.

**⭐ LO QUE HAY QUE MIRAR: QUE ENSEÑA ESA IMAGEN.** Caso real, Guillermo Flor 12.3x: su imagen **no es una foto suya, es una captura de la propia lista** — la tabla entera con nombres reconocibles a la vista (Naval Ravikant, Mark Cuban, Sam Altman, Peter Thiel). **La imagen es la PRUEBA de que el recurso existe y de que es bueno.** Eso vale muchisimo mas que un selfie, y encima resuelve el problema de las cuentas que no tienen fotos naturales.

**Consecuencia practica:** en un lead magnet de lista o plantilla, **enseña el artefacto**, no tu cara. Y las filas de esa captura **tienen que ser reales**: si alguien busca una y no existe, se cae el post entero (`aboutme`: nunca inventar).

**Lo que se calca y lo que no** (igual que en meme): se calca el layout, la estructura de columnas y la mecanica de "aqui esta lo que vas a recibir". **Manda lo nuestro** en paleta (Alabastro + naranja), tipografia (Bricolage + Switzer), formato 1:1 y **cero footer y cero logos** (`images §0h` regla 3) — Guillermo lleva una franja de marca abajo y **se quita**.

**El titulo de la imagen** cumple lo mismo que en cualquier otro pilar (`images §0h` y `§1b`): corto, verbo punchy, anclado a ventas y **sin repetir el hook**. Caso real: hook *"La lista definitiva de 25 empresas activas a las que vender"* → titulo de imagen *"Vender sin llamar a ciegas"*.



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
- `⚰️ D.E.P.` ← el R.I.P. en español. Nuestro (Iker, 21/05: *"⚰️ D.E.P. prospección a ciegas"*) y el que **acaba de usar Martín Arosa** (2026-07-23). Mata algo que el lector hace mal (una práctica, no el modelo).
- `🚨 Acaba de pasar:`
- `🚨 Esto cambió ayer:`
- `🚨 Nadie lo ha contado todavía:`
- `🚨 Llevo 24 horas dándole vueltas a esto:`

**🔴 ES OBLIGATORIO, COMO "EXPORTA" EN LOS MAPAS (Iker, 2026-07-23).** No es "una opción que va bien": el hook del lead magnet **abre siempre** con el disparador de última hora + emoji de alarma (🚨 o ⚰️). **El validador lo comprueba** (`--pilar leadmagnet`). Por qué ahora es regla dura: la lista de Unai (22/07) se lo saltó y arrancó fría (0 comentarios ajenos el día 1; despegó el día 2 a ~4.000 imp cuando llegaron comentarios reales). **Validación externa:** Guillermo Flor y Martín Arosa —los dos referentes que SIEMPRE publican lead magnets— abren SIEMPRE con este gancho. Es su firma, y es la de nuestros dos mejores. Cuando Iker pase el enlace del post de Martín Arosa, añádelo aquí con su ratio.

**⭐ SHOW DON'T TELL + RETRASA EL DESVELAMIENTO, como en los mapas (Iker, 2026-07-24).** El hook de última hora **NO cuenta toda la historia de cabeza.** Da el SHOCK (el dato, la subvención) pero **retrasa el "quién/dónde" al cuerpo** — igual que el mapa no dice la región hasta tarde (`§4.2` reveal tardío). Fallo real: *"🚨 en Euskadi subvencionan el 60% de tu IA…"* soltaba **Euskadi en la línea 1** (como cantar la región en un mapa). Arreglado: *"🚨 hay una subvención que te paga el 60% de tu IA para vender más. Y casi nadie la pide 👇"* — el shock (subvención 60%) + intriga ("casi nadie la pide"), y **"Euskadi / SPRI / industria vasca" se revela ya dentro del cuerpo**. Es regla de hook GENERAL (`§2`), no solo del lead magnet: shock + gap, nunca exposición plana con la respuesta entera servida.

#### 🔴 4.5.0c · EL RECURSO PROMETE IDENTIFICACIÓN, NO SEÑALES — Y HAY QUE LLEGAR EL PRIMERO (Iker, 2026-07-29)

**El caso que lo enseña, medido:** el lead magnet de prospección manual (Iker, 28-jul) hizo **0,66x con 1.706 impresiones**, frente al de la subvención (1,16x, 4.420 imp). **2,6 veces menos alcance.** No falló la conversión: casi nadie lo vio. Dos causas, las dos evitables:

**1. Prometimos lo que menos compran.** De los 5 puntos de la guía, **2 eran de señales**, el titular de la imagen era de señales (*"Todos avisan antes de comprar"*) y el gancho llevaba ahí. Pero el informe de 50 demos dice que la señal interesa **a nivel secundario** (`aboutme §1b`) y lo que compran es **a quién vender y quién decide dentro**. Solo 1 de los 5 puntos tocaba eso.
- **Regla:** el recurso se construye sobre **la identificación** (qué empresas encajan y quién decide en cada una), y se mide en **MESES ahorrados**, que es la palabra que usan ellos. Las señales pueden salir, pero **nunca como promesa principal ni en el titular de la imagen**.
- **Y no prometas que la IA escribe el mensaje:** objeción real y repetida (*"se nota automatizado, se ignora y quema la confianza"*).

**2. Llegamos tarde a un tema quemado.** Martín Arosa publicó *"D.E.P. prospección manual"* el **25-jun**; nosotros el **28-jul**, un mes después y con audiencia solapada. **Un tema validado no vale si ya te lo han contado: el que pidió su guía no pide la segunda.**
- **Antes de elegir tema, comprueba cuándo lo publicó la referencia.** Si tiene más de 2-3 semanas y comparte audiencia con nosotros, o se cambia de tema o se cambia el ÁNGULO por completo. Copiar el molde es bueno; copiar el tema con un mes de retraso es llegar al turno de otro.

#### 📋 4.5.0-ENTREGA · EN TODA ENTREGA DE LEAD MAGNET VAN NUESTROS 5 MEJORES GANCHOS (Iker, 2026-08-05)

**Después del texto del post, SIEMPRE, va una tabla con los cinco ganchos de lead magnet que más comentarios nos han dado, ordenados por comentarios.** Iker: *"para que así pueda revisarlo siempre bien"*.

**No se copia de aquí: se genera de la base de datos en cada entrega**, filtrando `pillar = lead_magnet` en las 3 cuentas y ordenando por `comments_count`. Así el bloque se actualiza solo cuando publiquemos uno que entre en el top 5, y **nunca queda desfasado**.

**Columnas:** comentarios · ratio · el gancho literal · **el verbo punchy subrayado**, que es lo que hay que comparar contra el gancho nuevo.

**Para qué sirve de verdad:** es el listón. Antes de dar por bueno un gancho, se pone al lado de esos cinco y se ve si aguanta la comparación. Es la versión práctica de `global §0-DATOS`: **nuestros datos delante, no de memoria.**

#### ⛔⛔ 4.5.0a · LOS INAMOVIBLES DEL LEAD MAGNET (Iker, 2026-08-05). Igual que `exporta` en el mapa.

**1 · EL GANCHO: DOS PIEZAS VALIDADAS, Y LO ÓPTIMO ES LLEVAR LAS DOS A LA VEZ.**

🥇🥇 **LA ESTRUCTURA CAMPEONA ES LA SUMA: `[DISPARADOR] + CLAUDE + [VERBO PUNCHY] + [resultado de VENTAS]`** (Iker, 2026-08-05). Los cinco lead magnets nuestros de Claude, por comentarios:

| c | cuenta | gancho | disparador | Claude+verbo |
|---|---|---|---|---|
| **632** | Unai | `🚨 ÚLTIMA HORA: Claude acaba de matar el cold outbound…` | ✅ | ✅ |
| 285 | Unai | `Le pasé las llaves de mi LinkedIn a Claude…` | — | ✅ |
| 232 | Iker | `Le tiré las llaves de mi LinkedIn a Claude…` | — | ✅ |
| 183 | Iker | `Claude me ha ayudado a cazar miles de leads…` | — | ✅ |
| **167** | Unai | `🚨 ÚLTIMA HORA: Claude ha reducido toda mi prospección…` | ✅ | ✅ |

**El #1 y el #5 llevan las dos. Y el disparador es además lo que usan sin falta Martín Arosa y Guillermo Flor: eso es DOBLE validación, dentro y fuera de casa.** No es redundancia, es la máxima garantía que sabemos comprar. Con una pieza el post pasa; con las dos se repite la estructura exacta del mejor que hemos hecho nunca.

- **⭐ UNA SOLA MARCA DE RECIENTE, NO DOS (Iker, 2026-08-07).** `🚨 ÚLTIMA HORA`, `ahora` y `acaba de` **dicen exactamente lo mismo**, y nuestro 632c llevaba DOS a la vez (*"🚨 ÚLTIMA HORA: Claude ACABA DE matar…"*). Con una basta. Y de las tres, **`ahora` es la única que no imita una alerta de noticias**, así que es la que se usa cuando queremos la sensación de novedad sin la señal de sensacionalismo. Iker lo vio al quitar ÚLTIMA HORA tras dos posts capados: *"decir última hora, decir ahora o decir acaba de es lo mismo"*.
- **⭐ Y LA NOVEDAD SE COMBINA CON LA PRIMERA PERSONA, no la sustituye.** `Claude ahora TE encuentra…` es un anuncio de función y es la familia de Martín Arosa; `Claude ahora ME encuentra…` es un experimento y es la nuestra —los 4 mejores nuestros sin alarma hablan de lo que me pasó A MÍ—. Una letra de diferencia y cambia de familia.
- **PIEZA 1 · EL DISPARADOR.** `🚨 ÚLTIMA HORA` · `⚰️ D.E.P.` · `BREAKING` · `🚨 ADIÓS`. **Rota**, pero alguno tiene que haber.
- **PIEZA 2 · CLAUDE + VERBO.** `Claude acaba de [verbo]` · `Claude ahora [verbo]` · `Claude me ha [verbo]` · `Le di/pasé/tiré las llaves a Claude` · `Hoy [verbo]…` · `Cada semana…`.
- **⚠️ EL ERROR QUE ESTO CORRIGE (Iker, 2026-08-05):** yo tenía esto escrito como dos moldes **rivales** ("el nuestro" vs "el de ellos") y basta-con-uno, y llegué a recomendar quitar el disparador *porque era de fuera*. Es falso: el disparador está en nuestro #1 y en nuestro #5. **Antes de declarar que un patrón es "de ellos", míralo en nuestra tabla.**
- **⚡ EL VERBO ES LA MITAD DEL GANCHO, Y VA ITERADO (Iker, 2026-08-05).** Mira los de nuestros cinco mejores: **matar** (632c) · **desmontar** (483c) · **tirar** las llaves (232c) · **cazar** miles de leads (183c) · **pasar** las llaves (285c). Todos **punchy y visuales**, ninguno de relleno. Iker: *"me centraba en refinar al máximo los hooks, y la clave era el verbo punchy"*.
  - **Se itera con la escalera de `§2.9` y se para en el peldaño con techo.** Para "encontrar a quien decide": `encontrar` → `localizar` → **`destapar`** → `desenterrar`. Se queda en destapar: `encontrar` es de relleno y `desenterrar` se pasa.
  - **Fíjate en que `matar` sí valía**: la escalera no prohíbe lo fuerte, prohíbe lo gratuito. `Claude acaba de matar el cold outbound` es nuestro mejor lead magnet.
- **⭐ Y NUESTROS GANCHOS SÍ LLEVAN `👇`**, aunque Martín Arosa y Guillermo Flor no lo usen: tres de nuestros cinco mejores lo llevan y otro usa `↓`. **Manda lo nuestro** (`global §0-DATOS`).
- **⭐ CLAUDE VA DELANTE si se puede.** Dos de los cinco abren literalmente con la palabra (`Claude acaba de matar…`, `Claude me ha ayudado a cazar…`). Es lo primero que lee el que quiere la herramienta.
- **En los dos moldes:** `CLAUDE` no se toca, el remate es un resultado de VENTAS, ≤90 caracteres y cero cifras.
- **El disparador ROTA**: `🚨 ÚLTIMA HORA` · `⚰️ D.E.P.` · `BREAKING` · `🚨 ADIÓS`.
- **`CLAUDE` NO SE TOCA.** Va nombrado en la primera línea, siempre.
- **El remate es un resultado de VENTAS**, no una capacidad de la herramienta.
- ≤90 caracteres · cero cifras · sin `👇`.
- Validado: *"🚨 ÚLTIMA HORA: Claude ya te dice a quién le tienes que vender"* (66 car).

**LA PRUEBA, de nuestras propias cuentas:** los **cinco** lead magnets nuestros con Claude pasaron de **100 comentarios** (632 · 285 · 232 · 183 · 167). Mediana con IA **167**, sin IA **20**. **Ocho veces más, y en este pilar el comentario ES la conversión.**

**2 · EL POST ES UN EXPERIMENTO EN PRIMERA PERSONA, NO UN PAQUETE.** Esto es lo que perdimos en junio y explica el desplome de 208 a 18 comentarios en un mes.
- **Lo que funcionaba (abril-mayo):** *"Le pasé las llaves de mi LinkedIn a Claude y nunca había cerrado tantas reuniones"* · *"Claude me ha ayudado a cazar miles de leads"* · *"Hoy desmonto perfiles en directo"*. **Todos son: YO hice X, me pasó Y, te doy lo que usé.**
- **Lo que dejó de funcionar (junio-julio):** `nuestro arsenal volcado` · `la biblia de ventas` · `la lista definitiva de 15 empresas` · `una auditoría de tu web`. **Todos son paquetes.** Nadie pide un paquete: piden lo que le funcionó a alguien.
- **🔴 Y de aquí sale una obligación práctica: el experimento tiene que ser REAL.** Si el post dice "le di X a Claude y pasó Y", **Iker lo tiene que haber hecho de verdad**, aunque sean 20 minutos con 10 empresas. Sin experimento no hay post: se cambia el ángulo, no se inventa el resultado.

**3 · UN recurso, genérico, el mismo para todos, y la captura la hace el GATE de la landing.**

**3b · ⭐ LA PALABRA DEL CTA ES UN CARTEL PÚBLICO, NO SOLO UN FILTRO (Iker, 2026-08-07).** Cuando el hilo se llena, cualquiera que pase ve doscientos comentarios con esa palabra. **Si se entiende sola, el propio hilo vende el post; si es opaca, no dice nada.** Iker: *"si ahora ves moviendo comentarios con la palabra cierra, no vas a saber de lo que va"*.
- **El test:** léela sin el post delante. ¿Se entiende? ❌ `cierra`, `vibe`, `frase`. ✅ `nombre`, `perfil`, `llaves`.
- **La mejor palabra es la TESIS del post.** El del 07/08 dice *"el problema es el nombre"*, así que la palabra es `nombre` y el gancho la incorpora: *"Claude ahora me da el nombre de quien cierra la compra"*. Los tres criterios a la vez: se entiende sola, es la tesis, y reconecta con el gancho.
- **Y `me da el nombre` gana a `me encuentra a quien`** (Iker): es más concreto —promete algo que puedes pegar en un buscador— y baja el riesgo, porque `encontrar a alguien` roza el registro de rastrear personas.
- **⛔ Gastadas en todo LinkedIn, no valen aunque nosotros no las hayamos usado:** `guía`, `plantilla`, `info`, `quiero`, `dame`, `pdf`, `link`, `gratis`. No distinguen nuestro post de los otros doce del feed. Mecanizado en el validador.

**4 · ⛔ LAS PROMESAS DEL CUERPO SE VERIFICAN COMO SE VERIFICA UNA CIFRA (Iker, 2026-08-05).** Se me coló *"te saca su nombre y su perfil **sin pagar una herramienta**"* en un post sobre cómo encontramos nosotros a los decisores. **A esa persona la encontramos con Sales Navigator y Unipile, y los dos se pagan** (Unipile: 49 €/mes mínimo, 7 días de prueba). Es la misma familia de mentira que inventarse una empresa, con el agravante de que **la desmonta el propio lector en cuanto lo intenta**, y encima ese lector es el que acaba de dejarnos el correo.
- **NUESTRO STACK REAL, para contrastar contra él:** Claude · LinkedIn Premium (las 3 cuentas) · Sales Navigator · Unipile · nuestro backend. **Todo menos Claude a secas se paga.**
- **Di lo que el prompt SÍ hace, no lo que te ahorra.** ❌ *"te saca su perfil sin pagar nada"* → ✅ *"te da el filtro exacto con el que buscarla en LinkedIn"*.
- **El experimento tiene que ser reproducible por el lector con lo que le dices que hace falta.** Si para reproducirlo necesita Sales Navigator, o se dice, o se cambia el prompt.
- Mecanizado: el validador falla ante `sin pagar` · `sin herramienta` · `no necesitas pagar` · `sin suscripción` y similares en el cuerpo de un lead magnet.
- **Y de aquí, la longitud de la lista: números IMPARES (Iker, 2026-08-05).** Al caerse el prompt falso quedaban 5 en vez de 6 y **mejor así**: 5 y 7 rinden más que 4 y 6 en lista numerada. Si al quitar algo te queda par, quita otro o añade otro.

**5 · EL CTA PIDE LA PALABRA **Y UN SEGUNDO DATO** (medido en los nuestros, 2026-08-06).** Iker dudaba porque la competencia pide una sola palabra y porque nuestro #1 (`vibe`, 632c) también. Los diez nuestros con más comentarios dicen lo contrario:

| | posts | mediana comentarios | mediana impresiones |
|---|---|---|---|
| **Con 2º dato** (483 · 285 · 183 · 167) | 4 | **234** | **11.638** |
| Solo palabra (632 · 232 · 177 · 129 · 104 · 65) | 6 | 153 | 8.522 |

**Un 53% más de comentarios pidiendo el dato.** La hipótesis de Iker, que explica el porqué: 600 comentarios idénticos (`vibe`, `vibe`, `vibe`) le huelen a LinkedIn a coordinación y nerfea el alcance; el segundo dato los hace todos distintos. Datos usados: `+ tu sector` · `+ tu departamento` · `+ tu emoji favorito`. **El dato tiene que servir para responderle**: el `+ tu mes de cumpleaños` no servía para nada y flopeó a 0.57x.

**6 · PALABRAS VETADAS EN LA MARCA PERSONAL DE IKER: `descargar`, `instalar`, `gratis` (Iker, 2026-08-06).** En LinkedIn **no nos penalizan** —medido: `gratis` sale en 15 posts con mediana de 3.884 impresiones contra 3.371 del corpus entero, y está en el gancho de nuestro **#2** (*"Hoy desmonto perfiles de LinkedIn gratis"*, 483c)—. **Así que `gratis` se usa sin miedo.** `instalar` (3 posts) y `descargar` (1) no tienen muestra que las defienda y casi siempre sobran: *"No hay nada que montar"* dice lo mismo. El validador las marca como aviso, no como fallo.

#### ⭐⭐ 4.5.0b · EL MODELO GENÉRICO — PATRONES DE MARTINA ROSA Y GUILLERMO FLOR (Iker, 2026-07-24)

🎯 **ESTE PILAR SE MIDE CONTRA ELLOS, NO CONTRA NUESTRO HISTORIAL (Iker, 2026-07-24).** No tenemos la estrategia de lead magnet pulida como los mapas o los memes: casi no hay datos de éxito nuestros, así que **NO te fíes de nuestros flops** (ni de las reglas que salieron de ellos). El único dato interno fiable es el **9.85x de Unai**, que además usó ESTE formato (última hora + temática tipo IA, parecida a la suya). La **vara de medir de TODA la publicación —hook, cuerpo E imagen— son Martín Arosa y Guillermo Flor.** Es el pilar más valioso para conversión (captura correos → email marketing) y hay que recuperarlo. El validador `--generico` ya mide contra ellos: hook (corto ≤90, sin cifras, sin 👇, con alarma) y cuerpo (lista numerada + largo); la imagen, la captura del recurso (punto 6).

**🔎 CÓMO ELEGIR REFERENCIAS: el signo es COMENTARIOS DISPARADOS, mín ≥500 (Iker, 2026-07-24).** Igual que el meme se elige por % de RISA, el lead magnet se elige por nº de COMENTARIOS (es comment-gated: la gente comenta la palabra). **Piso: ≥500 comentarios** (ellos sacan 1.000-9.600; con <100 no interesa). Fuente = sus feeds en vivo por Unipile (`GET /users/{pid}/posts`, filtra `comment_counter>=500`); nuestra BD `/api/analysis/cross-creators` vino VACÍA, no sirve. **Los 3 referentes del sector (estúdialos, no solo 2 posts):**
- **Martín Arosa Otero** (`martinarosaotero`): **34 posts ≥500c, top 6.128c**. Formato estrella: `🚨 D.E.P. [categoría], ADIÓS. 🚨` (alarma a los DOS lados) y `🚨 ÚLTIMA HORA: [Claude/GPT] ahora puede [X]`. Usa `↳` para presentar el recurso.
- **Guillermo Flor** (pid `ACoAABBit2ABCYNySanEgukvlFBH-HcIKGlWHu8`): `I turned [X] into AI Skills 🔥`, `BREAKING: [news]`, `The [X] Playbook 🔥` (bold).
- **Luna Chen** 🐝 (@QuickGen/Beeze AI, pid `ACoAACZ9ZkcBl_c6lvWcyXAVnyI2ukNM7u7sYjY`): **9.626c en el top**. **La más cercana a NOSOTROS: va de VENTAS puras** (SDR con IA, outreach, GTM, prospección, "get clients"). Sus hooks SÍ se atan a un resultado de VENTAS y petan → **el ancla de ventas SÍ funciona en este pilar** (responde el miedo de Iker: sí conviene atarlo a ventas).

**EL CUERPO REAL, calcado del top de Martín Arosa (2.477c):** hook → intro al recurso + `(guarda esto)` → `¿El problema?` + **`❌ lo malo` / `✅ lo bueno`** (con esos emojis) → `Ahí es donde [la IA] cambia el juego` → **LISTA NUMERADA** de lo que hay dentro → **reframe de valor punchy** (*"el cliente no compra tu perfil, compra lo que entiende de ti en 5 segundos"*) → recap del recurso (*"listos para copiar, pegar y aplicar hoy"*) → **CTA: `Comenta "X" y te lo envío por privado. Conecta conmigo`** (una palabra + "conecta" para poder mandarle el DM, que necesita 1er grado). Ojo: Martín Arosa a veces SÍ mete cifras en el hook ("39 llamadas en 5 días"); nosotros NO (preferencia de Iker), pero que conste que a ellos les funciona.

**NOMBRAR TERCEROS = CREDIBILIDAD, pero cuidado con la fuga (Iker, 2026-07-24).** Los tres nombran marcas concretas y eso da credibilidad: Guillermo (McKinsey, Claude), Luna (Clay, Phantombuster como enemigos a "borrar"), Martín (Claude, GPT-5). Lo específico se cree; lo genérico suena a vapor. **Pero ellos nombran AUTORIDAD o herramientas, no "un proveedor al que podrías ir en vez de a mí".** Cuando el tercero es un PARTNER de servicio (ej. la consultora que gestiona la subvención, Ikale Consulting): (a) nómbralo UNA vez, EN EL CUERPO, nunca en el gancho; (b) enmárcalo como **"nuestro partner X"** —no "contacta a X"— para que Neety siga siendo la puerta y no te salten al proveedor directo; (c) el nombre tiene que ser REAL y bien escrito (verifícalo). El plus de credibilidad ("esto es real, no humo") suele ganar a la fuga, que es pequeña porque el camino de menos esfuerzo sigue siendo comentar la palabra.

**Son los dos que MÁS comentarios sacan del sector, y REPITEN lo que funciona (como nosotros con los mapas).** Martín Arosa hizo el mismo lead magnet dos semanas seguidas —misma foto, casi el mismo hook (solo cambió mayúsculas y quitó el emoji final), cuerpo reescrito un poco— y sacó **1.033 comentarios** una semana y **788 en <24h** la siguiente. Guillermo saca **2.014** con el mismo molde. **Nuestro error era dejar de hacer el gancho de última hora / adiós / D.E.P. y encima personalizar de más.** El validador ya tiene el flag `--generico` para este modelo (salta el check del 2º dato). Los patrones, medidos sobre sus posts:

1. **⭐ CLAUDE VA NOMBRADO EN EL GANCHO, NO SOLO EN EL CUERPO (Iker, 2026-08-05).** Si el recurso es de Claude, **la palabra Claude aparece en la primera línea**, corta y con ancla de ventas. Yo entregué *"⚰️ D.E.P. escribirle al que no decide"*, que es punchy pero **no dice de qué va el recurso**, y en este pilar el lector comenta porque quiere ESA herramienta. **Lo que rota es el disparador** (`🚨 ÚLTIMA HORA` / `⚰️ D.E.P.` / `BREAKING`), no la mención de Claude. Y el dato que lo sostiene: nuestros lead magnets con IA sacan **mediana de 167 comentarios contra 20** los que no la llevan.
1. **HOOK — disparador + tema de IA en tendencia. Y CORTO.** Alarma (`🚨 ÚLTIMA HORA` / `⚰️ D.E.P.` / `BREAKING:` / bold + `🔥`) sobre lo ÚLTIMO de IA (skills, agentes, un modelo nuevo). El sujeto es el TRABAJO del lector (`§4.5.0`), no el modelo. Ej. real Martín Arosa: *"⚰️ D.E.P. prospección manual"* (4 palabras); Guillermo: *"BREAKING: [modelo] just made [X] accessible"*, *"I turned McKinsey frameworks into AI Skills 🔥"*, *"The one-person billion-dollar company 🔥"*.
   - **⭐ MECÁNICAS CONCRETAS DE SUS HOOKS (lo que me salté el 2026-07-24 y Iker me paró):** (a) **CORTO, de pocas palabras** — el validador `--generico` lo exige (≤90 car). (b) **CERO cifras** — los números (60%, 100.000€) van al CUERPO, nunca al hook (Iker lo odia). (c) **SIN `👇`** — ellos no lo usan; emoji de alarma al INICIO (`🚨`/`⚰️`) o `🔥` al final. (d) **Show don't tell + reveal retrasado** (el de arriba): da el shock, retrasa el quién/dónde. Fallo real: entregué *"🚨 ÚLTIMA HORA: hay una subvención que te paga el 60% de tu IA para vender más. Y casi nadie la pide 👇"* — largo, con 60% y con 👇, TODO lo contrario de lo suyo. Arreglado: *"🚨 ÚLTIMA HORA: tu próxima IA no la pagas tú"*.
2. **CUERPO MÁS LARGO QUE EL NUESTRO** (nos quedábamos cortos). La estructura, calcada de los dos: **setup/reframe** (una historia o un "el problema nunca fue X") → **malo → bueno** (a menudo con emojis) → **LISTA NUMERADA de lo que hay DENTRO del recurso** (1, 2, 3… los componentes concretos: "12 skills", "10 skills", los pasos) → **ancla de valor** (*"esto es lo que $2M/un asesor te cobraría"*).
3. **CTA — UNA palabra IGUAL PARA TODOS, sin 2º dato.** `Comenta "AGENTE"` / `Comment "CONSULTING"` / `Comment "SOLO"`. **NADA de pedir sector ni web personalizados**: todos comentan lo mismo. La palabra reconecta con el hook.
4. **UN recurso GENÉRICO, no personalizado y no varios.** Una guía / una biblioteca de skills, la MISMA para todos. Nuestro error doble: personalizar (cuesta tiempo y no hace falta) y regalar varios recursos a la vez. Uno, genérico, y basta.
5. **La captura la hace la LANDING (gate de correo), no el comentario.** Por eso el CTA no necesita 2º dato: el post consigue el comentario, y el correo/lead sale de la pequeña web con gate (`lead-magnet-web`). Sin gate, un lead magnet genérico regala y no captura (`§4.5.-2`).
6. **IMAGEN = el propio RECURSO, TODOS son Text+Photo (Iker, 2026-07-24; los 8 outliers de Luna son Text+Photo).** Nunca selfie ni meme: la foto ES la PRUEBA de que el recurso existe y es gordo. Dos moldes, ambos vistos en los tres:
   - **(a) PORTADA de una GUÍA en PDF, enseñada DENTRO del visor** (Martín Arosa, Guillermo): se ve el chrome del visor de PDF (miniaturas de páginas al lado, "1/28") → grita "esto es una guía real de 28 páginas". Portada editorial: **título serif gigante**, **logos de autoridad** (Claude/Anthropic + LinkedIn/McKinsey), y un **"Contenido" con índice numerado** (01-10) visible → prueba de que tiene chicha.
   - **(b) INFOGRAFÍA de una página** (Luna/Beeze): lista numerada (01-04) + sub-bullets con `↳` + **antes→después cuantificado** ("2 horas → 15 minutos") + logos de las herramientas + a veces avatares ilustrados (su org-chart del "SDR Team"). Cabecera y pie con su marca.
   - **Paleta común: crema/terracota editorial + serif (estilo Anthropic).** Nada de stock chillón.
   - **Para NOSOTROS:** portada de guía ("El 60% de tu IA subvencionado · SPRI · Euskadi") con índice de los 5 puntos, crema/serif, logos legítimos (Claude, SPRI/Gobierno Vasco), enseñada como PDF con sus miniaturas. Reutilizable entre posts de subvención.
7. **REPITE lo que funciona.** Si un tema+hook peta, se vuelve a hacer a las 1-2 semanas con cambios mínimos. No hace falta reinventar cada vez.

> ### 🎨 4.3-PLANTILLA · LA PLANTILLA DE "LOS 10" Y SUS COLORES (Iker, 2026-07-30)
> **Fichero:** `Documents/Mario/LINKEDIN GROWTH/LOS 10/LOS 10 PLANTILLA.psd` (1254x1254). **La edita Iker, no yo.** Verificada el 30/07: 10 placeholders de texto con el literal `Nombre`, 378.240 px de huecos transparentes y el titulo en capa editable a 81,8 px.
>
> **⭐ El titulo lleva `XXX` como marcador de region**, igual que el del despiece. Antes tenia `LA INDUSTRIA ASTURIANA` escrito a fuego **y por eso la orla de Andalucia salio diciendo ASTURIANA** y hubo que rehacerla. `montar-orla.py --region ANDALUZA` lo sustituye solo.
>
> **🎨 Colores oficiales, de la PAGINA 23 del `docs/brandbook-neety-2026.pdf`. Esa es la fuente, NO los PSD:**
>
> | Color | Codigo | RGB |
> |---|---|---|
> | Berenjena | `#431b44` | 67, 27, 68 |
> | Naranja | `#fe8238` | 254, 130, 56 |
> | Mint claro | `#ebfff6` | 235, 255, 246 |
> | Azul bebe | `#a7c5f9` | 167, 197, 249 |
>
> **🔴 LOS PSD ESTAN DESVIADOS Y NO VALEN COMO REFERENCIA (Iker, 2026-07-30).** Muestreados el 30/07: franja `#461943` en vez de `#431b44`, fondo `#e6f6ef` en vez de `#ebfff6` y el naranja de "Los 10" en `#ee9363` en vez de `#fe8238`. **El origen:** la plantilla salio de un generador de imagen, los colores se movieron por el camino y cada copia lo ha ido arrastrando.
>
> **⚠️ Y me equivoque yo ANTES en esta misma seccion.** Al ver que el PSD no coincidia con mi memoria, di por hecho que el equivocado era yo y escribi aqui que los PSD mandaban. **Era al reves.** La leccion: cuando un fichero derivado contradice a la fuente, **se comprueba la FUENTE**, no se asume que la fuente esta obsoleta. El brandbook manda sobre cualquier PSD, plantilla o captura.
>
> El blanco del titulo esta en `#f9f3ef`, que **no aparece en la paleta**. En brandbook estricto seria el Mint claro `#ebfff6`.

#### ⭐⭐ 4.7 · Runbook DESPIECE / OBJETO — el 3er peloteo regional (Iker, 2026-07-30)

**Qué es.** El tercer formato del pilar peloteo. El mapa pelotea EMPRESAS de una región, "Los 10" pelotea PERSONAS, y este pelotea **un OBJETO cotidiano despiezado**: cada pieza, la empresa de la región que la fabrica. **La prioridad es la EMPRESA**, como en el mapa, con la persona al lado. Estrenado el 2026-07-30 en la cuenta de Iker con Euskadi y el coche. Se valida con `--pilar objeto`.

**Paso 1 — OBJETO y REGIÓN.**
- El objeto tiene que ser **reconocible por cualquiera y despiezable**. El coche es el caso perfecto: todo el mundo tiene uno y da para 20 sistemas con proveedor distinto. Un aerogenerador sería más "nuestro" pero nadie tiene uno en el garaje.
- **La región se elige por IMPRESIONES, no por ratio.** Y **la región NO se quema entre formatos de peloteo**: el despiece es nuevo, así que puede repetir una región que ya hizo el mapa o "Los 10", incluso en la misma cuenta. Lo que sí va nuevo es el concepto, los clichés y la frase-rabia.
- **⚠️ Al fijar un sector el universo se estrecha muchísimo más que en un mapa**, que acepta cualquier industria. **Es el pilar con más riesgo de quedarse corto.** Medido el 30/07: Galicia daba 8 empresas y Euskadi 12. Si la región no llega a 10, se cambia de región, no se rellena.

**Paso 2 — LAS EMPRESAS, y aquí está el trabajo de verdad.**
- **⛔ SON 12 EXACTAS (Iker, 2026-08-07).** No es objetivo ni suelo: es el número. **La plantilla de la llanta tiene 12 huecos**, así que 11 deja un agujero vacío y 13 no cabe. El texto y la imagen son la misma pieza y aquí **el número lo manda la imagen**. Vale para el despiece de **cualquier objeto y cualquier sector**, no solo la llanta de automoción: cuando se cree la plantilla de otro sector, se crea con 12 huecos.
- ~~Objetivo 20, suelo 10.~~ (Era lo de antes, cuando la plantilla no estaba fijada.)
- **Descubrimiento: buscar PERSONAS, no empresas.** La página de LinkedIn de una empresa muestra su SEDE, no sus plantas: filtrando por localización de empresa se caen justo las grandes (Michelin dice Clermont-Ferrand aunque fabrique en Valladolid). Buscando personas con `keywords` de la planta salen las multinacionales con su gente real.
- **Cada pieza se asigna contra la DESCRIPCIÓN de la propia empresa** (`GET /api/v1/linkedin/company/{slug}` da `description`), nunca por intuición. **El 30/07 esto evitó cinco errores factuales**: Copreci hace electrodomésticos, Orkli climatización de edificios, Goizper bancos de ensayo, Onapres prensas y la página de Grupo ELAY es de recursos humanos. **Si la descripción está vacía, la empresa se cae** (así se fueron Mecaner y Megatech).
- Las cuatro comprobaciones de mención del `§4.2` aplican enteras.

**Paso 3 — EL TEXTO.** Calca la estructura del mapa y cambia solo su firma:
- **Gancho:** misma fórmula que el mapa (concepto despectivo en palabra universal + EXACTAMENTE 2 clichés universales + frase-rabia) **y el mismo remate con `exporta` + país concreto**. El OBJETO no sustituye a `exporta`: **va DENTRO del remate**, que es lo que diferencia al despiece sin romper el ancla de ventas. Plantilla: *"Y exporta más [piezas de coche] que [PAÍS] entero 👇"*.
  - **🔴 ESTO ES UNA CORRECCIÓN, NO LA RECETA ORIGINAL (Iker, 2026-07-31).** Yo escribí ayer que *"el despiece remata con el OBJETO y esa sustitución es lo que evita canibalizar el mapa"*, y el despiece de Euskadi salió con *"Y ahí se hace tu coche"* en vez de `exporta`. **Está rindiendo peor.** Lo que diferencia al despiece del mapa **no es quitar `exporta`**, es el objeto, el despiece por piezas y la imagen de la llanta: con eso sobra para no canibalizar. Ver los CUATRO INAMOVIBLES en `§4.2`.
- **Ficha:** `→ La pieza: @Empresa - @Persona`. La pieza delante y los dos puntos son la firma del formato y lo que lo distingue del mapa en el clasificador.
- **Bloques de 4**, y si el número no es múltiplo de 4 el último es de 2 o de 3, nunca de 1. Nunca un 5 seguido de un 2.
- **Reveal tardío** de la región, después de la lista, con los clichés locales justo antes.
- **Spam ninja** tras las menciones y **cierre punchy** de una línea.
- ⚠️ **NO importes la comparación con otro país.** Es la firma del mapa, igual que ya se decidió en "Los 10".

**Paso 4 — LA IMAGEN: plantilla de silueta + script.**
- **Idea de Iker:** la silueta del objeto más representativo del sector, con los **logos** repartidos por ella. En automoción, una **llanta** con los logos en la corona. Logos y no caras, porque este pilar prioriza la empresa.
- **La compone `scripts/montar-llanta.py`, no un generador.** Un modelo generativo rechaza logos de terceros por copyright y, si los acepta, los redibuja (`images §0i-2`).
- **Plantilla:** `Documents/Mario/LINKEDIN GROWTH/LOS 10/PLANTILLA OBJETO.psd` (1254x1254). Franja berenjena con el título en capa de texto editable donde `XXX` es el marcador de región, fondo menta, llanta en línea berenjena y los huecos de logo **transparentes**.
- **Los logos se bajan de Unipile** (`logo_large`) numerados en el orden del post: `01-acero.jpg`, `02-tubos.jpg`. Mismo procedimiento que el CSV del mapa, pero **aquí NO hay CSV**.
- **Una plantilla por SECTOR.** La llanta vale para automoción y se reutiliza en toda España y en las tres cuentas: solo cambia el título. Otro sector pide otra silueta.
- **El script ordena los huecos por ÁNGULO, como un reloj**, empezando arriba. Una orla se lee por filas, una rueda se lee como un reloj.
- **Los logos van CONTENIDOS, no recortados**, sobre un disco blanco. Un logo recortado pierde el nombre de la empresa, que es lo único que hay que poder leer.
- 🔴 **El desenfoque de postproducción va SOLO sobre la plantilla, una vez.** Las imágenes de cada región las compone el script y no llevan firma de generador, igual que "Los 10".

**OUTPUT FINAL de este pilar (SOLO esto, Iker, 2026-07-30):**
1. **El TEXTO** del post en bloque cercado, para copiarlo con el botón.
2. **La GUÍA DE MENCIONES** en tabla de 4 columnas con enlaces azules pulsables, empresa y persona.
3. **La IMAGEN** ya montada, **MOSTRADA en el chat** y **guardada en `Documents/Mario/LINKEDIN GROWTH/LOS 10/`** con la convencion de esa carpeta: minusculas, espacios y sin acentos, con el SECTOR delante (`automocion euskadi.png`, `alimentacion galicia.png`). El sector y no la palabra "objeto", que es jerga interna y no dice nada al abrir la carpeta (Iker, 2026-07-30).
4. **NADA MAS. Sin ZIP ni carpeta de logos** (Iker, 2026-07-30): los logos me los bajo yo para montar la imagen, asi que entregarlos es ruido. **Vale igual para "Los 10" con las fotos de las personas.** Lo unico que se entrega es la imagen final. La ruta se da igual, porque la necesita para subirla, pero la imagen se ensena. Vale lo mismo para "Los 10": si la compongo yo con un script, se ve aqui.

**Sin CSV, sin fotos de personas y sin Excel.** El mapa necesita CSV porque se dibuja un mapa; aquí no hay nada que importar.

#### ⭐⭐ 4.6 · Runbook HISTORIA PERSONAL / ANÉCDOTA (Iker, 2026-07-24)

> ### 🎯 4.6-OBJETIVO · ESTE PILAR NO VA DE VIRALIDAD (Iker, 2026-07-29)
> **Léelo antes de escribir uno y antes de juzgar el resultado de uno.** Los demás pilares buscan alcance. **Este busca cercanía y naturalidad con la audiencia**, y son cosas distintas. Medir una historia por el multiplicador es medirla con la regla de otro pilar y concluir siempre que va mal.
>
> **Las dos ÚNICAS condiciones bajo las que una historia personal sí viaja** (apuntes de expertos que pasó Iker):
> 1. **Que seas conocido o autoridad.** Si lo eres, a la gente le interesa hasta lo que desayunas. Si no lo eres, a nadie le importa tu anécdota por sí sola. **Nosotros todavía no lo somos**, así que no contamos con esta.
> 2. **Que le haya pasado a muchísima gente.** Identificación masiva: el lector se ve a sí mismo, lo comparte con un amigo, comenta su propia versión y se monta debate. **Esta es la única palanca que está en nuestra mano**, y por eso la historia se elige por cuánta gente ha vivido eso, no por cuánto nos marcó a nosotros.
>
> **Cómo se juzga un post de este pilar, entonces:** no por impresiones ni por ratio, sino por **calidad de conversación**. Comentarios en los que alguien cuenta SU caso · respuestas largas en vez de emojis sueltos · mensajes privados · guardados. Un 1x con quince comentarios personales ha cumplido su objetivo; un 3x con cero conversación, no.
>
> **Y no se mata el pilar por un mal ratio.** n=1 por cuenta. Se sigue probando **de vez en cuando, por variedad**, que es justo lo que pide la visión de futuro de aquí abajo (dejar de repetir los mismos 3 pilares en las mismas 3 cuentas). No es el caballo ganador y no tiene que serlo.
>
> **Registro del 29/07 (Iker, historia + peloteo):** apostado deliberadamente por la condición 2. El dolor elegido, *que te juzguen por ser joven*, lo ha vivido media audiencia, y el peloteo a 5 clientes reales aportaba la prueba que a nosotros nos falta por no ser conocidos todavía. **Es la mejor tirada posible con las cartas que tenemos.** Anota el resultado en `historial-publicaciones` mirando conversación, no solo el multiplicador.

Pilar NUEVO, distinto de **autoridad** ("mira qué importante soy": premios, eventos, "voy a X"). Esto es una **ANÉCDOTA real con una lección**. **No tenemos datos propios; la vara es de fuera** (como el lead magnet). Se valida con `--pilar historia` (+ `--cuenta Mario` para el ancla de marketing en vez de ventas).

**Referentes (de nuestra BD, `/api/ideas/inspiration`):** **Josh Braun** (39x *"My mom died yesterday"*, 29x *"When I was younger in sales, I'd get on a plane…"*), **Daniel Disney** (16 outliers: *"I hired the smartest person in the room once"*, *"I had a manager who would scream at the sales floor"*). **Se eligen por `hook_type` story/confesión + LIKES ≫ comentarios** (si comentarios > likes, es un lead magnet disfrazado de historia, no una historia).

1. **HOOK:** primera persona, una ESCENA/anécdota concreta (*"I [algo que me pasó]"*, *"Cuando…"*, *"Nunca…"*), vulnerable o intrigante. **NO alarma, NO claim, NO dato.** Corto.
1b. **⭐ LA LINEA 2 SITUA LA ESCENA: QUIEN Y DONDE (Iker, 2026-07-29).** El hook puede dejar el sujeto implicito, pero **la linea siguiente no**. Si el lector tiene que deducir quien habla justo cuando esta decidiendo si sigue leyendo, se le enfria la escena. En esa linea van **la persona y el sitio**: *"Me lo solto el cliente en mitad de la reunion"*.
   - **⛔ NO le pongas etiqueta, describe su PAPEL con la escena (Iker, 2026-07-29, me corrigio).** Yo escribi *"me lo solto el cliente"* y **contradecia el propio cuerpo**: si tres lineas despues dice que dudaba si pagarnos, entonces **no era cliente**, era una demo, una primera reunion para ver si compraba. Y las otras dos etiquetas tampoco valen: `lead` es jerga que un director de 55 anos no usa, y "posible cliente" alarga sin anadir nada.
   - **La solucion es no etiquetar:** *"me lo solto en la reunion en la que decidia si nos compraba o no"*. Situa el sitio, deja clarisimo que aun no habia comprado y el sujeto se entiende solo.
   - **Regla general:** antes de nombrar a alguien en una historia, **comprueba que la etiqueta cuadra con el momento del arco en el que esta**. Cliente, proveedor, socio o jefe describen un estado; si el post cuenta como se llego a ese estado, la etiqueta del final no vale para el principio.
   - **Y di donde pasa** (una reunion, una llamada, una comida). Sin sitio no hay escena, hay un resumen.

2. **CUERPO:** ritmo de historia — frases cortas, UNA por línea, MUCHO aire. Detalles sensoriales concretos (las botas amarillas, los calcetines: la concreción da credibilidad). Arco: escena → momento → desenlace. Luego un REFRAME/contraste (antes vs ahora). Y una **LECCIÓN corta y universal al final** (*"Moments do"*, *"It can't create a memory"*). La lección ata a tu tema (ventas/marketing) por la HISTORIA, no por el pitch.
3. **FOTO:** texto puro O una foto **REAL/candid** (un momento de verdad), NUNCA un gráfico diseñado (lo opuesto al lead magnet). Muchos de sus outliers son **text-only** (Josh Braun top).
4. **CTA:** NO comment-gate. Cierra en la lección; como mucho un PD/spam ninja suave a un recurso.
5. **Cuenta de Mario = ancla de MARKETING**, no de ventas (`aboutme §2`); el validador lo contempla con `--cuenta Mario`.

**⭐⭐ 4.6b · HISTORIA CON PELOTEO DENTRO (Iker, 2026-07-29).** El pilar sigue siendo **historia**, no se convierte en peloteo. Pero **a veces** (no siempre) la anecdota da pie a nombrar empresas, y entonces se pelotea DENTRO del relato:

- **Las empresas van con @ delante, siempre.** Si se nombra a un cliente y no se le menciona, se pierde el unico motivo por el que merece la pena nombrarlo.
- **Bloque con flechas `→`, como en los pilares de peloteo.** Nada de una linea con los nombres seguidos separados por comas.
- **Cada empresa lleva AL LADO una persona de esa empresa**, y **las DOS llevan arroba**: `→ @Empresa - @Nombre Apellido`. Mencionar la empresa sin mencionar a la persona desperdicia la mitad del peloteo, porque la notificacion que de verdad mueve es la que le llega a un humano. Y esa persona pasa el **filtro duro de actividad**: haber COMENTADO en un post de otro en **el ultimo mes** (`GET /api/v1/users/{provider_id}/comments`). Se verifica una a una, nunca se supone.
- **Maximo 5.** Con 6 o mas menciones el clasificador (`backend/src/services/pillar.ts`) lo reetiqueta como peloteo y deja de compararse contra su propio pilar.
- **El nombre va EXACTO, tal cual lo devuelve Unipile**, tanto el de la empresa como el de la persona: si su perfil pone `Sebastián Luengo, MBA`, va con el `, MBA`; si la pagina se llama `Arania S.A.` o `BETSAIDE SAL`, va asi aunque las mayusculas chirrien.
- **❌ NO HAY EXCEPCION: el nombre va ENTERO, por largo y raro que sea (Iker, 2026-07-29).** Yo propuse recortar `Fagor Automation | CNC & Feedback Systems | Automation Solutions` y `OJMAR - Intelligent Locking Systems` porque comen renglones, y **Iker lo tumbo**: *"aunque tenga rayas raras, me da igual, LinkedIn lo va a encontrar perfecto"*. Y tiene razon en lo que importa: **el nombre completo es lo que hace que el autocompletado acierte a la primera**, y una mencion mal elegida vale cero. Lo feo es cosmetico; fallar la mencion tira el peloteo entero. **Se pega entero y no se toca.** Que la linea ocupe dos renglones es aceptable: al publicarse, las menciones se renderizan como enlaces y se leen como tales.
- **⭐ SIEMPRE, DEBAJO DEL POST, UN BLOQUE DE ENLACES PULSABLES (Iker, 2026-07-29).** Cada vez que la entrega lleve menciones, va **fuera del bloque cercado** una tabla con **el enlace azul de cada perfil y de cada pagina**, empresas y personas, para que Iker abra y confirme de un vistazo que ha mencionado a quien tocaba. Una mencion mal elegida en el desplegable (hay homonimos y filiales: `OJMAR USA` vs `OJMAR`, `Fagor Automation North America` vs la de Arrasate) tira el peloteo y encima etiqueta a un tercero. El bloque es una **tabla markdown de CUATRO columnas**, en este orden: **nombre de la empresa | enlace de la empresa | nombre de la persona | enlace de la persona**. Ni dos columnas ni el nombre metido dentro del enlace: cuatro, separadas, para poder comparar nombre contra enlace sin abrir nada. **Las URLs salen de Unipile, no se construyen a mano:** persona → `https://www.linkedin.com/in/{public_identifier}`, empresa → `https://www.linkedin.com/company/{public_identifier}` (el `public_identifier` de la pagina lo da `GET /api/v1/linkedin/company/{id}`, y **no coincide con el nombre**: el de Telpark es `empark-aparcamientos-y-servicios-s-a`).
- **Los clientes que se nombran salen de una fuente nuestra verificable** (hoy, la seccion "Trabajamos hoy con" de `https://recursos.neety.com/agendar/`). Nunca de memoria.

**Aprendizaje del 2026-07-29, medido:** de las 5 empresas, la primera pasada de busqueda (10 perfiles por empresa) dejo a **Fagor Automation y OJMAR sin nadie activo**. Paginando a **40 perfiles por empresa** aparecieron el **CEO entrante de Fagor comentando hacia 3 dias** y una **directora de operaciones de Betsaide comentando ese mismo dia**. **Diez perfiles no bastan: pagina siempre.** Y aplica la regla de siempre: un mando intermedio activo bate a un director dormido (el director de unidad de negocio de OJMAR llevaba **384 dias** sin comentar).

**⭐ EL EMOJI DEL FINAL DEL HOOK: VARIEDAD, NO SIEMPRE LA MANO (Iker, 2026-07-29).** El `👇` se usa para empujar al "ver mas" y esta bien en la mayoria de pilares, **pero repetirlo en todos los posts canta**. En **historia** va un **emoji personal que encaje con el tono de la escena** (`😅` en el post del cliente que dudaba de nuestra edad: desactiva el reproche y suena a anecdota, no a queja). Y en todos los casos: **se pone el emoji y se QUITA el punto de la palabra anterior**, que con punto queda mal.

**⭐ Y como en TODOS los pilares, aplican las reglas GENERALES (no opcionales por ser pilar nuevo, Iker, 2026-07-24):** (a) **FORMATEADO**: intercala líneas sueltas + bloques de 2/3, con **ANÁFORA** en los bloques complementarios ("No es… / No es… / No es…", "Tu titular… / Tu foto… / Tus destacados…"), `§3.2` — NO todo en líneas sueltas monótonas aunque la vara (Josh Braun) vaya así: **calcamos su ritmo de historia y lo MEJORAMOS con nuestro formateado** (`§2.9` calcar-y-mejorar). (b) **`https://` delante de TODO enlace** (`§4.4b`). (c) Cero coma antes de "y"/"e", cero guion largo (`brand-voice §3`). (d) Verbo con techo, sin repetir verbo (`§2.9`). (e) El pase de criterio (`§8`). El validador `--pilar historia` comprueba las mecanizables; el resto es criterio.

> **📌 VISIÓN DE FUTURO (Iker, 2026-07-24; NO actuar aún, solo registrar):** el plan es **dejar de publicar los mismos 3 pilares en las mismas 3 cuentas cada semana**. La audiencia se está dando cuenta y el rendimiento baja porque **los 3 founders (Iker/Unai/Asier) comparten red** (misma empresa, todos del País Vasco): dos mapas la misma semana en dos cuentas se solapan. Descubrir y validar pilares nuevos (como este de historia) es parte de diversificar. Cada pilar nuevo, **siempre desde datos de outliers de otros primero** (texto entero: gancho+cuerpo, Y foto), hasta tener datos propios.

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

### ⭐ 8.0 · LA 4ª CUENTA OPCIONAL: MARIO (marketing) — Iker, 2026-07-22
Al planificar, además de las 3 de founder (Iker/Unai/Asier), considera **opcionalmente ~1 post/semana para Mario** (Growth & Marketing, ficha completa en `aboutme §2`). **NO entra en el cuadro latino 3×3** ni en la exclusividad de categoría de las 3 founder: es un **EXTRA**, unas semanas sí y otras no → **pregunta a Iker si esta semana toca Mario**. Reusa los mismos pilares que funcionan (mapa / meme / "Los 10") pero **anclados a MARKETING** (pelotea a gente y empresas de marketing, no industriales), con las **menciones obligatorias** (`@neety` + `@Unai` + `@Iker` + `@Asier`) y, si es post de resultados, **calcando el dashboard de analíticas de LinkedIn** (no un diseño). Su parte de comentarios/analíticas es **manual** (no está en Unipile). Y es buen sitio para **estrenar pilares nuevos de marketing**.

### 8.0 · ⭐ LEE EL PILAR ANTES DE SACAR CONCLUSIONES (Iker, 2026-07-27)
Cada post lleva ahora su **etiqueta de PILAR** en la herramienta (chapa de color arriba en la tarjeta, junto al multiplicador; la calcula `backend/src/services/pillar.ts`): `peloteo_mapa · peloteo_los10 · lead_magnet · meme · historia · otro`.

**Compara SIEMPRE dentro del mismo pilar.** Sin la etiqueta se sacaban conclusiones falsas: mirando la tabla en crudo parecía que *"los posts cortos van mal"*, cuando lo corto eran los **memes** (cortos por diseño, el motor es la imagen) y los **lead magnets** (que acaban en "comenta X"). De hecho **los dos mejores posts de la historia son cortos** (16,37x y 15,64x). La longitud no explica nada; el pilar sí.

**Y cada pilar se juzga con su propia vara:**
- **Peloteo (mapa / los 10):** el pilar de ALCANCE. Se le exige multiplicador alto (histórico 3-8x).
- **Meme:** alcance disparado y **reacciones de risa**, no me-gusta.
- **Lead magnet:** se juzga por **comentarios y leads, NUNCA por ratio de outlier**. Un lead magnet ronda 1x por naturaleza (los últimos: 28L/39C y 30L/34C, más comentarios que likes, que es exactamente el gate funcionando). Medirlo con la vara del mapa lleva a "arreglar" lo que no está roto.
- **Historia:** likes muy por encima de comentarios.

### 📉 8.0-RIESGO · UNA SEMANA NO PUEDE DEPENDER DE UN SOLO POST (medido el 2026-08-05)

**La semana del 27 al 31 de julio: 8 posts, 123.402 impresiones, y UNO SOLO aporta 93.744. El 76%.** Y 142 de los 225 clics. **Siete de los ocho quedaron por debajo de 1.0x**, o sea por debajo de la media de su propia cuenta.

**Eso no es una buena semana, es una semana frágil.** Si ese meme no sale, la semana entera son 29.658 impresiones repartidas entre siete posts. **El resultado dependió de un acierto, no del sistema.**

**Qué hacer con esto al planificar:**
- **Mirar la semana entera, no post a post.** Si al repasar el plan ves que solo hay una apuesta fuerte y seis de relleno, el plan está mal repartido aunque cada pieza cumpla su receta.
- **El pilar que más mediana da es el peloteo** (21.295 contra 2.925 de un post suelto), así que **una semana sin peloteo en ninguna cuenta es una semana que depende del azar del meme**.
- **Y avisar de la fragilidad en la propia planificación**, con el número: es más útil decir *"esta semana el 70% del alcance depende del martes"* que repasar siete posts uno a uno.

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
- **⛔ REGLA DURA (Iker, 2026-07-27) — UN SOLO MAPA Y UN SOLO "LOS 10" POR SEMANA, CONTANDO LAS TRES CUENTAS.** En una misma semana, **solo una cuenta** publica mapa y **solo otra cuenta** publica "Los 10". La tercera cuenta se queda **sin peloteo** esa semana (hasta que exista el tercer formato de peloteo, §8.1b). Esto ANULA lo que decía antes esta línea ("sí pueden coincidir dos cuentas en el mismo pilar la misma semana"), que era falso y nos costó caro.
  - **Por qué, con datos (medido 2026-07-27):** entre el 14 y el 23 de julio salieron **4 peloteos en 10 días** entre las tres cuentas, y el pilar se hundió: Iker pasó de **7,68x (563 likes) el 30-jun** a **2,69x (176)** y **1,23x (95)**; Unai de **2,92x (287)** a **0,71x (55)**. En junio, con la mitad de densidad, todos rendían 5-7x.
  - **No es el tamaño de la región,** que era la excusa fácil: **Navarra (660.000 habitantes) hizo 7,68x y Murcia (1,5 millones) hizo 1,23x**. La región pequeña ganó a la grande. Lo que cambió fue la **frecuencia**.
  - **La causa:** las tres cuentas son la misma empresa, comparten público objetivo y se comparten entre ellas. Aunque cada cuenta respete su espaciado individual, **el formato se quema a nivel COLECTIVO**. El espaciado por cuenta no basta.
  - Y como siempre: regiones distintas y personas distintas, y **nunca repetir el concepto**.

### 8.3 · Guardarraíles de espaciado (entre semanas) → vía el HISTORIAL
> **Todo se mide POR CUENTA.** Ninguna de estas reglas es global entre cuentas.
- **Mapa (dos guardarraíles, y hay que pasar los DOS):** (1) ≥2 semanas entre mapas de la MISMA cuenta, que sale solo con la alternancia de §8.2; y (2) **el tope COLECTIVO de §8.2: un solo mapa y un solo "Los 10" por semana entre las tres cuentas.** El segundo es el que de verdad protege el pilar, porque la audiencia es compartida. Nunca dos semanas seguidas de mapa en la misma cuenta. **No repetir región EN ESA CUENTA** (la cobertura por cuenta está en `docs/skills/historial-publicaciones.md`; entre cuentas sí se puede repetir región, pero nunca el concepto).
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
