// دليل استخدام داخلي للإدارة
import Link from "next/link";
import {
  ArrowRight, BellRing, CalendarClock, Gavel, BriefcaseBusiness, Landmark, Link2, ShieldCheck, UsersRound, Wrench,
} from "lucide-react";
import { PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

const SECTIONS = [
  {
    icon: UsersRound,
    title: "إدارة العملاء والقضايا",
    points: [
      "العملاء سرّيون: لا يظهرون إلا في مركز الإدارة، وكل عميل له محامٍ مسؤول.",
      "عند إضافة عميل يمكنك فتح قضية له في نفس اللحظة (اسم + رقم).",
      "العميل قد يمتلك أكثر من قضية — استخدم «ربط قضية» داخل ملف العميل لربط القضايا غير المرتبطة.",
      "كل قضية لها Timeline دائم في /case-archive: فتح الملف، الجلسات، الأحكام، الإجراءات.",
    ],
    href: "/admin?tab=clients",
  },
  {
    icon: Gavel,
    title: "الجلسات والتكليفات",
    points: [
      "التكليف ليس بالضرورة قضية أو جلسة — اسم التكليف فقط إجباري، وباقي الحقول اختيارية وتُضاف لاحقاً.",
      "التكليف ذو التاريخ يدخل نظام الجلسات والتقويم تلقائياً؛ العام بدون تاريخ يبقى منفصلاً في «بدون تاريخ».",
      "حالات المهمة: قيد التنفيذ ← جاري التنفيذ ← تم التنفيذ / ملغي.",
      "الأولوية «حرجة» مع موعد خلال ٣ أيام تظهر في مؤشر الجلسات الحرجة باللوحة.",
      "الجلسة الواحدة تقبل أكثر من محامٍ مكلّف — والنظام يمنع تكرار نفس المحامي لنفس المهمة.",
    ],
    href: "/admin?tab=tasks",
  },
  {
    icon: BellRing,
    title: "التذكيرات الشخصية وتنبيهات البريد",
    points: [
      "أي مستخدم ينشئ تذكيراً شخصياً (عنوان + تاريخ + وقت + ملاحظة) فيصله إشعار الجرس عند موعده.",
      "المحامي يرى تذكيراته هو فقط في لوحته؛ والإدارة ترى تذكيرات المكتب كلها من تبويب «التذكيرات».",
      "تذكيرات الجلسات البريدية تعمل آلياً: قبل ١٤ يوماً، ٧ أيام، ٣ أيام، وليلة الجلسة.",
      "سجل Email Reminders (Ledger) يمنع إرسال التذكير نفسه مرتين — والتشغيل: مرتان يومياً عبر /api/cron.",
    ],
    href: "/admin?tab=reminders",
  },
  {
    icon: Link2,
    title: "روابط دخول المحامين والصور الشخصية",
    points: [
      "من تبويب المحامين ولّد «رابط دخول» شخصياً بدون كلمة مرور — مرتبط بمحامٍ واحد وصالح ٧ أيام.",
      "الرابط يُستهلك بعد أول دخول، والتوليد الجديد يدوّر (يلغي) الروابط القديمة تلقائياً.",
      "الصور تُرفع برفع آمن: PNG / JPG / WebP بحد أقصى ٢ ميجابايت، وتُعرض عبر Route مخصص ومحمي.",
      "تحرير نموذج المحامي يحمل «الصورة الشخصية» — ارفعها وحُفظت فوراً.",
    ],
    href: "/admin?tab=lawyers",
  },
  {
    icon: Landmark,
    title: "المحاكم والجهات الحكومية",
    points: [
      "الدليل يحمل كل البيانات: العنوان، المواعيد، الخدمات، الاختصاص، الإحداثيات، والمسافة من مقر الدقي.",
      "المسافات مصنّفة Buckets: ٠–٥ · ٥–١٠ · ١٠–٢٠ · ٢٠–٤٠ · ٤٠–٧٥ · ٧٥–١٥٠ · ١٥٠–٣٠٠ · ٣٠٠+ كم.",
      "قواعد الاختصاص تلقائية: النقض والدستورية على مستوى الجمهورية، الاستئناف بدائرة المحكمة، والباقي بدائرة المحافظة.",
      "دورة التوثيق: مسودة ← بانتظار التحقق ← موثّقة، وزر «توثيق» يسجّل التاريخ تلقائياً.",
      "الجهات مرتبطة بعلاقات: SAME_BUILDING / LOCATED_IN / SUBORDINATE_TO وغيرها.",
    ],
    href: "/admin?tab=locations",
  },
  {
    icon: BriefcaseBusiness,
    title: "المحامون",
    points: [
      "المحامي الجديد يسجّل من /auth ثم ينتظر اعتماد الإدارة — لن يظهر في القوائم قبلها.",
      "«المحامي الرئيسي» شارة تنظيمية تظهر في كل الواجهات.",
      "الأرشفة لا تحذف شيئاً: السجل كله محفوظ في /admin/lawyers/archive ويمكن الاسترجاع بنقرة.",
      "كل محامٍ يستطيع تحديث «حالته الآن» من ملفه — تظهر في اللوحة الرئيسية.",
    ],
    href: "/admin?tab=lawyers",
  },
  {
    icon: CalendarClock,
    title: "الجلسات والتقويم والأدوار",
    points: [
      "شريط المواعيد الجانبي ثابت في كل الصفحات ومصنّف: اليوم / غداً / ٣ أيام / ١٤ / ٣٠ يوماً.",
      "التقويم التشغيلي /calendar يعرض الشهر كاملاً مع ترميز لوني للحرجة والمنفّذة.",
      "الأدوار (RBAC): مدير عام ومدير يديران المستخدمين؛ مدير المكتب يدير المحامين والجهات والتكليفات والتذكيرات؛ السكرتارية الجهات والتكليفات فقط؛ القارئ قراءة فقط.",
      "كل عملية تُسجَّل في سجل النشاط مع اسم المنفذ والوقت.",
    ],
    href: "/admin?tab=activity",
  },
  {
    icon: Wrench,
    title: "الأرشفة والصيانة والبيانات التجريبية",
    points: [
      "مركز الصيانة في نظرة الإدارة: تفعيل شريط «وضع العرض التجريبي» وإعادة توليد البيانات بنقرة.",
      "قفل العرض التجريبي (demo_lock) يُخزن في admin_settings مع إحداثيات مقر المكتب.",
      "روبوتات الفهرسة محجوب عنها: /admin · /api/ · /uploads/ · /access/ · /notifications.",
    ],
    href: "/admin",
  },
];

export default function AdminGuidePage() {
  return (
    <div>
      <PageHeader title="دليل الاستخدام الداخلي" subtitle="كيف تدير المكتب من مركز الإدارة — مرجع سريع لكل الوحدات" />
      <div className="grid gap-4 lg:grid-cols-2">
        {SECTIONS.map(({ icon: Icon, title, points, href }) => (
          <section key={title} className="card p-5">
            <h2 className="flex items-center gap-2.5 text-sm font-bold text-navy-950">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-navy-900 text-gold-300"><Icon className="h-4.5 w-4.5" /></span>
              {title}
            </h2>
            <ul className="mt-3.5 space-y-2.5">
              {points.map((p) => (
                <li key={p} className="flex items-start gap-2 text-[12.5px] leading-6 text-ink/70">
                  <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500" />
                  {p}
                </li>
              ))}
            </ul>
            <Link href={href} className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-gold-700 hover:underline">
              فتح الوحدة <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </section>
        ))}
      </div>
      <div className="mt-5 flex items-center gap-3 rounded-lg border border-gold-300 bg-gold-50 p-4">
        <ShieldCheck className="h-6 w-6 shrink-0 text-gold-600" />
        <p className="text-[11.5px] leading-6 text-ink/70">
          ملاحظة أمنية: الوصول لمركز الإدارة حالياً <strong>بدون كلمة مرور</strong> بوضع التشغيل الداخلي. عند تفعيل الحماية الكاملة تُخزن الجلسات كرموز مشفرة (SHA-256) مع IP وUser-Agent وصلاحية وإلغاء.
        </p>
      </div>
    </div>
  );
}
