# Doble spam ninja: el segundo bloque enlaza al correo

> **Fecha:** 2026-08-18 · **Pide:** Iker · **Estado:** aprobado el 2026-08-18

## El problema

Todo el alcance de LinkedIn desemboca hoy en dos puertas caras: descargar un
recurso (comentario + solicitud + gate) o rellenar el formulario de agendar. Las
dos piden mucho de alguien que acaba de conocernos.

El correo es el paso anterior: menos fricción, primer contacto más probable, y
desde ahí ya trabaja el email marketing que ya existe. Falta la puerta barata.

## La solución

Un **segundo spam ninja** en el mismo post, con la forma canónica de
`global §4.4b` sin tocar nada, que enlaza a `recursos.neety.com/correo/` en vez
de a `/agendar/`.

### Posición

```
[cuerpo]
[NINJA 1 · agendar]      ← no se mueve de su posición canónica por pilar
[>=2 líneas de cuerpo]   ← nunca pegados
[NINJA 2 · correo]
[>=1 línea de cuerpo]
[cierre punchy]          ← intacto, en su línea
```

El de agendar no se mueve porque es la única posición medida que tenemos (antes
del carácter 650 en prosa, después del reveal en peloteo). El nuevo ocupa el
hueco que sobra, y nunca puede ser el último ni el penúltimo bloque: el post
sigue cerrando con la frase suelta.

### Alcance por pilar

| Pilar | Bloque 1 | Bloque 2 | Motivo |
|---|---|---|---|
| HISTORIA | agendar | ✅ correo | El pilar busca cercanía: la newsletter es la continuación natural. |
| DESPIECE | agendar | ✅ correo | Cuerpo largo, sitio de sobra. |
| INSIGHT / otros con cuerpo | agendar | ✅ correo | — |
| EVENTO | Luma | ✅ correo | Máximo 2 enlaces: el de Luma ocupa el hueco de agendar. |
| MEME | agendar | ⚠️ solo si el post entero cabe en 450 caracteres | Los 18 memes de <=450 tienen mediana de 11.602 impresiones contra 3.760 de los de 451-700. Dos bloques son ~270 caracteres con las URLs. |
| MAPA | ultra ninja | ❌ | El ultra ninja rinde porque nada en el post huele a venta, y es el pilar que más clics da del histórico. El correo va en la PÁGINA del mapa. |
| "LOS 10" | agendar | ❌ | Único pilar con quejas reales de CEOs. El diagnóstico escrito: "un homenaje que acaba en un enlace convierte a la empresa mencionada en decorado de un anuncio". Dos enlaces lo duplican sobre 10 personas mencionadas con nombre. |
| LEAD MAGNET | ❌ | ❌ en el post | Su motor es el conteo de comentarios y cualquier enlace lo parte. El correo entra por el DM privado (que ya lleva ninja) y por el gate, donde el consentimiento de newsletter pasa a obligatorio. |

### El copy

- El gancho tiene dos piezas punchy, el **objeto** y el **verbo** (`§4.4b`).
  **El bloque 1 se queda una y el bloque 2 la otra.** Nunca la misma raíz en los
  dos: dos bloques colgando de la misma palabra se leen como un eco.
- Si el gancho solo da una pieza, el bloque 2 tira de FOMO con una palabra del
  cuerpo.
- **El dolor NO es el mismo.** El de agendar es la identificación (a quién
  vender, quién firma dentro). El del correo es enterarte el último: la IA está
  cambiando cómo se vende y tú lo lees en LinkedIn seis meses tarde.
- **Prohibidas las palabras `suscríbete` y `newsletter` dentro del bloque.** A un
  director comercial de 55 años se le dice "esto lo mando por correo antes que
  aquí". Suena a persona, no a formulario.
- Lista de frases quemadas propia (`SPAM_QUEMADO_CORREO`), igual que la de
  agendar. Sin ella, en un mes todos los posts dicen lo mismo.

### La landing

`recursos.neety.com/newsletter/` canónica (la que indexa Google y la que casa con
el `utm_source=newsletter` de MailerLite) + **alias 301 desde `/correo/`**, que es
la que se escribe en los posts: diez caracteres menos en una línea con tope de 55
y una palabra que un industrial de 55 años entiende a la primera.

- Formulario centrado, sin nav, sin cards, sin proof block. La página es el
  formulario.
- Campos: **Nombre + Correo** (misma fila, dos columnas, como los gates) + el
  desplegable **"¿Cómo nos conociste?"** del formulario de agendar. Ese
  desplegable es el que permite segmentar: la mayoría vendrán de LinkedIn, pero
  no todos.
- Consentimiento de newsletter **obligatorio y no premarcado** (premarcarlo es
  nulo por RGPD). Los dos consentimientos que ya lleva el formulario se quedan.
- CTA que no sea "Enviar".
- **Notificación a Google Chat igual que los demás formularios**, y alta en
  MailerLite en su propio grupo con el origen.
- Al enviar: deja la cookie `neety_gate` y lleva al listado de los 7 recursos. La
  cookie ya desbloquea todas las guías, así que no se regala nada nuevo, pero
  convierte "déjame el correo" en "déjame el correo y llévate la biblioteca".

## Los riesgos, dichos antes

1. **Dos puertas reparten el clic.** Toda la doctrina del ninja está construida
   sobre una sola. La auditoría del 12/08 mide que cuando la puerta está peor
   puesta el post gusta más y se pincha menos (eng/1k x4, clics de 142 a 4). El
   que puede perder es `agendar`, que es el caro.
2. **En meme cuesta alcance.** Ver la tabla de arriba.
3. **LinkedIn no va a desglosar los clics.** La herramienta guarda un solo
   `link_url` por post. El desglose sale de GA4 (las dos URLs son distintas, se
   separan solas por landing page, sin UTM feo en el post) y de las altas en
   MailerLite.

## Cómo se decide si se queda

La casilla es **clics a `/agendar/` por post, antes contra después**. Si caen más
de un tercio y las altas de correo no lo compensan, el bloque 2 se retira de los
pilares que más convierten y se queda solo en historia y despiece.

## Qué se toca

- `docs/skills/global-instructions.md` — nueva `§4.4e`, y la tabla de "Dónde va
  (por pilar)" de `§4.4b` con la columna del bloque 2.
- `docs/skills/post-workflow.md` — el paso del ninja en cada runbook y el
  planificador semanal.
- `docs/skills/lead-magnet-web.md` — el consentimiento obligatorio en el gate y
  el ninja de correo en el DM.
- `docs/skills/email-marketing.md` — de dónde entran ahora los suscriptores.
- `scripts/validar-post.py` — los checks nuevos.
- `backend/src/services/postPrompt.ts` y el `SYSTEM_PROMPT` de
  `backend/src/routes/chat.ts` — el cerebro en producción.
