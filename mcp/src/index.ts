#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { api, qs, ErrorApi } from './api';
import { fecha, truncar, numero, lineaOutlier, tabla, pie, FilaOutlier } from './format';

const servidor = new McpServer({ name: 'neety-outliers', version: '0.1.0' });

/** Toda tool devuelve texto. Envuelve el render y normaliza los errores. */
function texto(s: string) {
  return { content: [{ type: 'text' as const, text: s }] };
}

function error(e: unknown) {
  const msg =
    e instanceof ErrorApi
      ? `Error ${e.status || ''} en ${e.ruta}: ${e.message}`.replace(/\s+/g, ' ')
      : `Error: ${(e as Error)?.message || String(e)}`;
  return { content: [{ type: 'text' as const, text: msg }], isError: true };
}

function minutos(seg: number | null): string {
  if (seg == null) return '—';
  return seg < 90 ? `${seg}s` : `${Math.round(seg / 60)} min`;
}

/** El progreso de un refresco, en texto. */
function renderEstado(e: any): string {
  const pct = e.total ? Math.round((e.procesados / e.total) * 100) : 0;
  const cabecera: Record<string, string> = {
    en_curso: `⏳ En curso — ${e.procesados}/${e.total} creadores (${pct}%)`,
    terminado: `✅ Terminado — ${e.procesados}/${e.total} creadores`,
    fallido: `❌ Falló — ${e.procesados}/${e.total} procesados antes de caerse`,
    abandonado: `⚠️ Abandonado — ${e.procesados}/${e.total}. El proceso murió; lo procesado se guardó`,
  };
  const lineas = [
    cabecera[e.estado] || e.estado,
    '',
    `Ámbito: ${e.ambito} · lleva ${minutos(e.segundos_transcurridos)}` +
      (e.segundos_por_creador != null ? ` · ${e.segundos_por_creador}s por creador` : ''),
  ];
  if (e.estado === 'en_curso') {
    lineas.push(
      `Quedan ~${minutos(e.segundos_restantes_estimados)}` +
        (e.creador_actual ? ` · ahora mismo: ${e.creador_actual}` : '')
    );
  }
  lineas.push(
    '',
    `Posts nuevos: ${e.posts_nuevos}`,
    `Eventos: ${e.eventos.nuevo} nuevos · ${e.eventos.promovido} promovidos · ${e.eventos.degradado} degradados`
  );
  if (e.con_error > 0) {
    lineas.push('', `Creadores con error: ${e.con_error}`);
    for (const err of (e.errores || []).slice(0, 8)) {
      lineas.push(`  · ${err.nombre || '?'}: ${err.error}`);
    }
  }
  if (e.error) lineas.push('', `Error del job: ${e.error}`);
  if (e.estado === 'terminado' && e.eventos.nuevo + e.eventos.promovido > 0) {
    lineas.push('', 'Ya puedes llamar a neety_digest para el resumen de lo más viral.');
  }
  return lineas.join('\n');
}

