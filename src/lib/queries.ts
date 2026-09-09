// طبقة الاستعلامات — كل القراءة من قاعدة البيانات
import { db } from "@/db";
import {
  activityLogs,
  adminSettings,
  cases,
  caseEvents,
  categories,
  clients,
  comments,
  emailReminders,
  lawyers,
  locations,
  notifications,
  reminders,
  services,
  taskAssignments,
  tasks,
  users,
  type Case,
  type Category_,
  type Comment_,
  type Lawyer,
  type Location,
  type Task,
} from "@/db/schema";
import { and, asc, count, desc, eq, gte, ilike, inArray, isNotNull, isNull, like, lt, lte, ne, or, sql } from "drizzle-orm";
import { bucketOf, dateOffset, todayStr, type BucketKey } from "@/lib/utils";

// ---------- أنواع موسّعة ----------
export type MiniLawyer = Pick<Lawyer, "id" | "slug" | "firstName" | "lastName" | "title">;

export type TaskView = Task & {
  location: Pick<Location, "id" | "name" | "slug" | "type"> | null;
  caseRef: Pick<Case, "id" | "name" | "caseNumber"> | null;
  lawyersList: MiniLawyer[];
  comments: Comment_[];
};

export async function enrichTasks(rows: Task[], withComments = false): Promise<TaskView[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const locIds = [...new Set(rows.map((r) => r.locationId).filter((x): x is number => x != null))];
  const caseIds = [...new Set(rows.map((r) => r.caseId).filter((x): x is number => x != null))];

  const [locs, cass, assignRows, comms] = await Promise.all([
    locIds.length
      ? db.select().from(locations).where(inArray(locations.id, locIds))
      : Promise.resolve([] as Location[]),
    caseIds.length
      ? db.select().from(cases).where(inArray(cases.id, caseIds))
      : Promise.resolve([] as Case[]),
    db
      .select({
        taskId: taskAssignments.taskId,
        id: lawyers.id,
        slug: lawyers.slug,
        firstName: lawyers.firstName,
        lastName: lawyers.lastName,
        title: lawyers.title,
      })
      .from(taskAssignments)
      .innerJoin(lawyers, eq(taskAssignments.lawyerId, lawyers.id))
      .where(inArray(taskAssignments.taskId, ids)),
    withComments
      ? db.select().from(comments).where(inArray(comments.taskId, ids)).orderBy(asc(comments.createdAt))
      : Promise.resolve([] as Comment_[]),
  ]);

  const locMap = new Map(locs.map((l) => [l.id, l]));
  const caseMap = new Map(cass.map((c) => [c.id, c]));
  const assignMap = new Map<number, MiniLawyer[]>();
  for (const a of assignRows) {
    const list = assignMap.get(a.taskId) ?? [];
    list.push({ id: a.id, slug: a.slug, firstName: a.firstName, lastName: a.lastName, title: a.title });
    assignMap.set(a.taskId, list);
  }
  const commMap = new Map<number, Comment_[]>();
  for (const c of comms) {
    const list = commMap.get(c.taskId) ?? [];
    list.push(c);
    commMap.set(c.taskId, list);
  }

  return rows.map((t) => ({
    ...t,
    location: t.locationId
      ? (() => {
          const l = locMap.get(t.locationId!);
          return l ? { id: l.id, name: l.name, slug: l.slug, type: l.type } : null;
        })()
      : null,
    caseRef: t.caseId
      ? (() => {
          const c = caseMap.get(t.caseId!);
          return c ? { id: c.id, name: c.name, caseNumber: c.caseNumber } : null;
        })()
      : null,
    lawyersList: assignMap.get(t.id) ?? [],
    comments: commMap.get(t.id) ?? [],
  }));
}

// ---------- جلسات الشريط الجانبي ----------
export async function getSessionRail() {
  const today = todayStr();
  const end = dateOffset(30);
  const rows = await db
    .select()
    .from(tasks)
    .where(
      and(
        isNotNull(tasks.date),
        gte(tasks.date, today),
        lte(tasks.date, end),
        ne(tasks.type, "POST"),
        inArray(tasks.status, ["PENDING", "IN_PROGRESS"]),
      ),
    )
    .orderBy(asc(tasks.date), asc(tasks.time));
  const enriched = await enrichTasks(rows);
  const groups: Record<string, TaskView[]> = { today: [], tomorrow: [], d3: [], d14: [], d30: [] };
  for (const t of enriched) {
    const b = bucketOf(t.date);
    if (b in groups) groups[b].push(t);
  }
  return groups;
}

