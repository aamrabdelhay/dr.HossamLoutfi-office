// المحاكم والجهات الحكومية — الدليل التشغيلي
import Link from "next/link";
import { Clock3, Landmark, MapPin, Navigation, Search, Building2 } from "lucide-react";
import { getLocations } from "@/lib/queries";
import { ConfidenceBadge, EmptyState, LocationStatusBadge, PageHeader, Badge } from "@/components/ui";
import { arNum, cn } from "@/lib/utils";
import { getVerificationQueueCount } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function LocationsPage({ searchParams }: { searchParams: Promise<{ q?: string; type?: string }> }) {
  const { q, type } = await searchParams;
  const [locations, queueCount] = await Promise.all([
    getLocations({ q, type, activeOnly: true }),
    getVerificationQueueCount(),
  ]);
  const courts = locations.filter((l) => l.type === "COURT");
  const agencies = locations.filter((l) => l.type === "AGENCY");

  const Card = ({ l }: { l: (typeof locations)[number] }) => (
    <Link href={`/locations/${l.slug}`} className="card group p-4 transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", l.type === "COURT" ? "bg-navy-900 text-gold-300" : "bg-gold-100 text-gold-700")}>
            {l.type === "COURT" ? <Landmark className="h-5 w-5" /> : <Building2 className="h-5 w-5" />}
          </span>
          <div>
            <p className="text-sm font-bold leading-5 text-navy-950 group-hover:text-gold-700">{l.name}</p>
            <p className="mt-0.5 text-[10px] text-ink/45">{[l.subtype, l.district, l.governorate].filter(Boolean).join(" · ")}</p>
          </div>
        </div>
        <ConfidenceBadge confidence={l.confidence} />
      </div>
      {l.openingHours && (
        <p className="mt-2.5 flex items-center gap-1.5 text-[11px] text-ink/55">
          <Clock3 className="h-3.5 w-3.5 text-gold-600" /> {l.openingHours}
        </p>
      )}
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        {l.distanceKm != null && (
          <span className="chip bg-paper text-ink/50"><Navigation className="h-3 w-3" /> {arNum(l.distanceKm)} كم من الدقي</span>
        )}
        {l.onlineService && <Badge tone="blue">خدمة إلكترونية</Badge>}
        <LocationStatusBadge status={l.status} />
        {(l.services ?? []).slice(0, 2).map((s) => (
          <span key={s} className="chip bg-gold-50 text-gold-700">{s}</span>
        ))}
      </div>
    </Link>
  );

  return (
    <div>
      <PageHeader title="المحاكم والجهات الحكومية" subtitle={`${arNum(locations.length)} جهة موثّقة — ${arNum(queueCount)} في طابور التحقق`} />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <form className="flex min-w-56 flex-1 items-center gap-2" action="/locations">
          <input type="hidden" name="type" value={type ?? ""} />
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35" />
            <input name="q" defaultValue={q ?? ""} placeholder="ابحث عن محكمة أو جهة…" className="input pr-9" />
          </div>
          <button className="btn-navy">بحث</button>
        </form>
        {[
          { key: "", label: "الكل" },
          { key: "COURT", label: "المحاكم" },
          { key: "AGENCY", label: "الجهات الأخرى" },
        ].map((f) => (
          <Link
            key={f.key}
            href={`/locations?type=${f.key}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            className={cn("chip border px-3.5 py-1.5 text-xs", (type ?? "") === f.key ? "border-navy-900 bg-navy-900 text-gold-300" : "border-line bg-white text-ink/60 hover:border-gold-400")}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {locations.length === 0 && <EmptyState title="لا نتائج" hint="جرّب كلمة أخرى أو امسح التصفية" />}

      {courts.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-navy-900">
            <MapPin className="h-4 w-4 text-gold-600" /> المحاكم ({arNum(courts.length)})
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{courts.map((l) => <Card key={l.id} l={l} />)}</div>
        </section>
      )}

      {agencies.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-navy-900">
            <Building2 className="h-4 w-4 text-gold-600" /> الجهات الحكومية الأخرى ({arNum(agencies.length)})
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{agencies.map((l) => <Card key={l.id} l={l} />)}</div>
        </section>
      )}
    </div>
  );
}
