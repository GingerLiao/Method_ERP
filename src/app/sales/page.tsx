import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatMoney, formatDate } from "@/lib/utils";
import { PageHeader, StatusBadge, EmptyState } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function SalesPage() {
  const orders = await prisma.salesOrder.findMany({
    include: { customer: true, _count: { select: { items: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="銷售單"
        subtitle="向客戶銷售並辦理出貨扣庫"
        action={<Link href="/sales/new" className="btn-primary">＋ 新增銷售單</Link>}
      />
      {orders.length === 0 ? (
        <EmptyState message="尚無銷售單" action={<Link href="/sales/new" className="btn-primary">建立第一張銷售單</Link>} />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-slate-100 bg-slate-50">
              <tr>
                <th className="th">單號</th>
                <th className="th">客戶</th>
                <th className="th">日期</th>
                <th className="th text-right">明細</th>
                <th className="th text-right">金額</th>
                <th className="th">狀態</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50">
                  <td className="td">
                    <Link href={`/sales/${o.id}`} className="font-mono text-xs font-medium text-brand-600 hover:underline">
                      {o.orderNo}
                    </Link>
                  </td>
                  <td className="td font-medium text-slate-900">{o.customer.name}</td>
                  <td className="td text-slate-400">{formatDate(o.orderDate)}</td>
                  <td className="td text-right text-slate-500">{o._count.items} 項</td>
                  <td className="td text-right font-semibold">{formatMoney(o.total)}</td>
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
