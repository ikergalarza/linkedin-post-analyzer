# SKILL: lead-magnet-web — La página del recurso en recursos.neety.com (gate + recurso)

> **name:** lead-magnet-web
> **description:** El TERCER artefacto del pilar lead magnet. Un lead magnet no es solo el post de LinkedIn: es también la **página de recursos.neety.com** donde aterriza el que comenta, con su gate de email y el recurso en sí. Esta skill define qué se regala, qué se retiene, cómo se pide el correo y cómo se convierte el lead. El output es un **prompt para el programador**, no código.
> **when-to-use:** Cargar SIEMPRE que el pilar sea LEAD MAGNET (`post-workflow §4.5`). No aplica a mapa, "Los 10" ni meme. Fuente: apuntes internos "APUNTES LEAD MAGNETS" (Documents/Mario/LINKEDIN GROWTH).

---

## 0 · Los 3 artefactos del lead magnet (no confundirlos)
| Artefacto | Qué es | Quién lo hace |
|---|---|---|
| **POST de LinkedIn** | el gancho + los bullets que tease + el CTA "Comenta X" | el workflow (`post-workflow §4.5`) |
| **FOTO del post** | foto natural real / selfie (`images §3`) | el usuario, con la recomendación del workflow |
| **PÁGINA en recursos.neety.com** | el gate de email + el recurso | **el programador**, con el PROMPT que entrega el workflow (esta skill) |

**El flujo completo:** post → comenta la palabra → le pasas el link → **gate** (regala un poco + pide el correo) → **recurso** (el valor prometido) → secuencia de emails → demo.

---

## 1 · La regla de oro del gate: ni todo ni nada

El error de bulto va en las dos direcciones y las dos matan:
- **Regalar TODO en el gate** → no hay motivo para dejar el correo. Cero leads.
- **Un formulario pelado sin regalar nada** → nadie paga por adelantado a un desconocido. Cero leads.
- **✅ Lo correcto: regalar un poco ANTES del formulario.** Una muestra que demuestre que lo de dentro vale. El valor percibido tiene que superar al coste de dejar el email, y eso solo se consigue enseñando algo primero.

**El corolario, que es la palanca de negocio:** el recurso **resuelve el PASO 1, no todo el camino**. Divide el resultado final en pasos, regala el primero y deja que el resto sea el producto. Información útil pero **incompleta a propósito**.
- **Da el QUÉ, vende el CÓMO.** El recurso dice qué hay que hacer; Neety hace que pase más rápido, mejor y con menos esfuerzo.
- Ejemplo canónico: recurso = *"los 7 errores que bajan tu tasa de respuesta"* → producto = la herramienta que los evita sola.
- Si el recurso diagnostica un problema, el siguiente paso es resolverlo. Si da una plantilla, es escalarla. Si da una checklist, es implementarla. **El siguiente paso siempre continúa la conversación del recurso, nunca es una venta desconectada.**

---

## 2 · Qué recurso vale (antes de escribir la página)

- **Nace de una duda real y repetida** de nuestro ICP, no de reciclar contenido con un título bonito. La mejor idea está donde tu audiencia repite una pregunta.
- **Específico, nunca genérico.** ✅ *"Checklist para saber si tu prospección en LinkedIn está perdiendo oportunidades"* · ❌ *"Guía de ventas"*. (Esto es lo mismo que mató a la biblia 1.20x y al arsenal 0.64x en `global §4.4`.)
- **Victoria rápida:** big fast value. Cuanto antes obtenga valor, más fácil que suelte el correo.
- **Fórmula mental:** `resultado deseado + alta probabilidad de conseguirlo + poco tiempo + poco esfuerzo`.
- **Se entiende en 3 segundos** qué recibe y por qué le interesa.
- **Pegado a lo que vendemos.** No regales "guía de productividad" si vendes prospección B2B: atraes gente que no compra. Regala algo cercano al dolor que resuelve Neety (`aboutme §1b`).
- **Formatos que suenan accionables** (usa estas palabras, evita abstracciones): checklist · plantilla · diagnóstico · calculadora · auditoría · playbook · guía paso a paso · framework · mapa · score.
- **Personalizado > genérico.** Un diagnóstico sobre SU caso convierte mucho más que un PDF igual para todos. Es lo que ya sabemos del post: la entrega LIVE (8.52x · 483 com.) bate al PDF. Lo mismo aplica a la web.
- **El título vende el RESULTADO, no el formato.** ❌ "PDF gratuito" · ✅ *"Checklist para detectar si tus mensajes de LinkedIn parecen automatizados"*.

---

