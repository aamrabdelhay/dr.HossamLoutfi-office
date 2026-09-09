// الجلسات والمواعيد — عرض قائمة مصنّف حسب القرب
import { getTasksByBucket, getActiveLawyers, getLocations } from "@/lib/queries";
import { db } from "@/db";
import { cases } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getPerms } from "@/lib/permissions";
import { TaskCard } from "@/components/task-card";
import { TaskCreator } from "@/components/task-creator";
import { EmptyState, PageHeader } from "@/components/ui";
import { BUCKETS, arNum, cn, type BucketKey } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

const ALL = { key: "all" as const, label: "كل الجلسات", hint: "كل المهام ذات التاريخ وبدونه" };
const FILTERS = [ALL, ...BUCKETS.filter((b) => b.key !== "later" && b.key !== "none"), BUCKETS.find((b) => b.key === "none")!];

export default async function SessionsPage({ searchParams }: { searchParams: Promise<{ bucket?: string }> }) {
  const { bucket } = await searchParams;
  const active = (bucket ?? "tomorrow") as BucketKey | "all";
  const [{ perms }, tasks, lawyers, locations, openCases] = await Promise.all([
    getPerms(),
    getTasksByBucket(active),
    getActiveLawyers(),
    getLocations({ activeOnly: true }),
    db.select({ id: cases.id, name: cases.name, caseNumber: cases.caseNumber }).from(cases).where(eq(cases.status, "OPEN")),
  ]);

  // عدّادات التصنيفات
  const countsArr = await Promise.all(
    FILTERS.map(async (f) => ({ key: f.key, count: (await getTasksByBucket(f.key as BucketKey | "all")).length })),
  );
  const counts = new Map(countsArr.map((c) => [c.key, c.count]));

  return (
    <div>
      <PageHeader title="الجلسات والمواعيد" subtitle="النظام مصمم حول قرب موعد الجلسة — اختر النافذة الزمنية">
        {perms.manageTasks && (
          <TaskCreator
            lawyers={lawyers.map((l) => ({ id: l.id, firstName: l.firstName, lastName: l.lastName, title: l.title }))}
            locations={locations.map((l) => ({ id: l.id, name: l.name, type: l.type }))}
            cases={openCases}
            defaultType="SESSION"
            label="+ إضافة جلسة"
          />
        )}
      </PageHeader>

      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={`/sessions?bucket=${f.key}`}
            className={cn(
              "chip border px-3.5 py-1.5 text-xs transition",
              active === f.key
                ? "border-navy-900 bg-navy-900 text-gold-300"
                : "border-line bg-white text-ink/60 hover:border-gold-400 hover:text-ink",
            )}
          >
            {f.label}
            <span className={cn("rounded-full px-1.5 py-px text-[10px]", active === f.key ? "bg-white/15" : "bg-gold-100 text-gold-700")}>
              {arNum(counts.get(f.key) ?? 0)}
            </span>
          </Link>
        ))}
      </div>

      <div className="space-y-4">
        {tasks.length === 0 && (
          <EmptyState
            title="لا جلسات في هذه النافذة"
            hint={active === "tomorrow" ? "لا جلسات غداً — استمتع بيوم هادئ" : "جرّب نافذة زمنية أخرى أو أضف جلسة جديدة"}
          />
        )}
        {tasks.map((t) => (
          <TaskCard key={t.id} task={t} from={`/sessions?bucket=${active}`} canManage={perms.manageTasks} />
        ))}
      </div>
    </div>
  );
}
