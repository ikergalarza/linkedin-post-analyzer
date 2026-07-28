# PLAN — El motor de outliers del MCP

> Deep-dive del bloque B de `docs/mcp-plan.md`. Aquí vive el objetivo real del MCP:
> **consultar y analizar outliers en masa para decidir qué contenido hacer**, no escribir posts.
> Estado: propuesta. Fecha: 2026-07-28.

---

## 0 · El objetivo, en una frase

Que puedas preguntar *"enséñame los lead magnets de los últimos 3 meses ordenados por multiplicador,
y dime si están funcionando peor que en primavera"* y recibir una respuesta con `n` a la vista,
en vez de bajarte 500 posts y mirarlos a ojo. Y que cada mañana salga solo un resumen de las
novedades para el director de marketing y growth.

Eso son tres capas, y las tres tienen hoy un problema distinto:

| Capa | Qué falta hoy |
|---|---|
| **Buscar** | No hay endpoint de búsqueda. Solo un `ILIKE %x%` privado (`ideas.ts:993`) y `getTopOutliersGlobal(500)` sin un solo filtro |
| **Clasificar** | Tres taxonomías que no se hablan, ninguna con confianza ni procedencia. Es el problema que ya notas |
| **Vigilar** | **No existe el concepto de "outlier nuevo".** Sin eso no hay rutina diaria posible |

---

## 1 · Diagnóstico: por qué "muchos no están bien categorizados"

No es una impresión, es estructural. Hoy conviven **cuatro sistemas de etiquetas** sobre la misma tabla:

| Etiqueta | Dónde se calcula | Cómo | Idioma | Cobertura |
|---|---|---|---|---|
| `pillar` | `services/pillar.ts` | Regex determinista, 6 valores cerrados | ES | Todos los posts |
| `topic` | `routes/ideas.ts` `/inspiration/classify` | LLM (Sonnet), etiqueta libre | EN | **Solo outliers con >80 chars** |
| `hook_type`, `post_structure`, `text_tone` | `services/engagement.ts` | Regex determinista | EN | Todos |
| `driver` | `services/patterns.ts` `detectViralityDriver` | Regex, **calculado al vuelo** | EN | **No se guarda nunca** |

Y estos son los seis fallos concretos que hacen que el filtrado por categoría no sea fiable:

**1. `topic` es texto libre generado por un LLM.** El prompt pide *"use CONSISTENT labels"* y da 11
ejemplos, pero nada impide que un lote devuelva `"Sales Tactics"`, el siguiente `"Sales Tips"` y el
tercero `"B2B Sales"`. Al filtrar por uno pierdes los otros dos, y no te enteras. **No hay
vocabulario cerrado, ni `taxonomy_version`, ni deduplicación posterior.**

**2. `pillar` solo reconoce NUESTROS formatos.** Sus regex buscan la ficha `→ Empresa - Persona` y el
`comenta "palabra"`. Un post de la competencia no tiene ni una cosa ni la otra → cae en `'otro'`
casi siempre. **Filtrar la competencia por pilar hoy no sirve para nada**, que es justo donde más
falta hace.

**3. El pilar se calcula en el ingest SIN las reacciones, y luego se congela.**
`PostModel.bulkUpsert` llama a `classifyPillar` sin `reaction_mix` (las reacciones llegan después),
así que **ningún meme se detecta al entrar**. Y el upsert hace
`pillar = COALESCE(posts.pillar, EXCLUDED.pillar)` (`models/post.ts:152`): la primera etiqueta —la
mala— gana para siempre salvo que alguien corra el pase autoritativo a mano.

**4. `topic` solo se calcula para `is_outlier = TRUE`.** Los posts normales no tienen tema. Eso
rompe la pregunta más útil de todas: *"¿los memes son outlier más a menudo que los mapas?"* — para
responderla necesitas el denominador, y el denominador no está etiquetado.

