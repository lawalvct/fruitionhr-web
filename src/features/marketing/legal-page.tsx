import type { ReactNode } from "react";
import { ScrollText } from "lucide-react";

export type LegalSection = {
  /** Anchor id — also used by the in-page contents list. */
  id: string;
  heading: string;
  body: ReactNode;
};

/**
 * Shared shell for the legal pages (Terms of Service, Privacy Policy).
 *
 * Both are long documents that people mostly skim looking for one clause, so
 * every section is anchored and listed in a sticky contents column — that also
 * lets us deep-link, e.g. /privacy#retention, from support replies.
 */
export function LegalPage({
  eyebrow,
  title,
  updatedAt,
  intro,
  sections,
  footer,
}: {
  eyebrow: string;
  title: string;
  /** Human-readable effective date, e.g. "28 August 2026". */
  updatedAt: string;
  intro: ReactNode;
  sections: LegalSection[];
  footer?: ReactNode;
}) {
  return (
    <main>
      <section className="relative overflow-hidden bg-linear-180 from-fruition-50 via-white to-white">
        <div className="pointer-events-none absolute -top-40 right-0 size-150 rounded-full bg-fruition-200/30 blur-3xl" />
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-20">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-fruition-100 px-3 py-1 text-xs font-semibold text-fruition-800">
            <ScrollText className="size-3.5" />
            {eyebrow}
          </span>
          <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 text-sm font-medium text-slate-400">
            Last updated {updatedAt}
          </p>
          <div className="mt-6 grid gap-4 text-lg leading-8 text-slate-600">
            {intro}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-[220px_1fr]">
          <nav aria-label="On this page" className="hidden lg:block">
            <div className="sticky top-28">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                On this page
              </h2>
              <ul className="mt-3 grid gap-2 border-l border-fruition-100 pl-4">
                {sections.map((section) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className="text-sm text-slate-500 hover:text-fruition-700"
                    >
                      {section.heading}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </nav>

          <div className="grid gap-10">
            {sections.map((section, index) => (
              <article key={section.id} id={section.id} className="scroll-mt-28">
                <h2 className="text-xl font-bold tracking-tight text-slate-900">
                  <span className="mr-2 text-fruition-500">{index + 1}.</span>
                  {section.heading}
                </h2>
                <div className="mt-3 grid gap-3 text-[15px] leading-7 text-slate-600">
                  {section.body}
                </div>
              </article>
            ))}

            {footer ? (
              <div className="rounded-xl border border-fruition-100 bg-fruition-50/60 p-5 text-[15px] leading-7 text-slate-600">
                {footer}
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}

/** Bulleted list with the spacing used throughout the legal pages. */
export function LegalList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="grid list-disc gap-2 pl-5 marker:text-fruition-400">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}
