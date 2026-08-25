# Historial de la newsletter (ESTADO, no doctrina)

> Equivalente a `historial-publicaciones.md` para el email. Lo LEE el planificador de tandas
> (`email-marketing §6`) antes de escribir nada, y se ACTUALIZA y commitea al aprobar cada tanda.
> Si falta un dato, PREGUNTA. No lo adivines.

## 🟢 ESTADO: PRIMER ENVÍO DESDE BREVO (2026-08-20)

**Kaixito 01 reescrito y enviado.** Fin de la parada de nueve días desde la cancelación de MailerLite.

| | Tanda 1 | Tanda 2 | Tanda 3 |
|---|---|---|---|
| Destinatarios | **25** | **50** | **100** |
| Fecha | 2026-08-20, **18:40** | 2026-08-21, **09:05** | 2026-08-24, **09:05** |
| Entregados | 23 de 25 | 42 de 50 | 88 de 100 |
| **Rebotes duros** | **2 · 8,0%** | **3 · 6,0%** | **9 · 9,0%** 🔴 |
| Rebotes blandos | 0 | 4 (+1 diferido) | 3 |
| Aperturas reales | 7 · 30,4% | 10 · 23,8% | **31 · 35,2%** ⭐ |
| Clics al enlace de reserva | **0** | **0** | **0** |
| Bajas | 0 | 1 | 2 |
| Lista Brevo (id) | `Tanda 1` (5) | `Tanda 2` (6) | `Tanda 3` (7) |
| Campaña Brevo (id) | 2 | 3 | **4** |
| `utm_campaign` | `kaixito-01-tanda-1` | `kaixito-01-tanda-2` | `kaixito-01-tanda-3` |

> Leído de la API el 2026-08-21 (`GET /emailCampaigns/{id}?statistics=globalStats`). **Ojo con
> los dos sitios donde Brevo da las aperturas**: `globalStats.uniqueViews` es el número bueno,
> y `campaignStats[].uniqueViews` da menos (8 vs 2 en la tanda 1). El dashboard del CRM lee
> `globalStats`; si algún día sale un número raro, es que se leyó el otro.
>
> **La tanda 2 marca 1 clic único, pero `linksStats` del enlace de reserva está a 0.** Ese clic
> es casi seguro el enlace de baja, que también se cuenta. **Nadie ha pinchado en agendar
> todavía: 0 de 191.**

- **El texto, el preheader y los GIFs están en `corpus-correos-enviados.md`.** Lo que cambió respecto a la versión que costó la cuenta: `"los correos que nos dejaron el año pasado"` se sustituye por **`"En su día me diste permiso para escribirte. Lo que no tengo muy claro es de dónde saliste."`** La broma se queda entera; lo que la mascota ha perdido ya no es el permiso, es la puerta por la que entraste.
- **Quedan 4 tandas** creadas y APAGADAS: 100, 200, 400 y 380. La 3 no sale antes del **lunes 24**: el fin de semana el ICP no está delante del correo.
- **Pie nuevo, con las dos cosas que hay que tener:** enlace de baja (`{Date de baja aquí}`, en tú) y dirección postal. Al poner el pie personalizado, Brevo **borra el suyo**, y con él el enlace de baja: hay que volver a meterlo a mano o sale un correo comercial sin forma de darse de baja.
- **`utm_source` es `brevo` y NO se puede cambiar** (ver `email-marketing §9c`). La atribución en GA4 queda partida: hasta el 11/08 `newsletter`, desde el 20/08 `brevo`.
- **09:05 y no 09:00** a propósito: a la hora en punto salen todas las campañas programadas del país a la vez.

### 🔴 Y esto es lo que hay que mirar, no las aperturas

**Los rebotes de Brevo son PEORES que los de MailerLite, que es de lo que nos cerraron la cuenta.**

| | Tanda 1 | Tanda 2 |
|---|---|---|
| MailerLite | 3,7% | 2,92% |
| **Brevo** | **8,0%** | **6,0%** |

**Acumulado en Brevo: 5 rebotes duros de 75 envíos = 6,7%.** El umbral del sector es el **2%**.

Y no vale decir que la lista está limpia porque pasó por `audience_clean`: pasó, y aun así
rebotó el 8%. Lo que `audience_clean` detecta (formato, buzones automáticos, desechables,
erratas) no es lo que rebota. **Lo que rebota son dominios que no existen y buzones cerrados**, y
eso no se ve mirando el texto de la dirección.

⚠️ **Corregido el 2026-08-21: un rebote duro NO llega en minutos.** Aquí se dio por bueno lo
contrario y por eso la tanda 1 se apuntó como "25 de 25, cero rebotes". A las 18:45 iba 25 de 25;
dos horas después eran 23. **Mínimo 2-3 horas antes de leer el dato, y mejor al día siguiente.**

