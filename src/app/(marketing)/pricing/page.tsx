import { ArrowRight, CheckCircle2 } from "lucide-react";

import { appLink, site } from "@/lib/site";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Pricing",
  description:
    "Simple per-employee pricing for FruitionHR. Start free, upgrade as your team grows.",
};

const plans = [
  {
    name: "Starter",
    price: "₦500",
    unit: "per employee / month",
    description: "For small teams moving off spreadsheets.",
    cta: "Get started free",
    href: appLink.register,
    highlighted: false,
    features: [
      "Up to 25 employees",
      "Core HR & employee records",
      "Payroll with PAYE, Pension, NHF & NSITF",
      "Payslips & bank schedules",
      "Leave management",
      "Email support",
    ],
  },
  {
    name: "Growth",
    price: "₦900",
    unit: "per employee / month",
    description: "For growing companies that need the full toolkit.",
    cta: "Start with Growth",
    href: appLink.register,
    highlighted: true,
    features: [
      "Everything in Starter",
      "Unlimited employees",
      "Time & attendance with shifts and overtime",
      "Approval workflows & audit trail",
      "Loans & salary advances",
      "Employee & manager self-service",
      "Statutory remittance reports",
      "Priority support",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    unit: "annual billing",
    description: "For large or multi-branch organizations.",
    cta: "Talk to sales",
    href: `mailto:${site.contactEmail}?subject=Enterprise%20enquiry`,
    highlighted: false,
    features: [
      "Everything in Growth",
      "Recruitment & onboarding",
      "Performance, goals & 360° reviews",
      "Multi-branch & cost-centre reporting",
      "Payroll journal export for accounting",
      "Dedicated onboarding & training",
      "SLA & dedicated account manager",
    ],
  },
];

const faqs = [
  {
    q: "Is there a free trial?",
    a: "Yes — create your company workspace and explore every feature free during the trial period. No card required to start.",
  },
  {
    q: "How does per-employee pricing work?",
    a: "You pay only for active employees in a billing month. Exited employees stop counting the month after they leave — their records stay safely archived.",
  },
  {
    q: "Are PAYE, Pension, NHF and NSITF really automatic?",
    a: "Yes. Statutory rules are built in and versioned — when regulations change we update them centrally, and your historical payslips remain exactly as they were calculated.",
  },
  {
    q: "Can we import our existing employee data?",
    a: "Yes — import employees, salary structures and balances from Excel templates. On Enterprise we handle the migration with you.",
  },
  {
    q: "Where is our data stored and is it secure?",
    a: "Your data is isolated per company, protected with role-based access (salary visibility is a separate permission), encrypted in transit, and backed up daily.",
  },
  {
    q: "Do you support multiple branches or subsidiaries?",
    a: "Branches, departments, divisions and cost centres are supported on all plans; multi-branch reporting and consolidated views come with Enterprise.",
  },
];

export default function PricingPage() {
  return (
    <main>
      {/* Hero */}
      <section className="bg-linear-180 from-fruition-50 to-white">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 lg:py-20">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            Simple pricing that grows with you
          </h1>
          <p className="mt-5 text-lg text-slate-500">
            Pay per employee, per month. Start free — upgrade when you&apos;re
            ready.
          </p>
          <p className="mt-2 text-sm text-slate-400">
            Launch pricing shown; final plans confirmed at launch.
          </p>
        </div>
      </section>

      {/* Plans */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={
                plan.highlighted
                  ? "relative rounded-3xl bg-linear-135 from-fruition-950 via-fruition-800 to-fruition-700 p-8 text-white shadow-xl shadow-fruition-900/20"
                  : "rounded-3xl border border-fruition-100 bg-white p-8 shadow-sm"
              }
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-fruition-400 px-3 py-1 text-xs font-bold text-fruition-950">
                  Most popular
                </span>
              )}
              <h2
                className={`text-lg font-bold ${plan.highlighted ? "" : "text-slate-900"}`}
              >
                {plan.name}
              </h2>
              <p
                className={`mt-1 text-sm ${plan.highlighted ? "text-fruition-100/85" : "text-slate-500"}`}
              >
                {plan.description}
              </p>
              <div className="mt-5 flex items-baseline gap-2">
                <span className="text-4xl font-extrabold tracking-tight">
                  {plan.price}
                </span>
                <span
                  className={`text-sm ${plan.highlighted ? "text-fruition-100/80" : "text-slate-400"}`}
                >
                  {plan.unit}
                </span>
              </div>
              <Button
                className={
                  plan.highlighted
                    ? "mt-6 h-11 w-full bg-white text-base font-semibold text-fruition-800 hover:bg-fruition-50"
                    : "mt-6 h-11 w-full bg-linear-135 from-fruition-700 to-fruition-500 text-base text-white hover:opacity-90"
                }
                render={<a href={plan.href} />}
              >
                {plan.cta} <ArrowRight className="size-4" />
              </Button>
              <ul className="mt-7 grid gap-2.5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <CheckCircle2
                      className={`mt-0.5 size-4.5 shrink-0 ${
                        plan.highlighted
                          ? "text-fruition-300"
                          : "text-fruition-600"
                      }`}
                    />
                    <span
                      className={`text-sm ${plan.highlighted ? "text-fruition-50/95" : "text-slate-600"}`}
                    >
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-fruition-100 bg-slate-50/60 py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="text-center text-3xl font-extrabold tracking-tight text-slate-900">
            Frequently asked questions
          </h2>
          <div className="mt-10 grid gap-3">
            {faqs.map((faq) => (
              <details
                key={faq.q}
                className="group rounded-xl border border-fruition-100 bg-white px-5 py-4 open:shadow-sm"
              >
                <summary className="cursor-pointer list-none font-semibold text-slate-800 marker:hidden">
                  {faq.q}
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-slate-500">
            More questions?{" "}
            <a
              href={`mailto:${site.contactEmail}`}
              className="font-semibold text-fruition-700 hover:underline"
            >
              {site.contactEmail}
            </a>
          </p>
        </div>
      </section>
    </main>
  );
}
