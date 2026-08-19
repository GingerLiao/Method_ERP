// AI 供應商抽象層：同時支援 Google Gemini（免費額度）與 Anthropic Claude。
// 依環境變數自動選擇：
//   - 設定 GEMINI_API_KEY → 使用 Gemini（預設 gemini-2.0-flash）
//   - 設定 ANTHROPIC_API_KEY → 使用 Claude
//   - 兩者皆有時，可用 AI_PROVIDER=gemini|anthropic 指定；未指定則優先 Gemini
import Anthropic from "@anthropic-ai/sdk";

type Provider = "gemini" | "anthropic" | "none";

function resolveProvider(): Provider {
  const forced = process.env.AI_PROVIDER?.toLowerCase();
  if (forced === "gemini" && process.env.GEMINI_API_KEY) return "gemini";
  if (forced === "anthropic" && process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  return "none";
}

export function isAiConfigured(): boolean {
  return resolveProvider() !== "none";
}

export function aiProviderName(): string {
  const p = resolveProvider();
  return p === "gemini" ? "Google Gemini" : p === "anthropic" ? "Anthropic Claude" : "未設定";
}

// 從模型輸出擷取並解析 JSON（去除 ```json 圍籬）
function parseJson<T>(text: string): T {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const match = cleaned.match(/[[{][\s\S]*[\]}]/);
    if (match) return JSON.parse(match[0]) as T;
    throw new Error("AI 回應無法解析為 JSON：" + text.slice(0, 200));
  }
}

// ── Gemini（REST，免 SDK）─────────────────────────────
async function geminiGenerate(args: {
  system: string;
  user: string;
  maxTokens?: number;
  json?: boolean;
}): Promise<string> {
  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const key = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

  const body: Record<string, unknown> = {
    system_instruction: { parts: [{ text: args.system }] },
    contents: [{ role: "user", parts: [{ text: args.user }] }],
    generationConfig: {
      maxOutputTokens: args.maxTokens ?? 2048,
      ...(args.json ? { responseMimeType: "application/json" } : {}),
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API 錯誤 (${res.status})：${err.slice(0, 200)}`);
  }
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") ?? "";
  if (!text) throw new Error("Gemini 未回傳內容");
  return text.trim();
}

// ── Claude（SDK）─────────────────────────────────────
let anthropic: Anthropic | null = null;
async function claudeGenerate(args: {
  system: string;
  user: string;
  maxTokens?: number;
}): Promise<string> {
  if (!anthropic) anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514";
  const resp = await anthropic.messages.create({
    model,
    max_tokens: args.maxTokens ?? 2048,
    system: args.system,
    messages: [{ role: "user", content: args.user }],
  });
  return resp.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}

// ── 對外 API（與原本相容，內部自動選供應商）──────────────
export async function askAiJson<T = unknown>(args: {
  system: string;
  user: string;
  maxTokens?: number;
}): Promise<T> {
  const provider = resolveProvider();
  if (provider === "gemini") {
    return parseJson<T>(await geminiGenerate({ ...args, json: true }));
  }
  if (provider === "anthropic") {
    return parseJson<T>(await claudeGenerate(args));
  }
  throw new Error("尚未設定 AI 金鑰");
}

export async function askAiText(args: {
  system: string;
  user: string;
  maxTokens?: number;
}): Promise<string> {
  const provider = resolveProvider();
  if (provider === "gemini") return geminiGenerate(args);
  if (provider === "anthropic") return claudeGenerate(args);
  throw new Error("尚未設定 AI 金鑰");
}

// 舊名稱別名，維持相容
export const askClaudeJson = askAiJson;
export const askClaudeText = askAiText;
