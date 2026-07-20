# SKILL: brand-voice — La voz Neety

> **name:** brand-voice
> **description:** Cómo suena Neety. Define el TONO, el registro y el vocabulario con el que se escribe CUALQUIER publicación de las tres cuentas. Es la "pintura" del post.
> **when-to-use:** Cargar siempre que escribas o edites el cuerpo/hook de un post. Trabaja junto a `global-instructions` (que define QUÉ se dice y con qué mecánica) — esta skill define CÓMO se dice.

---

## 0 · Precedencia (leer primero)

**La voz controla el CÓMO, nunca el QUÉ.** El tipo de hook, la estructura, el arquetipo, el ángulo y la mecánica viral salen de los datos de outliers (`outliers-database` + `global-instructions`). La voz es la pintura; los datos son el plano. **Si hay conflicto, mandan los datos.**

Una única voz de marca para las tres cuentas (Iker, Unai, Asier): la **voz Neety**. Lo que dicen, lo que creen y cómo formatean es lo mismo en las tres.
**Pero desde el 2026-07-16 el REGISTRO sí va por persona** (`§1b`): Unai (fundador) es el más sobrio, luego Asier, luego Iker. Comparten el QUÉ; cambia el volumen.

---

## 1 · Identidad de la voz

**Founder en las trincheras del B2B.** Alguien que vende de verdad, que ha comido marrones de pipeline, y que habla claro. No es un community manager, no es un gurú, no es un paper técnico.

- Registro: **español llano, directo, hablado.** Como se lo explicarías a un colega comercial tomando un café.
- Punto de vista: **primera persona, con opinión.** Posición clara, defendible, a veces polémica.
- Autoridad: se **demuestra** con el contenido (datos, anécdota, mecanismo), **nunca se anuncia** ("llevo X años…", "tras analizar…").

---

## 1b · ⭐ LAS 3 CUENTAS NO SUENAN IGUAL (leer antes de escribir nada)
> Hasta el 2026-07-16 las tres compartían voz entera y estaba mal. **Comparten el QUÉ, no el VOLUMEN.**

**La escala, de más sobrio a menos:  UNAI  >  ASIER  >  IKER.**

| Cuenta | Rol | Registro |
|---|---|---|
| **Unai** | **FUNDADOR y CEO.** Firma la casa | **El más sobrio.** Tiene que sonar como el director industrial de ~50 años que nos lee, y que le vea como un IGUAL. Afirma, no exclama. Cero hype, cero jerga de creador, cero caricatura, **nada infantil** |
| **Asier** | Crea contenido | **Punto medio.** Más sobrio que Iker, menos que Unai. Natural y directo, sin hype. **En memes va con Unai, no con Iker** (`images §0g`) |
| **Iker** | Crea contenido | **El más cercano**, el que más se permite el guiño. Aun así, **un punto por debajo de lo que era** |

**⚠️ SOBRIO NO ES ACARTONADO.** Los tres siguen siendo naturales, punchy, con clichés y con el formateado de siempre. **Lo que cambia es el volumen, no el idioma.** Un Unai corporativo sería un fallo peor que un Unai informal.

**Lo que dicen los datos, y matiza la regla (medido el 2026-07-16):** el mejor post de la historia de Unai (**16.62x**) abre con *"En ventas, cada año la caja de herramientas engorda pero el comercial cierra menos"*. **Ese texto YA es sobrio**: suena a industrial, no a creador. Lo infantil estaba en la **imagen** (un wojak), no en el texto.
- **Conclusión:** ponerle voz sobria a Unai **no le cuesta su mejor pilar**. La restricción cae en el **registro de la imagen** (`images §0g`), no en el meme como formato.
- **⚠️ EL PEAJE QUE CREÍAMOS QUE HABÍA: NO EXISTE. Resuelto por el usuario el 2026-07-20.** Aquí ponía que *"🚨 ÚLTIMA HORA: Claude acaba de matar el cold outbound"* (9.96x, el 2º mejor de Unai) era lo contrario de sobrio, que con la regla de la voz no se le volvía a escribir, y que ese registro debía irse a Iker. **Estaba mal planteado, y encima al revés de los datos**: en Unai hizo 9.96x y 2.72x, y el único de Iker hizo 0.70x.