**5. `outlier_ratio` no es comparable entre creadores.** Hay **dos métodos** (`services/outliers.ts`):
las cuentas gestionadas con impresiones usan el **híbrido** (`MAX(ratio de engagement, ratio de
alcance)`, sin suelo absoluto), y todos los demás el **absoluto** (engagement ÷ media, con suelo de
200). Un 5x de Iker puede venir de alcance; un 5x de un competidor es siempre engagement. Ordenar
una lista mezclada por `outlier_ratio` compara cosas distintas. **El MCP tiene que devolver el
método junto al número, siempre.**

**6. Nadie guarda el `driver`** (controversia, identidad, utilidad, aspiración…), que es
precisamente el eje por el que querrías buscar para decidir qué innovar. Se recalcula en cada
petición y se tira.

> **Consecuencia práctica:** cualquier tool que dependa SOLO de la categoría va a mentir. El diseño
> de abajo asume que **la etiqueta es una pista, no una verdad**, y da tres caminos que no pasan por
> ella: texto completo, similitud semántica y facetas con recuento.

---

## 2 · La capa de etiquetas que hay que construir

### 2.1 · Una tabla de etiquetas, no más columnas

Añadir `driver TEXT` y `topic_v2 TEXT` a `posts` repite el error. Propuesta:

```sql
CREATE TABLE post_labels (
  post_id     UUID REFERENCES posts(id) ON DELETE CASCADE,
  eje         TEXT NOT NULL,       -- 'pilar' | 'tema' | 'driver' | 'formato' | 'sector'
  valor       TEXT NOT NULL,       -- del vocabulario cerrado del eje
  fuente      TEXT NOT NULL,       -- 'regex' | 'llm' | 'humano' | 'swipe'
  confianza   FLOAT,               -- 0-1; null para 'humano' (= 1 implícito)
  modelo      TEXT,                -- p.ej. 'claude-sonnet-4-6' si fuente='llm'
  taxonomia   INTEGER NOT NULL,    -- versión del vocabulario con que se etiquetó
  creado_en   TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (post_id, eje, fuente)
);
```

Lo que esto compra, y las columnas sueltas no:

- **Reclasificar sin destruir.** Hoy `POST /api/posts/classify-pillars` hace `UPDATE posts SET pillar`
  sobre TODA la tabla, una query por fila, pisando cualquier corrección manual previa. Con la tabla,
  la etiqueta `humano` convive con la `llm` y **gana siempre en la lectura**.
- **Saber de qué te fías.** `confianza_min` como filtro de búsqueda, y una tool de salud que te diga
  qué porcentaje del corpus está etiquetado a mano vs adivinado.
- **Versionar el vocabulario.** Cuando cambies la taxonomía, `taxonomia < N` marca lo que hay que
  reprocesar, en vez de reprocesarlo todo a ciegas.
- **Aprovechar el `outlier_swipes` que ya existe.** El deck de swipe guarda `like`/`skip` por post.
  Eso es señal humana gratis que hoy solo alimenta el deck: entra como `fuente='swipe'`.

**Vocabularios cerrados por eje** (versionados en `docs/skills/` para que doctrina y datos coincidan):
- `pilar`: los 6 de `pillar.ts` + los que faltan para la competencia (`carrusel_valor`, `opinion`,
  `caso_cliente`, `contratacion`, `anuncio`, `dato_shock`).
- `driver`: los 7 de `detectViralityDriver`, ya definidos, solo hay que persistirlos.
- `tema`: aquí está el trabajo. **~25-40 valores cerrados**, derivados agrupando los `topic` libres
  que ya hay en la BD (primer paso: sacar el listado real con recuentos y fusionar sinónimos a mano).

### 2.2 · Clasificar en tres pasadas, de barata a cara

