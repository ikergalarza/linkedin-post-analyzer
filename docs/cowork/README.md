# Cowork skills — Neety LinkedIn post creator

Las skills que destilan todo lo que sabe la herramienta (Post Creator +
análisis de outliers) para escribir posts **fuera de la app**, en Claude Cowork.
Fuente de verdad del "cerebro": `backend/src/services/postPrompt.ts` y el
`SYSTEM_PROMPT` de `backend/src/routes/chat.ts`.

## Orden de carga
1. **aboutme** — identidad: Neety, ICP, los 3 diferenciales (§1b) y los 3 perfiles (Iker / Unai / Asier) con headlines.
2. **brand-voice** — el CÓMO suena (voz Neety literal, regla de audiencia, tabla anti-IA).
3. **working-preferences** — flujo de trabajo, entrega en bloques cercados, validación proactiva.
4. **global-instructions** — el QUÉ y el CÓMO-mecánico del post de TEXTO: hooks, cuerpos, 4 mecánicas, timing. Cubre solo el post de texto; imagen y vídeo tienen sus propias skills.
   > ⚠️ **`global-instructions.md` va como ARCHIVO en `context/`. NO se pega en el campo de "instrucciones del proyecto".** Son ~38 KB de doctrina. Lo que se pega en ese campo es el bloque corto de `BOOTSTRAP.md`. Regla mental: **el campo de instrucciones dice DÓNDE mirar; `context/` es LO que se mira.**
5. **outliers-database** — datos vivos de arquetipos, hooks y ratios (la evidencia empírica; §4 = histórico real por cuenta, §5 = evidencia externa ColdIQ).
6. **swipe-file** — los TEXTOS completos de nuestros mejores outliers reales, anotados por pilar y estructura. Cargar al escribir hooks/cuerpos para copiar la anatomía exacta.

Skills de artefacto (cargar según el post lo pida):
7. **images** — concepto de imagen: 3 registros, paleta + tipografía + palabra naranja, calcar referencia, sistema meme, infografías quemadas.
8. **video** — el vídeo es OTRO artefacto: 3 piezas (caption / texto en pantalla / spoken hook), 6 patrones de gancho hablado y el playbook de 36 puntos. Cargar solo en modo vídeo; reemplaza las reglas de hook de texto.

Orquestación:
9. **post-workflow** — cómo montar el workflow en Cowork, la RECETA cronológica por pilar, y **§8 el workflow real: planificador semanal de las 3 cuentas** (categorías peloteo/lead magnet/meme, intercalado 3×3, pregunta previa). Adapta el marco de workflows del playbook interno sin pisar las skills de datos.

Estado (no doctrina):
10. **historial-publicaciones** — registro vivo de lo que publica cada cuenta cada semana. Lo LEE el planificador (§8.3) para respetar el espaciado y lo ACTUALIZA tras aprobar la semana. Hay que persistirlo cada semana (re-subir / commit).

## Montaje en Cowork — esta carpeta YA ES la estructura, cópiala tal cual
Principio: **`context` = lo que Claude LEE · `project` = ESTADO que cambia · `output` = lo que Claude ENTREGA.**

`docs/cowork/` está ordenada exactamente como tiene que quedar el proyecto de Cowork. **Sube las tres carpetas tal cual**, sin reorganizar nada:

```
docs/cowork/
├── context/     ← súbela entera (11 archivos: 9 .md + 2 .csv)
├── project/     ← súbela entera (historial-publicaciones.md)
├── output/      ← créala VACÍA en Cowork (aquí solo hay un README que no se sube)
├── BOOTSTRAP.md ← NO se sube: su contenido se PEGA en "instrucciones del proyecto"
└── README.md    ← NO hace falta subirlo (es la guía de montaje)
```

- **`context/`** (conocimiento estático, read-only): `aboutme` · `brand-voice` · `working-preferences` · `global-instructions` · `outliers-database` · `swipe-file` · `images` · `video` · `post-workflow` · `ref_import_navarra.csv` (plantilla CSV de PamPam) · `ref_empresas_industriales_pais-vasco.csv` (semilla de 346 empresas ICP para mapa/"Los 10" del País Vasco).
- **`project/`** (estado vivo, mutable): `historial-publicaciones.md` y los planes semanales ya aprobados. **Ojo: NO va en `context/`.** Es estado que cambia cada semana, y hay que **re-subirlo/commitearlo cada vez que se actualiza** o el planificador se queda ciego y vuelve a preguntar.
- **`output/`** (entregables): vacía al empezar, la llena Claude. Una subcarpeta por post o por semana.
- **Campo de "instrucciones del proyecto":** un **bootstrap CORTO**, NO toda la doctrina (`global-instructions.md` va como archivo en `context/`, no pegado ahí). **El texto está escrito y listo para pegar en `BOOTSTRAP.md`.**
- **NO subas** `docs/explorer completo.pdf` (17 MB, ya destilado en `outliers-database §3`).

## Estado / pendiente
- **`outliers-database` §3** ya está **relleno** con el snapshot cross-creator del Explorer (2026-07-09): recetas hook×estructura×tono, distribuciones, aperturas/cierres, estilo, formato, timing y banco de remix. Fuente: `docs/explorer completo.pdf`.
- **Sigue pendiente:** el split por cuenta Neety (Iker vs Unai vs Asier) — el export es cross-creator, no por cuenta propia. Y el refresco periódico del snapshot (los ratios decaen).
- **Backend Railway — CORREGIDO (2026-07-14): NO está bloqueado por red.** La nota anterior decía "403 en egress / TCP timeout" y eso ya no se sostiene: desde Claude Code, `GET /api/health` responde `200 {"status":"ok"}` y el resto de endpoints responde **401**, que no es un bloqueo sino una petición de credenciales. El backend monta **HTTP Basic Auth** (`backend/src/middleware/basicAuth.ts`) delante de todas las rutas.
  **Lo que falta para refrescar los datos en automático son CREDENCIALES, no red:** `APP_BASIC_USER` y `APP_BASIC_PASS` como variables de entorno (y `DATABASE_URL` si se quiere ir a Postgres directo). En el repo solo hay `backend/.env.example`, sin valores. Con esas vars puestas, `/api/analysis/*` y `/api/creators/*` quedan accesibles y §3/§4 se pueden refrescar en vivo, incluidas las imágenes de cada outlier.
  **Unipile sí funciona ya** (`UNIPILE_API_KEY`, `UNIPILE_BASE_URL`, `UNIPILE_ACCOUNT_ID` están en el entorno): verificado el 2026-07-14 sacando las 20 empresas de Aragón, su actividad de LinkedIn y sus logos. Ojo, que Unipile funcione NO implica que Railway funcione: son hosts y credenciales distintas.
- Vía de refresco que funciona hoy sin credenciales: **reexportar el Explorer** (PDF/HTML) y volver a destilarlo a §3.
