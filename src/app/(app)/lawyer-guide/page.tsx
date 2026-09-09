// دليل المحامي — directory متخصص: تصنيفات، خدمات، موثوقية بيانات
import Link from "next/link";
import { BadgeCheck, BookOpenCheck, Building2, Landmark, Layers, Search, ShieldAlert, Wrench } from "lucide-react";
import { getCategories, getGeneralServices, getLocations, getVerificationQueueCount } from "@/lib/queries";
import { ConfidenceBadge, PageHeader } from "@/components/ui";
import { arNum, cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function LawyerGuidePage({ searchParams }: { searchParams: Promise<{ cat?: string }> }) {
  const { cat } = await searchParams;
  const [locationsAll, queue, categories, generalServices] = await Promise.all([
    getLocations({ activeOnly: true }), getVerificationQueueCount(), getCategories(), getGeneralServices(),
  ]);
  const catById = new Map(categories.map((c) => [String(c.id), c]));
  const byCatSlug = new Map(categories.map((c) => [c.slug, c.id]));

  const locations = cat && byCatSlug.has(cat)
    ? locationsAll.filter((l) => l.categoryId === byCatSlug.get(cat))
    : locationsAll;

  const verified = locationsAll.filter((l) => l.status === "VERIFIED").length;
  const courts = locations.filter((l) => l.type === "COURT");
  const agencies = locations.filter((l) => l.type === "AGENCY");

  // التصنيفات الفعلية المستخدمة فقط تظهر كفلاتر
  const usedCats = categories.filter((c) => locationsAll.some((l) => l.categoryId === c.id));

  const Row = ({ l }: { l: (typeof locations)[number] }) => (
    <Link href={`/lawyer-guide/${l.slug}`} className="flex items-center justify-between gap-3 border-b border-line/60 px-4 py-2.5 transition last:border-0 hover:bg-paper/70">
      <div className="flex min-w-0 items-center gap-3">
        <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-lg", l.type === "COURT" ? "bg-navy-900 text-gold-300" : "bg-gold-100 text-gold-700")}>
          {l.type === "COURT" ? <Landmark className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-bold text-navy-950">{l.name}</p>
          <p className="truncate text-[10px] text-ink/45">
            {[l.subtype, l.city, l.jurisdiction].filter(Boolean).slice(0, 2).join(" · ")}
            {catById.get(String(l.categoryId)) ? ` · ${catById.get(String(l.categoryId))!.name}` : ""}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {l.distanceKm != null && <span className="chip hidden border border-line bg-paper text-ink/45 sm:inline-flex">{arNum(l.distanceKm)} كم</span>}
        <ConfidenceBadge confidence={l.confidence} />
      </div>
    </Link>
  );

  return (
    <div>
      <PageHeader title="دليل المحامي للمحاكم والجهات" subtitle={`${arNum(locationsAll.length)} جهة موثّقة + ٤٧ تصنيفاً + ٢٨ خدمة عامة — منطلقاً من مقر الدقي`}>
        <Link href="/search" className="btn-ghost py-1.5 text-xs"><Search className="h-4 w-4" /> البحث المتقدم</Link>
      </PageHeader>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "إجمالي الجهات", value: locationsAll.length, icon: BookOpenCheck, cls: "bg-navy-900 text-gold-300" },
          { label: "موثّقة ميدانياً", value: verified, icon: BadgeCheck, cls: "bg-ok-100 text-ok-700" },
          { label: "في طابور التحقق", value: queue, icon: ShieldAlert, cls: "bg-warn-100 text-warn-700" },
          { label: "محاكم", value: locationsAll.filter((l) => l.type === "COURT").length, icon: Landmark, cls: "bg-gold-100 text-gold-700" },
        ].map(({ label, value, icon: Icon, cls }) => (
          <div key={label} className="card flex items-center gap-3 p-3.5">
            <span className={cn("grid h-10 w-10 place-items-center rounded-lg", cls)}><Icon className="h-5 w-5" /></span>
            <div>
              <p className="text-xl font-bold leading-6 text-navy-950">{arNum(value)}</p>
              <p className="text-[10px] font-bold text-ink/45">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* فلتر التصنيفات */}
      <div className="mb-5 flex gap-1.5 overflow-x-auto rounded-lg border border-line bg-paper/70 p-1">
        <Link
          href="/lawyer-guide"
          className={cn("chip shrink-0 border px-3 py-1.5 text-[11px]", !cat ? "border-navy-900 bg-navy-900 text-gold-300" : "border-line bg-white text-ink/55 hover:border-gold-400")}
        >
          الكل ({arNum(locationsAll.length)})
        </Link>
        {usedCats.map((c) => {
          const n = locationsAll.filter((l) => l.categoryId === c.id).length;
          return (
            <Link
              key={c.id}
              href={`/lawyer-guide?cat=${c.slug}`}
              className={cn("chip shrink-0 border px-3 py-1.5 text-[11px]", cat === c.slug ? "border-navy-900 bg-navy-900 text-gold-300" : "border-line bg-white text-ink/55 hover:border-gold-400")}
            >
              {c.name} ({arNum(n)})
            </Link>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card overflow-hidden">
          <h2 className="border-b border-line bg-paper/70 px-4 py-2.5 text-[13px] font-bold text-navy-900">المحاكم ({arNum(courts.length)})</h2>
          <div>{courts.map((l) => <Row key={l.id} l={l} />)}</div>
        </section>
        <section className="card overflow-hidden">
          <h2 className="border-b border-line bg-paper/70 px-4 py-2.5 text-[13px] font-bold text-navy-900">الجهات الحكومية والعدلية ({arNum(agencies.length)})</h2>
          <div>{agencies.map((l) => <Row key={l.id} l={l} />)}</div>
        </section>
      </div>

      {/* الخدمات العامة */}
      <section className="card mt-5 p-4">
        <h2 className="flex items-center gap-2 text-[13px] font-bold text-navy-900">
          <Wrench className="h-4 w-4 text-gold-600" />
          دليل الخدمات العامة — ٢٨ خدمة ({arNum(generalServices.length)})
        </h2>
        <p className="mt-1 text-[11.5px] text-ink/45">مرجع سريع لنوع الخدمة التي قد تحتاجها في أي جهة قبل اختيار التكليف المناسب.</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {generalServices.map((s) => (
            <span key={s.id} className="chip border border-gold-200/70 bg-gold-50 px-2.5 py-1 text-[11px] text-gold-700">{s.name}</span>
          ))}
        </div>
      </section>

      <p className="mt-4 flex items-center gap-2 rounded-lg bg-paper px-4 py-2.5 text-[11px] leading-5 text-ink/50">
        <Layers className="h-4 w-4 shrink-0 text-gold-600" />
        بيانات دليل المحامي محمية بـ ٥ حالات توثيق (مسودة/بانتظار/موثّقة/مراجعة/مؤرشفة) ومستويات ثقة خمسة، والمسافات مصنّفة Buckets انطلاقاً من مقر المكتب بالدقي (٣٠٫٠٣٨، ٣١٫٢٠٠).
      </p>
    </div>
  );
}
