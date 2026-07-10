import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Banknote,
  CalendarDays,
  Clock4,
  FileCheck2,
  ShieldCheck,
  Users,
  UserPlus,
  Workflow,
} from "lucide-react";

import { appLink, site } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { ProductMockup } from "@/features/marketing/product-mockup";

export const metadata = {
  title: "FruitionHR — HR & Payroll for growing African businesses",
  description: site.description,
};

const modules = [
  {
    icon: Users,
    title: "Core HR",
    text: "A complete employee database — biodata, employment history, documents, contracts and bank details in one place.",
  },
  {
    icon: Banknote,
    title: "Payroll & Compliance",
    text: "Accurate salary runs with PAYE, Pension, NHF & NSITF calculated automatically. Payslips, bank schedules and statutory reports in clicks.",
  },
  {
    icon: Clock4,
    title: "Time & Attendance",
    text: "Shifts, clock-in/out, lateness and overtime — finalized attendance flows straight into payroll.",
  },
  {
    icon: CalendarDays,
    title: "Leave Management",
    text: "Policies, balances and approvals for every leave type, with a team calendar managers actually use.",
  },
  {
    icon: UserPlus,
    title: "Recruitment & Onboarding",
    text: "From requisition to offer letter to first-day checklist — convert candidates into employees seamlessly.",
  },
  {
    icon: BarChart3,
    title: "Performance & Goals",
    text: "KPIs, appraisal cycles, 360° reviews and grading that connect performance to real outcomes.",
  },
  {
    icon: Workflow,
    title: "Approval Workflows",
    text: "Multi-step approvals for leave, payroll, loans and more — with a full audit trail on every action.",
  },
  {
    icon: ShieldCheck,
    title: "Security & Audit",
    text: "Role-based access, salary visibility controls, and an audit log of every sensitive change.",
  },
];

const steps = [
  {
    step: "01",
    title: "Set up your company",
    text: "Branches, departments, positions, grades and statutory settings — a guided checklist gets you ready fast.",
  },
  {
    step: "02",
    title: "Add your people",
    text: "Import employees from Excel or add them one by one, with salary structures and bank details.",
  },
  {
    step: "03",
    title: "Track time & leave",
    text: "Attendance, shifts and leave requests flow through approvals automatically.",
  },
  {
    step: "04",
    title: "Run payroll with confidence",
    text: "Preview, approve, lock. Payslips, bank schedules and statutory reports — generated for you.",
  },
];

const industries = [
  "Manufacturing",
  "Schools & Institutions",
  "Professional Firms",
  "Healthcare",
  "Retail & Services",
  "Multi-branch Organizations",
];

