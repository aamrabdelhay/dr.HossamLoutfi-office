// المحامون — فريق العمل النشط والمعتمد
import Link from "next/link";
import { BriefcaseBusiness, CalendarClock, Mail, Phone } from "lucide-react";
import { getActiveLawyers, getLawyerUpcomingCounts } from "@/lib/queries";
import { Avatar, Badge, EmptyState, PageHeader } from "@/components/ui";
import { arNum } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function LawyersPage() {
  const [lawyers, upcoming] = await Promise.all([getActiveLawyers(), getLawyerUpcomingCounts()]);

  return (
    <div>
      <PageHeader title="المحامون" subtitle="فريق العمل النشط والمعتمد — المحامي جزء من النظام التشغيلي: تكليفات وتعليقات وإشعارات" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {lawyers.length === 0 && <div className="sm:col-span-2 xl:col-span-3"><EmptyState title="لا محامون معتمدون بعد" /></div>}
        {lawyers.map((l) => (
          <Link key={l.id} href={`/lawyers/${l.slug}`} className="card group p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Avatar first={l.firstName} last={l.lastName} size="lg" principal={l.isPrincipal} photoUrl={l.photoUrl} />
                <div>
                  <p className="text-sm font-bold text-navy-950 group-hover:text-gold-700">
                    {l.title} {l.firstName} {l.lastName}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 text-[11px] text-ink/50">
                    <BriefcaseBusiness className="h-3 w-3" />
                    {l.jobTitle ?? l.specialty ?? "محامٍ"}
                  </p>
                </div>
              </div>
              {l.isPrincipal && <Badge tone="gold">رئيسي</Badge>}
            </div>

            {l.specialty && <p className="mt-3 text-xs font-semibold text-gold-700">{l.specialty}</p>}
            {l.statusText && (
              <p className="mt-2 rounded-lg bg-gold-50 px-2.5 py-1.5 text-[11px] leading-5 text-ink/65">{l.statusText}</p>
            )}

            <div className="mt-3 flex items-center justify-between border-t border-line/70 pt-3">
              <div className="flex items-center gap-3 text-[10px] text-ink/45">
                {l.phone && <span className="flex items-center gap-1" dir="ltr"><Phone className="h-3 w-3" />{l.phone}</span>}
                {l.email && <span className="flex items-center gap-1 truncate"><Mail className="h-3 w-3" />{l.email}</span>}
              </div>
              <span className="chip bg-navy-900 text-gold-300">
                <CalendarClock className="h-3 w-3" />
                {arNum(upcoming.get(l.id) ?? 0)} قادمة
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
