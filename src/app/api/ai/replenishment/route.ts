import { NextResponse } from "next/server";
import { buildReplenishmentStats } from "@/lib/replenishment";
import { askClaudeJson, isAiConfigured } from "@/lib/ai";

export const dynamic = "force-dynamic";

type AiRec = {
  sku: string;
  priority: "high" | "medium" | "low";
  suggestedQty: number;
  reason: string;
};

export async function POST() {
  const stats = await buildReplenishmentStats();

  // 未設定金鑰：回傳純統計基準
  if (!isAiConfigured()) {
    return NextResponse.json({
      aiEnabled: false,
      stats,
      recommendations: stats
        .filter((s) => s.needsReorder)
        .map((s) => ({
          sku: s.sku,
          priority: s.daysOfCover < 7 ? "high" : "medium",
          suggestedQty: s.suggestedQty,
          reason: `庫存 ${s.onHand} ${s.unit}，可用約 ${s.daysOfCover} 天，低於再訂購點 ${s.reorderPoint}`,
        })),
    });
  }

  // 交給 Claude 做綜合判斷
  const system = `你是一位資深的供應鏈與存貨管理顧問，服務於一間台灣製造業新創（美瑟科技）。
你會拿到每個商品的庫存與近期消耗數據。請判斷哪些商品需要補貨、建議補貨數量與優先順序，並用繁體中文給出精簡、專業的理由。
考量：安全庫存、再訂購點、平均日消耗、可用天數、需求趨勢（比較近 30 天與近 90 天平均）。
只回傳 JSON，格式如下，不要有其他文字：
{"recommendations":[{"sku":"...","priority":"high|medium|low","suggestedQty":數字,"reason":"..."}],"summary":"整體庫存健康度與行動建議，2-3 句"}`;

  const user = `以下是商品庫存與消耗數據（JSON）：\n${JSON.stringify(
    stats.map((s) => ({
      sku: s.sku, name: s.name, unit: s.unit, onHand: s.onHand,
      safetyStock: s.safetyStock, reorderPoint: s.reorderPoint,
      avgDaily: s.avgDaily, sold30: s.sold30, sold90: s.sold90,
      daysOfCover: s.daysOfCover,
    }))
  )}`;

  try {
    const ai = await askClaudeJson<{ recommendations: AiRec[]; summary: string }>({
      system, user, maxTokens: 2048,
    });
    return NextResponse.json({ aiEnabled: true, stats, ...ai });
  } catch (e) {
    return NextResponse.json(
      { aiEnabled: true, error: e instanceof Error ? e.message : "AI 分析失敗", stats },
      { status: 200 }
    );
  }
}
