"use client";

import { ExternalLink, Pencil, Plus, QrCode, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  type Kiosk,
  type KioskInput,
  useDeleteKiosk,
  useKiosks,
  useSaveKiosk,
} from "@/features/attendance/use-attendance";
import { apiErrorMessage } from "@/lib/api";

const emptyKiosk: KioskInput = { name: "", location: "", is_active: true };

export function KiosksDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data, isLoading } = useKiosks(open);
  const save = useSaveKiosk();
  const remove = useDeleteKiosk();

  const kiosks = data ?? [];
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<KioskInput>(emptyKiosk);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  const startCreate = () => {
    setEditingId(null);
    setForm(emptyKiosk);
    setShowForm(true);
  };

  const startEdit = (kiosk: Kiosk) => {
    setEditingId(kiosk.id);
    setForm({ name: kiosk.name, location: kiosk.location ?? "", is_active: kiosk.is_active });
    setShowForm(true);
  };

  const submit = async () => {
    if (!form.name.trim()) {
      toast.error("Enter a kiosk name.");
      return;
    }

    try {
      await save.mutateAsync({ id: editingId ?? undefined, input: form });
      toast.success(editingId ? "Kiosk updated." : "Kiosk created.");
      setShowForm(false);
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setShowForm(false);
      setDeleteTarget(null);
    }
    onOpenChange(nextOpen);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>Attendance kiosks</SheetTitle>
          <SheetDescription>
            A kiosk shows a rotating QR code on a shared device (e.g. the entrance tablet). Employees scan it
            with their own phone and confirm clock in/out from their own logged-in session.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 px-4 pb-6">
          {!showForm && (
            <Button type="button" onClick={startCreate} className="w-full sm:w-auto">
              <Plus className="size-4" /> New kiosk
            </Button>
          )}

          {showForm && (
            <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
              <div className="grid gap-2">
                <Label htmlFor="kiosk-name">Kiosk name</Label>
                <Input
                  id="kiosk-name"
                  className="h-10 border-slate-300"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  placeholder="Lagos Reception"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="kiosk-location">Location</Label>
                <Input
                  id="kiosk-location"
                  className="h-10 border-slate-300"
                  value={form.location ?? ""}
                  onChange={(event) => setForm({ ...form, location: event.target.value })}
                  placeholder="Ground floor entrance"
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.is_active ?? true}
                  onChange={(event) => setForm({ ...form, is_active: event.target.checked })}
                />
                Active
              </label>
              <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="button" onClick={() => void submit()} disabled={save.isPending}>
                  {save.isPending ? "Saving..." : editingId ? "Update kiosk" : "Create kiosk"}
                </Button>
              </div>
            </div>
          )}

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading kiosks...</p>
          ) : kiosks.length === 0 ? (
            <div className="rounded-lg border border-dashed px-4 py-10 text-center">
              <QrCode className="mx-auto size-7 text-muted-foreground" />
              <p className="mt-3 text-sm font-semibold">No kiosks yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Create one, then open its display on the shared device at your entrance.
              </p>
            </div>
          ) : (
            <ul className="divide-y rounded-lg border">
              {kiosks.map((kiosk) => (
                <li key={kiosk.id} className="flex items-center justify-between gap-3 px-3 py-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold">{kiosk.name}</p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          kiosk.is_active ? "bg-fruition-50 text-fruition-700" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {kiosk.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    {kiosk.location && <p className="mt-1 text-xs text-muted-foreground">{kiosk.location}</p>}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      render={<a href={`/attendance/kiosk/${kiosk.id}`} target="_blank" rel="noopener noreferrer" />}
                      aria-label={`Open ${kiosk.name} display`}
                      title="Open kiosk display in a new tab"
                    >
                      <ExternalLink className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => startEdit(kiosk)} aria-label={`Edit ${kiosk.name}`} title="Edit kiosk">
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setDeleteTarget(kiosk.id)}
                      aria-label={`Delete ${kiosk.name}`}
                      title="Delete kiosk"
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <ConfirmDialog
          open={deleteTarget !== null}
          onOpenChange={(nextOpen) => !nextOpen && setDeleteTarget(null)}
          title="Delete kiosk?"
          description="The physical display will stop working immediately. Continue?"
          confirmLabel="Delete"
          isPending={remove.isPending}
          onConfirm={async () => {
            if (deleteTarget === null) return;
            try {
              await remove.mutateAsync(deleteTarget);
              toast.success("Kiosk deleted.");
            } catch (error) {
              toast.error(apiErrorMessage(error));
            } finally {
              setDeleteTarget(null);
            }
          }}
        />
      </SheetContent>
    </Sheet>
  );
}
