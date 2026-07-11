import { PayrollRunDetail } from "@/features/payroll/payroll-run-detail";

export const metadata = { title: "Payroll run" };

export default async function PayrollRunRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PayrollRunDetail runId={Number(id)} />;
}
