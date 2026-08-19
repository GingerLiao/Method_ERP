import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { makeOrderNo } from "@/lib/utils";
import { nextSeq } from "@/lib/inventory";

const schema = z.object({
  productId: z.coerce.number().int(),
  warehouseId: z.coerce.number().int(),
  quantity: z.coerce.number().positive(),
  note: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }
  const d = parsed.data;
  const bom = await prisma.bom.findUnique({ where: { productId: d.productId } });
  if (!bom) {
    return NextResponse.json({ error: "此成品尚未建立 BOM，無法開立生產工單" }, { status: 400 });
  }
  const seq = await nextSeq("productionOrder");
  const mo = await prisma.productionOrder.create({
    data: {
      orderNo: makeOrderNo("MO", seq),
      productId: d.productId,
      bomId: bom.id,
      warehouseId: d.warehouseId,
      quantity: d.quantity,
      note: d.note,
      status: "DRAFT",
    },
  });
  return NextResponse.json(mo, { status: 201 });
}
