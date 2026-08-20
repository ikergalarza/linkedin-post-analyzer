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

### ⛔ 2b · LOS ANGLICISMOS CON TRADUCCIÓN LLANA NO VALEN EN NINGÚN SITIO (Iker, 2026-08-07)
> **Y "ningún sitio" incluye las RESPUESTAS A COMENTARIOS**, que es donde saltó: Iker se puso a contestar desde la cuenta de Unai y la herramienta le metía `pipeline` a señores mayores. **El lector es el mismo lea un post o lea una respuesta**, así que la regla de audiencia manda igual en los dos.

**El fallo de la lista de arriba:** `pipeline` **no estaba en ella**, y encima esa lista era solo del HOOK. Yo mismo escribí *"su pipeline depende entero de gente que no controla"* en el cuerpo del meme de Unai del 06/08 y se publicó así.

**La frontera, que es lo que hay que tener claro:** no se prohíbe todo el inglés. Se prohíbe **el que tiene una traducción llana que el lector ya usa**. `CRM`, `B2B`, `SDR`, `lead` o `deal` no la tienen y siguen valiendo en el cuerpo; `pipeline` sí la tiene.

| ⛔ | ✅ |
|---|---|
| pipeline | la cartera · las oportunidades abiertas · lo que tienes en marcha |
| funnel | el embudo |
| forecast | la previsión |
| workflow | el proceso · la rutina |
| engagement | la respuesta · la interacción |
| insight | el hallazgo · lo que aprendes |
| pitch | el discurso · cómo lo cuentas |
| closing | el cierre |

**Test:** ¿lo diría un director comercial de 55 años que vende maquinaria y puede no tener CRM? Si la respuesta es que él diría "la cartera", nosotros decimos "la cartera". Mecanizado en `validar-post.py` (fallo duro, en TODO el texto) y en el prompt de `replyGenerator.ts`.

**Excepción:** si el post va dirigido explícitamente a una audiencia técnica (founders SaaS, RevOps avanzado, AI builders) Y el usuario lo pide expresamente, se permite vocabulario más denso. Por defecto: lenguaje llano.

---

## 🚨 2c · LENGUAJE DE RIESGO: LO QUE PUEDE HACER QUE LINKEDIN NOS CAPE (Iker, 2026-08-07)

> **⚠️ GLOBAL. Vale para CUALQUIER pilar y para el post entero**, aunque el gancho es donde más pesa porque es lo primero que lee el clasificador. Nace de dos publicaciones capadas el mismo día.

**QUÉ PASÓ, y lo que hay que aprender del método más que del caso.** El lead magnet del 06/08 hizo **67 impresiones en 24 h** y el resubido del 07/08 **19 en una hora**, con la mediana del corpus en 3.424. **Yo apostaba por la imagen** (el logo de LinkedIn dentro) y **me equivoqué**: se resubió con foto natural sin metadatos y volvió a caer. Iker apostaba por el texto desde el principio. **La imagen queda DESCARTADA con dos pruebas; el texto es lo único que queda en pie.**

**LAS FAMILIAS DE RIESGO, por orden de lo que yo considero más peligroso:**

| Familia | Ejemplos | Por qué |
|---|---|---|
| **1 · Alerta de noticia falsa** | `🚨 ÚLTIMA HORA`, `⚰️ D.E.P.`, `BREAKING` | Una sirena más un titular de última hora **es literalmente el patrón de la desinformación**. Y va en la primera línea. |
| **2 · Sorteo o chollo** | `regalo`, `gratis`, `sorteo`, `chollo` | Familia de estafa. `regalo` es además el elemento con **peor mediana de todo lo que medimos: 1.527 contra 3.424**. |
| **3 · Delito o documento legal** | `destapa`, `firma`, `denuncia`, `caso` | `destapar` suena a destapar un caso y `firmar` a papel legal. **Iker, y es buen criterio: si la palabra te da señal de algo ilegal a TI como persona, se la da al clasificador.** |
| **4 · Cebo de interacción** | `guarda esto`, `etiqueta a alguien`, `comparte si` | Pedir la interacción por la interacción. |
| **5 · Sacar gente a privado** | `te lo mando por privado`, `mándame un DM` | Mover tráfico fuera del feed. `te los paso` es más neutro. |
| **6 · 🆕 Inocente en España, vulgar en América** | **`coger` SIN objeto** (`es el que coge`), `polla`, `concha`, `pico`, `pijo` | **El clasificador de LinkedIn es de español GLOBAL, no peninsular.** Nosotros no la vemos porque nos suena bien: por eso la escribimos. Capó el meme del 19/08 a **133 impresiones**, y con el objeto puesto (`No me cogió el teléfono`) hicimos **192.303**. **El test: ¿esta palabra, sin el resto de la frase, significa otra cosa en México o Argentina?** Si sí, se le pone el complemento o se cambia (`descuelga`). Mecanizado como fallo duro. Caso entero en `post-workflow §4.5.0-PUERTAS` |

