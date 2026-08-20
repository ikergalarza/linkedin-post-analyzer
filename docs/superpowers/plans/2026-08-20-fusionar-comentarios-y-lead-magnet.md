# Fusionar Comments y Lead Magnet — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que la pestaña Comments enseñe, sin elegir nada, todo lo que queda por hacer en los posts recientes — comentarios sin responder, recursos de lead magnet sin entregar y solicitudes ya llegadas — y que la pestaña Lead Magnet deje de hacer falta.

**Architecture:** El grupo desplegado de un post lead magnet **es el `Workspace` de hoy**, movido a su propio fichero sin tocarle una línea. Así las tres defensas contra el doble envío, la verificación de envíos y toda la mecánica de tarjetas siguen siendo el mismo código, no una copia. Comments solo aporta: la fila plegada con los contadores, el bloque global de solicitudes, y decidir por `pillar` qué se pinta al desplegar.

**Tech Stack:** React 19 + TypeScript + Tailwind v4 (Vite) · Express + Postgres (`pg`) · Unipile.

## Global Constraints

- **Todo va a `main`, sin rama.** Railway despliega desde `main` y es donde Iker prueba; una rama significaría que no puede probarlo. Contrapartida: **la pestaña Lead Magnet se queda VISIBLE** hasta que Iker dé el OK. Las dos vistas conviven y se comparan.
- **Los componentes se MUEVEN, nunca se reescriben.** En las tareas 1 y 2, el cuerpo de cada función se copia literal. Si el diff de esas tareas toca una línea que no sea un `import`, un `export` o el nombre de un fichero, está mal hecho y se deshace.
- **Los endpoints de acción no se tocan:** `/lead-magnet/send`, `/ask`, `/lista`, `/reverificar`, `/check-accepted`, `/commenter`, `/sends`, `/posts/:id/comments/:cid/{generate,reply,react}`.
- **El repo NO tiene tests.** No hay framework, ni script `test`, en `backend/package.json` ni en `frontend/package.json`. El ciclo de prueba de cada tarea es, en este orden: (1) `tsc` limpio, (2) revisión del diff, (3) banco de pruebas en el navegador con la API simulada. Ninguna tarea se da por buena sin los tres.
- **Comandos de typecheck** (desde la raíz del repo):
  - Frontend: `cd frontend && npx tsc -b`
  - Backend: `cd backend && npx tsc --noEmit`
  - El frontend arrastra 12 errores previos (`Line`, `fmtFullDay`, `truncate`, `StructureChart.tsx`, `PostCreator.tsx`, `OutlierExplorer.tsx`, `TimingHeatmap.tsx`, `Discover.tsx`, `Inspiration.tsx`). **Filtra siempre por el fichero que tocas**: `npx tsc -b 2>&1 | grep -i "<fichero>"`.
- **La pestaña se sigue llamando `Comments`** (Iker, 2026-08-20). No renombrar.

---

### Task 1: Sacar las tarjetas de comentario a su propio fichero

Movimiento puro. `RepliesPanel.tsx` (662 líneas) se queda solo con el contenedor.

**Files:**
- Create: `frontend/src/components/accounts/CommentCards.tsx`
- Modify: `frontend/src/components/accounts/RepliesPanel.tsx`

**Interfaces:**
- Consumes: `Thread` de `./shared`; `Avatar`, `EmojiPicker`, `ReactionBar`, `fmtRelative` de `./shared`.
- Produces:
  - `export interface PendingGroup { post: {...}; pending_threads: Thread[]; pending_count: number }`
  - `export interface ThreadCardHandle { generateIfEmpty: () => Promise<void> }`
  - `export function PostGroup({ group }: { group: PendingGroup })`
  - `export function ThreadCard({ thread, postId, onReplied, handleRef })`

- [ ] **Step 1: Crear el fichero con las líneas 156-662 de RepliesPanel.tsx**

```bash
cd /c/Users/LENOVO/Desktop/linkedin-post-analyzer
{
  echo "/* Las tarjetas de la pestaña Comments. Salieron de RepliesPanel.tsx el"
  echo "   2026-08-20 al fusionar Comments con Lead Magnet: el contenedor pasó a"
  echo "   pintar dos clases de grupo (normal y lead magnet) y con las tarjetas"
  echo "   dentro eran 1.100 líneas en un fichero."
  echo ""
  echo "   ⛔ ESTE FICHERO ES UN MOVIMIENTO LITERAL. No se cambió una sola línea de"
  echo "   lógica: la mención al primero sin contestar, las sub-respuestas y las"
  echo "   reacciones son el mismo código que llevaba meses funcionando. */"
  echo "import { useRef, useState } from 'react';"
  echo "import { apiPost } from '../../hooks/useApi';"
  echo "import { Avatar, EmojiPicker, ReactionBar, fmtRelative } from './shared';"
  echo "import type { Thread } from './shared';"
  echo ""
  sed -n '26,40p' frontend/src/components/accounts/RepliesPanel.tsx | sed '1s/^interface/export interface/'
  echo ""
  sed -n '156,662p' frontend/src/components/accounts/RepliesPanel.tsx
} > frontend/src/components/accounts/CommentCards.tsx
```

