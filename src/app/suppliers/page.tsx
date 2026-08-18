import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import MasterCrud, { Field } from "@/components/MasterCrud";

export const dynamic = "force-dynamic";

export default async function SuppliersPage() {
  const rows = await prisma.supplier.findMany({ orderBy: { code: "asc" } });
  const fields: Field[] = [
    { key: "code", label: "供應商代碼", required: true, placeholder: "如 SUP001" },
    { key: "name", label: "供應商名稱", required: true },
    { key: "contact", label: "聯絡人" },
    { key: "phone", label: "電話" },
    { key: "email", label: "Email", showInTable: false },
    { key: "taxId", label: "統一編號" },
    { key: "address", label: "地址", showInTable: false },
  ];
  return (
    <div>
      <PageHeader title="供應商" subtitle="採購來源廠商資料" />
      <MasterCrud apiBase="/api/suppliers" fields={fields} rows={rows} />
    </div>
  );
}
