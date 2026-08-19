import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { applyStockMovement, getDefaultWarehouseId } from "@/lib/inventory";

const schema = z.object({
  productId: z.coerce.number().int(),
  type: z.enum(["IN", "OUT", "ADJUST"]),
  quantity: z.coerce.number(), // 使用者輸入的數量（正數）
  note: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }
  const { productId, type, quantity, note } = parsed.data;
  const warehouseId = await getDefaultWarehouseId();

  // IN 增加、OUT 減少、ADJUST 直接設為目標值
  let delta = quantity;
  if (type === "OUT") delta = -Math.abs(quantity);
  if (type === "IN") delta = Math.abs(quantity);
  if (type === "ADJUST") {
    const inv = await prisma.inventory.findUnique({
      where: { productId_warehouseId: { productId, warehouseId } },
    });
    delta = quantity - (inv?.quantity ?? 0);
  }

  await prisma.$transaction(async (tx) => {
    await applyStockMovement(tx, {
      productId, warehouseId, type, quantity: delta,
      refType: "MANUAL", note: note || "手動調整",
    });
  });

  return NextResponse.json({ ok: true });
}
