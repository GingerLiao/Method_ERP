import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const productSchema = z.object({
  sku: z.string().min(1, "商品編號必填"),
  name: z.string().min(1, "品名必填"),
  barcode: z.string().optional().nullable(),
  categoryId: z.coerce.number().int().optional().nullable(),
  unit: z.string().default("個"),
  type: z.enum(["STOCK", "SERVICE", "BOM"]).default("STOCK"),
  costPrice: z.coerce.number().min(0).default(0),
  salePrice: z.coerce.number().min(0).default(0),
  safetyStock: z.coerce.number().min(0).default(0),
  reorderPoint: z.coerce.number().min(0).default(0),
  reorderQty: z.coerce.number().min(0).default(0),
  description: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  const products = await prisma.product.findMany({
    where: q
      ? { OR: [{ name: { contains: q } }, { sku: { contains: q } }, { barcode: { contains: q } }] }
      : undefined,
    include: { category: true, inventories: true },
    orderBy: { sku: "asc" },
  });
  const data = products.map((p) => ({
    ...p,
    totalStock: p.inventories.reduce((s, i) => s + i.quantity, 0),
  }));
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }
  const exists = await prisma.product.findUnique({ where: { sku: parsed.data.sku } });
  if (exists) {
    return NextResponse.json({ error: "商品編號已存在" }, { status: 409 });
  }
  const product = await prisma.product.create({ data: parsed.data });
  return NextResponse.json(product, { status: 201 });
}
