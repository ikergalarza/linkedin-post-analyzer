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

## 4 · LA RECETA cronológica de un post (el esqueleto)
Pasos en orden. Es lo que el workflow (o el prompt) ejecuta por cada post:

1. **Input:** pilar (`mapa | Los 10 | meme | lead magnet`) · cuenta (Iker/Unai/Asier) · idea semilla · objetivo (`alcance | pipeline/agendar demo`).
2. **Test gana/pierde + elección de mecánica** (`global-instructions §0` y matriz §4.6). Chequeo de riesgo (`working-preferences §2-§3`): ¿región baneada? ¿fatiga de lead magnet (<2 sem)? ¿meme sin motor? ¿rompe la exclusividad de formato del día? → si hay riesgo, **avisar ANTES del borrador**, no después.
3. **[SOLO mapa / "Los 10"] Verificación previa (gate duro):** lista las cifras shock y verifícalas contra fuente real (ICEX, puerto, INE, Eurostat, IDESCAT/EUSTAT/IECA). Triage de menciones @ por actividad real en LinkedIn. **No pases al cuerpo sin verificar** — un dato mal tira el mapa de 6x a 0.5x.
4. **Hook:** 2-3 candidatos por `global-instructions §2` (bloque único ≤210 sin `\n\n`, imagen mental/herida/un pilar al máximo, ancla de sector, ≤1 número, verbo con techo en "desmontar").
5. **Cuerpo:** por `§3` (escalera, 4 unidades rítmicas, líneas cortas, cierre que respira, transición sin preámbulo en la línea 2) + voz `brand-voice`.
6. **CTA:** la regla del UNO (`§4.5`). En mapa / "Los 10", link de agendar en spam ninja (no el de pampam).
7. **Imagen:** skill `images` (registro correcto + paleta + palabra naranja + empresas vacías si es mapa). Si es vídeo → skill `video` (reemplaza las reglas de hook de texto).
8. **Tag de viralidad:** `outliers-database §4` (histórico Neety) primero; `§3` (cross-creator) solo etiquetado como tal.
9. **Loop = pase de validación en silencio** (`global-instructions §8`): el borrador se autocritica contra toda la stack y se rehace hasta pasar. Este es el "no me devuelvas la pelota" bien hecho.
10. **Entrega:** 2-3 variantes en bloques cercados (`working-preferences §1`), cada una con su tag y su "por qué" fuera del bloque; bloques de empresas vacíos; lista de cifras a verificar; y **di qué esperas del usuario para el siguiente paso** (rellenar empresas, elegir variante, generar imagen).

**Deltas por pilar** (sobre la receta general):
- **Mapa:** paso 3 obligatorio · concepto creativo original de zona (nunca repetir) · 4-8 clichés tejidos · empresas vacías 5×4 · imagen = mapa pampam con logos · ≥2 semanas entre mapas por cuenta · región greenlit (Madrid/capitales baneadas).
- **"Los 10":** foco en LA PERSONA (nunca crítica a las empresas) · hook con verbo físico + herida del comercial · imagen = orla de retratos · link agendar.
- **Meme:** MOTOR CHECK primero (A cambio corporal / B screenshot documental) · filtro de 4 puntos ≥3/4 · texto corto 3-6 líneas · calcar referencia si la hay.
- **Lead magnet:** puertas en orden (frecuencia ≥2 sem · topic específico auto-intrigante · entrega live > PDF · CTA literal "Comenta X + Y").

---

## 5 · Dónde el círculo SE PARA y te devuelve (gates humanos — aquí mandan las skills, no el "corre solo")
El playbook empuja autonomía total; para posts hay 4 paradas innegociables:
1. **Bloques de empresas** (mapa / "Los 10"): SIEMPRE vacíos, los rellenas y verificas tú. No inventar nombres.
2. **Cifras del mapa:** el workflow puede proponer y hasta buscar fuente, pero la confirmación final es tuya antes de publicar.
3. **Triage de menciones @:** por actividad real; descartar dormidos >3 meses.
4. **Elegir variante + avisos de riesgo:** el sistema entrega 2-3 y AVISA de riesgos; no auto-publica ni auto-elige. Y la imagen se genera aparte (pegando el párrafo en tu generador).

Todo lo demás (investigar, redactar, autocriticar) sí corre solo. El objetivo real: **de idea a borrador casi listo que solo repasas y completas**, no "de idea a post publicado sin ti".

---

## 6 · Formato de salida (override del playbook)
El playbook dice "output = acción ejecutada o HTML estudio". Para posts **no**: el output es el de `working-preferences §1` (un bloque cercado por variante, sin markdown dentro del post, "por qué" + tag + concepto de imagen fuera). El HTML briefing solo tendría sentido para un plan de contenido semanal, no para el post en sí.

---

## 7 · Cosas del playbook que SÍ adoptamos tal cual
- **Pensar "si lo hiciera a mano, ¿qué pasos?"** antes de montar (= la receta §4).
- **Que Claude te diga siempre qué espera de ti para el siguiente paso** (paso 10) → puedes llevar varios hilos a la vez sin recoger contexto de cero.
- **Dictar por audio** al montar/pedir: das más contexto que tecleando.
- **Encadenado vs paralelo** como las dos únicas formas de organizar el trabajo.
