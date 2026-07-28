# neety-mcp — el corpus de outliers como herramientas

Expone la base de outliers de Neety (las 3 cuentas propias + la competencia) para consultarla,
analizarla en masa y refrescarla desde cualquier cliente MCP.

No escribe posts. Sirve **datos, agregados y refresco** — el criterio de escritura sigue en
`docs/skills/`.

## Hay dos formas de conectarlo. Elige una

| | **A · Remoto (HTTP)** ← empieza por aquí | **B · Local (stdio)** |
|---|---|---|
| Dónde corre | En el backend de Railway, ya desplegado | Un proceso en tu máquina |
| Qué necesitas | Una URL y una cabecera | El repo clonado, Node y compilar |
| Funciona desde | Claude Code local **y remoto**, claude.ai, el móvil | Solo el equipo donde lo instalaste |
| Instalación | **Un comando** | Clonar + `npm install` + `npm run build` + registrar |
| Código | `backend/src/mcp/` | Esta carpeta |

**La A vale para casi todo el mundo.** La B tiene sentido si quieres apuntar a un backend en
`localhost` mientras desarrollas, o si algún día se añaden tools que lean ficheros del repo (el
validador, el historial de publicaciones), que por definición no pueden vivir en Railway.

---

# A · Remoto por HTTP (recomendado)

No hay nada que clonar ni compilar: el servidor ya va dentro del backend, en `/mcp`.

### 1. Codifica las credenciales

El MCP se autentica con el **mismo Basic Auth que el resto de la app** — las credenciales que ya
tienes en Railway, no unas nuevas. Hay que pasarlas en base64:

**macOS / Linux:**

```bash
echo -n 'USUARIO:CONTRASEÑA' | base64
```

**Windows (PowerShell):**

```powershell
[Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes('USUARIO:CONTRASEÑA'))
```

El `-n` de macOS no es opcional: sin él, `base64` mete un salto de línea en la cadena y el backend
devuelve 401.

### 2. Registra el servidor

Sustituye la URL y el resultado del paso anterior. Es el mismo comando en los dos sistemas (en
Windows, todo en una línea):

```bash
claude mcp add --transport http --scope user neety https://TU-BACKEND.up.railway.app/mcp --header "Authorization: Basic EL-BASE64-DEL-PASO-1"
```

**El orden importa y no es el que parece.** `--header` admite varios valores, así que va **el
último**: puesto antes de la URL se la traga como si fuera otra cabecera y el CLI corta con
`missing required argument 'commandOrUrl'`. El resto de opciones, delante del nombre.

Los otros dos detalles que rompen la instalación:

- **`/mcp` al final de la URL.** Sin eso apuntas al frontend y te devuelve HTML.
- **`--scope user`** no es opcional en la práctica: el scope por defecto es `local` y registra el
  servidor solo para el directorio desde el que lanzaste el comando. El MCP se usa desde cualquier
  conversación, no solo desde este repo.

### 3. Comprueba

```bash
claude mcp list
```

Tiene que salir `neety: https://… (HTTP) - √ Connected`. Después reinicia Claude Code —no recoge
servidores nuevos en una sesión ya abierta— y pídele:

```
usa neety_cuentas
```

Si te devuelve la tabla de las 3 cuentas, está conectado de verdad.

### Claude Desktop

Mismo servidor, otra sintaxis. En `claude_desktop_config.json`:

| Sistema | Dónde está el fichero |
|---|---|
| **macOS** | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| **Windows** | `%APPDATA%\Claude\claude_desktop_config.json` |

```json
{
  "mcpServers": {
    "neety": {
      "type": "http",
      "url": "https://TU-BACKEND.up.railway.app/mcp",
      "headers": { "Authorization": "Basic EL-BASE64" }
    }
  }
}
```

Hay que **reiniciar Claude Desktop** después de tocarlo: no relee el fichero solo.

### Si algo falla

| Síntoma | Causa | Solución |
|---|---|---|
| `missing required argument 'commandOrUrl'` | `--header` va antes de la URL y se la traga | Pon `--header` **el último** |
| `401` | El base64 está mal o lleva un salto de línea | Rehaz el paso 1 **con `-n`** |
| `404` | Falta `/mcp` al final de la URL | Corrígela |
| Responde HTML | La URL apunta al frontend, no al backend | Usa la URL del servicio de Railway |
| `405` | Estás haciendo GET | El transporte usa POST; el cliente ya lo hace solo |
| No aparece en `claude mcp list` | Se registró con scope `local` desde otro directorio | Vuelve a añadirlo con `--scope user` |
| Las tools existen pero fallan | El backend es una versión anterior a `/api/outliers` | Despliega `main` |

Para cambiar algo, lo más rápido es borrar y volver a añadir:

```bash
claude mcp remove neety --scope user
```

---

# B · Local por stdio

Para apuntar a un backend en `localhost` o si prefieres que el proceso corra en tu equipo.

### 1. Compilar

