import Image from "next/image";
import Link from "next/link";
import { KeyRound } from "lucide-react";

import { AuthSidePanel } from "@/features/auth/auth-side-panel";
import { ForgotPasswordForm } from "@/features/auth/forgot-password-form";

export const metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-[1.05fr_1fr] xl:grid-cols-2">
      <AuthSidePanel />

      <main className="flex items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <Link href="/login" className="mb-8 flex items-center gap-2 lg:hidden">
            <Image src="/fruitionhr-logo-icon.svg" alt="" width={36} height={36} priority />
            <span className="text-lg font-extrabold tracking-tight text-fruition-900">
              Fruition<span className="text-fruition-500">HR</span>
            </span>
          </Link>

          <div className="inline-flex items-center gap-2 rounded-full border border-fruition-100 bg-fruition-50 px-3 py-1 text-xs font-medium text-fruition-800">
            <KeyRound className="size-3.5" />
            Account recovery
          </div>

          <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-950">
            Forgot your password?
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Enter the email you sign in with and we&apos;ll send you a link to choose a new
            password.
          </p>

          <div className="mt-7">
            <ForgotPasswordForm />
          </div>
        </div>
      </main>
    </div>
  );
}
