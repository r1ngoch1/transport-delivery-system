# Frontend Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the root-level `frontend/` React application foundation for the passenger booking MVP.

**Architecture:** The frontend is a standalone Node/Vite app in `frontend/`, separate from Maven modules under `services/`. It communicates only with API Gateway using `VITE_API_BASE_URL`, owns auth token state client-side, and exposes a clean app shell with protected routing and shared API utilities.

**Tech Stack:** React, Vite, TypeScript, React Router, TanStack Query, Vitest, Testing Library, CSS modules/plain CSS, generated or schema-aligned TypeScript API types.

---

## File Structure

- Create `frontend/package.json`: npm scripts and dependencies.
- Create `frontend/index.html`: Vite HTML entrypoint.
- Create `frontend/vite.config.ts`: React plugin, test environment, local proxy to Gateway.
- Create `frontend/tsconfig.json`, `frontend/tsconfig.node.json`: TypeScript compiler settings.
- Create `frontend/.env.example`: documented API base URL.
- Create `frontend/src/main.tsx`: React bootstrap.
- Create `frontend/src/app/App.tsx`: top-level routes and layout composition.
- Create `frontend/src/app/App.test.tsx`: app routing smoke tests.
- Create `frontend/src/app/providers.tsx`: QueryClient and router-facing providers.
- Create `frontend/src/app/routes.tsx`: route definitions and protected route wrapper.
- Create `frontend/src/app/styles.css`: Clean Mobility visual foundation.
- Create `frontend/src/shared/ui/StatusChip.tsx`: status display component.
- Create `frontend/src/shared/ui/StatusChip.test.tsx`: status component tests.
- Create `frontend/src/shared/ui/Button.tsx`: shared button component.
- Create `frontend/src/shared/ui/Button.test.tsx`: button tests.
- Create `frontend/src/api/config.ts`: API base URL configuration.
- Create `frontend/src/api/http.ts`: fetch wrapper with JWT and backend error parsing.
- Create `frontend/src/api/http.test.ts`: API wrapper tests.
- Create `frontend/src/api/types.ts`: frontend-facing API types matching current OpenAPI contracts.
- Create `frontend/src/features/auth/authStore.ts`: token persistence and auth state.
- Create `frontend/src/features/auth/authStore.test.ts`: auth store tests.
- Create `frontend/src/pages/LoginPage.tsx`: minimal login/register placeholder screen wired to visual direction.
- Create `frontend/src/pages/SearchPage.tsx`: default passenger search shell.
- Create `frontend/src/pages/MyBookingsPage.tsx`: protected bookings placeholder.
- Create `frontend/src/pages/ProfilePage.tsx`: protected profile placeholder.
- Modify `.gitignore`: ignore `frontend/node_modules`, `frontend/dist`, and frontend coverage output.
- Modify `TODO.md`: mark foundation subitems complete only after implementation and verification.

## Task 1: Scaffold Vite React TypeScript App

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/index.html`
- Create: `frontend/vite.config.ts`
- Create: `frontend/tsconfig.json`
- Create: `frontend/tsconfig.node.json`
- Create: `frontend/.env.example`
- Modify: `.gitignore`

- [ ] **Step 1: Create package manifest**

Create `frontend/package.json`:

```json
{
  "name": "transport-delivery-frontend",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite --host 0.0.0.0",
    "build": "tsc -b && vite build",
    "preview": "vite preview --host 0.0.0.0",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@tanstack/react-query": "^5.80.0",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "react-router-dom": "^7.6.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.3.0",
    "@testing-library/user-event": "^14.6.1",
    "@types/node": "^22.15.21",
    "@types/react": "^19.1.5",
    "@types/react-dom": "^19.1.5",
    "@vitejs/plugin-react": "^4.4.1",
    "jsdom": "^26.1.0",
    "typescript": "^5.8.3",
    "vite": "^6.3.5",
    "vitest": "^3.1.4"
  }
}
```

- [ ] **Step 2: Create Vite entry HTML**

Create `frontend/index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Transport Delivery</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 3: Create Vite config**

