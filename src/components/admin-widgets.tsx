"use client";

// عناصر الإدارة التفاعلية — نماذج ونوافذ وأزرار إجراءات
import { useEffect, useState, useTransition, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Pencil, Plus, X } from "lucide-react";
import {
  createClient, createLawyer, createLocation, createCase,
  updateClient, updateLawyer, updateLocation, updateUserRole,
} from "@/lib/actions";
import { PhotoUpload } from "./admin-extra";
import { cn } from "@/lib/utils";

type Action = (fd: FormData) => Promise<void>;

export type LawyerInitial = {
  id: number; title: string; firstName: string; lastName: string; phone: string | null;
  email: string | null; specialty: string | null; bio: string | null; jobTitle: string | null;
  gmailIdentity: string | null; displayOrder: number; isPrincipal: boolean; photoUrl?: string | null;
};

export type LocationInitial = {
  id: number; name: string; nameEn: string | null; type: string; subtype: string | null;
  governorate: string | null; city: string | null; district: string | null; address: string | null;
  phone: string | null; website: string | null; mapsUrl: string | null; openingHours: string | null;
  services: string[] | null; jurisdiction: string | null; requiresPresence: boolean; onlineService: boolean;
  source: string | null; confidence: string; distanceKm: number | null; description: string | null;
};

export type ClientInitial = {
  id: number; name: string; phone: string | null; email: string | null; nationalId: string | null;
  address: string | null; notes: string | null; responsibleLawyerId: number | null;
};

/**
 * نافذة منبثقة عامة
 */
function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-navy-950/60 p-4 pt-8 backdrop-blur-sm" onClick={onClose}>
      <div className={cn("w-full rounded-2xl border border-line bg-card shadow-2xl", wide ? "max-w-3xl" : "max-w-xl")} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between rounded-t-2xl border-b border-line bg-navy-950 px-5 py-3.5">
          <p className="text-sm font-bold text-white">{title}</p>
          <button onClick={onClose} className="text-white/60 hover:text-white" aria-label="إغلاق"><X className="h-5 w-5" /></button>
        </div>
        <div className="max-h-[76vh] overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

function useSubmit(close: () => void) {
  const [pending, startTransition] = useTransition();
  const pathname = usePathname();
  const router = useRouter();
  const submit = (action: Action, idField?: { name: string; value: number | string }) => (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (idField) fd.set(idField.name, String(idField.value));
    fd.set("from", pathname + (typeof window !== "undefined" ? window.location.search : ""));
    startTransition(async () => {
      await action(fd);
      close();
      router.refresh();
    });
  };
  return { pending, submit };
}

// ---------- نموذج محامٍ (إضافة/تعديل) ----------
export function LawyerFormButton({ initial, edit }: { initial?: LawyerInitial; edit?: boolean }) {
  const [open, setOpen] = useState(false);
  const { pending, submit } = useSubmit(() => setOpen(false));
  return (
    <>
      <button className={edit ? "btn-ghost px-2.5 py-1.5 text-[11px]" : "btn-navy text-xs"} onClick={() => setOpen(true)}>
        {edit ? <><Pencil className="h-3 w-3" /> تعديل</> : <><Plus className="h-4 w-4" /> إضافة محامٍ</>}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={edit ? "تعديل بيانات محامٍ" : "إضافة محامٍ جديد"} wide>
        {edit && initial && (
          <div className="mb-4">
            <PhotoUpload lawyerId={initial.id} current={initial.photoUrl ?? null} />
          </div>
        )}
        <form onSubmit={submit(edit ? updateLawyer : createLawyer, edit && initial ? { name: "lawyerId", value: initial.id } : undefined)} className="grid gap-3.5 sm:grid-cols-2">
          <div>
            <label className="label">اللقب</label>
            <select name="title" defaultValue={initial?.title ?? "محامي"} className="input">
              <option>محامي</option><option>دكتور</option>
            </select>
          </div>
          <div>
            <label className="label">ترتيب العرض</label>
            <input name="displayOrder" type="number" defaultValue={initial?.displayOrder ?? 99} className="input" dir="ltr" />
          </div>
          <div>
            <label className="label">الاسم الأول *</label>
            <input name="firstName" required defaultValue={initial?.firstName ?? ""} className="input" />
          </div>
          <div>
            <label className="label">اسم العائلة *</label>
            <input name="lastName" required defaultValue={initial?.lastName ?? ""} className="input" />
          </div>
          <div>
            <label className="label">الهاتف</label>
            <input name="phone" defaultValue={initial?.phone ?? ""} className="input" dir="ltr" />
          </div>
          <div>
            <label className="label">البريد الإلكتروني</label>
            <input name="email" defaultValue={initial?.email ?? ""} className="input" dir="ltr" />
          </div>
          <div>
            <label className="label">الوظيفة</label>
            <input name="jobTitle" defaultValue={initial?.jobTitle ?? ""} className="input" placeholder="محامٍ أول" />
          </div>
          <div>
            <label className="label">التخصص</label>
            <input name="specialty" defaultValue={initial?.specialty ?? ""} className="input" />
          </div>
          <div>
            <label className="label">هوية Gmail</label>
            <input name="gmailIdentity" defaultValue={initial?.gmailIdentity ?? ""} className="input" dir="ltr" />
          </div>
          <label className="flex items-center gap-2 self-end rounded-xl border border-line bg-paper px-3 py-2.5 text-xs font-bold text-ink/70">
            <input type="checkbox" name="isPrincipal" defaultChecked={initial?.isPrincipal ?? false} className="h-4 w-4 accent-gold-600" />
            محامٍ رئيسي (Principal)
          </label>
          <div className="sm:col-span-2">
            <label className="label">نبذة (Bio)</label>
            <textarea name="bio" rows={3} defaultValue={initial?.bio ?? ""} className="input" />
          </div>
          <div className="flex justify-end gap-2 border-t border-line pt-3.5 sm:col-span-2">
            <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>إلغاء</button>
            <button className="btn-gold" disabled={pending}>{pending ? "جارٍ الحفظ…" : edit ? "حفظ التعديلات" : "إضافة المحامي"}</button>
          </div>
        </form>
      </Modal>
    </>
  );
}

