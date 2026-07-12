"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Bell, Truck, AlertTriangle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import { useVehicleStore, useDriverStore } from "@/stores";
import { differenceInDays } from "date-fns";

interface Notification {
  id: string;
  message: string;
  type: "warning" | "info" | "success";
  time: string;
  read: boolean;
}

export function NotificationsDropdown() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const vehicles = useVehicleStore((s) => s.vehicles);
  const drivers = useDriverStore((s) => s.drivers);

  const computedNotifications = useMemo(() => {
    const items: Notification[] = [];
    const now = new Date("2026-07-12");

    drivers.forEach((d) => {
      const days = differenceInDays(new Date(d.licenseExpiry), now);
      if (days < 90 && days > 0) {
        items.push({
          id: `lic-${d.id}`,
          message: `${d.name}'s license expires in ${days} days`,
          type: days < 30 ? "warning" : "info",
          time: `${days}d remaining`,
          read: false,
        });
      }
    });

    vehicles.filter((v) => v.status === "in_shop").forEach((v) => {
      items.push({
        id: `shop-${v.id}`,
        message: `${v.regNumber} is currently in the shop`,
        type: "info",
        time: "Active",
        read: false,
      });
    });

    return items.slice(0, 8);
  }, [vehicles, drivers]);

  const [readState, setReadState] = useState<Record<string, boolean>>({});
  const notifications = useMemo(
    () => computedNotifications.map((n) => ({ ...n, read: readState[n.id] ?? n.read })),
    [computedNotifications, readState]
  );
  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  const markAllRead = () => {
    const allRead: Record<string, boolean> = {};
    notifications.forEach((n) => { allRead[n.id] = true; });
    setReadState(allRead);
  };

  const typeIcon = (type: string) => {
    switch (type) {
      case "warning": return <AlertTriangle className="h-4 w-4 text-primary" aria-hidden="true" />;
      case "success": return <CheckCircle className="h-4 w-4 text-status-available" aria-hidden="true" />;
      default: return <Truck className="h-4 w-4 text-status-on-trip" aria-hidden="true" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-muted-foreground hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-2 w-2 bg-destructive rounded-full animate-pulse" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-sm shadow-xl z-50 animate-stagger-in">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
            <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-foreground">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-[0.65rem] text-primary hover:text-primary/80 font-display uppercase tracking-wider transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto divide-y divide-border/50">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <CheckCircle className="h-6 w-6 text-status-available/40 mx-auto mb-2" aria-hidden="true" />
                <p className="text-xs text-muted-foreground">All clear — no notifications</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    "px-4 py-3 flex items-start gap-3 transition-colors",
                    !n.read && "bg-primary/5"
                  )}
                >
                  <div className="mt-0.5 shrink-0">{typeIcon(n.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-xs", !n.read ? "text-foreground font-semibold" : "text-muted-foreground")}>
                      {n.message}
                    </p>
                    <p className="text-[0.6rem] text-muted-foreground/60 mt-0.5 font-mono">{n.time}</p>
                  </div>
                  {!n.read && (
                    <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" aria-label="Unread" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
