# SKILL: images — El concepto de imagen de cada post

> **name:** images
> **description:** Cómo se propone la imagen de un post de Neety: formato de salida, los 3 registros (meme dibujado / screenshot documental / foto real), constraints de marca (paleta + tipografía + regla de la palabra naranja), la variante "calcar la referencia", el sistema visual del meme desde cero, y el formato quemado de infografías. Fuente: `IMAGE_PRINCIPLES` + `MEME_VISUAL_SYSTEM` de `postPrompt.ts` + histórico de la cuenta.
> **when-to-use:** Cargar cuando un post vaya a llevar imagen (la mayoría). Trabaja junto a `global-instructions` (mecánica del post) y `outliers-database` (qué formato tiró). Para vídeo NO — eso es la skill `video`.

---

## 0 · Realidad de LinkedIn (por qué hay que clavarla)
Una vez publicado un post con foto, la foto **NO se puede cambiar** (habría que borrar y republicar, perdiendo todo el alcance). No hay A/B post-publicación. Se clava antes de publicar. Si la idea cruda no la puede cargar UNA sola imagen fuerte, dilo en vez de forzar una mediocre.

---

## ⭐ 0a-bis · NUNCA NUESTRA MARCA EN LA IMAGEN, Y LA IMAGEN COMPLEMENTA AL POST (Iker, 2026-07-27)

**1. Ni el logo ni el nombre de Neety van dentro de la foto.** Aunque la referencia que calcamos lo lleve (Beeze lo pone arriba y abajo). En cuanto el lector ve una marca en la imagen, **entiende que le estan vendiendo algo** y baja la guardia del contenido. La foto tiene que parecer una pieza util, no una creatividad de empresa. Fuera tambien los subtitulos de cabecera tipo `SEÑALES DE COMPRA 2026`: ocupan sitio y no aportan.

**2. La imagen COMPLEMENTA al post, y su titular ECHA EL GANCHO.** Si el post abre con *"la prospeccion manual ha muerto"*, el titulo de la imagen no puede ser *"Las 7 señales"*: son dos promesas distintas y el lector no las une. El titular de la imagen repite o continua el gancho; el contenido de la imagen es la prueba de lo que el gancho promete.

**3. Se tiene que entender en UN SEGUNDO.** Minimalista. El hueco que dejan la marca y los subtitulos se usa para que el titular sea lo primero que se lee, mas grande y mas arriba.

## ⭐ 0a-ter · PALETA NUEVA (Brandbook 2026_Saiabera, Iker 2026-07-27) — MANDA SOBRE LA ANTIGUA

Fuente: `Documentos/Mario/LINKEDIN GROWTH/Brandbook Neety Nuevo.pdf`, pag. 23. **Sustituye al crema/azul-marino/coral de antes en TODA imagen nueva, de cualquier pilar.**

| Uso en la imagen | Color | Hex |
|---|---|---|
| **Fondo** (el que hace de blanco) | Mint claro | `#ebfff6` |
| **Títulos y texto oscuro** | Berenjena | `#431b44` |
| **LA palabra destacada del titular** | Naranja (persian orange) | `#fe8238` |
| Apoyo / acentos suaves | Azul bebé | `#a7c5f9` |

- El **alabastro/crema ya NO se usa**: el blanco de la marca es ahora el **mint claro `#ebfff6`**.
- El oscuro dejo de ser azul marino: es **berenjena `#431b44`**.
- La **regla de la palabra naranja se mantiene**, solo cambia el tono exacto.
- **Tipografía sin cambios:** Bricolage Grotesque en títulos, botones y textos cortos; Switzer en texto corrido y anotaciones (pág. 19-20).

## ⭐ 0a-sexta · EL TITULAR EN UNA LINEA SI LA LETRA SIGUE GRANDE (aprobado por Iker, 2026-07-27)

**El criterio NO es el numero de lineas: es el tamano de la letra.**
- **Una linea** siempre que quepa sin encoger el texto. Se lee de un golpe, sin el micro-salto de vista que obliga a dar el segundo renglon, y **el espacio vertical que libera se lo queda el contenido**, que es la prueba del recurso. Caso real: *"Todos avisan antes de comprar"* (29 caracteres) paso de dos lineas a una y la tabla gano sitio para leerse comoda.
- **Dos lineas** en cuanto juntarlo en una obligue a reducir el cuerpo de letra. Un titular largo metido a la fuerza en una linea se lee peor en el feed que el mismo titular partido y grande.
- Sale del mismo sitio que `§0a-quater`: en el movil manda la legibilidad, no la simetria.

## 🔴 0a-penta · DESPUES DE TODO PROMPT DE IMAGEN, EL RECORDATORIO DE POSTPRODUCCION (Iker, 2026-07-27)

**Siempre que entregues un prompt de imagen — de calca, de edicion, de cero, de cualquier pilar — justo DEBAJO del bloque del prompt va este aviso en rojo, sin excepcion:**

> 🔴 **Acuérdate Mario de aplicar el desenfoque de superficie en Photoshop y de exportar sin metadatos con Exportar como.**

**⛔ UNICA EXCEPCION: el pilar "LOS 10" (Iker, 2026-07-28).** Ahi la imagen NO la genera una IA: la **compone `scripts/montar-orla.py`** pegando las fotos de LinkedIn sobre la plantilla que pasa Iker, pixel a pixel. No hay acabado de render que suavizar ni metadatos de generador que borrar, asi que **en "Los 10" NO se pone el aviso**. En todos los demas pilares si, porque la imagen sale de un generador.

**🚨 Y SOBRE TODO CUANDO LA IMAGEN QUEDA CERRADA (Iker, 2026-07-29).** Hoy entregue cuatro prompts de edicion seguidos del meme del tatuaje y **no puse el aviso en ninguno**, ni siquiera al dar la imagen por definitiva. **El momento critico es ese**, porque es cuando Mario deja de iterar y se va a subir el fichero:

- **Debajo de CADA prompt de imagen** va el aviso, tal cual, aunque sea la quinta pasada. Junto al ⚠️ de adjuntos (`§0i`), primero los adjuntos y despues este.
- **Y cuando la imagen se da por DEFINITIVA** — se apruebe con prompt o sin el, aunque no haya mas edicion que entregar — el aviso se repite **solo, en su propio bloque**, con la frase de por que: sin el desenfoque la imagen conserva el acabado de render y los metadatos del generador, y se nota que es IA.

**Por que en TODOS y no solo en el ultimo (Iker, 2026-07-29):** desde fuera **no hay forma de saber cual es la ultima pasada**. Iker lo sabe cuando ve la imagen, yo no. Asi que va en todos por si acaso, y cambia el TONO segun el momento:

- **Mientras se itera** → en modo **recordatorio**, seco y de una linea. Que no estorbe.
- **Cuando Iker dice explicitamente que la imagen esta perfecta o la da por buena** → en modo **alerta final**, en su propio bloque, con el porque y con el detalle de las Content Credentials. Ese es el momento en que se ejecuta de verdad.

**El disparador no es "he escrito un prompt", es "esta imagen se va a subir".** Si la imagen se cierra sin que haya un prompt de por medio, el aviso va igual.

**⚠️ EL DESENFOQUE NO VA EN LAS FOTOS REALISTAS DE PERSONAS (Iker, 2026-07-30).** Aqui iban los dos pasos siempre juntos y **no son lo mismo**:
- **Desenfoque de superficie → SOLO en piezas de DISEÑO generadas** (infografias, tablas, ilustraciones, portadas). Ahi mata el acabado de render. **En un rostro fotorrealista lo ESTROPEA: le quita el poro y la textura de piel y lo convierte en un dibujo animado**, que es justo lo contrario de lo que busca un meme de reaccion.
- **Exportar sin metadatos → SIEMPRE**, venga de donde venga. Eso va de la firma del generador, no del aspecto.
- **JPG calidad 10 a 500x500 → SOLO en memes** (`§0`). Es lo que hace que parezca reenviado mil veces. **Y en un meme de foto realista este paso SUSTITUYE al desenfoque**: el pixelado del JPG ya rompe el acabado limpio sin cartonizar la cara.

