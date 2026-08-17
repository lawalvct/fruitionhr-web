"use client";

import { Lock, ShieldAlert } from "lucide-react";

import { cn } from "@/lib/utils";
import type { TicketMessage } from "./types";

function formatWhen(value: string | null): string {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

/**
 * The conversation, shared by both surfaces.
 *
 * Internal notes are visually unmistakable — an agent must never mistake a
 * private note for something the customer can read. The tenant API strips them
 * out entirely, so this styling is a second line of defence, not the first.
 */
export function TicketThread({
  messages,
  emptyLabel = "No messages yet.",
}: {
  messages: TicketMessage[];
  emptyLabel?: string;
}) {
  if (messages.length === 0) {
    return <p className="py-6 text-center text-sm text-slate-500">{emptyLabel}</p>;
  }

  return (
    <ol className="space-y-3">
      {messages.map((message) => {
        const fromAgent = message.author_type === "agent";

        return (
          <li
            key={message.id}
            className={cn(
              "rounded-xl border p-4",
              message.is_internal
                ? "border-amber-300 border-dashed bg-amber-50"
                : fromAgent
                  ? "border-fruition-200 bg-fruition-50/60"
                  : "border-slate-200 bg-white",
            )}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-slate-900">
                {message.author?.name ?? (fromAgent ? "Support" : "Unknown")}
              </span>

              {message.is_internal ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-bold tracking-wide text-amber-900 uppercase">
                  <Lock className="size-3" /> Internal note
                </span>
              ) : (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase",
                    fromAgent
                      ? "bg-fruition-600 text-white"
                      : "bg-slate-100 text-slate-600",
                  )}
                >
                  {fromAgent ? "Support" : "Customer"}
                </span>
              )}

              <span className="ml-auto text-xs text-slate-400">
                {formatWhen(message.created_at)}
              </span>
            </div>

            {message.is_internal && (
              <p className="mt-1 flex items-center gap-1 text-xs text-amber-800">
                <ShieldAlert className="size-3.5" /> Only visible to platform staff
              </p>
            )}

            <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap text-slate-700">
              {message.body}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
