import { PrismaClient } from "@prisma/client";
import { prisma } from "./db";

type Tx = PrismaClient | Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];

/**
 * 記錄一筆庫存異動，並同步更新該倉別的即時庫存。
 * 這是所有進出貨、調整、生產耗料/入庫的唯一入口，確保庫存與異動總帳永遠一致。
 */
export async function applyStockMovement(
  tx: Tx,
  args: {
    productId: number;
    warehouseId: number;
    type: string; // IN / OUT / ADJUST / TRANSFER / PRODUCE / CONSUME
    quantity: number; // 正數＝增加、負數＝減少
    unitCost?: number;
    refType?: string;
    refId?: number;
    note?: string;
  }
) {
  const client = tx as PrismaClient;

  await client.stockMovement.create({
    data: {
      productId: args.productId,
      warehouseId: args.warehouseId,
      type: args.type,
      quantity: args.quantity,
      unitCost: args.unitCost ?? 0,
      refType: args.refType,
      refId: args.refId,
      note: args.note,
    },
  });

  const existing = await client.inventory.findUnique({
    where: {
      productId_warehouseId: {
        productId: args.productId,
        warehouseId: args.warehouseId,
      },
    },
  });

  if (existing) {
    await client.inventory.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity + args.quantity },
    });
  } else {
    await client.inventory.create({
      data: {
        productId: args.productId,
        warehouseId: args.warehouseId,
        quantity: args.quantity,
      },
    });
  }
}

/** 取得某商品跨所有倉別的總庫存 */
export async function getTotalStock(productId: number): Promise<number> {
  const agg = await prisma.inventory.aggregate({
    where: { productId },
    _sum: { quantity: true },
  });
  return agg._sum.quantity ?? 0;
}

/** 取得下一個單據流水號（依前綴計數） */
export async function nextSeq(
  model: "purchaseOrder" | "salesOrder" | "productionOrder"
): Promise<number> {
  const count = await (prisma[model] as any).count();
  return count + 1;
}

/**
 * 取得預設倉庫 ID。系統已簡化為單一倉庫（小型公司無需多倉），
 * 若尚未有任何倉庫則自動建立一個，確保庫存邏輯永遠可運作。
 */
export async function getDefaultWarehouseId(): Promise<number> {
  const existing = await prisma.warehouse.findFirst({ orderBy: { id: "asc" } });
  if (existing) return existing.id;
  const created = await prisma.warehouse.create({
    data: { code: "WH01", name: "主倉庫" },
  });
  return created.id;
}
