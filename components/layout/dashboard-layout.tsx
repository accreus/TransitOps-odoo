"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore, useVehicleStore, useDriverStore, useTripStore } from "@/stores";
import { Sidebar } from "./sidebar";
import { Menu, Bell, Search, AlertTriangle, Wrench, Clock, X } from "lucide-react";
import { cn } from "@/lib/cn";

interface Notification {
  id: string;
  type: "warning" | "info" | "error";
  title: string;
  detail: string;
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifsOpen, setNotifsOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const loading = useAuthStore((s) => s.loading);
  const initialize = useAuthStore((s) => s.initialize);
  const vehicles = useVehicleStore((s) => s.vehicles);
  const drivers = useDriverStore((s) => s.drivers);
  const trips = useTripStore((s) => s.trips);
  const fetchVehicles = useVehicleStore((s) => s.fetchAll);
  const fetchDrivers = useDriverStore((s) => s.fetchAll);
  const fetchTrips = useTripStore((s) => s.fetchAll);
  const router = useRouter();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchVehicles();
      fetchDrivers();
      fetchTrips();
    }
  }, [isAuthenticated, fetchVehicles, fetchDrivers, fetchTrips]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifsOpen(false);
      }
    }
    if (notifsOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [notifsOpen]);

  const notifications: Notification[] = [];

  // Vehicles in shop
  vehicles.filter(v => v.status === "in_shop").forEach(v => {
    notifications.push({
      id: `shop-${v.id}`,
      type: "warning",
      title: "Vehicle In Maintenance",
      detail: `${v.regNumber} — ${v.make} ${v.model}`,
    });
  });

  // Drivers with expiring licenses (within 30 days)
  const now = new Date();
  drivers.forEach(d => {
    const expiry = new Date(d.licenseExpiry);
    const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 30 && daysLeft > 0) {
      notifications.push({
        id: `license-${d.id}`,
        type: "error",
        title: "License Expiring Soon",
        detail: `${d.name} — expires in ${daysLeft} days`,
      });
    } else if (daysLeft <= 0) {
      notifications.push({
        id: `license-${d.id}`,
        type: "error",
        title: "License Expired",
        detail: `${d.name} — expired ${Math.abs(daysLeft)} days ago`,
      });
    }
  });

  // Active trips
  const activeTrips = trips.filter(t => t.status === "dispatched" || t.status === "in_transit");
  if (activeTrips.length > 0) {
    notifications.push({
      id: "active-trips",
      type: "info",
      title: `${activeTrips.length} Active Trip${activeTrips.length > 1 ? "s" : ""}`,
      detail: activeTrips.map(t => t.tripNumber).join(", "),
    });
  }

  // Draft trips pending dispatch
  const draftTrips = trips.filter(t => t.status === "draft");
  if (draftTrips.length > 0) {
    notifications.push({
      id: "draft-trips",
      type: "info",
      title: `${draftTrips.length} Trip${draftTrips.length > 1 ? "s" : ""} Pending Dispatch`,
      detail: draftTrips.map(t => t.tripNumber).join(", "),
    });
  }

  const unread = notifications.length;

  if (loading || !user) return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="text-sm text-muted-foreground font-mono animate-pulse">LOADING...</div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar - desktop */}
      <div className={cn(
        "hidden lg:block relative flex-shrink-0",
        sidebarCollapsed ? "w-16" : "w-60"
      )}>
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      </div>

      {/* Sidebar - mobile */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 lg:hidden transition-transform duration-200",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <Sidebar collapsed={false} onToggle={() => setMobileOpen(false)} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 flex items-center justify-between px-4 border-b border-border bg-card/50 backdrop-blur-sm flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 bg-secondary/50 rounded-sm px-3 py-1.5 w-64">
              <Search className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
              <input
                type="search"
                placeholder="Search vehicles, trips, drivers..."
                className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 outline-none w-full"
                aria-label="Global search"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifsOpen(!notifsOpen)}
                className="relative p-2 text-muted-foreground hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ""}`}
                aria-expanded={notifsOpen}
              >
                <Bell className="h-4 w-4" />
                {unread > 0 && (
                  <span className="absolute top-1 right-1 h-2 w-2 bg-destructive rounded-full" />
                )}
              </button>

              {notifsOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-sm shadow-lg z-50">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                    <span className="text-xs font-display font-semibold uppercase tracking-wider text-foreground">
                      Notifications
                    </span>
                    <button
                      onClick={() => setNotifsOpen(false)}
                      className="p-1 text-muted-foreground hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
                      aria-label="Close notifications"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-3 py-6 text-center">
                        <p className="text-xs text-muted-foreground">No notifications</p>
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          className={cn(
                            "px-3 py-2.5 border-b border-border last:border-0 flex items-start gap-2.5",
                            n.type === "error" && "bg-destructive/5",
                          )}
                        >
                          {n.type === "warning" && <Wrench className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />}
                          {n.type === "error" && <AlertTriangle className="h-3.5 w-3.5 text-destructive mt-0.5 shrink-0" />}
                          {n.type === "info" && <Clock className="h-3.5 w-3.5 text-blue-500 mt-0.5 shrink-0" />}
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-foreground">{n.title}</p>
                            <p className="text-[0.65rem] text-muted-foreground font-mono mt-0.5 truncate">{n.detail}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="h-8 w-8 rounded-sm bg-primary/10 border border-primary/30 flex items-center justify-center">
              <span className="text-xs font-bold text-primary">{user.avatar}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 dashboard-vignette">
          {children}
        </main>
      </div>
    </div>
  );
}
