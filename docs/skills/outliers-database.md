# SKILL: outliers-database — El análisis de outliers (arquetipos, hooks, patrones)

> **name:** outliers-database
> **description:** Los datos vivos de qué está funcionando: arquetipos con sus ratios reales, top hooks, patrones de lenguaje y formato, timing, y el contenido viral de las cuentas que trackeamos en la herramienta (Dashboard). Es la evidencia empírica sobre la que se apoya `global-instructions`.
> **when-to-use:** Cargar cuando necesites justificar una elección con datos reales (el tag de viralidad `🔥 ~Nx · arquetipo`), elegir arquetipo para una idea, o diagnosticar por qué algo funcionó/flopeó. Los números concretos se rellenan a mano desde el Dashboard (ver §5).

---

## 0 · IMPORTANTE — cómo se alimenta esta skill

> ✅ **Estado 2026-07-13:** el backend de **Railway YA es accesible** desde el entorno (antes daba 403). Ahora se puede consultar en vivo por HTTPS con auth básica. §3 (Explorer) y §4 (histórico + split por cuenta) se pueden **refrescar solos** desde la API — ya no hace falta pegar PDFs a mano.

El análisis real de outliers se calcula en vivo desde la base de datos (sección **Dashboard / Explorer**). Acceso directo por HTTPS (auth básica, usuario `Neety`):
- `GET /api/creators` — lista de las 149 cuentas trackeadas (managed + referencia).
- `GET /api/analysis/{id}/stats` — stats por cuenta: hook_type_breakdown, structure_breakdown, content_type, timing_heatmap, best_timing_slots (base del split por cuenta, §4).
- `GET /api/analysis/cross-creators` — análisis cross-creator (base de §3).
- `GET /api/analysis/{id}/export`, `/patterns`, `/timeline`, `/compare` — detalle fino.
- IDs managed: Iker `3d545376-057c-48db-8b45-c5c5510110bb` · Unai `88d272b7-0f93-49cf-bac1-1334965f361d` · Asier `89610120-758c-4d25-8353-76c1147e0f0c`.

**Para refrescar:** consulta esos endpoints y vuelca los números a §3/§4 (los ratios decaen; refresca cada 1-2 meses). Si el acceso vuelve a caer, la vía manual de siempre (pegar el export del Explorer) sigue valiendo.

Usa el **snapshot cross-creator** (§3), la **taxonomía** (§1) y el **histórico Neety** (§4). Los ratios cambian con cada scrape: trátalos como órdenes de magnitud, no como cifras exactas, hasta refrescar.

---

## 1 · Taxonomía (el vocabulario del análisis)

La herramienta clasifica cada post por **hook_type × post_structure × tone**. Estas son las etiquetas canónicas — úsalas al referirte a arquetipos.

### Tipos de hook (hook_type)
| clave | etiqueta |
|---|---|
| pattern_interrupt | Ruptura de patrón |
| belief_breaker | Rompe creencias |
| curiosity_gap | Intriga |
| data_shock | Dato impactante |
| hot_take | Opinión polémica |
| personal_confession | Confesión personal |
| story_opener | Apertura narrativa |
| hypothetical_question | Pregunta hipotética |
| why_question | Pregunta "por qué" |
| how_question | Pregunta "cómo" |
| direct_question | Pregunta directa |
| bold_claim | Afirmación audaz |
| common_mistake | Error frecuente |
| direct_callout | Llamada directa |
| list_promise | Promesa de lista |
| contrarian_take | Contrarian |
| relatable_moment | Momento relatable |
| motivational | Motivacional |
| observation | Observación |

### Estructuras (post_structure)
| clave | etiqueta |
|---|---|
| hook_list_cta | Hook → Lista → CTA |
| hook_story_lesson_cta | Historia → Lección → CTA |
| problem_agitate_solve | Problema → Agitación → Solución |
| contrarian_proof_reframe | Contrarian → Prueba → Reencuadre |
| confession_insight_takeaway | Confesión → Insight → Conclusión |
| list_framework | Framework en lista |
| problem_solution | Problema → Solución |
| story_lesson | Historia → Lección |
| before_after | Antes / Después |
| step_by_step | Paso a paso |
| myth_busting | Desmontando mitos |
| short_punchy | Corto e impactante |
| long_form_essay | Ensayo largo |
| data_driven | Basado en datos |

### Definición de outlier
Un post es **outlier** cuando supera **≥3x** el engagement promedio de su autor. El **outlier ratio** (cuánto sobre-rinde vs la media del autor) es la métrica clave, **no** el engagement bruto.

---

## 2 · Cómo se usa el arquetipo al escribir

