import { supabase } from "../lib/supabase";

export interface HouseholdMember {
  user_id: string;
  role: string;
  joined_at: string;
}

export class HouseholdService {
  static randomCode() {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let out = "";
    for (let i = 0; i < 6; i++) {
      out += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return out;
  }

  static async createHousehold(userId: string) {
    if (!supabase) return { data: null, error: { message: "Not configured" } };
    const invite_code = this.randomCode();
    const { data, error } = await supabase
      .from("households")
      .insert({ created_by: userId, invite_code })
      .select()
      .single();
    if (error || !data) {
      return { data: null, error: { message: error?.message ?? "Failed" } };
    }
    await supabase.from("household_members").insert({
      household_id: data.id,
      user_id: userId,
      role: "owner",
    });
    await supabase
      .from("profiles")
      .update({ household_id: data.id, updated_at: new Date().toISOString() })
      .eq("id", userId);
    return { data, error: null };
  }

  static async joinHousehold(code: string) {
    if (!supabase) return { data: null, error: { message: "Not configured" } };
    const { data, error } = await supabase.rpc("join_household", {
      p_code: code,
    });
    if (error) {
      return { data: null, error: { message: error.message } };
    }
    return { data: data as string, error: null };
  }

  static async getHousehold(householdId: string) {
    if (!supabase) return { data: null, error: { message: "Not configured" } };
    const { data, error } = await supabase
      .from("households")
      .select("id, invite_code, created_by")
      .eq("id", householdId)
      .maybeSingle();
    if (error) return { data: null, error: { message: error.message } };
    return { data, error: null };
  }

  static async listMembers(householdId: string) {
    if (!supabase) return { data: [] as HouseholdMember[], error: null };
    const { data, error } = await supabase
      .from("household_members")
      .select("user_id, role, joined_at")
      .eq("household_id", householdId);
    if (error) return { data: [] as HouseholdMember[], error: { message: error.message } };
    return { data: (data ?? []) as HouseholdMember[], error: null };
  }

  static async leaveHousehold(userId: string) {
    if (!supabase) return { error: { message: "Not configured" } };
    await supabase.from("household_members").delete().eq("user_id", userId);
    await supabase
      .from("profiles")
      .update({ household_id: null, updated_at: new Date().toISOString() })
      .eq("id", userId);
    return { error: null };
  }
}
