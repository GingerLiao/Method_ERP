import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  barcode: z.string().optional().nullable(),
  categoryId: z.coerce.number().int().optional().nullable(),
  unit: z.string().optional(),
  type: z.enum(["STOCK", "SERVICE", "BOM"]).optional(),
  costPrice: z.coerce.number().min(0).optional(),
  salePrice: z.coerce.number().min(0).optional(),
  safetyStock: z.coerce.number().min(0).optional(),
  reorderPoint: z.coerce.number().min(0).optional(),
  reorderQty: z.coerce.number().min(0).optional(),
  description: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const product = await prisma.product.findUnique({
    where: { id: Number(params.id) },
    include: { category: true, inventories: true },
  });
  if (!product) return NextResponse.json({ error: "找不到商品" }, { status: 404 });
  return NextResponse.json(product);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }
  const product = await prisma.product.update({
    where: { id: Number(params.id) },
    data: parsed.data,
  });
  return NextResponse.json(product);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  // 有交易紀錄則改為停用，避免破壞歷史資料
  const [mv, poi, soi] = await Promise.all([
    prisma.stockMovement.count({ where: { productId: id } }),
    prisma.purchaseOrderItem.count({ where: { productId: id } }),
    prisma.salesOrderItem.count({ where: { productId: id } }),
  ]);
  if (mv + poi + soi > 0) {
    await prisma.product.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ softDeleted: true });
  }
  await prisma.inventory.deleteMany({ where: { productId: id } });
  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
