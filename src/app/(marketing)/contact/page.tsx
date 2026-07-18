import { Mail } from "lucide-react";

import { site } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { PagePlaceholder } from "@/features/marketing/page-placeholder";

export const metadata = {
  title: "Contact",
  description:
    "Get in touch with the FruitionHR team — questions, demos and support for HR & payroll.",
};

export default function ContactPage() {
  return (
    <PagePlaceholder
      eyebrow="We'd love to hear from you"
      title="Get in touch"
      description="A full contact form is coming soon. In the meantime, email us and we'll get back to you quickly."
    >
      <Button
        size="lg"
        className="h-11 bg-linear-135 from-fruition-700 to-fruition-500 px-6 text-base text-white shadow-md shadow-fruition-500/25 hover:opacity-90"
        render={<a href={`mailto:${site.contactEmail}`} />}
      >
        <Mail className="size-4" /> {site.contactEmail}
      </Button>
    </PagePlaceholder>
  );
}
