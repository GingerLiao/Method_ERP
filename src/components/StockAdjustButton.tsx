"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function StockAdjustButton({
  productId,
  productName,
  unit,
  warehouses,
}: {
  productId: number;
  productName: string;
  unit: string;
  warehouses: { id: number; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    warehouseId: warehouses[0]?.id ?? 0,
    type: "IN",
    quantity: 0,
    note: "",
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    await fetch("/api/inventory/adjust", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, productId }),
    });
    setBusy(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="text-brand-600 hover:underline">調整</button>
      {open && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/30 p-4" onClick={() => setOpen(false)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="mb-1 text-lg font-bold text-slate-900">庫存調整</h3>
            <p className="mb-4 text-sm text-slate-500">{productName}</p>
            <div className="space-y-3">
              <div>
                <label className="label">倉庫</label>
                <select className="input" value={form.warehouseId}
                  onChange={(e) => setForm({ ...form, warehouseId: Number(e.target.value) })}>
                  {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">異動方式</label>
                <select className="input" value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option value="IN">入庫（增加）</option>
                  <option value="OUT">出庫（減少）</option>
                  <option value="ADJUST">盤點（設為目標數量）</option>
                </select>
              </div>
              <div>
                <label className="label">數量（{unit}）</label>
                <input type="number" step="0.01" className="input text-right" value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
              </div>
              <div>
                <label className="label">備註</label>
                <input className="input" value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })} />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} className="btn-ghost">取消</button>
              <button type="submit" disabled={busy} className="btn-primary">{busy ? "處理中…" : "確認"}</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
