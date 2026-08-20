# Reclasificar el pilar desde el frontend

**Fecha:** 2026-08-20 · **Pedido por:** Iker

## El problema

El pilar de cada post lo detecta `backend/src/services/pillar.ts` al ingerirlo, y
falla. No siempre, pero falla: un mapa dibujado sin bloque de menciones, un lead
magnet con el CTA nuevo, una historia corta con foto. Cada fallo hoy termina en
un mensaje a Claude y un commit tocando reglas, que es una semana de latencia
para arreglar una etiqueta.

Iker quiere pulsar el badge del pilar en Live posts y cambiarlo él, y poder
crear categorías nuevas como en Notion.

## Lo que ya existe

- `posts.pillar` TEXT, sin restricción de valores.
- `posts.pillar_manual` BOOLEAN. Cuando está a TRUE, `pillarBackfill.ts` se
  salta esa fila: la corrección humana sobrevive al reproceso.
- `PATCH /api/posts/:id/pillar` graba el pilar y marca `pillar_manual = TRUE`.
  Valida contra un `Set` de 8 slugs escrito a mano en `routes/posts.ts`.
- `PILAR_META` en `frontend/src/pages/Accounts.tsx`: etiqueta, color y ayuda de
  cada pilar. `PilarBadge` lo pinta, sin interacción.

O sea: el 60% del backend está hecho. Falta el catálogo, la UI y quitar la lista
fija del código.

## Decisiones (Iker, 2026-08-20)

1. **Catálogo editable en base de datos.** No texto libre: con texto libre
   acabas con "Meme", "meme" y "memes" como tres pilares y el análisis por pilar
   deja de cuadrar.
2. **El badge no marca si el pilar es manual.** Se ve igual venga del
   clasificador o de Iker.
3. **Renombrar y borrar**, con aviso del número de posts afectados.
4. **Color automático** al crear, cogido libre de la paleta.

## Aviso que se le dio antes de decidir

Una categoría creada a mano **nunca se autodetecta**. El clasificador solo sabe
emitir los 8 pilares que tiene codificados; cualquier categoría nueva se pone a
mano post a post, para siempre. Iker lo aceptó.

## Diseño

### Datos

Tabla nueva `pillars`:

| columna      | tipo    | nota                                             |
|--------------|---------|--------------------------------------------------|
| `slug`       | TEXT PK | lo que se guarda en `posts.pillar`               |
| `label`      | TEXT    | lo que se ve en el badge                          |
| `color`      | TEXT    | clave de paleta, no clases de Tailwind            |
| `ayuda`      | TEXT    | el `title` del badge                              |
| `builtin`    | BOOL    | los 8 de serie                                    |
| `sort_order` | INT     | orden en el desplegable                           |
| `created_at` | TIMESTAMPTZ | |

La migración la siembra con los 8 pilares actuales, copiando etiqueta, color y
ayuda de `PILAR_META` para que nada cambie de aspecto el día del despliegue.

**`posts.pillar` sigue sin clave foránea.** Hay 47.828 filas y alguna arrastra
etiquetas de reglas viejas; una FK las tumbaría al migrar. El catálogo manda en
lo que se puede ELEGIR, no en lo que hay guardado.

**`color` guarda una clave, no clases de Tailwind.** Tailwind compila las clases
que ve en el código fuente: una clase que llega de la base de datos en tiempo de
ejecución no existe en el CSS y el badge sale sin color. El front traduce clave →
clases con un mapa literal.

### API — `backend/src/routes/pillars.ts` (nuevo)

- `GET /api/pillars` → catálogo ordenado, con `posts_count` por pilar. El
  conteo viaja con el catálogo para que el diálogo de borrar no necesite otra
  llamada.
- `POST /api/pillars` `{label}` → crea. Slug derivado del label (minúsculas, sin
  tildes, `_`); si choca, 409. Color: el primero de la paleta que no esté usado;
  si están todos, se reparten cíclicamente.
- `PATCH /api/pillars/:slug` `{label}` → renombra. **El slug no cambia**, así los
  posts guardados siguen apuntando a él.
- `DELETE /api/pillars/:slug` → borra el pilar y pasa sus posts a `otro`, en una
  transacción.

### Los 8 de serie no se borran ni cambian de slug

`DELETE` y cualquier intento de mover el slug de un `builtin` devuelven 409. El
clasificador los emite por nombre: si se borra `meme`, el siguiente reproceso lo
reinventa y el resultado es la categoría de vuelta con los posts ya movidos a
`otro`. Renombrar el `label` de un builtin sí se permite.

### `PATCH /api/posts/:id/pillar`

Deja de validar contra el `Set` fijo y consulta la tabla. Es el punto donde el
catálogo se convierte en la única fuente de verdad.

### Frontend

`PilarBadge` pasa a `PilarSelector`: el badge es un botón que abre un popover.

- Lista con el color de cada pilar y un check en el actual.
- Buscador que filtra según escribes.
- Si lo escrito no existe: `+ Crear «X»`.
- Al pasar por encima de un pilar no-builtin: renombrar y borrar.
- Borrar pide confirmación con el número: "23 posts volverán a Otro".
- El cambio se pinta al momento (optimista); si la API falla, se revierte y sale
  el error.

**El catálogo se carga una vez por página, no una llamada por post.** Vive en un
contexto de React que envuelve `Accounts`; cada selector lo lee de ahí. Con 60
posts en pantalla, 60 peticiones al mismo endpoint serían el bug obvio.

Los dos sitios donde hoy se pinta el badge (`Accounts.tsx:2378` en Live posts y
`:2619` en la tarjeta de post) usan el mismo componente y se arreglan a la vez.

## Fuera de alcance

- **Autodetección de categorías nuevas.** No es posible sin reescribir el
  clasificador y no se pide.
- **`scripts/validar-post.py --pilar`.** Es otra lista, para escribir posts, no
  para clasificar los publicados. Se queda como está.
- **Inspiration y OutlierExplorer.** Ahí no se pinta el pilar hoy.

## Verificación

El repo no tiene tests, ni backend ni frontend. Se comprueba con:

1. `tsc -b` en frontend y `npm run build` en backend, limpios en los ficheros
   tocados.
2. La migración corriendo dos veces seguidas sin error (es idempotente).
3. En el navegador: cambiar el pilar de un post, recargar y ver que aguanta;
   crear una categoría, asignarla, renombrarla y borrarla viendo que sus posts
   vuelven a Otro.
