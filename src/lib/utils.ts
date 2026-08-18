// 共用工具函式

export function formatMoney(n: number | null | undefined): string {
  const v = Number(n ?? 0);
  return "NT$ " + v.toLocaleString("zh-TW", { maximumFractionDigits: 0 });
}

export function formatQty(n: number | null | undefined): string {
  const v = Number(n ?? 0);
  return v.toLocaleString("zh-TW", { maximumFractionDigits: 2 });
}

export function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "-";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

// 產生單據編號：前綴 + YYYYMMDD + 4 碼流水
export function makeOrderNo(prefix: string, seq: number): string {
  const now = new Date();
  const ymd =
    now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0");
  return `${prefix}${ymd}-${String(seq).padStart(4, "0")}`;
}

// 單據狀態的中文與樣式
export const STATUS_LABELS: Record<string, string> = {
  DRAFT: "草稿",
  CONFIRMED: "已確認",
  RECEIVED: "已入庫",
  SHIPPED: "已出貨",
  IN_PROGRESS: "生產中",
  COMPLETED: "已完工",
  CANCELLED: "已取消",
};

export const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  RECEIVED: "bg-green-100 text-green-700",
  SHIPPED: "bg-green-100 text-green-700",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export const MOVEMENT_LABELS: Record<string, string> = {
  IN: "入庫",
  OUT: "出庫",
  ADJUST: "調整",
  TRANSFER: "調撥",
  PRODUCE: "生產入庫",
  CONSUME: "生產耗料",
};
