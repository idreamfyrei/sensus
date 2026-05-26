import type { IncomingHttpHeaders } from "node:http";
import { auth } from "@repo/auth";
import { db, type Database } from "@repo/database";
import { FormService } from "@repo/services";

export type Services = {
  forms: FormService;
};

export type Context = {
  userId: string | null;
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

export async function createContext(opts?: {
  req?: { headers: IncomingHttpHeaders };
}): Promise<Context> {
  const headers = opts?.req ? toWebHeaders(opts.req.headers) : new Headers();
  const session = await auth.api.getSession({ headers });

  return {
    userId: session?.user.id ?? null,
    db,
    services: {
      forms: new FormService(db),
    },
  };
}
