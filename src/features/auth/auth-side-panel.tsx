import Image from "next/image";
import { CheckCircle2 } from "lucide-react";

import { ProductMockup } from "@/features/marketing/product-mockup";

const bullets = [
  "PAYE, Pension, NHF & NSITF calculated automatically",
  "Attendance, leave and approvals in one place",
  "Payslips, bank schedules & statutory reports in clicks",
];

/**
 * Branded promo panel for the auth screens. Hidden on mobile (`lg:` only) so
 * the form gets the full width on small viewports.
 */
export function AuthSidePanel() {
  return (
    <div className="relative hidden overflow-hidden bg-linear-135 from-fruition-950 via-fruition-800 to-fruition-600 p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-12">
      {/* soft decorative glows */}
      <div className="pointer-events-none absolute -top-24 -left-24 size-96 rounded-full bg-fruition-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 -bottom-32 size-96 rounded-full bg-fruition-500/25 blur-3xl" />

      {/* brand */}
      <div className="relative flex items-center gap-2">
        <Image
          src="/fruitionhr-logo-icon.svg"
          alt=""
          width={40}
          height={40}
          className="rounded-lg bg-white/10 p-1"
          priority
        />
        <span className="text-xl font-extrabold tracking-tight">
          Fruition<span className="text-fruition-300">HR</span>
        </span>
      </div>

      {/* headline + product visual */}
      <div className="relative my-8">
        <h2 className="max-w-md text-3xl font-extrabold leading-tight tracking-tight xl:text-[2.1rem]">
          Run HR &amp; payroll without the spreadsheets
        </h2>
        <p className="mt-3 max-w-md text-fruition-100/85">
          From onboarding to payslip - built for Nigerian &amp; African
          businesses.
        </p>
        <div className="mt-9">
          <ProductMockup />
        </div>
      </div>

      {/* benefit bullets */}
      <ul className="relative grid gap-2.5">
        {bullets.map((bullet) => (
          <li
            key={bullet}
            className="flex items-center gap-2.5 text-sm text-fruition-50/90"
          >
            <CheckCircle2 className="size-4.5 shrink-0 text-fruition-300" />
            {bullet}
          </li>
        ))}
      </ul>
    </div>
  );
}
