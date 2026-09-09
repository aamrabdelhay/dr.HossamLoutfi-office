// إعادة توجيه دليل المحامي إلى ملف الجهة التفصيلي
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LawyerGuideDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  redirect(`/locations/${slug}`);
}
