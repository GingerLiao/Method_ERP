"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatMoney } from "@/lib/utils";

type Product = { id: number; sku: string; name: string; unit: string; costPrice: number };
type Item = { componentId: number; quantity: number; lossRate: number };

export default function BomEditor({
  bomId,
  productId,
  products,
  initialVersion = "v1",
  initialNote = "",
  initialItems = [],
  finishedProducts,
}: {
  bomId?: number;
  productId?: number;
  products: Product[]; // 可作為用料的商品
  initialVersion?: string;
  initialNote?: string;
  initialItems?: Item[];
  finishedProducts?: Product[]; // 建立時可選的成品
}) {
  const router = useRouter();
  const isEdit = !!bomId;
  const [product, setProduct] = useState<number>(productId ?? finishedProducts?.[0]?.id ?? 0);
  const [version, setVersion] = useState(initialVersion);
  const [note, setNote] = useState(initialNote);
  const [items, setItems] = useState<Item[]>(initialItems);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const cost = items.reduce((s, it) => {
    const p = products.find((x) => x.id === it.componentId);
    return s + (p?.costPrice ?? 0) * it.quantity * (1 + it.lossRate / 100);
  }, 0);

  function addItem() {
    const first = products.find((p) => p.id !== product) ?? products[0];
    if (first) setItems([...items, { componentId: first.id, quantity: 1, lossRate: 0 }]);
  }
  function update(i: number, patch: Partial<Item>) {
    setItems(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  }
  function remove(i: number) {
    setItems(items.filter((_, idx) => idx !== i));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) { setError("請至少新增一項用料"); return; }
    setBusy(true);
    setError("");
    try {
      const res = await fetch(isEdit ? `/api/bom/${bomId}` : "/api/bom", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isEdit ? { version, note, items } : { productId: product, version, note, items }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "儲存失敗");
      router.push("/bom");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "儲存失敗");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="card mb-4 grid grid-cols-1 gap-4 p-6 sm:grid-cols-3">
        <div>
          <label className="label">成品 *</label>
          {isEdit ? (
            <input className="input" disabled value={products.find((p) => p.id === product)?.name ?? finishedProducts?.find((p)=>p.id===product)?.name ?? ""} />
          ) : (
            <select className="input" value={product} onChange={(e) => setProduct(Number(e.target.value))}>
              {finishedProducts?.map((p) => <option key={p.id} value={p.id}>{p.sku} · {p.name}</option>)}
            </select>
          )}
        </div>
        <div>
          <label className="label">版本</label>
          <input className="input" value={version} onChange={(e) => setVersion(e.target.value)} />
        </div>
        <div>
          <label className="label">備註</label>
          <input className="input" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-slate-100 bg-slate-50">
            <tr>
              <th className="th">用料元件</th>
              <th className="th text-right">用量</th>
              <th className="th text-right">損耗率 %</th>
              <th className="th text-right">用料成本</th>
              <th className="th"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {items.length === 0 ? (
              <tr><td colSpan={5} className="td py-8 text-center text-slate-400">尚無用料，請點下方新增</td></tr>
            ) : (
              items.map((it, i) => {
                const p = products.find((x) => x.id === it.componentId);
                const lineCost = (p?.costPrice ?? 0) * it.quantity * (1 + it.lossRate / 100);
                return (
                  <tr key={i}>
                    <td className="td">
                      <select className="input" value={it.componentId} onChange={(e) => update(i, { componentId: Number(e.target.value) })}>
                        {products.filter((p) => p.id !== product).map((p) => (
                          <option key={p.id} value={p.id}>{p.sku} · {p.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="td"><input type="number" step="0.01" min="0" className="input w-24 text-right"
                      value={it.quantity} onChange={(e) => update(i, { quantity: Number(e.target.value) })} /></td>
                    <td className="td"><input type="number" step="0.1" min="0" className="input w-20 text-right"
                      value={it.lossRate} onChange={(e) => update(i, { lossRate: Number(e.target.value) })} /></td>
                    <td className="td text-right font-medium">{formatMoney(lineCost)}</td>
                    <td className="td text-right"><button type="button" onClick={() => remove(i)} className="text-red-500 hover:underline">移除</button></td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
          <button type="button" onClick={addItem} className="btn-ghost">＋ 新增用料</button>
          <div className="text-lg font-bold text-slate-900">單位標準成本：{formatMoney(cost)}</div>
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button type="button" onClick={() => router.back()} className="btn-ghost">取消</button>
        <button type="submit" disabled={busy} className="btn-primary">{busy ? "儲存中…" : "儲存 BOM"}</button>
      </div>
    </form>
  );
}