- [ ] **Step 2: Exportar las tres funciones y el handle en el fichero nuevo**

```bash
cd /c/Users/LENOVO/Desktop/linkedin-post-analyzer/frontend/src/components/accounts
sed -i 's/^function PostGroup(/export function PostGroup(/' CommentCards.tsx
sed -i 's/^function ThreadCard(/export function ThreadCard(/' CommentCards.tsx
sed -i 's/^interface ThreadCardHandle {/export interface ThreadCardHandle {/' CommentCards.tsx
```

`SubReplyBox` se queda sin exportar: solo la usa `ThreadCard`, dentro del mismo fichero.

- [ ] **Step 3: Recortar RepliesPanel.tsx e importar**

Borrar las líneas 156 al final (todo desde el comentario `// One post + its pending comments.`) y la `interface PendingGroup` (líneas 26-40), y dejar arriba:

```tsx
import { useEffect, useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { PostGroup } from './CommentCards';
import type { PendingGroup } from './CommentCards';
```

`useRef`, `apiPost`, `Avatar`, `EmojiPicker`, `ReactionBar`, `fmtRelative` y `Thread` dejan de usarse en `RepliesPanel.tsx`: se van con las tarjetas. Quitarlos del import o `tsc` los marca con TS6133.

- [ ] **Step 4: Typecheck**

Run: `cd frontend && npx tsc -b 2>&1 | grep -iE "CommentCards|RepliesPanel"`
Expected: sin salida.

- [ ] **Step 5: Revisar que el diff es un movimiento**

Run: `git diff --stat`
Expected: `RepliesPanel.tsx` pierde ~500 líneas, `CommentCards.tsx` gana ~520. Revisar a ojo `git diff frontend/src/components/accounts/RepliesPanel.tsx` y confirmar que **lo único borrado son bloques completos**, no líneas sueltas dentro de una función.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "refactor(comments): las tarjetas salen a CommentCards.tsx, sin tocar logica" && git push origin main
```

---

### Task 2: Sacar el workspace del lead magnet a su propio fichero

Movimiento puro también, y el más importante del plan: `Workspace` es lo que Comments va a montar cuando despliegues un lead magnet. Sale entero, con sus tarjetas y sus dos bloques de seguimiento.

**Files:**
- Create: `frontend/src/components/accounts/lmTypes.ts`
- Create: `frontend/src/components/accounts/LeadMagnetWorkspace.tsx`
- Modify: `frontend/src/components/accounts/LeadMagnetPanel.tsx`

**Interfaces:**
- Produces, en `lmTypes.ts`:
  - `export interface GridPost { id, hook_text, content_text, content_type, published_at, post_url, comments_count, likes_count, creator_name, creator_image }` — todos `string | null` salvo `id: string` y los dos contadores `number | null`
  - `export interface SendRecord { comment_social_id, provider_id, kind, status, text, error, verificado, created_at }`
  - `export type Canal = 'dm' | 'dm-solicitud' | 'pedir'`
  - `export interface CanalInfo { pendientes: {provider_id, invitation_id, name}[]; aviso: string | null }`
  - `export type LmKind = 'dm' | 'publico' | 'lista'`
  - `export interface LmConfig { kind: LmKind; keyword: string; link: string; topic: string }`
  - `export interface CommentsResponse { post: {...}; threads: Thread[] }`
  - `export interface PedidoRow {...}`, `export interface FollowupRow {...}`
- Produces, en `LeadMagnetWorkspace.tsx`:
  - `export default function LeadMagnetWorkspace({ post, creatorId }: { post: GridPost; creatorId: string })` — es el `Workspace` de hoy, renombrado. Mismo cuerpo.

- [ ] **Step 1: Crear `lmTypes.ts` con los tipos de las líneas 60-133 de LeadMagnetPanel.tsx**

Copiar tal cual, con sus comentarios, y añadir `export` delante de cada `interface` / `type`. `Thread` se importa de `./shared`. `LmKind` ya lleva `export`.

- [ ] **Step 2: Crear `LeadMagnetWorkspace.tsx`**

Mueve, literales: `Workspace` (273-806, renombrado a `LeadMagnetWorkspace` y con `export default`), `KindPicker` (805-851), `DegreeBadge` (852-884), `CommenterCard` (885-1695), `SolicitudesPedidas` (1712-1921) y `Seguimientos` (1937-final). Cabecera del fichero:

```tsx
/* El área de trabajo de un lead magnet: la config del post, los dos bloques de
   seguimiento y una tarjeta por comentarista.

   Salió de LeadMagnetPanel.tsx el 2026-08-20 porque ahora la monta TAMBIÉN la
   pestaña Comments, al desplegar un post cuyo pilar es `lead_magnet`. Es el
   mismo componente en los dos sitios a propósito: las tres defensas contra el
   doble envío viven aquí dentro y una segunda copia acabaría divergiendo.

   ⛔ MOVIMIENTO LITERAL. Ni una línea de lógica cambiada. */
