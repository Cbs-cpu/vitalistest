"use client";

import { SessionProvider } from "next-auth/react";
import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { Header } from "@/components/Header";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showNav = pathname.startsWith("/dashboard") || pathname.startsWith("/admin");

  return (
    <SessionProvider>
      <div className="flex flex-col min-h-screen max-w-lg mx-auto relative">
        {showNav && <Header />}
        <main className="flex-1 pb-16">{children}</main>
        {showNav && <BottomNav />}
      </div>
    </SessionProvider>
  );
}
