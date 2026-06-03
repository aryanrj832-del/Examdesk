"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  onCaptured: (value: string) => void;
  onClose: () => void;
  prompt?: string;
};

function toBase64Url(bytes: Uint8Array) {
  let str = "";
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

export function BiometricScanner({ onCaptured, onClose, prompt }: Props) {
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // focus the keyboard input when modal opens
    inputRef.current?.focus();
  }, []);

  async function handleWebAuthn() {
    setError(null);
    try {
      if (!window.navigator.credentials || !window.PublicKeyCredential) {
        setError("WebAuthn not supported in this browser");
        return;
      }

      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);
      const userId = new Uint8Array(16);
      crypto.getRandomValues(userId);

      const publicKey: any = {
        challenge,
        rp: { name: "Examdesk" },
        user: { id: userId, name: "user", displayName: "user" },
        pubKeyCredParams: [{ alg: -7, type: "public-key" }],
        timeout: 60000,
        authenticatorSelection: { userVerification: "preferred" },
        attestation: "direct",
      };

      const cred: any = await navigator.credentials.create({ publicKey });
      if (!cred) throw new Error("No credential created");
      const rawId = new Uint8Array(cred.rawId as ArrayBuffer);
      const id = toBase64Url(rawId);
      onCaptured(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  function handleKeyboardSubmit(e: React.FormEvent) {
    e.preventDefault();
    const v = inputRef.current?.value.trim();
    if (!v) {
      setError("No input captured");
      return;
    }
    onCaptured(v);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl dark:bg-zinc-950">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Capture biometric</h3>
          <button type="button" className="text-sm text-zinc-500" onClick={onClose}>
            Close
          </button>
        </div>

        <p className="text-xs text-[var(--text-muted)]">{prompt ?? "Use a connected biometric scanner (keyboard wedge) or use device fingerprint."}</p>

        <form onSubmit={handleKeyboardSubmit} className="mt-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs text-[var(--text-muted)]">Scanner input (type/scan then press Enter)</span>
            <input ref={inputRef} className="neu-input w-full rounded-xl px-3 py-2 text-sm" />
          </label>
          <div className="mt-3 flex gap-2">
            <button type="submit" className="login-btn rounded-xl px-3 py-1 text-sm text-white">
              Accept scanned value
            </button>
            <button type="button" className="neu-btn rounded-xl px-3 py-1 text-sm" onClick={handleWebAuthn}>
              Use device fingerprint (WebAuthn)
            </button>
          </div>
        </form>

        {error ? <p className="mt-3 text-xs text-red-600">{error}</p> : null}
      </div>
    </div>
  );
}
