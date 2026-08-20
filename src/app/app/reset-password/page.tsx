import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { ShieldCheck } from "lucide-react";

import { AuthSidePanel } from "@/features/auth/auth-side-panel";
import { PageLoader } from "@/components/page-loader";
import { ResetPasswordForm } from "@/features/auth/reset-password-form";

export const metadata = { title: "Reset password" };

export default function ResetPasswordPage() {
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
            <ShieldCheck className="size-3.5" />
            Account recovery
          </div>

          <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-950">
            Set a new password
          </h1>

          <div className="mt-7">
            {/* useSearchParams needs a Suspense boundary to stay statically rendered. */}
            <Suspense fallback={<PageLoader label="Checking your link…" />}>
              <ResetPasswordForm />
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  );
}