// ---------- إحصائيات لوحة التحكم ----------
export async function getDashboardStats() {
  const today = todayStr();
  const tomorrow = dateOffset(1);
  const d3 = dateOffset(3);
  const d30 = dateOffset(30);
  const notPost = ne(tasks.type, "POST");
  const open = inArray(tasks.status, ["PENDING", "IN_PROGRESS"]);

  const q = async (cond: ReturnType<typeof and>) => {
    const [r] = await db.select({ c: count() }).from(tasks).where(cond);
    return Number(r?.c ?? 0);
  };

  const [todayC, tomorrowC, criticalC, openC, completedC, monthC, overdueC, lawyerC] =
    await Promise.all([
      q(and(eq(tasks.date, today), notPost, ne(tasks.status, "CANCELLED"))),
      q(and(eq(tasks.date, tomorrow), notPost, ne(tasks.status, "CANCELLED"))),
      q(and(eq(tasks.priority, "CRITICAL"), gte(tasks.date, today), lte(tasks.date, d3), open, notPost)),
      q(and(open, notPost)),
      q(eq(tasks.status, "COMPLETED")),
      q(and(gte(tasks.date, today), lte(tasks.date, d30), notPost, ne(tasks.status, "CANCELLED"))),
      q(and(lte(tasks.date, dateOffset(-1)), open, notPost)),
      db
        .select({ c: count() })
        .from(lawyers)
        .where(and(eq(lawyers.isActive, true), eq(lawyers.isApproved, true)))
        .then((r) => Number(r[0]?.c ?? 0)),
    ]);

  return {
    today: todayC,
    tomorrow: tomorrowC,
    critical: criticalC,
    open: openC,
    completed: completedC,
    month: monthC,
    overdue: overdueC,
    lawyers: lawyerC,
  };
}

// ---------- الفيد ----------
export async function getFeed(limit = 30) {
  const rows = await db.select().from(tasks).orderBy(desc(tasks.createdAt)).limit(limit);
  return enrichTasks(rows, true);
}

export async function getTaskById(id: number) {
  const [row] = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
  if (!row) return null;
  const [view] = await enrichTasks([row], true);
  return view;
}

// ---------- الجلسات حسب التصنيف ----------
export async function getTasksByBucket(bucket: BucketKey | "all") {
  const today = todayStr();
  let cond;
  switch (bucket) {
    case "all":
      cond = ne(tasks.type, "POST");
      break;
    case "none":
      cond = and(isNull(tasks.date), ne(tasks.type, "POST"));
      break;
    case "overdue":
      cond = and(isNotNull(tasks.date), lte(tasks.date, dateOffset(-1)), inArray(tasks.status, ["PENDING", "IN_PROGRESS"]), ne(tasks.type, "POST"));
      break;
    case "today":
      cond = and(eq(tasks.date, today), ne(tasks.type, "POST"));
      break;
    case "tomorrow":
      cond = and(eq(tasks.date, dateOffset(1)), ne(tasks.type, "POST"));
      break;
    case "d3":
      cond = and(gte(tasks.date, dateOffset(2)), lte(tasks.date, dateOffset(3)), ne(tasks.type, "POST"));
      break;
    case "d14":
      cond = and(gte(tasks.date, dateOffset(4)), lte(tasks.date, dateOffset(14)), ne(tasks.type, "POST"));
      break;
    case "d30":
      cond = and(gte(tasks.date, dateOffset(15)), lte(tasks.date, dateOffset(30)), ne(tasks.type, "POST"));
      break;
    default:
      cond = ne(tasks.type, "POST");
  }
  const rows = await db
    .select()
    .from(tasks)
    .where(cond)
    .orderBy(asc(tasks.date), asc(tasks.time), desc(tasks.createdAt));
  return enrichTasks(rows, true);
}