### 🔴 Lo primero de mañana, antes de las 09:05

~~**Mirar los rebotes duros de la tanda 1.** Un rebote duro es un rechazo SMTP y llega en minutos.~~ **Falso, ver arriba.** El dato tardó horas, se leyó demasiado pronto y la tanda 2 salió con la tanda 1 aparentando cero rebotes cuando llevaba 2.

Las varas del histórico de MailerLite: 3,7% de rebotes en la tanda 1 y 2,92% en la 2, las dos **por encima del 2% que el sector considera peligroso**.

## 🔵 CÓMO SE CONECTÓ (2026-08-20)

Cuenta de Brevo creada, dominio conectado desde Cloudflare y verificado, API key generada y metida en el CRM (Marketing → Integraciones). **El CRM ya habla con Brevo**: `src/brevo.js` sustituye a `src/mailerlite.js` en `sales-crm-Neety`, spec en `docs/superpowers/specs/2026-08-20-migracion-mailerlite-a-brevo-design.md` de ese repo.

- **Se usa la API a secas, NO el conector MCP** (decidido el 2026-08-20). El que llama a Brevo no es un chat: es un worker desatendido en Railway cada 60 min. MCP es un protocolo para que un agente conversacional use herramientas; un servicio Node necesita `fetch()`. **No hay conector MCP de Brevo conectado y no hace falta.** ⚠️ El conector MCP de MailerLite que sigue apareciendo en la sesión está MUERTO: la cuenta está cancelada. No lo uses para nada.
- **Los tres bloques y cuál se rompió:** recursos.neety.com capta el lead → el CRM lo lee (`resources_leads.js`, solo lectura) y es la fuente de la verdad → el proveedor envía. **Solo se rompió el tercero.** `neety-resources` no tiene ni una referencia al proveedor: es agnóstico por diseño y no se tocó.
- **Las bajas van ahora en los DOS sentidos.** Antes solo entraban (webhook del proveedor → CRM). La dirección CRM → proveedor existía escrita pero **no se llamaba desde ningún sitio**: quien se daba de baja por el enlace del correo seguía en la lista del proveedor y habría recibido la siguiente campaña. Cerrado el 2026-08-20.

### ✅ DNS y dominio: VERIFICADO EN EL DNS REAL el 2026-08-20 (no solo en el panel)

- **DKIM de Brevo: puesto y resolviendo.** `brevo1._domainkey.neety.com` y `brevo2._domainkey.neety.com` son **CNAME** a `b1/b2.neety-com.dkim.brevo.com`, cada uno con su clave RSA 2048. Lo montó la conexión automática de Brevo con Cloudflare.
- 🔴 **TRAMPA AL COMPROBARLO: la conexión AUTOMÁTICA usa CNAME en `brevo1`/`brevo2`, la MANUAL usa TXT en `mail._domainkey`.** Preguntar por TXT en `mail._domainkey` da "no existe" con el dominio perfectamente autenticado, y parece que falta el DKIM cuando está. **Se consulta por CNAME y TXT, en los dos selectores, y contra el NS autoritativo** (`bristol.ns.cloudflare.com`), no contra un resolver público que cachea negativos.
- **El SPF NO necesita a Brevo, y no es un olvido.** DMARC pasa si alinea SPF **o** DKIM; con DKIM firmando como `neety.com` ya alinea, y Brevo usa su propio return-path. Añadir `include:spf.brevo.com` no aporta nada.
- **Se envía desde `neety.com` DIRECTO, no desde un subdominio** (decisión de Iker, 2026-08-20). ⚠️ Significa que la reputación del envío masivo y la del correo comercial de los founders son la misma: una campaña marcada como spam la paga también `iker@neety.com` prospectando. Con DMARC en `p=none` no hay rechazo inmediato. **No se vuelve a proponer el subdominio salvo que haya un incidente de entregabilidad.**
- **`hola@neety.com` funciona en los dos sentidos** desde que se activó el Grupo de Google Workspace (2026-08-20): se le puede escribir y las respuestas llegan. Es la condición que sostiene el correo 0, cuya métrica son las RESPUESTAS.
- 🧹 **Queda el `include:_spf.mlsend.com`** de la cuenta cancelada. No bloquea nada, pero autoriza a cualquier cliente de MailerLite a pasar SPF como `neety.com`. Se quita dejando `v=spf1 include:_spf.google.com a mx ~all`.
- 🧹 **`news.neety.com` tiene un SPF de HubSpot** (`include:145372616.spf10.hubspotemail.net`), resto de otra herramienta. Inofensivo hoy porque es otro subdominio; hay que limpiarlo si algún día se usa `news.` para enviar.
- **DMARC:** `p=none`, con reportes a Cloudflare. **MX:** `smtp.google.com` (Workspace).

