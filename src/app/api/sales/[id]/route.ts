import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { applyStockMovement } from "@/lib/inventory";

// PATCH { action: "confirm" | "receive"(=ship) | "cancel" }
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const { action } = await req.json();
  const so = await prisma.salesOrder.findUnique({ where: { id }, include: { items: true } });
  if (!so) return NextResponse.json({ error: "找不到銷售單" }, { status: 404 });

  if (action === "confirm") {
    if (so.status !== "DRAFT") return NextResponse.json({ error: "僅草稿可確認" }, { status: 400 });
    await prisma.salesOrder.update({ where: { id }, data: { status: "CONFIRMED" } });
    return NextResponse.json({ ok: true });
  }

  if (action === "cancel") {
    if (so.status === "SHIPPED") return NextResponse.json({ error: "已出貨無法取消" }, { status: 400 });
    await prisma.salesOrder.update({ where: { id }, data: { status: "CANCELLED" } });
    return NextResponse.json({ ok: true });
  }

  // receive 在銷售端代表「出貨」
  if (action === "receive") {
    if (so.status !== "CONFIRMED" && so.status !== "DRAFT") {
      return NextResponse.json({ error: "此狀態無法出貨" }, { status: 400 });
    }
    // 檢查庫存是否足夠
    for (const it of so.items) {
      const inv = await prisma.inventory.findUnique({
        where: { productId_warehouseId: { productId: it.productId, warehouseId: so.warehouseId } },
      });
      if ((inv?.quantity ?? 0) < it.quantity) {
        const p = await prisma.product.findUnique({ where: { id: it.productId } });
        return NextResponse.json(
          { error: `「${p?.name}」庫存不足（現有 ${inv?.quantity ?? 0}，需 ${it.quantity}）` },
          { status: 400 }
        );
      }
    }
    await prisma.$transaction(async (tx) => {
      for (const it of so.items) {
        await applyStockMovement(tx, {
          productId: it.productId,
          warehouseId: so.warehouseId,
          type: "OUT",
          quantity: -it.quantity,
          refType: "SALE",
          refId: so.id,
          note: `銷售出貨 ${so.orderNo}`,
        });
        await tx.salesOrderItem.update({ where: { id: it.id }, data: { shippedQty: it.quantity } });
      }
      await tx.salesOrder.update({ where: { id }, data: { status: "SHIPPED" } });
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "未知動作" }, { status: 400 });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const so = await prisma.salesOrder.findUnique({ where: { id } });
  if (so?.status === "SHIPPED") {
    return NextResponse.json({ error: "已出貨的銷售單無法刪除" }, { status: 400 });
  }
  await prisma.salesOrder.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