// ---------- تقويم شهر ----------
export async function getMonthTasks(year: number, month: number) {
  const prefix = `${year}-${String(month).padStart(2, "0")}-%`;
  const rows = await db
    .select()
    .from(tasks)
    .where(and(like(tasks.date, prefix), ne(tasks.type, "POST")))
    .orderBy(asc(tasks.date), asc(tasks.time));
  return enrichTasks(rows);
}

// ---------- المحامون ----------
export async function getActiveLawyers() {
  return db
    .select()
    .from(lawyers)
    .where(and(eq(lawyers.isActive, true), eq(lawyers.isApproved, true)))
    .orderBy(asc(lawyers.displayOrder), asc(lawyers.id));
}

export async function getAllLawyers() {
  return db.select().from(lawyers).orderBy(desc(lawyers.isActive), asc(lawyers.displayOrder), asc(lawyers.id));
}

export async function getArchivedLawyers() {
  return db.select().from(lawyers).where(eq(lawyers.isActive, false)).orderBy(asc(lawyers.id));
}

export async function getPendingLawyers() {
  return db
    .select()
    .from(lawyers)
    .where(and(eq(lawyers.isApproved, false), eq(lawyers.isActive, true)))
    .orderBy(desc(lawyers.createdAt));
}

export async function getLawyerBySlug(slug: string) {
  const [lawyer] = await db.select().from(lawyers).where(eq(lawyers.slug, slug)).limit(1);
  if (!lawyer) return null;
  const assignRows = await db
    .select({ taskId: taskAssignments.taskId })
    .from(taskAssignments)
    .where(eq(taskAssignments.lawyerId, lawyer.id));
  const ids = assignRows.map((r) => r.taskId);
  const myTasks = ids.length
    ? await db.select().from(tasks).where(inArray(tasks.id, ids)).orderBy(asc(tasks.date), asc(tasks.time))
    : [];
  const upcoming = myTasks.filter((t) => t.date && t.date >= todayStr() && t.status !== "COMPLETED" && t.status !== "CANCELLED");
  const done = myTasks.filter((t) => t.status === "COMPLETED");
  const enriched = await enrichTasks(myTasks, true);
  return { lawyer, tasks: enriched, upcomingCount: upcoming.length, doneCount: done.length, totalCount: myTasks.length };
}

export async function getLawyerUpcomingCounts() {
  const today = todayStr();
  const rows = await db
    .select({ lawyerId: taskAssignments.lawyerId, c: count() })
    .from(taskAssignments)
    .innerJoin(tasks, eq(taskAssignments.taskId, tasks.id))
    .where(and(gte(tasks.date, today), inArray(tasks.status, ["PENDING", "IN_PROGRESS"])))
    .groupBy(taskAssignments.lawyerId);
  return new Map(rows.map((r) => [r.lawyerId, Number(r.c)]));
}

// ---------- الجهات ----------
export async function getLocations(opts?: { q?: string; type?: string; status?: string; activeOnly?: boolean }) {
  const conds = [] as ReturnType<typeof eq>[];
  if (opts?.q) {
    const p = `%${opts.q}%`;
    conds.push(
      or(ilike(locations.name, p), ilike(locations.description, p), ilike(locations.subtype, p), ilike(locations.governorate, p), ilike(locations.district, p))!,
    );
  }
  if (opts?.type === "COURT" || opts?.type === "AGENCY") conds.push(eq(locations.type, opts.type));
  if (opts?.status) conds.push(eq(locations.status, opts.status as Location["status"]));
  if (opts?.activeOnly) conds.push(ne(locations.status, "ARCHIVED"));
  const where = conds.length ? and(...conds) : undefined;
  return db.select().from(locations).where(where).orderBy(asc(locations.displayOrder), asc(locations.id));
}

export async function getLocationBySlug(slug: string) {
  const [loc] = await db.select().from(locations).where(eq(locations.slug, slug)).limit(1);
  if (!loc) return null;
  const rows = await db
    .select()
    .from(tasks)
    .where(eq(tasks.locationId, loc.id))
    .orderBy(desc(tasks.date), asc(tasks.time));
  const enriched = await enrichTasks(rows);
  const upcoming = enriched.filter((t) => t.date && t.date >= todayStr() && (t.status === "PENDING" || t.status === "IN_PROGRESS"));
  return { loc, tasks: enriched, upcoming };
}

