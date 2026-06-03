"use client";

export function LogoutButton() {
  return (
    <button
      type="button"
      className="neu-btn rounded-full px-4 py-2 text-sm font-medium text-[var(--text-muted)] transition hover:text-[var(--brand-maroon)]"
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        window.location.href = "/";
      }}
    >
      Sign out
    </button>
  );
}