```

- [ ] **Step 3: Recortar `LeadMagnetPanel.tsx`**

Se queda solo con: los tipos `ManagedAccount`/`Props`, `loadConfig`/`saveConfig`, el componente por defecto y `PostTile`. Importa el resto:

```tsx
import LeadMagnetWorkspace from './LeadMagnetWorkspace';
import type { GridPost } from './lmTypes';
```

Y en el render, `<Workspace ... />` pasa a `<LeadMagnetWorkspace ... />`.

- [ ] **Step 4: Typecheck**

Run: `cd frontend && npx tsc -b 2>&1 | grep -iE "LeadMagnet|lmTypes"`
Expected: sin salida.

- [ ] **Step 5: Revisar el diff**

Run: `git diff --stat frontend/src/components/accounts/LeadMagnetPanel.tsx`
Expected: pierde ~1.850 líneas y no gana ninguna que no sea un import.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "refactor(lead-magnet): el workspace sale a su fichero para poder montarlo desde Comments" && git push origin main
```

---

### Task 3: La config del lead magnet, a la base de datos

Hoy vive en `localStorage`: si Iker limpia el navegador o entra desde otro sitio, un lead magnet de tipo Lista genera el mensaje equivocado.

**Files:**
- Modify: `backend/src/db/migrate.ts` (al final del template `migration`)
- Modify: `backend/src/routes/accounts.ts` (junto a los otros `/lead-magnet/*`)
- Create: `frontend/src/components/accounts/useLmConfig.ts`
- Modify: `frontend/src/components/accounts/LeadMagnetWorkspace.tsx`

**Interfaces:**
- Produces: `GET /api/accounts/lead-magnet/config?post_id=<uuid>` → `{ config: LmConfig | null }`
- Produces: `PUT /api/accounts/lead-magnet/config` body `{ post_id, config }` → `{ ok: true }`
- Produces: `export function useLmConfig(postId, seed: LmConfig): [LmConfig, (fn: (c: LmConfig) => LmConfig) => void]`

- [ ] **Step 1: Migración**

```sql
  -- v36: la config del lead magnet, a la base (Iker, 2026-08-20).
  --
  -- Vivia en localStorage con clave por post. Con la pestaña Lead Magnet
  -- fusionada en Comments eso ya no vale: el tipo (dm/lista/publico) decide QUE
  -- mensaje se genera, y perderlo al limpiar el navegador significa mandar el
  -- texto equivocado. El pilar dice que el post ES un lead magnet; esto dice de
  -- cual de los tres tipos, que el clasificador no puede saber.
  --
  -- JSONB y no cuatro columnas: los cuatro campos se leen y se escriben SIEMPRE
  -- juntos, y nunca se filtra ni se ordena por ellos.
  ALTER TABLE posts ADD COLUMN IF NOT EXISTS lead_magnet_config JSONB;
```

- [ ] **Step 2: Los dos endpoints**

