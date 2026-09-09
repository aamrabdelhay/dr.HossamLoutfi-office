// ملف العميل — سري للإدارة فقط
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Link2, Mail, MapPin, Phone, ShieldAlert, Unlink, UserRound } from "lucide-react";
import { getActiveLawyers, getClientById } from "@/lib/queries";
import { linkCase, unlinkCase } from "@/lib/actions";
import { ClientFormButton, ConfirmActionButton } from "@/components/admin-widgets";
import { CaseStatusBadge, PageHeader } from "@/components/ui";
import { arNum } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ClientFilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const clientId = Number(id);
  if (!Number.isFinite(clientId)) notFound();
  const [data, lawyers] = await Promise.all([getClientById(clientId), getActiveLawyers()]);
  if (!data) notFound();
  const { client: c, responsible, cases: clientCases, unlinked } = data;

  return (
    <div>
      <Link href="/admin?tab=clients" className="mb-4 inline-flex items-center gap-1.5 text-xs font-bold text-gold-700 hover:underline">
        <ArrowRight className="h-3.5 w-3.5" /> كل العملاء
      </Link>

      <PageHeader title={c.name} subtitle="بيانات العميل وقضاياه — سرية للإدارة فقط">
        <ClientFormButton edit lawyers={lawyers.map((l) => ({ id: l.id, title: l.title, firstName: l.firstName, lastName: l.lastName }))} initial={c} />
      </PageHeader>

      <div className="mb-5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-bold text-red-700">
        <ShieldAlert className="h-4 w-4" /> سرية تامة — لا تشارك هذه البيانات خارج الإدارة
      </div>

      <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
        <div className="card space-y-2.5 p-5 text-xs">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-navy-900"><UserRound className="h-4 w-4 text-gold-600" /> بيانات العميل</h2>
          {[
            ["الهاتف", c.phone ? <span dir="ltr">{c.phone}</span> : "—"],
            ["البريد", c.email ? <span dir="ltr">{c.email}</span> : "—"],
            ["الرقم القومي", c.nationalId ? <span dir="ltr">{c.nationalId}</span> : "—"],
            ["العنوان", c.address ?? "—"],
            ["المحامي المسؤول", responsible ? `${responsible.title} ${responsible.firstName} ${responsible.lastName}` : "—"],
          ].map(([k, v]) => (
            <div key={k as string} className="flex items-start justify-between gap-3 border-b border-line/50 py-2">
              <span className="shrink-0 font-bold text-ink/45">{k}</span>
              <span className="font-semibold text-ink/80">{v}</span>
            </div>
          ))}
          {c.notes && <p className="rounded-lg bg-amber-50 px-3 py-2 leading-6 text-amber-800">{c.notes}</p>}
        </div>

        <div className="space-y-5">
          {/* ربط قضية غير مرتبطة */}
          {unlinked.length > 0 && (
            <form action={linkCase} className="card flex flex-wrap items-center gap-2 border-gold-300 bg-gold-50/60 p-4">
              <input type="hidden" name="clientId" value={c.id} />
              <input type="hidden" name="from" value={`/admin/clients/${c.id}`} />
              <p className="flex items-center gap-1.5 text-xs font-bold text-gold-700"><Link2 className="h-4 w-4" /> ربط قضية غير مرتبطة بهذا العميل:</p>
              <select name="caseId" className="input w-auto flex-1" required defaultValue="">
                <option value="" disabled>— اختر القضية —</option>
                {unlinked.map((uc) => <option key={uc.id} value={uc.id}>{uc.name}{uc.caseNumber ? ` (${uc.caseNumber})` : ""}</option>)}
              </select>
              <button className="btn-gold text-xs">ربط</button>
            </form>
          )}

          <div className="card overflow-hidden">
            <h2 className="border-b border-line bg-navy-950 px-4 py-3 text-sm font-bold text-white">قضايا العميل ({arNum(clientCases.length)})</h2>
            <div className="divide-y divide-line/60">
              {clientCases.length === 0 && <p className="px-4 py-8 text-center text-xs text-ink/40">لا قضايا مرتبطة — يمكن للعميل أن يمتلك أكثر من قضية</p>}
              {clientCases.map((cs) => (
                <div key={cs.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                  <div>
                    <Link href="/case-archive" className="text-[13px] font-bold text-navy-950 hover:text-gold-700">{cs.name}</Link>
                    <p className="text-[10px] text-ink/40">{cs.caseNumber}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CaseStatusBadge status={cs.status} />
                    <ConfirmActionButton action={unlinkCase} fields={{ caseId: cs.id, clientId: c.id }} confirm={`فك ربط «${cs.name}» عن هذا العميل؟`} className="btn-ghost px-2 py-1 text-[10px]">
                      <Unlink className="h-3 w-3" /> فك الربط
                    </ConfirmActionButton>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
