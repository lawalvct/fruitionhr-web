"use client";

import type { ReactNode } from "react";

import { usePageTitle } from "@/components/page-title-context";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  usePageTitle(title);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      {description && <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>}
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
