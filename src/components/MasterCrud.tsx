"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export type Field = {
  key: string;
  label: string;
  type?: "text" | "number" | "select";
  required?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
  showInTable?: boolean;
};

export type Row = Record<string, any> & { id: number };

export default function MasterCrud({
  apiBase,
  fields,
  rows,
  displayColumns,
}: {
  apiBase: string;
  fields: Field[];
  rows: Row[];
  // 只顯示、不可編輯的欄位（例如統計數字）。用資料驅動，避免跨伺服器/客戶端傳函式。
  displayColumns?: { key: string; label: string }[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<Row | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const tableFields = fields.filter((f) => f.showInTable !== false);

  function openNew() {
    setEditing(null);
    setForm(Object.fromEntries(fields.map((f) => [f.key, ""])));
    setError("");
    setShowForm(true);
  }
  function openEdit(r: Row) {
    setEditing(r);
    setForm({ ...r });
    setError("");
    setShowForm(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const url = editing ? `${apiBase}/${editing.id}` : apiBase;
      const res = await fetch(url, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).error || "儲存失敗");
      setShowForm(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "儲存失敗");
    } finally {
      setBusy(false);
    }
  }

  async function remove(r: Row) {
    if (!confirm(`確定刪除「${r.name}」？`)) return;
    const res = await fetch(`${apiBase}/${r.id}`, { method: "DELETE" });
    if (!res.ok) {
      alert((await res.json()).error || "刪除失敗");
      return;
    }
    router.refresh();
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <button onClick={openNew} className="btn-primary">＋ 新增</button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-slate-100 bg-slate-50">
              <tr>
                {tableFields.map((f) => (
                  <th key={f.key} className="th">{f.label}</th>
                ))}
                {displayColumns?.map((c) => (
                  <th key={c.key} className="th">{c.label}</th>
                ))}
                <th className="th"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={tableFields.length + (displayColumns?.length ?? 0) + 1} className="td py-10 text-center text-slate-400">
                    尚無資料
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    {tableFields.map((f) => (
                      <td key={f.key} className="td">
                        {f.type === "select"
                          ? f.options?.find((o) => o.value === String(r[f.key]))?.label ?? r[f.key] ?? "-"
                          : r[f.key] ?? "-"}
                      </td>
                    ))}
                    {displayColumns?.map((c) => (
                      <td key={c.key} className="td text-slate-500">{r[c.key] ?? "-"}</td>
                    ))}
                    <td className="td text-right">
                      <button onClick={() => openEdit(r)} className="mr-3 text-brand-600 hover:underline">編輯</button>
                      <button onClick={() => remove(r)} className="text-red-500 hover:underline">刪除</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/30 p-4" onClick={() => setShowForm(false)}>
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={save}
            className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"
          >
            <h3 className="mb-4 text-lg font-bold text-slate-900">{editing ? "編輯" : "新增"}</h3>
            {error && <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {fields.map((f) => (
                <div key={f.key} className={f.type === "text" && f.key === "address" ? "sm:col-span-2" : ""}>
                  <label className="label">{f.label}{f.required && " *"}</label>
                  {f.type === "select" ? (
                    <select className="input" value={form[f.key] ?? ""} required={f.required}
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}>
                      <option value="">請選擇</option>
                      {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  ) : (
                    <input
                      className="input" type={f.type === "number" ? "number" : "text"}
                      required={f.required} placeholder={f.placeholder} value={form[f.key] ?? ""}
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="btn-ghost">取消</button>
              <button type="submit" disabled={busy} className="btn-primary">{busy ? "儲存中…" : "儲存"}</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
