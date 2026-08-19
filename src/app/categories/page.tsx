import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import MasterCrud, { Field } from "@/components/MasterCrud";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const cats = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });
  const fields: Field[] = [{ key: "name", label: "分類名稱", required: true }];
  const rows = cats.map((c) => ({ id: c.id, name: c.name, count: c._count.products }));

  return (
    <div>
      <PageHeader title="商品分類" subtitle="管理商品的分類階層" />
      <MasterCrud
        apiBase="/api/categories"
        fields={fields}
        rows={rows}
        displayColumns={[{ key: "count", label: "商品數" }]}
      />
    </div>
  );
}
