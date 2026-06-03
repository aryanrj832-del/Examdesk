"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

type ScannerProps = {
  onDecoded: (value: string) => void;
  onClose: () => void;
};

export function BarcodeScanner({ onDecoded, onClose }: ScannerProps) {
  const regionId = "qr-reader-modal";
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stop = useCallback(async () => {
    const s = scannerRef.current;
    scannerRef.current = null;
    if (!s) return;
    try {
      await s.stop();
    } catch {
      /* ignore */
    }
    try {
      s.clear();
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const html5 = new Html5Qrcode(regionId);
        scannerRef.current = html5;
        await html5.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 260, height: 260 } },
          (decodedText) => {
            void stop();
            onDecoded(decodedText);
          },
          () => {
            /* frame no-op */
          }
        );
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Could not start camera");
        }
      }
    })();
    return () => {
      cancelled = true;
      void stop();
    };
  }, [onDecoded, stop]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-4 shadow-xl dark:bg-zinc-950">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Scan answer sheet barcode</h3>
          <button
            type="button"
            className="text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            onClick={() => {
              void stop();
              onClose();
            }}
          >
            Close
          </button>
        </div>
        <div id={regionId} className="overflow-hidden rounded-xl" />
        {error ? (
          <p className="mt-3 text-sm text-red-600 dark:text-red-300">{error}</p>
        ) : (
          <p className="mt-3 text-xs text-zinc-500">
            Allow camera access. Align the barcode inside the frame; it captures automatically.
          </p>
        )}
      </div>
    </div>
  );
}
