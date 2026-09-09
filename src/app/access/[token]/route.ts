// رابط دخول المحامي الشخصي — Route Handler (تعيين الـcookies مسموح هنا)
import { NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/db";
import { accessTokens, activityLogs, lawyers } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const fail = (e: string) => NextResponse.redirect(new URL(`/access-invalid?e=${e}`, req.url));

  const [row] = await db.select().from(accessTokens).where(eq(accessTokens.token, token)).limit(1);
  if (!row) return fail("invalid");
  if (row.consumedAt) return fail("consumed");
  if (row.expiresAt && row.expiresAt.getTime() < Date.now()) return fail("expired");

  const [lawyer] = await db.select().from(lawyers).where(eq(lawyers.id, row.lawyerId!)).limit(1);
  if (!lawyer || !lawyer.isActive || !lawyer.isApproved) return fail("invalid");

  // استهلاك ذرّي — لو اتستهلك بالفعل من طلب موازٍ يُعامل كمستهلك
  const consumed = await db
    .update(accessTokens)
    .set({ consumedAt: new Date() })
    .where(and(eq(accessTokens.id, row.id), isNull(accessTokens.consumedAt)))
    .returning({ id: accessTokens.id });
  if (consumed.length === 0) return fail("consumed");

  const store = await cookies();
  const opts = { path: "/", maxAge: 60 * 60 * 24 * 30 } as const;
  store.set("lawyerId", String(lawyer.id), opts);
  store.set("lawyerName", encodeURIComponent(`${lawyer.title} ${lawyer.firstName} ${lawyer.lastName}`), opts);
  store.set("role", "LAWYER", opts);

  await db.insert(activityLogs).values({
    action: "login",
    summary: `${lawyer.title} ${lawyer.firstName} ${lawyer.lastName} دخل عبر رابط وصول شخصي`,
    lawyerId: lawyer.id,
    actorName: `${lawyer.title} ${lawyer.firstName} ${lawyer.lastName}`,
  });

  return NextResponse.redirect(new URL("/", req.url));
}
