import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import MasterCrud, { Field } from "@/components/MasterCrud";

export const dynamic = "force-dynamic";

export default async function WarehousesPage() {
  const rows = await prisma.warehouse.findMany({ orderBy: { code: "asc" } });
  const fields: Field[] = [
    { key: "code", label: "倉庫代碼", required: true, placeholder: "如 WH01" },
    { key: "name", label: "倉庫名稱", required: true },
    { key: "location", label: "位置" },
  ];
  return (
    <div>
      <PageHeader title="倉庫管理" subtitle="管理各實體/虛擬倉別" />
      <MasterCrud apiBase="/api/warehouses" fields={fields} rows={rows} />
    </div>
  );
}
