"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { useAuthStore } from "@/stores";
import {
  LayoutDashboard,
  Truck,
  Users,
  Route,
  Fuel,
  BarChart3,
} from "lucide-react";

const mobileNavItems = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/vehicles", label: "Vehicles", icon: Truck },
  { href: "/drivers", label: "Drivers", icon: Users },
  { href: "/trips", label: "Trips", icon: Route },
  { href: "/fuel-expenses", label: "Fuel", icon: Fuel },
  { href: "/reports", label: "Reports", icon: BarChart3 },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);

  if (!user) return null;

  const filtered = mobileNavItems.filter((item) => {
    const roleNav: Record<string, string[]> = {
      fleet_manager: mobileNavItems.map((i) => i.href),
      driver: ["/dashboard", "/trips"],
      safety_officer: ["/dashboard", "/vehicles", "/drivers", "/maintenance"],
      financial_analyst: ["/dashboard", "/fuel-expenses", "/reports"],
    };
    return roleNav[user.role]?.includes(item.href);
  });

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 bg-card border-t border-border lg:hidden pb-[env(safe-area-inset-bottom)]"
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around h-14">
        {filtered.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1.5 min-w-[48px] rounded-sm transition-colors",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <item.icon className="h-4 w-4" aria-hidden="true" />
              <span className="text-[0.55rem] font-display uppercase tracking-wider">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
