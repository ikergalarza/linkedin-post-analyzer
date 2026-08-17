# Pedir solicitud en vez de agregar — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que la herramienta no mande nunca más una invitación ni un InMail: a quien no se le pueda escribir gratis, se le pide en público que nos mande él la solicitud, y cuando llegue se le entrega el recurso contestando a esa solicitud.

**Architecture:** Se retiran los canales `invite` e `inmail` del envío y se añade un estado nuevo, `kind='ask'`, que es un recibo local ("a esta persona se le pidió la solicitud") y no manda nada a LinkedIn. Un endpoint nuevo cruza esas filas contra las solicitudes recibidas de la cuenta —una llamada a Unipile por cuenta— y las reparte en "ya han mandado solicitud" (accionables, con su `invitation_id`) y "esperando". La entrega reutiliza `/lead-magnet/send` con `kind:'dm'`, que ya existe y ya verifica.

**Tech Stack:** Express + pg (backend), React + TypeScript + Tailwind (frontend), Unipile como API de LinkedIn.

**Spec:** `docs/superpowers/specs/2026-08-17-pedir-solicitud-lead-magnet-design.md`

## Global Constraints

- **No hay framework de tests en este repo.** La verificación de cada tarea es: `cd backend && npx tsc --noEmit` y `cd frontend && npx tsc -b` (en el frontend, `tsc --noEmit` a secas NO comprueba nada — hay que usar `-b`). Donde haya lógica pura verificable se escribe un script de un solo uso en el scratchpad y se ejecuta; no se commitea.
- **Nada de código muerto.** Si una función deja de tener llamantes, se borra en la misma tarea que quita su último llamante.
- **Las filas históricas `invite` e `inmail` se siguen leyendo.** El CHECK de la BD las sigue permitiendo, la pestaña Seguimientos vieja sigue funcionando y `/lead-magnet/reverificar` las sigue repasando. Lo que se prohíbe es CREAR nuevas.
- **Copy en español, sin guion largo y sin coma antes de "y"** (`docs/skills/brand-voice.md §3`).
- **Se pide "solicitud de contacto", nunca "sígueme".** Un seguidor sigue siendo de 2º/3er grado y a ese no se le puede escribir por privado.
- **Commit por tarea**, mensaje en español con prefijo convencional, y `git push origin main` al final de cada tarea (preferencia del usuario: todo va a main, sin rama).

---

## Task 1: La migración — `ask` entra en el CHECK

**Files:**
- Modify: `backend/src/db/migrate.ts:860-861`

**Interfaces:**
- Produces: la columna `lead_magnet_sends.kind` acepta `'ask'`. Todas las tareas siguientes dependen de esto.

- [ ] **Step 1: Ampliar el CHECK**

En `backend/src/db/migrate.ts`, el bloque actual termina así:

```sql
  ALTER TABLE lead_magnet_sends ADD CONSTRAINT lead_magnet_sends_kind_check
    CHECK (kind IN ('dm','invite','inmail'));
  ALTER TABLE lead_magnet_sends ADD COLUMN IF NOT EXISTS verificado BOOLEAN;
```

Se añade DESPUÉS de esas líneas un bloque v37 nuevo. Se repite el patrón defensivo del v36 (buscar el constraint por su DEFINICIÓN y no por su nombre) porque es exactamente el mismo peligro: un `DROP CONSTRAINT IF EXISTS` con el nombre equivocado es un no-op silencioso y el constraint viejo seguiría rechazando las filas `ask` — un fallo que no se ve hasta el primer lead magnet real.

```sql
  -- v37: 'ask' — el recibo de "a esta persona se le PIDIO que nos mande ella la
  -- solicitud". Es el unico kind que NO manda nada a LinkedIn: lo que sale es la
  -- respuesta publica al comentario, y esta fila es lo que permite, dias despues,
  -- cruzar contra las solicitudes recibidas y saber quien ha dado el paso.
  --
  -- Nace de retirar la invitacion con nota y el InMail (2026-08-17): la
  -- herramienta ya no agrega a nadie. 'invite' e 'inmail' siguen en el CHECK
  -- porque sus filas historicas siguen ahi y se siguen leyendo; lo que ya no se
  -- hace es crear nuevas.
  --
  -- El CHECK viejo se busca por su DEFINICION, igual que en v36 y por lo mismo.
  DO $$
  DECLARE c TEXT;
  BEGIN
    FOR c IN
      SELECT con.conname FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
       WHERE rel.relname = 'lead_magnet_sends'
         AND con.contype = 'c'
         AND pg_get_constraintdef(con.oid) ILIKE '%kind%'
    LOOP
      EXECUTE format('ALTER TABLE lead_magnet_sends DROP CONSTRAINT %I', c);
    END LOOP;
  END $$;
  ALTER TABLE lead_magnet_sends ADD CONSTRAINT lead_magnet_sends_kind_check
    CHECK (kind IN ('dm','invite','inmail','ask'));
```

- [ ] **Step 2: Comprobar que compila**

Run: `cd backend && npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add backend/src/db/migrate.ts && git commit -m "feat(leadmagnet): la BD acepta el estado ask" && git push origin main
```

---

## Task 2: Backend — grabar el "pedido" y cerrar la puerta a invite/inmail

**Files:**
- Modify: `backend/src/routes/accounts.ts` (cabecera del bloque Lead Magnet ~2613-2650, `/lead-magnet/canal` ~2728, `/lead-magnet/send` ~2993)

**Interfaces:**
- Consumes: `kind='ask'` permitido en la BD (Task 1).
- Produces:
  - `POST /api/accounts/lead-magnet/ask` con body `{ post_id, comment_id, provider_id, text, provider_name?, sector?, followup_text? }` → `{ ok: true }`.
  - `POST /api/accounts/lead-magnet/send` devuelve **400** si `kind` es `'invite'` o `'inmail'`.
  - `GET /api/accounts/lead-magnet/canal` ya no devuelve `sin_nota`.

- [ ] **Step 1: Borrar `CUENTAS_SIN_NOTA` / `notaBaneada` y su comentario**

Quitar el bloque `⛔ CUENTAS CON LA NOTA PROHIBIDA` (líneas ~2625-2649) entero, incluidos `const CUENTAS_SIN_NOTA` y `function notaBaneada`. Con la nota retirada de TODAS las cuentas, una lista de cuentas que no pueden mandarla no significa nada.

Sustituir la cabecera de la sección (~2613-2623) por:

```ts
// ──────────────────────────── Lead Magnet tab ────────────────────────────
//
// Entregar el recurso a quien comentó en un lead magnet. Desde el 2026-08-17
// esta herramienta NO AGREGA A NADIE: se retiraron la invitación con nota (cupo
// semanal, y baneada en la cuenta de Unai desde el 14/08) y el InMail (créditos
// contados). Quedan tres caminos y los tres son gratis:
//
//   1. Contacto de 1er grado                → DM normal.
//   2. Nos tiene una solicitud pendiente    → mensaje contestando a esa
//      solicitud. Llega igual que un DM y no gasta nada. No se acepta: aceptar
//      en masa es lo que dispara los límites de LinkedIn.
//   3. Ni una cosa ni la otra               → NADA por privado. Se le responde
//      en público pidiéndole que nos mande él la solicitud, y esa petición se
//      guarda como kind='ask' para poder detectar después que la ha mandado.
//
// GET  /api/accounts/lead-magnet/posts?creator_id=  — the post grid
// GET  /api/accounts/lead-magnet/sends?post_id=     — who we already wrote to
// GET  /api/accounts/lead-magnet/canal?creator_id=  — las solicitudes recibidas
// POST /api/accounts/lead-magnet/send               — DM (suelto o a su solicitud)
// POST /api/accounts/lead-magnet/ask                — "le he pedido la solicitud"
// GET  /api/accounts/lead-magnet/pendientes-solicitud?creator_id= — quién ya la mandó
// POST /api/accounts/lead-magnet/reverificar        — releer envíos ya guardados
```

