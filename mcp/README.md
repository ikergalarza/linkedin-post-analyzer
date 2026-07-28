# neety-mcp — el corpus de outliers como herramientas

Servidor MCP que expone la base de outliers de Neety (las 3 cuentas propias + la competencia)
para consultarla, analizarla en masa y refrescarla desde cualquier cliente MCP: Claude Code,
Claude Desktop o un cron.

No escribe posts. Sirve **datos, agregados y refresco** — el criterio de escritura sigue en
`docs/skills/`.

---

## Instalación

### 1. Requisito previo: el backend

El MCP no habla con Postgres, habla con el backend. Necesita una versión desplegada que incluya
las rutas `/api/outliers` (las añade esta misma rama). Para comprobarlo, una vez instalado:

```
neety_estado
```

Si responde `Rutas /api/outliers: NO disponibles`, el backend está vivo pero es una versión
anterior: despliega y vuelve a intentarlo.

### 2. Compilar

```bash
cd mcp
npm install
npm run build
```

### 3. Registrarlo en el cliente

**Claude Code** — desde la raíz del repo:

```bash
claude mcp add neety -- node /ruta/absoluta/al/repo/mcp/dist/index.js
```

y añade las variables de entorno con `-e`:

```bash
claude mcp add neety \
  -e NEETY_API_URL=https://TU-BACKEND.up.railway.app \
  -e APP_BASIC_USER=... \
  -e APP_BASIC_PASS=... \
  -- node /ruta/absoluta/al/repo/mcp/dist/index.js
```

**Claude Desktop** — en `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "neety": {
      "command": "node",
      "args": ["/ruta/absoluta/al/repo/mcp/dist/index.js"],
      "env": {
        "NEETY_API_URL": "https://TU-BACKEND.up.railway.app",
        "APP_BASIC_USER": "...",
        "APP_BASIC_PASS": "..."
      }
    }
  }
}
```

### Variables de entorno

| Variable | Obligatoria | Qué es |
|---|---|---|
| `NEETY_API_URL` | sí | La URL del backend. Por defecto `http://localhost:3001` |
| `APP_BASIC_USER` / `APP_BASIC_PASS` | sí en producción | Las mismas del Basic Auth del backend. Sin ellas, todo devuelve 401 |
| `NEETY_TIMEOUT_MS` | no | Por defecto 15 min, porque `neety_refrescar` escanea LinkedIn y tarda |

Las credenciales van en la config del cliente, **nunca en el repo**.

---

## Las tools

### Refrescar y vigilar

| Tool | Qué hace |
|---|---|
| `neety_refrescar` | Reescanea creadores contra LinkedIn, recalcula outliers y registra qué ha entrado y qué ha salido. Presupuesto de creadores por vuelta para no reventar la cuota de Unipile |
| `neety_digest` | El agregado de lo más viral del momento: novedades + qué formatos suben y cuáles se fatigan + salud del dato |
| `neety_digest_marcar` | Sella lo ya enviado para que no salga mañana otra vez |
| `neety_novedades` | Los eventos en crudo, incluidos los degradados |

El flujo diario es `neety_refrescar` → `neety_digest` → mandarlo → `neety_digest_marcar`.

### Consultar

| Tool | Qué hace |
|---|---|
| `neety_outliers_buscar` | ~35 filtros: fecha, creador, multiplicador, likes, comentarios, impresiones, pilar, tema, hook, estructura, tono, longitud, tamaño de cuenta y texto libre |
| `neety_outliers_valores` | Qué valores existen de verdad en un eje, con recuento |
| `neety_outliers_agrupar` | Group-by por 15 dimensiones, con `n` siempre a la vista |
| `neety_outliers_comparar` | Una ventana contra la anterior |
| `neety_post` | Un post entero con métricas Premium y diagnóstico de por qué funcionó |
| `neety_cuentas` | Las 3 cuentas propias y sus `creator_id` |
| `neety_outliers_salud` | Cobertura de etiquetas y frescura: de qué te puedes fiar |
| `neety_estado` | Diagnóstico de la conexión. El primero que hay que llamar si algo falla |

---

## Tres cosas que conviene saber antes de fiarse de un número

**1. Las categorías están incompletas.** `topic` lo asigna un LLM en texto libre, así que conviven
"Sales Tactics", "Sales Tips" y "B2B Sales" para lo mismo; y `pillar` reconoce sobre todo NUESTROS
formatos, así que casi toda la competencia cae en `otro`. Por eso:
- antes de filtrar por `tema` o `pilar`, pasa por `neety_outliers_valores`;
- si el resultado sale corto, usa `q` (texto libre), que no depende de la etiqueta;
- `neety_outliers_salud` te dice cuánto corpus está sin etiquetar.

**2. El multiplicador no es comparable entre creadores.** Hay dos métodos: híbrido (cuenta el
alcance) para las cuentas propias con impresiones, y absoluto para el resto. Las salidas marcan el
híbrido con `*`. Cuando mezcles cuentas propias y competencia en una lista, ordena por `percentil`
en vez de por `ratio`.

**3. "Promovido" no es "nuevo".** `is_outlier` se calcula contra la media móvil del creador, así que
un post viejo puede cruzar el umbral sin que le pase nada, solo porque la media bajó. El digest los
marca aparte a propósito.

---

## Desarrollo

```bash
npm run dev     # tsx, sin compilar
npm run check   # typecheck
```

**Nota sobre zod:** hace falta **zod v4**. Con v3, la inferencia de tipos de `registerTool` explota
(`Type instantiation is excessively deep`) y `tsc` no termina — medido: 25 s para una sola tool y
sin terminar con doce. No lo bajes a v3.