Requiere **Node 18 o superior** (el servidor usa `fetch` nativo).

**macOS / Linux:**

```bash
cd /ruta/al/repo/mcp
npm install
npm run build
pwd            # apunta esta ruta: la necesitas en el paso 3
```

**Windows** (`cmd` o PowerShell):

```
cd C:\ruta\al\repo\mcp
npm install
npm run build
cd             :: apunta esta ruta: la necesitas en el paso 3
```

Al terminar tiene que existir `dist/index.js`. Ese fichero es lo que ejecuta Claude.

### 2. Registrarlo en Claude Code

**macOS / Linux** (el `\` parte la línea; también vale todo seguido):

```bash
claude mcp add neety --scope user \
  -e NEETY_API_URL=https://TU-BACKEND.up.railway.app \
  -e APP_BASIC_USER=USUARIO \
  -e APP_BASIC_PASS=CONTRASEÑA \
  -- node /ruta/absoluta/al/repo/mcp/dist/index.js
```

Ejemplo real con una ruta de macOS:

```bash
claude mcp add neety --scope user \
  -e NEETY_API_URL=https://linkedin-post-analyzer.up.railway.app \
  -e APP_BASIC_USER=neety \
  -e APP_BASIC_PASS='la-de-railway' \
  -- node /Users/iker/repos/linkedin-post-analyzer/mcp/dist/index.js
```

**Windows** — en `cmd` y PowerShell el `\` NO parte líneas, así que va todo en una:

```
claude mcp add neety --scope user -e NEETY_API_URL=https://TU-BACKEND.up.railway.app -e APP_BASIC_USER=USUARIO -e APP_BASIC_PASS=CONTRASEÑA -- node C:\ruta\al\repo\mcp\dist\index.js
```

#### Tres detalles que rompen la instalación

1. **`--scope user` no es opcional en la práctica.** El scope por defecto es `local`, que registra el
   servidor **solo para el directorio desde el que lo lanzaste**. Como el MCP se usa desde cualquier
   conversación —incluida una en la que estés escribiendo un post y no tocando este repo—, lo
   quieres a nivel de usuario.
2. **La ruta del `.js` tiene que ser absoluta.** Es la que ejecuta Claude, y no corre desde el
   directorio del repo. Nada de `./dist/index.js` ni de `~/...` sin expandir.
3. **La contraseña, entre comillas simples** si lleva caracteres raros (`$`, `!`, espacios). En
   macOS y Linux la shell se los come; en PowerShell, comillas simples también.

### 3. Comprobar que ha entrado

```
claude mcp list
```

Y dentro de Claude, la primera llamada siempre es la misma:

```
neety_estado
```

Te dice las tres cosas que pueden fallar por separado: a qué backend apunta, si las credenciales
valen y si las rutas `/api/outliers` están desplegadas.

### Claude Desktop (con stdio)

El fichero de configuración es `claude_desktop_config.json`:

| Sistema | Dónde está |
|---|---|
| **macOS** | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| **Windows** | `%APPDATA%\Claude\claude_desktop_config.json` |

**macOS:**

```json
{
  "mcpServers": {
    "neety": {
      "command": "node",
      "args": ["/Users/TU-USUARIO/repos/linkedin-post-analyzer/mcp/dist/index.js"],
      "env": {
        "NEETY_API_URL": "https://TU-BACKEND.up.railway.app",
        "APP_BASIC_USER": "...",
        "APP_BASIC_PASS": "..."
      }
    }
  }
}
```

**Windows** — misma estructura, pero la ruta lleva **barras dobles**:

```json
{
  "mcpServers": {
    "neety": {
      "command": "node",
      "args": ["C:\\Users\\TU-USUARIO\\repos\\linkedin-post-analyzer\\mcp\\dist\\index.js"],
      "env": {
        "NEETY_API_URL": "https://TU-BACKEND.up.railway.app",
        "APP_BASIC_USER": "...",
        "APP_BASIC_PASS": "..."
      }
    }
  }
}
```

Con barra simple el JSON no parsea y el servidor no arranca sin decir por qué. En los dos sistemas
hay que **reiniciar Claude Desktop** después de tocar el fichero: no lo relee solo.

### Variables de entorno (solo modo local)

| Variable | Obligatoria | Qué es |
|---|---|---|
| `NEETY_API_URL` | sí | La URL del backend. Por defecto `http://localhost:3001` |
| `APP_BASIC_USER` / `APP_BASIC_PASS` | sí contra producción | Las mismas del Basic Auth del backend |
| `NEETY_TIMEOUT_MS` | no | Por defecto 15 min, porque `neety_refrescar` escanea LinkedIn y tarda |

Las credenciales van en la config del cliente, **nunca en el repo**.

En modo local hay una tool extra, **`neety_estado`**, que diagnostica la conexión: a qué backend
apunta, si las credenciales valen y si las rutas `/api/outliers` están desplegadas. En modo remoto
no hace falta — si no conectas, el propio cliente te lo dice.

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