- [ ] **Step 2: Limpiar `/lead-magnet/canal`**

En `router.get('/lead-magnet/canal', …)`: quitar `const sinNota = notaBaneada(name);`, quitar `name` del SELECT (queda `SELECT unipile_account_id FROM creators WHERE id = $1`) y devolver `res.json({ pendientes, aviso })`. Actualizar el comentario de cabecera del endpoint quitando el párrafo de `sin_nota`, y cambiar el texto del `aviso` (ya no hay InMail al que caer):

```ts
        aviso = `No he podido leer las solicitudes pendientes (${err?.message}). Sin esa lista, a quien nos haya mandado solicitud se le va a pedir otra vez en vez de escribirle.`;
```

- [ ] **Step 3: Cerrar `/lead-magnet/send` a invite e inmail**

En el handler, sustituir la validación de `kind` y toda la rama de envío por la versión sin invitación. La guarda devuelve un motivo LEGIBLE, porque el cliente que mande esto es una pestaña abierta desde antes del cambio:

```ts
    if (kind === 'invite' || kind === 'inmail') {
      return res.status(400).json({
        error: 'Ese canal ya no existe: no mandamos invitaciones ni InMails. Recarga la página y responde al comentario pidiéndole la solicitud.',
      });
    }
    if (kind !== 'dm') {
      return res.status(400).json({ error: "kind must be 'dm'" });
    }
```

Se borran, en el mismo handler: la validación del asunto (`if (kind === 'inmail' && !asunto)`), la constante `asunto`, la guarda de `notaBaneada`, el troceado por canal (`kind === 'invite' ? …slice(0,300)`) que pasa a ser `const body = text.trim();`, la rama `if (kind === 'invite') { … sendInvitation … }` y las opciones `inmail`/`subject` de `sendDirectMessage`. El verificador pasa a ser siempre `verificarMensaje`. También se quita `subject` de la desestructuración del body.

El resultado del bloque de envío:

```ts
    const body = text.trim();

    let status: 'sent' | 'failed' = 'sent';
    let error: string | null = null;
    let result: any = null;
    let verificado: boolean | null = null;
    // Se sella ANTES de mandar: es el suelo del barrido al comprobarlo.
    const mandadoEn = new Date();
    try {
      result = await unipileService.sendDirectMessage(provider_id, body, accountId, {
        // Contestar a una solicitud pendiente: mensaje normal, sin aceptarla y
        // sin gastar nada. Solo va cuando el panel ha encontrado su invitación.
        ...(invitation_id ? { invitationId: String(invitation_id) } : {}),
      });
    } catch (err: any) {
      status = 'failed';
      error = err?.message || String(err);
      console.warn(`[accounts/lead-magnet/send] dm to ${provider_id} failed:`, error);
    }

    if (status === 'sent') {
      const v = await verificarMensaje(provider_id, accountId, body, result?.chat_id ?? null, mandadoEn);
      verificado = v.ok;
      if (v.ok === false) {
        status = 'failed';
        error = v.motivo;
        console.warn(`[accounts/lead-magnet/send] dm a ${provider_id} NO verificado: ${v.motivo}`);
      } else if (v.ok === null) {
        error = v.motivo; // enviado, pero sin recibo: el panel lo dice en ámbar
      }
    }
```

**No se toca `verificarMensaje`**: su barrido de la SEGUNDA bandeja nació para los InMails, pero un mensaje colgado de una solicitud pendiente puede aparecer también fuera del chat normal, así que quitarlo arriesgaría marcar como no entregado algo que sí salió. Se le añade esta nota a su comentario de cabecera (~2912).

- [ ] **Step 4: El endpoint `/lead-magnet/ask`**

Justo después del handler de `/lead-magnet/send`, añadir:

```ts
// POST /api/accounts/lead-magnet/ask
// Body: { post_id, comment_id, provider_id, text, provider_name?, sector?, followup_text? }
//
// "A esta persona le he pedido que nos mande ella la solicitud."
//
// NO MANDA NADA A LINKEDIN, y esa es toda la diferencia con /send. Lo que sale
// de verdad es la respuesta pública al comentario, que va por el endpoint de
// respuestas de siempre; esta fila es el recibo local, y sin ella
// /pendientes-solicitud no tiene contra qué cruzar las solicitudes recibidas:
// la persona mandaría su solicitud y no aparecería por ningún lado.
//
// El panel lo llama DESPUÉS de que la respuesta salga bien. Si la respuesta
// falla no se llama: no se puede quedar registrado como "pedido" algo que la
// persona no ha leído.
//
// `sector` y `followup_text` se guardan aquí por el lead magnet de tipo lista:
// son lo que dice QUÉ lista mandarle el día que llegue su solicitud.
router.post('/lead-magnet/ask', async (req: Request, res: Response) => {
  try {
    const { post_id, comment_id, provider_id, text, provider_name, sector, followup_text } = req.body || {};
    if (!post_id || !comment_id || !provider_id) {
      return res.status(400).json({ error: 'post_id, comment_id and provider_id required' });
    }
    await pool.query(
      `INSERT INTO lead_magnet_sends (post_id, comment_social_id, provider_id, kind, status, text, verificado, followup_text, sector, provider_name)
       VALUES ($1, $2, $3, 'ask', 'sent', $4, NULL, $5, $6, $7)
       ON CONFLICT (post_id, provider_id, kind)
       DO UPDATE SET text = EXCLUDED.text, created_at = NOW(),
                     comment_social_id = EXCLUDED.comment_social_id,
                     followup_text = COALESCE(EXCLUDED.followup_text, lead_magnet_sends.followup_text),
                     sector = COALESCE(EXCLUDED.sector, lead_magnet_sends.sector),
                     provider_name = COALESCE(EXCLUDED.provider_name, lead_magnet_sends.provider_name)`,
      [post_id, comment_id, provider_id, String(text || '').trim() || null,
       followup_text || null, sector || null, provider_name || null]
    );
    res.json({ ok: true });
  } catch (err: any) {
    console.error('[accounts/lead-magnet/ask]', err);
    res.status(500).json({ error: err.message });
  }
});
```

- [ ] **Step 5: Comprobar que compila y que no queda nada colgando**

Run: `cd backend && npx tsc --noEmit`
Expected: sin errores.

Run: `grep -rn "notaBaneada\|CUENTAS_SIN_NOTA\|sendInvitation" backend/src`
Expected: solo la definición de `sendInvitation` en `services/unipile.ts` (se deja: `/network` la usa para otra cosa). Cero apariciones de `notaBaneada` y `CUENTAS_SIN_NOTA`.

- [ ] **Step 6: Commit**

