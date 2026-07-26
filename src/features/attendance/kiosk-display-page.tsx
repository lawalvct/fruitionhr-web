"use client";

import { QrCode } from "lucide-react";
import { useEffect, useState } from "react";
import QRCode from "react-qr-code";

import { useKiosks, useKioskToken } from "@/features/attendance/use-attendance";

export function KioskDisplayPage({ kioskId }: { kioskId: number }) {
  const { data: kiosks, isLoading: kiosksLoading } = useKiosks(true);
  const { data: tokenData, isLoading: tokenLoading, isError } = useKioskToken(kioskId, true);

  const [origin, setOrigin] = useState<string | null>(null);
  useEffect(() => setOrigin(window.location.origin), []);

  const kiosk = kiosks?.find((item) => item.id === kioskId);
  const qrValue =
    origin && tokenData ? `${origin}/self-service/attendance?kiosk_token=${tokenData.token}` : null;

  if (!kiosksLoading && !kiosk) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 text-white">
        <p className="text-lg">Kiosk not found.</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-slate-950 px-6 text-center text-white">
      <div>
        <p className="text-sm font-medium tracking-wide text-slate-400 uppercase">Attendance kiosk</p>
        <h1 className="mt-1 text-3xl font-bold">{kiosk?.name ?? "Loading..."}</h1>
        {kiosk?.location && <p className="mt-1 text-slate-400">{kiosk.location}</p>}
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-xl">
        {qrValue ? (
          <QRCode value={qrValue} size={280} />
        ) : (
          <div className="grid size-[280px] place-items-center text-slate-400">
            {isError ? "Couldn't load a code — retrying..." : <QrCode className="size-16 animate-pulse" />}
          </div>
        )}
      </div>

      <p className="max-w-sm text-slate-300">
        Scan this code with your phone to clock in or out. You&apos;ll need to be logged in to your account.
      </p>
      {tokenLoading && <p className="text-xs text-slate-500">Refreshing code...</p>}
    </div>
  );
}
