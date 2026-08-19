import { prisma } from "@/lib/db";
import { formatMoney, formatQty } from "@/lib/utils";
import { PageHeader, Stat } from "@/components/ui";
import StockAdjustButton from "@/components/StockAdjustButton";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const products = await prisma.product.findMany({
    where: { type: { not: "SERVICE" } },
    include: { inventories: true, category: true },
    orderBy: { sku: "asc" },
  });

  let totalValue = 0;
  let lowCount = 0;
  const rows = products.map((p) => {
    const total = p.inventories.reduce((s, i) => s + i.quantity, 0);
    totalValue += total * p.costPrice;
    const low = total <= p.reorderPoint;
    if (low) lowCount++;
    return { p, total, low };
  });

  return (
    <div>
      <PageHeader title="庫存查詢" subtitle="即時庫存總覽" />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="品項數" value={String(products.length)} />
        <Stat label="庫存總值" value={formatMoney(totalValue)} tone="good" />
        <Stat label="低於再訂購點" value={String(lowCount)} tone={lowCount ? "danger" : "good"} />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-slate-100 bg-slate-50">
              <tr>
                <th className="th">編號</th>
                <th className="th">品名</th>
                <th className="th">分類</th>
                <th className="th text-right">庫存</th>
                <th className="th text-right">安全庫存</th>
                <th className="th text-right">庫存值</th>
                <th className="th"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {rows.map(({ p, total, low }) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="td font-mono text-xs">{p.sku}</td>
                  <td className="td font-medium text-slate-900">{p.name}</td>
                  <td className="td text-slate-500">{p.category?.name ?? "-"}</td>
                  <td className={`td text-right font-semibold ${low ? "text-red-600" : ""}`}>
                    {formatQty(total)} {p.unit}{low && " ⚠️"}
                  </td>
                  <td className="td text-right text-slate-400">{formatQty(p.safetyStock)}</td>
                  <td className="td text-right text-slate-500">{formatMoney(total * p.costPrice)}</td>
                  <td className="td text-right">
                    <StockAdjustButton productId={p.id} productName={p.name} unit={p.unit} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
