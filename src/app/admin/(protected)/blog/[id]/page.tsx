import { BlogEditorPage } from "@/features/admin/blog-editor-page";

export const metadata = { title: "Edit post" };

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminBlogEditRoute({ params }: PageProps) {
  const { id } = await params;

  return <BlogEditorPage postId={Number(id)} />;
}