- **Tag de viralidad obligatorio** en cada opción: `🔥 ~{ratio}x vs. media · {arquetipo} (n={count} outliers reales)`. El número prioriza el **histórico Neety** (§4, cuentas propias). Nunca inventes ratio. Si el arquetipo no tiene histórico Neety suficiente: `🔥 arquetipo sin histórico suficiente en tus datos` (sin número) — y, si quieres respaldarlo, cita el ratio **cross-creator** de §3 dejando claro que es de *todos los creadores analizados*, no de la cuenta: p. ej. `🔥 sin histórico propio · recipe cross-creator ~6.7x`.
- ⚠️ **§3 (cross-creator) ≠ §4 (Neety).** Los ratios de §3 salen de los 1.893 outliers de TODAS las cuentas trackeadas (competencia + referentes globales), no de Iker/Unai/Asier. Son **priors direccionales** (qué combinación hook×estructura×tono tiende a viajar), no la cifra de tu cuenta. Para el tag propio manda §4.
- Elige arquetipos genuinamente distintos entre las 2-3 variantes para poder comparar.
- La voz (`brand-voice`) es el CÓMO; el arquetipo/estructura es el QUÉ y sale de aquí. Si hay conflicto, mandan estos datos.

---

## 3 · Análisis cross-creator del Explorer (snapshot 2026-07-09)

> Destilado del export completo del **Outlier Explorer** ("explorer completo.pdf", en `docs/`). Muestra: **~1.894 outliers** de TODAS las cuentas analizadas (competencia + referentes globales + las cuentas Neety), con los **500 top** desglosados por formato. **Población distinta de §4** (que es solo Neety). Trátalo como el mapa cross-creator de qué combinaciones viajan; para el ratio de TU cuenta manda §4. Los números son de este scrape — órdenes de magnitud, no verdad eterna.
> ✅ **Verificado en vivo contra Railway (`/api/analysis/cross-creators`) el 2026-07-13:** las distribuciones coinciden con este snapshot (1.894 vs 1.893 outliers, mismas distros de hook/estructura, empatía 7.63x vs 7.75x). El snapshot está vigente; refrescar cada 1-2 meses desde ese endpoint.

### 3.1 · Qué tienen en común los top outliers (retrato agregado)
- **1.893 outliers** · media **178 palabras** · **CTA en 36%** · formato top = **texto + imagen**.
- El outlier medio: **60% hooks "Other"** (fuera de plantilla clásica), **40% estructura "Narrative Arc"**, **~171 palabras**, publicado un **jueves** (40% del top).
- **Solo 11% son de tono neutro** → el disparador emocional/psicológico es casi obligatorio.
- **Los dos motores dominantes** (etiqueta "Why did this work?" sobre los top): **Controversy (254)** y **Social Currency (139)**, muy por encima de Belonging (58), Aspiration (15), Utility (14), Emotion (12), Identity (8). Traducción operativa: o **divides** (postura fuerte que obliga a tomar bando) o das **moneda social** (algo que al compartirlo hace quedar bien/listo al que repostea). Lo demás es cola.

### 3.2 · Hook types en outliers (distribución real)
`Other 48%` · `Bold Claim 12%` · `Story Opener 9%` · `Curiosity Gap 8%` · `Data Shock 7%` · `Rhetorical Q 5%` · `List Promise 3%` · `Announcement 2%` · `Direct Callout 2%` · `How-To 1%` · `Pattern Interrupt 1%` · `Relatable 1%` · `Hot Take 1%`.
> Lectura: casi la mitad NO encaja en una etiqueta de plantilla ("Other") — los mejores hooks son idiosincráticos, no fórmula enlatada. De los etiquetables, **Bold Claim** manda, seguido de apertura narrativa e intriga.

### 3.3 · Post structure en outliers
`Narrative Arc 23%` · `Short & Punchy 12%` · `Other 12%` · `List/Framework 10%` · `Hook→List→CTA 6%` · `Problem→Solution 5%` · `Before/After 4%` · `Long-form 4%` · `Data-Driven 4%` · `Comparison 3%` · `Question→Answer 3%` · `Myth Busting 3%` · `Content+CTA 3%` · `Story→Lesson 3%` · `Contrarian→Proof 2%` · `Step-by-Step 2%`.
> Lectura: **arco narrativo** (setup→tensión→resolución) es la estructura más frecuente entre outliers, pero conviven con el **corto e impactante**. No hay UNA estructura ganadora; hay dos polos (historia larga vs dardo).

### 3.4 · Tono × outlier ratio (ranking — el tono que MÁS multiplica)
`Empathy 7.63x` · `Social Proof 6.97x` · `Authority 6.78x` · `Provocative 6.69x` · `Educational 6.46x` · `Urgency 6.45x` · `Aspirational 6.45x` · `Vulnerable 6.24x` · `Humorous 5.79x` · `FOMO 4.84x`.
> Empatía ("te entiendo, he estado ahí") es el tono con mayor ratio — encaja de lleno con `brand-voice §6` (atacar el problema, no al lector) y con el eje de "Los 10". FOMO es el que menos viaja.

