"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Pencil, X } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";

type StudentData = {
  usn: string;
  fullName: string;
  email: string;
  profileImageUrl: string;
  program: string | null;
  section: string | null;
  hallTicketNumber: string | null;
  hallRoom: string | null;
  seatNumber: string | null;
  answerSheetCode: string;
  hasSeat: boolean;
};

export function StudentHallTicket() {
  const [data, setData] = useState<StudentData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savingPhoto, setSavingPhoto] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/student/me");
      const json = (await res.json()) as StudentData | { error?: string };
      if (!res.ok) {
        setError((json as { error?: string }).error ?? "Could not load profile");
        return;
      }
      setData(json as StudentData);
    })();
  }, []);

  async function savePhoto(url: string) {
    setSavingPhoto(true);
    setPhotoError(null);
    const res = await fetch("/api/student/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileImageUrl: url }),
    });
    const json = (await res.json()) as { ok?: boolean; error?: string; profileImageUrl?: string };
    setSavingPhoto(false);
    if (!res.ok) {
      setPhotoError(json.error ?? "Photo update failed");
      return;
    }
    setData((current) => (current ? { ...current, profileImageUrl: json.profileImageUrl ?? url } : current));
  }

  async function handlePhotoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    setPhotoError(null);

    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const json = (await res.json()) as { url?: string; error?: string };
      setUploadingPhoto(false);
      if (!res.ok) {
        setPhotoError(json.error ?? "Upload failed");
        return;
      }
      if (json.url) {
        await savePhoto(json.url);
      }
    } catch (error) {
      setUploadingPhoto(false);
      setPhotoError(error instanceof Error ? error.message : "Upload failed");
    } finally {
      e.target.value = "";
    }
  }

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  function removePhoto() {
    void savePhoto("/default-avatar.svg");
  }

  return (
    <DashboardShell title="Student portal" subtitle="Your profile and hall ticket">
      {error ? (
        <p className="neu-panel p-4 text-center text-sm text-amber-800 dark:text-amber-200">{error}</p>
      ) : null}

      {!data && !error ? (
        <p className="py-10 text-center text-sm text-[var(--text-muted)]">Loading…</p>
      ) : null}

      {data ? (
        <>
          <div className="neu-panel mx-auto mb-6 flex max-w-xl flex-col items-center gap-4 p-6 sm:flex-row sm:items-start">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border border-[var(--neu-shadow)] bg-[var(--surface)]">
              <Image
                src={data.profileImageUrl}
                alt={data.fullName}
                fill
                className="object-cover"
                unoptimized={data.profileImageUrl.startsWith("/uploads")}
              />
              <div className="absolute inset-0 bg-black/10" />
              <div className="absolute right-2 top-2 flex items-center gap-2 rounded-full bg-white/90 p-1 shadow-sm">
                <button
                  type="button"
                  onClick={openFilePicker}
                  disabled={savingPhoto || uploadingPhoto}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--brand-teal)] text-white transition hover:bg-[var(--brand-teal-dark)]"
                  aria-label="Replace profile photo"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                {data.profileImageUrl ? (
                  <button
                    type="button"
                    onClick={removePhoto}
                    disabled={savingPhoto || uploadingPhoto}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[var(--text-muted)] border border-[var(--neu-shadow)]"
                    aria-label="Remove profile photo"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                disabled={savingPhoto || uploadingPhoto}
                onChange={handlePhotoFile}
              />
            </div>
            <div className="text-center sm:text-left">
              <p className="text-lg font-bold">{data.fullName}</p>
              <p className="font-mono text-sm text-[var(--text-muted)]">{data.usn}</p>
              {data.email ? (
                <p className="mt-2 text-sm text-[var(--brand-teal)]">{data.email}</p>
              ) : (
                <p className="mt-2 text-xs text-[var(--text-muted)]">No email on file</p>
              )}
              {data.program ? (
                <p className="mt-1 text-xs text-[var(--text-muted)]">{data.program}</p>
              ) : null}
              {data.section ? (
                <p className="mt-1 text-xs text-[var(--text-muted)]">Section {data.section}</p>
              ) : null}
            </div>
          </div>

          <div className="neu-panel mx-auto mb-6 max-w-xl p-6">
            <h3 className="mb-4 text-center font-semibold">Edit profile photo</h3>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-[var(--text-muted)]">
                Upload a new profile photo and it will appear in your portal immediately.
              </div>
              <div className="max-w-xs sm:max-w-sm">
                <button
                  type="button"
                  onClick={openFilePicker}
                  disabled={savingPhoto || uploadingPhoto}
                  className="neu-btn w-full rounded-xl px-4 py-2 text-sm font-semibold"
                >
                  {uploadingPhoto || savingPhoto ? "Processing…" : data.profileImageUrl ? "Replace photo" : "Upload photo"}
                </button>
                <p className="mt-2 text-xs text-[var(--text-muted)]">
                  Click the pencil icon on the profile photo to replace it. Use the cancel icon to remove the photo.
                </p>
                {photoError ? <p className="mt-2 text-xs text-red-600">{photoError}</p> : null}
              </div>
            </div>
          </div>

          {data.hasSeat ? (
            <div className="neu-panel mx-auto max-w-xl p-6">
              <h3 className="mb-4 text-center font-semibold">Hall ticket</h3>
              <dl className="grid grid-cols-1 gap-5 text-sm">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                    Hall ticket no.
                  </dt>
                  <dd className="mt-1 font-mono text-lg font-bold text-[var(--brand-teal)]">
                    {data.hallTicketNumber}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                    Allotted hall / seat no.
                  </dt>
                  <dd className="mt-1 text-base font-semibold">
                    {data.hallRoom ? data.hallRoom : "Not assigned"}
                    {data.seatNumber ? ` / ${data.seatNumber}` : ""}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                    Answer sheet code
                  </dt>
                  <dd className="mt-1 font-mono text-sm">{data.answerSheetCode}</dd>
                </div>
              </dl>
            </div>
          ) : (
            <p className="neu-panel mx-auto max-w-xl p-4 text-center text-sm text-[var(--text-muted)]">
              Hall ticket not published yet. Contact the examination section.
            </p>
          )}
        </>
      ) : null}
    </DashboardShell>
  );
}