```bash
git add backend/src/routes/accounts.ts && git commit -m "feat(leadmagnet): fuera invitacion e InMail, y se guarda a quien se le pide la solicitud" && git push origin main
```

---

## Task 3: Backend — quién ya nos ha mandado la solicitud

**Files:**
- Modify: `backend/src/routes/accounts.ts` (añadir después de `/lead-magnet/followups`)

**Interfaces:**
- Consumes: filas `kind='ask'` (Task 2), `unipileService.getReceivedInvitations(accountId)`.
- Produces: `GET /api/accounts/lead-magnet/pendientes-solicitud?creator_id=` →
  `{ llegadas: Fila[], esperando: Fila[], aviso: string | null }`
  donde `Fila = { post_id, provider_id, provider_name, sector, followup_text, comment_social_id, created_at, dias, invitation_id }` y `invitation_id` es `string | null`.

- [ ] **Step 1: Escribir el endpoint**

```ts
// GET /api/accounts/lead-magnet/pendientes-solicitud?creator_id=xxx
//
// El otro lado de la moneda de /ask: a quién le pedimos la solicitud, y quién de
// esos ya la ha mandado.
//
// Cuesta UNA llamada a Unipile por cuenta, no una por persona: la lista de
// solicitudes recibidas es la misma para los 400 comentarios de un post. El cruce
// es por provider_id, el mismo id que trae el comentario.
//
// Si Unipile falla, se devuelve 200 con `llegadas: []` y un aviso, igual que
// /canal: la pantalla sigue en pie y lo dice. Quedarse sin pantalla sería peor
// que no saber quién ha aceptado todavía.
router.get('/lead-magnet/pendientes-solicitud', async (req: Request, res: Response) => {
  try {
    const creatorId = (req.query.creator_id as string) || '';
    if (!creatorId) return res.status(400).json({ error: 'creator_id required' });

    const cQ = await pool.query(`SELECT unipile_account_id FROM creators WHERE id = $1`, [creatorId]);
    if (cQ.rows.length === 0) return res.status(404).json({ error: 'Creator not found' });
    const accountId = cQ.rows[0].unipile_account_id;

    // Los pedidos que siguen sin resolverse: sin DM detrás. El NOT EXISTS es lo
    // que hace que una persona desaparezca de aquí en cuanto se le manda.
    const { rows } = await pool.query(
      `SELECT s.post_id, s.provider_id, s.provider_name, s.sector, s.followup_text,
              s.comment_social_id, s.created_at,
              EXTRACT(DAY FROM NOW() - s.created_at)::int AS dias
         FROM lead_magnet_sends s
         JOIN posts p ON p.id = s.post_id
         JOIN creators c ON c.id = p.creator_id
        WHERE s.kind = 'ask' AND s.status = 'sent' AND c.id = $1
          AND NOT EXISTS (
            SELECT 1 FROM lead_magnet_sends d
             WHERE d.post_id = s.post_id AND d.provider_id = s.provider_id
               AND d.kind = 'dm' AND d.status = 'sent'
          )
        ORDER BY s.created_at DESC`,
      [creatorId]
    );

    let aviso: string | null = null;
    const invitaciones = new Map<string, string>();
    if (accountId && rows.length > 0) {
      try {
        for (const i of await unipileService.getReceivedInvitations(accountId)) {
          invitaciones.set(i.inviter_id, i.invitation_id);
        }
      } catch (err: any) {
        aviso = `No he podido leer las solicitudes recibidas (${err?.message}). Puede que alguno de estos ya te haya mandado la suya y aquí no salga.`;
        console.warn('[accounts/lead-magnet/pendientes-solicitud]', err?.message);
      }
    }

    const llegadas: any[] = [];
    const esperando: any[] = [];
    for (const r of rows) {
      const invitation_id = invitaciones.get(r.provider_id) ?? null;
      (invitation_id ? llegadas : esperando).push({ ...r, invitation_id });
    }
    res.json({ llegadas, esperando, aviso });
  } catch (err: any) {
    console.error('[accounts/lead-magnet/pendientes-solicitud]', err);
    res.status(500).json({ error: err.message });
  }
});
```

- [ ] **Step 2: Comprobar que compila**

Run: `cd backend && npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add backend/src/routes/accounts.ts && git commit -m "feat(leadmagnet): detectar quien nos ha mandado la solicitud" && git push origin main
```

---

## Task 4: Backend — la respuesta de IA cierra pidiendo la solicitud

**Files:**
- Modify: `backend/src/services/replyGenerator.ts:26-34` (el tipo) y `:294-305` (la instrucción)
- Modify: `backend/src/routes/accounts.ts:2376-2434` (el handler `/generate`)

**Interfaces:**
- Consumes: nada nuevo.
- Produces: `POST /posts/:postId/comments/:commentId/generate` acepta `pedir_solicitud: boolean` en el body. `ReplyInput.leadMagnet` pasa a ser `{ kind: 'dm'; topic: string; pedirSolicitud?: boolean }`.

- [ ] **Step 1: El tipo y la instrucción en `replyGenerator.ts`**

El campo pasa a:

```ts
  //  · 'dm'      → comenta la palabra y le mandamos el recurso por privado. La
  //                respuesta pública solo CONFIRMA que va de camino. Corta.
  //  · 'publico' → NO pasa por aquí. Tiene su propio generador
  //                (services/rastroGenerator.ts), porque además del texto crea
  //                la página personalizada con el gate de correo.
  //
  // `pedirSolicitud` le da la vuelta al cierre: cuando esa persona no es contacto
  // y no nos ha mandado solicitud, el recurso NO va de camino y decir que sí es
  // mentira. Lo que toca es pedirle la solicitud.
  leadMagnet?: { kind: 'dm'; topic: string; pedirSolicitud?: boolean };
```

Y la instrucción se bifurca. Se sustituye `leadMagnetInstruction` por:

```ts
  // Lead magnet: this person didn't just comment, they asked for something. Lo
  // que cambia es si ya se lo estamos mandando o si primero tiene que darnos el
  // paso — y confundir las dos es prometer algo que no ha salido.
  const leadMagnetInstruction = !input.leadMagnet
    ? ''
    : input.leadMagnet.pedirSolicitud
    ? `\n═══ LEAD MAGNET (applies to THIS reply) ═══
This person commented on a post that offered a resource about "${input.leadMagnet.topic}". You CANNOT send it to them: they are not a connection and LinkedIn does not deliver private messages to non-connections.

So this reply has TWO jobs and needs both:
1. ENGAGE with what they actually said. They wrote something real (an opinion, their own experience, a question). React to THAT, specifically. This is the part that matters.
2. ASK THEM to send YOU the connection request, in a SHORT closing beat, saying WHY: LinkedIn won't let you message someone who isn't a contact. Something like "mandame solicitud y te lo paso, que LinkedIn no me deja escribirte si no somos contacto".

