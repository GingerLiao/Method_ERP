import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type Model = "category" | "warehouse" | "supplier" | "customer";

// 各資源的欄位型別（用於轉型）
const NUMERIC: Record<string, string[]> = {
  category: ["parentId"],
  warehouse: [],
  supplier: [],
  customer: [],
};
const REQUIRED: Record<Model, string[]> = {
  category: ["name"],
  warehouse: ["code", "name"],
  supplier: ["code", "name"],
  customer: ["code", "name"],
};

function coerce(model: Model, body: Record<string, any>) {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(body)) {
    if (k === "id" || v === undefined) continue;
    if (v === "" ) {
      out[k] = NUMERIC[model].includes(k) ? null : null;
      continue;
    }
    out[k] = NUMERIC[model].includes(k) ? Number(v) : v;
  }
  return out;
}

export function listHandler(model: Model, orderBy: any = { id: "asc" }) {
  return async () => {
    const rows = await (prisma[model] as any).findMany({ orderBy });
    return NextResponse.json(rows);
  };
}

export function createHandler(model: Model) {
  return async (req: NextRequest) => {
    const body = await req.json();
    for (const r of REQUIRED[model]) {
      if (!body[r]) return NextResponse.json({ error: `${r} 為必填` }, { status: 400 });
    }
    try {
      const row = await (prisma[model] as any).create({ data: coerce(model, body) });
      return NextResponse.json(row, { status: 201 });
    } catch (e: any) {
      if (e.code === "P2002") return NextResponse.json({ error: "編號已存在" }, { status: 409 });
      return NextResponse.json({ error: "建立失敗" }, { status: 400 });
    }
  };
}

export function updateHandler(model: Model) {
  return async (req: NextRequest, { params }: { params: { id: string } }) => {
    const body = await req.json();
    const row = await (prisma[model] as any).update({
      where: { id: Number(params.id) },
      data: coerce(model, body),
    });
    return NextResponse.json(row);
  };
}

export function deleteHandler(model: Model) {
  return async (_req: NextRequest, { params }: { params: { id: string } }) => {
    try {
      await (prisma[model] as any).delete({ where: { id: Number(params.id) } });
      return NextResponse.json({ deleted: true });
    } catch {
      return NextResponse.json({ error: "此資料已被單據引用，無法刪除" }, { status: 409 });
    }
  };
}