**⚠️ PERO OJO CON EL SESGO DE CONFIRMACIÓN, que aquí es fácil:** casi todos estos elementos **tienen precedente en posts nuestros que se repartieron bien** (`gratis` 15 posts sin ninguno bajo 500, `comenta`+palabra 25 posts con mediana 4.574, `ÚLTIMA HORA` 6 posts con mediana 4.855). **No hay ninguna palabra probada como culpable.** Lo que sí es nuevo es que los dos capados **apilan varias familias a la vez**. La hipótesis viva es la ACUMULACIÓN, no una palabra suelta.

**🔴 MATIZ MEDIDO EL MISMO DÍA, y degrada la familia 1: la alarma NO parece ser lo que capa.** Medidos los 50 últimos posts de Martín Arosa: sus **17 con alarma van de 29 a 1.958 comentarios** y 3 están por debajo de 100, así que **él tampoco gana siempre** —llevábamos el día comparando nuestros fracasos contra su top—. **Pero la diferencia decisiva es otra: sus malos FLOPEAN y los nuestros no se REPARTEN.** Su peor post con alarma tiene 29 comentarios, o sea miles de impresiones; el nuestro tuvo 19 impresiones. **Son dos fenómenos distintos**, y solo el segundo es un capado.
- Y a él la alarma le **ayuda**: mediana 177 con ella contra 146 sin ella, y 3 de 17 por debajo de 100 frente a 14 de 33.
- **La explicación que queda en pie es la CONFIANZA DE CUENTA**: historial, volumen y engagement propio. El mismo gancho no se juzga igual en una cuenta con miles de comentarios que en la nuestra.
- **Consecuencia práctica:** quitar la alarma sigue siendo lo que hacemos, **pero no porque esté probada culpable, sino porque es lo más barato de quitar sin perder fuerza** (`ahora` da la misma novedad). Si algún día la cuenta gana confianza, se puede volver a probar.

**CÓMO SE APLICA, sin volverse paranoico:**
- **En el GANCHO, cero familias de riesgo.** Ahí no se negocia: es lo primero que se lee y lo primero que se clasifica.
- **En el cuerpo, una como mucho**, y si se puede decir igual sin ella, se dice sin ella.
- **Antes de cambiar una palabra por sospecha, se mira en el corpus** (`§0a-CAPADO` de `images` tiene el procedimiento). El 07/08 Iker sospechaba de `prompt` y los datos dijeron que no —7 posts nuestros con ella bien repartidos y Martín Arosa la usa en 15 de sus 50 últimos—. **Se cambió igual, pero por AUDIENCIA (es un anglicismo, `§2b`), no por algoritmo.** Esa distinción es la que evita que acabemos con una lista de palabras prohibidas por superstición.
- **Y una marca de reciente basta**: `ahora` da la novedad sin la sirena (`post-workflow §4.5.0a`).

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

### 🗣️ 3b · UNA CITA SE ESCRIBE COMO LA ESCRIBIÓ QUIEN LA DIJO, NO COMO LA CORREGIRÍA UN EDITOR (Iker, 2026-08-17)

**Global: vale para cualquier pilar que meta una frase de otro** — la historia con su diálogo, el meme de captura documental, el correo del corpus, el mensaje del cliente.

**LAS DOS REGLAS, y las dos saltaron el mismo día:**

