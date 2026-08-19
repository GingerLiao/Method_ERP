import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import MasterCrud, { Field } from "@/components/MasterCrud";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const rows = await prisma.customer.findMany({ orderBy: { code: "asc" } });
  const fields: Field[] = [
    { key: "code", label: "客戶代碼", required: true, placeholder: "如 CUS001" },
    { key: "name", label: "客戶名稱", required: true },
    { key: "contact", label: "聯絡人" },
    { key: "phone", label: "電話" },
    { key: "email", label: "Email", showInTable: false },
    { key: "taxId", label: "統一編號" },
    { key: "address", label: "地址", showInTable: false },
  ];
  return (
    <div>
      <PageHeader title="客戶" subtitle="銷售對象客戶資料" />
      <MasterCrud apiBase="/api/customers" fields={fields} rows={rows} />
    </div>
  );
}
