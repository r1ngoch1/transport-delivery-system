# RouteFlow Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the full RouteFlow frontend into a forest/copper route-map workspace while preserving existing API behavior and routes.

**Architecture:** Introduce a small shared layout/UI layer first, then migrate pages onto it in focused passes. Keep React Router, TanStack Query, generated API clients, and existing data flow unchanged. Use CSS design tokens in `frontend/src/app/styles.css` as the source of visual truth.

**Tech Stack:** React 19, Vite, TypeScript, React Router, TanStack Query, Vitest, Testing Library, CSS.

---

## File Structure

- Modify `frontend/src/app/styles.css`: design tokens, shell/layout classes, route-map classes, page/panel/list responsive rules.
- Modify `frontend/src/app/routes.tsx`: use `AppShell` and keep route definitions/protection behavior intact.
- Create `frontend/src/shared/ui/AppShell.tsx`: global shell and top navigation layout.
- Create `frontend/src/shared/ui/AppShell.test.tsx`: shell navigation and logout behavior.
- Create `frontend/src/shared/ui/PageHeader.tsx`: reusable title/subtitle/action header.
- Create `frontend/src/shared/ui/PageHeader.test.tsx`: header content and optional actions.
- Create `frontend/src/shared/ui/DataPanel.tsx`: shared framed section wrapper.
- Create `frontend/src/shared/ui/DataPanel.test.tsx`: title/eyebrow/body rendering.
- Create `frontend/src/shared/ui/ListRow.tsx`: consistent static/clickable rows.
- Create `frontend/src/shared/ui/ListRow.test.tsx`: button vs article semantics.
- Create `frontend/src/shared/ui/MetricTile.tsx`: dashboard metric links/cards.
- Create `frontend/src/shared/ui/MetricTile.test.tsx`: metric label/value/link rendering.
- Create `frontend/src/shared/ui/RouteMapPreview.tsx`: non-provider route visualization component.
- Create `frontend/src/shared/ui/RouteMapPreview.test.tsx`: city, distance, duration, loading/empty rendering.
- Modify `frontend/src/shared/ui/Button.tsx`: keep existing API, add optional `tone` only if needed by tasks below.
- Modify `frontend/src/shared/ui/Button.test.tsx`: preserve current variant expectations.
- Modify `frontend/src/shared/ui/StatusChip.tsx`: extend tone coverage for cargo/driver/admin statuses without changing props.
- Modify `frontend/src/shared/ui/StatusChip.test.tsx`: add route workspace tone cases.
- Modify `frontend/src/shared/ui/ScreenState.tsx`: keep props, align default class with new panel styling.
- Modify `frontend/src/shared/ui/ApiErrorMessage.tsx`: keep behavior, align class naming if needed.
- Modify `frontend/src/pages/SearchPage.tsx`: left search column, route preview, result rows.
- Modify `frontend/src/pages/AdminPage.tsx`: shared panels, rows, metric tiles.
- Modify `frontend/src/pages/DriverPage.tsx`: shared panels, route preview, schedule/availability hierarchy.
- Modify `frontend/src/pages/MyBookingsPage.tsx`: shared rows/panels.
- Modify `frontend/src/pages/MyCargoOrdersPage.tsx`: shared rows/panels.
- Modify `frontend/src/pages/NotificationsPage.tsx`: shared rows/panels.
- Modify `frontend/src/pages/ProfilePage.tsx`: shared panels/header.
- Modify `frontend/src/pages/LoginPage.tsx`: route workspace surface without marketing hero.
- Modify `frontend/src/features/notifications/NotificationCenter.tsx`: align popover/toast classes with new visual system.
- Modify `frontend/src/app/App.test.tsx`: update assertions only where accessible headings/labels intentionally change.

Before implementing, create an isolated worktree or branch because the current workspace may contain unrelated uncommitted work.

Run from repository root unless a command says `cd frontend`.

---

### Task 1: Shared Design Tokens And Shell

**Files:**
- Create: `frontend/src/shared/ui/AppShell.tsx`
- Create: `frontend/src/shared/ui/AppShell.test.tsx`
- Modify: `frontend/src/app/routes.tsx`
- Modify: `frontend/src/app/styles.css`

- [ ] **Step 1: Write failing AppShell tests**

Create `frontend/src/shared/ui/AppShell.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { AppShell } from "./AppShell";

describe("AppShell", () => {
  it("renders role-aware navigation links", () => {
    render(
      <MemoryRouter>
        <AppShell isAuthenticated isAdmin isDriver notificationsEnabled onLogout={vi.fn()}>
          <main>Page content</main>
        </AppShell>
      </MemoryRouter>
    );

    expect(screen.getByRole("link", { name: "RouteFlow" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Trips" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Cargo" })).toHaveAttribute("href", "/cargo");
    expect(screen.getByRole("link", { name: "Admin" })).toHaveAttribute("href", "/admin");
    expect(screen.getByRole("link", { name: "Driver" })).toHaveAttribute("href", "/driver");
    expect(screen.getByText("Page content")).toBeInTheDocument();
  });

  it("calls logout when logout is clicked", async () => {
    const user = userEvent.setup();
    const onLogout = vi.fn();

    render(
      <MemoryRouter>
        <AppShell isAuthenticated isAdmin={false} isDriver={false} notificationsEnabled={false} onLogout={onLogout}>
          <main>Page content</main>
        </AppShell>
      </MemoryRouter>
    );

    await user.click(screen.getByRole("button", { name: "Logout" }));

    expect(onLogout).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run the failing test**

Run:

```bash
cd frontend
npm run test -- src/shared/ui/AppShell.test.tsx
```

Expected: FAIL because `AppShell` does not exist.

- [ ] **Step 3: Create AppShell**

Create `frontend/src/shared/ui/AppShell.tsx`:

```tsx
import type { PropsWithChildren } from "react";
import { NavLink } from "react-router-dom";
import { NotificationCenter } from "../../features/notifications/NotificationCenter";