### ⚠️ LA RESTRICCIÓN DE IP DE BREVO (mordió el 2026-08-20, tardó una tarde)

Brevo trae **lista blanca de IPs por defecto** en las API keys nuevas. La primera llamada del CRM dio 401 con este texto:

> *"We have detected you are using an unrecognised IP address 152.55.177.117"*

**No era la clave.** Se rehízo tres veces sin necesidad, porque el mensaje que enseñaba el CRM decía "revísala en Integraciones" y se comía el motivo de Brevo. Corregido: ahora sale el texto literal de Brevo y un recuadro con el tipo de credencial.

- `152.55.177.117` es la **IP de salida de Railway** (AS400940, Santa Clara). Comprobado.
- 🔴 **Railway NO garantiza IP de salida fija en el plan estándar.** Si cambia en un redeploy, el sync horario muere EN SILENCIO con ese mismo 401 y nadie se entera hasta echar de menos contactos. La alternativa es quitar la restricción en `app.brevo.com/security/authorised_ips`.
- **Si algún día vuelve un 401, mira PRIMERO la IP, no la clave.** El botón "Probar conexión" ya lo dice solo.
- Las tres causas de un 401 en Brevo, que se ven idénticas sin el mensaje: clave regenerada · **restricción de IP** · clave SMTP (`xsmtpsib-`) en vez de API key v3 (`xkeysib-`).

### 🔴 Pendiente antes de enviar nada (en orden)
1. **Rearmar el espejo de cada audiencia a mano** en Marketing → Audiencias. La migración las apagó todas a propósito: los ids guardados eran de grupos de MailerLite y el worker los habría usado para empujar contactos a listas equivocadas.
2. ✅ **Conexión con Brevo verificada el 2026-08-20** (1 lista visible, clave `xkeysib-`, 89 caracteres).
3. **Registrar el webhook de bajas** (Integraciones → "Registrar webhook de bajas"). Sin esto, una baja hecha en Brevo no llega al CRM.
3. **Probar con 2-3 correos internos** antes de tocar la audiencia buena. Ningún OK de la API prueba un envío: se verifica leyendo el buzón.
4. **Plan de pago activo, idioma de la cuenta en español**, y escribir a soporte de Brevo presentando la cuenta antes del primer envío grande.
5. **Lista de supresión desde el CRM** (clientes + prospectos con conversación abierta + las 5 bajas y los 7 rebotes del rescate), ANTES de subir la lista buena.
6. El resto del runbook de `§0c`. ✅ El DNS ya NO está pendiente: ver el bloque de arriba.

## 🔴 ESTADO ANTERIOR: CUENTA MAILERLITE CANCELADA (2026-08-11)
MailerLite canceló la cuenta 2536617 por supuesta violación de la política anti-spam, tras 3 envíos y 191 correos. **La tanda 3 (337) nunca llegó a salir y la 4 no se montó.** Post-mortem completo en `email-marketing §0b`.
- **Apelaciones enviadas:** formulario de cumplimiento (x2) y mensaje de LinkedIn a un empleado de soporte desde la cuenta de Iker, el 2026-08-12.
- **Datos rescatados por API antes de perder el acceso:** `Escritorio/rescate-mailerlite-2026-08-11.md` — las 5 bajas con su motivo, los 7 rebotes, los 4 leads que clicaron y las métricas finales. **Sin ese fichero no se puede reconstruir la lista de supresión en otra plataforma.**
- ⚠️ **De los 4 que clicaron, uno (`ahernandez@fagorautomation.es`) es CLIENTE**, no un lead: recibió el correo por no existir lista de supresión. Leads reales: 3.

## Estado del sistema

> ⚰️ **TODO ESTE BLOQUE ES HISTÓRICO, de la cuenta CANCELADA.** Se conserva porque
> explica qué había montado y qué hubo que reconstruir. **El estado vivo está
> arriba, en el bloque de Brevo.** Nada de aquí abajo se puede usar hoy: la
> cuenta, los grupos, el campo `origen` y el conector MCP están muertos.

