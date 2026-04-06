import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export type AccessRole = "therapist" | "patient";
export type AccessPaymentStatus = "trial" | "active" | "locked";

export type AccessState = {
  user_id: string;
  role: AccessRole;
  stored_payment_status: AccessPaymentStatus;
  effective_payment_status: AccessPaymentStatus;
  registration_date: string;
  trial_ends_at: string;
  linked_therapist_id: string | null;
  therapist_code: string | null;
  covered_by_therapist: boolean;
  can_submit_payment_request: boolean;
  is_locked: boolean;
  lock_message: string | null;
};

const normalizeRole = (value?: unknown): AccessRole | null => {
  if (value === "therapist" || value === "patient") return value;
  return null;
};

const normalizeTherapistCode = (value?: unknown) => {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return /^[0-9]{6}$/.test(normalized) ? normalized : null;
};

export const fetchMyAccessState = async (): Promise<AccessState> => {
  const { data, error } = await (supabase as any).rpc("get_my_access_state");

  if (error) throw error;

  const result = Array.isArray(data) ? data[0] : data;
  if (!result) {
    throw new Error("Access state not found");
  }

  return result as AccessState;
};

export const ensureUserAccessProfile = async (
  user: Pick<User, "id" | "user_metadata">,
  fallbackRole?: AccessRole,
) => {
  try {
    return await fetchMyAccessState();
  } catch {
    const metadataRole = normalizeRole(user.user_metadata?.intended_role);
    const role = metadataRole ?? fallbackRole ?? "patient";
    const therapistCode = role === "patient"
      ? normalizeTherapistCode(user.user_metadata?.therapist_code)
      : null;

    const { error } = await (supabase as any).rpc("initialize_user_access", {
      p_role: role,
      p_therapist_code: therapistCode,
    });

    if (error) throw error;

    return await fetchMyAccessState();
  }
};

export const getRouteForAccessState = (accessState: Pick<AccessState, "role">) => {
  return accessState.role === "therapist" ? "/app/professional/dashboard" : "/app/dashboard";
};