interface AppShellProps extends PropsWithChildren {
  isAdmin: boolean;
  isAuthenticated: boolean;
  isDriver: boolean;
  notificationsEnabled: boolean;
  onLogout: () => void;
}

export function AppShell({
  children,
  isAdmin,
  isAuthenticated,
  isDriver,
  notificationsEnabled,
  onLogout
}: AppShellProps) {
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
          <NavLink to="/bookings" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            Bookings
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            Profile
          </NavLink>
          {isAuthenticated && (
            <NavLink to="/cargo" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
              Cargo
            </NavLink>
          )}
          {isAdmin && (
            <NavLink to="/admin" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
              Admin
            </NavLink>
          )}
          {isDriver && (
            <NavLink to="/driver" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
              Driver
            </NavLink>
          )}
          <NotificationCenter enabled={notificationsEnabled} />
          {isAuthenticated ? (
            <button className="nav-button" type="button" onClick={onLogout}>
              Logout
            </button>
          ) : (
            <NavLink to="/login" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
              Login
            </NavLink>
          )}
        </nav>
      </header>
      {children}
    </div>
  );
}
```

- [ ] **Step 4: Wire AppShell into routes**

In `frontend/src/app/routes.tsx`, remove the direct `NotificationCenter` import and import `AppShell`:

```tsx
import { AppShell } from "../shared/ui/AppShell";
```

Replace the outer `<div className="app-shell">...</div>` shell with:

```tsx
  return (
    <AppShell
      isAuthenticated={Boolean(token)}
      isAdmin={isAdmin}
      isDriver={isDriver}
      notificationsEnabled={Boolean(token) && currentUserQuery.isSuccess && roles.length > 0}
      onLogout={handleLogout}
    >
      <Routes>
        {/* keep every existing Route unchanged */}
      </Routes>
    </AppShell>
  );
```

Keep all route elements and route guard components unchanged.

- [ ] **Step 5: Add forest/copper design tokens**

In `frontend/src/app/styles.css`, replace the `:root` token block with:

```css
:root {
  color: #2a241d;
  background: #f8f4ed;
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  --color-ink: #2a241d;
  --color-muted: #7d7163;
  --color-border: #e3d6c3;
  --color-surface: #fffaf2;
  --color-surface-raised: #ffffff;
  --color-route-paper: #f8f4ed;
  --color-route-soft: #efe6d8;
  --color-nav: #24413b;
  --color-teal: #4b8f8c;
  --color-copper: #d77842;
  --color-copper-dark: #a6532f;
  --color-danger: #b64c42;
  --color-success: #2f7d62;
  --color-warning: #9a6a24;
  --shadow-panel: 0 18px 42px rgb(42 36 29 / 10%);
  --radius: 8px;
}
```

Update `.app-shell`, `.top-nav`, `.panel`, `.button-primary`, `.button-secondary`, `.nav-button`, `.eyebrow`, `input`, and `select` to use the new variables. Preserve existing class names so current pages keep rendering during migration.

- [ ] **Step 6: Run shell and app tests**

Run:

```bash
cd frontend
npm run test -- src/shared/ui/AppShell.test.tsx src/app/App.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Commit**

Run:

```bash
git add frontend/src/shared/ui/AppShell.tsx frontend/src/shared/ui/AppShell.test.tsx frontend/src/app/routes.tsx frontend/src/app/styles.css
git commit -m "feat(frontend): add route workspace shell"
```

---

### Task 2: Shared UI Primitives

**Files:**
- Create: `frontend/src/shared/ui/PageHeader.tsx`
- Create: `frontend/src/shared/ui/PageHeader.test.tsx`
- Create: `frontend/src/shared/ui/DataPanel.tsx`
- Create: `frontend/src/shared/ui/DataPanel.test.tsx`
- Create: `frontend/src/shared/ui/ListRow.tsx`
- Create: `frontend/src/shared/ui/ListRow.test.tsx`
- Create: `frontend/src/shared/ui/MetricTile.tsx`
- Create: `frontend/src/shared/ui/MetricTile.test.tsx`
- Modify: `frontend/src/app/styles.css`

- [ ] **Step 1: Write failing primitive tests**

Create `frontend/src/shared/ui/PageHeader.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PageHeader } from "./PageHeader";

describe("PageHeader", () => {
  it("renders eyebrow, title, subtitle, and actions", () => {
    render(
      <PageHeader eyebrow="Network" title="Trips" subtitle="Search active route capacity.">
        <button type="button">Refresh</button>
      </PageHeader>
    );

    expect(screen.getByText("Network")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Trips" })).toBeInTheDocument();
    expect(screen.getByText("Search active route capacity.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Refresh" })).toBeInTheDocument();
  });
});
```

Create `frontend/src/shared/ui/DataPanel.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DataPanel } from "./DataPanel";

describe("DataPanel", () => {
  it("renders a titled panel", () => {
    render(
      <DataPanel eyebrow="Schedule" title="Upcoming assignments">
        <p>Trip row</p>
      </DataPanel>
    );

    expect(screen.getByText("Schedule")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Upcoming assignments" })).toBeInTheDocument();
    expect(screen.getByText("Trip row")).toBeInTheDocument();
  });
});
```