export default function HomePage() {
  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden bg-linear-180 from-fruition-50 via-white to-white">
        <div className="pointer-events-none absolute -top-40 right-0 size-150 rounded-full bg-fruition-200/30 blur-3xl" />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-16 pb-20 sm:px-6 lg:grid-cols-2 lg:pt-24">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-fruition-100 px-3 py-1 text-xs font-semibold text-fruition-800">
              <BadgeCheck className="size-3.5" />
              Built for Nigerian &amp; African payroll compliance
            </span>
            <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-[3.4rem] lg:leading-[1.1]">
              Run HR &amp; payroll{" "}
              <span className="bg-linear-135 from-fruition-700 to-fruition-500 bg-clip-text text-transparent">
                without the spreadsheets
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-slate-500">
              FruitionHR brings employees, attendance, leave, payroll and
              compliance into one clean platform — so salaries are accurate,
              statutory deductions are automatic, and your HR team gets their
              time back.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button
                size="lg"
                className="h-11 bg-linear-135 from-fruition-700 to-fruition-500 px-6 text-base text-white shadow-md shadow-fruition-500/25 hover:opacity-90"
                render={<a href={appLink.register} />}
              >
                Get started free <ArrowRight className="size-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-11 border-fruition-200 px-6 text-base text-fruition-800 hover:bg-fruition-50"
                render={
                  <a
                    href={`mailto:${site.contactEmail}?subject=Demo%20request`}
                  />
                }
              >
                Request a demo
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500">
              {["PAYE", "Pension", "NHF", "NSITF"].map((item) => (
                <span key={item} className="inline-flex items-center gap-1.5">
                  <FileCheck2 className="size-4 text-fruition-600" />
                  {item} compliant
                </span>
              ))}
            </div>
          </div>

          <ProductMockup />
        </div>
      </section>

      {/* Industries strip */}
      <section className="border-y border-fruition-100 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-4 py-6 sm:px-6">
          <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
            Built for
          </span>
          {industries.map((industry) => (
            <span key={industry} className="text-sm font-medium text-slate-500">
              {industry}
            </span>
          ))}
        </div>
      </section>

      {/* Modules */}
      <section className="bg-slate-50/60 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Everything HR, in one system
            </h2>
            <p className="mt-4 text-lg text-slate-500">
              From an employee&apos;s first day to their last payslip —
              FruitionHR covers the full journey.
            </p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {modules.map((module) => (
              <div
                key={module.title}
                className="group rounded-2xl border border-fruition-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <span className="inline-flex size-11 items-center justify-center rounded-xl bg-fruition-50 text-fruition-700 ring-1 ring-fruition-100">
                  <module.icon className="size-5" />
                </span>
                <h3 className="mt-4 font-bold text-slate-900">
                  {module.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  {module.text}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link
              href="/features"
              className="inline-flex items-center gap-1.5 font-semibold text-fruition-700 hover:text-fruition-800"
            >
              Explore all features <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              From setup to salaries in four steps
            </h2>
            <p className="mt-4 text-lg text-slate-500">
              A guided setup gets your company payroll-ready — no consultants
              required.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((item) => (
              <div key={item.step} className="relative rounded-2xl border border-fruition-100 bg-white p-6">
                <span className="text-sm font-extrabold text-fruition-300">
                  {item.step}
                </span>
                <h3 className="mt-2 font-bold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance panel — premium dark gradient */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="overflow-hidden rounded-3xl bg-linear-135 from-fruition-950 via-fruition-700 to-fruition-500 px-6 py-14 text-white sm:px-12">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                Statutory compliance, handled
              </h2>
              <p className="mt-4 max-w-lg text-fruition-100/90">
                PAYE tax bands, pension contributions, NHF and NSITF — computed
                correctly on every run, with the remittance reports your
                accountant and regulators expect. When the rules change, we
                update them; your payslips stay right.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {[
                  "PAYE reports",
                  "Pension schedules",
                  "NHF returns",
                  "NSITF returns",
                  "Bank payment schedules",
                  "Payroll journal export",
                ].map((item) => (
                  <span
                    key={item}
                    className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold ring-1 ring-white/20"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { value: "100%", label: "of statutory deductions auto-calculated" },
                { value: "4-step", label: "approval workflow before any payout" },
                { value: "Locked", label: "payroll runs — no silent edits, ever" },
                { value: "Full", label: "audit trail on every sensitive action" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl bg-white/10 p-5 ring-1 ring-white/15 backdrop-blur-sm"
                >
                  <p className="text-2xl font-extrabold">{stat.value}</p>
                  <p className="mt-1 text-sm text-fruition-100/85">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-fruition-100 bg-fruition-50/50 py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Ready to leave the spreadsheets behind?
          </h2>
          <p className="mt-4 text-lg text-slate-500">
            Set up your company on FruitionHR and run your first compliant
            payroll this month.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button
              size="lg"
              className="h-11 bg-linear-135 from-fruition-700 to-fruition-500 px-6 text-base text-white shadow-md shadow-fruition-500/25 hover:opacity-90"
              render={<a href={appLink.register} />}
            >
              Get started free <ArrowRight className="size-4" />
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="h-11 px-6 text-base text-fruition-800 hover:bg-fruition-100"
              render={<Link href="/pricing" />}
            >
              View pricing
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
