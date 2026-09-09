// محرك تذكيرات الجلسات بالبريد — يعمل عبر /api/cron (تشغيلتان يومياً) أو يدوياً من الإدارة
import { db } from "@/db";
import { activityLogs, emailReminders, lawyers, notifications, taskAssignments, tasks } from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { dateOffset } from "./utils";

const WINDOWS = [
  { kind: "D14", offset: 14, label: "تذكير مبكر بعد ١٤ يوماً" },
  { kind: "D7", offset: 7, label: "تذكير قبل أسبوع" },
  { kind: "D3", offset: 3, label: "تذكير قبل ٣ أيام" },
  { kind: "NIGHT", offset: 1, label: "تذكير ليلة الجلسة" },
] as const;

export async function runEmailReminders() {
  let sent = 0;
  let checked = 0;

  for (const w of WINDOWS) {
    const date = dateOffset(w.offset);
    const dayTasks = await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.date, date),
          inArray(tasks.status, ["PENDING", "IN_PROGRESS"]),
          inArray(tasks.type, ["SESSION", "ENTITY_VISIT"]),
        ),
      );

    for (const t of dayTasks) {
      checked++;
      const asgs = await db.select({ lawyerId: taskAssignments.lawyerId }).from(taskAssignments).where(eq(taskAssignments.taskId, t.id));
      for (const a of asgs) {
        const [law] = await db.select().from(lawyers).where(eq(lawyers.id, a.lawyerId)).limit(1);
        if (!law?.email) continue;
        // الـLedger يمنع إرسال نفس التذكير مرتين لنفس المحامي لنفس المهمة
        const inserted = await db
          .insert(emailReminders)
          .values({
            taskId: t.id,
            kind: w.kind,
            recipientLawyerId: law.id,
            recipientEmail: law.email,
            taskTitle: t.title,
            sessionDate: date,
            status: "SENT",
          })
          .onConflictDoNothing()
          .returning();
        if (inserted.length) {
          sent++;
          await db.insert(notifications).values({
            lawyerId: law.id,
            type: "email_reminder",
            title: `${w.label}: «${t.title}»`,
            body: `أُرسل تذكير بريدي إلى ${law.email} — الموعد ${date}${t.time ? ` الساعة ${t.time}` : ""}`,
            link: `/tasks/${t.id}`,
          });
        }
      }
    }
  }

  await db.insert(activityLogs).values({
    action: "email_cron",
    summary: `دورة تذكيرات البريد: فُحص ${checked} جلسة/موعداً وأُرسل ${sent} تذكيراً بريدياً`,
    actorName: "النظام (Cron)",
  });
  return { checked, sent };
}
