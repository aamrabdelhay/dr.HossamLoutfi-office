// الصفحة الرئيسية — لوحة تشغيل المكتب
import Link from "next/link";
import {
  AlarmClockCheck, ArrowLeft, BellRing, CalendarDays, CalendarRange, Flame,
  Landmark, ListTodo, Search, Users, Gavel, UserCheck,
} from "lucide-react";
import { db } from "@/db";
import { cases } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getPerms, getCurrentLawyer } from "@/lib/permissions";
import { getActiveLawyers, getDashboardStats, getFeed, getLocations, getMyReminders } from "@/lib/queries";
import { Composer } from "@/components/composer";
import { ReminderCreator, ReminderList, type ReminderItem } from "@/components/reminders";
import { TaskCard } from "@/components/task-card";
import { TaskCreator } from "@/components/task-creator";
import { PageHeader, StatCard, Avatar, EmptyState, Badge } from "@/components/ui";
import { arDate, arNum, timeAgoAr, todayStr } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [{ perms }, identity, stats, feed, lawyers, locations, openCases] = await Promise.all([
    getPerms(),
    getCurrentLawyer(),
    getDashboardStats(),
    getFeed(25),
    getActiveLawyers(),
    getLocations({ activeOnly: true }),
    db.select({ id: cases.id, name: cases.name, caseNumber: cases.caseNumber }).from(cases).where(eq(cases.status, "OPEN")),
  ]);
  const myReminders = await getMyReminders(identity?.id ?? null);
  const reminderItems: ReminderItem[] = myReminders.map((r) => ({
    id: r.id, title: r.title, note: r.note, date: r.date, time: r.time, isDone: r.isDone, ownerName: r.ownerName,
  }));

  const creatorLawyers = lawyers.map((l) => ({ id: l.id, firstName: l.firstName, lastName: l.lastName, title: l.title }));
  const creatorLocations = locations.map((l) => ({ id: l.id, name: l.name, type: l.type }));
  const statusLawyers = lawyers.filter((l) => l.statusText);

  return (
    <div>
      {/* ترويسة تشغيلية */}
      <div className="relative mb-6 overflow-hidden rounded-2xl bg-navy-950 p-6 text-white sm:p-8">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(600px 200px at 90% 0%, rgba(193,154,63,0.5), transparent 60%)" }} />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-gold-400">{arDate(todayStr())}</p>
            <h1 className="mt-1.5 text-2xl font-bold sm:text-3xl">لوحة تشغيل المكتب</h1>
            <p className="mt-1 text-sm text-white/60">الجلسات والتكليفات والنشاط اليومي في شاشة واحدة</p>
          </div>
          {perms.manageTasks && (
            <TaskCreator
              lawyers={creatorLawyers}
              locations={creatorLocations}
              cases={openCases}
              defaultType="SESSION"
              label="+ إضافة جلسة"
              className="btn-gold"
            />
          )}
        </div>
      </div>

      {/* الإحصائيات */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <StatCard label="جلسات اليوم" value={stats.today} icon={Gavel} tone="red" href="/sessions?bucket=today" />
        <StatCard label="جلسات الغد" value={stats.tomorrow} icon={AlarmClockCheck} tone="amber" href="/sessions?bucket=tomorrow" />
        <StatCard label="الجلسات الحرجة" value={stats.critical} icon={Flame} tone="rose" hint="خلال ٣ أيام" href="/sessions" />
        <StatCard label="مهام مفتوحة" value={stats.open} icon={ListTodo} tone="blue" hint={stats.overdue ? `منها ${arNum(stats.overdue)} متأخرة` : undefined} href="/tasks" />
        <StatCard label="المحامون النشطون" value={stats.lawyers} icon={Users} tone="navy" href="/lawyers" />
        <StatCard label="مواعيد خلال ٣٠ يوم" value={stats.month} icon={CalendarRange} tone="gold" href="/calendar" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* فيد المكتب */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-bold text-navy-900">
              <span className="h-4 w-1 rounded-full bg-gold-500" />
              فيد المكتب — الجلسات والتكليفات والتحديثات
            </h2>
          </div>
          {perms.comment && (
            <div className="mb-4">
              <Composer lawyers={creatorLawyers} locations={creatorLocations} cases={openCases} />
            </div>
          )}
          <div className="space-y-4">
            {feed.length === 0 && <EmptyState title="الفيد فارغ" hint="ابدأ بإضافة جلسة أو نشر تحديث" />}
            {feed.map((t) => (
              <TaskCard key={t.id} task={t} from="/" canManage={perms.manageTasks} />
            ))}
          </div>
        </section>

        {/* عمود جانبي: حالات المحامين وروابط */}
        <aside className="space-y-4">
          {/* التذكيرات الشخصية — المحامي يرى تذكيراته فقط، والإدارة ترى تذكيرات المكتب */}
          {perms.manageReminders && (
            <div className="card p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-bold text-navy-900">
                  <BellRing className="h-4 w-4 text-gold-600" />
                  {identity ? "تذكيراتي" : "تذكيرات المكتب"}
                </h3>
                <ReminderCreator compact />
              </div>
              <div className="space-y-2">
                <ReminderList items={reminderItems} showOwner={!identity} />
              </div>
            </div>
          )}

          <div className="card p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-navy-900">
              <UserCheck className="h-4 w-4 text-gold-600" />
              حالة المحامين الآن
            </h3>
            <div className="space-y-3">
              {statusLawyers.length === 0 && <p className="text-xs text-ink/40">لا تحديثات حالة اليوم</p>}
              {statusLawyers.map((l) => (
                <div key={l.id} className="flex items-start gap-2.5">
                  <Avatar first={l.firstName} last={l.lastName} size="sm" principal={l.isPrincipal} photoUrl={l.photoUrl} />
                  <div className="min-w-0">
                    <Link href={`/lawyers/${l.slug}`} className="block truncate text-xs font-bold text-navy-900 hover:text-gold-700">
                      {l.title} {l.firstName} {l.lastName}
                    </Link>
                    <p className="text-[11px] leading-5 text-ink/60">{l.statusText}</p>
                    {l.statusUpdatedAt && <p className="text-[9px] text-ink/35">{timeAgoAr(l.statusUpdatedAt)}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-4">
            <h3 className="mb-3 text-sm font-bold text-navy-900">وصول سريع</h3>
            <div className="space-y-1.5">
              {[
                { href: "/search", label: "البحث المتقدم", icon: Search },
                { href: "/calendar", label: "التقويم التشغيلي", icon: CalendarDays },
                { href: "/lawyer-guide", label: "دليل المحامي للجهات", icon: Landmark },
              ].map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} className="flex items-center justify-between rounded-xl border border-line bg-white px-3 py-2.5 text-xs font-bold text-ink/70 transition hover:border-gold-400 hover:text-navy-900">
                  <span className="flex items-center gap-2"><Icon className="h-4 w-4 text-gold-600" />{label}</span>
                  <ArrowLeft className="h-3.5 w-3.5 text-ink/30" />
                </Link>
              ))}
            </div>
          </div>

          {perms.adminAccess && (
            <div className="card border-gold-300 bg-gradient-to-bl from-card to-gold-50 p-4">
              <h3 className="text-sm font-bold text-navy-900">مركز الإدارة</h3>
              <p className="mt-1 text-[11px] leading-5 text-ink/55">تحكم كامل في المكتب: المحامون، العملاء، القضايا، الجهات، المستخدمون — بدون كلمة مرور.</p>
              <Link href="/admin" className="btn-navy mt-3 w-full text-xs">فتح مركز الإدارة</Link>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