| Pasada | Qué hace | Cuándo corre | Coste |
|---|---|---|---|
| **1 · Determinista** | `pillar`, `hook_type`, `estructura`, `tono`, `driver`, señales de formato | En cada ingest y en cada refresco | 0 |
| **2 · LLM** | `tema` y el `pilar` de lo que la pasada 1 dejó en `'otro'` | En lote, solo sobre lo que falte o esté en `taxonomia` vieja | Haiku por lotes de 30 |
| **3 · Humana** | Correcciones | Cuando ves una mal en una respuesta del MCP | 0 |

**Dos arreglos obligatorios en la pasada 1**, o seguimos igual:
- `classifyPillar` debe re-ejecutarse **después** de que lleguen las reacciones, no solo en el ingest.
  El sitio natural es el tick de `postMonitor` cuando escribe `reaction_mix`.
- Quitar el `COALESCE(posts.pillar, …)` del upsert y sustituirlo por "no pises una etiqueta de
  fuente `humano`", que es lo que ese COALESCE intentaba proteger de forma torpe.

**Y la pasada 2 tiene que etiquetar también los NO-outliers** (al menos una muestra), o seguimos sin
denominador.

### 2.3 · Los dos caminos que NO dependen de la etiqueta

Esto es lo que hace que el motor funcione **aunque la categorización siga siendo regular**:

**a) Texto completo en español.** `tsvector` con diccionario `spanish` + `pg_trgm` para tolerar
erratas y acentos. Cubre `content_text`, `hook_text` y `hashtags`. Un índice GIN. Con esto,
*"outliers que hablan de subvenciones"* funciona sin que nadie haya creado la categoría "Subvenciones".

**b) Similitud semántica.** `pgvector` + un embedding por post (barato, se calcula una vez).
Habilita la consulta que más veces vas a querer y que hoy es imposible:
**"dame 20 outliers parecidos a este"** — sin categoría, sin palabras clave, sin saber cómo se llama
lo que buscas. Es también la forma correcta de detectar el drift de etiquetas: si dos `topic`
distintos tienen centroides pegados, son el mismo tema con dos nombres.

---

## 3 · Las tools del motor

Ocho tools. Deliberadamente pocas y muy parametrizadas: la potencia va en los filtros, no en el
número de herramientas.

### 3.1 · `neety_outliers_buscar` — el buscador

Parámetros **agrupados en cinco objetos** para que el esquema se lea de un vistazo. Todos opcionales.

```
quien:   { ambito: propios|competencia|todos, cuenta[], creador[],
           seguidores_min, seguidores_max }
cuando:  { desde, hasta, ultimos_dias, dia_semana[], hora_local_min, hora_local_max }
cuanto:  { ratio_min, ratio_max, likes_min, likes_max, comentarios_min, reposts_min,
           impresiones_min, engagement_min,
           comment_like_ratio_min,   -- señal de DEBATE
           share_like_ratio_min,     -- señal de UTILIDAD
           guardados_min, clics_enlace_min,   -- Premium, solo cuentas propias
           percentil_creador_min }   -- ver §5, la métrica comparable
que:     { pilar[], tema[], driver[], hook_type[], estructura[], tono[],
           tipo_contenido[], idioma, es_lead_magnet, palabra_gate,
           longitud_min, longitud_max, menciones_min,
           confianza_min, solo_humano }
texto:   { q, modo: frase|todas|cualquiera, excluir, parecido_a: <post_id> }
```

Orden: `ratio | percentil | likes | comentarios | impresiones | engagement | fecha | debate | utilidad`.
Salida: `formato: tabla|fichas|ids|solo_conteo`, `limit ≤ 50`, `cursor`.

**Contrato de salida** (una línea por post, ~25 tokens; 30 resultados caben en ~800 tokens):

```
2026-07-17 · Unai · peloteo_mapa · 3.71x[eng] · 412♥ 189💬 · "La ven como un secarral…" · p_8f3a
```

Y **siempre** un pie con: `n total`, `filtros aplicados`, `cuántos resultados tienen la etiqueta
adivinada`, y el aviso si se han mezclado los dos métodos de ratio.

