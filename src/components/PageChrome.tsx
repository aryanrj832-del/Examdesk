"use client";

import { ThemeToggle } from "@/components/ThemeToggle";

type Props = {
  children: React.ReactNode;
  showThemeToggle?: boolean;
};

export function PageChrome({ children, showThemeToggle = true }: Props) {
  return (
    <div className="relative min-h-screen bg-[var(--surface)] text-[var(--text-primary)]">
      {showThemeToggle ? (
        <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
          <ThemeToggle />
        </div>
      ) : null}
      {children}
    </div>
  );
}
