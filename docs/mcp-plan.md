# PLAN — Servidor MCP de Neety

> Estado: **propuesta, nada implementado todavía.** Este documento es el catálogo de endpoints
> (tools MCP) posibles, de dónde sale cada uno y en qué orden construirlos.
> Fecha: 2026-07-28.

---

## 0 · Qué problema resuelve (y cuál no)

Hoy el "cerebro" de Neety vive en dos sitios que no se hablan:

1. **El backend** (Railway + Postgres): 1.894 outliers de la competencia, todo el histórico de
   las 3 cuentas propias con métricas Premium, reacciones, comentarios, lead magnet, Unipile.
   Se consulta a mano con `curl` y Basic Auth cada vez que se escribe un post.
2. **`docs/skills/`**: ~61.000 tokens de doctrina + el estado (`historial-publicaciones.md`,
   `menciones-usadas.json`) + los validadores en `scripts/`.

Cuando Claude escribe un post, el paso 2 lo tiene cargado (CLAUDE.md lo obliga) pero el paso 1
lo tiene que ir a buscar a pelo, recordando rutas de memoria. **El MCP es el puente:** convierte
las consultas de la receta (`post-workflow §4`) en herramientas tipadas que cualquier cliente
—Claude Code, Claude Desktop, claude.ai, o un agente en un cron— invoca sin saberse las rutas.

**Lo que el MCP NO es:** no es una segunda implementación del cerebro. `postPrompt.ts` y el
`SYSTEM_PROMPT` de `chat.ts` siguen siendo la fuente de verdad de *cómo se escribe*. El MCP sirve
**datos, estado y verificación**, no criterio.

---

## 1 · Los 3 consumidores (y por qué importan al diseño)

| Consumidor | Transporte | Qué necesita |
|---|---|---|
| **Claude Code / Desktop en el portátil de Iker** | `stdio` local o HTTP remoto | Todo: leer corpus, verificar menciones, validar, actualizar historial |
| **claude.ai / móvil** (escribir un post desde el sofá) | **HTTP remoto obligatorio** | Solo lectura + generación. Nada que toque el repo |
| **Automatizaciones** (cron: "resume la semana", monitor de outliers) | HTTP remoto | Lectura + escritura acotada |

**Decisión recomendada:** un solo servidor **Streamable HTTP montado en el propio backend Express**
(`/mcp`), porque cubre a los tres y hereda despliegue, Postgres y credenciales de Unipile que ya
están en Railway. Para las tools que tocan el repo (validador, historial) se añade **un segundo
servidor `stdio` mínimo** que corre local, porque el fichero `historial-publicaciones.md` y
`scripts/validar-post.py` viven en el working copy, no en el server.

```
┌─ Railway (backend Express) ──────────────┐     ┌─ Portátil ────────────────┐
│  /api/**            (frontend + REST)    │     │  mcp-neety-local (stdio)  │
│  /mcp               (MCP Streamable HTTP)│     │   · validar_post          │
│    · corpus, outliers, analytics         │     │   · historial_read/append │
│    · unipile (verificación de menciones) │     │   · menciones_cruzar      │
│    · generación (chat, brainstorm)       │     │   (lee el working copy)   │
└──────────────────────────────────────────┘     └───────────────────────────┘
```

**Auth del `/mcp` remoto:** el Basic Auth actual (`basicAuthMiddleware`) ya protege todo salvo
`/r/**`, `/api/submit` y `/api/health`. `/mcp` debe quedar **dentro** del gate. Los clientes MCP
mandan mal el `Authorization: Basic` en muchos casos, así que la opción sólida es un
**bearer token dedicado** (`MCP_TOKEN` en Railway) comprobado con `timingSafeEqual`, igual que
`basicAuth.ts`. No reutilizar `APP_BASIC_PASS`: si un día se comparte el MCP con un tercero,
se revoca el token sin cambiar la contraseña de la app.

---

## 2 · Cinco principios de diseño (leer antes del catálogo)

