import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const schema = z.object({
  version: z.string().optional(),
  note: z.string().optional().nullable(),
  items: z
    .array(
      z.object({
        componentId: z.coerce.number().int(),
        quantity: z.coerce.number().positive(),
        lossRate: z.coerce.number().min(0).default(0),
      })
    )
    .min(1),
});

// 以整批取代方式更新 BOM 用料
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }
  const d = parsed.data;

  await prisma.$transaction(async (tx) => {
    await tx.bomItem.deleteMany({ where: { bomId: id } });
    await tx.bom.update({
      where: { id },
      data: {
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
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.bom.delete({ where: { id: Number(params.id) } });
  return NextResponse.json({ deleted: true });
}
