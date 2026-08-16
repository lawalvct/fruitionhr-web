import { TenantDetailPage } from "@/features/admin/tenant-detail-page";

export const metadata = { title: "Company details" };

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminTenantDetailRoute({ params }: PageProps) {
  const { id } = await params;

  return <TenantDetailPage tenantId={id} />;
}
