import { z } from "zod";

export class HealthController {
  // pure method; tRPC wiring happens in the route file
  public async getHealth(): Promise<{ status: "healthy" }> {
    return { status: "healthy" };
  }
}

export const healthOutput = z.object({ status: z.literal("healthy") });