## 3 · La página: estructura AIDA
1. **Atención** — titular con el problema o el resultado. Concreto.
2. **Interés** — qué incluye el recurso y por qué es útil.
3. **Deseo** — qué va a descubrir, solucionar o mejorar. **Aquí va la MUESTRA gratis** (§1) y la **preview** del recurso: captura del PDF, ejemplo de plantilla, mini resultado de la auditoría, pantallazo de la calculadora.
4. **Acción** — el formulario.

**Reglas de la página:**
- **UNA sola acción principal:** dejar el correo. Sin botones que distraigan.
- **CTA nunca "Enviar".** ✅ "Quiero mi auditoría gratis" · "Descargar checklist" · "Ver mi diagnóstico" · "Recibir la guía".
- **Formulario mínimo.** Si el recurso es simple, **solo email**. Si hay que cualificar, email + 1-2 campos clave como mucho. Formulario largo con valor percibido bajo = nadie lo rellena.
- **Di qué pasa después** de dejar el correo: qué recibe (PDF / web personalizada / plantilla / auditoría / vídeo) y **cuándo**. *"Te enviaremos el diagnóstico en menos de 5 minutos."*
- **Entrega inmediata.** Cuanto más tarde, menos satisfacción.
- **Prueba social** si la hay: testimonios, resultados, logos (`aboutme §1`: +200 PYMEs, +40% de conversión). Si no la hay, ejemplos concretos de lo que recibirá.

---

## 4 · Después del correo (ahí empieza la conversión, no termina)
Secuencia simple de 4 emails, cada uno continuando la conversación del recurso:
1. **Entrega** del recurso.
2. **El problema** explicado.
3. **Caso / ejemplo / prueba social.**
4. **Invitación** a demo o llamada.

Nunca empieces pidiendo la llamada: primero valor, después la invitación.

---

## 5 · Qué entrega el workflow: el PROMPT PARA EL PROGRAMADOR
No escribimos código ni montamos la web. Entregamos **un prompt en bloque cercado** para que el programador cree la página en `https://recursos.neety.com/`. Tiene que llevar, sí o sí:

```
RECURSO: [nombre accionable, vende el resultado no el formato]
URL sugerida: recursos.neety.com/[slug]
PALABRA DEL GATE (la que comentan en LinkedIn): "[X]"

1. GATE (lo que se ve ANTES de dejar el email)
- Titular (Atención): [problema o resultado, concreto]
- Subtítulo (Interés): [qué incluye y por qué es útil, 1-2 líneas]
- LA MUESTRA GRATIS (Deseo) — esto es lo que se regala sin pedir nada:
  [el trozo concreto que se enseña: 1 de los 7 errores, 2 filas de la checklist,
   el primer resultado de la calculadora... Suficiente para probar que vale,
   insuficiente para resolver el problema entero]
- Preview visual: [captura/mockup de qué van a recibir]
- Prueba social: [testimonio, cifra o logos]
- Formulario: [solo email | email + N campos] · CTA: "[texto del botón, nunca 'Enviar']"
- Qué pasa después: "[qué recibe y en cuánto tiempo]"

2. RECURSO (lo que se ve DESPUÉS de dejar el email)
- Formato: [checklist / diagnóstico / calculadora / plantilla / playbook]
- Contenido: [el paso 1 del problema, resuelto de verdad]
- Lo que NO incluye a propósito: [los pasos 2-4 = el hueco que llena Neety]
- Siguiente paso dentro del recurso: [CTA a demo, conectado con lo que acaban de leer]

3. NOTAS TÉCNICAS
- [entrega inmediata, integración de email, tracking de visitas/conversión...]
```

**Antes de entregarlo, comprueba:**
- ¿La muestra del gate **regala algo de verdad**? (Si no hay muestra, el gate es un formulario pelado → fuera.)
- ¿El recurso **deja fuera** los pasos 2-4 a propósito? (Si lo resuelve todo, no hay negocio.)
- ¿El CTA **no** dice "Enviar"?
- ¿El formulario pide **lo mínimo**?
- ¿El título vende **resultado** y no formato?
- ¿El recurso está **pegado al dolor que resuelve Neety**?

---

## 6 · Medición (para pedirla, no para hacerla)
Visitas → correos dejados → recursos abiertos → respuestas/demos. Si la conversión es baja, el problema suele estar en: promesa poco clara · recurso poco deseable · formulario largo · sin prueba social · CTA débil · demasiado texto · desconexión con el dolor real. Testea títulos, CTAs y formatos (PDF vs quiz vs calculadora vs checklist vs auditoría).
