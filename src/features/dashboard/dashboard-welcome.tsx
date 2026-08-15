"use client";

import { Dialog } from "@base-ui/react/dialog";
import { ArrowRight, Check, PartyPopper, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

type WelcomeKind = "completed" | "skipped";

export function DashboardWelcome({
  firstName,
  companyName,
}: {
  firstName?: string;
  companyName?: string;
}) {
  const [kind, setKind] = useState<WelcomeKind | null>(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    const welcome = url.searchParams.get("welcome");

    if (welcome !== "completed" && welcome !== "skipped") return;

    url.searchParams.delete("welcome");
    window.history.replaceState(
      window.history.state,
      "",
      url.pathname + url.search + url.hash,
    );
    queueMicrotask(() => setKind(welcome));
  }, []);

  const completed = kind === "completed";

  return (
    <Dialog.Root open={kind !== null} onOpenChange={(open) => !open && setKind(null)}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-fruition-950/45 backdrop-blur-[2px] data-open:animate-in data-open:fade-in-0" />
        <Dialog.Popup className="welcome-dialog fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-fruition-100 bg-white shadow-2xl outline-none">
          <div className="relative overflow-hidden bg-linear-135 from-fruition-950 via-fruition-800 to-fruition-600 px-6 pb-16 pt-7 text-white">
            <div className="pointer-events-none absolute -right-10 -top-16 size-48 rounded-full bg-white/10 blur-2xl" />
            <Dialog.Close
              aria-label="Close welcome message"
              className="absolute right-3 top-3 z-20 grid size-8 place-items-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <X className="size-4" />
            </Dialog.Close>
            <p className="relative text-xs font-semibold uppercase tracking-[0.18em] text-fruition-100/70">
              FruitionHR workspace
            </p>
            <Dialog.Title className="relative mt-2 max-w-sm text-2xl font-bold tracking-tight">
              {completed ? "Your workspace is ready" : "Welcome to your new workspace"}
            </Dialog.Title>
          </div>

          <div className="relative px-6 pb-6">
            <span className="welcome-celebration-icon -mt-9 grid size-18 place-items-center rounded-2xl border-4 border-white bg-fruition-50 text-fruition-700 shadow-lg">
              {completed ? <PartyPopper className="size-8" /> : <Check className="size-8" />}
            </span>
            <Dialog.Description className="mt-5 text-sm leading-6 text-slate-600">
              {completed
                ? `Great work, ${firstName ?? "there"}. ${companyName ?? "Your company"} is configured and ready for your team.`
                : `Welcome, ${firstName ?? "there"}. We prepared a starter workspace for ${companyName ?? "your company"} so you can begin immediately.`}
            </Dialog.Description>
            <div className="mt-6 flex justify-end">
              <Dialog.Close render={<Button size="lg" />}>
                Explore dashboard <ArrowRight className="size-4" />
              </Dialog.Close>
            </div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
