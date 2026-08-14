# SKILL: working-preferences — Cómo trabajar conmigo en los posts

> **name:** working-preferences
> **description:** Preferencias de trabajo del usuario al crear publicaciones de LinkedIn con Claude. Define el flujo, el formato de entrega, cuándo avisar/validar/preguntar y los tics a evitar en la interacción.
> **when-to-use:** Cargar en cualquier sesión de creación de contenido, junto a `aboutme`, `brand-voice` y `global-instructions`. Esta skill NO dice cómo escribir el post — dice cómo entregarlo y cómo comportarte durante la iteración.

---

## 0b · ⭐ RESUMEN AL FINAL, SIEMPRE — Y EN BULLETS, NO EN PÁRRAFOS (2026-07-16 · reforzado 2026-07-27)
**Cada respuesta termina con un `## Resumen` en BULLET POINTS cortos.** Sin excepción, aunque la respuesta sea corta.
- **Por qué:** "me pones mucho texto y no me entero". Reincidí el 2026-07-27: entregué el resumen como párrafo corrido en una respuesta larga y me lo devolvió ("si no es imposible entenderte"). El resumen en prosa NO cuenta como resumen.
- **Qué va dentro, en este orden:** bullets de **qué he hecho/decidido** + bullets de **PENDIENTES** (qué falta y qué necesito de él). Un bullet = una cosa, una línea.
- **Cuanta más información tenga la respuesta, más obligatorio es esto.** En respuestas largas, además: menos parrafazos arriba (bloques cortos, listas), que el resumen no sea el único sitio legible.
- **Lo demás va arriba y más corto.** El resumen no es la excusa para escribir 30 líneas antes.

## 1 · Formato de entrega

- **Todo borrador de post va dentro de un bloque de código cercado** (triple backtick sin lenguaje). Motivo: la UI mangla los saltos de línea y el espaciado si el post va como texto normal; dentro del bloque se preserva exacto y sale botón de copiar.
  - Un bloque por variante / por hook / por pieza de vídeo.
  - Fuera del bloque va todo lo demás: razonamiento, tag de viralidad, "por qué funciona", concepto de imagen.
- **Nada de markdown DENTRO del post** (no `**negrita**`, no `*cursiva*`, no `#` headers, no `código`). LinkedIn no lo renderiza. El único markdown que toca el post es el propio bloque que lo envuelve.
- Cuando propongo **2-3 variantes**, cada una con su tag de viralidad y su "por qué" fuera del bloque, para que puedas comparar. Arquetipos genuinamente distintos entre variantes.
- **Concepto de imagen = UN párrafo simple** en prosa, listo para pegar en un generador de imágenes. Sin bullets, sin headers, sin "concepto alternativo" salvo que lo pida.

---


## ⭐ 1c · SI UN HALLAZGO CAMBIA UN ENTREGABLE YA DADO, REDALO ENTERO (Iker, 2026-07-21)

**El fallo:** entregado un prompt de diseñador, hice una investigacion posterior que obligaba a cambiarle una columna. Explique el cambio y **no volvi a dar el prompt**. Iker se quedo con un prompt caduco y un parrafo diciendole que estaba caduco.

**Regla: cuando algo que descubres invalida un entregable que ya has dado — prompt, post, lista, ruta de fichero — no describas el cambio: vuelve a dar el entregable entero y corregido, en el mismo turno.** El resumen explica el porque; el bloque trae la version buena. Nunca al reves, y nunca solo una de las dos.

Vale para todo lo que se copia y pega: un prompt de diseñador, el texto de un post, un comando. **Si Iker tiene que reconstruirlo el juntando tu explicacion con la version vieja, esta mal entregado.** Es exactamente el mismo criterio que `§1` (el post siempre completo dentro del bloque, nunca "cambia esta linea").

**Y antes de cerrar el turno, comprueba hacia atras:** ¿algo de lo que acabo de descubrir toca un bloque que ya le di? Si toca, ese bloque se rehace.

## ⭐ 1d · LOS AVISOS CRITICOS VAN MARCADOS EN ROJO (Iker, 2026-07-21)

El terminal no pinta color, asi que **todo aviso que pueda tumbar una publicacion o hacerle perder tiempo empieza por 🔴**. Iker lee en diagonal cuando va rapido y un parrafo de texto plano se le pasa.

Se marca en rojo: datos que no se han podido verificar, riesgos de publicar algo falso, cosas que faltan por adjuntar y sin las cuales el entregable no funciona, y contradicciones entre lo que dice el texto y lo que enseña la imagen. **No se marca** lo que es solo una opinion o una mejora opcional — si se marca todo, deja de destacar nada.

## 🔴🔴 0c-BIS · ANTES DE ESCRIBIR UNA CORRECCIÓN: ¿ES GLOBAL O ES DE ESTE PILAR? (Iker, 2026-08-06)

**La pregunta se hace SIEMPRE, aunque Iker no la haga.** Cada vez que él corrige algo o que sale un dato, antes de tocar ninguna receta: *¿esto vale para cualquier publicación, o solo para el pilar que tengo delante?*