Create `frontend/vite.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true
      }
    }
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.ts"
  }
});
```

- [ ] **Step 4: Create TypeScript configs**

Create `frontend/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

Create `frontend/tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 5: Create environment example**

Create `frontend/.env.example`:

```text
VITE_API_BASE_URL=http://localhost:8080
```

- [ ] **Step 6: Update gitignore**

Append to `.gitignore`:

```gitignore

### Frontend ###
frontend/node_modules/
frontend/dist/
frontend/coverage/
```

- [ ] **Step 7: Install dependencies**

Run:

```bash
cd frontend
npm install
```

Expected: `package-lock.json` is created and npm exits with code `0`.

- [ ] **Step 8: Commit scaffold**

```bash
git add .gitignore frontend/package.json frontend/package-lock.json frontend/index.html frontend/vite.config.ts frontend/tsconfig.json frontend/tsconfig.node.json frontend/.env.example
git commit -m "feat: scaffold frontend app"
```

## Task 2: Add App Bootstrap, Providers, And Clean Mobility Styles

**Files:**
- Create: `frontend/src/main.tsx`
- Create: `frontend/src/app/providers.tsx`
- Create: `frontend/src/app/App.tsx`
- Create: `frontend/src/app/styles.css`
- Create: `frontend/src/test/setup.ts`

- [ ] **Step 1: Create test setup**

Create `frontend/src/test/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 2: Create app providers**

Create `frontend/src/app/providers.tsx`:

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000
    }
  }
});

export function AppProviders({ children }: PropsWithChildren) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
```

- [ ] **Step 3: Create top-level app**

Create `frontend/src/app/App.tsx`:

```tsx
import { AppRoutes } from "./routes";
import "./styles.css";

export function App() {
  return <AppRoutes />;
}
```

- [ ] **Step 4: Create bootstrap entry**

Create `frontend/src/main.tsx`:

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./app/App";
import { AppProviders } from "./app/providers";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AppProviders>
        <App />
      </AppProviders>
    </BrowserRouter>
  </StrictMode>
);
```

- [ ] **Step 5: Add Clean Mobility CSS foundation**

Create `frontend/src/app/styles.css`:

```css
:root {
  color: #17202f;
  background: #f4f9fb;
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  --color-ink: #17202f;
  --color-muted: #667586;
  --color-border: #d8e4ea;
  --color-surface: #ffffff;
  --color-surface-blue: #eaf6f8;
  --color-nav: #0f4c5c;
  --color-teal: #2a9d8f;
  --color-cyan: #38bdf8;
  --color-orange: #f4a261;
  --color-orange-dark: #d97828;
  --color-danger: #d94f45;
  --radius: 8px;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
}

button,
input,
select {
  font: inherit;
}

a {
  color: inherit;
  text-decoration: none;
}