// Los filtros del buscador, compartidos por buscar / valores / agrupar /
// comparar. Se declaran una vez para que las cuatro tools acepten exactamente
// lo mismo y no haya que recordar cual soporta que.
const filtrosBase = {
  ambito: z
    .enum(['propias', 'competencia', 'todas'])
    .optional()
    .describe('propias = las 3 cuentas de founder; competencia = el resto del corpus'),
  creador: z.string().optional().describe('Filtra por nombre del creador (parcial)'),
  seguidores_min: z.number().optional(),
  seguidores_max: z
    .number()
    .optional()
    .describe('Un 6x de una cuenta de 2k no es la misma lección que uno de 200k'),
  desde: z.string().optional().describe('ISO o YYYY-MM-DD'),
  hasta: z.string().optional(),
  ultimos_dias: z.number().optional(),
  solo_outliers: z
    .boolean()
    .optional()
    .describe('Por defecto true. Ponlo a false para tener el denominador (tasa de acierto)'),
  ratio_min: z.number().optional(),
  ratio_max: z.number().optional(),
  likes_min: z.number().optional(),
  likes_max: z.number().optional(),
  comentarios_min: z.number().optional(),
  reposts_min: z.number().optional(),
  impresiones_min: z.number().optional(),
  engagement_min: z.number().optional(),
  comment_like_ratio_min: z.number().optional().describe('Señal de DEBATE: comentarios ÷ likes'),
  share_like_ratio_min: z.number().optional().describe('Señal de UTILIDAD: reposts ÷ likes'),
  guardados_min: z.number().optional().describe('Premium, solo cuentas propias'),
  clics_enlace_min: z.number().optional().describe('Premium, solo cuentas propias'),
  pilar: z
    .array(z.string())
    .optional()
    .describe('peloteo_mapa | peloteo_los10 | lead_magnet | meme | historia | otro'),
  tema: z
    .array(z.string())
    .optional()
    .describe('Consulta antes neety_outliers_valores: el tema es texto libre y hay sinónimos'),
  hook_type: z.array(z.string()).optional(),
  estructura: z.array(z.string()).optional(),
  tono: z.array(z.string()).optional(),
  tipo_contenido: z.array(z.string()).optional().describe('text, text_image, text_video…'),
  idioma: z.string().optional(),
  longitud_min: z.number().optional().describe('Caracteres'),
  longitud_max: z.number().optional(),
  q: z.string().optional().describe('Busca en el texto y el hook. No depende de las categorías'),
  modo: z.enum(['frase', 'todas', 'cualquiera']).optional(),
  excluir: z.string().optional(),
};

// ---------------------------------------------------------------------------
// REFRESCAR — actualizar la base con lo nuevo
// ---------------------------------------------------------------------------

servidor.registerTool(
  'neety_refrescar',
  {
    title: 'Arrancar el refresco de la base de outliers',
    description:
      'Lanza el reescaneo de creadores contra LinkedIn y VUELVE EN EL ACTO — el trabajo sigue en ' +
      'segundo plano porque con muchos creadores tarda minutos, bastante más que el timeout de ' +
      'una tool. NO vuelvas a llamar a esta tool para ver si terminó: usa neety_refrescar_estado.',
    inputSchema: {
      ambito: z
        .enum(['competencia', 'propias', 'todas'])
        .optional()
        .describe('Por defecto competencia: las propias ya las vigila el monitor cada 15 min'),
      limite: z
        .number()
        .optional()
        .describe('Creadores en esta vuelta (por defecto 25, máximo 500)'),
      creator_ids: z.array(z.string()).optional(),
    },
    annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: true },
  },
  async (args) => {
    try {
      const conteo: any = await api.get('/api/outliers/creadores/conteo');
      const r: any = await api.post('/api/outliers/refresh', args);

      if (r.ya_habia_uno) {
        const e: any = await api.get(`/api/outliers/refresh/estado${qs({ job_id: r.job.id })}`);
        return texto(
          'Ya hay un refresco en curso, no se ha lanzado otro.\n\n' +
            renderEstado(e) +
            '\n\nUsa neety_refrescar_estado para seguirlo.'
        );
      }
      if (r.job.total === 0) {
        return texto(
          `No hay creadores que refrescar en el ámbito "${r.job.ambito}".\n\n` +
            `Disponibles: ${conteo.competencia} de competencia · ${conteo.propias} propias.`
        );
      }

      const estimado = Math.round((r.job.total * 4) / 60);
      return texto(
        [
          `Refresco arrancado (${r.job.ambito}).`,
          '',
          `Creadores en esta vuelta: ${r.job.total} de ${conteo.total} en total` +
            (conteo.sin_escanear ? ` · ${conteo.sin_escanear} sin escanear nunca` : ''),
          `Estimado: ~${estimado} min (a ojo, hasta que haya medidas reales)`,
          `job_id: ${r.job.id}`,
          '',
          'Corre en segundo plano. Llama a neety_refrescar_estado dentro de un rato para ver cómo ' +
            'va — no vuelvas a llamar a neety_refrescar, eso no lo acelera.',
        ].join('\n')
      );
    } catch (e) {
      return error(e);
    }
  }
);