Order matters: engage FIRST, ask LAST. NEVER claim the resource is sent, on its way, or in their DMs — nothing has been sent and nothing will be until they act. Ask for the CONNECTION REQUEST, never for a follow: a follower still can't be messaged. Keep the whole thing to ONE sentence.\n`
    : `\n═══ LEAD MAGNET (applies to THIS reply) ═══
This person commented on a post that offered a resource about "${input.leadMagnet.topic}" in exchange for a keyword. You are sending them that resource by private message RIGHT NOW.

So this reply has TWO jobs and needs both:
1. ENGAGE with what they actually said. They didn't only drop the keyword — they wrote something real (an opinion, their own experience, a question). React to THAT, specifically, the way you would to any good comment. This is the part that matters; a reply that skips it is worthless.
2. CONFIRM the resource is sent, in a SHORT closing beat — "te lo acabo de mandar", "lo tienes en privado", "te lo he pasado por DM". Casual, tacked on at the end, NOT the headline of the reply.

Order matters: engage FIRST, confirm LAST. Never open with "enviado" — that turns a real comment into a receipt, which is exactly what we're trying to avoid. Keep the whole thing to ONE sentence even with both jobs: engage and confirm in the same breath.\n`;
```

(De paso desaparece el `input.leadMagnet.kind === 'dm' ? … : ''` de la primera línea, que era un ternario sobre un tipo que solo tiene un valor.)

- [ ] **Step 2: Pasarlo desde la ruta**

En `accounts.ts`, en el handler `/generate`: añadir `pedir_solicitud` a la desestructuración del body y al objeto:

```ts
      leadMagnet: lead_magnet_topic && String(lead_magnet_topic).trim()
        ? {
            kind: 'dm' as const,
            topic: String(lead_magnet_topic).trim(),
            // El panel lo manda cuando esa persona no es contacto y no nos ha
            // mandado solicitud: la respuesta pide el paso en vez de prometer un
            // envío que no puede salir.
            pedirSolicitud: !!pedir_solicitud,
          }
        : undefined,
```

- [ ] **Step 3: Comprobar que compila**

Run: `cd backend && npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 4: Commit**

```bash
git add backend/src/services/replyGenerator.ts backend/src/routes/accounts.ts && git commit -m "feat(leadmagnet): la respuesta de IA pide la solicitud en vez de prometer el envio" && git push origin main
```

---

## Task 5: Copy — `buildAskReply`, y fuera nota e InMail

**Files:**
- Modify: `frontend/src/components/accounts/leadMagnetCopy.ts` (borrar `buildInviteNote` ~529-538, el bloque InMail ~540-606 y `buildListaInvite` ~716-774; añadir el banco de variantes)

**Interfaces:**
- Produces: `buildAskReply(opts?: { recent?: string[]; rng?: () => number; voice?: Voice }): { text: string; variant: string }` — misma firma que `buildReply`.
- Borra: `buildInviteNote`, `buildInmail`, `asuntoInmail`, `notaBaneada`, `CUENTAS_SIN_NOTA`, `VACIAS_ASUNTO`, `buildListaInvite`.

- [ ] **Step 1: Añadir el banco de variantes y `buildAskReply`**

Va justo debajo de `buildReply` (~línea 395), porque comparte con él el `pick`, el `stretchLastVowel` y la idea de rotación:

```ts
// ─────────────────── la respuesta que PIDE la solicitud ───────────────────
//
// Para quien no es contacto y no nos ha mandado solicitud. Desde el 2026-08-17
// no le mandamos nada por privado: ni invitación con nota (cupo semanal, y
// baneada en la cuenta de Unai) ni InMail (créditos contados). El paso lo da él.
//
// Las tres reglas del texto, y las tres son la diferencia entre que funcione o
// no:
//  · Se pide SOLICITUD DE CONTACTO, nunca un "sígueme". Un seguidor sigue siendo
//    de 2º o 3er grado y a ese LinkedIn no deja escribirle: la petición no
//    serviría de nada.
//  · Va con el porqué. Sin la excusa de LinkedIn se lee como un peaje que le
//    ponemos nosotros; con ella es una limitación de la plataforma, que todo el
//    mundo entiende.
//  · No promete nada que ya haya salido. "Te lo he mandado" aquí es mentira.
const ASK_VARIANTS: string[] = [
  'Mandame solicitud y te lo paso, que LinkedIn no me deja escribirte si no somos contacto',
  'Te lo mando en cuanto me llegue tu solicitud, LinkedIn no me deja escribir a quien no es contacto',
  'No me deja LinkedIn escribirte sin ser contactos. Mandame solicitud y va para ti',
  'Mandame solicitud y te lo paso por privado, que si no somos contactos LinkedIn no me deja',
  'LinkedIn no me deja mandarte nada sin ser contactos. Echame la solicitud y te lo paso',
  'En cuanto me mandes solicitud te lo paso, que LinkedIn me lo bloquea si no somos contacto',
  'Te lo paso encantado, pero mandame antes solicitud: LinkedIn no me deja escribirte de otra forma',
  'Mandame la solicitud y te lo paso al privado, que LinkedIn no me deja escribir a quien no tengo agregado',
  'Necesito que me mandes tu solicitud para poder escribirte, cosas de LinkedIn. Y te lo paso',
  'Si me mandas solicitud te lo paso por privado. LinkedIn no me deja hacerlo de otra manera',
];

// La tilde va donde tiene que ir. El banco de arriba se escribe sin tildes para
// que el fichero no dependa de la codificación, y se restauran aquí: el texto
// que sale a LinkedIn tiene que estar bien escrito.
const ASK_TILDES: [RegExp, string][] = [
  [/\bMandame\b/g, 'Mándame'],
  [/\bmandame\b/g, 'mándame'],
  [/\bEchame\b/g, 'Échame'],
  [/\bTe lo paso encantado\b/g, 'Te lo paso encantado'],
];

// Una petición. `recent` son las variantes ya usadas en ESTE post, por lo mismo
// que en buildReply: 40 comentarios con la misma frase es lo que hace que se lea
// como un bot. Sin emoji ni estiramiento de vocales: la frase ya es larga y
// pedirle algo a alguien con un "Holaaa" delante se lee peor, no mejor.
export function buildAskReply(
  opts: { recent?: string[]; rng?: () => number; voice?: Voice } = {}
): { text: string; variant: string } {
  const rng = opts.rng ?? Math.random;
  const recent = opts.recent ?? [];
  const pool = ASK_VARIANTS.filter((v) => !recent.includes(v));
  const chosen = pick(pool.length > 0 ? pool : ASK_VARIANTS, rng);
  let text = chosen;
  for (const [re, con] of ASK_TILDES) text = text.replace(re, con);
  // Un emoji en un tercio, como en buildReply: pedir algo a secas suena seco.
  if (rng() < 0.33) text += ` ${pick(REPLY_EMOJIS, rng)}`;
  return { text, variant: chosen };
}
```

- [ ] **Step 2: Borrar lo que ya no se manda**

Borrar de `leadMagnetCopy.ts`:
- `buildInviteNote` y su comentario de cabecera.
- Toda la sección `──── InMail ────`: `buildInmail`, `VACIAS_ASUNTO`, `asuntoInmail`.
- El bloque `⛔ CUENTAS QUE NO PUEDEN MANDAR INVITACIÓN CON NOTA`: `CUENTAS_SIN_NOTA` y `notaBaneada`.
- `buildListaInvite` y su comentario.

- [ ] **Step 3: Probar la rotación de verdad**

Escribir `%TEMP%\claude\...\scratchpad\ask.test.mjs` — no se commitea, es de un solo uso. Como el fichero es TypeScript, se ejecuta con `npx tsx`:

