import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatMoney, formatDate, STATUS_LABELS } from "@/lib/utils";
import { Stat, StatusBadge } from "@/components/ui";
import TrendChart from "@/components/TrendChart";

export const dynamic = "force-dynamic";

async function getData() {
  const [products, inventories, movements, recentSales, recentPurchases, pendingSO, pendingPO] =
    await Promise.all([
      prisma.product.findMany({ where: { isActive: true } }),
      prisma.inventory.findMany({ include: { product: true } }),
      prisma.stockMovement.findMany({
        where: { createdAt: { gte: new Date(Date.now() - 30 * 864e5) } },
      }),
      prisma.salesOrder.findMany({
        take: 5, orderBy: { orderDate: "desc" }, include: { customer: true },
      }),
      prisma.purchaseOrder.findMany({
        take: 5, orderBy: { orderDate: "desc" }, include: { supplier: true },
      }),
      prisma.salesOrder.count({ where: { status: { in: ["DRAFT", "CONFIRMED"] } } }),
      prisma.purchaseOrder.count({ where: { status: { in: ["DRAFT", "CONFIRMED"] } } }),
    ]);

  // 各商品總庫存
  const stockByProduct = new Map<number, number>();
  for (const inv of inventories) {
    stockByProduct.set(inv.productId, (stockByProduct.get(inv.productId) ?? 0) + inv.quantity);
  }

  // 庫存總值 & 低於安全庫存清單
  let inventoryValue = 0;
  const lowStock: { name: string; sku: string; qty: number; safety: number }[] = [];
  for (const p of products) {
    const qty = stockByProduct.get(p.id) ?? 0;
    inventoryValue += qty * p.costPrice;
    if (p.type !== "SERVICE" && qty <= p.reorderPoint) {
      lowStock.push({ name: p.name, sku: p.sku, qty, safety: p.safetyStock });
    }
  }
  lowStock.sort((a, b) => a.qty - a.safety - (b.qty - b.safety));

  // 近 30 天銷售/採購趨勢（依日彙總）— 從單據金額計
  const salesOrders = await prisma.salesOrder.findMany({
    where: { orderDate: { gte: new Date(Date.now() - 30 * 864e5) } },
  });
  const purchaseOrders = await prisma.purchaseOrder.findMany({
    where: { orderDate: { gte: new Date(Date.now() - 30 * 864e5) } },
  });
  const dayMap = new Map<string, { 銷售: number; 採購: number }>();
  const keyOf = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 864e5);
    dayMap.set(keyOf(d), { 銷售: 0, 採購: 0 });
  }
  for (const so of salesOrders) {
    const k = keyOf(so.orderDate);
    if (dayMap.has(k)) dayMap.get(k)!.銷售 += so.total;
  }
  for (const po of purchaseOrders) {
    const k = keyOf(po.orderDate);
    if (dayMap.has(k)) dayMap.get(k)!.採購 += po.total;
  }
  const trend = Array.from(dayMap.entries()).map(([label, v]) => ({ label, ...v }));

  const salesTotal = salesOrders.reduce((s, o) => s + o.total, 0);

  return {
    productCount: products.length,
    inventoryValue,
    lowStock,
    recentSales,
    recentPurchases,
    pendingSO,
    pendingPO,
    trend,
    salesTotal,
    movementCount: movements.length,
  };
}

export default async function DashboardPage() {
  const d = await getData();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">儀表板</h1>
        <p className="mt-1 text-sm text-slate-500">美瑟科技進銷存營運總覽</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="商品項目" value={String(d.productCount)} hint="啟用中的品項" />
        <Stat label="庫存總值" value={formatMoney(d.inventoryValue)} hint="以標準成本估算" tone="good" />
        <Stat label="近 30 天銷售額" value={formatMoney(d.salesTotal)} hint={`${d.movementCount} 筆庫存異動`} />
        <Stat
          label="低於再訂購點"
          value={String(d.lowStock.length)}
          hint="需補貨品項"
          tone={d.lowStock.length > 0 ? "danger" : "good"}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* 趨勢圖 */}
        <div className="card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">近 30 天進銷趨勢</h2>
            <div className="flex gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-brand-600" />銷售
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />採購
              </span>
            </div>
          </div>
          <TrendChart data={d.trend} />
        </div>

        {/* 低庫存警示 */}
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">🔔 補貨警示</h2>
            <Link href="/ai/replenishment" className="text-xs font-medium text-brand-600 hover:underline">
              AI 補貨建議 →
            </Link>
          </div>
          {d.lowStock.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">目前庫存皆充足 👍</p>
          ) : (
            <ul className="space-y-2">
              {d.lowStock.slice(0, 6).map((p) => (
                <li key={p.sku} className="flex items-center justify-between rounded-lg bg-red-50 px-3 py-2">
                  <div>
                    <div className="text-sm font-medium text-slate-800">{p.name}</div>
                    <div className="text-xs text-slate-400">{p.sku}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-red-600">{p.qty}</div>
                    <div className="text-[11px] text-slate-400">安全 {p.safety}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* 待處理單據 */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RecentTable
          title="最新銷售單"
          href="/sales"
          rows={d.recentSales.map((o) => ({
            no: o.orderNo, name: o.customer.name, date: o.orderDate, total: o.total, status: o.status,
          }))}
          badge={d.pendingSO}
        />
        <RecentTable
          title="最新採購單"
          href="/purchasing"
          rows={d.recentPurchases.map((o) => ({
            no: o.orderNo, name: o.supplier.name, date: o.orderDate, total: o.total, status: o.status,
          }))}
          badge={d.pendingPO}
        />
      </div>
    </div>
  );
}

function RecentTable({
  title, href, rows, badge,
}: {
  title: string;
  href: string;
  rows: { no: string; name: string; date: Date; total: number; status: string }[];
  badge: number;
}) {
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
        <h2 className="flex items-center gap-2 font-semibold text-slate-900">
          {title}
          {badge > 0 && (
            <span className="badge bg-amber-100 text-amber-700">{badge} 待處理</span>
          )}
        </h2>
        <Link href={href} className="text-xs font-medium text-brand-600 hover:underline">
          全部 →
        </Link>
      </div>
      {rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400">尚無資料</p>
      ) : (
        <table className="w-full">
          <tbody className="divide-y divide-slate-50">
            {rows.map((r) => (
              <tr key={r.no}>
                <td className="td font-mono text-xs text-slate-500">{r.no}</td>
                <td className="td">{r.name}</td>
                <td className="td text-slate-400">{formatDate(r.date)}</td>
                <td className="td text-right font-medium">{formatMoney(r.total)}</td>
                <td className="td text-right"><StatusBadge status={r.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