Create `frontend/src/shared/ui/ListRow.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ListRow } from "./ListRow";

describe("ListRow", () => {
  it("renders static content as an article", () => {
    render(<ListRow title="Booking booking-1" meta="Trip trip-1" />);

    expect(screen.getByRole("article", { name: "Booking booking-1" })).toBeInTheDocument();
    expect(screen.getByText("Trip trip-1")).toBeInTheDocument();
  });

  it("renders clickable content as a button", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<ListRow title="Documents" meta="Cargo order" onClick={onClick} />);

    await user.click(screen.getByRole("button", { name: "Documents Cargo order" }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
```

Create `frontend/src/shared/ui/MetricTile.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { MetricTile } from "./MetricTile";

describe("MetricTile", () => {
  it("renders as a link when href is provided", () => {
    render(
      <MemoryRouter>
        <MetricTile href="/admin/trips" label="Trips" value="12" />
      </MemoryRouter>
    );

    expect(screen.getByRole("link", { name: "Trips 12" })).toHaveAttribute("href", "/admin/trips");
  });
});
```

- [ ] **Step 2: Run failing tests**

Run:

```bash
cd frontend
npm run test -- src/shared/ui/PageHeader.test.tsx src/shared/ui/DataPanel.test.tsx src/shared/ui/ListRow.test.tsx src/shared/ui/MetricTile.test.tsx
```

Expected: FAIL because the components do not exist.

- [ ] **Step 3: Create primitives**

Create `frontend/src/shared/ui/PageHeader.tsx`:

```tsx
import type { PropsWithChildren, ReactNode } from "react";

interface PageHeaderProps extends PropsWithChildren {
  eyebrow?: string;
  subtitle?: ReactNode;
  title: string;
}

export function PageHeader({ children, eyebrow, subtitle, title }: PageHeaderProps) {
  return (
    <div className="page-header">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {children && <div className="page-actions">{children}</div>}
    </div>
  );
}
```

Create `frontend/src/shared/ui/DataPanel.tsx`:

```tsx
import type { PropsWithChildren } from "react";

interface DataPanelProps extends PropsWithChildren {
  className?: string;
  eyebrow?: string;
  title?: string;
}

export function DataPanel({ children, className, eyebrow, title }: DataPanelProps) {
  const classes = ["panel", "data-panel", className].filter(Boolean).join(" ");
  return (
    <section className={classes}>
      {(eyebrow || title) && (
        <div className="data-panel-header">
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          {title && <h2 className="section-title">{title}</h2>}
        </div>
      )}
      {children}
    </section>
  );
}
```

Create `frontend/src/shared/ui/ListRow.tsx`:

```tsx
import type { ReactNode } from "react";

interface ListRowProps {
  aside?: ReactNode;
  children?: ReactNode;
  meta?: ReactNode;
  onClick?: () => void;
  title: ReactNode;
}

export function ListRow({ aside, children, meta, onClick, title }: ListRowProps) {
  const body = (
    <>
      <div className="list-row-main">
        <strong>{title}</strong>
        {meta && <span>{meta}</span>}
        {children}
      </div>
      {aside && <div className="list-row-aside">{aside}</div>}
    </>
  );

  if (onClick) {
    return (
      <button className="list-row" type="button" onClick={onClick}>
        {body}
      </button>
    );
  }

  return (
    <article aria-label={typeof title === "string" ? title : undefined} className="list-row">
      {body}
    </article>
  );
}
```

Create `frontend/src/shared/ui/MetricTile.tsx`:

```tsx
import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";

interface MetricTileProps {
  href?: string;
  label: string;
  value: ReactNode;
}

export function MetricTile({ href, label, value }: MetricTileProps) {
  const content = (
    <>
      <span>{label}</span>
      <strong>{value}</strong>
    </>
  );

  if (href) {
    return (
      <NavLink className="metric-tile" to={href}>
        {content}
      </NavLink>
    );
  }

  return <div className="metric-tile">{content}</div>;
}
```

- [ ] **Step 4: Add primitive styles**

Append these classes to `frontend/src/app/styles.css` near existing shared layout styles:

```css
.page-header,
.data-panel-header,
.list-row,
.metric-tile {
  min-width: 0;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 18px;
}

.page-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

.data-panel {
  display: grid;
  gap: 14px;
  padding: 18px;
}

.data-panel-header {
  display: grid;
  gap: 4px;
}

.list-row {
  width: 100%;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 12px;
  color: var(--color-ink);
  text-align: left;
  background: var(--color-surface-raised);
}

button.list-row {
  cursor: pointer;
}

button.list-row:hover {
  border-color: rgb(215 120 66 / 60%);
}

.list-row-main {
  display: grid;
  gap: 4px;
}

.list-row-main span,
.list-row-aside {
  color: var(--color-muted);
  font-size: 12px;
}

.metric-tile {
  display: grid;
  gap: 8px;
  min-height: 92px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 14px;
  color: var(--color-ink);
  background: var(--color-surface-raised);
}

.metric-tile span {
  color: var(--color-muted);
  font-size: 13px;
  font-weight: 800;
}

.metric-tile strong {
  font-size: 24px;
}
```

- [ ] **Step 5: Run primitive tests**

Run:

```bash
cd frontend
npm run test -- src/shared/ui/PageHeader.test.tsx src/shared/ui/DataPanel.test.tsx src/shared/ui/ListRow.test.tsx src/shared/ui/MetricTile.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit**

Run:

```bash
git add frontend/src/shared/ui/PageHeader.tsx frontend/src/shared/ui/PageHeader.test.tsx frontend/src/shared/ui/DataPanel.tsx frontend/src/shared/ui/DataPanel.test.tsx frontend/src/shared/ui/ListRow.tsx frontend/src/shared/ui/ListRow.test.tsx frontend/src/shared/ui/MetricTile.tsx frontend/src/shared/ui/MetricTile.test.tsx frontend/src/app/styles.css
git commit -m "feat(frontend): add route workspace UI primitives"
```

---

### Task 3: Route Map Preview And Search Layout

**Files:**
- Create: `frontend/src/shared/ui/RouteMapPreview.tsx`
- Create: `frontend/src/shared/ui/RouteMapPreview.test.tsx`
- Modify: `frontend/src/pages/SearchPage.tsx`
- Modify: `frontend/src/app/styles.css`
- Modify: `frontend/src/app/App.test.tsx`

- [ ] **Step 1: Write failing RouteMapPreview tests**

Create `frontend/src/shared/ui/RouteMapPreview.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RouteMapPreview } from "./RouteMapPreview";

