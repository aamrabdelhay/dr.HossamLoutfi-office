// مركز الإدارة — تحكم كامل بدون كلمة مرور (وضع التشغيل الداخلي)
import Link from "next/link";
import {
  Activity, AlarmClockCheck, Archive, BellRing, BookOpenCheck, BriefcaseBusiness, Building2, CalendarRange, CheckCircle2,
  Flame, Gavel, Landmark, Link2, ListTodo, LockOpen, MailCheck, ShieldAlert, ShieldCheck, UserPlus, UsersRound, Wrench,
} from "lucide-react";
import { db } from "@/db";
import { cases, clients, tasks } from "@/db/schema";
import { desc, eq, ne } from "drizzle-orm";
import { getPerms, ROLE_LABELS } from "@/lib/permissions";
import {
  enrichTasks, getActivity, getActiveLawyers, getAllLawyers, getCasesWithMeta,
  getClientsWithMeta, getDashboardStats, getEmailReminderCount, getEmailReminderLog, getFeed,
  getLawyerUpcomingCounts, getLocations, getMyReminders, getPendingLawyers,
  getSettings, getUsers, getVerificationQueueCount,
} from "@/lib/queries";
import {
  approveLawyer, createUser, deleteClient, deleteTask, deleteUser, setLocationStatus,
  toggleDemoLock, toggleLawyerActive, togglePrincipal, unlinkCase, verifyLocation, updateTaskStatus,
} from "@/lib/actions";
import {
  CaseFormButton, ClientFormButton, ConfirmActionButton, LawyerFormButton, LocationFormButton, UserRoleSelect,
} from "@/components/admin-widgets";
import { AccessLinkButton, ReseedButton, RunCronButton } from "@/components/admin-extra";
import { ReminderCreator, ReminderList, type ReminderItem } from "@/components/reminders";
import { TaskCreator } from "@/components/task-creator";
import {
  Avatar, Badge, CaseStatusBadge, ConfidenceBadge, LocationStatusBadge, PageHeader,
  PriorityBadge, StatCard, StatusBadge, TypeBadge,
} from "@/components/ui";
import { OFFICE, arDate, arNum, arTime, bucketLabel, bucketOf, cn, timeAgoAr } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ tab?: string; ls?: string; cq?: string }> }) {
  const { tab, ls, cq } = await searchParams;
  const { role, perms } = await getPerms();

  if (!perms.adminAccess) {
    return (
      <div className="mx-auto max-w-md">
        <div className="card p-8 text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-warn-600" />
          <h1 className="mt-3 text-lg font-bold text-navy-900">وصول مقيّد</h1>
          <p className="mt-2 text-sm leading-7 text-ink/60">دورك الحالي ({ROLE_LABELS[role]}) لا يملك دخول مركز الإدارة. بدّل الدور من الشريط الجانبي إلى مدير عام.</p>
        </div>
      </div>
    );
  }

  const TABS = [
    { key: "overview", label: "نظرة عامة", icon: ShieldCheck, show: true },
    { key: "tasks", label: "الجلسات والتكليفات", icon: Gavel, show: perms.manageTasks },
    { key: "lawyers", label: "المحامون", icon: BriefcaseBusiness, show: perms.manageLawyers },
    { key: "locations", label: "الجهات الحكومية", icon: Landmark, show: perms.manageLocations },
    { key: "clients", label: "العملاء", icon: UsersRound, show: perms.manageClients },
    { key: "cases", label: "القضايا", icon: ListTodo, show: perms.manageTasks },
    { key: "reminders", label: "التذكيرات", icon: BellRing, show: perms.manageReminders },
    { key: "users", label: "الإدمن", icon: LockOpen, show: perms.manageUsers },
    { key: "activity", label: "النشاط", icon: Activity, show: true },
  ].filter((t) => t.show);

  const activeTab = TABS.some((t) => t.key === tab) ? tab! : "overview";

  return (
    <div>
      <PageHeader title="مركز الإدارة" subtitle={`دورك: ${ROLE_LABELS[role]} — تحكم كامل بدون كلمة مرور`}>
        <Link href="/admin/lawyers/archive" className="btn-ghost py-1.5 text-xs"><Archive className="h-4 w-4" /> أرشيف المحامين</Link>
        <Link href="/admin/guide" className="btn-ghost py-1.5 text-xs"><BookOpenCheck className="h-4 w-4" /> دليل الاستخدام</Link>
      </PageHeader>

      <div className="mb-5 flex gap-1 overflow-x-auto rounded-lg border border-line bg-paper/80 p-1">
        {TABS.map(({ key, label, icon: Icon }) => (
          <Link key={key} href={`/admin?tab=${key}`} className="tab-link" data-active={activeTab === key}>
            <Icon className="h-4 w-4" /> {label}
          </Link>
        ))}
      </div>

      {activeTab === "overview" && <OverviewTab role={role} />}
      {activeTab === "tasks" && <TasksTab />}
      {activeTab === "lawyers" && <LawyersTab />}
      {activeTab === "locations" && <LocationsTab filter={ls} />}
      {activeTab === "clients" && <ClientsTab q={cq} />}
      {activeTab === "cases" && <CasesTab />}
      {activeTab === "reminders" && <RemindersTab />}
      {activeTab === "users" && <UsersTab />}
      {activeTab === "activity" && <ActivityTab />}
    </div>
  );
}

