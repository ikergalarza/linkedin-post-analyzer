# CORPUS: los correos que hemos enviado de verdad

> **name:** corpus-correos-enviados
> **description:** El texto LITERAL de cada correo que ha salido de Neety, con sus métricas reales. Es el equivalente de `swipe-file.md` para email: nuestros propios correos, no los de otros.
> **when-to-use:** Cargar SIEMPRE que haya que reescribir, versionar o continuar un correo que ya salió. Antes de tocar una línea de un correo enviado, se lee aquí el original.

---

## Por qué existe

El 2026-08-20, al ir a reescribir el correo 0 para Brevo, resultó que **el texto exacto de lo que se había enviado no estaba en ninguna parte del repo.** Estaba solo dentro de la cuenta cancelada de MailerLite, a la que se sigue pudiendo entrar por suerte.

`email-marketing §5c-0` tiene el DISEÑO del correo (asunto, remitente, el GIF, la mecánica de la respuesta) pero no el cuerpo tal y como salió. Y reescribir de memoria un correo que funcionó es la mejor forma de perder lo que lo hizo funcionar.

**Regla: cuando se apruebe y se envíe un correo, su texto literal se pega aquí el mismo día.**

---

## Kaixito 01 · el correo 0 segmentador

**Enviado:** tanda 1 el 2026-08-07 09:23 (54 destinatarios) · tanda 2 el 2026-08-10 11:51 (137)
**Remitente:** Kaixito, la mascota de Neety
**Métrica declarada:** las RESPUESTAS (el correo iba sin enlaces en el cuerpo, salvo la PPD)

### Métricas reales

| | Tanda 1 | Tanda 2 |
|---|---|---|
| Enviados | 54 *(47 + 5 testers)* | 137 |
| Entregados | 52 (96,3%) | 133 (97,08%) |
| Aperturas | 25 (46,3%) · a 4 días | 38 (27,7%) · a 21 h |
| Clics de contenido | 4 | 1 |
| Rebotes duros | 2 (3,7%) | 4 (2,92%) |
| Bajas | 0 | 5 (3,65%) |
| Denuncias de spam | 0 | 0 |
| **Respuestas** | **0** | **0** |

**Acumulado: 191 enviados · 46% y 28% de aperturas · 1 reunión agendada · 0 denuncias · 0 RESPUESTAS.**

### El asunto

```
¿no te acuerdas de mí?
```

⚠️ **No coincide con el diseñado en `§5c-0`, que decía `tú quién eres`.** El que salió lleva signos de interrogación y una palabra más. Es el que produjo el 46% de aperturas, así que manda este sobre el documentado.

### El preheader

```
Normal, es la primera vez que te escribo.
```

⚠️ **Casi se pierde.** No estaba en el cuerpo que se rescató, porque el preheader no se ve al abrir el correo: solo aparece en la bandeja, detrás del asunto. Iker lo cazó mirando una captura de Gmail.

**Es una pieza de copy, no un relleno**, y hace lo que tiene que hacer un preheader: **responder al asunto en vez de repetirlo.** `¿no te acuerdas de mí?` → `Normal, es la primera vez que te escribo.` El chiste se completa en la bandeja, antes de abrir.

📌 **Regla: el preheader se guarda SIEMPRE junto al asunto y el cuerpo.** Es el segundo texto que más se lee (lo ven todos los que abren y todos los que no) y es el que más fácil se pierde, porque no está dentro del correo.

### El cuerpo, literal

```
Tranquilo, que no me he colado en tu bandeja.

Bueno, un poco sí.

Soy Kaixito, la mascota de Neety.
Aquí buscamos las empresas que de verdad te pueden comprar.

Y a la persona exacta con la que tienes que hablar dentro.

Me toca ordenar los correos que nos dejaron el año pasado.
Llevo toda la semana con el libro abierto buscándote.

[GIF: Kaixito estresado hojeando el libro]

Y no hay manera.

Que coincidimos en algo lo sé.

Igual nos leíste por LinkedIn.
Igual te bajaste algo de nuestra web.
Igual coincidimos en un evento o en un webinar.

Pero cuál de todas, ni idea.

Así que te lo pregunto directo.
Con una palabra me vale.

Pulsa responder y dime: web, linkedin, evento, webinar o ni idea.

Y dejo de mandarte cosas que no te tocan.

Kaixito, la mascota de Neety

PD. Si respondes ni idea, tranquilo, es la más honesta de todas. Y si prefieres que no te escriba nunca más, dímelo igual y desaparezco sin dramas.

PPD. A ti no te encuentro. A tus clientes sí. Te lo enseñamos en 20 minutos: https://recursos.neety.com/agendar/
```

