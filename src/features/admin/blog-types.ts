export type BlogPostStatus = "draft" | "published";

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string;
  cover_image_url: string | null;
  cover_image_path: string | null;
  status: BlogPostStatus;
  is_published: boolean;
  published_at: string | null;
  /** Reads of the public article page. */
  views: number;
  seo_title: string | null;
  seo_description: string | null;
  author?: { id: number; name: string; email: string } | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface BlogPostListQuery {
  page: number;
  search: string;
  status: BlogPostStatus | "";
  sort: string;
}

export interface BlogPostInput {
  title: string;
  slug?: string | null;
  excerpt?: string | null;
  body: string;
  cover_image_url?: string | null;
  cover_image_path?: string | null;
  status?: BlogPostStatus;
  seo_title?: string | null;
  seo_description?: string | null;
}
