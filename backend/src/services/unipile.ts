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
  date?: string;
  likes_count?: number;
  reactions_count?: number;
  comments_count?: number;
  reposts_count?: number;
  shares_count?: number;
  impressions?: number;
  views_count?: number;
  media?: any[];
  images?: any[];
  documents?: any[];
  video?: any;
  poll?: any;
  article?: any;
  author?: any;
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
      throw new Error(`Unipile API error ${res.status}: ${body}`);
    }

    return res.json() as Promise<T>;
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

  async getProfile(linkedinUrl: string): Promise<UnipileProfile> {
    const identifier = this.extractLinkedInIdentifier(linkedinUrl);
    const profile = await this.request<UnipileProfile>(
      `/api/v1/users/${encodeURIComponent(identifier)}?account_id=${this.accountId}`
    );
    return profile;
  }

  async getPosts(linkedinIdentifier: string, since?: Date): Promise<UnipilePost[]> {
    const allPosts: UnipilePost[] = [];
    let cursor: string | undefined;
    const sixMonthsAgo = since || new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);

    let page = 0;
    const maxPages = 20; // Safety limit

    do {
      const params = new URLSearchParams({
        account_id: this.accountId,
        limit: '50',
      });
      if (cursor) params.set('cursor', cursor);

      const response = await this.request<UnipileListResponse>(
        `/api/v1/users/${encodeURIComponent(linkedinIdentifier)}/posts?${params.toString()}`
      );

      const posts = response.items || [];
      if (posts.length === 0) break;

      for (const post of posts) {
        const publishedAt = post.created_at || post.published_at || post.date;
        if (publishedAt && new Date(publishedAt) < sixMonthsAgo) {
          return allPosts; // Stop once we reach posts older than 6 months
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

    return allPosts;
  }

  normalizeProfile(raw: UnipileProfile, linkedinUrl: string) {
    return {
      linkedin_url: linkedinUrl,
      linkedin_id: raw.provider_id || raw.public_identifier || raw.id || null,
      name: raw.name || [raw.first_name, raw.last_name].filter(Boolean).join(' ') || null,
      headline: raw.headline || null,
      followers_count: raw.followers_count || 0,
      connections_count: raw.connections_count || 0,
      profile_image_url: raw.profile_picture_url || null,
    };
  }

  normalizePost(raw: UnipilePost, creatorId: string) {
    const text = raw.text || raw.content || raw.body || '';
    const contentType = this.detectContentType(raw);
    const publishedAt = raw.created_at || raw.published_at || raw.date || null;

    return {
      creator_id: creatorId,
      linkedin_post_id: raw.social_id || raw.id || null,
      content_text: text,
      content_type: contentType,
      published_at: publishedAt ? new Date(publishedAt) : null,
      likes_count: raw.likes_count || raw.reactions_count || 0,
      comments_count: raw.comments_count || 0,
      reposts_count: raw.reposts_count || raw.shares_count || 0,
      impressions_count: raw.impressions || raw.views_count || null,
      post_url: raw.url || raw.post_url || null,
      raw_data: raw,
    };
  }

  private detectContentType(raw: UnipilePost): string {
    if (raw.poll) return 'poll';
    if (raw.article) return 'article';
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