1. **No mapear 1:1 el REST.** Hay ~90 rutas Express. Un MCP con 90 tools se come el contexto
   antes de empezar a trabajar. El objetivo es **~12 tools en fase 1 y ~26 en total**, cada una
   con filtros, no una tool por ruta.
2. **Presupuesto de payload por tool.** Una tool MCP devuelve texto al contexto del modelo.
   `GET /api/analysis/cross-creators` hoy carga **todos los posts de todos los creadores en
   memoria** y devuelve 500 outliers enriquecidos con `ai_explanation` y `narrative_rhythm`: son
   megas. Servido tal cual reventaría cualquier ventana. **Toda tool de listado devuelve un
   resumen compacto (≤ ~2.000 tokens) y un `id` para pedir el detalle.**
3. **Lectura por defecto, escritura explícita.** Las tools que publican, envían DMs o responden
   comentarios se marcan `destructive`/`openWorld` y llevan `dry_run` por defecto.
4. **Las tools devuelven markdown, no JSON crudo**, cuando el consumidor es el modelo. JSON solo
   donde el dato se va a reprocesar (p. ej. el CSV de PamPam).
5. **El estado se lee ANTES y se escribe DESPUÉS.** `historial-publicaciones.md` y
   `menciones-usadas.json` son las dos únicas fuentes de "qué ya hicimos". Si el MCP no las expone,
   el planificador semanal sigue adivinando.

---

## 3 · EL CATÁLOGO DE ENDPOINTS

Leyenda de origen: **[E]** existe ya en el backend · **[N]** hay que construirlo ·
**[R]** existe pero necesita un modo compacto para MCP.

### A · Corpus propio — las 3 cuentas (Iker / Unai / Asier)

| Tool | Input | Devuelve | Origen | Fase |
|---|---|---|---|---|
| `neety_cuentas` | — | Las 3 cuentas gestionadas con su `creator_id`, seguidores, último post | **[E]** `GET /api/accounts` + `/api/creators` | 1 |
| `neety_posts` | `cuenta?`, `pilar?`, `solo_outliers?`, `desde?`, `hasta?`, `orden?`, `limit≤50` | Tabla compacta: fecha · cuenta · pilar · hook (80 chars) · `outlier_ratio` · impresiones · `post_id` | **[R]** `PostModel.findByCreator` (+ filtro `pillar` y rango de fechas, que hoy no tiene) | 1 |
| `neety_post` | `post_id` | El post entero: texto, métricas Premium (`saves`, `sends`, `link_clicks`, `profile_viewers`, `followers_gained`), `reaction_mix`, `hook_type`, `post_structure`, URL | **[E]** `PostModel` + `GET /api/posts/post/:id/media` | 1 |
| `neety_buscar` | `q`, `ambito: propios\|competencia\|todos`, `solo_outliers?`, `limit` | Búsqueda de texto sobre `content_text` + `hook_text` + `topic`. **Hoy NO existe como endpoint**: solo el `ILIKE` privado de `getBrainstormContext` (`ideas.ts:993`) | **[N]** `GET /api/posts/search` | 1 |
| `neety_analytics` | `cuenta?`, `rango` (7/30/90d) | KPIs del periodo + delta contra el anterior: posts, outliers, engagement medio, impresiones | **[E]** `GET /api/accounts/analytics` | 2 |
| `neety_crecimiento` | `cuenta`, `metrica: seguidores\|impresiones\|visitas_perfil`, `granularidad` | Serie temporal | **[E]** `follower-history` · `follower-monthly` · `impressions-monthly` · `profile-view-history` | 2 |
| `neety_posts_vivos` | `cuenta?` | Posts de las últimas 48-72h con su curva de snapshots (lo que está corriendo ahora) | **[E]** `GET /api/accounts/live-posts` | 2 |

### B · Outliers y patrones — la evidencia

