# Lead magnet: se acabó agregar a nadie

**Fecha:** 2026-08-17 · **Decidido con:** Iker

## El problema

Hoy, para entregar el recurso a quien comenta la palabra clave, la herramienta usa
cuatro canales. Dos de ellos nos ponen a nosotros a empujar:

- **Invitación con nota** — gasta el cupo semanal de invitaciones y en la cuenta de
  Unai está prohibida desde el baneo del 2026-08-14 (LinkedIn se las traga en
  silencio).
- **InMail** — gasta créditos de Premium/Sales Navigator, que son pocos.

Las dos escalan mal: el cupo se acaba y los créditos también. Y ninguna de las dos
construye red, porque una invitación aceptada es un contacto pero una invitación
que se queda pendiente no es nada.

## La decisión

**Nosotros no agregamos a nadie nunca más.** Quien quiera el recurso y no pueda
recibirlo por privado, que nos mande él la solicitud. Cuando llegue, se le contesta
a esa solicitud con el recurso — sin aceptarla y sin gastar nada.

Tres canales, y los tres gratis:

| Situación de la persona | Canal | Qué sale |
|---|---|---|
| Contacto de 1er grado | `dm` | DM normal |
| Nos tiene una solicitud pendiente | `dm-solicitud` | Mensaje contestando a su solicitud |
| Ni contacto ni solicitud | `pedir` | **Nada privado.** Solo la respuesta pública pidiéndole la solicitud |

`invite` e `inmail` se retiran como canales de envío. Sus filas históricas se
siguen leyendo (la pestaña Seguimientos actual sigue sirviendo a quien ya fue
invitado antes de este cambio), pero no se crean más.

### Por qué no se acepta la solicitud

Decisión explícita de Iker: la herramienta **no acepta**. Contesta y deja la
solicitud como está. Aceptar en masa es lo que dispara los límites de LinkedIn, y
el mensaje llega igual contestando a la solicitud pendiente.

**Riesgo abierto, sin verificar:** que un SEGUNDO mensaje, días después, salga por
ese mismo hilo mientras la solicitud siga pendiente. No está comprobado en real. Si
no sale, cualquier follow-up comercial posterior obligará a aceptar. Hay que
probarlo con una cuenta y una persona real antes de construir nada encima.

### Riesgo de negocio, aceptado

Hoy la nota lleva el enlace DENTRO y llega aunque la persona no acepte nunca. A
partir de aquí, quien no mande solicitud no recibe nada: la entrega deja de ser
inmediata y pasa a depender de un paso suyo. Hay que mirar el ratio
comentarios→recurso entregado del primer lead magnet con esto para saber cuánto
cuesta el cambio.

## Arquitectura

### 1. El estado nuevo: la fila `ask`

`lead_magnet_sends` gana un cuarto `kind`: **`ask`**. Es el único que NO manda nada
a LinkedIn — es el recibo de "a esta persona se le pidió la solicitud". Sin él, la
detección posterior no tiene contra qué cruzar.

- **Endpoint:** `POST /api/accounts/lead-magnet/ask`
  Body: `{ post_id, comment_id, provider_id, text, provider_name?, sector?, followup_text? }`
  No llama a Unipile. Solo hace el INSERT ... ON CONFLICT sobre
  `(post_id, provider_id, kind)`, igual que `/send`.
- **Quién lo llama:** el panel, justo después de que la respuesta pública al
  comentario salga bien. Si la respuesta falla, no hay fila: no se puede quedar
  registrado como "pedido" algo que la persona no ha leído.
- **`sector` y `followup_text`** se guardan aquí porque el lead magnet de tipo
  "lista" los necesita para saber qué lista mandarle el día que llegue la
  solicitud. En la entrega se usa `followup_text` si existe, y si no se regenera
  desde `sector`.

**Migración (v37):** el `CHECK (kind IN ('dm','invite','inmail'))` pasa a incluir
`'ask'`. Se hace con el mismo patrón defensivo del v36 — buscar el constraint por
su DEFINICIÓN y no por su nombre, porque un `DROP CONSTRAINT IF EXISTS` con el
nombre equivocado es un no-op silencioso y el constraint viejo seguiría rechazando
las filas nuevas.

### 2. La detección

`GET /api/accounts/lead-magnet/pendientes-solicitud?creator_id=`

Cruza las filas `ask` que aún no tienen un `dm` enviado detrás contra
`unipileService.getReceivedInvitations(accountId)` — **una llamada por cuenta, no
una por persona**: la lista de solicitudes recibidas es la misma para los 400
comentarios de un post. El cruce es por `provider_id`, que es el mismo id que trae
el comentario.

Devuelve dos cubos:

- **`llegadas`** — su `provider_id` está en las solicitudes recibidas. Cada una con
  su `invitation_id` dentro, para que la entrega salga contestando a la solicitud.
- **`esperando`** — todavía sin noticias, con los días transcurridos desde que se
  le pidió.

Si Unipile falla al leer las invitaciones, se devuelve 200 con `llegadas: []` y un
`aviso`, igual que hace `/canal`: la pantalla sigue en pie y lo dice.

**El caso raro:** alguien que se conecta por otra vía (lo acepta un humano a mano)
desaparece de las solicitudes recibidas y se quedaría en `esperando` para siempre.
Para eso el cubo `esperando` lleva un botón que reutiliza el `check-accepted` que
ya existe (relee `network_distance`, tope de 40, una llamada por persona): quien
salga de 1er grado se mueve a `llegadas` sin `invitation_id`, y su entrega sale
como DM normal.

### 3. La entrega

No hay endpoint nuevo. Se reutiliza `POST /lead-magnet/send` con `kind:'dm'` y el
`invitation_id` cuando lo haya — que es exactamente lo que ya hace hoy el canal
`dm-solicitud`, y que ya verifica releyendo LinkedIn después de mandar.

### 4. El copy

En `leadMagnetCopy.ts`:

- **Fuera:** `buildInviteNote`, `buildListaInvite`, `buildInmail`, `asuntoInmail`,
  `notaBaneada` / `CUENTAS_SIN_NOTA`. Con la nota retirada de todas las cuentas, la
  lista de cuentas baneadas deja de significar nada.
- **Dentro:** `buildAskReply({ voice, recent, rng })`, un banco de ~10 variantes con
  el mismo antirrepetición que `buildReply` (no repetir variante dentro del mismo
  post, y reset cuando se agotan).

Forma elegida por Iker: **con la excusa de LinkedIn**. Se explica por qué se pide,
para que no huela a peaje:

```
Mandame solicitud y te lo paso, que LinkedIn no me deja escribirte si no somos contacto
Te lo mando en cuanto me llegue tu solicitud, LinkedIn no me deja escribir a quien no es contacto
No me deja LinkedIn escribirte sin ser contactos. Mandame solicitud y va para ti
```

Se pide **solicitud de contacto**, nunca "sígueme": un seguidor sigue siendo de 2º
o 3er grado y a ese no se le puede escribir. La distinción es la razón de ser de
todo esto.

**Comentarios con sustancia** (los que hoy llevan respuesta escrita por IA en
`replyGenerator.ts`) siguen llevándola, pero con una instrucción nueva: cuando el
canal sea `pedir`, la respuesta **cierra siempre pidiendo la solicitud**. La
respuesta de IA sin esa línea deja al comentarista sin saber qué hacer.

### 5. Qué se toca en el panel

`LeadMagnetPanel.tsx`:

- `Canal` pasa a `'dm' | 'dm-solicitud' | 'pedir'`. `kindDeCanal` desaparece: los
  dos primeros son `dm` y el tercero no manda nada.
- La tarjeta en canal `pedir` no pinta caja de mensaje privado ni botón de enviar.
  Solo la respuesta pública, ya escrita con `buildAskReply`.
- Fuera el estado del asunto del InMail y su caja.
- `DegreeBadge` en `pedir`: "le pedimos solicitud", con el porqué en el tooltip.

`shared.tsx` / la sección de Seguimientos gana el bloque **Solicitudes pedidas**,
con los dos cubos. El bloque viejo de invitaciones aceptadas sigue donde está,
sirviendo a las filas `invite` históricas.

### 6. Qué NO se toca

- El verificador de mensajes (`verificarMensaje`) mantiene el barrido de la SEGUNDA
  bandeja aunque naciera para los InMails: un mensaje contestando a una solicitud
  pendiente puede aparecer en una bandeja distinta a la del chat normal, así que
  quitarlo arriesgaría marcar como no entregado algo que sí salió.
- El modo `publico` del lead magnet (el recurso va en la propia respuesta pública)
  no cambia: ahí nunca hubo canal privado.
- Las filas históricas `invite` e `inmail` y todo lo que las lee.

## Verificación

No hay framework de tests en el repo. La verificación es:

1. `cd backend && npx tsc --noEmit` compila.
2. `cd frontend && npx tsc -b` compila (en este repo `--noEmit` a secas no comprueba
   nada, ver memoria del proyecto).
3. La migración corre contra la base sin romper el arranque.
4. Prueba en real: un comentario de alguien de 3er grado → sale la respuesta
   pidiendo solicitud → aparece en `esperando` → cuando mande la solicitud, salta a
   `llegadas` y el DM sale y se verifica.
5. **Pendiente de probar aparte:** el segundo mensaje por el hilo de una solicitud
   que sigue pendiente (ver riesgo abierto arriba).