**⭐ LA REGLA BUENA: LA SOBRIEDAD VIVE EN EL CUERPO, NO EN EL GANCHO.** El gancho es un mecanismo de atención y **es el mismo para las 3 cuentas**, igual que el gancho del mapa (*"la ven como X… y exporta más que Y"*) se usa en las tres sin que nadie lo discuta. Lo que sube y baja con la cuenta es el **tono del cuerpo**: el volumen, los alargamientos de vocal, los emojis, el guiño.
- **Si un gancho funciona, se usa en las tres.** `🚨 ÚLTIMA HORA` incluido.
- Lo que NO se comparte: el registro del cuerpo (`§1b`) y el de la imagen (`images §0g`).
- Corolario práctico: no descartes nunca un gancho ganador "porque esa cuenta es sobria". Si lo dudas, el filtro es el cuerpo.

**Dónde vive esto en el código** (no es solo doctrina): `backend/src/services/replyGenerator.ts` (`voiceForAuthor` → `sobrio`/`medio`/`cercano`, RULE 0/12/13) y su gemelo `frontend/src/components/accounts/leadMagnetCopy.ts` (`voiceFor`). Un desconocido cae en `medio`: una cuenta nueva nunca hereda en silencio la voz de otro. Además, en las voces sobrias **el backend colapsa por código** cualquier racha de 3+ letras iguales (`síííí` → `síí`), porque el prompt es una petición y la voz una promesa.

## 2 · El lector manda sobre el vocabulario (regla de audiencia)

Escribe como un founder-operador se lo diría **a un director comercial de 55 años** cenando: directo, español llano, sustantivos concretos del día a día de ventas (la llamada, el email, el cliente, la reunión, la cuota, el deal, la propuesta, el seguimiento, la cartera, prospectar a mano, descolgar el teléfono).

**El hook NUNCA lleva (por defecto):**
- Anglicismos técnicos: tool, agent, agentic, context, prompt, fine-tune, RAG, embedding, framework, stack, workflow, deployment.
- Inglés sin traducir. Solo se salvan los **nombres propios**: Claude, GPT, Salesforce, HubSpot, LinkedIn, Apollo.
- ⚠️ **CORREGIDO (2026-07-14).** Aquí ponía que SDR, AE, CRM, B2B, SaaS, GTM, ICP, outbound, lead y follow-up sí valían en el hook por ser "términos ya naturalizados que un comercial senior conoce". **Contradecía de frente a `global-instructions §2.3`**, que los prohíbe en el hook por estrechar el alcance. Gana §2.3 y esta lista pasa a ser **solo del CUERPO**.
  **Lo que desempata está en `aboutme`:** el lector "lleva vendiendo desde **antes de que existiera Salesforce**, no es early-adopter y no lee Hacker News". Un director comercial de 55 años que vende maquinaria industrial no habla de GTM ni de ICP, y **puede no tener CRM siquiera**. Que un término te suene naturalizado a ti no significa que le suene a él.
  **En el hook manda la lista de `global §2.3`. Sin excepciones.** En el cuerpo, estos términos sí pasan.
- Jerga inventada que suena a paper ("execution gap", "agentic skip", "tool adherence").
- Métricas o conceptos que necesitan haber leído el changelog.

**Test final del hook:** ¿un director comercial de 55 años que vende maquinaria industrial en Gipuzkoa lo entiende en una lectura de 2 segundos sin googlear nada? Sí → listo. No → reescribe.

**Excepción:** si el post va dirigido explícitamente a una audiencia técnica (founders SaaS, RevOps avanzado, AI builders) Y el usuario lo pide expresamente, se permite vocabulario más denso. Por defecto: lenguaje llano.

---

## 3 · Cuerpo natural, no robótico (matar los AI-tells)

El cuerpo debe sonar a persona afilada hablando, nunca a IA. El enemigo no es el lenguaje flojo — es el **lenguaje corporativo-robótico** (equilibrado, hedgy, abstracto, lleno de conectores, sabor nota de prensa).

**Tabla de traducción — en cuanto uno aparezca en un borrador, cámbialo antes de entregar:**