| Tool | Input | Devuelve | Origen | Fase |
|---|---|---|---|---|
| `neety_outliers` | `ambito: propios\|competencia`, `pilar?`, `min_ratio?`, `limit≤30` | Top outliers ordenados por `outlier_ratio`: hook · ratio · pilar · creador · `post_id`. **Sin** `ai_explanation` (eso se pide por post) | **[R]** `getTopOutliersGlobal` / `GET /api/analysis/cross-creators` en modo compacto | 1 |
| `neety_patrones` | `ambito`, `cuenta?` | Los patrones agregados: mejor hora, longitud, tipo de hook, estructura, tono, arquetipos | **[E]** `getCrossCreatorPatterns` · `detectPatterns` · `detectArchetypes` | 2 |
| `neety_por_que_funciono` | `post_id` | El diagnóstico de un post concreto: `detectViralityDriver` + `generatePostExplanation` + `analyzeNarrativeRhythm` | **[E]** `patterns.ts` | 2 |
| `neety_stats` | `creator_id` | Totales, mediana, desviación, ventana temporal del creador | **[E]** `GET /api/analysis/:id/stats` | 3 |

### C · Verificación — Unipile (el filtro duro de menciones)

Este bloque es el que más trabajo manual quita: es el Paso 4 de `post-workflow §4.2` entero.

| Tool | Input | Devuelve | Origen | Fase |
|---|---|---|---|---|
| `neety_persona` | `url_o_id` | **Nombre exacto** (el que hay que escribir en la mención), `provider_id`, headline, ubicación | **[E]** `unipileService.getProfile` | 1 |
| `neety_persona_activa` | `provider_id`, `meses=3` | **El veredicto de mención: ✅/❌** — fecha del último comentario que ESA persona hizo en un post de otro. Es el filtro que hoy se corre a mano contra `/users/{id}/comments` | **[N]** envuelve `GET /api/v1/users/{id}/comments` (Unipile) — el backend aún no lo expone | 1 |
| `neety_empresa` | `identificador` | Nombre exacto, `logo_large`, `locations`, tamaño | **[E]** `unipileService` (`/linkedin/company/{id}`) | 1 |
| `neety_empresa_directivos` | `company_id`, `cargo?` | Directivos de la empresa vía búsqueda classic | **[E]** `unipileService.searchCompanies` + `/linkedin/search` | 2 |
| `neety_comentarios_post` | `linkedin_post_id`, `limit≤50` | El **texto** de los comentarios de cualquier post. La prueba de comment-gating de `outliers-database §3.9b`: si una palabra sale en ≥50-60%, es lead magnet | **[E]** `unipileService.getPostComments` | 1 |
| `neety_comentarios_analisis` | `linkedin_post_id` | Lo anterior ya masticado: histograma de palabras repetidas + veredicto "comment-gated: sí/no · palabra: X · %" | **[N]** capa sobre la anterior | 2 |

> ⚠️ **Cuota de Unipile.** `neety_persona_activa` sobre una lista de 20 candidatos son 20 llamadas.
> Cachear el resultado en Postgres (tabla `mention_activity_cache`, TTL ~7 días) o el planificador
> semanal se come el rate limit el lunes por la mañana.

### D · Estado y doctrina — el repo (servidor `stdio` local)

| Tool | Input | Devuelve | Origen | Fase |
|---|---|---|---|---|
| `neety_skill` | `nombre` | El contenido de `docs/skills/<nombre>.md`. También expuesto como **resource** (§4) | **[N]** lee el working copy | 1 |
| `neety_historial` | `semanas=3`, `cuenta?` | Las últimas filas del `historial-publicaciones.md` + la tabla de cobertura por cuenta (regiones y conceptos gastados) | **[N]** parsea `historial-publicaciones.md` | 1 |
| `neety_historial_anotar` | `semana`, `cuenta`, `dia`, `categoria`, `pilar`, `region_o_tema`, `estado`, `notas` | Añade la fila y **deja el fichero listo para commitear**. No commitea solo: el commit lo decide quien aprueba | **[N]** escribe el MD | 3 |
| `neety_menciones_cruzar` | `lista[]` (empresas y/o personas), `region?` | Cuáles de esas entidades **ya salieron** en un post anterior, cruzando `menciones-usadas.json` **normalizado** (sin acentos, minúsculas, sin `SA/SAU/SL/Grupo`) — el cruce de `post-workflow §4.0c` que "a ojo no se esquiva" | **[N]** reusa la lógica de `scripts/extraer-menciones.mjs` | 1 |
| `neety_validar_post` | `texto`, `pilar: mapa\|los10\|meme\|leadmagnet`, `cuenta?` | La salida literal del validador (`N/M` + violaciones). **Esto es lo que hace que el validador deje de ser opcional**: hoy hay que escribir un fichero temporal y acordarse de correr el script | **[N]** ejecuta `scripts/validar-post.py` | 1 |
| `neety_validar_email` | `texto` | Ídem con `scripts/validar-email.py` | **[N]** | 2 |

