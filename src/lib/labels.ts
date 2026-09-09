// تسميات عربية موحدة لكل الحالات والأنواع
export type TaskStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type TaskType = "SESSION" | "ENTITY_VISIT" | "ASSIGNMENT" | "ACTIVITY" | "POST";
export type Priority = "NORMAL" | "IMPORTANT" | "CRITICAL";
export type LocationStatus = "DRAFT" | "PENDING" | "VERIFIED" | "NEEDS_REVIEW" | "ARCHIVED";
export type Confidence = "VERIFIED" | "HIGH" | "MEDIUM" | "LOW" | "NEEDS_VERIFICATION";
export type CaseStatus = "OPEN" | "CLOSED" | "ARCHIVED";
export type TraineeStatus = "PENDING" | "REVIEWING" | "ACCEPTED" | "REJECTED";

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  PENDING: "قيد التنفيذ",
  IN_PROGRESS: "جاري التنفيذ",
  COMPLETED: "تم التنفيذ",
  CANCELLED: "ملغي",
};

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  SESSION: "جلسة محكمة",
  ENTITY_VISIT: "حضور جهة",
  ASSIGNMENT: "تكليف",
  ACTIVITY: "نشاط تشغيلي",
  POST: "منشور",
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  NORMAL: "عادية",
  IMPORTANT: "مهمة",
  CRITICAL: "حرجة",
};

export const LOCATION_STATUS_LABELS: Record<LocationStatus, string> = {
  DRAFT: "مسودة",
  PENDING: "بانتظار التحقق",
  VERIFIED: "موثّقة",
  NEEDS_REVIEW: "تحتاج مراجعة",
  ARCHIVED: "مؤرشفة",
};

export const CONFIDENCE_LABELS: Record<Confidence, string> = {
  VERIFIED: "موثّق",
  HIGH: "ثقة عالية",
  MEDIUM: "ثقة متوسطة",
  LOW: "ثقة منخفضة",
  NEEDS_VERIFICATION: "يحتاج تحقق",
};

export const CASE_STATUS_LABELS: Record<CaseStatus, string> = {
  OPEN: "مفتوحة",
  CLOSED: "مغلقة",
  ARCHIVED: "مؤرشفة",
};

export const TRAINEE_STATUS_LABELS: Record<TraineeStatus, string> = {
  PENDING: "جديد",
  REVIEWING: "قيد المراجعة",
  ACCEPTED: "مقبول",
  REJECTED: "مرفوض",
};