**EL TEST, que es el que da la respuesta sin dudar:** *¿la cosa que estoy corrigiendo existe SOLO en este pilar?*
- **Si existe en todos → la regla es GLOBAL** y vive en `global-instructions` o aquí, no en el runbook. Formateado, ritmo de bloques, ancho de línea, bucle abierto, cómo se roba una referencia, cómo se entrega: **todo eso lo tiene cualquier post**.
- **Si solo existe en ese pilar → es del RUNBOOK.** El bloque de menciones, el CSV de PamPam, la palabra clave del CTA, la escalera de países: un meme no tiene menciones salvo que demos crédito, así que una regla de menciones NO es global.

**⛔ Por qué esto es prioritario y no una manía de orden: escribir en un runbook algo universal garantiza que se rompa en los otros cinco pilares.** No es una teoría, es lo que lleva pasando:
| Regla | Dónde la escribí | Qué costó |
|---|---|---|
| Bucle abierto | `post-workflow §4.4` (meme) | Propuse un gancho de meme que desvelaba el chiste; había que moverla a `global §2.0` |
| Vehículo vs contenido | `post-workflow §4.4` (meme) | Se rompió **cuatro veces el mismo día** en un lead magnet |
| Medir la anatomía de la referencia | `post-workflow §4.4` (meme) | Iker: *"espero que no lo hayas aplicado solo a la receta de meme"*. A `global §2.2b-MEDIR` |
| Ritmo de bloques | Solo en el validador, y a medias | Prohibía el `1-2-1-2` y le colé un `1-3-1-2-1-3-1-2` |

**Y si es global, se dice en la entrega.** Una línea: *"esto lo he metido en `global` porque afecta a todos los pilares"*. Así Iker puede corregir la decisión antes de que envejezca dentro del sitio equivocado.

## ⭐ 0c · MIS DEDUCCIONES NO ENTRAN EN LAS RECETAS SIN QUE IKER LAS APRUEBE (Iker, 2026-07-27)

**El fallo real:** el 21-jul observé que un prompt de imagen que funcionó estaba escrito en líneas sueltas, deduje que ESA era la forma correcta y lo escribí en `images §0i-3` **junto a las reglas de Iker, como si fuera una de ellas**. Encima creé una contradicción con su regla de siempre (párrafo único) que arrastré seis días. Cuando lo vio: *"yo eso no te lo he dicho en la vida, ¿alguien ha hecho un commit?"*.

**La regla:** en las recetas solo entra lo que Iker ha dicho o lo que está **medido con datos**. Una conclusión mía sacada de observar un resultado es una **hipótesis**, y va: (a) propuesta en el chat para que él la apruebe, o (b) escrita marcada explícitamente como deducción sin verificar. **Nunca mezclada con sus instrucciones.** Un dato medido se cita con su medición; una regla suya se cita con su fecha; lo mío, si entra, entra etiquetado.

## ⭐ 1d-bis · SI DAS REFERENCIA DE IMAGEN, DAS TAMBIEN EL PROMPT DEL DISEÑADOR (Iker, 2026-07-27)

Describir el concepto de la imagen y enlazar la referencia **no es la entrega**: falta lo único que el diseñador puede ejecutar. En **cada** entrega que lleve imagen van las tres cosas juntas: (1) el **concepto**, (2) la **referencia real con su enlace** (outlier validado, `images.md`), y (3) el **prompt cerrado para el diseñador**, en su propio bloque copiable. Si falta el prompt, la entrega está a medias y hay que volver a pedirlo.

## ⛔⛔ 1d-QUATER · EL ENLACE VA COMPLETO Y LA FOTO VA EN LA ENTREGA FINAL (Iker, 2026-08-13)

**Dos fallos del mismo turno, y los dos dejan al diseñador sin poder trabajar.**

**1 · El enlace de la referencia se pega TAL CUAL lo devuelve la API. Nunca se acorta a mano.** Yo cogí el `share_url` de Unipile y le quité el slug codificado por dejarlo "limpio", y **LinkedIn devuelve error sin ese slug**. Iker: *"el enlace da error, no sé si ha caducado o me lo has dado mal"*. Da igual que sea feísimo y ocupe cuatro líneas: se pega entero, con el `%F0%9D...` y con los parámetros.

**1b · Y SIEMPRE COMO ENLACE PULSABLE, NUNCA EN BLOQUE DE CÓDIGO (Iker, 2026-08-13).** *"¿Por qué me has dado el enlace en un formato que puedo pulsar y copiar? Siempre los enlaces me los tienes que dar en formato que yo pulso y que salen aquí en azul."* Va en markdown, `[texto corto](URL completa)`, en **cualquier** enlace que le dé: referencias, posts nuestros, documentación, PRs.
- **⛔ EL FALLO DE FONDO, y es el que hay que recordar: traté "completo" y "pulsable" como si hubiera que elegir.** Primero se lo di pulsable pero acortado (roto), y al corregirlo me fui al extremo y se lo puse en bloque de código para que se copiara entero (no pulsable). **Son independientes:** el markdown lleva la URL entera y fea en el destino y enseña un texto corto en azul. Se cumplen las dos a la vez, siempre.
- **La única excepción es lo que va DENTRO del post**, donde la URL se escribe en crudo porque LinkedIn no renderiza markdown (`§1`).