### E · Generación — lo que ya sabe escribir el backend

| Tool | Input | Devuelve | Origen | Fase |
|---|---|---|---|---|
| `neety_brainstorm` | `tipo_post`, `tema`, `angulo?`, `grounding`, `n≤20` | N ideas ancladas en outliers reales | **[E]** `POST /api/ideas/inspiration/brainstorm` | 2 |
| `neety_roaster` | `texto` | La crítica del borrador con el criterio del corpus | **[E]** `POST /api/accounts/roaster/analyze` | 2 |
| `neety_ideas_kanban` | `estado?` | El pipeline de ideas (proposed → …) | **[E]** `GET /api/ideas/kanban` | 3 |
| `neety_rastro` | `post_id` | Genera el análisis del lead magnet para la web `recursos.neety.com` | **[E]** `POST /api/accounts/rastro/generate` | 3 |

> **`POST /api/chat` NO se expone como tool.** Sería Claude llamando a Claude con un system prompt
> de 100K tokens: se paga dos veces y el resultado es peor que el del cliente que ya tiene las
> skills cargadas. El cerebro de `postPrompt.ts` se aprovecha mejor exponiendo sus **piezas**
> (`HOOK_LAW`, `NEETY_MECHANICS`, `REMIX_PRINCIPLES`…) como resources — ver §4.

### F · Competencia y descubrimiento

| Tool | Input | Devuelve | Origen | Fase |
|---|---|---|---|---|
| `neety_creadores` | `q?` | Los creadores trackeados de la competencia | **[E]** `GET /api/creators` | 3 |
| `neety_creador_añadir` | `linkedin_url` | Da de alta y escanea un creador nuevo | **[E]** `POST /api/creators` | 3 |
| `neety_feed_red` | `estado?`, `limit` | El feed de la red para comentar | **[E]** `GET /api/network/feed` | 3 |
| `neety_descubrir` | `keywords`, `filtros` | Búsqueda de creadores nuevos | **[E]** `POST /api/discover/search` | 3 |

### G · Operación del lead magnet — **escritura sensible**

Todas con `dry_run: true` por defecto y `readOnlyHint: false`. Ninguna se ejecuta sin que el
usuario vea antes exactamente qué se va a mandar y a quién.

| Tool | Input | Devuelve | Origen | Fase |
|---|---|---|---|---|
| `neety_lm_comentaristas` | `post_id` | Quién comentó, con estado de envío (ya enviado / pendiente / falló) | **[E]** `lead-magnet/posts` + `/sends` + `/commenter` | 3 |
| `neety_lm_enviar` | `post_id`, `provider_id`, `texto`, `dry_run` | Manda el DM con el recurso | **[E]** `POST /api/accounts/lead-magnet/send` | 4 |
| `neety_comentario_responder` | `post_id`, `comment_id`, `texto`, `dry_run` | Responde un comentario | **[E]** `POST …/comments/:id/reply` | 4 |
| `neety_comentario_reaccionar` | `post_id`, `comment_id`, `tipo` | Reacciona a un comentario | **[E]** `POST …/comments/:id/react` | 4 |

### H · Lo que NO se expone

