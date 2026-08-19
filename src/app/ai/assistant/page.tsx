import { PageHeader } from "@/components/ui";
import AssistantClient from "@/components/AssistantClient";
import { isAiConfigured } from "@/lib/ai";

export const dynamic = "force-dynamic";

export default function AssistantPage() {
  return (
    <div>
      <PageHeader
        title="✨ AI 輸入助手"
        subtitle="用一句話建立商品，或用自然語言查詢營運數據"
      />
      {!isAiConfigured() && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          尚未設定 AI 金鑰。請在 <code className="rounded bg-amber-100 px-1">.env</code> 填入 <code className="rounded bg-amber-100 px-1">GEMINI_API_KEY</code>（免費，推薦）或 <code className="rounded bg-amber-100 px-1">ANTHROPIC_API_KEY</code> 後即可使用 AI 助手。
        </div>
      )}
      <AssistantClient />
    </div>
  );
}
