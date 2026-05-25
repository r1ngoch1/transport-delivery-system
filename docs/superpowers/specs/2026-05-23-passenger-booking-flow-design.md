# Passenger Booking Flow Design

## Goal

Complete the passenger MVP path from trip search to booking creation, current user's booking list, and payment status visibility.

## Scope

The existing frontend foundation stays intact. This slice extends the current React/Vite app with booking and payment API helpers, replaces the placeholder booking UI, and updates the search page so authenticated users can create a booking from a selected trip.

## User Flow

1. A passenger searches trips by route and date on `/`.
2. If unauthenticated, clicking `Book` routes the passenger to `/login`.
3. If authenticated, clicking `Book` creates a booking with the selected trip id and a simple seat number value.
4. The search page shows the created booking status and offers navigation to `/bookings`.
5. `/bookings` loads `GET /api/bookings/my`.
6. Each booking shows booking status and related payment status from `GET /api/payments?targetType=BOOKING&targetId=<bookingId>`.

## Architecture

Add focused feature APIs under `src/features/bookings` and `src/features/payments`, using the generated OpenAPI clients. Keep page-level orchestration in `SearchPage.tsx` and `MyBookingsPage.tsx`, matching the existing route/trip feature pattern.

Booking creation will use a generated `CreateBookingRequest`. The MVP seat value is a deterministic default (`1`) because the backend contract requires `seatNumber` and the UI does not yet expose a seat map.

## Error Handling

Feature API helpers extract backend `message` fields when available and fall back to a concise domain error. Pages render these messages in the existing `.form-error` surface.

## Testing

Extend `App.test.tsx` with integration-style component tests for:

- authenticated trip booking posts to `/api/bookings` and shows pending status;
- `/bookings` loads current user's bookings;
- `/bookings` shows payment status for a booking.

Run the frontend test suite and production build after implementation.
