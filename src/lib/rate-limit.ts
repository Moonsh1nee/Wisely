/**
 * In-memory token-bucket rate limiter. Resets on process restart and does not
 * share state across instances — an acceptable tradeoff for a single-process,
 * self-hosted app; replace with a durable store (e.g. Redis) if this ever
 * runs multi-instance or publicly at scale.
 */

interface Bucket {
  tokens: number;
  lastRefill: number;
}

const buckets = new Map<string, Bucket>();
const STALE_MS = 10 * 60_000;

export interface RateLimitOptions {
  capacity?: number;
  refillIntervalMs?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterMs: number;
}

function pruneStale(now: number) {
  for (const [key, bucket] of buckets) {
    if (now - bucket.lastRefill > STALE_MS) buckets.delete(key);
  }
}

export function checkRateLimit(
  key: string,
  { capacity = 5, refillIntervalMs = 12_000 }: RateLimitOptions = {},
): RateLimitResult {
  const now = Date.now();
  pruneStale(now);

  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { tokens: capacity, lastRefill: now };
    buckets.set(key, bucket);
  } else {
    const elapsed = now - bucket.lastRefill;
    const refillCount = Math.floor(elapsed / refillIntervalMs);
    if (refillCount > 0) {
      bucket.tokens = Math.min(capacity, bucket.tokens + refillCount);
      bucket.lastRefill = now;
    }
  }

  if (bucket.tokens <= 0) {
    const msSinceRefill = now - bucket.lastRefill;
    return { allowed: false, retryAfterMs: Math.max(0, refillIntervalMs - msSinceRefill) };
  }

  bucket.tokens -= 1;
  return { allowed: true, retryAfterMs: 0 };
}
