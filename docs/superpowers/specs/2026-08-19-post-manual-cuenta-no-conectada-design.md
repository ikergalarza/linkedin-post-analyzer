# Post manual de una cuenta NO conectada a Unipile

Fecha: 2026-08-19 · Decidido con Iker en brainstorming.

## El problema

Escribimos posts para gente de la empresa que no son los 3 jefes. Esas cuentas
no están conectadas por Unipile y no lo van a estar. Hoy esos posts no existen
para la herramienta: ni salen en Live posts, ni suman al dashboard, ni se puede
saber si funcionaron.

## Lo que se construye

Un botón `+ Añadir post` en la cabecera de Live posts, a la izquierda de
`+ Get new posts` y con el mismo estilo apagado. Pego la URL de la publicación,
la herramienta extrae sola todo lo público, yo escribo a mano lo privado, y el
post entra al sistema como uno más.

## Decisiones cerradas

| Decisión | Elegido | Descartado |
|---|---|---|
| Alcance | Solo el post que pego | Auto-sincronizar toda la cuenta (entrarían sus posts personales y ensuciarían las medias) |
| Cuenta | Se crea sola desde el autor, con badge `manual` | Un cajón único "Posts manuales" |
| Seguimiento | Curva viva completa, mismas fases | Foto fija al pegar |
| Métricas privadas | Cada edición añade un punto a la curva | Sobrescribir sin histórico |
| Dashboard | Suman a todo + interruptor para apagarlas | Sumar sin interruptor / dos verdades en pantalla |

## Hechos verificados contra la API real (2026-08-19)

No son suposiciones; se probaron antes de diseñar:

1. `GET /api/v1/posts/{urn}?account_id={sesión de Iker}` devuelve **200 con
   datos completos de un post que NO es nuestro**: texto, autor (nombre exacto,
   headline, foto, `public_identifier`, `provider_id`), contadores públicos,
   `attachments` con las imágenes y `parsed_datetime`.
2. `impressions_counter` viene **0** y `analytics` viene **null** para un post
   ajeno. Las impresiones son privadas y no hay forma de leerlas. De ahí que las
   métricas privadas se escriban a mano.
3. Unipile exige el **URN exacto**: `urn:li:activity:7485982282298806272` da 404
   sobre un post cuyo URN real es `urn:li:ugcPost:7485982282298806272`. El id
   numérico suelto también da 404.
4. La propia URL pública lleva el tipo dentro
   (`...-ugcPost-7485982282298806272-SnX2` frente a `...-activity-7494317162271076352-3n0e`),
   así que el parser lo saca de ahí en vez de adivinar.

## Riesgo detectado en el código existente

`PostModel.bulkUpsert` hace `impressions_count = EXCLUDED.impressions_count` sin
COALESCE. Si el post manual pasara por esa función, **cada refresco pisaría con
0 las impresiones escritas a mano**. Por eso el guardado manual lleva su propio
upsert con COALESCE sobre las 8 columnas privadas, y el tick de seguimiento
nunca escribe impresiones en un post manual.

## Arquitectura

### Modelo de datos

Migración v38, una sola columna:

```sql
ALTER TABLE creators ADD COLUMN IF NOT EXISTS is_manual BOOLEAN DEFAULT FALSE;
```

Las 8 columnas de métricas privadas ya existen desde v31/v32 y se reutilizan tal
cual: `impressions_count`, `link_clicks_count`, `saves_count`, `sends_count`,
`premium_button_clicks`, `profile_viewers_count`, `followers_gained_count`,
`link_url`.

`post_snapshots` NO se toca: guarda solo las cuatro métricas que la curva dibuja
(impresiones, likes, comentarios, reposts). Los clics, guardados y envíos viven
en `posts` con su valor actual y no se historifican, porque nadie los pinta en
el tiempo. Añadir siete columnas para un histórico que no se lee es peso muerto.

Una cuenta manual es `is_managed = TRUE`, `is_manual = TRUE`,
`unipile_account_id = NULL`. Ese NULL es la protección: `live-refresh` y
`accountSnapshotTick` filtran por `unipile_account_id IS NOT NULL`, así que
nunca intentarán capturar seguidores de una cuenta que no controlamos (que es lo
que habría guardado los seguidores de Iker como los del trabajador).

### Backend: `services/manualPost.ts` (nuevo)

`accounts.ts` ya son 3.668 líneas. La lógica nueva vive aparte y expone tres
funciones con una responsabilidad clara cada una:

- **`parsearUrlPost(url)`**. Sin red, testeable sola.
  - `/feed/update/urn:li:(activity|ugcPost|share):(\d+)` → URN exacto
  - `/posts/<slug>-(activity|ugcPost|share)-(\d+)-<código>` → `urn:li:<tipo>:<n>`
  - dígitos sueltos → candidatos en orden `activity`, `ugcPost`, `share`

  Siempre devuelve los otros tipos como respaldo por si LinkedIn cambia el slug.

- **`extraerPost(url)`**. Recorre los candidatos hasta el primer 200. Elige la
  sesión: si el autor resulta ser una de nuestras cuentas conectadas usa la suya
  (así sí llegan impresiones de verdad); si no, presta `UNIPILE_ACCOUNT_ID`.
  Devuelve autor, texto entero, imágenes, contadores y fecha, **sin escribir
  nada en la BD**.

- **`guardarPostManual(url, metricasPrivadas)`**. Vuelve a extraer (no se fía del
  payload del navegador), busca o crea el creator, hace su propio upsert con
  COALESCE, y siembra el primer `post_snapshots`.

Búsqueda del creator, en este orden: por `linkedin_id` = `author.id`, luego por
`linkedin_url` construida desde `public_identifier`. Si existe, el post se le
añade y **no se toca su `is_manual`** — pegar la URL de un post de Iker lo mete
en la cuenta de Iker, no crea una cuenta manual duplicada. Si no existe, se crea
con el nombre exacto, la foto y el headline que devuelve Unipile.

### Backend: rutas

| Ruta | Qué hace |
|---|---|
| `POST /api/accounts/manual-post/preview` | `{url}` → vista previa. No escribe. |
| `POST /api/accounts/manual-post` | `{url, ...privadas}` → crea cuenta si hace falta, guarda post, siembra snapshot. |
| `PATCH /api/accounts/posts/:id/manual-metrics` | Actualiza las privadas **y** añade un `post_snapshots` con la hora. Es lo que dibuja la curva de impresiones. |

Guardas relajadas: donde hoy se exige `c.unipile_account_id IS NOT NULL` para
que un post entre en Live posts o en el tick, pasa a
`(c.unipile_account_id IS NOT NULL OR c.is_manual = TRUE)`. Son dos sitios:
`GET /api/accounts/live-posts` y la consulta de candidatos de `postMonitor`.

### Backend: seguimiento

`postMonitor` gana una rama para posts de cuentas manuales. Las conectadas
siguen igual (una llamada `getPosts` por cuenta, que trae todos sus posts de
golpe). Las manuales van de una en una con `getPostById(urn, sesión prestada)`:
son pocas y así se evita recorrer el feed entero de un tercero.

Esa rama escribe **solo contadores públicos** en `post_snapshots` y arrastra las
métricas privadas del último snapshot conocido, para que la curva de impresiones
no se rompa a cero entre dos ediciones manuales. Nunca pide analítica Premium
(es imposible para un post ajeno) y nunca toca `impressions_count` del post.

### Frontend

`components/accounts/AddManualPostModal.tsx` (nuevo), con la misma cáscara que
`GoogleChatModal`: `fixed inset-0 z-50 bg-black/70 backdrop-blur-sm`, tarjeta
`bg-bg-card border border-border rounded-2xl`.

Dos pasos dentro del mismo modal:

1. Campo de URL y botón *Extraer*. Al volver, muestra lo que ha sacado: foto y
   nombre del autor, si la cuenta ya existe o se va a crear, la imagen del post,
   el texto entero y los contadores públicos. **Nada se guarda hasta que
   confirmo.** Es el seguro contra pegar la URL equivocada.
2. Debajo, los siete campos numéricos privados más el enlace del post, todos
   vacíos y todos opcionales, con la etiqueta de dónde se lee cada uno en
   LinkedIn. Un hueco significa "no lo he mirado" y un 0 significa "lo he
   mirado y no hay": esa diferencia es la que evita que la curva mienta.

En `Accounts.tsx`:
- El botón `+ Añadir post` a la izquierda de `+ Get new posts`, mismo
  `text-xs text-text-muted hover:text-accent`.
- Badge `manual` en la fila del post y en la tabla por cuenta.
- Check *Incluir cuentas manuales* junto al selector de cuenta, marcado por
  defecto, que viaja como `include_manual=false` a `/analytics` y `/live-posts`.
  El selector de cuentas las sigue listando siempre: el interruptor cambia lo que
  se agrega, no lo que se puede mirar.
- En un post manual, las métricas privadas son editables desde la propia fila
  (reabre el modal en el paso 2).

## Qué NO se construye (YAGNI)

- Auto-sincronizar la cuenta manual entera.
- Seguidores, visitas al perfil o WVMP de la cuenta manual (no se pueden leer).
- Comentarios, respuestas o lead magnet sobre posts manuales: esos flujos
  necesitan la sesión del dueño para actuar, no solo para leer.
