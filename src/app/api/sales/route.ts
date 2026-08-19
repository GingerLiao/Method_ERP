import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { makeOrderNo } from "@/lib/utils";
import { nextSeq, getDefaultWarehouseId } from "@/lib/inventory";

const schema = z.object({
  customerId: z.coerce.number().int(),
  note: z.string().optional().nullable(),
  items: z
    .array(
      z.object({
        productId: z.coerce.number().int(),
        quantity: z.coerce.number().positive(),
        unitPrice: z.coerce.number().min(0),
      })
    )
    .min(1, "至少需要一筆明細"),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }
  const d = parsed.data;
  const total = d.items.reduce((s, it) => s + it.quantity * it.unitPrice, 0);
  const seq = await nextSeq("salesOrder");
  const warehouseId = await getDefaultWarehouseId();

  const so = await prisma.salesOrder.create({
    data: {
      orderNo: makeOrderNo("SO", seq),
      customerId: d.customerId,
      warehouseId,
      note: d.note,
      total,
      status: "DRAFT",
      items: {
        create: d.items.map((it) => ({
          productId: it.productId,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          subtotal: it.quantity * it.unitPrice,
        })),
      },
    },
  });
  return NextResponse.json(so, { status: 201 });
}