export async function getVerificationQueueCount() {
  const [r] = await db
    .select({ c: count() })
    .from(locations)
    .where(inArray(locations.status, ["PENDING", "NEEDS_REVIEW", "DRAFT"]));
  return Number(r?.c ?? 0);
}

// ---------- العملاء ----------
export async function getClientsWithMeta(q?: string) {
  const rows = await db
    .select({
      client: clients,
      lawyerFirst: lawyers.firstName,
      lawyerLast: lawyers.lastName,
      lawyerTitle: lawyers.title,
    })
    .from(clients)
    .leftJoin(lawyers, eq(clients.responsibleLawyerId, lawyers.id))
    .where(q ? or(ilike(clients.name, `%${q}%`), ilike(clients.phone, `%${q}%`)) : undefined)
    .orderBy(asc(clients.name));
  const caseCounts = await db.select({ clientId: cases.clientId, c: count() }).from(cases).groupBy(cases.clientId);
  const map = new Map(caseCounts.map((r) => [r.clientId, Number(r.c)]));
  return rows.map((r) => ({
    ...r.client,
    responsible: r.lawyerFirst ? `${r.lawyerTitle} ${r.lawyerFirst} ${r.lawyerLast}` : null,
    caseCount: map.get(r.client.id) ?? 0,
  }));
}

export async function getClientById(id: number) {
  const [client] = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
  if (!client) return null;
  const [responsible] = client.responsibleLawyerId
    ? await db.select().from(lawyers).where(eq(lawyers.id, client.responsibleLawyerId)).limit(1)
    : [null];
  const clientCases = await db.select().from(cases).where(eq(cases.clientId, id)).orderBy(desc(cases.createdAt));
  const unlinked = await db.select().from(cases).where(isNull(cases.clientId)).orderBy(desc(cases.createdAt));
  return { client, responsible, cases: clientCases, unlinked };
}

// ---------- القضايا ----------
export async function getCasesWithMeta(statusFilter?: string, q?: string) {
  const conds = [] as ReturnType<typeof eq>[];
  if (statusFilter === "OPEN" || statusFilter === "CLOSED" || statusFilter === "ARCHIVED")
    conds.push(eq(cases.status, statusFilter));
  if (q) conds.push(or(ilike(cases.name, `%${q}%`), ilike(cases.caseNumber, `%${q}%`))!);
  const rows = await db
    .select({ caseRow: cases, clientName: clients.name, clientId: clients.id })
    .from(cases)
    .leftJoin(clients, eq(cases.clientId, clients.id))
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(cases.createdAt));
  const taskCounts = await db.select({ caseId: tasks.caseId, c: count() }).from(tasks).groupBy(tasks.caseId);
  const map = new Map(taskCounts.map((r) => [r.caseId, Number(r.c)]));
  return rows.map((r) => ({
    ...r.caseRow,
    clientName: r.clientName,
    clientId2: r.clientId,
    taskCount: map.get(r.caseRow.id) ?? 0,
  }));
}

export async function getCaseById(id: number) {
  const [c] = await db.select().from(cases).where(eq(cases.id, id)).limit(1);
  if (!c) return null;
  const events = await db.select().from(caseEvents).where(eq(caseEvents.caseId, id)).orderBy(desc(caseEvents.createdAt));
  const rows = await db.select().from(tasks).where(eq(tasks.caseId, id)).orderBy(desc(tasks.date));
  const enriched = await enrichTasks(rows);
  const [clientRow] = c.clientId ? await db.select().from(clients).where(eq(clients.id, c.clientId)).limit(1) : [null];
  return { caseRow: c, events, tasks: enriched, client: clientRow };
}

