import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { formatQty } from "@/lib/utils";
import ProductForm, { ProductInput } from "@/components/ProductForm";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: { inventories: { include: { warehouse: true } } },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!product) notFound();

  const initial: ProductInput = {
    id: product.id, sku: product.sku, name: product.name, barcode: product.barcode,
    categoryId: product.categoryId, unit: product.unit, type: product.type,
    costPrice: product.costPrice, salePrice: product.salePrice,
    safetyStock: product.safetyStock, reorderPoint: product.reorderPoint,
    reorderQty: product.reorderQty, description: product.description, isActive: product.isActive,
  };

  return (
    <div>
      <PageHeader title={product.name} subtitle={`商品編號 ${product.sku}`} />

      {product.inventories.length > 0 && (
        <div className="mb-4 card p-4">
          <div className="mb-2 text-sm font-semibold text-slate-700">各倉庫存</div>
          <div className="flex flex-wrap gap-3">
            {product.inventories.map((inv) => (
              <div key={inv.id} className="rounded-lg bg-slate-50 px-4 py-2">
                <div className="text-xs text-slate-400">{inv.warehouse.name}</div>
                <div className="text-lg font-bold text-slate-900">
                  {formatQty(inv.quantity)} <span className="text-xs font-normal text-slate-400">{product.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <ProductForm initial={initial} categories={categories} />
    </div>
  );
}
