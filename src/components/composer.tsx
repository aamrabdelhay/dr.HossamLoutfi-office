"use client";

import { useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Megaphone, Send } from "lucide-react";
import { quickPost } from "@/lib/actions";
import { TaskCreator, type CreatorCase, type CreatorLawyer, type CreatorLocation } from "./task-creator";

// صندوق النشر في فيد المكتب — منشور سريع أو فتح منشئ التكليفات
export function Composer({ lawyers, locations, cases }: {
  lawyers: CreatorLawyer[];
  locations: CreatorLocation[];
  cases: CreatorCase[];
}) {
  const [pending, startTransition] = useTransition();
  const pathname = usePathname();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 text-xs font-bold text-ink/50">
        <Megaphone className="h-4 w-4 text-gold-600" />
        نشر تحديث في فيد المكتب
      </div>
      <form
        ref={formRef}
        className="mt-2.5 flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          fd.set("from", pathname + (typeof window !== "undefined" ? window.location.search : ""));
          startTransition(async () => {
            await quickPost(fd);
            formRef.current?.reset();
            router.refresh();
          });
        }}
      >
        <input name="title" required className="input" placeholder="ما الجديد؟ تأجيل جلسة، تنبيه تشغيلي، خبر للفريق…" />
        <button className="btn-gold shrink-0 px-3" disabled={pending} aria-label="نشر">
          <Send className="h-4 w-4" />
        </button>
      </form>
      <div className="mt-2.5 flex items-center gap-2">
        <TaskCreator lawyers={lawyers} locations={locations} cases={cases} defaultType="SESSION" label="+ جلسة" className="btn-ghost px-3 py-1.5 text-xs" />
        <TaskCreator lawyers={lawyers} locations={locations} cases={cases} defaultType="ASSIGNMENT" label="+ تكليف" className="btn-ghost px-3 py-1.5 text-xs" />
      </div>
    </div>
  );
}
