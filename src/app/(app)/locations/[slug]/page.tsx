// تفاصيل جهة — ملف شامل: بيانات، وصول، اختصاص، جلسات
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight, Building2, CheckCircle2, Clock3, ExternalLink, Globe, Landmark,
  MapPin, Navigation, Phone, ShieldQuestion, XCircle,
} from "lucide-react";
import { getLocationBySlug } from "@/lib/queries";
import { getPerms } from "@/lib/permissions";
import { TaskCard } from "@/components/task-card";
import { Badge, ConfidenceBadge, EmptyState, LocationStatusBadge } from "@/components/ui";
import { arDate, arNum, timeAgoAr } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function LocationDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [data, { perms }] = await Promise.all([getLocationBySlug(slug), getPerms()]);
  if (!data) notFound();
  const { loc: l, tasks, upcoming } = data;

  const rows: Array<{ label: string; value: React.ReactNode }> = [
    { label: "العنوان", value: [l.address, l.district, l.city, l.governorate].filter(Boolean).join(" — ") || "—" },
    { label: "الهاتف", value: l.phone ? <span dir="ltr">{l.phone}</span> : "—" },
    { label: "مواعيد العمل", value: l.openingHours ?? "—" },
    { label: "الاختصاص", value: l.jurisdiction ?? "—" },
    { label: "الحضور الشخصي", value: l.requiresPresence ? "مطلوب" : "غير مطلوب" },
    { label: "خدمة إلكترونية", value: l.onlineService ? "متاحة" : "غير متاحة" },
    { label: "المسافة من الدقي", value: l.distanceKm != null ? `${arNum(l.distanceKm)} كم` : "—" },
    { label: "مصدر البيانات", value: l.source ?? "—" },
    { label: "آخر تحقق", value: l.lastVerifiedAt ? `${arDate(l.lastVerifiedAt.toISOString().slice(0, 10))} (${timeAgoAr(l.lastVerifiedAt)})` : "لم يُتحقق بعد" },
  ];

  return (
    <div>
      <Link href="/locations" className="mb-4 inline-flex items-center gap-1.5 text-xs font-bold text-gold-700 hover:underline">
        <ArrowRight className="h-3.5 w-3.5" /> كل الجهات
      </Link>

      <div className="card overflow-hidden">
        <div className="border-b border-line bg-navy-950 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-gold-500 text-navy-950">
                {l.type === "COURT" ? <Landmark className="h-6 w-6" /> : <Building2 className="h-6 w-6" />}
              </span>
              <div>
                <h1 className="text-lg font-bold text-white">{l.name}</h1>
                <p className="text-xs text-white/50" dir="ltr">{l.nameEn}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Badge tone="navy">{l.type === "COURT" ? "محكمة" : "جهة حكومية"}</Badge>
              {l.subtype && <Badge tone="gold">{l.subtype}</Badge>}
              <LocationStatusBadge status={l.status} />
              <ConfidenceBadge confidence={l.confidence} />
            </div>
          </div>
        </div>

        <div className="grid gap-5 p-5 lg:grid-cols-[1fr_280px]">
          <div>
            {l.description && <p className="mb-4 rounded-xl bg-gold-50 px-4 py-3 text-[13px] leading-7 text-ink/75">{l.description}</p>}
            <div className="grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
              {rows.map((r) => (
                <div key={r.label} className="flex items-start justify-between gap-3 border-b border-line/50 py-2 text-xs">
                  <span className="shrink-0 font-bold text-ink/45">{r.label}</span>
                  <span className="font-semibold text-ink/80">{r.value}</span>
                </div>
              ))}
            </div>
            {(l.services?.length ?? 0) > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-bold text-ink/45">الخدمات المتاحة</p>
                <div className="flex flex-wrap gap-1.5">
                  {l.services!.map((s) => <span key={s} className="chip border border-gold-200 bg-gold-50 text-gold-700">{s}</span>)}
                </div>
              </div>
            )}
          </div>

          <aside className="space-y-3">
            {l.mapsUrl && (
              <a href={l.mapsUrl} target="_blank" rel="noreferrer" className="btn-navy w-full text-xs">
                <MapPin className="h-4 w-4" /> فتح في خرائط Google
              </a>
            )}
            {l.website && (
              <a href={l.website} target="_blank" rel="noreferrer" className="btn-ghost w-full text-xs">
                <Globe className="h-4 w-4" /> الموقع الرسمي <ExternalLink className="h-3 w-3" />
              </a>
            )}
            {l.phone && (
              <a href={`tel:${l.phone.replace(/\s/g, "")}`} className="btn-ghost w-full text-xs">
                <Phone className="h-4 w-4" /> اتصال مباشر
              </a>
            )}
            <div className="card bg-paper p-3">
              <p className="flex items-center gap-1.5 text-[11px] font-bold text-ink/50"><ShieldQuestion className="h-4 w-4" /> موثوقية البيانات</p>
              <div className="mt-2 space-y-1.5 text-[11px] text-ink/60">
                <p className="flex items-center gap-1.5">
                  {l.status === "VERIFIED" ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <XCircle className="h-3.5 w-3.5 text-amber-600" />}
                  {l.status === "VERIFIED" ? "تم التحقق الميداني من هذه البيانات" : "هذه البيانات بانتظار تحقق الإدارة"}
                </p>
                <p className="flex items-center gap-1.5"><Navigation className="h-3.5 w-3.5 text-gold-600" /> المكاتب الميدانية تخرج من مقر المكتب بالدقي</p>
                <p className="flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5 text-gold-600" /> آخر مراجعة: {l.lastVerifiedAt ? timeAgoAr(l.lastVerifiedAt) : "—"}</p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* الجلسات القادمة في هذه الجهة */}
      <div className="mt-6">
        <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-navy-900">
          <span className="h-4 w-1 rounded-full bg-gold-500" />
          الجلسات والمواعيد القادمة هنا ({arNum(upcoming.length)})
        </h2>
        <div className="space-y-3">
          {upcoming.length === 0 && <EmptyState title="لا مواعيد قادمة في هذه الجهة" />}
          {upcoming.map((t) => <TaskCard key={t.id} task={t} from={`/locations/${l.slug}`} canManage={perms.manageTasks} showComments={false} />)}
        </div>
      </div>
    </div>
  );
}
