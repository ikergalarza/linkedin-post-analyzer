# Pilar TARJETA + campo `top_del_creador`

Fecha: 2026-08-20 · Origen: Iker detecta que la herramienta no le saca outliers a Adam Grant y que sus posts más virales son imagen sola.

Son **dos entregables independientes** que salieron de la misma investigación. Se pueden implementar y revertir por separado.

---

## 0 · La evidencia (medida, no recordada)

Barrido completo: **153 creadores, 37.168 posts** de la BD de Railway, más las imágenes descargadas y miradas una a una.

### 0.1 · El formato existe, es rarísimo y es cruzado

```
posts imagen-sola en toda la BD      241 / 37.168  =  0,65%
outliers imagen-sola                   6 /  2.278  =  0,26%
```

Quien lo hace de forma sistemática, con lift positivo sobre su propia media:

| Cuenta | Seguidores | % imagen-sola | eng. imagen | eng. resto | lift |
|---|---|---|---|---|---|
| Adam Grant | 5.635.433 | 52,0% (39/75) | 20.408 | 10.510 | 1,94x |
| Alex Hormozi | 1.034.478 | 14,2% (65/458) | 5.477 | 3.815 | 1,44x |
| Leila Hormozi | 408.696 | 12,2% (49/403) | 1.874 | 1.578 | 1,19x |

**13 de los 15 mejores posts del año de Adam Grant son imagen sola.** Los dos que trajo Iker son su #1 (42.642) y su #2 (35.489).

### 0.2 · Anatomía de la tarjeta (14 de 14 de Grant, leídas)

| Rasgo | Medida |
|---|---|
| Párrafos | 3 en 13 de 14 (la otra son 2, contraste puro) |
| Cifra en P1 | **0 de 14** |
| Dato en P2 | 5 de 14 (`24 experiments:` · `6 studies:` · `Study of problem-solving teams:` · `Data on >34k stars`) |
| P3 aforismo | 14 de 14, siempre más corta que P1 y P2 |
| Hashtags / emoji / enlaces / menciones | 0 de 14 |
| Barra de métricas | recortada en 14 de 14 |
| Vocativo de regañina al jefe | 2 de 14 (`Hey leaders:` · `Dear leaders:`) |
| Tema | 14 de 14 atacan una creencia del mundo del trabajo. Ni producto, ni empresa, ni "yo" |

**Paleta exacta** (extraída de los ficheros, rota y nunca repite dos seguidas):
`#FFFFE5` crema · `#F3FFFF` hielo · `#F1FEEC` menta · `#F2E2E5` rosa polvo · `#FEFBF4` marfil · `#FFFFFF` blanco.
Texto `#0F1419`. Ratio **0,91-1,00** (cuadrado o levemente vertical), 800×800 típico.

Contraste de moldes:
- **Hormozi**: fondo `#FFFFFF` puro, 1-2 párrafos, sin dato, ratio 1,00 y 0,80.
- **Andy Elliott**: `#111111` y **apaisado** (1,55-1,74). Es el único apaisado y el que peor rinde. → **el apaisado se descarta**.

### 0.3 · Dos correcciones a la hipótesis de partida

**a) Los tres que lo hacen hoy no falsean métricas.** El recorte va por encima de la barra de likes en las 14 tarjetas de Grant y en las de Hormozi. Solo se ve avatar + nombre + check + `@handle`.

**b) Chris Donnelly abandonó el formato.** Su post de 2023 (102.802 reacciones) sí lleva métricas simuladas, y son **creíbles, no millonarias**: `11.096 reacciones · 274 comentarios · 429 reposts`, cuando el real acabó 9x por encima. Pero en sus últimos 500 posts (jun-25 → ago-26) no queda ninguno: hoy hace texto largo + pantallazo **real** con puerta de comentario. No se puede probar que LinkedIn lo nerfeara; sí que el que lo inventó se bajó.

