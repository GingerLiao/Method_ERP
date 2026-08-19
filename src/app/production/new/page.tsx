import { prisma } from "@/lib/db";
import { PageHeader, EmptyState } from "@/components/ui";
import ProductionForm from "@/components/ProductionForm";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function NewProductionPage() {
  const boms = await prisma.bom.findMany({ include: { product: true }, orderBy: { productId: "asc" } });

  if (boms.length === 0) {
    return (
      <div>
        <PageHeader title="新增生產工單" />
        <EmptyState
          message="尚無可生產的成品，請先建立 BOM"
          action={<Link href="/bom/new" className="btn-primary">前往建立 BOM</Link>}
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="新增生產工單" subtitle="選擇成品與數量，系統將依 BOM 展開用料" />
      <ProductionForm
        products={boms.map((b) => ({ id: b.product.id, sku: b.product.sku, name: b.product.name, unit: b.product.unit }))}
      />
    </div>
  );
}
