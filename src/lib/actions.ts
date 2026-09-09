"use server";

// كل عمليات الكتابة — مهام، محامون، جهات، عملاء، قضايا، إشعارات
import { db } from "@/db";
import {
  accessTokens,
  activityLogs,
  adminSettings,
  cases,
  caseEvents,
  clients,
  comments,
  lawyers,
  locations,
  notifications,
  reminders,
  taskAssignments,
  tasks,
  users,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { slugBase } from "@/lib/utils";
import { ROLES, type Role } from "@/lib/permissions";

// ---------- أدوات داخلية ----------
const str = (fd: FormData, k: string) => {
  const v = fd.get(k);
  const s = typeof v === "string" ? v.trim() : "";
  return s || null;
};
const intOrNull = (fd: FormData, k: string) => {
  const v = str(fd, k);
  const n = v ? Number(v) : NaN;
  return Number.isFinite(n) && n > 0 ? n : null;
};
const bool = (fd: FormData, k: string) => fd.get(k) === "on" || fd.get(k) === "true";
const rev = () => revalidatePath("/", "layout");
const back = (fd: FormData, fallback = "/"): never => {
  redirect(str(fd, "from") ?? fallback);
};

async function actorName(): Promise<string> {
  const store = await cookies();
  const name = store.get("lawyerName")?.value;
  return name ? decodeURIComponent(name) : "الإدارة";
}

async function logActivity(action: string, summary: string, refs?: { taskId?: number; lawyerId?: number; locationId?: number }) {
  await db.insert(activityLogs).values({
    action,
    summary,
    taskId: refs?.taskId ?? null,
    lawyerId: refs?.lawyerId ?? null,
    locationId: refs?.locationId ?? null,
    actorName: await actorName(),
  });
}

async function notify(lawyerId: number | null, type: string, title: string, body: string | null, link: string | null) {
  await db.insert(notifications).values({ lawyerId, type, title, body, link });
}

// ---------- الهوية والأدوار ----------
export async function setRole(fd: FormData) {
  const role = str(fd, "role") as Role | null;
  const store = await cookies();
  if (role && (ROLES as readonly string[]).includes(role)) {
    store.set("role", role, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  }
  rev();
}

export async function loginLawyer(fd: FormData) {
  const id = intOrNull(fd, "lawyerId");
  if (id) {
    const [lawyer] = await db.select().from(lawyers).where(eq(lawyers.id, id)).limit(1);
    if (lawyer) {
      const store = await cookies();
      store.set("lawyerId", String(lawyer.id), { path: "/", maxAge: 60 * 60 * 24 * 30 });
      store.set("lawyerName", encodeURIComponent(`${lawyer.title} ${lawyer.firstName} ${lawyer.lastName}`), {
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
      store.set("role", "LAWYER", { path: "/", maxAge: 60 * 60 * 24 * 30 });
      await logActivity("login", `تسجيل دخول: ${lawyer.title} ${lawyer.firstName} ${lawyer.lastName}`, { lawyerId: lawyer.id });
    }
  }
  rev();
  redirect("/");
}

export async function logoutIdentity() {
  const store = await cookies();
  store.delete("lawyerId");
  store.delete("lawyerName");
  store.set("role", "SUPER_ADMIN", { path: "/" });
  rev();
  redirect("/auth");
}

// تسجيل محامٍ جديد — ينتظر اعتماد الإدارة
export async function registerLawyer(fd: FormData) {
  const first = str(fd, "firstName");
  const last = str(fd, "lastName");
  if (!first || !last) redirect("/auth?mode=register&err=1");
  const slug = `${slugBase(first)}-${slugBase(last)}-${Date.now().toString(36)}`;
  await db.insert(lawyers).values({
    slug,
    firstName: first!,
    lastName: last!,
    title: "محامي",
    phone: str(fd, "phone"),
    email: str(fd, "email"),
    specialty: str(fd, "specialty"),
    jobTitle: "محامٍ جديد",
    isApproved: false,
    isActive: true,
  });
  await notify(null, "lawyer_pending", "طلب اعتماد محامٍ جديد", `${first} ${last} سجّل وينتظر الاعتماد`, "/admin?tab=lawyers");
  await logActivity("register_lawyer", `تسجيل محامٍ جديد بانتظار الاعتماد: ${first} ${last}`);
  redirect("/auth?mode=register&ok=1");
}

// ---------- المهام / الجلسات / التكليفات ----------
export async function createTask(fd: FormData) {
  const title = str(fd, "title");
  if (!title) return back(fd);
  const type = (str(fd, "type") ?? "ASSIGNMENT") as typeof tasks.$inferInsert.type;
  const priority = (str(fd, "priority") ?? "NORMAL") as typeof tasks.$inferInsert.priority;
  const store = await cookies();
  const creatorLawyerId = Number(store.get("lawyerId")?.value ?? "") || null;
  const actor = await actorName();

  const [created] = await db
    .insert(tasks)
    .values({
      title: title!,
      type,
      priority,
      date: str(fd, "date"),
      time: str(fd, "time"),
      locationId: intOrNull(fd, "locationId"),
      caseId: intOrNull(fd, "caseId"),
      description: str(fd, "description"),
      notes: str(fd, "notes"),
      status: "PENDING",
      createdByName: actor,
      createdByLawyerId: creatorLawyerId,
    })
    .returning();

  let assigned: number[] = [];
  const raw = fd.getAll("lawyerIds").map((v) => Number(v)).filter((n) => Number.isFinite(n) && n > 0);
  const single = intOrNull(fd, "lawyerId");
  if (single && !raw.includes(single)) raw.push(single);
  assigned = [...new Set(raw)];
  for (const lid of assigned) {
    await db.insert(taskAssignments).values({ taskId: created.id, lawyerId: lid }).onConflictDoNothing();
  }

  // إشعارات للمحامين المكلّفين
  for (const lid of assigned) {
    await notify(lid, "assignment", "تكليف جديد باسمك", created.title, `/tasks/${created.id}`);
  }
  const kindLabel =
    type === "SESSION" ? "جلسة" : type === "ENTITY_VISIT" ? "حضور جهة" : type === "POST" ? "منشور" : "تكليف";
  await logActivity(
    "create_task",
    `${actor} أنشأ ${kindLabel}: «${created.title}»${assigned.length ? ` — ${assigned.length} محامٍ مكلّف` : ""}`,
    { taskId: created.id },
  );
  rev();
  back(fd, "/sessions");
}

export async function quickPost(fd: FormData) {
  const body = str(fd, "title");
  if (!body) return back(fd);
  const store = await cookies();
  const creatorLawyerId = Number(store.get("lawyerId")?.value ?? "") || null;
  const actor = await actorName();
  const [created] = await db
    .insert(tasks)
    .values({
      title: body!,
      type: "POST",
      status: "COMPLETED",
      priority: "NORMAL",
      createdByName: actor,
      createdByLawyerId: creatorLawyerId,
    })
    .returning();
  await logActivity("create_post", `${actor} نشر تحديثاً في فيد المكتب`, { taskId: created.id });
  rev();
  back(fd);
}

export async function updateTaskStatus(fd: FormData) {
  const id = intOrNull(fd, "taskId");
  const status = str(fd, "status") as typeof tasks.$inferInsert.status;
  if (!id || !status) return back(fd);
  const [task] = await db.update(tasks).set({ status }).where(eq(tasks.id, id)).returning();
  if (task) {
    const assigns = await db.select().from(taskAssignments).where(eq(taskAssignments.taskId, id));
    const label =
      status === "COMPLETED" ? "تم تنفيذ" : status === "CANCELLED" ? "تم إلغاء" : status === "IN_PROGRESS" ? "بدأ تنفيذ" : "أعيد فتح";
    for (const a of assigns) {
      await notify(a.lawyerId, "status", `${label}: «${task.title}»`, null, `/tasks/${id}`);
    }
    const actor = await actorName();
    await logActivity("update_status", `${actor} ${label} «${task.title}»`, { taskId: id });
  }
  rev();
  back(fd);
}

export async function deleteTask(fd: FormData) {
  const id = intOrNull(fd, "taskId");
  if (!id) return back(fd);
  const [task] = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
  await db.delete(tasks).where(eq(tasks.id, id));
  if (task) await logActivity("delete_task", `حذف المهمة «${task.title}» من السجل`);
  rev();
  back(fd, "/tasks");
}

// ---------- التعليقات ----------
export async function addComment(fd: FormData) {
  const taskId = intOrNull(fd, "taskId");
  const body = str(fd, "body");
  if (!taskId || !body) return back(fd);
  const store = await cookies();
  const lawyerId = Number(store.get("lawyerId")?.value ?? "") || null;
  const actor = await actorName();
  await db.insert(comments).values({ taskId, lawyerId, authorName: actor, body: body! });
  const assigns = await db.select().from(taskAssignments).where(eq(taskAssignments.taskId, taskId));
  for (const a of assigns) {
    if (a.lawyerId !== lawyerId) {
      await notify(a.lawyerId, "comment", `تعليق من ${actor}`, body!.slice(0, 120), `/tasks/${taskId}`);
    }
  }
  await logActivity("comment", `${actor} علّق على مهمة #${taskId}`, { taskId });
  rev();
  back(fd);
}

export async function updateComment(fd: FormData) {
  const id = intOrNull(fd, "commentId");
  const body = str(fd, "body");
  if (!id || !body) return back(fd);
  await db.update(comments).set({ body: body!, editedAt: new Date() }).where(eq(comments.id, id));
  rev();
  back(fd);
}

export async function deleteComment(fd: FormData) {
  const id = intOrNull(fd, "commentId");
  if (!id) return back(fd);
  await db.delete(comments).where(eq(comments.id, id));
  rev();
  back(fd);
}

export async function markNotificationsRead() {
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.isRead, false));
  rev();
}

// ---------- المحامون ----------
export async function createLawyer(fd: FormData) {
  const first = str(fd, "firstName");
  const last = str(fd, "lastName");
  if (!first || !last) return back(fd, "/admin?tab=lawyers");
  const slug = `${slugBase(first)}-${slugBase(last)}-${Date.now().toString(36)}`;
  await db.insert(lawyers).values({
    slug,
    firstName: first!,
    lastName: last!,
    title: str(fd, "title") ?? "محامي",
    phone: str(fd, "phone"),
    email: str(fd, "email"),
    specialty: str(fd, "specialty"),
    bio: str(fd, "bio"),
    jobTitle: str(fd, "jobTitle"),
    gmailIdentity: str(fd, "gmailIdentity"),
    isPrincipal: bool(fd, "isPrincipal"),
    isApproved: true,
    isActive: true,
    displayOrder: Number(str(fd, "displayOrder") ?? 99),
  });
  await logActivity("create_lawyer", `إضافة محامٍ جديد: ${first} ${last}`);
  rev();
  back(fd, "/admin?tab=lawyers");
}

export async function updateLawyer(fd: FormData) {
  const id = intOrNull(fd, "lawyerId");
  if (!id) return back(fd, "/admin?tab=lawyers");
  await db
    .update(lawyers)
    .set({
      firstName: str(fd, "firstName") ?? undefined,
      lastName: str(fd, "lastName") ?? undefined,
      title: str(fd, "title") ?? undefined,
      phone: str(fd, "phone"),
      email: str(fd, "email"),
      specialty: str(fd, "specialty"),
      bio: str(fd, "bio"),
      jobTitle: str(fd, "jobTitle"),
      gmailIdentity: str(fd, "gmailIdentity"),
      isPrincipal: bool(fd, "isPrincipal"),
      displayOrder: Number(str(fd, "displayOrder") ?? 99),
    })
    .where(eq(lawyers.id, id));
  await logActivity("update_lawyer", `تعديل بيانات محامٍ #${id}`, { lawyerId: id });
  rev();
  back(fd, "/admin?tab=lawyers");
}

export async function toggleLawyerActive(fd: FormData) {
  const id = intOrNull(fd, "lawyerId");
  const active = str(fd, "active") === "1";
  if (!id) return back(fd, "/admin?tab=lawyers");
  await db.update(lawyers).set({ isActive: active }).where(eq(lawyers.id, id));
  const [l] = await db.select().from(lawyers).where(eq(lawyers.id, id)).limit(1);
  await logActivity(
    active ? "restore_lawyer" : "archive_lawyer",
    l ? `${active ? "استرجاع" : "أرشفة"} المحامي ${l.firstName} ${l.lastName}` : "",
    { lawyerId: id },
  );
  rev();
  back(fd, active ? "/admin/lawyers/archive" : "/admin?tab=lawyers");
}

export async function approveLawyer(fd: FormData) {
  const id = intOrNull(fd, "lawyerId");
  if (!id) return back(fd, "/admin?tab=lawyers");
  await db.update(lawyers).set({ isApproved: true }).where(eq(lawyers.id, id));
  await notify(id, "approved", "تم اعتماد حسابك", "يمكنك الآن تسجيل الدخول واستقبال التكليفات", "/auth");
  await logActivity("approve_lawyer", `اعتماد محامٍ #${id}`, { lawyerId: id });
  rev();
  back(fd, "/admin?tab=lawyers");
}

export async function togglePrincipal(fd: FormData) {
  const id = intOrNull(fd, "lawyerId");
  const value = str(fd, "value") === "1";
  if (!id) return back(fd, "/admin?tab=lawyers");
  await db.update(lawyers).set({ isPrincipal: value }).where(eq(lawyers.id, id));
  rev();
  back(fd, "/admin?tab=lawyers");
}

export async function updateLawyerStatusText(fd: FormData) {
  const id = intOrNull(fd, "lawyerId");
  if (!id) return back(fd);
  await db
    .update(lawyers)
    .set({ statusText: str(fd, "statusText"), statusUpdatedAt: new Date() })
    .where(eq(lawyers.id, id));
  const [l] = await db.select().from(lawyers).where(eq(lawyers.id, id)).limit(1);
  if (l) await logActivity("lawyer_status", `${l.title} ${l.firstName} حدّث حالته`, { lawyerId: id });
  rev();
  back(fd);
}

// ---------- الجهات الحكومية ----------
export async function createLocation(fd: FormData) {
  const name = str(fd, "name");
  if (!name) return back(fd, "/admin?tab=locations");
  const slug = `${slugBase(str(fd, "nameEn") ?? name)}-${Date.now().toString(36)}`;
  const servicesRaw = str(fd, "services");
  const [created] = await db
    .insert(locations)
    .values({
      slug,
      name: name!,
      nameEn: str(fd, "nameEn"),
      type: (str(fd, "type") ?? "COURT") as "COURT" | "AGENCY",
      subtype: str(fd, "subtype"),
      governorate: str(fd, "governorate"),
      city: str(fd, "city"),
      district: str(fd, "district"),
      address: str(fd, "address"),
      phone: str(fd, "phone"),
      website: str(fd, "website"),
      mapsUrl: str(fd, "mapsUrl"),
      openingHours: str(fd, "openingHours"),
      services: servicesRaw ? servicesRaw.split("،").map((s) => s.trim()).filter(Boolean) : null,
      jurisdiction: str(fd, "jurisdiction"),
      requiresPresence: bool(fd, "requiresPresence"),
      onlineService: bool(fd, "onlineService"),
      source: str(fd, "source"),
      confidence: (str(fd, "confidence") ?? "NEEDS_VERIFICATION") as never,
      distanceKm: Number(str(fd, "distanceKm") ?? 0) || null,
      description: str(fd, "description"),
      status: "DRAFT",
    })
    .returning();
  await logActivity("create_location", `إضافة جهة جديدة: ${name}`, { locationId: created.id });
  rev();
  back(fd, "/admin?tab=locations");
}

export async function updateLocation(fd: FormData) {
  const id = intOrNull(fd, "locationId");
  if (!id) return back(fd, "/admin?tab=locations");
  const servicesRaw = str(fd, "services");
  await db
    .update(locations)
    .set({
      name: str(fd, "name") ?? undefined,
      nameEn: str(fd, "nameEn"),
      type: (str(fd, "type") ?? "COURT") as "COURT" | "AGENCY",
      subtype: str(fd, "subtype"),
      governorate: str(fd, "governorate"),
      city: str(fd, "city"),
      district: str(fd, "district"),
      address: str(fd, "address"),
      phone: str(fd, "phone"),
      website: str(fd, "website"),
      mapsUrl: str(fd, "mapsUrl"),
      openingHours: str(fd, "openingHours"),
      services: servicesRaw ? servicesRaw.split("،").map((s) => s.trim()).filter(Boolean) : null,
      jurisdiction: str(fd, "jurisdiction"),
      requiresPresence: bool(fd, "requiresPresence"),
      onlineService: bool(fd, "onlineService"),
      source: str(fd, "source"),
      confidence: (str(fd, "confidence") ?? undefined) as never,
      distanceKm: Number(str(fd, "distanceKm") ?? 0) || null,
      description: str(fd, "description"),
    })
    .where(eq(locations.id, id));
  await logActivity("update_location", `تعديل بيانات جهة #${id}`, { locationId: id });
  rev();
  back(fd, "/admin?tab=locations");
}

export async function setLocationStatus(fd: FormData) {
  const id = intOrNull(fd, "locationId");
  const status = str(fd, "status");
  if (!id || !status) return back(fd, "/admin?tab=locations");
  await db.update(locations).set({ status: status as never }).where(eq(locations.id, id));
  const [l] = await db.select().from(locations).where(eq(locations.id, id)).limit(1);
  if (l) await logActivity("location_status", `تغيير حالة «${l.name}» إلى ${status}`, { locationId: id });
  rev();
  back(fd, "/admin?tab=locations");
}

export async function verifyLocation(fd: FormData) {
  const id = intOrNull(fd, "locationId");
  if (!id) return back(fd, "/admin?tab=locations");
  await db
    .update(locations)
    .set({ status: "VERIFIED", confidence: "VERIFIED", lastVerifiedAt: new Date() })
    .where(eq(locations.id, id));
  const [l] = await db.select().from(locations).where(eq(locations.id, id)).limit(1);
  if (l) await logActivity("verify_location", `توثيق بيانات «${l.name}»`, { locationId: id });
  rev();
  back(fd, "/admin?tab=locations");
}

// ---------- العملاء ----------
export async function createClient(fd: FormData) {
  const name = str(fd, "name");
  if (!name) return back(fd, "/admin?tab=clients");
  const [created] = await db
    .insert(clients)
    .values({
      name: name!,
      phone: str(fd, "phone"),
      email: str(fd, "email"),
      nationalId: str(fd, "nationalId"),
      address: str(fd, "address"),
      notes: str(fd, "notes"),
      responsibleLawyerId: intOrNull(fd, "responsibleLawyerId"),
    })
    .returning();
  const caseName = str(fd, "caseName");
  if (caseName) {
    await db.insert(cases).values({
      name: caseName,
      caseNumber: str(fd, "caseNumber"),
      clientId: created.id,
    });
    await logActivity("create_case", `فتح قضية «${caseName}» للعميل ${name}`);
  }
  await logActivity("create_client", `إضافة عميل جديد: ${name}`);
  rev();
  back(fd, "/admin?tab=clients");
}

export async function updateClient(fd: FormData) {
  const id = intOrNull(fd, "clientId");
  if (!id) return back(fd, "/admin?tab=clients");
  await db
    .update(clients)
    .set({
      name: str(fd, "name") ?? undefined,
      phone: str(fd, "phone"),
      email: str(fd, "email"),
      nationalId: str(fd, "nationalId"),
      address: str(fd, "address"),
      notes: str(fd, "notes"),
      responsibleLawyerId: intOrNull(fd, "responsibleLawyerId"),
    })
    .where(eq(clients.id, id));
  await logActivity("update_client", `تعديل بيانات عميل #${id}`);
  rev();
  back(fd, "/admin?tab=clients");
}

export async function deleteClient(fd: FormData) {
  const id = intOrNull(fd, "clientId");
  if (!id) return back(fd, "/admin?tab=clients");
  await db.delete(clients).where(eq(clients.id, id));
  await logActivity("delete_client", `حذف عميل #${id}`);
  rev();
  back(fd, "/admin?tab=clients");
}

// ---------- القضايا ----------
export async function createCase(fd: FormData) {
  const name = str(fd, "name");
  if (!name) return back(fd, "/admin?tab=cases");
  const [created] = await db
    .insert(cases)
    .values({
      name: name!,
      caseNumber: str(fd, "caseNumber"),
      description: str(fd, "description"),
      clientId: intOrNull(fd, "clientId"),
      status: "OPEN",
    })
    .returning();
  await db.insert(caseEvents).values({
    caseId: created.id,
    description: "فتح ملف القضية",
    type: "فتح ملف",
    authorName: await actorName(),
  });
  await logActivity("create_case", `إضافة قضية «${name}»`);
  rev();
  back(fd, "/admin?tab=cases");
}

export async function updateCase(fd: FormData) {
  const id = intOrNull(fd, "caseId");
  if (!id) return back(fd, "/admin?tab=cases");
  // حقل اختياري: الحقول غير الممرّرة تُترك كما هي (لا تمَّسح البيانات)
  const opt = (k: string) => (fd.has(k) ? str(fd, k) : undefined);
  await db
    .update(cases)
    .set({
      name: opt("name") ?? undefined,
      caseNumber: opt("caseNumber"),
      description: opt("description"),
      status: (str(fd, "status") ?? undefined) as never,
    })
    .where(eq(cases.id, id));
  const [c] = await db.select().from(cases).where(eq(cases.id, id)).limit(1);
  if (c) await logActivity("update_case", `تعديل قضية «${c.name}»`);
  rev();
  back(fd, "/admin?tab=cases");
}

export async function linkCase(fd: FormData) {
  const clientId = intOrNull(fd, "clientId");
  const caseId = intOrNull(fd, "caseId");
  if (!clientId || !caseId) return back(fd, "/admin?tab=clients");
  await db.update(cases).set({ clientId }).where(eq(cases.id, caseId));
  const [c] = await db.select().from(cases).where(eq(cases.id, caseId)).limit(1);
  if (c) await logActivity("link_case", `ربط قضية «${c.name}» بعميل #${clientId}`);
  rev();
  back(fd, `/admin/clients/${clientId}`);
}

export async function unlinkCase(fd: FormData) {
  const caseId = intOrNull(fd, "caseId");
  const clientId = intOrNull(fd, "clientId");
  if (!caseId) return back(fd, "/admin?tab=clients");
  await db.update(cases).set({ clientId: null }).where(eq(cases.id, caseId));
  rev();
  back(fd, clientId ? `/admin/clients/${clientId}` : "/admin?tab=clients");
}

export async function addCaseEvent(fd: FormData) {
  const caseId = intOrNull(fd, "caseId");
  const description = str(fd, "description");
  if (!caseId || !description) return back(fd, "/case-archive");
  await db.insert(caseEvents).values({
    caseId,
    description: description!,
    type: str(fd, "type") ?? "عام",
    authorName: await actorName(),
  });
  rev();
  back(fd, "/case-archive");
}

// ---------- التذكيرات الشخصية ----------
export async function createReminder(fd: FormData) {
  const title = str(fd, "title");
  const date = str(fd, "date");
  if (!title || !date) return back(fd);
  const store = await cookies();
  const lawyerId = Number(store.get("lawyerId")?.value ?? "") || null;
  await db.insert(reminders).values({
    title: title!,
    note: str(fd, "note"),
    date: date!,
    time: str(fd, "time"),
    lawyerId,
    createdByName: await actorName(),
  });
  await logActivity("create_reminder", `تذكير جديد: «${title}» — ${date}${store.get("lawyerId")?.value ? "" : " (تذكير مكتب)"}`);
  rev();
  back(fd);
}

export async function toggleReminderDone(fd: FormData) {
  const id = intOrNull(fd, "reminderId");
  if (!id) return back(fd);
  const done = str(fd, "done") === "1";
  await db.update(reminders).set({ isDone: done }).where(eq(reminders.id, id));
  rev();
  back(fd);
}

export async function deleteReminder(fd: FormData) {
  const id = intOrNull(fd, "reminderId");
  if (!id) return back(fd);
  await db.delete(reminders).where(eq(reminders.id, id));
  rev();
  back(fd);
}

// ---------- روابط دخول المحامين الشخصية ----------
export async function generateAccessLink(fd: FormData): Promise<{ ok: boolean; url: string | null }> {
  const lawyerId = intOrNull(fd, "lawyerId");
  if (!lawyerId) return { ok: false, url: null };
  const [lawyer] = await db.select().from(lawyers).where(eq(lawyers.id, lawyerId)).limit(1);
  if (!lawyer) return { ok: false, url: null };
  // تدوير: إلغاء الروابط القديمة غير المستهلكة
  await db.delete(accessTokens).where(eq(accessTokens.lawyerId, lawyerId));
  const token = `${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  await db.insert(accessTokens).values({
    token,
    label: str(fd, "label") ?? "رابط دخول شخصي",
    lawyerId,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // صلاحية ٧ أيام
  });
  await logActivity("access_link", `توليد رابط دخول شخصي للمحامي ${lawyer.firstName} ${lawyer.lastName}`, { lawyerId });
  rev();
  return { ok: true, url: `/access/${token}` };
}

// ---------- صورة المحامي (بعد رفعها عبر /api/upload) ----------
export async function updateLawyerPhoto(fd: FormData) {
  const lawyerId = intOrNull(fd, "lawyerId");
  const photoUrl = str(fd, "photoUrl");
  if (!lawyerId || !photoUrl) return;
  await db.update(lawyers).set({ photoUrl }).where(eq(lawyers.id, lawyerId));
  await logActivity("lawyer_photo", `تحديث الصورة الشخصية لمحامٍ #${lawyerId}`, { lawyerId });
  rev();
}

// ---------- الإعدادات / وحدة الصيانة ----------
export async function setSetting(fd: FormData) {
  const key = str(fd, "key");
  const value = str(fd, "value") ?? "";
  if (!key) return back(fd, "/admin");
  await db
    .insert(adminSettings)
    .values({ key, value, label: str(fd, "label") })
    .onConflictDoUpdate({ target: adminSettings.key, set: { value } });
  await logActivity("setting", `تحديث إعداد ${key} = ${value}`);
  rev();
  back(fd, "/admin");
}

export async function toggleDemoLock(fd: FormData) {
  const next = str(fd, "next") ?? "on";
  await db
    .insert(adminSettings)
    .values({ key: "demo_lock", value: next, label: "قفل وضع العرض التجريبي" })
    .onConflictDoUpdate({ target: adminSettings.key, set: { value: next } });
  rev();
  back(fd, "/admin");
}

// ---------- تذكيرات البريد (تشغيل يدوي من الإدارة) ----------
export async function runEmailCronNow() {
  const { runEmailReminders } = await import("./email-cron");
  const result = await runEmailReminders();
  rev();
  return result;
}

// ---------- إعادة توليد البيانات التجريبية ----------
export async function runReseed(): Promise<{ ok: boolean; output?: string; error?: string }> {
  try {
    const { exec } = await import("node:child_process");
    const { promisify } = await import("node:util");
    const execAsync = promisify(exec);
    const { stdout, stderr } = await execAsync("npx tsx src/db/seed.ts", {
      timeout: 120_000,
      env: { ...process.env },
    });
    rev();
    return { ok: true, output: `${stdout}\n${stderr}`.slice(0, 2000) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message.slice(0, 500) : "فشل التشغيل" };
  }
}

// ---------- المستخدمون ----------
export async function createUser(fd: FormData) {
  const name = str(fd, "name");
  const email = str(fd, "email");
  const role = (str(fd, "role") ?? "VIEWER") as Role;
  if (!name || !email) return back(fd, "/admin?tab=users");
  await db.insert(users).values({ name: name!, email: email!, role, accessCode: str(fd, "accessCode") });
  await logActivity("create_user", `إضافة مستخدم ${name} بدور ${role}`);
  rev();
  back(fd, "/admin?tab=users");
}

export async function updateUserRole(fd: FormData) {
  const id = intOrNull(fd, "userId");
  const role = str(fd, "role") as Role | null;
  if (!id || !role) return back(fd, "/admin?tab=users");
  await db.update(users).set({ role }).where(eq(users.id, id));
  await logActivity("update_user_role", `تغيير دور مستخدم #${id} إلى ${role}`);
  rev();
  back(fd, "/admin?tab=users");
}

export async function deleteUser(fd: FormData) {
  const id = intOrNull(fd, "userId");
  if (!id) return back(fd, "/admin?tab=users");
  await db.delete(users).where(eq(users.id, id));
  rev();
  back(fd, "/admin?tab=users");
}

// ---------- رموز وصول ----------
export async function createAccessToken(fd: FormData) {
  const lawyerId = intOrNull(fd, "lawyerId");
  if (!lawyerId) return back(fd, "/admin?tab=lawyers");
  const token = `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
  await db.insert(accessTokens).values({
    token,
    label: str(fd, "label") ?? "رمز وصول",
    lawyerId,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
  });
  rev();
  back(fd, "/admin?tab=lawyers");
}