**c) No son capturas literales, son tarjetas diseñadas en el lenguaje visual de X.** X no tiene fondos crema, menta ni rosa, y la tipografía no es la Chirp nativa. Es un idioma visual, no la falsificación de un tuit concreto.

### 0.4 · El riesgo, declarado antes de escribir nada

**El formato baja el ratio de comentarios en las tres cuentas, sin excepción, y sube reposts en las tres:**

| | comentarios/likes imagen | resto | reposts/likes imagen | resto |
|---|---|---|---|---|
| Adam Grant | **3,2%** | 5,0% | **5,5%** | 4,7% |
| Alex Hormozi | **9,9%** | 14,2% | **4,5%** | 3,8% |
| Leila Hormozi | **13,1%** | 15,7% | **4,2%** | 3,2% |

**Es una máquina de alcance y repost, no de conversación.** Choca con el lead magnet, que vive del conteo de comentarios. → **se juzga por alcance y reposts, nunca por comentarios.**

Segundo riesgo: **todas las cuentas por debajo de ~150k seguidores de la BD que lo intentaron tienen lift < 1** (Matt Lakajev 0,23x · Kimberly Price 0,39x · Álvaro Fontela 0,29x · Edson Noyola 0,09x). Muestras de 1-5 posts y probablemente ni siquiera este formato, así que **no es doctrina**, pero la dirección es unánime. Por eso entra como prueba y no como pilar.

### 0.5 · El texto sí cabe; lo que no cabe es el CTA

Efecto de la longitud del texto sobre posts con imagen, en las tres cuentas de referencia:

| chars | Alex Hormozi | Leila Hormozi | Adam Grant |
|---|---|---|---|
| 0 | 1,00x (n=65) | 1,00x (n=49) | 1,00x (n=38) |
| 1-150 | 0,95x (n=111) | **1,06x (n=114)** | 0,62x (n=11) |
| 151-400 | 0,91x (n=49) | **1,11x (n=39)** | 0,66x (n=11) |
| >900 | 0,71x (n=11) | 1,18x (n=18) | — |

Con muestras de más de 100 posts, **el texto corto es neutro o sube**. Grant castiga, pero su n=11 y sus posts con texto son promo de podcast y vídeo, otro animal.

Lo que sí penaliza es el **CTA imperativo**: Alex 0,80x y Leila 0,90x contra sus propios posts sin CTA. Recuento: Grant 0 CTA de 75 · Alex 11 de 393 · Leila 8 de 353.

→ **El spam ninja entra** (es un enlace enterrado en cuerpo, no un CTA imperativo, y la doble puerta ya está refutada como no-capadora con el meme de Asier del 20/08). **El CTA imperativo no.**

---

## PARTE A · El campo `top_del_creador`

### A.1 · El problema, en cascada

```
Adam Grant   media 15.525 · máximo 42.642 · máx/media 2,75x  → el umbral es 3,00x
             → 0 outliers, y no por poco: MATEMÁTICAMENTE no puede tener ninguno
             → patterns.ts:15 hace `if (outliers.length === 0) return insights;`
             → el Explorer no saca NI UN patrón de la cuenta más viral de LinkedIn
```

Le pasa a 4 de 142 cuentas con ≥20 posts, y todas son ultraconsistentes:

| Cuenta | Seguidores | máx/media | CV |
|---|---|---|---|
| Adam Ali | 10.499 | 2,11x | 0,51 |
| Lara Acosta | 354.139 | 2,42x | 0,37 |
| Jasmin Alić | 374.323 | 2,66x | 0,31 |
| Adam Grant | 5.635.433 | 2,75x | 0,55 |

Las otras 138 tienen CV de 2 a 7. **El 3x fijo es ciego al coeficiente de variación.**

### A.2 · Lo que NO hacemos, y por qué (decisión negativa, no la deshagas)

Se probó **z robusto de un solo lado** sobre `log1p(engagement)` con escala `p84 − p50` (para que los posts malos no inflaran la dispersión), simulado sobre los 37.168 posts. **Se descartó con datos.**

