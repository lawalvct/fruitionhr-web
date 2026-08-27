import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  BarChart3,
  BellRing,
  BriefcaseBusiness,
  Building2,
  CalendarCheck2,
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Clock4,
  FileText,
  HandCoins,
  Headphones,
  LockKeyhole,
  ShieldCheck,
  Target,
  Timer,
  UserPlus,
  UserRound,
  Users,
  Workflow,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { appLink, site } from "@/lib/site";

export const metadata = {
  title: "Features",
  description:
    "Explore FruitionHR for employee records, attendance, leave, Nigerian payroll compliance, loans, recruitment, performance, self-service, approvals, reporting, and access control.",
};

interface FeatureModule {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  points: string[];
}

interface FeatureGroup {
  eyebrow: string;
  title: string;
  description: string;
  modules: FeatureModule[];
}

const featureGroups: FeatureGroup[] = [
  {
    eyebrow: "People foundation",
    title: "Organize every part of your workforce",
    description:
      "Build the company structure once, keep complete employee records, and give every person a useful self-service workspace.",
    modules: [
      {
        id: "organisation",
        icon: Building2,
        title: "Company setup",
        description:
          "Model how your organization actually works, from locations to reporting structures.",
        points: [
          "Branches, departments, positions, and job grades",
          "Employment types and company work settings",
          "Holiday calendars and holiday dates",
          "Guided setup with sensible starter data",
        ],
      },
      {
        id: "people",
        icon: Users,
        title: "Employee records",
        description:
          "Keep reliable people data in one profile instead of scattered files and spreadsheets.",
        points: [
          "Personal, contact, next-of-kin, bank, and statutory details",
          "Current assignments and dated employment history",
          "Employee photos, documents, and expiry dates",
          "Excel and CSV import, plus employee exports",
        ],
      },
      {
        id: "self-service",
        icon: UserRound,
        title: "Employee self-service",
        description:
          "Give employees direct access to the everyday tasks that otherwise land with HR.",
        points: [
          "View profiles and request corrections",
          "Apply for leave and follow balances",
          "Clock in, review attendance, and download payslips",
          "Request salary advances or staff loans",
        ],
      },
    ],
  },
  {
    eyebrow: "Time and requests",
    title: "Turn everyday activity into approved, payroll-ready records",
    description:
      "Attendance, leave, and approvals share one flow, so managers can act quickly and payroll receives finalized inputs.",
    modules: [
      {
        id: "attendance",
        icon: Clock4,
        title: "Time and attendance",
        description:
          "Capture time in the way that fits each team, then close the month with confidence.",
        points: [
          "Reusable shifts and employee shift assignments",
          "Manual entry, bulk marking, Excel, and CSV import",
          "Employee clock-in and shared QR attendance kiosks",
          "Late, absent, and overtime summaries finalized for payroll",
        ],
      },
      {
        id: "leave",
        icon: CalendarDays,
        title: "Leave management",
        description:
          "Make time-off planning visible without making policies or approvals harder to manage.",
        points: [
          "Configurable leave types, allocations, and carry-forward limits",
          "Live employee balances and request history",
          "Manager and HR approval workflows",
          "Team timeline for approved time away",
        ],
      },
      {
        id: "approvals",
        icon: ClipboardCheck,
        title: "Central approvals",
        description:
          "Bring requests from across FruitionHR into one actionable review queue.",
        points: [
          "Role-based, multi-step approval routes",
          "Approve, reject, or return with comments",
          "One queue for leave, payroll, loans, overtime, and more",
          "Submitted-request tracking for every requester",
        ],
      },
    ],
  },
  {
    eyebrow: "Pay and employee finance",
    title: "Run payroll with every input accounted for",
    description:
      "Build flexible salaries, calculate Nigerian statutory obligations, and connect overtime and recoveries to the correct pay period.",
    modules: [
      {
        id: "payroll",
        icon: Banknote,
        title: "Payroll and compliance",
        description:
          "Move from salary setup to locked, reproducible payroll with clear checks at every stage.",
        points: [
          "Reusable pay components, structures, and published formulas",
          "PAYE, Pension, NHF, and NSITF calculations",
          "Preflight checks, employee breakdowns, and variance review",
          "Approval, locking, reversal, payslips, journals, and schedules",
        ],
      },
      {
        id: "overtime",
        icon: Timer,
        title: "Overtime",
        description:
          "Turn clocked or manually recorded extra hours into controlled, payable records.",
        points: [
          "Accept overtime from finalized attendance",
          "Manual entries with configurable rate multipliers",
          "Approval before any overtime is paid",
          "Pay through payroll or as an approved off-cycle item",
        ],
      },
      {
        id: "loans",
        icon: HandCoins,
        title: "Loans and salary advances",
        description:
          "Manage employee finance requests and recoveries without maintaining a separate ledger.",
        points: [
          "HR-recorded and employee-requested advances or loans",
          "Approval before disbursement or recovery",
          "Installment plans and repayment history",
          "Automatic payroll deductions with reversal support",
        ],
      },
    ],
  },
  {
    eyebrow: "Talent and insight",
    title: "Hire deliberately, develop people, and understand the results",
    description:
      "Keep candidate context through hiring, run meaningful performance cycles, and see trends across the organization.",
    modules: [
      {
        id: "recruitment",
        icon: BriefcaseBusiness,
        title: "Recruitment and onboarding",
        description:
          "Manage the complete hiring path, including the public candidate experience.",
        points: [
          "Approved manpower requisitions and vacancies",
          "Published careers pages and online applications",
          "Candidate stages, interviews, scorecards, and offers",
          "Onboarding tasks and one-step conversion to employee",
        ],
      },
      {
        id: "performance",
        icon: Target,
        title: "Performance and goals",
        description:
          "Create a repeatable review process while keeping goals and growth conversations visible.",
        points: [
          "KPI libraries, rating scales, templates, and cycles",
          "Weighted self, manager, peer, and 360-degree reviews",
          "Company, department, and individual goals with check-ins",
          "Calibration, outcomes, appeals, trends, and improvement plans",
        ],
      },
      {
        id: "reports",
        icon: BarChart3,
        title: "Dashboards and reports",
        description:
          "Move from live operational summaries to detailed analysis without rebuilding the data.",
        points: [
          "Workforce, attendance, leave, payroll, performance, and hiring",
          "Yearly overviews and module-level analysis",
          "Permission-aware visibility for sensitive data",
          "CSV, Excel, and PDF exports",
        ],
      },
    ],
  },
  {
    eyebrow: "Control and reliability",
    title: "Give the right people access and keep work moving",
    description:
      "FruitionHR combines focused permissions, protected documents, useful notifications, and support inside the same workspace.",
    modules: [
      {
        id: "access",
        icon: LockKeyhole,
        title: "Roles and access control",
        description:
          "Match access to real responsibilities instead of giving everyone the same view.",
        points: [
          "Create company roles from granular permissions",
          "Assign one or more roles to each user",
          "Separate salary and payroll access from general people data",
          "Permission checks across screens, actions, and downloads",
        ],
      },
      {
        id: "documents",
        icon: FileText,
        title: "Documents and notifications",
        description:
          "Keep important records attached to the right person and surface work that needs attention.",
        points: [
          "Secure employee document uploads and downloads",
          "Document types, ownership, and optional expiry dates",
          "In-app notification inbox with read status",
          "Email updates for important account and workflow events",
        ],
      },
      {
        id: "support",
        icon: Headphones,
        title: "Setup and support",
        description:
          "Get from a new workspace to useful HR operations with help close at hand.",
        points: [
          "Guided company onboarding",
          "Starter roles, workflows, and configuration",
          "Bulk imports for faster data migration",
          "In-app support tickets with threaded replies",
        ],
      },
    ],
  },
];