- **Herramienta de envío: MailerLite, CONECTADA y VERIFICADA el 2026-07-28** (cuenta `management@neety.com`, id 2536617, token hasta jul 2027). Conector MCP probado con lecturas reales: grupos, campañas, campos y suscriptores responden. Escritura disponible (campañas, grupos, segmentos, importación, automatizaciones).
- **Contenido actual:** 1 suscriptor (Iker/`management@neety.com`) · 1 campaña borrador vacía del 27-jul ("Campaña sin título", sin contenido ni asunto: se puede borrar, pendiente del OK de Mario).
- **Estructura creada por Claude vía MCP el 2026-07-29:** campo personalizado **`origen`** (texto, id 1403523) + **7 grupos de segmentación**: `origen-desconocido` · `linkedin-recursos` · `web` · `evento` · `webinar` · `referido` · `contacto-comercial`. Todos vacíos, listos para la importación.
- **Lo que el MCP NO puede tocar (solo panel web):** idioma de la cuenta, autenticación del dominio, alta de remitentes verificados y ajustes de cuenta. Todo lo demás (contactos, grupos, segmentos, campos, campañas, automatizaciones, programación) sí.
- ⚠️ **Verificar remitente ≠ autenticar dominio** (las dos hacen falta): verificar remitente = confirmar UNA dirección con un clic en un email; autenticar dominio = meter los registros SPF/DKIM en el DNS de neety.com. Si en la llamada solo se hizo lo primero, el dominio sigue sin autenticar.
- ✅ **Dominio `neety.com`: autenticado** (verificado el 2026-07-30 creando un borrador con `hola@neety.com` de remitente: MailerLite lo dio por apto para enviar y sin avisos).
- ✅ **Remitente de la newsletter: `hola@neety.com`**, con **forwarding activado y probado**. **Corregido el 2026-08-06: el reenvío NO va a `news@`, va a `mario@neety.com` y `iker@neety.com`.** Es la condición que sostiene el correo 0, cuya métrica son las RESPUESTAS.
  - 🔴 **Riesgo operativo a resolver antes de la tanda grande:** las respuestas caen mezcladas en dos bandejas de trabajo personales. Con 49 destinatarios se lleva; con 1.300 se pierden. **Filtro de Gmail `to:hola@neety.com` → etiqueta `respuestas-newsletter`**, y decidir quién las procesa (Mario, que lleva la segmentación) para que no se dupliquen ni se queden sin hacer.
  - **Cada respuesta hay que llevarla a mano al grupo que toque** (`web`, `linkedin`, `evento`, `webinar`, `origen-desconocido`). Manual está bien para 49; para la lista entera habrá que automatizarlo desde el CRM.
- ✅ **Credenciales:** no hace falta API key. Todo va por el conector MCP, que se autentica solo. Si algún día se automatiza desde un script propio, la key iría a variable de entorno (nunca al chat ni al repo).
- 🔴 **Pendiente de configuración, antes de enviar nada:**
  1. **Idioma de la cuenta en INGLÉS** (en-US) → pasar a español, o el pie de baja y los textos del sistema salen en inglés. **Es el único bloqueante que queda.**
- **Primer correo:** el correo 0 segmentador (`email-marketing §5c-0`), aún no enviado.

## Rotación de remitentes
| Semana | Remitente principal | Notas |
|---|---|---|
| _(sin envíos todavía)_ | | |

## Emails enviados
| Fecha | Remitente | Pilar | Asunto | Segmento | CTA (tipo/palabra) | Métricas |
|---|---|---|---|---|---|---|
| 2026-08-07 09:23 | Kaixito | Correo 0 segmentador | `¿no te acuerdas de mí?` | warmup-tanda-1 (47) + testers (5) | Respuesta / web·linkedin·evento·webinar·ni idea | Ver abajo |

### Tanda 1 · resultados a 2026-08-10 (leídos por API, no de la captura)
- **54 enviados = 47 reales + 5 testers.** Entregados 52.
- **Aperturas 46,8% en la lista real** (22/47). Testers 60% (3/5).
- **Clics 3, todos de la lista real (6,4%).** CTOR 12%. De los 3, **2 fueron al enlace de agendar**.
- **Bajas 0. Quejas de spam 0.** El formato aguanta: llegó a bandeja Principal.
- 🔴 **Rebotes duros 2 = 4,3% sobre los 47 reales.** Banda de alarma (2-5%), y con n=47 el dato es impreciso. **Es la razón por la que hay que verificar la lista antes de la tanda grande:** si la tasa se mantiene, en los ~1.263 restantes son ~54 rebotes.
- ⭐ **1 reunión agendada el mismo día del envío**, de 2 clics en el enlace. Con el `origen: newsletter` y los UTM llegando bien al formulario.
- ⛔ **RESPUESTAS: 0** (comprobado por Mario el 2026-08-10, 3 días después). La lista cerrada de una palabra **no bastó**. Con 47 destinatarios el dato no concluye nada, pero **si la tanda 2 (149) también da 0, el CTA de respuesta está roto y hay que rediseñarlo**, no repetirlo en la tanda 3.
- **Composición de la lista (contada, no estimada):** de 151 candidatos, **85% no da señal de país** (gmail/hotmail/.com). Solo 9 `.es` y 13 LatAm. **Para priorizar por ICP hace falta el país del CRM.**

