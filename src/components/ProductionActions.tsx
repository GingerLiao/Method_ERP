"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ProductionActions({ id, status }: { id: number; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function act(action: string) {
    const msgs: Record<string, string> = {
      complete: "確認完工？將扣除用料庫存並將成品入庫。",
      cancel: "確定取消此工單？",
      delete: "確定刪除此工單？",
    };
    if (msgs[action] && !confirm(msgs[action])) return;
    setBusy(true);
    const res = await fetch(`/api/production/${id}`, {
      method: action === "delete" ? "DELETE" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: action === "delete" ? undefined : JSON.stringify({ action }),
    });
    setBusy(false);
    if (!res.ok) { alert((await res.json()).error || "操作失敗"); return; }
    if (action === "delete") router.push("/production");
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status === "DRAFT" && <button disabled={busy} onClick={() => act("start")} className="btn-ghost">開工</button>}
      {(status === "DRAFT" || status === "IN_PROGRESS") && (
        <button disabled={busy} onClick={() => act("complete")} className="btn-primary">確認完工</button>
      )}
      {status !== "COMPLETED" && status !== "CANCELLED" && (
        <button disabled={busy} onClick={() => act("cancel")} className="btn-ghost">取消</button>
      )}
      {status !== "COMPLETED" && <button disabled={busy} onClick={() => act("delete")} className="btn-danger">刪除</button>}
    </div>
  );
}