**1 · La cita va ENTRECOMILLADA.** Sin comillas, las líneas se leen como la voz del narrador y el lector no sabe que está leyendo un documento. Comillas **rectas** (`"…"`), que son las del móvil y las que ya usamos en el CTA del lead magnet; nada de angulares `«»`, que en LinkedIn cantan a texto importado. Si la cita ocupa varias líneas, se abre en la primera y se cierra en la última, **no una por línea**.
> ⚠️ Iker sobre esto: *"nunca soy fan de poner símbolos raros, pero yo creo que ese bloque lo pondría entre comillas"*. **Es la excepción consciente a su propia manía**, y por eso está escrito: las comillas no decoran, marcan de quién es la voz.

**2 · Y se puntúa como la puntuó QUIEN LA ESCRIBIÓ.** Aquí es donde se cuela la IA. Yo escribí *"**Hola, soy Iker** y vivo en el 7"* — la coma vocativa es **correcta en español**, y precisamente por eso está mal: **la escribió un crío de 15 años a mano en un papel, y un crío de 15 no pone la coma del vocativo.** Iker: *"parece un poco escrito por inteligencia artificial, dudo que un niño lo sepa escribir también"*. Queda `"Hola soy Iker y vivo en el 7."`.

**La regla de fondo, que es lo que hay que retener:** dentro de una cita, **la corrección gramatical NO es la vara. La verosimilitud lo es.** Una cita perfectamente puntuada delata que la ha escrito quien narra, no quien habla. Vale igual para una nota de un crío, un WhatsApp, un correo de un cliente o un tuit de una captura: se conserva su registro, sus faltas de puntuación y su desorden, exactamente como `post-workflow §4.4-ESENCIA` manda conservar las repeticiones del original.

**Y el límite, para no pasarse:** se relaja la **puntuación**, no la ortografía. Ni faltas de escritura ni erratas inventadas — eso ya no se lee como verosímil, se lee como descuido nuestro.

**⛔ 3b-BIS · DENTRO DE UNA CITA, EL ARTÍCULO Y LA MULETILLA SE QUEDAN. LA TIJERA ES DEL GANCHO (Iker, 2026-08-18).** `§2.2c` y `§2.9c` de `global` mandan tachar artículos y preposiciones que no aportan… **y eso vale para el GANCHO, donde cada carácter compite antes del "ver más". Dentro de una cita es al revés:** la palabra de relleno es justo lo que hace que suene a persona tecleando.

- **El caso:** el tuit del meme de Helena decía *"debería valer con mandarle hola????????"* e Iker metió el artículo: **`mandarle un hola????????`**. *"Así lo hace más informal"*. Tiene razón y es la misma lógica de arriba: nadie escribe `mandarle hola`, todo el mundo dice `mandarle un hola`. Sin el `un` la frase está **editada**, y una cita editada delata al que la escribió.
- **La familia entera, que es la que hay que reconocer:** el artículo indefinido delante de la palabra citada (`un hola`, `un gracias`, `un vale`), **el pronombre átono doblado** (`escribirle el correo al cliente`, no `escribir el correo al cliente`), el `que` de relativo, el `pues`, el `o sea`, el `es que`, el `total`. **En el gancho fuera; en una cita, dentro.**
  - ⚠️ **Lo del pronombre lo cazó Iker el mismo día** (*"en español se dice escribirle, ¿no?"*) y tenía razón: las dos formas son correctas, pero **el habla dobla el pronombre casi siempre** cuando el complemento es una persona, así que sin él la frase suena redactada. **Va desde el primer borrador.** En el tuit de Helena se quedó sin doblar y **no se reprocesó**, porque la imagen ya estaba cerrada y dos caracteres reflowean las tres líneas: el arreglo costaba más que el defecto (`images §0h-CHECKLIST-bis`).
- **El test:** léelo en voz alta como si lo estuvieras tecleando tú en el móvil. **Si te sale el artículo solo, va el artículo.**
- **Y no choca con acortar:** una cita corta sigue siendo mejor que una larga. Lo que no se recorta es **la palabra que hace que suene hablado**.

