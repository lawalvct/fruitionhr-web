import { PagePlaceholder } from "@/features/marketing/page-placeholder";

export const metadata = {
  title: "Blog",
  description:
    "HR, payroll and compliance insights for growing African businesses — coming soon from the FruitionHR team.",
};

export default function BlogPage() {
  return (
    <PagePlaceholder
      eyebrow="Coming soon"
      title="The FruitionHR blog"
      description="Practical guides on payroll, PAYE, pensions and building great teams across Africa. We're writing the first posts — check back shortly."
    />
  );
}