// ---------- نموذج جهة حكومية ----------
export function LocationFormButton({ initial, edit }: { initial?: LocationInitial; edit?: boolean }) {
  const [open, setOpen] = useState(false);
  const { pending, submit } = useSubmit(() => setOpen(false));
  return (
    <>
      <button className={edit ? "btn-ghost px-2.5 py-1.5 text-[11px]" : "btn-navy text-xs"} onClick={() => setOpen(true)}>
        {edit ? <><Pencil className="h-3 w-3" /> تعديل</> : <><Plus className="h-4 w-4" /> إضافة جهة</>}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={edit ? "تعديل جهة" : "إضافة جهة / محكمة جديدة"} wide>
        <form onSubmit={submit(edit ? updateLocation : createLocation, edit && initial ? { name: "locationId", value: initial.id } : undefined)} className="grid gap-3.5 sm:grid-cols-2">
          <div className="sm:col-span-2 grid gap-3.5 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="label">اسم الجهة (عربي) *</label>
              <input name="name" required defaultValue={initial?.name ?? ""} className="input" />
            </div>
            <div>
              <label className="label">النوع</label>
              <select name="type" defaultValue={initial?.type ?? "COURT"} className="input">
                <option value="COURT">محكمة</option><option value="AGENCY">جهة حكومية</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">الاسم الإنجليزي</label>
            <input name="nameEn" defaultValue={initial?.nameEn ?? ""} className="input" dir="ltr" />
          </div>
          <div>
            <label className="label">النوع الفرعي</label>
            <input name="subtype" defaultValue={initial?.subtype ?? ""} className="input" placeholder="محكمة ابتدائية / مأمورية…" />
          </div>
          <div>
            <label className="label">المحافظة</label>
            <input name="governorate" defaultValue={initial?.governorate ?? "الجيزة"} className="input" />
          </div>
          <div>
            <label className="label">المدينة / المنطقة</label>
            <input name="city" defaultValue={initial?.city ?? ""} className="input" />
          </div>
          <div>
            <label className="label">الحي</label>
            <input name="district" defaultValue={initial?.district ?? ""} className="input" />
          </div>
          <div>
            <label className="label">الهاتف</label>
            <input name="phone" defaultValue={initial?.phone ?? ""} className="input" dir="ltr" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">العنوان</label>
            <input name="address" defaultValue={initial?.address ?? ""} className="input" />
          </div>
          <div>
            <label className="label">Google Maps URL</label>
            <input name="mapsUrl" defaultValue={initial?.mapsUrl ?? ""} className="input" dir="ltr" />
          </div>
          <div>
            <label className="label">الموقع الإلكتروني</label>
            <input name="website" defaultValue={initial?.website ?? ""} className="input" dir="ltr" />
          </div>
          <div>
            <label className="label">مواعيد العمل</label>
            <input name="openingHours" defaultValue={initial?.openingHours ?? ""} className="input" placeholder="الأحد – الخميس 8:30ص – 3م" />
          </div>
          <div>
            <label className="label">المسافة من الدقي (كم)</label>
            <input name="distanceKm" type="number" step="0.1" defaultValue={initial?.distanceKm ?? ""} className="input" dir="ltr" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">الخدمات (افصل بفاصلة عربية «،»)</label>
            <input name="services" defaultValue={(initial?.services ?? []).join("، ")} className="input" placeholder="توثيق عقود، نسخ رسمية…" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">الاختصاص</label>
            <input name="jurisdiction" defaultValue={initial?.jurisdiction ?? ""} className="input" />
          </div>
          <div>
            <label className="label">مستوى الثقة</label>
            <select name="confidence" defaultValue={initial?.confidence ?? "NEEDS_VERIFICATION"} className="input">
              <option value="VERIFIED">موثّق</option><option value="HIGH">ثقة عالية</option><option value="MEDIUM">ثقة متوسطة</option>
              <option value="LOW">ثقة منخفضة</option><option value="NEEDS_VERIFICATION">يحتاج تحقق</option>
            </select>
          </div>
          <div>
            <label className="label">مصدر البيانات</label>
            <input name="source" defaultValue={initial?.source ?? ""} className="input" />
          </div>
          <div className="flex gap-3 sm:col-span-2">
            <label className="flex flex-1 items-center gap-2 rounded-xl border border-line bg-paper px-3 py-2.5 text-xs font-bold text-ink/70">
              <input type="checkbox" name="requiresPresence" defaultChecked={initial?.requiresPresence ?? true} className="h-4 w-4 accent-gold-600" />
              الحضور الشخصي مطلوب
            </label>
            <label className="flex flex-1 items-center gap-2 rounded-xl border border-line bg-paper px-3 py-2.5 text-xs font-bold text-ink/70">
              <input type="checkbox" name="onlineService" defaultChecked={initial?.onlineService ?? false} className="h-4 w-4 accent-gold-600" />
              خدمة إلكترونية متاحة
            </label>
          </div>
          <div className="sm:col-span-2">
            <label className="label">الوصف</label>
            <textarea name="description" rows={2} defaultValue={initial?.description ?? ""} className="input" />
          </div>
          <div className="flex justify-end gap-2 border-t border-line pt-3.5 sm:col-span-2">
            <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>إلغاء</button>
            <button className="btn-gold" disabled={pending}>{pending ? "جارٍ الحفظ…" : edit ? "حفظ التعديلات" : "حفظ الجهة (كمسودة)"}</button>
          </div>
        </form>
      </Modal>
    </>
  );
}