### 3.2 · `neety_outliers_valores` — facetas (la tool que evita filtrar a ciegas)

`eje: tema|pilar|driver|hook|estructura|tono|creador|palabra_gate` + los mismos filtros.
Devuelve **los valores que existen de verdad, con recuento y ratio medio**:

```
Sales Tactics ......... 34 posts · 4.1x medio
Sales Tips ............ 12 posts · 3.8x medio   ← posible duplicado de "Sales Tactics"
B2B Sales .............  9 posts · 5.2x medio   ← posible duplicado
(sin tema) ............ 61 posts                ← el agujero, a la vista
```

Se llama **antes** de filtrar por una categoría. Resuelve el problema de raíz por dos vías: nunca
filtras por una etiqueta que no existe, y **el drift se ve** en vez de esconderse.

### 3.3 · `neety_outliers_agrupar` — el group-by genérico

`dimension` × `metrica` con los filtros de §3.1.

- **dimension**: `pilar | tema | driver | hook | estructura | tono | tipo_contenido | creador |
  cuenta | dia_semana | hora | mes | semana | bucket_longitud | bucket_seguidores`
- **metrica**: `n | ratio_medio | ratio_mediano | ratio_p90 | tasa_outlier | likes_medios |
  comentarios_medios | impresiones_medias | comment_like_ratio_medio`

**`n` va siempre en la salida, no es opcional.** La trampa clásica de este corpus es concluir "los
memes van 3x mejor" con n=2. Cuando `n < 5`, la fila sale marcada como no concluyente. Y
`tasa_outlier` (outliers ÷ total del grupo) es la métrica honesta para "¿qué formato acierta más?",
porque el `ratio_medio` de un grupo filtrado a outliers está sesgado por construcción.

### 3.4 · `neety_outliers_comparar` — el eje temporal

`ventana_a` vs `ventana_b` (o `ultimos_90d` vs `los_90d_anteriores`), agrupado por una dimensión.
Devuelve delta absoluto, delta %, `n` de cada lado y una marca de significancia grosera.

Es la tool que responde literalmente *"los lead magnets, ¿funcionan peor que antes?"*:

```
pilar          n(A→B)    ratio medio A→B    delta
lead_magnet    9 → 6     5.8x → 2.9x        -50%   ⚠ fatiga
peloteo_mapa   4 → 5     6.1x → 6.4x         +5%
meme           3 → 7     2.2x → 4.8x       +118%   ▲ subiendo
```

### 3.5 · `neety_outliers_terminos` — palabras clave con elevación

N-gramas (1-3 palabras) **sobreexpresados** en el grupo filtrado frente al resto del corpus, con
`n` y ratio medio de los posts que lo contienen. Stopwords en español, y se descartan los términos
con `n < 3`.

Responde *"¿qué palabras aparecen en los outliers de memes que no aparecen en el resto?"* y
*"¿qué gancho verbal está caliente este mes?"* — que es exactamente el insumo de
`global-instructions §2.9` (la escalera de verbos), hoy alimentada a mano.

### 3.6 · `neety_outliers_similares` — sin categorías

`post_id` (o un texto libre) → los N outliers más cercanos por embedding, con su distancia.
La consulta de *"quiero hacer algo como esto, ¿qué ha funcionado parecido?"*.

### 3.7 · `neety_leadmagnets` — el pilar que hoy no se puede analizar

Merece tool propia porque **el dato clave no está en la BD**: la palabra del gate vive solo en los
comentarios, y `CLAUDE.md` ya avisa de que la BD no los guarda. Hoy `pillar='lead_magnet'` te dice
que hay gate, pero no cuál era la palabra ni cuánto rindió.

