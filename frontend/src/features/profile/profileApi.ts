import { userClient } from "../../api/generated/client";
import type { components } from "../../api/generated/user";
import { formatApiError } from "../../shared/errors/apiError";

export type CurrentUser = components["schemas"]["User"];

export async function getCurrentUser(): Promise<CurrentUser> {
  const { data, error } = await userClient.GET("/api/users/me");

  if (error) {
    throw new Error(formatApiError(error, "Could not load profile"));
  }
  if (!data) {
    throw new Error("Profile response is empty");
  }

  return data;
}
