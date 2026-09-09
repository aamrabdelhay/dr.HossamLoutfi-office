// التقويم التشغيلي — شبكة شهرية بمواعيد المكتب
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getActiveLawyers, getLocations, getMonthTasks } from "@/lib/queries";
import { db } from "@/db";
import { cases } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getPerms } from "@/lib/permissions";
import type { TaskView } from "@/lib/queries";
import { TaskCard } from "@/components/task-card";
import { TaskCreator } from "@/components/task-creator";
import { EmptyState, PageHeader } from "@/components/ui";
import { arNum, cn, fmtDate, parseLocal, todayStr } from "@/lib/utils";

export const dynamic = "force-dynamic";

const WEEK_HEADER = ["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];
const MONTHS = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ m?: string; d?: string }> }) {
  const { m, d } = await searchParams;
  const today = todayStr();
  const monthKey = m && /^\d{4}-\d{2}$/.test(m) ? m : today.slice(0, 7);
  const [y, mo] = monthKey.split("-").map(Number);
  const daysInMonth = new Date(y, mo, 0).getDate();
  const firstDow = (new Date(y, mo - 1, 1).getDay() + 1) % 7; // السبت أول الأسبوع

  const prevKey = fmtDate(new Date(y, mo - 2, 1)).slice(0, 7);
  const nextKey = fmtDate(new Date(y, mo, 1)).slice(0, 7);

  const [{ perms }, monthTasks, lawyers, locations, openCases] = await Promise.all([
    getPerms(),
    getMonthTasks(y, mo),
    getActiveLawyers(),
    getLocations({ activeOnly: true }),
    db.select({ id: cases.id, name: cases.name, caseNumber: cases.caseNumber }).from(cases).where(eq(cases.status, "OPEN")),
  ]);

  const byDay = new Map<string, TaskView[]>();
  for (const t of monthTasks) {
    if (!t.date) continue;
    const list = byDay.get(t.date) ?? [];
    list.push(t);
    byDay.set(t.date, list);
  }

  const selected = d && d.startsWith(monthKey) ? d : today.startsWith(monthKey) ? today : null;
  const selectedTasks = selected ? (byDay.get(selected) ?? []) : [];

  const cells: Array<{ key: string; day: number; dateStr: string } | null> = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${monthKey}-${String(day).padStart(2, "0")}`;
    cells.push({ key: dateStr, day, dateStr });
  }

  return (
    <div>
      <PageHeader title="التقويم التشغيلي" subtitle={`${MONTHS[mo - 1]} ${arNum(y)} — ${arNum(monthTasks.length)} موعداً هذا الشهر`}>
        {perms.manageTasks && (
          <TaskCreator
            lawyers={lawyers.map((l) => ({ id: l.id, firstName: l.firstName, lastName: l.lastName, title: l.title }))}
            locations={locations.map((l) => ({ id: l.id, name: l.name, type: l.type }))}
            cases={openCases}
            defaultType="SESSION"
            label="+ موعد جديد"
          />
        )}
      </PageHeader>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-line bg-navy-950 px-4 py-3">
          <Link href={`/calendar?m=${prevKey}`} className="grid h-8 w-8 place-items-center rounded-lg text-white/70 transition hover:bg-white/10" aria-label="الشهر السابق">
            <ChevronRight className="h-4 w-4" />
          </Link>
          <p className="text-sm font-bold text-white">{MONTHS[mo - 1]} {arNum(y)}</p>
          <Link href={`/calendar?m=${nextKey}`} className="grid h-8 w-8 place-items-center rounded-lg text-white/70 transition hover:bg-white/10" aria-label="الشهر التالي">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-7 border-b border-line bg-gold-50">
          {WEEK_HEADER.map((w) => (
            <div key={w} className="px-1 py-2 text-center text-[10px] font-bold text-ink/50 sm:text-[11px]">{w}</div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {cells.map((cell, i) => {
            if (!cell) return <div key={`e-${i}`} className="min-h-16 border-b border-l border-line/50 bg-paper/60 sm:min-h-24" />;
            const dayTasks = byDay.get(cell.dateStr) ?? [];
            const isToday = cell.dateStr === today;
            const isSelected = cell.dateStr === selected;
            const hasCritical = dayTasks.some((t) => t.priority === "CRITICAL" && t.status !== "COMPLETED" && t.status !== "CANCELLED");
            return (
              <Link
                key={cell.key}
                href={`/calendar?m=${monthKey}&d=${cell.dateStr}`}
                className={cn(
                  "group min-h-16 border-b border-l border-line/50 p-1.5 transition sm:min-h-24 sm:p-2",
                  isSelected ? "bg-navy-950" : isToday ? "bg-gold-100/70" : "bg-white hover:bg-gold-50",
                  hasCritical && !isSelected && "bg-red-50/70",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className={cn(
                    "grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold",
                    isSelected ? "bg-gold-500 text-navy-950" : isToday ? "bg-gold-500 text-navy-950" : "text-ink/60",
                  )}>
                    {arNum(cell.day)}
                  </span>
                  {dayTasks.length > 0 && (
                    <span className={cn("text-[9px] font-bold", isSelected ? "text-gold-300" : "text-gold-700")}>{arNum(dayTasks.length)}</span>
                  )}
                </div>
                <div className="mt-1 space-y-0.5">
                  {dayTasks.slice(0, 3).map((t) => (
                    <div
                      key={t.id}
                      className={cn(
                        "truncate rounded px-1 py-px text-[9px] font-semibold leading-4",
                        isSelected ? "bg-white/10 text-white"
                          : t.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700 line-through"
                          : t.priority === "CRITICAL" ? "bg-red-100 text-red-700"
                          : t.type === "SESSION" ? "bg-navy-900 text-gold-300"
                          : "bg-gold-100 text-gold-700",
                      )}
                    >
                      {t.title}
                    </div>
                  ))}
                  {dayTasks.length > 3 && <p className={cn("px-1 text-[8px]", isSelected ? "text-white/50" : "text-ink/40")}>+{arNum(dayTasks.length - 3)}</p>}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* مواعيد اليوم المحدد */}
      <div className="mt-6">
        <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-navy-900">
          <span className="h-4 w-1 rounded-full bg-gold-500" />
          {selected ? `مواعيد يوم ${selected === today ? "اليوم — " : ""}${arNum(parseLocal(selected).getDate())} ${MONTHS[parseLocal(selected).getMonth()]}` : "اختر يوماً لعرض المواعيد"}
        </h2>
        {selected && selectedTasks.length === 0 && <EmptyState title="لا مواعيد في هذا اليوم" />}
        <div className="grid gap-4 lg:grid-cols-2">
          {selectedTasks.map((t) => (
            <TaskCard key={t.id} task={t} from={`/calendar?m=${monthKey}&d=${selected}`} canManage={perms.manageTasks} />
          ))}
        </div>
      </div>
    </div>
  );
}
