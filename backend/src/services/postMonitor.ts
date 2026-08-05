import pool from '../db';
import { unipileService } from './unipile';
import { calculateEngagement } from './engagement';
import { recalcCreatorOutliers } from './outliers';
import { captureAccountSnapshots } from './accountSnapshots';
import { runFollowerSync } from './followerSync';
import { fetchPremiumAnalytics, savePremiumAnalytics } from './premiumAnalytics';

// Phase-based snapshot cadence for LinkedIn posts.
// The algorithm distributes posts in waves, so we sample densely in the golden hour
// (decisive for distribution) and taper off as the curve flattens. ~35 snapshots/post/week.
//
//   Phase           Window         Cadence   Snapshots   Why
//   golden          0 – 1h         15 min    ~4          Decides distribution
//   first_wave      1 – 6h         30 min    ~10         Slope still steep
//   consolidation   6 – 24h        2h        ~9          Bulk of reach accumulates
//   long_tail       24 – 72h       6h        ~8          85–90% of final data
//   tail            72h – 7d       24h       ~4          Trickle, freeze final metrics
//   closed          > 7d           —         0           Done
//
// The worker ticks every 15 min (golden-hour resolution) and lets each post decide
// whether enough time has passed since its last snapshot.

const TICK_MS = 15 * 60 * 1000;
const MONITOR_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
// Tolerance so scheduling jitter doesn't push a snapshot one full tick forward
const DUE_TOLERANCE_MS = 30 * 1000;

// In-flight guard + last-run timestamp so opportunistic ticks from HTTP requests
// don't pile up or double-fire alongside the background setInterval.
let tickInFlight = false;
let lastTickAt = 0;

function requiredIntervalMs(ageMs: number): number | null {
  if (ageMs < 1 * HOUR_MS) return 15 * 60 * 1000;
  if (ageMs < 6 * HOUR_MS) return 30 * 60 * 1000;
  if (ageMs < 24 * HOUR_MS) return 2 * HOUR_MS;
  if (ageMs < 72 * HOUR_MS) return 6 * HOUR_MS;
  if (ageMs < 7 * 24 * HOUR_MS) return 24 * HOUR_MS;
  return null;
}

