"use client";

import { useState } from "react";
import Image from "next/image";

type Props = {
  label: string;
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
};

export function ImageUploadField({ label, value, onChange, disabled }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const json = (await res.json()) as { url?: string; error?: string };
    setUploading(false);
    if (!res.ok) {
      setError(json.error ?? "Upload failed");
      return;
    }
    if (json.url) onChange(json.url);
    e.target.value = "";
  }

  const preview = value || "/default-avatar.svg";

  return (
    <div className="flex flex-col gap-2 text-sm">
      <span className="font-medium">{label}</span>
      <div className="flex flex-wrap items-center gap-4">
        <div className="neu-panel relative h-20 w-20 overflow-hidden rounded-xl">
          <Image src={preview} alt="Preview" fill className="object-cover" unoptimized={preview.startsWith("/uploads")} />
        </div>
        <label className="neu-btn cursor-pointer rounded-xl px-4 py-2 text-xs font-semibold">
          {uploading ? "Uploading…" : "Upload photo"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            disabled={disabled || uploading}
            onChange={(e) => void onFile(e)}
          />
        </label>
        {value ? (
          <button
            type="button"
            className="text-xs text-[var(--text-muted)] underline"
            onClick={() => onChange("")}
          >
            Remove
          </button>
        ) : null}
      </div>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
