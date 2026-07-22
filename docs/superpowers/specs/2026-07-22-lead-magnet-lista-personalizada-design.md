# Lead magnet «Lista personalizada» — diseño

> Fecha: 2026-07-22 · Autor: Iker (+ Claude) · Estado: aprobado pendiente de revisión

## Problema

El 2026-07-22 Unai publicó un lead magnet comment-gated: *"Comenta «lista» + tu
sector y te monto la lista de 15 empresas a las que vender"*. El recurso **no
está montado de antemano**: es distinto para cada persona según el sector que
comente. Hoy no hay forma de generarlo, así que las primeras respuestas habría
que darlas a mano.

El panel de lead magnets (`frontend/src/components/accounts/LeadMagnetPanel.tsx`)
ya resuelve el flujo comment-gated de punta a punta para el tipo «Por privado»:
filtra a quién comentó la palabra clave, redacta la respuesta pública y manda el
recurso por DM. **Lo único que falta es que el DM lleve una lista generada por
sector en vez de un enlace fijo.**

## Objetivo

Añadir un tercer tipo de lead magnet, **«Lista personalizada»**, que por cada
comentario con `«lista» + sector` genere y deje listo para enviar un DM con **15
empresas reales españolas de ese sector**, cada una con su zona y su LinkedIn.

### Fuera de alcance (decidido con Iker, 2026-07-22)

- **Nada de intención de compra** («quién está comprando ahora», «por dónde
  entrar»). Unipile no lo da y **inventarlo tira el post** (`aboutme`: nunca
  inventar un dato). Ese «cuándo escribir a cada una» es lo que hace Neety y es
  el gancho para la llamada, no algo que se regale verificado por empresa.
- **Nada de contacto por empresa** (persona activa de cada una). Es la versión
  completa, se deja para una v2.
- **Ni página web ni gate de correo.** El recurso se entrega entero en el DM.

## Fuente de datos: Unipile (búsqueda clásica de empresas)

Verificado en crudo el 2026-07-22. `POST {UNIPILE_BASE_URL}/api/v1/linkedin/search?account_id=…`
con cuerpo:

```json
{ "api": "classic", "category": "companies", "keywords": "<sector>", "location": ["105646813"] }
```

Devuelve `{ object: "LinkedinSearch", items: [...], cursor? }`, y cada item de
empresa trae lo que necesitamos:

```json
{
  "type": "COMPANY", "id": "28921781",
  "name": "Maquinaria Industrial Martínez",
  "profile_url": "https://www.linkedin.com/company/maquinaria-industrial-martínez/",
  "summary": "Maquinaria de industria cárnica…",
  "industry": "Machinery Manufacturing",
  "location": "Torreaguera, Murcia",
  "logo": "https://media.licdn.com/…", "followers_count": 156
}
```

### Dos trampas medidas (por eso NO basta la query cruda)

1. **Sin `location` se cuela medio mundo.** `keywords:"software"` sin geo devolvió
   Nueva York, Cracovia, Bengaluru, Darmstadt. **El geo `105646813` (España) es
   obligatorio.**
2. **El geo de España no basta solo:** aún cuela alguna de Italia, Groningen o
   California (LinkedIn casa el facet contra oficinas, no solo la sede). Hace
   falta **además un filtro nuestro por provincia/CCAA española** sobre el campo
   `location` de cada item.

## Arquitectura

### Backend

**1. `UnipileService.searchCompanies(sector, opts)`** en `backend/src/services/unipile.ts`.

- Llama a la búsqueda clásica con `keywords: sector`, `location: ["105646813"]`.
- **Pagina** con el `cursor` hasta reunir `limit` empresas españolas o agotar
  `maxPages` (3 páginas ≈ 30 candidatas, suficiente para sacar 15 limpias).
- Devuelve solo items `type === "COMPANY"` con `profile_url`, **deduplicados por
  `id`**, y **filtrados a España** con `esEspanola(location)`.
- `esEspanola(loc)`: normaliza (sin tildes, minúsculas) y comprueba que el
  segmento tras la coma (o el texto entero) casa con la lista de **50 provincias +
  17 CCAA + {españa, spain, madrid, barcelona…}**. La lista vive en una constante
  del servicio. Si no casa ninguna, la empresa se descarta (mejor 12 seguras que
  15 con una de Milán).
- Forma de retorno: `{ name, zona, sector, linkedinUrl }[]` donde
  `zona = location` tal cual (ya es "Ciudad, Provincia").

**2. Endpoint `POST /api/accounts/lead-magnet/lista`** en `backend/src/routes/accounts.ts`.

- Body: `{ creator_id, sector }`. Valida que `sector` no esté vacío.
- Llama `searchCompanies(sector, { limit: 15 })`.
- **No redacta texto.** La voz vive toda en el front (`leadMagnetCopy.ts`), así
  que el endpoint devuelve solo las empresas reales y el front las formatea, igual
  que `buildDm`/`buildInviteNote`/`buildReply` hacen con el resto.
