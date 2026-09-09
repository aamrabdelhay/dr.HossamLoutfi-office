// القضايا والأرشيف — كل قضية لها Timeline دائم (Case History)
import Link from "next/link";
import { Archive, FileText, History, Plus, Search, Send } from "lucide-react";
import { db } from "@/db";
import { caseEvents } from "@/db/schema";
import { asc, inArray } from "drizzle-orm";
import { getCasesWithMeta } from "@/lib/queries";
import { getPerms } from "@/lib/permissions";
import { addCaseEvent, updateCase } from "@/lib/actions";
import { CaseStatusBadge, EmptyState, PageHeader } from "@/components/ui";
import { arNum, cn, timeAgoAr } from "@/lib/utils";

export const dynamic = "force-dynamic";

const FILTERS = [
  { key: "", label: "الكل" },
  { key: "OPEN", label: "مفتوحة" },
  { key: "CLOSED", label: "مغلقة" },
  { key: "ARCHIVED", label: "مؤرشفة" },
];

export default async function CaseArchivePage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const { status, q } = await searchParams;
  const [{ perms }, caseList] = await Promise.all([getPerms(), getCasesWithMeta(status || undefined, q || undefined)]);

  const ids = caseList.map((c) => c.id);
  const events = ids.length
    ? await db.select().from(caseEvents).where(inArray(caseEvents.caseId, ids)).orderBy(asc(caseEvents.createdAt))
    : [];
  const eventsMap = new Map<number, typeof events>();
  for (const e of events) {
    const list = eventsMap.get(e.caseId) ?? [];
    list.push(e);
    eventsMap.set(e.caseId, list);
  }

  return (
    <div>
      <PageHeader title="القضايا والأرشيف" subtitle={`${arNum(caseList.length)} قضية — كل قضية تحتفظ بتاريخ أحداثها بالكامل`} />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <form className="flex min-w-52 flex-1 items-center gap-2" action="/case-archive">
          <input type="hidden" name="status" value={status ?? ""} />
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35" />
            <input name="q" defaultValue={q ?? ""} placeholder="اسم أو رقم قضية…" className="input pr-9" />
          </div>
          <button className="btn-navy">بحث</button>
        </form>
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={`/case-archive?status=${f.key}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            className={cn("chip border px-3.5 py-1.5 text-xs", (status ?? "") === f.key ? "border-navy-900 bg-navy-900 text-gold-300" : "border-line bg-white text-ink/60 hover:border-gold-400")}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="space-y-4">
        {caseList.length === 0 && <EmptyState title="لا قضايا مطابقة" hint="أضف قضايا من مركز الإدارة" />}
        {caseList.map((c) => {
          const list = eventsMap.get(c.id) ?? [];
          return (
            <article key={c.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-navy-900 text-gold-300"><FileText className="h-5 w-5" /></span>
                  <div>
                    <h2 className="text-[15px] font-bold text-navy-950">{c.name}</h2>
                    <p className="mt-0.5 text-[11px] text-ink/45">
                      {c.caseNumber ? `رقم: ${c.caseNumber}` : "بدون رقم"}
                      {" · "}
                      {c.clientName ? (
                        <Link href={`/admin/clients/${c.clientId2}`} className="text-gold-700 hover:underline">{c.clientName}</Link>
                      ) : (
                        <span className="text-amber-700">غير مرتبطة بعميل</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <CaseStatusBadge status={c.status} />
                  <span className="chip bg-paper text-ink/50">{arNum(c.taskCount)} مهمة</span>
                  {perms.manageTasks && (
                    <>
                      {c.status === "OPEN" && (
                        <>
                          <form action={updateCase}>
                            <input type="hidden" name="caseId" value={c.id} /><input type="hidden" name="status" value="CLOSED" /><input type="hidden" name="from" value="/case-archive" />
                            <button className="btn-ghost px-2.5 py-1 text-[11px]">قفل القضية</button>
                          </form>
                          <form action={updateCase}>
                            <input type="hidden" name="caseId" value={c.id} /><input type="hidden" name="status" value="ARCHIVED" /><input type="hidden" name="from" value="/case-archive" />
                            <button className="btn-ghost px-2.5 py-1 text-[11px]"><Archive className="h-3 w-3" /> أرشفة</button>
                          </form>
                        </>
                      )}
                      {c.status !== "OPEN" && (
                        <form action={updateCase}>
                          <input type="hidden" name="caseId" value={c.id} /><input type="hidden" name="status" value="OPEN" /><input type="hidden" name="from" value="/case-archive" />
                          <button className="btn-ghost px-2.5 py-1 text-[11px]">إعادة فتح</button>
                        </form>
                      )}
                    </>
                  )}
                </div>
              </div>
              {c.description && <p className="mt-3 text-[13px] leading-6 text-ink/65">{c.description}</p>}

              {/* Timeline دائم للقضية */}
              <div className="mt-4 rounded-xl border border-line/70 bg-paper/60 p-4">
                <h3 className="mb-3 flex items-center gap-1.5 text-xs font-bold text-ink/50">
                  <History className="h-4 w-4 text-gold-600" />
                  تاريخ القضية ({arNum(list.length)} حدث)
                </h3>
                <div className="relative space-y-3 pr-4 before:absolute before:right-[5px] before:top-1 before:h-[calc(100%-8px)] before:w-px before:bg-gold-300">
                  {list.length === 0 && <p className="text-[11px] text-ink/40">لا أحداث مسجلة بعد</p>}
                  {list.map((e) => (
                    <div key={e.id} className="relative">
                      <span className="absolute -right-[15px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-gold-500 bg-white" />
                      <p className="text-[13px] leading-6 text-ink/80">{e.description}</p>
                      <p className="text-[10px] text-ink/40">
                        <span className="font-bold text-gold-700">{e.type}</span>
                        {e.authorName ? ` · ${e.authorName}` : ""} · {timeAgoAr(e.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
                {perms.manageTasks && (
                  <form action={addCaseEvent} className="mt-3 flex items-center gap-2 border-t border-line/60 pt-3">
                    <input type="hidden" name="caseId" value={c.id} />
                    <input type="hidden" name="from" value="/case-archive" />
                    <select name="type" className="input w-28 shrink-0 py-1.5 text-xs" defaultValue="عام">
                      <option>عام</option><option>جلسة</option><option>إجراء</option><option>حكم</option><option>مذكرة</option>
                    </select>
                    <input name="description" required placeholder="سجّل حدثاً جديداً في تاريخ القضية…" className="input py-1.5 text-xs" />
                    <button className="btn-gold shrink-0 px-2.5 py-1.5" aria-label="إضافة حدث"><Send className="h-3.5 w-3.5" /></button>
                  </form>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
