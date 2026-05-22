# Frontend Design

## Goal

Add a frontend for the transport delivery system without mixing Node tooling with the existing Maven service modules.

The first frontend release is a passenger booking MVP. Admin, driver, cargo, and notification-specific UI are separate follow-up stages.

## Architecture

The frontend will live in a new root-level `frontend/` directory. Existing Java services remain under `services/`, and OpenAPI contracts remain under `openapi/`.

The browser app communicates through API Gateway at `http://localhost:8080`. It should not call individual business services directly.

## Stack

Use React, Vite, TypeScript, React Router, and TanStack Query.

The app should use generated API types/client code from the existing OpenAPI contracts where practical, instead of hand-writing duplicated DTOs.

## Visual Direction

Use the "Clean Mobility" direction.

The UI should feel like a modern passenger transport booking app, not a marketing landing page and not a dense admin console. The first screen should help users search trips and move into booking immediately.

Visual principles:

- Light interface with clean white surfaces and soft blue-tinted backgrounds.
- Deep blue or teal top navigation for a stronger product identity.
- Teal/cyan accents for route, mobility, and informational elements.
- Orange primary CTA buttons for high-intent actions such as search and booking.
- Clear status chips for booking and payment states: pending, confirmed, cancelled, success, failed, refunded.
- Compact, scannable trip cards or rows showing departure time, route, seats, price, and booking action.
- No large marketing hero as the primary screen for the MVP.

## Initial Module Structure

```text
frontend/
  src/
    app/
    pages/
    features/
    shared/
    api/
  package.json
  vite.config.ts
  .env.example
```

`app/` owns providers, routing, and application shell.
`pages/` owns route-level screens.
`features/` owns domain workflows such as auth, trip search, and booking.
`shared/` owns reusable UI and utilities.
`api/` owns HTTP client setup and generated/backend-facing types.

## Passenger MVP Scope

- Register, login, logout.
- Persist JWT token client-side and attach it to API requests.
- Protect authenticated routes.
- Show the current user profile.
- List cities and routes.
- Search trips by route and date.
- Create a booking for a selected trip.
- Show booking status transitions.
- Show the current user's bookings.
- Show payment/status information related to a booking.

## Error Handling

The UI should display backend errors using the existing unified `ApiExceptionHandler` response shape: `timestamp`, `status`, `error`, `message`, and `path`.

Every networked screen needs loading, empty, and error states.

## Quality Gates

- `npm run build` succeeds.
- Frontend tests cover auth state and the main booking flow at a useful level.
- A smoke/e2e scenario covers passenger register/login, route/trip lookup, booking creation, and booking status through API Gateway.
- After the app is stable, Docker Compose should include the frontend as a separate service.

## Deferred Scope

- Admin CRUD screens.
- Driver profile and availability screens.
- Cargo order flow.
- Notification UX for booking, cargo, and payment events.
