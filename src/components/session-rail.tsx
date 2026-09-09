// شريط المواعيد الجانبي (يسار الشاشة) — ثابت في كل الصفحات — مصنّف حسب القرب
import Link from "next/link";
import { AlarmClock, ChevronLeft } from "lucide-react";
import { getSessionRail } from "@/lib/queries";
import { arNum, arTime, arWeekday, cn, truncate } from "@/lib/utils";

const GROUPS: Array<{ key: string; label: string; dot: string; activeDot: string }> = [
  { key: "today", label: "اليوم", dot: "bg-danger-600", activeDot: "bg-danger-600" },
  { key: "tomorrow", label: "غداً", dot: "bg-warn-600", activeDot: "bg-warn-600" },
  { key: "d3", label: "خلال ٣ أيام", dot: "bg-gold-500", activeDot: "bg-gold-500" },
  { key: "d14", label: "خلال ١٤ يوم", dot: "bg-info-600", activeDot: "bg-info-600" },
  { key: "d30", label: "خلال ٣٠ يوم", dot: "bg-slate-400", activeDot: "bg-slate-400" },
];

export async function SessionRail() {
  const groups = await getSessionRail();
  const total = Object.values(groups).reduce((a, g) => a + g.length, 0);

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-card lg:flex">
      <div className="border-b border-line px-4 pb-3 pt-[4.25rem]">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-[13.5px] font-bold text-navy-950">
            <AlarmClock className="h-4 w-4 text-gold-600" />
            المواعيد القريبة
          </h2>
          <span className="chip bg-navy-900 text-gold-300" dir="ltr">{arNum(total)}</span>
        </div>
        <Link href="/sessions" className="mt-1.5 inline-flex items-center gap-0.5 text-[11px] font-bold text-gold-700 hover:underline">
          كل الجلسات والمواعيد <ChevronLeft className="h-3 w-3" />
        </Link>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-3.5 py-4">
        {GROUPS.map(({ key, label, dot }) => {
          const list = groups[key] ?? [];
          if (list.length === 0) return null;
          return (
            <div key={key}>
              <div className="mb-2 flex items-center gap-2 px-1">
                <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />
                <p className="text-[11px] font-bold text-ink/55">{label}</p>
                <span className="text-[10px] font-semibold text-ink/30">({arNum(list.length)})</span>
                <span className="h-px flex-1 bg-line" />
              </div>
              <div className="relative space-y-0.5 pr-1.5 before:absolute before:right-[3px] before:top-2 before:h-[calc(100%-16px)] before:w-px before:bg-line">
                {list.slice(0, 6).map((t) => (
                  <Link key={t.id} href={`/tasks/${t.id}`} className="group relative block rounded-lg px-2.5 py-2 transition hover:bg-paper/90">
                    <span className={cn("absolute -right-1.5 top-3 h-[7px] w-[7px] rounded-full border-2 border-card", dot)} />
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-[12px] font-bold leading-5 text-ink/85 group-hover:text-navy-950">{truncate(t.title, 42)}</p>
                    </div>
                    <div className="mt-0.5 flex items-center justify-between gap-2">
                      <span className="truncate text-[10px] font-medium text-ink/40">{t.location?.name ?? t.caseRef?.name ?? "—"}</span>
                      {t.date && (
                        <span className="shrink-0 text-[10px] font-bold text-gold-700">
                          {arWeekday(t.date)}{t.time ? ` · ${arTime(t.time)}` : ""}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
                {list.length > 6 && (
                  <Link href={`/sessions?bucket=${key}`} className="block px-2.5 py-1 text-[10px] font-bold text-gold-700 hover:underline">
                    + {arNum(list.length - 6)} موعداً آخر
                  </Link>
                )}
              </div>
            </div>
          );
        })}
        {total === 0 && (
          <p className="rounded-lg border border-dashed border-line px-3 py-6 text-center text-[11px] text-ink/40">
            لا مواعيد خلال ٣٠ يوماً
          </p>
        )}
      </div>
    </aside>
  );
}
