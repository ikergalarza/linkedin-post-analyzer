# SKILL: outliers-database — El análisis de outliers (arquetipos, hooks, patrones)

> **name:** outliers-database
> **description:** Los datos vivos de qué está funcionando: arquetipos con sus ratios reales, top hooks, patrones de lenguaje y formato, timing, y el contenido viral de las cuentas que trackeamos en la herramienta (Dashboard). Es la evidencia empírica sobre la que se apoya `global-instructions`.
> **when-to-use:** Cargar cuando necesites justificar una elección con datos reales (el tag de viralidad `🔥 ~Nx · arquetipo`), elegir arquetipo para una idea, o diagnosticar por qué algo funcionó/flopeó. Los números concretos se rellenan a mano desde el Dashboard (ver §5).

---

## 0 · IMPORTANTE — cómo se alimenta esta skill

El análisis real de outliers **no vive en el código ni en un archivo estático**: se calcula en vivo desde la base de datos de la herramienta (sección **Dashboard / Explorer**). Desde el entorno de ejecución donde corre Claude, el acceso automático está **bloqueado por la política de red del entorno** (probado el 8-9 jul 2026):

- ❌ **Postgres directo** (`postgresql://…railway.app:PORT/railway`): la política solo permite salida HTTPS por un proxy; una conexión TCP directa a Postgres queda bloqueada (timeout).
- ❌ **Backend HTTPS de Railway** (`https://linkedin-post-analyzer-production.up.railway.app`): el host **no está en la allowlist de egress** de la sesión → el proxy responde **403** al CONNECT. No es problema de credenciales (usuario/contraseña son correctos); es la política de red.

**Vías para alimentar esta skill (por orden de facilidad):**
1. ✅ **Pegar el export/HTML del Explorer** directamente en el chat — **la vía que funciona hoy sin tocar nada**. Es solo texto que pegas; yo lo destilo.
2. ⚙️ **Añadir el dominio de Railway a la allowlist del entorno** (network policy). Si se autoriza `linkedin-post-analyzer-production.up.railway.app` en la configuración del entorno de Claude Code, yo podría consultar los endpoints de análisis por HTTPS directamente. Requiere cambiar la política de red del entorno (ver docs: https://code.claude.com/docs/en/claude-code-on-the-web — sección de network policy).
3. ⚙️ **En un entorno con red abierta** (p. ej. Claude Code local en tu máquina, sin egress restringido), tanto la URL de Postgres como el backend funcionarían.

Mientras no haya datos frescos pegados, usa la **taxonomía** (§1) y el **histórico destilado** (§4) que ya están abajo. Los ratios por arquetipo cambian con cada scrape: trátalos como órdenes de magnitud, no como cifras exactas, hasta refrescar.

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

- **Tag de viralidad obligatorio** en cada opción: `🔥 ~{ratio}x vs. media · {arquetipo} (n={count} outliers reales)`. El número sale SOLO del bloque de arquetipos reales (§3, cuando esté relleno). Nunca inventes ratio. Si el arquetipo no tiene histórico suficiente: `🔥 arquetipo sin histórico suficiente en tus datos` (sin número).
- Elige arquetipos genuinamente distintos entre las 2-3 variantes para poder comparar.
- La voz (`brand-voice`) es el CÓMO; el arquetipo/estructura es el QUÉ y sale de aquí. Si hay conflicto, mandan estos datos.

---

## 3 · Top arquetipos con ratios reales  ⟵ RELLENAR DESDE EL DASHBOARD

> Pega aquí el bloque "Top Viral Archetypes (hook × structure × tone)" del Dashboard. Formato sugerido:

```
[PENDIENTE DE RELLENAR]
- {Etiqueta hook} + {Etiqueta estructura}: {ratio}x avg, n={count} outliers
    Ejemplo hook: "…"
- …
```

Top 20 hooks por ratio ⟵ RELLENAR:
```
[PENDIENTE]
[{ratio}x | {hook_type} | {structure} | {tone}] "…"
```

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
- [ ] §3 completo (arquetipos con ratios reales + top 20 hooks) desde el Dashboard.
- [ ] Patrones de lenguaje (densidad outlier vs normal por categoría semántica) si quieres el detalle fino.
- [ ] Split por cuenta (qué arquetipo rinde mejor en Iker vs Unai vs Asier) cuando Asier acumule histórico.
- [ ] Contenido viral de OTRAS cuentas del Dashboard (referencias externas que os han funcionado) — pégame las que quieras que tenga como banco de remix.