servidor.registerTool(
  'neety_refrescar_estado',
  {
    title: 'Cómo va el refresco',
    description:
      'El progreso del refresco en curso (o el resultado del último): cuántos creadores lleva, ' +
      'cuánto queda, qué eventos ha generado y qué creadores han fallado. Es la forma de saber ' +
      'si terminó — la tool que lo arranca vuelve antes de que acabe.',
    inputSchema: { job_id: z.string().optional().describe('Por defecto, el más reciente') },
    annotations: { readOnlyHint: true },
  },
  async ({ job_id }) => {
    try {
      const e: any = await api.get(`/api/outliers/refresh/estado${qs({ job_id })}`);
      if (!e || e.estado === null) return texto('No se ha lanzado ningún refresco todavía.');
      return texto(renderEstado(e));
    } catch (e) {
      return error(e);
    }
  }
);

// ---------------------------------------------------------------------------
// DIGEST — el agregado de lo más viral del momento
// ---------------------------------------------------------------------------

servidor.registerTool(
  'neety_digest',
  {
    title: 'Resumen de lo más viral del momento',
    description:
      'El agregado: qué outliers nuevos han aparecido, qué formatos suben y cuáles se están ' +
      'fatigando, y de qué parte del dato te puedes fiar. Pensado para el resumen diario a ' +
      'marketing y growth. Devuelve los datos ya ordenados y con los ids de evento; para que un ' +
      'post no vuelva a salir mañana, márcalo con neety_digest_marcar.',
    inputSchema: {
      dias: z.number().optional().describe('Ventana de novedades. Por defecto 1 (desde ayer)'),
      ratio_min: z.number().optional().describe('Multiplicador mínimo para entrar. Por defecto 3'),
      solo_pendientes: z
        .boolean()
        .optional()
        .describe('Por defecto true: solo lo que no se ha mandado nunca en un digest'),
    },
    annotations: { readOnlyHint: true },
  },
  async ({ dias, ratio_min, solo_pendientes }) => {
    try {
      const d: any = await api.get(`/api/outliers/digest${qs({ dias, ratio_min, solo_pendientes })}`);

      const bloques: string[] = [`📊 Outliers · ${fecha(d.generado_en)}`];

      if (!d.novedades.length) {
        bloques.push(
          '',
          `🆕 Sin novedades en los últimos ${d.ventana_dias} día(s) por encima de ${ratio_min ?? 3}x.`,
          '',
          'Si esto se repite varios días, comprueba con neety_refrescar que el corpus se está actualizando.'
        );
      } else {
        bloques.push('', `🆕 ${d.novedades.length} novedades`);
        for (const n of d.novedades) {
          const etiqueta = n.evento === 'promovido' ? ' [promovido: bajó la media, no creció el post]' : '';
          bloques.push(`  ${lineaOutlier(n as FilaOutlier)}${etiqueta}`);
          if (n.url) bloques.push(`     ${n.url}`);
        }
      }

      const conclusivas = d.tendencias.filter((t: any) => t.concluyente && t.delta_pct !== null);
      if (conclusivas.length) {
        bloques.push('', '📈 Tendencia por pilar (30 días vs los 30 anteriores)');
        bloques.push(
          tabla(
            ['pilar', 'n', 'ratio antes', 'ratio ahora', 'delta'],
            conclusivas.map((t: any) => [
              t.pilar,
              `${t.n_previo}→${t.n_reciente}`,
              t.ratio_previo?.toFixed(2) ?? '—',
              t.ratio_reciente?.toFixed(2) ?? '—',
              `${t.delta_pct > 0 ? '+' : ''}${t.delta_pct}%`,
            ])
          )
        );
      }
      const flojas = d.tendencias.filter((t: any) => !t.concluyente).length;
      if (flojas) {
        bloques.push(`  (${flojas} pilar(es) con menos de 3 posts por ventana: no son concluyentes)`);
      }

      const s = d.salud;
      const partes = [
        `${numero(s.outliers)} outliers de ${numero(s.posts)} posts`,
        s.outliers_sin_tema ? `${s.outliers_sin_tema} outliers sin tema` : null,
        s.posibles_duplicados ? `${s.posibles_duplicados} pares de temas posiblemente duplicados` : null,
      ].filter(Boolean);
      bloques.push('', `⚠️ Salud del dato: ${partes.join(' · ')}`);
      for (const f of s.frescura || []) {
        bloques.push(
          `  ${f.gestionada ? 'Cuentas propias' : 'Competencia'}: ${f.creadores} creadores · ` +
            `escaneo más antiguo ${fecha(f.mas_antiguo)}`
        );
      }

      const ids = d.novedades.map((n: any) => n.evento_id);
      if (ids.length) {
        bloques.push(
          '',
          `Para no repetirlas mañana: neety_digest_marcar con estos evento_ids → ${ids.join(',')}`
        );
      }

      return texto(bloques.join('\n'));
    } catch (e) {
      return error(e);
    }
  }
);