**Mecanizado** como aviso en `validar-post.py` (`AVISO: coma de vocativo tras un saludo`), que caza el caso concreto que falló.

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
- **⚠️ Si la palabra lleva TILDE, la tilde se QUITA al alargar (Iker, 2026-07-30):** `buenisiiimo` y `siii`, nunca `buenííísimo` ni `síííí`. Una tilde en medio de una racha de vocales parece una errata, no alguien escribiendo con ganas. Está metido en el prompt de los dos generadores (`replyGenerator` RULE 12 y `commentGenerator`).
- **Alargar vocales (clave anti-IA):** estira una vocal en UNA o DOS palabras por respuesta, donde cae el énfasis (acuerdo, elogio): "muuuy buena", "ciertooo", "totaaal", "buenííísimo", "graciaas", "síííí". Una o dos por respuesta = humano; alargarlo todo = try-hard. Hazlo en la mayoría de respuestas, es parte del núcleo de la voz.
- **Agradecer SIEMPRE que nos elogian, nunca un "gracias" seco, y NUNCA dos veces igual:** ante halago ("gran post", "brutal", "crack", "top"…), la respuesta DEBE llevar agradecimiento cálido y alargado. **Rota de verdad:** "graciasss" · "graciaas" · "muchas graciaaas" · "gracias por valorarlo" · "gracias por tenerlo en cuenta" · "gracias por decirlo" · "gracias por leerlo" · "gracias por pasarte por aquí" · "me alegra que te sirva" · "se agradeceee". El gracias va primero; luego, si quieres, una línea corta.
  - ⚠️ **"graciaas por el cariño" NO es el default.** Es una opción más y está quemadísima de tanto usarla. Si la vas a poner, que sea porque toca, no por reflejo.
  - **Cómo lo fuerza la herramienta** (`backend/src/services/replyGenerator.ts`, RULE 13): un menú en el prompt NO produce variedad, porque cada respuesta es una llamada independiente y el modelo no recuerda qué dijo la vez anterior, así que siempre elige su favorita. Por eso el backend **sortea un agradecimiento concreto por llamada** y se lo mete en el mensaje de usuario (mismo patrón que `OPENING_MOVES`). Tú no tienes ese sorteo, así que aquí toca mirar la lista y elegir a conciencia.
