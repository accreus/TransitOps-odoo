"use client";

import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import { toFrontendRole, toDbRole, type FrontendRole } from "@/lib/constants";
import type { User, UserRole } from "@/types";

function normalizeRole(dbRole: string): UserRole {
  return toFrontendRole(dbRole) as UserRole;
}

function profileToUser(profile: Record<string, unknown>): User {
  return {
    id: profile.id as string,
    name: profile.name as string,
    email: profile.email as string,
    role: normalizeRole(profile.role as string),
    avatar: (profile.avatar as string) ??
      (profile.name as string).split(" ").map((n: string) => n[0]).join(""),
  };
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
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
          user: profileToUser(profile),
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
      return false;
    }

    const { data: profile } = await supabase
      .from("users")
      .select("*")
      .eq("id", data.user.id)
      .single();

    if (profile) {
      set({
        user: profileToUser(profile),
        isAuthenticated: true,
      });
      return true;
    }

    return false;
  },

  signup: async (name, email, password, role) => {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, role } },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data.user) {
      return { success: false, error: "User creation failed" };
    }

    // Insert profile — works because RLS allows auth.uid() = id inserts
    const { error: profileError } = await supabase
      .from("users")
      .insert({
        id: data.user.id,
        email,
        name,
        role: toDbRole(role as FrontendRole),
      });

    if (profileError) {
      return { success: false, error: profileError.message };
    }

    // If we got a session (email confirmation disabled), set auth state
    if (data.session) {
      const { data: profile } = await supabase
        .from("users")
        .select("*")
        .eq("id", data.user.id)
        .single();

      if (profile) {
        set({
          user: profileToUser(profile),
          isAuthenticated: true,
        });
      }
    }

    return { success: true };
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
