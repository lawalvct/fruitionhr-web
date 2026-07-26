"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Html5Qrcode } from "html5-qrcode";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

const SCAN_REGION_ID = "attendance-qr-scan-region";

/** Pulls the kiosk_token query param out of a decoded kiosk display QR URL. */
function extractKioskToken(decodedText: string): string | null {
  try {
    return new URL(decodedText).searchParams.get("kiosk_token");
  } catch {
    return null;
  }
}

export function QrScanDialog({
  open,
  onOpenChange,
  onScan,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (kioskToken: string) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const handledRef = useRef(false);

  useEffect(() => {
    if (!open) return;

    handledRef.current = false;
    setError(null);
    const scanner = new Html5Qrcode(SCAN_REGION_ID);

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 240 },
        (decodedText) => {
          if (handledRef.current) return;
          const token = extractKioskToken(decodedText);
          if (!token) {
            setError("That doesn't look like a FruitionHR kiosk code. Point the camera at the kiosk screen.");
            return;
          }
          handledRef.current = true;
          onScan(token);
          onOpenChange(false);
        },
        () => {
          // Per-frame "no code found" — expected continuously while aiming.
        },
      )
      .catch(() => setError("Couldn't access the camera. Check your browser's camera permission and try again."));

    return () => {
      scanner
        .stop()
        .catch(() => {})
        .finally(() => scanner.clear());
    };
  }, [open, onOpenChange, onScan]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/20 transition-opacity duration-150" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-md border bg-popover p-4 text-popover-foreground shadow-lg">
          <Dialog.Title className="font-heading text-base font-medium">Scan kiosk QR code</Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-muted-foreground">
            Point your camera at the kiosk screen to clock in or out.
          </Dialog.Description>

          <div id={SCAN_REGION_ID} className="mt-4 overflow-hidden rounded-lg bg-black" />

          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

          <div className="mt-5 flex justify-end">
            <Dialog.Close render={<Button type="button" variant="outline" />}>Cancel</Dialog.Close>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
