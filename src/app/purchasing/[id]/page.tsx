import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatMoney, formatDate, formatQty } from "@/lib/utils";
import { PageHeader, StatusBadge } from "@/components/ui";
import OrderActions from "@/components/OrderActions";

export const dynamic = "force-dynamic";

export default async function PurchaseDetailPage({ params }: { params: { id: string } }) {
  const po = await prisma.purchaseOrder.findUnique({
    where: { id: Number(params.id) },
    include: { supplier: true, warehouse: true, items: { include: { product: true } } },
  });
  if (!po) notFound();

  return (
    <div>
      <PageHeader
        title={`採購單 ${po.orderNo}`}
        subtitle={po.supplier.name}
        action={<OrderActions apiBase="/api/purchasing" id={po.id} status={po.status} mode="purchase" />}
      />

      <div className="mb-4 card grid grid-cols-2 gap-4 p-6 sm:grid-cols-4">
        <Info label="狀態" value={<StatusBadge status={po.status} />} />
        <Info label="供應商" value={po.supplier.name} />
        <Info label="入庫倉" value={po.warehouse.name} />
        <Info label="訂購日" value={formatDate(po.orderDate)} />
        <Info label="預計到貨" value={formatDate(po.expectedDate)} />
        <Info label="備註" value={po.note || "-"} />
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-slate-100 bg-slate-50">
            <tr>
              <th className="th">商品</th>
              <th className="th text-right">訂購量</th>
              <th className="th text-right">已入庫</th>
              <th className="th text-right">單價</th>
              <th className="th text-right">小計</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {po.items.map((it) => (
              <tr key={it.id}>
                <td className="td font-medium text-slate-900">
                  {it.product.name}<span className="ml-1 font-mono text-xs text-slate-400">{it.product.sku}</span>
                </td>
                <td className="td text-right">{formatQty(it.quantity)} {it.product.unit}</td>
                <td className="td text-right text-slate-500">{formatQty(it.receivedQty)}</td>
                <td className="td text-right">{formatMoney(it.unitPrice)}</td>
                <td className="td text-right font-medium">{formatMoney(it.subtotal)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-100 bg-slate-50">
              <td className="td font-semibold" colSpan={4}>總計</td>
              <td className="td text-right text-lg font-bold text-slate-900">{formatMoney(po.total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="mt-4">
        <Link href="/purchasing" className="text-sm text-brand-600 hover:underline">← 返回採購單列表</Link>
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