// ---------- البحث ----------
export async function searchAll(q: string) {
  const p = `%${q}%`;
  const [taskRows, lawyerRows, locRows, caseRows, clientRows] = await Promise.all([
    db
      .select()
      .from(tasks)
      .where(or(ilike(tasks.title, p), ilike(tasks.description, p), ilike(tasks.notes, p)))
      .orderBy(desc(tasks.date))
      .limit(10),
    db
      .select()
      .from(lawyers)
      .where(or(ilike(lawyers.firstName, p), ilike(lawyers.lastName, p), ilike(lawyers.specialty, p)))
      .limit(8),
    db
      .select()
      .from(locations)
      .where(or(ilike(locations.name, p), ilike(locations.subtype, p), ilike(locations.description, p)))
      .limit(8),
    db.select().from(cases).where(or(ilike(cases.name, p), ilike(cases.caseNumber, p))).limit(8),
    db.select().from(clients).where(or(ilike(clients.name, p), ilike(clients.phone, p))).limit(8),
  ]);
  return {
    tasks: await enrichTasks(taskRows),
    lawyers: lawyerRows,
    locations: locRows,
    cases: caseRows,
    clients: clientRows,
  };
}

// ---------- إشعارات ونشاط ----------
export async function getNotifications(limit = 12) {
  const rows = await db.select().from(notifications).orderBy(desc(notifications.createdAt)).limit(limit);
  const [unread] = await db.select({ c: count() }).from(notifications).where(eq(notifications.isRead, false));
  return { rows, unreadCount: Number(unread?.c ?? 0) };
}

export async function getActivity(limit = 30) {
  return db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt)).limit(limit);
}

// ---------- متنوع ----------
export async function getUsers() {
  return db.select().from(users).orderBy(asc(users.id));
}

// ---------- التذكيرات الشخصية ----------
/** الماسح الدوري: يحوّل التذكيرات المستحقة إلى إشعارات (يدعى عند تحميل الواجهة) */
export async function scanDueReminders(currentLawyerId: number | null) {
  const now = new Date();
  const today = todayStr();
  const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  // المستحق: تاريخه قبل اليوم، أو اليوم ووقته انقضى
  const due = await db
    .select()
    .from(reminders)
    .where(
      and(
        isNull(reminders.notifiedAt),
        eq(reminders.isDone, false),
        or(
          lt(reminders.date, today),
          and(eq(reminders.date, today), or(isNull(reminders.time), lte(reminders.time, hhmm))),
        ),
      ),
    );
  for (const r of due) {
    // التذكير الشخصي يُشعِر صاحبه فقط؛ تذكير المكتب يشعر الجميع (admin side: lawyerId null)
    await db.insert(notifications).values({
      lawyerId: r.lawyerId, // null = تذكير مكتب يظهر للإدارة
      type: "reminder",
      title: `تذكير: ${r.title}`,
      body: r.note,
      link: r.lawyerId ? "/" : "/admin?tab=reminders",
    });
    await db.update(reminders).set({ notifiedAt: new Date() }).where(eq(reminders.id, r.id));
  }
  return due.length;
}

export async function getMyReminders(lawyerId: number | null) {
  const base = db
    .select({ r: reminders, ownerFirst: lawyers.firstName, ownerLast: lawyers.lastName })
    .from(reminders)
    .leftJoin(lawyers, eq(reminders.lawyerId, lawyers.id))
    .orderBy(asc(reminders.isDone), asc(reminders.date), asc(reminders.time))
    .limit(60);
  const rows = lawyerId == null ? await base : await base.where(eq(reminders.lawyerId, lawyerId));
  return rows.map((x) => ({
    ...x.r,
    ownerName: x.r.lawyerId ? `${x.ownerFirst ?? ""} ${x.ownerLast ?? ""}`.trim() : null,
  }));
}

export async function getEmailReminderLog(limit = 50) {
  return db.select().from(emailReminders).orderBy(desc(emailReminders.sentAt)).limit(limit);
}

export async function getEmailReminderCount() {
  const [r] = await db.select({ c: count() }).from(emailReminders);
  return Number(r?.c ?? 0);
}

// ---------- دليل المحامي: التصنيفات والخدمات ----------
export async function getCategories(): Promise<Category_[]> {
  return db.select().from(categories).orderBy(asc(categories.displayOrder));
}

export async function getGeneralServices() {
  return db.select().from(services).orderBy(asc(services.displayOrder));
}

export async function getSettings(): Promise<Record<string, string>> {
  const rows = await db.select().from(adminSettings);
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export { sql };
