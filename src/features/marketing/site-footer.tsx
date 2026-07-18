import Image from "next/image";
import Link from "next/link";

import { site } from "@/lib/site";

const columns = [
  {
    title: "Product",
    links: [
      { href: "/features", label: "Features" },
      { href: "/pricing", label: "Pricing" },
    ],
  },
  {
    title: "Modules",
    links: [
      { href: "/features#payroll", label: "Payroll & Compliance" },
      { href: "/features#attendance", label: "Time & Attendance" },
      { href: "/features#leave", label: "Leave Management" },
      { href: "/features#people", label: "Core HR" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/recruitment", label: "Recruitment" },
      { href: "/blog", label: "Blog" },
      { href: "/contact", label: "Contact" },
      { href: `mailto:${site.contactEmail}?subject=Demo%20request`, label: "Request a demo" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-fruition-100 bg-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Link href="/" className="flex items-center gap-2">
            <Image src="/fruitionhr-logo-icon.svg" alt="" width={32} height={32} />
            <span className="text-lg font-extrabold tracking-tight text-fruition-900">
              Fruition<span className="text-fruition-500">HR</span>
            </span>
          </Link>
          <p className="mt-3 max-w-xs text-sm text-slate-500">
            {site.tagline}. HR, payroll and compliance for growing African
            businesses.
          </p>
        </div>

        {columns.map((column) => (
          <div key={column.title}>
            <h3 className="text-sm font-semibold text-fruition-900">
              {column.title}
            </h3>
            <ul className="mt-3 grid gap-2">
              {column.links.map((link) =>
                link.href.startsWith("mailto:") ? (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-slate-500 hover:text-fruition-700"
                    >
                      {link.label}
                    </a>
                  </li>
                ) : (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-500 hover:text-fruition-700"
                    >
                      {link.label}
                    </Link>
                  </li>
                ),
              )}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-fruition-100">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-slate-400 sm:flex-row sm:px-6">
          <p>© {new Date().getFullYear()} FruitionHR. All rights reserved.</p>
          <p>Built for Nigerian &amp; African payroll compliance.</p>
        </div>
      </div>
    </footer>
  );
}
