import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Banknote,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Check,
  Clock4,
  Factory,
  GraduationCap,
  HeartPulse,
  ShieldCheck,
  ShoppingCart,
  UserPlus,
  Users,
  Workflow,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ProductMockup } from "@/features/marketing/product-mockup";
import { appLink, site } from "@/lib/site";

export const metadata = {
  title: "FruitionHR — Modern HR & payroll for Africa's growing teams",
  description: site.description,
};

const modules = [
  { icon: Users, title: "People operations", text: "One reliable home for employee records, contracts, documents and career history." },
  { icon: Banknote, title: "Payroll & compliance", text: "Run accurate payroll with PAYE, Pension, NHF and NSITF handled automatically." },
  { icon: Clock4, title: "Time & attendance", text: "Track shifts, lateness and overtime, then flow finalized attendance into payroll." },
  { icon: CalendarDays, title: "Leave management", text: "Give teams simple requests, clear balances and approval workflows that move quickly." },
  { icon: UserPlus, title: "Recruitment", text: "Move from requisition to offer and onboarding without losing candidate context." },
  { icon: BarChart3, title: "Performance", text: "Connect goals, reviews and growth conversations to meaningful team outcomes." },
];

const industries = [
  { label: "Manufacturing", icon: Factory },
  { label: "Schools & Institutions", icon: GraduationCap },
  { label: "Professional Firms", icon: BriefcaseBusiness },
  { label: "Healthcare", icon: HeartPulse },
  { label: "Retail & Services", icon: ShoppingCart },
  { label: "Multi-branch Organizations", icon: Building2 },
];

const steps = [
  { number: "01", title: "Set up your company", text: "Add branches, teams, policies and statutory settings with guided onboarding." },
  { number: "02", title: "Bring your people", text: "Import employees and organize every record in one secure workspace." },
  { number: "03", title: "Automate the flow", text: "Connect attendance, leave and approvals to remove repetitive admin work." },
  { number: "04", title: "Pay with confidence", text: "Review, approve and lock each payroll with a complete audit trail." },
];

