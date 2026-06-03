"use client";

import { startTransition, useCallback, useEffect, useState } from "react";
import { SpinWheel } from "@/components/SpinWheel";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { DashboardShell } from "@/components/DashboardShell";

type StudentRow = {
  userId: string;
  usn: string;
  name: string;
  hallTicket: string;
  hallRoom: string;
  answerSheetCode: string;
  biometricId: string | null;
  present: boolean;
  scannedCode: string;
  attendanceBiometricId: string;
  submitted: boolean;
};

type RoomApi = {
  profile: { fullName: string; department: string; imageUrl: string };
  hallRoom: string | null;
};

type DraftOverride = {
  present?: boolean;
  scannedCode?: string;
  biometricId?: string;
};

export function TeacherDesk() {
  const [room, setRoom] = useState<RoomApi | null>(null);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [needsAssignment, setNeedsAssignment] = useState(true);
  const [hallRoom, setHallRoom] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scanFor, setScanFor] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<Record<string, DraftOverride>>({});

  const load = useCallback(async () => {
    const r1 = await fetch("/api/teacher/room");
    const roomJson = (await r1.json()) as unknown;

    if (!r1.ok) {
      startTransition(() => {
        const err = roomJson as { error?: string };
        setError(err.error ?? "Could not load profile");
        setLoading(false);
      });
      return;
    }

    const rr = roomJson as RoomApi;

    const r2 = await fetch("/api/teacher/students");
    const stuJson = (await r2.json()) as
      | { students: StudentRow[]; hallRoom: string | null; needsAssignment?: boolean; error?: string }
      | { error?: string };

    startTransition(() => {
      setError(null);
      setRoom(rr);
      if (rr.hallRoom) {
        setHallRoom(rr.hallRoom);
      }

      if (!r2.ok || !("students" in stuJson)) {
        setError((stuJson as { error?: string }).error ?? "Could not load roster");
        setStudents([]);
        setLoading(false);
        return;
      }

      setStudents(stuJson.students);
      setHallRoom(stuJson.hallRoom ?? rr.hallRoom);
      setNeedsAssignment(Boolean(stuJson.needsAssignment));
      setDraft({});
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function presentFor(s: StudentRow) {
    const o = draft[s.userId];
    return o?.present ?? s.present;
  }

  function scannedFor(s: StudentRow) {
    const o = draft[s.userId];
    const v = o?.scannedCode ?? s.scannedCode;
    return v ?? "";
  }

  function setPresent(userId: string, present: boolean) {
    setDraft((d) => ({
      ...d,
      [userId]: { ...d[userId], present },
    }));
  }

  function setScan(userId: string, code: string) {
    setDraft((d) => {
      const row = students.find((s) => s.userId === userId);
      const present = d[userId]?.present ?? row?.present ?? false;
      return {
        ...d,
        [userId]: { ...d[userId], present, scannedCode: code },
      };
    });
  }

  function setBiometric(userId: string, biometricId: string) {
    setDraft((d) => ({
      ...d,
      [userId]: { ...d[userId], biometricId },
    }));
  }

  async function submit() {
    setBusy(true);
    setError(null);
    const rows = students.map((s) => ({
      studentUserId: s.userId,
      present: presentFor(s),
      scannedCode: scannedFor(s),
      biometricId: draft[s.userId]?.biometricId?.trim() || s.attendanceBiometricId || s.biometricId || null,
    }));

    if (rows.some((row) => row.present && !row.biometricId)) {
      startTransition(() => {
        setError("Biometric scan is required for every present student.");
        setBusy(false);
      });
      return;
    }

    const res = await fetch("/api/teacher/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      startTransition(() => {
        setError(data?.error ?? "Save failed");
        setBusy(false);
      });
      return;
    }

    setBusy(false);
    await load();
    window.open("/api/teacher/export", "_blank", "noopener,noreferrer");
  }

  const effectiveHall = room ? (hallRoom ?? room.hallRoom) : null;

  if (loading) {
    return (
      <DashboardShell title="Teacher portal">
        <p className="text-center text-sm text-[var(--text-muted)]">Loading teacher workspace…</p>
      </DashboardShell>
    );
  }

  if (!room) {
    return (
      <DashboardShell title="Teacher portal">
        <p className="text-center text-sm text-red-600">Could not load your profile.</p>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title={room.profile.fullName} subtitle={room.profile.department}>
      <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-center justify-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={room.profile.imageUrl}
            alt="Profile"
            className="neu-panel h-24 w-24 shrink-0 rounded-2xl object-cover p-1"
          />
            {effectiveHall ? (
              <p className="rounded-full bg-[var(--brand-teal)]/15 px-4 py-1.5 text-xs font-semibold text-[var(--brand-teal)]">
                Assigned hall: {effectiveHall}
              </p>
            ) : null}
      </header>

      {needsAssignment && !effectiveHall ? (
        <section className="neu-panel border border-dashed border-[var(--brand-teal)]/40 p-6">
          <h2 className="text-center text-lg font-semibold">Draw your invigilation hall</h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-sm text-[var(--text-muted)]">
            The examination section uploads a pool of halls (with optional teacher labels). Your spin reserves one
            hall exclusively; other teachers cannot take the same room.
          </p>
          <div className="mt-6 flex justify-center">
            <SpinWheel
              disabled={Boolean(effectiveHall)}
              onResult={(hall) => {
                if (hall) {
                  void load();
                }
              }}
            />
          </div>
        </section>
      ) : null}

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
          {error}
        </p>
      ) : null}

      {!needsAssignment && students.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">
          No students are seated in this hall yet. Ask the examination section to publish seating.
        </p>
      ) : null}

      {students.length > 0 ? (
        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Students in your hall</h2>
            <button
              type="button"
              disabled={busy}
              onClick={() => void submit()}
              className="login-btn rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Save & download Excel
            </button>
          </div>
          <div className="neu-panel overflow-x-auto p-2">
            <table className="min-w-full divide-y divide-[var(--neu-shadow)] text-sm">
              <thead className="bg-[var(--surface)]/80">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Present</th>
                  <th className="px-3 py-2 text-left font-medium">USN</th>
                  <th className="px-3 py-2 text-left font-medium">Name</th>
                  <th className="px-3 py-2 text-left font-medium">Hall ticket</th>
                  <th className="px-3 py-2 text-left font-medium">Answer sheet code</th>
                  <th className="px-3 py-2 text-left font-medium">Biometric scan</th>
                  <th className="px-3 py-2 text-left font-medium">Scanned</th>
                  <th className="px-3 py-2 text-left font-medium">Scan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--neu-shadow)]">
                {students.map((s) => (
                  <tr key={s.userId}>
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={presentFor(s)}
                        onChange={(e) => setPresent(s.userId, e.target.checked)}
                      />
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">{s.usn}</td>
                    <td className="px-3 py-2">{s.name}</td>
                    <td className="px-3 py-2 font-mono text-xs">{s.hallTicket}</td>
                    <td className="px-3 py-2 font-mono text-xs">{s.answerSheetCode}</td>
                    <td className="px-3 py-2">
                        <input
                          className="neu-input w-full rounded-xl border px-2 py-1 text-xs bg-white/50"
                          readOnly
                          value={(draft[s.userId]?.biometricId ?? s.attendanceBiometricId) || s.biometricId || ""}
                          placeholder={presentFor(s) ? "Scan required" : s.biometricId ? "Expected" : "Optional"}
                        />
                      {presentFor(s) && !(draft[s.userId]?.biometricId?.trim() || s.attendanceBiometricId || s.biometricId) ? (
                        <p className="mt-1 text-xs text-red-600">Biometric scan is required to mark present.</p>
                      ) : null}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">
                      {scannedFor(s) || <span className="text-zinc-400">—</span>}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        className="text-xs font-semibold text-[var(--brand-teal)] hover:underline"
                        onClick={() => setScanFor(s.userId)}
                      >
                        Scan barcode
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            Saving writes attendance to the database and downloads an Excel workbook with every student in this room,
            including barcode values and biometric IDs where provided.
          </p>
        </section>
      ) : null}

      {scanFor ? (
        <BarcodeScanner
          onDecoded={(value) => {
            setScan(scanFor, value);
            setScanFor(null);
          }}
          onClose={() => setScanFor(null)}
        />
      ) : null}
      </div>
    </DashboardShell>
  );
}
