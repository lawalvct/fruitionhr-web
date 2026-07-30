"use client";

import { HandCoins, Landmark, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AmountInput } from "@/components/amount-input";
import { MoneyText } from "@/components/money-text";
import { PageHeader } from "@/components/page-header";
import { PageLoader } from "@/components/page-loader";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiErrorMessage } from "@/lib/api";
import { useRequestSelfLoan, useSelfLoanRequests } from "@/features/self-service/use-self-service";
import type { LoanType } from "@/features/loans/use-loans";

function nextPeriod() {
  const date = new Date();
  date.setMonth(date.getMonth() + 1, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function SelfLoansPage() {
  const { data: requests = [], isLoading } = useSelfLoanRequests();
  const requestLoan = useRequestSelfLoan();
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<LoanType>("advance");
  const [amount, setAmount] = useState(0);
  const [months, setMonths] = useState(3);
  const [startPeriod, setStartPeriod] = useState(nextPeriod());
  const [reason, setReason] = useState("");

  const submit = async () => {
    try {
      await requestLoan.mutateAsync({
        type,
        principal: Math.round(amount * 100),
        start_period: startPeriod,
        reason: reason.trim(),
        ...(type === "loan" ? { months } : {}),
      });
      toast.success("Request submitted for approval. You will be notified when a decision is made.");
      setShowForm(false); setAmount(0); setReason("");
    } catch (error) { toast.error(apiErrorMessage(error)); }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="My IOU & Loans" description="Request an IOU or staff loan and follow its approval and repayment status." actions={<Button onClick={() => setShowForm((value) => !value)}><Plus className="size-4" /> New request</Button>} />

      {showForm && <section className="grid gap-4 rounded-xl border bg-card p-4 shadow-sm sm:p-5">
        <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
          {[{ value: "advance", label: "IOU" }, { value: "loan", label: "Loan" }].map((option) => <button key={option.value} type="button" onClick={() => setType(option.value as LoanType)} className={`h-10 rounded-md text-sm font-medium ${type === option.value ? "bg-background shadow-sm" : "text-muted-foreground"}`}>{option.label}</button>)}
        </div>
        <p className="text-xs text-muted-foreground">{type === "advance" ? "An IOU is recovered in full from one payroll." : "A staff loan is recovered in monthly installments."}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2"><Label htmlFor="request-amount">Amount (₦)</Label><AmountInput id="request-amount" value={amount} onValueChange={setAmount} /></div>
          {type === "loan" && <div className="grid gap-2"><Label htmlFor="request-months">Repayment months</Label><Input id="request-months" type="number" min={1} max={60} value={months} onChange={(event) => setMonths(Number(event.target.value))} /></div>}
          <div className="grid gap-2"><Label htmlFor="request-period">Start deduction from</Label><Input id="request-period" type="month" value={startPeriod} onChange={(event) => setStartPeriod(event.target.value)} /></div>
          <div className="grid gap-2 sm:col-span-2"><Label htmlFor="request-reason">Reason</Label><Input id="request-reason" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Explain why you need this request" maxLength={255} /></div>
        </div>
        <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button><Button onClick={submit} disabled={requestLoan.isPending || amount <= 0 || !reason.trim() || (type === "loan" && months < 1)}>{requestLoan.isPending ? "Submitting…" : "Submit for approval"}</Button></div>
      </section>}

      {isLoading ? <PageLoader label="Loading your requests…" /> : requests.length === 0 ? <div className="rounded-xl border border-dashed p-10 text-center"><HandCoins className="mx-auto size-8 text-muted-foreground" /><p className="mt-3 font-semibold">No IOU or loan requests yet</p><p className="mt-1 text-sm text-muted-foreground">Your requests and approval decisions will appear here.</p></div> : <div className="overflow-hidden rounded-xl border bg-card"><ul className="divide-y">{requests.map((request) => <li key={request.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-lg bg-fruition-50 text-fruition-700">{request.type === "advance" ? <HandCoins className="size-5" /> : <Landmark className="size-5" />}</span><div><p className="font-semibold">{request.type === "advance" ? "IOU" : `Loan · ${request.months} months`}</p><p className="text-sm text-muted-foreground"><MoneyText kobo={request.principal} /> · deductions from {request.start_period}</p><p className="mt-1 text-xs text-muted-foreground">{request.reason}</p></div></div><div className="flex items-center gap-3"><StatusBadge status={request.status} />{request.status === "active" && <span className="text-sm font-medium"><MoneyText kobo={request.balance} /> balance</span>}</div></li>)}</ul></div>}
    </div>
  );
}