- Con `T=2,0` Grant pasa de 0 a **1** (su z máximo es 2,18: apenas asoma) y se pierden 655 outliers globales.
- Con `T=1,7` las cuentas de cola pesada pierden outliers **legítimos**: en Daniel Disney salen 29 de 50, y el más alto que sale está a **10,7x su mediana** (z=1,67). Eso no es ruido, es un falso negativo.
- Lo que en la primera pasada se etiquetó de "limpieza de ruido" en Miguel Florido, Zack Deris y Daniel Disney **era eso: falsos negativos**. En cuentas de cola pesada, 10x la mediana pasando un 8% de las veces es su normalidad estadística, y el z lo aplasta correctamente pero inútilmente.

**Con cualquier umbral que arregle a Grant, las cuentas de cola pesada pierden outliers reales. Con cualquiera que las respete, Grant sigue invisible.** No hay una sola fórmula para las dos preguntas, porque son dos preguntas:

- *"¿Qué post ha destacado de verdad?"* → alerta → la contesta `is_outlier`.
- *"¿Cuáles son los mejores posts de esta cuenta para copiarle?"* → inspiración → la contesta el percentil.

⚠️ **Trampa adicional detectada y evitada:** cualquier reescritura de `is_outlier` tiene que respetar la **rama híbrida** de `outliers.ts` (`GREATEST(ratio engagement, ratio impresiones)`). En las cuentas gestionadas, **4 de los 16 outliers de Iker y 4 de los 9 de Unai son outliers por ALCANCE, no por engagement**. Una fórmula que solo mire `engagement_score` se los carga sin avisar.

### A.3 · Lo que sí hacemos

```
is_outlier              NO SE TOCA. Cero recálculo, cero reclasificación.
top_del_creador (nuevo) percentil >= 0,92 dentro del creador
                        Y engagement >= mediana x (p84/mediana)^1.5
patterns.ts + Explorer  pasan a leer top_del_creador en vez de is_outlier
```

Es **puramente aditivo**: ningún post cambia de `is_outlier`, ni entra ni sale, ni en las 3 nuestras ni en las 150 de la competencia.

#### El suelo NO es un múltiplo fijo: se lo saca cada cuenta de su propia forma

`mediana × (p84/mediana)^1.5` es, en lenguaje llano, **"1,5 desviaciones típicas por encima de su propia mediana"**, expresado como múltiplo. Cada creador acaba con el suyo.

**La variable es la DISPERSIÓN, no el tamaño.** Medido sobre los 145 creadores con ≥10 posts:

```
corr(log seguidores , p84/mediana)  =  -0,161   ← el tamaño NO lo explica
corr(p84/mediana    , max/mediana)  =  +0,764   ← la dispersion SI predice el techo
```

La prueba visual: **Adam Ali tiene 10.499 seguidores y p84/mediana = 1,54; Lara Acosta tiene 354.139 y 1,39.** Igual de planos, tamaños opuestos. Iker, con 9.601, está en 2,83. **Una regla por tamaño mete a Adam Ali y a Iker en el mismo saco siendo formas contrarias** — y de hecho deja a Adam Ali a cero.

Comparativa medida de todas las reglas candidatas:

| Regla | outliers totales | creadores que quedan ciegos |
|---|---|---|
| fijo 2x mediana | 2.902 | 0 |
| fijo 3x mediana | 2.330 | **4** |
| por tamaño (3x si <150k seguidores) | 2.560 | **2** (ciega a Adam Ali) |
| **`disp^1.5`** | **2.647** | **0** ✅ |
| `disp^2.0` | 1.269 | **5** |

Múltiplo que le toca a cada uno con `disp^1.5`:

| Cuenta | múltiplo | posts |
|---|---|---|
| Jasmin Alić (planísima) | 1,4x | 12 |
| Lara Acosta | 1,6x | 13 |
| Adam Ali (pequeño y plano) | 1,9x | 2 |
| Adam Grant | 2,1x | 4 |
| Unai | 4,1x | 7 |
| Iker | 4,8x | 14 |
| Miguel Florido | 7,6x | 40 |
| Daniel Disney (cola pesada) | 8,4x | 28 |

