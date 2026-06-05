import dotenv from 'dotenv';
dotenv.config();

import { estimateTimezone } from '../utils/timezone';

interface UnipileProfile {
  id?: string;
  provider_id?: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  headline?: string;
  followers_count?: number;
  connections_count?: number;
  profile_picture_url?: string;
  public_identifier?: string;
  network_info?: {
    followers_count?: number;
    follower_count?: number;
    connections_count?: number;
    connection_count?: number;
  };
  [key: string]: any;
}

interface UnipilePost {
  id?: string;
  social_id?: string;
  text?: string;
  content?: string;
  body?: string;
  created_at?: string;
  published_at?: string;
  parsed_datetime?: string;
  date?: string;
  // Unipile uses *_counter fields
  reaction_counter?: number;
  comment_counter?: number;
  repost_counter?: number;
  impressions_counter?: number;
  // Also support alternative field names
  likes_count?: number;
  reactions_count?: number;
  comments_count?: number;
  reposts_count?: number;
  shares_count?: number;
  impressions?: number;
  views_count?: number;
  attachments?: { id?: string; type?: string; url?: string; size?: string }[];
  media?: any[];
  images?: any[];
  documents?: any[];
  video?: any;
  poll?: any;
  article?: any;
  author?: { public_identifier?: string; name?: string; is_company?: boolean };
  url?: string;
  post_url?: string;
  [key: string]: any;
}

interface UnipileListResponse {
  items?: UnipilePost[];
  object?: string;
  cursor?: string;
  has_more?: boolean;
  paging?: { cursor?: string };
}

// A LinkedIn comment as Unipile surfaces it. Field names vary mildly across
// versions, so the union types accommodate the variants we've seen in the
// wild. parent_comment_id (or comment_id) signals a reply rather than a
// top-level comment; the routes layer uses this to group the thread.
export interface UnipileComment {
  id?: string;
  social_id?: string;
  text?: string;
  date?: string;
  created_at?: string;
  parsed_datetime?: string;
  parent_comment_id?: string | null;
  comment_id?: string | null; // some payloads name the parent this way
  is_reply?: boolean;
  reaction_counter?: number;
  reply_counter?: number;
  author?: {
    id?: string;
    public_identifier?: string;
    name?: string;
    headline?: string;
    profile_picture_url?: string;
    is_company?: boolean;
  };
  [key: string]: any;
}

interface UnipileCommentListResponse {
  items?: UnipileComment[];
  cursor?: string;
  paging?: { cursor?: string };
}

export class UnipileService {
  private apiKey: string;
  private baseUrl: string;
  private accountId: string;

