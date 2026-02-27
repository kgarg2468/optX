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
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-white/5 bg-black/20 backdrop-blur-3xl">
      <div className="flex h-20 items-center gap-3 border-b border-white/5 px-8">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 border border-white/10 shadow-lg">
          <Zap className="h-5 w-5 text-white" />
        </div>
        <span className="text-xl font-bold tracking-[0.1em] text-white uppercase italic">
          OptX
        </span>
      </div>

      <nav className="flex-1 space-y-1.5 px-4 py-8">
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
                "flex items-center gap-4 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-widest transition-all duration-500",
                isActive
                  ? "bg-white/5 text-white shadow-[0_0_20px_rgba(255,255,255,0.05)] border border-white/10"
                  : "text-white/40 hover:text-white/80 hover:bg-white/5"
              )}
            >
              <item.icon className={cn("h-4 w-4", isActive ? "text-white" : "text-white/40")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/5 p-6">
        <Link
          href="/settings"
          className="flex items-center gap-4 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-widest text-white/40 transition-all duration-500 hover:bg-white/5 hover:text-white/80"
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
      </div>
    </aside>
  );
}
