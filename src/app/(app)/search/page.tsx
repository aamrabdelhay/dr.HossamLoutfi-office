// البحث المتقدم — مهام، محامون، جهات، قضايا، عملاء
import Link from "next/link";
import { FileText, Gavel, Landmark, Search, UserRound, UsersRound } from "lucide-react";
import { searchAll } from "@/lib/queries";
import { Avatar, CaseStatusBadge, PageHeader, StatusBadge, TypeBadge, ConfidenceBadge } from "@/components/ui";
import { arDate, arNum } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const results = query ? await searchAll(query) : null;
  const total = results
    ? results.tasks.length + results.lawyers.length + results.locations.length + results.cases.length + results.clients.length
    : 0;

  return (
    <div>
      <PageHeader title="البحث المتقدم" subtitle="ابحث في كل شيء: جلسة، تكليف، محامٍ، محكمة، جهة، قضية، عميل" />

      <form action="/search" className="card mb-6 flex items-center gap-2 p-3">
        <div className="relative flex-1">
          <Search className="absolute right-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-gold-600" />
          <input
            name="q"
            defaultValue={query}
            autoFocus
            placeholder="مثال: محكمة الدقي، 1245/2024، أحمد عبد العزيز، شهر عقاري…"
            className="input py-3 pr-11 text-base"
          />
        </div>
        <button className="btn-navy px-6 py-3">بحث</button>
      </form>

      {!results && (
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { icon: Gavel, title: "جلسات وتكليفات", hint: "بالعنوان أو الوصف أو الملاحظات" },
            { icon: Landmark, title: "محاكم وجهات", hint: "بالاسم أو النوع أو المنطقة" },
            { icon: FileText, title: "قضايا وعملاء", hint: "برقم القضية أو اسم العميل" },
          ].map(({ icon: Icon, title, hint }) => (
            <div key={title} className="card border-dashed p-5 text-center">
              <Icon className="mx-auto h-6 w-6 text-gold-600" />
              <p className="mt-2 text-sm font-bold text-navy-900">{title}</p>
              <p className="mt-1 text-xs text-ink/45">{hint}</p>
            </div>
          ))}
        </div>
      )}

      {results && (
        <div className="space-y-7">
          <p className="text-xs font-bold text-ink/45">{arNum(total)} نتيجة لـ «{query}»</p>

          {results.tasks.length > 0 && (
            <section>
              <h2 className="mb-2 flex items-center gap-2 text-sm font-bold text-navy-900"><Gavel className="h-4 w-4 text-gold-600" /> الجلسات والمهام ({arNum(results.tasks.length)})</h2>
              <div className="card divide-y divide-line/60">
                {results.tasks.map((t) => (
                  <Link key={t.id} href={`/tasks/${t.id}`} className="flex flex-wrap items-center gap-2 px-4 py-3 transition hover:bg-gold-50/60">
                    <TypeBadge type={t.type} /><StatusBadge status={t.status} />
                    <span className="flex-1 text-sm font-bold text-navy-950">{t.title}</span>
                    <span className="text-[11px] text-ink/45">{t.date ? arDate(t.date) : "بدون تاريخ"}{t.location ? ` · ${t.location.name}` : ""}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {results.lawyers.length > 0 && (
            <section>
              <h2 className="mb-2 flex items-center gap-2 text-sm font-bold text-navy-900"><UserRound className="h-4 w-4 text-gold-600" /> المحامون ({arNum(results.lawyers.length)})</h2>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {results.lawyers.map((l) => (
                  <Link key={l.id} href={`/lawyers/${l.slug}`} className="card flex items-center gap-3 p-3 transition hover:shadow-md">
                    <Avatar first={l.firstName} last={l.lastName} size="md" principal={l.isPrincipal} />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-navy-950">{l.title} {l.firstName} {l.lastName}</p>
                      <p className="truncate text-[10px] text-ink/45">{l.specialty}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {results.locations.length > 0 && (
            <section>
              <h2 className="mb-2 flex items-center gap-2 text-sm font-bold text-navy-900"><Landmark className="h-4 w-4 text-gold-600" /> الجهات ({arNum(results.locations.length)})</h2>
              <div className="card divide-y divide-line/60">
                {results.locations.map((l) => (
                  <Link key={l.id} href={`/locations/${l.slug}`} className="flex items-center justify-between gap-2 px-4 py-3 transition hover:bg-gold-50/60">
                    <div>
                      <p className="text-sm font-bold text-navy-950">{l.name}</p>
                      <p className="text-[10px] text-ink/45">{[l.subtype, l.district, l.governorate].filter(Boolean).join(" · ")}</p>
                    </div>
                    <ConfidenceBadge confidence={l.confidence} />
                  </Link>
                ))}
              </div>
            </section>
          )}

          {results.cases.length > 0 && (
            <section>
              <h2 className="mb-2 flex items-center gap-2 text-sm font-bold text-navy-900"><FileText className="h-4 w-4 text-gold-600" /> القضايا ({arNum(results.cases.length)})</h2>
              <div className="card divide-y divide-line/60">
                {results.cases.map((c) => (
                  <Link key={c.id} href="/case-archive" className="flex items-center justify-between gap-2 px-4 py-3 transition hover:bg-gold-50/60">
                    <div>
                      <p className="text-sm font-bold text-navy-950">{c.name}</p>
                      <p className="text-[10px] text-ink/45">{c.caseNumber}</p>
                    </div>
                    <CaseStatusBadge status={c.status} />
                  </Link>
                ))}
              </div>
            </section>
          )}

          {results.clients.length > 0 && (
            <section>
              <h2 className="mb-2 flex items-center gap-2 text-sm font-bold text-navy-900"><UsersRound className="h-4 w-4 text-gold-600" /> العملاء ({arNum(results.clients.length)}) <span className="chip bg-red-50 text-red-600">سرية — الإدارة</span></h2>
              <div className="card divide-y divide-line/60">
                {results.clients.map((c) => (
                  <Link key={c.id} href={`/admin/clients/${c.id}`} className="flex items-center justify-between px-4 py-3 transition hover:bg-gold-50/60">
                    <p className="text-sm font-bold text-navy-950">{c.name}</p>
                    <p className="text-[11px] text-ink/45" dir="ltr">{c.phone}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {total === 0 && <p className="py-10 text-center text-sm text-ink/40">لا نتائج مطابقة لـ «{query}» — جرّب كلمات مختلفة</p>}
        </div>
      )}
    </div>
  );
}