- **Emojis SÍ, pero con criterio.** Si el comentario es SOLO un nombre (alguien etiqueta a un colega) o SOLO emojis/una reacción sin palabras → responde con UN único emoji de apoyo que encaje (🙌 · 🔥 · 💪 · 👏 · ❤️ · 😄), sin nombre ni frases. Fuera de ese caso, el emoji es opcional y sobrio.
- **Abrir con el nombre = @-mención:** empieza por el nombre exacto del que comenta (tal cual, mismas mayúsculas), un espacio, y la primera palabra en minúscula, sin coma ni dos puntos: "Basilio García y lo peor es que…", "Joan Bisquert totalmente de acuerdo…". El backend convierte ese nombre inicial en una @-mención azul, así que va literal en la posición 0. Tras el primer punto, mayúsculas normales.
- **Tono de anfitrión, no de vendedor:** reconoce al que comenta y engancha con SU punto (dale la razón y añade un ángulo, lleva su idea un paso más allá en general, matiza con suavidad, o responde su pregunta). Nada de "¡Gracias por comentar!" / "¡Gran punto!" de relleno.
- **Varía el arranque:** "exacto", "totalmente", "justo", "cierto", "buen punto" son válidos DE VEZ EN CUANDO, no como reflejo en cada respuesta. Rota el primer movimiento según lo que diga el comentario (acuerdo+ángulo nuevo · llevar su idea un paso más allá · matiz · responder la duda · reacción punchy + línea que la expande · coger una palabra suya · atar su punto a algo que YA dice el post · nombrar la regla general de la que su comentario es un caso).
- **⛔⛔ CERO ANÉCDOTAS INVENTADAS, IGUAL QUE EN LOS POSTS (Iker, 2026-08-19).** Salían respuestas del tipo *"el otro día en una reunión un cliente me dijo…"*. **Eso no ha pasado.** Es el mismo innegociable de la casa —no inventar una empresa, una persona ni un dato— y aquí es **peor** que en un post: cualquiera puede preguntarte en el hilo quién era ese cliente, delante de todos, y no hay respuesta.
  - **⛔ Prohibido:** "el otro día", "la otra vez", "hace poco", "ayer", "la semana pasada", "en una reunión", "en una llamada", "un cliente me dijo", "tengo un cliente que", "conozco un caso", "justo esta semana me pasó".
  - **✅ Qué se hace en su lugar.** La respuesta se alimenta de lo que YA EXISTE: lo que dice el comentario, lo que dice el post, o una idea general **sin escena**. *"A los comerciales les pasa constantemente"* vale, porque es una observación y nadie te va a pedir la factura. *"El otro día un cliente me contó que le pasaba"* no vale, porque afirma un hecho concreto que no ha ocurrido.
  - **✅ Si hace falta un ángulo personal, que sea INCOMPROBABLE y sin escena:** "me ha pasado algo parecido", "lo vemos mucho", "es de las cosas que más repetimos". Sin fecha, sin sitio, sin personaje. (Es la misma salida que ya usaban los comentarios de apoyo, `§7.2b`.)
  - **Única excepción:** un hecho que esté ESCRITO en el post o que lo haya contado el propio comentarista. Eso se recoge sin problema, porque ya lo ha publicado él. Lo prohibido es que el hecho **nazca** en la respuesta. Lo mismo vale para las cifras (`§7.1`, regla de cifras).
  - **🔴 Y otra vez el prompt se lo estaba enseñando.** `replyGenerator` sortea un movimiento de apertura **obligatorio** entre ocho, y dos de ellos eran *"drop a tiny relevant anecdote or behind-the-scenes detail"* y *"build on their point with a concrete example or number"*. O sea que **una de cada cuatro respuestas tenía la ORDEN de inventarse algo**, y la de la cifra chocaba de frente con la regla que lo prohibía desde el 12/08. No era el modelo desviándose: era el prompt pidiéndoselo. Misma lección que con los dos puntos (`§7.1`) y con el guion largo (`§7.2b`): **cuando un tic sale siempre, búscalo primero en nuestro propio prompt.**
  - **Mecanizado** (`detectarInventos` en `replyGenerator.ts`): la respuesta generada se comprueba contra el post y el comentario, y si trae una escena o una cifra que no sale de ninguno de los dos, **se descarta y se vuelve a pedir** con el fallo delante, hasta 3 intentos. Si a la tercera sigue inventando, la herramienta **falla en vez de devolver texto**: mejor escribirla a mano que publicar un cliente que no existe. Una regla en el prompt es una petición; el que la hace cumplir es el detector.
- **⚠️ Apoyar NO es darle la razón a cualquier cosa (Iker, 2026-08-19).** El default de `§7.1` es apoyar, y vale para el 99% de los comentarios. Pero si el comentario es racista, machista, xenófobo, denigra a un colectivo o entra en terreno político o social inflamable, **no se le da la razón, no se le sigue la broma y no se le agradece el aporte**: eso lo firma una cuenta con nombre y apellidos, y un "totalmente de acuerdo" debajo de una barbaridad es nuestro. Respuesta corta, cortés y **neutra** que no valide lo dicho y no abra pelea, o quedarse en el agradecimiento seco por leer sin entrar en el fondo. Ante la duda, neutro.
- **Puntuación de persona real:** ver **§3** (regla general, aplica igual aquí): nunca guion largo `—`, nunca coma antes de "y"/"e", coma antes de "pero" sí.
- **⛔⛔ Y NUNCA DOS PUNTOS `:` EN UNA RESPUESTA NI EN UN COMENTARIO (Iker, 2026-08-12).** Es de la misma familia que el guion largo. Nadie que conteste un comentario desde el móvil monta una cláusula y luego anuncia el resto con dos puntos, pero el modelo lo hace todo el rato. **Se cambia por una coma, o se parte en dos frases cortas.** ❌ *"Lo caro no es eso: es dar con el que decide"* · ✅ *"Lo caro no es eso, es dar con el que decide"*.
  - **La causa, y explica por qué salía tanto:** la regla de longitud obliga a **UNA sola frase**, y los dos puntos son la forma más barata de pegar dos ideas dentro de una. Cuando aparezcan, casi siempre sobra la segunda idea. Una frase es **una** idea, no dos grapadas.
  - **🔴 Y el prompt se lo estaba enseñando.** La regla del guion largo de `commentGenerator` decía literalmente *"usa un punto, una coma **o dos puntos**"*. Le estábamos ofreciendo el tic como alternativa. Corregido en los tres prompts (`replyGenerator` RULE 8b, y los dos de `commentGenerator`, que además **no tenían ninguna regla de puntuación** en el generador de los 9 ángulos).
  - **⚠️ ÁMBITO: respuestas y comentarios, NO los posts.** En un post los dos puntos tienen trabajo y se quedan: el spam ninja **es** una oración + `:` + enlace (`global §4.4b`), y la entrada al bloque de menciones también los lleva (*"Estas son las 20 que lo sostienen:"*). Aquí se prohíben porque en un comentario corto no cumplen ninguna función, solo delatan.
