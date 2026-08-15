"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Menu, X } from "lucide-react";
import { useState } from "react";

import { appLink } from "@/lib/site";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navLinks = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/careers", label: "Careers" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-[1450px] items-center justify-between gap-4 px-5 sm:px-8 lg:px-12">
        <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <Image
            src="/fruitionhr-logo-icon.svg"
            alt=""
            width={34}
            height={34}
            priority
          />
          <span className="text-lg font-extrabold tracking-tight text-fruition-900">
            Fruition<span className="text-fruition-500">HR</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                pathname === link.href
                  ? "text-fruition-700"
                  : "text-slate-600 hover:text-fruition-700",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Button variant="ghost" render={<a href={appLink.login} />}>
            Sign in
          </Button>
          <Button
            className="h-11 rounded-xl bg-linear-135 from-fruition-800 to-fruition-600 px-5 text-white shadow-[0_10px_25px_rgba(4,120,87,0.18)] hover:opacity-90"
            render={<a href={appLink.register} />}
          >
            Get started free <ArrowRight className="size-4" />
          </Button>
        </div>

        <button
          type="button"
          className="rounded-md p-2 text-slate-600 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-fruition-100 bg-white px-4 py-3 md:hidden">
          <nav className="grid gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-fruition-50"
              >
                {link.label}
              </Link>
            ))}
            <a
              href={appLink.login}
              className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-fruition-50"
            >
              Sign in
            </a>
            <a
              href={appLink.register}
              className="mt-1 rounded-md bg-linear-135 from-fruition-700 to-fruition-500 px-3 py-2 text-center text-sm font-semibold text-white"
            >
              Get started free
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
