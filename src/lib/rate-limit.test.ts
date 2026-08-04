import { describe, it, expect, vi, afterEach } from "vitest";
import { checkRateLimit } from "@/lib/rate-limit";

afterEach(() => {
  vi.useRealTimers();
});

describe("checkRateLimit", () => {
  it("allows requests up to capacity then blocks the next one", () => {
    const key = "test:allows-up-to-capacity";
    const opts = { capacity: 3, refillIntervalMs: 60_000 };

    expect(checkRateLimit(key, opts).allowed).toBe(true);
    expect(checkRateLimit(key, opts).allowed).toBe(true);
    expect(checkRateLimit(key, opts).allowed).toBe(true);

    const blocked = checkRateLimit(key, opts);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
  });

  it("refills a token after the interval elapses", () => {
    vi.useFakeTimers();
    const key = "test:refills-after-interval";
    const opts = { capacity: 1, refillIntervalMs: 10_000 };

    expect(checkRateLimit(key, opts).allowed).toBe(true);
    expect(checkRateLimit(key, opts).allowed).toBe(false);

    vi.advanceTimersByTime(10_001);

    expect(checkRateLimit(key, opts).allowed).toBe(true);
  });

  it("tracks independent keys separately", () => {
    const opts = { capacity: 1, refillIntervalMs: 60_000 };

    expect(checkRateLimit("test:key-a", opts).allowed).toBe(true);
    expect(checkRateLimit("test:key-b", opts).allowed).toBe(true);
    expect(checkRateLimit("test:key-a", opts).allowed).toBe(false);
    expect(checkRateLimit("test:key-b", opts).allowed).toBe(false);
  });
});
