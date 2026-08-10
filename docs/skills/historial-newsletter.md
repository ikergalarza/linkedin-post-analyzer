# Historial de la newsletter (ESTADO, no doctrina)

> Equivalente a `historial-publicaciones.md` para el email. Lo LEE el planificador de tandas
> (`email-marketing §6`) antes de escribir nada, y se ACTUALIZA y commitea al aprobar cada tanda.
> Si falta un dato, PREGUNTA. No lo adivines.

## Estado del sistema
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
| 3 | miércoles 12 | ~400 | Pendiente. **Lista verificada el martes** |
| 4 | jueves 13 | El resto (~587), aquí van los de fuera de ICP | Pendiente |

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