servidor.registerTool(
  'neety_digest_marcar',
  {
    title: 'Marcar novedades como ya enviadas',
    description:
      'Sella los eventos que ya han salido en un resumen para que no vuelvan a aparecer. Llámalo ' +
      'DESPUÉS de mandar el digest, no antes: si el envío falla y ya los marcaste, se pierden.',
    inputSchema: { evento_ids: z.array(z.string()).describe('Los que devuelve neety_digest') },
    annotations: { readOnlyHint: false, idempotentHint: true },
  },
  async ({ evento_ids }) => {
    try {
      const r: any = await api.post('/api/outliers/novedades/marcar', { evento_ids });
      return texto(`${r.marcados} evento(s) marcados como enviados.`);
    } catch (e) {
      return error(e);
    }
  }
);

servidor.registerTool(
  'neety_novedades',
  {
    title: 'Outliers nuevos, en crudo',
    description:
      'Los outliers que han entrado (o salido) en una ventana, sin resumir. Úsalo cuando quieras ' +
      'la lista completa en vez del digest, o para mirar los degradados.',
    inputSchema: {
      dias: z.number().optional().describe('Por defecto 7'),
      desde: z.string().optional(),
      ratio_min: z.number().optional(),
      eventos: z
        .array(z.enum(['nuevo', 'promovido', 'degradado']))
        .optional()
        .describe('Por defecto nuevo y promovido'),
      solo_pendientes: z.boolean().optional(),
      limit: z.number().optional(),
    },
    annotations: { readOnlyHint: true },
  },
  async (args) => {
    try {
      const r: any = await api.get(`/api/outliers/novedades${qs(args)}`);
      if (!r.novedades.length) return texto('Sin eventos en esa ventana.');
      const lineas = r.novedades.map(
        (n: any) => `[${n.evento}] ${lineaOutlier(n as FilaOutlier)}`
      );
      return texto(lineas.join('\n') + pie({ devueltos: r.total, total: r.total }));
    } catch (e) {
      return error(e);
    }
  }
);

// ---------------------------------------------------------------------------
// BUSCAR
// ---------------------------------------------------------------------------

