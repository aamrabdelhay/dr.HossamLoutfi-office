// بطاقة مهمة موحّدة — تُستخدم في الفيد والجلسات والمهام والملفات (Server)
import Link from "next/link";
import { CalendarDays, Clock3, FileText, Landmark, MapPin, Play, CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import { updateTaskStatus } from "@/lib/actions";
import type { TaskView } from "@/lib/queries";
import { Avatar, PriorityBadge, StatusBadge, TypeBadge, Badge } from "@/components/ui";
import { CommentsBlock, DeleteTaskButton } from "@/components/task-islands";
import { arDate, arTime, bucketLabel, bucketOf, cn, timeAgoAr, truncate } from "@/lib/utils";

function StatusForm({ taskId, value, from, label, icon: Icon, className }: {
  taskId: number; value: string; from: string; label: string; icon: React.ElementType; className: string;
}) {
  return (
    <form action={updateTaskStatus}>
      <input type="hidden" name="taskId" value={taskId} />
      <input type="hidden" name="status" value={value} />
      <input type="hidden" name="from" value={from} />
      <button className={className} title={label}>
        <Icon className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{label}</span>
      </button>
    </form>
  );
}

export function TaskCard({ task, from, canManage = true, showComments = true }: {
  task: TaskView; from: string; canManage?: boolean; showComments?: boolean;
}) {
  const isPost = task.type === "POST";
  const bucket = task.date ? bucketOf(task.date) : null;

  if (isPost) {
    return (
      <article className="card border-gold-200 bg-gradient-to-bl from-card to-gold-50/50 p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-navy-900 text-gold-300"><FileText className="h-4 w-4" /></span>
            <div>
              <p className="text-xs font-bold text-navy-900">{task.createdByName ?? "الإدارة"}</p>
              <p className="text-[10px] text-ink/40">{timeAgoAr(task.createdAt)}</p>
            </div>
          </div>
          <TypeBadge type={task.type} />
        </div>
        <p className="text-sm leading-7 text-ink/85">{task.title}</p>
        {showComments && (
          <div className="mt-2">
            <CommentsBlock
              taskId={task.id}
              comments={task.comments.map((c) => ({ id: c.id, authorName: c.authorName, body: c.body, ago: timeAgoAr(c.createdAt), edited: !!c.editedAt }))}
            />
          </div>
        )}
      </article>
    );
  }

  return (
    <article className={cn("card p-4", task.priority === "CRITICAL" && task.status !== "COMPLETED" && task.status !== "CANCELLED" && "ring-1 ring-red-200")}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <TypeBadge type={task.type} />
          <StatusBadge status={task.status} />
          <PriorityBadge priority={task.priority} />
          {bucket && bucket !== "later" && bucket !== "none" && (
            <Badge tone={bucket === "overdue" ? "rose" : bucket === "today" ? "red" : bucket === "tomorrow" ? "amber" : "gray"}>
              {bucketLabel(bucket)}
            </Badge>
          )}
        </div>
        <p className="text-[10px] text-ink/40">
          {task.createdByName ? `أنشأها ${task.createdByName} · ` : ""}{timeAgoAr(task.createdAt)}
        </p>
      </div>

      <Link href={`/tasks/${task.id}`} className="mt-2 block text-[15px] font-bold leading-7 text-navy-950 hover:text-gold-700">
        {task.title}
      </Link>
      {task.description && <p className="mt-1 text-[13px] leading-6 text-ink/65">{truncate(task.description, 160)}</p>}

      <div className="mt-3 grid gap-x-6 gap-y-1.5 text-[12px] text-ink/60 sm:grid-cols-2">
        {(task.date || task.time) && (
          <p className="flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 text-gold-600" />
            {task.date ? arDate(task.date) : "بدون تاريخ"}
            {task.time && <span className="flex items-center gap-1 text-gold-700 font-semibold"><Clock3 className="h-3 w-3" />{arTime(task.time)}</span>}
          </p>
        )}
        {task.location && (
          <p className="flex items-center gap-1.5">
            {task.location.type === "COURT" ? <Landmark className="h-3.5 w-3.5 text-gold-600" /> : <MapPin className="h-3.5 w-3.5 text-gold-600" />}
            <Link href={`/locations/${task.location.slug}`} className="hover:underline">{task.location.name}</Link>
          </p>
        )}
        {task.caseRef && (
          <p className="flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-gold-600" />
            {task.caseRef.name}
            {task.caseRef.caseNumber && <span className="text-ink/35">({task.caseRef.caseNumber})</span>}
          </p>
        )}
      </div>

      {task.lawyersList.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {task.lawyersList.map((l) => (
            <Link key={l.id} href={`/lawyers/${l.slug}`} className="flex items-center gap-1.5 rounded-full border border-line bg-white py-1 pl-3 pr-1 transition hover:border-gold-400">
              <Avatar first={l.firstName} last={l.lastName} size="sm" />
              <span className="text-[11px] font-bold text-ink/70">{l.title} {l.firstName} {l.lastName}</span>
            </Link>
          ))}
        </div>
      )}

      {task.notes && (
        <p className="mt-2.5 rounded-lg bg-amber-50 px-3 py-1.5 text-[11px] leading-5 text-amber-800">
          ملاحظة: {task.notes}
        </p>
      )}

      {canManage && task.status !== "CANCELLED" && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-line/70 pt-2.5">
          {task.status === "PENDING" && (
            <StatusForm taskId={task.id} value="IN_PROGRESS" from={from} label="بدء التنفيذ" icon={Play} className="btn-ghost px-2.5 py-1.5 text-[11px]" />
          )}
          {(task.status === "PENDING" || task.status === "IN_PROGRESS") && (
            <>
              <StatusForm taskId={task.id} value="COMPLETED" from={from} label="تم التنفيذ" icon={CheckCircle2} className="btn px-2.5 py-1.5 text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100" />
              <StatusForm taskId={task.id} value="CANCELLED" from={from} label="إلغاء" icon={XCircle} className="btn-ghost px-2.5 py-1.5 text-[11px]" />
            </>
          )}
          {task.status === "COMPLETED" && (
            <StatusForm taskId={task.id} value="PENDING" from={from} label="إعادة فتح" icon={RotateCcw} className="btn-ghost px-2.5 py-1.5 text-[11px]" />
          )}
          <span className="flex-1" />
          <DeleteTaskButton taskId={task.id} />
        </div>
      )}

      {showComments && (
        <div className="mt-2">
          <CommentsBlock
            taskId={task.id}
            comments={task.comments.map((c) => ({ id: c.id, authorName: c.authorName, body: c.body, ago: timeAgoAr(c.createdAt), edited: !!c.editedAt }))}
          />
        </div>
      )}
    </article>
  );
}