- **Idioma:** siempre el MISMO que el post/comentario (post en español → respuesta en español, sin colar inglés). Iguala el registro (tú/usted, formal/informal).
- Sin markdown, sin meta ("el algoritmo", "en LinkedIn"), sin auto-promo.

### 7.2 · Comentar posts de OTROS (los 9 ángulos)
Para comentar en posts ajenos (feature Network), la herramienta genera 9 ángulos distintos: reforzar · rebatir el dato · rebatir la premisa · sesgo de superviviente · reencuadrar · añadir lo que falta · robar una frase · cálido/de apoyo · mejor pregunta. Reglas:
- **≤280 caracteres**, 3–4 líneas máx. Tight beats verbose.
- **Referencia algo ESPECÍFICO del post** (un número, una frase, una afirmación) para probar que lo leíste.
- Cada comentario, un ángulo genuinamente distinto; los "contrarian" suenan diferentes entre sí (data = números, premisa = filosófico, superviviente = probabilístico).
- **Nunca aperturas huecas:** "Great post", "Love this", "Totalmente de acuerdo", "Muy buen punto". Nunca auto-promo ("sígueme").
- **Variante de apoyo** (cuando el contrarian no encaja: buenas noticias, eventos, hitos): ≤180 caracteres, 2 líneas, cálido y específico, sin peloteo hueco. Son colegas apoyándose; nada arriesgado que dañe su imagen.

### 7.2b · Los 5 comentarios de apoyo de Google Chat (Iker, 2026-07-29)
Los que genera el botón **Enviar a Google Chat** de Accounts, para que los compañeros los peguen en nuestro propio post. Llevaban meses sin tocarse y salían superficiales, **y encima se saltaban nuestras propias reglas**: el lote del 29/07 llevaba un **guion largo**, que `§3` prohíbe. Ahora el prompt (`backend/src/services/commentGenerator.ts`, `generateSupportiveComments`) lleva:

- **SIEMPRE 5, fijo.** Antes se sorteaba entre 3 y 5 para que el mensaje diario no repitiera forma. El equipo ha crecido, así que sortear solo dejaba compañeros sin línea que pegar. **La variedad la da el texto, no la cantidad.**
- **★ Los escriben CINCO PERSONAS DISTINTAS.** Es la regla de la que cuelga todo lo demás: cada uno lo pega con su nombre y su cara en el mismo hilo. Si el lector baja por los comentarios y le suenan a la misma mano, se lee como coordinado y **el tiro sale por la culata**. Varían registro, longitud, arranque y grado de formalidad.
- **Puntuación de persona real** (`§3`): cero guion largo, cero coma antes de "y", cero markdown, y como mucho un emoji en uno de los cinco.
- **Alargar una vocal en UNO o DOS**, no en los cinco (`§7.1`). En todos es try-hard y peor que no hacerlo.
- **Nunca delatarse:** nada de "el equipo", "nosotros" ni hablar en nombre de la empresa. Cada uno es un contacto normal reaccionando.
- **Cero cifras o casos inventados.** Si hace falta un ángulo personal, que sea incomprobable ("me ha pasado algo parecido"), nunca un caso con datos.
- **Cinco ángulos obligatoriamente distintos** y sin que dos se agarren a la misma palabra del post.

