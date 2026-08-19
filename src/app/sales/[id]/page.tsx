import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatMoney, formatDate, formatQty } from "@/lib/utils";
import { PageHeader, StatusBadge } from "@/components/ui";
import OrderActions from "@/components/OrderActions";

export const dynamic = "force-dynamic";

export default async function SaleDetailPage({ params }: { params: { id: string } }) {
  const so = await prisma.salesOrder.findUnique({
    where: { id: Number(params.id) },
    include: { customer: true, items: { include: { product: true } } },
  });
  if (!so) notFound();

  return (
    <div>
      <PageHeader
        title={`銷售單 ${so.orderNo}`}
        subtitle={so.customer.name}
        action={<OrderActions apiBase="/api/sales" id={so.id} status={so.status} mode="sale" />}
      />

      <div className="mb-4 card grid grid-cols-2 gap-4 p-6 sm:grid-cols-4">
        <Info label="狀態" value={<StatusBadge status={so.status} />} />
        <Info label="客戶" value={so.customer.name} />
        <Info label="訂購日" value={formatDate(so.orderDate)} />
        <Info label="備註" value={so.note || "-"} />
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-slate-100 bg-slate-50">
            <tr>
              <th className="th">商品</th>
              <th className="th text-right">數量</th>
              <th className="th text-right">已出貨</th>
              <th className="th text-right">單價</th>
              <th className="th text-right">小計</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {so.items.map((it) => (
              <tr key={it.id}>
                <td className="td font-medium text-slate-900">
                  {it.product.name}<span className="ml-1 font-mono text-xs text-slate-400">{it.product.sku}</span>
                </td>
                <td className="td text-right">{formatQty(it.quantity)} {it.product.unit}</td>
                <td className="td text-right text-slate-500">{formatQty(it.shippedQty)}</td>
                <td className="td text-right">{formatMoney(it.unitPrice)}</td>
                <td className="td text-right font-medium">{formatMoney(it.subtotal)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-100 bg-slate-50">
              <td className="td font-semibold" colSpan={4}>總計</td>
              <td className="td text-right text-lg font-bold text-slate-900">{formatMoney(so.total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="mt-4">
        <Link href="/sales" className="text-sm text-brand-600 hover:underline">← 返回銷售單列表</Link>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-slate-400">{label}</div>
      <div className="mt-1 text-sm font-medium text-slate-800">{value}</div>
    </div>
  );
}
