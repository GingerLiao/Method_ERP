import Anthropic from "@anthropic-ai/sdk";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514";

export function isAiConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

/**
 * 呼叫 Claude 並要求回傳純 JSON。會自動去除 ```json 圍籬並解析。
 */
export async function askClaudeJson<T = unknown>(args: {
  system: string;
  user: string;
  maxTokens?: number;
}): Promise<T> {
  const resp = await getClient().messages.create({
    model: MODEL,
    max_tokens: args.maxTokens ?? 2048,
    system: args.system,
    messages: [{ role: "user", content: args.user }],
  });

  const text = resp.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();

  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // 嘗試擷取第一個 JSON 物件/陣列
    const match = cleaned.match(/[[{][\s\S]*[\]}]/);
    if (match) return JSON.parse(match[0]) as T;
    throw new Error("AI 回應無法解析為 JSON：" + text.slice(0, 200));
  }
}

/** 一般文字回覆（給自然語言問答用） */
export async function askClaudeText(args: {
  system: string;
  user: string;
  maxTokens?: number;
}): Promise<string> {
  const resp = await getClient().messages.create({
    model: MODEL,
    max_tokens: args.maxTokens ?? 1024,
    system: args.system,
    messages: [{ role: "user", content: args.user }],
  });
  return resp.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}
