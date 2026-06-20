import { supabase } from "@/integrations/supabase/client";
import { ensureUserAccessProfile, getRouteForAccessState } from "@/lib/accessControl";
import type { User } from "@supabase/supabase-js";

export type AppRole = "admin" | "user";

export const getUserRoles = async (userId: string): Promise<AppRole[]> => {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => row.role as AppRole);
};

export const hasUserRole = async (userId: string, role: AppRole): Promise<boolean> => {
  const roles = await getUserRoles(userId);
  return roles.includes(role);
};

export const getDefaultRouteForUser = async (userId: string): Promise<string> => {
  try {
    // New users have no user_preferences row; existing users have onboarding_completed = true.
    const { data: prefs } = await supabase
      .from("user_preferences")
      .select("onboarding_completed")
      .eq("user_id", userId)
      .maybeSingle();

    if (!prefs || (prefs as any).onboarding_completed === false) {
      return "/app/onboarding";
    }

    const { data } = await supabase.auth.getUser();
    const authUser = data.user && data.user.id === userId ? data.user : null;

    if (authUser) {
      const accessState = await ensureUserAccessProfile(authUser as User);
      return getRouteForAccessState(accessState);
    }
  } catch {
    // Fall back to default route
  }

  return "/app/dashboard";
};
