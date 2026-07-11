import Image from "next/image";
import Link from "next/link";

import { AuthSidePanel } from "@/features/auth/auth-side-panel";
import { RegisterForm } from "@/features/auth/register-form";

export const metadata = { title: "Create your company account" };

export default function RegisterPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr] xl:grid-cols-2">
      <AuthSidePanel />

      <main className="flex items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">
          {/* brand — shown on mobile since the side panel is hidden */}
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

          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Create your company account
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Set up your FruitionHR workspace in minutes — no card required.
          </p>

          <div className="mt-6">
            <RegisterForm />
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
