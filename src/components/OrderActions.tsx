"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// 依單據狀態顯示可用動作按鈕（採購/銷售通用）
export default function OrderActions({
  apiBase,
  id,
  status,
  mode,
}: {
  apiBase: string;
  id: number;
  status: string;
  mode: "purchase" | "sale";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const receiveLabel = mode === "purchase" ? "確認入庫" : "確認出貨";

  async function act(action: string) {
    const confirmMsg: Record<string, string> = {
      receive: mode === "purchase" ? "確認入庫？將增加庫存並記錄異動。" : "確認出貨？將扣減庫存。",
      cancel: "確定取消此單？",
      delete: "確定刪除此單？",
    };
    if (confirmMsg[action] && !confirm(confirmMsg[action])) return;

    setBusy(true);
    const res = await fetch(`${apiBase}/${id}`, {
      method: action === "delete" ? "DELETE" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: action === "delete" ? undefined : JSON.stringify({ action }),
    });
    setBusy(false);
    if (!res.ok) { alert((await res.json()).error || "操作失敗"); return; }
    if (action === "delete") {
      router.push(mode === "purchase" ? "/purchasing" : "/sales");
    }
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status === "DRAFT" && (
        <button disabled={busy} onClick={() => act("confirm")} className="btn-ghost">確認單據</button>
      )}
      {(status === "DRAFT" || status === "CONFIRMED") && (
        <button disabled={busy} onClick={() => act("receive")} className="btn-primary">{receiveLabel}</button>
      )}
      {status !== "RECEIVED" && status !== "SHIPPED" && status !== "CANCELLED" && (
        <button disabled={busy} onClick={() => act("cancel")} className="btn-ghost">取消單據</button>
      )}
      {status !== "RECEIVED" && status !== "SHIPPED" && (
        <button disabled={busy} onClick={() => act("delete")} className="btn-danger">刪除</button>
      )}
    </div>
  );
}
