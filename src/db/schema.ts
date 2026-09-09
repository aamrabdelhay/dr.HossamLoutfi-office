// ============================================================
// مكتب د. حسام لطفي للمحاماة — مخطط قاعدة البيانات
// نظام تشغيل داخلي: جلسات، تكليفات، محامون، جهات، عملاء، قضايا
// ============================================================
import {
  pgTable,
  pgEnum,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  real,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

// ---------- Enums ----------
export const roleEnum = pgEnum("role", [
  "SUPER_ADMIN",
  "ADMIN",
  "OFFICE_MANAGER",
  "LAWYER",
  "SECRETARY",
  "VIEWER",
]);

export const taskStatusEnum = pgEnum("task_status", [
  "PENDING",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
]);

export const taskTypeEnum = pgEnum("task_type", [
  "SESSION", // جلسة محكمة
  "ENTITY_VISIT", // حضور في جهة حكومية
  "ASSIGNMENT", // تكليف عام
  "ACTIVITY", // نشاط تشغيلي
  "POST", // منشور في فيد المكتب
]);

export const priorityEnum = pgEnum("priority", ["NORMAL", "IMPORTANT", "CRITICAL"]);

export const locationStatusEnum = pgEnum("location_status", [
  "DRAFT",
  "PENDING",
  "VERIFIED",
  "NEEDS_REVIEW",
  "ARCHIVED",
]);

export const confidenceEnum = pgEnum("confidence", [
  "VERIFIED",
  "HIGH",
  "MEDIUM",
  "LOW",
  "NEEDS_VERIFICATION",
]);

export const locationTypeEnum = pgEnum("location_type", ["COURT", "AGENCY"]);

export const caseStatusEnum = pgEnum("case_status", ["OPEN", "CLOSED", "ARCHIVED"]);

// ---------- المستخدمون والأدوار ----------
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: roleEnum("role").notNull().default("VIEWER"),
  accessCode: text("access_code"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

// ---------- المحامون ----------
export const lawyers = pgTable("lawyers", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  title: text("title").notNull().default("محامي"), // دكتور / محامي
  phone: text("phone"),
  email: text("email"),
  specialty: text("specialty"),
  bio: text("bio"),
  jobTitle: text("job_title"),
  photoUrl: text("photo_url"),
  statusText: text("status_text"), // تحديث حالة المحامي
  statusUpdatedAt: timestamp("status_updated_at", { mode: "date" }),
  displayOrder: integer("display_order").notNull().default(0),
  isPrincipal: boolean("is_principal").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  isApproved: boolean("is_approved").notNull().default(false),
  gmailIdentity: text("gmail_identity"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

// ---------- تصنيفات وخدمات دليل المحامي ----------
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  nameEn: text("name_en"),
  displayOrder: integer("display_order").notNull().default(0),
});

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  displayOrder: integer("display_order").notNull().default(0),
});

// ---------- الجهات الحكومية والمحاكم ----------
export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  nameEn: text("name_en"),
  type: locationTypeEnum("type").notNull().default("COURT"),
  subtype: text("subtype"), // محكمة ابتدائية / استئناف / مصلحة ...
  categoryId: integer("category_id").references(() => categories.id, { onDelete: "set null" }),
  governorate: text("governorate"),
  city: text("city"),
  district: text("district"),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  website: text("website"),
  mapsUrl: text("maps_url"),
  lat: real("lat"),
  lng: real("lng"),
  openingHours: text("opening_hours"),
  services: text("services").array(),
  jurisdiction: text("jurisdiction"), // الاختصاص
  requiresPresence: boolean("requires_presence").notNull().default(true),
  onlineService: boolean("online_service").notNull().default(false),
  source: text("source"),
  lastVerifiedAt: timestamp("last_verified_at", { mode: "date" }),
  confidence: confidenceEnum("confidence").notNull().default("NEEDS_VERIFICATION"),
  distanceKm: real("distance_km"), // المسافة من الدقي
  distanceBucket: text("distance_bucket"), // 0-5 / 5-10 / 10-20 / 20-40 / 40-75 / 75-150 / 150-300 / 300+
  description: text("description"),
  searchKeywords: text("search_keywords").array(),
  status: locationStatusEnum("status").notNull().default("DRAFT"),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