**2 · La foto de la referencia va en el MISMO mensaje que la entrega, al final, no suelta a mitad de turno.** La regla de `§1d-ter` ya decía que se adjunta siempre, y **yo la adjunté**… en medio de un turno largo lleno de comandos, y se perdió de vista. Iker: *"sin foto de referencia, ¿cómo le voy a decir al diseñador que la calque?"*. **Adjuntarla no basta: tiene que estar donde él la va a buscar**, que es junto al post y al prompt.
- **Y se vuelve a descargar en el momento de entregar**, no se reutiliza la de hace tres horas: las URL de `media.licdn.com` caducan y dan 403 (`§1d-ter`).
- **Antes de darla, se comprueba que el post sigue vivo** pidiéndolo a la API. Si el autor lo ha borrado, la referencia ya no vale y hay que decirlo.

## ⭐ 1d-ter · LA FOTO DE LA REFERENCIA SE ADJUNTA SIEMPRE, NO SOLO SU ENLACE (Iker, 2026-08-06)

**En CUALQUIER entrega que se base en una referencia —meme, lead magnet, mapa, historia, email— la imagen de esa referencia va ADJUNTA en el chat**, además del enlace. Iker: *"a veces me la pasas y a veces no, y me la tienes que pasar siempre para ir más rápido"*.

- **El enlace es para él** (comprobar que existe y cuánto hizo); **la foto es para el diseñador**, que la necesita adjunta y no va a abrir LinkedIn (`images §0i-2-ADJUNTOS`). Si no se la doy descargada, el trabajo de bajarla se lo come Iker.
- **Se baja de la API, no se le pide a él:** las nuestras con `POST /api/posts/post/{id}/refresh-media` (las URLs de `media.licdn.com` caducan y dan 403) y las de fuera con `attachments[0].url` de Unipile.
- Va **en el mismo turno** que el prompt del diseñador, para que pueda reenviar las dos cosas de una vez.

## 🔴🔴 1d-BIS · NO SE ENTREGA LA PRIMERA VERSION. NUNCA (Iker, 2026-07-30)

**⚠️ APLICA A TODO, no solo a los memes (Iker, 2026-07-30).** Mapa, "Los 10", despiece, lead magnet, historia, meme, newsletter, secuencia de email, prompt de imagen y prompt para el programador. **Y a cualquier pilar que inventemos manana.** Vive aqui, en como se ENTREGA, precisamente para que no dependa del pilar: si algun dia hay que repetirlo dentro de un runbook, es que esta mal puesto.

**El problema que lo motiva, en palabras de Iker:** *"tienes todas las recetas superdetalladas, con validaciones superespecificas, y solo las estas aplicando si te lo digo yo"*. Cuerpos bien, **ganchos mal**, y cada dia fallando por un motivo distinto: un dia sin sujeto colectivo, otro sin verbo punchy, otro con una cifra dentro.

**⛔ La causa raiz: lo que vive solo como CRITERIO depende de que yo me acuerde, y yo me olvido.** Hay dos arreglos y hacen falta los dos.

### Arreglo 1 — lo mecanizable se MECANIZA, no se anota
Cada vez que Iker corrija algo del gancho o del cuerpo, la primera pregunta es **"¿esto lo puede comprobar el validador?"**. Si la respuesta es si, **va al validador ese mismo dia**, no a un parrafo de la receta. El 2026-07-30 se movieron tres reglas del gancho de peloteo (sujeto ajeno, frase-rabia y sin cifras) y **las tres cazan fallos reales mios de esa misma semana**. Lo que se mecaniza no se olvida.

### Arreglo 2 — el bucle de entrega, obligatorio
**El validador es el SUELO, no el techo.** Pasarlo no significa que este bien.

1. **3 CANDIDATOS DE GANCHO, siempre.** La receta ya lo pedia (`§4` Paso 4) y yo entregaba uno. Escribir tres y elegir es lo que hace que el flojo pierda por comparacion; con uno solo, el flojo gana por incomparecencia.
2. **Validador.** Arreglar TODO lo que falle.
3. **Pase de criterio POR ESCRITO** contra el runbook del pilar, punto por punto. No "lo he revisado": la lista del runbook, marcada.
4. **Si algo queda flojo, se reescribe y se vuelve al 2.**
5. **Solo entonces se entrega.** Iker no es el que encuentra los fallos de primera version: para eso estan el validador y el pase de criterio.

**Y si la version que tengo no es la mejor que puedo dar, NO se entrega.** Iterar cuesta minutos; que Iker corrija una entrega mala cuesta su tiempo, que es lo caro.

## ⛔⛔ 1g · DEBAJO DE CADA PROMPT, QUÉ HAY QUE ADJUNTAR (Iker, 2026-08-11) — GLOBAL