// force=true ignores per-phase cadence (used by the manual Refresh button in the UI).
async function tick(force = false): Promise<{ captured: number; candidates: number }> {
  if (tickInFlight) return { captured: 0, candidates: 0 };
  tickInFlight = true;
  try {
    // All managed-account posts within the 7-day window; we'll filter per-post by
    // phase cadence in JS so each post only gets hit at its own required interval.
    const { rows: candidates } = await pool.query(
      `SELECT p.id, p.linkedin_post_id, p.published_at,
              c.id AS creator_id, c.linkedin_id, c.unipile_account_id,
              (SELECT MAX(s.captured_at) FROM post_snapshots s WHERE s.post_id = p.id) AS last_snapshot_at,
              -- La analitica Premium se pide de una en una, asi que va racionada
              -- (ver el bloque de analytics mas abajo). Se re-pide cada 6h en vez
              -- de una sola vez porque los clics al enlace SIGUEN SUBIENDO
              -- mientras el post vive: capturarlos una vez daria una foto de la
              -- primera hora, no el total.
              (p.premium_analytics_at IS NULL
               OR p.premium_analytics_at < NOW() - INTERVAL '6 hours') AS needs_analytics
       FROM posts p
       JOIN creators c ON c.id = p.creator_id
       WHERE c.is_managed = TRUE
         AND c.unipile_account_id IS NOT NULL
         AND p.published_at IS NOT NULL
         AND p.published_at > NOW() - INTERVAL '7 days'
         AND p.linkedin_post_id <> 'DEMO_LIVE_POST'`
    );

    const now = Date.now();
    const targets = candidates.filter((c) => {
      const age = now - new Date(c.published_at).getTime();
      const interval = requiredIntervalMs(age);
      if (interval === null) return false;
      if (force) return true;
      if (!c.last_snapshot_at) return true;
      const sinceLast = now - new Date(c.last_snapshot_at).getTime();
      return sinceLast >= interval - DUE_TOLERANCE_MS;
    });

    if (targets.length === 0) return { captured: 0, candidates: candidates.length };

    console.log(`[postMonitor] ${force ? 'forced ' : ''}ticking — ${targets.length}/${candidates.length} post(s) due for snapshot`);

    // Group by creator so we only hit Unipile once per account
    const byCreator = new Map<string, typeof targets>();
    for (const t of targets) {
      const list = byCreator.get(t.creator_id) || [];
      list.push(t);
      byCreator.set(t.creator_id, list);
    }

    const touchedCreators = new Set<string>();
    // Tope de llamadas de analitica por vuelta. Cada una es una peticion extra a
    // Unipile, y el rate limit de LinkedIn se paga en TODO el scraping, no solo aqui.
    const ANALYTICS_PER_TICK = 6;
    let analyticsFetched = 0;

    for (const [creatorId, posts] of byCreator.entries()) {
      const first = posts[0];
      if (!first.linkedin_id || !first.unipile_account_id) continue;

      try {
        // Fetch recent posts with the creator's own account so impressions come through
        const since = new Date(Date.now() - MONITOR_WINDOW_MS - 60 * 60 * 1000);
        const raws = await unipileService.getPosts(first.linkedin_id, since, first.unipile_account_id);

        const byLinkedInId = new Map<string, any>();
        for (const r of raws) {
          const id = r.social_id || r.id;
          if (id) byLinkedInId.set(String(id), r);
        }

        for (const target of posts) {
          const raw = target.linkedin_post_id ? byLinkedInId.get(String(target.linkedin_post_id)) : null;
          if (!raw) continue;

          const normalized = unipileService.normalizePost(raw, creatorId);
          const engagement = calculateEngagement(normalized);

          // Persist the snapshot
          await pool.query(
            `INSERT INTO post_snapshots (post_id, impressions_count, likes_count, comments_count, reposts_count)
             VALUES ($1, $2, $3, $4, $5)`,
            [target.id, normalized.impressions_count, normalized.likes_count, normalized.comments_count, normalized.reposts_count]
          );

          // ⭐ ANALITICA DE LINKEDIN PREMIUM: clics al enlace, guardados, envios,
          // visitas al perfil y seguidores ganados. Nada de esto viene en el feed.
          // Se lee del HTML de la pagina de analiticas (ver premiumAnalytics.ts).
          //
          // Es UNA peticion por post, asi que va acotado: como mucho
          // ANALYTICS_PER_TICK por vuelta. Unipile devuelve listas vacias cuando
          // LinkedIn le mete rate limit, y pasarse aqui nos deja sin scraping en
          // todo lo demas.
          if (analyticsFetched < ANALYTICS_PER_TICK && target.needs_analytics) {
            analyticsFetched++;
            try {
              const a = await fetchPremiumAnalytics(
                String(target.linkedin_post_id), first.unipile_account_id
              );
              if (a) await savePremiumAnalytics(pool, target.id, a);
            } catch (e: any) {
              // Que falle la analitica NO puede tumbar el snapshot, que es lo
              // importante de este tick.
              console.warn(`[postMonitor] analytics failed for ${target.id}:`, e?.message);
            }
          }

          // Only touch the live counters. outlier_ratio/is_outlier are recomputed
          // per-creator below once all posts are in so the multipliers don't drift to 0.
          await pool.query(
            `UPDATE posts SET
               likes_count = $2,
               comments_count = $3,
               reposts_count = $4,
               impressions_count = $5,
               engagement_score = $6,
               content_text = COALESCE($7, content_text)
             WHERE id = $1`,
            [target.id, normalized.likes_count, normalized.comments_count, normalized.reposts_count, normalized.impressions_count, engagement, normalized.content_text]
          );

          touchedCreators.add(creatorId);
        }
      } catch (err: any) {
        console.error(`[postMonitor] creator ${creatorId} failed:`, err?.message);
      }
    }

    // Recalculate outlier ratios for every creator whose posts got new numbers.
    // The average has shifted, so all their posts' multipliers need a refresh.
    // recalcCreatorOutliers picks the engagement-RATE method for managed
    // accounts (impressions are real there) and the absolute method elsewhere.
    for (const creatorId of touchedCreators) {
      try {
        await recalcCreatorOutliers(creatorId);
      } catch (err: any) {
        console.error(`[postMonitor] recalc outliers for ${creatorId} failed:`, err?.message);
      }
    }
    return { captured: targets.length, candidates: candidates.length };
  } catch (err: any) {
    console.error('[postMonitor] tick failed:', err?.message);
    return { captured: 0, candidates: 0 };
  } finally {
    tickInFlight = false;
    lastTickAt = Date.now();
  }
}