Pie (lo pone la plataforma, no se puede quitar):

```
Darme de baja
Cambiar mis preferencias
Neety · Miramon Pasealekua 170, Donostia, España
```

---

## 🔴 Las tres líneas que costaron la cuenta

MailerLite canceló la cuenta el 2026-08-11 y, al preguntar, el motivo fue *"su contenido no está permitido"*. **Habían leído el correo.** Estas son las líneas que un revisor de cumplimiento lee como una confesión de lista no consentida:

1. `Me toca ordenar los correos que nos dejaron el año pasado.`
2. `Llevo toda la semana con el libro abierto buscándote. / Y no hay manera.`
3. `Pero cuál de todas, ni idea.`

Juntas dicen: *no sabemos quién es esta gente ni de dónde salió.* Da igual que sea la gracia del correo y da igual que funcione con el lector — funcionó, 46% de aperturas y una reunión el mismo día. **El texto lo lee también un revisor.**

Post-mortem completo en `email-marketing §0b`.

---

## Lo que hay que arreglar al reescribirlo, y no es solo eso

- **El consentimiento se da por hecho, no se pone en duda** (Iker, 2026-08-20). La broma se mantiene entera; lo que cambia es que Kaixito no recuerda **de cuál de las vías** vino, no si dio permiso. Con la tanda 1 de Brevo elegida por tener el tick, esa afirmación además es verdad y se puede demostrar.
- 🔴 **El CTA de respuesta hay que rediseñarlo, no repetirlo.** Sacó **0 respuestas de 191** con un 46% de aperturas. La gente abrió, leyó y no contestó. Si la métrica declarada del correo son las respuestas, ese correo **falló en lo único que medía**. Repetir el mecanismo tal cual es repetir un cero.
- **La PPD sí funcionó:** los 4 clics de contenido de la tanda 1 salieron de ahí, y de ahí salió la reunión agendada. El enlace de agendar en la PPD se queda.

---

# 🎬 LA BIBLIOTECA DE GIFS DE KAIXITO

**Verificadas el 2026-08-20**: las cinco responden `200 image/gif` y su tamaño coincide **byte a byte** con los ficheros de `Documents/Mario/LINKEDIN GROWTH/EMAIL MARKETING/`. Las etiquetas están confirmadas, no solo que cargan.

Viven en la biblioteca de contenido de Brevo. ⚠️ **Brevo no tiene gestor de archivos**, así que Iker las subió metiéndolas todas en una campaña de prueba llamada `Gifs mascota`. **Esa campaña no se borra**: si desaparece, se van las cinco URLs.

| Emoción | URL | Bytes |
|---|---|---|
| **estresado** | `https://img.mailinblue.com/11927007/images/content_library/original/6a8722b7e5f747179059068f.gif` | 377.723 |
| **alegría** | `https://img.mailinblue.com/11927007/images/content_library/original/6a8722b7e5f747179059068e.gif` | 346.643 |
| **enfado** | `https://img.mailinblue.com/11927007/images/content_library/original/6a8722b7d90d741e712f9a11.gif` | 342.707 |
| **curiosidad** | `https://img.mailinblue.com/11927007/images/content_library/original/6a8722b7d90d741e712f9a10.gif` | 378.015 |
| **aburrimiento** | `https://img.mailinblue.com/11927007/images/content_library/original/6a8722afd90d741e712f9a0a.gif` | 340.664 |

## ⛔ La regla: el GIF lo elige el TEXTO, no el turno

**En cada correo que firme Kaixito se elige la animación cuya emoción encaje con lo que dice el cuerpo** (Iker, 2026-08-20). No se rota por orden ni se repite la del correo anterior por comodidad.

En el correo 0 va **estresado** porque el cuerpo entero es la mascota agobiada sin recordar de qué te conoce. Si el GIF fuera alegría, el chiste no existiría: la imagen contradiría al texto y el lector notaría el pegote sin saber por qué.

**UNA animación por correo, nunca más** (`email-marketing §3b`).

## Cómo se mete

Snippet estándar de `§9c`, 280 px, centrado y con `alt` porque muchos clientes bloquean imágenes:

```html
<p style="margin:0 0 24px;text-align:center;"><img src="URL" alt="Kaixito hojeando su libro sin encontrarte" width="280" height="280" style="display:block;margin:0 auto;width:280px;max-width:70%;height:auto;border:0;outline:none;text-decoration:none;"></p>
```

⚠️ **Outlook de escritorio solo enseña el PRIMER FOTOGRAMA.** Por eso el primer fotograma tiene que funcionar como imagen fija: para media plantilla de una empresa, ese ES el GIF.