- `DELETE /api/creators/:id`, `DELETE /api/ideas/kanban/clear`, `DELETE …/snapshots/zero-impressions`,
  `POST /api/accounts/demo-seed` — borrado y datos falsos. Ningún agente los necesita.
- `POST /api/creators/reclassify`, `POST /api/posts/classify-pillars`, `POST /api/reactions/backfill/start`,
  `POST /api/accounts/backfill-premium-analytics` — jobs pesados de mantenimiento. Se lanzan a mano.
- `POST /api/accounts/:id/scrape`, `POST …/live-refresh`, `POST …/followers/sync` — consumen cuota de
  Unipile de golpe. Si se exponen algún día, con `dry_run` y un contador de coste en la respuesta.
- `/api/submit` y `/r/**` — son las páginas públicas del lead magnet. No pintan en un MCP.
- `POST /api/accounts/sendInvitation` / `sendDirectMessage` en crudo — mandar invitaciones o DMs
  arbitrarios desde una cuenta de founder es exactamente el tipo de acción que no debe poder
  disparar un agente por su cuenta.

---

## 4 · Resources y Prompts (la otra mitad del MCP)

Las tools son verbos. MCP también sirve **resources** (contexto que el cliente adjunta) y
**prompts** (plantillas invocables). Aquí es donde encaja la doctrina.

**Resources** — `neety://…`
- `neety://skills/{aboutme|brand-voice|global-instructions|outliers-database|swipe-file|post-workflow|images|video|lead-magnet-web|email-marketing|working-preferences}`
  → los MD tal cual. Un cliente que no sea Claude Code (claude.ai, móvil) no tiene el repo:
  esto es lo que le da el cerebro.
- `neety://estado/historial-publicaciones` y `neety://estado/historial-newsletter` → el estado vivo.
- `neety://estado/menciones-usadas` → el JSON de 518 entidades ya mencionadas.
- `neety://prompt/{hook-law|neety-mechanics|remix-principles|meme-visual-system|video-script}`
  → las constantes exportadas de `postPrompt.ts`. Fuente de verdad única, sin duplicar el texto.

**Prompts** — plantillas con argumentos, que ordenan la receta de `post-workflow §4`:
- `escribir-mapa(region, cuenta)` — encadena: historial → cruce de menciones → verificación →
  hook → validador.
- `escribir-los10(region, cuenta)`
- `escribir-meme(tema, cuenta)`
- `escribir-lead-magnet(recurso, cuenta)`
- `planificar-semana()` — el planificador de las 3 cuentas (`post-workflow §8`).
- `escribir-newsletter(tema, remitente)` — `email-marketing`.

---

## 5 · Lo que hay que construir en el backend (los huecos reales)

De todo el catálogo, esto es lo que **no existe** y hay que picar:

1. **`GET /api/posts/search`** — búsqueda de texto sobre el corpus (propios + competencia), con
   filtros de pilar, cuenta, `is_outlier` y rango de fechas. Hoy solo existe el `ILIKE` privado de
   `getBrainstormContext`. Es la tool más usada del MCP y no tiene endpoint.
   → Con `pg_trgm` + índice GIN sobre `content_text`; el `ILIKE %x%` actual no escala a 2.000 posts
   con la tabla creciendo.
2. **Filtro por `pillar` y por rango de fechas en `PostModel.findByCreator`** — la columna `pillar`
   existe desde la migración v-final pero `PostFilters` no la contempla.
3. **Modo compacto de `/api/analysis/cross-creators`** — hoy hace N+1 queries (un
   `findByCreator(limit: 10000)` por creador) y enriquece 500 posts. Para MCP hace falta
   `?format=compact&limit=30` que no cargue el mundo entero.
4. **`GET /api/unipile/person/:id/activity?months=3`** — el filtro duro de menciones, con caché en
   Postgres. Es la pieza con más ahorro de trabajo manual de todo el plan.
5. **Parser de `historial-publicaciones.md`** — leer la tabla de cobertura y las filas de forma
   estructurada, y añadir filas sin romper el formato.