servidor.registerTool(
  'neety_outliers_buscar',
  {
    title: 'Buscar en el corpus de outliers',
    description:
      'El buscador. Filtra por fecha, creador, multiplicador, likes, comentarios, impresiones, ' +
      'pilar, tema, tipo de hook, estructura, tono, longitud, tamaño de la cuenta y texto libre. ' +
      'AVISO: las categorías (tema sobre todo) están incompletas y tienen sinónimos — si buscas ' +
      'por tema, pasa antes por neety_outliers_valores, y si el resultado parece corto, prueba ' +
      'con `q` (texto libre), que no depende de la etiqueta.',
    inputSchema: {
      ...filtrosBase,
      orden: z
        .enum([
          'ratio',
          'percentil',
          'likes',
          'comentarios',
          'reposts',
          'impresiones',
          'engagement',
          'fecha',
          'fecha_asc',
          'debate',
          'utilidad',
        ])
        .optional()
        .describe('Por defecto ratio. Usa `percentil` cuando mezcles cuentas propias y competencia'),
      limit: z.number().optional().describe('1-100, por defecto 25'),
      cursor: z
        .string()
        .optional()
        .describe(
          'Para recorrer TODO el corpus: pasa aquí el `cursor` de la llamada anterior. Continúa ' +
            'donde se quedó aunque haya un refresco corriendo. No cambies el `orden` a mitad'
        ),
      offset: z.number().optional().describe('Salto directo. Para recorrer todo usa `cursor`'),
    },
    annotations: { readOnlyHint: true },
  },
  async (args) => {
    try {
      const r: any = await api.get(`/api/outliers/buscar${qs(args)}`);
      if (!r.filas.length) {
        return texto(
          args.cursor
            ? 'Fin de la lista: no quedan más resultados.'
            : 'Sin resultados.\n\nAntes de dar la búsqueda por vacía: si filtraste por `tema` o ' +
                '`pilar`, mira qué valores existen con neety_outliers_valores — las etiquetas ' +
                'están incompletas. Con `q` buscas en el texto y te saltas ese problema.'
        );
      }

      const mezcla = new Set(r.filas.map((f: any) => f.metodo)).size > 1;
      const sinTema = r.filas.filter((f: any) => !f.tema).length;

      return texto(
        r.filas.map(lineaOutlier).join('\n') +
          pie({
            devueltos: r.devueltos,
            total: r.total,
            hay_mas: r.hay_mas,
            mezclaMetodos: mezcla,
            sinEtiqueta: sinTema,
            nota: `orden: ${r.orden}`,
            cursor: r.cursor_siguiente,
          })
      );
    } catch (e) {
      return error(e);
    }
  }
);

servidor.registerTool(
  'neety_outliers_valores',
  {
    title: 'Qué valores existen (facetas)',
    description:
      'Los valores que EXISTEN de verdad en un eje, con su recuento y su ratio medio. Llámalo ' +
      'antes de filtrar por una categoría: el tema lo asigna un LLM en texto libre, así que ' +
      'conviven "Sales Tactics", "Sales Tips" y "B2B Sales" para lo mismo, y filtrar por uno ' +
      'pierde los otros dos en silencio. Aquí se ven los tres, y el hueco de los que no tienen ' +
      'etiqueta sale como fila propia.',
    inputSchema: {
      eje: z
        .enum(['tema', 'pilar', 'hook', 'estructura', 'tono', 'tipo_contenido', 'creador', 'idioma'])
        .describe('Sobre qué columna agrupar'),
      ...filtrosBase,
    },
    annotations: { readOnlyHint: true },
  },
  async (args) => {
    try {
      const r: any = await api.get(`/api/outliers/facetas${qs(args)}`);
      if (!r.valores.length) return texto('Sin valores para esos filtros.');
      return texto(
        tabla(
          [r.eje, 'n', 'ratio medio', 'máx'],
          r.valores.map((v: any) => [
            v.valor ?? '(sin etiqueta)',
            v.n,
            v.ratio_medio?.toFixed(2) ?? '—',
            v.ratio_max?.toFixed(2) ?? '—',
          ])
        )
      );
    } catch (e) {
      return error(e);
    }
  }
);

