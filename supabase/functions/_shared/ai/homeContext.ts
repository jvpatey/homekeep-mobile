// deno-lint-ignore-file no-explicit-any
/**
 * Facts about the caller's home for grounding model answers. Reads go
 * through the caller's RLS-scoped client, so household members see the
 * shared home and nobody sees anyone else's.
 */

const EMERGENCY_LABELS: Record<string, string> = {
  waterShutoff: "Main water shutoff",
  waterHeater: "Water heater",
  breakerPanel: "Breaker panel",
  gasShutoff: "Gas shutoff",
};

export interface HomeContext {
  text: string;
  equipmentNames: Record<string, string>;
  emergencyLabels: string[];
}

function line(parts: (string | null | undefined | false)[]): string {
  return parts.filter(Boolean).join(" · ");
}

function emergencySpots(raw: any): { label: string; text: string }[] {
  if (!raw || typeof raw !== "object") return [];
  const spots: { label: string; text: string }[] = [];
  const add = (label: string, spot: any) => {
    const note = typeof spot?.note === "string" ? spot.note.trim() : "";
    const howto = typeof spot?.howto === "string" ? spot.howto.trim() : "";
    if (!note && !howto) return;
    spots.push({ label, text: line([note && `where: ${note}`, howto && `how: ${howto}`]) });
  };
  for (const [key, label] of Object.entries(EMERGENCY_LABELS)) add(label, raw[key]);
  if (Array.isArray(raw.custom)) {
    for (const spot of raw.custom.slice(0, 8)) {
      if (typeof spot?.label === "string" && spot.label.trim()) add(spot.label.trim(), spot);
    }
  }
  return spots;
}

function describeSystems(systems: any): string[] {
  if (!systems || typeof systems !== "object") return [];
  const out: string[] = [];
  if (systems.propertyType) out.push(`Property type: ${systems.propertyType}`);
  if (systems.yearBuilt) out.push(`Year built: ${systems.yearBuilt}`);
  const heat = Array.isArray(systems.heatSources)
    ? systems.heatSources.join(", ")
    : systems.heatSource;
  if (heat) out.push(`Heating: ${heat}`);
  const yes = Object.entries(systems)
    .filter(([key, value]) => key.startsWith("has") && value === true)
    .map(([key]) => key.slice(3).replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase());
  const no = Object.entries(systems)
    .filter(([key, value]) => key.startsWith("has") && value === false)
    .map(([key]) => key.slice(3).replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase());
  if (yes.length) out.push(`Has: ${yes.join(", ")}`);
  if (no.length) out.push(`Does not have: ${no.join(", ")}`);
  if (systems.fireplaceType) out.push(`Fireplace: ${systems.fireplaceType}`);
  return out;
}

async function homeProfile(client: any, userId: string, householdId: string | null) {
  const select = "id, city, region, country, home_systems, home_emergency, home_notes";
  let ownerId = userId;
  if (householdId) {
    const { data: household } = await client
      .from("households")
      .select("created_by")
      .eq("id", householdId)
      .maybeSingle();
    if (typeof household?.created_by === "string") ownerId = household.created_by;
  }
  const { data } = await client.from("profiles").select(select).eq("id", ownerId).maybeSingle();
  if (data || ownerId === userId) return data;
  const own = await client.from("profiles").select(select).eq("id", userId).maybeSingle();
  return own.data;
}