```js
import { buildAskReply } from './frontend/src/components/accounts/leadMagnetCopy.ts';

const recent = [];
const vistos = [];
for (let i = 0; i < 10; i++) {
  const { text, variant } = buildAskReply({ recent });
  recent.push(variant);
  vistos.push(variant);
  if (!/solicitud/i.test(text)) throw new Error(`sin la palabra solicitud: ${text}`);
  if (/sigue|síguem|seguidor/i.test(text)) throw new Error(`pide follow y no solicitud: ${text}`);
  if (/mandado|enviado|te lo he pasado/i.test(text)) throw new Error(`promete un envío: ${text}`);
  if (/—/.test(text)) throw new Error(`guion largo prohibido: ${text}`);
}
if (new Set(vistos).size !== 10) throw new Error('repite variante dentro de las 10 primeras');
console.log('OK: 10 variantes distintas, todas piden solicitud y ninguna promete un envío');
```

Run: `npx tsx <ruta>/ask.test.mjs`
Expected: `OK: 10 variantes distintas, todas piden solicitud y ninguna promete un envío`

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/accounts/leadMagnetCopy.ts && git commit -m "feat(leadmagnet): copy que pide la solicitud, y fuera nota e InMail" && git push origin main
```

(El `tsc -b` del frontend no se corre todavía: el panel aún importa lo que acabamos de borrar y va a fallar. Se corre al final de la Task 6.)

---

## Task 6: Panel — el canal `pedir`

**Files:**
- Modify: `frontend/src/components/accounts/LeadMagnetPanel.tsx` (imports ~5-9, cabecera ~26-31, `Canal` ~92-104, `sinNota` ~336, `invitedCommentIds` ~397, props de la tarjeta ~759-782 y ~881-916, `canal` ~928-933, borrador ~1016-1060, `handleReply` ~1207-1224, `handleLista` ~1244-1258, `handleSendResource` ~1268-1310, la UI del recurso ~1524-1723)

**Interfaces:**
- Consumes: `buildAskReply` (Task 5), `POST /lead-magnet/ask` (Task 2), `pedir_solicitud` en `/generate` (Task 4).
- Produces: la tarjeta en canal `pedir` no enseña caja de envío y su respuesta graba el `ask`.

- [ ] **Step 1: Imports, tipos y cabecera**

```ts
import {
  buildAskReply, buildDm, buildListaDm, buildReply,
  commentDepth, detectarRecurso, extractKeyword, extractSector, resolverRecurso, voiceFor,
} from './leadMagnetCopy';
```

El punto 2 de la cabecera del fichero pasa a:

```
// 2. LinkedIn solo entrega un mensaje privado a un contacto de 1er grado, y
//    desde el 2026-08-17 NO AGREGAMOS A NADIE: se retiraron la invitación con
//    nota y el InMail. Quedan tres caminos y los tres son gratis:
//      · 1er grado                          → DM normal
//      · nos mandó solicitud y sigue pendiente → mensaje contestando a esa
//        solicitud (llega igual, y no se acepta: aceptar en masa es lo que
//        dispara los límites de LinkedIn)
//      · ni una cosa ni la otra             → NADA por privado. Se le pide en
//        público que nos mande él la solicitud, y cuando llegue salta a
//        «Solicitudes pedidas», arriba.
//    Ver `canalDe` más abajo.
```

El tipo y su ayudante:

```ts
type Canal = 'dm' | 'dm-solicitud' | 'pedir';

interface CanalInfo {
  pendientes: { provider_id: string; invitation_id: string; name: string | null }[];
  aviso: string | null;
}
```

`SendRecord.kind` pasa a `'dm' | 'invite' | 'inmail' | 'ask'` (los dos del medio siguen llegando: las filas históricas se leen). Se borra `kindDeCanal`.

- [ ] **Step 2: El componente de la lista**

- Borrar `const sinNota = canalData?.sin_nota ?? notaBaneada(post.creator_name);` y el bloque JSX `{sinNota && (…)}` (~713-720) entero.
- `invitedCommentIds` pasa a incluir también los `ask`, y se renombra a `gestionadosArriba`, porque ahora son dos casos: al invitado viejo y al que le pedimos la solicitud los dos se gestionan en las secciones de arriba, no en su tarjeta.

```ts
  // Comentarios cuya entrega YA se gestiona en las secciones de arriba, por
  // comment_social_id (estable; el provider_id cambia si la persona pasa a 1er
  // grado). Dos casos: la invitación vieja (Seguimientos) y el pedido de
  // solicitud (Solicitudes pedidas). En los dos, enseñar abajo los controles de
  // envío es el camino a mandar el recurso dos veces.
  const gestionadosArriba = useMemo(
    () => new Set(
      (sendsData?.sends ?? [])
        .filter((s) => s.kind === 'invite' || s.kind === 'ask')
        .map((s) => s.comment_social_id)
    ),
    [sendsData]
  );
```

- Cambiar el prop en el `<CommenterCard>`: fuera `sinNota={sinNota}`, y `invitedCommentIds={invitedCommentIds}` pasa a `gestionadosArriba={gestionadosArriba}`.
- Añadir `onSent` también al pedido: ya está (`onSent={refetchSends}`), y la tarjeta lo llamará al grabar el `ask` para que la fila aparezca arriba sin recargar.
- El texto del tipo lista (~642) termina diciendo "A 1er grado va la lista entera; a los demás, una invitación y la lista al aceptar." → pasa a "A 1er grado va la lista entera; a quien no lo sea se le pide la solicitud, y la lista sale en cuanto la mande."

- [ ] **Step 3: La decisión de canal en la tarjeta**

```ts
  // POR DÓNDE SE LE ESCRIBE. El orden importa y no es arbitrario:
  //
  //  1. 1er grado → DM normal. Nada que decidir.
  //  2. Nos mandó solicitud y sigue pendiente → mensaje normal contestando a esa
  //     solicitud. Es gratis, llega igual, y no hace falta aceptarla.
  //  3. Si no → no hay canal privado. Se le PIDE la solicitud en público.
  //
  // Grado desconocido nunca cae en DM: adivinar mal quema el envío.
  const canal: Canal =
    degree === 1 ? 'dm'
    : invitacionPendiente ? 'dm-solicitud'
    : 'pedir';
```

`kind` desaparece: donde se usaba, va `'dm'` literal. `priorSend` pasa a `sends.find((s) => s.kind === 'dm') ?? null`, y `envioVerificado` igual. `dmSent` se queda como está (mira `dm` e `inmail`: un InMail viejo sigue contando como recurso entregado). `handledInSeguimientos` pasa a leer `gestionadosArriba`.

- [ ] **Step 4: El borrador**

En el efecto del borrador (~1016), fuera las ramas de nota e InMail. Y no se redacta mensaje privado en canal `pedir`, que no tiene dónde ir:

```ts
    if (canal === 'pedir') { setMessage(''); return; }
    const recurso = resolverRecurso(cfg.keyword, cfg.link, cfg.topic);
    if (!recurso) { setMessage(''); return; }
    setMessage(buildDm({ name: thread.author.name, location, topic: recurso.topic, link: recurso.link, voice }));
