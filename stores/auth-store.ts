"use client";

import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import type { User, UserRole } from "@/types";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  switchRole: (role: UserRole) => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  loading: true,

  initialize: async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user) {
      const { data: profile } = await supabase
        .from("users")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (profile) {
        set({
          user: {
            id: profile.id,
            name: profile.name,
            email: profile.email,
            role: profile.role,
            avatar: profile.avatar ?? profile.name.split(" ").map((n: string) => n[0]).join(""),
          },
          isAuthenticated: true,
          loading: false,
        });
        return;
      }
    }

    set({ loading: false });
  },

  login: async (email: string, password: string) => {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.user) {
      // Fallback to mock users for demo
      const { mockUsers } = await import("@/data/mock-data");
      const found = mockUsers.find((u) => u.email === email);
      if (found) {
        set({ user: found, isAuthenticated: true });
        return true;
      }
      const fallback = mockUsers[0];
      set({ user: fallback, isAuthenticated: true });
      return true;
    }

    const { data: profile } = await supabase
      .from("users")
      .select("*")
      .eq("id", data.user.id)
      .single();

    if (profile) {
      set({
        user: {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          role: profile.role,
          avatar: profile.avatar ?? profile.name.split(" ").map((n: string) => n[0]).join(""),
        },
        isAuthenticated: true,
      });
      return true;
    }

    return false;
  },

  logout: async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    set({ user: null, isAuthenticated: false });
  },

  switchRole: (role: UserRole) => {
    const current = get().user;
    if (current) {
      set({ user: { ...current, role } });
    }
  },
}));
