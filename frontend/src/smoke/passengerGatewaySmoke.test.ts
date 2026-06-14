import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";

describe("passenger Gateway smoke script", () => {
  it("prints the passenger scenario in dry-run mode", () => {
    const output = execFileSync(process.execPath, ["smoke/passenger-gateway-smoke.mjs", "--dry-run"], {
      cwd: process.cwd(),
      encoding: "utf8"
    });

    const plan = JSON.parse(output) as { gatewayUrl: string; steps: Array<{ method: string; path: string }> };

    expect(plan.gatewayUrl).toBe("http://localhost:8080");
    expect(plan.steps).toEqual(
      expect.arrayContaining([
        { method: "POST", path: "/api/auth/register" },
        { method: "POST", path: "/api/auth/login" },
        { method: "GET", path: "/api/routes" },
        { method: "GET", path: "/api/trips/search?routeId=33333333-3333-3333-3333-333333333333&date=2026-06-01" },
        { method: "POST", path: "/api/bookings" },
        { method: "GET", path: "/api/bookings/my" },
        { method: "GET", path: "/api/payments?targetType=BOOKING&targetId=<bookingId>" }
      ])
    );
  });
});