Los dos pasos son de postproduccion y se olvidan porque no estan en el prompt: el **desenfoque de superficie** le quita el acabado de render a la imagen generada, y **exportar sin metadatos** borra la firma del generador (`Exportar como…` o `Guardar para web`, con **Metadatos: Ninguno`; NUNCA `Guardar como`, que los arrastra). Ojo tambien con las **Content Credentials de Adobe (C2PA)**: van por un canal aparte y el "Metadatos: Ninguno" no las toca, hay que desactivarlas en `Ventana > Content Credentials`.

## ⭐ 0a-quater · EL TEXTO DE LA IMAGEN SIEMPRE LEGIBLE (Iker, 2026-07-27)

**Todo texto que metamos en una foto tiene que leerse comodo EN EL FEED Y EN EL MOVIL**, que es donde entra la mayoria. No vale que se lea bien en el fichero a tamano completo: la imagen se ve reducida y a un pulgar de distancia.

- **Al generar, pidelo explicitamente**: que el texto de dentro (cabeceras, filas, etiquetas) sea grande y comodo de leer en movil.
- **Si no cabe, el sitio se saca de los margenes y del interlineado**, y si hace falta se baja el titular. Lo que NO se hace es encoger el contenido: el contenido ES la prueba del recurso.
- Al pedirlo, dale una **operacion y un espacio** (`§0c`), nunca un juicio: *"agranda el texto de la tabla y aprovecha el espacio que sobra a los lados"*, no *"que se vea mejor"*.
- Caso real (lead magnet de prospeccion manual, 2026-07-27): el titular se comia el protagonismo y la tabla quedaba pequena. Se agrando la tabla usando margenes e interlineado y se bajo el titular: quedo legible sin perder ninguna fila.

## 🔴 0a-septima · QUÉ SE CAMBIA Y QUÉ NO AL CALCAR (Iker, 2026-07-29)

Al remixar una referencia hay **dos capas** y se confunden con facilidad. **Yo me equivoqué al revés en el meme del tatuaje**: cambié el motor y dejé los detalles.

**LO QUE NO SE TOCA NUNCA: la esencia viral.** El objeto o la mecánica que HACE el chiste. En el email de Félix era **el tatuaje**: tatuarse el logo de un cliente que ni contesta es irreversible y absurdo, y por eso funciona. Lo cambié por una tarta y se cayó el gag: una tarta se congela, no duele, no compromete. **Precedente que ya pagamos:** el meme del perro se hundió cuando cambiamos el perro por un comercial, y meses después, respetando la esencia del perro, **rompió todas nuestras estadísticas.**

**LO QUE SÍ HAY QUE CAMBIAR SIEMPRE, para que no nos pillen el calco:**
- **La hora** que sale en la captura. **Con minuto impar** (`09:47`, no `10:46`).
- **El nombre del remitente:** el del dueño de la cuenta donde se publica (Unai, Iker o Asier).
- **El nombre del destinatario:** un **nombre común en el País Vasco**, que es de donde es la mayor parte de la audiencia. Rota y no repitas. **Ya gastados: Mikel** y **Iñaki** (meme del tatuaje, Unai, 2026-07-29). Libres: Gorka, Aitor, Jon, Ander, Eneko, Julen, Imanol, Beñat, Koldo. **Apunta aquí el que uses cada vez.**
- **La foto de perfil** que aparezca: la del dueño de la cuenta.
- Y cualquier dato identificable del original (empresa, ciudad, cifras).

**La prueba para no dudar:** si al quitar ese elemento el chiste sigue funcionando, es un detalle y se cambia. Si al quitarlo el chiste se cae, es la esencia y se respeta.

**⚠️ LA TENTACION DE METER NUESTRO LOGO EN LA ESENCIA (Iker, 2026-07-29).** Cuando la esencia viral es un objeto que lleva una marca (el tatuaje del logo del cliente, una taza, una camiseta, un cartel), sale sola la idea de **poner ahi el logo de Neety**. Suena a originalidad y es lo contrario:

- **Se cae la frase.** El chiste era *me tatuo el logo del CLIENTE al cerrar un trato*. Con el nuestro no hay chiste, hay un tio con un tatuaje.
- **Se cae la credibilidad.** La pieza vive de que el lector se crea dos segundos que eso paso de verdad (`§0a-sexta-bis`). Un logo nuestro nitido dice "anuncio" antes de que lea el texto.
- **El pixelado es parte del gag, no un defecto.** Una persona real tapa el logo de su cliente para no exponerlo. Ese gesto es lo que lo hace autentico.

**Regla:** la marca ajena que aparece dentro de la esencia va **pixelada o irreconocible**, nunca sustituida por la nuestra. Nuestra marca no entra en la imagen (`§0a-bis`); entra en el spam ninja y en el enlace.

**Corolario, porque la duda salio dos veces el mismo dia:** una vez decidido que va pixelado, **lo que haya debajo es irrelevante, porque no se ve**. No merece la pena otra pasada para que el borron sea "algo de ventas". Y si se hiciera reconocible, seria peor: la censura solo tiene sentido tapando una **marca real**; censurar un icono generico hace que el lector se pregunte por que lo tapas y se le cae la ilusion. **El contexto ya lo dice**: la frase de al lado nombra el logo del cliente, la imagen no tiene que repetirlo.

### 0a-septima-bis · LA PERSPECTIVA DEL PANTALLAZO (Iker, 2026-07-29)

Antes de repartir nombres y fotos, **decide desde qué bandeja se ve la captura**, porque de eso depende quién es quién. Y esa decisión la manda el CUERPO del post, no la referencia.

- **Si el post está escrito en primera persona activa** (*"a mí no me dejan en visto"*, *"lo que yo hago es…"*) → la captura es de **ENVIADOS**. El dueño de la cuenta es el remitente (`me`), su foto va en el avatar, y el destinatario es el cliente: solo su nombre, sin foto.
- **Si el post está escrito en primera persona receptora** (*"me llegó esto"*, *"mira lo que me contestaron"*) → la captura es de **RECIBIDOS**. El dueño de la cuenta **NO puede aparecer como remitente**, porque nadie se manda correos a sí mismo. El remitente es otra persona: nombre vasco de la lista de rotación y, como cara, **una foto de stock libre de derechos** de un empresario de 20-30 años que dé el pego en el País Vasco. Nunca la cara de un cliente real ni la de un tercero identificable.

**El error que hay que evitar:** heredar la bandeja de la referencia sin mirar si el cuerpo que hemos escrito va en esa dirección. Si no cuadran, la imagen desmiente al texto en el primer segundo.

### 0a-septima-ter · EL PANTALLAZO, ÍNTEGRO EN ESPAÑOL (Iker, 2026-07-29)

La interfaz que imitamos **está en español entera**, incluidas las palabras del sistema que el generador tiende a dejar en inglés porque la referencia venía así. **Una sola palabra en inglés delata que la captura es falsa.** Repásalo antes de mandar el prompt:

- Gmail: `me` → **`yo`** · `to` → **`para`** · `Inbox` → **`Recibidos`** · `Sent` → **`Enviados`** · `Reply` → **`Responder`**
- WhatsApp: `online` → **`en línea`** · `typing…` → **`escribiendo…`**
- LinkedIn: `Connect` → **`Conectar`** · `followers` → **`seguidores`**

### 0a-septima-quinquies · EL TEXTO DENTRO DE UN PANTALLAZO (Iker, 2026-07-29)

Tres defectos que salieron en la segunda pasada del meme del tatuaje y que **tenian que haber ido ya en el primer prompt**. Van los tres, siempre, desde la version uno:

1. **TILDES Y EÑES, SIEMPRE, aunque la referencia no las lleve.** El generador escribe *habeis, tatuo, veia, adelante, Inaki* porque copia la falta del original. **Nosotros copiamos y MEJORAMOS:** el original tenia faltas y nosotros no. Y los **signos de apertura** tambien: `¿` y `¡` se le pierden solos. Repasa palabra por palabra antes de dar el prompt.
2. **La frase literal de la referencia se REESCRIBE, no se calca.** No basta con cambiar nombres, hora y foto (`§0a-septima`): **el texto tambien delata**. En el tatuaje deje *¿esto lo habeis pausado o ha muerto del todo?* practicamente igual que el original. Se mantiene la esencia (la pregunta binaria pasivo-agresiva) y se cambia la redaccion: *¿esto sigue en pie o lo doy por muerto?*
3. **Interlineado y tamaño.** El generador separa los parrafos con el doble de aire del que tiene un correo real y a veces cambia el cuerpo de la ultima frase. Se pide siempre: **junta un poco los parrafos, que ahora hay demasiado espacio en blanco, y que todas las frases tengan el mismo tamaño de letra y la misma altura de linea.**

**El objetivo es que la version UNO ya salga perfecta.** Cada pasada extra es tiempo del diseñador y riesgo de que se rompa algo que ya estaba bien.

### 0a-septima-quater · REENCUADRE Y AIRE (Iker, 2026-07-29)

Dos defectos que salen solos al pasar una referencia **vertical a cuadrada** y hay que pedir siempre a mano:

1. **El ancho.** Al cuadrar, el generador deja una franja blanca muerta a la derecha y encoge el contenido. Se pide así, en llano: **«el correo tiene que ocupar todo el ancho de la imagen, aprovecha el espacio que queda vacío a la derecha, sin estirar ni deformar las letras»**.
2. **El aire arriba.** El bloque de foto, nombre y hora sale pegado a la barra superior. Se pide: **«deja más espacio entre la barra superior y el bloque de la foto, el nombre y la hora»**.

**Cómo se le habla al generador:** órdenes concretas y visuales sobre QUÉ mover y HACIA DÓNDE. **No entiende instrucciones de criterio** como «céntralo bien», «equilibra la composición», «que respire» o «mejora el encuadre»: las ignora o hace cualquier cosa.

## ⭐ 0a-sexta-bis · LA PALETA DE MARCA NO SE APLICA A LOS SCREENSHOTS DOCUMENTALES (Iker, 2026-07-29)

La paleta nueva (`§0a-ter`) manda en todo lo que **diseñamos nosotros**: infografías, orlas, portadas de guía, carteles. **NO se aplica cuando la imagen IMITA UNA PANTALLA REAL** (un correo de Gmail, un chat de LinkedIn, la app del banco, un CRM, un panel de analíticas).

**Por qué:** en ese registro **el realismo ES la credibilidad** (`§2`). Si le pones la barra de Gmail en berenjena y el fondo del correo en mint, deja de parecer una captura y pasa a parecer una creatividad de empresa, y el chiste se cae: la gracia depende de que el lector **se crea que ese mensaje se mandó de verdad**.

**La frontera, para no dudar:** ¿la pieza finge ser una captura de algo que existe? → **colores reales de esa interfaz**. ¿La pieza es nuestra y se ve que la hemos hecho? → **paleta de marca**. Caso: el meme del email de la tarta va con el gris de Gmail y el texto en negro sobre blanco, a propósito.

## 0b · ⬛ TODA imagen va CUADRADA (1:1). SIN EXCEPCIONES.
> Aplica a **los 4 pilares y a cualquier foto que publiquemos**: meme, mapa, "Los 10", lead magnet, evento. Es lo primero que se comprueba y lo último que se negocia.

- **Por qué:** LinkedIn recorta la previsualización del feed. Una imagen **vertical alargada pierde la parte de arriba y la de abajo**, que suele ser justo donde está el titular y el remate. La imagen la ve el 100% del que scrollea; el post entero, solo el que abre "ver más".
- **Medido en nuestro histórico (2026-07-14): 19 de 20 imágenes de outliers son exactamente 1:1.** Cold calling 16.45x, wojak 16.56x, Gipuzkoa 12.92x, Navarra 7.72x, Galicia 7.28x, "Los 10" 4.81x… todas 800x800 o 480x480. **La única foto que NO es cuadrada (800x450, 16:9) es el lead magnet de las llaves: 4.10x**, el más flojo del grupo. (Las otras dos excepciones son un vídeo y un documento, que no cuentan.)
- **Tamaño recomendado: 800x800** (es el que más se repite en los que funcionaron). 480x480 también vale.
- **⚠️ AL CALCAR UNA REFERENCIA, el formato es NUESTRO, no suyo.** Si el original es vertical (la referencia del meme del perro era **480x720**, ratio 0,67), el remix **se recompone a 1:1**: se calca la esencia, nunca el encuadre malo (`post-workflow §4.4`, tabla de qué se calca). Calcar un 2:3 es entregar un post recortado.
- **En el prompt de imagen va escrito siempre**, con estas palabras: `en formato cuadrado 1:1`.

## 0c · 🎯 CÓMO SE LE PIDE UNA COLOCACIÓN (nunca digas "céntralo")
> Técnica validada peleándose con la herramienta. Aplica a cualquier prompt de imagen, de cualquier pilar.

**El fallo:** pedirle un JUICIO. `céntralo` · `alinéalo` · `ponlo en el centro` · `equilíbralo`. La herramienta **no mide, mueve**. Si le pides que evalúe si algo está centrado, se equivoca **siempre**.

**Lo que funciona: dale una OPERACIÓN, no un resultado.** Nómbrale el **espacio disponible** y la **dirección**:
- ❌ `Centra el título "Realidad".`
- ❌ `El título está descentrado, muévelo a la izquierda.`
- ✅ `Aprovecha el espacio que le queda a la izquierda al título "Realidad" para que quede centrado.`

**Validado (2026-07-14):** en la referencia del meme del perro, el título "Realidad" tiraba al centro en vez de a la izquierda. Con `céntralo` fallaba; con **"aprovecha el espacio que tiene a la izquierda para centrarlo"** salió perfecto a la primera.

**La plantilla:** `aprovecha el espacio que [elemento] tiene hacia [la izquierda/la derecha/arriba/abajo] para que [quede centrado / respire / llene el ancho]`.
Sirve para todo lo espacial: separar del borde, llenar un hueco, subir algo que cuelga. **Describe el movimiento y el espacio, nunca el resultado abstracto.**

## 0d · ⭐ EL OBJETIVO NO ES CALCAR: ES CALCAR Y MEJORAR
> Al remixar una referencia se copia la **esencia** (`post-workflow §4.4`), pero **los DEFECTOS del original no se heredan: se arreglan**. Ser fiel no es ser fiel a sus fallos.

- El original lo hizo un humano con prisa. Que algo esté ahí no significa que sea lo que funcionó: puede ser simplemente lo que le salió.
- **Lo que se arregla siempre, sin preguntar:** encuadre alargado → **1:1** (`§0b`) · textos descentrados → colocados con la técnica de `§0c` · nuestra paleta y nuestros detalles de marca (`§4`).
- **Lo que NO se toca aunque te pique:** la mecánica cómica, el sujeto, el layout, el estilo de dibujo. Eso es el motor.
- **La pregunta:** ¿esto es lo que hizo volar al post, o es un defecto que nadie ha mirado? Lo primero se calca. Lo segundo se mejora. **Estos detalles de diseño marcan la diferencia entre un remix y una copia peor que el original.**

## 0e · 🏷️ NOMBRES DENTRO DE UNA IMAGEN (orla de "Los 10"): NO son la @ del post
> **El fallo (2026-07-15):** metí `OUAZZANI TOUHAMI ASMA` tal cual en la orla porque así lo tiene en LinkedIn, y salió gritando en mayúsculas al lado de 9 nombres en Title Case.

**La distinción que lo explica, y que hay que tener siempre presente:**
| Artefacto | Regla del nombre | Por qué |
|---|---|---|
| **La @ del POST** | **EXACTO como LinkedIn**, sin tocar una letra (`post-workflow §4.0`) | Si no coincide, no salta el autocompletado y **la mención muere** |
| **La IMAGEN (orla)** | **Normalizado** (abajo) | Es texto DIBUJADO: no hay mención, no hay autocompletado, no hay nada que romper. Manda el diseño |

Son artefactos distintos con reglas opuestas. **No apliques la del post a la imagen.**

**Las 3 reglas de la orla:**
1. **Title Case siempre.** Solo la inicial de cada palabra. `OUAZZANI TOUHAMI ASMA` → `Asma Ouazzani`. Un nombre en mayúsculas rompe la coherencia visual de toda la plantilla.
2. **Nombre completo + PRIMER apellido.** Todos con un apellido, para que ninguno desborde. ⚠️ **El nombre COMPUESTO no se parte**: `Jose Antonio Garcia Sanchez` → `Jose Antonio Garcia`, **nunca** `Jose Garcia`. "Antonio" no es su apellido.
   - **No lo adivines partiendo la cadena: Unipile ya te lo da resuelto** en `first_name` y `last_name`. `first_name="Jose Antonio"`, `last_name="Garcia Sanchez"` → nombre completo + `last_name.split()[0]`. Cero heurística.
   - **El guion NO separa apellidos:** `Fernández-Catuxo García` es UN primer apellido (`Javier Fernández-Catuxo`), no dos.
3. **⚠️ Comprueba que los campos no estén INVERTIDOS.** Mucha gente rellena LinkedIn al revés, sobre todo con convenciones no españolas. Caso real: Asma tenía `first_name="OUAZZANI TOUHAMI"` y `last_name="ASMA"`. **El desempate lo da su `public_identifier`**, que es lo que ella misma eligió: `asma-ouazzani` → Asma es el NOMBRE. Aplicar la regla a ciegas habría puesto el apellido delante del nombre en la orla.

**Lo que NO se toca: las tildes.** Si escribe `Jose Antonio Garcia` sin tildes, va sin tildes. Así escribe él su nombre y corregírselo es inventar. La incoherencia de tildes no canta; la de MAYÚSCULAS sí.

## 0f · ⛔ LO QUE UN MODELO DE IMAGEN NO PUEDE HACER: PEGAR
**Un modelo generativo no compone capas, sintetiza píxeles.** No tiene una operación de "pegar esta foto aquí": mira tu foto, la interpreta y **dibuja una parecida**. Por eso, al pedirle que metiera 10 retratos en una plantilla, devolvía caras de otras personas, cambiaba el color de los ojos, suavizaba las fotos malas hasta convertirlas en modelos, metía ruido en los fondos oscuros y descentraba el título. **Todo eso es la MISMA causa y ninguna es un fallo de instrucción.**
- **No se arregla con prompt.** Cada "no toques" que añades lo alarga y le hace menos caso a todo. Si te ves escribiendo la tercera ronda de "no lo suavices", el problema es la herramienta.
- **La regla:** si la operación es **determinista** (pegar, recortar, enmascarar, colocar, redimensionar), la hace un **script**; el modelo es para lo que hay que **inventar** (un meme nuevo, una escena). Caso: `scripts/montar-orla.py` (`post-workflow §4.3` Paso 6b) → 0 píxeles de la plantilla tocados, foto idéntica al original.
- Es la misma lección que el validador de posts y que el sorteo del agradecimiento en `replyGenerator`: **lo que se puede comprobar o ejecutar mecánicamente no se le pide por favor a un modelo.**

## 0g · 🎭 EL REGISTRO DE LA IMAGEN VA POR CUENTA (Unai ≠ Iker)
> La escala de voz de `brand-voice §1b` **también aplica a la imagen**, y aquí es donde más se nota. Fue lo que falló con el meme del perro en la cuenta de Unai.

**Son DOS cajones, no tres** (matizado por el usuario el 2026-07-16):

| Cuenta | Qué meme le pega |
|---|---|
| **Unai** (fundador) y **Asier** | **Meme INTELIGENTE, para industriales, inequívocamente de ventas, y NUNCA infantil.** El chiste lo tiene que pillar un director comercial de 50 años y tiene que pensar "esto lo ha escrito alguien que ha vendido". Sirven: capturas reales, informes, gráficos, fotos, un wojak (que es feo, no mono). **No sirven:** dibujos de animales, caricaturas tiernas, cualquier cosa con pinta de canal de memes |
| **Iker** | **Cualquier meme outlier**, del formato que sea, con la única condición de siempre: **adaptado a ventas** (`global §2.3`, el test del ancla). Aquí no hay restricción extra: es la regla estándar de cualquier post |

- **El meme NO se le prohíbe a Unai ni a Asier**, y confundirlo saldría carísimo: el mejor post de la historia de Unai (**16.62x**) ES un meme, el wojak de la caja de herramientas. Lo que se les prohíbe es el **registro infantil**. Un wojak es feo; un border collie dibujado es mono. Esa es toda la frontera.
- **El texto de Unai ya era sobrio en ese 16.62x.** En su cuenta la sobriedad se juega en la IMAGEN, no en el texto.
- Si una referencia es buenísima pero su imagen es un dibujo tierno, **va a la cuenta de Iker**, no a la de Unai ni a la de Asier. Cambiar de cuenta es gratis; forzar el registro, no.
- ⚠️ **"Inteligente y específico de ventas" NO significa "de nicho".** `global §2.4` sigue mandando: el claim tiene que aterrizar en CUALQUIERA cerca del B2B comercial. Un meme que solo pilla el SDR ultratécnico es un meme del 1% y no viaja, en la cuenta de quien sea. El modelo es el 16.62x: *"cada año la caja de herramientas engorda pero el comercial cierra menos"* lo entiende cualquier comercial, y aun así suena a industrial y no a creador. **Específico de ventas = pasa el test del ancla; no = jerga que estrecha el alcance.**

## 0h · 🖼️ EL TEXTO DE LA IMAGEN (4 reglas que faltaban, 2026-07-16)
> Las cuatro salieron de la misma tanda de correcciones sobre el meme de Asier. Ninguna era un fallo de esa imagen: eran reglas que no estaban escritas.

**1 · ⭐ EL TÍTULO DE LA IMAGEN TAMBIÉN SE ANCLA A VENTAS.** El test de `global §2.3` ("¿esto SOLO puede publicarlo una cuenta de ventas?") **no es solo del hook: es de todo lo que se lee**, y el título de la imagen se lee tanto como el hook.
- ❌ **Caso real:** el hook se corrigió a *"En ventas, el pedido encoge…"* porque "pedido" es ancla ambigua… y el título de la imagen se quedó en **"LA VIDA DE UN PEDIDO"**, igual de genérico. Lo puede firmar un jefe de logística. Se arregló el hook y se dejó el mismo agujero al lado.
- ✅ **Corregido a "EL PEDIDO SUBE. LA VENTA NO."** — ancla fuerte ("VENTA") y encima cuenta el chiste.

**1b · ⭐ EL TÍTULO ES UN SEGUNDO GANCHO: CORTO, PUNCHY Y GENERICO** (Iker, 2026-07-20).
No basta con que ancle a ventas y no repita el hook. **Se le exige lo MISMO que al gancho del post**, porque compite con el en la misma pantalla:
- **CORTO.** 3-5 palabras. Si necesita una subordinada, no es un titulo, es una frase.
- **VERBO PUNCHY** (`global §2.9`). Un verbo de estado ("se parece", "es", "tiene") mata el titulo aunque el concepto sea bueno.
- **GENERICO DE VENTAS, no jerga interna.** "Cierre de trimestre", "forecast", "pipeline QoQ" estrechan: los entiende un SDR, no un director industrial de 50 (`global §2.3`). El ancla tiene que ser de ventas Y universal.
- ❌ **Caso real (meme del Mundial):** primer titulo *"Una final se parece mucho a un cierre de trimestre"*. Largo, verbo de estado, y "cierre de trimestre" es jerga.
- ✅ **Corregido a "Cerrar cuesta pelo".** Tres palabras, verbo con techo, "cerrar" ancla a ventas sin ser jerga, y cuenta el chiste del grafico.

**2 · EL TÍTULO NO REPITE EL HOOK.** Si el hook ya dice *"En ventas, el pedido encoge cada vez que sube un piso"*, la imagen **no lo vuelve a decir**: el lector lee lo mismo dos veces y la foto no aporta nada. El título de la imagen es **otra frase** del mismo chiste, no un eco.

**3 · ⛔ SIN FOOTER, NUNCA.** Aunque la referencia lleve una franja inferior (la del meme de The Office llevaba *"BREAKING NEWS: 99% OF DEALS DIE OF OVER-COMMUNICATION"*), **se quita**. Queda fatal. La imagen termina en la última fila. Es de las cosas que se calcan NO (`§4.4`: el formato es nuestro, no el suyo).
- Y en la misma familia: **cero logos y cero marcas de agua**. Nuestra marca se pone con la paleta y los detalles, nunca con un logo pegado.

**4 · SE TRADUCE **TODO** EL TEXTO DE LA IMAGEN, no solo las etiquetas.** Si el post se traduce, la imagen también. **Mira los rincones**, que es donde se queda el inglés: badges, botones, estados y micro-copia de las capturas. Caso real: se tradujeron las 6 etiquetas grandes y la columna derecha entera se quedó en inglés (`Delivered`, `Pending`, `Subject: Following up…`, `Send`). Traducciones: Delivered → Entregado · Pending → Pendiente · Send → Enviar · Subject → Asunto.


## ⭐ 0h-2 · EN UN LEAD MAGNET, EL TITULO DE LA IMAGEN NOMBRA EL ARTEFACTO (Iker, 2026-07-21)

**El titulo de la imagen NO siempre busca punch.** En meme si: la imagen es el motor y el titulo remata el chiste (`§0h`, `§1b`). **En un lead magnet la imagen es la PRUEBA del recurso**, y entonces el titulo tiene un trabajo distinto: **decir que es lo que estas viendo**.

**La evidencia:** Guillermo Flor, 12.3x. Su titulo es *"The Angel Investor List"* — **descriptivo, sin un solo verbo, cero punch**. Funciona porque nombra el artefacto, y el punch de esa imagen lo ponen el "1,000" del subtitulo y las caras reconocibles de la tabla. **El punch ya lo lleva el gancho del texto; repetirlo en la imagen desperdicia el unico sitio donde se puede dar claridad.**

**Regla: en lead magnet, el titulo de la imagen tiene que contener la palabra que nombra el recurso** (lista, plantilla, guion, calendario). Si el titulo es punchy pero no dice que hay dentro, **esta mal**, por bueno que suene. Fallo real de ese dia: *"Vender sin llamar a ciegas"* — mejor frase que la suya y peor titulo, porque no nombraba la lista.

**Donde se le gana** (`global §2.2b`, ser el segundo mejor): nombras el artefacto igual que el, y añades en el mismo titulo la mejora que traemos. Titulo final: *"Tu lista de empresas, no la de todos"* — nombra la lista **y** dice en cuatro palabras que la suya es para todos y la nuestra es tuya.

**Reparto de trabajo, calcado del original:** el **titulo** nombra el artefacto, el **subtitulo** lo cuantifica y lo acota ("25 empresas de tu sector que estan comprando ahora"), y **las filas dan la prueba**. Tres capas, cada una con su funcion.

## ⭐ 0h-3 · TITULO LARGO: SE PARTE EN ESCALERA, Y SIEMPRE ASCENDENTE (Iker, 2026-07-21)

La escalera estaba escrita para el cuerpo del post (`global §3.2`) y para el titular de la web (`lead-magnet-web`), pero **no para el titulo de una imagen**. Va aqui.

**Hasta ~40 caracteres, una sola linea.** Es lo que hacen las referencias que funcionan: Guillermo Flor titula *"The Angel Investor List"*, 23 caracteres, una linea. **Partir un titulo que cabe rompe el calco** y le da al diseñador una decision que no tiene que tomar — el prompt debe decir explicitamente "en una sola linea", o la parte por su cuenta.

**Por encima de ~40, se parte en dos, en escalera ASCENDENTE**: linea 1 mas corta que la linea 2, ratio linea1/linea2 entre **0,65 y 0,80**, el mismo que ya usamos en el titular de la web. El corte va en la pausa natural de la frase, no donde toque por longitud.

**⚠️ Si al partir por su pausa natural la escalera sale INVERTIDA, no la partas: reescribe la frase.** Una escalera al reves es el mismo zigzag que `§3.2` prohibe en el cuerpo, y en un titulo se ve el triple porque son solo dos lineas. Caso real de ese dia: *"Tu lista de empresas, no la de todos"* corta en 21/14 — descendente. Como cabia en una linea (36 caracteres), se dejo en una. Si no hubiera cabido, habria tocado reescribirla, no partirla mal.

## ⭐ 0i-1 · VARIOS ASSETS: VAN EN UN ZIP, Y SE PROHIBE REDIBUJARLOS (Iker, 2026-07-21)

**Iker genera las imagenes con ChatGPT.** Dos limitaciones medidas el 2026-07-21, y las dos se arreglan en el prompt.

**1. Con imagenes sueltas no lee el nombre del fichero.** Da igual lo bien numeradas que esten: subidas una a una, el nombre se pierde y no puede emparejar `03-grupo-antolin.jpg` con la fila de Antolin. **Solucion: un ZIP.** ChatGPT lo descomprime con el interprete de codigo y **ahi si ve los nombres**. Y de paso evita subir quince adjuntos.

Por eso, **a partir de 3-4 assets, van en ZIP con el nombre numerado igual que la lista de datos del prompt**, y el prompt le dice explicitamente que lo descomprima y empareje por ese numero.

**2. 🔴 REDIBUJA LOS LOGOS EN VEZ DE PEGARLOS.** Es el riesgo grande: el generador no compone con los ficheros, los reinterpreta, y salen quince marcas reales con el logo deformado. Se ve a la primera y queda entre chapucero y falso.

**El prompt tiene que llevar esta prohibicion, en el cierre en minusculas** (`§0h`): *"no vuelvas a dibujar ni a reinterpretar ningun logo: los logos se pegan tal cual vienen en el ZIP, y si alguno no lo puedes pegar, deja esa celda sin logo antes que dibujarlo tu"*. La segunda mitad es la importante — **darle una salida** para que no rellene inventando, igual que con los datos.

**Y en la entrega hay que avisar a Iker de que revise los logos uno a uno antes de publicar.** Vale para cualquier asset de marca ajena: logos, capturas de producto, packshots. **Mejor sin logos que con logos mal.**

## ⭐ 0h-4 · LA CIFRA DE LA IMAGEN Y LA DEL TEXTO SON LA MISMA (Iker, 2026-07-21)

**Si la imagen enseña filas contables, el numero del gancho tiene que ser EXACTAMENTE el numero de filas.** Guillermo Flor puede decir "1,000" y enseñar 35 filas porque nadie espera ver mil; **entre 25 y 15 se cuenta a ojo**, y el lector que las cuenta descubre que le prometes mas de lo que enseñas. En un lead magnet, donde lo unico que vendes es la credibilidad del recurso, eso lo mata.

Fallo real de ese dia: gancho con 25 e imagen con 15. Se corrigio bajando el texto a 15, no subiendo la imagen. **Enseñar la lista ENTERA es mas creible que enseñar una muestra**, y de paso la imagen queda mas minimalista y el recurso se monta en la mitad de tiempo.

**Los tres sitios que tienen que decir el mismo numero:** el gancho, la linea del entregable en el cuerpo, y el subtitulo de la imagen. **Si cambias uno, cambias los tres.** Y el numero sigue siendo impar (`global §2.5b`).

**Y ajusta la densidad de la tabla al numero real de filas:** si la referencia trae treinta y tu llevas quince, el prompt tiene que pedir mas aire entre filas, o la tabla queda apelotonada arriba y medio cuadrado vacio.

## ⭐ 0i-2b · MEME SOBRE PELÍCULA O FAMOSO: NO SE GENERA CON IA, SE MONTA POR ENCIMA (Iker, 2026-07-22)

**Medido el 2026-07-22:** el meme del Aquaman/rastrillo (referencia real, 10.4x) hizo que ChatGPT devolviera *"la imagen podría infringir nuestras normas relativas a la similitud con contenido de terceros"*. Es el filtro de **copyright + parecido con persona real** (Aquaman = película de Warner; Jason Momoa = actor real), más duro que el de los logos. **No se salta.**

**Lo que NO se hace:** ni decir "la imagen es de nuestra propiedad" (es FALSO, no es nuestra), ni cambiar el modo de generación para colarlo. Es la misma mentira que con los logos (`§0i-2`), y además generar con IA un póster de peli y la cara de un actor para un post de marca es justo lo que el filtro bloquea con razón.

**Lo que SÍ se hace: el meme sobre una imagen con copyright NO se genera con IA, se monta por ENCIMA de la plantilla que ya existe** — que es como se hacen los memes: la imagen se usa tal cual de plantilla y solo se le cambia el texto. Publicar un meme de foto de peli es práctica normal (el original hizo 10.4x); lo que es estricto es el *generador* de IA, no el publicar. Dos vías:
- **Canva/Photoshop:** coger la plantilla (imgflip, "Aquaman rake meme") y poner nuestras etiquetas con Bricolage. Cero IA, cero filtro.
- **Script (Pillow):** overlay directo sobre la imagen de referencia — cajas oscuras que tapan el texto original + etiquetas en español (Impact blanco con borde, la palabra clave en naranja `#ee9363`), cuadrado 1:1, tapando la marca de agua. Validado el 2026-07-22 (`meme-stack-asier.png`).

**Consecuencia para elegir referencia (`post-workflow §4.4`):** al bajar por Inspiration, si el meme outlier se monta sobre un **fotograma de película / cara de famoso**, sé consciente de que **la imagen NO la va a generar la IA** — se hará por overlay. No es motivo para descartarla (el motor sigue siendo válido), pero sí para avisar y montarla a mano.

## ⭐ 0i-2 · LOGOS DE TERCEROS: EL GENERADOR LOS RECHAZA, Y SE SACAN DE LA IMAGEN (Iker, 2026-07-21)

**Medido el 2026-07-21:** un prompt que pedia colocar quince logos de empresas reales hizo que ChatGPT devolviera *"se ha producido un error en la herramienta de generacion"*. Es el filtro de marcas de terceros, y **no se arregla insistiendo ni reformulando el prompt**.

**Lo que NO se hace: dar a entender que las marcas son nuestras para que el filtro pase.** Es mentirle a la herramienta, y si alguien pregunta de donde salen esos logos la respuesta es que la engañamos. El uso real es legitimo — una tabla de datos publicos — pero la salida no es disfrazarlo.

**Lo que si se hace, y ademas resuelve el otro problema:** que el generador no toque los logos. Recuerda que **de todas formas los redibuja** (`§0i-1`), asi que sacarlos de la imagen elimina dos riesgos de una vez.

**Dos opciones, por orden:**
- **A · Sin logos.** La tabla va solo con texto. Es lo mas limpio, sale a la primera, y **la credibilidad la dan los nombres reales leidos** — Gestamp o Naturgy se reconocen sin logo. Se pierde calco, se gana que funcione.
- **B · Hueco gris y los pega Iker.** El generador deja un circulo vacio por fila y los logos se pegan encima en Canva. Salen nitidos y sin deformar, que es como deberian ir. Cuesta cinco minutos.

  **⚠️ En la opcion B el generador NO ve los logos, ni en ZIP ni sueltos.** Lo que dispara el filtro es la marca ajena, no el formato del adjunto: pasarlos de uno en uno da el mismo error. Al generador solo se le adjuntan la referencia y las fuentes. El ZIP se queda para Canva.

  El prompt le pide **circulos grises lisos y vacios** en el sitio de las fotos, con un "no pongas nada dentro de los circulos" en el cierre — si no, los rellena con algo inventado.

**Y en el prompt, la frase que evita el rechazo sin mentir:** *"lo que estas maquetando es una tabla de datos publicos, asi que tratalo como una maquetacion tipografica: el resultado es texto sobre fondo, sin ilustraciones, sin iconos y sin ningun logotipo"*. Describe la tarea de verdad y le quita al generador la parte que dispara el filtro.

## ⭐ 0i-3 · EL PROMPT SE ESCRIBE COMO SE LE HABLA A UN AMIGO (Iker, 2026-07-21, ya avisado antes)

**Los prompts largos y con puntuacion rara fallan.** Medido el 2026-07-21: un prompt de edicion con parentesis numerados, comillas y frases encadenadas dio error de generacion tres veces seguidas. La version corta y hablada paso a la primera.

**⚠️ Lo que NO cambia nunca, por corto que sea el prompt** (`§0h`): abre con **SOLO HAZ LO QUE TE PIDO en mayusculas**, cierra con **deja todo lo demas intacto y no toques nada que no te he pedido**, y va **todo en UN SOLO PARRAFO**. **Y tras la apertura, la orden va directa: nada de "coge esta imagen y..." ni preambulos de relleno.** El generador ya tiene la imagen delante; se le dice lo que se quiere, no que la coja. Ej: *"SOLO HAZ LO QUE TE PIDO: los titulos de las columnas ponlos en negrita..."*, no *"SOLO HAZ LO QUE TE PIDO: coge esta imagen y ponle..."*. Nada de listas ni de lineas sueltas separadas por blancos: eso ya se probo el 2026-07-21 y **no es lo que arregla el error**. Lo que lo arregla es la puntuacion y la longitud, no el maquetado.

**Lo que si cambia:**
- **Frases cortas y seguidas, una orden por frase.** Nada de encadenar seis cambios con puntos y coma dentro de la misma frase.
- **Cero parentesis, cero comillas, cero numeracion tipo (1) (2).** Si hay que numerar, se dice "cinco cosas" al principio y ya.
- **Lenguaje hablado.** "Que ahora no se lee" en vez de "el contraste actual es insuficiente". "Pegalos al nombre" en vez de "reposicionalos adyacentemente".
- **Se dice lo que se quiere ver, no como hacerlo.** El generador no ejecuta especificaciones, interpreta descripciones.
- **Cierre en una linea:** "Lo demas dejalo igual".

**Contraste medido ese dia:** la version que fallaba ocupaba un parrafo de 15 lineas con seis parentesis y ocho comillas. La que funciono son siete lineas sueltas y ni un simbolo.

✅ **RESUELTO — NO HAY DOS FORMATOS, HAY UNO SOLO (Iker, 2026-07-27).** Aqui ponia que esto "chocaba" con `§0h` y que el parrafo unico era solo para generacion desde cero. **Esa ambiguedad era el bug:** al no saber cual tocaba, acabe entregando un prompt con numeracion `(1) (2) (3)`, que es justo lo que prohibe el punto de arriba. **El formato es UNO y vale para CUALQUIER prompt de imagen: de calca, de edicion, de cero, y de cualquier pilar (mapa, meme, lead magnet, historia, lo que sea).**
- Abre con **SOLO HAZ LO QUE TE PIDO** en mayusculas.
- **UN SOLO PARRAFO**, siempre. Nada de listas, nada de lineas sueltas, nada de `(1) (2) (3)`, cero parentesis y cero comillas.
- Dentro, frases cortas y habladas, una orden por frase, encadenadas en el mismo parrafo.
- Cierra en minusculas con **deja todo lo demas intacto y no toques nada que no te he pedido**.
Lo unico que cambia entre calca y edicion es **QUE se le cuenta** (ver el bloque rojo de abajo), no COMO se le escribe.

**🚨 CHEQUEO OBLIGATORIO ANTES DE PEGAR CUALQUIER PROMPT DE IMAGEN (Iker, 2026-07-29).** La regla llevaba escrita desde el 27 y aun asi entregue un prompt con `UNO, DOS, TRES`, ocho comillas y la contencion AL PRINCIPIO. **No fallo la receta, falle yo por no releerla.** Asi que ahora se relee esto, literal, antes de pegar el prompt en la respuesta. Los cinco puntos, uno por uno:

1. **¿Empieza por `SOLO HAZ LO QUE TE PIDO:`?** Si empieza por cualquier otra cosa, esta mal. Nada de "edita esta imagen", nada de "coge esta imagen".
2. **¿La contencion esta AL FINAL?** `deja todo lo demas intacto y no toques nada que no te he pedido` va **en la ultima frase**. Ponerla al principio la convierte en ruido que el generador se come antes de leer las ordenes.
3. **¿Cero simbolos raros?** Ni `UNO, DOS, TRES`, ni `(1)`, ni comillas, ni barras `/`, ni parentesis. Si hay que citar un texto literal, se dice **sin comillas**: *cambia la hora de las 10:46 a las 09:47*.
4. **¿Es CORTO?** Una orden por frase, frases cortas, todo del tirado en un parrafo. Si ocupa mas de 10 lineas, sobra la mitad.
5. **¿Repite algo que la imagen ya tiene bien?** Si es de EDICION, fuera. Solo van los cambios.
6. **¿Dice que va CUADRADA?** (Iker, 2026-07-30). La regla de `§0` ya lo decia — **al calcar, el formato es NUESTRO, no el de la referencia** — y aun asi entregue el meme de reaccion en horizontal porque el original era horizontal. **Si la referencia no es 1:1, el prompt tiene que pedir 1:1 explicitamente**, y decir si se amplia (arriba y abajo, o a los lados) o se recorta. Calcar el encuadre malo del original es lo contrario de copiar y mejorar.

**La forma de fallar este chequeo es no hacerlo.** Si el prompt anterior salio bien, este sale igual: se copia el molde, no se improvisa.

**🔴 DECIDE PRIMERO: ¿edicion o calca-de-cero? (Iker, 2026-07-23, me equivoque en esto).** Si el usuario YA te ha pasado una version generada de la imagen, el prompt es de **EDICION sobre ESA**: solo los cambios, NUNCA re-describas la calca entera de la referencia. El "calca esta referencia desde cero" (`§0h`/`§4.4` Paso 6b) es SOLO para la primera version, cuando aun no hay imagen. Di el mismo prompt-de-calca por segunda vez y le haces re-generar de cero lo que ya tenia bien (colores, maqueta, fuentes). Antes de escribir el prompt: ¿hay ya una imagen? → edicion. ¿No la hay? → calca.

**FORMATO EXACTO (vale para EDICION y para CALCA; lo unico que cambia es el contenido):**
- **Empieza SIEMPRE con `SOLO HAZ LO QUE TE PIDO:` en MAYUSCULAS.** El apertura de contencion va tambien en los prompts de edicion, no solo en los de calca.
- **Hablale DIRECTO con los cambios, en imperativo** (`cambia la frase X por Y`). **NUNCA digas "sobre esta imagen"** ni "en esta imagen": se le habla directamente, como si la tuviera delante.
- **Cierra con la contencion:** `No toques nada mas: ni colores, ni maquetacion, ni fuentes, ni el resto de textos e iconos.`
- Entre medias, los cambios en frases habladas (sin parentesis numerados ni simbolos raros, `§0i-3`).

**⭐ La FIRMA/autoría de la portada = NUESTRA marca (Neety), no la del referente (Iker, 2026-07-24).** Al calcar una portada de guía que lleva el sello del creador original arriba (Martín Arosa llevaba "ANTHROPIC"), NO lo dejes: implica que el PDF lo firma ese tercero (autoría falsa, engaña). Cámbialo por **Neety**. Los logos de terceros como AUTORIDAD o tema (Claude, SPRI, Gobierno Vasco) SÍ van, en su sitio (abajo), porque son reales y relevantes; lo que no vale es el sello de AUTOR ajeno arriba.

**⭐ TRUCO para portadas de GUÍA/PDF (Iker, 2026-07-24):** la IA genera bien la PORTADA pero rellena las páginas interiores (las miniaturas del visor de PDF) con texto GIBBERISH/lorem que, al ampliar, canta a IA (y encima mezcla inglés). Solución en el prompt de EDICIÓN: **desenfocar y oscurecer TODAS las miniaturas de la columna izquierda** → se lee como "contenido bloqueado que hay que desbloquear" (refuerza el gate de correo) y esconde el texto falso. Solo la portada + el índice grande quedan nítidos. **Y SIEMPRE fuentes NUESTRAS** (Bricolage Grotesque títulos + Switzer cuerpo) con "te adjunto los instaladores" (`§0h`): los generadores de IA no honran fuentes custom de fiar, así que se pide explícito en el edit. **Y el interior del PDF real (el que se entrega) lleva contenido REAL en español, nunca lorem** — el gibberish solo se esconde en la PREVIEW, no se entrega.

**⭐ TODA imagen se CALCA de un outlier REAL con su ENLACE — de CUALQUIER pilar, no solo del meme (Iker, 2026-07-24).** Nunca un diseño generico "de cero" ni "estilo Anthropic" sacado de la manga: si no hay una referencia validada con datos, no vale. Orden: primero outliers de OTROS creadores (mejor de otro sector, para remixear); cuando tengamos, los nuestros. Toda propuesta de imagen lleva el ENLACE a la referencia + su ratio/comentarios. Fallo real: propuse la portada de la guia del lead magnet "estilo Anthropic" sin referencia — no valia. La buena es la **portada de guia en PDF de Martin Arosa (2.089 com):** `https://www.linkedin.com/posts/martinarosaotero_la-gu%C3%ADa-oficial-de-linkedin-claude-2026-activity-7480512271941722112-yiqy` — se calca ESA y se le cambia el contenido a lo nuestro.

## ⭐ 0h-5 · UNA TABLA SE LEE EN EL FEED, NO SE ADMIRA (Iker, 2026-07-21)

Cuando el remix es una tabla de datos (lista, comparativa, ranking), **el objetivo NO es que sea bonita, es que se lea sin zoom en el movil**. LinkedIn no deja ampliar la imagen del feed. La referencia de Guillermo Flor es mas bonita que la nuestra y **no se lee una sola fila** — ahi es exactamente donde se le gana (`global §2.2b`, batir al original en su punto debil): mas retencion, la gente para a leer en vez de pasar de largo.

**Dos enemigos de la legibilidad, los dos medidos el 2026-07-21:**

1. **El gris claro, mas que el grosor.** Lo que emborrona un texto pequeño no es que sea fino, es que sea gris claro con poco contraste. **Un gris oscuro fino se lee mejor que un gris claro grueso.** Antes de engordar nada, oscurece.

2. **La compresion de la red.** LinkedIn recomprime toda imagen subida. **Una tabla con texto fino y bordes es el peor caso para JPG**: el algoritmo emborrona justo los cantos de las letras. **Se sube en PNG**, que mantiene el texto limpio. Si el generador la da en JPG, se reguarda como PNG antes de publicar.

**⚠️ Legibilidad SIN aplanar.** Subir el peso de todo el texto a negrita mata la jerarquia: si actividad, empleados y zona pesan igual que el nombre, el nombre deja de mandar y la tabla queda plana — el problema de Guillermo por el otro lado. **La negrita se reserva para lo que importa de cada fila** (el nombre de la empresa); el resto sube a peso medio y a gris oscuro, no a negrita.


## ⭐ 0i-0 · EL PROMPT VA SIEMPRE EN UN BLOQUE CERCADO, Y COMPLETO (Iker, 2026-07-21)

**Todo prompt de diseñador se entrega en un bloque cercado**, igual que el texto de un post (`working-preferences §1`). Iker lo copia con el boton y lo pega. En cita o en parrafo tiene que seleccionarlo a mano, y ahi es donde se pierde media frase.

**Y todo lo que el diseñador tiene que LEER va DENTRO del mismo bloque**, en un solo pegado: la orden y, debajo, los datos que tenga que transcribir (la lista de empresas, las cifras de un grafico, los nombres de una tabla). **Nunca el prompt en un bloque y la lista en otro** — son dos pegados y una ocasion de que se le olvide el segundo.

Fuera del bloque solo queda **lo que se adjunta como fichero** (`§0i`): la referencia, las fuentes, los logos, las fotos. Eso no se pega, se arrastra.

## ⭐ 0a-octava · ELEGIR ENTRE VARIAS FOTOS REALES (Iker, 2026-07-29)

Cuando el pilar pide **foto real** (historia sobre todo) y llegan varias del movil, el criterio no es estetico, es de **CTR**. Orden, de mas a menos, segun los experimentos de MrBeast que maneja Iker:

1. **Sonrisa amplia con los ojos bien abiertos.** Es la que mas clics saca.
2. **Boca cerrada con sonrisa** si la mirada esta viva.
3. ⛔ **Boca abierta sin sonreir, ojos entrecerrados o cara de reventado.** Baja el CTR. Se descarta aunque el fondo sea el mejor.

**Y ojo al outfit**, que Iker lo mira: una foto con buena cara pero ropa que no encaja se cae igual.

**El recorte a cuadrado no modifica nada mas:** ni color, ni brillo, ni retoque. Solo se quitan bandas por arriba y por abajo, dejando **la cara en el tercio superior** y los elementos que dan contexto (medalla, dorsal, entorno) dentro del encuadre.

**🔴 Y esta foto NO lleva el desenfoque de postproduccion** (`§0a-penta`): sale de una camara, no de un generador, asi que no hay acabado de render ni firma de IA que borrar. **Misma excepcion que "Los 10".**

## ⭐ 0a-novena · LA SILUETA DEL OBJETO: PLANTILLA POR SECTOR (Iker, 2026-07-30)

Idea de Iker para el pilar **despiece**, y resuelve el problema de fondo: el mapa tiene captura de PamPam y "Los 10" tiene orla, pero un despiece no tenía imagen natural. **La silueta del objeto más representativo del sector, con los LOGOS repartidos por ella.** En automoción, una **llanta** con los logos en la corona.

- **Logos y no caras**, porque este pilar prioriza la empresa sobre la persona.
- **Una plantilla por SECTOR**, no por región: la llanta se reutiliza en toda España y en las tres cuentas, solo cambia el título. Otro sector pide otra silueta.
- **La compone `scripts/montar-llanta.py`**, nunca un generador: rechaza logos de terceros y, si los acepta, los redibuja (`§0i-2`).
- **El título va en capa de texto editable con `XXX` como marcador de región**, y el script lo sustituye respetando los colores del PSD (la palabra punchy en naranja).
- **Los huecos se marcan en MAGENTA liso** en la generación y luego se pasan a transparente en Photoshop. El magenta no existe en nuestra paleta, así que la selección por color sale limpia de una.
- **⭐ El aro tiene que BISECAR cada hueco**, pasarle por el centro y dejarlo partido en dos mitades, y estar en la capa de DETRÁS. Así el logo queda montado sobre la rueda en vez de flotando al lado. Costó cuatro pasadas el 30/07.
- **🔴 EL CUERPO DEL TÍTULO NO SE RECALCULA, SE LEE DEL PSD (Iker, 2026-07-30).** Mi primera versión del script ajustaba el tamaño de letra a la caja por prueba y error, y salió **más pequeño que el que había puesto el diseñador**. El `FontSize` del PSD está en **unidades del documento, no en píxeles**: hay que multiplicarlo por la escala de la **matriz de transformación de la capa** (`capa.transform`). En esta plantilla, 29 x 2,82 = **81,8 px**. El interlineado igual (`Leading` x escala) y la posición sale de la misma matriz: `tr[4]` es el centro horizontal y `tr[5]` la primera línea base. **Si el diseñador puso un tamaño, se respeta.**
- **Los huecos llevan CONTORNO en berenjena** (Iker, 2026-07-30): un logo blanco sobre el menta claro no se despega del fondo. El aro morado lo enmarca y de paso aprovecha la paleta.
- **⚠️ Al pedir un cambio de tamaño, di el CUÁNTO, no solo la dirección.** "Encoge los radios" se pasó de largo; "agrándalos hasta la mitad de camino de lo que eran" acertó a la primera, porque le das una referencia entre dos versiones que ya ha hecho.

## ⭐ 0i · DESPUES DE CADA PROMPT, LA LISTA DE ADJUNTOS (Iker, 2026-07-21)

**El prompt ya no se basta solo.** Desde que decimos "calca esta referencia" y "te adjunto los instaladores de las fuentes", el prompt **da por hecho ficheros que van aparte**. Si Iker esta despistado y manda solo el texto, el diseñador no tiene ni la referencia ni las fuentes, y devuelve algo que no se parece a nada.

**Regla: cada vez que entregues un prompt de diseñador, debajo y FUERA del bloque, va una lista corta de lo que hay que adjuntar.** Solo lo que viaja aparte — no repitas colores, tipografia ni formato, que ya van dentro del prompt.

**⚠️ EN LOS DE EDICION TAMBIEN, Y CON EL EMOJI DE ALERTA (Iker, 2026-07-29).** Aqui ponia "prompt de diseñador" y yo lo lei como "prompt de calca", asi que en los de EDICION solte la ruta del fichero en una linea suelta, sin aviso y sin destacar. **Vale exactamente igual para los dos.** Un prompt de edicion pide adjuntos constantemente: la foto de perfil que hay que meter, un logo, una fuente, una captura nueva. Y si falta, el generador se inventa una cara, que es peor que en la calca, no mejor.

**El formato, siempre el mismo:** justo debajo del bloque cercado, fuera de el, una linea que empieza por **⚠️** con la **ruta completa del fichero**. Si son varios, un ⚠️ y debajo la lista. Y si alguno tumba la pieza si falta, se dice en esa misma linea.

> ⚠️ **Adjunta al prompt:** `C:\Users\LENOVO\Documents\Mario\LINKEDIN GROWTH\unai.jpeg`. Sin esta foto el generador se inventa la cara del avatar.

Lo que suele entrar en esa lista:
- **La referencia**, siempre que el prompt diga "calca" (meme casi siempre, lead magnet cuando la referencia tiene imagen buena — `post-workflow §4.5.-1`).
- **Los instaladores de las fuentes**, siempre que el prompt las nombre (`§0h`: si las nombras, di que las adjuntas).
- **Los datos reales** que el diseñador tendria que inventarse si no se los das: nombres de empresas de una tabla, cifras de un grafico, nombres de personas. **Este es el critico**: si no llegan, el diseñador rellena con inventado y publicamos algo falso (`aboutme`: nunca inventar).
- **Fotos de producto o logos**, si el prompt los menciona.

Marca cual es el que tumba el post si falta. No todos pesan igual: sin fuentes sale feo, con datos inventados se cae la publicacion entera.

**⭐ Si la referencia lleva fotos o logos en las filas, descargalos y adjuntalos.** Guillermo Flor lleva la foto de cada inversor; nuestro equivalente es el logo de LinkedIn de cada empresa, y Unipile lo da en `logo_large` (`GET /api/v1/linkedin/company/{slug}` → descargar la URL). Se numeran igual que la lista de datos (`01-gestamp.jpg`, `02-…`) para que el diseñador no tenga que emparejar nada. Van al Escritorio, **nunca al repo** (`CLAUDE.md`: los binarios no se commitean).

Dos trampas medidas el 2026-07-21: **vienen en JPEG aunque la URL diga `.png`** (renombra la extension o algunas herramientas los rechazan), y **no todas las empresas tienen 400x400** — Ormazabal, Porcelanosa e Indra solo tienen 100 o 200 px y LinkedIn no sirve nada mayor. A tamaño de fila da igual, pero el prompt tiene que decir **que no los amplie**, o el diseñador los escala y salen pixelados.

Y verifica siempre el slug: `GET company/{slug}` devuelve **homonimas de otros paises** sin avisar. Ese dia "acs-group" devolvio una consultora de 18 empleados en Bothell y "caf" el banco de desarrollo de America Latina. Comprueba sede y numero de empleados antes de dar un nombre por bueno.


## 1 · Formato de salida
UN párrafo simple en prosa, listo para pegar en un generador de imágenes. Nombra (tejido natural, en este orden): **sujeto principal · acción/expresión · prop clave · texto overlay (con la palabra EXACTA que va en naranja) · layout/composición · mapeo de roles de color.** Sin bullets, sin headers, sin "concepto alternativo" salvo que se pida.

---

## 2 · Principios (comprimir mentalmente antes de escribir el párrafo)
- **Curiosity gap** que la imagen abre y solo el post cierra.
- **1–2 scroll-stoppers máx.**: cara con emoción fuerte · un número redondo grande · dinero · una interfaz/herramienta/logo que nuestro ICP reconoce · algo genuinamente inesperado. Más de dos = ruido.
- **Claridad en menos de 2 segundos.** Un sujeto principal. Todo lo demás lo apoya o se borra.
- **Texto solo cuando suma** (≤5 palabras, nunca repite el hook). Grande, legible, alto contraste.
- **Legible a miniatura.** Interrumpe el patrón del feed.

---

## 3 · Los 3 registros de imagen (elige por tipo de post, no los cruces)
1. **MEME** → ilustración / cambio corporal, o **calcar la referencia** (§5-B). Dibujado es correcto AQUÍ. (El meme es la EXCEPCIÓN: si la referencia es dibujo, nuestra foto es dibujo.)
2. **DESEO / NÚMEROS / CONVERSACIÓN** → **screenshot documental real** que calca una pantalla reconocible: **iMessage de iPhone** (conversación/mensajes simulados), **captura de la app del banco**, Stripe, calendario, CRM, factura. Y para un **post de métricas**: **captura del dashboard oficial de analíticas de LinkedIn** con NUESTROS datos. Prueba real, no ilustración. Conserva el chrome visible (logo, tipografía real, números en su formato) — ahí está la credibilidad. La credibilidad está en que el FORMATO calca una pantalla real, no en que el dato sea literalmente cierto. Funciona muy bien tanto en memes (motor B) como fuera.
3. **PERSONAL / LEAD-MAGNET / FOUNDER** → **foto natural real** del autor, NO caricatura ni diseño elaborado/complejo. Rinden mejor las **fotos naturales tipo selfie o foto en grupo con compañeros** (cara real, oficina) que las ilustraciones. La cara real es el motor de credibilidad (Iker "desmonto perfiles" foto real 9.13x vs caricatura 0.2x). Especialmente en **lead magnets**: selfie / grupo con el equipo > cualquier caricatura.
   - **⭐ En un post de HISTORIA/anécdota, la foto REAL de la persona gana a una captura de métricas, aunque el post mencione cifras (Iker, 2026-07-24).** La cara ES la historia: si cuentas "di mi primera conferencia", la foto tuya dándola (y que se te vea joven, natural) engancha más que cualquier pantalla de datos. El registro de métricas (§2 de arriba) es para posts de flex de números, no para una historia personal.
   - **⭐ Y si en algún post SÍ quieres imagen de métricas: captura NUESTRA herramienta real** (la sección accounts, que ya enseña las cifras enteras y potentes tipo `2.036.300`), **no falsifiques la interfaz de LinkedIn.** Suplantar la UI de un tercero con datos montados es una prueba falsa y encima innecesaria cuando nuestro dashboard ya se ve potente. Cifra que no sea real → fuera, siempre.

---

## 4 · Constraints de marca (SIEMPRE, en cualquier variante)

> ## ⭐ 4.0 · PALETA NUEVA — BRANDBOOK 2026 (incorporada el 2026-07-29)
> Fuente: `docs/brandbook-neety-2026.pdf`, p. 23 ("Paleta cromática"). **Manda sobre la paleta vieja de abajo**, que se conserva porque es la de todos los outliers ya publicados.
>
> | Nombre oficial | HEX | Para qué |
> |---|---|---|
> | **Naranja** | `#fe8238` | El naranja de marca. Sustituye al Persian Orange `#ee9363` (es el mismo sitio, un pelín más vivo y saturado) |
> | **Berenjena** | `#431b44` | El ÚNICO oscuro de la paleta nueva: tinta, linework y masas oscuras. Ocupa el hueco del Dark Blue `#0c202e` |
> | **Azul bebé** | `#a7c5f9` | Claro. Superficies, detalles y contrapunto frío |
> | **Mint claro** | `#ebfff6` | Casi blanco. Fondo alternativo al Alabastro |
>
> **⚠️ Los dos claros NO valen como masa sobre fondo claro.** Azul bebé y Mint claro tienen muy poco contraste contra Alabastro/Mint (ratio ~1,6:1): a tamaño miniatura se disuelven. Van como **detalle o superficie interior**, nunca como la forma principal que tiene que leerse pequeña. La masa oscura es **siempre Berenjena**.
> **El brandbook también confirma la tipografía:** Bricolage Grotesque + Switzer (las mismas de §4).
>
> **⛔ EL ISOTIPO NO SE REDIBUJA CON IA NUNCA (Mario, 2026-07-29).** El cuerpo de la mascota Kaixito **ES el isotipo de Neety**, así que es material de marca, no ilustración. Medido ese día: el isotipo oficial del brandbook (p.12) tiene el marco **prácticamente cuadrado, 42,0 × 41,9 pt = 1:1**, y el cuerpo que había generado la IA salía **~20% más ancho que alto**. El brandbook además avisa de que en esta versión *"suavizamos los bordes del isotipo"*, o sea que el redondeo también cambió.
> **Procedimiento:** el isotipo se **extrae del PDF como vector** y se pega tal cual; nunca se le pide a un generador que lo dibuje ni que lo "redondee un poco". Cada vuelta de IA lo aproxima y encima suele romper otras piezas. Extracción hecha con PyMuPDF (`fitz`, `get_drawings()` para localizar el bbox y `get_pixmap(dpi=2400, clip=...)`), porque `pdftoppm` no está instalado en esta máquina.
> **El SÍNTOMA exacto que hay que buscar (2026-07-30):** el generador siempre falla en **los dos entrantes del centro, la "cintura" entre los dos cuadrados**. En el isotipo oficial esos bordes son **rectos y se afilan hasta una punta**; la IA los **redondea y los engorda**, y de paso corta alguna esquina en recto donde va redondeada. Se detecta a simple vista comparando la cintura, y aparece incluso cuando se le pasa el vector correcto como referencia en el mismo chat. Es el motivo de la regla: no es un fallo de prompt, es que reinterpreta contornos.

- **Paleta VIEJA (la de los outliers publicados):** Alabastro `#f9f3ef` (fondo dominante — todas las imágenes se apoyan en esta superficie clara) · Dark Blue `#0c202e` (títulos, texto, linework — la "tinta") · Persian Orange `#ee9363` (highlight / scroll-stop — a cuentagotas, a la palabra o elemento más importante).
- **Tipografía (solo si la imagen lleva texto):** Bricolage Grotesque para títulos (bold, display) · Switzer para cuerpo. Ninguna otra fuente bajo ningún concepto.
  - ⭐ **Y SIEMPRE que las nombres en un prompt, añade que le adjuntas los instaladores** (Iker, 2026-07-20): `Te adjunto los dos archivos instaladores de las fuentes.` Los manda Iker junto al prompt. Nombrar una fuente que el diseñador no tiene instalada es pedirle que improvise: acaba usando la que mas se le parezca y la imagen sale fuera de marca.
- **Regla de la palabra naranja:** cuando hay texto, la ÚNICA palabra más importante va en Persian Orange; el resto en Dark Blue sobre Alabastro. Elígela deliberadamente (es el scroll-stop) y nómbrala explícitamente en el párrafo.

---

## 5 · Dos variantes — elige una por contexto

### (A) POST NORMAL (data shock, before/after, producto, foto founder, contenido regular) → MINIMALISTA + BRANDED
Un sujeto principal, un scroll-stopper, composición limpia, paleta de marca. Los principios de §2 aplican directos.

### (B) MEME CON IMAGEN DE REFERENCIA que pasa el usuario → CALCAR LA REFERENCIA
La referencia manda: layout, nº de paneles, escena, expresiones, lenguaje corporal, mecánica cómica, el chiste, y el **estilo de dibujo** (si es minimalista → minimalista; si es recargado → recargado). Cópiala lo más fielmente posible e **IGNORA la regla minimalista de (A)**. Sea cual sea su forma (un panel, tres, un sketch, una tira, un screenshot, una foto candid, incluso un meme no-Neety) → clávala. Sobrescribe SOLO esto:
1. **Remapea los colores** a la paleta Neety **y añade detalles de marca** (no solo recolorear): corbatas naranjas, patrones, siluetas, props narrativos en naranja.
2. **Textos:** si los hay, tradúcelos al español (adaptados a ventas) en Bricolage Grotesque (títulos) + Switzer (cuerpo) con la regla de la palabra naranja.
3. **Props específicos:** conserva el elemento pero varía el detalle (café → otro café, avión → otro avión).
4. **Roles de trabajadores Y CUALQUIER etiqueta de la imagen:** en español genérico, **sin anglicismos ni jerga** (stack, pipeline, CRM, lead…), entendibles por un industrial de 50+. No es solo para los roles: es para TODO texto que vaya en la foto. Fallo real (Iker, 2026-07-22): una etiqueta decía *"Tu stack de ventas"* y un jefe de ventas de 55 no tiene por qué saber qué es un "stack". Se cambió a *"Tu comercial como lo pintan"* (dicho que sí se pilla) vs *"Tu comercial de verdad"*.
Todo lo demás de la referencia se preserva. No fuerces el uniforme camisa-blanca+corbata-naranja ni el grid simétrico si la referencia no los tiene. (Runbook operativo completo en `post-workflow §4.4`.)

5. **⭐ El meme se entrega un poco CUTRE a propósito (Iker, 2026-07-22).** Un meme demasiado pulido/HD se lee a **anuncio corporativo** y rinde peor; el toque de baja calidad lo hace leer a **meme orgánico**. **Sobre todo cuando la referencia ya se veía de baja calidad** (el Aquaman venía pixelado): igualar esa calidad baja lo hace pasar por meme de verdad, no por gráfico de marca.
   - **Ajuste exacto que le funciona a Iker (Photoshop):** exportar en **JPG, calidad baja ≈ 10, y tamaño 500×500 px**. Ese es el look "reenviado mil veces". *(Yo antes ponía 35-40% por miedo a la legibilidad; con las etiquetas en negrita gruesa y borde negro, calidad 10 aguanta y se lee igual — probado.)*
   - ⚠️ **Es convención de meme, NO un efecto medido con datos.** Límite duro: **las etiquetas se tienen que seguir leyendo** — por eso las etiquetas van en negrita gruesa con borde; si el texto fuera fino, a calidad 10 se emborronaría. Cutre sí, ilegible no. Solo aplica al MEME; el mapa, el lead magnet y las infografías van nítidos.

### (B-fallback) MEME SIN REFERENCIA → sistema meme desde cero (§6)
Aplica el filtro de 4 puntos del meme (`global-instructions §4.3`: jerarquía de roles B2B + cambio corporal que DUELE y es LEGIBLE a miniatura + punchline citable + el lector ríe CON nosotros) y el sistema visual de §6.

---

## 6 · Sistema visual del meme (SOLO memes SIN referencia)
Cuando hay referencia → la referencia manda (§5-B). Esto es solo para memes desde cero.

**Color + fondo**
- Fondo Alabastro `#f9f3ef` SIEMPRE (nunca invertir a Dark Blue).
- Linework/outlines Dark Blue `#0c202e` para todo (caras, ropa, bordes de panel, tipografía del título salvo la palabra naranja).
- Persian Orange RESERVADO a exactamente 3 slots: (a) la **corbata** del personaje (todos los personajes Neety la llevan = firma visual), (b) **UNA palabra** del título (la última o casi), (c) **props narrativos** del chiste (rayos de grito ⚡, taza, teléfono, billetes). Nada más va naranja.

**Layout**
- Grid simétrico (2 columnas × 3-4 filas) u orla de retratos completa. NO viñetas de cómic con bocadillos y escenografía compleja.
- Cada panel con línea fina Dark Blue, sin relleno más que el Alabastro.
- Etiqueta de rol bajo cada personaje SIEMPRE en Switzer bold Dark Blue. Grande, plana, sin sombras.

**Personajes**
- Ilustración vectorial plana, líneas limpias — "corporate illustration" con personalidad (NO figuras planas genéricas tipo Notion).
- El MISMO personaje base repetido y modificado panel a panel (NO 6 personas distintas). La reutilización construye el efecto de cambio corporal.
- Encuadre busto/hombros + cabeza. Nunca cuerpo entero. La cara domina.
- Uniforme en TODOS los memes Neety: camisa blanca + corbata Persian Orange. Constrúyelo como firma reconocible.
- Expresión base neutra. El CAMBIO CORPORAL comunica la emoción (calvicie, ojeras, encorvamiento, sudor), no sonrisas/muecas exageradas. Única excepción: el personaje que carga la emoción extrema del chiste (el manager gritando en "Coge el teléfono") puede tener la boca abierta gritando.

**Tipografía**
- Título arriba: Bricolage Grotesque BOLD, MAYÚSCULAS, máx. 2 líneas, centrado, ~15-20% de la altura.
- Estructura: [PARTE DARK BLUE] + [UNA palabra Persian Orange al final o casi]. Validados: "EN VENTAS TODOS HUYEN DEL TELÉFONO" (naranja = TELÉFONO) · "AHORA LA IA LES ROBA EL SUEÑO" (naranja = SUEÑO). La palabra naranja SIEMPRE cierra el concepto, nunca a mitad de frase.
- Texto interior (diálogo, etiquetas): Switzer bold Dark Blue, legible a miniatura.

**Elementos narrativos recurrentes**
- Rayos de grito ⚡ en Persian Orange para tensión/volumen.
- Cambio corporal progresivo a lo largo de paneles (calvicie, ojeras, encorvamiento, sudor) — el motor del meme (`global-instructions §4.3`, MOTOR A).
- "Personaje de contraste" en el último panel (el "Mikel" con taza de café, el AE impasible) = punchline visual.

**Checklist al proponer un meme desde cero (dilo explícito):** 1) fondo Alabastro · 2) layout grid simétrico (nº de paneles) · 3) personaje base camisa blanca + corbata naranja · 4) título 2 líneas Bricolage bold MAYÚSCULAS + la palabra EXACTA en naranja (última o casi) · 5) texto interior Switzer bold Dark Blue · 6) qué cambio corporal y en qué paneles · 7) personaje de contraste y su prop · 8) lista de todos los sitios donde aparece el naranja.

