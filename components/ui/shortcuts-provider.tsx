"use client";

import { useEffect, createContext, useContext, useState } from "react";

interface Shortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  description: string;
  handler: () => void;
}

interface ShortcutsContextValue {
  register: (shortcut: Shortcut) => void;
  unregister: (key: string) => void;
  shortcuts: Shortcut[];
}

const ShortcutsContext = createContext<ShortcutsContextValue | null>(null);

export function ShortcutsProvider({ children }: { children: React.ReactNode }) {
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);

  const register = (shortcut: Shortcut) => {
    setShortcuts((prev) => {
      const filtered = prev.filter((s) => s.key !== shortcut.key);
      return [...filtered, shortcut];
    });
  };

  const unregister = (key: string) => {
    setShortcuts((prev) => prev.filter((s) => s.key !== key));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger in input/textarea/select
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT") {
        return;
      }

      shortcuts.forEach((s) => {
        const keyMatch = e.key.toLowerCase() === s.key.toLowerCase();
        const ctrlMatch = s.ctrl ? (e.ctrlKey || e.metaKey) : true;
        const metaMatch = s.meta ? e.metaKey : true;
        const shiftMatch = s.shift ? e.shiftKey : true;

        if (keyMatch && ctrlMatch && metaMatch && shiftMatch) {
          e.preventDefault();
          s.handler();
        }
      });
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts]);

  return (
    <ShortcutsContext.Provider value={{ register, unregister, shortcuts }}>
      {children}
    </ShortcutsContext.Provider>
  );
}

export function useShortcuts() {
  const ctx = useContext(ShortcutsContext);
  if (!ctx) throw new Error("useShortcuts must be used within ShortcutsProvider");
  return ctx;
}

export function useShortcut(key: string, handler: () => void, description: string, opts?: { ctrl?: boolean; shift?: boolean }) {
  const { register, unregister } = useShortcuts();

  useEffect(() => {
    register({ key, handler, description, ...opts });
    return () => unregister(key);
  }, [key, handler, description, opts?.ctrl, opts?.shift, register, unregister]);
}
