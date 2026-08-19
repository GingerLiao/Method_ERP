import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatMoney, formatDate } from "@/lib/utils";
import { PageHeader, StatusBadge, EmptyState } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function PurchasingPage() {
  const orders = await prisma.purchaseOrder.findMany({
    include: { supplier: true, warehouse: true, _count: { select: { items: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="採購單"
        subtitle="向供應商採購並辦理進貨入庫"
        action={<Link href="/purchasing/new" className="btn-primary">＋ 新增採購單</Link>}
      />
      {orders.length === 0 ? (
        <EmptyState message="尚無採購單" action={<Link href="/purchasing/new" className="btn-primary">建立第一張採購單</Link>} />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-slate-100 bg-slate-50">
              <tr>
                <th className="th">單號</th>
                <th className="th">供應商</th>
                <th className="th">倉庫</th>
                <th className="th">日期</th>
                <th className="th text-right">明細</th>
                <th className="th text-right">金額</th>
                <th className="th">狀態</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {orders.map((o) => (
                <tr key={o.id} className="cursor-pointer hover:bg-slate-50">
                  <td className="td">
                    <Link href={`/purchasing/${o.id}`} className="font-mono text-xs font-medium text-brand-600 hover:underline">
                      {o.orderNo}
                    </Link>
                  </td>
                  <td className="td font-medium text-slate-900">{o.supplier.name}</td>
                  <td className="td text-slate-500">{o.warehouse.name}</td>
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
