"use client";

import { useState } from "react";

type Props = {
  disabled?: boolean;
  onResult: (hall: string) => void;
};

export function SpinWheel({ disabled, onResult }: Props) {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);

  async function spin() {
    if (spinning || disabled) return;
    setSpinning(true);
    const extra = 360 * 6 + Math.random() * 360;
    setRotation((r) => r + extra);

    window.setTimeout(async () => {
      try {
        const res = await fetch("/api/teacher/spin", { method: "POST" });
        const data = (await res.json()) as {
          hallRoom?: string;
          alreadyAssigned?: boolean;
          error?: string;
        };
        setSpinning(false);
        if (!res.ok) {
          onResult("");
          alert(data.error ?? "Could not assign a hall");
          return;
        }
        if (data.hallRoom) {
          onResult(data.hallRoom);
        }
      } catch {
        setSpinning(false);
        onResult("");
        alert("Network error");
      }
    }, 3200);
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className="relative h-56 w-56 rounded-full border-4 border-emerald-600 shadow-lg"
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: spinning ? "transform 3s cubic-bezier(0.12, 0.65, 0.18, 1)" : "none",
          background:
            "conic-gradient(#bbf7d0 0 60deg, #34d399 60deg 120deg, #6ee7b7 120deg 180deg, #10b981 180deg 240deg, #34d399 240deg 300deg, #bbf7d0 300deg 360deg)",
        }}
      >
        <div className="absolute left-1/2 top-[-18px] z-10 h-0 w-0 -translate-x-1/2 border-l-[12px] border-r-[12px] border-t-[18px] border-l-transparent border-r-transparent border-t-zinc-900" />
        <div className="absolute inset-8 rounded-full bg-white/90 dark:bg-zinc-950/90" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="max-w-[8rem] text-center text-xs font-semibold text-emerald-900">
            Invigilation draw
          </span>
        </div>
      </div>
      <button
        type="button"
        disabled={disabled || spinning}
        onClick={() => void spin()}
        className="login-btn rounded-xl px-6 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {spinning ? "Drawing…" : "Spin & assign hall"}
      </button>
      <p className="max-w-md text-center text-xs text-zinc-500">
        Each spin claims one uploaded hall. Rooms already taken are locked for other teachers.
      </p>
    </div>
  );
}
