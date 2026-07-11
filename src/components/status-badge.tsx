import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusClasses: Record<string, string> = {
  approved: "bg-fruition-600 text-white",
  active: "bg-fruition-600 text-white",
  pending: "bg-amber-100 text-amber-800",
  rejected: "bg-red-100 text-red-700",
  failed: "bg-red-100 text-red-700",
  draft: "bg-slate-100 text-slate-700",
  info: "bg-blue-100 text-blue-700",
  open: 'bg-emerald-100 text-emerald-800',
  closed: 'bg-slate-100 text-slate-700',
  shortlisted: 'bg-cyan-100 text-cyan-800',
  interview_scheduled: 'bg-blue-100 text-blue-700',
  interviewed: 'bg-indigo-100 text-indigo-700',
  assessment: 'bg-violet-100 text-violet-700',
  offer: 'bg-fuchsia-100 text-fuchsia-700',
  accepted: 'bg-fruition-600 text-white',
  hired: 'bg-fruition-600 text-white',
  completed: 'bg-fruition-600 text-white',
};

export function StatusBadge({ status }: { status: string }) {
  const label = status.replace(/_/g, " ");

  return (
    <Badge className={cn("capitalize", statusClasses[status] ?? statusClasses.info)}>
      {label}
    </Badge>
  );
}