```

Borrar el estado `subject` / `subjectTouched` y su efecto entero (~1053-1060).

La respuesta precargada pasa a depender del canal: quien va a recibir el recurso lee "Enviado!", y a quien hay que pedirle la solicitud se le pide. Eran las 13 variantes para todos, y en canal `pedir` "Ya lo tienes" es directamente mentira.

```ts
  const [reply, setReply] = useState<string>(() => {
    if (cfg.kind === 'publico') return '';
    // A quien no podemos escribirle no se le dice "enviado": se le pide el paso.
    // La petición no lleva su nombre delante — es una frase larga y con nombre
    // se lee como plantilla de mail merge.
    if (canal === 'pedir' && ownsDm) return buildAskReply().text;
    const name = thread.author.name;
    const base = initialReply();
    return name && thread.author.profile_id ? `${name} ${base.charAt(0).toLowerCase()}${base.slice(1)}` : base;
  });
```

- [ ] **Step 5: `handleReply` graba el pedido**

```ts
  const handleReply = async () => {
    if (!reply.trim()) return;
    if (recursoSinEntregar && !forzarRespuesta) return;
    setReplySending(true);
    setReplyMsg(null);
    try {
      await apiPost(
        `/api/accounts/posts/${postId}/comments/${encodeURIComponent(thread.id)}/reply`,
        { text: reply.trim(), mention }
      );
      setReplySent(true);
      // ⛔ EL RECIBO DEL PEDIDO VA DESPUÉS DE QUE LA RESPUESTA SALGA, NUNCA ANTES.
      // Esta fila es lo que hace que la persona aparezca en «Solicitudes
      // pedidas» cuando mande la suya. Grabarla sin que la respuesta haya salido
      // sería esperar un paso que nadie le ha pedido.
      if (canal === 'pedir' && ownsDm && thread.author.profile_id) {
        try {
          await apiPost('/api/accounts/lead-magnet/ask', {
            post_id: postId,
            comment_id: thread.id,
            provider_id: thread.author.profile_id,
            text: reply.trim(),
            ...(thread.author.name ? { provider_name: thread.author.name } : {}),
            ...(cfg.kind === 'lista' && sector.trim() ? { sector: sector.trim() } : {}),
            ...(cfg.kind === 'lista' && followupText ? { followup_text: followupText } : {}),
          });
          onSent();
          setReplyMsg('✓ Respondido · le he pedido la solicitud, sale arriba en Solicitudes pedidas');
          return;
        } catch (e: any) {
          // La respuesta SÍ salió. Se dice las dos cosas: lo que llegó y lo que
          // hay que hacer a mano, porque sin la fila esta persona no volverá a
          // aparecer sola por ningún lado.
          setReplyMsg(`⚠️ Respondido en LinkedIn, pero NO he podido apuntar el pedido (${e.message}). No va a salir en Solicitudes pedidas: apúntatelo.`);
          return;
        }
      }
      setReplyMsg('✓ Respondido en LinkedIn');
    } catch (e: any) {
      setReplyMsg(`✗ ${e.message}`);
    } finally {
      setReplySending(false);
    }
  };
```

`recursoSinEntregar` (el bloqueo de "no digas enviado antes de enviarlo") deja de aplicar en canal `pedir`: ahí la respuesta NO afirma ningún envío, es la acción entera.

```ts
  const recursoSinEntregar =
    cfg.kind !== 'publico' && canal !== 'pedir' && ownsDm && !!thread.author.profile_id &&
    !alreadySent && !handledInSeguimientos;
```

- [ ] **Step 6: La lista, y `pedir_solicitud` en la IA**

En `handleLista`, la rama `canal !== 'invite'` desaparece. En canal `pedir` la lista no se manda: se guarda para cuando llegue la solicitud.

```ts
      if (canal === 'pedir') {
        // No hay a dónde mandarla todavía. Se guarda montada como follow-up (sin
        // saludo de cero: entrega lo prometido) y sale sola en «Solicitudes
        // pedidas» el día que esta persona mande su solicitud.
        setFollowupText(buildListaDm({ name: thread.author.name, sector: r.sector, companies: r.companies, location, voice, followup: true }));
        setListaMsg(`${r.companies.length} empresas guardadas · se le mandan en cuanto te mande la solicitud`);
        return;
      }
      setMessage(buildListaDm({ name: thread.author.name, sector: r.sector, companies: r.companies, location, voice, followup: false }));
      setMsgTouched(true);
```

En `handleAi`, añadir al body de `/generate`:

```ts
          // Sin contacto no hay envío que prometer: que la respuesta pida el paso.
          pedir_solicitud: canal === 'pedir',
```

- [ ] **Step 7: `handleSendResource` y `marcarManual`**

De `handleSendResource` desaparecen `kind`, el `subject`, el `provider_name` condicionado a `invite` y el `followup_text` condicionado a `invite`. Queda:

```ts
      const res = await apiPost<{ status: 'sent' | 'failed'; error: string | null; verificado: boolean | null }>(
        `/api/accounts/lead-magnet/send`,
        {
          post_id: postId,
          comment_id: thread.id,
          provider_id: thread.author.profile_id,
          kind: 'dm',
          text: message.trim(),
          // Contestar a la solicitud que ELLA nos mandó: mensaje normal, sin
          // aceptarla y sin gastar nada.
          ...(canal === 'dm-solicitud' && invitacionPendiente
            ? { invitation_id: invitacionPendiente }
            : {}),
          ...(thread.author.name ? { provider_name: thread.author.name } : {}),
        }
      );