describe("RouteMapPreview", () => {
  it("renders selected route details", () => {
    render(
      <RouteMapPreview
        from="Yekaterinburg"
        to="Tyumen"
        distanceKm={330}
        durationMinutes={260}
        capacityLabel="18 seats available"
      />
    );

    expect(screen.getByRole("img", { name: "Route from Yekaterinburg to Tyumen" })).toBeInTheDocument();
    expect(screen.getByText("Yekaterinburg")).toBeInTheDocument();
    expect(screen.getByText("Tyumen")).toBeInTheDocument();
    expect(screen.getByText("330 km")).toBeInTheDocument();
    expect(screen.getByText("4h 20m")).toBeInTheDocument();
    expect(screen.getByText("18 seats available")).toBeInTheDocument();
  });

  it("renders empty route state", () => {
    render(<RouteMapPreview from="" to="" />);

    expect(screen.getByText("Choose a route to preview distance and capacity.")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run failing test**

Run:

```bash
cd frontend
npm run test -- src/shared/ui/RouteMapPreview.test.tsx
```

Expected: FAIL because `RouteMapPreview` does not exist.

- [ ] **Step 3: Create RouteMapPreview**

Create `frontend/src/shared/ui/RouteMapPreview.tsx`:

```tsx
interface RouteMapPreviewProps {
  capacityLabel?: string;
  distanceKm?: number;
  durationMinutes?: number;
  from: string;
  to: string;
}

export function RouteMapPreview({
  capacityLabel,
  distanceKm,
  durationMinutes,
  from,
  to
}: RouteMapPreviewProps) {
  const hasRoute = from.trim() && to.trim();

  return (
    <section className="route-map-panel panel" aria-label="Route preview">
      <div className="route-map-copy">
        <p className="eyebrow">Route preview</p>
        <h2 className="section-title">{hasRoute ? `${from} to ${to}` : "Select route"}</h2>
        {!hasRoute && (
          <p className="page-subtitle">Choose a route to preview distance and capacity.</p>
        )}
      </div>
      <div
        className="route-map-canvas"
        role="img"
        aria-label={hasRoute ? `Route from ${from} to ${to}` : "Route preview placeholder"}
      >
        <span className="route-pin route-pin-start" />
        <span className="route-path" />
        <span className="route-pin route-pin-end" />
        {hasRoute && (
          <>
            <span className="route-city route-city-start">{from}</span>
            <span className="route-city route-city-end">{to}</span>
          </>
        )}
      </div>
      {hasRoute && (
        <div className="route-map-stats">
          {distanceKm !== undefined && <span>{distanceKm} km</span>}
          {durationMinutes !== undefined && <span>{formatDuration(durationMinutes)}</span>}
          {capacityLabel && <span>{capacityLabel}</span>}
        </div>
      )}
    </section>
  );
}

function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours === 0) {
    return `${remainingMinutes}m`;
  }
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainingMinutes}m`;
}
```

- [ ] **Step 4: Add route map styles**

Append to `frontend/src/app/styles.css`:

```css
.route-map-panel {
  display: grid;
  gap: 14px;
  padding: 18px;
  overflow: hidden;
}

.route-map-canvas {
  position: relative;
  min-height: 168px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  overflow: hidden;
  background:
    linear-gradient(45deg, transparent 47%, rgb(75 143 140 / 16%) 48%, rgb(75 143 140 / 16%) 52%, transparent 53%),
    var(--color-surface);
}

.route-path {
  position: absolute;
  left: 42px;
  right: 42px;
  top: 52%;
  height: 4px;
  border-radius: 999px;
  background: var(--color-copper);
}

.route-pin {
  position: absolute;
  top: calc(52% - 11px);
  z-index: 1;
  width: 24px;
  height: 24px;
  border: 3px solid var(--color-surface);
  border-radius: 999px;
  box-shadow: 0 6px 18px rgb(42 36 29 / 18%);
}

.route-pin-start {
  left: 34px;
  background: var(--color-nav);
}

.route-pin-end {
  right: 34px;
  background: var(--color-copper);
}

.route-city {
  position: absolute;
  bottom: 18px;
  max-width: 38%;
  color: var(--color-ink);
  font-size: 12px;
  font-weight: 800;
}

.route-city-start {
  left: 22px;
}

.route-city-end {
  right: 22px;
  text-align: right;
}

.route-map-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.route-map-stats span {
  border-radius: 999px;
  padding: 6px 10px;
  color: var(--color-nav);
  background: var(--color-route-soft);
  font-size: 12px;
  font-weight: 800;
}
```

- [ ] **Step 5: Migrate SearchPage layout**

In `frontend/src/pages/SearchPage.tsx`, import:

```tsx
import { PageHeader } from "../shared/ui/PageHeader";
import { RouteMapPreview } from "../shared/ui/RouteMapPreview";
```

Add this derived route data after `routes`:

```tsx
  const selectedRoute = routes.find(
    (route) =>
      getCityName(cityLookup, route.fromCityId).toLowerCase() === from.trim().toLowerCase() &&
      getCityName(cityLookup, route.toCityId).toLowerCase() === to.trim().toLowerCase()
  );
  const firstTrip = tripSearch.data?.[0];
  const capacityLabel =
    mode === "cargo"
      ? `${formatNumber(firstTrip?.availableCargoVolume ?? firstTrip?.totalCargoVolume ?? 0)} m3 cargo available`
      : firstTrip
        ? `${firstTrip.availableSeats ?? firstTrip.totalSeats} seats available`
        : undefined;
```

Replace the right side header block with:

```tsx
        <PageHeader
          eyebrow={mode === "cargo" ? "Cargo route" : "Passenger route"}
          title="Find a trip"
          subtitle={
            <>
              Showing {searchedRoute}
              {date ? ` on ${date}` : ""}.{" "}
              {mode === "cargo"
                ? "Search routes, compare cargo capacity, and create cargo orders through the gateway."
                : "Search routes, compare seats, and book through the gateway."}
            </>
          }
        >
          <StatusChip status="SCHEDULED" />
        </PageHeader>
        <RouteMapPreview
          from={from}
          to={to}
          distanceKm={selectedRoute?.distanceKm}
          durationMinutes={selectedRoute?.estimatedDurationMinutes}
          capacityLabel={capacityLabel}
        />
```

Keep existing search handlers and mutation logic unchanged.

- [ ] **Step 6: Adjust SearchPage CSS**

In `frontend/src/app/styles.css`, update:

```css
.search-layout {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 20px;
  align-items: start;
}

.results-panel {
  min-width: 0;
  display: grid;
  gap: 16px;
}

.trip-card {
  display: grid;
  grid-template-columns: 100px minmax(0, 1fr) minmax(140px, auto) 120px;
  gap: 16px;
  align-items: center;
  padding: 16px;
}
```

Keep the existing mobile breakpoint that changes `.search-layout` and `.trip-card` to one column.

- [ ] **Step 7: Run search tests**

Run:

```bash
cd frontend
npm run test -- src/shared/ui/RouteMapPreview.test.tsx src/app/App.test.tsx
```

Expected: PASS. If `App.test.tsx` fails only because text moved into route preview, update assertions to query the same accessible text in its new location, not to reduce coverage.

- [ ] **Step 8: Commit**

Run:

```bash
git add frontend/src/shared/ui/RouteMapPreview.tsx frontend/src/shared/ui/RouteMapPreview.test.tsx frontend/src/pages/SearchPage.tsx frontend/src/app/styles.css frontend/src/app/App.test.tsx
git commit -m "feat(frontend): redesign route search workspace"
```

---

### Task 4: Admin Workspace Redesign

**Files:**
- Modify: `frontend/src/pages/AdminPage.tsx`
- Modify: `frontend/src/app/styles.css`
- Modify: `frontend/src/app/App.test.tsx`

- [ ] **Step 1: Write admin regression expectations**

In `frontend/src/app/App.test.tsx`, add assertions to the existing `opens the admin shell for admin users` test:

```tsx
expect(await screen.findByRole("heading", { name: "Admin dashboard" })).toBeInTheDocument();
expect(screen.getByRole("navigation", { name: "Admin navigation" })).toBeInTheDocument();
expect(screen.getByText("Operational workspace backed by the Admin Service facade.")).toBeInTheDocument();
```

These assertions should already pass before the redesign. They protect accessible structure while visual classes change.

- [ ] **Step 2: Run admin regression test**

Run:

```bash
cd frontend
npm run test -- src/app/App.test.tsx -t "opens the admin shell for admin users"
```

Expected: PASS before implementation.

- [ ] **Step 3: Import shared components in AdminPage**

In `frontend/src/pages/AdminPage.tsx`, add:

```tsx
import { DataPanel } from "../shared/ui/DataPanel";
import { ListRow } from "../shared/ui/ListRow";
import { MetricTile } from "../shared/ui/MetricTile";
import { PageHeader } from "../shared/ui/PageHeader";
```

- [ ] **Step 4: Update admin page containers**

Replace:

```tsx
<section className="panel content-panel admin-content">
```

with:

```tsx
<section className="admin-content">
```

Keep the sidebar as a panel. Use `DataPanel` inside section content where each admin section needs a framed block.

- [ ] **Step 5: Convert dashboard header and metrics**

In `DashboardSection`, replace the header and metric grid with:

```tsx
      <DataPanel>
        <PageHeader
          eyebrow="Overview"
          title="Admin dashboard"
          subtitle="Operational workspace backed by the Admin Service facade."
        />
        <div className="admin-summary-grid">
          {cards.map((card) => (
            <MetricTile key={card.label} href={card.path} label={card.label} value={formatCount(card.value, card.unit)} />
          ))}
        </div>
        <div className="catalog-state">Audit log is written by Admin Service runtime logs.</div>
      </DataPanel>
```

- [ ] **Step 6: Convert admin list rows incrementally**

For clickable user rows, replace:

```tsx
<button key={user.id} className="admin-list-row" type="button" onClick={() => setSelectedId(user.id)}>
  <strong>{user.fullName}</strong>
  <span>{user.email}</span>
</button>
```

with:

```tsx
<ListRow key={user.id} title={user.fullName} meta={user.email} onClick={() => setSelectedId(user.id)} />
```

For static booking rows, replace the outer `div className="admin-list-row static"` with:

```tsx
<ListRow
  key={booking.id}
  title={`Booking ${booking.id}`}
  meta={`User ${booking.userId} - Trip ${booking.tripId} - Seat ${booking.seatNumber}`}
  aside={<Button type="button" disabled variant="secondary">Cancel booking unavailable</Button>}
>
  <span>Payment {payment?.status ?? "not found"}</span>
</ListRow>
```

Apply the same pattern to payments and cargo lists while preserving labels used by existing tests.

- [ ] **Step 7: Keep detail and form behavior unchanged**

Do not change mutations, query keys, filters, route IDs, or button labels. Only replace surrounding layout elements with `DataPanel`, `PageHeader`, `ListRow`, and `MetricTile`.

- [ ] **Step 8: Run admin tests**

Run:

```bash
cd frontend
npm run test -- src/app/App.test.tsx -t "admin"
```

Expected: PASS for admin navigation, dashboard, users, routes, trips, bookings, payments, cargo, and audit tests.

- [ ] **Step 9: Commit**

Run:

```bash
git add frontend/src/pages/AdminPage.tsx frontend/src/app/styles.css frontend/src/app/App.test.tsx
git commit -m "feat(frontend): redesign admin workspace"
```

---

### Task 5: Driver Workspace Redesign

**Files:**
- Modify: `frontend/src/pages/DriverPage.tsx`
- Modify: `frontend/src/app/styles.css`
- Modify: `frontend/src/app/App.test.tsx`

- [ ] **Step 1: Add driver structure expectations**

In the existing `opens driver workspace with profile and assigned trips` test in `frontend/src/app/App.test.tsx`, keep these assertions:

```tsx
expect(await screen.findByRole("heading", { name: "Driver workspace" })).toBeInTheDocument();
expect(screen.getByText("Upcoming assignments")).toBeInTheDocument();
expect(await screen.findByText("Yekaterinburg -> Tyumen")).toBeInTheDocument();
```

Do not rename these visible strings during the redesign.

- [ ] **Step 2: Import shared components in DriverPage**

In `frontend/src/pages/DriverPage.tsx`, add:

```tsx
import { DataPanel } from "../shared/ui/DataPanel";
import { ListRow } from "../shared/ui/ListRow";
import { PageHeader } from "../shared/ui/PageHeader";
import { RouteMapPreview } from "../shared/ui/RouteMapPreview";
```

- [ ] **Step 3: Replace top driver profile section**

Replace the first driver `<section className="panel content-panel driver-content">` with:

```tsx
      <DataPanel className="driver-hero-panel">
        <PageHeader
          eyebrow="Driver"
          title="Driver workspace"
          subtitle="Manage your profile, availability, and current assignments."
        >
          <AvailabilityBadge status={profile.availabilityStatus} />
        </PageHeader>
        {notice && <div className="notice">{notice}</div>}
        {updateMutation.isError && (
          <ApiErrorMessage error={updateMutation.error} fallback="Could not save driver profile" />
        )}
        <DriverProfileForm
          isSaving={updateMutation.isPending}
          onSubmit={(request) => updateMutation.mutate(request)}
          profile={profile}
        />
      </DataPanel>
```

- [ ] **Step 4: Replace remaining driver sections with DataPanel**

Use:

```tsx
<DataPanel eyebrow="Trips" title="Create trip">
  {/* existing create trip error and DriverTripForm */}
</DataPanel>
```

```tsx
<DataPanel eyebrow="Availability" title="Availability">
  {/* existing availability loading/error and DriverAvailabilitySection */}
</DataPanel>
```

```tsx
<DataPanel eyebrow="Schedule" title="Upcoming assignments">
  {/* existing assignment loading/error and DriverTripList */}
</DataPanel>
```

Keep all mutation calls, query keys, and form props unchanged.

- [ ] **Step 5: Add route previews to assigned trip rows**

Inside `DriverTripList`, for each trip row, use `RouteMapPreview` only when route and cities are available:

```tsx
<RouteMapPreview
  from={getCityName(cities, route?.fromCityId)}
  to={getCityName(cities, route?.toCityId)}
  distanceKm={route?.distanceKm}
  durationMinutes={route?.estimatedDurationMinutes}
  capacityLabel={`${trip.availableSeats ?? trip.totalSeats} seats available`}
/>
```

Keep the existing visible route label `Yekaterinburg -> Tyumen` in the assignment list so current tests remain meaningful.

- [ ] **Step 6: Run driver tests**

Run:

```bash
cd frontend
npm run test -- src/app/App.test.tsx -t "driver"
```

Expected: PASS.

- [ ] **Step 7: Commit**

Run:

```bash
git add frontend/src/pages/DriverPage.tsx frontend/src/app/styles.css frontend/src/app/App.test.tsx
git commit -m "feat(frontend): redesign driver workspace"
```

---

### Task 6: Supporting Passenger Pages

**Files:**
- Modify: `frontend/src/pages/MyBookingsPage.tsx`
- Modify: `frontend/src/pages/MyCargoOrdersPage.tsx`
- Modify: `frontend/src/pages/NotificationsPage.tsx`
- Modify: `frontend/src/pages/ProfilePage.tsx`
- Modify: `frontend/src/pages/LoginPage.tsx`
- Modify: `frontend/src/features/notifications/NotificationCenter.tsx`
- Modify: `frontend/src/app/styles.css`
- Modify: `frontend/src/app/App.test.tsx`

- [ ] **Step 1: Preserve existing accessible labels**

Before editing, run:

```bash
cd frontend
npm run test -- src/app/App.test.tsx -t "bookings|cargo|notifications|profile|login"
```

Expected: PASS or Vitest reports matching tests. If the `-t` expression does not match as intended, run `npm run test -- src/app/App.test.tsx`.

- [ ] **Step 2: Import shared components into each page**

Add these imports where needed:

```tsx
import { DataPanel } from "../shared/ui/DataPanel";
import { ListRow } from "../shared/ui/ListRow";
import { PageHeader } from "../shared/ui/PageHeader";
```

- [ ] **Step 3: Convert bookings page**

In `MyBookingsPage.tsx`, replace the top panel/header with:

```tsx
<main className="page">
  <DataPanel>
    <PageHeader eyebrow="Reservations" title="My bookings" subtitle="Track trip reservations and payment status." />
    {/* keep existing loading, error, empty, and booking list logic */}
  </DataPanel>
</main>
```

Render each booking with `ListRow` while preserving text such as `Booking booking-1`, `Trip trip-1`, `Seat 1`, `1200 RUB`, and `Payment SUCCESS`.

- [ ] **Step 4: Convert cargo orders page**

In `MyCargoOrdersPage.tsx`, use:

```tsx
<main className="page">
  <DataPanel>
    <PageHeader eyebrow="Cargo" title="My cargo orders" subtitle="Review cargo shipments, route details, and payment status." />
    {/* keep existing loading, error, filter/detail, cancel mutation, and list logic */}
  </DataPanel>
</main>
```

Clickable cargo rows should use `ListRow` with the same accessible button name currently asserted by tests, including `Documents cargo-1`.

- [ ] **Step 5: Convert notifications page and popover**

In `NotificationsPage.tsx`, use `DataPanel`, `PageHeader`, and `ListRow` for the full page list. Preserve:

```tsx
All notifications
Notification status
Mark all as read
All notifications marked as read
```

In `NotificationCenter.tsx`, keep the notification button accessible name format:

```tsx
Notifications {unreadCount} unread
```

Only change classes around popover rows and toast styling.

- [ ] **Step 6: Convert profile page**

In `ProfilePage.tsx`, use:

```tsx
<main className="page">
  <DataPanel>
    <PageHeader eyebrow="Identity" title="Profile" subtitle="Review account details and role access." />
    {/* keep current user loading/error/profile grid content */}
  </DataPanel>
</main>
```

Keep visible user values and role chips unchanged.

- [ ] **Step 7: Convert login page**

In `LoginPage.tsx`, keep form labels and button names unchanged:

```tsx
Email
Password
Login
Show register form
Register
Account type
```

Wrap the auth panel with route workspace classes:

```tsx
<main className="page auth-page">
  <section className="panel auth-panel route-auth-panel">
    {/* existing login/register form */}
  </section>
</main>
```

Do not add a marketing hero.

- [ ] **Step 8: Add supporting page styles**

In `frontend/src/app/styles.css`, add or adjust:

```css
.route-auth-panel {
  background:
    linear-gradient(135deg, rgb(75 143 140 / 10%), transparent 34%),
    var(--color-surface);
}

.booking-list,
.notification-list,
.admin-list {
  display: grid;
  gap: 10px;
}

.notification-toast {
  border-color: var(--color-border);
  color: var(--color-ink);
  background: var(--color-surface);
  box-shadow: var(--shadow-panel);
}
```

- [ ] **Step 9: Run supporting page tests**

Run:

```bash
cd frontend
npm run test -- src/app/App.test.tsx
```

Expected: PASS.

- [ ] **Step 10: Commit**

Run:

```bash
git add frontend/src/pages/MyBookingsPage.tsx frontend/src/pages/MyCargoOrdersPage.tsx frontend/src/pages/NotificationsPage.tsx frontend/src/pages/ProfilePage.tsx frontend/src/pages/LoginPage.tsx frontend/src/features/notifications/NotificationCenter.tsx frontend/src/app/styles.css frontend/src/app/App.test.tsx
git commit -m "feat(frontend): redesign supporting passenger pages"
```

---

### Task 7: Status, Button, And State Polish

**Files:**
- Modify: `frontend/src/shared/ui/Button.tsx`
- Modify: `frontend/src/shared/ui/Button.test.tsx`
- Modify: `frontend/src/shared/ui/StatusChip.tsx`
- Modify: `frontend/src/shared/ui/StatusChip.test.tsx`
- Modify: `frontend/src/shared/ui/ScreenState.tsx`
- Modify: `frontend/src/shared/ui/ScreenState.test.tsx`
- Modify: `frontend/src/shared/ui/ApiErrorMessage.tsx`
- Modify: `frontend/src/shared/ui/ApiErrorMessage.test.tsx`
- Modify: `frontend/src/app/styles.css`

- [ ] **Step 1: Extend status tests**

In `frontend/src/shared/ui/StatusChip.test.tsx`, add:

```tsx
it("renders paid status as success", () => {
  render(<StatusChip status="PAID" />);

  expect(screen.getByText("PAID")).toHaveClass("status-success");
});

it("renders scheduled status as neutral", () => {
  render(<StatusChip status="SCHEDULED" />);

  expect(screen.getByText("SCHEDULED")).toHaveClass("status-neutral");
});
```

- [ ] **Step 2: Run status test**

Run:

```bash
cd frontend
npm run test -- src/shared/ui/StatusChip.test.tsx
```

Expected: FAIL if `PAID` is not typed or mapped; PASS if current types already include it and tone is correct.

- [ ] **Step 3: Update status tone mapping**

In `frontend/src/shared/ui/StatusChip.tsx`, make sure the arrays include:

```tsx
const successStatuses: Status[] = ["CONFIRMED", "SUCCESS", "COMPLETED", "PAID"];
const dangerStatuses: Status[] = ["CANCELLED", "FAILED"];
const warningStatuses: Status[] = ["PENDING", "PENDING_PAYMENT", "REFUNDED", "IN_PROGRESS"];
```

If TypeScript rejects one of these values because `Status` does not include it, first check `frontend/src/api/types.ts` and use the existing exported status type that contains it. Do not cast to `any`.

- [ ] **Step 4: Keep Button API stable**

Run existing button tests:

```bash
cd frontend
npm run test -- src/shared/ui/Button.test.tsx
```

Expected: PASS. Do not change `Button` props unless a page needs a real third variant. If adding a third variant, update `ButtonVariant` as:

```tsx
type ButtonVariant = "primary" | "secondary" | "ghost";
```

and add `.button-ghost` styles.

- [ ] **Step 5: Align ScreenState and ApiErrorMessage styles**

Keep existing props and roles. Only update default classes:

```tsx
className={className ?? "catalog-state"}
```

can remain unchanged if `.catalog-state` is restyled in CSS. Do not change `role="status"` or `role="alert"` behavior.

- [ ] **Step 6: Update state styles**

In `frontend/src/app/styles.css`, ensure:

```css
.catalog-state {
  border-radius: 8px;
  padding: 12px;
  color: var(--color-nav);
  background: var(--color-route-soft);
  border: 1px solid var(--color-border);
}

.form-error {
  color: #7e2f28;
  background: #f9e1dc;
  border: 1px solid #e9b8ae;
}

.notice {
  color: #255f4b;
  background: #e2f1e8;
  border: 1px solid #b9d8c7;
}
```

- [ ] **Step 7: Run shared UI tests**

Run:

```bash
cd frontend
npm run test -- src/shared/ui
```

Expected: PASS.

- [ ] **Step 8: Commit**

Run:

```bash
git add frontend/src/shared/ui/Button.tsx frontend/src/shared/ui/Button.test.tsx frontend/src/shared/ui/StatusChip.tsx frontend/src/shared/ui/StatusChip.test.tsx frontend/src/shared/ui/ScreenState.tsx frontend/src/shared/ui/ScreenState.test.tsx frontend/src/shared/ui/ApiErrorMessage.tsx frontend/src/shared/ui/ApiErrorMessage.test.tsx frontend/src/app/styles.css
git commit -m "feat(frontend): polish route workspace states"
```

---

### Task 8: Responsive Verification And Final Build

**Files:**
- Modify: `frontend/src/app/styles.css`
- Modify page files only if browser verification finds layout overflow or overlapping text.

- [ ] **Step 1: Run full frontend verification**

Run:

```bash
cd frontend
npm run verify
```

Expected: `npm run test` passes, TypeScript build passes, and Vite build completes.

- [ ] **Step 2: Start dev server**

Run:

```bash
cd frontend
npm run dev
```

Expected: Vite prints a local URL, usually `http://localhost:5173/`. Keep the server running for browser checks.

- [ ] **Step 3: Browser-check desktop**

Open the local Vite URL in the browser at desktop width. Verify:

- `/` shows left search panel, route preview, and results area without overlap.
- `/login` keeps the auth panel centered and readable.
- Authenticated passenger pages `/bookings`, `/cargo`, `/profile`, `/notifications` use the same forest/copper surface system.
- Admin `/admin`, `/admin/users`, `/admin/routes`, `/admin/trips`, `/admin/cargo` remain dense but readable.
- Driver `/driver` shows profile, trip creation, availability, and assignments without nested-card clutter.

- [ ] **Step 4: Browser-check mobile**

Resize to approximately 390px wide. Verify:

- Navigation wraps without text overlap.
- Search panel stacks above route preview and results.
- Trip cards, admin rows, cargo rows, notification rows, and driver panels fit horizontally.
- Buttons keep readable labels and do not overflow.

- [ ] **Step 5: Fix any responsive issues**

If text or controls overflow, update `frontend/src/app/styles.css` with targeted rules. Prefer these patterns:

```css
@media (max-width: 860px) {
  .page-header,
  .list-row {
    grid-template-columns: 1fr;
  }

  .page-header {
    display: grid;
  }

  .page-actions {
    justify-content: flex-start;
  }
}

@media (max-width: 720px) {
  .trip-card,
  .admin-table-row,
  .profile-grid {
    grid-template-columns: 1fr;
  }
}
```

Run `npm run verify` again after every CSS fix.

- [ ] **Step 6: Commit final responsive fixes**

Run:

```bash
git add frontend/src/app/styles.css frontend/src/pages frontend/src/shared/ui
git commit -m "fix(frontend): complete responsive redesign polish"
```

Only commit if Step 5 changed files. If no fixes were needed, skip this commit.

---

## Self-Review

- Spec coverage: The plan covers global shell, forest/copper visual system, search route preview layout, admin, driver, supporting pages, shared components, responsive behavior, error/loading/empty states, tests, build, and browser verification.
- Scope check: The plan does not add real map provider integration, backend workflows, API contract changes, or new admin/driver capabilities.
- Placeholder scan: No task relies on open-ended implementation instructions without file paths, commands, and concrete code or replacement snippets.
- Type consistency: Shared components introduced in Tasks 1-3 are imported by later page tasks with stable names: `AppShell`, `PageHeader`, `DataPanel`, `ListRow`, `MetricTile`, and `RouteMapPreview`.
