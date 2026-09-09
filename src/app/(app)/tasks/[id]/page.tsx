// تفاصيل مهمة — عرض كامل مع التعليقات
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { getTaskById } from "@/lib/queries";
import { getPerms } from "@/lib/permissions";
import { TaskCard } from "@/components/task-card";

export const dynamic = "force-dynamic";

export default async function TaskDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const taskId = Number(id);
  if (!Number.isFinite(taskId)) notFound();
  const [task, { perms }] = await Promise.all([getTaskById(taskId), getPerms()]);
  if (!task) notFound();

  return (
    <div>
      <Link href="/sessions" className="mb-4 inline-flex items-center gap-1.5 text-xs font-bold text-gold-700 hover:underline">
        <ArrowRight className="h-3.5 w-3.5" />
        عودة إلى الجلسات
      </Link>
      <div className="mx-auto max-w-3xl">
        <TaskCard task={task} from={`/tasks/${task.id}`} canManage={perms.manageTasks} />
      </div>
    </div>
  );
}
