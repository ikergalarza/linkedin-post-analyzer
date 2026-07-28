/**
 * Render de las respuestas.
 *
 * Una tool MCP devuelve texto que entra en el contexto del modelo, asi que el
 * formato ES parte del diseño: volcar el JSON crudo de 30 posts son ~8.000
 * tokens y una linea por post son ~800. Todo lo de aqui existe para eso.
 */

export function fecha(d: string | Date | null | undefined): string {
  if (!d) return '—';
  const t = new Date(d);
  return Number.isNaN(t.getTime()) ? '—' : t.toISOString().slice(0, 10);
}

export function truncar(s: string | null | undefined, n: number): string {
  const t = (s || '').replace(/\s+/g, ' ').trim();
  if (!t) return '—';
  return t.length <= n ? t : `${t.slice(0, n - 1)}…`;
}

export function numero(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(Math.round(n));
}

function ratio(r: number | null | undefined, metodo?: string): string {
  if (r === null || r === undefined) return '—';
  // El sufijo no es decoracion: outlier_ratio se calcula con dos metodos
  // distintos (hibrido con alcance para cuentas gestionadas, absoluto para el
  // resto) y sin marcarlo se comparan cosas que no son comparables.
  const marca = metodo === 'hibrido' ? '*' : '';
  return `${r.toFixed(2)}x${marca}`;
}

export interface FilaOutlier {
  id?: string;
  post_id?: string;
  creador: string | null;
  published_at: string | null;
  pilar: string | null;
  tema: string | null;
  hook: string | null;
  likes: number;
  comentarios: number;
  impresiones: number | null;
  ratio: number;
  metodo?: string;
  percentil_creador?: number | null;
  url?: string | null;
}

export function lineaOutlier(f: FilaOutlier): string {
  const id = f.id || f.post_id || '';
  const pct = f.percentil_creador != null ? ` p${Math.round(f.percentil_creador * 100)}` : '';
  const imp = f.impresiones != null ? ` ${numero(f.impresiones)}👁` : '';
  return (
    `${fecha(f.published_at)} · ${f.creador || '?'} · ${f.pilar || 'sin pilar'}` +
    `${f.tema ? `/${f.tema}` : ''} · ${ratio(f.ratio, f.metodo)}${pct} · ` +
    `${numero(f.likes)}♥ ${numero(f.comentarios)}💬${imp} · ` +
    `"${truncar(f.hook, 70)}" · ${id.slice(0, 8)}`
  );
}

/** Tabla de texto alineada. Para agregados, donde las columnas se comparan. */
export function tabla(
  cabeceras: string[],
  filas: (string | number | null | undefined)[][]
): string {
  const todas = [cabeceras, ...filas.map((f) => f.map((c) => (c === null || c === undefined ? '—' : String(c))))];
  const anchos = cabeceras.map((_, i) => Math.max(...todas.map((f) => String(f[i] ?? '').length)));
  const linea = (f: string[]) => f.map((c, i) => String(c).padEnd(anchos[i])).join('  ').trimEnd();
  return [
    linea(todas[0]),
    anchos.map((a) => '─'.repeat(a)).join('  '),
    ...todas.slice(1).map(linea),
  ].join('\n');
}

/**
 * Pie de las listas. Existe porque una respuesta corta se lee como "no hay
 * mas" cuando muchas veces es que el limite corto la lista, y porque una lista
 * que mezcla los dos metodos de ratio tiene que decirlo.
 */
export function pie(opciones: {
  devueltos: number;
  total: number;
  hay_mas?: boolean;
  mezclaMetodos?: boolean;
  sinEtiqueta?: number;
  nota?: string;
}): string {
  const partes = [`${opciones.devueltos} de ${opciones.total}`];
  if (opciones.hay_mas) partes.push('hay más (sube `limit` o usa `offset`)');
  if (opciones.sinEtiqueta) partes.push(`${opciones.sinEtiqueta} sin tema asignado`);
  if (opciones.mezclaMetodos) {
    partes.push('* = ratio híbrido (cuenta propia, cuenta el alcance) — no comparable con el resto en crudo');
  }
  if (opciones.nota) partes.push(opciones.nota);
  return `\n— ${partes.join(' · ')}`;
}