servidor.registerTool(
  'neety_outliers_agrupar',
  {
    title: 'Agregado por dimensión',
    description:
      'Group-by genérico: n, tasa de acierto, ratio medio y mediano, likes y comentarios medios. ' +
      'Para "¿qué formato funciona mejor?" usa tasa_outlier con solo_outliers=false — el ratio ' +
      'medio de una lista ya filtrada a outliers está sesgado por construcción.',
    inputSchema: {
      dimension: z
        .enum([
          'pilar',
          'tema',
          'hook',
          'estructura',
          'tono',
          'tipo_contenido',
          'creador',
          'cuenta',
          'idioma',
          'dia_semana',
          'hora',
          'mes',
          'semana',
          'bucket_longitud',
          'bucket_seguidores',
        ])
        .describe('Por qué eje agrupar'),
      ...filtrosBase,
    },
    annotations: { readOnlyHint: true },
  },
  async (args) => {
    try {
      const r: any = await api.get(`/api/outliers/agrupar${qs(args)}`);
      if (!r.filas.length) return texto('Sin datos para esos filtros.');
      const flojas = r.filas.filter((f: any) => f.n < 5).length;
      return texto(
        tabla(
          [r.dimension, 'n', 'outliers', '% acierto', 'ratio medio', 'mediana', '♥ medios'],
          r.filas.map((f: any) => [
            (f.valor ?? '(sin etiqueta)') + (f.n < 5 ? ' ⚠' : ''),
            f.n,
            f.outliers,
            f.tasa_outlier != null ? `${f.tasa_outlier}%` : '—',
            f.ratio_medio?.toFixed(2) ?? '—',
            f.ratio_mediano?.toFixed(2) ?? '—',
            numero(f.likes_medios),
          ])
        ) + (flojas ? `\n\n⚠ = menos de 5 posts. No saques conclusiones de esas filas.` : '')
      );
    } catch (e) {
      return error(e);
    }
  }
);

servidor.registerTool(
  'neety_outliers_comparar',
  {
    title: 'Comparar dos ventanas de tiempo',
    description:
      'Una ventana contra la anterior, agrupado por la dimensión que elijas. Es la tool de ' +
      '"¿los lead magnets funcionan peor que antes?". Marca como no concluyentes las filas con ' +
      'menos de 3 posts por lado.',
    inputSchema: {
      dimension: z
        .enum(['pilar', 'tema', 'hook', 'estructura', 'tono', 'tipo_contenido', 'creador', 'cuenta'])
        .optional()
        .describe('Por defecto pilar'),
      dias: z.number().optional().describe('Tamaño de cada ventana. Por defecto 90'),
      ...filtrosBase,
    },
    annotations: { readOnlyHint: true },
  },
  async (args) => {
    try {
      const r: any = await api.get(`/api/outliers/comparar${qs(args)}`);
      const filas = r.filas.filter((f: any) => f.valor);
      if (!filas.length) return texto('Sin datos para comparar.');
      return texto(
        `Ventanas de ${r.ventana_dias} días (reciente desde ${fecha(r.ventana_reciente.desde)}).\n\n` +
          tabla(
            [r.dimension, 'n antes→ahora', 'ratio antes', 'ratio ahora', 'delta', ''],
            filas.map((f: any) => [
              f.valor,
              `${f.n_previo}→${f.n_reciente}`,
              f.ratio_previo?.toFixed(2) ?? '—',
              f.ratio_reciente?.toFixed(2) ?? '—',
              f.delta_pct != null ? `${f.delta_pct > 0 ? '+' : ''}${f.delta_pct}%` : '—',
              f.concluyente ? '' : 'no concluyente',
            ])
          )
      );
    } catch (e) {
      return error(e);
    }
  }
);

// ---------------------------------------------------------------------------
// POST, CUENTAS, SALUD
// ---------------------------------------------------------------------------

