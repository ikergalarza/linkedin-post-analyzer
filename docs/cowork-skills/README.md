# Cowork skills — Neety LinkedIn post creator

Las 5 skills que destilan todo lo que sabe la herramienta (Post Creator +
análisis de outliers) para escribir posts **fuera de la app**, en Claude Cowork.
Fuente de verdad del "cerebro": `backend/src/services/postPrompt.ts` y el
`SYSTEM_PROMPT` de `backend/src/routes/chat.ts`.

## Orden de carga
1. **aboutme** — identidad: Neety, ICP, los 3 diferenciales (§1b) y los 3 perfiles (Iker / Unai / Asier).
2. **brand-voice** — el CÓMO suena (voz Neety, regla de audiencia, tabla anti-IA).
3. **working-preferences** — flujo de trabajo, entrega en bloques cercados, validación proactiva.
4. **global-instructions** — el QUÉ y el CÓMO-mecánico: hooks, cuerpos, 4 mecánicas, imágenes, timing.
5. **outliers-database** — datos vivos de arquetipos, hooks y ratios (la evidencia empírica).

## Estado / pendiente
- **`outliers-database` §3** (Top arquetipos con ratios reales + Top 20 hooks) está **pendiente de rellenar** con datos frescos del Dashboard/Explorer. Ver §0 y §5 de ese archivo para las tres vías de alimentación.
- Acceso automático al backend Railway (`linkedin-post-analyzer-production.up.railway.app`) y a Postgres directo: **bloqueado por la política de red del entorno** (403 en egress / TCP timeout). Última comprobación: 2026-07-09.
- Vía que funciona hoy sin tocar nada: **pegar el export/HTML del Explorer** en el chat; se destila y se rellena §3 automáticamente.
