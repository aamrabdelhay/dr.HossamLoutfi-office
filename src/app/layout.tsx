import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "مكتب د. حسام لطفي — نظام تشغيل المكتب", template: "%s | مكتب د. حسام لطفي" },
  description: "نظام إدارة وتشغيل داخلي: الجلسات والتكليفات والمحامون والجهات الحكومية والعملاء والقضايا.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
