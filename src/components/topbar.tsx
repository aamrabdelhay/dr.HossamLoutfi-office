// الشريط العلوي — بحث سريع + تاريخ اليوم + جرس الإشعارات + هوية العرض
import Link from "next/link";
import { CalendarDays, Scale, Search } from "lucide-react";
import { getPerms, getCurrentLawyer, ROLE_LABELS } from "@/lib/permissions";
import { getNotifications, getSettings, scanDueReminders } from "@/lib/queries";
import { arDate, timeAgoAr, todayStr } from "@/lib/utils";
import { NotifBell } from "./notif-bell";

export async function TopBar() {
  const identity = await getCurrentLawyer();
  // الماسح الدوري للتذكيرات المستحقة (شخصي / مكتب)
  await scanDueReminders(identity?.id ?? null);
  const [{ role }, notifs, settings] = await Promise.all([getPerms(), getNotifications(12), getSettings()]);

  const bellItems = notifs.rows.map((n) => ({
    id: n.id, title: n.title, body: n.body, link: n.link, isRead: n.isRead, ago: timeAgoAr(n.createdAt),
  }));
  const demo = settings.demo_lock === "on";

  return (
    <div className="fixed inset-x-0 top-0 z-30 border-b border-line bg-card/90 backdrop-blur lg:right-60 lg:left-64">
      {demo && (
        <div className="bg-gold-500 px-4 py-1 text-center text-[10.5px] font-bold text-white">
          وضع العرض التجريبي — البيانات قابلة لإعادة التوليد من مركز الصيانة بالإدارة
        </div>
      )}
      <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
        {/* هوية مختصرة للموبايل */}
        <Link href="/" className="flex items-center gap-2 lg:hidden">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-navy-950 text-gold-400"><Scale className="h-4 w-4" /></span>
        </Link>

        {/* التاريخ */}
        <div className="hidden items-center gap-2 text-[12.5px] font-bold text-ink/55 md:flex">
          <CalendarDays className="h-4 w-4 text-gold-600" />
          <span>{arDate(todayStr())}</span>
        </div>

        {/* البحث السريع */}
        <form action="/search" className="relative mx-auto w-full max-w-md">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/30" />
          <input
            name="q"
            placeholder="بحث سريع: جلسة، محكمة، قضية، محامٍ، عميل…"
            className="h-9 w-full rounded-full border border-line bg-paper/70 pr-9 pl-4 text-[12.5px] outline-none transition focus:border-navy-700 focus:bg-white focus:ring-[3px] focus:ring-navy-700/10"
          />
        </form>

        <div className="flex items-center gap-2.5">
          <span className="hidden items-center gap-1.5 rounded-full border border-line bg-paper px-3 py-1 text-[11px] font-bold text-ink/55 sm:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-ok-600" />
            {identity ? identity.name : ROLE_LABELS[role]}
          </span>
          <NotifBell unread={notifs.unreadCount} items={bellItems} variant="light" />
        </div>
      </div>
    </div>
  );
}