// ---------- العلاقات بین الجهات ----------
export const locationRelations = pgTable("location_relations", {
  id: serial("id").primaryKey(),
  fromId: integer("from_id").notNull().references(() => locations.id, { onDelete: "cascade" }),
  toId: integer("to_id").notNull().references(() => locations.id, { onDelete: "cascade" }),
  // LOCATED_IN / PART_OF / SUBORDINATE_TO / JURISDICTION_OF / SERVES / REFERS_TO / ASSOCIATED_WITH / SAME_BUILDING / MOVED_FROM / MOVED_TO
  type: text("type").notNull().default("ASSOCIATED_WITH"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

// ---------- العملاء (سري — الإدارة فقط) ----------
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  nationalId: text("national_id"),
  address: text("address"),
  notes: text("notes"),
  responsibleLawyerId: integer("responsible_lawyer_id").references(() => lawyers.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

// ---------- القضايا ----------
export const cases = pgTable("cases", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  caseNumber: text("case_number"),
  description: text("description"),
  status: caseStatusEnum("status").notNull().default("OPEN"),
  clientId: integer("client_id").references(() => clients.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

// ---------- تاريخ أحداث القضية (Timeline دائم) ----------
export const caseEvents = pgTable("case_events", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id")
    .notNull()
    .references(() => cases.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  type: text("type").notNull().default("عام"), // فتح ملف / جلسة / حكم / إجراء
  authorName: text("author_name"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

// ---------- المهام: جلسة / تكليف / حضور جهة / نشاط / منشور ----------
// Task هو مركز التشغيل الأساسي في النظام
export const tasks = pgTable(
  "tasks",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(), // اسم التكليف إجباري
    type: taskTypeEnum("type").notNull().default("ASSIGNMENT"),
    status: taskStatusEnum("status").notNull().default("PENDING"),
    priority: priorityEnum("priority").notNull().default("NORMAL"),
    date: text("date"), // YYYY-MM-DD — اختياري؛ بدونه تكليف عام خارج التقويم
    time: text("time"), // HH:MM
    locationId: integer("location_id").references(() => locations.id, {
      onDelete: "set null",
    }),
    caseId: integer("case_id").references(() => cases.id, { onDelete: "set null" }),
    description: text("description"),
    notes: text("notes"),
    createdByName: text("created_by_name"),
    createdByLawyerId: integer("created_by_lawyer_id").references(() => lawyers.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [index("tasks_date_idx").on(t.date), index("tasks_status_idx").on(t.status)],
);

// ---------- تكليف المحامين (جلسة واحدة ← أكثر من محام) ----------
export const taskAssignments = pgTable(
  "task_assignments",
  {
    id: serial("id").primaryKey(),
    taskId: integer("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    lawyerId: integer("lawyer_id")
      .notNull()
      .references(() => lawyers.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("task_lawyer_unique").on(t.taskId, t.lawyerId)],
);

// ---------- التعليقات ----------
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id")
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" }),
  lawyerId: integer("lawyer_id").references(() => lawyers.id, { onDelete: "set null" }),
  authorName: text("author_name").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  editedAt: timestamp("edited_at", { mode: "date" }),
});

// ---------- الإشعارات ----------
export const notifications = pgTable(
  "notifications",
  {
    id: serial("id").primaryKey(),
    type: text("type").notNull().default("general"),
    title: text("title").notNull(),
    body: text("body"),
    link: text("link"),
    isRead: boolean("is_read").notNull().default(false),
    lawyerId: integer("lawyer_id").references(() => lawyers.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [index("notifications_read_idx").on(t.isRead)],
);

// ---------- سجل النشاط (Audit) ----------
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  action: text("action").notNull(), // create_task / update_status / comment / verify_location ...
  summary: text("summary").notNull(),
  taskId: integer("task_id").references(() => tasks.id, { onDelete: "set null" }),
  lawyerId: integer("lawyer_id").references(() => lawyers.id, { onDelete: "set null" }),
  locationId: integer("location_id").references(() => locations.id, { onDelete: "set null" }),
  actorName: text("actor_name"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

// ---------- رموز وصول المحامين ----------
export const accessTokens = pgTable("access_tokens", {
  id: serial("id").primaryKey(),
  token: text("token").notNull().unique(),
  label: text("label"),
  lawyerId: integer("lawyer_id").references(() => lawyers.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { mode: "date" }),
  consumedAt: timestamp("consumed_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

// ---------- التذكيرات الشخصية (مستقلة عن الجلسات) ----------
export const reminders = pgTable("reminders", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  note: text("note"),
  date: text("date").notNull(), // YYYY-MM-DD
  time: text("time"), // HH:MM
  lawyerId: integer("lawyer_id").references(() => lawyers.id, { onDelete: "cascade" }), // null = الإدارة/المكتب
  createdByName: text("created_by_name"),
  isDone: boolean("is_done").notNull().default(false),
  notifiedAt: timestamp("notified_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

// ---------- سجل تذكيرات البريد التلقائية (Ledger — تمنع التكرار) ----------
export const emailReminders = pgTable(
  "email_reminders",
  {
    id: serial("id").primaryKey(),
    taskId: integer("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(), // D14 / D7 / D3 / NIGHT
    recipientLawyerId: integer("recipient_lawyer_id").references(() => lawyers.id, { onDelete: "cascade" }),
    recipientEmail: text("recipient_email"),
    taskTitle: text("task_title"),
    sessionDate: text("session_date"),
    status: text("status").notNull().default("SENT"), // SENT (محاكاة)
    sentAt: timestamp("sent_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("email_reminder_once").on(t.taskId, t.kind, t.recipientLawyerId)],
);

// ---------- إعدادات المكتب ----------
export const adminSettings = pgTable("admin_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  label: text("label"),
});

// ---------- الأنواع ----------
export type Lawyer = typeof lawyers.$inferSelect;
export type Location = typeof locations.$inferSelect;
export type Category_ = typeof categories.$inferSelect;
export type Service_ = typeof services.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type Client = typeof clients.$inferSelect;
export type Case = typeof cases.$inferSelect;
export type CaseEvent = typeof caseEvents.$inferSelect;
export type Comment_ = typeof comments.$inferSelect;
export type Notification_ = typeof notifications.$inferSelect;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type User = typeof users.$inferSelect;
export type TaskAssignment = typeof taskAssignments.$inferSelect;
export type Reminder = typeof reminders.$inferSelect;
export type EmailReminder = typeof emailReminders.$inferSelect;
export type AccessToken = typeof accessTokens.$inferSelect;