// Per-post refresh — captures a fresh snapshot for ONE specific post and
// updates its live counters. Mirrors the inner loop of tick() but scoped to
// a single post so the user can refresh just the post they're looking at
// without waiting on the bulk loop hitting every monitored creator.
//
// Returns the new captured numbers + a small status flag the API can echo
// back. Tolerant to the case where the post is no longer findable on
// LinkedIn (the original was deleted, or the creator's account_id changed)
// — returns ok:false rather than throwing.
// ⭐ EL REFRESH TAMBIEN REFRESCA EL TEXTO (Iker, 2026-08-05).
// Antes solo se tocaban las metricas, asi que si Iker editaba un post ya
// publicado —cosa que hace a menudo con las menciones, porque LinkedIn solo las
// resuelve al pegarlas a mano— la BD se quedaba con la version vieja para
// siempre. Ese dia me hizo dar por buenas cinco menciones que el ya habia
// corregido. COALESCE por si Unipile devuelve texto vacio: mejor conservar el
// que hay que machacarlo con NULL.
export async function capturePostSnapshot(postId: string): Promise<{
  ok: boolean;
  reason?: string;
  impressions?: number | null;
  likes?: number;
  comments?: number;
  reposts?: number;
  engagement?: number;
}> {
  const { rows } = await pool.query(
    `SELECT p.id, p.linkedin_post_id, p.creator_id,
            c.linkedin_id, c.unipile_account_id
       FROM posts p
       JOIN creators c ON c.id = p.creator_id
      WHERE p.id = $1
      LIMIT 1`,
    [postId]
  );
  const target = rows[0];
  if (!target) return { ok: false, reason: 'post not found' };
  if (!target.linkedin_id || !target.unipile_account_id) {
    return { ok: false, reason: 'creator missing linkedin_id or unipile_account_id' };
  }
  if (!target.linkedin_post_id) {
    return { ok: false, reason: 'post has no linkedin_post_id (cannot match against feed)' };
  }

  try {
    // Warm up the Unipile auth surface by hitting the profile endpoint first,
    // mirroring scrapeCreatorPosts. Without this, getPosts sometimes comes
    // back with impressions_counter: 0 for recent posts even when the bulk
    // refresh (which always fetches the profile first) gets real numbers.
    // Best-effort — don't fail the whole refresh if profile fetch errors,
    // just log and proceed with what we have.
    try {
      const { rows: creatorRows } = await pool.query(
        `SELECT linkedin_url FROM creators WHERE id = $1 LIMIT 1`,
        [target.creator_id]
      );
      if (creatorRows[0]?.linkedin_url) {
        await unipileService.getProfile(creatorRows[0].linkedin_url, target.unipile_account_id);
      }
    } catch (warmErr) {
      console.warn('[capturePostSnapshot] profile warm-up failed, continuing:', (warmErr as Error).message);
    }

    // Pull recent posts from this creator's account and find ours by id. Same
    // window the bulk monitor uses so a post older than MONITOR_WINDOW_MS
    // gracefully falls out of range.
    const since = new Date(Date.now() - MONITOR_WINDOW_MS - 60 * 60 * 1000);
    const raws = await unipileService.getPosts(target.linkedin_id, since, target.unipile_account_id);
    const raw = raws.find((r: any) => String(r.social_id || r.id) === String(target.linkedin_post_id));
    if (!raw) {
      // Desambiguar las DOS razones por las que un post puede no estar en el feed
      // (Iker, 2026-08-04). Antes se devolvian juntas y el usuario se quedaba con
      // un post fantasma en Live Posts que no habia forma de quitar.
      //
      //  a) El post es RECIENTE: deberia estar en el feed que acabamos de pedir,
      //     asi que si no esta es porque su autor lo BORRO. Se marca y desaparece
      //     de Live Posts. NO se borra la fila: sus metricas siguen valiendo para
      //     analisis historico (el meme de 196 impresiones de Asier es justo el
      //     dato con el que diagnosticamos la degradacion de imagen).
      //  b) El post es viejo y simplemente cayo fuera de MONITOR_WINDOW_MS. Ese
      //     no se toca: sigue vivo en LinkedIn.
      const { rows: pub } = await pool.query(
        `SELECT published_at FROM posts WHERE id = $1 LIMIT 1`,
        [target.id]
      );
      const publishedAt = pub[0]?.published_at ? new Date(pub[0].published_at).getTime() : null;
      const dentroDeVentana =
        publishedAt != null && Date.now() - publishedAt < MONITOR_WINDOW_MS;
      if (dentroDeVentana) {
        await pool.query(
          `UPDATE posts SET deleted_from_linkedin_at = NOW()
            WHERE id = $1 AND deleted_from_linkedin_at IS NULL`,
          [target.id]
        );
        console.log(`[capturePostSnapshot] ${target.id} no esta en el feed y es reciente: marcado como borrado en LinkedIn`);
        return { ok: false, reason: 'deleted from LinkedIn (removed from Live Posts)' };
      }
      return { ok: false, reason: 'post not in current feed (older than monitor window)' };
    }

    const normalized = unipileService.normalizePost(raw, target.creator_id);
    const engagement = calculateEngagement(normalized);

    // ⭐ ANALITICA PREMIUM. Aqui SI se pide siempre (a diferencia del tick, que va
    // acotado a 6): esto lo dispara el boton ↻ Refresh de UN post concreto, o sea
    // que lo ha pedido una persona y es una sola llamada. Es la unica forma de
    // forzar el dato sin esperar al monitor.
    // Va en su propio try: si falla, el snapshot —que es lo importante— sigue.
    try {
      const a = await fetchPremiumAnalytics(
        String(target.linkedin_post_id), target.unipile_account_id
      );
      if (a) await savePremiumAnalytics(pool, target.id, a);
    } catch (e: any) {
      console.warn('[capturePostSnapshot] analytics failed:', e?.message);
    }

    // Defensive: if Unipile returned impressions=0/null but the most recent
    // prior snapshot had a real value, that's almost certainly a transient
    // upstream glitch (rate limit, throttling, missing analytics access on
    // this specific call). Refuse the snapshot rather than poison the curve
    // with a fake zero, and surface the reason to the caller. Engagement is
    // computed from likes/comments/reposts which Unipile reports reliably,
    // so we still update the post's live counters from those.
    const newImp = typeof normalized.impressions_count === 'number' ? normalized.impressions_count : null;
    const looksLikeImpZero = newImp == null || newImp === 0;
    if (looksLikeImpZero) {
      const { rows: prior } = await pool.query(
        `SELECT impressions_count FROM post_snapshots
          WHERE post_id = $1 AND impressions_count IS NOT NULL AND impressions_count > 0
          ORDER BY captured_at DESC LIMIT 1`,
        [target.id]
      );
      if (prior.length > 0) {
        // Update live counters anyway (engagement is reliable) but skip the
        // snapshot insert so the impressions chart doesn't dip to 0.
        await pool.query(
          `UPDATE posts SET
             likes_count = $2,
             comments_count = $3,
             reposts_count = $4,
             engagement_score = $5,
             content_text = COALESCE($6, content_text)
           WHERE id = $1`,
          [target.id, normalized.likes_count, normalized.comments_count, normalized.reposts_count, engagement, normalized.content_text]
        );
        return {
          ok: false,
          reason: `Unipile returned 0 impressions but prior snapshot had ${prior[0].impressions_count} — skipped snapshot to avoid poisoning the curve. Engagement counters were still updated. Try again in a few seconds.`,
          likes: normalized.likes_count,
          comments: normalized.comments_count,
          reposts: normalized.reposts_count,
          engagement,
        };
      }
      // No prior real impressions value (post genuinely has none yet) —
      // proceed with the 0/null insert as before.
    }

    await pool.query(
      `INSERT INTO post_snapshots (post_id, impressions_count, likes_count, comments_count, reposts_count)
       VALUES ($1, $2, $3, $4, $5)`,
      [target.id, normalized.impressions_count, normalized.likes_count, normalized.comments_count, normalized.reposts_count]
    );

    await pool.query(
      `UPDATE posts SET
         likes_count = $2,
         comments_count = $3,
         reposts_count = $4,
         impressions_count = $5,
         engagement_score = $6,
         content_text = COALESCE($7, content_text)
       WHERE id = $1`,
      [target.id, normalized.likes_count, normalized.comments_count, normalized.reposts_count, normalized.impressions_count, engagement, normalized.content_text]
    );

    // Recompute outlier_ratio for the whole creator since the average shifted.
    // Method chosen by account type inside recalcCreatorOutliers.
    await recalcCreatorOutliers(target.creator_id);

    return {
      ok: true,
      impressions: normalized.impressions_count,
      likes: normalized.likes_count,
      comments: normalized.comments_count,
      reposts: normalized.reposts_count,
      engagement,
    };
  } catch (err: any) {
    console.error(`[postMonitor] capturePostSnapshot ${postId} failed:`, err?.message);
    return { ok: false, reason: err?.message || 'unknown error' };
  }
}

