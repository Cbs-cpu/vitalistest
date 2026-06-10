"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-50 bg-vitalis-black border-b border-vitalis-gray-light px-4 py-3">
      <div className="flex items-center justify-between">
        <Link href={session?.user?.role === "ADMIN" ? "/admin" : "/dashboard"} className="flex items-center gap-3">
          <Image
            src="/logo.jpeg"
            alt="Vitalis"
            width={32}
            height={32}
            className="rounded-full object-cover border border-vitalis-green"
          />
          <h1 className="text-lg font-bold text-vitalis-accent tracking-tight">
            VITALIS
          </h1>
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm text-vitalis-white/70 truncate max-w-[120px]">
            {session?.user?.name}
          </span>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-xs text-vitalis-white/50 hover:text-vitalis-accent transition-colors"
          >
            Salir
          </button>
        </div>
      </div>
    </header>
  );
}