export async function buildHomeContext(
  client: any,
  userId: string,
  householdId: string | null,
  options: { focusEquipmentId?: string | null; today?: string | null } = {}
): Promise<HomeContext> {
  const today = options.today ?? new Date().toISOString().slice(0, 10);
  const [profile, equipment, routines, open, done, contacts] = await Promise.all([
    homeProfile(client, userId, householdId),
    client
      .from("equipment_manuals")
      .select(
        "id, name, equipment_type, manufacturer, model_number, serial_number, purchase_date, warranty_expires_on, consumables"
      )
      .order("name")
      .limit(60),
    client
      .from("maintenance_routines")
      .select("id, title, category, interval_days, equipment_id")
      .eq("is_active", true)
      .limit(120),
    client
      .from("routine_instances")
      .select("routine_id, due_date")
      .eq("is_completed", false)
      .order("due_date")
      .limit(200),
    client
      .from("routine_instances")
      .select(
        "completed_at, due_date, cost_amount, labor_type, notes, routine:maintenance_routines(title, category, equipment_id, source_plan_id)"
      )
      .eq("is_completed", true)
      .order("completed_at", { ascending: false, nullsFirst: false })
      .limit(30),
    client
      .from("home_contacts")
      .select("name, company, trade, phone, email, notes")
      .order("name")
      .limit(60),
  ]);

  const equipmentRows: any[] = equipment.data ?? [];
  const equipmentNames: Record<string, string> = {};
  for (const item of equipmentRows) equipmentNames[item.id] = item.name;

  const nextDue = new Map<string, string>();
  for (const row of open.data ?? []) {
    if (!nextDue.has(row.routine_id)) nextDue.set(row.routine_id, String(row.due_date).slice(0, 10));
  }

  const sections: string[] = [`Today: ${today}`];

  const location = line([profile?.city, profile?.region, profile?.country]);
  const systems = describeSystems(profile?.home_systems);
  if (location || systems.length) {
    sections.push(["## Home", location && `Location: ${location}`, ...systems].filter(Boolean).join("\n"));
  }

  const spots = emergencySpots(profile?.home_emergency);
  if (spots.length) {
    sections.push(["## Emergency spots", ...spots.map((s) => `- ${s.label}: ${s.text}`)].join("\n"));
  }

  if (equipmentRows.length) {
    const rows = equipmentRows.map((item) => {
      const parts = Array.isArray(item.consumables)
        ? item.consumables
            .map((c: any) => line([c?.label, c?.size, c?.partNumber && `part ${c.partNumber}`]))
            .filter(Boolean)
            .join("; ")
        : "";
      const focus = item.id === options.focusEquipmentId ? " (the user is looking at this one)" : "";
      return `- ${item.name}${focus}: ${line([
        item.equipment_type,
        item.manufacturer,
        item.model_number && `model ${item.model_number}`,
        item.serial_number && `serial ${item.serial_number}`,
        item.purchase_date && `bought ${item.purchase_date}`,
        item.warranty_expires_on && `warranty until ${item.warranty_expires_on}`,
        parts && `parts: ${parts}`,
      ])}`;
    });
    sections.push(["## Equipment", ...rows].join("\n"));
  }

  const routineRows: any[] = routines.data ?? [];
  if (routineRows.length) {
    const rows = routineRows
      .map((r) => ({ r, due: nextDue.get(r.id) ?? null }))
      .sort((a, b) => (a.due ?? "9999").localeCompare(b.due ?? "9999"))
      .map(({ r, due }) =>
        `- ${r.title}: ${line([
          r.category,
          r.interval_days > 0 && `every ${r.interval_days} days`,
          due && (due < today ? `overdue since ${due}` : `next due ${due}`),
          r.equipment_id && equipmentNames[r.equipment_id] && `for ${equipmentNames[r.equipment_id]}`,
        ])}`
      );
    sections.push(["## Schedule (active reminders)", ...rows].join("\n"));
  }

  const doneRows: any[] = done.data ?? [];
  if (doneRows.length) {
    const rows = doneRows.map((row) => {
      const when = String(row.completed_at ?? row.due_date ?? "").slice(0, 10);
      const routine = row.routine ?? {};
      return `- ${when} ${routine.title ?? "Task"}: ${line([
        routine.source_plan_id === "repair" && "repair",
        row.labor_type === "hired" ? "hired a pro" : row.labor_type === "diy" ? "DIY" : null,
        typeof row.cost_amount === "number" && row.cost_amount > 0 && `cost ${row.cost_amount}`,
        typeof row.notes === "string" && row.notes.trim() && `notes: ${row.notes.trim().slice(0, 200)}`,
      ])}`;
    });
    sections.push(["## Recent completions (newest first)", ...rows].join("\n"));
  }

  const contactRows: any[] = contacts?.data ?? [];
  if (contactRows.length) {
    const rows = contactRows.map((c) =>
      `- ${c.name}: ${line([
        c.company,
        c.trade,
        c.phone,
        c.email,
        typeof c.notes === "string" && c.notes.trim() && `notes: ${c.notes.trim().slice(0, 160)}`,
      ])}`
    );
    sections.push(["## Pros", ...rows].join("\n"));
  }

  const homeNotes = profile?.home_notes ?? {};
  const paints: any[] = Array.isArray(homeNotes.paints) ? homeNotes.paints.slice(0, 40) : [];
  if (paints.length) {
    const rows = paints.map((p) =>
      `- ${p?.room ?? "Room"}: ${line([p?.brand, p?.colorName, p?.colorCode, p?.finish])}`
    );
    sections.push(["## Paint colours", ...rows].join("\n"));
  }
  const notes: any[] = Array.isArray(homeNotes.notes) ? homeNotes.notes.slice(0, 30) : [];
  if (notes.length) {
    const rows = notes.map((n) => {
      const body = typeof n?.body === "string" ? n.body.trim().replace(/\s+/g, " ").slice(0, 300) : "";
      return `- ${n?.title ?? "Note"}${body ? `: ${body}` : ""}`;
    });
    sections.push(["## House notes", ...rows].join("\n"));
  }

  return {
    text: sections.join("\n\n"),
    equipmentNames,
    emergencyLabels: spots.map((s) => s.label),
  };
}