.app-shell {
  min-height: 100vh;
  background: linear-gradient(180deg, #eaf6f8 0, #f7fafc 280px);
}

.top-nav {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 28px;
  color: #ffffff;
  background: var(--color-nav);
}

.brand {
  font-size: 20px;
  font-weight: 800;
}

.nav-links {
  display: flex;
  gap: 18px;
  align-items: center;
  font-size: 14px;
}

.nav-link {
  color: #d8f1f4;
}

.nav-link.active {
  color: #ffffff;
  font-weight: 700;
}

.page {
  width: min(1180px, calc(100vw - 32px));
  margin: 0 auto;
  padding: 28px 0 48px;
}

.panel {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  box-shadow: 0 16px 40px rgb(15 76 92 / 8%);
}

.page-title {
  margin: 0;
  font-size: 28px;
  line-height: 1.2;
}

.page-subtitle {
  margin: 8px 0 0;
  color: var(--color-muted);
}

@media (max-width: 720px) {
  .top-nav {
    height: auto;
    align-items: flex-start;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
  }

  .nav-links {
    flex-wrap: wrap;
  }
}
```

- [ ] **Step 6: Run build to reveal missing routes**

Run:

```bash
cd frontend
npm run build
```

Expected: FAIL with TypeScript error that `./routes` cannot be found. This confirms the scaffold compiles far enough to reach app composition.

- [ ] **Step 7: Commit bootstrap**

```bash
git add frontend/src/main.tsx frontend/src/app/providers.tsx frontend/src/app/App.tsx frontend/src/app/styles.css frontend/src/test/setup.ts
git commit -m "feat: add frontend app bootstrap"
```

## Task 3: Add Auth Store With Tests

**Files:**
- Create: `frontend/src/features/auth/authStore.ts`
- Create: `frontend/src/features/auth/authStore.test.ts`

- [ ] **Step 1: Write auth store tests**

Create `frontend/src/features/auth/authStore.test.ts`:

```ts
import { afterEach, describe, expect, it } from "vitest";
import { authStore } from "./authStore";

describe("authStore", () => {
  afterEach(() => {
    authStore.clearToken();
    window.localStorage.clear();
  });

  it("stores and reads the JWT token", () => {
    authStore.setToken("token-123");

    expect(authStore.getToken()).toBe("token-123");
    expect(window.localStorage.getItem("transport.jwt")).toBe("token-123");
  });

  it("clears the JWT token", () => {
    authStore.setToken("token-123");

    authStore.clearToken();

    expect(authStore.getToken()).toBeNull();
    expect(window.localStorage.getItem("transport.jwt")).toBeNull();
  });

  it("reports authentication state", () => {
    expect(authStore.isAuthenticated()).toBe(false);

    authStore.setToken("token-123");

    expect(authStore.isAuthenticated()).toBe(true);
  });
});
```

- [ ] **Step 2: Run auth tests to verify failure**

Run:

```bash
cd frontend
npm test -- src/features/auth/authStore.test.ts
```

Expected: FAIL because `./authStore` does not exist.

- [ ] **Step 3: Implement auth store**

Create `frontend/src/features/auth/authStore.ts`:

```ts
const TOKEN_KEY = "transport.jwt";

export const authStore = {
  getToken(): string | null {
    return window.localStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string): void {
    window.localStorage.setItem(TOKEN_KEY, token);
  },

  clearToken(): void {
    window.localStorage.removeItem(TOKEN_KEY);
  },

  isAuthenticated(): boolean {
    return Boolean(this.getToken());
  }
};
```

- [ ] **Step 4: Run auth tests to verify pass**

Run:

```bash
cd frontend
npm test -- src/features/auth/authStore.test.ts
```

Expected: PASS, 3 tests.

- [ ] **Step 5: Commit auth store**

```bash
git add frontend/src/features/auth/authStore.ts frontend/src/features/auth/authStore.test.ts
git commit -m "feat: add frontend auth token store"
```

## Task 4: Add API Configuration, Types, And HTTP Client

**Files:**
- Create: `frontend/src/api/config.ts`
- Create: `frontend/src/api/types.ts`
- Create: `frontend/src/api/http.ts`
- Create: `frontend/src/api/http.test.ts`

- [ ] **Step 1: Write HTTP client tests**

Create `frontend/src/api/http.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiRequest } from "./http";
import { authStore } from "../features/auth/authStore";