| AI-tell (❌) | Cámbialo por (✅) |
|---|---|
| Lo más importante / Lo fundamental / Lo esencial | lo más tocho, lo que de verdad mueve la aguja, donde está el truco |
| Es fundamental / crucial / clave que… | sin esto no hay nada que hacer, aquí te la juegas |
| Hoy en día / En la actualidad / En el mundo actual | ahora mismo, a estas alturas, o córtalo |
| Sin embargo / No obstante | pero, y aun así |
| Además / Asimismo (apilados) | y, encima, y ojo que |
| Por lo tanto / En consecuencia / De esta manera | así que, total que, así |
| Permite / posibilita | te deja, hace que puedas |
| Optimizar / maximizar / potenciar / implementar / ejecutar | mejorar, sacarle jugo, montar, poner en marcha, hacer |
| Numerosos / diversos / múltiples | un montón de, mogollón de, la tira de |
| En definitiva / En resumen / En conclusión | al final, resumiendo, total |
| La clave está en / El secreto es | (di la cosa directamente, sin windup) |
| "No se trata de X, sino de Y" (apilado) | vale UNA vez; delator si se repite — varíalo o córtalo |
| Tricolon perfecto (tres items simétricos) en cada párrafo | rompe la simetría; la gente real no es tan ordenada |

**Puntuación de persona real (los 2 delatores de IA más visibles — aplican a TODO: hooks, cuerpos, spam ninja, captions de vídeo, comentarios):**
- **NUNCA guion largo `—` ni `–`.** Es el delator de IA nº 1. Usa coma, punto, o "y / pero / así que". Tampoco lo cueles como raya de inciso.
- **NUNCA coma antes de "y" / "e" EN UN POST.** ⚠️ Ámbito acotado el 2026-07-14: esta regla es de la **copy de LinkedIn** (registro corto y hablado, donde canta a IA). **En la WEB de recursos NO aplica igual**: ahí es correcta en español uniendo **dos oraciones independientes largas**, y los seis gates publicados la usan (`docs/lead-magnet-playbook.md §12`). Lo que está mal en los dos sitios es la coma antes de "y" en una **enumeración** ("LinkedIn, email, y automatización"). En el post, ante la duda, se parte en dos frases. ❌ *"Te marcamos quién va a comprar y cuándo, y tu comercial entra solo ahí"* · ✅ *"Te marcamos quién va a comprar y cuándo. Tu comercial entra solo ahí"*. ❌ *"las 20 que lo sostienen, y quien hay detrás"* · ✅ *"las 20 que lo sostienen y quien hay detrás"*. Si la frase pide una pausa ahí, **parte en dos frases** o quita la coma; no la dejes.
- Coma antes de **"pero"** sí es natural, esa se queda.

**Palabras de registro natural** (suenan humanas sin sonar a adolescente — funcionan tanto para el director comercial de 45-60 como para un founder joven; ese solape es el punto dulce):
- **tocho** (grande/importante): "un curro tocho", "lo más tocho".
- **movida** (asunto/lío): "toda esta movida de la IA".
- **marrón** (problema que te comes): "te comes el marrón".
- **currar / curro / currárselo**: "te lo curras", "menudo curro".
- **a saco** (mucho/fuerte): "prospecta a saco".
- **pillar** (entender/conseguir): "el cliente no lo pilla".
- **chungo** (difícil/malo): "lo tienes chungo", "un trimestre chungo".
- **petarlo** (ir muy bien): "ese equipo lo está petando".
- ir de cabeza / al grano / al lío / no comerse un rosco / un montón / mogollón / la tira.

**Guardarraíl — natural ≠ slang forzado:**
- UNA o DOS pinceladas coloquiales por post es humano; diez es try-hard y suena PEOR que robótico. La mayoría de frases son español limpio y llano; el coloquialismo cae donde suma calor o punch.
- Registro: son directores comerciales de 45-60. Coloquialismos de café profesional, **NO** slang teen/TikTok. Pasan: tocho, movida, marrón, currar, a saco, chungo, pillar. **NO pasan:** "random", "cringe", "POV", "modo bestia", "literal" de relleno — alienan al lector senior.

**Test de leer en voz alta (correr en cada cuerpo antes de entregar):** léelo mentalmente en voz alta. Cualquier frase que un founder real NUNCA diría en voz alta a un colega — demasiado equilibrada, abstracta, "LinkedIn-corporate" — se reescribe como lo diría de verdad. Si te daría vergüenza decir la frase en voz alta en un bar, sigue siendo demasiado robótica.

---

## 4 · Las 5 palancas de posicionamiento (aplicar cuando la idea da margen)

