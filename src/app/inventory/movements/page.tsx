import { prisma } from "@/lib/db";
import { formatDate, formatQty, MOVEMENT_LABELS } from "@/lib/utils";
import { PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

const REF_LABEL: Record<string, string> = {
  PURCHASE: "採購", SALE: "銷售", PRODUCTION: "生產", MANUAL: "手動",
};

export default async function MovementsPage() {
  const movements = await prisma.stockMovement.findMany({
    take: 200,
    orderBy: { createdAt: "desc" },
    include: { product: true, warehouse: true },
  });

  return (
    <div>
      <PageHeader title="庫存異動" subtitle="所有進出、調整、生產異動的總帳（最新 200 筆）" />
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-slate-100 bg-slate-50">
              <tr>
                <th className="th">時間</th>
                <th className="th">商品</th>
                <th className="th">倉庫</th>
                <th className="th">類型</th>
                <th className="th">來源</th>
                <th className="th text-right">數量</th>
                <th className="th">備註</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {movements.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="td text-slate-400">{formatDate(m.createdAt)}</td>
                  <td className="td font-medium text-slate-900">
                    {m.product.name}
                    <span className="ml-1 font-mono text-xs text-slate-400">{m.product.sku}</span>
                  </td>
                  <td className="td text-slate-500">{m.warehouse.name}</td>
                  <td className="td">
                    <span className="badge bg-slate-100 text-slate-600">{MOVEMENT_LABELS[m.type] ?? m.type}</span>
                  </td>
                  <td className="td text-slate-500">{m.refType ? REF_LABEL[m.refType] ?? m.refType : "-"}</td>
                  <td className={`td text-right font-semibold ${m.quantity >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {m.quantity >= 0 ? "+" : ""}{formatQty(m.quantity)} {m.product.unit}
                  </td>
                  <td className="td text-slate-400">{m.note ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