**La cabecera y el recordatorio del mensaje también rotan** (`frontend/src/components/accounts/GoogleChatModal.tsx`). La cabecera usa el **pilar ya etiquetado** del post (`NUEVO MEMEEE DE UNAI`, `NUEVA HISTORIA DE IKER`, `NUEVOS 10 DE ASIER`), que es lo que Iker venía corrigiendo a mano cada día, y el recordatorio sortea entre 7 formas distintas de pedir las cuatro acciones. **Frases completas por pilar, nunca ensambladas**: componer "NUEVO" + etiqueta daba `NUEVO LOS 10` y `HISTORIA NUEVO`, porque género y número cambian con el pilar.

**Y las MAYÚSCULAS solo donde pesan** (Iker, 2026-07-29): en versales van únicamente **el FORMATO** (MEME, HISTORIA, TOP 10, LEAD MAGNET, con las vocales alargadas cuando toque) **y el NOMBRE de la cuenta**, que es lo que el compañero necesita leer de un vistazo en la notificación del móvil. **"Nuevo" lleva solo la inicial y las preposiciones van en minúscula.** La versión anterior iba entera en versales y aplanaba el aviso: si todo destaca, no destaca nada. Queda `🐝 Nuevo MEMEEE de UNAI:` en vez de `🐝 NUEVO MEMEEE DE UNAI:`.

### 7.3 · Qué SÍ es fiable (recordatorio)
Lo reconstruido en §1-§6 (voz founder-trincheras, regla de audiencia, tabla anti-IA, palancas de posicionamiento) y los **diferenciadores de `aboutme §1b`** son la base sólida de la voz. El perfil literal "Voz Neety" de la DB, no: si algo de él choca con §1-§6 o con 7.1/7.2, gana lo de aquí.

## ⛔⛔ NUNCA EL AÑO, NI EN EL TEXTO NI EN LA IMAGEN (Iker, 2026-08-11) — GLOBAL

**Ningún post lleva el año dentro.** Ni en el gancho, ni en el cuerpo, ni en el
rótulo de la foto.

Iker: *"si decimos el año, tanto en la foto como en el texto, nos estamos limitando
el alcance, y este meme dentro de un año no se puede seguir viralizando"*.

**Por qué:** un post sin año se puede **reflotar, reutilizar en otra cuenta y seguir
circulando** meses después. Con el año dentro nace con fecha de caducidad, y encima
se lee viejo en cuanto pasa enero. El coste de quitarlo es cero: casi siempre la
frase funciona igual o mejor sin él.

**Y el dato lo confirma:** nuestro mejor meme de este formato —el de la escalera de
Iker, **13.92x y 138.828 impresiones**— no lleva año por ningún lado. El que sí lo
llevaba era el borrador que escribí yo.

**Mecanizado** como check duro del validador (`Sin el AÑO en el post`), que mira
cualquier `19xx` o `20xx` en el cuerpo. La imagen no la ve el script, así que el
año tampoco entra nunca en el prompt del diseñador.

**Lo que SÍ vale** es la marca de urgencia sin fecha: `ÚLTIMA HORA`, `acaba de`,
`esta semana`. Envejecen bien porque no se anclan a un número.

## ⛔⛔ CANÓNICO · NO CRITICAMOS A NADIE, Y A NOSOTROS TAMPOCO (Iker, 2026-08-11) — GLOBAL

**Regla única, para TODOS los pilares y TODAS las cuentas, y vale igual en el gancho,
en el cuerpo, en el cierre, en el spam ninja, en el texto de la imagen y en el DM.**

Iker: *"nunca en nuestras publicaciones ni en gancho ni en cuerpo ni en texto ni en
imagen ni en nada nos autocritiquemos ni critiquemos otras regiones"*.

**Las CUATRO cosas que no se hacen:**

| no | qué significa |
|---|---|
| **1. A nosotros mismos** | ⭐ **LO NUEVO.** Ni al equipo, ni a otra cuenta, ni a un compañero, ni siquiera sin nombrarlo. Un *"los llamaron 5 días tarde"* es un reproche a ventas aunque no diga a quién |
| **2. A empresas, marcas, herramientas o personas por su nombre** | ya estaba escrito arriba: cualquier mención a otro producto o empresa es neutra o positiva |
| **3. A otras regiones o ciudades españolas** | ya estaba en `post-workflow §4.2`: buscamos hermandad entre regiones, no dividir |
| **4. A un colectivo profesional** | “los de compras”, “los SDR”, “los de marketing” como bloque al que se ridículiza |