export default function HomePage() {
  return (
    <main className="bg-white">
      <section className="relative overflow-hidden bg-white">
        <div className="pointer-events-none absolute top-0 right-0 h-full w-3/5 bg-[radial-gradient(circle_at_65%_45%,rgba(134,239,172,0.26),transparent_48%)]" />
        <div className="pointer-events-none absolute top-16 left-[43%] h-56 w-56 bg-[radial-gradient(#86efac_1px,transparent_1px)] [background-size:8px_8px] opacity-45 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        <div className="mx-auto grid min-h-[690px] max-w-[1450px] items-center gap-8 px-5 pt-14 pb-16 sm:px-8 lg:grid-cols-[.96fr_1.04fr] lg:px-12 lg:pt-12 lg:pb-10 xl:min-h-[750px] xl:grid-cols-[.86fr_1.14fr] xl:pt-16 xl:pb-12">
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-xl border border-fruition-200 bg-fruition-50/80 px-4 py-2 text-sm font-semibold text-fruition-800 shadow-[0_8px_24px_rgba(4,120,87,0.05)]">
              <ShieldCheck className="size-4" />
              Built for African payroll compliance
            </span>
            <h1 className="mt-8 text-[2.8rem] leading-[1.04] font-extrabold tracking-[-0.045em] text-[#101518] sm:text-6xl lg:text-[3.45rem]">
              Modern HR &amp; payroll<br />
              for Africa&apos;s<br />
              <span className="relative inline-block bg-linear-to-r from-fruition-700 to-fruition-500 bg-clip-text text-transparent">
                growing teams
                <svg className="absolute -bottom-4 left-2 h-4 w-[92%] text-fruition-300" viewBox="0 0 360 18" fill="none" aria-hidden="true">
                  <path d="M4 11C84 2 205 1 356 7C248 7 145 10 57 16" stroke="currentColor" strokeWidth="5" strokeLinecap="round" opacity=".65" />
                </svg>
              </span>
            </h1>
            <p className="mt-10 max-w-xl text-base leading-8 text-slate-500 sm:text-lg">
              Manage employees, attendance, leave, payroll and compliance in
              one intelligent platform. Stay compliant in every country, pay
              your people on time, every time.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Button size="lg" className="h-14 rounded-xl bg-linear-135 from-fruition-800 to-fruition-600 px-7 text-base text-white shadow-[0_15px_30px_rgba(4,120,87,0.22)] hover:opacity-90" render={<a href={appLink.register} />}>
                Get started free <ArrowRight className="size-5" />
              </Button>
              <Button size="lg" variant="outline" className="h-14 rounded-xl border-fruition-300 bg-white px-7 text-base text-fruition-700 shadow-none hover:bg-fruition-50" render={<a href={`mailto:${site.contactEmail}?subject=Demo%20request`} />}>
                <Workflow className="size-5" /> Request a demo
              </Button>
            </div>
            <div className="mt-9 grid grid-cols-2 gap-x-3 gap-y-3 text-[11px] text-slate-600 sm:grid-cols-4">
              {["PAYE", "Pension", "NHF", "NSITF"].map((item) => (
                <span key={item} className="inline-flex items-center gap-1.5 whitespace-nowrap"><ShieldCheck className="size-4 shrink-0 text-fruition-600" />{item} Compliant</span>
              ))}
            </div>
          </div>
          <ProductMockup />
        </div>
      </section>

      <section className="relative z-10 -mt-2 bg-white px-5 pb-10 sm:px-8 lg:px-12">
        <div className="mx-auto grid max-w-[1335px] overflow-hidden rounded-2xl border border-fruition-100 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.06)] md:grid-cols-[220px_1fr]">
          <div className="flex flex-col justify-center border-b border-fruition-100 px-6 py-5 md:border-r md:border-b-0">
            <span className="text-xs font-bold tracking-wide text-fruition-700 uppercase">Trusted by</span>
            <span className="mt-1 text-xs leading-4 font-medium text-slate-500 uppercase">organizations across<br />key sectors</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
            {industries.map((industry) => (
              <div key={industry.label} className="flex min-h-20 items-center gap-3 border-r border-b border-fruition-100 px-4 py-4 text-slate-700 lg:border-b-0">
                <industry.icon className="size-7 shrink-0 text-fruition-700" strokeWidth={1.8} />
                <span className="text-xs leading-4 font-medium">{industry.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f7faf8] py-24">
        <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-bold tracking-wider text-fruition-700 uppercase">One connected platform</span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">Everything your people need to thrive</h2>
            <p className="mt-5 text-lg leading-8 text-slate-500">From an employee&apos;s first day to every payday, FruitionHR keeps your people operations clear and connected.</p>
          </div>
          <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {modules.map((module) => (
              <div key={module.title} className="group rounded-3xl border border-fruition-100 bg-white p-7 shadow-[0_12px_30px_rgba(15,23,42,0.04)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_45px_rgba(4,120,87,0.09)]">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-fruition-50 text-fruition-700 ring-1 ring-fruition-100"><module.icon className="size-5" /></span>
                <h3 className="mt-6 text-lg font-bold text-slate-900">{module.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-500">{module.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center"><Link href="/features" className="inline-flex items-center gap-2 font-semibold text-fruition-700 hover:text-fruition-800">Explore all features <ArrowRight className="size-4" /></Link></div>
        </div>
      </section>

      <section className="py-24">
        <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
          <div className="grid gap-12 lg:grid-cols-[.72fr_1.28fr] lg:items-end">
            <div>
              <span className="text-sm font-bold tracking-wider text-fruition-700 uppercase">Simple by design</span>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">From setup to salaries, without the stress</h2>
              <p className="mt-5 text-lg leading-8 text-slate-500">A guided path gets you payroll-ready quickly, with controls your team can trust.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {steps.map((step) => (
                <div key={step.number} className="rounded-2xl border border-fruition-100 bg-white p-6">
                  <span className="text-sm font-extrabold text-fruition-400">{step.number}</span>
                  <h3 className="mt-2 font-bold text-slate-900">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 pb-24 sm:px-8">
        <div className="relative mx-auto max-w-[1280px] overflow-hidden rounded-[2rem] bg-linear-135 from-fruition-950 via-fruition-800 to-fruition-600 px-7 py-14 text-white sm:px-12 lg:px-16">
          <div className="absolute -right-20 -bottom-40 size-120 rounded-full border border-white/10" />
          <div className="relative grid items-center gap-10 lg:grid-cols-[1.15fr_.85fr]">
            <div>
              <span className="text-sm font-semibold text-fruition-200">COMPLIANCE, BUILT IN</span>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-5xl">Payroll confidence comes standard.</h2>
              <p className="mt-5 max-w-2xl text-base leading-8 text-fruition-100/80">Automated statutory calculations, structured approvals and permanently reproducible payroll records give every run a clean, defensible trail.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {["PAYE calculations", "Pension schedules", "Approval controls", "Complete audit trail"].map((item) => (
                <div key={item} className="flex items-center gap-2 rounded-xl bg-white/10 p-4 text-sm font-medium ring-1 ring-white/10 backdrop-blur"><Check className="size-4 text-fruition-300" />{item}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-fruition-100 bg-fruition-50/50 py-24">
        <div className="mx-auto max-w-3xl px-5 text-center sm:px-8">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">Ready to grow with less admin?</h2>
          <p className="mt-5 text-lg text-slate-500">Bring your people, payroll and compliance into one beautifully simple platform.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button size="lg" className="h-14 rounded-xl bg-linear-135 from-fruition-800 to-fruition-600 px-7 text-base text-white shadow-[0_15px_30px_rgba(4,120,87,0.2)] hover:opacity-90" render={<a href={appLink.register} />}>Get started free <ArrowRight className="size-5" /></Button>
            <Button size="lg" variant="ghost" className="h-14 px-7 text-base text-fruition-800 hover:bg-fruition-100" render={<Link href="/pricing" />}>View pricing</Button>
          </div>
        </div>
      </section>
    </main>
  );
}
