// ملف المحامي — بروفايل تشغيلي كامل
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, CalendarClock, CheckCircle2, ListChecks, Mail, Phone, Save, UserCircle2 } from "lucide-react";
import { getLawyerBySlug } from "@/lib/queries";
import { getPerms, getCurrentLawyer } from "@/lib/permissions";
import { updateLawyerStatusText } from "@/lib/actions";
import { TaskCard } from "@/components/task-card";
import { Avatar, Badge, EmptyState, PageHeader } from "@/components/ui";
import { arNum, bucketOf, todayStr } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function LawyerProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [data, { perms }, identity] = await Promise.all([getLawyerBySlug(slug), getPerms(), getCurrentLawyer()]);
  if (!data) notFound();
  const { lawyer: l, tasks, upcomingCount, doneCount, totalCount } = data;

  const upcoming = tasks.filter((t) => t.status !== "COMPLETED" && t.status !== "CANCELLED" && t.date && t.date >= todayStr());
  const openNoDate = tasks.filter((t) => t.status !== "COMPLETED" && t.status !== "CANCELLED" && (!t.date || t.date < todayStr()));
  const finished = tasks.filter((t) => t.status === "COMPLETED" || t.status === "CANCELLED");
  const isSelf = identity?.id === l.id;

  return (
    <div>
      {/* غلاف البروفايل */}
      <div className="relative mb-14 overflow-hidden rounded-2xl bg-navy-950 p-6 sm:p-8">
        <div className="absolute inset-0 opacity-25" style={{ backgroundImage: "radial-gradient(500px 180px at 85% 100%, rgba(193,154,63,0.55), transparent 60%), repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0 2px, transparent 2px 14px)" }} />
        <div className="relative flex items-end justify-between">
          <Avatar first={l.firstName} last={l.lastName} size="xl" principal={l.isPrincipal} photoUrl={l.photoUrl} />
          <div className="flex gap-1.5">
            {l.isPrincipal && <Badge tone="gold">المحامي الرئيسي</Badge>}
            {l.isApproved ? <Badge tone="green">معتمد</Badge> : <Badge tone="amber">بانتظار الاعتماد</Badge>}
            {!l.isActive && <Badge tone="gray">مؤرشف</Badge>}
          </div>
        </div>
        <div className="absolute bottom-4 right-6 sm:right-8">
          <h1 className="text-xl font-bold text-white sm:text-2xl">{l.title} {l.firstName} {l.lastName}</h1>
          <p className="mt-0.5 text-xs text-gold-400">{l.jobTitle}{l.specialty ? ` — ${l.specialty}` : ""}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        <aside className="space-y-4">
          <div className="card p-4">
            <h3 className="mb-3 flex items-center gap-1.5 text-xs font-bold text-ink/50"><UserCircle2 className="h-4 w-4" /> بيانات التواصل</h3>
            <div className="space-y-2 text-xs text-ink/70">
              {l.phone && <p className="flex items-center justify-between rounded-lg bg-paper px-3 py-2"><span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-gold-600" /> هاتف</span><span dir="ltr" className="font-bold">{l.phone}</span></p>}
              {l.email && <p className="flex items-center justify-between gap-2 rounded-lg bg-paper px-3 py-2"><span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-gold-600" /> بريد</span><span dir="ltr" className="truncate font-bold">{l.email}</span></p>}
              {l.gmailIdentity && <p className="flex items-center justify-between gap-2 rounded-lg bg-paper px-3 py-2"><span className="flex items-center gap-1.5"><BadgeCheck className="h-3.5 w-3.5 text-gold-600" /> هوية Gmail</span><span dir="ltr" className="truncate font-bold">{l.gmailIdentity}</span></p>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { label: "قادمة", value: upcomingCount, icon: CalendarClock },
              { label: "منفذة", value: doneCount, icon: CheckCircle2 },
              { label: "الكل", value: totalCount, icon: ListChecks },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="card p-3">
                <Icon className="mx-auto h-4 w-4 text-gold-600" />
                <p className="mt-1.5 text-xl font-bold text-navy-900">{arNum(value)}</p>
                <p className="text-[10px] text-ink/45">{label}</p>
              </div>
            ))}
          </div>

          {l.bio && (
            <div className="card p-4">
              <h3 className="mb-2 text-xs font-bold text-ink/50">نبذة</h3>
              <p className="text-[13px] leading-7 text-ink/75">{l.bio}</p>
            </div>
          )}

          {(isSelf || perms.manageLawyers) && (
            <form action={updateLawyerStatusText} className="card p-4">
              <input type="hidden" name="lawyerId" value={l.id} />
              <input type="hidden" name="from" value={`/lawyers/${l.slug}`} />
              <h3 className="mb-2 text-xs font-bold text-ink/50">تحديث الحالة (يظهر في اللوحة الرئيسية)</h3>
              <input name="statusText" defaultValue={l.statusText ?? ""} className="input text-xs" placeholder="مثال: في محكمة جنوب الجيزة حتى الثانية" />
              <button className="btn-gold mt-2 w-full py-1.5 text-xs"><Save className="h-3.5 w-3.5" /> حفظ الحالة</button>
            </form>
          )}
        </aside>

        <section className="space-y-6">
          <div>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-navy-900"><span className="h-4 w-1 rounded-full bg-red-500" /> التكليفات القادمة ({arNum(upcoming.length)})</h2>
            <div className="space-y-3">
              {upcoming.length === 0 && <EmptyState title="لا تكليفات قادمة" />}
              {upcoming.map((t) => <TaskCard key={t.id} task={t} from={`/lawyers/${l.slug}`} canManage={perms.manageTasks} />)}
            </div>
          </div>
          {openNoDate.length > 0 && (
            <div>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-navy-900"><span className="h-4 w-1 rounded-full bg-gold-500" /> تكليفات مفتوحة ({arNum(openNoDate.length)})</h2>
              <div className="space-y-3">
                {openNoDate.map((t) => <TaskCard key={t.id} task={t} from={`/lawyers/${l.slug}`} canManage={perms.manageTasks} />)}
              </div>
            </div>
          )}
          {finished.length > 0 && (
            <div>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-navy-900"><span className="h-4 w-1 rounded-full bg-emerald-500" /> السجل المنفذ ({arNum(finished.length)})</h2>
              <div className="space-y-3">
                {finished.map((t) => <TaskCard key={t.id} task={t} from={`/lawyers/${l.slug}`} canManage={perms.manageTasks} showComments={false} />)}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
