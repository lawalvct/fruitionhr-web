"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";

const PageTitleContext = createContext<((title: string | null) => void) | null>(null);

export function PageTitleProvider({
  onTitleChange,
  children,
}: {
  onTitleChange: (title: string | null) => void;
  children: ReactNode;
}) {
  return <PageTitleContext.Provider value={onTitleChange}>{children}</PageTitleContext.Provider>;
}

export function usePageTitle(title: string) {
  const setPageTitle = useContext(PageTitleContext);

  useEffect(() => {
    setPageTitle?.(title);
    return () => setPageTitle?.(null);
  }, [setPageTitle, title]);
}