## Tandas del correo 0
| Tanda | Grupo | Tamaño | Estado |
|---|---|---|---|
| 1 | `warmup-tanda-1` (194973211060864772) | 47 (+5 testers) | ✅ Enviada 2026-08-07 |
| 2 | `warmup-tanda-2` (195398984128267443) | **138**, sin testers | Grupo lleno el 2026-08-10 por API, pendiente de enviar |
| 3 | martes 11 | **337** | Grupo `warmup-tanda-3` (195489391391540991) lleno por API |
| 4 | miércoles 12 | El resto, **aquí entran los 55 LatAm** | **Sin grupo:** incluir `Leads General · limpia` y excluir las 3 tandas + Recursos |

### Tanda 2 · resultados a 21 h (2026-08-11)
137 enviados · 27,7% aperturas *(a 21 h, sigue subiendo: iba por 16% el primer día)* · 1 clic · **4 rebotes duros (2,92%)** · 1 blando · **5 bajas (3,65%)** · **0 spam**.
- ⚠️ **Las aperturas de las tandas NO se comparan hasta los 4 días.** La tanda 1 marca 46,3% pero es un acumulado de 4 días; la 2 lleva 21 h. Entre el 60 y el 70% de las aperturas caen el primer día.
- ⚠️ **Las 5 bajas son nuevas** (la tanda 1 tuvo 0) y están altas frente a la norma (0,2-0,5%). **Es esperable en un re-permiso que invita a irse**, y esas personas habrían marcado spam más adelante. Pero se vigila.
- ✅ **Acumulado 191 enviados, 6 rebotes duros = 3,1% y BAJANDO. 0 denuncias de spam.** Con eso se sigue sin verificar la lista: la verificación se deja para antes de la primera newsletter de venta.

### Los 6 rebotados, y qué se hace con cada uno
`mktbeti@gmail.com` · `xavigames911@gmail.com` · `etacescueladearqueroa@gmail.com` · `emprendersjglo21@gmail.com` · `sttrategosolutions@gmail.com` → **5 de 6 son Gmail muertos** (Google borra cuentas inactivas a los 2 años). Se borran del CRM.
- ⚠️ `emprender**sj**glo21` es **errata** de `emprender**si**glo21@gmail.com`, que sí existe y no rebotó. Solo se borra la errata.
- 🔵 `pablo.rivadulla@nextbitt.com` es **corporativo: la persona se fue, la EMPRESA sigue siendo prospecto.** En un CRM B2B se invalida el correo, **no se borra la ficha ni el histórico**.
- ✅ **La comprobación gratuita de MX acertó:** marcó `bravorobot.com` como dominio sin servidor de correo y ese fue exactamente el único rebote blando. Detecta poco (1 de 71) pero lo que detecta, acierta. **Merece la pena correrla siempre antes de una tanda: es gratis.**

⛔ **A un rebotado NO se le borra, en ningún proveedor.** El estado que lo bloquea es automático; borrarlo pierde esa protección y una reimportación posterior lo devuelve limpio. En Brevo ese estado es `emailBlacklisted`, y el CRM lo respeta por los dos lados: los dados de baja **se quedan dentro de la lista a propósito** (sacarlos y reimportarlos algún día los resucitaría), y el sync nunca los vuelve a subir.

**Son 4 tandas y caben todas en la misma semana.** Con 47+138 = 185 enviados, meter los ~987 restantes de golpe sería un salto de 5x con un 4,3% de rebotes detrás; en dos pasos (2,9x y 1,5x) no.

### ⭐ CADA CUÁNTO SE PUEDE LANZAR UNA TANDA (corregido el 2026-08-10)
**Al día siguiente ya se puede.** El dato que decide es el rebote DURO, y un rebote duro es un rechazo SMTP: llega **en minutos**, no en días. Lo que tarda hasta 72 h son los rebotes blandos (reintentos), que casi no afectan a la reputación. Las quejas de spam llegan en su mayoría en 24 h.
- **Regla: 24 h entre tandas si el salto es ≤2x; 48 h si el salto es mayor**, para tener margen de reacción antes de multiplicar el volumen.
- Los calentamientos de dominio del sector escalan **a diario**. Espaciar 3 días era exceso de cautela por mi parte, no doctrina.
- ⛔ **Y el viernes no se lanza la última tanda:** si no lo abren ese día, el fin de semana se lo come y no vuelven hasta el lunes (criterio de Mario, coherente con vender a empresas).

## Palabras de CTA-respuesta ya usadas (no repetir)
- `web` / `linkedin` / `evento` / `webinar` / `ni idea` (correo 0, 2026-08-07)

## Ángulos ya usados (no repetir, como los conceptos del mapa)
_(ninguno)_


---

## 📡 Detección de rebotes SIN pagar validador (2026-08-21)

