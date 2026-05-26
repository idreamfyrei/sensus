import type { IncomingHttpHeaders } from "node:http";
import { auth } from "@repo/auth";
import { db, type Database } from "@repo/database";
import {
  AccountService,
  AnalyticsService,
  ConditionService,
  FieldService,
  FormService,
  RateLimitService,
  ResponseService,
  SectionService,
  ThemeService,
} from "@repo/services";

export type Services = {
  forms: FormService;
  fields: FieldService;
  account: AccountService;
  themes: ThemeService;
  sections: SectionService;
  conditions: ConditionService;
  responses: ResponseService;
  analytics: AnalyticsService;
  rateLimit: RateLimitService;
};

export type Context = {
  userId: string | null;
  ipHash: string | null;
  userAgent: string | null;
  db: Database;
  services: Services;
};

function toWebHeaders(input: IncomingHttpHeaders): Headers {
  const headers = new Headers();
  for (const [key, value] of Object.entries(input)) {
    if (value == null) continue;
    if (Array.isArray(value)) {
      for (const v of value) headers.append(key, v);
    } else {
      headers.set(key, value);
    }
  }
  return headers;
}

function extractClientIp(headers: Headers): string | null {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) {
    const first = fwd.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip") ?? null;
}

const rateLimit = new RateLimitService({
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  IP_HASH_SALT: process.env.IP_HASH_SALT,
});

export async function createContext(opts?: {
  req?: { headers: IncomingHttpHeaders };
}): Promise<Context> {
  const headers = opts?.req ? toWebHeaders(opts.req.headers) : new Headers();
  const session = await auth.api.getSession({ headers });
  const rawIp = extractClientIp(headers);
  const ipHash = rateLimit.hashIp(rawIp);
  const userAgent = headers.get("user-agent");

  return {
    userId: session?.user.id ?? null,
    ipHash,
    userAgent,
    db,
    services: {
      forms: new FormService(db),
      fields: new FieldService(db),
      account: new AccountService(db),
      themes: new ThemeService(db),
      sections: new SectionService(db),
      conditions: new ConditionService(db),
      responses: new ResponseService(db),
      analytics: new AnalyticsService(db),
      rateLimit,
    },
  };
}