// ---------- نموذج عميل (مع إمكانية فتح قضية فوراً) ----------
export function ClientFormButton({ initial, edit, lawyers }: { initial?: ClientInitial; edit?: boolean; lawyers: { id: number; title: string; firstName: string; lastName: string }[] }) {
  const [open, setOpen] = useState(false);
  const [withCase, setWithCase] = useState(false);
  const { pending, submit } = useSubmit(() => setOpen(false));
  return (
    <>
      <button className={edit ? "btn-ghost px-2.5 py-1.5 text-[11px]" : "btn-navy text-xs"} onClick={() => { setWithCase(false); setOpen(true); }}>
        {edit ? <><Pencil className="h-3 w-3" /> تعديل</> : <><Plus className="h-4 w-4" /> إضافة عميل</>}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={edit ? "تعديل بيانات عميل" : "إضافة عميل جديد — بيانات سرية"} wide>
        <form onSubmit={submit(edit ? updateClient : createClient, edit && initial ? { name: "clientId", value: initial.id } : undefined)} className="grid gap-3.5 sm:grid-cols-2">
          <div>
            <label className="label">اسم العميل *</label>
            <input name="name" required defaultValue={initial?.name ?? ""} className="input" />
          </div>
          <div>
            <label className="label">الهاتف</label>
            <input name="phone" defaultValue={initial?.phone ?? ""} className="input" dir="ltr" />
          </div>
          <div>
            <label className="label">البريد الإلكتروني</label>
            <input name="email" defaultValue={initial?.email ?? ""} className="input" dir="ltr" />
          </div>
          <div>
            <label className="label">الرقم القومي</label>
            <input name="nationalId" defaultValue={initial?.nationalId ?? ""} className="input" dir="ltr" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">العنوان</label>
            <input name="address" defaultValue={initial?.address ?? ""} className="input" />
          </div>
          <div>
            <label className="label">المحامي المسؤول</label>
            <select name="responsibleLawyerId" defaultValue={initial?.responsibleLawyerId ?? ""} className="input">
              <option value="">— بدون —</option>
              {lawyers.map((l) => <option key={l.id} value={l.id}>{l.title} {l.firstName} {l.lastName}</option>)}
            </select>
          </div>
          <div>
            <label className="label">ملاحظات</label>
            <input name="notes" defaultValue={initial?.notes ?? ""} className="input" />
          </div>
          {!edit && (
            <>
              <label className="flex items-center gap-2 rounded-xl border border-dashed border-gold-400 bg-gold-50 px-3 py-2.5 text-xs font-bold text-gold-700 sm:col-span-2">
                <input type="checkbox" checked={withCase} onChange={(e) => setWithCase(e.target.checked)} className="h-4 w-4 accent-gold-600" />
                إضافة قضية للعميل الآن
              </label>
              {withCase && (
                <>
                  <div>
                    <label className="label">اسم القضية</label>
                    <input name="caseName" className="input" placeholder="دعوى تعويض عن…" />
                  </div>
                  <div>
                    <label className="label">رقم القضية</label>
                    <input name="caseNumber" className="input" placeholder="1245/2024 مدني" />
                  </div>
                </>
              )}
            </>
          )}
          <div className="flex justify-end gap-2 border-t border-line pt-3.5 sm:col-span-2">
            <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>إلغاء</button>
            <button className="btn-gold" disabled={pending}>{pending ? "جارٍ الحفظ…" : edit ? "حفظ التعديلات" : "إضافة العميل"}</button>
          </div>
        </form>
      </Modal>
    </>
  );
}

