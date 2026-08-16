import 'server-only';

export interface PublicBlogPost {
  slug: string;
  title: string;
  excerpt: string | null;
  /** Sanitised HTML — only present on the detail endpoint. */
  body?: string;
  cover_image_url: string | null;
  published_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
  author_name?: string | null;
}

export interface PublicBlogCollection {
  data: PublicBlogPost[];
  meta: {
    current_page: number;
    from: number | null;
    last_page: number;
    per_page: number;
    to: number | null;
    total: number;
  };
}

function apiUrl(path: string, query?: Record<string, string | number | undefined>): string {
  const base = process.env.API_INTERNAL_URL
    ?? process.env.NEXT_PUBLIC_API_URL
    ?? 'http://localhost:8010';
  const url = new URL(path, base.endsWith('/') ? base : `${base}/`);

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== '') url.searchParams.set(key, String(value));
  }

  return url.toString();
}

export async function getPublicBlogPosts(page = 1): Promise<PublicBlogCollection> {
  const response = await fetch(apiUrl('/api/v1/blog', { page }), {
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error('The blog is temporarily unavailable.');
  }

  return response.json() as Promise<PublicBlogCollection>;
}

export async function getPublicBlogPost(slug: string): Promise<PublicBlogPost | null> {
  const response = await fetch(apiUrl(`/api/v1/blog/${encodeURIComponent(slug)}`), {
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  });

  if (response.status === 404) return null;
  if (!response.ok) throw new Error('This article is temporarily unavailable.');

  const payload = await response.json() as { data: PublicBlogPost };
  return payload.data;
}

export function formatPostDate(value: string | null): string | null {
  if (!value) return null;

  return new Intl.DateTimeFormat('en-NG', { dateStyle: 'long', timeZone: 'UTC' })
    .format(new Date(value));
}
