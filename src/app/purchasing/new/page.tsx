import { prisma } from "@/lib/db";
import { PageHeader, EmptyState } from "@/components/ui";
import OrderForm from "@/components/OrderForm";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function NewPurchasePage() {
  const [suppliers, products] = await Promise.all([
    prisma.supplier.findMany({ where: { isActive: true }, orderBy: { code: "asc" } }),
    prisma.product.findMany({ where: { isActive: true, type: { not: "SERVICE" } }, orderBy: { sku: "asc" } }),
  ]);

  if (suppliers.length === 0 || products.length === 0) {
    return (
      <div>
        <PageHeader title="新增採購單" />
        <EmptyState
          message="請先建立供應商與商品才能開立採購單"
          action={<Link href="/suppliers" className="btn-primary">前往建立供應商</Link>}
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="新增採購單" subtitle="建立後可確認並辦理入庫" />
      <OrderForm
        mode="purchase"
        parties={suppliers.map((s) => ({ id: s.id, name: s.name, code: s.code }))}
        products={products.map((p) => ({ id: p.id, sku: p.sku, name: p.name, unit: p.unit, price: p.costPrice }))}
      />
    </div>
  );
}
