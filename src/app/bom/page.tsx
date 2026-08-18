import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatMoney, formatQty } from "@/lib/utils";
import { PageHeader, EmptyState } from "@/components/ui";
import { bomUnitCost } from "@/lib/bom";

export const dynamic = "force-dynamic";

export default async function BomListPage() {
  const boms = await prisma.bom.findMany({
    include: {
      product: true,
      items: { include: { component: true } },
    },
    orderBy: { productId: "asc" },
  });

  const withCost = await Promise.all(
    boms.map(async (b) => ({ bom: b, cost: await bomUnitCost(b.productId) }))
  );

  return (
    <div>
      <PageHeader
        title="物料清單 BOM"
        subtitle="定義組合品／成品的用料結構，作為生產與成本計算依據"
        action={<Link href="/bom/new" className="btn-primary">＋ 建立 BOM</Link>}
      />

      {boms.length === 0 ? (
        <EmptyState message="尚未建立任何 BOM" action={<Link href="/bom/new" className="btn-primary">建立第一份 BOM</Link>} />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {withCost.map(({ bom, cost }) => (
            <div key={bom.id} className="card p-5">
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-900">{bom.product.name}</h3>
                    <span className="badge bg-brand-50 text-brand-700">{bom.version}</span>
                  </div>
                  <div className="font-mono text-xs text-slate-400">{bom.product.sku}</div>
                </div>
                <Link href={`/bom/${bom.id}`} className="text-sm text-brand-600 hover:underline">編輯</Link>
              </div>
              <ul className="mb-3 space-y-1.5">
                {bom.items.map((it) => (
                  <li key={it.id} className="flex items-center justify-between text-sm">
                    <span className="text-slate-700">
                      {it.component.name}
                      {it.lossRate > 0 && <span className="ml-1 text-xs text-amber-600">損耗 {it.lossRate}%</span>}
                    </span>
                    <span className="font-medium text-slate-600">
                      × {formatQty(it.quantity)} {it.component.unit}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
                <span className="text-slate-400">展開標準成本</span>
                <span className="font-bold text-slate-900">{formatMoney(cost)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