6. **Wrapper de los validadores** — ejecutar `validar-post.py` / `validar-email.py` sobre un texto
   en memoria y devolver su salida y su exit code.

---

## 6 · Fases

| Fase | Qué entra | Por qué primero |
|---|---|---|
| **F0 · Esqueleto** | `@modelcontextprotocol/sdk` en `backend`, `/mcp` con auth por `MCP_TOKEN`, servidor `stdio` local, 1 tool de humo (`neety_cuentas`) | Verificar transporte y auth antes de escribir 25 tools |
| **F1 · Escribir un post sin curl** (12 tools) | `neety_cuentas`, `neety_posts`, `neety_post`, `neety_buscar`, `neety_outliers`, `neety_persona`, `neety_persona_activa`, `neety_empresa`, `neety_comentarios_post`, `neety_historial`, `neety_menciones_cruzar`, `neety_validar_post` + los resources de skills | Cubre la receta del mapa y de "Los 10" de punta a punta. **Aquí ya se nota** |
| **F2 · Diagnóstico y creación** | `neety_analytics`, `neety_crecimiento`, `neety_posts_vivos`, `neety_patrones`, `neety_por_que_funciono`, `neety_comentarios_analisis`, `neety_brainstorm`, `neety_roaster`, `neety_validar_email` + los prompts | Responder "¿por qué funcionó?" y "¿qué escribo?" sin salir del chat |
| **F3 · Estado y pipeline** | `neety_historial_anotar`, `neety_stats`, `neety_ideas_kanban`, `neety_rastro`, `neety_lm_comentaristas`, bloque F (competencia) | Primeras escrituras, todas reversibles |
| **F4 · Acciones sobre LinkedIn** | `neety_lm_enviar`, `neety_comentario_responder`, `neety_comentario_reaccionar` | Lo irreversible va al final y con `dry_run` |

---

## 7 · Riesgos y decisiones abiertas

- **Contexto.** 26 tools con sus descripciones son ~4-6K tokens en cada turno. Si se nota, partir en
  dos servidores (`neety-datos` y `neety-operacion`) y que el cliente cargue solo el que necesita.
- **Cuota de Unipile.** El planificador semanal puede disparar 60+ llamadas de verificación de
  menciones. Sin caché, se rompe. Ver el aviso de §3.C.
- **Coste de las tools de generación.** `neety_brainstorm` y `neety_roaster` llaman a la API de
  Anthropic desde el backend: se contabilizan en `claude_usage_logs` pero las paga el backend, no
  la suscripción del cliente. Conviene que la respuesta diga cuánto costó.
- **El MCP no relaja ninguna regla de CLAUDE.md.** Que `neety_validar_post` exista no sustituye a
  pegar su resultado en la entrega; que `neety_persona` devuelva un nombre no autoriza a mencionar a
  quien no comenta. El MCP hace las reglas *baratas de cumplir*, no opcionales.
- **Duplicidad de doctrina.** Los resources de skills y las constantes de `postPrompt.ts` dicen cosas
  parecidas con palabras distintas (uno en español, otro en inglés). El MCP las pone una al lado de
  la otra y va a hacer visible cada divergencia. Es bueno, pero hay que decidir quién manda: la
  propuesta es **`docs/skills/` manda para escribir a mano, `postPrompt.ts` manda para el Post
  Creator**, y el resource lo dice explícitamente.

### Lo que hay que decidir antes de picar código

1. **¿Servidor único remoto o el par remoto+local?** El plan asume el par, porque el validador y el
   historial viven en el repo. La alternativa (subir el historial a Postgres y tener un solo servidor
   remoto) es más limpia a largo plazo pero mueve el estado fuera de git, donde hoy se versiona.
2. **¿Se expone el corpus de competencia entero (1.894 outliers) o solo el top?** Afecta al diseño de
   `neety_outliers` y `neety_buscar`.
3. **¿`neety_historial_anotar` commitea y pushea, o solo edita el fichero?** El plan propone lo
   segundo (el commit lo decide quien aprueba el post).
