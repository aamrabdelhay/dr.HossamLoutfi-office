import type { ReactNode } from "react";
import { NavShell } from "@/components/nav-shell";
import { SessionRail } from "@/components/session-rail";
import { TopBar } from "@/components/topbar";

export const dynamic = "force-dynamic";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <NavShell />
      <SessionRail />
      <TopBar />
      <div className="min-h-screen pb-20 pt-14 lg:pb-6 lg:pl-64 lg:pr-60">
        <main className="mx-auto w-full max-w-[1200px] px-4 py-5 sm:px-6">{children}</main>
      </div>
    </>
  );
}
