import type { Me, PlatformAbility } from "@/types/auth";

/**
 * What each administrator sees in the admin console.
 *
 * Presentation only. The API gates every admin route on the same abilities, so
 * hiding a link is a courtesy to the person using it, never the thing keeping
 * them out — see App\Support\Http\EnsurePlatformAbility.
 */

/** One entry per admin section, in sidebar order. */
export interface AdminSection {
  href: string;
  ability: PlatformAbility;
}

export const ADMIN_SECTIONS: AdminSection[] = [
  { href: "/dashboard", ability: "dashboard" },
  { href: "/tenants", ability: "tenants" },
  { href: "/users", ability: "users" },
  { href: "/support", ability: "support" },
  { href: "/billing", ability: "billing" },
  { href: "/careers", ability: "careers" },
  { href: "/blog", ability: "blog" },
  { href: "/administrators", ability: "administrators" },
  { href: "/activity", ability: "activity" },
];

export function hasAbility(me: Me | null | undefined, ability: PlatformAbility): boolean {
  return Boolean(me?.platform_abilities?.includes(ability));
}

/**
 * The ability an admin path needs, or null if the path is not a gated section.
 *
 * Longest match wins so nested routes (/tenants/12, /blog/4/edit) inherit their
 * section's ability rather than falling through as ungated.
 */
export function abilityForPath(pathname: string): PlatformAbility | null {
  const match = ADMIN_SECTIONS.filter(
    (section) => pathname === section.href || pathname.startsWith(`${section.href}/`),
  ).sort((a, b) => b.href.length - a.href.length)[0];

  return match?.ability ?? null;
}

/**
 * Where to send an administrator who has landed somewhere they cannot go.
 *
 * Falls back to their own profile: a staff member whose role was emptied has
 * nowhere useful to be, and bouncing them to a page that also rejects them
 * would loop.
 */
export function adminHomeDestination(me: Me | null | undefined): string {
  return ADMIN_SECTIONS.find((section) => hasAbility(me, section.ability))?.href ?? "/profile";
}
