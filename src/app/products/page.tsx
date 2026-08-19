import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatMoney, formatQty } from "@/lib/utils";
import { PageHeader, EmptyState } from "@/components/ui";

export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<string, string> = { STOCK: "庫存品", SERVICE: "服務", BOM: "組合品" };

export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    include: { category: true, inventories: true },
    orderBy: { sku: "asc" },
  });

  return (
    <div>
      <PageHeader
        title="商品管理"
        subtitle={`共 ${products.length} 項商品`}
        action={
          <div className="flex gap-2">
            <Link href="/ai/assistant" className="btn-ghost">✨ AI 建立商品</Link>
            <Link href="/products/new" className="btn-primary">＋ 新增商品</Link>
          </div>
        }
      />

      {products.length === 0 ? (
        <EmptyState message="尚未建立任何商品" action={<Link href="/products/new" className="btn-primary">新增第一項商品</Link>} />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-100 bg-slate-50">
                <tr>
                  <th className="th">編號</th>
                  <th className="th">品名</th>
                  <th className="th">分類</th>
                  <th className="th">類型</th>
                  <th className="th text-right">成本</th>
                  <th className="th text-right">售價</th>
                  <th className="th text-right">庫存</th>
                  <th className="th text-right">安全庫存</th>
                  <th className="th"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {products.map((p) => {
                  const stock = p.inventories.reduce((s, i) => s + i.quantity, 0);
                  const low = p.type !== "SERVICE" && stock <= p.reorderPoint;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="td font-mono text-xs">{p.sku}</td>
                      <td className="td font-medium text-slate-900">
                        {p.name}
                        {!p.isActive && <span className="ml-2 badge bg-slate-100 text-slate-400">停用</span>}
                      </td>
                      <td className="td text-slate-500">{p.category?.name ?? "-"}</td>
                      <td className="td">
                        <span className="badge bg-slate-100 text-slate-600">{TYPE_LABEL[p.type]}</span>
                      </td>
                      <td className="td text-right">{formatMoney(p.costPrice)}</td>
                      <td className="td text-right">{formatMoney(p.salePrice)}</td>
                      <td className={`td text-right font-semibold ${low ? "text-red-600" : "text-slate-900"}`}>
                        {formatQty(stock)} {p.unit}
                        {low && <span className="ml-1">⚠️</span>}
                      </td>
                      <td className="td text-right text-slate-400">{formatQty(p.safetyStock)}</td>
                      <td className="td text-right">
                        <Link href={`/products/${p.id}`} className="text-brand-600 hover:underline">編輯</Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
