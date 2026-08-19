import { prisma } from "@/lib/db";
import { formatMoney, formatQty } from "@/lib/utils";
import { PageHeader, Stat } from "@/components/ui";
import StockAdjustButton from "@/components/StockAdjustButton";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const [products, warehouses] = await Promise.all([
    prisma.product.findMany({
      where: { type: { not: "SERVICE" } },
      include: { inventories: { include: { warehouse: true } }, category: true },
      orderBy: { sku: "asc" },
    }),
    prisma.warehouse.findMany({ where: { isActive: true }, orderBy: { code: "asc" } }),
  ]);

  let totalValue = 0;
  let lowCount = 0;
  const rows = products.map((p) => {
    const byWh = new Map<number, number>();
    for (const inv of p.inventories) byWh.set(inv.warehouseId, inv.quantity);
    const total = p.inventories.reduce((s, i) => s + i.quantity, 0);
    totalValue += total * p.costPrice;
    const low = total <= p.reorderPoint;
    if (low) lowCount++;
    return { p, byWh, total, low };
  });

  return (
    <div>
      <PageHeader title="庫存查詢" subtitle="即時庫存與各倉別分布" />

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
                {warehouses.map((w) => (
                  <th key={w.id} className="th text-right">{w.name}</th>
                ))}
                <th className="th text-right">總庫存</th>
                <th className="th text-right">庫存值</th>
                <th className="th"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {rows.map(({ p, byWh, total, low }) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="td font-mono text-xs">{p.sku}</td>
                  <td className="td font-medium text-slate-900">{p.name}</td>
                  {warehouses.map((w) => (
                    <td key={w.id} className="td text-right text-slate-600">
                      {formatQty(byWh.get(w.id) ?? 0)}
                    </td>
                  ))}
                  <td className={`td text-right font-semibold ${low ? "text-red-600" : ""}`}>
                    {formatQty(total)} {p.unit}{low && " ⚠️"}
                  </td>
                  <td className="td text-right text-slate-500">{formatMoney(total * p.costPrice)}</td>
                  <td className="td text-right">
                    <StockAdjustButton
                      productId={p.id}
                      productName={p.name}
                      unit={p.unit}
                      warehouses={warehouses.map((w) => ({ id: w.id, name: w.name }))}
                    />
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