const moduleLinks = featureGroups.flatMap((group) =>
  group.modules.map((module) => ({
    id: module.id,
    label: module.title,
    icon: module.icon,
  })),
);

const workflows = [
  {
    eyebrow: "From clock-in to payday",
    title: "Time becomes trusted payroll input",
    steps: [
      { icon: Clock4, label: "Capture time" },
      { icon: CalendarCheck2, label: "Finalize period" },
      { icon: Banknote, label: "Run payroll" },
    ],
  },
  {
    eyebrow: "From application to employee",
    title: "Hiring context follows the person",
    steps: [
      { icon: BriefcaseBusiness, label: "Manage candidate" },
      { icon: UserPlus, label: "Hire" },
      { icon: Users, label: "Create record" },
    ],
  },
  {
    eyebrow: "From request to outcome",
    title: "Every decision has a clear route",
    steps: [
      { icon: FileText, label: "Submit request" },
      { icon: ClipboardCheck, label: "Review" },
      { icon: CheckCircle2, label: "Apply outcome" },
    ],
  },
];

export default function FeaturesPage() {
  return (
    <main className="bg-white">
      <section className="relative overflow-hidden border-b border-fruition-100 bg-[#f7faf8]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_20%,rgba(74,222,128,0.22),transparent_34%)]" />
        <div className="pointer-events-none absolute top-12 left-[46%] h-64 w-64 bg-[radial-gradient(#86efac_1px,transparent_1px)] [background-size:9px_9px] opacity-35 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        <div className="relative mx-auto grid max-w-[1380px] items-center gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[0.92fr_1.08fr] lg:px-12 lg:py-22">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-fruition-200 bg-white px-4 py-2 text-sm font-semibold text-fruition-800 shadow-sm">
              <Workflow className="size-4" />
              One connected people platform
            </span>
            <h1 className="mt-7 text-4xl leading-[1.06] font-extrabold tracking-[-0.04em] text-slate-950 sm:text-6xl">
              Every HR workflow,
              <span className="block bg-linear-to-r from-fruition-800 to-fruition-500 bg-clip-text text-transparent">
                working as one.
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
              Manage your organization, people, time, payroll, hiring, and
              performance in one system built for growing African teams.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button
                size="lg"
                className="h-14 rounded-xl bg-linear-135 from-fruition-800 to-fruition-600 px-7 text-base text-white shadow-[0_15px_30px_rgba(4,120,87,0.22)] hover:opacity-90"
                render={<a href={appLink.register} />}
              >
                Get started free <ArrowRight className="size-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-14 rounded-xl border-fruition-300 bg-white px-7 text-base text-fruition-800 shadow-none hover:bg-fruition-50"
                render={
                  <a href={`mailto:${site.contactEmail}?subject=Demo%20request`} />
                }
              >
                Request a demo
              </Button>
            </div>
            <div className="mt-9 grid max-w-xl grid-cols-3 gap-3 border-t border-fruition-100 pt-6">
              {[
                ["15", "product areas"],
                ["6", "report families"],
                ["4", "statutory schedules"],
              ].map(([value, label]) => (
                <div key={label}>
                  <p className="text-2xl font-extrabold text-slate-900">{value}</p>
                  <p className="mt-0.5 text-xs leading-5 text-slate-500">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div
            className="relative mx-auto w-full max-w-2xl"
            aria-label="Illustration of connected payroll inputs in FruitionHR"
          >
            <div className="absolute -inset-5 rounded-[2.5rem] bg-fruition-200/35 blur-3xl" />
            <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-linear-135 from-fruition-950 via-fruition-900 to-fruition-800 p-3 shadow-[0_32px_80px_rgba(6,78,59,0.28)] sm:p-5">
              <div className="rounded-2xl bg-white p-4 shadow-2xl sm:p-6">
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-5">
                  <div>
                    <p className="text-xs font-semibold tracking-wider text-fruition-700 uppercase">
                      Payroll readiness
                    </p>
                    <h2 className="mt-1 text-lg font-bold text-slate-900 sm:text-xl">
                      August payroll
                    </h2>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-fruition-50 px-3 py-1.5 text-xs font-semibold text-fruition-800 ring-1 ring-fruition-100">
                    <CheckCircle2 className="size-3.5" /> Ready to review
                  </span>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {[
                    ["Employee salaries", "Configured"],
                    ["Attendance", "Finalized"],
                    ["Leave requests", "Resolved"],
                    ["Loan recoveries", "Scheduled"],
                  ].map(([label, status]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/70 px-3.5 py-3"
                    >
                      <span className="text-xs font-medium text-slate-600">{label}</span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-fruition-700">
                        <Check className="size-3" /> {status}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-2xl bg-fruition-950 p-5 text-white">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs text-fruition-100/60">Connected inputs</p>
                      <p className="mt-1 text-base font-bold">All checks complete</p>
                    </div>
                    <span className="grid size-11 place-items-center rounded-xl bg-fruition-400/15 text-fruition-300 ring-1 ring-fruition-300/20">
                      <ShieldCheck className="size-5" />
                    </span>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-full rounded-full bg-linear-to-r from-fruition-400 to-emerald-300" />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {["Payslips", "Bank schedule", "PAYE", "Pension", "NHF", "NSITF"].map(
                      (output) => (
                        <span
                          key={output}
                          className="rounded-lg bg-white/8 px-2.5 py-1.5 text-[10px] font-medium text-fruition-50 ring-1 ring-white/10"
                        >
                          {output}
                        </span>
                      ),
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-fruition-100 bg-white py-9">
        <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-10">
            <div className="shrink-0 lg:w-52">
              <p className="text-sm font-bold text-slate-900">Explore the platform</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Jump to any capability.
              </p>
            </div>
            <nav
              className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5"
              aria-label="Feature modules"
            >
              {moduleLinks.map((module) => (
                <a
                  key={module.id}
                  href={`#${module.id}`}
                  className="group flex min-h-11 items-center gap-2 rounded-xl border border-fruition-100 bg-[#f9fbfa] px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-fruition-300 hover:bg-fruition-50 hover:text-fruition-800"
                >
                  <module.icon className="size-3.5 shrink-0 text-fruition-600" />
                  {module.label}
                </a>
              ))}
            </nav>
          </div>
        </div>
      </section>

      {featureGroups.map((group, groupIndex) => (
        <section
          key={group.eyebrow}
          className={groupIndex % 2 === 0 ? "bg-white py-20" : "bg-[#f7faf8] py-20"}
        >
          <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
            <div className="grid gap-5 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
              <div>
                <p className="text-sm font-bold tracking-wider text-fruition-700 uppercase">
                  {group.eyebrow}
                </p>
                <h2 className="mt-3 max-w-xl text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                  {group.title}
                </h2>
              </div>
              <p className="max-w-2xl text-base leading-8 text-slate-500 lg:justify-self-end">
                {group.description}
              </p>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {group.modules.map((module) => (
                <article
                  key={module.id}
                  id={module.id}
                  className="group scroll-mt-28 rounded-3xl border border-fruition-100 bg-white p-6 shadow-[0_12px_32px_rgba(15,23,42,0.04)] transition duration-300 hover:-translate-y-1 hover:border-fruition-200 hover:shadow-[0_22px_45px_rgba(4,120,87,0.09)] sm:p-7"
                >
                  <span className="grid size-12 place-items-center rounded-2xl bg-fruition-50 text-fruition-700 ring-1 ring-fruition-100 transition group-hover:bg-fruition-100">
                    <module.icon className="size-5" />
                  </span>
                  <h3 className="mt-5 text-xl font-bold tracking-tight text-slate-900">
                    {module.title}
                  </h3>
                  <p className="mt-3 min-h-14 text-sm leading-7 text-slate-500">
                    {module.description}
                  </p>
                  <ul className="mt-5 grid gap-3 border-t border-slate-100 pt-5">
                    {module.points.map((point) => (
                      <li key={point} className="flex items-start gap-2.5">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-fruition-600" />
                        <span className="text-sm leading-6 text-slate-600">{point}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>
      ))}

      <section className="border-y border-fruition-100 bg-white py-20">
        <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-bold tracking-wider text-fruition-700 uppercase">
              Connected by design
            </p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
              Work moves forward without being entered twice
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-500">
              FruitionHR modules pass trusted records to the next step, keeping
              teams aligned and reducing manual reconciliation.
            </p>
          </div>

          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {workflows.map((workflow) => (
              <article
                key={workflow.eyebrow}
                className="rounded-3xl border border-fruition-100 bg-[#f9fbfa] p-6 sm:p-7"
              >
                <p className="text-xs font-bold tracking-wider text-fruition-700 uppercase">
                  {workflow.eyebrow}
                </p>
                <h3 className="mt-2 text-lg font-bold text-slate-900">{workflow.title}</h3>
                <div className="mt-7 flex items-start justify-between gap-1">
                  {workflow.steps.map((step, index) => (
                    <div key={step.label} className="contents">
                      <div className="flex w-20 flex-col items-center text-center sm:w-24">
                        <span className="grid size-10 place-items-center rounded-xl bg-white text-fruition-700 shadow-sm ring-1 ring-fruition-100">
                          <step.icon className="size-4" />
                        </span>
                        <span className="mt-2 text-[11px] leading-4 font-medium text-slate-600">
                          {step.label}
                        </span>
                      </div>
                      {index < workflow.steps.length - 1 && (
                        <ArrowRight className="mt-3 size-4 shrink-0 text-fruition-300" />
                      )}
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-20 sm:px-8">
        <div className="relative mx-auto max-w-[1280px] overflow-hidden rounded-[2rem] bg-linear-135 from-fruition-950 via-fruition-900 to-fruition-700 px-7 py-12 text-white sm:px-10 lg:px-14 lg:py-14">
          <div className="pointer-events-none absolute -right-32 -bottom-64 size-150 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -right-12 -bottom-44 size-110 rounded-full border border-white/10" />
          <div className="relative grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-fruition-200">
                <ShieldCheck className="size-4" /> Controls that travel with the work
              </span>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Confidence is built into every sensitive action.
              </h2>
              <p className="mt-4 max-w-xl text-base leading-8 text-fruition-100/75">
                Company-level data separation, granular permissions, explicit
                approvals, and reproducible payroll records protect the work
                without slowing your team down.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { icon: Banknote, label: "Nigerian statutory payroll calculations" },
                { icon: LockKeyhole, label: "Role-based access to sensitive data" },
                { icon: ClipboardCheck, label: "Structured approvals with action history" },
                { icon: FileText, label: "Locked payroll outputs and safe reversals" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-3 rounded-2xl bg-white/8 p-4 text-sm font-medium text-fruition-50 ring-1 ring-white/10 backdrop-blur"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-fruition-300/15 text-fruition-200">
                    <item.icon className="size-4" />
                  </span>
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-fruition-100 bg-fruition-50/55 py-20">
        <div className="mx-auto max-w-3xl px-5 text-center sm:px-8">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-white text-fruition-700 shadow-sm ring-1 ring-fruition-100">
            <BellRing className="size-5" />
          </span>
          <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
            Ready to replace disconnected HR work?
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-500">
            Start your company workspace free, or let us walk you through the
            features that matter most to your team.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button
              size="lg"
              className="h-14 rounded-xl bg-linear-135 from-fruition-800 to-fruition-600 px-7 text-base text-white shadow-[0_15px_30px_rgba(4,120,87,0.2)] hover:opacity-90"
              render={<a href={appLink.register} />}
            >
              Get started free <ArrowRight className="size-5" />
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="h-14 px-7 text-base text-fruition-800 hover:bg-fruition-100"
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