// Opportunistic tick triggered by HTTP requests (GET /live-posts polls every 2 min from the UI).
// Makes snapshot capture resilient to Railway recycling the Node process or setInterval drift:
// any time a user has the Accounts page open, ticks stay on cadence even if the background
// interval misses a firing. Fire-and-forget; never blocks the response.
export function maybeTick(): void {
  if (tickInFlight) return;
  if (Date.now() - lastTickAt < TICK_MS) return;
  tick().catch((err) => console.error('[postMonitor] opportunistic tick failed:', err?.message));
}

// One-shot: recompute outlier_ratio/is_outlier for every managed creator's posts.
// Heals historical rows that got zeroed out before the tick logic was fixed.
async function backfillOutliers() {
  try {
    const { rows: creators } = await pool.query(
      `SELECT id FROM creators WHERE is_managed = TRUE`
    );
    for (const { id: creatorId } of creators) {
      await recalcCreatorOutliers(creatorId);
    }
    console.log(`[postMonitor] outlier backfill complete for ${creators.length} managed creator(s)`);
  } catch (err: any) {
    console.error('[postMonitor] backfill failed:', err?.message);
  }
}

// Daily-ish snapshot of follower count + WVMP profile viewers for every
// managed creator. Runs unconditionally on the cadence below; the underlying
// upsert dedupes on (creator_id, captured_on), so re-running the same day
// just refreshes the values rather than producing duplicate rows.
//
// Without this, profile-view snapshots only landed when someone manually
// hit "Refresh" or POST /:id/scrape, which left the chart looking frozen
// for whole days at a time.
const ACCOUNT_SNAPSHOT_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours
let accountSnapshotInFlight = false;

