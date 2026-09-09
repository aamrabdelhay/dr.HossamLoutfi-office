// ساحة المهام — عرض لوحي حسب الحالة
import { db } from "@/db";
import { cases, tasks } from "@/db/schema";
import { eq, ne } from "drizzle-orm";
import { enrichTasks, getActiveLawyers, getLocations } from "@/lib/queries";
import { getPerms } from "@/lib/permissions";
import { TaskCard } from "@/components/task-card";
import { TaskCreator } from "@/components/task-creator";
import { EmptyState, PageHeader } from "@/components/ui";
import { TASK_STATUS_LABELS, arNum, cn, type TaskStatus } from "@/lib/utils";

export const dynamic = "force-dynamic";

const COLUMNS: Array<{ key: TaskStatus; label: string; ring: string; dot: string }> = [
  { key: "PENDING", label: TASK_STATUS_LABELS.PENDING, ring: "border-amber-200 bg-amber-50/60", dot: "bg-amber-500" },
  { key: "IN_PROGRESS", label: TASK_STATUS_LABELS.IN_PROGRESS, ring: "border-sky-200 bg-sky-50/60", dot: "bg-sky-500" },
  { key: "COMPLETED", label: TASK_STATUS_LABELS.COMPLETED, ring: "border-emerald-200 bg-emerald-50/60", dot: "bg-emerald-500" },
  { key: "CANCELLED", label: TASK_STATUS_LABELS.CANCELLED, ring: "border-line bg-paper/60", dot: "bg-ink/30" },
];

export default async function TasksBoardPage() {
  const [{ perms }, rows, lawyers, locations, openCases] = await Promise.all([
    getPerms(),
    db.select().from(tasks).where(ne(tasks.type, "POST")),
    getActiveLawyers(),
    getLocations({ activeOnly: true }),
    db.select({ id: cases.id, name: cases.name, caseNumber: cases.caseNumber }).from(cases).where(eq(cases.status, "OPEN")),
  ]);
  const all = await enrichTasks(rows, true);
  const byStatus = (s: TaskStatus) =>
    all
      .filter((t) => t.status === s)
      .sort((a, b) => (a.date ?? "9999").localeCompare(b.date ?? "9999") || (a.time ?? "").localeCompare(b.time ?? ""));

  return (
    <div>
      <PageHeader title="ساحة المهام" subtitle="كل الجلسات والتكليفات مرتبة حسب حالة التنفيذ">
        {perms.manageTasks && (
          <TaskCreator
            lawyers={lawyers.map((l) => ({ id: l.id, firstName: l.firstName, lastName: l.lastName, title: l.title }))}
            locations={locations.map((l) => ({ id: l.id, name: l.name, type: l.type }))}
            cases={openCases}
            defaultType="ASSIGNMENT"
            label="+ تكليف جديد"
          />
        )}
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((col) => {
          const list = byStatus(col.key);
          return (
            <div key={col.key} className={cn("rounded-2xl border p-3", col.ring)}>
              <div className="mb-3 flex items-center justify-between px-1">
                <p className="flex items-center gap-2 text-xs font-bold text-ink/70">
                  <span className={cn("h-2 w-2 rounded-full", col.dot)} />
                  {col.label}
                </p>
                <span className="chip bg-white text-ink/50">{arNum(list.length)}</span>
              </div>
              <div className="space-y-3">
                {list.length === 0 && <p className="py-6 text-center text-[11px] text-ink/35">لا مهام هنا</p>}
                {list.map((t) => (
                  <TaskCard key={t.id} task={t} from="/tasks" canManage={perms.manageTasks} showComments={false} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
