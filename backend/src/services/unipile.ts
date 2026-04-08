import dotenv from 'dotenv';
dotenv.config();

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
    connections_count?: number;
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
      || 0;
    const connectionsCount = raw.connections_count
      || raw.network_info?.connections_count
      || 0;

    return {
      linkedin_url: linkedinUrl,
      // provider_id is the internal ID needed for fetching posts
      linkedin_id: raw.provider_id || raw.id || raw.public_identifier || null,
      name: raw.name || [raw.first_name, raw.last_name].filter(Boolean).join(' ') || null,
      headline: raw.headline || null,
      followers_count: followersCount,
      connections_count: connectionsCount,
      profile_image_url: raw.profile_picture_url || null,
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
      post_url: raw.url || raw.post_url || null,
      raw_data: raw,
    };
  }

  private detectContentType(raw: UnipilePost): string {
    if (raw.poll) return 'poll';
    if (raw.article) return 'article';

    // Check attachments (Unipile's standard field)
    if (raw.attachments && raw.attachments.length > 0) {
      const types = raw.attachments.map(a => a.type?.toLowerCase() || '');
      if (types.some(t => t.includes('video'))) return 'video';
      if (types.some(t => t.includes('document') || t.includes('pdf'))) return 'document';
      if (raw.attachments.length > 1) return 'carousel';
      if (types.some(t => t.includes('image'))) return 'image';
    }

    if (raw.video) return 'video';
    if (raw.documents && raw.documents.length > 0) return 'document';
    if (raw.images && raw.images.length > 1) return 'carousel';
    if (raw.media && raw.media.length > 1) return 'carousel';
    if (raw.images && raw.images.length === 1) return 'image';
    if (raw.media && raw.media.length === 1) {
      const m = raw.media[0];
      if (m.type === 'video' || m.media_type === 'video') return 'video';
      if (m.type === 'document' || m.media_type === 'document') return 'document';
      return 'image';
    }
    return 'text_only';
  }
}

export const unipileService = new UnipileService();