// ---------- نموذج قضية ----------
export function CaseFormButton({ clients }: { clients: { id: number; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const { pending, submit } = useSubmit(() => setOpen(false));
  return (
    <>
      <button className="btn-navy text-xs" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> إضافة قضية</button>
      <Modal open={open} onClose={() => setOpen(false)} title="إضافة قضية جديدة">
        <form onSubmit={submit(createCase)} className="grid gap-3.5">
          <div>
            <label className="label">اسم القضية *</label>
            <input name="name" required className="input" />
          </div>
          <div>
            <label className="label">رقم القضية</label>
            <input name="caseNumber" className="input" placeholder="1245/2024 مدني كلي" />
          </div>
          <div>
            <label className="label">العميل</label>
            <select name="clientId" className="input" defaultValue="">
              <option value="">— غير مرتبطة بعد —</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">الوصف</label>
            <textarea name="description" rows={3} className="input" />
          </div>
          <div className="flex justify-end gap-2 border-t border-line pt-3.5">
            <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>إلغاء</button>
            <button className="btn-gold" disabled={pending}>{pending ? "جارٍ الحفظ…" : "فتح ملف القضية"}</button>
          </div>
        </form>
      </Modal>
    </>
  );
}

// ---------- زر إجراء سريع مع تأكيد ----------
export function ConfirmActionButton({ action, fields, confirm, className, children }: {
  action: Action; fields: Record<string, string | number>; confirm?: string; className?: string; children: ReactNode;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  return (
    <button
      className={className}
      disabled={pending}
      onClick={() => {
        if (confirm && !window.confirm(confirm)) return;
        const fd = new FormData();
        for (const [k, v] of Object.entries(fields)) fd.set(k, String(v));
        fd.set("from", pathname + (typeof window !== "undefined" ? window.location.search : ""));
        startTransition(async () => {
          await action(fd);
          router.refresh();
        });
      }}
    >
      {children}
    </button>
  );
}

// ---------- اختيار دور مستخدم ----------
export function UserRoleSelect({ userId, role }: { userId: number; role: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const roles = ["SUPER_ADMIN", "ADMIN", "OFFICE_MANAGER", "LAWYER", "SECRETARY", "VIEWER"];
  const labels: Record<string, string> = { SUPER_ADMIN: "مدير عام", ADMIN: "مدير", OFFICE_MANAGER: "مدير مكتب", LAWYER: "محامي", SECRETARY: "سكرتارية", VIEWER: "قارئ" };
  return (
    <select
      className="input w-32 py-1.5 text-xs font-bold"
      value={role}
      disabled={pending}
      onChange={(e) => {
        const fd = new FormData();
        fd.set("userId", String(userId));
        fd.set("role", e.target.value);
        fd.set("from", "/admin?tab=users");
        startTransition(async () => {
          await updateUserRole(fd);
          router.refresh();
        });
      }}
    >
      {roles.map((r) => <option key={r} value={r}>{labels[r]}</option>)}
    </select>
  );
}
