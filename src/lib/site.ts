/**
 * Marketing-site config. The app URL is env-driven so the site can deploy to
 * Vercel before the tenant app is live (set NEXT_PUBLIC_APP_URL there later).
 */
export const site = {
  name: "FruitionHR",
  tagline: "Empowering Your Workforce",
  description:
    "All-in-one HR & payroll platform for growing African businesses — employees, attendance, leave, payroll with PAYE/Pension/NHF/NSITF compliance, recruitment and performance in one system.",
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://app.fruitionhr.test:3000",
  marketingUrl: process.env.NEXT_PUBLIC_MARKETING_URL ?? "http://localhost:3000",
  contactEmail: "hello@fruitionhr.com",
} as const;

export const appLink = {
  register: `${site.appUrl}/register`,
  login: `${site.appUrl}/login`,
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
