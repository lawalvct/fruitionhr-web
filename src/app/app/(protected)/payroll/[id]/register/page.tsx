import { PayrollRegister } from "@/features/payroll/payroll-register";
import { notFound } from "next/navigation";

export const metadata = { title: "Payroll register" };

export default async function PayrollRegisterRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();

  return <PayrollRegister runId={Number(id)} />;
}
