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
      include: { inventories: true },
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
          <div className="mb-2 text-sm font-semibold text-slate-700">目前庫存</div>
          <div className="text-lg font-bold text-slate-900">
            {formatQty(product.inventories.reduce((s, i) => s + i.quantity, 0))}
            <span className="ml-1 text-xs font-normal text-slate-400">{product.unit}</span>
          </div>
        </div>
      )}

      <ProductForm initial={initial} categories={categories} />
    </div>
  );
}
