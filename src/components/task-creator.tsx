"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CalendarPlus, X } from "lucide-react";
import { createTask } from "@/lib/actions";
import { cn } from "@/lib/utils";

export type CreatorLawyer = { id: number; firstName: string; lastName: string; title: string };
export type CreatorLocation = { id: number; name: string; type: string };
export type CreatorCase = { id: number; name: string; caseNumber: string | null };

// منشئ الجلسات / التكليفات — يدعم تكليف أكثر من محامٍ (Multi-Lawyer Selector)
export function TaskCreator({ lawyers, locations, cases, defaultType = "SESSION", label, className, date }: {
  lawyers: CreatorLawyer[];
  locations: CreatorLocation[];
  cases: CreatorCase[];
  defaultType?: string;
  label?: string;
  className?: string;
  date?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const pathname = usePathname();
  const router = useRouter();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button className={className ?? "btn-gold"} onClick={() => setOpen(true)}>
        <CalendarPlus className="h-4 w-4" />
        {label ?? (defaultType === "SESSION" ? "+ إضافة جلسة" : "+ تكليف جديد")}
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-navy-950/60 p-4 pt-10 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div
            ref={dialogRef}
            className="w-full max-w-2xl rounded-2xl border border-line bg-card shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-line bg-navy-950 px-5 py-3.5 rounded-t-2xl">
              <p className="text-sm font-bold text-white">جلسة / تكليف جديد</p>
              <button onClick={() => setOpen(false)} className="text-white/60 hover:text-white"><X className="h-5 w-5" /></button>
            </div>

            <form
              className="grid max-h-[75vh] gap-4 overflow-y-auto p-5 sm:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                fd.set("from", pathname + (typeof window !== "undefined" ? window.location.search : ""));
                startTransition(async () => {
                  await createTask(fd);
                  setOpen(false);
                  router.refresh();
                });
              }}
            >
              <div className="sm:col-span-2">
                <label className="label">اسم التكليف / الجلسة *</label>
                <input name="title" required className="input" placeholder="مثال: جلسة دعوى التعويض — الدائرة ٧ مدني" />
              </div>

              <div>
                <label className="label">النوع</label>
                <select name="type" defaultValue={defaultType} className="input">
                  <option value="SESSION">جلسة محكمة</option>
                  <option value="ENTITY_VISIT">حضور جهة حكومية</option>
                  <option value="ASSIGNMENT">تكليف عام</option>
                  <option value="ACTIVITY">نشاط تشغيلي</option>
                </select>
              </div>
              <div>
                <label className="label">الأولوية</label>
                <select name="priority" defaultValue="NORMAL" className="input">
                  <option value="NORMAL">عادية</option>
                  <option value="IMPORTANT">مهمة</option>
                  <option value="CRITICAL">حرجة</option>
                </select>
              </div>
              <div>
                <label className="label">التاريخ (اختياري — بدونه يبقى تكليفاً عاماً)</label>
                <input type="date" name="date" className="input" defaultValue={date} dir="ltr" />
              </div>
              <div>
                <label className="label">الساعة</label>
                <input type="time" name="time" className="input" dir="ltr" />
              </div>
              <div>
                <label className="label">الجهة / المحكمة</label>
                <select name="locationId" className="input" defaultValue="">
                  <option value="">— بدون جهة —</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.type === "COURT" ? "محكمة: " : "جهة: "}{l.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">القضية المرتبطة</label>
                <select name="caseId" className="input" defaultValue="">
                  <option value="">— بدون قضية —</option>
                  {cases.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}{c.caseNumber ? ` (${c.caseNumber})` : ""}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="label">تكليف المحامين (يمكن اختيار أكثر من واحد)</label>
                <div className="flex flex-wrap gap-2 rounded-xl border border-line bg-white p-3">
                  {lawyers.map((l) => (
                    <label key={l.id} className="cursor-pointer">
                      <input type="checkbox" name="lawyerIds" value={l.id} className="peer sr-only" />
                      <span className="chip border border-line bg-paper px-3 py-1.5 text-xs text-ink/60 transition peer-checked:border-gold-500 peer-checked:bg-gold-100 peer-checked:text-gold-700">
                        {l.title} {l.firstName} {l.lastName}
                      </span>
                    </label>
                  ))}
                  {lawyers.length === 0 && <span className="text-xs text-ink/40">لا يوجد محامون نشطون</span>}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="label">الوصف</label>
                <textarea name="description" rows={2} className="input" placeholder="تفاصيل إضافية عن الجلسة أو التكليف…" />
              </div>
              <div className="sm:col-span-2">
                <label className="label">ملاحظات للمكلّف</label>
                <textarea name="notes" rows={2} className="input" placeholder="مستندات مطلوبة، تعليمات حضور…" />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-line pt-4 sm:col-span-2">
                <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>إلغاء</button>
                <button className={cn("btn-gold", pending && "opacity-60")} disabled={pending}>
                  {pending ? "جارٍ الحفظ…" : "حفظ وإرسال التكليف"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
