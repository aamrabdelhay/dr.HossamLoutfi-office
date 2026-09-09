// أرشيف المحامين المحذوفين — الحساب المعطّل لا يُحذف ويمكن استرجاعه
import Link from "next/link";
import { Archive, ArrowRight, RotateCcw } from "lucide-react";
import { getArchivedLawyers } from "@/lib/queries";
import { toggleLawyerActive } from "@/lib/actions";
import { ConfirmActionButton } from "@/components/admin-widgets";
import { Avatar, EmptyState, PageHeader, Badge } from "@/components/ui";
import { timeAgoAr } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function LawyersArchivePage() {
  const archived = await getArchivedLawyers();

  return (
    <div>
      <Link href="/admin?tab=lawyers" className="mb-4 inline-flex items-center gap-1.5 text-xs font-bold text-gold-700 hover:underline">
        <ArrowRight className="h-3.5 w-3.5" /> إدارة المحامين
      </Link>

      <PageHeader title="أرشيف المحامين" subtitle="المحامي المعطّل يظل محفوظاً هنا بكل سجله، ولا يستطيع تسجيل الدخول حتى يتم استرجاعه" />

      {archived.length === 0 ? (
        <EmptyState title="الأرشيف فارغ" hint="لا يوجد محامون معطّلون حالياً">
          <Link href="/admin?tab=lawyers" className="btn-ghost mt-2 text-xs">إدارة المحامين النشطين</Link>
        </EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {archived.map((l) => (
            <div key={l.id} className="card p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar first={l.firstName} last={l.lastName} size="lg" />
                  <div>
                    <p className="text-sm font-bold text-navy-950">{l.title} {l.firstName} {l.lastName}</p>
                    <p className="text-[10px] text-ink/45">{l.jobTitle} — انضم {timeAgoAr(l.createdAt)}</p>
                  </div>
                </div>
                <Badge tone="gray"><Archive className="h-3 w-3" /> معطّل</Badge>
              </div>
              <p className="mt-3 text-xs text-ink/55">{l.specialty ?? "بدون تخصص مسجل"}</p>
              <ConfirmActionButton
                action={toggleLawyerActive}
                fields={{ lawyerId: l.id, active: "1" }}
                className="btn-gold mt-4 w-full text-xs"
              >
                <RotateCcw className="h-4 w-4" /> استرجاع الحساب
              </ConfirmActionButton>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
