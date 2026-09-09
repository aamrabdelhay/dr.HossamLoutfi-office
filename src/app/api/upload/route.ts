// رفع الصور الآمن — تحقق من النوع والحجم، تخزين مخصص
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const MAX_BYTES = 2 * 1024 * 1024; // ٢ ميجابايت
const ALLOWED: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

export async function POST(req: Request) {
  try {
    const fd = await req.formData();
    const file = fd.get("file");
    if (!(file instanceof File)) {
      return Response.json({ ok: false, error: "لا ملف مرفق" }, { status: 400 });
    }
    const ext = ALLOWED[file.type];
    if (!ext) {
      return Response.json({ ok: false, error: "النوع غير مسموح — PNG / JPG / WebP فقط" }, { status: 415 });
    }
    if (file.size > MAX_BYTES) {
      return Response.json({ ok: false, error: "الحجم الأقصى ٢ ميجابايت" }, { status: 413 });
    }
    const name = `${Date.now().toString(36)}-${crypto.randomBytes(6).toString("hex")}.${ext}`;
    const dir = path.join(process.cwd(), "uploads");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
    return Response.json({ ok: true, url: `/api/uploads/${name}` });
  } catch (e) {
    return Response.json({ ok: false, error: e instanceof Error ? e.message : "فشل الرفع" }, { status: 500 });
  }
}
