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

const DOCUMENT_KIND_LABELS: Record<string, string> = {
  insurance: "Insurance",
  inspection: "Inspection",
  closing: "Closing & deed",
  permit: "Permit",
  warranty: "Warranty",
  other: "Other",
};

const RECALL_SOURCE_LABELS: Record<string, string> = {
  cpsc: "U.S. CPSC",
  health_canada: "Health Canada",
};

export interface HomeContext {
  text: string;
  equipmentNames: Record<string, string>;
  emergencyLabels: string[];
  /** Lowercased recall title (and equipment|title) → id + equipment_id. */
  recallsByKey: Record<string, { id: string; equipmentId: string | null }>;
  /** Lowercased document titles, for open_documents grounding. */
  documentTitles: string[];
}

function line(parts: (string | null | undefined | false)[]): string {
  return parts.filter(Boolean).join(" · ");
}

function money(amount: number): string {
  const rounded = Math.round(amount * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
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

function describeAddress(profile: any): string[] {
  if (!profile) return [];
  const out: string[] = [];
  const street1 =
    typeof profile.address_line1 === "string" ? profile.address_line1.trim() : "";
  const street2 =
    typeof profile.address_line2 === "string" ? profile.address_line2.trim() : "";
  if (street1) out.push(`Address: ${street1}`);
  if (street2) out.push(`Address line 2: ${street2}`);
  const city = typeof profile.city === "string" ? profile.city.trim() : "";
  const region = typeof profile.region === "string" ? profile.region.trim() : "";
  const postal =
    typeof profile.postal_code === "string" ? profile.postal_code.trim() : "";
  const country =
    typeof profile.country === "string" ? profile.country.trim() : "";
  const locality = [city, region].filter(Boolean).join(", ");
  const localityLine = postal
    ? locality
      ? `${locality} ${postal}`
      : postal
    : locality;
  if (localityLine || country) {
    out.push(`Location: ${line([localityLine, country])}`);
  }
  return out;
}

function spendSummary(
  rows: any[],
  today: string
): string | null {
  const year = Number(today.slice(0, 4));
  const buckets = new Map<
    number,
    {
      total: number;
      count: number;
      diy: number;
      hired: number;
      repair: number;
      byCategory: Map<string, number>;
    }
  >();
  let allTime = 0;
  let allCount = 0;

  for (const row of rows) {
    const amount = row.cost_amount;
    if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) continue;
    const when = String(row.completed_at ?? row.due_date ?? "").slice(0, 10);
    const y = Number(when.slice(0, 4));
    if (!Number.isFinite(y)) continue;
    const routine = row.routine ?? {};
    const bucket = buckets.get(y) ?? {
      total: 0,
      count: 0,
      diy: 0,
      hired: 0,
      repair: 0,
      byCategory: new Map<string, number>(),
    };
    bucket.total += amount;
    bucket.count += 1;
    if (row.labor_type === "diy") bucket.diy += amount;
    else if (row.labor_type === "hired") bucket.hired += amount;
    if (routine.source_plan_id === "repair") bucket.repair += amount;
    const category = typeof routine.category === "string" ? routine.category : "GENERAL";
    bucket.byCategory.set(category, (bucket.byCategory.get(category) ?? 0) + amount);
    buckets.set(y, bucket);
    allTime += amount;
    allCount += 1;
  }

  if (allCount === 0) return null;

  const lines: string[] = [];
  const pushYear = (y: number, label: string) => {
    const b = buckets.get(y);
    if (!b) {
      lines.push(`${label}: none recorded`);
      return;
    }
    const extras = line([
      b.diy > 0 && `DIY ${money(b.diy)}`,
      b.hired > 0 && `hired ${money(b.hired)}`,
      b.repair > 0 && `repairs ${money(b.repair)}`,
    ]);
    lines.push(
      `${label}: ${money(b.total)} across ${b.count} job${b.count === 1 ? "" : "s"}${
        extras ? ` · ${extras}` : ""
      }`
    );
    const cats = [...b.byCategory.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([cat, total]) => `${cat} ${money(total)}`);
    if (cats.length) lines.push(`  By category: ${cats.join(", ")}`);
  };

  pushYear(year, `This year (${year})`);
  if (buckets.has(year - 1)) pushYear(year - 1, `Last year (${year - 1})`);
  if (allCount > 0) {
    lines.push(
      `All time: ${money(allTime)} across ${allCount} job${allCount === 1 ? "" : "s"}`
    );
  }
  return lines.join("\n");
}

async function homeProfile(client: any, userId: string, householdId: string | null) {
  const select =
    "id, address_line1, address_line2, city, region, postal_code, country, home_systems, home_emergency, home_notes";
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
  const [profile, equipment, routines, open, done, contacts, documents, recalls, costs] =
    await Promise.all([
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
      client
        .from("documents")
        .select("title, kind, issued_on, expires_on, equipment_id, notes")
        .order("expires_on", { ascending: true, nullsFirst: false })
        .limit(40),
      client
        .from("equipment_recalls")
        .select(
          "id, equipment_id, source, title, hazard, remedy, recall_date, matched_on, url"
        )
        .is("dismissed_at", null)
        .order("created_at", { ascending: false })
        .limit(20),
      client
        .from("routine_instances")
        .select(
          "completed_at, due_date, cost_amount, labor_type, routine:maintenance_routines(title, category, source_plan_id)"
        )
        .eq("is_completed", true)
        .gt("cost_amount", 0)
        .order("completed_at", { ascending: false, nullsFirst: false })
        .limit(200),
    ]);

  const equipmentRows: any[] = equipment.data ?? [];
  const equipmentNames: Record<string, string> = {};
  for (const item of equipmentRows) equipmentNames[item.id] = item.name;

  const nextDue = new Map<string, string>();
  for (const row of open.data ?? []) {
    if (!nextDue.has(row.routine_id)) nextDue.set(row.routine_id, String(row.due_date).slice(0, 10));
  }

  const sections: string[] = [`Today: ${today}`];

  const addressLines = describeAddress(profile);
  const systems = describeSystems(profile?.home_systems);
  if (addressLines.length || systems.length) {
    sections.push(["## Home", ...addressLines, ...systems].join("\n"));
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

  const recallRows: any[] = recalls?.data ?? [];
  const recallsByKey: Record<
    string,
    { id: string; equipmentId: string | null }
  > = {};
  if (recallRows.length) {
    const rows = recallRows.map((r) => {
      const equipmentId =
        typeof r.equipment_id === "string" ? r.equipment_id : null;
      const equipmentName = equipmentId ? equipmentNames[equipmentId] : null;
      const agency = RECALL_SOURCE_LABELS[r.source] ?? r.source;
      const title =
        typeof r.title === "string" ? r.title.trim() : "";
      if (title && typeof r.id === "string") {
        const entry = { id: r.id, equipmentId };
        recallsByKey[title.toLowerCase()] = entry;
        if (equipmentName) {
          recallsByKey[`${equipmentName.toLowerCase()}|${title.toLowerCase()}`] =
            entry;
        }
      }
      return `- ${equipmentName ?? "Equipment"}: ${line([
        agency,
        title || r.title,
        r.recall_date && `dated ${String(r.recall_date).slice(0, 10)}`,
        r.matched_on === "name" ? "possible name match" : r.matched_on === "model" ? "matched on model" : null,
        typeof r.hazard === "string" && r.hazard.trim() && `hazard: ${r.hazard.trim().slice(0, 160)}`,
        typeof r.remedy === "string" && r.remedy.trim() && `remedy: ${r.remedy.trim().slice(0, 160)}`,
      ])}`;
    });
    sections.push(["## Open recalls", ...rows].join("\n"));
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

  const spend = spendSummary(costs?.data ?? [], today);
  if (spend) {
    sections.push(["## Spend", spend].join("\n"));
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

  const documentRows: any[] = documents?.data ?? [];
  const documentTitles: string[] = [];
  if (documentRows.length) {
    const rows = documentRows.map((d) => {
      const kind = DOCUMENT_KIND_LABELS[d.kind] ?? d.kind;
      const title = typeof d.title === "string" ? d.title.trim() : "";
      if (title) documentTitles.push(title);
      const forEquipment =
        d.equipment_id && equipmentNames[d.equipment_id]
          ? `for ${equipmentNames[d.equipment_id]}`
          : null;
      const expired =
        d.expires_on && String(d.expires_on).slice(0, 10) < today
          ? "expired"
          : null;
      return `- ${title || d.title}: ${line([
        kind,
        forEquipment,
        d.issued_on && `issued ${String(d.issued_on).slice(0, 10)}`,
        d.expires_on && `expires ${String(d.expires_on).slice(0, 10)}`,
        expired,
        typeof d.notes === "string" && d.notes.trim() && `notes: ${d.notes.trim().slice(0, 120)}`,
      ])}`;
    });
    sections.push(["## Documents", ...rows].join("\n"));
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
    recallsByKey,
    documentTitles,
  };
}
