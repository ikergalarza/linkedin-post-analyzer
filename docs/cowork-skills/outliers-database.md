# SKILL: outliers-database — El análisis de outliers (arquetipos, hooks, patrones)

> **name:** outliers-database
> **description:** Los datos vivos de qué está funcionando: arquetipos con sus ratios reales, top hooks, patrones de lenguaje y formato, timing, y el contenido viral de las cuentas que trackeamos en la herramienta (Dashboard). Es la evidencia empírica sobre la que se apoya `global-instructions`.
> **when-to-use:** Cargar cuando necesites justificar una elección con datos reales (el tag de viralidad `🔥 ~Nx · arquetipo`), elegir arquetipo para una idea, o diagnosticar por qué algo funcionó/flopeó. Los números concretos se rellenan a mano desde el Dashboard (ver §5).

---

## 0 · IMPORTANTE — cómo se alimenta esta skill

> ✅ **Estado 2026-07-09:** §3 ya está relleno con un **snapshot real del Explorer** (export completo en `docs/explorer completo.pdf`, 161 págs). El acceso automático al backend SIGUE bloqueado, así que el snapshot se cargó pegando/exportando el PDF a mano (Vía A). Para refrescar, repite la Vía A con un export nuevo.

El análisis real de outliers **no vive en el código ni en un archivo estático**: se calcula en vivo desde la base de datos de la herramienta (sección **Dashboard / Explorer**). Desde el entorno de ejecución donde corre Claude, el acceso automático está **bloqueado por la política de red del entorno** (reprobado el 9 jul 2026, sigue 403):

- ❌ **Postgres directo** (`postgresql://…railway.app:PORT/railway`): la política solo permite salida HTTPS por un proxy; una conexión TCP directa a Postgres queda bloqueada (timeout).
- ❌ **Backend HTTPS de Railway** (`https://linkedin-post-analyzer-production.up.railway.app`): el host **no está en la allowlist de egress** de la sesión → el proxy responde **403** al CONNECT. No es problema de credenciales (usuario/contraseña son correctos); es la política de red.