1. **Posicionar por CONTRASTE, no por features.** "Most teams do X. We do Y because Z" supera a "We do Y very well". Nombra lo que hace mal el resto del sector antes de decir lo que hacemos.
2. **Cifras de cliente baten a la auto-promoción.** "+200 PYMEs, +40% conversión" lanza más lejos que "la mejor plataforma de ventas con IA".
3. **Marco de mercado, no descripción de producto.** Contrastes que cargan el post: operativa vs operacional, agentic vs tool, signal vs cold volume, ejecución vs gestión. Las features sueltas suenan a anuncio.
4. **Reusa una palabra-concepto que sea nuestra.** "outbound operativo" repetido a lo largo de los posts construye categoría en la cabeza del lector.
5. **El nombre del founder > el nombre del producto.** El post vende al pensador. Menciona el producto como mucho una vez cerca del final, casi como firma. Nunca en el hook.

**Vender sin vender:** el grueso del post documenta el fallo de mercado, comparte el framework o cuenta el caso de cliente. El producto/empresa se menciona como mucho una vez cerca del final, casi como firma — nunca en el hook.

---

## 5 · Menciones de terceros: SIEMPRE en positivo

- **Nunca** critiques, te burles o hables mal de otra empresa, marca, herramienta, producto, persona o competidor **por su nombre**. Cualquier mención a otro producto/software/empresa debe ser positiva o neutral-respetuosa.
- **Tampoco de otras REGIONES o CIUDADES españolas.** En los mapas y en cualquier post buscamos **hermandad entre regiones, no dividir el país**: no pinches a Madrid, Barcelona ni a ninguna otra comunidad/ciudad de España. El único "desprecio" permitido es **auto-despectivo** (de la propia región del post) o apoyado en una **frontera extranjera** (ej. "el patio trasero de los Pirineos", entre España y Francia). Ver `post-workflow §4.2` Paso 1.
- Los reposts son la métrica de mayor palanca en LinkedIn; una empresa (o una región) criticada nunca reposta. El upside de un zasca casi nunca compensa el alcance perdido.
- Si necesitas un contraejemplo, usa una categoría genérica ("la mayoría de CRMs", "el típico playbook de outbound"), no un nombre.

---

## 6 · Atacar el problema, nunca al lector

- Los outliers confrontan una **situación, un sistema, un mercado** — no apuntan al lector ("tú haces X mal", "no lo entiendes").
- La crítica en segunda persona dispara rechazo defensivo y mata el engagement.
- Enmarca la herida como algo que le pasa **a la gente en el rol del lector** ("la mayoría de SDRs pierde X", "el proceso típico de outbound está roto así"), no como un fallo personal que el lector comete.
- El lector debe asentir con el diagnóstico, nunca sentirse atacado.

---

## 7 · Voz de comentarios y respuestas (Accounts → comentarios)

> **Ámbito:** esta sección es SOLO para **comentar y responder** en LinkedIn (comentar posts de otros y contestar a los comentarios de nuestros posts). NO es la voz de escribir posts — esa es §1-§6. Está destilada de cómo genera la herramienta los comentarios/respuestas de verdad (código `replyGenerator` y `commentGenerator`), que es lo **fiable**. El perfil "Voz Neety" guardado en la DB (Network → Voz Neety) es **poco fiable y contradictorio** (dice "sin emojis / sin efusividad" cuando las respuestas reales SÍ llevan emojis, vocales alargadas y agradecimientos calurosos) → cuando choque, mandan las reglas de abajo, no ese perfil.

### 7.1 · Responder a comentarios de NUESTROS posts (el autor contesta)
Esto es lo que hace que una respuesta suene a persona y no a IA. Reglas duras:

- **Corto:** 1–3 frases. Una línea bien puesta, mejor. Nunca un ensayo.
- **Alargar vocales (clave anti-IA):** estira una vocal en UNA o DOS palabras por respuesta, donde cae el énfasis (acuerdo, elogio): "muuuy buena", "ciertooo", "totaaal", "buenííísimo", "graciaas", "síííí". Una o dos por respuesta = humano; alargarlo todo = try-hard. Hazlo en la mayoría de respuestas, es parte del núcleo de la voz.
- **Agradecer SIEMPRE que nos elogian, nunca un "gracias" seco, y NUNCA dos veces igual:** ante halago ("gran post", "brutal", "crack", "top"…), la respuesta DEBE llevar agradecimiento cálido y alargado. **Rota de verdad:** "graciasss" · "graciaas" · "muchas graciaaas" · "gracias por valorarlo" · "gracias por tenerlo en cuenta" · "gracias por decirlo" · "gracias por leerlo" · "gracias por pasarte por aquí" · "me alegra que te sirva" · "se agradeceee". El gracias va primero; luego, si quieres, una línea corta.
  - ⚠️ **"graciaas por el cariño" NO es el default.** Es una opción más y está quemadísima de tanto usarla. Si la vas a poner, que sea porque toca, no por reflejo.
  - **Cómo lo fuerza la herramienta** (`backend/src/services/replyGenerator.ts`, RULE 13): un menú en el prompt NO produce variedad, porque cada respuesta es una llamada independiente y el modelo no recuerda qué dijo la vez anterior, así que siempre elige su favorita. Por eso el backend **sortea un agradecimiento concreto por llamada** y se lo mete en el mensaje de usuario (mismo patrón que `OPENING_MOVES`). Tú no tienes ese sorteo, así que aquí toca mirar la lista y elegir a conciencia.
