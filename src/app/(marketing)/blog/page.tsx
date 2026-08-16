import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CalendarDays } from 'lucide-react';

import { PagePlaceholder } from '@/features/marketing/page-placeholder';
import {
  formatPostDate,
  getPublicBlogPosts,
  type PublicBlogPost,
} from '@/features/marketing/public-blog';

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'HR, payroll and compliance insights for growing African businesses — from the FruitionHR team.',
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function BlogPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const rawPage = Array.isArray(params.page) ? params.page[0] : params.page;
  const page = Math.max(1, Number(rawPage ?? 1) || 1);

  const collection = await getPublicBlogPosts(page).catch(() => null);
  const posts = collection?.data ?? [];

  // Nothing published yet (or the API is down) — keep the polished placeholder
  // rather than showing an empty grid.
  if (posts.length === 0) {
    return (
      <PagePlaceholder
        eyebrow="Coming soon"
        title="The FruitionHR blog"
        description="Practical guides on payroll, PAYE, pensions and building great teams across Africa. We're writing the first posts — check back shortly."
      />
    );
  }

  const [lead, ...rest] = posts;
  const lastPage = collection?.meta.last_page ?? 1;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <header className="max-w-2xl">
        <p className="text-xs font-bold tracking-[0.2em] text-fruition-700 uppercase">Insights</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
          The FruitionHR blog
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          Practical guides on payroll, PAYE, pensions and building great teams across Africa.
        </p>
      </header>

      {page === 1 && <LeadPost post={lead} />}

      <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {(page === 1 ? rest : posts).map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </div>

      {lastPage > 1 && (
        <nav className="mt-14 flex items-center justify-center gap-3 text-sm">
          {page > 1 && (
            <Link
              href={`/blog?page=${page - 1}`}
              className="rounded-lg border border-slate-200 px-4 py-2 font-medium text-slate-700 hover:border-fruition-300 hover:text-fruition-700"
            >
              Previous
            </Link>
          )}
          <span className="text-slate-500">
            Page {page} of {lastPage}
          </span>
          {page < lastPage && (
            <Link
              href={`/blog?page=${page + 1}`}
              className="rounded-lg border border-slate-200 px-4 py-2 font-medium text-slate-700 hover:border-fruition-300 hover:text-fruition-700"
            >
              Next
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}

function LeadPost({ post }: { post: PublicBlogPost }) {
  const published = formatPostDate(post.published_at);

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group mt-10 grid overflow-hidden rounded-3xl border border-slate-200 bg-white transition hover:border-fruition-300 hover:shadow-lg lg:grid-cols-2"
    >
      <div className="aspect-[16/10] w-full overflow-hidden bg-fruition-50 lg:aspect-auto lg:h-full">
        {post.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.cover_image_url}
            alt=""
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full min-h-56 place-items-center bg-linear-135 from-fruition-700 to-fruition-500" />
        )}
      </div>
      <div className="flex flex-col justify-center p-8 lg:p-10">
        {published && (
          <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <CalendarDays className="size-3.5" /> {published}
          </p>
        )}
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 group-hover:text-fruition-800 sm:text-3xl">
          {post.title}
        </h2>
        {post.excerpt && <p className="mt-3 text-slate-600">{post.excerpt}</p>}
        <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-fruition-700">
          Read article <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}

function PostCard({ post }: { post: PublicBlogPost }) {
  const published = formatPostDate(post.published_at);

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:border-fruition-300 hover:shadow-md"
    >
      <div className="aspect-[16/9] w-full overflow-hidden bg-fruition-50">
        {post.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.cover_image_url}
            alt=""
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-linear-135 from-fruition-700 to-fruition-500" />
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        {published && <p className="text-xs font-medium text-slate-500">{published}</p>}
        <h3 className="mt-2 text-lg font-semibold tracking-tight text-slate-900 group-hover:text-fruition-800">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="mt-2 line-clamp-3 text-sm text-slate-600">{post.excerpt}</p>
        )}
      </div>
    </Link>
  );
}
