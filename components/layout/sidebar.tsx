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
  Wrench,
  Fuel,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  Shield,
  DollarSign,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["fleet_manager", "driver", "safety_officer", "financial_analyst"] },
  { href: "/vehicles", label: "Vehicles", icon: Truck, roles: ["fleet_manager", "safety_officer"] },
  { href: "/drivers", label: "Drivers", icon: Users, roles: ["fleet_manager", "safety_officer"] },
  { href: "/trips", label: "Trips", icon: Route, roles: ["fleet_manager", "driver"] },
  { href: "/maintenance", label: "Maintenance", icon: Wrench, roles: ["fleet_manager", "safety_officer"] },
  { href: "/fuel-expenses", label: "Fuel & Expenses", icon: Fuel, roles: ["fleet_manager", "financial_analyst"] },
  { href: "/reports", label: "Reports", icon: BarChart3, roles: ["fleet_manager", "financial_analyst"] },
  { href: "/settings", label: "Settings", icon: Settings, roles: ["fleet_manager", "driver", "safety_officer", "financial_analyst"] },
];

const roleLabels = {
  fleet_manager: { label: "Fleet Manager", icon: Truck },
  driver: { label: "Driver", icon: Route },
  safety_officer: { label: "Safety Officer", icon: Shield },
  financial_analyst: { label: "Financial Analyst", icon: DollarSign },
};

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  if (!user) return null;

  const filteredNav = navItems.filter((item) => item.roles.includes(user.role));
  const RoleIcon = roleLabels[user.role]?.icon || Truck;

  return (
    <aside
      className={cn(
        "h-full bg-sidebar border-r border-border flex flex-col transition-all duration-200",
        collapsed ? "w-16" : "w-60"
      )}
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Logo */}
      <div className={cn("h-14 flex items-center border-b border-border", collapsed ? "justify-center px-2" : "px-4")}>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-8 w-8 rounded-sm bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
            <Truck className="h-4 w-4 text-primary" aria-hidden="true" />
          </div>
          {!collapsed && (
            <span className="font-display text-sm font-bold uppercase tracking-wider text-foreground truncate">
              TransitOps
            </span>
          )}
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 py-3 overflow-y-auto">
        <ul className="space-y-0.5 px-2" role="list">
          {filteredNav.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-sm text-sm transition-colors",
                    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    isActive
                      ? "bg-sidebar-active text-sidebar-active-foreground sidebar-link-active font-semibold"
                      : "text-sidebar-foreground hover:bg-sidebar-active/50 hover:text-foreground"
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  <item.icon className={cn("h-4 w-4 shrink-0", isActive && "text-primary")} aria-hidden="true" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User info */}
      <div className={cn("border-t border-border p-3", collapsed && "px-2")}>
        {!collapsed && (
          <div className="mb-3 px-2">
            <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <RoleIcon className="h-3 w-3 text-primary" aria-hidden="true" />
              <p className="text-[0.65rem] text-muted-foreground font-display uppercase tracking-wider">
                {roleLabels[user.role]?.label}
              </p>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className={cn(
            "flex items-center gap-3 w-full px-3 py-2 rounded-sm text-sm text-sidebar-foreground",
            "hover:bg-destructive/10 hover:text-destructive transition-colors",
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            collapsed && "justify-center px-2"
          )}
          aria-label="Sign out"
        >
          <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      {onToggle && (
        <button
          onClick={onToggle}
          className={cn(
            "absolute top-4 -right-3 h-6 w-6 rounded-full bg-card border border-border",
            "flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors",
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "hidden lg:flex"
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft className={cn("h-3 w-3 transition-transform", collapsed && "rotate-180")} />
        </button>
      )}
    </aside>
  );
}
