import { prisma } from "@/lib/db";
import { PageHeader, EmptyState } from "@/components/ui";
import OrderForm from "@/components/OrderForm";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function NewSalePage() {
  const [customers, warehouses, products] = await Promise.all([
    prisma.customer.findMany({ where: { isActive: true }, orderBy: { code: "asc" } }),
    prisma.warehouse.findMany({ where: { isActive: true }, orderBy: { code: "asc" } }),
    prisma.product.findMany({ where: { isActive: true }, orderBy: { sku: "asc" } }),
  ]);

  if (customers.length === 0 || products.length === 0) {
    return (
      <div>
        <PageHeader title="新增銷售單" />
        <EmptyState
          message="請先建立客戶與商品才能開立銷售單"
          action={<Link href="/customers" className="btn-primary">前往建立客戶</Link>}
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="新增銷售單" subtitle="建立後可確認並辦理出貨" />
      <OrderForm
        mode="sale"
        parties={customers.map((c) => ({ id: c.id, name: c.name, code: c.code }))}
        warehouses={warehouses.map((w) => ({ id: w.id, name: w.name }))}
        products={products.map((p) => ({ id: p.id, sku: p.sku, name: p.name, unit: p.unit, price: p.salePrice }))}
      />
    </div>
  );
}