describe("apiRequest", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    authStore.clearToken();
  });

  it("parses JSON responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ id: "1" })
      })
    );

    await expect(apiRequest<{ id: string }>("/api/test")).resolves.toEqual({ id: "1" });
  });

  it("attaches bearer token when present", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
      headers: new Headers()
    });
    vi.stubGlobal("fetch", fetchMock);
    authStore.setToken("jwt-123");

    await apiRequest("/api/test");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/api/test",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer jwt-123"
        })
      })
    );
  });

  it("throws ApiError with backend error payload", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({
          timestamp: "2026-05-22T00:00:00Z",
          status: 409,
          error: "Conflict",
          message: "Email already exists",
          path: "/api/auth/register"
        })
      })
    );

    await expect(apiRequest("/api/test")).rejects.toMatchObject({
      status: 409,
      payload: {
        message: "Email already exists"
      }
    });
  });
});
```

- [ ] **Step 2: Run HTTP tests to verify failure**

Run:

```bash
cd frontend
npm test -- src/api/http.test.ts
```

Expected: FAIL because `./http` does not exist.

- [ ] **Step 3: Add API config**

Create `frontend/src/api/config.ts`:

```ts
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:8080";
```

- [ ] **Step 4: Add API types**

Create `frontend/src/api/types.ts`:

```ts
export type UserRole = "PASSENGER" | "DRIVER" | "ADMIN";

export type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED";

export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";

export type TripStatus = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export interface ApiErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType?: string;
}

export interface User {
  id: string;
  email: string;
  phone: string;
  fullName: string;
  roles: UserRole[];
}

export interface City {
  id: string;
  name: string;
  region: string;
  country: string;
  active: boolean;
}

export interface Route {
  id: string;
  fromCityId: string;
  toCityId: string;
  distanceKm: number;
  active: boolean;
}

export interface Trip {
  id: string;
  routeId: string;
  departureTime: string;
  arrivalTime: string;
  status: TripStatus;
  capacity: number;
  availableSeats: number;
  price: number;
}

export interface Booking {
  id: string;
  userId: string;
  tripId: string;
  seatNumber: string;
  status: BookingStatus;
  createdAt: string;
}

export interface Payment {
  id: string;
  targetType: "BOOKING" | "CARGO";
  targetId: string;
  userId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
}
```

- [ ] **Step 5: Implement HTTP client**

Create `frontend/src/api/http.ts`:

```ts
import { authStore } from "../features/auth/authStore";
import { API_BASE_URL } from "./config";
import type { ApiErrorResponse } from "./types";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload?: ApiErrorResponse
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiRequest<TResponse = void>(
  path: string,
  init: RequestInit = {}
): Promise<TResponse> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(init.body ? { "Content-Type": "application/json" } : {}),
    ...headersToRecord(init.headers)
  };

  const token = authStore.getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers
  });

  if (!response.ok) {
    const payload = await parseJson<ApiErrorResponse>(response);
    throw new ApiError(payload?.message ?? `Request failed with ${response.status}`, response.status, payload);
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  return parseJson<TResponse>(response) as Promise<TResponse>;
}

async function parseJson<T>(response: Response): Promise<T | undefined> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return undefined;
  }
  return response.json() as Promise<T>;
}

function headersToRecord(headers: HeadersInit | undefined): Record<string, string> {
  if (!headers) {
    return {};
  }
  if (headers instanceof Headers) {
    return Object.fromEntries(headers.entries());
  }
  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }
  return headers;
}
```

- [ ] **Step 6: Run HTTP tests**

Run:

```bash
cd frontend
npm test -- src/api/http.test.ts
```

Expected: PASS, 3 tests.

- [ ] **Step 7: Commit API client**

```bash
git add frontend/src/api/config.ts frontend/src/api/types.ts frontend/src/api/http.ts frontend/src/api/http.test.ts
git commit -m "feat: add frontend API client"
```

## Task 5: Add Shared UI Components

**Files:**
- Create: `frontend/src/shared/ui/Button.tsx`
- Create: `frontend/src/shared/ui/Button.test.tsx`
- Create: `frontend/src/shared/ui/StatusChip.tsx`
- Create: `frontend/src/shared/ui/StatusChip.test.tsx`

- [ ] **Step 1: Write Button tests**

Create `frontend/src/shared/ui/Button.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "./Button";

