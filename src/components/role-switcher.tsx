"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogOut, UserCog } from "lucide-react";
import { logoutIdentity, setRole } from "@/lib/actions";
import { ROLE_LABELS, ROLES, type Role } from "@/lib/rbac";

// وضع العرض التجريبي: تبديل الدور يغيّر الصلاحيات المعروضة فوراً (بدون باسورد)
export function RoleSwitcher({ role, lawyerName }: { role: Role; lawyerName: string | null }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="mb-2 flex items-center gap-2 text-[11px] font-bold text-white/50">
        <UserCog className="h-3.5 w-3.5" />
        وضع العرض (RBAC)
      </div>
      <select
        className="w-full rounded-lg border border-white/15 bg-navy-950 px-2 py-1.5 text-xs font-semibold text-white outline-none focus:border-gold-500"
        value={role}
        disabled={pending}
        onChange={(e) => {
          const fd = new FormData();
          fd.set("role", e.target.value);
          startTransition(async () => {
            await setRole(fd);
            router.refresh();
          });
        }}
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {ROLE_LABELS[r]}
          </option>
        ))}
      </select>
      {lawyerName && (
        <div className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-gold-500/10 px-2 py-1.5">
          <span className="truncate text-[11px] font-bold text-gold-300">{lawyerName}</span>
          <button
            className="shrink-0 text-white/50 transition hover:text-red-400"
            title="تسجيل الخروج"
            onClick={() => startTransition(async () => logoutIdentity())}
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
