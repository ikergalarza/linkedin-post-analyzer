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
- 🔴 **Pendientes de configuración, antes de enviar nada:**
  1. **Idioma de la cuenta en INGLÉS** (en-US) → pasar a español, o el pie de baja y los textos del sistema salen en inglés.
  2. **Remitente genérico** "Neety `<management@neety.com>`" → dar de alta remitentes-persona (`email-marketing §1`: Kaixito, Iker, Unai, Asier).
  3. **Dominio sin autenticar** (no verificable por MCP: mirar en Ajustes → Dominios). Es el bloqueante nº 1.
  4. **Falta un campo personalizado `origen`** (los 8 existentes son los de serie): es el que sostiene toda la segmentación del correo 0.
- **Primer correo:** el correo 0 segmentador (`email-marketing §5c-0`), aún no enviado.

## Rotación de remitentes
| Semana | Remitente principal | Notas |
|---|---|---|
| _(sin envíos todavía)_ | | |

## Emails enviados
| Fecha | Remitente | Pilar | Asunto | Segmento | CTA (tipo/palabra) | Métricas (opens/clics/respuestas/demos) |
|---|---|---|---|---|---|---|
| _(sin envíos todavía)_ | | | | | | |

## Palabras de CTA-respuesta ya usadas (no repetir)
_(ninguna)_

## Ángulos ya usados (no repetir, como los conceptos del mapa)
_(ninguno)_
