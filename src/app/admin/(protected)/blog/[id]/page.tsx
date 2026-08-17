import { notFound } from "next/navigation";

import { BlogEditorPage } from "@/features/admin/blog-editor-page";

export const metadata = { title: "Edit post" };

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminBlogEditRoute({ params }: PageProps) {
  const { id } = await params;
  const postId = Number(id);

  // Anything that is not a real id is simply not a page. Without this, Number()
  // turns a stray path segment into NaN and the editor asks the API for
  // /blog-posts/NaN — a 404 dressed up as a broken screen.
  if (!Number.isInteger(postId) || postId < 1) {
    notFound();
  }

  return <BlogEditorPage postId={postId} />;
}
