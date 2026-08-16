import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, CalendarDays, UserRound } from 'lucide-react';

import { formatPostDate, getPublicBlogPost } from '@/features/marketing/public-blog';

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublicBlogPost(slug).catch(() => null);

  if (!post) return { title: 'Article not found' };

  return {
    title: post.seo_title ?? post.title,
    description: post.seo_description ?? post.excerpt ?? undefined,
    openGraph: {
      title: post.seo_title ?? post.title,
      description: post.seo_description ?? post.excerpt ?? undefined,
      type: 'article',
      publishedTime: post.published_at ?? undefined,
      images: post.cover_image_url ? [post.cover_image_url] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPublicBlogPost(slug).catch(() => null);

  if (!post) notFound();

  const published = formatPostDate(post.published_at);

  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <Link
        href="/blog"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-fruition-700"
      >
        <ArrowLeft className="size-4" /> All articles
      </Link>

      <header className="mt-6">
        <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
          {post.title}
        </h1>
        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-500">
          {published && (
            <span className="flex items-center gap-1.5">
              <CalendarDays className="size-4" /> {published}
            </span>
          )}
          {post.author_name && (
            <span className="flex items-center gap-1.5">
              <UserRound className="size-4" /> {post.author_name}
            </span>
          )}
        </div>
      </header>

      {post.cover_image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.cover_image_url}
          alt=""
          className="mt-8 aspect-[16/9] w-full rounded-2xl object-cover"
        />
      )}

      {/*
        Safe to inject: the API sanitises post bodies against an allowlist
        (BlogHtmlSanitizer) before they are ever stored, so no script, inline
        handler or javascript: URL can reach this point.
      */}
      <div
        className="prose prose-slate mt-10 max-w-none prose-headings:font-semibold prose-a:text-fruition-700"
        dangerouslySetInnerHTML={{ __html: post.body ?? '' }}
      />
    </article>
  );
}