**NO proponer:** fondos oscuros · personajes sin el uniforme · más de UNA palabra naranja en el título · viñetas de cómic con bocadillos · fuentes distintas de Bricolage/Switzer · personas distintas entre paneles (debe ser el MISMO personaje cambiando).

---

## 7 · Infografías: FORMATO QUEMADO (0 de 3)
Una infografía (tabla/diagrama/multi-caja resumiendo herramientas/pasos) va 0-de-3 incluso bien hecha — se lee como "deberes", no scroll-stop. Avisa en voz alta y ofrece alternativa: screenshot documental (para números) o meme wojak (para insight). Coherente con `outliers-database §3.8` (doc/carrusel rinden por debajo de foto/texto).

---

## 8 · Registro de imagen por tipo de post (atajo)
- **Mapa regional** → la imagen del POST la hace el USUARIO (captura de la web PamPam); el workflow NO genera imagen de post para mapas (entrega un CSV para PamPam en su lugar — ver `post-workflow §4.2`). Esta skill no aplica al mapa. **Excepción que NO es imagen de post:** el workflow sí entrega una **foto de portada de la región para la web del mapa** (`post-workflow §4.2` Paso 11) — no se genera ni se diseña, se busca en **fuentes de licencia libre** (Wikimedia Commons / Unsplash / Pexels), nunca en Google Imágenes, y se entrega con licencia y autor.
- **"Los 10"** → orla de retratos (cabezas), NO personas sobre mapa. Cabecera fuerte en paleta Neety, palabra clave en naranja (validado: "LOS 10 QUE **LEVANTAN** LA INDUSTRIA VASCA", 4.81x). **El usuario la monta con SU plantilla en otra herramienta**; el workflow NO genera la imagen — entrega las **10 fotos en un ZIP en orden de mención** + **los 2 PROMPTS literales** para su plantilla (`post-workflow §4.3` Paso 6b: uno cambia el gentilicio de la cabecera, otro inserta las caras sin deformarlas).
- **Meme** → §6 (o calcar referencia, §5-B).
- **Deseo / números** → screenshot documental real (registro 2).
- **Personal / founder / lead-magnet / evento** → foto natural real (registro 3). En eventos: selfie/grupo/microfonados/detalle (vino en mano).
