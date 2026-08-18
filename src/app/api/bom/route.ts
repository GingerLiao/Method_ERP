import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const schema = z.object({
  productId: z.coerce.number().int(),
  version: z.string().default("v1"),
  note: z.string().optional().nullable(),
  items: z
    .array(
      z.object({
        componentId: z.coerce.number().int(),
        quantity: z.coerce.number().positive(),
        lossRate: z.coerce.number().min(0).default(0),
      })
    )
    .min(1, "至少需要一項用料"),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }
  const d = parsed.data;

  // 防呆：不可把成品自己當成用料
  if (d.items.some((it) => it.componentId === d.productId)) {
    return NextResponse.json({ error: "成品不可作為自身的用料" }, { status: 400 });
  }

  const existing = await prisma.bom.findUnique({ where: { productId: d.productId } });
  if (existing) {
    return NextResponse.json({ error: "此商品已有 BOM，請直接編輯" }, { status: 409 });
  }

  const bom = await prisma.bom.create({
    data: {
      productId: d.productId,
      version: d.version,
      note: d.note,
      items: {
        create: d.items.map((it) => ({
          componentId: it.componentId,
          quantity: it.quantity,
          lossRate: it.lossRate,
        })),
      },
    },
  });
  return NextResponse.json(bom, { status: 201 });
}
