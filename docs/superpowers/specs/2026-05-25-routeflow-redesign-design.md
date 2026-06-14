# RouteFlow Redesign Design

## Goal

Redesign the full RouteFlow frontend around a route/map workspace identity while preserving the existing React/Vite architecture and current backend workflows.

The redesign covers all frontend areas: passenger trip search, cargo ordering, bookings, profile, notifications, admin, and driver pages. The first implementation should change presentation and reusable UI structure, not rewrite API behavior or business logic.

## Selected Direction

Use the `Route map workspace` direction.

The product should feel like a transport operations workspace with a clear route-planning signal. It should be more distinctive than the current clean teal/orange MVP, but still practical for repeated use by passengers, drivers, and admins.

## Visual System

Use the `Forest and copper` palette:

- App background: warm route-paper tone, approximately `#f8f4ed`.
- Surfaces: warm white, approximately `#fffaf2`.
- Primary navigation and strong text accents: forest green, approximately `#24413b`.
- Primary call to action and route path accents: copper, approximately `#d77842`.
- Secondary route/data accent: muted teal, approximately `#4b8f8c`.
- Text: dark warm ink, approximately `#2a241d`.
- Muted text and borders: warm gray/brown neutrals.

Cards and panels keep a restrained 8px radius. The redesign should avoid decorative gradient orbs, oversized marketing hero sections, and purely atmospheric visuals. Visual elements should communicate routes, location, capacity, status, or operational structure.

## Global Shell

Introduce a shared application shell instead of styling every page independently.

The shell should provide:

- A consistent top navigation with RouteFlow branding, primary areas, role-aware links, notifications, and authentication actions.
- A consistent page width and vertical rhythm.
- Shared page header patterns for title, subtitle, role/workflow context, and compact actions.
- Shared responsive behavior for mobile navigation and stacked page layouts.

The current route structure should stay intact. Protected routes, role checks, and existing React Query behavior should not change as part of this redesign.

## Main Search Page

Use the selected layout: `Left search, map, then results`.

The page should be arranged as:

- Left column: compact search panel with passenger/cargo mode, route fields, date, and mode-specific cargo details.
- Right top area: route preview/map panel showing the selected origin, destination, route line, distance/duration/capacity details where available.
- Right lower area: trip results as scannable rows/cards with departure, route, passenger seats or cargo capacity, price estimate, and primary action.

The route preview can be a styled UI component rather than a real map integration. It should use real selected cities and route/trip data when available, and graceful empty/loading states when not.

## Admin Experience

Admin should feel like the same product, not a separate plain CRUD page.

Keep the existing sidebar/list/detail workflow, but restyle it around the shared shell:

- Dashboard metrics become compact operational tiles.
- Admin sections use consistent `DataPanel`, `ListRow`, and `DetailPanel` patterns.
- Tables/lists should remain dense enough for operations.
- Destructive or unavailable actions remain visually secondary or disabled.
- Status chips should use the shared status palette and naming conventions.

No new admin capabilities are in scope for the redesign.

## Driver Experience

Driver screens should use the same route workspace language with schedule and availability emphasis.

The layout should keep operational density while improving hierarchy:

- Driver profile/status information appears in a compact summary panel.
- Availability slots and trip-related data use consistent panels and list rows.
- Actions remain clearly separated from status and read-only details.

No driver backend behavior changes are in scope.

## Supporting Pages

Bookings, cargo orders, notifications, login, and profile pages should use the same shared components and palette:

- Bookings and cargo orders use route/order rows with status and payment context.
- Notifications use a consistent popover and full-page list style.
- Login uses the warm route workspace surface without a marketing hero.
- Profile uses compact identity and role panels.

## Component Plan

Create or refine shared UI primitives before restyling individual pages:

- `AppShell` for global structure and navigation.
- `PageHeader` for consistent page titles and supporting actions.
- `RouteMapPreview` for the visual route panel on search and potentially driver/admin contexts.
- `DataPanel` for framed operational sections.
- `ListRow` for selectable rows across admin, bookings, cargo, and notifications.
- `MetricTile` for dashboard summary cards.
- Existing `Button`, `StatusChip`, `ScreenState`, and `ApiErrorMessage` should be updated to the new visual system instead of replaced wholesale.

These components should stay small and focused. Avoid a broad refactor of API modules or route logic.

## Responsive Behavior

Desktop:

- Search page uses left search column and right content area.
- Admin and driver pages keep sidebar or multi-column layouts where space allows.

Tablet/mobile:

- Search panel stacks above route preview and results.
- Admin sidebar becomes a compact stacked navigation.
- Tables and detail panels collapse into readable one-column rows.
- Buttons and labels must not overflow their containers.

## Error, Loading, and Empty States

Existing network states remain required on all data-driven pages.

Loading, empty, error, and success states should use the new palette and component styling. Error states must keep backend message visibility through the existing API error shape.

## Testing and Verification

The implementation plan should include:

- Frontend unit/component tests for any changed shared UI behavior where assertions already exist.
- `npm run build`.
- Existing frontend tests.
- Browser verification across desktop and mobile widths for search, admin, driver, login, bookings/cargo, and notifications.

No backend tests are required unless the implementation changes API calls or data contracts.

## Out of Scope

- Real map provider integration.
- New admin CRUD capabilities.
- New driver backend workflows.
- API contract changes.
- Replacing React Router, TanStack Query, Vite, or generated API clients.