- Analítica Premium automática. Es privada del dueño, punto.

## Comprobado (2026-08-19, contra producción)

1. `parsearUrlPost`: 9 casos, incluidos `ugcPost`, `activity`, `share`,
   `/feed/update/`, id suelto y tres entradas basura. 9/9.
2. `POST /manual-post/preview` con una URL real: 200, resuelve `ugcPost` desde
   el slug, autor y `/company/` correctos, texto y contadores reales, y `raw`
   fuera de la respuesta.
3. `POST /manual-post` sobre un post NUESTRO ya existente: devuelve el MISMO
   `post_id` (no duplica), `cuenta_creada: false`, y **las 6.654 impresiones
   siguen ahí** — la prueba de que el COALESCE protege lo escrito a mano. Con
   `PostModel.bulkUpsert` ese número habría pasado a 0.
4. `PATCH /manual-metrics`: escribe, siembra el punto en la curva (23 → 24
   snapshots) y deja intactas las métricas que no viajaban en el cuerpo.
5. Errores: URL sin id de post y PATCH vacío devuelven 400 con mensaje útil.
6. Interfaz: el botón sale junto a `+ Get new posts`, el modal extrae y pinta
   autor, foto, texto y los 7 campos, y el botón de guardar solo aparece
   después de extraer. El check "Incluir cuentas manuales" no se pinta mientras
   no exista ninguna cuenta manual, que es lo previsto.

## Cerrado con los dos primeros posts reales (2026-08-19, Mario y Helena)

Iker pegó las URLs de un post de **Mario Carrillo** (12/08, con las siete
métricas privadas escritas) y otro de **Helena Baviera Serigó** (19/08). Las dos
cuentas se crearon solas con su nombre y foto. Eso cerró el único camino que
faltaba —crear cuenta manual nueva— y destapó tres fallos que solo se ven con
datos dentro:

1. **`/impressions-monthly` ignoraba `include_manual`.** Apagar el interruptor
   bajaba los KPI de arriba y dejaba la barra "Impressions per month" intacta:
   dos números que se contradicen en la misma pantalla, que es exactamente lo
   que el interruptor existía para evitar. Arreglado.
2. **El botón ↻ de la fila devolvía siempre `ok:false` en un post manual.**
   `capturePostSnapshot` exige `unipile_account_id`, y en estas cuentas es NULL
   a propósito. Ahora esos posts salen por `refrescarPostManual`, igual que en el
   tick. Arreglado.
3. **`outlier_ratio` se quedaba en 0** y la fila mostraba `0.0x`, que se lee como
   que el post ha fracasado (Mario, con 397 de engagement). Se recalcula al
   guardar y al escribir métricas: con un solo post sale `1.00x`, que es lo
   honesto — todavía no hay con qué comparar. Arreglado.

Números tras el arreglo, mismo rango (20/07–19/08):

| | Con manuales | Sin manuales |
|---|---|---|
| Posts | 34 | 32 |
| Impresiones (KPI) | 487.442 | 454.954 |
| Impressions per month (agosto) | 314.049 | 281.561 |

Las tres diferencias son exactamente las 32.488 impresiones y los 2 posts de
Mario y Helena. Las secciones ya no se contradicen.

Y las dos pruebas que faltaban:

- **El COALESCE aguanta un refresco real.** Pulsado ↻ sobre el post de Mario:
  las siete privadas intactas (32.488 impresiones, 72 clics, 17 guardados, 9
  envíos, 55 visitas, 8 seguidores) y un punto más en la curva.
- **El tick automático captura un post manual sin que nadie lo fuerce.** El de
  Helena se capturó solo a las 12:55:27 UTC y recogió un cambio real (likes
  6 → 7). Vencía a las 12:48 y entró a las 12:55 porque el tick corre en su
  propia rejilla de 15 minutos: un post que vence entre dos disparos se captura
  en el siguiente.

Un límite que no es un fallo: el post de Mario es del 12/08, o sea fase
`closed`. El seguimiento automático solo cubre 7 días, así que sus números se
quedan en lo escrito salvo que se pulse ↻. Es la regla de toda la herramienta,
no algo de las cuentas manuales.

## Cómo se comprueba

1. `parsearUrlPost` contra las tres formas de URL y contra basura.
2. Pegar la URL del post de Mario y verificar que la vista previa trae texto,
   foto y contadores reales.
3. Guardar y comprobar que la cuenta sale en Live posts con el badge.
4. Escribir impresiones, volver a escribirlas y comprobar dos puntos en la curva.
5. Forzar el tick y comprobar que los likes suben y las impresiones NO se borran.
6. Desmarcar el check y ver bajar los totales del dashboard.
