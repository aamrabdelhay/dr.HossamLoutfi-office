// أدوات مشتركة — تواريخ عربية وتصنيف الجلسات حسب القرب
export * from "./labels";

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

// ---------- تواريخ (محلية، بدون مشاكل المناطق الزمنية) ----------
const pad = (n: number) => String(n).padStart(2, "0");

export function fmtDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayStr(): string {
  return fmtDate(new Date());
}

/** تاريخ بعد n يوم من اليوم بصيغة YYYY-MM-DD */
export function dateOffset(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return fmtDate(d);
}

export function parseLocal(ds: string): Date {
  const [y, m, d] = ds.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/** الفرق بالأيام من اليوم (0 = اليوم، 1 = غداً، سالب = ماضٍ) */
export function diffFromToday(ds: string): number {
  const t = parseLocal(todayStr());
  const d = parseLocal(ds);
  return Math.round((d.getTime() - t.getTime()) / 86400000);
}

// ---------- تنسيق عربي ----------
const arNumFmt = new Intl.NumberFormat("ar-EG", { useGrouping: false });
export const arNum = (n: number | string) => arNumFmt.format(Number(n));

const WEEKDAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

export function arWeekday(ds: string): string {
  return WEEKDAYS[parseLocal(ds).getDay()];
}

/** "السبت، ١٤ يونيو ٢٠٢٥" */
export function arDate(ds: string, withYear = true): string {
  const d = parseLocal(ds);
  const base = `${WEEKDAYS[d.getDay()]}، ${arNum(d.getDate())} ${MONTHS[d.getMonth()]}`;
  return withYear ? `${base} ${arNum(d.getFullYear())}` : base;
}

/** "9:30 ص" من "09:30" */
export function arTime(ts: string | null | undefined): string {
  if (!ts) return "";
  const [hS, mS] = ts.split(":");
  let h = Number(hS);
  const period = h < 12 ? "ص" : "م";
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${arNum(h)}:${mS ?? "00"} ${period}`;
}

// ---------- تصنيف الجلسات حسب القرب ----------
export type BucketKey = "none" | "overdue" | "today" | "tomorrow" | "d3" | "d14" | "d30" | "later";

export function bucketOf(date: string | null): BucketKey {
  if (!date) return "none";
  const diff = diffFromToday(date);
  if (diff < 0) return "overdue";
  if (diff === 0) return "today";
  if (diff === 1) return "tomorrow";
  if (diff <= 3) return "d3";
  if (diff <= 14) return "d14";
  if (diff <= 30) return "d30";
  return "later";
}

export const BUCKETS: { key: BucketKey; label: string; hint: string }[] = [
  { key: "today", label: "اليوم", hint: "جلسات اليوم" },
  { key: "tomorrow", label: "غداً", hint: "جلسات الغد" },
  { key: "d3", label: "خلال ٣ أيام", hint: "بعد يومين حتى ٣ أيام" },
  { key: "d14", label: "خلال ١٤ يوم", hint: "من ٤ إلى ١٤ يوماً" },
  { key: "d30", label: "خلال ٣٠ يوم", hint: "من ١٥ إلى ٣٠ يوماً" },
  { key: "overdue", label: "متأخرة", hint: "بانتظار الإنجاز" },
  { key: "none", label: "بدون تاريخ", hint: "تكليفات عامة" },
];

export function bucketLabel(key: BucketKey): string {
  return BUCKETS.find((b) => b.key === key)?.label ?? key;
}

// ---------- متفرقات ----------
export function initialsOf(first: string, last: string): string {
  return `${first.trim()[0] ?? ""}${last.trim()[0] ?? ""}`;
}

export function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

export function timeAgoAr(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const diff = Math.max(0, Date.now() - date.getTime());
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "الآن";
  if (mins < 60) return `منذ ${arNum(mins)} دقيقة`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `منذ ${arNum(hours)} ساعة`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `منذ ${arNum(days)} يوم`;
  return arDate(fmtDate(date));
}

export function slugBase(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9ء-ي]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

// ---------- المسافات من مكتب الدقي ----------
export const OFFICE = { lat: 30.038, lng: 31.2, label: "الدقي – الجيزة" } as const;

export type DistanceBucket = "0-5" | "5-10" | "10-20" | "20-40" | "40-75" | "75-150" | "150-300" | "300+";

export function distanceBucketOf(km: number | null | undefined): DistanceBucket | null {
  if (km == null) return null;
  if (km < 5) return "0-5";
  if (km < 10) return "5-10";
  if (km < 20) return "10-20";
  if (km < 40) return "20-40";
  if (km < 75) return "40-75";
  if (km < 150) return "75-150";
  if (km < 300) return "150-300";
  return "300+";
}

export const DISTANCE_BUCKET_LABELS: Record<DistanceBucket, string> = {
  "0-5": "حتى ٥ كم",
  "5-10": "٥–١٠ كم",
  "10-20": "١٠–٢٠ كم",
  "20-40": "٢٠–٤٠ كم",
  "40-75": "٤٠–٧٥ كم",
  "75-150": "٧٥–١٥٠ كم",
  "150-300": "١٥٠–٣٠٠ كم",
  "300+": "أكثر من ٣٠٠ كم",
};