Hay que persistir tres cosas al cerrar el post (a los 7 días, cuando el monitor lo congela):
`lm_palabra`, `lm_comentarios_con_palabra`, `lm_pct_gate` — calculadas una vez con
`GET /api/v1/posts/{id}/comments` (el método de `outliers-database §3.9b`).

Con eso, la tool cruza lo que ya existe y devuelve el embudo entero por post:

```
fecha       cuenta  palabra       coment.  %gate   clics    envíos  aceptados  ratio
2026-07-08  Iker    "prospeccion"   142     71%     318      118       74      8.5x
2026-06-24  Unai    "plantilla"      38     52%      61       31       19      2.1x
```

(`clics` sale de `link_clicks_count`, ya en Premium; `envíos`/`aceptados` de la tabla
`lead_magnet_sends`, que ya existe.)

### 3.8 · `neety_outliers_salud` — cuánto te puedes fiar

Sin argumentos. La primera tool que hay que construir y la que hay que mirar antes de creerse
cualquier análisis:

```
Posts totales: N · outliers: N (X%)
── Cobertura de etiquetas ───────────────────
tema          72% (28% sin etiquetar · 100% de los no-outliers sin tema)
pilar         100% — pero 'otro' es el 61% (94% en competencia)
driver        0%  — no se persiste todavía
reaction_mix  41% — sin esto no se detecta ningún meme
impresiones   solo cuentas propias
── Salud de la taxonomía ────────────────────
temas distintos: 47 · sospechosos de duplicado: 9 pares
etiquetas humanas: 0%
── Frescura ─────────────────────────────────
competencia: último refresco hace N días
```

> ⚠️ **Los porcentajes de arriba son el formato, no medidas.** No he podido consultar la BD de
> producción desde esta sesión (no hay `APP_BASIC_USER`/`APP_BASIC_PASS` en el entorno). Medirlos es
> literalmente el primer entregable del plan.

---

## 4 · La rutina diaria: refresco + digest

### 4.1 · El problema que hay que resolver antes: "¿qué es nuevo?"

Hoy **no hay forma de contestarlo**, y no por falta de un endpoint sino por el modelo de datos.
`is_outlier` es un booleano que se recalcula entero cada vez (`recalcCreatorOutliers`) contra la
**media móvil del creador**. Consecuencias:

- Un post puede **volverse** outlier meses después porque la media del creador bajó, sin que haya
  pasado nada nuevo. Sale en el digest como "novedad" y es ruido.
- Un outlier real puede **dejar de serlo** al subir la media. Desaparece en silencio.
- No se guarda **cuándo** cruzó el umbral ni cuál fue su **pico**.

Un digest construido sobre `is_outlier = TRUE AND published_at > ayer` se salta los posts que
tardan 3 días en despegar, y uno construido sobre `is_outlier` a secas repite los mismos cada día.

**Lo mínimo que hay que añadir:**

```sql
ALTER TABLE posts ADD COLUMN became_outlier_at   TIMESTAMPTZ;
ALTER TABLE posts ADD COLUMN peak_outlier_ratio  FLOAT;
ALTER TABLE posts ADD COLUMN ratio_al_cierre     FLOAT;  -- congelado a los 7 días

CREATE TABLE outlier_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  evento TEXT NOT NULL,            -- 'nuevo' | 'promovido' | 'degradado' | 'pico'
  ratio_antes FLOAT, ratio_despues FLOAT,
  motivo TEXT,                     -- 'post_nuevo' | 'media_del_creador_movida'
  detectado_en TIMESTAMPTZ DEFAULT NOW()
);
```

Y que `recalcCreatorOutliers` **emita el evento cuando `is_outlier` cambie de valor**, distinguiendo
si cambió porque el post creció (`post_nuevo`) o porque se movió la media (`media_movida`). Son ~20
líneas dentro de una función que ya toca justo ese sitio, y sin ellas la rutina diaria no tiene
sustancia.

