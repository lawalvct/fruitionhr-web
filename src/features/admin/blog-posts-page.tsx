"use client";

import Link from "next/link";

import { publicBlogUrl } from "@/lib/site";
import { ExternalLink, Eye, FileText, ImageOff, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { apiErrorMessage } from "@/lib/api";
import { AdminPagination, formatAdminDate, QueryErrorState } from "./admin-ui";
import type { BlogPost, BlogPostStatus } from "./blog-types";
import { useBlogPosts, useDeleteBlogPost } from "./use-blog";

const selectClass =
  "h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-700 outline-none focus:border-fruition-400 focus:ring-2 focus:ring-fruition-500/15";

export function BlogPostsPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<BlogPostStatus | "">("");
  const [deleting, setDeleting] = useState<BlogPost | null>(null);
  const deletePost = useDeleteBlogPost();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const [sort, setSort] = useState("-created_at");
  const posts = useBlogPosts({ page, search, status, sort });
  const rows = posts.data?.data ?? [];

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await deletePost.mutateAsync(deleting.id);
      toast.success("Post deleted.");
      setDeleting(null);
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Blog"
        description="Write and publish articles for the FruitionHR marketing site."
        actions={
          <Button render={<Link href="/blog/new" />}>
            <Plus className="size-4" /> New post
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search by title or slug"
            className="pl-8"
          />
        </div>
        <select
          className={selectClass}
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as BlogPostStatus | "");
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          <option value="draft">Drafts</option>
          <option value="published">Published</option>
        </select>
        <select
          className={selectClass}
          value={sort}
          onChange={(event) => {
            setSort(event.target.value);
            setPage(1);
          }}
          aria-label="Sort posts"
        >
          <option value="-created_at">Newest first</option>
          <option value="-views">Most read</option>
          <option value="-published_at">Recently published</option>
          <option value="title">Title A–Z</option>
        </select>
      </div>

      {posts.isError ? (
        <QueryErrorState title="We could not load the posts" onRetry={() => posts.refetch()} />
      ) : (
        <Card className="overflow-hidden p-0">
          <CardContent className="p-0">
            {posts.isPending ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} className="h-16 w-full rounded-xl" />
                ))}
              </div>
            ) : rows.length === 0 ? (
              <EmptyState hasFilters={search !== "" || status !== ""} />
            ) : (
              <ul className="divide-y divide-slate-100">
                {rows.map((post) => (
                  <li
                    key={post.id}
                    className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <CoverThumb post={post} />
                      <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <StatusPill post={post} />
                        <Link
                          href={`/blog/${post.id}`}
                          className="truncate text-sm font-semibold text-slate-900 hover:text-fruition-700 hover:underline"
                        >
                          {post.title}
                        </Link>
                      </div>
                      <p className="mt-1 truncate text-xs text-slate-500">
                        /{post.slug}
                        {post.author?.name ? ` · ${post.author.name}` : ""}
                        {post.is_published
                          ? ` · Published ${formatAdminDate(post.published_at)}`
                          : ` · Updated ${formatAdminDate(post.updated_at)}`}
                      </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                      {/*
                        Only for published posts: a draft cannot be read by
                        anyone, so its count is always zero and says nothing.
                      */}
                      {post.is_published && (
                        <span
                          className="mr-1 inline-flex items-center gap-1 text-xs font-medium text-slate-500 tabular-nums"
                          title={`${post.views.toLocaleString("en-NG")} ${post.views === 1 ? "read" : "reads"} of this article`}
                        >
                          <Eye className="size-3.5" aria-hidden="true" />
                          {post.views.toLocaleString("en-NG")}
                          <span className="sr-only"> views</span>
                        </span>
                      )}
                      {post.is_published && (
                        <Button
                          variant="ghost"
                          size="sm"
                          render={
                            <a
                              href={publicBlogUrl(post.slug)}
                              target="_blank"
                              rel="noopener noreferrer"
                            />
                          }
                        >
                          <ExternalLink className="size-3.5" /> View
                        </Button>
                      )}
                      <Button variant="outline" size="sm" render={<Link href={`/blog/${post.id}`} />}>
                        <Pencil className="size-3.5" /> Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => setDeleting(post)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <AdminPagination
              meta={posts.data?.meta}
              isFetching={posts.isFetching}
              onPageChange={setPage}
            />
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete this post?"
        description={
          deleting
            ? `"${deleting.title}" will be removed from the marketing site immediately.`
            : ""
        }
        confirmLabel="Delete post"
        isPending={deletePost.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

function StatusPill({ post }: { post: BlogPost }) {
  const published = post.is_published;

  return (
    <span
      className={
        published
          ? "shrink-0 rounded-full bg-fruition-50 px-2 py-0.5 text-[10px] font-bold tracking-wide text-fruition-800 uppercase"
          : "shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold tracking-wide text-slate-600 uppercase"
      }
    >
      {published ? "Live" : "Draft"}
    </span>
  );
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="grid min-h-64 place-items-center p-6 text-center">
      <div>
        <span className="mx-auto grid size-11 place-items-center rounded-xl bg-slate-50 text-slate-400 ring-1 ring-slate-100">
          <FileText className="size-5" />
        </span>
        <p className="mt-3 text-sm font-semibold text-slate-900">
          {hasFilters ? "No posts match those filters" : "No posts yet"}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          {hasFilters
            ? "Try a different search or status."
            : "Write your first article for the marketing site."}
        </p>
        {!hasFilters && (
          <Button className="mt-4" size="sm" render={<Link href="/blog/new" />}>
            <Plus className="size-4" /> New post
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * The post's cover, at a glance.
 *
 * A plain img rather than next/image: the file is served by the API on another
 * origin, and the admin list does not need the optimiser for a 40px thumbnail.
 * Falls back to a placeholder so rows stay aligned whether or not there is art.
 */
function CoverThumb({ post }: { post: BlogPost }) {
  if (!post.cover_image_url) {
    return (
      <span
        className="grid size-11 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-400 ring-1 ring-slate-200"
        title="No cover image"
      >
        <ImageOff className="size-4" />
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- served by the API, not a static asset
    <img
      src={post.cover_image_url}
      alt=""
      loading="lazy"
      className="size-11 shrink-0 rounded-lg object-cover ring-1 ring-slate-200"
    />
  );
}
