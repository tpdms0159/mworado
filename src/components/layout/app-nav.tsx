"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/today", label: "오늘" },
  { href: "/routines", label: "루틴" },
  { href: "/stats", label: "기록" },
  { href: "/settings", label: "설정" },
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
