import { BlogEditorPage } from "@/features/admin/blog-editor-page";

export const metadata = { title: "New post" };

export default function AdminBlogNewRoute() {
  return <BlogEditorPage postId={null} />;
}
