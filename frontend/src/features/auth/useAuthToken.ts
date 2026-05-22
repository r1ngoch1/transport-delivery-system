import { useEffect, useState } from "react";
import { authStore } from "./authStore";

export function useAuthToken() {
  const [token, setToken] = useState<string | null>(() => authStore.getToken());

  useEffect(() => authStore.subscribe(setToken), []);

  return token;
}