- Respuesta: `{ sector, companies: [ { name, zona, linkedinUrl } ] }`.
  - Si devuelve **menos de 15**, se devuelven las que haya (el front dice el
    número real). **Nunca se rellena** para llegar a 15.
  - Si devuelve **0**, `{ sector, companies: [] }` y el front avisa ("no
    encuentro empresas de ese sector, prueba a reescribirlo").

**3. Formateo de la voz en el front** (`leadMagnetCopy.ts`, junto a `buildDm`):

- `buildListaDm({ name, sector, companies, voice })` → texto entero para 1er grado:

  ```
  <saludo>, aquí tienes tu lista de <sector>.
  <N> empresas activas a las que puedes vender, con dónde están y su LinkedIn:

  → <Empresa 1> · <Zona 1>
     <linkedin.com/company/…>
  → <Empresa 2> · <Zona 2>
     <linkedin.com/company/…>
  …

  Escríbeles por lo que venden, no por el nombre: es lo que abre la puerta.
  ```
  - `<saludo>` = nombre de pila si lo hay, si no vacío.
  - `<N>` = `companies.length` real (no la palabra "15" fija).
- `buildListaInvite({ name, sector, voice })` → nota corta **≤ 300 car**, porque
  la lista no cabe en los 300 de una invitación: *"<saludo>, te monto la lista de
  <sector> que pediste. Acéptame y te la paso por aquí mismo."*

**Sin cambios de BD.** El envío usa `lead_magnet_sends` como el resto; la lista
generada no se persiste (se regenera si hace falta).

### Frontend (`LeadMagnetPanel.tsx` + `leadMagnetCopy.ts`)

- `LmKind` pasa a `'dm' | 'publico' | 'lista'`. `KindPicker` gana una tercera
  opción: **«Lista personalizada» — Comentan «lista» + su sector y les montamos
  la lista de su sector**.
- Config de `lista`: **solo palabra clave** (como `publico`). Ni enlace ni tema.
- En cada `CommenterCard` de tipo `lista`:
  - Se extrae el **sector** del comentario: el texto después de la palabra clave
    (`"lista automoción"` → `"automoción"`; `matchesKeyword` ya localiza la
    palabra). Se guarda en estado editable.
  - **Campo de sector visible y editable**: si la persona comentó solo `"lista"`
    sin sector, sale vacío y el usuario lo escribe; si venía sector, sale
    prerrellenado y se puede corregir.
  - Botón **«Generar lista»** (igual de destacado que «Redactar respuesta» en
    `publico`) → `POST …/lead-magnet/lista` → con las `companies` que vuelven,
    formatea con `buildListaDm` (o `buildListaInvite` si es invitación), rellena
    la caja del DM y muestra cuántas empresas trae.
  - El envío es el flujo existente (`handleSendResource`, DM vs invitación por
    grado). **Para invitación** se envía `inviteText`; la lista completa se manda
    por DM cuando la persona acepte y vuelva a salir como 1er grado en un refresh.
  - La **respuesta pública** sigue igual que en `dm`: plantilla "te la acabo de
    mandar por privado" (`buildReply`), no se toca.
- El `ready` del workspace para `lista` = `!!cfg.keyword.trim()` (como `publico`).

## Flujo de datos

```
Comentario "lista automoción"
  → CommenterCard extrae sector "automoción"
  → [Generar lista] POST /lead-magnet/lista {creator_id, sector:"automoción"}
      → searchCompanies("automoción")  (Unipile classic, geo España, pagina, filtra provincias)
      → 15 empresas {name, zona, linkedinUrl}   (el backend acaba aquí)
  → buildListaDm(companies, voice) en el front → caja del DM rellena
  → [Enviar DM] handleSendResource → Unipile sendDirectMessage
  → [Responder] plantilla pública "te la mandé por privado"
```

## Errores y casos límite

- **Sector vacío** → botón deshabilitado, hint "escribe el sector".
- **0 empresas** → aviso, no se genera DM.
- **< 15 empresas** → se mandan las que haya, el texto dice el número real.
- **Unipile cae / rate-limit** → el `request()` del servicio ya reintenta; si
  agota, el endpoint devuelve 502 y el front muestra "Reintentar".
- **Persona sin `profile_id`** → no se le puede escribir; solo respuesta (ya lo
  maneja la tarjeta).
- **No 1er grado** → invitación con `inviteText` corto, la lista va tras aceptar.

## Verificación

- Unit-testable puro: `esEspanola(location)` (casos: "Vic, Catalonia" ✓,
  "Groningen" ✗, "Leones, Córdoba" ✓, "Campbell, California" ✗) y el formateo del
  `dmText` con N<15.
- Manual en el panel: cuenta Unai → post del 22/07 → tipo Lista → palabra `lista`
  → un comentario real → Generar → revisar que las 15 son españolas y los enlaces
  abren la empresa correcta → enviar a un 1er grado de prueba.

## Nota de honestidad (no negociable)

Todo lo que va en el DM sale de Unipile y es real. Si una empresa no se puede
verificar como española, se cae. Si no salen 15, se dice el número. El "cuándo
escribir" no se promete por empresa: es lo que hace Neety.
