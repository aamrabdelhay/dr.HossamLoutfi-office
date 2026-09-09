"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { MessageSquare, Pencil, Send, Trash2, X, Check } from "lucide-react";
import { addComment, deleteComment, deleteTask, updateComment } from "@/lib/actions";
import { arNum, cn, timeAgoAr } from "@/lib/utils";

export type CommentItem = {
  id: number;
  authorName: string;
  body: string;
  ago: string;
  edited: boolean;
};

// ---------- قسم التعليقات (توسيع + إضافة + تعديل + حذف) ----------
export function CommentsBlock({ taskId, comments }: { taskId: number; comments: CommentItem[] }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const pathname = usePathname();
  const router = useRouter();
  const [editingId, setEditingId] = useState<number | null>(null);

  const submit = (form: HTMLFormElement) => {
    const fd = new FormData(form);
    fd.set("from", pathname + (typeof window !== "undefined" ? window.location.search : ""));
    const action = editingId ? updateComment : addComment;
    startTransition(async () => {
      await action(fd);
      form.reset();
      setEditingId(null);
      router.refresh();
    });
  };

  return (
    <div className="border-t border-line/70 pt-2">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-[11px] font-bold text-ink/45 transition hover:text-gold-700"
      >
        <MessageSquare className="h-3.5 w-3.5" />
        {comments.length > 0 ? `${arNum(comments.length)} تعليق` : "تعليق"}
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="rounded-xl bg-paper/80 px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-bold text-navy-900">{c.authorName}</p>
                <div className="flex items-center gap-1 text-[10px] text-ink/35">
                  <span>{c.ago}{c.edited ? " · معدّل" : ""}</span>
                  <button
                    className="text-ink/30 hover:text-gold-700"
                    title="تعديل"
                    onClick={() => setEditingId(editingId === c.id ? null : c.id)}
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button
                    className="text-ink/30 hover:text-red-600"
                    title="حذف"
                    onClick={() => {
                      const fd = new FormData();
                      fd.set("commentId", String(c.id));
                      fd.set("from", pathname + (typeof window !== "undefined" ? window.location.search : ""));
                      startTransition(async () => {
                        await deleteComment(fd);
                        router.refresh();
                      });
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
              {editingId === c.id ? (
                <form
                  className="mt-1.5 flex gap-1.5"
                  onSubmit={(e) => {
                    e.preventDefault();
                    submit(e.currentTarget);
                  }}
                >
                  <input type="hidden" name="commentId" value={c.id} />
                  <input name="body" defaultValue={c.body} className="input py-1 text-xs" />
                  <button className="btn-gold px-2 py-1" disabled={pending}><Check className="h-3.5 w-3.5" /></button>
                  <button type="button" className="btn-ghost px-2 py-1" onClick={() => setEditingId(null)}><X className="h-3.5 w-3.5" /></button>
                </form>
              ) : (
                <p className="mt-1 text-[13px] leading-6 text-ink/80">{c.body}</p>
              )}
            </div>
          ))}

          <form
            className="flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              submit(e.currentTarget);
            }}
          >
            <input type="hidden" name="taskId" value={taskId} />
            <input name="body" required placeholder="اكتب تعليقاً…" className="input py-1.5 text-xs" />
            <button className={cn("btn-gold px-2.5 py-1.5")} disabled={pending} aria-label="إرسال">
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

// ---------- زر حذف مهمة مع تأكيد ----------
export function DeleteTaskButton({ taskId }: { taskId: number }) {
  const [pending, startTransition] = useTransition();
  const pathname = usePathname();
  const router = useRouter();
  return (
    <button
      className="btn-danger px-2.5 py-1.5 text-[11px]"
      disabled={pending}
      title="حذف المهمة"
      onClick={() => {
        if (!confirm("حذف هذه المهمة نهائياً؟")) return;
        const fd = new FormData();
        fd.set("taskId", String(taskId));
        fd.set("from", pathname + (typeof window !== "undefined" ? window.location.search : ""));
        startTransition(async () => {
          await deleteTask(fd);
          router.refresh();
        });
      }}
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );
}
