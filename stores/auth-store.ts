"use client";

import { create } from "zustand";
import type { User, UserRole } from "@/types";
import { mockUsers } from "@/data/mock-data";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  switchRole: (role: UserRole) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  login: (email: string, _password: string) => {
    const found = mockUsers.find((u) => u.email === email);
    if (found) {
      set({ user: found, isAuthenticated: true });
      return true;
    }
    const fallback = mockUsers[0];
    set({ user: fallback, isAuthenticated: true });
    return true;
  },
  logout: () => set({ user: null, isAuthenticated: false }),
  switchRole: (role: UserRole) => {
    const current = get().user;
    if (current) {
      const updated = { ...current, role };
      set({ user: updated });
    }
  },
}));
