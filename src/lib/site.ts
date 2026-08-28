/**
 * Marketing-site config. Both cross-surface URLs are env-driven so each
 * deployment can point them wherever it needs.
 *
 * The fallbacks are per-environment on purpose. `NEXT_PUBLIC_*` values are
 * inlined at build time, so a production build that forgets to set them used
 * to bake `http://localhost:3000` into every cross-surface link — dead links
 * to terms, privacy, blog posts and public vacancies on the live site. A
 * production build now degrades to the real domains instead of localhost.
 */
const isProduction = process.env.NODE_ENV === "production";

/**
 * An unset `NEXT_PUBLIC_*` var and one set to "" are very different to `??`:
 * an empty string is a value, so `?? fallback` keeps it and every link becomes
 * a bare "/terms" against the wrong host. Blank counts as unset here. The
 * trailing slash is trimmed so a configured "https://fruitionhr.com/" cannot
 * produce "//terms".
 */
function baseUrl(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim().replace(/\/+$/, "");

  return trimmed ? trimmed : fallback;
}

export const site = {
  name: "FruitionHR",
  tagline: "Empowering Your Workforce",
  description:
    "All-in-one HR & payroll platform for growing African businesses — employees, attendance, leave, payroll with PAYE/Pension/NHF/NSITF compliance, recruitment and performance in one system.",
  appUrl: baseUrl(
    process.env.NEXT_PUBLIC_APP_URL,
    isProduction ? "https://app.fruitionhr.com" : "http://app.localhost:3000",
  ),
  marketingUrl: baseUrl(
    process.env.NEXT_PUBLIC_MARKETING_URL,
    isProduction ? "https://fruitionhr.com" : "http://localhost:3000",
  ),
  contactEmail: "hello@fruitionhr.com",
} as const;

export const appLink = {
  register: `${site.appUrl}/register`,
  login: `${site.appUrl}/login`,
} as const;

/**
 * Legal pages live on the marketing site, but are linked from the app surface
 * too (registration consent). Absolute for the same reason as
 * `publicBlogUrl` below — a bare `/terms` would resolve against app.* .
 */
export const legalLink = {
  terms: `${site.marketingUrl}/terms`,
  privacy: `${site.marketingUrl}/privacy`,
} as const;

export function publicVacancyUrl(slug: string): string {
  return `${site.marketingUrl}/careers/${slug}`;
}

/**
 * A published post on the marketing site.
 *
 * Absolute on purpose. A bare `/blog/{slug}` is resolved against whichever host
 * the link is rendered on, so from the admin console it lands on the admin
 * editor — which expects a numeric id, not a slug.
 */
export function publicBlogUrl(slug: string): string {
  return `${site.marketingUrl}/blog/${slug}`;
}