**Lo que SÍ vale, y es justo el motor de medio catálogo:**
- **La comparación del peloteo** (*"exporta más que Bolivia entera"*). Comparar no es
  despreciar: ahí la región sale GANANDO.
- **El desprecio que dice OTRO** (`post-workflow §4.2`): *"la ven como el patio
  trasero"*. Nunca en primera persona, siempre atribuido a un sujeto ajeno.
- **Lo auto-despectivo de la propia región del post**, que es cariño, no ataque.

**⛔ DÓNDE MÁS SE CUELA, Y POR QUÉ ES EL CASO PELIGROSO: LA CUENTA DE MARIO.** Es la
única que habla del trabajo de DENTRO, así que ahí una queja genérica se lee como un
reproche a compañeros con nombre —y los jefes comentan sus posts desde sus cuentas,
con lo que el chiste se convierte en una bronca interna a la vista de todos.

**La reescritura, que es siempre la misma:** el culpable **nunca es una persona ni un
equipo, es la falta de información, la herramienta o el proceso**. Y si se puede,
que la frase **incluya al que publica**, así no señala a nadie:

```
❌ Los llamaron 5 días tarde. / Y la culpa siempre viaja en la misma dirección.
✅ Ninguno traía nombre ni cargo. / Y sin eso, cualquiera llama a ciegas.
```

**El test, antes de entregar:** *¿hay alguien —dentro o fuera— que pueda leer esta
frase y sentirse señalado?* Si la respuesta no es un no rotundo, se reescribe contra
el proceso.

## ⛔⛔ CANÓNICO · LA PERSONA: YO > NOSOTROS > TÚ (Iker, 2026-08-11) — GLOBAL

**Para afirmar, confesar o nombrar un dolor, se habla en PRIMERA PERSONA DEL
SINGULAR.** En el gancho, en el cuerpo, en el cierre y en el texto de la imagen.

Iker: *"a lo mejor sería incluso más efectivo 'en marketing no salvo'. Hablar de yo,
ya que el espectador en cuanto lo lea pensará en sí mismo y no en mí. Si pongo
primera persona plural, parece que estoy forzándole a que piense en nosotros
juntos"*.

| persona | qué provoca |
|---|---|
| **✅ YO** (`no salvo vidas`) | una **confesión**. El lector no se siente señalado, se reconoce solo. Es la que más identificación produce **precisamente porque no la pide** |
| **⚠️ NOSOTROS** (`no salvamos vidas`) | mete al lector en un grupo **al que no ha pedido entrar**. Se lee como forzar la complicidad |
| **⛔ TÚ** (`no salvas vidas`) | **señala**. Y esto ya estaba escrito más arriba: *"la crítica en segunda persona dispara rechazo defensivo y mata el engagement"* |

**Y hay una comprobación de coherencia que se olvida:** si la imagen etiqueta a un
personaje como **`Yo`**, el titular tiene que ir en primera persona también. Con `no
salvas`, titular y etiqueta hablan en dos voces distintas dentro de la misma foto.

**Las TRES excepciones, que no son excepciones sino otros papeles:**
1. **El spam ninja va en NOSOTROS** (*"eso lo resolvemos nosotros"*): ahí el sujeto
   es la empresa ofreciendo, no la persona confesando.
2. **El desprecio del peloteo va en TERCERA** y atribuido (*"la ven como el patio
   trasero"*), nunca en primera. Ya estaba escrito.
3. **El CTA puede ir en segunda** (*"¿quieres los 5 mensajes?"*): es una oferta, no
   un juicio. Lo que no vale en segunda es **afirmar algo sobre el lector**.

**Referencia externa que lo respalda (Iker):** el creador de TikTok que sigue habla
siempre en primera persona; sus vídeos no van de *"a ti te pasa"*, van de *"a mí me
pasó"*, y el que mira lo traduce solo.