```

En `marcarManual`, `kind` pasa a `'dm'`.

- [ ] **Step 8: La UI del bloque del recurso**

En canal `pedir` no hay nada que mandar, así que en vez de la caja va una explicación. Sustituir la condición del bloque (~1534) por una rama más:

```tsx
          {cfg.kind === 'publico' ? null : !ownsDm ? (
            <p className="mt-3 pt-3 border-t border-border text-[11px] text-text-muted">
              Aquí solo se responde. El recurso se le manda desde su otro comentario, el de la palabra
              clave, y es ahí donde se le avisa del envío.
            </p>
          ) : handledInSeguimientos ? (
            <p className="mt-3 pt-3 border-t border-border text-[11px] text-accent leading-snug">
              ✓ Ya está en marcha arriba. Cuando te mande la solicitud, el recurso se le manda desde{' '}
              <span className="font-semibold">Solicitudes pedidas</span>. Aquí no, para no mandarlo dos veces.
            </p>
          ) : canal === 'pedir' ? (
            <p className="mt-3 pt-3 border-t border-border text-[11px] text-text-muted leading-snug">
              No es contacto y no te ha mandado solicitud, así que LinkedIn no le entrega un mensaje privado.
              No le mandamos nada: la respuesta de arriba le pide la solicitud, y en cuanto la mande sale en{' '}
              <span className="text-text-secondary font-medium">Solicitudes pedidas</span> con el recurso ya escrito.
            </p>
          ) : (
```

Dentro del bloque que queda (el de `dm` y `dm-solicitud`) se borran: el contador `/300` y `/1900`, la etiqueta `InMail · gasta crédito`, la caja del asunto, la nota de la bandeja de Sales Navigator y las ramas `canal === 'invite'` de los textos. La etiqueta del bloque pasa a `cfg.kind === 'lista' ? 'Lista de empresas por privado' : 'Mensaje privado con el recurso'`, el `✓` a `'Recurso enviado y comprobado en LinkedIn'`, y el botón a `canal === 'dm-solicitud' ? 'Contestar a su solicitud' : 'Enviar DM'`. En el `disabled` del botón desaparece `(canal === 'inmail' && !subject.trim())`.

`DegreeBadge` pasa a:

```tsx
  const via =
    canal === 'dm' ? 'DM'
    : canal === 'dm-solicitud' ? 'mensaje a su solicitud'
    : 'le pedimos solicitud';
  const pista =
    canal === 'dm' ? 'Es contacto de 1er grado: le llega un mensaje privado normal.'
    : canal === 'dm-solicitud' ? 'Te mandó una solicitud y sigue sin aceptar. LinkedIn deja contestarla con un mensaje normal: llega igual y no hace falta aceptarla.'
    : 'Ni sois contacto ni te ha mandado solicitud, así que LinkedIn no le entrega un privado. No le mandamos nada: se le pide que te mande él la solicitud.';
  const resaltado = canal === 'dm' || canal === 'dm-solicitud';
```

El tooltip del filtro por grado (~665-668) menciona "dejar los InMail para el final": pasa a "y dejar para el final a los que hay que pedirles la solicitud".

- [ ] **Step 9: Comprobar que compila**

Run: `cd frontend && npx tsc -b`
Expected: sin errores. (`--noEmit` a secas no comprueba nada en este repo.)

Run: `grep -rn "buildInviteNote\|buildInmail\|asuntoInmail\|buildListaInvite\|notaBaneada\|sin_nota\|kindDeCanal" frontend/src`
Expected: cero resultados.

- [ ] **Step 10: Commit**

```bash
git add frontend/src/components/accounts/LeadMagnetPanel.tsx && git commit -m "feat(leadmagnet): la tarjeta pide la solicitud en vez de invitar" && git push origin main
```

---

## Task 7: Panel — la sección «Solicitudes pedidas»

**Files:**
- Modify: `frontend/src/components/accounts/LeadMagnetPanel.tsx` (añadir el componente junto a `Seguimientos`, y montarlo ~728-730)

**Interfaces:**
- Consumes: `GET /lead-magnet/pendientes-solicitud` (Task 3), `POST /lead-magnet/send` con `kind:'dm'` + `invitation_id`, `POST /lead-magnet/check-accepted`.

- [ ] **Step 1: El componente**

```tsx
interface PedidoRow {
  post_id: string;
  provider_id: string;
  provider_name: string | null;
  sector: string | null;
  // Solo en el tipo lista: la lista entera, montada al pedirle la solicitud.
  followup_text: string | null;
  comment_social_id: string;
  created_at: string;
  dias: number;
  // El id de SU solicitud. Con él, el mensaje sale contestándola: llega igual
  // que un DM y no hay que aceptar nada. null = todavía no la ha mandado.
  invitation_id: string | null;
}

// SOLICITUDES PEDIDAS: la gente a la que le respondimos «mándame solicitud».
//
// El cruce lo hace el backend con UNA llamada por cuenta. Aquí solo se pintan
// los dos cubos: los que ya la mandaron (accionables, con el recurso escrito) y
// los que siguen sin darla. Una persona desaparece de aquí en cuanto se le manda
// el recurso — el backend la excluye en cuanto hay un DM enviado.
function SolicitudesPedidas({ post, creatorId, cfg, voice }: {
  post: GridPost; creatorId: string; cfg: LmConfig; voice: Voice;
}) {
  const { data, loading, refetch } = useApi<{
    llegadas: PedidoRow[]; esperando: PedidoRow[]; aviso: string | null;
  }>(`/api/accounts/lead-magnet/pendientes-solicitud?creator_id=${creatorId}`);

  // Solo las de ESTE post: el endpoint devuelve las de la cuenta entera.
  const llegadas = useMemo(
    () => (data?.llegadas ?? []).filter((f) => f.post_id === post.id), [data, post.id]);
  const esperando = useMemo(
    () => (data?.esperando ?? []).filter((f) => f.post_id === post.id), [data, post.id]);

  const [texts, setTexts] = useState<Record<string, string>>({});
  const [sending, setSending] = useState<string | null>(null);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const [err, setErr] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [ascendidos, setAscendidos] = useState<PedidoRow[]>([]);

  // El texto del recurso. La lista guarda el suyo al pedir la solicitud; el resto
  // se monta aquí con el recurso de la palabra clave.
  const textFor = useCallback((f: PedidoRow): string => {
    if (f.followup_text) return f.followup_text;
    const recurso = resolverRecurso(cfg.keyword, cfg.link, cfg.topic);
    if (!recurso) return '';
    return buildDm({ name: f.provider_name, topic: recurso.topic, link: recurso.link, voice });
  }, [cfg.keyword, cfg.link, cfg.topic, voice]);

  // EL CASO RARO: alguien que acaba siendo contacto por otra vía (lo aceptasteis
  // a mano) desaparece de las solicitudes recibidas y se quedaría en «esperando»
  // para siempre. Esto relee su grado de red y lo sube al cubo accionable, ya sin
  // invitation_id: a un contacto de 1er grado se le manda un DM normal.
  const comprobarGrado = async () => {
    if (esperando.length === 0) return;
    setChecking(true);
    setErr(null);
    try {
      const r = await apiPost<{ results: { provider_id: string; accepted: boolean }[] }>(
        '/api/accounts/lead-magnet/check-accepted',
        { creator_id: creatorId, provider_ids: esperando.map((f) => f.provider_id) }
      );
      const ok = new Set(r.results.filter((x) => x.accepted).map((x) => x.provider_id));
      setAscendidos(esperando.filter((f) => ok.has(f.provider_id)));
      if (ok.size === 0) setErr('⚠️ Ninguno de los que esperan es contacto todavía.');
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setChecking(false);
    }
  };

  const enviar = async (f: PedidoRow) => {
    const text = (texts[f.provider_id] ?? textFor(f)).trim();
    if (!text) return;
    setSending(f.provider_id);
    setErr(null);
    try {
      const res = await apiPost<{ status: 'sent' | 'failed'; error: string | null; verificado: boolean | null }>(
        '/api/accounts/lead-magnet/send',
        {
          post_id: f.post_id, comment_id: f.comment_social_id, provider_id: f.provider_id,
          kind: 'dm', text,
          ...(f.invitation_id ? { invitation_id: f.invitation_id } : {}),
          ...(f.provider_name ? { provider_name: f.provider_name } : {}),
        }
      );
      if (res.status === 'sent') {
        setSentIds((s) => new Set(s).add(f.provider_id));
        if (res.verificado !== true) {
          setErr(`⚠️ Mandado a ${f.provider_name || 'esta persona'}, pero no he podido comprobar que esté en LinkedIn${res.error ? ` (${res.error})` : ''}. Míralo en su chat antes de darlo por bueno.`);
        }
      } else setErr(res.error || 'LinkedIn rechazó el mensaje');
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSending(null);
    }
  };

  const accionables = [...llegadas, ...ascendidos.filter((a) => !llegadas.some((l) => l.provider_id === a.provider_id))];
  const pendientes = esperando.filter((f) => !ascendidos.some((a) => a.provider_id === f.provider_id));

  if (loading || (accionables.length === 0 && pendientes.length === 0)) return null;

  return (
    <div className="bg-bg-card border border-accent/30 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium">Solicitudes pedidas</span>
        <span className="text-[11px] text-text-muted">
          · {accionables.filter((f) => !sentIds.has(f.provider_id)).length} listo
          {accionables.filter((f) => !sentIds.has(f.provider_id)).length === 1 ? '' : 's'} para enviar
          {pendientes.length > 0 ? ` · ${pendientes.length} sin dar el paso` : ''}
        </span>
        <button
          onClick={() => { refetch(); setAscendidos([]); }}
          className="ml-auto text-[11px] font-medium px-2.5 py-1 rounded bg-accent text-white hover:brightness-110 transition whitespace-nowrap"
          title="Vuelve a mirar en LinkedIn quién te ha mandado ya la solicitud"
        >
          ↻ Mirar si han mandado solicitud
        </button>
      </div>
      <p className="text-[11px] text-text-muted leading-snug">
        A esta gente le pediste que te mandara ella la solicitud. En cuanto la manda sube aquí arriba con el
        recurso ya escrito: se le contesta a su propia solicitud, así que llega sin aceptarla y sin gastar nada.
      </p>
      {data?.aviso && <p className="text-[11px] text-amber-400 leading-snug">⚠️ {data.aviso}</p>}
      {err && (
        <p className={err.startsWith('⚠️')
          ? 'text-[11px] text-amber-400 font-medium leading-snug'
          : 'text-[11px] text-red-400 font-medium'}>
          {err.startsWith('⚠️') ? err : `✗ ${err}`}
        </p>
      )}

      <div className="space-y-2">
        {accionables.map((f) => {
          if (sentIds.has(f.provider_id)) {
            return (
              <div key={f.provider_id} className="flex items-center gap-2 flex-wrap text-sm border-t border-border pt-2">
                <span className="font-medium">{f.provider_name || 'Sin nombre'}</span>
                {f.sector && <span className="text-[11px] text-text-muted">· {f.sector}</span>}
                <span className="ml-auto text-[11px] text-accent">✓ Recurso enviado</span>
              </div>
            );
          }
          const val = texts[f.provider_id] ?? textFor(f);
          return (
            <div key={f.provider_id} className="border-t border-border pt-2 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm">{f.provider_name || 'Sin nombre'}</span>
                {f.sector && <span className="text-[11px] text-text-muted">· {f.sector}</span>}
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/10 text-accent border border-accent/30">
                  {f.invitation_id ? '✓ te ha mandado solicitud' : '✓ ya sois contacto'}
                </span>
              </div>
              <textarea
                value={val}
                onChange={(e) => setTexts((t) => ({ ...t, [f.provider_id]: e.target.value }))}
                disabled={sending === f.provider_id}
                className={`w-full text-sm bg-bg-primary border border-border rounded-md px-3 py-2 resize-y focus:outline-none focus:border-accent disabled:opacity-50 ${
                  cfg.kind === 'lista' ? 'min-h-[240px]' : 'min-h-[80px]'
                }`}
              />
              <button
                onClick={() => enviar(f)}
                disabled={sending === f.provider_id || !val.trim()}
                className="text-xs px-3 py-1.5 rounded-md bg-accent text-white hover:bg-accent-light disabled:opacity-50 transition-colors"
              >
                {sending === f.provider_id ? 'Enviando y comprobando…' : f.invitation_id ? 'Contestar a su solicitud' : 'Enviar DM'}
              </button>
            </div>
          );
        })}

        {pendientes.length > 0 && (
          <div className="border-t border-border pt-2 space-y-1">
            {pendientes.map((f) => (
              <div key={f.provider_id} className="flex items-center gap-2 flex-wrap text-sm">
                <span className="font-medium">{f.provider_name || 'Sin nombre'}</span>
                {f.sector && <span className="text-[11px] text-text-muted">· {f.sector}</span>}
                <span className="ml-auto text-[11px] text-text-muted">
                  sin mandar solicitud · {f.dias === 0 ? 'hoy' : `hace ${f.dias} día${f.dias === 1 ? '' : 's'}`}
                </span>
              </div>
            ))}
            <button
              onClick={comprobarGrado}
              disabled={checking}
              className="text-[11px] px-2 py-1 rounded border border-border text-text-muted hover:text-accent hover:border-accent/40 disabled:opacity-50 transition-colors"
              title="Por si alguno ya es contacto vuestro por otra vía: relee su grado de red en LinkedIn"
            >
              {checking ? 'Comprobando…' : '¿Alguno ya es contacto?'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Montarlo**

Junto al `Seguimientos` que ya está (~728), y por lo mismo: fuera del tipo público, que no tiene canal privado.

```tsx
      {cfg.kind !== 'publico' && (
        <>
          <SolicitudesPedidas post={post} creatorId={creatorId} cfg={cfg} voice={voice} />
          <Seguimientos post={post} creatorId={creatorId} cfg={cfg} voice={voice} />
        </>
      )}
```

Y al comentario de `Seguimientos` se le añade que es el bloque HISTÓRICO: sirve a las invitaciones que salieron antes del 17/08, y no se crean más.

- [ ] **Step 3: Comprobar que compila**

Run: `cd frontend && npx tsc -b`
Expected: sin errores.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/accounts/LeadMagnetPanel.tsx && git commit -m "feat(leadmagnet): seccion de solicitudes pedidas con su seguimiento" && git push origin main
```

---

## Task 8: La receta, que es donde vive la doctrina

**Files:**
- Modify: `docs/skills/lead-magnet-web.md`
- Modify: `docs/skills/post-workflow.md` (solo si su receta de lead magnet menciona la invitación o el InMail)

**Interfaces:**
- Consumes: nada de código.

- [ ] **Step 1: Buscar dónde se dice lo viejo**

Run: `grep -rn "invitaci\|InMail\|inmail\|nota" docs/skills/*.md`
Expected: localizar los párrafos que describen la entrega del recurso por invitación con nota o por InMail.

- [ ] **Step 2: Reescribirlos**

En cada sitio donde la receta diga que a los que no son contacto se les manda invitación con nota o InMail, pasa a decir que se les pide la solicitud, que el recurso sale cuando la mandan, y por qué: cupo semanal, baneo de la cuenta de Unai el 14/08, y créditos de InMail contados. Añadir el aviso operativo de que la entrega ya no es inmediata para quien no es contacto, y que eso hay que mirarlo en el ratio del primer lead magnet.

- [ ] **Step 3: Commit**

```bash
git add docs/skills && git commit -m "docs(leadmagnet): la receta ya no manda invitaciones ni InMails" && git push origin main
```

---

## Self-review

- **Cobertura del spec:** el `ask` y su migración (T1, T2), la detección (T3), la entrega reutilizando `/send` (T3+T7), el copy con la excusa de LinkedIn (T5), la respuesta de IA que cierra pidiendo (T4), el panel sin nota ni InMail (T6), la sección nueva (T7), y el `verificarMensaje` que NO se toca (T2 Step 3). El riesgo abierto del segundo mensaje queda escrito en el spec y no lo implementa ninguna tarea, a propósito: hay que probarlo en real antes.
- **Consistencia de nombres:** `buildAskReply` (T5) es lo que importa T6. `POST /lead-magnet/ask` (T2) es lo que llama `handleReply` (T6). `PedidoRow` (T7) casa campo a campo con lo que devuelve `/pendientes-solicitud` (T3), `invitation_id` incluido. `gestionadosArriba` sustituye a `invitedCommentIds` en los dos sitios donde se usa (T6 Steps 2 y 3).
