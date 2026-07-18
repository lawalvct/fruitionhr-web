import { PayrollRunDetail } from "@/features/payroll/payroll-run-detail";
import { notFound } from "next/navigation";

export const metadata = { title: "Payroll run" };

export default async function PayrollRunRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();

  return <PayrollRunDetail runId={Number(id)} />;
}