### 3.5 · Los 10 "Viral Archetypes" (recetas hook × estructura × tono, cross-creator)
Ratios de todas las cuentas; n bajo (2-7 posts) → priors, no leyes.
```
#1  6.74x  List Promise    + Comparison/Versus     + Aspirational   (n=7)  "10 Visuals that will change the way you think."
#2  6.33x  Hot Take        + List/Framework        + Educational    (n=3)  "3 harsh truths I've been thinking about..."
#3  6.06x  Bold Claim      + Content+CTA           + Empathy        (n=3)  "Subir en ventas siempre pasa factura."   ← cuenta Neety
#4  5.73x  Motivational    + Motivational Manifesto+ Educational    (n=2)  "It's never too late to jump."
#5  5.60x  Direct Callout  + Data-Driven           + Authority      (n=4)  "Your title doesn't make you a leader."
#6  4.86x  Pattern Interrupt + Before/After        + Aspirational   (n=3)  "Si sigues usando PowerPoint como hace 5 años, tienes un problema."
#7  4.61x  Personal Confession + Narrative Arc     + Aspirational   (n=4)  "Me despidieron..."
#8  4.55x  Rhetorical Q    + Myth Busting          + Aspirational   (n=3)  "¿Cuántas de estas mentiras de ventas B2B sigues creyendo?"
#9  4.44x  How-To/Framework+ Hook→List→CTA         + Neutral        (n=3)  "How to respond when a prospect says:"
#10 4.40x  Bold Claim      + Hook→List→CTA         + Humorous       (n=3)  "NEVER use GPT for cold emails again…"
```
> Las que mejor encajan con la voz Neety y el nicho B2B: **#3** (Bold Claim + empatía — de hecho una es de la cuenta), **#6** (Pattern Interrupt + antes/después — el ADN del meme con motor A), **#8** (pregunta retórica que desmonta mitos de ventas), **#10** (Bold Claim sobre una herramienta con humor).

### 3.6 · Cómo abren y cierran los outliers
- **Aperturas:** Declarativa **58%** · Corta e impactante **9%** · "Yo" personal **7%** · Pregunta **6%** · Apertura en español **6%** · Número/dato **4%**. → El arranque ganador es una **afirmación declarativa tajante**, no una pregunta ni un windup.
- **Cierres:** Statement (afirmación de cierre) **37%** · Línea de hashtags **18%** · CTA explícita follow/like/share **18%** · Cierre corto **9%** · Posdata P.S. **8%** · Pregunta final **5%**.

### 3.7 · Estilo de escritura y lenguaje (outliers vs normales)
- **Longitud:** 178 vs 157 palabras (+13%). **Frase:** 13.9 vs 13.5 palabras. **Saltos de línea:** 27.8 vs 24.3 (+14% → más aire). **Emojis:** 55% vs 47% (+17%). Hashtags 22% vs 21%. Preguntas 51% en ambos.
- **CONTRAINTUITIVO — los outliers usan MENOS de esto que los posts normales:** lenguaje de **Autoridad/Prueba −25%** (0.3 vs 0.4 /100w), **Urgencia/Escasez −17%**, **"Tú" directo −7%**. → Confirma tres reglas de la stack: la autoridad **se demuestra, no se anuncia** (`brand-voice §1`), la urgencia/countdown no es palanca fuerte, y **no apuntes al lector con "tú"** (`brand-voice §6`). Contraste/Tensión se mantiene igual (2.3/100w) — la tensión sí, el sermón no.

### 3.8 · Formato visual (los 500 top por formato)
`Texto+Foto 60% (n=300, ~13.6x)` · `Texto+Vídeo (n=113, ~13.3x)` · `Texto solo (n=61, ~13.6x)` · `Texto+Doc (n=17, ~11.6x)` · `Texto+Carrusel (n=9, ~11.1x)`.
> Foto domina en volumen, pero **texto solo rinde igual de alto (~13.6x)**: no todo post necesita imagen. Doc y carrusel quedan por debajo (coherente con "infografías 0/3" de la skill `images §7`).

### 3.9 · Timing (confirma y afina §4/§7)
- **Horas por outlier-ratio (señal FUERTE):** `11:00 → 8.21x` (la mejor con diferencia) · `12:00 → 7.10x` · `14:00 → 7.03x` · `09:00 → 6.75x` · `05:00 → 6.66x` · `07:00 → 6.57x` · `15:00 → 6.12x` · `16:00 → 6.02x`. → Refuerza la ventana **11:00-12:00 y 14:00-15:00** ya recomendada; 11:00 es el pico claro.
- **Días (señal DÉBIL):** las tasas por día están todas apretadas ~4.3-4.9% (Sáb 4.9%, Mié 4.6%, Vie 4.6%, Mar 4.5%, Jue 4.5%). No hay un día ganador nítido cross-creator; el "martes" de §4 sigue siendo el prior propio, con miércoles-jueves igual de válidos.

### 3.9b · 🔎 CÓMO CAZAR LEAD MAGNETS EN LA BD (huella dactilar + remix cross-sector)
> Método verificado el 2026-07-14 contra `/api/analysis/cross-creators`. Sirve para encontrar ángulos frescos sin depender de lo que opine un blog.

**La huella dactilar del lead magnet: `comment_like_ratio ≥ 1`.** Un post normal tiene MUCHOS más likes que comentarios (Gipuzkoa: 1.208❤ / 95💬 = **0,08**). Un lead magnet invierte la proporción, porque el comentario es el peaje (vibe prospecting 95❤ / 632💬 = **6,65** · desmonto perfiles 116❤ / 483💬 = **4,16**). **Si comentarios ≈ o > likes, casi seguro que es comment-gated.**

