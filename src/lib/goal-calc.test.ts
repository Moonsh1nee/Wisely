import { describe, it, expect } from "vitest";
import { calculateGoalProgress } from "@/lib/goal-calc";

describe("calculateGoalProgress", () => {
  it("computes percent saved toward the goal", () => {
    const p = calculateGoalProgress(10000, 4000);
    expect(p.percent).toBe(40);
    expect(p.isReached).toBe(false);
    expect(p.remainingCents).toBe(6000);
  });

  it("caps percent at 100 and marks reached when balance meets the goal", () => {
    const p = calculateGoalProgress(10000, 10000);
    expect(p.percent).toBe(100);
    expect(p.isReached).toBe(true);
    expect(p.remainingCents).toBe(0);
  });

  it("caps percent at 100 when balance exceeds the goal", () => {
    const p = calculateGoalProgress(10000, 15000);
    expect(p.percent).toBe(100);
    expect(p.isReached).toBe(true);
    expect(p.remainingCents).toBe(0);
  });

  it("handles a zero goal without dividing by zero", () => {
    const p = calculateGoalProgress(0, 500);
    expect(p.percent).toBe(0);
    expect(p.isReached).toBe(true);
  });

  it("handles a negative balance (overdrawn account) as not reached", () => {
    const p = calculateGoalProgress(10000, -500);
    expect(p.percent).toBe(0);
    expect(p.isReached).toBe(false);
    expect(p.remainingCents).toBe(10500);
  });
});
