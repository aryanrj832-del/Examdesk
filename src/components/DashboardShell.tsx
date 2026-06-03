"use client";

import { BackButton } from "@/components/BackButton";
import { BrandHeader } from "@/components/BrandHeader";
import { PageChrome } from "@/components/PageChrome";
import { LogoutButton } from "@/components/LogoutButton";

type Props = {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
};

export function DashboardShell({ children, title, subtitle }: Props) {
  return (
    <PageChrome>
      <main className="mx-auto max-w-5xl px-4 pb-12 pt-16 sm:pt-20">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <BackButton href="/" label="Back to login" />
          <LogoutButton />
        </div>

        <div className="mb-8">
          <BrandHeader showAtria compact />
          {title ? (
            <h2 className="mt-6 text-center text-xl font-bold text-[var(--text-primary)]">{title}</h2>
          ) : null}
          {subtitle ? (
            <p className="mt-1 text-center text-sm text-[var(--text-muted)]">{subtitle}</p>
          ) : null}
        </div>

        {children}
      </main>
    </PageChrome>
  );
}