```ts
// GET/PUT /api/accounts/lead-magnet/config
//
// El tipo de lead magnet y su recurso, por post. NO se valida contra un catalogo
// a proposito: `link` y `topic` son texto libre que Iker pega cuando la
// deteccion falla, y bloquear un envio por no reconocer un enlace nuevo es
// exactamente el viernes a la una que ya nos comimos una vez.
router.get('/lead-magnet/config', async (req: Request, res: Response) => {
  try {
    const postId = (req.query.post_id as string) || '';
    if (!postId) return res.status(400).json({ error: 'post_id required' });
    const { rows } = await pool.query(
      'SELECT lead_magnet_config FROM posts WHERE id = $1', [postId]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Post not found' });
    res.json({ config: rows[0].lead_magnet_config ?? null });
  } catch (err: any) {
    console.error('[accounts/lead-magnet/config:get]', err);
    res.status(500).json({ error: err.message });
  }
});

router.put('/lead-magnet/config', async (req: Request, res: Response) => {
  try {
    const { post_id, config } = req.body || {};
    if (!post_id || !config) return res.status(400).json({ error: 'post_id and config required' });
    const kind = ['dm', 'publico', 'lista'].includes(config.kind) ? config.kind : 'dm';
    const limpio = {
      kind,
      keyword: String(config.keyword || '').slice(0, 120),
      link: String(config.link || '').slice(0, 500),
      topic: String(config.topic || '').slice(0, 300),
    };
    const { rowCount } = await pool.query(
      'UPDATE posts SET lead_magnet_config = $2 WHERE id = $1', [post_id, JSON.stringify(limpio)]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'Post not found' });
    res.json({ ok: true, config: limpio });
  } catch (err: any) {
    console.error('[accounts/lead-magnet/config:put]', err);
    res.status(500).json({ error: err.message });
  }
});
```

- [ ] **Step 3: El hook, con la siembra desde localStorage**

```ts
/* La config del lead magnet de un post: tipo, recurso y palabra.
 *
 * Vive en la base desde el 2026-08-20, pero `localStorage` sigue siendo la
 * SEMILLA: los posts que Iker ya tenia configurados a mano tienen ahi su tipo, y
 * perderlo significaria que un lead magnet de tipo Lista genera el DM normal.
 * La primera vez que se abre un post cuya columna esta vacia, se sube lo que
 * hubiera en el navegador y a partir de ahi manda la base.
 *
 * ⚠️ Se sigue escribiendo en localStorage ademas de en la base. Es la red: si el
 * PUT falla (Railway dormido, sin internet), el tipo no se pierde y el siguiente
 * arranque lo vuelve a subir.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { apiGet, apiPut } from '../../hooks/useApi';
import type { LmConfig } from './lmTypes';

export function loadLocal(postId: string, vacia: LmConfig): LmConfig {
  try {
    const raw = localStorage.getItem(`lm-config:${postId}`);
    if (!raw) return vacia;
    const p = JSON.parse(raw);
    return {
      kind: p.kind === 'publico' ? 'publico' : p.kind === 'lista' ? 'lista' : 'dm',
      keyword: p.keyword || '',
      link: p.link || '',
      topic: p.topic || '',
    };
  } catch {
    return vacia;
  }
}

export function useLmConfig(postId: string, semilla: LmConfig) {
  const [cfg, setCfg] = useState<LmConfig>(semilla);
  // Hasta que la base ha contestado NO se escribe: sin esto, el primer render
  // subiria la semilla y pisaria lo que ya hubiera guardado en la base.
  const listo = useRef(false);

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const r = await apiGet<{ config: LmConfig | null }>(
          `/api/accounts/lead-magnet/config?post_id=${postId}`
        );
        if (!vivo) return;
        if (r.config) setCfg({ ...semilla, ...r.config });
      } catch {
        /* sin base, se trabaja con la semilla local; no es fatal */
      } finally {
        if (vivo) listo.current = true;
      }
    })();
    return () => { vivo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const guardar = useCallback((fn: (c: LmConfig) => LmConfig) => {
    setCfg((c) => {
      const next = fn(c);
      try { localStorage.setItem(`lm-config:${postId}`, JSON.stringify(next)); } catch { /* modo privado */ }
      if (listo.current) {
        apiPut('/api/accounts/lead-magnet/config', { post_id: postId, config: next })
          .catch(() => { /* queda en localStorage y se reintenta al recargar */ });
      }
      return next;
    });
  }, [postId]);

  return [cfg, guardar] as const;
}
```

- [ ] **Step 4: Engancharlo en el workspace**

En `LeadMagnetWorkspace.tsx`, sustituir el `useState(() => {...loadConfig...})` + el `useEffect(saveConfig)` por:

```tsx
const semilla = useMemo(() => {
  const local = loadLocal(post.id, { kind: 'dm', keyword: '', link: '', topic: '' });
  if (local.link.trim()) return local;
  const auto = detectarRecurso(post.content_text);
  return {
    ...local,
    keyword: local.keyword.trim() || extractKeyword(post.content_text),
    link: auto?.link ?? local.link,
    topic: auto?.topic ?? local.topic,
  };
}, [post.id, post.content_text]);
const [cfg, setCfg] = useLmConfig(post.id, semilla);
```

