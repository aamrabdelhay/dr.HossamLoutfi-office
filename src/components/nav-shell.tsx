// الهيكل الجانبي الرئيسي (Server) — هوية المكتب + التنقل + وضع العرض
import Link from "next/link";
import { getPerms, getCurrentLawyer } from "@/lib/permissions";
import { NavLinks, MobileBottomNav } from "./nav-links";
import { RoleSwitcher } from "./role-switcher";

export async function NavShell() {
  const [{ role, perms }, identity] = await Promise.all([getPerms(), getCurrentLawyer()]);

  return (
    <>
      {/* الشريط الجانبي — يمين الشاشة */}
      <aside className="fixed inset-y-0 right-0 z-40 hidden w-60 flex-col bg-navy-950 lg:flex">
        <Link href="/" className="flex items-center gap-3 border-b border-white/[0.08] px-5 pb-5 pt-6">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-gold-300 to-gold-600 text-navy-950 shadow-[0_8px_20px_-8px_rgba(202,165,76,0.8)]">
            <span className="text-lg font-bold leading-none">ح.ل</span>
          </div>
          <div className="min-w-0">
            <p className="truncate text-[14.5px] font-bold leading-5 text-white">مكتب د. حسام لطفي</p>
            <p className="mt-0.5 text-[10px] font-bold text-gold-400">نظام تشغيل المكتب — للمحاماة والاستشارات</p>
          </div>
        </Link>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          <NavLinks showAdmin={perms.adminAccess} isLawyer={!!identity} />
        </div>

        <div className="border-t border-white/[0.08] p-3.5">
          <RoleSwitcher role={role} lawyerName={identity?.name ?? null} />
        </div>
      </aside>

      <MobileBottomNav showAdmin={perms.adminAccess} />
    </>
  );
}
