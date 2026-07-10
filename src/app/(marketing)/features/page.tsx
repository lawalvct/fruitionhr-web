import {
  ArrowRight,
  Banknote,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock4,
  ShieldCheck,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";

import { appLink, site } from "@/lib/site";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Features",
  description:
    "Explore FruitionHR modules: Core HR, payroll with Nigerian statutory compliance, attendance, leave, recruitment, performance, workflows and audit.",
};

interface FeatureSection {
  id: string;
  icon: LucideIcon;
  kicker: string;
  title: string;
  description: string;
  points: string[];
}

const sections: FeatureSection[] = [
  {
    id: "people",
    icon: Users,
    kicker: "Core HR",
    title: "One source of truth for your people",
    description:
      "Stop hunting through folders and spreadsheets. Every employee record — from biodata to bank details — lives in one secure profile with a full history.",
    points: [
      "Complete employee profiles: biodata, contacts, next of kin, education & qualifications",
      "Employment history with effective dates — transfers, promotions and grade changes tracked",
      "Documents & contracts with expiry reminders (IDs, certificates, permits)",
      "Bank, tax, and pension details ready for payroll",
      "Bulk import from Excel to get started in minutes",
    ],
  },
  {
    id: "payroll",
    icon: Banknote,
    kicker: "Payroll & Compliance",
    title: "Payroll your accountant will trust",
    description:
      "Configurable salary structures meet automatic statutory deductions. Preview every figure, route it through approvals, and lock the run — corrections happen by reversal, never silent edits.",
    points: [
      "Flexible salary components — basic, housing, transport, custom allowances & deductions",
      "PAYE, Pension, NHF and NSITF calculated automatically on every run",
      "Loans & salary advances with repayment schedules deducted automatically",
      "Payslips (PDF), bank payment schedules, and statutory remittance reports",
      "Approval workflow and locked runs with a complete audit trail",
      "13th month, gratuity and final settlement when you need them",
    ],
  },
  {
    id: "attendance",
    icon: Clock4,
    kicker: "Time & Attendance",
    title: "Know who's in, late, or absent — instantly",
    description:
      "Shifts, rosters and clock-ins that connect directly to payroll, so lateness and absence policies apply themselves.",
    points: [
      "Shift definitions and rosters per branch or department",
      "Clock in/out with manual entry and bulk import support",
      "Late arrival, early exit and absence flagged automatically against shift rules",
      "Overtime capture with approval before it hits payroll",
      "Supervisor review and HR finalization — payroll only uses finalized attendance",
    ],
  },
  {
    id: "leave",
    icon: CalendarDays,
    kicker: "Leave Management",
    title: "Leave requests without the back-and-forth",
    description:
      "Employees apply in seconds, managers approve from anywhere, balances update themselves — and payroll knows about unpaid leave automatically.",
    points: [
      "Configurable leave types and policies — annual, sick, maternity, study, unpaid and more",
      "Automatic balance tracking with carry-forward rules",
      "Multi-step approvals (supervisor → HR) with notifications",
      "Team leave calendar for managers",
      "Unpaid leave deducted in payroll automatically",
    ],
  },
  {
    id: "recruitment",
    icon: UserPlus,
    kicker: "Recruitment & Onboarding",
    title: "From vacancy to first day, organized",
    description:
      "Manage requisitions, applicants, interviews and offers in one pipeline — then convert the hired candidate into an employee with one click.",
    points: [
      "Manpower requisitions with approval before any vacancy opens",
      "Applicant tracking through configurable stages",
      "Interview scheduling, panels and scorecards",
      "Offer letters and acceptance tracking",
      "Onboarding checklists so no first-day step is missed",
    ],
  },
  {
    id: "performance",
    icon: BarChart3,
    kicker: "Performance & Goals",
    title: "Reviews people actually complete",
    description:
      "Set up appraisal cycles with weighted KPIs and multiple reviewers. Scores roll up to grades and recommendations automatically.",
    points: [
      "Appraisal cycles with self, manager, peer and 360° reviews",
      "KPI library with weights and custom rating scales",
      "Goals at company, department and individual level with check-ins",
      "Automatic final scores, grades and outcome recommendations",
      "Performance reports for promotion and training decisions",
    ],
  },
  {
    id: "security",
    icon: ShieldCheck,
    kicker: "Workflows, Security & Audit",
    title: "Control who does what — and prove it",
    description:
      "Every sensitive action goes through the right people and leaves a trace. Salary visibility is separate from profile visibility, by design.",
    points: [
      "Configurable multi-step approval workflows across all modules",
      "Role-based access control with per-company roles",
      "Separate permissions for viewing vs. managing salaries",
      "Audit log with before/after values on sensitive changes",
      "Secure document storage with permission-checked downloads",
    ],
  },
];

export default function FeaturesPage() {
  return (
    <main>
      {/* Hero */}
      <section className="bg-linear-180 from-fruition-50 to-white">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 lg:py-20">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            Every module your HR team needs
          </h1>
          <p className="mt-5 text-lg text-slate-500">
            FruitionHR replaces the spreadsheets, folders and WhatsApp
            approvals with one clean, connected system.
          </p>
        </div>
      </section>

      {/* Feature sections */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {sections.map((section, index) => (
          <section
            key={section.id}
            id={section.id}
            className={`grid items-center gap-10 py-14 lg:grid-cols-2 ${
              index < sections.length - 1 ? "border-b border-fruition-100" : ""
            }`}
          >
            <div className={index % 2 === 1 ? "lg:order-2" : ""}>
              <span className="inline-flex items-center gap-2 rounded-full bg-fruition-100 px-3 py-1 text-xs font-semibold text-fruition-800">
                <section.icon className="size-3.5" />
                {section.kicker}
              </span>
              <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                {section.title}
              </h2>
              <p className="mt-3 text-slate-500">{section.description}</p>
            </div>
            <ul
              className={`grid gap-3 rounded-2xl border border-fruition-100 bg-slate-50/60 p-6 ${
                index % 2 === 1 ? "lg:order-1" : ""
              }`}
            >
              {section.points.map((point) => (
                <li key={point} className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 size-4.5 shrink-0 text-fruition-600" />
                  <span className="text-sm leading-relaxed text-slate-600">
                    {point}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="rounded-3xl bg-linear-135 from-fruition-700 to-fruition-500 px-6 py-12 text-center text-white sm:px-12">
          <h2 className="text-3xl font-extrabold tracking-tight">
            See it with your own data
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-fruition-50/90">
            Create your company workspace free, or book a walkthrough and
            we&apos;ll set it up with you.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Button
              size="lg"
              className="h-11 bg-white px-6 text-base font-semibold text-fruition-800 hover:bg-fruition-50"
              render={<a href={appLink.register} />}
            >
              Get started free <ArrowRight className="size-4" />
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="h-11 px-6 text-base text-white hover:bg-white/10"
              render={
                <a href={`mailto:${site.contactEmail}?subject=Demo%20request`} />
              }
            >
              Request a demo
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
