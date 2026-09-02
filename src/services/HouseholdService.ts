import { supabase } from "../lib/supabase";

export interface HouseholdMember {
  user_id: string;
  role: string;
  joined_at: string;
}

export type HouseholdMemberView = HouseholdMember & {
  displayName: string;
  email: string | null;
  initial: string;
};

export function householdInviteMessage(code: string): string {
  const normalized = normalizeInviteCode(code);
  return [
    `Join my home on HomeKeep with this invite code: ${normalized}`,
    "",
    "In the app: Settings → Household sharing → enter the code.",
  ].join("\n");
}

export function normalizeInviteCode(code: string): string {
  return code.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

export function memberDisplayName({
  fullName,
  email,
  isSelf,
}: {
  fullName?: string | null;
  email?: string | null;
  isSelf?: boolean;
}): string {
  const name = fullName?.trim();
  if (name) return isSelf ? `${name} (you)` : name;
  const mail = email?.trim();
  if (mail) return isSelf ? `${mail} (you)` : mail;
  return isSelf ? "You" : "Household member";
}

function memberInitial(displayName: string): string {
  const letter = displayName.replace(/\(you\)/i, "").trim().charAt(0);
  return letter ? letter.toUpperCase() : "?";
}

export function memberShortName(
  member: HouseholdMemberView,
  currentUserId?: string | null
): string {
  if (currentUserId && member.user_id === currentUserId) return "You";
  const cleaned = member.displayName.replace(/\s*\(you\)\s*/gi, "").trim();
  const first = cleaned.split(/\s+/)[0];
  return first || cleaned || "Member";
}

export function formatHouseholdPeople(
  members: HouseholdMemberView[],
  currentUserId?: string | null
): string {
  const names = members.map((member) => memberShortName(member, currentUserId));
  if (names.length === 0) return "";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
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
    await supabase
      .from("maintenance_routines")
      .update({ household_id: data.id })
      .eq("user_id", userId);
    await supabase
      .from("equipment_manuals")
      .update({ household_id: data.id })
      .eq("user_id", userId);
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

  static async listMembersDetailed(
    householdId: string,
    self?: { id: string; fullName?: string | null; email?: string | null }
  ): Promise<{ data: HouseholdMemberView[]; error: { message: string } | null }> {
    const listed = await this.listMembers(householdId);
    if (listed.error) {
      return { data: [], error: listed.error };
    }
    const rows = listed.data ?? [];
    const ids = rows.map((row) => row.user_id);
    const labels = new Map<
      string,
      { fullName: string | null; email: string | null }
    >();

    if (supabase && ids.length > 0) {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", ids);
      if (!error) {
        for (const row of data ?? []) {
          labels.set(row.id, {
            fullName: typeof row.full_name === "string" ? row.full_name : null,
            email: typeof row.email === "string" ? row.email : null,
          });
        }
      }
    }

    if (self?.id) {
      const existing = labels.get(self.id);
      labels.set(self.id, {
        fullName: existing?.fullName || self.fullName || null,
        email: existing?.email || self.email || null,
      });
    }

    const views: HouseholdMemberView[] = rows.map((row) => {
      const isSelf = row.user_id === self?.id;
      const info = labels.get(row.user_id);
      const displayName = memberDisplayName({
        fullName: info?.fullName,
        email: info?.email,
        isSelf,
      });
      return {
        ...row,
        displayName,
        email: info?.email ?? null,
        initial: memberInitial(displayName),
      };
    });

    views.sort((a, b) => {
      if (a.role === "owner" && b.role !== "owner") return -1;
      if (b.role === "owner" && a.role !== "owner") return 1;
      return a.displayName.localeCompare(b.displayName);
    });

    return { data: views, error: null };
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
