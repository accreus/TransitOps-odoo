import { createClient } from "@/lib/supabase/server";
import { toFrontendRole, type FrontendRole, type Resource, type Action, RESOURCE_ROLES } from "@/lib/constants";
import type { ServiceResult } from "@/lib/types";

export interface AuthUser {
  id: string;
  email: string;
  role: FrontendRole;
}

/**
 * Verify the user's session server-side and return their profile.
 * Every server action and API route MUST call this first.
 */
export async function requireAuth(): Promise<ServiceResult<AuthUser>> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return { success: false, error: "User profile not found" };
    }

    const role = toFrontendRole(profile.role);

    return {
      success: true,
      data: { id: user.id, email: user.email ?? "", role },
    };
  } catch (error) {
    console.error("requireAuth error:", error);
    return { success: false, error: "Authentication failed" };
  }
}

/**
 * Require the user to have one of the allowed roles for a given resource + action.
 * Use at the top of every mutation after requireAuth().
 */
export function requireRole(
  userRole: FrontendRole,
  resource: Resource,
  action: Action,
): ServiceResult<true> {
  const resourcePolicy = RESOURCE_ROLES[resource];
  if (!resourcePolicy) {
    return { success: false, error: `Unknown resource: ${resource}` };
  }
  const allowedRoles = (resourcePolicy as Record<string, readonly FrontendRole[]>)[action];
  if (!allowedRoles) {
    return { success: false, error: `Unknown action: ${action} on ${resource}` };
  }
  if (allowedRoles.includes(userRole)) {
    return { success: true, data: true };
  }
  return {
    success: false,
    error: `Forbidden: ${userRole} cannot ${action} ${resource}`,
  };
}
