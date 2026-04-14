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

    const res = await fetch(url, {
      ...options,
      headers: {
        'X-API-KEY': this.apiKey,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`[Unipile] Error ${res.status}: ${body}`);
      throw new Error(`Unipile API error ${res.status}: ${body}`);
    }

    const data = await res.json();
    return data as T;
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
  async getProfile(linkedinUrl: string): Promise<UnipileProfile> {
    const publicIdentifier = this.extractLinkedInIdentifier(linkedinUrl);
    console.log(`[Unipile] Fetching profile for: ${publicIdentifier}`);

    const profile = await this.request<UnipileProfile>(
      `/api/v1/users/${encodeURIComponent(publicIdentifier)}?account_id=${this.accountId}`
    );

    console.log(`[Unipile] Profile fetched. provider_id: ${profile.provider_id}, id: ${profile.id}, name: ${profile.name || profile.first_name}`);
    return profile;
  }

  /**
   * Step 2: Get posts using the provider_id (internal ID) from getProfile.
   * The identifier for posts MUST be the provider internal ID, not the public username.
   */
  async getPosts(providerInternalId: string, since?: Date): Promise<UnipilePost[]> {
    const allPosts: UnipilePost[] = [];
    let cursor: string | undefined;
    const sixMonthsAgo = since || new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);

    let page = 0;
    const maxPages = 20;

    console.log(`[Unipile] Fetching posts for identifier: ${providerInternalId}`);

    do {
      const params = new URLSearchParams({
        account_id: this.accountId,
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

      for (const post of posts) {
        const publishedAt = post.parsed_datetime || post.created_at || post.published_at || post.date;
        if (publishedAt && new Date(publishedAt) < sixMonthsAgo) {
          console.log(`[Unipile] Reached posts older than 6 months, stopping. Total: ${allPosts.length}`);
          return allPosts;
        }
        allPosts.push(post);
      }

      cursor = response.cursor || response.paging?.cursor;
      page++;

      // Rate limiting: wait 500ms between pages
      if (cursor) {
        await new Promise((r) => setTimeout(r, 500));
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

  private detectContentType(raw: UnipilePost): string {
    if (raw.poll) return 'poll';
    if (raw.article) return 'article';

    const signals = this.scanMediaSignals(raw);
    if (signals.video) return 'video';
    if (signals.document) return 'document';
    if (signals.carousel) return 'carousel';
    if (signals.image) return 'image';

    return 'text_only';
  }

  // Same deep-scan logic as reclassify endpoint — kept here so live scraping and
  // reclassification stay in sync. Ignores post text fields to avoid false positives.
  private scanMediaSignals(raw: any): { image: boolean; carousel: boolean; video: boolean; document: boolean } {
    const out = { image: false, carousel: false, video: false, document: false };
    if (!raw || typeof raw !== 'object') return out;

    const TEXT_KEYS = new Set(['text', 'content', 'body', 'description', 'caption', 'hook_text', 'content_text']);
    const MEDIA_KEYS = new Set([
      'attachments', 'attachment', 'media', 'medias', 'images', 'image',
      'image_url', 'image_urls', 'img', 'img_url', 'imgs',
      'photo', 'photos', 'picture', 'pictures',
      'thumbnail', 'thumbnail_url', 'thumbnails',
      'video', 'videos', 'video_url',
      'document', 'documents', 'doc', 'docs', 'file', 'files',
    ]);
    const IMAGE_EXT_RE = /\.(jpe?g|png|webp|gif|heic|avif|bmp)(\?|#|$)/i;
    const VIDEO_EXT_RE = /\.(mp4|webm|mov|m4v|mkv|avi)(\?|#|$)/i;
    const DOC_EXT_RE = /\.(pdf|pptx?|docx?|xlsx?|csv)(\?|#|$)/i;

    const normType = (t: any) => (typeof t === 'string' ? t.toLowerCase() : '');

    const walk = (node: any, underMedia: boolean) => {
      if (!node) return;
      if (typeof node === 'string') {
        if (underMedia) {
          if (IMAGE_EXT_RE.test(node)) out.image = true;
          if (VIDEO_EXT_RE.test(node)) out.video = true;
          if (DOC_EXT_RE.test(node)) out.document = true;
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

      for (const urlKey of ['url', 'download_url', 'image_url', 'thumbnail_url', 'video_url', 'source_url', 'src']) {
        const v = node[urlKey];
        if (typeof v === 'string') {
          if (IMAGE_EXT_RE.test(v)) out.image = true;
          else if (VIDEO_EXT_RE.test(v)) out.video = true;
          else if (DOC_EXT_RE.test(v)) out.document = true;
          else if (underMedia) out.image = true;
        }
      }

      for (const [k, v] of Object.entries(node)) {
        if (TEXT_KEYS.has(k)) continue;
        const childUnderMedia = underMedia || MEDIA_KEYS.has(k);
        walk(v, childUnderMedia);
      }
    };

    walk(raw, false);
    return out;
  }
}

export const unipileService = new UnipileService();
