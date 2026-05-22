import { describe, expect, it } from "vitest";
import { bookingClient, paymentClient, routeClient, tripClient, userClient } from "./client";

describe("generated OpenAPI clients", () => {
  it("creates typed gateway clients for passenger MVP services", () => {
    expect(typeof userClient.GET).toBe("function");
    expect(typeof routeClient.GET).toBe("function");
    expect(typeof tripClient.GET).toBe("function");
    expect(typeof bookingClient.POST).toBe("function");
    expect(typeof paymentClient.GET).toBe("function");
  });
});