Iker: *"no vamos a pagar. Eso de limpiar los correos, deberíamos ser nosotros capaces de
detectarlo antes de tiempo."*

### ❌ Lo que se probó y NO funciona: puntuar direcciones absurdas

Salió de una observación buena suya: `mongol@gmail.com` estaba en la tanda 3, y quien pone eso
en un formulario no está dejando su correo. La idea era generalizarlo puntuando la parte local
por consonantes seguidas, ratio de vocales y bigramas repetidos.

**Se calibró contra las 100 direcciones reales de la tanda 3 y no separa.** Los números:

| dirección | puntuación | ¿es real? |
|---|---|---|
| `teleservicesmultiservicios@gmail.com` | 19,4 | sí |
| `horebbusinessgroup@gmail.com` | 14 | sí |
| `fuewatclauidia@cfuwomdtradigi.com` | **13** | **no** |
| `fabio.archila@...` | 13 | sí |
| `endtoendgmks.com` (dominio) | 20,8 | sí |
| `bcncgroup.com` (dominio) | 17 | sí |
| `cfuwomdtradigi.com` (dominio) | **11** | **no** |

**No hay umbral.** Cualquier corte que cace `fuewatclauidia` se lleva por delante
`fabio.archila`, y cualquiera que cace `cfuwomdtradigi.com` mata `bcncgroup.com`. Descartado con
datos, no con opinión. Está escrito en `sales-crm-Neety/src/mx.js` para que nadie lo reintente.

### ✅ Lo que sí funciona, y ya está en el CRM

**Audiencia → 📡 Comprobar dominios.** Pregunta al DNS, no puntúa nada:

| veredicto | significa | ¿accionable? |
|---|---|---|
| `inexistente` | el dominio no está registrado | **sí, quitar** |
| `sin-buzon` | existe pero sin MX ni A | **sí, quitar** |
| `ok` | tiene MX, o tiene A | no |
| `desconocido` | el DNS no contestó | **no**, es "no lo sé" |

Tres trampas evitadas, cada una con su test:
- **Sin MX pero con A recibe correo** (RFC 5321). Mirar solo el MX es el fallo típico.
- Un timeout **nunca** cuenta como muerto.
- Se agrupa por dominio: 40 gmails son 1 consulta.

**Lo que NO puede saber:** si el BUZÓN existe. Con `@gmail.com` siempre dirá que sí, y media
lista es Gmail. Sirve para cazar dominios inventados, que es de donde sale el rebote más caro.

### La palabra de broma, que sí se quedó

`audience_clean` marca (**no quita**) las direcciones que son una palabra de broma o un relleno
de formulario. Se compara la palabra **entera**, nunca como subcadena: `serrano` lleva "ano" y
`paniculosa` lleva "culo". Hay un test con 30 direcciones reales de la tanda 3 que falla si
alguien mete en la lista una palabra que además es un apellido.


---

## 🔴 TANDA 3 (2026-08-24): el asunto es el mejor de los tres y los rebotes también

**Lo bueno, y es bueno de verdad: 35,2% de aperturas reales.** 31 personas de 88, descontadas las
3 precargas de Apple. Es el mejor dato de las tres tandas y está muy por encima de la media B2B.
El asunto `¿no te acuerdas de mí?` con el preheader `Normal, es la primera vez que te escribo.`
funciona, y ya no es casualidad: tres envíos seguidos.

**Lo malo:**

| | Tanda 1 | Tanda 2 | **Tanda 3** |
|---|---|---|---|
| Rebotes duros | 8,0% | 6,0% | **9,0%** |

**Acumulado en Brevo: 14 rebotes duros de 175 envíos = 8,0%.** Cuatro veces el umbral del 2%, y
la última tanda es la PEOR de las tres. Esta es la curva por la que MailerLite cerró la cuenta.

### ⚠️ El CTOR del dashboard está inflado: cuenta el enlace de BAJA

La tanda 3 marca 3 clics únicos y 3 *clickers*, con 2 bajas. Pero `linksStats` del enlace de
reserva está a **0**. Los clics son del pie, no del CTA.

**Total real: 0 reservas de 279 correos entregados.** El dashboard enseña un CTOR de 9,7% que
parece sano y no lo es. → **PENDIENTE: descontar los clics de baja del CTOR.**

### ⚠️ Brevo reescribió el `utm_source` a `sendinblue`

En la tanda 3 el `linksStats` devuelve `utm_source=sendinblue`, no el `brevo` que iba en el HTML.
Las tandas 1 y 2 (duplicadas desde la interfaz) sí conservan `brevo`. **La diferencia es que la 3
se creó por API.** Tercera variante de `utm_source` en GA4: `newsletter`, `brevo` y ahora
`sendinblue`.

---

## 🔬 QUÉ REBOTÓ DE VERDAD, y por qué todas mis hipótesis del viernes eran falsas

