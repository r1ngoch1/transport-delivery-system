import createClient from "openapi-fetch";
import { authStore } from "../../features/auth/authStore";
import { API_BASE_URL } from "../config";
import type { paths as AdminPaths } from "./admin";
import type { paths as BookingPaths } from "./booking";
import type { paths as PaymentPaths } from "./payment";
import type { paths as RoutePaths } from "./route";
import type { paths as TripPaths } from "./trip";
import type { paths as UserPaths } from "./user";

function createGatewayClient<TPaths extends object>() {
  const client = createClient<TPaths>({
    baseUrl: API_BASE_URL,
    fetch: (request) => globalThis.fetch(request)
  });

  client.use({
    onRequest({ request }) {
      const token = authStore.getToken();
      if (!token) {
        return request;
      }

      const headers = new Headers(request.headers);
      headers.set("Authorization", `Bearer ${token}`);
      return new Request(request, { headers });
    }
  });

  return client;
}

export const userClient = createGatewayClient<UserPaths>();
export const adminClient = createGatewayClient<AdminPaths>();
export const routeClient = createGatewayClient<RoutePaths>();
export const tripClient = createGatewayClient<TripPaths>();
export const bookingClient = createGatewayClient<BookingPaths>();
export const paymentClient = createGatewayClient<PaymentPaths>();
