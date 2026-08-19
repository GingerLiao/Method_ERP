"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatMoney } from "@/lib/utils";

type Party = { id: number; name: string; code: string };
type Warehouse = { id: number; name: string };
type Product = { id: number; sku: string; name: string; unit: string; price: number };
type Line = { productId: number; quantity: number; unitPrice: number };

export default function OrderForm({
  mode,
  parties,
  warehouses,
  products,
}: {
  mode: "purchase" | "sale";
  parties: Party[];
  warehouses: Warehouse[];
  products: Product[];
}) {
  const router = useRouter();
  const isPurchase = mode === "purchase";
  const apiBase = isPurchase ? "/api/purchasing" : "/api/sales";
  const listUrl = isPurchase ? "/purchasing" : "/sales";
  const partyLabel = isPurchase ? "供應商" : "客戶";

  const [partyId, setPartyId] = useState<number>(parties[0]?.id ?? 0);
  const [warehouseId, setWarehouseId] = useState<number>(warehouses[0]?.id ?? 0);
  const [note, setNote] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const total = lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);

  function addLine() {
    const first = products[0];
    if (!first) return;
    setLines([...lines, { productId: first.id, quantity: 1, unitPrice: first.price }]);
  }
  function updateLine(i: number, patch: Partial<Line>) {
    setLines(lines.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }
  function onProductChange(i: number, productId: number) {
    const p = products.find((x) => x.id === productId);
    updateLine(i, { productId, unitPrice: p?.price ?? 0 });
  }
  function removeLine(i: number) {
    setLines(lines.filter((_, idx) => idx !== i));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (lines.length === 0) { setError("請至少新增一筆明細"); return; }
    setBusy(true);
    setError("");
    try {
      const key = isPurchase ? "supplierId" : "customerId";
      const res = await fetch(apiBase, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: partyId, warehouseId, note, items: lines }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "建立失敗");
      router.push(listUrl);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "建立失敗");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="card mb-4 grid grid-cols-1 gap-4 p-6 sm:grid-cols-3">
        <div>
          <label className="label">{partyLabel} *</label>
          <select className="input" value={partyId} onChange={(e) => setPartyId(Number(e.target.value))}>
            {parties.map((p) => <option key={p.id} value={p.id}>{p.code} · {p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">倉庫 *</label>
          <select className="input" value={warehouseId} onChange={(e) => setWarehouseId(Number(e.target.value))}>
            {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
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
              <th className="th">商品</th>
              <th className="th text-right">數量</th>
              <th className="th text-right">單價</th>
              <th className="th text-right">小計</th>
              <th className="th"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {lines.length === 0 ? (
              <tr><td colSpan={5} className="td py-8 text-center text-slate-400">尚無明細，請點下方新增</td></tr>
            ) : (
              lines.map((l, i) => {
                const p = products.find((x) => x.id === l.productId);
                return (
                  <tr key={i}>
                    <td className="td">
                      <select className="input" value={l.productId} onChange={(e) => onProductChange(i, Number(e.target.value))}>
                        {products.map((p) => <option key={p.id} value={p.id}>{p.sku} · {p.name}</option>)}
                      </select>
                    </td>
                    <td className="td">
                      <input type="number" step="0.01" min="0" className="input w-24 text-right"
                        value={l.quantity} onChange={(e) => updateLine(i, { quantity: Number(e.target.value) })} />
                    </td>
                    <td className="td">
                      <input type="number" step="0.01" min="0" className="input w-28 text-right"
                        value={l.unitPrice} onChange={(e) => updateLine(i, { unitPrice: Number(e.target.value) })} />
                    </td>
                    <td className="td text-right font-medium">{formatMoney(l.quantity * l.unitPrice)}</td>
                    <td className="td text-right">
                      <button type="button" onClick={() => removeLine(i)} className="text-red-500 hover:underline">移除</button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
          <button type="button" onClick={addLine} className="btn-ghost">＋ 新增明細</button>
          <div className="text-lg font-bold text-slate-900">總計：{formatMoney(total)}</div>
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button type="button" onClick={() => router.back()} className="btn-ghost">取消</button>
        <button type="submit" disabled={busy} className="btn-primary">{busy ? "建立中…" : "建立單據（草稿）"}</button>
      </div>
    </form>
  );
}
