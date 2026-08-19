import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { applyStockMovement } from "@/lib/inventory";

// PATCH { action: "confirm" | "receive" | "cancel" }
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const { action } = await req.json();
  const po = await prisma.purchaseOrder.findUnique({ where: { id }, include: { items: true } });
  if (!po) return NextResponse.json({ error: "找不到採購單" }, { status: 404 });

  if (action === "confirm") {
    if (po.status !== "DRAFT") return NextResponse.json({ error: "僅草稿可確認" }, { status: 400 });
    await prisma.purchaseOrder.update({ where: { id }, data: { status: "CONFIRMED" } });
    return NextResponse.json({ ok: true });
  }

  if (action === "cancel") {
    if (po.status === "RECEIVED") return NextResponse.json({ error: "已入庫無法取消" }, { status: 400 });
    await prisma.purchaseOrder.update({ where: { id }, data: { status: "CANCELLED" } });
    return NextResponse.json({ ok: true });
  }

  if (action === "receive") {
    if (po.status !== "CONFIRMED" && po.status !== "DRAFT") {
      return NextResponse.json({ error: "此狀態無法入庫" }, { status: 400 });
    }
    await prisma.$transaction(async (tx) => {
      for (const it of po.items) {
        await applyStockMovement(tx, {
          productId: it.productId,
          warehouseId: po.warehouseId,
          type: "IN",
          quantity: it.quantity,
          unitCost: it.unitPrice,
          refType: "PURCHASE",
          refId: po.id,
          note: `採購入庫 ${po.orderNo}`,
        });
        await tx.purchaseOrderItem.update({
          where: { id: it.id },
          data: { receivedQty: it.quantity },
        });
      }
      await tx.purchaseOrder.update({ where: { id }, data: { status: "RECEIVED" } });
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "未知動作" }, { status: 400 });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const po = await prisma.purchaseOrder.findUnique({ where: { id } });
  if (po?.status === "RECEIVED") {
    return NextResponse.json({ error: "已入庫的採購單無法刪除" }, { status: 400 });
  }
  await prisma.purchaseOrder.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
