"use client";

import { useState } from "react";
import { Eye, EyeOff, X } from "lucide-react";
import type { PortalRole } from "@/components/PortalLoginForm";

type Props = {
  role: PortalRole;
  onClose: () => void;
};

type Step = "email" | "code" | "password" | "done";

export function ForgotPasswordModal({ role, onClose }: Props) {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    const res = await fetch("/api/auth/forgot-password/send-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role }),
    });
    const json = (await res.json()) as { message?: string; error?: string; devHint?: boolean };
    setBusy(false);
    if (!res.ok) {
      setError(json.error ?? "Could not send code");
      return;
    }
    setInfo(
      json.message +
        (json.devHint ? " (Development: also check the terminal running npm run dev.)" : "")
    );
    setStep("code");
  }

  function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    if (code.trim().length !== 6) {
      setError("Enter the 6-digit code from your email");
      return;
    }
    setError(null);
    setStep("password");
  }

  async function resetPassword(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/auth/forgot-password/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        role,
        code: code.trim(),
        password,
        confirmPassword,
      }),
    });
    const json = (await res.json()) as { message?: string; error?: string };
    setBusy(false);
    if (!res.ok) {
      setError(json.error ?? "Could not reset password");
      return;
    }
    setInfo(json.message ?? "Password updated");
    setStep("done");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="neu-panel relative w-full max-w-md p-6">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-[var(--text-muted)] hover:text-[var(--brand-teal)]"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <h3 className="text-lg font-bold text-[var(--text-primary)]">Forgot password</h3>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Use the email registered by the examination section for this portal.
        </p>

        {step === "email" ? (
          <form onSubmit={sendCode} className="mt-4 flex flex-col gap-3">
            <input
              type="email"
              required
              placeholder="Registered email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="neu-input rounded-xl px-4 py-3 text-sm outline-none"
            />
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <button type="submit" disabled={busy} className="login-btn rounded-xl py-2.5 text-sm font-bold text-white disabled:opacity-50">
              {busy ? "Sending…" : "Send verification code"}
            </button>
          </form>
        ) : null}

        {step === "code" ? (
          <form onSubmit={verifyCode} className="mt-4 flex flex-col gap-3">
            {info ? <p className="text-xs text-[var(--brand-teal)]">{info}</p> : null}
            <input
              inputMode="numeric"
              maxLength={6}
              required
              placeholder="6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="neu-input rounded-xl px-4 py-3 text-center font-mono text-lg tracking-widest outline-none"
            />
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <button type="submit" className="login-btn rounded-xl py-2.5 text-sm font-bold text-white">
              Continue
            </button>
            <button type="button" className="text-xs text-[var(--text-muted)] underline" onClick={() => setStep("email")}>
              Resend code
            </button>
          </form>
        ) : null}

        {step === "password" ? (
          <form onSubmit={resetPassword} className="mt-4 flex flex-col gap-3">
            <div className="neu-input flex items-center gap-2 rounded-xl px-4 py-3">
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent text-sm outline-none"
              />
              <button type="button" onClick={() => setShowPassword((v) => !v)} aria-label="Toggle password">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <div className="neu-input flex items-center gap-2 rounded-xl px-4 py-3">
              <input
                type={showConfirm ? "text" : "password"}
                required
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-transparent text-sm outline-none"
              />
              <button type="button" onClick={() => setShowConfirm((v) => !v)} aria-label="Toggle confirm password">
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <button type="submit" disabled={busy} className="login-btn rounded-xl py-2.5 text-sm font-bold text-white disabled:opacity-50">
              {busy ? "Updating…" : "Submit new password"}
            </button>
          </form>
        ) : null}

        {step === "done" ? (
          <div className="mt-4">
            <p className="text-sm text-[var(--brand-teal)]">{info}</p>
            <button type="button" onClick={onClose} className="login-btn mt-4 w-full rounded-xl py-2.5 text-sm font-bold text-white">
              Back to login
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