Se pudo comprobar cruzando `GET /contacts/lists/7/contacts` con la hora del envío: un contacto
que sale `emailBlacklisted: true` a las 09:05:36-43 es un rebote duro; a las 09:49 y 10:07, una
baja. Cuadra exacto con los 9 rebotes y las 2 bajas que da la campaña. **Es la forma de saber
QUIÉN rebotó, que la API de campañas no da.**

### Los 9 que rebotaron

| dirección | tipo |
|---|---|
| `jvieare@canariaseducacion.com` | corporativo |
| `mjosealonso@cepaim.org` | corporativo |
| `laia.roig@omc.com` | corporativo |
| `vicentebordes@provesa.com` | corporativo |
| `victoria.francia@arbentia.com` | corporativo |
| `ventas@alvarozubiaga.com` | corporativo (buzón de rol) |
| `konntacgdl@gmail.com` | libre |
| `fehaby@hotmail.com` | libre |
| `treserlerzerm@gmail.com` | libre |

**6 de 9 son direcciones impecables de empresas reales.** `laia.roig@omc.com`,
`victoria.francia@arbentia.com`: nombre, apellido, empresa que existe. **Son personas que
cambiaron de trabajo.** No hay nada en el texto de esas direcciones que las delate.

### El marcador de mis predicciones del viernes: 1 de 4

| sospechoso | ¿rebotó? |
|---|---|
| `treserlerzerm@gmail.com` | ✅ sí |
| `mongol@gmail.com` | ❌ **no** |
| `dafasasfa@gfdhe.com` | ❌ **no** |
| `fuewatclauidia@cfuwomdtradigi.com` | ❌ **no** |

**Tres falsos positivos de cuatro.** Si se hubieran quitado, se habrían borrado 3 contactos vivos
sin tocar el problema.

Y hay una consecuencia peor: `gfdhe.com` y `cfuwomdtradigi.com` **aceptaron el correo**. Existen y
tienen buzón. **La comprobación de MX que se construyó el 2026-08-21 los habría dado por buenos, y
habría cazado 0 de los 9 rebotes.** El MX sigue valiendo para lo que dice que vale (dominios que
no existen), pero en esta lista no hay ninguno: el problema es otro.

### 🔴 La conclusión, y manda sobre cualquier intuición futura

**Lo que rebota en esta lista son BUZONES muertos en dominios VIVOS.** No formato, no dominios
inventados, no direcciones raras. Nada que se pueda ver mirando el texto de la dirección, y nada
que el DNS pueda contestar.

Solo hay una comprobación gratuita que llega ahí: **sondear el servidor SMTP con `RCPT TO`** sin
llegar a enviar. Y los datos dicen que aquí encajaría: **6 de los 9 rebotes son de dominios
corporativos**, que es justo donde el sondeo funciona bien. Gmail y Hotmail lo bloquean, y son los
otros 3.

Cota superior realista: de 9% a ~3%. No baja a cero.


---

## 🔌 Sondeo SMTP: la tercera capa, y la única que llega (2026-08-24)

**Audiencia → 🔌 Comprobar buzones.** Le pregunta al servidor de correo de cada empresa si el
buzón existe (`RCPT TO`) y corta antes de enviar. Es lo que hace un validador de pago.

Las tres capas, y qué caza cada una:

| capa | mira | cazó de los 9 rebotes de la tanda 3 |
|---|---|---|
| `audience_clean` | el TEXTO de la dirección | **0** (las 9 eran correctas) |
| `mx.js` | el DOMINIO | **0** (los 9 dominios existen) |
| `smtp_probe.js` | el **BUZÓN** | **hasta 6** (los corporativos) |

### Las 4 medidas para que esto no nos perjudique

1. **`MAIL FROM:<>`, remitente nulo.** No mete `neety.com` en la transacción, y el dominio es lo
   único de reputación que se comparte con Brevo. Las IP de envío son de Brevo y no se tocan.
2. **Nunca se manda `DATA`.** No sale ningún correo → no puede generar una queja de spam.
3. **Gmail, Outlook, Yahoo, iCloud y demás ni se sondean.** Ni contestan la verdad ni conviene
   darles motivos.
4. Una conexión por dominio, con pausa.

### Las 3 que impiden un falso "está muerto"

1. **Control de catch-all.** Se pregunta primero por una dirección inventada del mismo dominio.
   Si la acepta → el servidor dice que sí a todo → **nada de ese dominio se juzga**. Si la
   rechaza → valida usuario a usuario → su "no existe" vale.
2. **Solo un 5xx cuenta.** Un 4xx es greylisting.
3. **Cualquier fallo de red es "no se sabe".** Nunca muerto.

### ⚠️ Puede no funcionar, y lo dirá

