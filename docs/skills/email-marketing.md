# SKILL: email-marketing — La newsletter de Neety (asuntos, cuerpos, remitentes y sistema de tandas)

> **name:** email-marketing
> **description:** Cómo se escribe, planifica y entrega la newsletter de Neety. Objetivo: convertir la lista templada (leads de LinkedIn, lead magnets, webinars) en demos/diagnósticos. Define el asunto (= el hook del email), el cuerpo (hereda el formateado de posts), los 4 remitentes rotativos y el sistema de tandas de 2 semanas.
> **when-to-use:** Cargar SIEMPRE que se escriba, edite o planifique un email de la newsletter de Neety, una secuencia de bienvenida o una campaña a la base de datos. Se apoya en `aboutme` (identidad e ICP), `brand-voice` (voz y anti-IA), `global-instructions §3` (formateado del cuerpo) y `working-preferences` (entrega y validación proactiva).

---

## 0 · Qué es esto y qué NO es

- **NO es cold email.** La lista es audiencia TEMPLADA: ya nos conocen (descargaron un lead magnet, comentaron un post, vinieron de un webinar o dejaron el correo). No se escribe como desconocido pidiendo reunión.
- **La escalera:** familiaridad → confianza → conversación → diagnóstico/demo. Cada email empuja UN peldaño, no los cuatro.
- **Objetivo primario de cada campaña:** que agenden demo/diagnóstico (https://recursos.neety.com/agendar/). **Secundario:** que RESPONDAN al email (la respuesta abre conversación Y mejora entregabilidad).
- **Nunca se vende la suscripción a Neety en el email.** Se vende el siguiente paso: el diagnóstico, la demo, la respuesta.
- La demo no se vende como "te enseñamos el software": se vende como **"revisamos dónde pierdes tiempo y oportunidades en tu proceso comercial"**. La palabra "diagnóstico" baja fricción; "demo" para leads calientes.

**Regla final (de los apuntes de expertos):** cada email cumple al menos UNA de estas funciones: enseñar algo útil · hacer consciente un problema · aumentar confianza en Neety · mostrar una oportunidad concreta · generar una respuesta · conseguir una demo. Si no cumple ninguna, no se envía.

---

## 🔴🔴 0b · NOS CANCELARON LA CUENTA AL TERCER ENVÍO (2026-08-11) — leer antes que nada

191 correos, **0 denuncias de spam**, 46% de aperturas, cuenta de pago y dominio autenticado. Cancelada igual, por supuesta violación de la política anti-spam. **Los números buenos no protegen si el perfil de la cuenta enciende las alarmas.**

### Las seis señales, que juntas dibujan a un spammer
1. **Cuenta nueva importando 1.310 contactos por API**, sin pasar por ningún formulario de la plataforma.
2. **Los contactos entraron con `opted_in_at: null` y `optin_ip: null`** porque la migración de CRM perdió las fechas de alta. Sus términos exigen consentimiento *"activo y consciente"*: sin timestamp ni IP no hay forma de enseñarlo, y ellos lo ven en cada registro.
3. **Volumen escalando: 54 → 137 → 337 en cuatro días.** Lo hicimos bien a propósito. ⚠️ **Pero escalonar y calentar para un envío masivo tienen la misma silueta desde fuera.**
4. **3,65% de bajas** en el segundo envío (norma: 0,2-0,5%). Esperable en un re-permiso, pero el umbral no distingue intenciones.
5. 🔴 **Una baja marcó como motivo "Nunca me registré en esta lista de correo"**, a las 03:41; la cancelación llegó esa mañana. **El motivo de cada baja lo guardan ellos y NO aparece en el panel de métricas**, así que no lo ves venir.
6. 🔴🔴 **El propio texto del correo admitía que no había opt-in.** *"Me toca ordenar los correos que nos dejaron el año pasado / y no hay manera / cuál de todas, ni idea."* Cuando contestaron, el motivo fue literalmente *"su contenido no está permitido"*: **habían leído el correo.**

### ⛔ LA REGLA QUE SALE DE AQUÍ Y MANDA SOBRE CUALQUIER IDEA CREATIVA
**Nunca se escribe en un correo que no sabemos de dónde salió el contacto.** Aunque sea verdad, aunque sea la gracia del correo y aunque funcione con el lector (funcionó: 46% de aperturas y una reunión el mismo día). **El texto lo lee también un revisor de cumplimiento**, y para él es una confesión firmada.

Un re-permiso se escribe igual de bien sin admitir nada:

| ⛔ Nunca | ✅ Así |
|---|---|
| "No sé de qué te conozco" | "Queremos mandarte solo lo que te interese" |
| "Ordenando los correos del año pasado" | "Estamos reorganizando la newsletter" |
| "¿De qué nos conocemos?" | "¿Qué tema te interesa más?" |

Misma segmentación, misma respuesta del lector, cero munición.

### Qué se hace distinto la próxima vez, en orden
1. **Importar SOLO a quien tenga el tick de consentimiento**, aunque sean 50 de 1.000. Nosotros teníamos el dato en el formulario y no lo usamos como filtro. Solo eso lo habría evitado.
2. **Lista de supresión con los clientes dentro, antes de importar** (ver §9c).
3. **Verificar la lista** (~10 $/1.000) antes del primer envío, no después.
4. **No escribir que no sabemos el origen** (arriba).
5. **Empezar por 20-30, no por 54**, y subir más despacio.
6. **Presentarse a soporte ANTES del primer envío grande**, explicando el origen de la lista. Una cuenta nueva con lista importada es sospechosa por defecto; presentarte tú primero cambia quién lleva la iniciativa.

### Lo que dicen sus términos, leídos el 2026-08-11
- ✅ **Repetir la misma campaña NO está prohibido.** No aparece por ninguna parte.
- ⛔ *"Tus listas deben ser suscripciones basadas en permiso"* (§2.1.2) y *"los destinatarios deben dar su consentimiento activamente mediante un acto consciente; no se permiten casillas premarcadas"* (§7.3). **Ahí es donde nos cogieron.**
- ⛔ §9.1 (contenido prohibido: adulto, MLM, apuestas, adelgazamiento, odio, estafas) **no describe nuestro correo**. Es el único frente donde son atacables.
- ⚠️ §16.2: *"podemos cancelar en cualquier momento, con o sin causa"*. **Apelar sale barato pero las probabilidades son bajas: monta el plan B en paralelo desde el minuto uno.**

**Léete los términos del proveedor ANTES de importar. Nosotros los leímos después de que nos cancelaran.**

---

## 🔵 0c · MIGRACIÓN A BREVO — el runbook (decidido el 2026-08-18)

Tras la cancelación de MailerLite (`§0b`), migramos a Brevo. Esto no es "montar la herramienta otra vez": es aplicar cada lección del post-mortem ANTES del primer envío, no después.

### Lo que se le pide a Iker, y por qué es él y no Mario quien lo decide

1. **🔴 Subdominio de envío, no `neety.com` directo.** Recomendado: algo tipo `mail.neety.com` o `news.neety.com`. Aísla la reputación del envío masivo de la del dominio principal (correo comercial normal, prospección). Era un pendiente ya antes del baneo (ver `§10`) y ahora deja de ser opcional: es la corrección estructural más grande disponible. **Es lo más urgente de pedir**, porque requiere DNS y la propagación + verificación de Brevo puede tardar 24-48 h. Hay que saber YA quién tiene acceso al DNS de neety.com (¿Iker directo, o agencia/hosting?) para meter los registros el mismo día.
2. **Plan de pago activo desde el minuto uno**, con volumen de sobra para ~1.300 contactos. Una cuenta nueva en plan gratuito/trial con lista importada es exactamente el patrón que MailerLite marcó como sospechoso.
3. **La API key la genera Iker y se entrega como variable de entorno, nunca pegada en el chat ni commiteada** (regla de la casa, `CLAUDE.md`).
4. **Exportar del CRM la lista de clientes y de prospectos con conversación abierta — YA, en paralelo, sin esperar a tener Brevo montado.** Es la lista de supresión que faltó la vez pasada y la razón de que se le mandara el correo 0 a Fagor Automation.
5. **Decisión de a quién se importa primero, y es una decisión de riesgo, no operativa.** Recomendación: solo los contactos con el tick de consentimiento verificado (~50 de 1.310, los de LinkedIn) entran en la primera importación. El resto se queda fuera hasta decidir cómo se re-permisiona sin repetir el correo 0 literal.
6. **Quién procesa las respuestas a escala.** El reenvío de `hola@` a `mario@` + `iker@` funcionaba a 190 correos; no funciona a 1.000+. Se decide ahora, no cuando ya duela.

### El orden de migración

1. **Dominio primero.** Se lanza la autenticación del subdominio y se deja corriendo en paralelo a todo lo demás.
2. **Lista de supresión antes que la lista de contactos.** Se construye con: clientes actuales (CRM) + las 5 bajas y los 7 rebotes de MailerLite (`Escritorio/rescate-mailerlite-2026-08-11.md`) + prospectos con conversación abierta. Se importa ESTA primero.
3. **Importar solo el segmento con consentimiento verificado.** No la base entera.
4. **Reescribir el correo 0** sin admitir en el texto que no sabemos el origen del contacto (regla de `§0b`).
5. **Rediseñar el CTA de respuesta.** 0 de 191 contestaron la vez pasada; no se repite el mismo mecanismo sin cambiarlo.
6. **Escribirle a soporte de Brevo ANTES del primer envío real**, presentando la cuenta, el origen de la lista y el volumen esperado. Presentarse uno mismo cambia quién lleva la iniciativa frente a que te marquen primero.
7. **Empezar pequeño: 20-30 contactos**, no 54. Verificar entrega, aperturas y que las respuestas llegan de verdad al buzón que se lee.
8. **Escalar con las mismas reglas ya validadas** (`§9c`): 24 h entre tandas si el salto es ≤2x, 48 h si es mayor. Nunca la última tanda en viernes.
9. **Todo se registra en `historial-newsletter.md`** al mismo ritmo que antes.

---

## 1 · Los 4 remitentes (rotación semanal)

**Un email siempre lo firma una PERSONA, nunca "Neety".** Que te hable alguien genera más confianza que que te hable una empresa (validado por los apuntes de expertos, por Carmen/Runner Pro — "cartas del fundador" — y por Timepack, que firma persona).

| Remitente | Ángulo | Registro (escala de `brand-voice §1b`) |
|---|---|---|
| **Iker** (cofounder) | Comercial / ventas: prospección, señales, el día a día de vender | El más cercano de los 3 founders, se permite el guiño |
| **Asier** (cofounder) | Técnico / cómo está construido por dentro (pero SIEMPRE aterrizado en ventas, no en ingeniería — `aboutme §2` nota de Asier) | Punto medio |
| **Unai** (CEO) | Visión / mercado / hacia dónde va la venta B2B | El más sobrio. Afirma, no exclama |
| **Kaixito** (la mascota) 🦉 | Novedades de producto y del programa, entre bastidores, lo que hemos roto esta semana | **El más informal y gracioso de los 4.** Humor blanco, autodespectivo de mascota, cero corporativo. Es el único que puede ser abiertamente juguetón |

- **La sobriedad vive en el CUERPO, no en el asunto** (misma regla que el gancho de posts, `brand-voice §1b`): un asunto ganador vale para cualquier remitente; lo que cambia con el remitente es el tono del cuerpo.
- **Cada semana cambia el remitente** (rotación), y el tema va atado al ángulo del remitente: no le pongas a Asier un email de cierre comercial ni a Iker uno de arquitectura.
- **Kaixito no CIERRA, pero SÍ siembra (decidido el 2026-07-27, tras mirar Duolingo y Alan).** Sus emails son de relación y producto (novedades, historias internas, encuestas "respóndeme"), y su CTA natural es la **derivación en personaje**: *"yo no vendo, que para eso está Iker: responde DEMO y te lo enseña él."* El CTA fuerte de demo lo firma siempre un founder: cerrar una demo B2B pide una autoridad que una mascota no tiene, pero prohibirle vender del todo era tirar su capacidad de convicción (abre puertas y pasa el testigo).
- **Kaixito tiene que EXISTIR antes de remitir:** presentación (quién es y por qué te escribe: el correo 0 la integra en su línea 1, ver §5c-0), avatar consistente y **humor blanco de adulto, nunca infantil** (la misma línea del registro de Unai en `images §0g`).
- **Personalidad de Kaixito (definida el 2026-07-27):** el aprendiz con el playbook. Siempre lleva su libro verde (su atributo fijo, como la lupa de un detective): se estudia las jugadas de ventas y los datos, y por eso "sabe cosas". Curioso, entusiasta, un punto caótico y despistado, honesto sin filtro (dice las verdades del sector que los founders no dirían). Registro: informal-gracioso, un punto por encima de Iker en cercanía, humor de oficina y de ventas, JAMÁS de guardería. **Movimiento** (para GIFs e ilustraciones): cuerpo blando con squash & stretch, brazos de fideo expresivos, parpadeo, y el libro como prop de los gags; emociones de cómic exageradas (biblioteca de gags en §3b). La evidencia de que mascota y compra seria conviven: **Alan** (salud/seguros para empresas, ~41.000 empresas según su web) tiene su marmota por toda la web; **Duolingo** manda emails firmados por personajes a usuarios de pago de todas las edades. En herramientas de prospección B2B no lo hace nadie: es HUECO, no ridículo, mientras el humor sea de sector y no de guardería. Ojo: los personajes de Duolingo funcionan porque su universo ya existe en la app; Kaixito necesita su presentación (y idealmente asomar antes en LinkedIn/web).
- **Se mide, no se discute:** en las primeras 2-3 tandas, opens/respuestas/bajas de Kaixito contra los founders, por segmento. Si abre más, gana papel; si el segmento industrial senior responde mal, se le acota la lista (p. ej. solo clientes, como los VIP de Runner Pro).
- Firma humana al final: nombre + rol real ("Iker, cofundador de Neety"). Kaixito firma como "Kaixito, la mascota de Neety".

---

## 2 · El ASUNTO (es el hook del email: corto, punchy, curiosidad)

El asunto es al email lo que el gancho es al post: si no abre, no existe el cuerpo. Mismas leyes psicológicas del hook (`global-instructions §1-2`), adaptadas al inbox:

- **Corto y punchy: 6-9 palabras es la zona ganadora.** Medido en los 353 asuntos de Timepack (2026-07-27): mediana 8 palabras / 43 caracteres, el 44% cae en 7-9 palabras, p90 62 chars. El grueso vive en 26-55 caracteres: **cabe entero en móvil**. Techo del validador: 62.
- **Máximo 1 número** en el asunto (misma regla que el hook: `global §2.5`). En el corpus solo el 10% lleva número. Un porcentaje suelto de gancho suena a fake.
- **Curiosity gap que NO se cierra:** el asunto promete la historia, jamás la lección. Cero exclamaciones (0 de 353 en el corpus), como mucho UNA palabra en mayúsculas como golpe (7% del corpus: "REGALO", "DE VERDAD"), emojis prácticamente nunca (1 de 353).
- **Nunca:** el asunto entero en mayúsculas, palabras spam (GRATIS, OFERTA, ÚLTIMA OPORTUNIDAD), asuntos genéricos ("Newsletter de julio"), promesas exageradas, punto final (1 de 353 lo lleva).
- **Sin "hola" ni saludos** — tampoco en la primera línea del cuerpo (Carmen: salirse de la norma del email corporativo es parte del efecto).
- El asunto de un email de la newsletter NO necesita ancla de ventas explícita como el hook de LinkedIn (el lector ya sabe quiénes somos: está suscrito), pero sí tiene que tocar un problema o curiosidad real del que vende.

**⭐ ORTOGRAFÍA SÍ, REGISTRO NO — la regla para desviarse del corpus (2026-08-06).** Medido sobre 565 asuntos españoles: **el 97% de los que llevan interrogación ponen la `¿` de apertura** (43 de 44) y **solo 1 de 565 empieza en minúscula**. Las dos cosas son desviaciones, pero no son iguales:
- **La `¿` SE PONE.** Quitarla es una falta de ortografía, la nota un lector de 55 años y no se gana nada. **En lo correcto no nos desviamos.**
- **Las minúsculas SE MANTIENEN** aunque sean el 0% del corpus. Es una decisión de registro, no un error, y ahí la desviación es el objetivo: en una bandeja de Asuntos Con Mayúscula, el nuestro parece escrito por una persona.
- **La regla general:** desviarse del corpus en **estilo** es diferenciarse; desviarse en **corrección** es parecer descuidado.

**⭐ A/B DE ASUNTO (verificado en nuestra cuenta el 2026-08-06):** MailerLite permite testar **solo el asunto** manteniendo el mismo cuerpo (`type: "ab"`, `test_type: "subject"`). ⚠️ El conector MCP **no** puede configurarlo entero: solo admite un campo de asunto, así que la variante B se mete en el panel.
- **⛔ Y ojo con qué se mide.** El A/B declara ganador por APERTURAS. Si el correo tiene otra métrica (respuestas, en el correo 0), **el ganador se decide por esa métrica, no por la que declare la herramienta.** Un asunto agresivo puede abrir más y hacer responder menos.
- **No se hace A/B en las tandas de calentamiento.** Con 25-50 por variante no mide nada. El A/B va en la tanda grande, cuando ya hay volumen.
- **Sesgo de negatividad (Mario, 2026-08-06):** un asunto en negativo ("¿no te acuerdas de mí?") suele abrir más que su versión neutra, y es un efecto real y documentado. El riesgo no está en la apertura sino en que un reproche baje la respuesta. **Es exactamente el tipo de cosa que hay que testar en vez de decidir a ojo.**

**Preview text: SIEMPRE manual, nunca el automático.** Completa el asunto o estira el gap; no lo repitas. Es la segunda línea del "hook" del inbox.

**Taxonomía de asuntos del corpus (353 clasificados, % aprox.) — rota entre tipos, no te cases con uno:**

| Tipo | % | Ejemplo literal de Timepack |
|---|---|---|
| Historia/personaje con gancho raro | ~30% | "El emprendedor de 89 años" · "El sistema de prospección de Catalina la Grande" |
| How-to / beneficio directo | ~22% | "La frase mágica para no dar descuentos" |
| Curiosidad pura / bucle ciego | ~14% | "No leas el correo de hoy" · "Esto no lo vi venir" |
| Error / contraste / negativo | ~10% | "El error que arruina el 90% de los lead magnets" |
| Confesión / vulnerabilidad | ~8% | "Me da una vergüenza tremenda contarte esto" |
| Absurdo / humor puro | ~7% | "Enemas alucinógenos" (2 palabras) |
| Pregunta | ~6% | "¿Perdí una venta o gané una venta?" |
| Urgencia / lanzamiento | ~4% | "CIERRA EN 12 HORAS y la conversión ya no será tan fácil" |
| Series (bucle entre días) | ~4% | "El misterioso caso de la venta perdida - primera parte" |

**El mecanismo maestro: el choque de dos mundos** — cosa rara + tu negocio en el mismo asunto ("Un satélite de Neptuno te ayuda a vender más", "La Guerra Fría, el LSD y una marca con autoridad"). La plantilla "X, Y y tu negocio" es recurrente. Segundo truco: **los paréntesis como segundo golpe** ("Haz esto y factura medio millón al año (no es clickbait)", "(audio dentro)").

---

## 3 · El CUERPO (hereda el formateado de posts)

**El cuerpo de un email se formatea COMO el cuerpo de un post** (`global-instructions §3` + `brand-voice §3`), con los matices del medio:

- **⭐ EN EMAIL LA LÍNEA INDIVIDUAL ES LA NORMA, NO LA EXCEPCIÓN (medido el 2026-08-03 en los 4 corpus).** Porcentaje de bloques de UNA sola línea: **Isra Bravo 99% · Timepack 97% · Hugo López 92% · Sales Hackers 68%** (este último, el B2B con HTML pesado, es el único con bloques de 2 reales, un 21%). **Mediana de 7-9 palabras por línea en los cuatro.**
  - **⭐ PRIORIDAD DE RITMO EN EMAIL (Mario, 2026-08-03): 1º líneas individuales · 2º bloques de DOS · 3º bloques de TRES.** La línea suelta es la base (el dato del corpus), pero los bloques no se prohíben: dan variedad y son nuestra firma de marca. Cuando haga falta un bloque, **antes de dos que de tres**. El resto de reglas de LinkedIn siguen vigentes: **nunca un bloque de 4** (ni siquiera enumeraciones de prosa con anáfora), nunca un bloque de 2 pegado a uno de 3, y siempre una línea individual entre bloques.
  - **Excepción del tope de 3: solo listas con MARCADOR** (`→`, guion, viñeta, numeradas), que son el bloque de empresas de los mapas. Una enumeración de prosa aunque tenga anáfora NO está exenta.
  - **⛔ Y NO PARTAS UN BLOQUE DE 3 QUE YA ESTÁ BIEN (Iker, 2026-08-06).** Tres líneas con anáfora completa son un bloque de 3 legítimo: metí un blanco entre la segunda y la tercera "por si acaso" y lo rompí sin motivo. **El tope es 4, no 3.**
  - **Al montar el bloque, comprueba la ESCALERA antes de entregar.** Las mismas tres líneas iban en zigzag (37 → 30 → 47 caracteres). Se arregló **solo permutando** (30 → 37 → 47), sin tocar una palabra: siempre prueba a reordenar antes de reescribir (`global §3.2`).
  - **El porqué, en palabras de Iker (2026-08-06):** *"aunque la competencia no lo haga, los bloques de dos y de tres generan mucha mejor retención y el correo se lee más natural; si todo son líneas individuales el lector se agobia"*. **Su experiencia de meses en LinkedIn gana al corpus** en esto: el corpus dice qué hace el sector, no qué funciona mejor para nosotros.
  - **El error típico no es usar demasiadas líneas sueltas, es que las líneas sean largas.** Si una línea pasa de ~12 palabras, pártela. Diana: 7-9.
- **Párrafos de 1-3 líneas, NUNCA 4-5.** Frases cortas. Líneas que respiran.
- **Una sola idea fuerte por email.** Cinco ideas = cero ideas.
- **Legible en ~1 minuto** en móvil. Si pasa de eso, corta lo que no sirva a la idea.
- **Solo texto.** Sin imágenes, sin banners, sin botones de diseño (Carmen y Timepack coinciden; además mejora entregabilidad). El email tiene que parecer escrito a mano por una persona.
- **Anti-IA no negociable** (`brand-voice §3`): NUNCA guion largo `—`, NUNCA coma antes de "y" (registro corto hablado, igual que el post), tabla de AI-tells entera, test de leer en voz alta.
- **Cifras en dígito** (`global §3.6`) y **fuente con NOMBRE y sin año** (`global §3.5b`). El año va en la entrega interna.
- **1 enlace principal como máximo** cuando el objetivo es demo. Dos enlaces compitiendo se matan entre sí. (Los emails de Kaixito pueden no llevar ninguno.)

**Esqueleto por defecto (de los apuntes + Carmen + Timepack):**
1. **Primera línea que recompensa la apertura** — sin saludo, sin presentación, sin windup. Corta (mediana Timepack: 10 palabras) y **NUNCA resuelve el gap del asunto: lo estira** (a veces arranca aparentemente lejos: "Hablemos de lechuga" para un correo de financiación). Misma regla que la línea 2 del post (`global §2.6`): nunca "Somos Neety…", nunca credenciales. Modos que funcionan: in medias res narrativo ("El proveedor entró en la sala."), afirmación chocante en 1ª persona, continuidad con el email anterior.
2. **Historia o problema concreto** (el dolor de UNO, no la lista de todos los dolores). En Timepack el 55-60% de los correos SON una historia y ocupa el 60-70% del cuerpo.
3. **El giro / insight** — la lección aplicable aunque no compren.
4. **Puente natural a Neety: la frase-bisagra**, seca, de una línea. Literales del corpus: *"A esto en ventas se le llama prospección."* (tras contar cómo Potemkin filtraba amantes a Catalina la Grande) · *"Esto en ventas se conoce como cualificación."* · *"Esta historia va de ti, nakama."*. El truco fino: **sembrar mini-analogías de negocio DENTRO de la historia** ("Como si tu departamento cerrara muchas ventas.") para que la transición final no chirríe.
5. **CTA** (ver §4).
6. **P.S.** (ver §4b).
7. **Firma humana.** (Timepack cierra con un ritual propio: "Que el tiempo te acompañe." en el 54% — vale la pena tener una firma-mantra de la casa, distinta por remitente o común, pero NO copiar la suya. **[PENDIENTE · decisión de marca]: mientras no se elija, firma plana** — "Iker, cofundador de Neety" / "Kaixito, la mascota de Neety".)

**El lector ventrílocuo (robar sí o sí):** en ≥34% de los correos, Timepack escribe el diálogo del lector interrumpiéndole (*"¿En domingo, Timepacker?"*, *"Al turrón..."*). Airea las objeciones antes de que existan y simula conversación en un canal unidireccional. En Neety: *"¿Otro robot que manda spam?"* y responderlo. Es la versión email del echo marketing de §5.

**Bucles entre correos (el meta-truco):** en el corpus, el 18% referencia el email de ayer y el 19% anuncia el de mañana. La newsletter no son N piezas: es UNA conversación por entregas. Series de 2-3 emails con cliffhanger para los casos gordos.

---

## 3b · Animación en el email: el sistema Duolingo (medido en 13 correos reales, 2026-07-27)

- **Formato: GIF animado, SIEMPRE.** El email no ejecuta JavaScript: Lottie/JSON es imposible en correo. Duolingo usa un único GIF de cabecera (492 KB, CDN CloudFront) reutilizado en 10 de 13 correos; los demás llevan PNG estático.
- **Specs del GIF de Kaixito (MEDIDAS REALES del GIF de Duolingo, 2026-07-30 — corrigen la estimación anterior de "600 px y 8-12 fps", que era de memoria):** el suyo es **450×450 px · 492 KB · 100 fotogramas · 30 ms por fotograma (~33 fps) · 3,0 s · RGBA con fondo transparente**. Nuestro estándar: **512×512, ≤500 KB, loop perfecto de ~3 s, fondo transparente**, y el **primer frame legible por sí solo** (Outlook clásico solo enseña el frame 1). Alt text siempre. El primer GIF de Kaixito (estresado) salió en 512×512 y 352 KB: dentro de spec y más ligero que el de Duolingo.
- **⛔ Los elementos de gag van SIEMPRE en la misma línea negra que los brazos** (bombilla, destellos, vapor, garabatos, gotas). Nada de colores fuera de paleta, y nada de blanco: sobre fondo transparente el blanco desaparece.
- **⭐ EL BRAZO DERECHO CON EL LIBRO: la fórmula que funciona (Mario, 2026-07-30, tras horas de intentos).** Es el punto que más se atasca en cada animación, así que va **copiado literal en todo prompt de animación de Kaixito**:
  - **"Forma de U"** es la descripción que por fin le hizo entender la curva. Fallaron: "arco cerrado", "curva con panza", "letra ce tumbada", "más curvo".
  - **La capa, tramo por tramo:** el tramo largo del brazo pasa **por detrás** del libro y se **corta justo donde entra en contacto con él**; el tramo final que toca la bola va **por delante**; la bola de la mano, **por delante**.
  - **Avisar del efecto secundario en la misma frase.** Al pedir que el tramo final vaya por delante, el generador subía el extremo izquierdo por encima del libro. La frase que lo evitó: *"que esto no haga que la línea de la parte izquierda, en vez de cortarse justo cuando entra en contacto con el libro, ahora salga más arriba"*. **Pedir un cambio y blindar a la vez lo que no debe moverse es lo que cerró el problema.**
  - **Lección general:** describir la **forma con una letra** (U) y **nombrar el efecto secundario que no quieres** vale más que diez adjetivos de curvatura.
- **⛔ LOS DOS LÍMITES DEL PERSONAJE (auditado el 2026-07-30, antes de encargar la biblioteca):**
  1. **Kaixito NO TIENE BOCA.** El asset son dos ojos y nada más. Nada de bostezos, sonrisas ni gritos: **toda emoción se expresa con ojos + cuerpo + elementos dibujados alrededor**. Si un guion pide boca, el guion está mal. (Para sonreír: los ojos se curvan en dos arcos hacia arriba.)
  2. **Solo existe el libro ABIERTO.** No hay pieza de libro cerrado, así que nada de "cierra el libro".
- **⛔ EL LIBRO NUNCA SALE DE LA MANO DERECHA.** Ni se aparta, ni se cae, ni se cierra, ni cambia de forma. Cualquier coreografía que separe el libro de la mano reabre el problema del brazo (arriba) que costó horas. Si la emoción parece pedirlo, se resuelve inclinando el libro sin soltarlo.
- **⭐ POSICIÓN — medido bien el 2026-08-06, y corrige la estimación anterior.** En Duolingo el GIF es **la imagen nº 2 de 14-16 en los 10 correos**, justo después del logo: va **de cabecera, antes del mensaje**. (La medida vieja, "~23% del HTML", era mala: contaba caracteres de HTML crudo, cabeceras y estilos incluidos.)
  - **⛔ PERO NO SE CALCA LA POSICIÓN, porque la FUNCIÓN es distinta.** Duolingo usa **el MISMO fichero en los 10 correos** (`revamp-march-2021-feature-header.gif`, `alt="Duo waving hello"`): es un **adorno de cabecera reutilizable**. Los nuestros son **5 GIFs distintos que ilustran un momento del texto**: son **narrativos**.
  - **Regla nuestra:** el GIF va **donde el texto lo monta** — después de la línea que planta la situación y antes del remate. En el correo 0: tras *"llevo toda la semana con el libro abierto buscándote"* y antes de *"y no hay manera"*. Colocarlo de cabecera, sin setup, quema el gag.
  - **Cuándo SÍ va de cabecera:** si algún día se usa un GIF genérico de marca, repetido en todos los correos (saludo de Kaixito), entonces sí va arriba como Duolingo. La posición la decide si el GIF es **decorativo** (arriba) o **narrativo** (donde lo pide el texto).
  - **UNA animación por correo, nunca más.**
- **Lo que NO se copia de Duolingo:** su correo es 100% imágenes (14 PNGs) porque llevan años de reputación de dominio. El nuestro sigue siendo texto dominante + un solo GIF, sobre todo con el dominio frío.
- **Dato que corrige una creencia:** Duolingo NO rota remitentes (los 13 correos salen de "Duolingo <hello@duolingo.com>"); el personaje vive en asunto y cuerpo. Nuestra rotación de remitentes-persona es un diferencial propio, no un calco.
- **Biblioteca de gags de Kaixito** (recursos de cómic que funcionan en flat y a miniatura): garabatos/squiggles de estrés sobre la cabeza, gotas de sudor, signos de interrogación flotando, bombilla, hojear el libro frenético, mirar a cámara con el libro del revés, esconderse tras el libro, apuntar algo y que se le caiga el boli.
- **⭐ BIBLIOTECA DE KAIXITO YA ALOJADA EN MAILERLITE (2026-08-06).** Los 5 GIF están subidos al File manager de la cuenta y tienen URL pública permanente. **Verificadas ese día: las 5 responden 200, `image/gif`, 552×552, 40-43 fotogramas, 270-325 KB.** Para cualquier correo futuro, se pega la URL que toque en el `<img>` vía API: **ya no hay que subir nada ni pedirle nada a Mario.**

| Emoción | Cuándo se usa | URL |
|---|---|---|
| **Estresado** | El dolor del lector, agobio, no encontrar algo | `https://storage.mlcdn.com/account_image/2536617/u5KyfiIVYeloMbzrChkyrlnfYU4nlMomwt9UdFcV.gif` |
| **Curiosidad** (con gafas) | El correo educativo, un dato, un descubrimiento | `https://storage.mlcdn.com/account_image/2536617/PtnS2Gy6E1ft7zPmY203lZVkPElj4xdVSyL6wgNo.gif` |
| **Alegría** | Casos de éxito, novedades, buenas noticias | `https://storage.mlcdn.com/account_image/2536617/8ti5HV7Qfls0vOjDrwAsWO45AUBex4FvVl1l98YI.gif` |
| **Aburrimiento** | El trabajo manual repetitivo (tema central nuestro) | `https://storage.mlcdn.com/account_image/2536617/Z2e7Wqk1asSbn5y1vSuKTRDzr5xT03Srx2rDSqDZ.gif` |
| **Enfado** | Romper una creencia, señalar lo que el sector hace mal | `https://storage.mlcdn.com/account_image/2536617/Tp7w4o46iHpb3o1AuKiuKAdzQzJKMzykkz1AtgJO.gif` |

  - **La elección de emoción la decide Claude** según el pilar del correo, sin preguntar. Una sola por correo.
  - **Snippet estándar** (280 px, centrado, con alt porque muchos clientes bloquean imágenes):
    `<p style="margin:0 0 24px;text-align:center;"><img src="URL" alt="..." width="280" height="280" style="display:block;margin:0 auto;width:280px;max-width:70%;height:auto;border:0;outline:none;text-decoration:none;"></p>`
  - ⚠️ **Antes de meter una URL nueva en una campaña, comprobar que responde 200 y `image/gif`.** Un `src` roto se envía sin que nadie lo note.
- **⚠️ EL SANITIZADOR DE MAILERLITE DUPLICA LAS ETIQUETAS DE FUSIÓN (2026-08-06).** Si al `update_campaign` le mandas un documento completo (`<!DOCTYPE>`, `<html>`, `<head>`, `<style>`), la plataforma lo envuelve en SU esqueleto y acaba con **dos `{$body_bottom}`**, que es donde inyecta el pie legal y el enlace de baja: saldrían duplicados. **Se manda SOLO el fragmento interior** (divs y tablas), sin html, sin head, sin style y sin etiquetas de fusión. Comprobar después que `{$head_top}`, `{$body_top}` y `{$body_bottom}` salen una sola vez.
- **🔴🔴 `update_campaign` POR API RESETEA LOS AJUSTES DEL PANEL (2026-08-06, comprobado en vivo).** Al actualizar el HTML de una campaña por API, MailerLite **revierte** el idioma a inglés, el texto plano a la plantilla en inglés y **los destinatarios a "todos los suscriptores"**. Pasó con la campaña `Kaixito 01`: estaba en español, con texto plano traducido y apuntada a 53 personas, y tras un cambio de estilo volvió a inglés y a 1.333 destinatarios.
  - **REGLA: en cuanto una campaña esté configurada en el panel, NO se toca más por API.** Los retoques de HTML se hacen en el editor de código del panel.
  - Si hay que tocarla por API igualmente, **después hay que volver a poner a mano idioma, texto plano y destinatarios**, y verificar el contador de destinatarios antes de enviar.
- **Lo que el conector NO puede hacer en MailerLite** (lo hace el usuario en el panel): subir ficheros, fijar el campo `preheader`, editar el texto plano, cambiar el idioma de la campaña y fijar los destinatarios. **El preheader se resuelve igual** metiendo un div oculto al principio del fragmento HTML, que es la técnica estándar y funciona aunque el campo esté a `null`.
- **Producción del GIF (flujo de Mario, 2026-07-27):** el diseño de la mascota SE MANTIENE tal cual (el logo con ojos, brazos y libro: es marca en cada gag, no se rediseña). El prompt al generador es **UN párrafo** que pide **UN solo archivo**. Siempre: personaje entero y centrado, estilo plano sin 3D, loop perfecto 2-3 s.
- **Colores de Kaixito con el brandbook 2026 (fijados el 2026-07-29):** cuerpo **Naranja `#fe8238`** · tapas del libro **Berenjena `#431b44`** (sustituyen al verde: es el único oscuro de la paleta y da el contraste que el libro necesita contra el cuerpo naranja y contra el fondo claro) · páginas interiores del libro **Azul bebé `#a7c5f9`** (aquí sí funciona un claro, porque va rodeado del berenjena oscuro) · brazos, manos y ojos en negro. ⛔ El libro NO va en azul bebé ni en mint: a tamaño miniatura un claro sobre fondo claro se disuelve (`images §4.0`).
- **⚠️ EL FONDO DEL GIF VA EN CREMA `#f9f3ef`, NO EN TRANSPARENTE NI EN MAGENTA (corregido el 2026-07-27).** Primero se pidió magenta para recortarlo a mano, y es la técnica correcta solo si la animación tiene que ir sobre fondos distintos (web, vídeo). **Para email es peor:** el GIF solo tiene transparencia de 1 bit (opaco o invisible, sin alfa parcial), así que recortar un personaje con bordes suavizados deja dientes de sierra o halo de color. La solución limpia es **generar el GIF ya sobre el fondo del correo**, que es el Alabastro de la paleta (`images §283`): integración perfecta, cero recorte, cero halos. Corolario: **el fondo del cuerpo del email es Alabastro `#f9f3ef`**, no blanco puro.

## 4 · CTA: uno, claro, y del tamaño del calor del lead

- **CTA FUERTE** (emails de diagnóstico/demo, leads calientes): pregunta directa con acción concreta. *"¿Te encaja verlo en una demo de 20 minutos esta semana?"* · *"¿Tiene sentido que te hagamos un diagnóstico rápido?"*. Nunca "ya me dices".
- **CTA SUAVE** (emails educativos, leads fríos): pedir una respuesta pequeña. *"¿Quieres que te pase el ejemplo aplicado a vuestro caso?"* · *"Responde con 'demo' y te paso horarios."* La respuesta simple sube interacción y entregabilidad; la conversación se lleva luego a demo.
- **Mapa temperatura → CTA (para no inventar el criterio):** caliente (clicó/respondió hace poco, o pidió info) → FUERTE · **templado (descargó un lead magnet, abre pero no clica) → SUAVE por defecto**; el FUERTE le llega solo como email 3 de una mini-campaña (§5) · frío/dormido → ni fuerte ni suave: primero la reactivación de §5c.
- **Kaixito:** CTA de relación ("respóndeme y me lo cuentas") o ninguno.
- Un solo CTA por email. Varía el copy entre emails (`working-preferences §4`: nunca dos seguidos con el mismo cierre).

### 4b · La PD

> **⛔ EN ESPAÑOL SE ESCRIBE "PD", NUNCA "P.S." (medido el 2026-08-06).** Sobre el corpus español entero (Timepack + Hugo López + Sales Hackers + newsletters): **453 "PD" y 141 "PPD" contra CERO "P.S."**. El "P.S." es un anglicismo y delata traducción. Cuando hay dos postdatas, la segunda es **PPD**. Está en el validador.

En los emails importantes, SIEMPRE (Timepack lo lleva en el 86% de los correos, a veces PD+PPD). Usos, por orden de valor:
1. **Motor de referidos, no de venta** (el uso nº 1 de Timepack): pedir el reenvío. En B2B el reenvío interno es multithreading gratis: *"P.S. Si esto le sirve a tu director comercial, reenvíaselo."* La pila de 3 P.S. de Timepack es plantilla: gustado→reenvía / te lo reenviaron→suscríbete / ¿quieres irte?→**baja sin drama** ("Cero dramas. Aquí.").
2. **Reforzar el CTA bajando fricción:** *"P.S. No sería una demo genérica; la idea es revisar vuestro proceso."*
3. **Derivar:** *"P.S. Si no eres la persona adecuada, ¿quién lleva esto en tu equipo?"*
4. El guiño final o el recordatorio de deadline (solo si el deadline es real, ver §7).

---

## 5 · Pilares de contenido y cadencia semanal

**Cadencia:** mínimo 1 email/semana a la lista activa (una lista abandonada muere); el objetivo de crucero es 2-3/semana alternando pilares y remitentes. **Mismo día y misma hora local, religiosamente:** Timepack manda a las 06:30 hora española clavadas durante 16 meses (ajusta el UTC con el horario de verano) y esa costumbre ES el activo. Un "empleado digital que no falla" predica con el ejemplo no fallando.

**⭐ DÍA DE LA SEMANA Y HORA — medido el 2026-08-10 sobre las fechas reales de envío de 480 correos (los nombres de fichero del corpus llevan fecha y hora).**

| | Timepack (353, 490 días) | Hugo López (127, 402 días) |
|---|---|---|
| Frecuencia | **5,0 correos/semana** | 2,2 correos/semana |
| Lunes | **20,1%** | 23,6% |
| Martes | 19,8% | **26,0%** |
| Miércoles | **20,1%** | 13,4% |
| Jueves | 19,8% | 16,5% |
| Viernes | 19,8% | 11,8% |
| Sábado + domingo | **0,3%** (1 de 353) | 8,6% |
| Hora (española) | **06:30-07:30** | 08:00-11:00 |
| Dos correos el mismo día | 1 de 352 (0%) | 3 de 122 (2%) |

- **⛔ EL LUNES NO SE EVITA EN EMAIL. Es el error de trasladar la intuición de LinkedIn.** Timepack reparte los cinco laborables **exactamente por igual** (19,8-20,1%, una diferencia de 1 correo en 490 días), y Hugo López **concentra en lunes y martes** (49,6% de sus envíos). En LinkedIn el lunes se evita; en la bandeja de entrada no hay ningún dato que lo respalde.
- **Fin de semana: no.** Timepack, con 5 envíos semanales durante 16 meses, mandó **un solo correo en domingo y ninguno en sábado**. Coincide con el criterio de Mario: se vende a empresas y las empresas trabajan de lunes a viernes.
- **Nunca dos correos el mismo día.** Prácticamente cero en los dos corpus, aunque uno mande 5 por semana.
- ⛔ **Y OJO CON DISFRAZAR UNA RESTRICCIÓN DE EXPERIMENTO.** Cuando una tanda sale a una hora rara porque es cuando se pudo, eso es una restricción operativa, no una prueba. Apuntarla como "hemos probado las 10:01" contamina el historial con conclusiones que nadie puede sostener. **Se anota la hora y se anota el porqué.**
- **⛔ NO SE TESTAN LOS DÍAS: la tabla de arriba ya los ha respondido.** Los cinco laborables rinden igual, así que el día de una tanda se elige por criterio OPERATIVO (acabar antes, no caer en viernes), nunca para medir. Y las tandas de un mismo correo **no son comparables entre sí** aunque caigan en días distintos: cambian las personas, el tamaño y la temperatura del dominio.
- **⭐ HORA DE LA CASA: 09:01, fijada el 2026-08-10.** Todos los envíos a esa hora hasta que el test de hora diga otra cosa.
  - **El minuto impar es deliberado (Mario):** la mayoría de la gente programa a la hora en punto. Saliendo a las 09:01 llegas DESPUÉS de esa oleada, y en una bandeja ordenada por lo más reciente eso te pone encima de todos ellos. Cuesta cero y la lógica se sostiene; no está medido, pero no hay nada que perder.
  - **⚠️ El porqué original ("los corpus mandan antes de las 08:00") SE CAYÓ con el corpus de 13 remitentes (§8d): la hora no tiene consenso, va de las 06:00 a las 23:29.** Las 09:01 se mantienen igualmente, ahora por otra razón: es la hora más cercana a nuestro único dato real (09:23 → 46,8%) y **lo que de verdad importa es no moverla nunca**.
  - ⛔ **No se traslada la hora de LinkedIn.** En LinkedIn las 12:00 funcionan porque se mira en un descanso; el correo se abre como tarea al empezar la jornada. Son comportamientos distintos.
  - **⭐ EL PRINCIPIO, en palabras de Mario (2026-08-10): "siempre hay que adelantarse a la hora pico".** Es la formulación correcta del mecanismo, y aplica igual a posts y a correos. Lo que cambia es DÓNDE está el pico:
    - **LinkedIn: pico a las 12:00** (se mira en un descanso) → se publica antes.
    - **Email: pico al llegar a la oficina, 08:00-09:00** (se abre como primera tarea) → se manda antes, sobre las 07:00. Es lo que hace Timepack con 490 días de constancia.
    - ⛔ **Trasladar las 12:00 de LinkedIn al correo es llegar dos picos tarde.** Toda hora a partir de las 10:00 cae ya en mitad de la jornada.
  - **La hora SÍ merece un test, pero uno de verdad:** mismo correo, mismo día, la lista partida en dos mitades equivalentes, **07:01 contra 09:01**. Nunca cambiando la hora entre tandas: cambian las personas, el tamaño y la temperatura del dominio a la vez, y el resultado no dice nada.

**El reparto que no quema la lista (medido en el corpus): ~40% valor puro sin ningún enlace · ~45% valor + siembra suave (P.S. o teaser) · ~15% venta directa concentrada en ventanas cortas.** El 47% de los correos de Timepack no lleva NI UN enlace en el cuerpo. La newsletter que agenda demos no es la que pide la demo cada día: es la que hace imposible no abrir el siguiente email, y pide la demo pocas veces con toda la confianza acumulada.

| Pilar | % | Qué es | Remitente | CTA |
|---|---|---|---|---|
| **1 · El dolor de encontrarlos** | ~40% | El director comercial que no sabe a quién llamar. La lista comprada que no vale. La feria de 200 tarjetas y cero pedidos. El comercial que se pasa media semana buscando en vez de vendiendo | Iker | Suave, y fuerte 1 de cada 3 |
| **2 · Historia con lección** | ~25% | El molde RunnerPro: una historia (propia o inventada, §7) que aterriza en el dolor y cierra con la frase-puente. Puede colgarse del calendario (agosto, vuelta de vacaciones, cierre de trimestre) | Cualquiera | Suave |
| **3 · Rompe una creencia del sector** | ~20% | El molde Isra Bravo: *"lo que te han contado sobre X está mal"*. Ej: "más leads no era tu problema", "el CRM no te va a decir a quién llamar" | Unai o Iker | Suave |
| **4 · Por dentro y novedades** | ~15% | Cómo funciona algo por debajo, aterrizado en ventas · lo que hemos roto esta semana | Asier · Kaixito | Relación |

**⭐ LA PROMESA CENTRAL, Y ES UNA SOLA (confirmada por Mario con feedback de clientes, 2026-08-10):**
> **Encontrar las empresas que de verdad te pueden comprar, y la persona exacta con la que hablar dentro.**

No son las señales. No es el momento. **Es la identificación.** Los clientes industriales compran eso porque encontrar a quién venderle es su cuello de botella real (coincide con `aboutme` y con el diferenciador que corrigió Iker).

⛔ **Corolario, y es el modelo de Isra Bravo: un solo producto, ángulos infinitos.** Los cuatro pilares no son cuatro promesas: son **cuatro caminos a la misma puerta**. Isra vende el mismo libro los 7 días entrando por un capítulo distinto; nosotros vendemos la misma identificación entrando por un dolor distinto. **Nunca inventar un segundo mensaje central para "variar".**

- **Mini-campañas de 3 emails** sobre el mismo ángulo para empujar demos: (1) problema + insight + CTA demo · (2) caso/ejemplo + CTA suave · (3) diagnóstico directo + P.S. bajando fricción. Separados varios días, cada uno con ángulo nuevo, jamás el mismo mensaje repetido. Si no responde → vuelve al nurture normal.
- **Echo marketing:** los emails se escriben con las palabras del comprador, no las nuestras. Frases reales de llamadas, objeciones frecuentes ("ya hacemos LinkedIn", "la IA no me da confianza", "no es prioridad") y preguntas de demos se convierten en asuntos y cuerpos. Pídele a Iker el porqué real de cada demo agendada: ese dolor es el próximo email.

### 5b · Secuencia automática de bienvenida (nuevos leads)
Día 0: entrega del lead magnet prometido · Día 1-2: quiénes somos y qué problema resolvemos (SIN pitch duro) · Día 3-5: una idea útil · Día 6-8: caso de uso · Día 9-11: error común que Neety evita · Día 12-14: invitación a diagnóstico. Valor, no presión: el lead tiene que entender solo por qué la demo tiene sentido.
- **Sin doble flujo:** mientras un lead está DENTRO de la bienvenida (días 0-14) NO recibe la newsletter normal. Al terminar la secuencia pasa al nurture semanal. Nunca los dos a la vez.
- **Referenciar el origen:** el email de día 0-2 SÍ nombra el recurso que se descargó ("la guía de X que te llevaste"); a partir de ahí, genérico, porque en la lista conviven leads de magnets distintos. Si un envío va filtrado a UN magnet concreto, se referencia; si va mezclado, no se asume ninguno.

### 5c-0 · Correo 0: el segmentador por respuesta (diseñado el 2026-07-27, pendiente de enviar)
El primer correo del sistema no vende: **segmenta la base mezclada por RESPUESTAS** y de paso entrena la entregabilidad (cada respuesta le dice a Gmail que somos legítimos, justo cuando el dominio está frío).
- **Asunto: `tú quién eres`** (decidido el 2026-07-27): 3 palabras, minúsculas, sin signos de interrogación ni emojis. Con Kaixito de remitente la broma es coherente: es ÉL quien no te encuentra en su libro.
- **Remitente: KAIXITO "de Neety" (revisado el 2026-07-27; antes decía Iker).** Unai y Asier descartados por sobrios (decisión de Mario). El motivo del cambio: con el gag del GIF (Kaixito estresado sin recordar de qué te conoce), **el correo ES la presentación de la mascota**: se cumple la regla de §1 ("existir antes de remitir") dentro del propio correo. Condiciones: el From lleva la marca (*"Kaixito de Neety"*, nunca "Kaixito" a secas), la línea 1 lo presenta (*"soy Kaixito, la mascota de Neety, y tengo un problema"*), y las respuestas las contesta un humano.
- **El GIF del correo 0:** Kaixito hojeando su libro frenético, garabatos de estrés e interrogaciones creciendo sobre la cabeza, gota de sudor, y remate: para en seco y mira a cámara con el libro del revés. Loop 2-3 s, specs de §3b. Es la ÚNICA imagen del correo.
- **Cuerpo:** línea 1 desactiva la broma ("era broma, tranquilo"), quiénes somos en UNA frase, por qué te llega este correo (web / evento / LinkedIn / webinar / referido: todas las vías), y **UNA pregunta de respuesta de una palabra**: *"contéstame con una sola palabra: web, linkedin, evento, webinar o ni idea"*. La opción "ni idea" hace gracia Y también segmenta.
- **⛔ "NI IDEA" SE QUEDA COMO OPCIÓN CERRADA, no se cambia por "especifica dónde" (decidido el 2026-08-06).** La lista cerrada de UNA palabra convierte la respuesta en una decisión de 3 segundos; pedir que redacten la convierte en una tarea, y ahí se cae la gente. Además: (a) en una lista mezclada de un año entero, **los que no se acuerdan son mayoría**, y sin salida fácil simplemente no contestan; (b) "ni idea" **es un cubo accionable** (a ese hay que reintroducirle, no decirle "como viste en nuestro webinar"); (c) en un dominio recién estrenado **cualquier respuesta es señal positiva** para el proveedor de correo. Misma mecánica que la palabra clave del lead magnet: cada requisito extra se come un porcentaje de respuestas.
- **El objetivo es la RESPUESTA, no el clic:** este correo va SIN enlaces (mejora la entrega en frío) y su métrica es cuántos contestan. Cada respuesta = un contacto segmentado + activo confirmado. ⚠️ El GIF le añade algo de riesgo de spam frente a texto puro: se compensa con dominio autenticado, envío escalonado y el resto del correo en texto plano. Prueba interna (a nuestros propios correos) antes del envío real.
- **A quién:** SOLO al segmento de origen desconocido. Los que tienen origen claro (p. ej. los ~40 de recursos) NO lo reciben: a ellos se les escribe referenciando su origen cuando toque.
- **Purga:** los rebotados/direcciones rotas se borran YA. Los que no abren NO se tocan tras un correo: los opens son poco fiables (Apple los distorsiona), se juzga tras 4-6 correos por clics + respuestas.
- **Envío escalonado** en tandas pequeñas repartidas en días: hace a la vez de calentamiento del dominio.

### 5c · Segmentación (antes de enviar nada)
No se dispara lo mismo a toda la base. Mínimo separar por: **origen** (lead magnet / newsletter / webinar / LinkedIn / contacto comercial), **rol** (founder / director comercial / marketing / agencia) y **temperatura** (abrió, clicó, respondió, dormido >3 meses). Los dormidos NO reciben la campaña normal: reciben la de reactivación (recordar por qué están en la lista + una idea útil + opción clara de baja). Lista pequeña y viva > lista grande y muerta.

---

## 6 · Sistema de trabajo (el método Carmen/Runner Pro, adaptado)

Carmen lleva la newsletter de Runner Pro (B2C) entera desde Claude Code con un playbook .md y tandas programadas. Su sistema, adaptado a Neety:

0. **⭐ FASE ACTUAL (Iker, 2026-07-27): CORREO A CORREO, nada de tandas todavía.** Carmen programa tandas de 2 semanas porque lleva meses de datos y pilares validados; nosotros no tenemos ni pilares propios ni una métrica. Igual que en LinkedIn se empezó probando formatos y midiendo antes de tener la receta: **cada correo se trabaja individualmente**, se revisa a fondo, se mide y va definiendo los pilares. Se pasa a tandas cuando haya (a) herramienta de envío con métricas conectada, (b) 3-4 pilares con datos propios y (c) el tono afinado tras una buena serie de correos revisados. El resto de esta sección (pregunta previa, feedback doble, historial) aplica desde el correo nº 1.
1. **Tandas de 2 semanas (el DESTINO, no el arranque).** Cuando toque: se planifica y escribe la tanda completa de una vez (con la rotación de remitentes y pilares), no email a email. Un email suelto fuera de tanda es la excepción (algo urgente que comunicar), y va sin bucles con ayer/mañana.
2. **Antes de cada tanda, SIEMPRE preguntar:** *"¿Hay algo especial que comunicar estas 2 semanas?"* (lanzamiento, oferta, evento, feria, post que ha petado). La respuesta condiciona la tanda.
2b. **El estado vive en `docs/skills/historial-newsletter.md`** (equivalente al `historial-publicaciones.md` de posts): qué email salió, qué día, con qué remitente, pilar y segmento, más las palabras de CTA-respuesta ya usadas. Se LEE antes de planificar una tanda (rotación de remitentes, no repetir ángulo ni palabra) y se ACTUALIZA y commitea al aprobar la tanda. Si falta un dato, PREGUNTA; no lo adivines.
3. **Revisión humana del pool:** el usuario revisa los borradores (preview en la herramienta de envío) y da feedback por número de email.
4. **El feedback va a DOS sitios:** se corrige el email Y, si es un aprendizaje reutilizable, se escribe AQUÍ en esta skill (misma doctrina que `feedback_meter_aprendizajes_en_recetas`). Al cerrar la sesión: "guarda los cambios de hoy" = actualizar y commitear esta skill.
4b. **⭐ UTM EN TODOS LOS ENLACES, DESDE EL CORREO 1 (2026-08-06).** Sin UTM, el tráfico del correo entra en Analytics como directo y **no se puede atribuir ni una sola demo al canal**. Se activa la integración de Google Analytics en los ajustes de la campaña (en el panel; el conector no lo expone).
   - **Convención fija, que es lo que de verdad importa** (UTMs inconsistentes fragmentan los informes y son peores que no tenerlos):
     `utm_source = newsletter` · `utm_medium = email` · `utm_campaign = remitente-numero-tema`
   - Ejemplos: `kaixito-01-repermiso` · `iker-02-prospeccion-manual` · `kaixito-03-novedades`.
   - **Poner el remitente en el nombre de campaña es deliberado:** permite agrupar en Analytics y responder si Kaixito convierte mejor que los founders (`§1`, "se mide, no se discute").
   - 🔴 **Los UTM miden que llegó tráfico, NO que convirtió.** Hay que tener la reserva de demo marcada como **evento de conversión en GA4**, o se ven visitas sin saber si alguna agendó.
   - **Se activa desde el correo 1 aunque aporte poco**, porque los datos solo sirven si son comparables desde el principio.
5. **Métricas que mandan:** respuestas y demos agendadas > clics > aperturas (open rate >30% está bien como referencia, pero no se optimiza para abrir, se optimiza para conversar). Medir por segmento y por pilar; replicar los formatos que agendan.
6. **Días de envío:** empezar martes-jueves por la mañana y MEDIR. Si un día flojea sistemáticamente (a Runner Pro le pasó con los sábados), se salta ese día. No adivinar: mirar los datos propios.
6b. **⭐ LOS TESTERS SE ELIGEN POR CLIENTE DE CORREO, NO POR CARGO (2026-08-06).** MailerLite pide un mínimo de 4. Si los 4 son cuentas `@neety.com` con Google Workspace, se está probando Gmail cuatro veces y no se ha probado nada. **Hay que tener al menos un Outlook de escritorio en Windows**, que es donde más se rompe: usa el motor de Word, no un navegador, y **solo muestra el primer fotograma del GIF** (verificado el 2026-08-06; Gmail y Apple Mail sí animan). Por eso la regla de que el primer fotograma funcione como imagen fija (`§3b`) no es un adorno: para media plantilla de una empresa, ese ES el GIF.
   - **Qué se mira en la prueba, por orden:** (1) el GIF anima, o su primer fotograma se entiende solo · (2) el preheader sale en la bandeja detrás del asunto · (3) el pie legal y la baja salen **una sola vez** y en español · (4) se lee bien en móvil.
   - **El coste no es argumento:** 5 correos de prueba contra 1.333 de campaña es un 0,4%.
7. **Entregabilidad:** dominio calentado ANTES de la primera tanda (no pasar de 0 a 1.000 envíos), baja fácil y visible, pocos enlaces, solo texto, limpiar dormidos. Las bajas son limpieza, no fracaso.
8. **Programar por API NO penaliza (aclarado el 2026-07-27).** En LinkedIn publicamos a mano porque hay un algoritmo de alcance que castiga la publicación por herramientas de terceros; en email NO existe ese algoritmo: existen filtros de spam, y les da igual si la campaña se escribió en el editor o la programó Claude por API, porque sale idéntica del mismo servidor de la herramienta. Lo que decide el inbox es la reputación del dominio, la autenticación, el engagement y la lista limpia (punto 7). Carmen manda todo por Claude→API de Klaviyo con open rate >30%. La revisión humana del punto 3 se mantiene igual.

---

## 7 · Los innegociables (heredados del cerebro de posts, y uno NUEVO)

- **Historias INVENTADAS: SÍ se pueden usar (decisión de Iker, 2026-07-27), con dos condiciones.** Es el método Carmen/Runner Pro: una historia inventada que ataca un dolor REAL del cliente es herramienta legítima del email. Las condiciones: (a) **NUNCA un nombre de empresa** — ni real ni inventado; la empresa se describe genérica ("una industrial del norte", "un SaaS con 12 comerciales") — y (b) **el nombre de persona SÍ puede inventarse** (solo nombre de pila: "a Marta le pasaba que…"), así nadie puede jugárnosla pidiendo la referencia. El dolor tiene que ser real (echo marketing, §5); la historia es solo el envoltorio.
  - Lo que sigue sin inventarse dentro de la historia: **cifras presentadas como resultado medido de Neety** ("un cliente subió un 40%") — un resultado o es real y verificado, o la historia se cuenta sin cifra-prueba (o con la cifra enmarcada como ilustración: "imagina que de 2.000 filas te quedan 40"). Es la misma regla que ya tenemos con +200 PYMEs: lo que un prospecto puede preguntar en demo, o se sostiene o no se dice.
- **Toda cifra verificada contra fuente real** antes de escribirla. Nombre de la fuente en el cuerpo, año solo en la entrega interna (`global §3.5b`).
- **No prometer resultados que no podemos demostrar.** Las cifras de `aboutme §1` marcadas `[PENDIENTE · sin origen documentado]` (+200 PYMEs, +40%) siguen sin poderse usar, tampoco en emails.
- **Posicionamiento intacto** (`aboutme §1b`): los 3 pilares (listado con confianza / contacto por señal / el comercial valida), nunca "sin esfuerzo / lo hace por ti", más problema del cliente que features, el "cómo funciona exactamente" se guarda para la demo.
- **Aviso proactivo** (`working-preferences §2`): si una campaña no captura nada (ni respuesta, ni demo, ni dato), avisar sin que lo pregunten. Si un email va a rendir mal (segmento dormido, ángulo quemado, tercer email de venta seguido), avisar ANTES con dato.

---

## 8 · El corpus de referencia (Timepack + newsletters vivas)

**Por qué Timepack:** 353 correos reales (jul 2024 - nov 2025) de la newsletter diaria de Ibon Sarasola (timepack.co), 5/semana sin fallar ni en Navidad, ~700 correos desde 2023. No tenemos sus métricas, pero **mantener ese volumen durante años solo se sostiene si funciona** (el mismo razonamiento que los outliers de LinkedIn: supervivencia = señal). Y como es infoproducto B2C, el remix a nuestro B2B no canta (el mejor remix es coger la esencia de otro sector y traerla al nuestro). El análisis completo se hizo el 2026-07-27 (estadística de los 353 + lectura a fondo de 31 repartidos en los 16 meses); los patrones ya están integrados en §2-§5. Lo que queda aquí es el resumen de cifras y el triaje copiar/adaptar/no copiar.

**Cifras de referencia del corpus:**
- Cuerpo: media 370 palabras, zona de confort 300-450 (~90 segundos de lectura). Párrafo = frase: mediana 9 palabras/párrafo, el 72% de los párrafos ≤12 palabras. Párrafos de UNA palabra como ritmo dramático ("Flaqueé.").
- Enlaces: media 0,8/correo; 47% sin ninguno. En lanzamiento: el MISMO enlace repetido 2-3 veces con anchor distinto, nunca enlaces compitiendo.
- Texto plano total: negritas ~0, viñetas formales 7%. Anchor text con la voz del lector (*"¡Se me había pasado, voy ya a ver el vídeo!"*).
- CTA que nunca suplica: marco de indiferencia soberana (*"your call"*) + coste de inacción concreto (*"Mañana sábado ya no lo tendrás. Hoy sí."*).
- Urgencia REAL y ejecutada: los deadlines de las 23:59 se cumplen (al día siguiente ya no vende). Por eso funcionan.

**COPIAR tal cual:** cadencia religiosa a hora local fija (§5) · párrafo=frase, 300-400 palabras, texto plano (§3) · asunto 6-9 palabras que abre gap y no lo cierra (§2) · la frase-bisagra seca de una línea (§3) · el P.S. como motor de referidos con baja sin drama (§4b) · el lector ventrílocuo (§3) · bucles abiertos entre correos y series de 2-3 con cliffhanger (§3).

**ADAPTAR:**
- El reparto 40/45/15 (§5): su "lanzamiento" se convierte en Neety en ventanas de campaña de demo (caso de cliente en 2-3 partes con cliffhanger → CTA fuerte el último día).
- El *"responde con PALABRA"* como CTA suave (*"responde EMBUDO y te mando la plantilla"*): en Neety abre conversación humana, el paso previo natural a la demo. Es el comment-gate del email.
- **Autoridad por cicatrices, no por púlpito:** sus mejores correos son fracasos propios con autopsia numerada. Neety tiene el equivalente REAL (campañas que fallaron, señales mal leídas, listas mal cualificadas) y ADEMÁS puede inventar la historia-envoltorio sobre un dolor real (§7: sin nombre de empresa, persona de pila inventada vale). La cicatriz real, cuando exista, siempre gana: los números propios se pueden enseñar.
- Urgencia solo si es verdad y con coste concreto: plazas de onboarding del mes, piloto limitado, precio early adopter con fecha. Nunca el falso "solo hoy" recurrente.
- El apodo de tribu ("nakama" en el 97% de sus correos) y la firma-mantra: la lección es tener marcas de voz inimitables PROPIAS, no copiar las suyas. Kaixito es nuestra candidata natural a marca de tribu.

**NO copiar (es de infoproducto B2C):**
- El idiolecto extremo (faltas deliberadas tipo "fásil y sensillo", tacos censurados, humor escatológico): a un director comercial de 55 años le rompe la confianza. Irreverencia medida sí; circo no. (Kaixito puede acercarse un punto más, sin llegar ahí.)
- El cierre de carrito a las 23:59 con precio tachado: un SaaS con demo y ciclo de venta largo no puede abrir y cerrar el producto.
- El volumen diario con 60% de storytelling personal: exige un personaje-founder a tiempo completo. Nosotros: 2-3/semana con 4 remitentes.

**Cómo se alimenta el corpus (flujo real desde el 2026-07-27):**
- **Mario pasa un ZIP de .eml cada pocas semanas** (el conector de Gmail solo admite una cuenta y es la de trabajo de Iker; el reenvío se descartó para no llenarle el buzón). Claude criba (fuera verificaciones y no-newsletters), inventaría por remitente y guarda las observaciones aquí.
- **El análisis cruzado gordo se hace con ~2-3 meses acumulados**, no antes: los patrones se confirman con repetición, como los outliers. Cada análisis actualiza ESTA sección.
- **Inventario a 2026-07-27 (ZIP "hasta 27 julio", 34 correos, 8 fuentes):** RunnerPro (7, el sistema de Carmen en vivo: 300-450 palabras, bienvenida con descuento día 0) · **BOGA/EDEM (2, la más cercana a nuestro género: curiosidad pura en primera persona + storytelling ~1.000 palabras)** · Cosas de Freelance (6, **bienvenida NUMERADA [1/10]…: la secuencia como producto con barra de progreso — patrón robable**) · Singularu (12, e-commerce puro: contraste, no modelo; su "chica Singularu" = truco de tribu) · lemlist (2, competencia: vigilar su discurso de señales) · Kieran Flanagan (4, ensayos 4-5k palabras: otro género) · **Aprilynne Alter (7, ZIP del 27-jul): asuntos TODOS en minúsculas y sin gancho de venta ("are creator conferences worth it?", mediana ~40 chars: valida el estilo del correo 0 desde otro nicho) · P.S. en el 100% · cuerpos educativos de 1.200-2.600 palabras con ~7 imágenes (género ensayo visual, no nuestro formato)**.
- **Faltan por suscribirse (prioridad):** ~~Isra Bravo · Lavender · CustomerTop~~ → suscrito el 2026-07-27, llegarán en el próximo ZIP.

### 8b · ⭐ SALES HACKERS — la referencia MÁS cercana que tenemos (50 correos, jun 2025 - jul 2026, analizado el 2026-07-27)
Javi Consuegra (`javi@saleshackers.es`, herramienta: beehiiv/Encharge) vende formación y consultoría de **IA para ventas B2B en español**: nuestro sector EXACTO y nuestro mismo comprador. Los 6 correos con "Fwd:" del ZIP los reenvió Unai, no son otra fuente.

**Sus números, y el contraste con Timepack:**
| | Sales Hackers (B2B) | Timepack (B2C) |
|---|---|---|
| Asunto | **mediana 29,5 chars / 5 palabras** | 43 chars / 8 palabras |
| Cuerpo | mediana 698 palabras | 356 |
| Enlaces | mediana 6, **0 correos sin enlace** | 0,8, el 47% sin ninguno |
| P.D. | 22% | 86% |
| Imágenes | 2-12 por correo (HTML pesado) | ~0 |

- **⭐ EL HALLAZGO: su cuerpo ES nuestro formateado de posts de LinkedIn.** Una frase por línea, bloques paralelos con anáfora y escalera, líneas cortas, remate seco. Literal de *"Vi tu post y pensé en esto..."*: `Lo frío habla de ti. / Lo cálido habla de ellos.` → `Lo frío suena a copia/pega. / Lo cálido se nota que va con intención.` → `Lo frío se ignora. / Lo cálido recibe respuesta.` **Confirma desde nuestro propio sector la decisión de §3 (el email hereda el formateado del post).**
- **Asuntos aún MÁS cortos que Timepack (5 palabras).** Y el mejor truco: asuntos que imitan un correo 1-a-1 (*"Vi tu post y pensé en esto..."*, *"Re: Herramienta para automatizar Linkedin"*, *"Te escribo desde el South Summit"*). ⚠️ El *"Re:"* falso es engañoso: NO lo copiamos (quema confianza y es justo lo que nos separa del spam).
- **Firma-mantra confirmada como patrón:** cierra con *"Buenas ventas, Javi Consuegra"* igual que Timepack con *"Que el tiempo te acompañe"*. Es la 2ª fuente: refuerza que tengamos la nuestra (`§3.7`, pendiente).
- **Su P.D. hace CROSS-SELL** (el cuerpo enseña, la P.D. vende otra cosa: un evento, un descuento). Uso distinto al de Timepack (referidos). Los dos valen; elegir por objetivo.
- **Ángulos que le funcionan y son nuestros:** "las llamadas/emails en frío ya no funcionan, lo que funciona son las señales" (= nuestro pilar 2), "¿cuántas herramientas sobran en tu empresa?", "quieres IA y tu CRM apesta", "outbound como el 2016", "vender ya no va de números". **Ojo: es competencia de atención**, así que el ángulo se remixea, nunca se calca.
- **Lo que NO copiamos:** 6 enlaces y hasta 12 imágenes por correo (nuestro dominio está frío y eso es riesgo de spam directo), ni sus asuntos con corchetes tipo `[NUEVO CONTENIDO]`.

### 8c · HUGO LÓPEZ — el manual de lanzamiento (127 correos, jun 2025 - jul 2026, analizado el 2026-07-28)
`contacto@hugolopezc.com`, Meta Ads y media buying en español (LeadMadness, You Run Ads). B2C-infoproducto como Timepack, pero su valor para nosotros es otro: **es el corpus de LANZAMIENTO y de cadencia diaria en primera persona.**
- **Números:** cuerpo mediana 446 palabras (entre Timepack 356 y Sales Hackers 698) · asunto mediana **52 chars / 10 palabras, el más largo de las 4 fuentes** · **0 de 127 en minúsculas** · **P.D. en el 89%** (113/127, el ratio más alto del corpus) · enlaces mediana 3, solo 1 correo sin ninguno.
- **⭐ El P.D. queda CONFIRMADO como ley del género:** 4 fuentes independientes lo llevan (Timepack 86% · Hugo 89% · Aprilynne 100% · Sales Hackers 22%). El único que baja es el B2B con enlaces por todas partes. Refuerza `§4b`.
- **Su escalera de cierre de carrito** (asuntos literales, en orden real): *"Mañana cierro las puertas"* → *"Hoy es el último día"* → *"No entres a You Run Ads"* (reversa) → *"Últimas 4 horas y cierro plazas."* → *"60 minutos y adiós."*. Es la plantilla de una ventana de campaña. **Para nosotros aplica al webinar/evento**, nunca a la suscripción (`§8` NO copiar: un SaaS con demo no abre y cierra el producto).
- **Estructura diaria: la crónica en primera persona.** Abre con lo que ha hecho ("Ayer cerré la oficina a las 21:45", "He estado los últimos días totalmente off"), enlaza con lo que está construyendo, y de ahí sale la oferta. Es autoridad por actividad, no por consejo, y es 100% trasladable a Kaixito y a los founders contando la semana real de Neety.
- **Las cifras SON el contenido** (400 entradas, 267 piezas, 193→400 asistentes): números propios y comprobables como prueba. Es justo lo que a nosotros nos falta (`aboutme §1`: las nuestras están sin verificar) y el motivo por el que la prueba lógica manda hasta que existan.
- **Lo que NO copiamos:** el hype apilado ("épico", "bestialidad", "lo vamos a reventar") choca de frente con la voz Neety y sobre todo con el registro de Unai (`brand-voice §1b`), y sus asuntos de 10 palabras contradicen a las otras 3 fuentes: nos quedamos con los 5-8 de Sales Hackers y Timepack.

---

### 8d · ⭐ CORPUS TRANSVERSAL — 32 correos, 13 remitentes, 6 sectores, una semana (4-10 ago 2026)

El corpus más valioso que tenemos, porque **es el único que permite separar lo que hace UN sector de lo que hace TODO el mundo**. Remitentes: Isra Bravo (7), SINGULARU (5, joyería ecommerce), Hugo López (4), Lara Acosta/Kleo (3+2, inglés), Juan Domínguez (3), **RunnerPro (2, la empresa de Carmen)**, Cosas de Freelance (3), BOGA/EDEM, Kieran Flanagan, Sonia Ferrent.

#### Lo que hacen TODOS (esto es doctrina, no estilo)

**1. La micro-apertura imperativa de 1-3 palabras.** El patrón más fuerte del corpus español, y no lo teníamos escrito:

| Remitente | Aperturas literales |
|---|---|
| Isra Bravo | **"Mira."** ×5 · **"Una cosa."** ×2 — 7 de 7 |
| RunnerPro | **"Escúchame."** · **"Domingo."** |
| Hugo López | **"Atiende."** · **"Vale."** ×2 |
| Juan Domínguez | **"Correo rápido hoy."** |

Una orden o una palabra suelta, **con punto**, y línea en blanco. Es un freno: obliga a parar antes de leer. **Se adopta.**

**2. PD sí, P.S. no — reconfirmado en corpus nuevo e independiente: 17 de 32 llevan PD, 1 lleva P.S.**

**3. Firma-mantra fija. Esto CIERRA el pendiente de §3.7:** no es un capricho de Timepack, lo hace medio corpus.
- Isra Bravo: **"PD: Arriba."** — los 7 días, siempre igual
- RunnerPro: **"Ánimo Runner, nos vemos dentro de la App."**
- Juan Domínguez: **"Un abrazo, Juan, «el silencioso»"**

**4. Frase-puente fija al producto.** Cada remitente tiene UNA y la repite siempre:
- RunnerPro: **"Tu plan te está esperando."** → botón
- Isra Bravo: **"en el capítulo 18 de mi libro"** → enlace

**5. Un producto, ángulos infinitos.** Isra Bravo vende **el mismo libro los 7 días** entrando por un capítulo distinto. No hay catálogo: hay una puerta y muchos caminos. Es el modelo exacto para nosotros, que también vendemos una sola cosa.

#### 🔴 Lo que CORRIGE lo que teníamos escrito

**LA HORA NO TIENE CONSENSO. Lo que es religioso es el MINUTO.**

| Remitente | Hora fija |
|---|---|
| Cosas de Freelance | 06:00-06:03 |
| Sonia Ferrent | 06:01 |
| Hugo López | 07:49-08:06 |
| SINGULARU | **09:30** clavadas, 5 de 5 |
| RunnerPro | 13:00-13:03 |
| Lara Acosta / Kleo | 13:00-13:04 |
| Juan Domínguez | **14:02** clavadas, 3 de 3 |
| **Isra Bravo** | **23:29 clavadas, 7 de 7** |

- ⛔ **Se cae la regla de "mandar antes de las 08:00".** Salía de 2 corpus que casualmente madrugaban. Con 13 remitentes la hora va de las 06:00 a las 23:29, y **el mejor copywriter de email en español manda a las 23:29 todos los días**.
- ✅ **Lo que sí aguanta: cada remitente clava SU hora y no la mueve.** La constancia es el activo, no la hora concreta. Elegir una y no tocarla importa más que cuál elijas.
- ✅ **Y el minuto impar está en el corpus:** 23:29, 14:02, 06:01, 06:03, 13:01. Nadie manda en punto salvo SINGULARU. Respalda las **09:01** de Mario.

**FIN DE SEMANA: depende de a quién vendas.** Isra manda 7/7 incluido sábado y domingo; RunnerPro, Hugo y Content Playbook mandan en domingo. **Pero los 5 son B2C o infoproducto.** Nuestra regla de lunes a viernes sigue en pie porque vendemos a empresas: no es que el fin de semana sea malo, es que nuestro lector no está trabajando.

#### El molde de RunnerPro (la empresa de Carmen) — el más copiable que tenemos
~350 palabras, un solo CTA, mismo esqueleto los dos días:
1. Micro-apertura ("Escúchame." / "Domingo.")
2. Historia propia **o** consejo práctico del momento (agosto y el calor: **riden el calendario**)
3. El giro: *"El error no es ir lento en agosto. El error es dejarlo porque vas lento."*
4. Frase-puente fija: **"Tu plan te está esperando."**
5. Botón único
6. **Pd + Pd2**, y el Pd2 es SIEMPRE una pregunta personal de seguimiento: *"¿por cuántas salidas del reto vas? Deberías rondar la 4 o la 5."* — relación y presión amable a la vez
7. Firma-mantra + nombre y cargo real

⭐ **El Pd2-pregunta es lo mejor que hay aquí y no lo teníamos:** convierte un correo unidireccional en un seguimiento personal, y de paso es un CTA de respuesta encubierto.

#### ⭐ CÓMO SE VENDE EL ENLACE (extraído de los puentes literales del corpus)
1. **La última línea antes del enlace es una FRASE DE ESTADO, sin verbo imperativo.** RunnerPro: **"Tu plan te está esperando."** No dice entra, apúntate ni no te lo pierdas. Describe que el producto ya existe y está parado esperando. Cero olor a anuncio.
2. **⛔ Y va en escalera INVERTIDA: larga primero, corta después.** RunnerPro remata con 17 palabras y luego 5. **La línea más corta es la última antes del enlace**, porque es el golpe de cierre. Es la excepción a la escalera del cuerpo (`global §3.2`), y aplica solo al bloque final.
3. **El nombre del producto, solo y con punto, en su propia línea.** Isra: `ARROGANTE.` No va dentro de una frase: es una etiqueta, porque el argumento ya lo ha hecho el correo entero.
4. **La transición no argumenta, entrega.** *"En este:"* · *"Hazme caso."* · *"Al tiempo."* El porqué era el cuerpo.
5. **El enlace llega después de regalar la victoria.** El que no clica se va contento y abre el siguiente correo.
6. **El precio se ancla acusando, no defendiendo.** Isra: *"Por 18€... me estás robando."*
7. **Variantes:** enlace como promesa cumplida de ayer (Hugo: *"Te dije que hoy te contaba cómo entrar"*) · respuesta en vez de enlace (*"respóndeme con TRÁFICO"*) · **cero enlace** (Juan Domínguez cierra con una PD y ya).

**📄 Versión larga con la adaptación al spam ninja de LinkedIn: `Escritorio/como-venden-el-enlace.md`** (documento de traspaso al chat de estrategia de LinkedIn, 2026-08-10).

#### Quién firma: 12 de 13 son una PERSONA con nombre
La única excepción es SINGULARU, que es ecommerce puro de ofertas. **Cero mascotas en 13 remitentes.** RunnerPro, que es el caso más parecido al nuestro, firma **"Cristóbal, CEO de RunnerPro"**. Eso es a la vez el argumento en contra de irnos 100% a Kaixito y la prueba de que la mascota es terreno libre.

---

### 8e · ⭐ SEGUNDA SEMANA DE LOS MISMOS REMITENTES (11-17 ago 2026, 39 correos)

El corpus más útil de todos, porque **repite remitentes**: lo que aparece las dos semanas es sistema, lo que aparece una es capricho.

#### Lo que queda CONFIRMADO con dos semanas
- **La mediana del asunto no se mueve: 36 caracteres / 7 palabras**, con n=32 y n=39. Es el dato más sólido que tenemos.
- **Las horas, clavadas al minuto otra vez:** Isra Bravo 23:29 (**14 de 14 en dos semanas**) · SINGULARU 09:30 entre semana y 08:30 los domingos · Juan Domínguez 14:02 (6 de 6) · RunnerPro 13:00-13:07 · Content Playbook domingos 13:0x. **La constancia del minuto es el patrón más fuerte del corpus entero.**
- **Las micro-aperturas se repiten idénticas:** Isra abre *"Mira."*, RunnerPro *"Escúchame."*. No son variaciones: son fórmulas fijas.
- **Los paréntesis suben de 12% a 15%** de los asuntos.

#### ⭐ Lo NUEVO que merece robarse

**1. El asunto de UNA palabra.** Isra bajó su mediana de 30 a 21 caracteres, con estos: `Gordo` (5c, una palabra) · `10 detalles` · `Cállate, subnormal` · `Tu madre es peligrosa`. **Un asunto de una palabra es el máximo curiosity gap posible**: no hay nada que resolver salvo abriendo. Se puede usar cuando ya tienes relación con la lista; en frío no.

**2. Adelantarse a la ofensa.** *"Este email puede molestar a algunas personas, porque hablo de gordos y digo, gordos."* Es el lector ventrílocuo aplicado a la incomodidad: la nombras tú antes de que la sienta él, y el lector deja de estar a la defensiva.

**3. El personaje con nombre y CIFRA.** *"Germán era amigo mío... Germán tenía veinticinco años. Y veinticinco kilos de más."* La cifra concreta pegada a un nombre de pila es lo que hace real una historia (y encaja con `§7`: nombre de pila sí, empresa nunca).

**4. La universalización, que es la bisagra.** *"Pero lo interesante no es su peso. Es la distancia entre ser consciente de un problema y asumir la responsabilidad de resolverlo."* **Plantilla: "lo interesante no es X, es Y."** Convierte una anécdota de UNO en un principio que le aplica al lector. Es el puente entre historia y venta, y es reutilizable tal cual.

**5. El referido DENTRO del CTA, no en la PD.** *"Si estás en esa situación **o conoces a alguien así**, pásale el capítulo 12."* Le da salida al que no se identifica: en vez de perderlo, lo convierte en distribuidor.

**6. ⭐ El paréntesis que rescata al que no compra.** Hugo López cierra su lanzamiento con `Hoy se cierra la lista prioritaria de Mambo (léelo aunque no entres)`. **El 95% de la lista no va a comprar y ese paréntesis evita que desconecten**, que es lo que mata una secuencia de lanzamiento. Cuesta cuatro palabras.

**7. Usar la escasez y acto seguido rechazarla.** *"111 personas apuntadas para 20 sitios. Pero no quiero que te decidas por las plazas. Quiero que te decidas por esto que voy a contarte."* Pone el dato y renuncia a él en voz alta. Nombrar la manipulación y descartarla hace que el argumento de verdad pese el doble.

**8. Miedo competitivo, no FOMO.** *"Imagínate el sector dentro de seis meses. Van a existir 20 personas que habrán aprendido... y todo el resto haciendo lo de siempre. **Comparten mercado.**"* No es "te lo vas a perder": es "otros van a por tus clientes". Para B2B industrial es directamente trasladable.

**9. La fricción admitida.** RunnerPro: *"No te voy a mentir: las dos primeras semanas las pasó fatal."* Reconocer la parte dura **antes** de prometer el resultado es lo que hace creíble el resultado.

**10. El Pd2 como contador serial.** Evolucionó de una semana a otra: *"¿por cuántas salidas del reto vas?"* → *"semana dos del reto. Si vas por 4-5 salidas, vas perfecto."* **Un contador que avanza entre correos convierte la newsletter en un programa con progreso.**

**11. La PD que explica la mecánica.** Hugo dedica la PD a contar exactamente qué pasa tras rellenar el formulario, paso a paso, rematando con *"Y ojo, que reviso yo. No es un correo automático."* Baja la fricción explicando el proceso, no insistiendo.

#### El contraste que vale de ejemplo: la newsletter de MailerLite
Sus propios asuntos: *"Welcome to our newsletter! 🎉 Here's what you need to know."* Exclamación, emoji, genérico y sin gap. **La plataforma de email escribe peor que cualquier creador independiente del corpus.** Sirve para recordar que "lo hace una empresa grande" no es argumento.

#### ⛔ Lo que NO se copia, y sigue siendo nuestra ventaja
Isra Bravo es **99% líneas individuales**. Nosotros mantenemos **líneas sueltas como base pero con bloques de 2 y de 3** (`§3`), porque dan retención y son firma de marca. El corpus dice qué hace el sector; nuestra experiencia dice qué nos funciona a nosotros. **El formateado no se toca.**

---

## 9 · Entrega y validación (cada email, sin excepción)

- **Cada email va en su bloque cercado** (` ``` ` sin lenguaje), formato exacto:
  ```
  REMITENTE: Iker
  ASUNTO: …
  PREVIEW: …

  (cuerpo del email, con sus saltos de línea reales)

  (firma)
  P.S. …
  ```
- **Sin markdown dentro del bloque** (los emails van en texto plano).
- Fuera del bloque: pilar, segmento objetivo, el porqué del ángulo, los avisos 🔴 y los datos con su año (entrega interna).
- **Validador mecánico:** `python scripts/validar-email.py <fichero.txt>` y pegar el resultado en la entrega, como con los posts. Si esa línea falta, es que se ha saltado.
- **Pase de criterio en silencio** (lo que el script no ve): ¿el asunto abre un gap real o describe? ¿la primera línea recompensa? ¿una sola idea? ¿el remitente encaja con el tema? ¿el caso es real? ¿el ángulo no está quemado de emails anteriores (mirar `historial-newsletter.md`)?

### ⭐ 9b · AVISOS DE PRE-ENVÍO — se pegan SIEMPRE debajo del texto entregado (Iker, 2026-08-06)
Igual que en LinkedIn se avisa de adjuntar la imagen o de pasarle las tipografías al diseñador, **toda entrega de un correo termina con esta lista**. No es opcional y no se resume: se pega entera, porque es lo que se olvida cuando hay prisa.

```
🔴 ANTES DE ENVIAR A NADIE:
1. Prueba a `testers` (mínimo 4, y que NO sean los 4 el mismo cliente de correo).
2. RESPONDER a esa prueba y comprobar que la respuesta llega al buzón que se lee.
3. Abrirlo en MÓVIL y en modo OSCURO.
4. Que el pie legal y la baja salgan UNA sola vez y en ESPAÑOL.
5. Que el GIF anime, y que su primer fotograma se entienda solo (Outlook lo congela).
6. Que los enlaces del cuerpo y de la PD lleven donde tienen que llevar.
7. Test de spam (Mail-Tester o equivalente) antes del primer envío masivo del dominio.
8. Comprobar si cae en Principal o en Promociones.
9. Destinatarios apuntados al GRUPO correcto, no a "todos los suscriptores".
10. Envío ESCALONADO: nunca la lista entera de golpe.
11. Texto plano con las MISMAS frases que el HTML (son dos capas, §9c).
12. Cuenta → Rastreo del enlace: que `utm_campaign` sea el de ESTE correo.
    Se hereda del envío anterior (§9c).

🔴 Y DESPUÉS DE DARLE A ENVIAR (o de programar):
13. RECARGAR el panel y confirmar que la campaña está en Enviadas y no ha
    vuelto a Borradores. Ha pasado 2 de 2 veces (§9c).
```

- **El nº 2 es el más importante y el que más se olvida:** si las respuestas no llegan al buzón, un correo de re-permiso no vale absolutamente nada, y no te enteras hasta que es tarde.
- **El nº 9 ha estado a punto de fallar de verdad** (2026-08-06): la campaña se quedó apuntada a "todos los suscriptores" con 1.333 contactos mientras el plan era mandar a 50.
- **Resumen al final** de cada entrega (`working-preferences §0b`).

---

## ⭐ 9c · OPERAR MAILERLITE — todo lo aprendido montando el correo 0 (2026-08-06)

Un día entero de fricción, destilado. **Léelo antes de montar cualquier campaña.**

### Lo que se edita SIEMPRE por duplicado
**⛔ Un correo tiene DOS capas y hay que tocar las dos.** El HTML es lo que ve la gente; el **texto plano** es una versión alternativa oculta que **leen los filtros de spam**. Si el HTML va en español y el texto plano se queda en la plantilla inglesa por defecto, es una incoherencia que puntúa en contra. Cada vez que se cambia una frase, se cambia en los dos sitios.
- **Dónde está el texto plano:** paso *Enviar o programar* → flecha desplegable junto a **"Editar contenido"** → **"Editar versión de texto plano"**. No está dentro del editor.
- Debe terminar siempre con el `{$unsubscribe}`.

### Los dos pies de página
Hay **dos** y hay que repartirlos, o salen duplicados:
- **Pie de la CUENTA** (Configuración de la cuenta → *Detalles de la empresa y descargo de cancelación*): nombre, dirección y aviso legal. Es el que se añade solo a todo.
- **Pie de la CAMPAÑA** (formulario "Pie de página" dentro del editor): **solo los textos de los enlaces**. Se vacían *Nombre de la compañía*, *Detalles de la empresa* y *Aviso legal* para que no se repitan.
- **⛔ No se puede quitar el pie de la campaña:** es el que lleva el enlace de baja, y MailerLite bloquea el envío sin él.
- **Si los campos de texto de enlace están vacíos, sale `you_unsubscribe`**, una clave de traducción sin resolver. Hay que rellenar *Texto del enlace para cancelar suscripción* (`Darme de baja`) y *Texto de enlace del centro de preferencias* (`Cambiar mis preferencias`).
- 🔴 **Y marcar las casillas "Forzar la actualización… en borradores"**, o los cambios NO llegan a la campaña ya creada. **Esta fue la causa de que pareciera que nada se guardaba.**

### Ajustes que se olvidan y muerden
- **Idioma: por CAMPAÑA, no por cuenta.** No se hereda de una campaña a otra ni de la cuenta. Controla el pie legal y la página de baja.
- **Zona horaria: ✅ `Europe/Madrid (+02:00)`, verificado en el panel el 2026-08-11.** Se programa en hora española directamente, sin ajustar nada.
  - ⚠️ **Pero la API SIEMPRE devuelve UTC**, tenga la cuenta la zona que tenga. Un envío para las 09:01 de Madrid aparece como `scheduled_for: 07:01`. **Eso es correcto, no es un fallo**: son el mismo instante. Al verificar por API hay que restar las 2 horas (1 en invierno) antes de dar nada por roto.
- **Banner "Sent by MailerLite":** se quita en Configuración de la cuenta → *MailerLite branding*. Incluido desde el plan Comfort.
- **Los correos de PRUEBA no generan enlaces de baja ni de preferencias reales**: no se pueden pulsar. Es lo único del checklist que solo se verifica enviando de verdad.

### 📬 DE DÓNDE ENTRAN LOS SUSCRIPTORES DESDE EL 2026-08-18: LA LANDING DE CORREO
**Hasta ahora la lista se alimentaba de la base del CRM y de los gates de recursos. Desde el 18/08 hay una puerta propia: `recursos.neety.com/newsletter/` (alias `/correo/`), que es un formulario y nada más.**
- **Le llega tráfico desde el SEGUNDO spam ninja de los posts** (`global §4.4e`): el bloque de correo que va en historia, despiece, insight, evento y meme corto. No va en mapa, ni en "Los 10", ni en el post del lead magnet.
- **El formulario pide nombre, correo y el desplegable de "¿cómo nos conociste?"**, que es lo que permite segmentar: la mayoría vendrán de LinkedIn, pero no todos. **Ese campo y los UTM se validan mutuamente**, igual que ya pasó el 10/08 con el `origen: newsletter` del que vino del correo 0.
- **El consentimiento de newsletter es obligatorio ahí, y esa página es la ÚNICA donde lo es** (`lead-magnet-web §3b`): en un gate de recurso o en `/agendar/` la casilla siempre es voluntaria, porque obligar a suscribirse para descargar otra cosa convierte peor y además es consentimiento agrupado, que por RGPD no vale. En `/correo/` sí, porque ahí el servicio que se pide **es** el correo. Consecuencia buena para nosotros: todo el que entra por esta vía es alta limpia y querida, no hay que filtrar después.
- ⚠️ **Al planificar una tanda, estos NO son la base fría del CRM**: han pedido el correo ellos. Van a su propio grupo y no se mezclan con los grupos de origen del warm-up.

### 🔴 LOS UTM SON DE LA CUENTA, NO DE LA CAMPAÑA (Mario, 2026-08-10)
El rastreo de enlaces vive en **Configuración de la cuenta → Rastreo del enlace**, y sus tres campos se inyectan en **TODAS** las campañas. Si no se tocan, el correo nº 2 llega a GA4 con el `utm_campaign` del correo nº 1 y los datos se mezclan sin que nadie lo note.

- `utm_source` = `newsletter` y `utm_medium` = `email` — **fijos, no se tocan nunca.**
- `utm_campaign` = **el CORREO**, en kebab-case (`kaixito-01-segmentar`). **Se cambia cuando cambia el correo, NO cuando cambia la tanda:** las tandas son el mismo correo y deben agregarse juntas en GA4.
- `utm_content` = **la tanda** (`tanda-2`). Así GA4 agrega por campaña y deja desglosar por tanda. Es el campo que estaba vacío y resuelve el conflicto.
- **Va al checklist de pre-envío (§9b, punto 12): antes de CADA envío, comprobar que `utm_campaign` es el del correo que se manda.**
- ✅ Funciona de punta a punta, verificado el 2026-08-10: el formulario de `recursos.neety.com` recogió `origen: newsletter` y `cómo nos conoció: email` de una persona que vino del correo 0. **El campo `origen` del formulario y los UTM del enlace se validan mutuamente.**

### Cómo se monta la tanda N (probado el 2026-08-10)
**El cupo se hace con un GRUPO; la exclusión, con el selector de destinatarios de la campaña.** No hace falta calcular a mano quién ya lo recibió:
1. Crear el grupo `warmup-tanda-N` (vacío).
2. En Suscriptores, filtrar por el grupo origen y **añadir al grupo N páginas enteras** (100 por página). Da igual si caen repetidos de tandas anteriores.
3. Duplicar la campaña anterior y en destinatarios: **incluir** `warmup-tanda-N` y **excluir** `warmup-tanda-1…N-1`, `testers` y los grupos de origen conocido. MailerLite resuelve el solape solo.
4. Verificar el contador antes de enviar: saldrá algo menos que el cupo, y esa diferencia son los repetidos que ha quitado.
- ⛔ **Los `testers` NO se incluyen a partir de la tanda 2:** ya lo recibieron y falsean el denominador (en la tanda 1 fueron 5 de 54, un 9% de la muestra).
- ⚠️ **Los segmentos por API no aplican la exclusión de grupos.** Se probó `not_in_all` sobre `groups` y el segmento salió con la lista entera (1.310 en vez de ~1.236). Si hace falta un segmento con exclusiones, se configura en el panel.

### ⛔ LA VERIFICACIÓN GRATUITA DE LISTAS NO SIRVE PARA NUESTRO CASO (probado el 2026-08-10)
Se comprobaron por DNS los 71 dominios únicos de la tanda 2 buscando dominios muertos (sin MX ni A). **Resultado: 1 de 71.**
- **Por qué:** en una lista de un CRM de hace un año los rebotes NO son dominios caídos, son **buzones que ya no existen porque la persona cambió de empresa**. El dominio sigue vivo y respondiendo. Detectar eso exige verificación SMTP a nivel de buzón, que es justo lo que cobran los servicios.
- **Lo gratuito que SÍ vale la pena hacer siempre (y es gratis):** sintaxis, dominios desechables (`qvmao.com` y similares), y direcciones de rol (`marketing@`, `info@`) — MailerLite ya rechaza estas últimas al importar.
- **Recomendado: MailerCheck**, que es de los mismos que MailerLite y por eso entra sin exportar CSV. **0,01 $ por correo, mínimo 1.000 (10 $), los créditos no caducan** y da 10 gratis de prueba (verificado en su web el 2026-08-10). Las alternativas gratuitas (ZeroBounce 100/mes, y 100-500 créditos de alta única en el resto) obligarían a registrarse en cinco sitios para cubrir 1.000 y devolverían criterios distintos: no compensa por 10 $.

### 🔴🔴 LA LISTA DE SUPRESIÓN PERMANENTE — se monta ANTES que nada (2026-08-11)
**Antes de importar un solo contacto a cualquier plataforma, se crea un grupo de EXCLUSIÓN y se excluye en TODAS las campañas, sin excepción.** No se decide caso por caso ni se confía en acordarse.

Qué entra, por orden de gravedad:
1. **CLIENTES ACTUALES.** Mandarle a un cliente un correo que dice *"no sé de qué te conozco"* es el peor error posible: el cliente no se da de baja, llama al comercial. Pasó el 2026-08-11 con **Fagor Automation** (`ahernandez@fagorautomation.es`, 4 clics: probablemente alucinando de que no le reconociéramos) y se evitó por poco con **Telpark**.
2. **Los que se dieron de baja.** Requisito legal, y reimportarlos es la vía más rápida a otro baneo.
3. **Los rebotados.**
4. **Prospectos en conversación comercial abierta**, que tampoco deben recibir correo de lista fría.

⛔ **Y el aviso de método: la lista de clientes NO la puede reconstruir Claude.** Los 5 nombres que aparecen en `project-personas-clientes` (Fagor Automation, Telpark, OJMAR, Arania, Betsaide) salieron de UN post de Iker, no de la cartera. **Cualquier cliente que no saliera en ese post es invisible para mí.** Hay que exportarla del CRM y pedirla explícitamente. Es exactamente el mismo principio que las menciones: lo que no se puede verificar, se pregunta (`§7`).

⚠️ **Y no basta con el dominio.** `p.carbonell@telpark.com` se pilla por dominio, pero un contacto de un cliente con Gmail personal no. La exclusión fiable sale del CRM cruzando por EMPRESA, no por cadena de texto en el correo.

### ⛔ EL DOMINIO DEL CORREO NO DICE EL PAÍS (medido el 2026-08-10)
Sobre los 151 candidatos a la tanda 2: **85% no da ninguna señal de país** (56% gmail/hotmail/outlook/icloud + 29% dominios `.com`/`.io`/`.ai`). Solo 9 eran `.es` y 13 LatAm.
- **Corolario: el ICP de una lista NO se puede segmentar por el correo.** El país sale del CRM (HubSpot), y si el CRM no lo tiene, no se tiene. **Priorizar por afinidad exige enriquecer antes.**
- 🔴 **Y el error de método que lo destapó: afirmé "buena parte de la lista es LatAm" de un vistazo, sin contar.** Eran 13 de 151. **Ninguna composición de lista se afirma sin contarla**, igual que no se escribe una cifra sin fuente (`§7`). Si el conteo cuesta una llamada, se hace la llamada.
- **Lo que sí se hace mientras tanto:** en las tandas de calentamiento van primero los más afines que se puedan identificar, y los claramente fuera de ICP se dejan para la última. No por entregabilidad, sino porque **calentar con gente que no va a abrir desperdicia el envío**.

### 🔴🔴 DARLE A ENVIAR NO ES HABER ENVIADO — `needs_manual_content_review` (3 de 3 envíos)
Al pulsar enviar, MailerLite pasa la campaña a **Bandeja de salida** y la pone **"en revisión"**, y de ahí vuelve a Borradores. Solo se descubre recargando el panel: aparece un *"perdón por la demora"* con la opción de enviar ahora o reprogramar.

**⭐ CAUSA REAL, identificada por API el 2026-08-11 (antes estaba mal apuntada como un fallo de la plataforma):**
```
warnings: ["needs_manual_content_review"]   is_stopped: true   can_be_scheduled: false
```
**Es una RETENCIÓN DE CUMPLIMIENTO: una persona de MailerLite tiene que aprobar el contenido a mano.** No se cae por tardar y no es un bug.
- ⛔ **Dos teorías descartadas:** (a) que sea un fallo técnico y (b) que se caiga porque la revisión tarda más que el "enviar ahora" y se pasa la hora. La campaña no caduca: **la retienen**.
- ⛔ **Programar NO lo esquiva:** con una revisión pendiente, `can_be_scheduled` está a `false`. Un programado retenido pierde su ventana igual, y encima te enteras tarde.
- **Por qué pasa:** cuenta nueva escalando volumen rápido (54 → 137 → 337) con lista recién importada. Es el patrón que dispara la revisión en cualquier ESP.
- ✅ **LA SOLUCIÓN NO ES CONVIVIR CON ELLO: se le pide a soporte que apruebe la cuenta.** Argumentos que valen: lista propia, doble opt-out visible, 0 denuncias de spam en 191 envíos. Se resuelve en horas y deja de pasar.
- **Si nadie recarga, el correo no sale y no hay ninguna notificación.** En la tanda 2 costó 20 minutos: se pulsó a las 11:30 y salió a las 11:51.
- **⛔ REGLA: siempre que Mario diga que va a enviar o que ya ha enviado, se le avisa de que lo verifique, y se comprueba por API en el momento.** No es opcional y va en la misma respuesta.
- **Cómo se comprueba:** `get_campaign` → `status` debe ser `sent` (o `ready` con `scheduled_for` si es programado), más `queued_at` y `started_at` con hora real. Un `status: draft` después de darle a enviar significa que se cayó.
- **Con los programados el riesgo es peor:** si se cae uno puesto para el día siguiente, te enteras cuando ya ha pasado la hora. **Todo programado se verifica el mismo día del envío.**

### Una campaña = un envío
Una campaña **solo se puede enviar una vez**. Cada tanda es una campaña distinta: se nombra `… Tanda 1`, `Tanda 2`, y **la siguiente se DUPLICA de la anterior** (arrastra idioma, texto plano, UTM y pie ya resueltos). 🔴 Lo único que hay que cambiar al duplicar es el **grupo de destinatarios**, y verificar el contador antes de enviar.

### Lo que sí funcionó a la primera
El correo llegó a **bandeja Principal de un Gmail externo**, ni Promociones ni Spam. No fue suerte: texto dominante, **un solo enlace**, sin plantilla de marketing con botones ni banners, tono personal y dominio autenticado. **Es la validación del formato que define esta skill.**

---

## 10 · Huecos pendientes (preguntar, no adivinar)

- [x] ~~Herramienta de envío: MailerLite~~ **CANCELADA el 2026-08-11 (`§0b`). Migrando a Brevo, ver `§0c`.**
- [ ] **Subdominio de envío para Brevo** (`mail.neety.com` o similar): pendiente de que Iker confirme quién tiene acceso al DNS de neety.com para meter los registros. Es el bloqueante nº 1 de la migración (`§0c`).
- [ ] **Firma-mantra** de la casa (ver §3.7): decisión de marca.
- [ ] **Tokens de personalización** ({nombre}…): depende de la herramienta elegida y de qué campos tenemos (muchos contactos son solo un correo).
- [ ] **Etiqueta `newsletters` en el Gmail** de Iker para que el análisis periódico del corpus (§8) sea un filtro limpio.
- [ ] 🔴 **FOTO DEL REMITENTE — avisar a Mario en CADA correo hasta que se resuelva (pedido por él, 2026-08-06).** Hoy los correos salen con la inicial genérica de Gmail en vez de un icono. **Dos caminos distintos según el tipo de envío, aclarado el 2026-08-18:**
  - **Envío MASIVO (newsletter, por Brevo/MailerLite):** no se arregla subiendo una imagen a la herramienta. Es **BIMI**, y requiere DMARC en modo estricto (`p=quarantine` o `p=reject`), un registro DNS de BIMI y un **certificado de pago de 650-1.100 $/año** que tarda 1-3 semanas. Cuando se haga, va el **ISOTIPO, no Kaixito**: BIMI se aplica **por dominio**, así que el mismo logo saldría en todos los correos de `neety.com`, incluidos los comerciales de los founders.
  - **Envío INDIVIDUAL (prospección, respuestas a mano, uno a uno):** SÍ funciona con **Google Workspace**, gratis, si `@neety.com` ya está en Workspace. Requiere que esa dirección sea una **cuenta real**, no un alias (un alias hereda la foto de quien lo gestiona, no tiene la suya). Se sube la foto en `myaccount.google.com`, y solo se ve cuando el correo sale directo de Gmail/Workspace — nunca en un envío por lotes de un ESP, porque ese correo no pasa por la infraestructura de Google y Gmail no consulta el perfil del remitente. Tarda de horas a un par de días en propagar y no está garantizado con un desconocido sin interacción previa.
- [ ] **Kaixito:** confirmar cómo se presenta (¿remite desde kaixito@neety.com?).
- [ ] **Export del Google Chat de feedback de producto** (dolores reales de clientes en demos/reuniones): cuando llegue (vía Google Takeout, ZIP al Escritorio), se destila a `docs/skills/dolores-clientes.md` y pasa a ser LA fuente del echo marketing (§5) para emails, posts y spam ninja. Hasta entonces, los dolores salen de `aboutme §1b` (tabla de contrastes) y de lo que cuente Iker.
