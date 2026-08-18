"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Category = { id: number; name: string };
export type ProductInput = {
  id?: number;
  sku: string;
  name: string;
  barcode?: string | null;
  categoryId?: number | null;
  unit: string;
  type: string;
  costPrice: number;
  salePrice: number;
  safetyStock: number;
  reorderPoint: number;
  reorderQty: number;
  description?: string | null;
  isActive: boolean;
};

export default function ProductForm({
  initial,
  categories,
}: {
  initial: ProductInput;
  categories: Category[];
}) {
  const router = useRouter();
  const isEdit = !!initial.id;
  const [form, setForm] = useState<ProductInput>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set<K extends keyof ProductInput>(k: K, v: ProductInput[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const url = isEdit ? `/api/products/${initial.id}` : "/api/products";
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error || "儲存失敗");
      }
      router.push("/products");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm("確定要刪除此商品嗎？若已有交易紀錄將自動改為停用。")) return;
    await fetch(`/api/products/${initial.id}`, { method: "DELETE" });
    router.push("/products");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="max-w-3xl">
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="card space-y-5 p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">商品編號 *</label>
            <input
              className="input font-mono" required value={form.sku} disabled={isEdit}
              onChange={(e) => set("sku", e.target.value)} placeholder="如 FG-1001"
            />
          </div>
          <div>
            <label className="label">品名 *</label>
            <input className="input" required value={form.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div>
            <label className="label">條碼</label>
            <input className="input" value={form.barcode ?? ""} onChange={(e) => set("barcode", e.target.value)} />
          </div>
          <div>
            <label className="label">分類</label>
            <select
              className="input" value={form.categoryId ?? ""}
              onChange={(e) => set("categoryId", e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">未分類</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">類型</label>
            <select className="input" value={form.type} onChange={(e) => set("type", e.target.value)}>
              <option value="STOCK">庫存品</option>
              <option value="BOM">組合品（含 BOM）</option>
              <option value="SERVICE">服務</option>
            </select>
          </div>
          <div>
            <label className="label">單位</label>
            <input className="input" value={form.unit} onChange={(e) => set("unit", e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <NumField label="標準成本" value={form.costPrice} onChange={(v) => set("costPrice", v)} />
          <NumField label="標準售價" value={form.salePrice} onChange={(v) => set("salePrice", v)} />
          <NumField label="安全庫存" value={form.safetyStock} onChange={(v) => set("safetyStock", v)} />
          <NumField label="再訂購點" value={form.reorderPoint} onChange={(v) => set("reorderPoint", v)} />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <NumField label="建議訂購量" value={form.reorderQty} onChange={(v) => set("reorderQty", v)} />
        </div>

        <div>
          <label className="label">說明</label>
          <textarea
            className="input" rows={3} value={form.description ?? ""}
            onChange={(e) => set("description", e.target.value)}
          />
        </div>

        {isEdit && (
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} />
            啟用中
          </label>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div>
          {isEdit && (
            <button type="button" onClick={remove} className="btn-danger">刪除</button>
          )}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => router.back()} className="btn-ghost">取消</button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? "儲存中…" : "儲存"}
          </button>
        </div>
      </div>
    </form>
  );
}

function NumField({
  label, value, onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        type="number" step="0.01" className="input text-right" value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
