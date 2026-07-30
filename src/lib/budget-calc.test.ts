import { describe, it, expect } from "vitest";
import { calculateBudgetProgress } from "@/lib/budget-calc";

describe("calculateBudgetProgress", () => {
  it("computes percent used within limit", () => {
    const p = calculateBudgetProgress(10000, 5000);
    expect(p.percentUsed).toBe(50);
    expect(p.isOverBudget).toBe(false);
    expect(p.remainingCents).toBe(5000);
  });

  it("caps percentUsed at 100 when over budget", () => {
    const p = calculateBudgetProgress(10000, 15000);
    expect(p.percentUsed).toBe(100);
    expect(p.isOverBudget).toBe(true);
    expect(p.remainingCents).toBe(-5000);
  });

  it("handles zero limit without dividing by zero", () => {
    const p = calculateBudgetProgress(0, 500);
    expect(p.percentUsed).toBe(0);
    expect(p.isOverBudget).toBe(true);
  });

  it("handles zero spent", () => {
    const p = calculateBudgetProgress(10000, 0);
    expect(p.percentUsed).toBe(0);
    expect(p.isOverBudget).toBe(false);
    expect(p.remainingCents).toBe(10000);
  });
});