**El filtro de 2 pasos (rinde 83 lead magnets reales de los 500 top):**
1. `comment_like_ratio >= 1.0` → de 500 outliers quedan **105**.
2. De esos, quédate con los que llevan **palabra-puerta explícita en `content_text`** (`comment "X"`, `comenta "X"`, `type "X"`, `drop … below`) → **83 confirmados**.
3. **La prueba definitiva: LEE LOS COMENTARIOS con Unipile.** La BD no los guarda, pero Unipile sí los sirve:
   `GET {UNIPILE_BASE_URL}/api/v1/posts/{linkedin_post_id}/comments?account_id={UNIPILE_ACCOUNT_ID}&limit=50` (cabecera `X-API-KEY`). El campo `linkedin_post_id` viene en cada outlier de `cross-creators`.
   Cuenta la frecuencia de palabras en esos 50 comentarios: **si UNA palabra aparece en ≥50-60% de ellos, es un lead magnet confirmado y esa palabra es la puerta.**
   - **Verificado el 2026-07-14** sobre el nº1 de la BD (Jan van Musscher, 130.2x · 3.508💬 · *"the ultimate outbound cheat sheet"*): la palabra **"sheet" sale en el 90% de los comentarios**. Así de limpio se ve.
   - **Por qué importa:** un post con los comentarios disparados pero **sin palabra dominante NO es un lead magnet, es una polémica** — la gente discute, no paga peaje. Remixarlo como lead magnet es copiar el número sin el mecanismo. Este test los separa.

**⭐ BUSCA EN TODOS LOS SECTORES, no solo en ventas.** Es la parte que más valor da:
- **Un outlier robado de nuestro propio sector sorprende menos**: nuestra audiencia ya lo ha visto. Robado de otro sector, es original aquí aunque allí sea un clásico.
- Lo que se copia **NUNCA es el tema: es la ESENCIA, el porqué funciona**. Se extrae el mecanismo (qué hace que el lector pague el peaje del comentario) y se remixa a ventas B2B.
- Prueba viva: **Guillermo Flor · 22.1x · 5.432💬 / 451❤ (ratio 12,04)** — un playbook de Claude en Excel y PowerPoint. Cero ventas, y es de los mejores ratios comentario/like de toda la BD. Su esencia (la herramienta que ya usas a diario + un playbook de atajos que no conoces) transfiere a ventas sin despeinarse.
- Criterio de orden: **ratio C/L alto × outlier ratio alto × distancia de nuestro sector**. Cuanto más lejos, más original el remix.

### 3.10 · Banco de remix (SOLO top-top relevantes para B2B — no la competencia entera)
> De las ~150 páginas de ejemplos (ordenados de más a menos outlier) **no** copio el catálogo. Aquí van los pocos cuyo MECANISMO transfiere a Neety. Ratio = vs. la media del PROPIO autor (cross-creator). Se calca la mecánica, nunca el texto.

- **130.22x · Jan van Musscher · Controversy** — *"I have created the ultimate outbound cheat sheet: everything outbound sales in one page. Like & comment 'SHEET'…"* → lead magnet comment-gated con **UN entregable concreto y específico** (una hoja, no "toda mi biblia"). Valida `global-instructions §4.4`: el topic pica solo + entregable único.
- **68.51x · Jan van Musscher · Controversy** — *"Our client just booked a sales call with an 82,000-person company… Comment 'cold' for the script."* → **cifra-cliente concreta** como prueba social + puerta de comentario. La cifra específica (82.000) es el gancho, no el genérico "conseguimos reuniones".
- **44.62x · Carlos Martínez · Controversy** — *"España tiene un problema 🇪🇸. Y no, no es falta de talento… el talento se va."* → **identidad + agravio + lista** en clave nacional. Mismo motor que los mapas Neety (identidad que genera rabia/orgullo defensivo), a escala país.
- **37.12x · Hassan Elahi · Social Currency** — *"The SDR role isn't entry-level anymore."* → **reframe que dignifica al comercial**. Es el eje emocional de "Los 10" (§4.2): el que hace el trabajo se siente visto y reposta.
- **35.24x · Ryan Reisert · Controversy** — *"Not enough people are talking about this country… where the future of SDRs live. 99% can't name it. Any guesses?"* → el **"país misterioso"** como curiosity gap + juego de adivinanza en comentarios. Valida externamente la variante "país inventado/trampa" de Unai (7.1x) — arma de ocasión.
- **30.14x · Josh Braun · Controversy** — *"Why most cold emails get ignored. Maybe it's not your writing… Maybe it's your offer."* → **belief_breaker** sobre una creencia de ventas + descarga parcial en la línea 2 (sin preámbulo). Modelo de transición hook→cuerpo de `global-instructions §2.6`.
- **39.01x · Chris Donnelly · Controversy** — *"6 ways to stop your top talent from leaving… ♻️ Repost this."* → listicle de liderazgo con CTA de repost → gama alta de **reposts** (la métrica de mayor palanca).
- **37.42x · Luna Chen · Controversy** — *"Anthropic released how they use Claude for Growth Marketing… Comment 'GROWTH'."* → IA enmarcada por **RESULTADO de negocio** ("conversion 41% above industry avg", "1 persona = un departamento"), no por changelog. Exactamente cómo pide `working-preferences §3` reformular los posts de modelo/IA.

---

## 4 · Histórico destilado, cuenta a cuenta (refrescado con export real abr-jul 2026)