**`ratio_al_cierre`** resuelve el otro lado: congelar el multiplicador a los 7 días da una serie
histórica estable con la que comparar meses. El `outlier_ratio` vivo sirve para "qué está pasando
ahora", el congelado para "qué funcionó".

### 4.2 · El refresco (`neety_refrescar`)

`postMonitor` solo vigila **cuentas gestionadas** y solo **7 días** (`c.is_managed = TRUE AND
published_at > NOW() - 7 days`). La competencia no se refresca sola: hay que llamar a
`POST /api/creators/:id/refresh` a mano. Para la rutina diaria falta un job nuevo:

| Parámetro | Propuesta |
|---|---|
| Qué refresca | Creadores de competencia ordenados por antigüedad del último escaneo |
| Cuántos | **Presupuesto de llamadas por vuelta** (p. ej. 15 creadores/día), no "todos" |
| Después | `recalcCreatorOutliers` por creador tocado → emite los `outlier_events` |
| Luego | Pasada determinista de etiquetas + pasada LLM solo sobre lo nuevo |
| Devuelve | Creadores refrescados, posts nuevos, eventos generados, llamadas gastadas |

El presupuesto no es opcional: cada refresco son llamadas a Unipile, y el rate limit de LinkedIn se
paga en todo el scraping, no solo aquí — `postMonitor` ya raciona la analítica Premium a 6 por tick
por ese motivo.

### 4.3 · El digest (`neety_digest`)

`fecha`, `desde`, `destinatario`, `dry_run`. Lee `outlier_events` + `neety_outliers_agrupar`, y
**el canal ya existe**: `services/googleChat.ts` + `GOOGLE_CHAT_WEBHOOK_URL`, que hoy se usa para
mandar comentarios de apoyo. Tope de 4.096 caracteres por mensaje (el código ya usa 3.800 de margen).

Estructura propuesta — **cuatro bloques y nada más**, porque un digest que no se lee no sirve:

```
📊 Outliers · lunes 28 jul

🆕 3 nuevos (de 47 posts escaneados)
  6.2x · Competidor X · meme · "Cuando el CRM dice…"  → [enlace]
  4.1x · Competidor Y · carrusel · "Los 7 errores…"   → [enlace]

📈 Se movió
  El lead magnet de Unai (24 jun) pasó de 2.1x a 3.4x — sigue subiendo a 5 semanas

🔍 Lectura de la semana
  Los memes suben (+118% de ratio medio, n=7) · los lead magnets bajan (-50%, n=6)
  Palabra caliente: "subvención" (5 outliers este mes, 0 el anterior)

⚠️ Salud del dato
  28% del corpus sin tema · competencia sin refrescar desde hace 3 días
```

Tres reglas de diseño:
1. **Idempotencia.** Un `outlier_event` ya enviado no se repite: marca `enviado_en`. Si no, el mismo
   post sale cinco días seguidos y el digest se ignora en una semana.
2. **Silencio si no hay nada.** Cero novedades → no se manda mensaje. Un digest vacío diario educa a
   no abrirlo.
3. **El bloque de salud del dato va SIEMPRE**, aunque sea una línea. Es lo que evita que dentro de
   tres meses alguien tome una decisión sobre un corpus medio etiquetado creyendo que está entero.

**Montaje:** el cron puede ser una Routine que llame a la tool, o un `setInterval` en el backend
junto a `startPostMonitor()`. Recomiendo **lo segundo para el refresco** (es infraestructura, debe
correr aunque nadie abra un chat) y **lo primero para el digest** (así el resumen lo redacta el
modelo con el criterio de las skills, en vez de una plantilla fija).

---

## 5 · Comparar entre creadores sin mentir

Cuando mezclas cuentas propias y competencia en una misma lista, `outlier_ratio` deja de ser una
escala común: son dos métodos distintos (§1.6) y dos tamaños de audiencia distintos. Tres medidas:

