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
- **Contexto** = de qué come. Aquí = **las 7 skills** (una skill es contexto en MD) + la idea semilla que le das. Sin contexto, trabaja a ciegas.
- **Goal** = objetivo que no se suelta. En posts **no hay métrica autónoma que perseguir** (la viralidad no se mide antes de publicar) → los posts caen en el lado "objetivo abierto/creativo = puntos de control", NO en "persigue una métrica". El "objetivo" real de un post es pasar el pase de validación y darte 2-3 variantes para elegir.
- **Loop** = una etapa critica su propio resultado y lo rehace hasta pasar el listón de calidad. **Aquí el "listón" ES el pase de validación** (`global-instructions §8` + `working-preferences §2`). Este es el encaje perfecto del marco: corre el Loop en silencio antes de entregar.

---

## 2 · ¿Workflow o un solo prompt? (no sobre-ingenierices)
- **UN post suelto → suele bastar UN prompt bien dado** (pilar + cuenta + idea + objetivo). Con las skills cargadas, el modelo ya devuelve 2-3 variantes buenas. Montar un multi-agente para un tuit es matar moscas a cañonazos de verdad.
- **Monta workflow cuando pasa de 2-3 pasos y ves la película:**
  - **Lote semanal** (p. ej. 3 posts para Iker/Unai/Asier respetando la exclusividad de formato por día) → workflow **paralelo** (una rama por cuenta) con una comprobación final de que no se repite pilar el mismo día.
  - **Un mapa o "Los 10"** → workflow **encadenado**, porque la verificación de cifras y el triage de menciones son pasos en serie que condicionan el cuerpo.
- **Regla previa del playbook (válida):** antes de montar, imagina "si lo hiciera yo a mano, ¿qué pasos daría?" = el esqueleto (que es justo la receta de §4). Y si algo no está claro, pídele a Claude que te **haga preguntas** para validar el sistema antes de lanzarlo.

---

## 3 · Los 2 patrones aplicados a posts
- **Encadenado (en serie):** un objetivo, camino secuencial, cada paso necesita el anterior. Ej. mapa: idea → **verificar cifras** → hook → cuerpo → imagen → validación. Es el patrón por defecto de un post individual con verificación.
- **Paralelizado (en abanico):** ramas independientes que corren a la vez y al final se juntan. Ej. lote semanal: rama Iker + rama Unai + rama Asier en paralelo → al final, un chequeo que junta y aplica la exclusividad de formato del día.
- Dentro de cada rama, los pasos van encadenados (la receta de §4).

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
4. **Hook:** 2-3 candidatos (`global-instructions §2`).
5. **Cuerpo:** `§3` + voz `brand-voice`.
6. **CTA:** regla del UNO (`§4.5`).
7. **Imagen:** skill `images` (o `video` si es vídeo).
8. **Tag de viralidad:** `outliers-database §4` (Neety) primero; §3 solo etiquetado.
9. **Loop = pase de validación en silencio** (`global-instructions §8`): autocrítica hasta pasar el listón.
10. **Entrega:** 2-3 variantes en bloques cercados (`working-preferences §1`); empresas/menciones rellenas y marcadas (§4.0); lista de "revisa estas"; y **di qué esperas del usuario** para el siguiente paso.

### 4.2 · Runbook MAPA REGIONAL (encadenado)
1. Elegir región: con identidad fuerte + notoriedad; **greenlit** (La Rioja, Asturias, Murcia, Aragón…), **baneadas** capitales obvias (Madrid 0.55x). Chequear ≥2 semanas desde el último mapa de esa cuenta y no repetir región.
2. **Concepto creativo de zona** original (nunca "región/tierra/pueblo"; ej. "el patio trasero de los Pirineos"). No repetir concepto usado antes.
3. **Cifras shock:** listarlas y **verificarlas** contra fuente real (ICEX, puerto, INE, Eurostat, IDESCAT/EUSTAT/IECA). Citar la fuente dentro del post. No seguir sin verificar.
4. **Empresas (§4.0):** rellenar 5 bloques de 4 (`→ Empresa - sector/dato`) con exportadoras reales de la zona, con fuente; marcar las dudosas. Nunca inventar.
5. **Menciones @ (§4.0):** solo decisores/mandos con actividad reciente comprobada.
6. **Hook:** fórmula `[concepto despectivo de zona] + [clichés] + "y poco más". Y exporta más que [país entero sorprendente] 👇` (`global-instructions §4.1`).
7. **Cuerpo:** saturar con 4-8 clichés locales tejidos; voz Neety; escalera y ritmo (`§3`).
8. **CTA:** link de agendar en spam ninja (NO el de pampam).
9. **Imagen:** foto del mapa de pampam con logos de empresas encima (`images §8`).
10. Validación (§8) → entregar 2-3 variantes + "revisa estas cifras/empresas".

### 4.3 · Runbook "LOS 10" (encadenado)
1. Chequear frecuencia/exclusividad como en mapa.
2. **Foco = LA PERSONA** (el comercial infravalorado), NUNCA crítica a las empresas.
3. **Hook** = verbo físico + herida propia del comercial para que se identifique ("quemando el teléfono", "aguantando el no"). Nada abstracto, nada de reproche.
4. **Los 10 nombres (§4.0):** personas reales con actividad reciente comprobada; marcar dudosas.
5. Cuerpo que pelotea a las personas y sus empresas (eje "le pongo cara al que estuvo detrás del salto").
6. **CTA:** link de agendar en spam ninja.
7. **Imagen:** orla de retratos (cabezas), cabecera fuerte en paleta Neety con palabra clave en naranja (`images §8`).
8. Validación → entregar + "revisa estos nombres".

### 4.4 · Runbook MEME (con motor)
1. **MOTOR CHECK primero:** ¿MOTOR A (cambio corporal progresivo que duele + legible a miniatura, sobre jerarquía de roles B2B) o MOTOR B (screenshot documental creíble con cifra/tensión)? Sin motor → no publicar, avisar.
2. **Filtro de 4 puntos** (`global-instructions §4.3`): ≥3/4 fuertes (jerarquía de roles · cambio corporal/screenshot · punchline citable · el lector ríe CON nosotros). Si 1-2 → parar y proponer cómo añadir motor.
3. **Texto CORTO** (3-6 líneas), nunca ensayo — el motor es la imagen.
4. **Imagen:** si hay **referencia**, calcarla (solo cambiar paleta + tipografía, `images §5-B`); si es desde cero, sistema meme (`images §6`).
5. CTA regla del UNO (o ninguno). Validación → entregar.

### 4.5 · Runbook LEAD MAGNET (comment-gated)
1. **Puerta de frecuencia:** ¿≥2 semanas desde el último de esta cuenta? ¿no solapa otra cuenta hoy? Si no → avisar de fatiga.
2. **Topic específico y auto-intrigante** + entregable ÚNICO y concreto (el genérico "toda mi biblia" está muerto).
3. **Entrega LIVE en comentarios** (audit/roast/consejo) > PDF, si da valor real al que comenta.
4. **CTA literal "Comenta [X] + [Y]"** (X = palabra atada al recurso; Y = esfuerzo mínimo: su sector, su CRM). Nada de formas implícitas.
5. **Imagen:** foto real del founder si aplica (registro 3, `images §3`).
6. Validación → entregar.

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
