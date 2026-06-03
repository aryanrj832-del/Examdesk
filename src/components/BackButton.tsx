"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type Props = {
  href?: string;
  label?: string;
};

export function BackButton({ href = "/", label = "Back" }: Props) {
  return (
    <Link
      href={href}
      className="neu-btn inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-[var(--text-muted)] transition hover:text-[var(--brand-teal)]"
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Link>
  );
}
