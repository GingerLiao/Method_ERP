"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { href: string; label: string; icon: string };
type NavGroup = { title: string; items: NavItem[] };

const NAV: NavGroup[] = [
  {
    title: "總覽",
    items: [{ href: "/", label: "儀表板", icon: "📊" }],
  },
  {
    title: "基礎資料",
    items: [
      { href: "/products", label: "商品管理", icon: "📦" },
      { href: "/categories", label: "商品分類", icon: "🗂️" },
    ],
  },
  {
    title: "存 · 庫存",
    items: [
      { href: "/inventory", label: "庫存查詢", icon: "📋" },
      { href: "/inventory/movements", label: "庫存異動", icon: "🔄" },
    ],
  },
  {
    title: "進 · 採購",
    items: [
      { href: "/suppliers", label: "供應商", icon: "🤝" },
      { href: "/purchasing", label: "採購單", icon: "🛒" },
    ],
  },
  {
    title: "銷 · 銷售",
    items: [
      { href: "/customers", label: "客戶", icon: "👤" },
      { href: "/sales", label: "銷售單", icon: "🧾" },
    ],
  },
  {
    title: "生產 · BOM",
    items: [
      { href: "/bom", label: "物料清單 BOM", icon: "🧩" },
      { href: "/production", label: "生產工單", icon: "⚙️" },
    ],
  },
  {
    title: "AI 智慧",
    items: [
      { href: "/ai/replenishment", label: "智慧補貨預測", icon: "🤖" },
      { href: "/ai/assistant", label: "AI 輸入助手", icon: "✨" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <aside className="fixed inset-y-0 left-0 z-20 flex w-60 flex-col border-r border-slate-200 bg-white">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-lg font-bold text-white">
          M
        </div>
        <div>
          <div className="text-sm font-bold text-slate-900">美瑟進銷存</div>
          <div className="text-[11px] text-slate-400">Method ERP</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-6">
        {NAV.map((group) => (
          <div key={group.title} className="mb-4">
            <div className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              {group.title}
            </div>
            {group.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`mb-0.5 flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition ${
                  isActive(item.href)
                    ? "bg-brand-50 font-semibold text-brand-700"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      <div className="border-t border-slate-200 px-5 py-3 text-[11px] text-slate-400">
        美瑟科技 © 2026
      </div>
    </aside>
  );
}
