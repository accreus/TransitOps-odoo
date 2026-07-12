"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthStore } from "@/stores";
import { Sidebar } from "./sidebar";
import { Menu, Search } from "lucide-react";
import { cn } from "@/lib/cn";
import { ToastProvider } from "@/components/ui/toast";
import { ShortcutsProvider } from "@/components/ui/shortcuts-provider";
import { NotificationsDropdown } from "./notifications-dropdown";
import { MobileBottomNav } from "./mobile-bottom-nav";
import { SystemFooter } from "./system-footer";
import { LiveClock } from "@/components/ui/live-clock";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  if (!user) return null;

  return (
    <ToastProvider>
    <ShortcutsProvider>
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
            <div className="hidden md:block">
              <LiveClock />
            </div>
            <NotificationsDropdown />
            <div className="h-8 w-8 rounded-sm bg-primary/10 border border-primary/30 flex items-center justify-center">
              <span className="text-xs font-bold text-primary">{user.avatar}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 lg:pb-6 dashboard-vignette">
          {children}
        </main>

        {/* System status footer — inside main content column */}
        <SystemFooter />
      </div>
    </div>
    <MobileBottomNav />
    </ShortcutsProvider>
    </ToastProvider>
  );
}