> Datos reales del export "Top posts (50)" por cuenta (primeros ~4 meses publicando). Los **textos completos** de estos ejemplos, anotados por estructura, están en la skill **`swipe-file`** — cárgala al escribir hooks/cuerpos. Aquí viven los números; allí la anatomía.

### Stats por cuenta (abr-jul 2026)
| Cuenta | Posts | Outliers | Hit rate | Media × | Pico × | Impresiones | Media imp/post |
|---|---|---|---|---|---|---|---|
| **Iker Galarza** | 48 | 15 | 31% | 3.00x | 16.5x | 1.18M | 24.7K |
| **Unai Arambarri** | 34 | 6 | 18% | 2.19x | 17.0x | 518K | 15.2K |
| **Asier Olaizola** | 1 | 0 | 0% | 0.96x | 1.0x | 4.3K | 4.3K (arranca) |
- **Mix de formato publicado:** Texto+Foto 66 · Texto solo 15 · Carrusel 1 · Vídeo 1. (Foto domina; texto solo también rinde.)
- **Hook por engagement medio:** `bold_claim 399` · `curiosity_gap 314` · `other 221` · `data_shock 159` · `story_opener 106` · `list_promise 102` · `rhetorical_q 86` · `direct_callout 50` · `analogy 35`. → **bold_claim y curiosity_gap** son los tipos que más engagement traen.

### Split por cuenta — señal EN VIVO (Railway, 2026-07-13, todo el histórico)
> Del endpoint `/api/analysis/{id}/stats`. `avg_ratio` = media de TODOS los posts de ese tipo en la cuenta (no el pico de un post) → es la señal de "qué arquetipo rinde mejor en cada cuenta". Cifras all-time (más posts que la tabla de arriba, que era el export de 50).

- **Iker** (148 posts · 16 outliers · rate 11% · mejor día martes):
  - Hook por ratio: **`curiosity_gap` 2.27x (n=20) ← el mejor** · `bold_claim` 1.49x · `other` 1.34x · `list_promise` 0.96x · `story_opener` 0.95x · `rhetorical_q` 0.65x.
  - Estructura por ratio: `data_driven` 16.45x (n=1, el mapa Gipuzkoa) · `content_with_cta` 3.05x · `contrarian_proof_reframe` 2.87x (avgEng 370) · `list_framework` 2.49x (n=21) · `short_punchy` 2.02x.
  - Mejor slot: **martes 11:00 (80% outlier rate, avgEng 647)**, martes 9:00, jueves 9-10.
- **Unai** (72 posts · 7 outliers · rate 10% · mejor día martes):
  - Hook por ratio: **`curiosity_gap` 3.15x (n=11) ← el mejor** · `data_shock` 2.01x · `other` 1.11x · `bold_claim` 0.91x · `rhetorical_q` 0.85x.
  - Estructura por ratio: `content_with_cta` 8.25x (n=3) · `comparison` 5.25x (n=2) · `contrarian_proof_reframe` 3.7x · `list_framework` 1.42x.
  - Mejor slot: martes 8:00 (67%).
- **Asier** (2 posts · 0 outliers): sin señal aún — su cuenta necesita baseline (ver `aboutme`). No leer ratios todavía.

> **Lo más accionable:** en las DOS cuentas con histórico, **`curiosity_gap` es el hook con mejor ratio** (Iker 2.27x, Unai 3.15x) — por encima de bold_claim. Y las estructuras `content_with_cta` y `contrarian_proof_reframe` rinden alto en ambas. El martes por la mañana (9:00-11:00) es el pico claro.

### 4.0b · La FIRMA DE ENGAGEMENT de cada pilar (BD en vivo, 2026-07-14 — los 23 outliers)
> Hallazgo nuevo al revisar los 23 outliers uno a uno. **Cada pilar gana en una métrica distinta.** Sirve para dos cosas: saber si un post está funcionando en las primeras horas, y no juzgar un pilar con la métrica de otro.

| Pilar | Gana en | Reposts | Comentarios | Ejemplo |
|---|---|---|---|---|
| **Mapa** | **REPOSTS** | **20-90** | 27-145 | Gipuzkoa 90🔁 · Galicia 60🔁 · Andalucía 51🔁 |
| **Meme** | **IMPRESIONES** | 9-22 | 25-85 | cold calling 168.9K · wojak 165.5K |
| **Lead magnet** | **COMENTARIOS** | **5-6** | **177-632** | vibe 632💬 · desmonto 483💬 |
| **"Los 10"** | mixto | 12 | 33 | País Vasco 4.81x · 49.4K |

- **El mapa se mide en reposts.** Es el pilar más reposteado con diferencia (hasta 90). Si un mapa no cosecha reposts en las primeras horas, no está viajando: es la señal temprana.
- **El lead magnet casi no se repostea (5-6) y tiene pocos likes** (95 y 116 en los dos mejores) pero se come los comentarios. Un lead magnet con muchos likes y pocos comentarios ha fallado.
- **El meme no se repostea tanto como parece** (9-22) pero es el que revienta impresiones. Su trabajo es alcance, no conversación.
- Ojo con leer likes: Gipuzkoa tiene 1.208 likes (nuestro récord) y el mejor post del histórico (wojak 16.56x) solo 257. Los likes no ordenan nada.

