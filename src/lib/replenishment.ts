import { prisma } from "@/lib/db";

export type ReplenishStat = {
  productId: number;
  sku: string;
  name: string;
  unit: string;
  onHand: number;
  safetyStock: number;
  reorderPoint: number;
  costPrice: number;
  sold30: number; // 近 30 天出貨量
  sold90: number; // 近 90 天出貨量
  avgDaily: number; // 平均日消耗
  daysOfCover: number; // 可用天數
  suggestedQty: number; // 基準建議補貨量
  needsReorder: boolean;
};

/**
 * 產生每個商品的補貨統計基準（不依賴 AI）。
 * 供 AI 進一步分析，或在未設定金鑰時直接呈現。
 */
export async function buildReplenishmentStats(): Promise<ReplenishStat[]> {
  const products = await prisma.product.findMany({
    where: { isActive: true, type: { not: "SERVICE" } },
    include: { inventories: true },
  });

  const since90 = new Date(Date.now() - 90 * 864e5);
  const since30 = new Date(Date.now() - 30 * 864e5);

  // 抓出貨/耗料類異動（數量為負）
  const movements = await prisma.stockMovement.findMany({
    where: {
      createdAt: { gte: since90 },
      type: { in: ["OUT", "CONSUME"] },
    },
    select: { productId: true, quantity: true, createdAt: true },
  });

  const sold30 = new Map<number, number>();
  const sold90 = new Map<number, number>();
  for (const m of movements) {
    const out = Math.abs(m.quantity);
    sold90.set(m.productId, (sold90.get(m.productId) ?? 0) + out);
    if (m.createdAt >= since30) sold30.set(m.productId, (sold30.get(m.productId) ?? 0) + out);
  }

  const stats: ReplenishStat[] = products.map((p) => {
    const onHand = p.inventories.reduce((s, i) => s + i.quantity, 0);
    const s90 = sold90.get(p.id) ?? 0;
    const s30 = sold30.get(p.id) ?? 0;
    const avgDaily = s90 / 90;
    const daysOfCover = avgDaily > 0 ? onHand / avgDaily : Infinity;

    // 建議補貨量：補到「30 天需求 + 安全庫存」的水位
    const target = avgDaily * 30 + p.safetyStock;
    const suggestedQty = Math.max(0, Math.ceil(target - onHand));
    const needsReorder = onHand <= p.reorderPoint || (avgDaily > 0 && daysOfCover < 14);

    return {
      productId: p.id, sku: p.sku, name: p.name, unit: p.unit,
      onHand, safetyStock: p.safetyStock, reorderPoint: p.reorderPoint,
      costPrice: p.costPrice, sold30: s30, sold90: s90,
      avgDaily: Number(avgDaily.toFixed(2)),
      daysOfCover: daysOfCover === Infinity ? 999 : Math.round(daysOfCover),
      suggestedQty, needsReorder,
    };
  });

  // 需補貨的排前面，可用天數少的優先
  stats.sort((a, b) => {
    if (a.needsReorder !== b.needsReorder) return a.needsReorder ? -1 : 1;
    return a.daysOfCover - b.daysOfCover;
  });

  return stats;
}
