# SKILL: images — El concepto de imagen de cada post

> **name:** images
> **description:** Cómo se propone la imagen de un post de Neety: formato de salida, los 3 registros (meme dibujado / screenshot documental / foto real), constraints de marca (paleta + tipografía + regla de la palabra naranja), la variante "calcar la referencia", el sistema visual del meme desde cero, y el formato quemado de infografías. Fuente: `IMAGE_PRINCIPLES` + `MEME_VISUAL_SYSTEM` de `postPrompt.ts` + histórico de la cuenta.
> **when-to-use:** Cargar cuando un post vaya a llevar imagen (la mayoría). Trabaja junto a `global-instructions` (mecánica del post) y `outliers-database` (qué formato tiró). Para vídeo NO — eso es la skill `video`.

---

## 0 · Realidad de LinkedIn (por qué hay que clavarla)
Una vez publicado un post con foto, la foto **NO se puede cambiar** (habría que borrar y republicar, perdiendo todo el alcance). No hay A/B post-publicación. Se clava antes de publicar. Si la idea cruda no la puede cargar UNA sola imagen fuerte, dilo en vez de forzar una mediocre.

---

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

⚠️ **Esto choca con el formato antiguo de `§0h`** (parrafo unico, apertura en mayusculas, cierre de prohibiciones en minusculas). **Ese formato se mantiene solo para prompts de generacion desde cero y siempre que no de error.** En cuanto un prompt falla, se reescribe hablado. Y para prompts de EDICION sobre una imagen ya generada, se usa siempre el formato hablado.

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

## ⭐ 0i · DESPUES DE CADA PROMPT, LA LISTA DE ADJUNTOS (Iker, 2026-07-21)

**El prompt ya no se basta solo.** Desde que decimos "calca esta referencia" y "te adjunto los instaladores de las fuentes", el prompt **da por hecho ficheros que van aparte**. Si Iker esta despistado y manda solo el texto, el diseñador no tiene ni la referencia ni las fuentes, y devuelve algo que no se parece a nada.

**Regla: cada vez que entregues un prompt de diseñador, debajo y FUERA del bloque, va una lista corta de lo que hay que adjuntar.** Solo lo que viaja aparte — no repitas colores, tipografia ni formato, que ya van dentro del prompt.

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

---

## 4 · Constraints de marca (SIEMPRE, en cualquier variante)
- **Paleta (solo estas tres):** Alabastro `#f9f3ef` (fondo dominante — todas las imágenes se apoyan en esta superficie clara) · Dark Blue `#0c202e` (títulos, texto, linework — la "tinta") · Persian Orange `#ee9363` (highlight / scroll-stop — a cuentagotas, a la palabra o elemento más importante).
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
4. **Roles de trabajadores:** en español genérico, sin anglicismos ni títulos complejos, entendibles por un industrial de 50+.
Todo lo demás de la referencia se preserva. No fuerces el uniforme camisa-blanca+corbata-naranja ni el grid simétrico si la referencia no los tiene. (Runbook operativo completo en `post-workflow §4.4`.)

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