describe("Button", () => {
  it("renders a primary button by default", () => {
    render(<Button>Search</Button>);

    expect(screen.getByRole("button", { name: "Search" })).toHaveClass("button-primary");
  });

  it("renders a secondary button", () => {
    render(<Button variant="secondary">Cancel</Button>);

    expect(screen.getByRole("button", { name: "Cancel" })).toHaveClass("button-secondary");
  });
});
```

- [ ] **Step 2: Write StatusChip tests**

Create `frontend/src/shared/ui/StatusChip.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusChip } from "./StatusChip";

describe("StatusChip", () => {
  it("renders confirmed status as success", () => {
    render(<StatusChip status="CONFIRMED" />);

    expect(screen.getByText("CONFIRMED")).toHaveClass("status-success");
  });

  it("renders failed status as danger", () => {
    render(<StatusChip status="FAILED" />);

    expect(screen.getByText("FAILED")).toHaveClass("status-danger");
  });
});
```

- [ ] **Step 3: Run UI tests to verify failure**

Run:

```bash
cd frontend
npm test -- src/shared/ui/Button.test.tsx src/shared/ui/StatusChip.test.tsx
```

Expected: FAIL because shared UI components do not exist.

- [ ] **Step 4: Implement Button**

Create `frontend/src/shared/ui/Button.tsx`:

```tsx
import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

type ButtonVariant = "primary" | "secondary";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({
  variant = "primary",
  className,
  children,
  ...props
}: PropsWithChildren<ButtonProps>) {
  const classes = ["button", `button-${variant}`, className].filter(Boolean).join(" ");
  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
```

- [ ] **Step 5: Implement StatusChip**

Create `frontend/src/shared/ui/StatusChip.tsx`:

```tsx
import type { BookingStatus, PaymentStatus, TripStatus } from "../../api/types";

type Status = BookingStatus | PaymentStatus | TripStatus;

const successStatuses: Status[] = ["CONFIRMED", "SUCCESS", "COMPLETED"];
const dangerStatuses: Status[] = ["CANCELLED", "FAILED"];
const warningStatuses: Status[] = ["PENDING", "REFUNDED"];

export function StatusChip({ status }: { status: Status }) {
  const tone = getTone(status);
  return <span className={`status-chip status-${tone}`}>{status}</span>;
}

function getTone(status: Status): "success" | "danger" | "warning" | "neutral" {
  if (successStatuses.includes(status)) {
    return "success";
  }
  if (dangerStatuses.includes(status)) {
    return "danger";
  }
  if (warningStatuses.includes(status)) {
    return "warning";
  }
  return "neutral";
}
```

- [ ] **Step 6: Add component CSS**

Append to `frontend/src/app/styles.css`:

```css
.button {
  min-height: 40px;
  border: 1px solid transparent;
  border-radius: 8px;
  padding: 0 16px;
  font-weight: 700;
  cursor: pointer;
}

.button-primary {
  color: #17202f;
  background: var(--color-orange);
  border-color: var(--color-orange);
}

.button-primary:hover {
  background: #f0b173;
}

.button-secondary {
  color: var(--color-nav);
  background: #ffffff;
  border-color: var(--color-border);
}

.status-chip {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  border-radius: 999px;
  padding: 0 10px;
  font-size: 12px;
  font-weight: 800;
}

.status-success {
  color: #0f5f52;
  background: #dff7f1;
}

.status-danger {
  color: #982f28;
  background: #fde4e1;
}

.status-warning {
  color: #84510d;
  background: #fff1d8;
}

.status-neutral {
  color: #335064;
  background: #e8f2f6;
}
```

- [ ] **Step 7: Run UI tests**

Run:

```bash
cd frontend
npm test -- src/shared/ui/Button.test.tsx src/shared/ui/StatusChip.test.tsx
```

Expected: PASS, 4 tests.

- [ ] **Step 8: Commit shared UI**

```bash
git add frontend/src/shared/ui/Button.tsx frontend/src/shared/ui/Button.test.tsx frontend/src/shared/ui/StatusChip.tsx frontend/src/shared/ui/StatusChip.test.tsx frontend/src/app/styles.css
git commit -m "feat: add frontend shared UI components"
```

## Task 6: Add Routes, Protected Pages, And App Shell

**Files:**
- Create: `frontend/src/app/routes.tsx`
- Create: `frontend/src/app/App.test.tsx`
- Create: `frontend/src/pages/LoginPage.tsx`
- Create: `frontend/src/pages/SearchPage.tsx`
- Create: `frontend/src/pages/MyBookingsPage.tsx`
- Create: `frontend/src/pages/ProfilePage.tsx`
- Modify: `frontend/src/app/styles.css`

- [ ] **Step 1: Write app routing tests**

Create `frontend/src/app/App.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { AppProviders } from "./providers";
import { App } from "./App";
import { authStore } from "../features/auth/authStore";

function renderApp(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppProviders>
        <App />
      </AppProviders>
    </MemoryRouter>
  );
}

