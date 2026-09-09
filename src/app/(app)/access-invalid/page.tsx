// صفحة فشل رابط الدخول — غير صالح / مستهلك / منتهي الصلاحية
import Link from "next/link";
import { KeyRound, ShieldX, TimerOff } from "lucide-react";

export const dynamic = "force-dynamic";

const META: Record<string, { title: string; desc: string; icon: typeof ShieldX }> = {
  invalid: { icon: ShieldX, title: "الرابط غير صالح", desc: "هذا الرابط غير موجود أو حُذف. اطلب من الإدارة توليد رابط جديد." },
  consumed: { icon: KeyRound, title: "الرابط استُخدم مسبقاً", desc: "روابط الدخول تُستهلك مرة واحدة فقط. اطلب رابطاً جديداً من الإدارة." },
  expired: { icon: TimerOff, title: "انتهت صلاحية الرابط", desc: "صلاحية الرابط ٧ أيام. اطلب من الإدارة تدوير رابطك الشخصي." },
};

export default async function AccessInvalidPage({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  const { e } = await searchParams;
  const meta = META[e ?? "invalid"] ?? META.invalid;
  const Icon = meta.icon;

  return (
    <div className="mx-auto max-w-md">
      <div className="card p-8 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-danger-50 text-danger-600">
          <Icon className="h-7 w-7" />
        </div>
        <h1 className="mt-4 text-lg font-bold text-navy-950">{meta.title}</h1>
        <p className="mt-2 text-[13px] leading-6 text-ink/55">{meta.desc}</p>
        <Link href="/auth" className="btn-navy mt-5 w-full">الانتقال إلى بوابة الدخول</Link>
      </div>
    </div>
  );
}
