import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import ProductForm, { ProductInput } from "@/components/ProductForm";

export const dynamic = "force-dynamic";

const empty: ProductInput = {
  sku: "", name: "", barcode: "", categoryId: null, unit: "個", type: "STOCK",
  costPrice: 0, salePrice: 0, safetyStock: 0, reorderPoint: 0, reorderQty: 0,
  description: "", isActive: true,
};

export default async function NewProductPage({
  searchParams,
}: {
  searchParams: { [k: string]: string | undefined };
}) {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  // 支援從 AI 助手帶入預填欄位
  const initial: ProductInput = {
    ...empty,
    sku: searchParams.sku ?? "",
    name: searchParams.name ?? "",
    unit: searchParams.unit ?? "個",
    costPrice: searchParams.costPrice ? Number(searchParams.costPrice) : 0,
    salePrice: searchParams.salePrice ? Number(searchParams.salePrice) : 0,
    safetyStock: searchParams.safetyStock ? Number(searchParams.safetyStock) : 0,
    reorderPoint: searchParams.reorderPoint ? Number(searchParams.reorderPoint) : 0,
    description: searchParams.description ?? "",
  };

  return (
    <div>
      <PageHeader title="新增商品" subtitle="建立一項新的商品主檔" />
      <ProductForm initial={initial} categories={categories} />
    </div>
  );
}
