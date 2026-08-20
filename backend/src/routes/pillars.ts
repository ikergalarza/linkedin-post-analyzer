/**
 * CATALOGO DE PILARES. El desplegable de la parrilla lee de aqui.
 *
 * POR QUE EXISTE (Iker, 2026-08-20)
 * ---------------------------------
 * El pilar lo detecta `services/pillar.ts` al ingerir el post y falla: un mapa
 * dibujado sin bloque de menciones, un lead magnet con el CTA nuevo, una
 * historia corta con foto. Hasta hoy cada fallo era un mensaje a Claude y un
 * commit tocando reglas — una semana de latencia para arreglar UNA etiqueta.
 *
 * ⚠️ UNA CATEGORIA CREADA AQUI NO SE AUTODETECTA NUNCA. El clasificador solo
 * sabe emitir los 8 pilares que tiene codificados; a cualquier categoria nueva
 * hay que arrastrarle los posts a mano, uno a uno, para siempre. Iker lo sabe y
 * lo acepto al pedirlo.
 */
import { Router, Request, Response } from 'express';
import pool from '../db';

const router = Router();

/**
 * La paleta. Son CLAVES, no clases de Tailwind, y esa es la parte importante:
 * Tailwind compila las clases que ve escritas en el codigo fuente, asi que una
 * clase que llega de la base de datos en tiempo de ejecucion no existe en el CSS
 * y el badge saldria transparente. El frontend traduce clave → clases con un
 * mapa literal (`PALETA_PILAR` en Accounts.tsx); las dos listas tienen que
 * llevar las mismas claves.
 */
export const COLORES = [
  'esmeralda', 'cielo', 'ambar', 'naranja', 'morado',
  'rosa', 'indigo', 'lima', 'cian', 'gris',
] as const;

/**
 * Slug a partir de lo que escribe el humano: minusculas, sin tildes, guion bajo.
 * El slug es lo que se guarda en `posts.pillar`, asi que una vez creado NO se
 * toca aunque se renombre la etiqueta — si cambiara, los posts ya guardados se
 * quedarian apuntando a un pilar que ya no existe.
 */
export function slugificar(label: string): string {
  return label
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40);
}

/** El primer color libre. Si estan todos usados, se reparten ciclicamente. */
function colorLibre(usados: string[]): string {
  const libre = COLORES.find((c) => c !== 'gris' && !usados.includes(c));
  return libre || COLORES[usados.length % COLORES.length];
}

/**
 * GET /api/pillars — el catalogo, con cuantos posts tiene cada pilar.
 *
 * El conteo viaja CON el catalogo a proposito: el dialogo de borrar necesita
 * decir "23 posts volveran a Otro" y sin esto haria una segunda llamada justo
 * en el peor momento, con el popover ya abierto.
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT pl.slug, pl.label, pl.color, pl.ayuda, pl.builtin, pl.sort_order,
              COALESCE(c.n, 0)::int AS posts_count
         FROM pillars pl
         LEFT JOIN (SELECT pillar, COUNT(*) AS n FROM posts GROUP BY pillar) c
                ON c.pillar = pl.slug
        ORDER BY pl.sort_order, pl.label`
    );
    res.json({ pillars: rows });
  } catch (err: any) {
    console.error('[pillars/list]', err);
    res.status(500).json({ error: err.message });
  }
});

/** POST /api/pillars {label} — crea una categoria. */
router.post('/', async (req: Request, res: Response) => {
  try {
    const label = String(req.body?.label || '').trim();
    if (label.length < 2 || label.length > 40) {
      return res.status(400).json({ error: 'El nombre tiene que medir entre 2 y 40 caracteres' });
    }
    const slug = slugificar(label);
    if (!slug) return res.status(400).json({ error: 'Ese nombre no deja ningun caracter utilizable' });

    const { rows: existentes } = await pool.query<{ slug: string; color: string }>(
      'SELECT slug, color FROM pillars'
    );
    if (existentes.some((p) => p.slug === slug)) {
      return res.status(409).json({ error: `Ya existe una categoria que se llama asi (${slug})` });
    }
    const { rows } = await pool.query(
      `INSERT INTO pillars (slug, label, color, ayuda, builtin, sort_order)
            VALUES ($1, $2, $3, $4, FALSE, 500)
         RETURNING slug, label, color, ayuda, builtin, sort_order, 0::int AS posts_count`,
      [slug, label, colorLibre(existentes.map((p) => p.color)), `Categoria creada a mano: ${label}`]
    );
    res.json({ ok: true, pillar: rows[0] });
  } catch (err: any) {
    console.error('[pillars/create]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/pillars/:slug {label} — renombra.
 *
 * Cambia SOLO la etiqueta visible. El slug se queda quieto, incluido el de los
 * builtin: es la clave con la que estan guardados los 47.828 posts.
 */
router.patch('/:slug', async (req: Request, res: Response) => {
  try {
    const label = String(req.body?.label || '').trim();
    if (label.length < 2 || label.length > 40) {
      return res.status(400).json({ error: 'El nombre tiene que medir entre 2 y 40 caracteres' });
    }
    const { rows } = await pool.query(
      `UPDATE pillars SET label = $2 WHERE slug = $1
        RETURNING slug, label, color, ayuda, builtin, sort_order`,
      [req.params.slug as string, label]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Esa categoria no existe' });
    res.json({ ok: true, pillar: rows[0] });
  } catch (err: any) {
    console.error('[pillars/rename]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/pillars/:slug — borra la categoria y devuelve sus posts a 'otro'.
 *
 * Los 8 builtin no se borran, y no es por prudencia: el clasificador los emite
 * POR NOMBRE, asi que borrar 'meme' solo consigue que el siguiente reproceso lo
 * reinvente — con la diferencia de que sus posts ya se han movido a 'otro' y los
 * marcados a mano se quedan ahi para siempre.
 */
router.delete('/:slug', async (req: Request, res: Response) => {
  const slug = req.params.slug as string;
  const client = await pool.connect();
  try {
    const { rows: cat } = await client.query<{ builtin: boolean }>(
      'SELECT builtin FROM pillars WHERE slug = $1', [slug]
    );
    if (cat.length === 0) return res.status(404).json({ error: 'Esa categoria no existe' });
    if (cat[0].builtin) {
      return res.status(409).json({
        error: 'Los pilares de serie no se pueden borrar: el clasificador los vuelve a crear solo. Renombralos si el nombre no te gusta.',
      });
    }
    await client.query('BEGIN');
    const { rowCount } = await client.query(
      `UPDATE posts SET pillar = 'otro' WHERE pillar = $1`, [slug]
    );
    await client.query('DELETE FROM pillars WHERE slug = $1', [slug]);
    await client.query('COMMIT');
    res.json({ ok: true, movidos: rowCount ?? 0 });
  } catch (err: any) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[pillars/delete]', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

export default router;
