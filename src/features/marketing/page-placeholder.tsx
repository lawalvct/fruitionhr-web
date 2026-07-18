import type { ReactNode } from "react";
import { Clock } from "lucide-react";

/**
 * Temporary "coming soon" placeholder for marketing pages that are linked in
 * the nav but not built yet (blog, recruitment, contact). Swap each page's
 * body for real content when it's ready — this keeps the routes live and
 * on-brand in the meantime.
 */
export function PagePlaceholder({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <main>
      <section className="relative overflow-hidden bg-linear-180 from-fruition-50 via-white to-white">
        <div className="pointer-events-none absolute -top-40 right-0 size-150 rounded-full bg-fruition-200/30 blur-3xl" />
        <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6 lg:py-32">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-fruition-100 px-3 py-1 text-xs font-semibold text-fruition-800">
            <Clock className="size-3.5" />
            {eyebrow}
          </span>
          <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            {title}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-slate-500">
            {description}
          </p>
          {children ? (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              {children}
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
