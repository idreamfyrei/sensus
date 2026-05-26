import crypto from "node:crypto";
import { logger } from "@repo/logger";

export type RateLimitResult = {
  ok: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
};

export class RateLimitExceededError extends Error {
  readonly code = "RATE_LIMIT_EXCEEDED" as const;
  constructor(public readonly resetInSeconds: number) {
    super("Too many requests, please slow down");
    this.name = "RateLimitExceededError";
  }
}

type WindowEntry = { count: number; firstAt: number };

/**
 * Sliding-window rate limit. Backed by Upstash REST when
 * UPSTASH_REDIS_REST_URL is set, otherwise an in-memory store that resets on
 * api restart. The in-memory path is honest about being a fallback: state
 * is per-process, so multi-instance deployments must wire Upstash.
 */
export class RateLimitService {
  private readonly inMemory = new Map<string, WindowEntry>();
  private readonly url: string | null;
  private readonly token: string | null;
  private readonly salt: string;

  constructor(env?: {
    UPSTASH_REDIS_REST_URL?: string;
    UPSTASH_REDIS_REST_TOKEN?: string;
    IP_HASH_SALT?: string;
  }) {
    this.url = env?.UPSTASH_REDIS_REST_URL ?? null;
    this.token = env?.UPSTASH_REDIS_REST_TOKEN ?? null;
    this.salt = env?.IP_HASH_SALT ?? "sensus-dev-salt";
  }

  hashIp(ip: string | null | undefined): string {
    const raw = ip ?? "anonymous";
    return crypto.createHash("sha256").update(`${this.salt}:${raw}`).digest("hex");
  }

  async check(args: {
    key: string;
    limit: number;
    windowSeconds: number;
  }): Promise<RateLimitResult> {
    if (this.url && this.token) {
      try {
        return await this.checkUpstash(args);
      } catch (err) {
        logger.warn("rate-limit: upstash unreachable, failing open", {
          error: (err as Error).message,
          key: args.key,
        });
        return {
          ok: true,
          limit: args.limit,
          remaining: args.limit,
          resetAt: Date.now() + args.windowSeconds * 1000,
        };
      }
    }
    return this.checkInMemory(args);
  }

  private checkInMemory(args: {
    key: string;
    limit: number;
    windowSeconds: number;
  }): RateLimitResult {
    const now = Date.now();
    const windowMs = args.windowSeconds * 1000;
    const existing = this.inMemory.get(args.key);
    if (!existing || now - existing.firstAt >= windowMs) {
      this.inMemory.set(args.key, { count: 1, firstAt: now });
      return {
        ok: true,
        limit: args.limit,
        remaining: args.limit - 1,
        resetAt: now + windowMs,
      };
    }
    existing.count += 1;
    const resetAt = existing.firstAt + windowMs;
    if (existing.count > args.limit) {
      return { ok: false, limit: args.limit, remaining: 0, resetAt };
    }
    return {
      ok: true,
      limit: args.limit,
      remaining: args.limit - existing.count,
      resetAt,
    };
  }

  private async checkUpstash(args: {
    key: string;
    limit: number;
    windowSeconds: number;
  }): Promise<RateLimitResult> {
    if (!this.url || !this.token) {
      throw new Error("Upstash credentials missing");
    }
    // INCR then EXPIRE — first hit also sets the TTL.
    const pipe = [
      ["INCR", args.key],
      ["EXPIRE", args.key, String(args.windowSeconds), "NX"],
      ["PTTL", args.key],
    ];
    const res = await fetch(`${this.url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(pipe),
    });
    if (!res.ok) {
      throw new Error(`Upstash returned ${res.status}`);
    }
    const data = (await res.json()) as Array<{ result: number }>;
    const count = Number(data[0]?.result ?? 0);
    const pttl = Number(data[2]?.result ?? args.windowSeconds * 1000);
    const resetAt = Date.now() + Math.max(pttl, 0);

    if (count > args.limit) {
      return { ok: false, limit: args.limit, remaining: 0, resetAt };
    }
    return {
      ok: true,
      limit: args.limit,
      remaining: Math.max(args.limit - count, 0),
      resetAt,
    };
  }
}
