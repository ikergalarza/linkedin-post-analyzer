# Cowork skills — Neety LinkedIn post creator

Las 5 skills que destilan todo lo que sabe la herramienta (Post Creator +
análisis de outliers) para escribir posts **fuera de la app**, en Claude Cowork.
Fuente de verdad del "cerebro": `backend/src/services/postPrompt.ts` y el
`SYSTEM_PROMPT` de `backend/src/routes/chat.ts`.

## Orden de carga
1. **aboutme** — identidad: Neety, ICP, los 3 diferenciales (§1b) y los 3 perfiles (Iker / Unai / Asier) con headlines.
2. **brand-voice** — el CÓMO suena (voz Neety literal, regla de audiencia, tabla anti-IA).
3. **working-preferences** — flujo de trabajo, entrega en bloques cercados, validación proactiva.
4. **global-instructions** — el QUÉ y el CÓMO-mecánico del post de TEXTO: hooks, cuerpos, 4 mecánicas, timing. (Va en un campo de input de solo texto; imagen y vídeo salieron a sus propias skills.)
5. **outliers-database** — datos vivos de arquetipos, hooks y ratios (la evidencia empírica).

Skills de artefacto (cargar según el post lo pida):
6. **images** — concepto de imagen: 3 registros, paleta + tipografía + palabra naranja, calcar referencia, sistema meme, infografías quemadas.
7. **video** — el vídeo es OTRO artefacto: 3 piezas (caption / texto en pantalla / spoken hook), 6 patrones de gancho hablado y el playbook de 36 puntos. Cargar solo en modo vídeo; reemplaza las reglas de hook de texto.

## Estado / pendiente
- **`outliers-database` §3** ya está **relleno** con el snapshot cross-creator del Explorer (2026-07-09): recetas hook×estructura×tono, distribuciones, aperturas/cierres, estilo, formato, timing y banco de remix. Fuente: `docs/explorer completo.pdf`.
- **Sigue pendiente:** el split por cuenta Neety (Iker vs Unai vs Asier) — el export es cross-creator, no por cuenta propia. Y el refresco periódico del snapshot (los ratios decaen).
- Acceso automático al backend Railway (`linkedin-post-analyzer-production.up.railway.app`) y a Postgres directo: **sigue bloqueado por la política de red del entorno** (403 en egress / TCP timeout). Última comprobación: 2026-07-09. Por eso §3 se cargó a mano desde el PDF.
- Vía de refresco que funciona hoy sin tocar nada: **reexportar el Explorer** (PDF/HTML) y volver a destilarlo a §3.