1. **Devolver siempre el método** junto al número: `3.71x[eng]` vs `5.20x[alc]`. Barato y honesto.
2. **Añadir `percentil_creador`**: dónde cae ese post dentro de la distribución de SU creador.
   `p97` significa lo mismo para todo el mundo; `5x` no. Es la métrica correcta para ordenar
   listas mezcladas y para `neety_outliers_agrupar` cuando la dimensión cruza creadores.
3. **Bucket de seguidores como filtro de primera clase.** Un 6x de una cuenta de 2.000 seguidores y
   uno de 200.000 no son la misma lección, y hoy no hay forma de separarlos.

---

## 6 · Qué hay que construir, en orden

| # | Trabajo | Desbloquea | Tamaño |
|---|---|---|---|
| 1 | **`neety_outliers_salud`** + las queries de cobertura | Saber de qué partimos. Sin esto el resto se diseña a ciegas | S |
| 2 | Índices: GIN `tsvector` español + `pg_trgm`, y compuestos `(is_outlier, published_at DESC)`, `(creator_id, outlier_ratio DESC)` | Que el buscador no haga *seq scan* | S |
| 3 | **`GET /api/posts/search`** con los filtros de §3.1 → `neety_outliers_buscar` + `neety_outliers_valores` | El 80% del valor del motor | **L** |
| 4 | `became_outlier_at`, `peak_outlier_ratio`, `ratio_al_cierre`, tabla `outlier_events` + emisión en `recalcCreatorOutliers` | La rutina diaria. **Nada del digest funciona sin esto** | M |
| 5 | Persistir `driver`; re-ejecutar `classifyPillar` tras las reacciones; quitar el `COALESCE` que congela el pilar malo | Que las categorías dejen de mentir | S |
| 6 | `post_labels` + vocabulario cerrado de `tema` (fusionando los `topic` actuales) + pasada LLM sobre no-outliers | Filtrado por tema fiable y con denominador | **L** |
| 7 | `neety_outliers_agrupar`, `_comparar`, `_terminos` | Las decisiones estratégicas | M |
| 8 | Job de refresco de competencia con presupuesto de llamadas | Corpus fresco | M |
| 9 | `neety_digest` sobre `googleChat.ts` + idempotencia | El resumen diario | M |
| 10 | `lm_palabra` / `lm_pct_gate` al cerrar el post → `neety_leadmagnets` | Analizar el pilar de lead magnet | M |
| 11 | `pgvector` + embeddings → `neety_outliers_similares` | Buscar sin categorías | M |

**Los pasos 1-4 son el mínimo viable** y ya cambian cómo trabajas: buscador real y digest diario.
Del 5 al 7 es donde la categorización deja de ser un problema. El 11 es el que hace que deje de
importar del todo.

---

## 7 · Decisiones que necesito de ti

1. **Del `tema`: ¿vocabulario cerrado o libre?** Cerrado (25-40 valores) hace el filtrado fiable pero
   obliga a mantenerlo y a re-etiquetar cuando cambie. Libre es lo de hoy. **Recomiendo cerrado**, y
   el primer paso es sacar el listado real de `topic` con recuentos para fusionar sinónimos — puedo
   hacerlo en cuanto tenga acceso a la BD.
2. **El digest, ¿a quién y por dónde?** El `GOOGLE_CHAT_WEBHOOK_URL` que ya existe apunta a un
   espacio concreto. ¿Vale ese, o el director de marketing y growth necesita otro canal (email,
   privado)?
3. **Presupuesto de refresco.** ¿Cuántos creadores de competencia hay trackeados y cuánta cuota de
   Unipile podemos gastar al día en refrescarlos? De eso sale la cadencia real.
4. **¿Etiqueto los no-outliers?** Duplica el coste de la pasada LLM, pero sin denominador no se puede
   responder "qué formato acierta más a menudo", solo "qué formato aparece más entre los que
   acertaron". **Recomiendo etiquetar al menos una muestra aleatoria** en vez del corpus entero.
