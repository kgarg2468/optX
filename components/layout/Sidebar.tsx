"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Database,
  Play,
  FileText,
  Settings,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/data", label: "Data", icon: Database },
  { href: "/simulate", label: "Simulate", icon: Play },
  { href: "/report", label: "Reports", icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-60 flex-col border-r border-white/5 bg-[#1A1A1A]/60 backdrop-blur-2xl">
      <div className="flex h-14 items-center gap-2 border-b border-white/5 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
          <Zap className="h-4 w-4 text-white" />
        </div>
        <span className="text-lg font-semibold tracking-tight text-white">
          OptX
        </span>
      </div>

      <nav className="flex-1 space-y-2 px-3 py-6">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300",
                isActive
                  ? "bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.05)]"
                  : "text-white/50 hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/5 p-4">
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/50 transition-all duration-300 hover:bg-white/5 hover:text-white"
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
      </div>
    </aside>
  );
}
