/// <reference types="jest" />
import { addDays } from "date-fns";
import { getHomeMapZones } from "../../data/homeMapZones";
import {
  LastCompletionMap,
  UpkeepRoutine,
  computeUpkeep,
  evaluateRoutine,
  upkeepSummary,
} from "../upkeep";

const NOW = new Date("2026-10-12T12:00:00");
const zones = getHomeMapZones(null).filter((zone) => !zone.hidden);

let seq = 0;

function makeRoutine(overrides: Partial<UpkeepRoutine> = {}): UpkeepRoutine {
  seq += 1;
  return {
    id: `r${seq}`,
    title: `Task ${seq}`,
    category: "APPLIANCES",
    priority: "medium",
    interval_days: 90,
    start_date: addDays(NOW, -200).toISOString(),
    source_plan_id: null,
    ...overrides,
  };
}

function openTask(routine: UpkeepRoutine, dueInDays: number) {
  return {
    id: routine.id,
    due_date: addDays(NOW, dueInDays).toISOString(),
    is_completed: false,
  };
}

function doneDaysAgo(days: number): string {
  return addDays(NOW, -days).toISOString();
}

/** On-track appliance reminders, each completed recently. */
function healthyHome(count: number) {
  const routines = Array.from({ length: count }, () => makeRoutine());
  const lastCompletion: LastCompletionMap = {};
  for (const routine of routines) lastCompletion[routine.id] = doneDaysAgo(10);
  return {
    routines,
    openTasks: routines.map((routine) => openTask(routine, 60)),
    lastCompletion,
  };
}

describe("computeUpkeep", () => {
  it("returns gettingStarted for a brand-new setup instead of 100", () => {
    const routines = Array.from({ length: 6 }, () =>
      makeRoutine({ start_date: NOW.toISOString() })
    );
    const result = computeUpkeep({
      routines,
      openTasks: routines.map((routine) => openTask(routine, 14)),
      lastCompletion: {},
      zones,
      now: NOW,
    });

    expect(result.state).toBe("gettingStarted");
    if (result.state !== "gettingStarted") return;
    expect(result.completed).toBe(0);
    expect(result.target).toBe(3);
    expect(result.routinesNeeded).toBe(0);
  });

  it("asks for more reminders when there are too few to judge", () => {
    const home = healthyHome(3);
    const result = computeUpkeep({ ...home, zones, now: NOW });

    expect(result.state).toBe("gettingStarted");
    if (result.state !== "gettingStarted") return;
    expect(result.routinesNeeded).toBe(2);
  });

  it("does not let many on-track reminders hide a late safety task", () => {
    const home = healthyHome(30);
    const smoke = makeRoutine({
      title: "Smoke alarm test",
      category: "SAFETY",
      interval_days: 30,
    });
    const result = computeUpkeep({
      routines: [...home.routines, smoke],
      openTasks: [...home.openTasks, openTask(smoke, -14)],
      lastCompletion: { ...home.lastCompletion, [smoke.id]: doneDaysAgo(44) },
      zones,
      now: NOW,
    });

    expect(result.state).toBe("scored");
    if (result.state !== "scored") return;
    expect(result.score).toBeLessThanOrEqual(79);
    expect(result.grade).toBe("slipping");
    expect(result.capped).toBe(true);
    expect(upkeepSummary(result)).toMatch(/^Smoke alarm test is 2 weeks late/);
  });

  it("does not penalise a task 2 days late inside its grace period", () => {
    const home = healthyHome(6);
    const slightlyLate = makeRoutine({ interval_days: 90 });
    const result = computeUpkeep({
      routines: [...home.routines, slightlyLate],
      openTasks: [...home.openTasks, openTask(slightlyLate, -2)],
      lastCompletion: {
        ...home.lastCompletion,
        [slightlyLate.id]: doneDaysAgo(92),
      },
      zones,
      now: NOW,
    });

    expect(result.state).toBe("scored");
    if (result.state !== "scored") return;
    expect(result.score).toBe(100);
    const item = result.routines.find((r) => r.routine.id === slightlyLate.id);
    expect(item?.status).not.toBe("late");
    expect(item?.value).toBe(1);
  });

  it("treats a never-completed reminder that keeps getting skipped as neglected", () => {
    const skipped = makeRoutine({
      interval_days: 30,
      start_date: addDays(NOW, -200).toISOString(),
    });
    const item = evaluateRoutine(
      skipped,
      addDays(NOW, 10),
      undefined,
      zones,
      NOW
    );

    expect(item.status).toBe("neglected");
    expect(item.value).toBeLessThan(0.5);
  });

  it("weights late high-priority reminders more than low-priority ones", () => {
    const scoreWith = (priority: UpkeepRoutine["priority"]) => {
      const home = healthyHome(8);
      const late = makeRoutine({ priority, interval_days: 90 });
      const result = computeUpkeep({
        routines: [...home.routines, late],
        openTasks: [...home.openTasks, openTask(late, -40)],
        lastCompletion: { ...home.lastCompletion, [late.id]: doneDaysAgo(130) },
        zones,
        now: NOW,
      });
      if (result.state !== "scored") throw new Error("expected a score");
      return result.score;
    };

    expect(scoreWith("high")).toBeLessThan(scoreWith("low"));
  });

  it("leaves repairs and one-off tasks out", () => {
    const home = healthyHome(6);
    const repair = makeRoutine({ source_plan_id: "repair" });
    const oneOff = makeRoutine({ interval_days: 0 });
    const result = computeUpkeep({
      routines: [...home.routines, repair, oneOff],
      openTasks: [
        ...home.openTasks,
        openTask(repair, -60),
        openTask(oneOff, -60),
      ],
      lastCompletion: home.lastCompletion,
      zones,
      now: NOW,
    });

    expect(result.routines).toHaveLength(6);
    expect(result.state === "scored" && result.score).toBe(100);
  });
});