#### El invariante: ninguna cuenta se queda ciega, pase lo que pase

Postgres **interpola** `percentile_cont`, así que en cuentas con pocos posts el p84 sale más alto que con un percentil por índice y el suelo se endurece de golpe. Medido con la semántica exacta del SQL: **dejaba a Adam Ali (n=20) y a Fran Quintero (n=11) sin nada.**

No se arregla bajando la constante — eso solo mueve el problema a otra cuenta cuando cambien los datos. Se arregla **garantizando el invariante**: si el suelo no lo pasa nadie en esa cuenta, **el suelo se apaga para ella** y manda solo el percentil. Rescata a 6 creadores de los 153.

Resultado final con la semántica exacta: **2.623 posts marcados, 0 creadores ciegos** salvo los 2 que tienen exactamente 1 post — donde `percent_rank` es 0 por definición y no hay nada que decidir, porque un post solo no puede ser "lo mejor de la cuenta".

⚠️ **Ojo, es el mismo `z_up ≥ 1,5` que se descartó en `§A.2` — y no es contradicción.** Allí se descartó como sustituto de `is_outlier`, donde al ser la ÚNICA condición generaba falsos negativos en cuentas de cola pesada. Aquí es un **suelo combinado con el tope del percentil**, sobre un campo **aditivo** que no toca `is_outlier`. Daniel Disney conserva sus 50 `is_outlier` intactos y además recibe 28 en el Explorer.

### A.4 · Efecto

| | Explorer hoy | Explorer después | `is_outlier` |
|---|---|---|---|
| Adam Grant | 0 posts, 0 patrones | **4 posts + patrones** | 0 → 0 (sin cambio) |
| Lara Acosta | 0 | **13** | 0 → 0 |
| Jasmin Alić | 0 | **12** | 0 → 0 |
| Adam Ali | 0 | **2** | 0 → 0 |
| Iker / Unai / Asier | — | 14 / 7 / 1 | 16 / 9 / 2 **intactos** |
| TOTAL | 1.537 `is_outlier` | 2.647 en el Explorer | 1.537 **sin tocar** |

**Creadores que quedan sin nada en el Explorer: 0.**

### A.5 · Señal de cuenta: el "perfil outlier"

Hoy no existe ninguna métrica **de cuenta**, solo de post. Se añaden dos al Explorer:

- `consistencia` = coeficiente de variación del engagement del creador.
- `pct_formato_raro` = % de posts con `content_type='image'` o `char_count = 0`.

Referencia medida para leerlas: **Adam Grant sale `CV 0,55 · 52,0%` contra una mediana de mercado de `CV ~2,4 · 0,65%`.** Eso es lo que le habría hecho saltar solo como perfil anómalo, sin necesidad de mirar post a post.

### A.6 · Ficheros

- `backend/src/db/migrate.ts` — columna `top_del_creador BOOLEAN DEFAULT FALSE` en `posts`.
- `backend/src/services/outliers.ts` — calcular `top_del_creador` en el mismo recálculo, **en su propio UPDATE**, sin tocar las dos ramas existentes.
- `backend/src/services/patterns.ts:15` — dejar de cortar con `is_outlier` vacío; leer `top_del_creador`.
- `backend/src/routes/analysis.ts` — exponer `consistencia` y `pct_formato_raro` en las stats de creador.
- `frontend/src/pages/OutlierExplorer.tsx` — usar el campo nuevo y pintar las dos señales de cuenta.

---

## PARTE B · El pilar TARJETA

**Entra como PRUEBA fuera de rotación**, igual que vídeo y evento (`post-workflow §8.4`). No toca el cuadro latino de `§8.2`.

### B.1 · El artefacto

