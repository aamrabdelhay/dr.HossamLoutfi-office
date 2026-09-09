"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Archive, BookOpen, CalendarClock, CalendarDays, Landmark,
  LayoutDashboard, ListChecks, LogIn, Scale, Search, ShieldCheck, Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const GROUPS = [
  {
    label: "التشغيل اليومي",
    items: [
      { href: "/", label: "اللوحة الرئيسية", icon: LayoutDashboard },
      { href: "/sessions", label: "الجلسات والمواعيد", icon: CalendarClock },
      { href: "/calendar", label: "التقويم التشغيلي", icon: CalendarDays },
      { href: "/tasks", label: "ساحة المهام", icon: ListChecks },
    ],
  },
  {
    label: "الفريق والدليل",
    items: [
      { href: "/lawyers", label: "المحامون", icon: Users },
      { href: "/locations", label: "المحاكم والجهات", icon: Landmark },
      { href: "/lawyer-guide", label: "دليل المحامي", icon: BookOpen },
    ],
  },
  {
    label: "الملفات والبحث",
    items: [
      { href: "/case-archive", label: "القضايا والأرشيف", icon: Archive },
      { href: "/search", label: "البحث المتقدم", icon: Search },
    ],
  },
] as const;

export function NavLinks({ showAdmin, isLawyer }: { showAdmin: boolean; isLawyer: boolean }) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  return (
    <nav>
      {GROUPS.map((g) => (
        <div key={g.label}>
          <p className="nav-group">{g.label}</p>
          <div className="flex flex-col gap-0.5">
            {g.items.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className="nav-link" data-active={isActive(href)}>
                <Icon className="h-[17px] w-[17px] shrink-0 opacity-80" />
                <span>{label}</span>
              </Link>
            ))}
          </div>
        </div>
      ))}
      <div className="mt-4 border-t border-white/10 pt-3">
        {showAdmin && (
          <Link href="/admin" className="nav-link mb-1 border border-gold-500/25 bg-gold-500/10 text-gold-300 hover:bg-gold-500/20" data-active={isActive("/admin")}>
            <ShieldCheck className="h-[17px] w-[17px] shrink-0" />
            <span>مركز الإدارة</span>
          </Link>
        )}
        {!isLawyer && (
          <Link href="/auth" className="nav-link" data-active={isActive("/auth")}>
            {isLawyer ? <Scale className="h-[17px] w-[17px]" /> : <LogIn className="h-[17px] w-[17px]" />}
            <span>الدخول كمحامي</span>
          </Link>
        )}
      </div>
    </nav>
  );
}

export function MobileBottomNav({ showAdmin }: { showAdmin: boolean }) {
  const pathname = usePathname();
  const items = [
    { href: "/", label: "الرئيسية", icon: LayoutDashboard },
    { href: "/sessions", label: "الجلسات", icon: CalendarClock },
    { href: "/calendar", label: "التقويم", icon: CalendarDays },
    { href: "/tasks", label: "المهام", icon: ListChecks },
    ...(showAdmin ? [{ href: "/admin", label: "الإدارة", icon: ShieldCheck }] : []),
    { href: "/search", label: "بحث", icon: Search },
  ];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t border-line bg-card/95 px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      {items.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link key={href} href={href} className={cn("flex flex-col items-center gap-0.5 px-3 py-2 text-[10px] font-bold", active ? "text-gold-600" : "text-ink/40")}>
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
