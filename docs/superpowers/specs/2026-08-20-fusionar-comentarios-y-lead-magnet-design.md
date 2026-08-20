# Fusionar Comentarios y Lead Magnet en una sola pestaña

**Fecha:** 2026-08-20 · **Pedido por:** Iker

## El problema

El seguimiento de un lead magnet solo existe si entras a la pestaña Lead Magnet,
eliges cuenta, eliges post y pulsas un botón. Cuatro pasos deliberados para ver
si alguien te ha mandado la solicitud. Iker: *"a veces se me olvida entrar a la
sección de lead magnets y perdemos posibles leads"*.

Mientras tanto, la pestaña Comentarios ya hace el barrido caro —lee los
comentarios de los últimos 30 días de cada cuenta— y no sabe nada de todo eso.

Y desde el 20/08 el pilar del post se puede corregir a mano desde Accounts, así
que `pillar = 'lead_magnet'` ya es un dato fiable: la herramienta puede saber
sola qué post es un lead magnet, sin que nadie lo elija.

## Decisiones (Iker, 2026-08-20)

1. **Fusión completa de una vez.** No por fases.
2. **La pestaña Lead Magnet desaparece.** Quedan dos: Accounts y Comments. El
   nombre **Comments se queda** (Iker, 2026-08-20): un lead magnet no deja de ser
   comentarios, y renombrar la pestaña obligaria a reaprender donde esta lo de
   siempre a cambio de nada.
3. **Un post entra en la lista si debe CUALQUIER cosa**, no solo si tiene
   comentarios sin responder.
4. **El tipo de lead magnet se guarda en la base de datos**, no en el navegador.
5. **Los posts salen plegados**, con una fila-resumen que se despliega.

## La trampa que decide medio diseño

Comentarios hoy filtra por `answered_by_author`: un post entra solo si le quedan
comentarios sin responder. En un lead magnet eso es falso — contestar en público
y entregar el recurso por privado son dos trabajos distintos. Un lead magnet
donde ya contestaste a todo el mundo pero debes 12 recursos **desaparecería de
la lista**, que es exactamente el lead que se quiere dejar de perder.

Por eso «pendiente» pasa a significar tres cosas, y basta con una:

| señal | de dónde sale | aplica a |
|---|---|---|
| comentarios sin responder | `answered_by_author` (hoy) | todos los posts |
| recursos sin entregar | comentaristas sin `lead_magnet_sends.kind='dm'` enviado | solo lead magnet |
| solicitudes ya llegadas | `kind='ask'` sin DM detrás + invitación recibida | solo lead magnet |

## Diseño

### La pantalla

La pestaña **Comments**, la misma y con el mismo nombre. Lo que cambia es lo
que hay dentro.

**Arriba**, además del selector de cuenta con «Todas», un bloque de
**solicitudes** de todas las cuentas del filtro: quién ya mandó la solicitud, con
el recurso escrito y el botón de enviar. Ya no depende de entrar en ningún post.

**Debajo**, la lista de posts plegados, una fila cada uno:

```
Helena Baviera · hace 2 días · [Lead Magnet]   12 sin responder · 5 recursos sin mandar
Iker · hace 4 días · [Meme]                    3 sin responder
```

Al desplegar:

- post normal → sus `ThreadCard` de hoy, sin un solo cambio
- lead magnet → barra de config compacta + filtro por grado + sus `CommenterCard`

### El backend

`GET /api/accounts/comments/pending` se AMPLIA (misma ruta, no una nueva: es la
misma pregunta, «que me queda por hacer en mis posts recientes»). Misma ventana de posts (últimos 30 días, mínimo 10, máximo
30 por cuenta) y mismo barrido de comentarios, con dos añadidos:

1. Lee `lead_magnet_sends` de cada post (consulta a la BD, barata) y calcula
   `recursos_pendientes`.
2. Devuelve el post si debe cualquiera de las tres cosas de la tabla de arriba.

**Una sola llamada `getReceivedInvitations` por cuenta**, que alimenta a la vez
el bloque de solicitudes y el `canal` de cada tarjeta. Hoy son DOS llamadas
pidiendo exactamente lo mismo: `/lead-magnet/canal` y
`/lead-magnet/pendientes-solicitud` llaman las dos a `getReceivedInvitations`.

**Excepción a la ventana de 30 días:** un post con pilar `lead_magnet` y algo
pendiente entra SIEMPRE, sin límite de fecha. Hoy eso no importaba porque
existía la pestaña Lead Magnet para ir a buscarlo a mano; al borrarla, un lead
magnet de hace dos meses con gente esperando se perdería para siempre.

