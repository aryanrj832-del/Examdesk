"use client";

import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, Headphones, Lock, User } from "lucide-react";
import { BrandHeader } from "@/components/BrandHeader";
import { BackButton } from "@/components/BackButton";
import { ForgotPasswordModal } from "@/components/ForgotPasswordModal";

export type PortalRole = "STUDENT" | "TEACHER" | "ADMIN";

const ROLES: { id: PortalRole; label: string }[] = [
  { id: "STUDENT", label: "STUDENT" },
  { id: "TEACHER", label: "TEACHER" },
  { id: "ADMIN", label: "EXAMINATION SECTION" },
];

const ROLE_PATHS: Record<PortalRole, string> = {
  STUDENT: "/student/dashboard",
  TEACHER: "/teacher/dashboard",
  ADMIN: "/exam/dashboard",
};

type Props = {
  initialRole?: PortalRole;
  showBack?: boolean;
  backHref?: string;
};

export function PortalLoginForm({
  initialRole = "STUDENT",
  showBack = false,
  backHref = "/",
}: Props) {
  const [role, setRole] = useState<PortalRole>(initialRole);
  const prevRole = useRef(initialRole);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  useEffect(() => {
    if (prevRole.current !== role) {
      prevRole.current = role;
      setUsername("");
      setPassword("");
      setError(null);
    }
  }, [role]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: username.trim(), password, role }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "Invalid User ID or Password");
      return;
    }
    window.location.href = ROLE_PATHS[role];
  }

  const userIdLabel = role === "STUDENT" ? "USN (User ID)" : "User ID";

  return (
    <div className="mx-auto flex w-full max-w-md flex-col px-4 py-8 sm:py-12">
      {showBack ? (
        <div className="mb-4">
          <BackButton href={backHref} />
        </div>
      ) : null}

      <BrandHeader />

      <div className="mt-8 text-center">
        <h2 className="text-xl font-bold text-[var(--text-primary)]">Welcome!</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Please sign-in to continue</p>
        <div className="mx-auto mt-3 h-1 w-16 rounded-full bg-[var(--brand-teal)]" />
      </div>

      <div className="neu-card mt-8 rounded-full p-1">
        <div className="grid grid-cols-3 gap-1">
          {ROLES.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRole(r.id)}
              className={`rounded-full px-1 py-2.5 text-[10px] font-bold tracking-wide transition sm:text-xs ${
                role === r.id
                  ? "bg-[var(--brand-teal)] text-white shadow-md"
                  : "text-[var(--text-muted)] hover:text-[var(--brand-teal)]"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
        <div className="neu-input flex items-center gap-3 rounded-2xl px-4 py-3">
          <User className="h-5 w-5 shrink-0 text-[var(--text-muted)]" />
          <input
            className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--text-muted)]"
            placeholder={userIdLabel}
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        <div className="neu-input flex items-center gap-3 rounded-2xl px-4 py-3">
          <Lock className="h-5 w-5 shrink-0 text-[var(--text-muted)]" />
          <input
            type={showPassword ? "text" : "password"}
            className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--text-muted)]"
            placeholder="Password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="text-[var(--text-muted)] hover:text-[var(--brand-teal)]"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>

        <div className="text-right">
          <button
            type="button"
            onClick={() => setForgotOpen(true)}
            className="text-xs text-[var(--brand-teal)] underline-offset-2 hover:underline"
          >
            Forgot Password?
          </button>
        </div>

        {error ? (
          <p className="rounded-xl bg-red-100 px-3 py-2 text-center text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="login-btn mt-2 w-full rounded-2xl py-3.5 text-base font-bold text-white shadow-lg transition disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Login"}
        </button>
      </form>

      <footer className="mt-10 flex flex-col items-center gap-2 text-center text-xs text-[var(--text-muted)]">
        <div className="flex items-center gap-2">
          <Headphones className="h-4 w-4" />
          <span>Helpdesk No.:</span>
        </div>
        <p className="font-medium">+91-9430820459 &amp; +91-9523300520</p>
      </footer>

      {forgotOpen ? <ForgotPasswordModal role={role} onClose={() => setForgotOpen(false)} /> : null}
    </div>
  );
}