`setCfg` mantiene la misma forma `setCfg((c) => ({...c, kind: k}))`, así que **ninguna de las llamadas de abajo cambia**.

- [ ] **Step 5: Typecheck de los dos lados**

Run: `cd backend && npx tsc --noEmit` → sin salida.
Run: `cd frontend && npx tsc -b 2>&1 | grep -iE "useLmConfig|LeadMagnetWorkspace"` → sin salida.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "lead magnet: el tipo y el recurso del post se guardan en la base, no en el navegador" && git push origin main
```

---

### Task 4: Ampliar `/comments/pending`

**Files:**
- Modify: `backend/src/routes/accounts.ts:2332` (`GET /comments/pending`)

**Interfaces:**
- Produces, la respuesta ampliada:

```ts
{
  groups: [{
    post: { id, hook_text, content_text, content_type, published_at, post_url,
            creator_id, creator_name, creator_image,
            comments_count, likes_count,      // NUEVO: los pide LeadMagnetWorkspace
            pillar },                          // NUEVO
    pending_threads: Thread[],
    pending_count: number,
    es_lead_magnet: boolean,                   // NUEVO: pillar === 'lead_magnet'
    recursos_pendientes: number,               // NUEVO
  }],
  cuentas: [{                                  // NUEVO, una por cuenta del filtro
    creator_id, creator_name,
    solicitudes_llegadas: number,
    aviso: string | null,
  }],
  total_pending: number,
  posts_scanned: number,
}
```

- [ ] **Step 1: Añadir `pillar`, `comments_count` y `likes_count` al SELECT**

En el `WITH ranked AS (SELECT p.id, ...)`, añadir `p.pillar, p.comments_count, p.likes_count`.

- [ ] **Step 2: Meter los lead magnet fuera de ventana**

La cláusula de hoy es:

```sql
 WHERE (published_at >= NOW() - INTERVAL '1 day' * ${RECENT_DAYS} OR rn <= ${MIN_POSTS})
   AND rn <= ${MAX_POSTS}
```

Pasa a:

```sql
 WHERE (published_at >= NOW() - INTERVAL '1 day' * ${RECENT_DAYS}
        OR rn <= ${MIN_POSTS}
        OR (pillar = 'lead_magnet' AND tiene_pendiente))
   AND rn <= ${MAX_POSTS}
