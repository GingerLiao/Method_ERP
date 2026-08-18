import Link from "next/link";
import { STATUS_COLORS, STATUS_LABELS } from "@/lib/utils";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex items-start justify-between">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`badge ${STATUS_COLORS[status] ?? "bg-slate-100 text-slate-700"}`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function EmptyState({
  message,
  action,
}: {
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="text-4xl">📭</div>
      <p className="text-sm text-slate-500">{message}</p>
      {action}
    </div>
  );
}

export function LinkButton({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "ghost";
}) {
  return (
    <Link href={href} className={variant === "primary" ? "btn-primary" : "btn-ghost"}>
      {children}
    </Link>
  );
}

export function Stat({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "warn" | "danger" | "good";
}) {
  const toneColor =
    tone === "warn"
      ? "text-amber-600"
      : tone === "danger"
      ? "text-red-600"
      : tone === "good"
      ? "text-green-600"
      : "text-slate-900";
  return (
    <div className="card p-5">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </div>
      <div className={`mt-2 text-2xl font-bold ${toneColor}`}>{value}</div>
      {hint && <div className="mt-1 text-xs text-slate-400">{hint}</div>}
    </div>
  );
}
