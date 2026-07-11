import Image from "next/image";
import Link from "next/link";
import { Building2, LockKeyhole, ShieldCheck } from "lucide-react";

import { AuthSidePanel } from "@/features/auth/auth-side-panel";
import { LoginForm } from "@/features/auth/login-form";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
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
            <ShieldCheck className="size-3.5" />
            Secure workspace access
          </div>

          <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-950">
            Welcome back
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Sign in to manage your people, approvals, payroll, and performance
            from one calm workspace.
          </p>

          <div className="mt-7">
            <LoginForm />
          </div>

          <div className="mt-6 grid gap-3 rounded-lg border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-700">
            <div className="flex items-center gap-2">
              <Building2 className="size-4 text-fruition-700" />
              Your company data stays connected across HR workflows.
            </div>
            <div className="flex items-center gap-2">
              <LockKeyhole className="size-4 text-fruition-700" />
              Role permissions keep each workspace view focused.
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            New company?{" "}
            <Link
              href="/register"
              className="font-medium text-fruition-700 underline-offset-4 hover:underline"
            >
              Create an account
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
