import { describe, it, expect } from "vitest";
import { HealthController } from "./health.controller";

describe("HealthController", () => {
  it("returns healthy", async () => {
    expect(await new HealthController().getHealth()).toEqual({ status: "healthy" });
  });
});
