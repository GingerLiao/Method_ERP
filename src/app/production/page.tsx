import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatQty, formatDate } from "@/lib/utils";
import { PageHeader, StatusBadge, EmptyState } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function ProductionPage() {
  const orders = await prisma.productionOrder.findMany({
    include: { product: true, warehouse: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="生產工單"
        subtitle="依 BOM 投料生產，完工後自動扣料並將成品入庫"
        action={<Link href="/production/new" className="btn-primary">＋ 新增工單</Link>}
      />
      {orders.length === 0 ? (
        <EmptyState message="尚無生產工單" action={<Link href="/production/new" className="btn-primary">建立第一張工單</Link>} />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-slate-100 bg-slate-50">
              <tr>
                <th className="th">工單號</th>
                <th className="th">成品</th>
                <th className="th">生產倉</th>
                <th className="th text-right">數量</th>
                <th className="th">建立日</th>
                <th className="th">狀態</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50">
                  <td className="td">
                    <Link href={`/production/${o.id}`} className="font-mono text-xs font-medium text-brand-600 hover:underline">
                      {o.orderNo}
                    </Link>
                  </td>
                  <td className="td font-medium text-slate-900">{o.product.name}</td>
                  <td className="td text-slate-500">{o.warehouse.name}</td>
                  <td className="td text-right font-semibold">{formatQty(o.quantity)} {o.product.unit}</td>
                  <td className="td text-slate-400">{formatDate(o.createdAt)}</td>
                  <td className="td"><StatusBadge status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
