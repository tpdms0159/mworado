"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

// M2 기준으로 아직 만들어진 화면(오늘/루틴)만 링크한다.
// /stats, /settings가 생기면(M3, M4) 여기에 추가한다.
const NAV_ITEMS = [
  { href: "/today", label: "오늘" },
  { href: "/routines", label: "루틴" },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="mx-auto flex w-full max-w-md gap-1 px-4">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-full px-3 py-1 text-sm transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