servidor.registerTool(
  'neety_post',
  {
    title: 'Un post entero con su diagnóstico',
    description:
      'El texto completo, todas las métricas (incluidas las Premium: guardados, envíos, clics al ' +
      'enlace, visitas al perfil) y el diagnóstico de por qué funcionó: motor de viralidad, ' +
      'mecanismo narrativo y plantilla abstracta.',
    inputSchema: { post_id: z.string().describe('El UUID que devuelve el buscador') },
    annotations: { readOnlyHint: true },
  },
  async ({ post_id }) => {
    try {
      const r: any = await api.get(`/api/outliers/post/${encodeURIComponent(post_id)}`);
      const p = r.post;
      const d = r.diagnostico;

      const metricas = [
        `${numero(p.likes_count)} likes`,
        `${numero(p.comments_count)} comentarios`,
        `${numero(p.reposts_count)} reposts`,
        p.impressions_count != null ? `${numero(p.impressions_count)} impresiones` : null,
        p.saves_count != null ? `${numero(p.saves_count)} guardados` : null,
        p.sends_count != null ? `${numero(p.sends_count)} envíos` : null,
        p.link_clicks_count != null ? `${numero(p.link_clicks_count)} clics al enlace` : null,
        p.followers_gained_count != null ? `+${numero(p.followers_gained_count)} seguidores` : null,
        p.pct_risa != null ? `${p.pct_risa}% reacciones de risa` : null,
      ].filter(Boolean);

      return texto(
        [
          `${p.creador} · ${fecha(p.published_at)} · ${p.pillar || 'sin pilar'}` +
            `${p.topic ? ` / ${p.topic}` : ''} · ${p.outlier_ratio?.toFixed(2)}x` +
            `${p.es_gestionada ? ' (ratio híbrido)' : ''}`,
          p.post_url || '',
          '',
          metricas.join(' · '),
          `hook: ${p.hook_type} · estructura: ${p.post_structure} · tono: ${p.text_tone} · ` +
            `${p.char_count} car. · ${p.content_type}`,
          '',
          '--- TEXTO ---',
          p.content_text || '(sin texto)',
          '',
          '--- POR QUÉ FUNCIONÓ ---',
          `Motor de viralidad: ${d.label} — ${d.explanation}`,
          `Mecanismo narrativo: ${d.explicacion?.narrative_mechanism ?? '—'}`,
          `Tensión del hook: ${d.explicacion?.hook_tension ?? '—'}`,
          `Por qué comentan: ${d.explicacion?.comment_driver ?? '—'}`,
          `Plantilla: ${d.explicacion?.abstract_template ?? '—'}`,
          '',
          `Ritmo: hook de ${d.ritmo?.hook_zone?.lines ?? '?'} líneas (${d.ritmo?.hook_zone?.style ?? '?'}) · ` +
            `cuerpo ${d.ritmo?.body?.style ?? '?'}${d.ritmo?.body?.has_list ? ' con lista' : ''} · ` +
            `cierre ${d.ritmo?.closing?.style ?? '?'} · ${d.ritmo?.scroll_stops ?? 0} frenos de scroll`,
        ].join('\n')
      );
    } catch (e) {
      return error(e);
    }
  }
);

servidor.registerTool(
  'neety_cuentas',
  {
    title: 'Las cuentas propias',
    description:
      'Las 3 cuentas de founder (Iker, Unai, Asier) con su id, seguidores, posts, outliers y ' +
      'último escaneo. El creator_id de aquí es lo que pide `creator_ids` en el buscador.',
    inputSchema: {},
    annotations: { readOnlyHint: true },
  },
  async () => {
    try {
      const filas: any[] = await api.get('/api/accounts');
      if (!filas.length) return texto('No hay cuentas gestionadas dadas de alta.');
      return texto(
        tabla(
          ['cuenta', 'seguidores', 'posts', 'outliers', 'eng. medio', 'último post', 'creator_id'],
          filas.map((c) => [
            c.name,
            numero(c.followers_count),
            c.total_posts,
            c.total_outliers,
            numero(c.avg_engagement),
            fecha(c.last_post_at),
            c.id,
          ])
        )
      );
    } catch (e) {
      return error(e);
    }
  }
);