### Mapas regionales (la mecánica más fiable)
- **Gipuzkoa (Iker, 1er mapa) 12.9x · 112.7K · 1.2K likes · 90 reposts** — "pueblo de 7.000 hab que exporta más que países enteros".
- **Navarra (Iker) 7.7x · 79.2K · 563 likes · 46 reposts** — molde gold ("patio trasero de los Pirineos… y poco más. Exporta más que Bolivia") → ver `swipe-file §2.1`.
- Galicia (Iker) 7.3x · 64.6K · 60 reposts ("esquina del Atlántico… más que Croacia").
- Cataluña (Iker) 7.1x · 48.9K · 145 comentarios · 35 reposts.
- Valencia (Iker) 6.8x · 51.5K · 49 reposts.
- Andalucía (Iker) 5.4x · 29.8K · 51 reposts.
- **País inventado / trampa (Unai) 7.87x · 78.7K** — alcance vía curiosidad + guessing game (arma de ocasión).
- Euskadi (Unai, VÍDEO) 3.7x · 21.1K · 37 reposts.
- Bizkaia (Unai) 3.3x · 21.3K.
- Álava "trastienda del norte" (Unai) 2.1x · 20.1K (región menos conocida → techo menor).
- **FLOP de repetición: "país inventado" REMIX (Iker) 1.2x** — repitió el concepto de Unai semanas después y se hundió. Nunca repetir concepto. (Madrid/capitales siguen baneadas por precedente.)

### Memes (con motor)
- **"Caja de herramientas engorda" (Unai) 16.56x · 165.5K — el mejor post del histórico** (Motor A, stacking de tools) → `swipe-file §1.1`.
- **"Cold calling enterrado en vida" (Iker) 16.4x · 168.9K** (Motor A, jerarquía de roles + staccato "Nadie. Llamó. Al. Cliente.") → `swipe-file §1.2`.
- **"Subir en ventas / calvicie SDR→VP" (Iker) 13.5x · 138.8K** (Motor A, cambio corporal en escalera de roles) → `swipe-file §1.3`.
- Factura Claude / "casi me cuesta una boda" (Iker) 5.9x · 60.4K (Motor B, screenshot documental).
- "El humo de la IA reemplaza al comercial / Mikel vuelve" (Iker) 4.4x · 45.0K (Motor A/B).
- "49€ vs Claude por 20€/día" (Unai) 2.9x · 28.1K (Motor B, pilar deseo).
- FLOPS: **"El comercial B2B ha engordado" (Unai) 2.6x** — cambio corporal OK pero timeline de UNA persona (2018→2026) en vez de jerarquía de roles → rinde 6x menos que el meme de jerarquía. "Claude del grupo de pádel" (Unai) 1.5x, "Perder un cliente es arte" (Unai) 1.2x (sátira sin motor).

### "Los 10"
- **País Vasco (Iker) 4.8x · 49.4K — el molde** ("personas desconocidas quemando el teléfono"; foco en la persona) → `swipe-file §3.1`.

### Lead magnets (comment-gated)
- **"Vibe prospecting" (Unai) 10.0x · 632 comentarios** — récord de comentarios (CTA `Comenta "vibe"`).
- **"Desmonto perfiles" LIVE (Iker) 8.5x · 483 comentarios** — el mejor formato (entrega pública personalizada + verbo "desmonto" + CTA `Comenta "desmonta" + tu departamento`) → `swipe-file §4.1`.
- "Llaves" (Unai 4.6x · 285 comentarios; Iker 4.1x · 232 comentarios), "perfil" (Iker 3.3x · 183 com.), "frase+emoji" (Unai 2.7x · 167 com.), "mensaje" (Iker 2.3x · 129 com.), cold-email "sí en comentarios" (Iker 2.1x · 120 com.).
- **FLOP: "biblia de ventas" (todo junto) (Iker) 1.2x · 2.3K** — genérico "todo mi material en una caja" → LinkedIn no amplifica aunque comenten. El entregable tiene que ser UNO y específico.

### Otros
- Oferta de empleo ("2 SDRs Junior", Iker) 2.5x · 25.6K · 15 reposts (gama media fiable de alcance+reposts).
- Posts de ronda/evento ("330.000€ levantados") 2.0-2.7x — objetivo autoridad, no viralidad (esperado).

### Patrones de hook confirmados
- **≤1 número:** 50% cero, 50% exactamente uno, 0% con dos o más.
- Estructura recurrente: `[claim único O métrica única] + [tensión/reframe] + 👇`, con verbo físico (matar, enterrar, quemar, tirar, reventar) en al menos una parte. El primer salto en blanco va DESPUÉS del gancho.

### Timing confirmado
- Mejor día: martes (miércoles-jueves cerca). Mejores horas: 11:00-12:00 y 14:00-15:00 (hora local).

---

## 5 · Evidencia externa cross-mercado — guía ColdIQ (6.750 posts GTM)

