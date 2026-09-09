// بوابة الدخول — 4 أوضاع: محامي، تسجيل أول مرة، إدارة، متدرب
import { getActiveLawyers } from "@/lib/queries";
import { AuthTabs } from "@/components/auth-tabs";
import { PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AuthPage({ searchParams }: { searchParams: Promise<{ mode?: string; ok?: string }> }) {
  const { mode, ok } = await searchParams;
  const lawyers = await getActiveLawyers();

  return (
    <div>
      <div className="mx-auto max-w-xl">
        <PageHeader title="بوابة الدخول" subtitle="دخول المحامين المعتمدين، تسجيل محامٍ جديد، الدخول برابط خاص، أو دخول الإدارة" />
        <AuthTabs
          lawyers={lawyers.map((l) => ({ id: l.id, title: l.title, firstName: l.firstName, lastName: l.lastName, specialty: l.specialty }))}
          initialMode={mode}
          ok={ok}
        />
      </div>
    </div>
  );
}