describe("App routes", () => {
  afterEach(() => {
    authStore.clearToken();
  });

  it("shows search page on root", () => {
    renderApp("/");

    expect(screen.getByRole("heading", { name: "Find a trip" })).toBeInTheDocument();
  });

  it("shows login page", () => {
    renderApp("/login");

    expect(screen.getByRole("heading", { name: "Welcome back" })).toBeInTheDocument();
  });

  it("redirects protected bookings page to login when unauthenticated", () => {
    renderApp("/bookings");

    expect(screen.getByRole("heading", { name: "Welcome back" })).toBeInTheDocument();
  });

  it("shows protected bookings page when authenticated", () => {
    authStore.setToken("jwt-123");

    renderApp("/bookings");

    expect(screen.getByRole("heading", { name: "My bookings" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run route tests to verify failure**

Run:

```bash
cd frontend
npm test -- src/app/App.test.tsx
```

Expected: FAIL because routes and pages do not exist.

- [ ] **Step 3: Create routes**

Create `frontend/src/app/routes.tsx`:

```tsx
import type { PropsWithChildren } from "react";
import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import { authStore } from "../features/auth/authStore";
import { LoginPage } from "../pages/LoginPage";
import { MyBookingsPage } from "../pages/MyBookingsPage";
import { ProfilePage } from "../pages/ProfilePage";
import { SearchPage } from "../pages/SearchPage";

export function AppRoutes() {
  return (
    <div className="app-shell">
      <header className="top-nav">
        <NavLink to="/" className="brand">
          RouteFlow
        </NavLink>
        <nav className="nav-links" aria-label="Main navigation">
          <NavLink to="/" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            Trips
          </NavLink>
          <NavLink
            to="/bookings"
            className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
          >
            Bookings
          </NavLink>
          <NavLink
            to="/profile"
            className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
          >
            Profile
          </NavLink>
          <NavLink
            to="/login"
            className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
          >
            Login
          </NavLink>
        </nav>
      </header>
      <Routes>
        <Route path="/" element={<SearchPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/bookings"
          element={
            <ProtectedRoute>
              <MyBookingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}

function ProtectedRoute({ children }: PropsWithChildren) {
  if (!authStore.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
```

- [ ] **Step 4: Create login page**

Create `frontend/src/pages/LoginPage.tsx`:

```tsx
import { Button } from "../shared/ui/Button";

export function LoginPage() {
  return (
    <main className="page auth-page">
      <section className="panel auth-panel">
        <p className="eyebrow">Passenger access</p>
        <h1 className="page-title">Welcome back</h1>
        <p className="page-subtitle">Sign in to manage bookings and payment status.</p>
        <form className="form-grid">
          <label>
            Email
            <input type="email" placeholder="passenger@example.com" />
          </label>
          <label>
            Password
            <input type="password" placeholder="Password" />
          </label>
          <Button type="button">Login</Button>
        </form>
      </section>
    </main>
  );
}
```

- [ ] **Step 5: Create search page**

Create `frontend/src/pages/SearchPage.tsx`:

```tsx
import { Button } from "../shared/ui/Button";
import { StatusChip } from "../shared/ui/StatusChip";

const demoTrips = [
  { time: "08:20", route: "Yekaterinburg -> Tyumen", seats: 18, price: 1200 },
  { time: "12:45", route: "Yekaterinburg -> Tyumen", seats: 15, price: 1450 },
  { time: "18:10", route: "Yekaterinburg -> Tyumen", seats: 12, price: 1700 }
];

export function SearchPage() {
  return (
    <main className="page search-layout">
      <aside className="panel search-panel">
        <p className="eyebrow">Search trip</p>
        <label>
          From
          <input placeholder="Yekaterinburg" />
        </label>
        <label>
          To
          <input placeholder="Tyumen" />
        </label>
        <label>
          Date
          <input type="date" />
        </label>
        <Button type="button">Search</Button>
      </aside>
      <section className="results-panel">
        <div className="results-header">
          <div>
            <h1 className="page-title">Find a trip</h1>
            <p className="page-subtitle">Search routes, compare seats, and book through the gateway.</p>
          </div>
          <StatusChip status="SCHEDULED" />
        </div>
        <div className="trip-list">
          {demoTrips.map((trip) => (
            <article className="trip-card panel" key={trip.time}>
              <div>
                <strong>{trip.time}</strong>
                <span>departure</span>
              </div>
              <div>
                <strong>{trip.route}</strong>
                <span>{trip.seats} seats available</span>
              </div>
              <strong>{trip.price} RUB</strong>
              <Button type="button">Book</Button>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
```

- [ ] **Step 6: Create bookings page**

Create `frontend/src/pages/MyBookingsPage.tsx`:

```tsx
import { StatusChip } from "../shared/ui/StatusChip";

export function MyBookingsPage() {
  return (
    <main className="page">
      <section className="panel content-panel">
        <h1 className="page-title">My bookings</h1>
        <p className="page-subtitle">Confirmed and pending passenger bookings will appear here.</p>
        <div className="booking-row">
          <span>Yekaterinburg -> Tyumen</span>
          <StatusChip status="CONFIRMED" />
        </div>
      </section>
    </main>
  );
}
```

- [ ] **Step 7: Create profile page**

Create `frontend/src/pages/ProfilePage.tsx`:

```tsx
export function ProfilePage() {
  return (
    <main className="page">
      <section className="panel content-panel">
        <h1 className="page-title">Profile</h1>
        <p className="page-subtitle">Current passenger profile details will load from `/api/users/me`.</p>
      </section>
    </main>
  );
}
```

- [ ] **Step 8: Add page CSS**

Append to `frontend/src/app/styles.css`:

```css
.eyebrow {
  margin: 0 0 8px;
  color: var(--color-teal);
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

.search-layout {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 20px;
}

.search-panel,
.content-panel,
.auth-panel {
  padding: 20px;
}

.search-panel {
  display: grid;
  align-content: start;
  gap: 14px;
}

.form-grid {
  display: grid;
  gap: 14px;
  margin-top: 22px;
}

label {
  display: grid;
  gap: 6px;
  color: var(--color-muted);
  font-size: 13px;
  font-weight: 700;
}

input {
  width: 100%;
  min-height: 40px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 0 12px;
  color: var(--color-ink);
  background: #ffffff;
}

.results-panel {
  min-width: 0;
}

.results-header {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: flex-start;
  margin-bottom: 18px;
}

.trip-list {
  display: grid;
  gap: 12px;
}

.trip-card {
  display: grid;
  grid-template-columns: 100px 1fr 100px 110px;
  gap: 16px;
  align-items: center;
  padding: 16px;
}

.trip-card span {
  display: block;
  margin-top: 4px;
  color: var(--color-muted);
  font-size: 12px;
}

.auth-page {
  display: grid;
  place-items: start center;
}

.auth-panel {
  width: min(460px, 100%);
}

.booking-row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-top: 20px;
  padding: 14px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
}

@media (max-width: 860px) {
  .search-layout {
    grid-template-columns: 1fr;
  }

  .trip-card {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 9: Run app routing tests**

Run:

```bash
cd frontend
npm test -- src/app/App.test.tsx
```

Expected: PASS, 4 tests.

- [ ] **Step 10: Commit routes and pages**

```bash
git add frontend/src/app/routes.tsx frontend/src/app/App.test.tsx frontend/src/pages/LoginPage.tsx frontend/src/pages/SearchPage.tsx frontend/src/pages/MyBookingsPage.tsx frontend/src/pages/ProfilePage.tsx frontend/src/app/styles.css
git commit -m "feat: add frontend app shell routes"
```

## Task 7: Final Foundation Verification

**Files:**
- Modify: `TODO.md`

- [ ] **Step 1: Run full frontend test suite**

Run:

```bash
cd frontend
npm test
```

Expected: PASS for auth store, HTTP client, shared UI, and app routing tests.

- [ ] **Step 2: Run production build**

Run:

```bash
cd frontend
npm run build
```

Expected: TypeScript build and Vite production build complete successfully, producing `frontend/dist`.

- [ ] **Step 3: Run dev server**

Run:

```bash
cd frontend
npm run dev
```

Expected: Vite serves the app at `http://localhost:5173`.

- [ ] **Step 4: Browser smoke test**

Open `http://localhost:5173` and verify:

- The top navigation shows `RouteFlow`, `Trips`, `Bookings`, `Profile`, `Login`.
- The root page heading is `Find a trip`.
- The visual direction matches Clean Mobility: deep teal navigation, light blue background, orange action buttons.
- Navigating to `/bookings` while logged out redirects to `/login`.

- [ ] **Step 5: Update TODO**

In `TODO.md`, mark these foundation items as complete:

```markdown
  - [x] Frontend foundation.
    - [x] Создать отдельное Node-приложение в корневой папке `frontend/`, не смешивая его с Maven modules в `services/`.
    - [x] Выбрать и зафиксировать stack: React, Vite, TypeScript, React Router, TanStack Query.
    - [x] Настроить `.env.example` и dev proxy/base URL для API Gateway `http://localhost:8080`.
    - [x] Добавить базовую структуру `src/app`, `src/pages`, `src/features`, `src/shared`, `src/api`.
    - [x] Настроить app shell, routing, protected routes и auth state.
```

Leave this item unchecked unless generated OpenAPI client code is implemented in this task:

```markdown
    - [ ] Подключить API client и типы, желательно генерируемые из текущих OpenAPI contracts.
```

If this plan implements only schema-aligned handwritten types, update the text to:

```markdown
    - [x] Подключить базовый API client и schema-aligned TypeScript types; генерацию из OpenAPI вынести отдельной подзадачей.
    - [ ] Добавить генерацию frontend API client/types из OpenAPI contracts.
```

- [ ] **Step 6: Commit verification update**

```bash
git add TODO.md
git commit -m "docs: mark frontend foundation progress"
```

## Self-Review

- Spec coverage: this plan covers root `frontend/`, stack choice, Gateway-only API base URL, app shell, routing, protected routes, auth state, Clean Mobility visual foundation, API error parsing, loading-ready page structure, tests, and build verification.
- Deferred by design: generated OpenAPI client code is not implemented directly here. The plan creates schema-aligned API types and leaves explicit TODO tracking for OpenAPI generation as the next foundation enhancement.
- Placeholder scan: no `TBD`, `TODO:`, `FIXME`, or vague implementation-only steps remain.
- Type consistency: statuses used by `StatusChip` are defined in `frontend/src/api/types.ts`; `authStore` is used by the HTTP client and protected route tests with matching method names.