async function accountSnapshotTick(): Promise<void> {
  if (accountSnapshotInFlight) return;
  accountSnapshotInFlight = true;
  try {
    const { rows: managed } = await pool.query(
      `SELECT id FROM creators WHERE is_managed = TRUE AND unipile_account_id IS NOT NULL`
    );
    if (managed.length === 0) return;
    console.log(`[accountSnapshot] refreshing follower + WVMP for ${managed.length} managed creator(s)`);
    for (const { id } of managed) {
      try {
        const r = await captureAccountSnapshots(id);
        console.log(
          `[accountSnapshot] ${id}: views=${r.views} (${r.pages} page(s), paging.total=${r.pagingTotal}), followers=${r.followers}`
        );
      } catch (err: any) {
        console.error(`[accountSnapshot] ${id} failed:`, err?.message);
      }
    }
  } catch (err: any) {
    console.error('[accountSnapshot] tick failed:', err?.message);
  } finally {
    accountSnapshotInFlight = false;
  }
}

export function startPostMonitor() {
  console.log(`[postMonitor] starting — tick every ${TICK_MS / 60000} min, window ${MONITOR_WINDOW_MS / 3600000}h, phase-based cadence`);
  // One-shot heal for any posts whose outlier_ratio got zeroed by the pre-fix monitor
  setTimeout(backfillOutliers, 10 * 1000);
  // First run after 1 minute so the server has time to settle post-deploy
  setTimeout(tick, 60 * 1000);
  setInterval(tick, TICK_MS);

  // First account snapshot ~2 min after boot (gives the post tick room),
  // then every 6h so iekr / unai / any other managed account get fresh
  // follower + WVMP numbers without anyone clicking Refresh.
  setTimeout(accountSnapshotTick, 2 * 60 * 1000);
  setInterval(accountSnapshotTick, ACCOUNT_SNAPSHOT_INTERVAL_MS);

  // Organic-follower sync: first run 5 min after boot (the baseline is the
  // heavy one and we want the server fully settled), then daily. runFollowerSync
  // guards against overlap and only baselines once per creator; later runs are
  // cheap incremental diffs.
  setTimeout(() => {
    runFollowerSync(null).catch((e) => console.error('[followerSync] boot run failed:', e?.message));
  }, 5 * 60 * 1000);
  setInterval(() => {
    runFollowerSync(null).catch((e) => console.error('[followerSync] daily run failed:', e?.message));
  }, 24 * 60 * 60 * 1000);
}