**Railway puede tener bloqueado el puerto 25 de salida**, como casi todo el cloud. Si TODAS las
conexiones fallan, la pantalla lo dice con esas palabras en vez de devolver "no se sabe" 200 veces
y dejarte creyendo que la lista está comprobada. **Es lo primero que hay que mirar al usarlo.**

### Lo que se espera, con honestidad

**De 9% a ~3%.** No baja a cero: los 3 rebotes de Gmail y Hotmail de la tanda 3 quedan fuera por
diseño, y siempre habrá buzones que aceptan y rebotan después.


---

## Tanda 4: verificada con Bouncer, programada (2026-08-25)

Primer envío con verificación de pago. Del CSV combinado de tandas 4+5+6 (981 direcciones):

| veredicto Bouncer | cuántas | acción |
|---|---|---|
| `undeliverable` | **70** | **dadas de baja en CRM y Brevo** (Iker, 2026-08-25, en un solo paso) |
| `risky` — `low_deliverability` (catch-all, 32/34 con `acceptAll=yes`) | 34 | se quedan: ningún validador puede saber más sobre un dominio catch-all |
| `risky` — `low_quality` (score 10, casi todo Gmail) | 26 | se quedan: es una señal de reputación, no de rebote |
| `unknown` | 11 | se quedan |

**Tanda 4 (200→191 tras las bajas) programada: jueves 2026-08-26, 09:05.** Campaña id 5, lista Brevo id 8,
`utm_campaign=kaixito-01-tanda-4`. Mismo cuerpo que la 3 (PPD ya en 30 minutos).

**Tandas 5 (400) y 6 (380) NO se programan todavía.** Decisión de Iker, no mía, y coincide con lo que ya
decía este mismo fichero (§ arriba): un servicio de verificación de pago baja el riesgo, no lo anula, y
la única prueba real es un envío real. Se mira el rebote de la tanda 4 mañana y con ESE dato — no con
el de Bouncer — se decide si la 5 sale el viernes.


---

## 🔴 PENDIENTE (Iker, 2026-08-25): plan de tandas 5 y 6

**Iker no está la semana del 2026-08-31 al 2026-09-04.** Por eso quiere las tandas 5 y 6 fuera antes de esa
semana, no dentro.

**⚠️ Corrección del 2026-08-25, entrada anterior de este fichero: el "choque" que se apuntó aquí era un
error mío, no un problema real.** Etiqueté el 26/08 como jueves y es MIÉRCOLES — 2026-08-25 es martes,
verificado a mano dos veces tras el aviso de Iker. Con la semana bien puesta, no hay ningún choque:

| fecha | día | qué va |
|---|---|---|
| 2026-08-26 | miércoles | **tanda 4** — ya programada, campaña Brevo id 5, sin tocar |
| 2026-08-27 | jueves | tanda 5 — pendiente de decidir el propio 27/08 |
| 2026-08-28 | viernes | tanda 6 — pendiente de decidir el propio 27/08 |

**Se decide y se programa el viernes 27/08**, una vez vistos TODOS los rebotes reales de la tanda 4
(mandada el miércoles 26). Con 24h de margen desde el envío es de sobra para ese momento.

**Lo único que sigue sin resolver, y esto NO era un error mío:** la tanda 6 en viernes 28 sería la
ÚLTIMA tanda en viernes — la regla de Mario documentada arriba en este mismo fichero dice explícitamente
que la última tanda no se manda en viernes (se la come el fin de semana). Se decide el 27/08 junto con
el resto: o se asume el riesgo a sabiendas (Iker está fuera la semana siguiente y quiere todo fuera
antes), o la 6 se deja para cuando vuelva.

## 🔴 PENDIENTE: dos correos NUEVOS, sin reutilizar el texto de Kaixito 01

Iker (2026-08-25, mismo mensaje donde pidió dejar dos semanas de posts de LinkedIn programadas):
necesita **un correo nuevo para todas las tandas de la semana que viene** (la semana en la que él no
está) **y otro correo nuevo distinto para la semana siguiente**. Palabras suyas: *"tienen que ser
nuevos, ya no puedo reutilizar el [texto actual]"*.

Nada escrito todavía. Cuando se aborde: leer `aboutme.md`, `brand-voice.md`, `working-preferences.md`,
`global-instructions.md` y este mismo fichero enteros antes de escribir una sola línea — es la regla de
CLAUDE.md para cualquier email, y aquí aplica el doble por ser contenido nuevo, no una variación de
Kaixito 01. El asunto y el preheader de Kaixito 01 (`¿no te acuerdas de mí?` / `Normal, es la primera
vez que te escribo.`) han abierto 30-43% en las 4 tandas — cualquier concepto nuevo se mide contra esa
vara, no se parte de cero.
