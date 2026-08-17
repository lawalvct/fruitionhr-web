"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, Save, Send, Undo2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { RichTextEditor } from "@/components/rich-text-editor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { apiErrorMessage, isValidationError } from "@/lib/api";
import { publicBlogUrl } from "@/lib/site";
import { formatAdminDate, QueryErrorState } from "./admin-ui";
import type { BlogPostInput } from "./blog-types";
import { CoverImageField } from "./cover-image-field";
import { useBlogPost, useCreateBlogPost, useUpdateBlogPost } from "./use-blog";

interface FormState {
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  cover_image_url: string;
  cover_image_path: string;
  cover_preview_url: string;
  seo_title: string;
  seo_description: string;
}

const emptyForm: FormState = {
  title: "",
  slug: "",
  excerpt: "",
  body: "",
  cover_image_url: "",
  cover_image_path: "",
  cover_preview_url: "",
  seo_title: "",
  seo_description: "",
};

/** `postId` is null when composing a brand-new post. */
export function BlogEditorPage({ postId }: { postId: number | null }) {
  const router = useRouter();
  const existing = useBlogPost(postId);
  const createPost = useCreateBlogPost();
  const updatePost = useUpdateBlogPost(postId ?? 0);

  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hydratedId, setHydratedId] = useState<number | null>(null);

  // Hydrate once the post arrives. Adjusting state during render (rather than
  // in an effect) is React's documented pattern for this and avoids the extra
  // commit — later refetches won't clobber edits because the id is unchanged.
  if (existing.data && hydratedId !== existing.data.id) {
    setHydratedId(existing.data.id);
    setForm({
      title: existing.data.title,
      slug: existing.data.slug,
      excerpt: existing.data.excerpt ?? "",
      body: existing.data.body,
      cover_image_url: existing.data.cover_image_path ? "" : (existing.data.cover_image_url ?? ""),
      cover_image_path: existing.data.cover_image_path ?? "",
      cover_preview_url: existing.data.cover_image_url ?? "",
      seo_title: existing.data.seo_title ?? "",
      seo_description: existing.data.seo_description ?? "",
    });
  }

  const set = <TKey extends keyof FormState>(key: TKey, value: FormState[TKey]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const isPublished = existing.data?.is_published ?? false;
  const isSaving = createPost.isPending || updatePost.isPending;

  const buildPayload = (status?: "draft" | "published"): BlogPostInput => ({
    title: form.title.trim(),
    slug: form.slug.trim() || undefined,
    excerpt: form.excerpt.trim() || null,
    body: form.body,
    cover_image_url: form.cover_image_url.trim() || null,
    cover_image_path: form.cover_image_path.trim() || null,
    seo_title: form.seo_title.trim() || null,
    seo_description: form.seo_description.trim() || null,
    ...(status ? { status } : {}),
  });

  const save = async (status?: "draft" | "published") => {
    setErrors({});

    if (form.title.trim().length < 3) {
      setErrors({ title: "Give the post a title of at least 3 characters." });
      return;
    }

    try {
      if (postId === null) {
        const created = await createPost.mutateAsync(buildPayload(status ?? "draft"));
        toast.success(status === "published" ? "Post published." : "Draft saved.");
        router.replace(`/blog/${created.id}`);
        return;
      }

      await updatePost.mutateAsync(buildPayload(status));
      toast.success(
        status === "published"
          ? "Post published."
          : status === "draft"
            ? "Post moved back to draft."
            : "Changes saved.",
      );
    } catch (error) {
      if (isValidationError(error)) {
        const fieldErrors = error.response?.data.errors ?? {};
        setErrors(
          Object.fromEntries(
            Object.entries(fieldErrors).map(([key, messages]) => [key, messages[0]]),
          ),
        );
      }
      toast.error(apiErrorMessage(error));
    }
  };

  if (postId !== null && existing.isError) {
    return <QueryErrorState title="We could not load this post" onRetry={() => existing.refetch()} />;
  }

  if (postId !== null && existing.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={postId === null ? "New post" : "Edit post"}
        description={
          isPublished
            ? `Live on the marketing site since ${formatAdminDate(existing.data?.published_at)}.`
            : "Drafts stay private until you publish them."
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" size="sm" render={<Link href="/blog" />}>
              <ArrowLeft className="size-4" /> Back
            </Button>
            {isPublished && existing.data && (
              <Button
                variant="outline"
                size="sm"
                render={
                  <a
                    href={publicBlogUrl(existing.data.slug)}
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                }
              >
                <Eye className="size-4" /> View
              </Button>
            )}
            <Button variant="outline" size="sm" disabled={isSaving} onClick={() => save()}>
              <Save className="size-4" /> Save
            </Button>
            {isPublished ? (
              <Button variant="outline" size="sm" disabled={isSaving} onClick={() => save("draft")}>
                <Undo2 className="size-4" /> Unpublish
              </Button>
            ) : (
              <Button size="sm" disabled={isSaving} onClick={() => save("published")}>
                <Send className="size-4" /> Publish
              </Button>
            )}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <Field label="Title" error={errors.title}>
            <Input
              value={form.title}
              onChange={(event) => set("title", event.target.value)}
              placeholder="Payroll in Nigeria: a practical guide"
            />
          </Field>

          <Field
            label="Body"
            error={errors.body}
            hint="Formatting is cleaned on save — scripts and unsafe links are removed."
          >
            <RichTextEditor value={form.body} onChange={(html) => set("body", html)} />
          </Field>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Post details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Slug" error={errors.slug} hint="Leave blank to generate from the title.">
                <Input
                  value={form.slug}
                  onChange={(event) => set("slug", event.target.value)}
                  placeholder="payroll-in-nigeria"
                />
              </Field>
              <Field
                label="Excerpt"
                error={errors.excerpt}
                hint="Shown on the blog index. Falls back to the opening copy."
              >
                <textarea
                  value={form.excerpt}
                  onChange={(event) => set("excerpt", event.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-input bg-white px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20"
                />
              </Field>
              <Field
                label="Cover image"
                error={errors.cover_image_path ?? errors.cover_image_url}
              >
                <CoverImageField
                  previewUrl={form.cover_preview_url || null}
                  onUploaded={({ path, url }) =>
                    setForm((current) => ({
                      ...current,
                      cover_image_path: path,
                      cover_preview_url: url,
                      // An upload supersedes any external URL.
                      cover_image_url: "",
                    }))
                  }
                  onCleared={() =>
                    setForm((current) => ({
                      ...current,
                      cover_image_path: "",
                      cover_preview_url: "",
                      cover_image_url: "",
                    }))
                  }
                />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Search appearance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="SEO title" error={errors.seo_title}>
                <Input
                  value={form.seo_title}
                  onChange={(event) => set("seo_title", event.target.value)}
                  placeholder="Defaults to the post title"
                />
              </Field>
              <Field label="Meta description" error={errors.seo_description}>
                <textarea
                  value={form.seo_description}
                  onChange={(event) => set("seo_description", event.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-input bg-white px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20"
                />
              </Field>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error ? (
        <p className="text-xs text-red-600">{error}</p>
      ) : hint ? (
        <p className="text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}