  constructor() {
    this.apiKey = process.env.UNIPILE_API_KEY || '';
    this.baseUrl = process.env.UNIPILE_BASE_URL || 'https://api18.unipile.com:14891';
    this.accountId = process.env.UNIPILE_ACCOUNT_ID || '';

    if (!this.apiKey) {
      console.warn('UNIPILE_API_KEY not set — Unipile calls will fail');
    }
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    console.log(`[Unipile] ${options.method || 'GET'} ${url}`);

    // Transient errors (429 rate-limit, 502/503/504 gateway) are retried
    // with backoff instead of bubbling straight up as a 500 to the
    // Dashboard. This is the main source of the 500s during refresh-all:
    // concurrent scrapes briefly trip Unipile's rate limit. Respect
    // Retry-After when present, otherwise exponential (0.8s, 2s, 4s).
    const RETRYABLE = new Set([429, 502, 503, 504]);
    const MAX_ATTEMPTS = 4;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const res = await fetch(url, {
        ...options,
        headers: {
          'X-API-KEY': this.apiKey,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (res.ok) {
        return (await res.json()) as T;
      }

      const body = await res.text().catch(() => '');
      if (RETRYABLE.has(res.status) && attempt < MAX_ATTEMPTS) {
        const retryAfter = Number(res.headers.get('retry-after'));
        const waitMs = Number.isFinite(retryAfter) && retryAfter > 0
          ? retryAfter * 1000
          : Math.min(4000, 800 * Math.pow(2, attempt - 1));
        console.warn(`[Unipile] ${res.status} (attempt ${attempt}/${MAX_ATTEMPTS}) — retrying in ${waitMs}ms`);
        await new Promise((r) => setTimeout(r, waitMs));
        continue;
      }

      console.error(`[Unipile] Error ${res.status}: ${body}`);
      throw new Error(`Unipile API error ${res.status}: ${body}`);
    }
    // Unreachable (loop either returns or throws), but satisfies the type.
    throw new Error('Unipile API: exhausted retries');
  }

  extractLinkedInIdentifier(linkedinUrl: string): string {
    // Extract username from URLs like https://www.linkedin.com/in/john-doe/
    const match = linkedinUrl.match(/linkedin\.com\/in\/([^/?]+)/);
    if (match) return match[1].replace(/\/$/, '');

    // Extract company from URLs like https://www.linkedin.com/company/acme/
    const companyMatch = linkedinUrl.match(/linkedin\.com\/company\/([^/?]+)/);
    if (companyMatch) return companyMatch[1].replace(/\/$/, '');

    return linkedinUrl;
  }

  /**
   * Step 1: Get profile using the public LinkedIn username.
   * This returns the provider_id (internal ID starting with ACo/ADo)
   * which is needed to fetch posts.
   */
  async getProfile(linkedinUrl: string, accountIdOverride?: string): Promise<UnipileProfile> {
    const publicIdentifier = this.extractLinkedInIdentifier(linkedinUrl);
    const accountId = accountIdOverride || this.accountId;
    console.log(`[Unipile] Fetching profile for: ${publicIdentifier} (account_id: ${accountId})`);

    const profile = await this.request<UnipileProfile>(
      `/api/v1/users/${encodeURIComponent(publicIdentifier)}?account_id=${accountId}`
    );

    console.log(`[Unipile] Profile fetched. provider_id: ${profile.provider_id}, id: ${profile.id}, name: ${profile.name || profile.first_name}`);
    return profile;
  }

  /**
   * Fetch the "Who Viewed My Profile" feed for a managed account.
   *
   * Unipile doesn't ship a typed wrapper for this — we go through their
   * raw-data passthrough (POST /api/v1/linkedin) which forwards an
   * arbitrary LinkedIn Voyager request. The Voyager surface here is
   * `surfaceType:WVMP` against `voyagerPremiumDashAnalyticsObject`.
   *
   * Caveats:
   * - Requires LinkedIn **Premium / Sales Navigator** on the connected
   *   account. Free accounts get a teaser (5 viewers) and the count
   *   never moves.
   * - The `queryId` hash at the end of the URL is owned by LinkedIn and
   *   can rotate. If WVMP starts returning empty results for accounts
   *   that previously worked, refresh the hash by inspecting a real
   *   request in the LinkedIn web UI (Network tab → premiumDashAnalyticsObject).
   *
   * Returns `null` (instead of throwing) when the call fails or the
   * account doesn't have access — the snapshot routine treats that as
   * "skip this creator today" instead of bailing out the whole scrape.
   */
  async getProfileViewers(
    accountIdOverride?: string
  ): Promise<{ count: number; raw: any; pages: number; pagingTotal: number | null } | null> {
    const accountId = accountIdOverride || this.accountId;
    if (!accountId) {
      console.warn('[Unipile WVMP] No account_id available, skipping');
      return null;
    }

    // LinkedIn Voyager paginates WVMP. Without an explicit count it returns a
    // small default page (~10–22 elements) and the same first slice every day,
    // which makes the daily snapshot look frozen. We page through with count:50
    // until LinkedIn stops returning elements (or we hit the safety cap), then
    // merge everything into one response so the backfill can read every viewer.
    const PAGE_SIZE = 50;
    const MAX_PAGES = 20; // 1000 viewers ceiling — Premium WVMP rarely shows more
    const queryId =
      'voyagerPremiumDashAnalyticsObject.c31102e906e7098910f44e0cecaa5b5c';

    const buildUrl = (start: number) =>
      'https://www.linkedin.com/voyager/api/graphql' +
      `?variables=(start:${start},count:${PAGE_SIZE},query:(),analyticsEntityUrn:(activityUrn:urn%3Ali%3Adummy%3A-1),surfaceType:WVMP)` +
      `&queryId=${queryId}`;

    // Defensive — LinkedIn occasionally rotates response shape. Same paths
    // as before, just centralised so the loop and the merge step agree.
    const extractRoot = (data: any) =>
      data?.data?.data?.premiumDashAnalyticsObjectByAnalyticsEntity ??
      data?.data?.premiumDashAnalyticsObjectByAnalyticsEntity ??
      data?.premiumDashAnalyticsObjectByAnalyticsEntity ??
      null;

    const allElements: any[] = [];
    let firstPageRaw: any = null;
    let pagingTotal: number | null = null;
    let pages = 0;

    try {
      for (let page = 0; page < MAX_PAGES; page++) {
        const start = page * PAGE_SIZE;
        const res = await fetch(`${this.baseUrl}/api/v1/linkedin`, {
          method: 'POST',
          headers: {
            'X-API-KEY': this.apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            account_id: accountId,
            method: 'GET',
            request_url: buildUrl(start),
            encoding: false,
          }),
        });
        if (!res.ok) {
          const body = await res.text().catch(() => '');
          console.warn(
            `[Unipile WVMP] ${res.status} for account ${accountId} page ${page}: ${body.slice(0, 200)}`
          );
          // If we already have at least one page, return what we have rather
          // than discarding everything because page N failed.
          if (page === 0) return null;
          break;
        }
        const data: any = await res.json();
        if (page === 0) firstPageRaw = data;

        const root = extractRoot(data);
        const elements: any[] = Array.isArray(root?.elements) ? root.elements : [];
        // Voyager surfaces the total as paging.total when available — useful
        // sanity check against the elements we accumulate.
        const tot = root?.paging?.total;
        if (typeof tot === 'number' && Number.isFinite(tot)) pagingTotal = tot;

        if (elements.length === 0) {
          pages = page; // last completed page index
          break;
        }
        allElements.push(...elements);
        pages = page + 1;
        if (elements.length < PAGE_SIZE) break; // partial page → end of list
      }

      // Build a single "merged" raw payload that mirrors the first-page shape
      // but carries every element we accumulated, so downstream consumers
      // (backfill / debug endpoint) can read all viewer timestamps from one
      // object. We splice the merged elements into whichever path exists.
      let mergedRaw: any = firstPageRaw;
      if (firstPageRaw) {
        const cloned = JSON.parse(JSON.stringify(firstPageRaw));
        if (cloned?.data?.data?.premiumDashAnalyticsObjectByAnalyticsEntity) {
          cloned.data.data.premiumDashAnalyticsObjectByAnalyticsEntity.elements = allElements;
        } else if (cloned?.data?.premiumDashAnalyticsObjectByAnalyticsEntity) {
          cloned.data.premiumDashAnalyticsObjectByAnalyticsEntity.elements = allElements;
        } else if (cloned?.premiumDashAnalyticsObjectByAnalyticsEntity) {
          cloned.premiumDashAnalyticsObjectByAnalyticsEntity.elements = allElements;
        }
        mergedRaw = cloned;
      }

      const count = allElements.length;
      console.log(
        `[Unipile WVMP] account ${accountId}: ${count} viewers across ${pages} page(s)` +
          (pagingTotal != null ? ` (paging.total=${pagingTotal})` : '')
      );
      return { count, raw: mergedRaw, pages, pagingTotal };
    } catch (err: any) {
      console.warn(`[Unipile WVMP] Fetch failed for account ${accountId}: ${err.message}`);
      return null;
    }
  }

  /**
   * Step 2: Get posts using the provider_id (internal ID) from getProfile.
   * The identifier for posts MUST be the provider internal ID, not the public username.
   */
  async getPosts(
    providerInternalId: string,
    since?: Date,
    accountIdOverride?: string,
    // INCREMENTAL: ids (social_id/id) already stored for this creator.
    // LinkedIn returns posts newest-first, so as soon as we hit one we
    // already have, everything older is already stored — stop paging.
    // Pass undefined / empty for a full scrape (first time for a creator).
    knownIds?: Set<string>
  ): Promise<UnipilePost[]> {
    const allPosts: UnipilePost[] = [];
    let cursor: string | undefined;
    // `since` is a HARD time floor for callers that intentionally want a
    // bounded window (Discover/monitor/network). When NO `since` is given
    // (managed-account + Dashboard creator scrapes) we pull the FULL
    // history — LinkedIn serves a profile's activity well past 6 months
    // and the old 180-day early-return was a self-imposed cap, not a
    // LinkedIn limit. Only the page safety cap bounds the no-floor path.
    const floor: Date | null = since ?? null;
    const accountId = accountIdOverride || this.accountId;

    let page = 0;
    // 20 pages = 1000 posts. Capped here (was 40) so a single first-time
    // full-history request stays under Railway's gateway timeout — that
    // was the source of the 502s. Incremental refreshes only fetch new
    // posts so they never approach this anyway, and 1000 is already ~2x
    // the old 6-month window for the vast majority of creators.
    const maxPages = 20;

    console.log(`[Unipile] Fetching posts for identifier: ${providerInternalId} (account_id: ${accountId})`);

    do {
      const params = new URLSearchParams({
        account_id: accountId,
        limit: '50',
      });
      if (cursor) params.set('cursor', cursor);

      const response = await this.request<UnipileListResponse>(
        `/api/v1/users/${encodeURIComponent(providerInternalId)}/posts?${params.toString()}`
      );

      const posts = response.items || [];
      console.log(`[Unipile] Page ${page + 1}: ${posts.length} posts fetched`);

      if (posts.length === 0) break;

      // Log first post structure for debugging
      if (page === 0 && posts.length > 0) {
        console.log(`[Unipile] Sample post keys: ${Object.keys(posts[0]).join(', ')}`);
      }

      const incremental = !!knownIds && knownIds.size > 0;
      for (const post of posts) {
        const publishedAt = post.parsed_datetime || post.created_at || post.published_at || post.date;
        if (floor && publishedAt && new Date(publishedAt) < floor) {
          console.log(`[Unipile] Reached posts older than the requested window, stopping. Total: ${allPosts.length}`);
          return allPosts;
        }
        if (incremental) {
          const pid = post.social_id || post.id;
          if (pid && knownIds!.has(pid)) {
            console.log(`[Unipile] Reached already-stored post (incremental), stopping. New: ${allPosts.length}`);
            return allPosts;
          }
        }
        allPosts.push(post);
      }

      cursor = response.cursor || response.paging?.cursor;
      page++;

      // Polite pacing between pages. 250ms (was 500): over a 20-page
      // first scrape this halves the wall-time (~5s vs ~10s of pure
      // sleep), keeping the request under the gateway timeout. The
      // request() retry/backoff absorbs any 429 if we pace too fast.
      if (cursor) {
        await new Promise((r) => setTimeout(r, 250));
      }
    } while (cursor && page < maxPages);

    console.log(`[Unipile] Total posts fetched: ${allPosts.length}`);
    return allPosts;
  }

  normalizeProfile(raw: UnipileProfile, linkedinUrl: string) {
    const followersCount = raw.followers_count
      || raw.network_info?.followers_count
      || raw.follower_count
      || raw.network_info?.follower_count
      || 0;
    const connectionsCount = raw.connections_count
      || raw.network_info?.connections_count
      || raw.connection_count
      || raw.network_info?.connection_count
      || 0;

    // Extract location from various possible fields
    // Unipile may use different field names depending on API version
    const locationCandidates = [
      raw.location,
      raw.location_name,
      raw.geo_location_name,
      raw.geo_location?.name,
      raw.geo_location?.full,
      typeof raw.geo_location === 'string' ? raw.geo_location : null,
      raw.geo_country_name,
      raw.address,
      raw.city,
      raw.region,
      raw.country,
      raw.country_name,
      raw.country_code,
    ];
    const location = locationCandidates.find((v) => v && typeof v === 'string' && v.trim().length > 0) || null;

    // Debug: log all location-related fields found in raw profile
    const locationKeys = Object.keys(raw).filter((k) =>
      /location|geo|city|region|country|address|area|place|state|province/i.test(k)
    );
    console.log(`[Unipile] Profile normalize: followers=${followersCount}, connections=${connectionsCount}, location="${location}", location_related_keys=[${locationKeys.join(',')}], location_values={${locationKeys.map(k => `${k}=${JSON.stringify(raw[k])}`).join(', ')}}`);
    console.log(`[Unipile] All raw profile keys: ${Object.keys(raw).join(', ')}`);

    // Estimate timezone from location
    const tz = estimateTimezone(location);
    if (tz) {
      console.log(`[Unipile] Timezone estimated: ${tz.timezone} (UTC${tz.utc_offset >= 0 ? '+' : ''}${tz.utc_offset}) from "${location}"`);
    }

    return {
      linkedin_url: linkedinUrl,
      // provider_id is the internal ID needed for fetching posts
      linkedin_id: raw.provider_id || raw.id || raw.public_identifier || null,
      name: raw.name || [raw.first_name, raw.last_name].filter(Boolean).join(' ') || null,
      headline: raw.headline || null,
      followers_count: followersCount,
      connections_count: connectionsCount,
      profile_image_url: raw.profile_picture_url || null,
      location: location,
      timezone: tz?.timezone || null,
      utc_offset: tz?.utc_offset ?? null,
    };
  }

  normalizePost(raw: UnipilePost, creatorId: string) {
    const text = raw.text || raw.content || raw.body || '';
    const contentType = this.detectContentType(raw);
    const publishedAt = raw.parsed_datetime || raw.created_at || raw.published_at || raw.date || null;

    // Unipile uses *_counter fields (reaction_counter, comment_counter, etc.)
    const likes = raw.reaction_counter ?? raw.likes_count ?? raw.reactions_count ?? 0;
    const comments = raw.comment_counter ?? raw.comments_count ?? 0;
    const reposts = raw.repost_counter ?? raw.reposts_count ?? raw.shares_count ?? 0;
    const impressions = raw.impressions_counter ?? raw.impressions ?? raw.views_count ?? null;

    return {
      creator_id: creatorId,
      linkedin_post_id: raw.social_id || raw.id || null,
      content_text: text,
      content_type: contentType,
      published_at: publishedAt ? new Date(publishedAt) : null,
      likes_count: likes,
      comments_count: comments,
      reposts_count: reposts,
      impressions_count: impressions,
      post_url: raw.url || raw.post_url || this.buildPostUrl(raw) || null,
      raw_data: raw,
    };
  }

  private buildPostUrl(raw: UnipilePost): string | null {
    const postId = raw.social_id || raw.id;
    if (!postId) return null;
    // LinkedIn activity/update URLs
    return `https://www.linkedin.com/feed/update/${postId}/`;
  }

  extractMediaUrls(raw: any): string[] {
    const urls = new Set<string>();
    if (!raw || typeof raw !== 'object') return [];

    const TEXT_KEYS = new Set(['text', 'content', 'body', 'description', 'caption', 'hook_text', 'content_text']);
    const MEDIA_KEYS = new Set([
      'attachments', 'attachment', 'media', 'medias', 'images', 'image',
      'image_url', 'image_urls', 'img', 'img_url', 'imgs',
      'photo', 'photos', 'picture', 'pictures',
      'thumbnail', 'thumbnail_url', 'thumbnails',
      'video', 'videos', 'video_url',
    ]);
    const MEDIA_EXT_RE = /\.(jpe?g|png|webp|gif|mp4|webm|mov)(\?|#|$)/i;

    const walk = (node: any, underMedia: boolean) => {
      if (!node) return;
      if (typeof node === 'string') {
        if (underMedia && MEDIA_EXT_RE.test(node)) urls.add(node);
        return;
      }
      if (Array.isArray(node)) { for (const el of node) walk(el, underMedia); return; }
      if (typeof node !== 'object') return;
      for (const urlKey of ['url', 'download_url', 'image_url', 'thumbnail_url', 'video_url', 'source_url', 'src']) {
        const v = node[urlKey];
        if (typeof v === 'string' && underMedia && MEDIA_EXT_RE.test(v)) urls.add(v);
      }
      for (const [k, v] of Object.entries(node)) {
        if (TEXT_KEYS.has(k)) continue;
        walk(v, underMedia || MEDIA_KEYS.has(k));
      }
    };

    walk(raw, false);
    return [...urls];
  }

  detectPostContentType(raw: UnipilePost): string {
    return this.detectContentType(raw);
  }

  private detectContentType(raw: UnipilePost): string {
    if (raw.poll) return 'poll';
    if (raw.article) return 'article';

    const hasText = ((raw.text || raw.content || raw.body || '') as string).trim().length > 0;
    const signals = this.scanMediaSignals(raw);
    if (signals.video) return hasText ? 'text_video' : 'video';
    if (signals.document) return hasText ? 'text_document' : 'document';
    if (signals.carousel) return hasText ? 'text_carousel' : 'carousel';
    if (signals.image) return hasText ? 'text_image' : 'image';

    return 'text';
  }

  // Same deep-scan logic as reclassify endpoint — kept here so live scraping and
  // reclassification stay in sync. Ignores post text fields to avoid false positives.
  private scanMediaSignals(raw: any): { image: boolean; carousel: boolean; video: boolean; document: boolean } {
    return scanMediaSignalsImpl(raw);
  }

  // Fetch every comment thread on a post.
  // - Without opts.parentCommentId → top-level comments (Unipile's default).
  // - With opts.parentCommentId    → the replies under that specific comment.
  // The same endpoint serves both; we just pass `comment_id=<parent>` to
  // scope it to a thread. Replies aren't included in the top-level call —
  // each comment with reply_counter > 0 needs its own follow-up fetch
  // (the route layer parallelises them with Promise.all).
  async getPostComments(
    postSocialId: string,
    accountIdOverride?: string,
    opts: { parentCommentId?: string } = {}
  ): Promise<UnipileComment[]> {
    const accountId = accountIdOverride || this.accountId;
    if (!accountId) {
      console.warn('[Unipile comments] No account_id available, skipping');
      return [];
    }
    const all: UnipileComment[] = [];
    let cursor: string | undefined;
    const MAX_PAGES = 10; // 10 × 50 = 500 comments ceiling
    for (let page = 0; page < MAX_PAGES; page++) {
      const params = new URLSearchParams({ account_id: accountId, limit: '50' });
      if (cursor) params.set('cursor', cursor);
      if (opts.parentCommentId) params.set('comment_id', opts.parentCommentId);
      const res = await this.request<UnipileCommentListResponse>(
        `/api/v1/posts/${encodeURIComponent(postSocialId)}/comments?${params.toString()}`
      );
      const items = res.items || [];
      if (items.length === 0) break;
      all.push(...items);
      cursor = res.cursor || res.paging?.cursor;
      if (!cursor) break;
    }
    return all;
  }

  // Post a reply under an existing comment. Unipile's API takes the parent
  // comment_id as part of the body — same endpoint as posting a top-level
  // comment, just with the extra field. Mentions use a templated syntax:
  // text contains {{0}}, {{1}}, … placeholders that line up with entries
  // in the mentions array (each {name, profile_id}). Without mentions the
  // body is a plain {account_id, comment_id, text}.
  async replyToComment(
    postSocialId: string,
    parentCommentId: string,
    text: string,
    mentions: { name: string; profile_id: string }[] | undefined,
    accountIdOverride?: string
  ): Promise<UnipileComment> {
    const accountId = accountIdOverride || this.accountId;
    if (!accountId) throw new Error('No Unipile account_id available for reply');
    const body: Record<string, unknown> = {
      account_id: accountId,
      text,
      comment_id: parentCommentId,
    };
    if (mentions && mentions.length > 0) body.mentions = mentions;
    return this.request<UnipileComment>(
      `/api/v1/posts/${encodeURIComponent(postSocialId)}/comments`,
      {
        method: 'POST',
        body: JSON.stringify(body),
      }
    );
  }

  // Fetch the per-reaction-type breakdown for a post (LIKE / FUNNY /
  // CELEBRATE / INSIGHTFUL / SUPPORT / EMPATHY / INTEREST). Walks the
  // /reactions endpoint until pagination ends or we hit maxPages.
  //
  // We aggregate into a compact count map — the caller doesn't need each
  // individual reaction, only "how many of each type". Used by the meme
  // detector: a post with funny_pct > 0.25 is virtually always a meme,
  // and computing that needs only the totals.
  async getPostReactions(
    postSocialId: string,
    accountIdOverride?: string,
    opts: { maxPages?: number; pageSize?: number } = {}
  ): Promise<{ counts: Record<string, number>; sampled: number; pages: number }> {
    const accountId = accountIdOverride || this.accountId;
    if (!accountId) throw new Error('No Unipile account_id available for reactions fetch');
    const pageSize = opts.pageSize ?? 100;
    const maxPages = opts.maxPages ?? 20; // 20 × 100 = 2000 reactions cap

    const counts: Record<string, number> = {};
    let sampled = 0;
    let cursor: string | undefined;
    let pages = 0;

    for (let page = 0; page < maxPages; page++) {
      const params = new URLSearchParams({ account_id: accountId, limit: String(pageSize) });
      if (cursor) params.set('cursor', cursor);
      const res = await this.request<{ items?: any[]; cursor?: string; paging?: { cursor?: string } }>(
        `/api/v1/posts/${encodeURIComponent(postSocialId)}/reactions?${params.toString()}`
      );
      const items = res.items || [];
      if (items.length === 0) break;
      for (const r of items) {
        // Unipile's PostReaction carries the type in `value` (confirmed live:
        // LIKE / ENTERTAINMENT / PRAISE / EMPATHY / APPRECIATION / INTEREST /
        // MAYBE). The older type/reaction/reaction_type fallbacks never
        // matched — that's why the first backfill stored everything as UNKNOWN.
        const type = String(
          r.value || r.type || r.reaction || r.reaction_type || 'UNKNOWN'
        ).toUpperCase();
        counts[type] = (counts[type] || 0) + 1;
      }
      sampled += items.length;
      pages = page + 1;
      cursor = res.cursor || res.paging?.cursor;
      if (!cursor || items.length < pageSize) break;
    }

    return { counts, sampled, pages };
  }

  // PROBE — returns the raw first few reaction items for one post so we can
  // see the actual field name carrying the reaction type. The aggregator
  // above stored everything as UNKNOWN, which means none of type/reaction/
  // reaction_type held the value — this shows what does.
  async probePostReactionsRaw(
    postSocialId: string,
    accountIdOverride?: string
  ): Promise<{ count: number; sample: any[]; raw_keys: string[] }> {
    const accountId = accountIdOverride || this.accountId;
    if (!accountId) throw new Error('No Unipile account_id available for reactions probe');
    const res = await this.request<{ items?: any[]; [k: string]: any }>(
      `/api/v1/posts/${encodeURIComponent(postSocialId)}/reactions?account_id=${encodeURIComponent(accountId)}&limit=5`
    );
    const items = Array.isArray(res?.items) ? res.items : [];
    return {
      count: items.length,
      sample: items.slice(0, 5),
      raw_keys: items[0] ? Object.keys(items[0]) : [],
    };
  }

  // PROBE — tries several candidate URLs for "list followers" because
  // Unipile's exact path/shape isn't documented in our integration yet.
  // Returns, for each candidate, whether it 200'd and a small sample of
  // items so the debug endpoint can show us the real shape + ordering.
  // This is throwaway scaffolding for Phase 0; once we know the working
  // path we replace it with a clean getFollowers().
  async probeFollowers(
    accountIdOverride: string | undefined,
    providerId: string | null,
    pageSize = 10
  ): Promise<{
    working_path: string | null;
    candidates: { path: string; ok: boolean; count: number; error?: string; sample?: any[]; raw_keys?: string[] }[];
  }> {
    const accountId = accountIdOverride || this.accountId;
    if (!accountId) throw new Error('No Unipile account_id available for followers probe');

    const q = `account_id=${encodeURIComponent(accountId)}&limit=${pageSize}`;
    const candidatePaths = [
      `/api/v1/users/followers?${q}`,
      `/api/v1/users/relations?${q}`,
      providerId ? `/api/v1/users/${encodeURIComponent(providerId)}/followers?${q}` : null,
      providerId ? `/api/v1/users/${encodeURIComponent(providerId)}/relations?${q}` : null,
      `/api/v1/users/me/followers?${q}`,
    ].filter(Boolean) as string[];

    const candidates: { path: string; ok: boolean; count: number; error?: string; sample?: any[]; raw_keys?: string[] }[] = [];
    let working: string | null = null;

    for (const path of candidatePaths) {
      try {
        const res = await this.request<{ items?: any[]; [k: string]: any }>(path);
        const items = Array.isArray(res?.items) ? res.items : [];
        candidates.push({
          path,
          ok: true,
          count: items.length,
          raw_keys: Object.keys(res || {}),
          sample: items.slice(0, 3),
        });
        if (!working && items.length > 0) working = path;
      } catch (err: any) {
        candidates.push({ path, ok: false, count: 0, error: String(err?.message || '').slice(0, 200) });
      }
    }

    return { working_path: working, candidates };
  }
}

// Shared between live detection and reclassify. LinkedIn CDN URLs lack file
// extensions, so we detect them by host + path instead of suffix.
export function scanMediaSignalsImpl(raw: any): { image: boolean; carousel: boolean; video: boolean; document: boolean } {
  const out = { image: false, carousel: false, video: false, document: false };
  if (!raw || typeof raw !== 'object') return out;

  const TEXT_KEYS = new Set(['text', 'content', 'body', 'description', 'caption', 'hook_text', 'content_text', 'title', 'subtitle', 'share_url', 'shareUrl']);
  // Author/profile branches carry the creator's own profile photo — NOT post media.
  // Skipping them prevents profile pictures from being misread as post images.
  const AUTHOR_KEYS = new Set([
    'author', 'creator', 'owner', 'user', 'by', 'posted_by', 'post_author',
    'actor', 'poster', 'sender', 'profile', 'author_profile',
  ]);
  // Key name heuristic — match keys that START with a media-ish stem (at word
  // start or after underscore). We deliberately don't anchor the end so that
  // plurals and longer forms like 'attachments', 'thumbnails', 'image_urls' all
  // qualify — the previous version anchored `(?:$|_)` and missed `attachments`,
  // which caused 3-photo carousels to be detected as single-image posts.
  const MEDIA_KEY_RE = /(?:^|_)(attach|media|image|img|photo|picture|thumb|video|document|doc|file|asset|gallery|carousel|visual|preview|cover)/i;
  const IMAGE_EXT_RE = /\.(jpe?g|png|webp|gif|heic|avif|bmp)(\?|#|$)/i;
  const VIDEO_EXT_RE = /\.(mp4|webm|mov|m4v|mkv|avi)(\?|#|$)/i;
  const DOC_EXT_RE = /\.(pdf|pptx?|docx?|xlsx?|csv)(\?|#|$)/i;

  // LinkedIn CDN signatures — authoritative regardless of tree position.
  const LICDN_HOST_RE = /(?:media|dms|static)\.licdn\.com/i;
  // Feed photo attachments live under /image/ or /dms/image/ paths
  // Document slides live under /document/ or /dms/document/ paths
  // Videos live under /dms/playlist/ (HLS manifest) or /vid/ or contain 'video/'
  const LICDN_VIDEO_PATH_RE = /\/(?:playlist|vid|video)\//i;
  const LICDN_DOC_PATH_RE = /\/(?:document|documents)\//i;
  const LICDN_IMAGE_PATH_RE = /\/(?:image|feedshare|mediaproxy)/i;

  const classifyString = (s: string): 'image' | 'video' | 'document' | null => {
    if (!s || typeof s !== 'string') return null;
    if (VIDEO_EXT_RE.test(s)) return 'video';
    if (DOC_EXT_RE.test(s)) return 'document';
    if (IMAGE_EXT_RE.test(s)) return 'image';
    if (LICDN_HOST_RE.test(s)) {
      if (LICDN_VIDEO_PATH_RE.test(s)) return 'video';
      if (LICDN_DOC_PATH_RE.test(s)) return 'document';
      if (LICDN_IMAGE_PATH_RE.test(s)) return 'image';
    }
    return null;
  };

  const normType = (t: any) => (typeof t === 'string' ? t.toLowerCase() : '');

  // Track every distinct image URL we see so we can promote image → carousel
  // even when the enclosing array doesn't live under a media-ish key.
  const imageUrls = new Set<string>();

  const walk = (node: any, underMedia: boolean) => {
    if (node == null) return;
    if (typeof node === 'string') {
      const kind = classifyString(node);
      if (kind) {
        out[kind] = true;
        if (kind === 'image') imageUrls.add(node);
      } else if (underMedia && /^https?:\/\//i.test(node)) {
        out.image = true;
        imageUrls.add(node);
      }
      return;
    }
    if (Array.isArray(node)) {
      if (underMedia && node.length > 1) out.carousel = true;
      for (const el of node) walk(el, underMedia);
      return;
    }
    if (typeof node !== 'object') return;

    const t = normType(node.type ?? node.media_type ?? node.attachment_type ?? node.kind);
    if (t) {
      if (t.includes('video')) out.video = true;
      else if (t.includes('document') || t.includes('pdf')) out.document = true;
      else if (t.includes('image') || t.includes('photo') || t.includes('picture') || t.includes('img')) out.image = true;
    }

    for (const urlKey of ['url', 'download_url', 'image_url', 'thumbnail_url', 'video_url', 'source_url', 'src', 'href', 'link', 'uri']) {
      const v = node[urlKey];
      if (typeof v === 'string') {
        const kind = classifyString(v);
        if (kind) {
          out[kind] = true;
          if (kind === 'image') imageUrls.add(v);
        } else if (underMedia) {
          out.image = true;
          imageUrls.add(v);
        }
      }
    }

    for (const [k, v] of Object.entries(node)) {
      if (TEXT_KEYS.has(k)) continue;
      if (AUTHOR_KEYS.has(k)) continue;
      const childUnderMedia = underMedia || MEDIA_KEY_RE.test(k);
      walk(v, childUnderMedia);
    }
  };

  walk(raw, false);

  // Final safety net: if we found 2+ distinct image URLs anywhere (deduped),
  // treat it as a carousel. Catches cases where the array lives under a key
  // the name heuristic doesn't recognize but the contents are clearly multiple
  // separate images.
  if (imageUrls.size >= 2) out.carousel = true;

  return out;
}

export const unipileService = new UnipileService();