"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Product = { id: number; sku: string; name: string; unit: string };

export default function ProductionForm({
  products,
}: {
  products: Product[];
}) {
  const router = useRouter();
  const [productId, setProductId] = useState(products[0]?.id ?? 0);
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/production", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity, note }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "建立失敗");
      router.push("/production");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "建立失敗");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="max-w-2xl">
      {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      <div className="card space-y-4 p-6">
        <div>
          <label className="label">成品（限有 BOM 的組合品）*</label>
          <select className="input" value={productId} onChange={(e) => setProductId(Number(e.target.value))}>
            {products.map((p) => <option key={p.id} value={p.id}>{p.sku} · {p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">生產數量 *</label>
          <input type="number" step="1" min="1" className="input text-right"
            value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
        </div>
        <div>
          <label className="label">備註</label>
          <input className="input" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button type="button" onClick={() => router.back()} className="btn-ghost">取消</button>
        <button type="submit" disabled={busy} className="btn-primary">{busy ? "建立中…" : "建立工單"}</button>
      </div>
    </form>
  );
}