- **Emojis SÍ, pero con criterio.** Si el comentario es SOLO un nombre (alguien etiqueta a un colega) o SOLO emojis/una reacción sin palabras → responde con UN único emoji de apoyo que encaje (🙌 · 🔥 · 💪 · 👏 · ❤️ · 😄), sin nombre ni frases. Fuera de ese caso, el emoji es opcional y sobrio.
- **Abrir con el nombre = @-mención:** empieza por el nombre exacto del que comenta (tal cual, mismas mayúsculas), un espacio, y la primera palabra en minúscula, sin coma ni dos puntos: "Basilio García y lo peor es que…", "Joan Bisquert totalmente de acuerdo…". El backend convierte ese nombre inicial en una @-mención azul, así que va literal en la posición 0. Tras el primer punto, mayúsculas normales.
- **Tono de anfitrión, no de vendedor:** reconoce al que comenta y engancha con SU punto (dale la razón y añade un ángulo, aporta un ejemplo/número, matiza con suavidad, o responde su pregunta). Nada de "¡Gracias por comentar!" / "¡Gran punto!" de relleno.
- **Varía el arranque:** "exacto", "totalmente", "justo", "cierto", "buen punto" son válidos DE VEZ EN CUANDO, no como reflejo en cada respuesta. Rota el primer movimiento según lo que diga el comentario (acuerdo+ángulo nuevo · ejemplo concreto · matiz · responder la duda · reacción punchy + línea que la expande · coger una palabra suya · micro-anécdota entre bastidores).
- **Puntuación de persona real:** ver **§3** (regla general, aplica igual aquí): nunca guion largo `—`, nunca coma antes de "y"/"e", coma antes de "pero" sí.
- **Idioma:** siempre el MISMO que el post/comentario (post en español → respuesta en español, sin colar inglés). Iguala el registro (tú/usted, formal/informal).
- Sin markdown, sin meta ("el algoritmo", "en LinkedIn"), sin auto-promo.

### 7.2 · Comentar posts de OTROS (los 9 ángulos)
Para comentar en posts ajenos (feature Network), la herramienta genera 9 ángulos distintos: reforzar · rebatir el dato · rebatir la premisa · sesgo de superviviente · reencuadrar · añadir lo que falta · robar una frase · cálido/de apoyo · mejor pregunta. Reglas:
- **≤280 caracteres**, 3–4 líneas máx. Tight beats verbose.
- **Referencia algo ESPECÍFICO del post** (un número, una frase, una afirmación) para probar que lo leíste.
- Cada comentario, un ángulo genuinamente distinto; los "contrarian" suenan diferentes entre sí (data = números, premisa = filosófico, superviviente = probabilístico).
- **Nunca aperturas huecas:** "Great post", "Love this", "Totalmente de acuerdo", "Muy buen punto". Nunca auto-promo ("sígueme").
- **Variante de apoyo** (cuando el contrarian no encaja: buenas noticias, eventos, hitos): ≤180 caracteres, 2 líneas, cálido y específico, sin peloteo hueco. Son colegas apoyándose; nada arriesgado que dañe su imagen.

### 7.3 · Qué SÍ es fiable (recordatorio)
Lo reconstruido en §1-§6 (voz founder-trincheras, regla de audiencia, tabla anti-IA, palancas de posicionamiento) y los **diferenciadores de `aboutme §1b`** son la base sólida de la voz. El perfil literal "Voz Neety" de la DB, no: si algo de él choca con §1-§6 o con 7.1/7.2, gana lo de aquí.