servidor.registerTool(
  'neety_outliers_salud',
  {
    title: 'De qué te puedes fiar',
    description:
      'Cobertura de etiquetas y frescura del corpus. Míralo antes de creerte cualquier análisis ' +
      'agregado: si el 30% de los outliers no tiene tema, un group-by por tema está mirando el 70%.',
    inputSchema: {},
    annotations: { readOnlyHint: true },
  },
  async () => {
    try {
      const s: any = await api.get('/api/outliers/salud');
      const t = s.totales;
      const pc = (n: number, total: number) => (total ? `${Math.round((n / total) * 100)}%` : '—');

      const lineas = [
        `Posts: ${numero(t.posts)} · outliers: ${numero(t.outliers)} (${pc(t.outliers, t.posts)})`,
        '',
        '── Cobertura de etiquetas ──',
        `tema          ${pc(t.con_tema, t.posts)} del corpus · ${t.outliers_sin_tema} outliers SIN tema`,
        `pilar         ${pc(t.con_pilar, t.posts)} · '${'otro'}' es el ${pc(t.pilar_otro, t.posts)}`,
        `reacciones    ${pc(t.con_reacciones, t.posts)} — sin esto no se detecta ningún meme`,
        `impresiones   ${pc(t.con_impresiones, t.posts)} — solo cuentas propias`,
        '',
        '── Taxonomía ──',
        `temas distintos: ${s.temas_distintos} · pares sospechosos de duplicado: ${s.posibles_duplicados.length}`,
      ];

      if (s.posibles_duplicados.length) {
        for (const d of s.posibles_duplicados.slice(0, 10)) lineas.push(`  "${d.a}" ≈ "${d.b}"`);
      }

      lineas.push('', '── Frescura ──');
      for (const f of s.frescura) {
        lineas.push(
          `${f.gestionada ? 'Cuentas propias' : 'Competencia'}: ${f.creadores} creadores · ` +
            `más reciente ${fecha(f.mas_reciente)} · más antiguo ${fecha(f.mas_antiguo)}`
        );
      }
      lineas.push(
        '',
        `Eventos de outlier registrados: ${s.eventos.total} (${s.eventos.ultima_semana} esta semana)`
      );
      if (s.eventos.total === 0) {
        lineas.push(
          '',
          'Cero eventos: el registro empieza a llenarse con el primer refresco posterior al ' +
            'despliegue. Hasta entonces, neety_digest no tendrá novedades que contar.'
        );
      }

      return texto(lineas.join('\n'));
    } catch (e) {
      return error(e);
    }
  }
);

servidor.registerTool(
  'neety_estado',
  {
    title: 'Diagnóstico de la conexión',
    description:
      'Comprueba a qué backend apunta el MCP, si las credenciales valen y si las rutas de ' +
      'outliers están desplegadas. Úsalo cuando otra tool falle.',
    inputSchema: {},
    annotations: { readOnlyHint: true },
  },
  async () => {
    const lineas = [`Backend: ${api.base}`, `Credenciales: ${api.tieneCredenciales ? 'configuradas' : 'AUSENTES'}`];
    try {
      await api.get('/api/health');
      lineas.push('Salud: ok');
    } catch (e: any) {
      lineas.push(`Salud: FALLA — ${e.message}`);
      return texto(lineas.join('\n'));
    }
    try {
      await api.get('/api/outliers/salud');
      lineas.push('Rutas /api/outliers: desplegadas');
    } catch (e: any) {
      lineas.push(
        `Rutas /api/outliers: NO disponibles — ${e.message}`,
        '',
        'El backend está vivo pero es una versión anterior. Despliega la rama que añade ' +
          'backend/src/routes/outliers.ts.'
      );
    }
    return texto(lineas.join('\n'));
  }
);

// ---------------------------------------------------------------------------

async function main() {
  const transporte = new StdioServerTransport();
  await servidor.connect(transporte);
  // stderr, nunca stdout: stdout es el canal del protocolo.
  console.error(`[neety-mcp] conectado · backend ${api.base}`);
}

main().catch((err) => {
  console.error('[neety-mcp] fallo al arrancar:', err);
  process.exit(1);
});