// ================== نظرة عامة ==================
async function OverviewTab({ role }: { role: string }) {
  const [stats, queue, pendingLawyers, emailCount, activity, feed, lawyers, locs, settings] = await Promise.all([
    getDashboardStats(), getVerificationQueueCount(), getPendingLawyers(), getEmailReminderCount(),
    getActivity(10), getFeed(8), getActiveLawyers(), getLocations({ activeOnly: true }), getSettings(),
  ]);
  const openCasesList = await db.select({ id: cases.id, name: cases.name, caseNumber: cases.caseNumber }).from(cases).where(eq(cases.status, "OPEN"));
  const creatorProps = {
    lawyers: lawyers.map((l) => ({ id: l.id, firstName: l.firstName, lastName: l.lastName, title: l.title })),
    locations: locs.map((l) => ({ id: l.id, name: l.name, type: l.type })),
    cases: openCasesList,
  };

  return (
    <div className="space-y-5">
      {stats.overdue > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-danger-100 bg-danger-50 px-4 py-2.5">
          <p className="flex items-center gap-2 text-[13px] font-bold text-danger-700">
            <ShieldAlert className="h-4.5 w-4.5" /> {arNum(stats.overdue)} مهمة متأخرة بانتظار الإنجاز — راجعها فوراً
          </p>
          <Link href="/sessions?bucket=overdue" className="btn-danger px-3 py-1.5 text-[11px]">فتح المتأخرات</Link>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="جلسات اليوم" value={stats.today} icon={Gavel} tone="red" href="/sessions?bucket=today" />
        <StatCard label="جلسات الغد" value={stats.tomorrow} icon={AlarmClockCheck} tone="amber" href="/sessions?bucket=tomorrow" />
        <StatCard label="حرجة خلال ٣ أيام" value={stats.critical} icon={Flame} tone="rose" />
        <StatCard label="خلال ٣٠ يوماً" value={stats.month} icon={CalendarRange} tone="gold" href="/sessions?bucket=d30" />
        <StatCard label="مهام مفتوحة" value={stats.open} icon={ListTodo} tone="blue" href="/tasks" />
        <StatCard label="مهام مكتملة" value={stats.completed} icon={CheckCircle2} tone="green" />
        <StatCard label="طابور التحقق" value={queue} icon={Landmark} tone="amber" href="/admin?tab=locations&ls=queue" />
        <StatCard label="تذكيرات بريدية أُرسلت" value={emailCount} icon={MailCheck} tone="navy" href="/admin?tab=reminders" />
      </div>

      {/* إجراءات سريعة */}
      <div className="card p-4">
        <p className="mb-3 text-[11px] font-bold text-ink/45">إجراءات سريعة — أنشئ أي شيء من هنا</p>
        <div className="flex flex-wrap gap-2">
          <TaskCreator {...creatorProps} defaultType="SESSION" label="+ إضافة جلسة" className="btn-gold py-2 text-xs" />
          <TaskCreator {...creatorProps} defaultType="ASSIGNMENT" label="+ تكليفات" className="btn-navy py-2 text-xs" />
          {role !== "SECRETARY" && <LawyerFormButton />}
          <LocationFormButton />
          <ClientFormButton lawyers={creatorProps.lawyers} />
          <CaseFormButton clients={await db.select({ id: clients.id, name: clients.name }).from(clients)} />
          <RunCronButton />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card overflow-hidden">
          <h3 className="border-b border-line bg-paper/70 px-4 py-2.5 text-[13px] font-bold text-navy-900">فيد الإدارة — آخر المهام والمنشورات</h3>
          <div className="divide-y divide-line/60">
            {feed.map((t) => (
              <Link key={t.id} href={`/tasks/${t.id}`} className="flex items-center gap-2.5 px-4 py-3 transition hover:bg-paper/70">
                <TypeBadge type={t.type} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-bold text-navy-950">{t.title}</p>
                  <p className="text-[10px] text-ink/40">
                    {t.date ? `${bucketLabel(bucketOf(t.date))} · ${arDate(t.date, false)}` : "بدون تاريخ"}
                    {t.location ? ` · ${t.location.name}` : ""}
                    {t.lawyersList.length ? ` · ${arNum(t.lawyersList.length)} محامٍ` : ""}
                  </p>
                </div>
                <StatusBadge status={t.status} />
              </Link>
            ))}
          </div>
        </section>

        <section className="card overflow-hidden">
          <h3 className="border-b border-line bg-paper/70 px-4 py-2.5 text-[13px] font-bold text-navy-900">آخر نشاط المكتب</h3>
          <div className="divide-y divide-line/60">
            {activity.map((a) => (
              <div key={a.id} className="flex items-start gap-3 px-4 py-3">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gold-500" />
                <div>
                  <p className="text-[12.5px] leading-5 text-ink/80">{a.summary}</p>
                  <p className="text-[10px] text-ink/40">{a.actorName ?? "النظام"} · {timeAgoAr(a.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {pendingLawyers.length > 0 && (
        <div className="rounded-lg border border-warn-100 bg-warn-50 p-4">
          <p className="mb-2 flex items-center gap-2 text-[13px] font-bold text-warn-700"><UserPlus className="h-4 w-4" /> {arNum(pendingLawyers.length)} محامٍ بانتظار الاعتماد</p>
          <div className="flex flex-wrap gap-2">
            {pendingLawyers.map((l) => (
              <span key={l.id} className="chip border border-warn-100 bg-white px-3 py-1.5 text-xs text-ink/70">
                {l.firstName} {l.lastName} — {l.email}
              </span>
            ))}
          </div>
          <Link href="/admin?tab=lawyers" className="btn-gold mt-3 py-1.5 text-xs">مراجعة الاعتمادات</Link>
        </div>
      )}

      {/* مركز الصيانة والبيانات التجريبية */}
      <div className="card border-gold-300/60 bg-gradient-to-bl from-card to-gold-50/40 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-gold-100 text-gold-700"><Wrench className="h-4.5 w-4.5" /></span>
            <div>
              <p className="text-[13px] font-bold text-navy-950">مركز الصيانة والبيانات التجريبية</p>
              <p className="text-[11px] text-ink/45">
                مقر المكتب: {settings.office_label ?? OFFICE.label} ({settings.office_lat ?? OFFICE.lat}, {settings.office_lng ?? OFFICE.lng})
                — الحسابات الجغرافية منطلقة من الدقي · demo_lock: <strong dir="ltr">{settings.demo_lock ?? "off"}</strong>
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ConfirmActionButton
              action={toggleDemoLock}
              fields={{ next: settings.demo_lock === "on" ? "off" : "on" }}
              className="btn-ghost px-3 py-2 text-xs"
            >
              {settings.demo_lock === "on" ? "إيقاف شريط العرض التجريبي" : "تفعيل شريط العرض التجريبي"}
            </ConfirmActionButton>
            <ReseedButton />
          </div>
        </div>
      </div>
    </div>
  );
}

// ================== الجلسات والتكليفات ==================
async function TasksTab() {
  const rows = await db.select().from(tasks).where(ne(tasks.type, "POST")).orderBy(desc(tasks.createdAt)).limit(50);
  const all = await enrichTasks(rows);
  return (
    <div className="card overflow-hidden">
      <h3 className="border-b border-line bg-paper/70 px-4 py-2.5 text-[13px] font-bold text-navy-900">آخر {arNum(all.length)} مهمة — إدارة مباشرة</h3>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px]">
          <thead>
            <tr className="border-b border-line bg-paper/50">
              <th className="th">المهمة</th><th className="th">الموعد</th><th className="th">الجهة/القضية</th>
              <th className="th">المكلّفون</th><th className="th">الحالة</th><th className="th">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/50">
            {all.map((t) => (
              <tr key={t.id} className="transition hover:bg-paper/60">
                <td className="td max-w-56">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5"><TypeBadge type={t.type} /><PriorityBadge priority={t.priority} /></div>
                    <Link href={`/tasks/${t.id}`} className="text-[12.5px] font-bold leading-5 text-navy-950 hover:text-gold-700">{t.title}</Link>
                  </div>
                </td>
                <td className="td whitespace-nowrap text-xs text-ink/60">
                  {t.date ? <>{arDate(t.date, false)}<br /><span className="font-bold text-gold-700">{arTime(t.time)}</span></> : "—"}
                </td>
                <td className="td text-xs text-ink/60">
                  {t.location?.name ?? "—"}
                  {t.caseRef && <span className="block text-[10px] text-ink/40">{t.caseRef.name}</span>}
                </td>
                <td className="td">
                  <div className="flex items-center gap-1">
                    {t.lawyersList.map((l) => <Avatar key={l.id} first={l.firstName} last={l.lastName} size="sm" />)}
                    {t.lawyersList.length === 0 && <span className="text-xs text-ink/35">—</span>}
                  </div>
                </td>
                <td className="td"><StatusBadge status={t.status} /></td>
                <td className="td">
                  <div className="flex items-center gap-1">
                    {t.status !== "COMPLETED" && t.status !== "CANCELLED" && (
                      <ConfirmActionButton action={updateTaskStatus} fields={{ taskId: t.id, status: "COMPLETED" }} className="btn px-2 py-1 text-[10px] bg-ok-50 text-ok-700 border border-ok-100">تم</ConfirmActionButton>
                    )}
                    <ConfirmActionButton action={deleteTask} fields={{ taskId: t.id }} confirm="حذف هذه المهمة نهائياً؟" className="btn-danger px-2 py-1 text-[10px]">حذف</ConfirmActionButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ================== المحامون ==================
async function LawyersTab() {
  const [all, pendingLawyers, upwardMap] = await Promise.all([
    getAllLawyers(), getPendingLawyers(), getLawyerUpcomingCounts(),
  ]);
  const active = all.filter((l) => l.isActive);
  const archived = all.filter((l) => !l.isActive);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold text-ink/45">{arNum(active.length)} نشط · {arNum(archived.length)} في الأرشيف</p>
        <div className="flex gap-2">
          <Link href="/admin/lawyers/archive" className="btn-ghost py-1.5 text-xs"><Archive className="h-4 w-4" /> الأرشيف</Link>
          <LawyerFormButton />
        </div>
      </div>

      {pendingLawyers.length > 0 && (
        <div className="card border-warn-100 bg-warn-50/60 p-4">
          <h3 className="mb-3 flex items-center gap-2 text-[13px] font-bold text-warn-700"><UserPlus className="h-4 w-4" /> طلبات اعتماد بانتظارك</h3>
          <div className="space-y-2">
            {pendingLawyers.map((l) => (
              <div key={l.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-warn-100 bg-white px-3 py-2.5">
                <div className="flex items-center gap-2.5">
                  <Avatar first={l.firstName} last={l.lastName} size="sm" />
                  <div>
                    <p className="text-xs font-bold text-navy-950">{l.firstName} {l.lastName}</p>
                    <p className="text-[10px] text-ink/45">{[l.specialty, l.phone, l.email].filter(Boolean).join(" · ")}</p>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <ConfirmActionButton action={approveLawyer} fields={{ lawyerId: l.id }} className="btn px-3 py-1.5 text-[11px] bg-ok-50 text-ok-700 border border-ok-100">
                    <CheckCircle2 className="h-3.5 w-3.5" /> اعتماد
                  </ConfirmActionButton>
                  <ConfirmActionButton action={toggleLawyerActive} fields={{ lawyerId: l.id, active: "0" }} confirm="رفض الطلب وأرشفته؟" className="btn-danger px-3 py-1.5 text-[11px]">رفض</ConfirmActionButton>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px]">
            <thead>
              <tr className="border-b border-line bg-paper/50">
                <th className="th">المحامي</th><th className="th">التواصل</th><th className="th">التخصص</th>
                <th className="th">قادمة</th><th className="th">الشارات</th><th className="th">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/50">
              {active.map((l) => (
                <tr key={l.id} className={cn("transition hover:bg-paper/60", !l.isApproved && "opacity-60")}>
                  <td className="td">
                    <div className="flex items-center gap-2.5">
                      <Avatar first={l.firstName} last={l.lastName} size="md" principal={l.isPrincipal} photoUrl={l.photoUrl} />
                      <div>
                        <Link href={`/lawyers/${l.slug}`} className="text-[12.5px] font-bold text-navy-950 hover:text-gold-700">
                          {l.title} {l.firstName} {l.lastName}
                        </Link>
                        <p className="text-[10px] text-ink/40">{l.jobTitle}</p>
                      </div>
                    </div>
                  </td>
                  <td className="td text-xs text-ink/60"><span dir="ltr">{l.phone}</span>{l.email && <span className="block text-[10px]" dir="ltr">{l.email}</span>}</td>
                  <td className="td text-xs text-ink/60">{l.specialty ?? "—"}</td>
                  <td className="td"><span className="chip bg-navy-900 text-gold-300">{arNum(upwardMap.get(l.id) ?? 0)}</span></td>
                  <td className="td">
                    <div className="flex flex-wrap gap-1">
                      {l.isPrincipal && <Badge tone="gold">رئيسي</Badge>}
                      {l.isApproved ? <Badge tone="green">معتمد</Badge> : <Badge tone="amber">غير معتمد</Badge>}
                    </div>
                  </td>
                  <td className="td">
                    <div className="flex flex-wrap items-center gap-1">
                      <LawyerFormButton edit initial={l} />
                      <AccessLinkButton lawyerId={l.id} />
                      <ConfirmActionButton
                        action={togglePrincipal}
                        fields={{ lawyerId: l.id, value: l.isPrincipal ? "0" : "1" }}
                        className="btn-ghost px-2 py-1 text-[10px]"
                      >
                        {l.isPrincipal ? "إلغاء الرئيسية" : "تعيين رئيسي"}
                      </ConfirmActionButton>
                      <ConfirmActionButton action={toggleLawyerActive} fields={{ lawyerId: l.id, active: "0" }} confirm={`أرشفة ${l.firstName} ${l.lastName}؟ (لن يستطيع الدخول — يمكن استرجاعه)`} className="btn-danger px-2 py-1 text-[10px]">أرشفة</ConfirmActionButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="rounded-lg bg-paper px-4 py-2.5 text-[11px] leading-5 text-ink/50">
        <Link2 className="ml-1 inline h-3.5 w-3.5 text-gold-600" />
        «رابط دخول» يولّد رابطاً شخصياً بدون كلمة مرور — مرتبط بمحامٍ واحد، صالح ٧ أيام، يُستهلك بعد أول دخول، والتوليد الجديد يدوّر القديم.
      </p>
    </div>
  );
}

// ================== الجهات ==================
async function LocationsTab({ filter }: { filter?: string }) {
  const [queue] = await Promise.all([getVerificationQueueCount()]);
  const statusFilter = filter === "queue" ? undefined : filter === "all" || !filter ? undefined : filter;
  const locs = await getLocations({ status: statusFilter });
  const shown = filter === "queue"
    ? locs.filter((l) => l.status === "PENDING" || l.status === "NEEDS_REVIEW" || l.status === "DRAFT")
    : locs;

  const chips = [
    { key: "all", label: "الكل" },
    { key: "queue", label: `طابور التحقق (${arNum(queue)})` },
    { key: "VERIFIED", label: "موثّقة" },
    { key: "ARCHIVED", label: "مؤرشفة" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {chips.map((c) => (
            <Link key={c.key} href={`/admin?tab=locations&ls=${c.key}`} className={cn("chip border px-3 py-1.5 text-xs", (filter ?? "all") === c.key ? "border-navy-900 bg-navy-900 text-gold-300" : "border-line bg-white text-ink/60 hover:border-gold-400")}>
              {c.label}
            </Link>
          ))}
        </div>
        <LocationFormButton />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead>
              <tr className="border-b border-line bg-paper/50">
                <th className="th">الجهة</th><th className="th">النطاق</th><th className="th">المسافة</th><th className="th">الثقة</th>
                <th className="th">الحالة</th><th className="th">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/50">
              {shown.map((l) => (
                <tr key={l.id} className="transition hover:bg-paper/60">
                  <td className="td max-w-64">
                    <div className="flex items-center gap-2">
                      <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-lg", l.type === "COURT" ? "bg-navy-900 text-gold-300" : "bg-gold-100 text-gold-700")}>
                        {l.type === "COURT" ? <Landmark className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
                      </span>
                      <div>
                        <Link href={`/locations/${l.slug}`} className="text-[12.5px] font-bold text-navy-950 hover:text-gold-700">{l.name}</Link>
                        <p className="text-[10px] text-ink/40">{l.subtype}</p>
                      </div>
                    </div>
                  </td>
                  <td className="td text-xs text-ink/60">{[l.district, l.governorate].filter(Boolean).join(" — ")}</td>
                  <td className="td text-xs text-ink/60">{l.distanceKm != null ? `${arNum(l.distanceKm)} كم` : "—"}</td>
                  <td className="td"><ConfidenceBadge confidence={l.confidence} /></td>
                  <td className="td"><LocationStatusBadge status={l.status} /></td>
                  <td className="td">
                    <div className="flex flex-wrap items-center gap-1">
                      {l.status !== "VERIFIED" && (
                        <ConfirmActionButton action={verifyLocation} fields={{ locationId: l.id }} className="btn px-2 py-1 text-[10px] bg-ok-50 text-ok-700 border border-ok-100">
                          <CheckCircle2 className="h-3 w-3" /> توثيق
                        </ConfirmActionButton>
                      )}
                      <LocationFormButton edit initial={l} />
                      {l.status !== "ARCHIVED" && l.status !== "NEEDS_REVIEW" && (
                        <ConfirmActionButton action={setLocationStatus} fields={{ locationId: l.id, status: "NEEDS_REVIEW" }} className="btn-ghost px-2 py-1 text-[10px]">مراجعة</ConfirmActionButton>
                      )}
                      {l.status !== "ARCHIVED" ? (
                        <ConfirmActionButton action={setLocationStatus} fields={{ locationId: l.id, status: "ARCHIVED" }} confirm="أرشفة هذه الجهة؟" className="btn-danger px-2 py-1 text-[10px]">أرشفة</ConfirmActionButton>
                      ) : (
                        <ConfirmActionButton action={setLocationStatus} fields={{ locationId: l.id, status: "PENDING" }} className="btn-ghost px-2 py-1 text-[10px]">إلغاء الأرشفة</ConfirmActionButton>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {shown.length === 0 && <p className="py-10 text-center text-xs text-ink/40">لا جهات مطابقة لهذا الفلتر</p>}
        </div>
      </div>
    </div>
  );
}

// ================== العملاء ==================
async function ClientsTab({ q }: { q?: string }) {
  const [clientList, lawyers] = await Promise.all([getClientsWithMeta(q || undefined), getActiveLawyers()]);
  const lawyerOpts = lawyers.map((l) => ({ id: l.id, title: l.title, firstName: l.firstName, lastName: l.lastName }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <form className="flex items-center gap-2" action="/admin">
          <input type="hidden" name="tab" value="clients" />
          <input name="cq" defaultValue={q ?? ""} placeholder="بحث باسم أو هاتف عميل…" className="input w-64" />
          <button className="btn-navy text-xs">بحث</button>
        </form>
        <ClientFormButton lawyers={lawyerOpts} />
      </div>

      <div className="relative rounded-lg border border-danger-100 bg-danger-50/30 p-1">
        <p className="absolute -top-2.5 right-4 rounded-full bg-danger-100 px-2.5 py-0.5 text-[10px] font-bold text-danger-700">بيانات سرية — الإدارة فقط</p>
        <div className="card overflow-hidden border-0 shadow-none">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px]">
              <thead>
                <tr className="border-b border-line bg-paper/50">
                  <th className="th">العميل</th><th className="th">التواصل</th><th className="th">الرقم القومي</th>
                  <th className="th">المحامي المسؤول</th><th className="th">القضايا</th><th className="th">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/50">
                {clientList.map((c) => (
                  <tr key={c.id} className="transition hover:bg-paper/60">
                    <td className="td">
                      <Link href={`/admin/clients/${c.id}`} className="text-[12.5px] font-bold text-navy-950 hover:text-gold-700">{c.name}</Link>
                      {c.notes && <p className="max-w-52 truncate text-[10px] text-ink/40">{c.notes}</p>}
                    </td>
                    <td className="td text-xs text-ink/60"><span dir="ltr">{c.phone}</span>{c.email && <span className="block text-[10px]" dir="ltr">{c.email}</span>}</td>
                    <td className="td text-xs text-ink/60" dir="ltr">{c.nationalId ?? "—"}</td>
                    <td className="td text-xs text-ink/60">{c.responsible ?? <span className="text-warn-600">غير محدد</span>}</td>
                    <td className="td"><span className="chip bg-navy-900 text-gold-300">{arNum(c.caseCount)}</span></td>
                    <td className="td">
                      <div className="flex items-center gap-1">
                        <ClientFormButton edit lawyers={lawyerOpts} initial={c} />
                        <ConfirmActionButton action={deleteClient} fields={{ clientId: c.id }} confirm={`حذف العميل «${c.name}»؟ ستبقى قضاياه بدون ربط.`} className="btn-danger px-2 py-1 text-[10px]">حذف</ConfirmActionButton>
                        <Link href={`/admin/clients/${c.id}`} className="btn-ghost px-2 py-1 text-[10px]">الملف</Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {clientList.length === 0 && <p className="py-10 text-center text-xs text-ink/40">لا عملاء مطابقون</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ================== القضايا ==================
async function CasesTab() {
  const [caseList, clientRows] = await Promise.all([
    getCasesWithMeta(),
    db.select({ id: clients.id, name: clients.name }).from(clients),
  ]);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold text-ink/45">
          {arNum(caseList.length)} قضية — {arNum(caseList.filter((c) => !c.clientId2).length)} غير مرتبطة بعميل
        </p>
        <div className="flex gap-2">
          <Link href="/case-archive" className="btn-ghost py-1.5 text-xs">عرض الأرشيف العام</Link>
          <CaseFormButton clients={clientRows} />
        </div>
      </div>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="border-b border-line bg-paper/50">
                <th className="th">القضية</th><th className="th">الرقم</th><th className="th">العميل</th>
                <th className="th">الحالة</th><th className="th">المهام</th><th className="th">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/50">
              {caseList.map((c) => (
                <tr key={c.id} className="transition hover:bg-paper/60">
                  <td className="td max-w-72">
                    <Link href="/case-archive" className="text-[12.5px] font-bold text-navy-950 hover:text-gold-700">{c.name}</Link>
                  </td>
                  <td className="td text-xs text-ink/60">{c.caseNumber ?? "—"}</td>
                  <td className="td text-xs">
                    {c.clientName ? (
                      <Link href={`/admin/clients/${c.clientId2}`} className="font-bold text-gold-700 hover:underline">{c.clientName}</Link>
                    ) : (
                      <span className="text-warn-600">غير مرتبطة</span>
                    )}
                  </td>
                  <td className="td"><CaseStatusBadge status={c.status} /></td>
                  <td className="td"><span className="chip bg-paper text-ink/55 border border-line">{arNum(c.taskCount)}</span></td>
                  <td className="td">
                    {c.clientId2 && (
                      <ConfirmActionButton action={unlinkCase} fields={{ caseId: c.id }} confirm="فك ربط القضية عن العميل؟" className="btn-ghost px-2 py-1 text-[10px]">فك الربط</ConfirmActionButton>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ================== التذكيرات ==================
async function RemindersTab() {
  const [officeReminders, emailLog, emailCount] = await Promise.all([
    getMyReminders(null), getEmailReminderLog(40), getEmailReminderCount(),
  ]);
  const items: ReminderItem[] = officeReminders.map((r) => ({
    id: r.id, title: r.title, note: r.note, date: r.date, time: r.time, isDone: r.isDone,
    ownerName: r.ownerName ?? "تذكير مكتب",
  }));

  return (
    <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
      <section className="card self-start p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-[13px] font-bold text-navy-900"><BellRing className="h-4 w-4 text-gold-600" /> تذكيرات المكتب (كل المستخدمين)</h3>
          <ReminderCreator compact />
        </div>
        <p className="mb-3 rounded-lg bg-paper px-3 py-2 text-[11px] leading-5 text-ink/50">
          أنت في عرض الإدارة: تظهر تذكيرات المكتب كاملة. المحامي المسجَّل يرى تذكيراته الخاصة فقط في لوحته الرئيسية.
        </p>
        <ReminderList items={items} showOwner />
      </section>

      <section className="card overflow-hidden self-start">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-paper/70 px-4 py-2.5">
          <h3 className="flex items-center gap-2 text-[13px] font-bold text-navy-900">
            <MailCheck className="h-4 w-4 text-gold-600" />
            سجل تذكيرات البريد التلقائية (Ledger)
          </h3>
          <div className="flex items-center gap-2">
            <span className="chip bg-navy-900 text-gold-300">{arNum(emailCount)} تذكير</span>
            <RunCronButton />
          </div>
        </div>
        <p className="border-b border-line/60 bg-gold-50/50 px-4 py-2 text-[11px] leading-5 text-gold-700">
          النظام مجدول (تشغيلتان يومياً عبر <code dir="ltr">/api/cron</code>): تذكير قبل ١٤ يوماً، ٧ أيام، ٣ أيام، وليلة الجلسة. الـLedger يمنع إرسال نفس التذكير مرتين.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-line bg-paper/50">
                <th className="th">النوع</th><th className="th">الجلسة</th><th className="th">المستلم</th><th className="th">موعد الجلسة</th><th className="th">أُرسل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/50">
              {emailLog.map((e) => (
                <tr key={e.id} className="transition hover:bg-paper/60">
                  <td className="td">
                    <span className="chip bg-gold-100 text-gold-700" dir="ltr">
                      {e.kind === "D14" ? "قبل ١٤ يوم" : e.kind === "D7" ? "قبل ٧ أيام" : e.kind === "D3" ? "قبل ٣ أيام" : "ليلة الجلسة"}
                    </span>
                  </td>
                  <td className="td max-w-56">
                    <Link href={`/tasks/${e.taskId}`} className="text-[12.5px] font-bold text-navy-950 hover:text-gold-700">{e.taskTitle}</Link>
                  </td>
                  <td className="td text-xs text-ink/60" dir="ltr">{e.recipientEmail}</td>
                  <td className="td text-xs text-ink/60">{e.sessionDate ? arDate(e.sessionDate, false) : "—"}</td>
                  <td className="td text-xs">
                    <span className="chip bg-ok-100 text-ok-700">{e.status === "SENT" ? "أُرسل" : e.status}</span>
                    <span className="block text-[10px] text-ink/40">{timeAgoAr(e.sentAt)}</span>
                  </td>
                </tr>
              ))}
              {emailLog.length === 0 && (
                <tr><td colSpan={5} className="py-10 text-center text-xs text-ink/40">لم تُرسل تذكيرات بعد — شغّل الدورة يدوياً</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

// ================== المستخدمون ==================
async function UsersTab() {
  const list = await getUsers();
  return (
    <div className="space-y-4">
      <form action={createUser} className="card grid items-end gap-3 p-4 sm:grid-cols-5">
        <div>
          <label className="label">الاسم</label>
          <input name="name" required className="input" />
        </div>
        <div>
          <label className="label">البريد</label>
          <input name="email" type="email" required className="input" dir="ltr" />
        </div>
        <div>
          <label className="label">الدور</label>
          <select name="role" className="input" defaultValue="VIEWER">
            <option value="SUPER_ADMIN">مدير عام</option><option value="ADMIN">مدير</option><option value="OFFICE_MANAGER">مدير مكتب</option>
            <option value="LAWYER">محامي</option><option value="SECRETARY">سكرتارية</option><option value="VIEWER">قارئ</option>
          </select>
        </div>
        <div>
          <label className="label">Access Code (اختياري)</label>
          <input name="accessCode" className="input" dir="ltr" />
        </div>
        <div>
          <input type="hidden" name="from" value="/admin?tab=users" />
          <button className="btn-gold w-full">+ إضافة مستخدم</button>
        </div>
      </form>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-line bg-paper/50">
                <th className="th">المستخدم</th><th className="th">البريد</th><th className="th">الدور</th><th className="th">أُنشئ</th><th className="th"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/50">
              {list.map((u) => (
                <tr key={u.id} className="transition hover:bg-paper/60">
                  <td className="td text-[12.5px] font-bold text-navy-950">{u.name}</td>
                  <td className="td text-xs text-ink/60" dir="ltr">{u.email}</td>
                  <td className="td"><UserRoleSelect userId={u.id} role={u.role} /></td>
                  <td className="td text-xs text-ink/45">{timeAgoAr(u.createdAt)}</td>
                  <td className="td">
                    <ConfirmActionButton action={deleteUser} fields={{ userId: u.id }} confirm={`حذف المستخدم «${u.name}»؟`} className="btn-danger px-2 py-1 text-[10px]">حذف</ConfirmActionButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="rounded-lg bg-paper px-4 py-2.5 text-[11px] leading-6 text-ink/50">
        تبويب الإدمن يظهر فقط لمن يملك صلاحية <strong>manageUsers</strong>: المدير العام والمدير. باقي الأدوار (مدير مكتب / سكرتارية / محامي / قارئ) لا تراه.
      </p>
    </div>
  );
}

// ================== النشاط ==================
async function ActivityTab() {
  const list = await getActivity(40);
  return (
    <div className="card overflow-hidden">
      <h3 className="border-b border-line bg-paper/70 px-4 py-2.5 text-[13px] font-bold text-navy-900">سجل النشاط — آخر {arNum(list.length)} عملية</h3>
      <div className="divide-y divide-line/60">
        {list.length === 0 && <p className="py-10 text-center text-xs text-ink/40">لا نشاط مسجل بعد</p>}
        {list.map((a) => (
          <div key={a.id} className="flex items-start gap-3 px-4 py-3.5">
            <span className="chip mt-0.5 shrink-0 bg-navy-900 text-gold-300" dir="ltr">{a.action}</span>
            <div className="min-w-0">
              <p className="text-[12.5px] leading-6 text-ink/80">{a.summary}</p>
              <p className="text-[10px] text-ink/40">{a.actorName ?? "النظام"} · {timeAgoAr(a.createdAt)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
