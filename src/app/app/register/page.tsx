import Image from "next/image";
import Link from "next/link";
import { Building2, ClipboardCheck, ShieldCheck } from "lucide-react";

import { AuthSidePanel } from "@/features/auth/auth-side-panel";
import { RegisterForm } from "@/features/auth/register-form";

export const metadata = { title: "Create your company account" };

export default function RegisterPage() {
  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-[1.05fr_1fr] xl:grid-cols-2">
      <AuthSidePanel />

      <main className="flex items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <Link href="/login" className="mb-8 flex items-center gap-2 lg:hidden">
            <Image
              src="/fruitionhr-logo-icon.svg"
              alt=""
              width={36}
              height={36}
              priority
            />
            <span className="text-lg font-extrabold tracking-tight text-fruition-900">
              Fruition<span className="text-fruition-500">HR</span>
            </span>
          </Link>

          <div className="inline-flex items-center gap-2 rounded-full border border-fruition-100 bg-fruition-50 px-3 py-1 text-xs font-medium text-fruition-800">
            <ClipboardCheck className="size-3.5" />
            New company workspace
          </div>

          <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-950">
            Create your company account
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Set up your FruitionHR workspace in minutes and bring HR, payroll,
            approvals, and performance records into one place.
          </p>

          <div className="mt-6">
            <RegisterForm />
          </div>

          <div className="mt-6 grid gap-3 rounded-lg border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-700">
            <div className="flex items-center gap-2">
              <Building2 className="size-4 text-fruition-700" />
              Company structure, roles, and permissions are ready to grow with
              you.
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-fruition-700" />
              Your first owner account is created securely with your workspace.
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already registered?{" "}
            <Link
              href="/login"
              className="font-medium text-fruition-700 underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
