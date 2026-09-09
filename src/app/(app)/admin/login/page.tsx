// دخول الإدارة — مفتوح بدون كلمة مرور بوضع التشغيل الداخلي
import Link from "next/link";
import { ShieldCheck, KeyRound, ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default function AdminLoginPage() {
  return (
    <div className="mx-auto max-w-md">
      <div className="card overflow-hidden">
        <div className="bg-navy-950 p-8 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gold-500 text-navy-950">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h1 className="mt-4 text-xl font-bold text-white">دخول الإدارة</h1>
          <p className="mt-1 text-xs text-white/50">مركز التحكم الكامل في المكتب</p>
        </div>
        <div className="space-y-4 p-6 text-center">
          <div className="rounded-xl border border-gold-300 bg-gold-50 p-4 text-[13px] leading-7 text-ink/75">
            <KeyRound className="mx-auto mb-2 h-5 w-5 text-gold-600" />
            بوضع التشغيل الداخلي الحالي، الوصول للإدارة <strong>بدون access code</strong> — اضغط دخول وتحكم في كل شيء.
          </div>
          <Link href="/admin" className="btn-gold w-full py-3 text-base">
            دخول مركز الإدارة
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
