# Cowork skills — Neety LinkedIn post creator

Las skills que destilan todo lo que sabe la herramienta (Post Creator +
análisis de outliers) para escribir posts **fuera de la app**, en Claude Cowork.
Fuente de verdad del "cerebro": `backend/src/services/postPrompt.ts` y el
`SYSTEM_PROMPT` de `backend/src/routes/chat.ts`.

## Orden de carga
1. **aboutme** — identidad: Neety, ICP, los 3 diferenciales (§1b) y los 3 perfiles (Iker / Unai / Asier) con headlines.
2. **brand-voice** — el CÓMO suena (voz Neety literal, regla de audiencia, tabla anti-IA).
3. **working-preferences** — flujo de trabajo, entrega en bloques cercados, validación proactiva.
4. **global-instructions** — el QUÉ y el CÓMO-mecánico del post de TEXTO: hooks, cuerpos, 4 mecánicas, timing. (Va en un campo de input de solo texto; imagen y vídeo salieron a sus propias skills.)
5. **outliers-database** — datos vivos de arquetipos, hooks y ratios (la evidencia empírica; §4 = histórico real por cuenta, §5 = evidencia externa ColdIQ).
6. **swipe-file** — los TEXTOS completos de nuestros mejores outliers reales, anotados por pilar y estructura. Cargar al escribir hooks/cuerpos para copiar la anatomía exacta.

Skills de artefacto (cargar según el post lo pida):
7. **images** — concepto de imagen: 3 registros, paleta + tipografía + palabra naranja, calcar referencia, sistema meme, infografías quemadas.
8. **video** — el vídeo es OTRO artefacto: 3 piezas (caption / texto en pantalla / spoken hook), 6 patrones de gancho hablado y el playbook de 36 puntos. Cargar solo en modo vídeo; reemplaza las reglas de hook de texto.

Orquestación:
9. **post-workflow** — cómo montar el workflow en Cowork, la RECETA cronológica por pilar, y **§8 el workflow real: planificador semanal de las 3 cuentas** (categorías peloteo/lead magnet/meme, intercalado 3×3, pregunta previa). Adapta el marco de workflows del playbook interno sin pisar las skills de datos.

Estado (no doctrina):
10. **historial-publicaciones** — registro vivo de lo que publica cada cuenta cada semana. Lo LEE el planificador (§8.3) para respetar el espaciado y lo ACTUALIZA tras aprobar la semana. Hay que persistirlo cada semana (re-subir / commit).

## Montaje en el proyecto de Cowork (3 carpetas + instrucciones)
Principio: **`context` = lo que Claude LEE · `project` = ESTADO que cambia · `output` = lo que Claude ENTREGA.**
- **`context/`** (conocimiento estático, read-only): `aboutme`, `brand-voice`, `working-preferences`, `global-instructions`, `outliers-database`, `swipe-file`, `images`, `video`, `post-workflow`, `ref_import_navarra.csv` (plantilla CSV de PamPam), `ref_empresas_industriales_pais-vasco.csv` (semilla de 346 empresas ICP para mapa/"Los 10" del País Vasco) y este `README`. Si el proyecto lee del repo, apunta `context/` a `docs/cowork-skills/`.
- **`project/`** (estado vivo, mutable): `historial-publicaciones.md` (se actualiza cada semana) y los planes semanales ya aprobados.
- **`output/`** (entregables): los posts copy-ready, los CSV de PamPam, las guías de menciones y las descripciones de 2 líneas — un archivo/subcarpeta por post o por semana.
- **Campo de "instrucciones del proyecto":** un **bootstrap CORTO**, NO toda la doctrina. `global-instructions.md` va como archivo en `context/`, no pegado aquí. El bootstrap solo orquesta: cargar `context/` en orden, seguir `post-workflow`, entregar según `working-preferences`, escribir en `output/`, actualizar `project/historial-publicaciones.md`, y leer las credenciales de Unipile de las env vars del entorno "Iker".

## Estado / pendiente
- **`outliers-database` §3** ya está **relleno** con el snapshot cross-creator del Explorer (2026-07-09): recetas hook×estructura×tono, distribuciones, aperturas/cierres, estilo, formato, timing y banco de remix. Fuente: `docs/explorer completo.pdf`.
- **Sigue pendiente:** el split por cuenta Neety (Iker vs Unai vs Asier) — el export es cross-creator, no por cuenta propia. Y el refresco periódico del snapshot (los ratios decaen).
- Acceso automático al backend Railway (`linkedin-post-analyzer-production.up.railway.app`) y a Postgres directo: **sigue bloqueado por la política de red del entorno** (403 en egress / TCP timeout). Última comprobación: 2026-07-09. Por eso §3 se cargó a mano desde el PDF.
- Vía de refresco que funciona hoy sin tocar nada: **reexportar el Explorer** (PDF/HTML) y volver a destilarlo a §3.
