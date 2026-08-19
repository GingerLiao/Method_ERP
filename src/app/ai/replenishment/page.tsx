import { PageHeader } from "@/components/ui";
import ReplenishmentClient from "@/components/ReplenishmentClient";
import { isAiConfigured } from "@/lib/ai";

export const dynamic = "force-dynamic";

export default function ReplenishmentPage() {
  return (
    <div>
      <PageHeader
        title="🤖 AI 智慧補貨預測"
        subtitle="結合歷史消耗趨勢與 Claude 分析，主動建議補貨品項與數量"
      />
      {!isAiConfigured() && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          尚未設定 AI 金鑰（<code className="rounded bg-amber-100 px-1">GEMINI_API_KEY</code> 或 <code className="rounded bg-amber-100 px-1">ANTHROPIC_API_KEY</code>），目前顯示的是「統計基準」分析。
          設定金鑰後可獲得 AI 的需求趨勢判讀與補貨理由。
        </div>
      )}
      <ReplenishmentClient />
    </div>
  );
}
