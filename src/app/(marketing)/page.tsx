import Link from "next/link";

import { Button } from "@/components/ui/button";

// Placeholder landing page — real marketing site content comes later.
export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-24 text-center">
      <span className="rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
        HR &amp; Payroll for growing African businesses
      </span>
      <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
        Run HR, payroll &amp; compliance in one place
      </h1>
      <p className="max-w-xl text-lg text-muted-foreground">
        Employees, attendance, leave, payroll with PAYE, Pension, NHF &amp;
        NSITF — from onboarding to payslip, FruitionHR handles it.
      </p>
      <div className="flex gap-3">
        <Button
          size="lg"
          render={<Link href="http://app.fruitionhr.test:3000/register" />}
        >
          Start free
        </Button>
        <Button
          size="lg"
          variant="outline"
          render={<Link href="http://app.fruitionhr.test:3000/login" />}
        >
          Sign in
        </Button>
      </div>
    </main>
  );
}
