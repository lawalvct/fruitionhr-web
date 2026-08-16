import { ArrowRight, CalendarClock, CheckCircle2, ShieldCheck, TrendingUp, Users } from "lucide-react";

import { appLink, site } from "@/lib/site";
import { Button } from "@/components/ui/button";
import {
  formatPlanPrice,
  getPublicPlans,
  seatRange,
  type PublicPlan,
} from "@/features/marketing/public-plans";

export const metadata = {
  title: "Pricing",
  description:
    "Simple per-employee pricing for FruitionHR. Start free, upgrade as your team grows.",
};

const faqs = [
  {
    q: "Is there a free trial, and do we need a card?",
    a: "Yes to the trial, no to the card. Every plan comes with 30 days free — deliberately long enough to run a full monthly payroll from start to finish. Add your team, set up salaries, run payroll and check real payslips, PAYE, pension and NHF figures for your own staff before you pay us anything.",
  },
  {
    q: "Why is the trial 30 days?",
    a: "Because payroll runs monthly. A two-week trial ends before you ever complete a cycle, which tells you very little. Thirty days lets you see FruitionHR do the job you are actually hiring it for, on your own numbers.",
  },
  {
    q: "How does per-employee pricing work?",
    a: "You pay for the employees on your books each billing month. Staff who have exited stop counting — their records stay safely archived. Employees on leave or suspended still hold a seat, because they are still employed and still use the system.",
  },
  {
    q: "Is there a minimum charge?",
    a: "Each plan has a minimum number of seats, shown on the plan above. A team smaller than that minimum is billed at the minimum — so a 3-person company on a 5-seat plan pays for 5. Once you pass the minimum you simply pay for the people you have.",
  },
  {
    q: "What happens if we hire someone mid-month?",
    a: "They can start using FruitionHR the same day. New joiners appear on your next monthly bill rather than triggering a charge mid-cycle, so you are never billed twice in a month or asked for part-month payments.",
  },
  {
    q: "What if we outgrow our plan?",
    a: "Nothing stops working and nobody is blocked from onboarding a new hire. You keep paying your current rate for everyone, and we let you know which plan now suits your team better. Moving up is a single click whenever you are ready.",
  },
  {
    q: "What happens if we stop paying?",
    a: "Your workspace becomes read-only — you can still sign in, view every record, and download or export all of your data, including payslips. Only changes are paused until the bill is settled. We never delete your records, and you can always reach the billing page to pay.",
  },
  {
    q: "Can we cancel any time?",
    a: "Yes. Cancelling takes effect at the end of the period you have already paid for, so you keep full access until then — we do not cut you off on the day you cancel.",
  },
  {
    q: "How do we pay?",
    a: "Card or bank transfer through Paystack or Nomba, in Naira. Your subscription renews monthly and you can see every payment in your billing history.",
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


export default async function PricingPage() {
  const plans = await getPublicPlans();

  // Highlight the middle tier — the usual "most popular" convention. Derived
  // rather than stored, so adding a plan does not need a schema change.
  const highlightIndex =
    plans && plans.length > 1 ? Math.floor((plans.length - 1) / 2) : -1;

  return (
    <main>
      {/* Hero */}
      <section className="bg-linear-180 from-fruition-50 to-white">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 lg:py-20">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            Simple pricing that grows with you
          </h1>
          <p className="mt-5 text-lg text-slate-500">
            Pay per employee, per month. Every plan starts with 30 days free —
            enough to run a full payroll before you pay us anything.
          </p>
        </div>
      </section>

      {/* Plans */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        {plans === null || plans.length === 0 ? (
          <PricingUnavailable />
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {plans.map((plan, index) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                highlighted={index === highlightIndex}
              />
            ))}
          </div>
        )}
      </section>

      {/* How per-employee pricing works */}
      {plans !== null && plans.length > 0 && <HowPricingWorks plan={plans[0]} />}

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

/**
 * Explains the per-employee model in the customer's terms, using a real plan
 * price so the arithmetic is concrete rather than hypothetical.
 */
function HowPricingWorks({ plan }: { plan: PublicPlan }) {
  const example = Math.max(12, plan.min_employees);
  const unit = formatPlanPrice(plan.price_per_employee);
  const total = formatPlanPrice(plan.price_per_employee * example);

  const points = [
    {
      icon: <Users className="size-5" />,
      title: "Only the people on your books",
      body: "Someone who leaves stops counting the moment you mark them as exited — and their records stay archived. Staff on leave or suspended still hold a seat, because they are still employed.",
    },
    {
      icon: <TrendingUp className="size-5" />,
      title: "Your bill follows your team",
      body: "Hire whenever you need to. New joiners can use FruitionHR the same day and appear on your next monthly bill — never a surprise charge mid-cycle.",
    },
    {
      icon: <ShieldCheck className="size-5" />,
      title: "Your data is always yours",
      body: "If a payment ever lapses, your workspace becomes read-only rather than locked. You can still view, download and export everything, payslips included. We never delete your records.",
    },
    {
      icon: <CalendarClock className="size-5" />,
      title: "Try a whole payroll first",
      body: "Thirty days free on every plan — long enough to add your team, run a full monthly payroll and check the PAYE, pension and NHF figures yourself. No card needed to start.",
    },
  ];

  return (
    <section className="border-t border-fruition-100 bg-white py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
            What you actually pay for
          </h2>
          <p className="mt-3 text-slate-500">
            No per-module add-ons and no setup fees. One rate for each employee
            you have, every month.
          </p>
        </div>

        {/* The arithmetic, spelled out with a real plan price. */}
        <div className="mx-auto mt-10 max-w-2xl rounded-2xl bg-fruition-50 p-6 text-center">
          <p className="text-sm font-semibold tracking-wide text-fruition-800 uppercase">
            For example
          </p>
          <p className="mt-3 text-lg text-slate-700">
            A team of{" "}
            <span className="font-bold text-slate-900">{example} employees</span>{" "}
            on {plan.name} at{" "}
            <span className="font-bold text-slate-900">{unit}</span> each
          </p>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-fruition-800">
            {total}
            <span className="text-base font-medium text-fruition-700"> / month</span>
          </p>
          {plan.min_employees > 1 && (
            <p className="mt-3 text-xs text-fruition-800/80">
              {plan.name} starts at {plan.min_employees} seats — smaller teams are
              billed for {plan.min_employees}.
            </p>
          )}
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {points.map((point) => (
            <div key={point.title} className="rounded-2xl border border-fruition-100 p-6">
              <span className="grid size-11 place-items-center rounded-xl bg-fruition-50 text-fruition-700">
                {point.icon}
              </span>
              <h3 className="mt-4 text-base font-bold text-slate-900">{point.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{point.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PlanCard({
  plan,
  highlighted,
}: {
  plan: PublicPlan;
  highlighted: boolean;
}) {
  return (
    <div
      className={
        highlighted
          ? "relative rounded-3xl bg-linear-135 from-fruition-950 via-fruition-800 to-fruition-700 p-8 text-white shadow-xl shadow-fruition-900/20"
          : "rounded-3xl border border-fruition-100 bg-white p-8 shadow-sm"
      }
    >
      {highlighted && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-fruition-400 px-3 py-1 text-xs font-bold text-fruition-950">
          Most popular
        </span>
      )}

      <h2 className={`text-lg font-bold ${highlighted ? "" : "text-slate-900"}`}>
        {plan.name}
      </h2>

      {plan.description && (
        <p
          className={`mt-1 text-sm ${highlighted ? "text-fruition-100/85" : "text-slate-500"}`}
        >
          {plan.description}
        </p>
      )}

      <div className="mt-5 flex items-baseline gap-2">
        <span className="text-4xl font-extrabold tracking-tight">
          {formatPlanPrice(plan.price_per_employee)}
        </span>
        <span
          className={`text-sm ${highlighted ? "text-fruition-100/80" : "text-slate-400"}`}
        >
          per employee /{" "}
          {plan.billing_interval === "yearly" ? "year" : "month"}
        </span>
      </div>

      <p
        className={`mt-2 text-xs ${highlighted ? "text-fruition-100/70" : "text-slate-400"}`}
      >
        {seatRange(plan)}
        {plan.trial_days > 0 ? ` · ${plan.trial_days}-day free trial` : ""}
      </p>

      <Button
        className={
          highlighted
            ? "mt-6 h-11 w-full bg-white text-base font-semibold text-fruition-800 hover:bg-fruition-50"
            : "mt-6 h-11 w-full bg-linear-135 from-fruition-700 to-fruition-500 text-base text-white hover:opacity-90"
        }
        render={<a href={appLink.register} />}
      >
        Start with {plan.name} <ArrowRight className="size-4" />
      </Button>

      <ul className="mt-7 grid gap-2.5">
        {(plan.features ?? []).map((feature) => (
          <li key={feature} className="flex items-start gap-2.5">
            <CheckCircle2
              className={`mt-0.5 size-4.5 shrink-0 ${
                highlighted ? "text-fruition-300" : "text-fruition-600"
              }`}
            />
            <span
              className={`text-sm ${highlighted ? "text-fruition-50/95" : "text-slate-600"}`}
            >
              {feature}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Shown when the price list cannot be loaded. Deliberately does not fall back
 * to hardcoded figures — quoting a price we may no longer charge is worse than
 * asking the visitor to get in touch.
 */
function PricingUnavailable() {
  return (
    <div className="mx-auto max-w-xl rounded-3xl border border-fruition-100 bg-white p-10 text-center shadow-sm">
      <h2 className="text-lg font-bold text-slate-900">
        Our plans are being updated
      </h2>
      <p className="mt-2 text-sm text-slate-500">
        We could not load current pricing just now. Get in touch and we will
        send you a quote for your team size straight away.
      </p>
      <Button
        className="mt-6 h-11 bg-linear-135 from-fruition-700 to-fruition-500 text-base text-white hover:opacity-90"
        render={
          <a href={`mailto:${site.contactEmail}?subject=Pricing%20enquiry`} />
        }
      >
        Talk to us <ArrowRight className="size-4" />
      </Button>
    </div>
  );
}
