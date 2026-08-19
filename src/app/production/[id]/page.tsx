import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatQty, formatMoney, formatDate } from "@/lib/utils";
import { PageHeader, StatusBadge } from "@/components/ui";
import { explodeBom } from "@/lib/bom";
import ProductionActions from "@/components/ProductionActions";

export const dynamic = "force-dynamic";

export default async function ProductionDetailPage({ params }: { params: { id: string } }) {
  const mo = await prisma.productionOrder.findUnique({
    where: { id: Number(params.id) },
    include: { product: true },
  });
  if (!mo) notFound();

  // 展開用料需求，並附上現有庫存
  const requirements = await explodeBom(mo.productId, mo.quantity);
  const stockRows = await Promise.all(
    requirements.map(async (r) => {
      const inv = await prisma.inventory.findUnique({
        where: { productId_warehouseId: { productId: r.productId, warehouseId: mo.warehouseId } },
      });
      const onHand = inv?.quantity ?? 0;
      return { ...r, onHand, enough: onHand >= r.totalQty };
    })
  );
  const materialCost = requirements.reduce((s, r) => s + r.totalQty * r.costPrice, 0);

  return (
    <div>
      <PageHeader
        title={`生產工單 ${mo.orderNo}`}
        subtitle={mo.product.name}
        action={<ProductionActions id={mo.id} status={mo.status} />}
      />

      <div className="mb-4 card grid grid-cols-2 gap-4 p-6 sm:grid-cols-4">
        <Info label="狀態" value={<StatusBadge status={mo.status} />} />
        <Info label="成品" value={`${mo.product.name}`} />
        <Info label="生產數量" value={`${formatQty(mo.quantity)} ${mo.product.unit}`} />
        <Info label="開工日" value={formatDate(mo.startDate)} />
        <Info label="完工日" value={formatDate(mo.completeDate)} />
        <Info label="預估用料成本" value={formatMoney(materialCost)} />
        <Info label="備註" value={mo.note || "-"} />
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-3 font-semibold text-slate-900">
          用料需求（BOM 多階展開）
        </div>
        <table className="w-full">
          <thead className="border-b border-slate-100 bg-slate-50">
            <tr>
              <th className="th">用料</th>
              <th className="th text-right">單位用量</th>
              <th className="th text-right">需求總量</th>
              <th className="th text-right">現有庫存</th>
              <th className="th text-right">狀態</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {stockRows.map((r) => (
              <tr key={r.productId}>
                <td className="td font-medium text-slate-900">
                  {r.name}<span className="ml-1 font-mono text-xs text-slate-400">{r.sku}</span>
                </td>
                <td className="td text-right text-slate-500">{formatQty(r.qtyPerUnit)} {r.unit}</td>
                <td className="td text-right font-semibold">{formatQty(r.totalQty)} {r.unit}</td>
                <td className="td text-right text-slate-500">{formatQty(r.onHand)}</td>
                <td className="td text-right">
                  {r.enough ? (
                    <span className="badge bg-green-100 text-green-700">充足</span>
                  ) : (
                    <span className="badge bg-red-100 text-red-700">不足</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4">
        <Link href="/production" className="text-sm text-brand-600 hover:underline">← 返回生產工單列表</Link>
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
