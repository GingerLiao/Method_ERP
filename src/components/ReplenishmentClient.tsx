"use client";

import { useState } from "react";
import { formatMoney, formatQty } from "@/lib/utils";

type Stat = {
  productId: number; sku: string; name: string; unit: string;
  onHand: number; safetyStock: number; reorderPoint: number; costPrice: number;
  sold30: number; sold90: number; avgDaily: number; daysOfCover: number;
  suggestedQty: number; needsReorder: boolean;
};
type Rec = { sku: string; priority: string; suggestedQty: number; reason: string };
type Result = {
  aiEnabled: boolean; stats: Stat[]; recommendations?: Rec[];
  summary?: string; error?: string;
};

const PRIORITY_STYLE: Record<string, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-slate-100 text-slate-600",
};
const PRIORITY_LABEL: Record<string, string> = { high: "急", medium: "中", low: "低" };

export default function ReplenishmentClient() {
  const [data, setData] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);

  async function analyze() {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/replenishment", { method: "POST" });
      setData(await res.json());
    } finally {
      setLoading(false);
    }
  }

  const recMap = new Map((data?.recommendations ?? []).map((r) => [r.sku, r]));
  const totalCost = (data?.recommendations ?? []).reduce((s, r) => {
    const st = data?.stats.find((x) => x.sku === r.sku);
    return s + (st ? r.suggestedQty * st.costPrice : 0);
  }, 0);

  return (
    <div>
      <button onClick={analyze} disabled={loading} className="btn-primary mb-6">
        {loading ? "分析中…" : data ? "重新分析" : "開始分析"}
      </button>

      {loading && (
        <div className="card p-8 text-center text-slate-500">
          正在分析庫存與消耗趨勢…
        </div>
      )}

      {data && !loading && (
        <div className="space-y-6">
          {data.summary && (
            <div className="card border-l-4 border-l-brand-500 p-5">
              <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-brand-700">
                <span>✨</span> AI 綜合判讀
              </div>
              <p className="text-sm leading-relaxed text-slate-700">{data.summary}</p>
            </div>
          )}
          {data.error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              AI 分析發生問題：{data.error}（以下為統計基準）
            </div>
          )}

          {/* 補貨建議 */}
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
              <h2 className="font-semibold text-slate-900">建議補貨清單</h2>
              <span className="text-sm text-slate-500">預估採購成本 {formatMoney(totalCost)}</span>
            </div>
            {(data.recommendations ?? []).length === 0 ? (
              <p className="py-10 text-center text-sm text-slate-400">目前庫存充足，無須補貨 👍</p>
            ) : (
              <table className="w-full">
                <thead className="border-b border-slate-100 bg-slate-50">
                  <tr>
                    <th className="th">優先</th>
                    <th className="th">商品</th>
                    <th className="th text-right">建議補貨量</th>
                    <th className="th">分析理由</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {(data.recommendations ?? []).map((r) => {
                    const st = data.stats.find((x) => x.sku === r.sku);
                    return (
                      <tr key={r.sku}>
                        <td className="td">
                          <span className={`badge ${PRIORITY_STYLE[r.priority] ?? PRIORITY_STYLE.low}`}>
                            {PRIORITY_LABEL[r.priority] ?? r.priority}
                          </span>
                        </td>
                        <td className="td font-medium text-slate-900">
                          {st?.name ?? r.sku}
                          <span className="ml-1 font-mono text-xs text-slate-400">{r.sku}</span>
                        </td>
                        <td className="td text-right font-bold text-brand-700">
                          {formatQty(r.suggestedQty)} {st?.unit}
                        </td>
                        <td className="td text-slate-600">{r.reason}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* 全品項統計 */}
          <div className="card overflow-hidden">
            <div className="border-b border-slate-100 px-5 py-3 font-semibold text-slate-900">
              全品項消耗與庫存基準
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-slate-100 bg-slate-50">
                  <tr>
                    <th className="th">商品</th>
                    <th className="th text-right">庫存</th>
                    <th className="th text-right">近30天</th>
                    <th className="th text-right">近90天</th>
                    <th className="th text-right">日均耗</th>
                    <th className="th text-right">可用天數</th>
                    <th className="th text-right">再訂購點</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data.stats.map((s) => (
                    <tr key={s.productId} className={recMap.has(s.sku) ? "bg-red-50/40" : ""}>
                      <td className="td font-medium text-slate-900">{s.name}</td>
                      <td className="td text-right">{formatQty(s.onHand)}</td>
                      <td className="td text-right text-slate-500">{formatQty(s.sold30)}</td>
                      <td className="td text-right text-slate-500">{formatQty(s.sold90)}</td>
                      <td className="td text-right text-slate-500">{s.avgDaily}</td>
                      <td className={`td text-right font-semibold ${s.daysOfCover < 14 ? "text-red-600" : "text-slate-700"}`}>
                        {s.daysOfCover >= 999 ? "充足" : `${s.daysOfCover} 天`}
                      </td>
                      <td className="td text-right text-slate-400">{formatQty(s.reorderPoint)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
