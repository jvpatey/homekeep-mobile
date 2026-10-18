/// <reference types="jest" />
import { addDays, format } from "date-fns";
import type { EquipmentManual } from "../../types/equipmentManual";
import type { HomeDocument } from "../../types/homeDocument";
import { expiryDetail, homeHeadsUp } from "../homeHeadsUp";

const NOW = new Date("2026-10-12T12:00:00");
const day = (offset: number) => format(addDays(NOW, offset), "yyyy-MM-dd");

function equipment(
  id: string,
  warranty: string | null,
  name = `Item ${id}`
): EquipmentManual {
  return {
    id,
    user_id: "u1",
    name,
    model_number: null,
    purchase_date: null,
    warranty_expires_on: warranty,
    manual_storage_path: null,
    manual_mime_type: null,
    receipt_storage_path: null,
    receipt_mime_type: null,
    created_at: NOW.toISOString(),
    updated_at: NOW.toISOString(),
  };
}

function doc(id: string, expires: string | null, title = `Doc ${id}`): HomeDocument {
  return {
    id,
    user_id: "u1",
    household_id: null,
    home_id: null,
    equipment_id: null,
    kind: "insurance",
    title,
    notes: null,
    storage_path: null,
    mime_type: null,
    issued_on: null,
    expires_on: expires,
    created_at: NOW.toISOString(),
    updated_at: NOW.toISOString(),
  };
}

describe("homeHeadsUp", () => {
  it("ignores items without dates or outside the window", () => {
    const { items, total } = homeHeadsUp(
      [equipment("a", null), equipment("b", day(200)), equipment("c", day(-400))],
      [doc("d", null), doc("e", day(61)), doc("f", day(-61))],
      NOW
    );
    expect(items).toEqual([]);
    expect(total).toBe(0);
  });

  it("includes warranties and documents in the window", () => {
    const { items } = homeHeadsUp(
      [equipment("a", day(30), "Dishwasher")],
      [doc("d", day(10), "Home insurance")],
      NOW
    );
    expect(items.map((i) => i.title)).toEqual([
      "Home insurance",
      "Dishwasher warranty",
    ]);
    expect(items[0]).toMatchObject({
      kind: "document",
      targetId: "d",
      expired: false,
      days: 10,
      detail: "Expires in 10 days",
    });
    expect(items[1]).toMatchObject({ kind: "warranty", targetId: "a" });
  });

  it("puts upcoming before lapsed, and caps at three", () => {
    const { items, total } = homeHeadsUp(
      [equipment("a", day(-5)), equipment("b", day(-1)), equipment("c", day(45))],
      [doc("d", day(3)), doc("e", day(0))],
      NOW
    );
    expect(total).toBe(5);
    expect(items.map((i) => i.targetId)).toEqual(["e", "d", "c"]);
  });

  it("orders lapsed items most recent first", () => {
    const { items } = homeHeadsUp(
      [equipment("a", day(-30)), equipment("b", day(-2))],
      [],
      NOW
    );
    expect(items.map((i) => i.targetId)).toEqual(["b", "a"]);
    expect(items.every((i) => i.expired)).toBe(true);
  });
});

describe("expiryDetail", () => {
  it("phrases days relative to today", () => {
    expect(expiryDetail(-3)).toBe("Expired 3 days ago");
    expect(expiryDetail(-1)).toBe("Expired yesterday");
    expect(expiryDetail(0)).toBe("Expires today");
    expect(expiryDetail(1)).toBe("Expires tomorrow");
    expect(expiryDetail(14)).toBe("Expires in 14 days");
  });
});