### Lo que NO se automatiza, y por qué

`check-accepted` («¿alguno ya es contacto?») es **una llamada a Unipile por
persona**, con tope de 40. Con 20 personas esperando en tres cuentas son 60
llamadas cada vez que se abre la pestaña. Se queda como botón manual.

Las **solicitudes llegadas** sí salen ya refrescadas: eso es una sola llamada
por cuenta.

### El tipo de lead magnet, a la base

Columna nueva `posts.lead_magnet_config JSONB` con `{kind, link, topic, keyword}`.
Hoy vive en `localStorage` con clave por post.

Migración silenciosa: al abrir un post cuya columna está vacía, el frontend sube
lo que tenga en `localStorage`. Sin pantalla de migración y sin perder lo ya
configurado.

`kind` por defecto `'dm'`, que es el 90% y el único que se autodetecta
(`detectarRecurso` saca el recurso del texto del post). `lista` y `publico` se
eligen una vez y se quedan.

### Cómo se hace sin romper nada

**Los componentes se MUEVEN, no se reescriben.** Primer paso del trabajo, y en
su propio commit: sacar de los dos ficheros gordos, con el cuerpo intacto:

- de `RepliesPanel.tsx` → `PostGroup`, `ThreadCard`, `SubReplyBox`
- de `LeadMagnetPanel.tsx` → `CommenterCard`, `SolicitudesPedidas`,
  `Seguimientos`, `KindPicker`, `DegreeBadge`

Ese commit no cambia ni una línea de lógica: solo imports y exports. Toda la
mecánica que ya funciona —generar borrador, mencionar al primero sin contestar,
sub-respuestas, reacciones con emoji, las tres defensas contra el doble envío,
la verificación del envío— sigue siendo el mismo código, no una copia.

Los endpoints `/lead-magnet/*` (send, ask, lista, reverificar, check-accepted,
commenter, sends) **no se tocan**. Son las acciones y funcionan. Lo único que
cambia es quién las llama.

### Las tres defensas contra el doble envío

Se mantienen intactas, y hay que entenderlas para no romperlas al fusionar:

1. `gestionadosArriba` — un comentario con un `ask` o un `invite` detrás no
   enseña controles de envío abajo: su entrega la gobierna el bloque de
   seguimiento. Indexado por `comment_social_id`, **no** por `provider_id`,
   porque LinkedIn cambia el `provider_id` cuando la persona pasa a 1er grado.
2. `sendsByComment` — los envíos se buscan por comentario Y por persona, por el
   mismo motivo.
3. `dmOwnerByPerson` — el recurso vive en UNA sola tarjeta por persona, para que
   quien comentó dos veces no lo reciba dos veces.

Al fusionar, el bloque de solicitudes de arriba y las tarjetas de abajo pueden
enseñar a la misma persona. La regla de hoy se conserva: **quien está arriba no
lleva botón de enviar abajo.**

### Marcha atrás

**Todo va a `main`, sin rama.** Railway despliega desde `main` y es donde Iker
prueba: una rama significaria que no puede probarlo, que es peor red de
seguridad que ninguna.

La red es otra: **la pestaña Lead Magnet se queda VISIBLE**, marcada como
«antiguo», hasta que Iker haya usado la vista nueva un dia y dé el visto bueno.
Las dos conviven y se comparan con datos reales. No se borra nada hasta el OK.

## Fuera de alcance

- Adivinar si un lead magnet es de tipo Lista o Público. El pilar dice que ES un
  lead magnet, no de cuál de los tres tipos.
- Tocar el clasificador de pilares.
- Cambiar cualquier endpoint de acción (`send`, `reply`, `react`, `ask`, …).

## Verificación

El repo no tiene tests. Se comprueba con:

1. `tsc -b` (frontend) y `tsc --noEmit` (backend) limpios en lo tocado.
2. **Diff del commit de extracción**: tiene que ser solo imports/exports. Si
   toca una línea de lógica, está mal hecho.
3. En el navegador, con la API simulada, la lista de comprobación completa:
   responder un comentario principal, responder una sub-respuesta, reaccionar
   con emoji, generar borrador con IA, mandar un recurso por DM, pedir una
   solicitud, y que quien está en el bloque de arriba NO tenga botón de enviar
   abajo.
4. Iker lo usa un día antes de borrar nada.
