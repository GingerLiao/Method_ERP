"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Tab = "product" | "query";

const PRODUCT_EXAMPLES = [
  "新增藍牙耳機，成本 300 售價 790，單位副，安全庫存 50",
  "無線滑鼠，一個成本 120、賣 350，倉庫至少留 80 個",
];
const QUERY_EXAMPLES = [
  "近 90 天哪個商品賣最好？",
  "哪些商品庫存偏低需要注意？",
  "目前庫存總值大概多少？毛利最高的是哪個商品？",
];

export default function AssistantClient() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("product");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [product, setProduct] = useState<Record<string, any> | null>(null);
  const [answer, setAnswer] = useState("");

  async function run() {
    if (!text.trim()) return;
    setLoading(true);
    setError("");
    setProduct(null);
    setAnswer("");
    try {
      const res = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: tab, text }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "發生錯誤");
      if (tab === "product") setProduct(j.data);
      else setAnswer(j.answer);
    } catch (err) {
      setError(err instanceof Error ? err.message : "發生錯誤");
    } finally {
      setLoading(false);
    }
  }

  function createProduct() {
    if (!product) return;
    const q = new URLSearchParams({
      name: product.name ?? "",
      unit: product.unit ?? "個",
      costPrice: String(product.costPrice ?? 0),
      salePrice: String(product.salePrice ?? 0),
      safetyStock: String(product.safetyStock ?? 0),
      reorderPoint: String(product.reorderPoint ?? 0),
      description: product.description ?? "",
    });
    router.push(`/products/new?${q.toString()}`);
  }

  const examples = tab === "product" ? PRODUCT_EXAMPLES : QUERY_EXAMPLES;

  return (
    <div className="max-w-3xl">
      <div className="mb-4 inline-flex rounded-lg border border-slate-200 bg-white p-1">
        <TabBtn active={tab === "product"} onClick={() => setTab("product")}>🆕 建立商品</TabBtn>
        <TabBtn active={tab === "query"} onClick={() => setTab("query")}>💬 數據問答</TabBtn>
      </div>

      <div className="card p-5">
        <textarea
          className="input" rows={3}
          placeholder={tab === "product" ? "用一句話描述商品，例如：新增藍牙耳機，成本 300 售價 790…" : "輸入你想了解的營運問題…"}
          value={text} onChange={(e) => setText(e.target.value)}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {examples.map((ex) => (
            <button key={ex} onClick={() => setText(ex)}
              className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 hover:bg-slate-200">
              {ex}
            </button>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={run} disabled={loading} className="btn-primary">
            {loading ? "處理中…" : tab === "product" ? "解析" : "詢問"}
          </button>
        </div>
      </div>

      {error && <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {product && (
        <div className="mt-4 card p-5">
          <h3 className="mb-3 font-semibold text-slate-900">解析結果</h3>
          <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <Field label="品名" value={product.name} />
            <Field label="單位" value={product.unit} />
            <Field label="成本" value={product.costPrice} />
            <Field label="售價" value={product.salePrice} />
            <Field label="安全庫存" value={product.safetyStock} />
            <Field label="再訂購點" value={product.reorderPoint} />
          </dl>
          {product.description && <p className="mt-3 text-sm text-slate-500">{product.description}</p>}
          <div className="mt-4 flex justify-end">
            <button onClick={createProduct} className="btn-primary">帶入商品建立表單 →</button>
          </div>
        </div>
      )}

      {answer && (
        <div className="mt-4 card border-l-4 border-l-brand-500 p-5">
          <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-brand-700">
            <span>✨</span> AI 回覆
          </div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{answer}</p>
        </div>
      )}
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${active ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-50"}`}>
      {children}
    </button>
  );
}

function Field({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="font-medium text-slate-800">{value || "-"}</dd>
    </div>
  );
}
