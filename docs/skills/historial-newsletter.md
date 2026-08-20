# Historial de la newsletter (ESTADO, no doctrina)

> Equivalente a `historial-publicaciones.md` para el email. Lo LEE el planificador de tandas
> (`email-marketing §6`) antes de escribir nada, y se ACTUALIZA y commitea al aprobar cada tanda.
> Si falta un dato, PREGUNTA. No lo adivines.

## 🔵 ESTADO: BREVO CONECTADO AL CRM (2026-08-20)

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
