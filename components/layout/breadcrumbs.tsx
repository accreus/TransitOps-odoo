"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/cn";

const routeLabels: Record<string, string> = {
  dashboard: "Dashboard",
  vehicles: "Vehicles",
  drivers: "Drivers",
  trips: "Trips",
  maintenance: "Maintenance",
  "fuel-expenses": "Fuel & Expenses",
  reports: "Reports",
  settings: "Settings",
};

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  const crumbs: BreadcrumbItem[] = items || [
    { label: "Home", href: "/dashboard" },
    ...segments.map((seg, i) => ({
      label: routeLabels[seg] || seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " "),
      href: i < segments.length - 1 ? `/${segments.slice(0, i + 1).join("/")}` : undefined,
    })),
  ];

  if (crumbs.length <= 1) return null;

  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center gap-1 text-xs", className)}>
      {crumbs.map((crumb, i) => (
        <div key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground/40" aria-hidden="true" />}
          {crumb.href ? (
            <Link
              href={crumb.href}
              className="text-muted-foreground hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm px-1 py-0.5"
            >
              {i === 0 && <Home className="h-3 w-3 inline mr-1" aria-hidden="true" />}
              {crumb.label}
            </Link>
          ) : (
            <span className="text-foreground font-semibold px-1 py-0.5">{crumb.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}
