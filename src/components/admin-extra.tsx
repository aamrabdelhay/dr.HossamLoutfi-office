"use client";

// أدوات إدارة إضافية: رابط دخول المحامي، رفع صورة المحامي، تشغيل الـCron، إعادة توليد البيانات
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Copy, Link2, MailCheck, Play, RefreshCw, UploadCloud, X } from "lucide-react";
import { generateAccessLink, runEmailCronNow, runReseed, updateLawyerPhoto } from "@/lib/actions";
import { cn } from "@/lib/utils";

// ---------- رابط دخول شخصي للمحامي ----------
export function AccessLinkButton({ lawyerId }: { lawyerId: number }) {
  const [url, setUrl] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const full = url ? `${typeof window !== "undefined" ? window.location.origin : ""}${url}` : "";

  return (
    <>
      <button
        className="btn-ghost px-2 py-1 text-[10px]"
        disabled={pending}
        title="توليد رابط دخول شخصي (صلاحية ٧ أيام — يدوّر القديم)"
        onClick={() => {
          const fd = new FormData();
          fd.set("lawyerId", String(lawyerId));
          startTransition(async () => {
            const res = await generateAccessLink(fd);
            if (res.ok && res.url) setUrl(res.url);
          });
        }}
      >
        <Link2 className="h-3 w-3" /> رابط دخول
      </button>
      {url && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-navy-950/60 p-4 backdrop-blur-sm" onClick={() => setUrl(null)}>
          <div className="w-full max-w-md rounded-xl border border-line bg-card p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <p className="flex items-center gap-2 text-sm font-bold text-navy-950"><Link2 className="h-4 w-4 text-gold-600" /> رابط الدخول الشخصي جاهز</p>
              <button onClick={() => setUrl(null)} className="text-ink/40 hover:text-ink"><X className="h-4 w-4" /></button>
            </div>
            <p className="text-xs leading-5 text-ink/55">
              صالح لمدة <strong>٧ أيام</strong> ويُستهلك بعد أول دخول. أي رابط أقدم لهذا المحامي أُلغي تلقائياً (تدوير).
            </p>
            <div className="mt-3 flex items-center gap-2">
              <code className="flex-1 truncate rounded-lg border border-line bg-paper px-3 py-2 text-[11px] font-bold text-navy-900" dir="ltr">{full}</code>
              <button
                className="btn-gold px-3 py-2 text-xs"
                onClick={async () => {
                  await navigator.clipboard.writeText(full);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
              >
                <Copy className="h-4 w-4" /> {copied ? "نُسخ!" : "نسخ"}
              </button>
            </div>
            <a href={url} target="_blank" rel="noreferrer" className="btn-ghost mt-3 w-full text-xs">تجربة الرابط في تبويب جديد</a>
          </div>
        </div>
      )}
    </>
  );
}

// ---------- رفع الصورة الشخصية ----------
export function PhotoUpload({ lawyerId, current }: { lawyerId: number; current: string | null }) {
  const [photo, setPhoto] = useState(current);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  return (
    <div className="flex items-center gap-3 rounded-lg border border-dashed border-line bg-paper/60 p-3">
      <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full bg-navy-900 text-gold-300 ring-2 ring-line">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="الصورة الشخصية" className="h-full w-full object-cover" />
        ) : (
          <UploadCloud className="h-5 w-5" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold text-ink/60">الصورة الشخصية — PNG / JPG / WebP بحد أقصى ٢ ميجابايت</p>
        {error && <p className="mt-0.5 text-[10px] font-bold text-danger-600">{error}</p>}
        <button
          type="button"
          className="btn-ghost mt-1.5 px-2.5 py-1 text-[10.5px]"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? "جارٍ الرفع…" : photo ? "تغيير الصورة" : "رفع صورة"}
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setBusy(true);
          setError(null);
          try {
            const fd = new FormData();
            fd.set("file", file);
            const res = await fetch("/api/upload", { method: "POST", body: fd });
            const data = (await res.json()) as { ok: boolean; url?: string; error?: string };
            if (!data.ok || !data.url) {
              setError(data.error ?? "فشل الرفع");
              return;
            }
            const save = new FormData();
            save.set("lawyerId", String(lawyerId));
            save.set("photoUrl", data.url);
            await updateLawyerPhoto(save);
            setPhoto(data.url);
            router.refresh();
          } finally {
            setBusy(false);
            e.target.value = "";
          }
        }}
      />
    </div>
  );
}

// ---------- تشغيل دورة تذكيرات البريد يدوياً ----------
export function RunCronButton() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);
  const router = useRouter();
  return (
    <div className="flex items-center gap-2">
      <button
        className="btn-navy px-3 py-2 text-xs"
        disabled={pending}
        onClick={() => {
          startTransition(async () => {
            const r = await runEmailCronNow();
            setResult(`فُحص ${r.checked} موعداً — أُرسل ${r.sent} تذكيراً`);
            router.refresh();
          });
        }}
      >
        <MailCheck className={cn("h-4 w-4", pending && "animate-pulse")} />
        {pending ? "جارٍ التشغيل…" : "تشغيل التذكيرات البريدية الآن"}
      </button>
      {result && <span className="text-[11px] font-bold text-ok-700">{result}</span>}
    </div>
  );
}

// ---------- إعادة توليد البيانات التجريبية ----------
export function ReseedButton() {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        className="btn-danger px-3 py-2 text-xs"
        disabled={pending}
        onClick={() => {
          if (!confirm("سيتم مسح كل البيانات الحالية واستبدالها بالبيانات التجريبية. متابعة؟")) return;
          startTransition(async () => {
            const r = await runReseed();
            setMsg(r.ok ? "تمت إعادة توليد البيانات التجريبية بنجاح" : `فشل: ${r.error ?? ""}`);
            router.refresh();
          });
        }}
      >
        <RefreshCw className={cn("h-4 w-4", pending && "animate-spin")} />
        {pending ? "جارٍ إعادة التوليد…" : "إعادة توليد البيانات التجريبية"}
      </button>
      {msg && <span className="text-[11px] font-bold text-ink/60">{msg}</span>}
    </div>
  );
}

export { Play };
