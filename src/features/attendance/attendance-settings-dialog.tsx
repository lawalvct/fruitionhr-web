"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  type AttendanceSettings,
  useAttendanceSettings,
  useSaveAttendanceSettings,
} from "@/features/attendance/use-attendance";
import { apiErrorMessage } from "@/lib/api";

const defaults: AttendanceSettings = { self_clock_enabled: true, kiosk_enabled: true };

export function AttendanceSettingsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data, isLoading } = useAttendanceSettings(open);
  const save = useSaveAttendanceSettings();
  const [form, setForm] = useState<AttendanceSettings>(defaults);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const submit = async () => {
    try {
      await save.mutateAsync(form);
      toast.success("Attendance settings saved.");
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Attendance settings</SheetTitle>
          <SheetDescription>
            Control how employees are allowed to mark their own attendance. HR&apos;s manual entry and Excel
            import always stay available regardless of these settings.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-4 pb-6">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading settings...</p>
          ) : (
            <>
              <label className="flex items-start gap-3 rounded-lg border p-4">
                <input
                  type="checkbox"
                  className="mt-0.5 size-4 accent-fruition-700"
                  checked={form.self_clock_enabled}
                  onChange={(event) => setForm({ ...form, self_clock_enabled: event.target.checked })}
                />
                <span>
                  <span className="block text-sm font-semibold">Employee self clock-in/out</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    Lets employees clock themselves in and out from their own ESS attendance tab.
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-3 rounded-lg border p-4">
                <input
                  type="checkbox"
                  className="mt-0.5 size-4 accent-fruition-700"
                  checked={form.kiosk_enabled}
                  onChange={(event) => setForm({ ...form, kiosk_enabled: event.target.checked })}
                />
                <span>
                  <span className="block text-sm font-semibold">QR kiosk scanning</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    Lets a shared kiosk display a scannable QR code for clock-in/out. Turning this off stops
                    new codes from being generated on any kiosk display.
                  </span>
                </span>
              </label>

              <div className="flex justify-end pt-1">
                <Button type="button" onClick={() => void submit()} disabled={save.isPending}>
                  {save.isPending ? "Saving..." : "Save settings"}
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
