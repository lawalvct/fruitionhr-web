import Image from "next/image";
import { Suspense } from "react";

import { PageLoader } from "@/components/page-loader";
import { EssSetupForm } from "@/features/auth/ess-setup-form";

export const metadata = { title: "Set up employee account" };

export default function SetupAccountPage() {
  return <main className="grid min-h-screen place-items-center bg-slate-50 px-5 py-10"><div className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-sm sm:p-8"><Image src="/fruitionhr-logo-full.svg" alt="FruitionHR" width={220} height={77} className="mb-7 h-auto w-44" priority /><Suspense fallback={<PageLoader label="Loading invitation…" />}><EssSetupForm /></Suspense></div></main>;
}