```

…con `tiene_pendiente` calculado en el `WITH` como:

```sql
EXISTS (
  SELECT 1 FROM lead_magnet_sends a
   WHERE a.post_id = p.id AND a.kind = 'ask' AND a.status = 'sent'
     AND NOT EXISTS (
       SELECT 1 FROM lead_magnet_sends d
        WHERE d.post_id = a.post_id AND d.provider_id = a.provider_id
          AND d.kind = 'dm' AND d.status = 'sent')
) AS tiene_pendiente
```

⚠️ **`rn <= MAX_POSTS` se mantiene también para los lead magnet.** Es el techo que impide que una cuenta con 200 posts dispare 200 llamadas a Unipile. Un lead magnet más antiguo que los 30 últimos posts de la cuenta no entra, y eso es correcto: a esas alturas el lead está frío.

- [ ] **Step 3: Contar los recursos pendientes por post**

Después del barrido de comentarios, una sola consulta para todos los posts:

```ts
// Cuantos comentaristas de cada post siguen sin su recurso. Una consulta para
// todos los posts, no una por post: son 30 posts y esto es la parte barata.
const idsLm = posts.filter((p) => p.pillar === 'lead_magnet').map((p) => p.id);
const enviadosPorPost = new Map<string, Set<string>>();
if (idsLm.length > 0) {
  const { rows: envios } = await pool.query(
    `SELECT post_id, provider_id FROM lead_magnet_sends
      WHERE post_id = ANY($1::uuid[]) AND kind = 'dm' AND status = 'sent'`,
    [idsLm]
  );
  for (const e of envios) {
    const s = enviadosPorPost.get(e.post_id) ?? new Set<string>();
    s.add(e.provider_id);
    enviadosPorPost.set(e.post_id, s);
  }
}
```

Y por post, con los hilos ya leídos:

```ts
// Personas que comentaron y todavia no han recibido el recurso. Las paginas de
// empresa fuera: no se puede mandar un DM a una pagina.
const recursos_pendientes = !esLm ? 0 : (() => {
  const ya = enviadosPorPost.get(post.id) ?? new Set<string>();
  const personas = new Set<string>();
  for (const t of threads) {
    const pid = t.author?.profile_id;
    if (pid && !t.author.is_company && !ya.has(pid)) personas.add(pid);
  }
  return personas.size;
})();
```

- [ ] **Step 4: El criterio de entrada**

Sustituir `if (pending.length === 0) return null;` por:

```ts
// ⛔ UN LEAD MAGNET NO SE MIDE POR COMENTARIOS SIN RESPONDER (Iker, 2026-08-20).
// Contestar en publico y entregar el recurso por privado son dos trabajos
// distintos: un lead magnet contestado del todo pero con 12 recursos sin mandar
// desaparecia de esta lista, que es justo el lead que se queria dejar de perder.
if (pending.length === 0 && recursos_pendientes === 0) return null;
```

- [ ] **Step 5: El bloque `cuentas`, con UNA llamada por cuenta**

Al final del handler, antes del `res.json`:

```ts
// Las solicitudes que YA han llegado, por cuenta. Una sola llamada a Unipile por
// cuenta, y sirve para las dos cosas que hoy la piden por separado
// (/lead-magnet/canal y /lead-magnet/pendientes-solicitud llaman las dos a
// getReceivedInvitations con el mismo account_id).
//
// ⛔ AQUI NO SE COMPRUEBA SI ALGUIEN "YA ES CONTACTO". Eso es una llamada a
// Unipile POR PERSONA (/lead-magnet/check-accepted, tope 40), y con 20 esperando
// en tres cuentas serian 60 llamadas cada vez que se abre la pestaña. Ese sigue
// siendo un boton que se pulsa a mano.
const cuentasUnicas = [...new Map(posts.map((p) => [p.creator_id, p])).values()];
const cuentas = await Promise.all(cuentasUnicas.map(async (c) => {
  let solicitudes_llegadas = 0;
  let aviso: string | null = null;
  if (c.unipile_account_id) {
    try {
      const recibidas = await unipileService.getReceivedInvitations(c.unipile_account_id);
      const invitadores = new Set(recibidas.map((i) => i.inviter_id));
      const { rows } = await pool.query(
        `SELECT DISTINCT s.provider_id
           FROM lead_magnet_sends s
           JOIN posts p ON p.id = s.post_id
          WHERE p.creator_id = $1 AND s.kind = 'ask' AND s.status = 'sent'
            AND NOT EXISTS (
              SELECT 1 FROM lead_magnet_sends d
               WHERE d.post_id = s.post_id AND d.provider_id = s.provider_id
                 AND d.kind = 'dm' AND d.status = 'sent')`,
        [c.creator_id]
      );
      solicitudes_llegadas = rows.filter((r) => invitadores.has(r.provider_id)).length;
    } catch (err: any) {
      aviso = `No he podido leer las solicitudes recibidas de ${c.creator_name} (${err?.message}).`;
      console.warn('[accounts/comments/pending] invitaciones:', err?.message);
    }
  }
  return { creator_id: c.creator_id, creator_name: c.creator_name, solicitudes_llegadas, aviso };
}));
```

⚠️ El bloque `cuentas` se calcula sobre **los posts de la ventana**, así que una cuenta sin posts recientes no sale. Es correcto: sin posts no hay lead magnet vivo.

- [ ] **Step 6: Typecheck y commit**

Run: `cd backend && npx tsc --noEmit` → sin salida.

```bash
git add -A && git commit -m "comments/pending: entra tambien lo que debe un lead magnet, no solo lo sin responder" && git push origin main
```

---

### Task 5: El bloque global de solicitudes en Comments

**Files:**
- Create: `frontend/src/components/accounts/SolicitudesGlobal.tsx`
- Modify: `frontend/src/components/accounts/RepliesPanel.tsx`

**Interfaces:**
- Consumes: `SolicitudesPedidas` de `./LeadMagnetWorkspace` — **hay que exportarla** (hoy no lo está) y **hacer opcional su prop `post`**: en Comments no hay un post elegido, se enseñan las de toda la cuenta.
- Produces: `export default function SolicitudesGlobal({ cuentas }: { cuentas: CuentaResumen[] })`

- [ ] **Step 1: Hacer `SolicitudesPedidas` utilizable sin post**

En `LeadMagnetWorkspace.tsx`, cambiar la firma y el filtro:

```tsx
// `post` OPCIONAL desde el 2026-08-20: en Comments este bloque sale arriba del
// todo, para la cuenta entera, sin ningun post elegido. Sin post no se filtra:
// se enseñan todas las solicitudes pedidas de esa cuenta.
export function SolicitudesPedidas({ post, creatorId, cfg, voice }: {
  post?: GridPost; creatorId: string; cfg: LmConfig; voice: Voice;
}) {
  ...
  const llegadas = useMemo(
    () => (data?.llegadas ?? []).filter((f) => !post || f.post_id === post.id), [data, post]);
  const esperando = useMemo(
    () => (data?.esperando ?? []).filter((f) => !post || f.post_id === post.id), [data, post]);
```

⚠️ El resto del componente **no se toca**. Usa `post` en un sitio más, el `key` del `ErrorBoundary` del padre, no dentro.

- [ ] **Step 2: El envoltorio, una sección por cuenta**

```tsx
/* Las solicitudes pedidas de TODAS las cuentas del filtro, arriba del todo de
   Comments (Iker, 2026-08-20).
   Nace de "a veces se me olvida entrar a la seccion de lead magnets y perdemos
   posibles leads": antes esto solo existia si entrabas a Lead Magnet, elegias
   cuenta, elegias post y pulsabas un boton. Cuatro pasos para ver si alguien te
   habia mandado la solicitud. */
import { SolicitudesPedidas } from './LeadMagnetWorkspace';
import { voiceFor } from './leadMagnetCopy';
import type { LmConfig } from './lmTypes';

export interface CuentaResumen {
  creator_id: string;
  creator_name: string | null;
  solicitudes_llegadas: number;
  aviso: string | null;
}

// El bloque de arriba no sabe de que post sale cada persona, asi que no puede
// traer su config. Va con la de por defecto: `SolicitudesPedidas` resuelve el
// recurso por la palabra clave de cada fila (`followup_text` si la lista lo
// guardo, y si no `resolverRecurso`), igual que hace dentro de un post.
const CFG_DEFECTO: LmConfig = { kind: 'dm', keyword: '', link: '', topic: '' };

export default function SolicitudesGlobal({ cuentas }: { cuentas: CuentaResumen[] }) {
  if (cuentas.length === 0) return null;
  return (
    <div className="space-y-3">
      {cuentas.map((c) => (
        <div key={c.creator_id}>
          {c.aviso && <p className="text-[11px] text-amber-400 leading-snug mb-1">⚠️ {c.aviso}</p>}
          <SolicitudesPedidas
            creatorId={c.creator_id}
            cfg={CFG_DEFECTO}
            voice={voiceFor(c.creator_name)}
          />
        </div>
      ))}
    </div>
  );
}
```

⚠️ `SolicitudesPedidas` ya devuelve `null` sola cuando no hay nada pendiente, así que una cuenta sin solicitudes no pinta nada.

- [ ] **Step 3: Montarlo en RepliesPanel, debajo de la cabecera**

```tsx
{choice && data?.cuentas && <SolicitudesGlobal cuentas={data.cuentas} />}
```

- [ ] **Step 4: Typecheck**

Run: `cd frontend && npx tsc -b 2>&1 | grep -iE "SolicitudesGlobal|RepliesPanel|LeadMagnetWorkspace"` → sin salida.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "comments: las solicitudes pedidas de todas las cuentas, arriba y sin elegir post" && git push origin main
```

---

### Task 6: Grupos plegados y el workspace dentro de Comments

**Files:**
- Modify: `frontend/src/components/accounts/RepliesPanel.tsx`
- Modify: `frontend/src/components/accounts/CommentCards.tsx` (`PostGroup` pasa a plegable)

- [ ] **Step 1: `PostGroup` plegable, con la fila-resumen**

`PostGroup` recibe dos props nuevas y arranca cerrado:

```tsx
export function PostGroup({ group, children }: { group: PendingGroup; children?: React.ReactNode }) {
  const [abierto, setAbierto] = useState(false);
  ...
```

La cabecera actual pasa a ser un `<button>` que hace `setAbierto(v => !v)`, con las chapas de contadores:

```tsx
{threads.length > 0 && (
  <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/10 text-accent border border-accent/30 whitespace-nowrap">
    {threads.length} sin responder
  </span>
)}
{group.recursos_pendientes > 0 && (
  <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-400 border border-sky-500/30 whitespace-nowrap">
    {group.recursos_pendientes} sin mandar
  </span>
)}
```

Y el cuerpo (las `ThreadCard` o el `children`) solo se monta con `abierto`. **Que se monte y no que se esconda con CSS es lo importante:** el workspace de un lead magnet pide comentarios a LinkedIn al montarse, y con 10 grupos abiertos de golpe serían 10 llamadas que nadie pidió.

- [ ] **Step 2: RepliesPanel decide qué va dentro**

```tsx
{groups.slice(0, visibleGroups).map((g) => (
  <PostGroup key={g.post.id} group={g}>
    {/* Un lead magnet se trabaja con SU panel entero, el mismo que tenia la
        pestaña Lead Magnet: la config del recurso, el filtro por grado, los dos
        bloques de seguimiento y las tarjetas con respuesta Y envio. Es el mismo
        componente, no una copia: las tres defensas contra el doble envio viven
        ahi dentro. */}
    {g.es_lead_magnet && (
      <ErrorBoundary donde={`el lead magnet de ${g.post.creator_name || 'este post'}`}>
        <LeadMagnetWorkspace post={g.post as unknown as GridPost} creatorId={g.post.creator_id} />
      </ErrorBoundary>
    )}
  </PostGroup>
))}
```

⚠️ En un post lead magnet, `PostGroup` **no** pinta sus `ThreadCard`: el workspace ya trae una tarjeta por comentarista con la respuesta pública dentro. Pintar las dos sería ofrecer dos cajas de respuesta para el mismo comentario. `PostGroup` recibe por eso una prop `soloChildren`.

- [ ] **Step 3: Typecheck**

Run: `cd frontend && npx tsc -b 2>&1 | grep -iE "RepliesPanel|CommentCards"` → sin salida.

- [ ] **Step 4: Banco de pruebas en el navegador**

Montar la página de pruebas con la API simulada (`frontend/src/__sandbox_*.tsx` + su `.html` en la raíz de `frontend/`, importando `./App` para que Tailwind genere todas las clases) y recorrer la lista:

1. Desplegar un post normal → salen sus comentarios.
2. Responder un comentario principal → desaparece y baja el contador.
3. Responder una **sub-respuesta** → se envía contra el id de la sub-respuesta.
4. **Reaccionar con emoji** → la barra cambia.
5. Desplegar un lead magnet → sale el workspace, NO salen `ThreadCard` sueltas.
6. Una persona que está en el bloque de arriba **no** tiene botón de enviar abajo.
7. Plegar y desplegar → el workspace se desmonta y se vuelve a montar.

Borrar el banco de pruebas al terminar.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "comments: los posts salen plegados y un lead magnet se trabaja entero desde aqui" && git push origin main
```

---

### Task 7: Dejar las dos pestañas conviviendo y avisar

**Files:**
- Modify: `frontend/src/pages/Accounts.tsx` (la barra de sub-pestañas)

- [ ] **Step 1: Marcar la pestaña vieja**

La pestaña `Lead Magnet` **se queda visible** y pasa a llamarse `Lead Magnet (antiguo)`, con un `title` que diga que Comments ya lo hace todo y que esta desaparece cuando Iker dé el OK.

- [ ] **Step 2: Commit y aviso a Iker**

```bash
git add -A && git commit -m "accounts: la pestana Lead Magnet queda marcada como antigua hasta el OK de Iker" && git push origin main
```

En la entrega, decirle explícitamente: **úsalo un día y dime; hasta entonces no borro nada.**

---

## Self-Review

**Cobertura de la spec:**

| Requisito de la spec | Tarea |
|---|---|
| Fusión completa de una vez | 1-7 |
| La pestaña se sigue llamando Comments | ninguna (no se toca el nombre) |
| Un post entra si debe cualquier cosa | 4, paso 4 |
| Tipo de lead magnet en la base | 3 |
| Posts plegados con contadores | 6, paso 1 |
| Bloque de solicitudes arriba, ya refrescado | 4 paso 5 + 5 |
| Una sola llamada `getReceivedInvitations` por cuenta | 4, paso 5 |
| `check-accepted` sigue siendo botón manual | 4, paso 5 (comentario) + no se toca |
| Lead magnet fuera de la ventana de 30 días | 4, paso 2 |
| Componentes movidos, no reescritos | 1, 2 |
| Endpoints de acción intactos | Global Constraints |
| Las tres defensas contra el doble envío | viven dentro del workspace movido (2) |
| Marcha atrás | 7 — la pestaña vieja se queda visible |

**Sin placeholders:** cada paso lleva el código o el comando exacto.

**Consistencia de tipos:** `GridPost` se define en `lmTypes.ts` (tarea 2) y la consumen las tareas 5 y 6. `PendingGroup` se define en `CommentCards.tsx` (tarea 1) y se amplía con `es_lead_magnet` y `recursos_pendientes` en la tarea 4; hay que **añadir esos dos campos a la interfaz** al hacer la tarea 4, o la 6 no compila. `LmConfig` y `LmKind` salen de `lmTypes.ts` y los usan 3 y 5.
