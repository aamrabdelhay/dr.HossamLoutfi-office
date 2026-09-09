"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import { markNotificationsRead } from "@/lib/actions";
import { arNum, cn } from "@/lib/utils";

export type BellItem = {
  id: number;
  title: string;
  body: string | null;
  link: string | null;
  isRead: boolean;
  ago: string;
};

export function NotifBell({ unread, items, variant = "dark" }: { unread: number; items: BellItem[]; variant?: "dark" | "light" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "relative grid h-9 w-9 place-items-center rounded-full border transition",
          variant === "light"
            ? "border-line bg-white text-ink/60 hover:border-gold-400 hover:text-gold-600"
            : "border-white/15 bg-white/5 text-white/80 hover:bg-white/10",
        )}
        aria-label="الإشعارات"
      >
        <Bell className="h-[18px] w-[18px]" />
        {unread > 0 && (
          <span className="absolute -left-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-danger-600 px-1 text-[9.5px] font-bold text-white ring-2 ring-white">
            {arNum(unread)}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute left-0 top-11 z-50 w-[21rem] overflow-hidden rounded-xl border border-line bg-card shadow-[0_16px_40px_-12px_rgba(16,29,49,0.3)]">
          <div className="flex items-center justify-between border-b border-line bg-paper/70 px-4 py-2.5">
            <p className="text-[13px] font-bold text-navy-900">
              الإشعارات {unread > 0 && <span className="font-semibold text-ink/40">({arNum(unread)} غير مقروء)</span>}
            </p>
            {unread > 0 && (
              <button
                className="flex items-center gap-1 text-[11px] font-bold text-gold-700 hover:underline"
                onClick={async () => {
                  await markNotificationsRead();
                  router.refresh();
                }}
              >
                <CheckCheck className="h-3.5 w-3.5" /> قراءة الكل
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 && <p className="px-4 py-8 text-center text-xs text-ink/40">لا إشعارات بعد</p>}
            {items.map((n) => {
              const inner = (
                <div className={cn("border-b border-line/60 px-4 py-3 transition hover:bg-paper/70", !n.isRead && "bg-gold-50/60")}>
                  <div className="flex items-start gap-2">
                    <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", n.isRead ? "bg-transparent" : "bg-gold-500")} />
                    <div className="min-w-0">
                      <p className="text-[12.5px] font-bold leading-5 text-ink">{n.title}</p>
                      {n.body && <p className="mt-0.5 line-clamp-2 text-[11.5px] text-ink/55">{n.body}</p>}
                      <p className="mt-1 text-[10px] text-ink/35">{n.ago}</p>
                    </div>
                  </div>
                </div>
              );
              return n.link ? (
                <Link key={n.id} href={n.link} onClick={() => setOpen(false)}>{inner}</Link>
              ) : (
                <div key={n.id}>{inner}</div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
