"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
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
import { apiErrorMessage } from "@/lib/api";
import {
  useDeleteLeaveType,
  useLeaveTypes,
  useSaveLeaveType,
  type LeaveType,
  type LeaveTypeInput,
} from "@/features/leave/use-leave";

const empty: LeaveTypeInput = {
  name: "",
  code: "",
  is_paid: true,
  requires_document: false,
  is_active: true,
  days_per_year: 20,
  carry_forward_max: 0,
};

export function LeaveTypesDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: types, isLoading } = useLeaveTypes();
  const save = useSaveLeaveType();
  const remove = useDeleteLeaveType();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<LeaveTypeInput>(empty);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  const startCreate = () => {
    setEditingId(null);
    setForm(empty);
    setShowForm(true);
  };

  const startEdit = (type: LeaveType) => {
    setEditingId(type.id);
    setForm({
      name: type.name,
      code: type.code ?? "",
      is_paid: type.is_paid,
      requires_document: type.requires_document,
      is_active: type.is_active,
      days_per_year: type.days_per_year,
      carry_forward_max: type.carry_forward_max,
    });
    setShowForm(true);
  };

  const submit = async () => {
    try {
      await save.mutateAsync({ id: editingId ?? undefined, input: form });
      toast.success(editingId ? "Leave type updated." : "Leave type created.");
      setShowForm(false);
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Leave types</SheetTitle>
          <SheetDescription>
            Define leave types and their annual allocation. Balances are
            created from these when employees apply.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-4 pb-6">
          {!showForm && (
            <Button type="button" onClick={startCreate} className="w-full">
              <Plus className="size-4" /> New leave type
            </Button>
          )}

          {showForm && (
            <div className="space-y-3 rounded-lg border bg-muted/40 p-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 grid gap-2">
                  <Label htmlFor="lt-name">Name</Label>
                  <Input id="lt-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Annual Leave" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lt-code">Code</Label>
                  <Input id="lt-code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="ANN" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="lt-days">Days / year</Label>
                  <Input id="lt-days" type="number" min={0} value={form.days_per_year} onChange={(e) => setForm({ ...form, days_per_year: Number(e.target.value) })} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lt-carry">Carry-forward max</Label>
                  <Input id="lt-carry" type="number" min={0} value={form.carry_forward_max} onChange={(e) => setForm({ ...form, carry_forward_max: Number(e.target.value) })} />
                </div>
              </div>
              <div className="flex flex-wrap gap-4 text-sm">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.is_paid} onChange={(e) => setForm({ ...form, is_paid: e.target.checked })} />
                  Paid
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.requires_document} onChange={(e) => setForm({ ...form, requires_document: e.target.checked })} />
                  Requires document
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                  Active
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="button" onClick={submit} disabled={save.isPending}>
                  {save.isPending ? "Saving…" : "Save type"}
                </Button>
              </div>
            </div>
          )}

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : !types?.length ? (
            <p className="text-sm text-muted-foreground">No leave types yet.</p>
          ) : (
            <ul className="divide-y rounded-lg border">
              {types.map((type) => (
                <li key={type.id} className="flex items-center justify-between gap-2 px-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium">
                      {type.name}
                      {!type.is_active && <span className="ml-2 text-xs text-muted-foreground">(inactive)</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {type.days_per_year} days/yr · {type.is_paid ? "paid" : "unpaid"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon-sm" onClick={() => startEdit(type)} aria-label="Edit">
                      <Pencil className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => setDeleteTarget(type.id)} aria-label="Delete">
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
          onOpenChange={(o) => !o && setDeleteTarget(null)}
          title="Delete leave type?"
          description="Existing requests and balances are retained, but no new requests can use it."
          confirmLabel="Delete"
          isPending={remove.isPending}
          onConfirm={async () => {
            if (deleteTarget === null) return;
            try {
              await remove.mutateAsync(deleteTarget);
              toast.success("Leave type deleted.");
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
