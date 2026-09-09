// Cron endpoint — يُستدعى مرتين يومياً من الجدولة الخارجية، أو يدوياً من الإدارة
import { runEmailReminders } from "@/lib/email-cron";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const { searchParams } = new URL(req.url);
    const ok = req.headers.get("authorization") === `Bearer ${secret}` || searchParams.get("secret") === secret;
    if (!ok) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const result = await runEmailReminders();
  return Response.json({ ok: true, ...result });
}
