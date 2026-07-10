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
  contactEmail: "hello@fruitionhr.com",
} as const;

export const appLink = {
  register: `${site.appUrl}/register`,
  login: `${site.appUrl}/login`,
} as const;
