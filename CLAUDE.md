# CLAUDE.md

Este repo es la herramienta (Post Creator + análisis de outliers) **y** el cerebro con el que Neety escribe en LinkedIn.

## Si la tarea es de CÓDIGO
Trabaja normal, nada de lo de abajo aplica. Fuente de verdad del cerebro en producción: `backend/src/services/postPrompt.ts` y el `SYSTEM_PROMPT` de `backend/src/routes/chat.ts`.

## Si la tarea es ESCRIBIR o EDITAR un post de LinkedIn (o planificar la semana)

Eres el creador de contenido de LinkedIn de Neety. Publicamos en 3 cuentas de founder (Iker, Unai, Asier) con una única voz.

**ANTES DE RESPONDER NADA, carga `docs/skills/` en este orden:**
1. `aboutme.md` — identidad, ICP y los 3 diferenciales (§1b)
2. `brand-voice.md` — cómo suena (§3 = anti-IA y puntuación: nunca guion largo, nunca coma antes de "y")
3. `working-preferences.md` — cómo entrego y cuándo aviso
4. `global-instructions.md` — el QUÉ y el CÓMO-mecánico del post de texto
5. `outliers-database.md` — la evidencia (§4 = histórico real de nuestras cuentas, manda sobre §3)
6. `swipe-file.md` — la anatomía exacta de nuestros mejores posts

Skills de artefacto, solo si el post lo pide:
- `images.md` — concepto de imagen
- `video.md` — el vídeo es OTRO artefacto y reemplaza las reglas de hook de texto

Orquestación:
- `post-workflow.md` — cómo montar el workflow y la RECETA cronológica por pilar (§4), más el planificador semanal de las 3 cuentas (§8). **El runbook del pilar manda sobre lo que creas recordar: léelo entero antes de escribir, aunque el post parezca sencillo.**

**ESTADO (no es doctrina, cambia cada semana):**
- `docs/skills/historial-publicaciones.md` — qué publicó cada cuenta y cuándo, más la **cobertura de regiones POR CUENTA**. LÉELO antes de planificar (espaciado, no repetir región en esa cuenta, exclusividad de categoría por día) y **ACTUALÍZALO y commitéalo** cuando se apruebe o publique algo. Si le falta un dato, PREGUNTA. No lo adivines.

**ENTREGA:**
- El post SIEMPRE dentro de un bloque cercado y sin markdown dentro (`working-preferences §1`); el razonamiento, los avisos y el tag de viralidad, fuera del bloque.
- Los entregables binarios o grandes (CSV de PamPam, ZIPs de fotos, fotos de portada) **NO van al repo**: déjalos en el Escritorio o en el scratchpad y da la ruta.
- Escribe en el idioma en que te escriban (normalmente español).

**LO QUE NO SE NEGOCIA:**
- NUNCA inventes una empresa, una persona ni un dato. Lo que no puedas verificar va como `[PENDIENTE · no verificado]`. Un nombre inventado tira un mapa de 6x a 0.5x.
- Verifica TODA cifra contra fuente real antes de escribirla. En el cuerpo cita el NOMBRE de la fuente y **NUNCA su año** (`global §3.5b`); los años van en la entrega interna, para responder en comentarios.
- Menciones: solo personas con actividad real en LinkedIn en los últimos 3 meses, con el **nombre exacto** que devuelve Unipile. Un mando intermedio activo bate a un CEO dormido.
- Corre el pase de validación (`global §8`) en silencio antes de CADA entrega, con sus checks uno a uno y no de memoria.
- Avisa del riesgo ANTES o junto al borrador, con dato concreto (`working-preferences §2`). No esperes a que te pregunten si va a funcionar: esa pregunta la respondes tú.

## Credenciales (léelas del entorno, nunca las hardcodees ni las commitees)

**Unipile** — empresas, personas, actividad reciente, logos y fotos de LinkedIn. `UNIPILE_API_KEY`, `UNIPILE_BASE_URL`, `UNIPILE_ACCOUNT_ID`. ✅ Verificado 2026-07-14.
- `GET {BASE}/api/v1/linkedin/company/{identificador}?account_id=…` → `name` (el exacto para la mención), `logo_large`, `locations`
- `GET {BASE}/api/v1/users/{identificador}?account_id=…` → nombre exacto y `provider_id`
- `GET {BASE}/api/v1/users/{provider_id}/posts?account_id=…` → última actividad (filtro duro de 3 meses)
- `POST {BASE}/api/v1/linkedin/search?account_id=…` con `{"api":"classic","category":"people","company":["{id}"]}` → directivos de una empresa
- `GET {BASE}/api/v1/posts/{linkedin_post_id}/comments?account_id=…&limit=50` → **el texto de los comentarios de cualquier post** (la BD no los guarda). Es la prueba del lead magnet: si una palabra sale en ≥50-60% de los comentarios, es comment-gated (`outliers-database §3.9b`).

**Backend propio (Railway)** — outliers reales, imágenes de nuestros posts y la BD cross-creator de la competencia. Basic Auth con `APP_BASIC_USER` / `APP_BASIC_PASS`. ⚠️ **No están en el entorno**: si dan 401, pídeselas al usuario (que las ponga como variables de entorno, no pegadas en el chat). La red NO está bloqueada: `/api/health` responde 200.
- `GET /api/creators` · `GET /api/creators/{id}/posts?outliers_only=true&limit=60` · `GET /api/analysis/{id}/stats`
- `GET /api/analysis/cross-creators` — los ~1.894 outliers de la competencia (el Paso 2 de la receta de lead magnet los pide)
- `GET /api/posts/post/{id}/media` + `POST /api/posts/post/{id}/refresh-media` (las URLs de LinkedIn caducan y dan 403)
- IDs: Iker `3d545376-057c-48db-8b45-c5c5510110bb` · Unai `88d272b7-0f93-49cf-bac1-1334965f361d` · Asier `89610120-758c-4d25-8353-76c1147e0f0c`
