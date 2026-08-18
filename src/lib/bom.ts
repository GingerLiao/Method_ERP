import { prisma } from "@/lib/db";

export type ExplodedLine = {
  productId: number;
  sku: string;
  name: string;
  unit: string;
  qtyPerUnit: number; // 每個成品需求（含損耗）
  totalQty: number; // 生產數量下的總需求
  costPrice: number;
};

/**
 * 多階展開 BOM，回傳最底層（無 BOM）的原物料需求彙總。
 * quantity = 欲生產的成品數量。
 */
export async function explodeBom(
  productId: number,
  quantity: number,
  visited: Set<number> = new Set()
): Promise<ExplodedLine[]> {
  if (visited.has(productId)) return []; // 防止循環參照
  visited.add(productId);

  const bom = await prisma.bom.findUnique({
    where: { productId },
    include: { items: { include: { component: true } } },
  });
  if (!bom) return [];

  const result = new Map<number, ExplodedLine>();

  for (const item of bom.items) {
    const need = item.quantity * (1 + item.lossRate / 100);
    const subBom = await prisma.bom.findUnique({ where: { productId: item.componentId } });

    if (subBom) {
      // 半成品：往下展開
      const sub = await explodeBom(item.componentId, need * quantity, new Set(visited));
      for (const line of sub) {
        const ex = result.get(line.productId);
        if (ex) {
          ex.totalQty += line.totalQty;
          ex.qtyPerUnit += line.qtyPerUnit;
        } else {
          result.set(line.productId, { ...line });
        }
      }
    } else {
      const c = item.component;
      const ex = result.get(c.id);
      if (ex) {
        ex.qtyPerUnit += need;
        ex.totalQty += need * quantity;
      } else {
        result.set(c.id, {
          productId: c.id,
          sku: c.sku,
          name: c.name,
          unit: c.unit,
          qtyPerUnit: need,
          totalQty: need * quantity,
          costPrice: c.costPrice,
        });
      }
    }
  }

  return Array.from(result.values());
}

/** 依 BOM 展開計算單位成品的標準成本 */
export async function bomUnitCost(productId: number): Promise<number> {
  const lines = await explodeBom(productId, 1);
  return lines.reduce((s, l) => s + l.qtyPerUnit * l.costPrice, 0);
}