> **Qué es:** guía pública de ColdIQ (Michel Lieben) que analizó con Claude Code **6.750 posts** de **25 top creators** de GTM/ventas/IA (8k-864k seguidores), comparando los **2.089 que superaron 500 likes** contra el resto (baseline "viral" = 28,4% de posts con 200+ likes).
> **Cómo tratarla:** es **evidencia externa direccional**, aún más externa que §3 — son creadores **ingleses de GTM**, y la métrica es **"tasa de viralidad"** (% de posts que pasan un umbral de likes), NO nuestro "outlier ratio" (Nx vs. la media del propio autor) ni nuestro mercado (B2B español). Úsala como confirmación/prior, nunca por encima de §4 (Neety) ni de §3. **Y ojo con los mitos:** varias de sus reglas CHOCAN con lo que nosotros ya hemos verificado — ahí mandan nuestros datos (ver 5.3).

### 5.1 · Lo que CONFIRMA (validación externa de lo que ya hacemos)
- **Hook con número:** aparece en el 62,8% de los virales vs 46,6% de los normales. Encaja con nuestra regla de ≤1 número en el hook (`global-instructions §2.5`): un número sí, dos no.
- **Posts de texto/historia largos:** la tasa sube casi lineal con la longitud (<100 palabras 12,4% · 300-400 39,4% · 400-500 58,3%). Confirma nuestro rango de 300-500 palabras (`§3.3`). **Ojo de alcance:** esto es para posts de TEXTO/historia — NO para memes ni screenshots, que en nuestros datos van CORTOS (`global-instructions §4.3`). Ahí manda lo nuestro.
- **Una idea por línea + voz humana sin clichés de IA:** "here's the thing" / "let that sink in" casi ausentes en top creators. Refuerza `§3` (variedad rítmica, líneas cortas) y la tabla anti-IA de `brand-voice §3`.
- **Comment-to-get como CTA rey:** 41,3% viral y 378 comentarios de media, vs pregunta 81, link en el post 46, y "sígueme" 35 (9,1% viral, el PEOR). Solo ~8% de posts lo usan. Valida de lleno nuestro lead magnet con "Comenta X + Y" (`§4.4`) y la regla del UNO en el cierre.
- **Timing:** ventana de media mañana europea (11:00-12:30) y los primeros 30 min deciden. Confirma nuestro `§3.9`/`§4/§7` (11:00-12:00 y la ventana de oro).
- **Vulnerabilidad rinde** (53% viral vs 28% baseline) → coherente con nuestro tono Empatía/Vulnerable alto (`§3.4`).
- **"Operator lane":** los operadores ganan con **prueba y números grandes** (posts más largos y densos, 62,8% con número). Es exactamente nuestro posicionamiento founder-en-trincheras + cifras de cliente (`brand-voice §1`, `§4.2`).
- **Apropiarte de un concepto/formato y repetirlo:** los mejores reejecutan su formato/hook firma. Encaja con "reusa una palabra-concepto que sea nuestra" (`brand-voice §4.4`). **Matiz nuestro:** apropiarse del CONCEPTO/estructura sí, pero **variando las palabras cada vez** (`working-preferences §4`) — no repetir el hook calcado.

### 5.2 · Lo que AÑADE (nuevo y útil, sin chocar)
- **Banda de 7-10 palabras en el hook** rinde mejor (1-3 palabras es lo peor). Compatible con nuestra ley de bloque único ≤210.
- **Primera persona ("yo") gana a segunda ("tú")** en el hook — la experiencia propia bate al sermón. Encaja con `brand-voice §6` (no apuntar al lector con "tú").
- **5 fórmulas de hook (con ejemplos reales):** (1) la frase escuchada al vuelo ("Founder: 'We need leads NOW!'"), (2) el pattern break ("Contraté a un Gen-Z sin entrevistarlo"), (3) la orden contrarian ("Deja de avergonzarte con herramientas obsoletas"), (4) el curiosity gap ("No me creo que esto no sea real"), (5) el número/hito ("4.000 cold emails. 1 lead. Luego 4M ARR."). Son plantillas de hook que conviven con nuestros hook types — buenas como banco de arranque.
- **Táctica de distribución afilada:** 30-60 min ANTES de publicar, comenta de verdad en 5-10 personas que comentaron tu post anterior → les llega la notificación, ven el nuevo y te devuelven el comentario en la ventana de oro. Es una versión más concreta de nuestro "avisa a 3-5 contactos".
- **Mecanismos emocionales (lente extra):** vindicación · celebración vicaria · articular lo que el lector no sabía decir · el momento "WTF" · pertenencia vía sátira. Decide cuál dispara tu post antes de escribir. Complementa (no sustituye) nuestros 3 pilares (curiosidad/deseo/miedo).
- **"Client story" (case study reenfocado):** abre con la situación, sube al problema, aterriza el resultado. Misma prueba, postura distinta. Encaja con nuestros diferenciadores y cifras de cliente (`aboutme §1b`, "+200 PYMEs / +40%").

