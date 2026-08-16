import { BlogPostsPage } from "@/features/admin/blog-posts-page";

export const metadata = { title: "Blog" };

export default function AdminBlogRoute() {
  return <BlogPostsPage />;
}
