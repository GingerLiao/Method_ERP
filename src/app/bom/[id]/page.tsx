import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import BomEditor from "@/components/BomEditor";

export const dynamic = "force-dynamic";

export default async function EditBomPage({ params }: { params: { id: string } }) {
  const [bom, allProducts] = await Promise.all([
    prisma.bom.findUnique({
      where: { id: Number(params.id) },
      include: { product: true, items: true },
    }),
    prisma.product.findMany({ where: { isActive: true }, orderBy: { sku: "asc" } }),
  ]);
  if (!bom) notFound();

  const mapP = (p: (typeof allProducts)[number]) => ({
    id: p.id, sku: p.sku, name: p.name, unit: p.unit, costPrice: p.costPrice,
  });

  return (
    <div>
      <PageHeader title={`編輯 BOM — ${bom.product.name}`} subtitle={`商品編號 ${bom.product.sku}`} />
      <BomEditor
        bomId={bom.id}
        productId={bom.productId}
        products={allProducts.map(mapP)}
        finishedProducts={[mapP(bom.product)]}
        initialVersion={bom.version}
        initialNote={bom.note ?? ""}
        initialItems={bom.items.map((it) => ({
          componentId: it.componentId, quantity: it.quantity, lossRate: it.lossRate,
        }))}
      />
    </div>
  );
}