### 5.3 · ⚠️ MITOS — donde ColdIQ CHOCA con lo nuestro (mandan NUESTROS datos)
No importar nada de esto; está aquí para reconocerlo y descartarlo:
1. **"Los links matan alcance → ponlo en el primer comentario, nunca en el cuerpo."** ❌ CONTRADICE nuestro `global-instructions §4.5`: hemos **verificado con posts >100K imp** que un link en el cuerpo NO suprime alcance y que el folklore del primer comentario está obsoleto. Además nuestra estrategia mete el link de agendar en spam ninja EN el cuerpo. **Manda lo nuestro.**
2. **"Sin emojis en la primera línea/hook."** ❌ Nuestros mapas cierran el hook con `👇` y está validado en nuestras cuentas. El emoji funcional en el hook se queda.
3. **"Haz infografías (con logos de las tools para que las guarden)."** ❌ Nuestras infografías van **0-de-3** (`images §7`). No las proponemos. Manda lo nuestro.
4. **"El texto solo rinde flojo (15,8%); imagen mucho mejor."** ❌ En NUESTROS datos el **texto solo rinde alto (~13,6x, `§3.8`)**. Métrica y mercado distintos; no trates el texto-solo como débil.
5. **"Reejecuta el MISMO hook calcado varias veces."** ❌ Choca con `working-preferences §4` (variar expresiones, seguir sorprendiendo). Repetimos el CONCEPTO, no las palabras.
6. **"Súbete al trigger del lanzamiento de IA (Anthropic, etc.)."** ⚠️ Para NOSOTROS los posts de lanzamiento de modelo **flopean** (0,88x, 0,25x); hay que **reformular como resultado para la audiencia** (`working-preferences §3`). El "trigger" vale, el post de changelog no.
7. **Ranking de temas (fundraise/revenue/milestone #1).** ⚠️ Es el carril de los creators GTM, **no el nuestro**: nosotros tiramos de mapa / "Los 10" / meme / lead magnet. No pivotes a posts de "hemos facturado X". Lo único aprovechable es el "client story" con resultado concreto (5.2).

> Nota de método: su "tasa de viralidad" (% de posts que pasan un umbral de likes en cuentas grandes inglesas) y nuestro "outlier ratio" (Nx vs. la media del autor, en B2B español) **no son la misma métrica**. Por eso ColdIQ vale como dirección, no como cifra que sustituya a §3/§4.

---

## 6 · Cómo pasarme datos frescos (procedimiento)

### Vía A — Export/HTML del Explorer (la que funciona HOY sin tocar nada) ✅
1. Abre la herramienta → pestaña **Explorer / Dashboard**.
2. Copia (o exporta) los bloques de: **Top Viral Archetypes**, **Hook Types in Outliers**, **Post Structure in Outliers**, **Tone Analysis**, **Opening/Closing Patterns**, **Language Patterns**, **Best Days/Hours**, y **Top 20 Outlier Hooks**.
3. Pégamelo en el chat (texto o HTML, da igual). Yo lo destilo y **relleno §3 y actualizo §4** de esta skill.

### Vía B — Autorizar el backend en la red del entorno (setup una vez) ⚙️
El backend (`https://linkedin-post-analyzer-production.up.railway.app`, auth básica usuario `Neety`) expone endpoints de análisis (`/api/creators`, `/api/creators/:id/stats`, `/api/analysis/...`). Hoy el entorno de Claude **bloquea ese host** (403 en egress). Si se **añade ese dominio a la allowlist de la network policy del entorno** de Claude Code, yo podría consultar esos endpoints por HTTPS y traer los datos solo, sin que tengas que copiar/pegar. Cambio de configuración del entorno (docs: https://code.claude.com/docs/en/claude-code-on-the-web).

### Vía C — Ejecutar en un entorno de red abierta ⚙️
En Claude Code local (tu máquina), sin egress restringido, tanto la URL de Postgres como el backend funcionarían directamente.

> ✅ Estado 2026-07-13: el **backend de Railway ya funciona** desde el entorno (auth básica HTTPS). Se consulta directamente (ver §0 para endpoints). La Vía A (pegar el export) sigue como respaldo si el acceso vuelve a caer.

---

## 7 · Huecos a rellenar
- [x] §3 relleno con el snapshot cross-creator del Explorer (2026-07-09): recetas, distribuciones de hook/estructura/tono, aperturas/cierres, estilo, formato, timing y banco de remix.
- [x] Patrones de lenguaje (densidad outlier vs normal): incorporados en §3.7 (el hallazgo contraintuitivo de menos autoridad/urgencia/"tú").
- [x] Banco de remix de OTRAS cuentas: §3.10 (curado a los top relevantes para B2B; el resto de las ~150 págs de ejemplos se dejan fuera a propósito).
- [x] **Split por cuenta Neety** (qué arquetipo rinde mejor en Iker vs Unai vs Asier): RELLENO en §4 con datos en vivo de Railway (2026-07-13). Hallazgo: `curiosity_gap` es el mejor hook por ratio en Iker (2.27x) y Unai (3.15x); `content_with_cta`/`contrarian_proof_reframe` las mejores estructuras; martes mañana el pico. Asier aún sin baseline.
- [x] **Evidencia externa (guía ColdIQ, 6.750 posts GTM):** destilada en §5 — confirmaciones (5.1), añadidos útiles (5.2) y, sobre todo, los **mitos que chocan con lo nuestro** filtrados y descartados (5.3: links al cuerpo, sin-emoji-hook, infografías, texto-solo-débil, rehook calcado, trigger de lanzamiento IA).
- [ ] **Refresco periódico:** este snapshot es de 2026-07-09; los ratios decaen. Reexporta el Explorer cuando quieras actualizarlo.
