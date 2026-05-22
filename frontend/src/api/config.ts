const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const defaultApiBaseUrl =
  import.meta.env.MODE === "test" || !import.meta.env.DEV ? "http://localhost:8080" : "";

export const API_BASE_URL = configuredApiBaseUrl
  ? configuredApiBaseUrl.replace(/\/$/, "")
  : defaultApiBaseUrl;
