import type { PublicVacancy } from "./public-careers";

/** First letters of the first two words — the fallback when there is no logo. */
function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

/**
 * An employer's mark on the public careers site.
 *
 * Falls back to initials whenever the company has no logo, and the image is
 * served by a public endpoint that only responds while the company is actually
 * advertising. Rendered on the server, so there is no flash of initials before
 * the logo appears.
 */
export function CompanyLogo({
  company,
  className = "size-12 rounded-2xl text-sm",
}: {
  company: PublicVacancy["company"];
  /** Size and radius, so the card and the detail hero can differ. */
  className?: string;
}) {
  const base = `grid shrink-0 place-items-center overflow-hidden bg-fruition-50 font-extrabold text-fruition-800 ring-1 ring-fruition-100 ${className}`;

  if (!company.has_logo) {
    return <span className={base}>{initials(company.name)}</span>;
  }

  return (
    <span className={base}>
      {/* eslint-disable-next-line @next/next/no-img-element -- streamed from the API, not a static asset */}
      <img
        src={`/api/v1/careers/companies/${encodeURIComponent(company.slug)}/logo`}
        alt={`${company.name} logo`}
        className="size-full object-contain p-1.5"
        loading="lazy"
      />
    </span>
  );
}
