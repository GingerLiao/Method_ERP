import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { askClaudeJson, askClaudeText, isAiConfigured } from "@/lib/ai";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!isAiConfigured()) {
    return NextResponse.json({ error: "尚未設定 ANTHROPIC_API_KEY，AI 助手無法使用" }, { status: 400 });
  }
  const { mode, text } = await req.json();
  if (!text?.trim()) return NextResponse.json({ error: "請輸入內容" }, { status: 400 });

  // 模式一：把自然語言描述解析成商品欄位
  if (mode === "product") {
    const system = `你是進銷存系統的資料輸入助手。使用者會用自然語言描述一項商品，請抽取成結構化欄位。
只回傳 JSON，格式如下（缺少的數值填 0，缺少的文字填空字串）：
{"name":"品名","unit":"單位如 個/台/箱","costPrice":成本數字,"salePrice":售價數字,"safetyStock":安全庫存數字,"reorderPoint":再訂購點數字,"description":"簡短說明"}
若使用者未提供再訂購點，可用安全庫存的 1.5 倍估算。`;
    try {
      const data = await askClaudeJson<Record<string, unknown>>({ system, user: text, maxTokens: 512 });
      return NextResponse.json({ mode: "product", data });
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : "解析失敗" }, { status: 500 });
    }
  }

  // 模式二：針對現有營運資料回答自然語言問題
  const [products, salesItems, invAgg] = await Promise.all([
    prisma.product.findMany({ where: { isActive: true }, include: { inventories: true } }),
    prisma.salesOrderItem.findMany({
      where: { so: { orderDate: { gte: new Date(Date.now() - 90 * 864e5) } } },
      include: { product: true, so: true },
    }),
    prisma.inventory.findMany(),
  ]);

  // 彙總近 90 天各商品銷量與金額
  const salesByProduct = new Map<string, { name: string; qty: number; amount: number }>();
  for (const it of salesItems) {
    const k = it.product.sku;
    const cur = salesByProduct.get(k) ?? { name: it.product.name, qty: 0, amount: 0 };
    cur.qty += it.quantity;
    cur.amount += it.subtotal;
    salesByProduct.set(k, cur);
  }

  const snapshot = {
    今日: new Date().toISOString().slice(0, 10),
    商品庫存: products.map((p) => ({
      sku: p.sku, 品名: p.name, 單位: p.unit,
      庫存: p.inventories.reduce((s, i) => s + i.quantity, 0),
      安全庫存: p.safetyStock, 售價: p.salePrice, 成本: p.costPrice,
    })),
    近90天銷售: Array.from(salesByProduct.entries()).map(([sku, v]) => ({
      sku, 品名: v.name, 銷量: v.qty, 銷售額: v.amount,
    })),
  };

  const system = `你是美瑟科技進銷存系統的 AI 分析助手。根據提供的營運資料快照，用繁體中文簡潔、專業地回答使用者問題。
若問題涉及數字，請具體引用資料中的數值；若資料不足以回答，請誠實說明。回覆控制在 5 句內，可用條列。`;
  const user = `營運資料快照（JSON）：\n${JSON.stringify(snapshot)}\n\n使用者問題：${text}`;

  try {
    const answer = await askClaudeText({ system, user, maxTokens: 1024 });
    return NextResponse.json({ mode: "query", answer });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "查詢失敗" }, { status: 500 });
  }
}
