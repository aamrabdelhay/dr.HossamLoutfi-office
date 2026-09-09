// مكونات واجهة مشتركة (Server-safe)
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import {
  arNum, cn,
  CASE_STATUS_LABELS, CONFIDENCE_LABELS, LOCATION_STATUS_LABELS,
  PRIORITY_LABELS, TASK_STATUS_LABELS, TASK_TYPE_LABELS,
  type CaseStatus, type Confidence, type LocationStatus, type Priority, type TaskStatus, type TaskType,
} from "@/lib/utils";

// ---------- تخطيط ----------
export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
      <div>
        <h1 className="text-[22px] font-bold leading-8 text-navy-950">{title}</h1>
        {subtitle && <p className="mt-1 text-[12.5px] font-medium text-ink/45">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

// ---------- شارات ----------
type Tone = "gold" | "green" | "red" | "blue" | "gray" | "amber" | "navy" | "rose" | "slate";
const TONES: Record<Tone, string> = {
  gold: "bg-gold-100 text-gold-700",
  green: "bg-ok-100 text-ok-700",
  red: "bg-danger-100 text-danger-700",
  blue: "bg-info-100 text-info-700",
  gray: "bg-slate-100 text-slate-500",
  amber: "bg-warn-100 text-warn-700",
  navy: "bg-navy-900 text-gold-300",
  rose: "bg-danger-50 text-danger-600 border border-danger-100",
  slate: "bg-slate-50 text-slate-600 border border-slate-200",
};

export function Badge({ tone = "gray", children, className }: { tone?: Tone; children: React.ReactNode; className?: string }) {
  return <span className={cn("chip", TONES[tone], className)}>{children}</span>;
}

export function StatusBadge({ status }: { status: TaskStatus }) {
  const map: Record<TaskStatus, { tone: Tone; dot: string }> = {
    PENDING: { tone: "amber", dot: "bg-warn-600" },
    IN_PROGRESS: { tone: "blue", dot: "bg-info-600" },
    COMPLETED: { tone: "green", dot: "bg-ok-600" },
    CANCELLED: { tone: "gray", dot: "bg-slate-400" },
  };
  const m = map[status];
  return (
    <Badge tone={m.tone}>
      <span className={cn("h-1.5 w-1.5 rounded-full", m.dot)} />
      {TASK_STATUS_LABELS[status]}
    </Badge>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  if (priority === "NORMAL") return null;
  const tone: Tone = priority === "CRITICAL" ? "red" : "gold";
  return <Badge tone={tone}>{PRIORITY_LABELS[priority]}</Badge>;
}

export function TypeBadge({ type }: { type: TaskType }) {
  const tone: Tone = type === "SESSION" ? "navy" : type === "ENTITY_VISIT" ? "blue" : type === "POST" ? "gold" : type === "ACTIVITY" ? "green" : "gray";
  return <Badge tone={tone}>{TASK_TYPE_LABELS[type]}</Badge>;
}

export function LocationStatusBadge({ status }: { status: LocationStatus }) {
  const tone: Tone = status === "VERIFIED" ? "green" : status === "PENDING" ? "amber" : status === "NEEDS_REVIEW" ? "rose" : status === "ARCHIVED" ? "gray" : "blue";
  return <Badge tone={tone}>{LOCATION_STATUS_LABELS[status]}</Badge>;
}

export function ConfidenceBadge({ confidence }: { confidence: Confidence }) {
  const tone: Tone = confidence === "VERIFIED" ? "green" : confidence === "HIGH" ? "blue" : confidence === "MEDIUM" ? "amber" : "rose";
  return <Badge tone={tone}>{CONFIDENCE_LABELS[confidence]}</Badge>;
}

export function CaseStatusBadge({ status }: { status: CaseStatus }) {
  const tone: Tone = status === "OPEN" ? "blue" : status === "CLOSED" ? "green" : "gray";
  return <Badge tone={tone}>{CASE_STATUS_LABELS[status]}</Badge>;
}

// ---------- بطاقة إحصائية احترافية ----------
export function StatCard({ label, value, icon: Icon, tone = "gold", href, hint }: {
  label: string; value: number | string; icon: LucideIcon; tone?: Tone; href?: string; hint?: string;
}) {
  const iconCls: Record<Tone, string> = {
    gold: "bg-gold-100 text-gold-700", green: "bg-ok-100 text-ok-700", red: "bg-danger-100 text-danger-700",
    blue: "bg-info-100 text-info-700", gray: "bg-slate-100 text-slate-500", amber: "bg-warn-100 text-warn-700",
    navy: "bg-navy-900 text-gold-300", rose: "bg-danger-100 text-danger-600", slate: "bg-slate-100 text-slate-600",
  };
  const inner = (
    <div className="card card-hover flex items-center gap-3.5 px-4 py-3.5">
      <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-lg", iconCls[tone])}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-2xl font-bold leading-7 text-navy-950 tabular-nums">{typeof value === "number" ? arNum(value) : value}</p>
        <p className="mt-0.5 truncate text-[11px] font-bold text-ink/45">{label}{hint ? <span className="font-medium text-ink/35"> — {hint}</span> : null}</p>
      </div>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export function EmptyState({ title, hint, children }: { title: string; hint?: string; children?: React.ReactNode }) {
  return (
    <div className="card flex flex-col items-center gap-2 border-dashed px-6 py-12 text-center">
      <div className="grid h-11 w-11 place-items-center rounded-full bg-slate-100 text-slate-400">
        <Inbox className="h-5 w-5" />
      </div>
      <p className="text-[13px] font-bold text-ink/60">{title}</p>
      {hint && <p className="text-xs text-ink/40">{hint}</p>}
      {children}
    </div>
  );
}

export function Avatar({ first, last, size = "md", principal, photoUrl }: {
  first: string; last: string; size?: "sm" | "md" | "lg" | "xl"; principal?: boolean; photoUrl?: string | null;
}) {
  const s = { sm: "h-8 w-8 text-[11px]", md: "h-10 w-10 text-xs", lg: "h-14 w-14 text-base", xl: "h-24 w-24 text-2xl" }[size];
  return (
    <div className={cn("relative shrink-0 select-none", s)}>
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt={`${first} ${last}`} className="h-full w-full rounded-full object-cover ring-2 ring-line" />
      ) : (
        <div className="grid h-full w-full place-items-center rounded-full bg-gradient-to-br from-navy-800 to-navy-950 font-bold text-gold-300 ring-2 ring-line">
          <span>{first.trim()[0]}{last.trim()[0]}</span>
        </div>
      )}
      {principal && <span className="absolute -bottom-0.5 -left-0.5 h-3 w-3 rounded-full bg-gold-400 ring-2 ring-white" title="المحامي الرئيسي" />}
    </div>
  );
}