```
[avatar real del jefe]  Nombre exacto ✔
                        @handle
                                        ← recorte AQUÍ. Nunca barra de métricas.

P1   creencia falsa del mundo comercial · SIN cifra · 1-2 líneas
     (línea en blanco)
P2   la evidencia · abre nombrando la fuente, NUNCA el año (global §3.5b)
     (línea en blanco)
P3   el aforismo · más corto que P1 y P2 · es lo que se comparte

fondo   rota entre los 6 tonos medidos, nunca dos seguidos iguales
texto   #0F1419, sans, cuerpo grande
ratio   0,91-1,00 · 800x800 · NUNCA apaisado
0 hashtags · 0 emoji · 0 enlaces · 0 menciones dentro de la tarjeta
```

Los tres submoldes de P1, por frecuencia medida en Grant:
1. **Negación + afirmación** (`no es X, es Y`) — el más frecuente.
2. **Afirmación tajante** sobre un colectivo.
3. **Vocativo de regañina al jefe** (`Directores comerciales:`) — 2 de 14, y es el que más cerca queda de nuestro ICP.

### B.2 · El texto de LinkedIn

- **150-400 caracteres.** La tarjeta **es** el gancho, así que el texto arranca ya en cuerpo.
- **Ninja de agendar obligatorio**, en su posición canónica. **Ninja de correo opcional post a post**, igual que en meme (`global §4.4e-MEME`).
- **Sin CTA imperativo**, sin hashtags, sin emoji.
- `§4.4e-PRONTO` exige ≥2 bloques de cuerpo entre el gancho y el ninja de agendar. Como aquí el gancho vive en la imagen, **se siguen contando 2 bloques desde el inicio del texto**, lo que deja el enlace sobre el carácter 200.

### B.3 · Lo que NO se negocia, heredado

- Toda cifra de P2 verificada contra fuente real. En el cuerpo se cita el **nombre** de la fuente y **nunca el año** (`global §3.5b`); el año va en la entrega interna.
- Nada inventado. Lo no verificable va como `[PENDIENTE · no verificado]`.
- Validador mecánico antes de cada entrega, con su línea de resultado fuera del bloque.

### B.4 · El protocolo de prueba

- **3 tarjetas, 3 semanas, una cuenta distinta cada vez.** Fuera del cuadro latino.
- **Se juzga por alcance y reposts, NUNCA por comentarios** (`§0.4`).
- **Listón: lift ≥ 1,0 sobre la media de esa cuenta en 2 de las 3.**
- Si pasa, entra como pilar y se decide su slot. Si no, se cierra con datos y no se ha quemado ningún slot de los tres de siempre.

### B.5 · Ficheros

- `docs/skills/post-workflow.md` — runbook nuevo `§4.6 · Runbook TARJETA`.
- `docs/skills/images.md` — registro de imagen nuevo: la tarjeta X, con la paleta y el ratio.
- `scripts/validar-post.py` — pilar `tarjeta`: 3 párrafos, sin cifra en P1, P3 más corta que P1 y P2, 0 hashtags/emoji dentro de la tarjeta, texto de LinkedIn 150-400, ninja de agendar presente, sin CTA imperativo, ratio no apaisado.
- `docs/skills/historial-publicaciones.md` — registrar cada tarjeta de la prueba.

---

## PENDIENTES (bloquean la primera tarjeta, no el spec)

- ~~El `@handle` de la tarjeta.~~ **CERRADO (Iker, 2026-08-20).** Se simula X, y el handle sale del identificador REAL de LinkedIn de cada uno, sin guiones (en X no son validos): `@ikergalarza` · `@unaiarambarri` · `@asierolaizola`. El de Unai se acorta a dos palabras porque los handles de las referencias son cortos (`@AdamMGrant`, `@AlexHormozi`). **El NOMBRE de la linea 1 va completo y exacto**; lo que se acorta es el handle. Detalle en `post-workflow §4.6-HANDLE`.
- **Qué cuenta abre la prueba** y con qué creencia comercial.