**Vías para alimentar esta skill (por orden de facilidad):**
1. ✅ **Pegar el export/HTML del Explorer** directamente en el chat — **la vía que funciona hoy sin tocar nada**. Es solo texto que pegas; yo lo destilo.
2. ⚙️ **Añadir el dominio de Railway a la allowlist del entorno** (network policy). Si se autoriza `linkedin-post-analyzer-production.up.railway.app` en la configuración del entorno de Claude Code, yo podría consultar los endpoints de análisis por HTTPS directamente. Requiere cambiar la política de red del entorno (ver docs: https://code.claude.com/docs/en/claude-code-on-the-web — sección de network policy).
3. ⚙️ **En un entorno con red abierta** (p. ej. Claude Code local en tu máquina, sin egress restringido), tanto la URL de Postgres como el backend funcionarían.

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

> Destilado del export completo del **Outlier Explorer** ("explorer completo.pdf", en `docs/`). Muestra: **1.893 outliers** de TODAS las cuentas analizadas (competencia + referentes globales + las cuentas Neety), con los **500 top** desglosados por formato. **Población distinta de §4** (que es solo Neety). Trátalo como el mapa cross-creator de qué combinaciones viajan; para el ratio de TU cuenta manda §4. Los números son de este scrape — órdenes de magnitud, no verdad eterna.

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
`Empathy 7.75x` · `Social Proof 6.97x` · `Authority 6.78x` · `Provocative 6.69x` · `Educational 6.46x` · `Urgency 6.45x` · `Aspirational 6.45x` · `Vulnerable 6.24x` · `Humorous 5.79x` · `FOMO 4.84x`.
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
> Foto domina en volumen, pero **texto solo rinde igual de alto (~13.6x)**: no todo post necesita imagen. Doc y carrusel quedan por debajo (coherente con "infografías 0/3" de `global-instructions §5.5`).

### 3.9 · Timing (confirma y afina §4/§7)
- **Horas por outlier-ratio (señal FUERTE):** `11:00 → 8.21x` (la mejor con diferencia) · `12:00 → 7.10x` · `14:00 → 7.03x` · `09:00 → 6.75x` · `05:00 → 6.66x` · `07:00 → 6.57x` · `15:00 → 6.12x` · `16:00 → 6.02x`. → Refuerza la ventana **11:00-12:00 y 14:00-15:00** ya recomendada; 11:00 es el pico claro.
- **Días (señal DÉBIL):** las tasas por día están todas apretadas ~4.3-4.9% (Sáb 4.9%, Mié 4.6%, Vie 4.6%, Mar 4.5%, Jue 4.5%). No hay un día ganador nítido cross-creator; el "martes" de §4 sigue siendo el prior propio, con miércoles-jueves igual de válidos.

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

## 4 · Histórico destilado (lo que ya sabemos, cuenta a cuenta)

Esto es lo validado hasta la fecha en las cuentas gestionadas (Iker, Unai; Asier arranca sin histórico grande). Sirve de prior hasta refrescar §3.

### Mapas regionales (la mecánica más fiable)
- Gipuzkoa 15.6x · 112K · "pueblo de 7.000 hab que exporta más que países enteros".
- **Navarra 7.8x · 79.2K · 563 likes** (fórmula "patio trasero de los Pirineos… y poco más. Exporta más que Bolivia").
- Cataluña 8.6x · 48K · "exporta más que Portugal entera".
- Valencia 7.3x · 51.5K · 49 reposts — la mina de oro (región grande y conocida = máxima identificación).
- **Galicia 7.3x · 64.6K · 56 reposts** ("esta esquina del Atlántico… exporta más que Croacia").
- Andalucía 6.5x · 29K · "8,7 millones exporta más que Italia entera".
- Euskadi (Unai, vídeo) 3.6x · 21K.
- Bizkaia 3.2x · 21.3K (región menos conocida → techo menor).
- País inventado / trampa (Unai) 7.1x · 70.8K (alcance vía polémica — arma de ocasión).
- FLOP: Madrid 0.55x · 4.5K (sin efecto underdog, sin dato shock en línea 1, sin identidad defensiva).

### Memes
- **"Caja de herramientas engorda pero el comercial cierra peor" (Unai) 16.6x · 165.5K — el mejor post del histórico.** Wojak antes/ahora (Chad→soyjak) calcado de plantilla viral.
- **iMessage "El de Ventas" (Iker 2 jul) 7.9x · 80.9K — TOP en imps del último periodo.** Motor B (screenshot creíble con "5,3M visualizaciones" + "te arruino el trimestre") + link de agendar en spam ninja (no mató alcance).
- Factura Claude 5.000€ (Iker) 6.8x · 60.4K (Motor B documental).
- "Coge el teléfono" / calvicie del manager (Iker) 5.17x · 168.9K — mejor en comentarios (85) y reposts (22).
- "IA roba el sueño" / ojeras (Iker) 5.37x · 43.5K (valida ojeras como cambio corporal).
- "Subir en ventas" / calvicie SDR→VP (Iker) 3.73x · 138.8K.
- "49€ vs Claude" captura de banco (Unai) 3.92x (Motor B, pilar deseo).
- FLOPS instructivos: "El jefe/El líder/El comercial con IA" 0.4x (imagen de meme válida + cuerpo largo tipo ensayo → mismatch). "Comercial ha engordado" 1.12x (cambio corporal bien, pero timeline de UNA persona en vez de jerarquía de roles). "Mis amigos no salváis vidas" 0.90x (canas: no duele + no legible a miniatura). "Barco hace aguas" 0.7x y "CV Amazon" 0.8x (sin motor A ni B).

### "Los 10"
- País Vasco (Iker) 4.8x · 49.4K — GENIAL ("personas desconocidas quemando el teléfono").
- Cataluña (Unai) 0.7x · 6.2K — FATAL (sin identificación + tono percibido como crítica a empresas).

### Lead magnets
- "Desmonto perfiles" LIVE (Iker) 9.13x · 454-483 comentarios — el mejor lead magnet (entrega pública personalizada + foto real + verbo "desmonto" + CTA explícita).
- PDF vía comentario (llaves, perfil) 4-5x.
- FLOPS: "biblia de ventas" (todo en una caja) 1.2x; "arsenal" 0.63x; "destripo perfiles" caricatura 0.2x; "traduzco al vendedor más cringe" (sin valor) 1.1K imp.

### Otros mecanismos fiables
- Oferta de empleo (Iker "2 SDRs Junior") 2.9x · 25.6K · 15 reposts (gama media fiable de alcance+reposts).
- Vibe prospecting / Claude + outbound: 9.7x, 4.95x, 4.43x (curva decae — pausar 7-10 días).

### Patrones de hook confirmados (top 8 virales, 3.6x-15.6x)
- 50% cero números, 50% exactamente uno, 0% con dos o más.
- Estructura recurrente: [claim único O métrica única] + [tensión o reframe] + [👇], con un verbo físico (matar, enterrar, perder, reventar, tirar) en al menos una de las dos partes.

### Timing confirmado
- Mejor día: martes. Mejores horas: 11:00-12:00 y 14:00-15:00 (hora local).

---

## 5 · Cómo pasarme datos frescos (procedimiento)

### Vía A — Export/HTML del Explorer (la que funciona HOY sin tocar nada) ✅
1. Abre la herramienta → pestaña **Explorer / Dashboard**.
2. Copia (o exporta) los bloques de: **Top Viral Archetypes**, **Hook Types in Outliers**, **Post Structure in Outliers**, **Tone Analysis**, **Opening/Closing Patterns**, **Language Patterns**, **Best Days/Hours**, y **Top 20 Outlier Hooks**.
3. Pégamelo en el chat (texto o HTML, da igual). Yo lo destilo y **relleno §3 y actualizo §4** de esta skill.

### Vía B — Autorizar el backend en la red del entorno (setup una vez) ⚙️
El backend (`https://linkedin-post-analyzer-production.up.railway.app`, auth básica usuario `Neety`) expone endpoints de análisis (`/api/creators`, `/api/creators/:id/stats`, `/api/analysis/...`). Hoy el entorno de Claude **bloquea ese host** (403 en egress). Si se **añade ese dominio a la allowlist de la network policy del entorno** de Claude Code, yo podría consultar esos endpoints por HTTPS y traer los datos solo, sin que tengas que copiar/pegar. Cambio de configuración del entorno (docs: https://code.claude.com/docs/en/claude-code-on-the-web).

### Vía C — Ejecutar en un entorno de red abierta ⚙️
En Claude Code local (tu máquina), sin egress restringido, tanto la URL de Postgres como el backend funcionarían directamente.

> ⚠️ Estado a jul 2026: desde el entorno remoto actual, **Postgres directo** y **backend Railway** están **ambos bloqueados** por la política de red (no por credenciales). La Vía A (pegar el Explorer) es la práctica hoy.

---

## 6 · Huecos a rellenar
- [x] §3 relleno con el snapshot cross-creator del Explorer (2026-07-09): recetas, distribuciones de hook/estructura/tono, aperturas/cierres, estilo, formato, timing y banco de remix.
- [x] Patrones de lenguaje (densidad outlier vs normal): incorporados en §3.7 (el hallazgo contraintuitivo de menos autoridad/urgencia/"tú").
- [x] Banco de remix de OTRAS cuentas: §3.10 (curado a los top relevantes para B2B; el resto de las ~150 págs de ejemplos se dejan fuera a propósito).
- [ ] **Split por cuenta Neety** (qué arquetipo rinde mejor en Iker vs Unai vs Asier): el Explorer da ratios cross-creator, no el desglose por cuenta propia. Sigue pendiente hasta poder consultar `/api/creators/:id/stats` por cuenta (o pegar ese desglose). Asier aún sin histórico grande.
- [ ] **Refresco periódico:** este snapshot es de 2026-07-09; los ratios decaen. Reexporta el Explorer cuando quieras actualizarlo.
