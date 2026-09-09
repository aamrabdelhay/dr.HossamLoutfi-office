"use client";

import { useState } from "react";
import Link from "next/link";
import { KeyRound, Link2, LogIn, ShieldCheck, UserPlus } from "lucide-react";
import { loginLawyer, registerLawyer } from "@/lib/actions";
import { cn } from "@/lib/utils";

type LawyerOpt = { id: number; title: string; firstName: string; lastName: string; specialty: string | null };

const MODES = [
  { key: "login", label: "دخول محامي", icon: LogIn },
  { key: "register", label: "تسجيل أول مرة", icon: UserPlus },
  { key: "link", label: "رابط خاص", icon: Link2 },
  { key: "admin", label: "دخول الإدارة", icon: ShieldCheck },
] as const;

export function AuthTabs({ lawyers, initialMode, ok }: { lawyers: LawyerOpt[]; initialMode?: string; ok?: string }) {
  const [mode, setMode] = useState<string>(
    MODES.some((m) => m.key === initialMode) ? initialMode! : "login",
  );

  return (
    <div className="card mx-auto max-w-xl overflow-hidden">
      <div className="grid grid-cols-4 border-b border-line bg-paper/70">
        {MODES.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setMode(key)}
            className={cn(
              "flex flex-col items-center gap-1.5 border-b-2 px-2 py-3.5 text-[11px] font-bold transition sm:text-xs",
              mode === key ? "border-gold-500 bg-white text-navy-900" : "border-transparent text-ink/45 hover:text-ink",
            )}
          >
            <Icon className={cn("h-5 w-5", mode === key ? "text-gold-600" : "text-ink/35")} />
            {label}
          </button>
        ))}
      </div>

      <div className="p-6">
        {mode === "login" && (
          <form action={loginLawyer} className="space-y-4">
            <div className="rounded-xl bg-gold-50 p-3 text-[12px] leading-6 text-ink/65">
              للمحامين المعتمدين فقط. <strong>وضع تجريبي:</strong> اختر ملفك للدخول مباشرة بدون كلمة مرور — سيُسجَّل دخولك في سجل النشاط.
            </div>
            <div>
              <label className="label">اختر ملف المحامي</label>
              <select name="lawyerId" className="input" required defaultValue="">
                <option value="" disabled>— اختر —</option>
                {lawyers.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.title} {l.firstName} {l.lastName}{l.specialty ? ` — ${l.specialty}` : ""}
                  </option>
                ))}
              </select>
            </div>
            <button className="btn-gold w-full py-3">دخول النظام</button>
          </form>
        )}

        {mode === "register" && (
          <form action={registerLawyer} className="grid gap-4 sm:grid-cols-2">
            {ok ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center text-sm font-bold text-emerald-700 sm:col-span-2">
                تم استلام بياناتك — حسابك الآن <strong>بانتظار اعتماد الإدارة</strong>. ستظهر إشعاراً فور الاعتماد.
              </div>
            ) : (
              <div className="rounded-xl bg-gold-50 p-3 text-[12px] leading-6 text-ink/65 sm:col-span-2">
                محامٍ جديد؟ سجّل بياناتك وسيصلك الاعتماد من الإدارة قبل تفعيل الدخول والتكليفات.
              </div>
            )}
            <div>
              <label className="label">الاسم الأول *</label>
              <input name="firstName" required className="input" />
            </div>
            <div>
              <label className="label">اسم العائلة *</label>
              <input name="lastName" required className="input" />
            </div>
            <div>
              <label className="label">الهاتف</label>
              <input name="phone" className="input" dir="ltr" />
            </div>
            <div>
              <label className="label">البريد الإلكتروني</label>
              <input type="email" name="email" className="input" dir="ltr" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">التخصص</label>
              <input name="specialty" className="input" placeholder="مدني، جنح، أحوال شخصية…" />
            </div>
            <button className="btn-navy w-full py-3 sm:col-span-2">إرسال طلب الاعتماد</button>
          </form>
        )}

        {mode === "admin" && (
          <div className="space-y-4 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-navy-950 text-gold-400">
              <KeyRound className="h-7 w-7" />
            </div>
            <p className="text-sm leading-7 text-ink/70">
              مركز الإدارة في هذا النظام <strong>مفتوح بدون كلمة مرور</strong> بوضع التشغيل الداخلي الحالي — منه تتحكم في كل شيء: المحامون، العملاء، القضايا، الجلسات، الجهات، التذكيرات، المستخدمون، والنشاط.
            </p>
            <Link href="/admin" className="btn-gold w-full py-3 text-base">فتح مركز الإدارة الآن</Link>
            <Link href="/admin/login" className="block text-[11px] font-bold text-ink/40 hover:underline">صفحة دخول الإدارة الرسمية</Link>
          </div>
        )}

        {mode === "link" && (
          <div className="space-y-4 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gold-100 text-gold-700">
              <Link2 className="h-7 w-7" />
            </div>
            <p className="text-sm leading-7 text-ink/70">
              إذا صدر لك <strong>رابط دخول شخصي</strong> من الإدارة فافتحه مباشرة — الرابط يدخلك بدون كلمة مرور، وهو مرتبط باسمك فقط، صالح ٧ أيام، ويُستهلك بعد أول استخدام.
            </p>
            <div className="rounded-xl border border-dashed border-gold-400 bg-gold-50 p-4 text-[12px] leading-6 text-gold-700">
              الصيغة: <code dir="ltr" className="font-bold">/access/&#123;token&#125;</code> — لم تصلك وصلة؟ اطلب التوليد من الإدارة وستصلك فوراً.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
