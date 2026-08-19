import { prisma } from "@/lib/db";
import { PageHeader, EmptyState } from "@/components/ui";
import BomEditor from "@/components/BomEditor";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function NewBomPage() {
  const [allProducts, existingBoms] = await Promise.all([
    prisma.product.findMany({ where: { isActive: true }, orderBy: { sku: "asc" } }),
    prisma.bom.findMany({ select: { productId: true } }),
  ]);

  const hasBom = new Set(existingBoms.map((b) => b.productId));
  // 成品候選：類型為組合品且尚未建立 BOM
  const finished = allProducts.filter((p) => p.type === "BOM" && !hasBom.has(p.id));

  if (finished.length === 0) {
    return (
      <div>
        <PageHeader title="建立 BOM" />
        <EmptyState
          message="沒有可建立 BOM 的商品。請先建立「組合品」類型的商品。"
          action={<Link href="/products/new" className="btn-primary">前往建立商品</Link>}
        />
      </div>
    );
  }

  const mapP = (p: (typeof allProducts)[number]) => ({
    id: p.id, sku: p.sku, name: p.name, unit: p.unit, costPrice: p.costPrice,
  });

  return (
    <div>
      <PageHeader title="建立 BOM" subtitle="選擇成品並定義其用料清單" />
      <BomEditor
        products={allProducts.map(mapP)}
        finishedProducts={finished.map(mapP)}
      />
    </div>
  );
}
