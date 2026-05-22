import { userClient } from "../../api/generated/client";
import type { components } from "../../api/generated/user";

export type CurrentUser = components["schemas"]["User"];

export async function getCurrentUser(): Promise<CurrentUser> {
  const { data, error } = await userClient.GET("/api/users/me");

  if (error) {
    throw new Error(extractErrorMessage(error));
  }
  if (!data) {
    throw new Error("Profile response is empty");
  }

  return data;
}

function extractErrorMessage(error: unknown): string {
  if (typeof error === "object" && error && "message" in error) {
    return String(error.message);
  }
  return "Could not load profile";
}
