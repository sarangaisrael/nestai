import { supabase } from "@/integrations/supabase/client";
import { ensureUserAccessProfile, getRouteForAccessState } from "@/lib/accessControl";
import type { User } from "@supabase/supabase-js";

export type AppRole = "admin" | "therapist" | "user";

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

export const isApprovedTherapist = async (userId: string): Promise<boolean> => {
  const [roleResult, registrationResult] = await Promise.all([
    hasUserRole(userId, "therapist"),
    supabase
      .from("therapist_registrations")
      .select("status")
      .eq("user_id", userId)
      .eq("status", "approved")
      .maybeSingle(),
  ]);

  if (registrationResult.error) {
    throw registrationResult.error;
  }

  return roleResult && registrationResult.data?.status === "approved";
};

export const getDefaultRouteForUser = async (userId: string): Promise<string> => {
  try {
    const { data } = await supabase.auth.getUser();
    const authUser = data.user && data.user.id === userId ? data.user : null;

    if (authUser) {
      const accessState = await ensureUserAccessProfile(authUser as User);
      return getRouteForAccessState(accessState);
    }
  } catch {
    // Fall back to legacy role logic for older accounts.
  }

  const roles = await getUserRoles(userId);

  if (roles.includes("therapist")) {
    return "/app/professional/dashboard";
  }

  return "/app/dashboard";
};