import { z } from "zod";

export class HealthController {
  public async getHealth(): Promise<{ status: "healthy" }> {
    return { status: "healthy" };
  }
}

export const healthOutput = z.object({ status: z.literal("healthy") });
