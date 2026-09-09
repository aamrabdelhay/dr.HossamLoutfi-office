"use client";

// التذكيرات الشخصية — إنشاء + إتمام + حذف (العميل)
import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AlarmClockPlus, CheckCircle2, Circle, Trash2, X } from "lucide-react";
import { createReminder, deleteReminder, toggleReminderDone } from "@/lib/actions";
import { arDate, arNum, arTime, cn, todayStr } from "@/lib/utils";

export type ReminderItem = {
  id: number;
  title: string;
  note: string | null;
  date: string;
  time: string | null;
  isDone: boolean;
  ownerName: string | null; // يظهر فقط في عرض الإدارة لكل المكتب
};

export function ReminderCreator({ compact = true }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <>
      <button className={compact ? "btn-ghost px-2.5 py-1.5 text-[11px]" : "btn-gold text-xs"} onClick={() => setOpen(true)}>
        <AlarmClockPlus className="h-3.5 w-3.5" /> تذكير جديد
      </button>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-start justify-center bg-navy-950/50 p-4 pt-24 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-xl border border-line bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
              <p className="text-sm font-bold text-navy-950">تذكير شخصي جديد</p>
              <button onClick={() => setOpen(false)} className="text-ink/40 hover:text-ink"><X className="h-4.5 w-4.5" /></button>
            </div>
            <form
              className="grid gap-3.5 p-5"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                fd.set("from", pathname + window.location.search);
                startTransition(async () => {
                  await createReminder(fd);
                  setOpen(false);
                  router.refresh();
                });
              }}
            >
              <div>
                <label className="label">عنوان التذكير *</label>
                <input name="title" required className="input" placeholder="مثال: مراجعة ملف التحكيم" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">التاريخ *</label>
                  <input type="date" name="date" required defaultValue={todayStr()} className="input" dir="ltr" />
                </div>
                <div>
                  <label className="label">الوقت</label>
                  <input type="time" name="time" className="input" dir="ltr" />
                </div>
              </div>
              <div>
                <label className="label">ملاحظة</label>
                <textarea name="note" rows={2} className="input" placeholder="تفاصيل اختيارية…" />
              </div>
              <p className="rounded-lg bg-gold-50 px-3 py-2 text-[11px] leading-5 text-gold-700">
                سيصلك إشعار بجرس التنبيهات عند حلول موعده. تذكيراتك خاصة بك؛ والإدارة ترى تذكيرات المكتب.
              </p>
              <button className="btn-gold" disabled={pending}>{pending ? "جارٍ الحفظ…" : "حفظ التذكير"}</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export function ReminderList({ items, showOwner = false }: { items: ReminderItem[]; showOwner?: boolean }) {
  const [pending, startTransition] = useTransition();
  const pathname = usePathname();
  const router = useRouter();
  const today = todayStr();

  const act = (fd: FormData, fn: typeof toggleReminderDone) => {
    fd.set("from", pathname + window.location.search);
    startTransition(async () => {
      await fn(fd);
      router.refresh();
    });
  };

  if (items.length === 0) {
    return <p className="rounded-lg border border-dashed border-line px-3 py-5 text-center text-[11px] text-ink/40">لا تذكيرات — أضف أول تذكير</p>;
  }

  return (
    <div className="space-y-1.5">
      {items.map((r) => {
        const late = !r.isDone && (r.date < today || (r.date === today && !!r.time));
        return (
          <div key={r.id} className={cn("group flex items-start gap-2.5 rounded-lg border px-3 py-2 transition", r.isDone ? "border-line/60 bg-paper/50 opacity-60" : "border-line bg-white hover:border-gold-300")}>
            <button
              className="mt-0.5 shrink-0 text-ink/30 transition hover:text-ok-600"
              title={r.isDone ? "إعادة فتح" : "إتمام"}
              onClick={() => {
                const fd = new FormData();
                fd.set("reminderId", String(r.id));
                fd.set("done", r.isDone ? "0" : "1");
                act(fd, toggleReminderDone);
              }}
            >
              {r.isDone ? <CheckCircle2 className="h-[18px] w-[18px] text-ok-600" /> : <Circle className="h-[18px] w-[18px]" />}
            </button>
            <div className="min-w-0 flex-1">
              <p className={cn("text-[12.5px] font-bold leading-5", r.isDone ? "text-ink/45 line-through" : "text-ink/85")}>{r.title}</p>
              {r.note && <p className="text-[11px] text-ink/45">{r.note}</p>}
              <p className={cn("mt-0.5 text-[10px] font-bold", late ? "text-danger-600" : "text-gold-700")}>
                {r.date === today ? "اليوم" : arDate(r.date, false)}{r.time ? ` · ${arTime(r.time)}` : ""}
                {showOwner && r.ownerName ? ` · ${r.ownerName}` : ""}
              </p>
            </div>
            <button
              className="mt-0.5 shrink-0 text-ink/25 opacity-0 transition hover:text-danger-600 group-hover:opacity-100"
              title="حذف"
              onClick={() => {
                const fd = new FormData();
                fd.set("reminderId", String(r.id));
                act(fd, deleteReminder);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        );
      })}
      {pending && <p className="text-center text-[10px] text-ink/35">جارٍ التحديث…</p>}
    </div>
  );
}