**Justo después de cada prompt va la lista de lo que Iker tiene que adjuntarle a
quien lo va a ejecutar.** En cualquier pilar y para cualquier prompt — diseñador,
animador, programador, edición—. Si no se dice ahí, se olvida, y el diseñador acaba
tirando de la fuente por defecto o inventándose la referencia.

**Va en UNA sola línea y con ⚠️, el triángulo amarillo.** Ni un clip, ni dos
avisos separados, ni un emoji nuevo por mi cuenta (Iker, 2026-08-11: *"eso no te lo
he pedido nunca"*). Una línea, un triángulo, todo dentro: lo que adjunta y la
postproducción si la hay.

Lo habitual: **la foto de la referencia**, **los instaladores de Bricolage
Grotesque y Switzer**, y los **logos** si el pilar los lleva (despiece, mapa).

**Y el prompt mismo NUNCA sale sin paleta ni tipografía.** Está en `images §4 ·
Constraints de marca (SIEMPRE, en cualquier variante)` desde el principio y el
11/08 lo omití en los dos memes. Iker: *"es lo más importante, tanto nuestra
tipografía como los colores del nuevo brand book"*. **Un meme calcado sin nuestra
tipografía es el meme de otro con nuestro chiste**: lo único que lo hace nuestro es
cómo está escrito. Las dos cosas van al validador como aviso de entrega.

## ⛔⛔ 1h · ANTES DE QUE SUBA NADA, PREGUNTARLE LA HORA (Iker, 2026-08-11) — GLOBAL

**En cuanto Iker diga que el post ya está o que lo va a subir, hay que preguntarle
a qué hora piensa publicarlo y decirle lo que dice el dato.** Sin esperar a que lo
pregunte él.

Iker: *"a veces me caliento. Hoy ya he subido 2 y los 2 a muy buena hora, eso es
más que suficiente. Mejor guardarme para mañana los 2 buenos y a buena hora, que si
no, todo el trabajo para nada. Subir ahora a las 2 de la tarde posts buenos es
matarnos"*.

**El dato, medido sobre los 3 perfiles (hora española, posts con más de 500
impresiones):**

| franja | posts | mediana imp | mediana ratio |
|---|---|---|---|
| **10:00** | 45 | **4.850** | **0,80x** |
| 12:00 | 38 | 4.328 | 0,69x |
| 13:00 | 34 | 3.894 | 0,55x |
| **14:00** | 15 | 2.989 | **0,43x** |
| 15:00 | 7 | 3.543 | 0,37x |

**Las 14:00 es la peor franja de la jornada: 0,43x contra 0,80x de las 10:00.** Un
post bueno publicado ahí rinde la mitad, y no hay forma de recuperarlo.

**Los dos argumentos que hay que darle, porque son los que deciden:**
1. **Ya no hay prisa de contenido.** Desde que ningún post lleva año
   (`brand-voice`), esperar a mañana no le cuesta NADA al texto. Antes sí.
2. **Dos posts buenos al día en buena hora bastan.** El tercero a mala hora no
   suma alcance: gasta una pieza buena.

**Cuándo SÍ se sube a mala hora:** cuando esa cuenta lleva días sin publicar y lo
que se busca es romper la sequía, no el pico. Ahí 0,43x es mejor que nada.

## ⛔⛔ 1f · LO QUE SE COPIA NO SE PARTE A MANO (Iker, 2026-08-11) — GLOBAL

**En todo bloque cercado pensado para COPIAR, cada párrafo va en UNA SOLA LÍNEA.**
Nada de cortar a los 70-75 caracteres para que "quede cuadrado".

Iker: *"siempre me los das con un formato raro, como un salto de línea, entonces los
prompts ocupan mucha altura y sobra mucho espacio por la derecha. Dámelos tal cual.
Es un problema global"*.

**Por qué está mal partirlos:** el bloque no reajusta el texto al ancho de la
ventana, así que mis saltos se quedan fijos. Resultado: una columna estrecha, el
doble de alto y media pantalla vacía a la derecha. Y al pegarlo en otro sitio se
lleva los saltos falsos dentro.

**Dónde aplica — a TODO lo copiable, no solo al prompt del diseñador:**
- prompts de diseñador, de animador y de programador
- prompts de intake y de edición
- cualquier bloque que Iker vaya a pegar en otra herramienta

**La ÚNICA excepción es el TEXTO DEL POST**, donde el salto de línea es contenido:
lo decide `§3.2` y define el ritmo que ve el lector en LinkedIn. Ahí los saltos van
exactamente donde van, ni uno más.

**⛔ Y NO, LOS SALTOS DE PÁRRAFO TAMPOCO (Iker, 2026-08-11).** Escribí aquí que
"los de párrafo sí valen" y **me contradije con `images §2b`**, que ya decía desde esa
misma mañana que el prompt va en **un solo párrafo**. Con mi versión devolví un
prompt de tres. **Es UNO: sin líneas en blanco dentro, sin apartados, sin listas.**
Se escribe como se lo explicarías a un amigo, del tirón.

## ⛔⛔ 1e-DOS · LA COMPARATIVA SON DOS VISTAS, NO UNA (Iker, 2026-08-10) — GLOBAL

**Toda entrega de un post lleva DOS comparativas, en este orden:**

1. **Contra la REFERENCIA que estamos remezclando**, si la hay. Responde: *¿hemos
   calcado lo que fuimos a robar?* — gancho, ritmo, emojis, longitud, cierre.
2. **Contra NUESTRO MEJOR post de ese mismo pilar.** Responde: *¿esto se parece a
   lo que ya sabemos que nos funciona a NOSOTROS?*

**Es global: vale para todos los pilares.** Si no hay referencia externa (mapa,
los 10, despiece), se entrega solo la segunda, y se dice que no hay primera.

**Por qué hacen falta las dos, y no una:** son preguntas distintas y pueden dar
respuestas opuestas. El lead magnet del 2026-08-10 calcaba el CTA de Martín Arosa
(vista 1) y el molde de gancho de nuestro 632c (vista 2); mirando solo una de las
dos, la mitad del post quedaba sin contrastar. Yo entregué primero solo la suya —
y como no compartía anatomía, no medía nada (§1e-REF) — y luego solo la nuestra,
con lo que el CTA robado se quedó sin comparar. **Las dos, siempre.**

**Cuál es "nuestro mejor" de cada pilar** (por comentarios en lead magnet, por
engagement en meme, por clics en peloteo):

| pilar | el mejor | fichero |
|---|---|---|
| lead magnet | 632 comentarios, *"Claude acaba de matar el cold outbound"* | swipe file |
| meme | 06/08, *"Vender es un caos"* (0,54% lk/imp, 31 reposts) | — |
| mapa | 28/04 Unai (1,096% CTR) y 13/05 Iker (270 clics) | — |

**⛔ Y EL PELOTEO NO SE LIBRA POR NO TENER REFERENCIA EXTERNA (Iker, 2026-08-10).** *"Peloteos nunca tenemos referencias de otros, pero de nosotros sí"*. Allí la vista 2 es la ÚNICA, y es justo donde más falta hace: **es el control de regresión del pilar.** Iker: *"así me aseguraré en el futuro de no volver a cagarla como cuando me borraste del gancho la palabra exporta"*. Ese fallo — quitar del gancho una palabra que en el mapa ganador sí estaba — es invisible leyendo el post solo, y **salta a la cara puesto al lado del que funcionó**. La comparativa contra nosotros mismos no es un adorno de la entrega: es lo que impide que cada post nuevo pierda, sin querer, una pieza que ya sabíamos que funcionaba.

**Y las dos se rehacen cada vez que cambia el texto** (§1e-REENTREGA).

## ⛔⛔ 1e-REENTREGA · SI CAMBIA EL TEXTO DEL POST, LA COMPARATIVA SE REHACE (Iker, 2026-08-10)

**La regla:** cada vez que cambia el TEXTO de la publicación, **la comparativa
nueva va en esa misma entrega, sin que Iker la pida**. No solo la primera vez.

**El disparador es que cambie el texto del post.** Una corrección a un análisis, a
una cifra de la entrega o al código **no** la dispara. Iker: *"cuando te haga una
corrección respecto al texto de la publicación me refiero"*.

**Por qué:** el 2026-08-10 entregué el lead magnet con su comparativa, Iker corrigió
tres cosas del texto (el bloque de tres, la longitud, el cierre calcado), reescribí
el post — **y entregué la versión nueva sin comparativa**. La que él tenía delante
compara un texto que ya no existe, así que tuvo que pedirla otra vez. Correr el
script cuesta un segundo; pedirla cuesta un turno entero.

**Dónde aplica:** en todo pilar que se monte sobre una referencia — **lead magnet y
meme siempre**, y cualquier remix. En los pilares de formato propio (mapa, los 10,
despiece) no hay referencia externa que comparar.

**Y la referencia de esa comparativa nueva es la MISMA de antes** (§1e-REF): si al
corregir el texto la comparativa cambiara de referencia, ya no se vería qué ha
cambiado, que es justo para lo que se mira.

## ⛔ 1e-REF · LA REFERENCIA DE LA COMPARATIVA COMPARTE ANATOMIA, NO FECHA (Iker, 2026-08-10)

**El error:** entregue el lead magnet del martes comparado contra el post de 483
comentarios de Martín Arosa, que **no comparte nada con el nuestro** salvo el
mecanismo del CTA. Iker: *"no entiendo tampoco por qué me has puesto esa
referencia si no tiene absolutamente nada que ver con lo nuestro, solo que es el
lead magnet más reciente, supongo"*. Y era exactamente eso: lo elegí por reciente.

**Para qué sirve la comparativa:** para ver si hemos calcado la anatomía — hook,
ritmo, bloques, emojis, longitud. **Contra un post que no comparte anatomía, la
comparativa no mide nada**: sale que somos distintos en todo, que es justo lo que
tiene que salir, y no informa de nada.

**La regla:** la referencia es **el post que estamos calcando**, el que comparte
molde de gancho, pilar y motor. Casi siempre es **uno nuestro del swipe file**.

**Y si de un post solo robamos UN mecanismo** (el CTA, el cierre, un giro), eso
**no lo convierte en la referencia**. Se dice en la entrega en una línea — *"el
CTA sale del 483 de Martín Arosa, que dejó el gate el 05/08"* — y la comparativa
se monta contra la referencia anatómica de verdad.

## ⛔ 1e-COPIA · EL MECANISMO SE ROBA, LAS PALABRAS NO (Iker, 2026-08-10)

Copié el cierre de Martín Arosa casi literal: *"Lo estoy compartiendo de forma
gratuita. / Acceso libre. / (Conecta conmigo para que pueda escribirte)"*, tres
líneas contra sus tres. Iker: *"se ve demasiado copia — todo eso yo lo resumiría
en una, sin perder valor y con otras palabras"*.

**Lo que se roba es el MECANISMO:** sin la palabra "comenta", una pregunta
directa, gratis y conectar para poder mandarlo. **Lo que no se roba es la
redacción.** Tres líneas suyas caben en una nuestra: *"Conecta conmigo y te los
mando gratis."* — mismo mecanismo, 3 líneas menos y sin olor a calco.

**El validador solo puede exigir el mecanismo** (que haya pregunta, que se diga
gratis, que aparezca "conecta conmigo"). **Que no sean sus palabras exactas es
criterio, y toca mirarlo a mano en el pase de `global §8`.**

## ⭐ 1e · TODA ENTREGA DE UN POST LLEVA LA COMPARATIVA ORIGINAL vs EL MIO (Iker, 2026-07-22)

En **cada** entrega de un post (meme, lead magnet, mapa, lo que sea), además del texto, el prompt y los avisos, va **siempre una sección de comparativa**: el **post original de referencia** y **el mío**, **en la misma fila, lado a lado, dos columnas** (izquierda = original, derecha = el mío). Sirve para ver de un vistazo cómo se ha robado la esencia.

**⭐ EL ORDEN DE LA ENTREGA (Iker, 2026-07-27):** primero **mi post** en su bloque cercado listo para copiar; **justo debajo, el post ORIGINAL entero en OTRO bloque cercado igual** (también copiable, mismo formateado); y **después** la vista comparativa. Sin el original suelto no se puede leer de dónde sale lo nuestro.

**🔴 REINCIDÍ OTRA VEZ EL 2026-08-06, y la doctrina de abajo ya estaba escrita entera.** Entregué el meme de Unai con dos bloques cercados apilados. Iker: *"esto te lo he pedido ya muchas veces y siempre te equivocas"*. **Aquí no falta receta, falta cumplirla:** antes de pegar una entrega de post, se relee este bloque, igual que el chequeo de `images §0i-3`. Y dos precisiones suyas de ese día:
- **Las columnas se separan con una línea DISCONTINUA vertical** (`:` repetido a lo alto), no con un borde continuo ni con espacios sueltos. Debajo de la cabecera, una regla horizontal que se cruza con ella.
- **Cero etiquetas dentro de las columnas.** Nada de `GANCHO:`, `CUERPO:`, `CIERRE:`. Iker: *"eso lo sé yo"*. Va el texto tal cual, seguido, de arriba abajo.
- **La comparativa NO tiene que ser copiable** —*"ni me apetece copiarla, no lo necesito, pero necesito verlo en dos columnas"*—, **pero eso NO cambia el contenedor: sigue yendo en un BLOQUE CERCADO de tres comillas.** Al leer lo de "no copiable" me pasé a `<pre>` y salió un desastre: el terminal **no renderiza HTML**, así que Iker vio la etiqueta `<pre>` literal y encima el texto en fuente proporcional, que desalinea las columnas y convierte la vista en una sopa. **El bloque cercado es lo ÚNICO que garantiza monoespaciado aquí**, y el monoespaciado es lo que sostiene las dos columnas. Que además se pueda copiar es un efecto secundario inofensivo.
- **⚙️ NO SE MAQUETA A MANO: `python scripts/comparativa.py <original.txt> <mio.txt> "<cab izq>" "<cab der>"`.** La he entregado mal **cuatro veces**, siempre por maquetado y nunca por criterio: dos apilada, una en `<pre>`, y una con la regla horizontal más ancha que las columnas —se partía en dos líneas— y encima continua. El script fija los 36 caracteres por columna (75 de ancho total, que es lo que entra sin partirse), pone la regla **discontinua** y del ancho exacto, y **cuenta los emojis como dos celdas**, que es lo que descuadraba el separador en las líneas con 🤣 o 👇.
- **Columnas estrechas y largas está BIEN.** Iker: *"si los textos son largos, las columnas serán compactas a nivel de anchura pero muy largas a nivel de altura, y eso me parece bien"*. No se recorta ni se resume para que quepa.

**El formato, exacto (Iker es tiquismiquis con esto):**
- **LOS DOS TEXTOS VAN ENTEROS, sin resumir ni poner `[lo malo]` ni recortes.** Una comparativa "general" con etiquetas no vale: se comparan las publicaciones completas, palabra por palabra.
- **Dos columnas EN LA MISMA FILA**, no dos bloques apilados. Se monta en **un solo bloque cercado monoespaciado**: cada línea = columna izquierda (rellenada a ancho fijo) + hueco + columna derecha, alineadas arriba. **NADA de tabla, nada de floritura, nada de "cosas raras".**
- Cabecera dentro del bloque: **ORIGINAL** (creador + ratio si es referencia) a la izquierda, **EL MÍO** (cuenta) a la derecha.
- El "original" es el texto de la referencia tal cual; si está en inglés, va en inglés (no se traduce en la comparativa). El mío, el que entrego.
- **SOLO EL TEXTO del post (hook, cuerpo, spam ninja, cierre). NADA de la imagen** (Iker, 2026-07-23). La comparativa es para ver cómo se robó la esencia del TEXTO; el concepto de imagen va en su prompt aparte, no en la tabla. Nada de una fila `IMAGEN:`.
- **TEXTO VERBATIM, línea a línea, NO troceado en secciones** (Iker, 2026-07-23). Se pega el texto real del post tal cual (el original en su columna, el mío en la suya), envuelto al ancho. **NADA de etiquetar `HOOK:` / `CUERPO:` / `CIERRE:`** ni resumir cada parte: eso es mi lectura del post, no el post. Si el original es muy largo (essay), se pega su parte comparable y se avisa en una línea de que sigue.
- **Cómo generarlo sin errores de alineación:** con un script que hace word-wrap de cada columna a su ancho (izq ~34, der ~52) y hace zip fila a fila, rellenando la izquierda con `padEnd`. La derecha va la última, así que un emoji ahí no descuadra nada. (El bloque de `node -e` que se usó el 2026-07-22 sirve de plantilla.)

**El esqueleto, para no volver a fallar (Iker, 2026-07-23: lo entregué apilado OTRA VEZ):**
```
✅ BIEN — UN bloque, dos columnas    │ ❌ MAL — dos bloques apilados
ORIGINAL — creador (ratio) │ EL MÍO   │  ``` bloque 1: original ```
Hook: …                    │ Hook: …  │  ``` bloque 2: el mío  ```
Cuerpo: …                  │ Cuerpo: … │  (esto es lo que NO se hace)
```
La columna izquierda y la derecha comparten CADA fila. Si entregas dos ```bloques``` seguidos, está MAL aunque el contenido sea idéntico. Un solo bloque, un separador `│` por línea.

Esto es la vista que pidió el 2026-07-22, tras rechazar dos intentos: uno "super feo" y otro en bloques apilados. Lo quiere en columnas lado a lado, monoespaciado, ni tabla ni apilado. **Reincidí el 2026-07-23 (dos bloques): por eso el esqueleto de arriba.**


## 2 · Valida de forma proactiva (no esperes a que pregunte)

- Antes de entregar cualquier borrador, corre en silencio el **pase de validación** contra toda la stack de reglas (`global-instructions`, `brand-voice`, mecánicas, RECENT_DIAGNOSIS, datos de la cuenta).
- **Dos salidas:**
  - **Fix silencioso** (violación clara y trivial: markdown dentro, preámbulo prohibido en la línea 2, 2+ cifras en el hook, frases paralelas pegadas con puntos, opener genérico, etc.) → arréglalo dentro de tu razonamiento antes de que lo vea. No hace falta mencionarlo.
  - **Riesgo significativo** (el post va a rendir regular aunque lo arregles: meme que solo pasa 2/4 del filtro, mapa en región baneada, lead magnet dentro de la ventana de fatiga, arquetipo que ya flopeó, hook solo legible por un SDR muy técnico) → **avísame ANTES o junto al borrador**, con razón concreta y datos: *"Antes de entregártelo: esto va a ir regular porque [Madrid ya falló a 0.55x / es el 4º lead magnet en 10 días / al meme le falta cambio corporal en la imagen]. ¿Lo retocamos o pruebo otra mecánica?"*
- **No esperes a que pregunte "¿esto va a funcionar?"** — esa pregunta es TU trabajo responderla antes de que la haga, en cada iteración.
- Si te digo explícitamente "no me valides / no me critiques / dame lo que sea" → sáltate el aviso de riesgo, pero **nunca** el fix silencioso (esas son reglas mecánicas, no opiniones).

### La trampa de la edición parcial
Cuando acoto la petición a un trozo ("no toques el hook, mejora el cuerpo", "solo el cierre", "edición conservadora") **NO** es permiso para saltarte la validación en lo que no toco. El pase corre sobre el post ENTERO en cada iteración. "No toques X" ≠ "X está aprobado". Si auditando lo intacto encuentras un riesgo significativo, señálalo igual: *"Toqué solo lo que pediste, pero auditando el resto: [bloque] infringe [regla]. ¿Te lo arreglo de paso?"*

---

## 3 · Avisar antes de ciertos formatos

- **Posts de evento / premio / reconocimiento:** avísame ANTES de crear que rinden bajo en alcance (0.2x–0.8x) y que es NORMAL — el objetivo es **autoridad** como founders/empresa, no viralidad. Confírmalo conmigo con esa expectativa clara antes de escribir.
- **Mapa regional en capital obvia** (Madrid / Barcelona ciudad): empújame para atrás con el precedente Madrid 0.55x y propón una región greenlit.
- **Post sobre versión nueva de Claude / modelo IA:** empújame para atrás (0.88x, 0.25x, dos flops). Propón reformular como "el resultado en términos de la audiencia" (reuniones, replies, horas ahorradas).
- **Infografía:** avísame que van 0-de-3 (incluida una bien hecha). Ofrece alternativas validadas primero.
- **Lead magnet:** ⚠️ **ya NO hay puerta de frecuencia** (revisado 2026-07-14 contra la BD: Iker sacó dos en días consecutivos, 0.59x y 8.52x). Lo que se comprueba en voz alta es el **ÁNGULO**: ¿se parece al del último de esa cuenta? ¿repite la palabra del CTA? ¿es el entregable genérico "todo en una caja", que está muerto? Ver `global-instructions §4.4`.

---

## 4 · Reescritura y sorpresa (tic a evitar)

Este es un tema importante para mí: **quiero seguir sorprendiendo al lector**. No me des siempre las mismas frases.

- **Reescribe bastante las expresiones** en cada post nuevo (sobre todo en mapas y "Los 10"): mismos conceptos estructurales, **palabras y ángulos distintos** cada vez.
- **Varía el arranque de los bloques.** No empieces siempre los bloques de 3 por "No…". Rota: unos empiezan por verbo, otros por nombre, otros por lugar, otros por número.
- **No repitas frases-comodín** entre posts. Ejemplo concreto que quiero eliminar: "La gente y las empresas que mueven todo esto:" — dilo distinto cada vez.
- **Varía los CTA de cierre.** Nunca dos posts seguidos con el mismo cierre. (Y ojo: en mapas ya **no** pedimos "comenta tu empresa" como cierre principal — el objetivo ahora es que entren al link de agendar en spam ninja.)

---

## 5 · Reglas operativas que espero que apliques solo

- **Bloques de empresas: RELLÉNALOS con empresas reales verificadas** (política nueva, ver `post-workflow §4.0`) — de la fuente que te pase o de web con cita, marcando las dudosas y sin inventar (lo no verificable va como `→ [PENDIENTE · no verificado]`). Yo doy el visto bueno final. Formato: 20 líneas en 5 bloques de 4, con `→ @Empresa - @Persona` (arroba delante de ambos y nombres exactos de LinkedIn, para que al clicar salte el autocompletado).
- **Verificar cifras de mapa antes de dibujar el cuerpo.** Lista las cifras shock (exportación €, ranking, puerto, habitantes) y dime qué fuentes hay que verificar (ICEX, autoridad portuaria, INE, Eurostat, IDESCAT/EUSTAT/IECA). No entregues cuerpo con números sin verificar — un dato mal me tira el mapa de 6x a 0.5x.
- **Triage de menciones @** por actividad real en LinkedIn (no por cargo): descartar dormidos >3 meses aunque sean el CEO de la región.
- **Link de agendar en spam ninja** en TODOS los pilares menos el lead magnet (no el link del mapa de pampam). Máx 2 líneas cortas, sin nombrar a Neety, girando el concepto del hook con verbo punchy. Reglas: `global-instructions §4.4b`.
- **Modo texto / vídeo:** si digo "modo texto" o "modo vídeo" respétalo como sticky hasta que diga lo contrario.

---

## 6 · Estilo de interacción que prefiero

- **Directo y accionable.** Dame contenido listo para pegar, no consejos vagos.
- **Cuando decidas por mí,** dime qué elegiste y por qué en una línea, y sigue. No me hagas un catálogo de opciones que no vas a tomar.
- **Escribe en el idioma en que te escribo** (normalmente español).
- **Tag de viralidad obligatorio** en cada opción: `🔥 ~{ratio}x vs. media · {arquetipo} (n={count} outliers reales)`, con números SOLO de los datos reales de arquetipos. Si el arquetipo no tiene histórico suficiente, dilo, no inventes número.

---

## 7 · Huecos / cosas que me puedes preguntar

- [x] Canal de entrega: **el chat de Claude Code**, y los entregables grandes (CSV, ZIP, fotos) al Escritorio. Decidido 2026-07-14.
- [ ] ¿Hay días/horas de publicación fijos por cuenta que quieras que asuma? (el sistema sugiere martes-jueves, 11:00-12:00 y 14:00-15:00 hora local).
- [ ] ¿Quieres que lleve yo el control de qué formato tocó a cada cuenta cada día (para la regla de exclusividad) o me lo dices tú en cada sesión?
