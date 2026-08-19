import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { applyStockMovement } from "@/lib/inventory";
import { explodeBom, bomUnitCost } from "@/lib/bom";

// PATCH { action: "start" | "complete" | "cancel" }
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const { action } = await req.json();
  const mo = await prisma.productionOrder.findUnique({ where: { id } });
  if (!mo) return NextResponse.json({ error: "找不到生產工單" }, { status: 404 });

  if (action === "start") {
    if (mo.status !== "DRAFT") return NextResponse.json({ error: "僅草稿可開工" }, { status: 400 });
    await prisma.productionOrder.update({
      where: { id }, data: { status: "IN_PROGRESS", startDate: new Date() },
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "cancel") {
    if (mo.status === "COMPLETED") return NextResponse.json({ error: "已完工無法取消" }, { status: 400 });
    await prisma.productionOrder.update({ where: { id }, data: { status: "CANCELLED" } });
    return NextResponse.json({ ok: true });
  }

  if (action === "complete") {
    if (mo.status !== "IN_PROGRESS" && mo.status !== "DRAFT") {
      return NextResponse.json({ error: "此狀態無法完工" }, { status: 400 });
    }
    // 展開 BOM 取得原物料需求
    const requirements = await explodeBom(mo.productId, mo.quantity);

    // 檢查用料庫存是否足夠
    for (const r of requirements) {
      const inv = await prisma.inventory.findUnique({
        where: { productId_warehouseId: { productId: r.productId, warehouseId: mo.warehouseId } },
      });
      if ((inv?.quantity ?? 0) < r.totalQty) {
        return NextResponse.json(
          { error: `用料「${r.name}」庫存不足（現有 ${inv?.quantity ?? 0}，需 ${r.totalQty.toFixed(2)}）` },
          { status: 400 }
        );
      }
    }

    const unitCost = await bomUnitCost(mo.productId);

    await prisma.$transaction(async (tx) => {
      // 扣用料
      for (const r of requirements) {
        await applyStockMovement(tx, {
          productId: r.productId,
          warehouseId: mo.warehouseId,
          type: "CONSUME",
          quantity: -r.totalQty,
          refType: "PRODUCTION",
          refId: mo.id,
          note: `生產耗料 ${mo.orderNo}`,
        });
      }
      // 成品入庫
      await applyStockMovement(tx, {
        productId: mo.productId,
        warehouseId: mo.warehouseId,
        type: "PRODUCE",
        quantity: mo.quantity,
        unitCost,
        refType: "PRODUCTION",
        refId: mo.id,
        note: `生產入庫 ${mo.orderNo}`,
      });
      // 更新成品標準成本
      await tx.product.update({ where: { id: mo.productId }, data: { costPrice: unitCost } });
      await tx.productionOrder.update({
        where: { id }, data: { status: "COMPLETED", completeDate: new Date() },
      });
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "未知動作" }, { status: 400 });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const mo = await prisma.productionOrder.findUnique({ where: { id: Number(params.id) } });
  if (mo?.status === "COMPLETED") {
    return NextResponse.json({ error: "已完工的工單無法刪除" }, { status: 400 });
  }
  await prisma.productionOrder.delete({ where: { id: Number(params.id) } });
  return NextResponse.json({ deleted: true });
}
