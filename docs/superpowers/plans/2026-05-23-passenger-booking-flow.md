# Passenger Booking Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete passenger booking creation, current user's bookings, and payment status display in the existing frontend.

**Architecture:** Add small feature API modules for bookings and payments using generated OpenAPI clients. Keep workflow state in existing route pages and reuse current UI primitives, status chips, and query patterns.

**Tech Stack:** React 19, Vite, TypeScript, React Router, TanStack Query, Vitest, Testing Library, openapi-fetch.

---

### Task 1: Booking And Payment API Helpers

**Files:**
- Create: `frontend/src/features/bookings/bookingApi.ts`
- Create: `frontend/src/features/payments/paymentApi.ts`

- [ ] **Step 1: Write failing tests through the app flow**

Add tests in `frontend/src/app/App.test.tsx` that expect booking creation, current bookings loading, and payment status display.

- [ ] **Step 2: Run tests and verify failure**

Run: `rtk npm test -- --run src/app/App.test.tsx`

Expected: tests fail because booking creation and live booking list behavior are not implemented.

- [ ] **Step 3: Implement minimal API helpers**

`bookingApi.ts` exports `Booking`, `createBooking(tripId, seatNumber)`, and `listMyBookings()`.

`paymentApi.ts` exports `Payment`, `PaymentStatus`, and `findBookingPayments(bookingId)`.

- [ ] **Step 4: Run tests and continue to page wiring failures**

Run: `rtk npm test -- --run src/app/App.test.tsx`

Expected: helper imports compile, remaining failures point at page behavior.

### Task 2: Search Page Booking Creation

**Files:**
- Modify: `frontend/src/pages/SearchPage.tsx`

- [ ] **Step 1: Wire authenticated Book click to mutation**

Use `createBooking(trip.id, "1")`, invalidate `["my-bookings"]`, and display the returned booking status.

- [ ] **Step 2: Keep unauthenticated redirect behavior**

Preserve the current `/login` navigation when no auth token exists.

- [ ] **Step 3: Run targeted test**

Run: `rtk npm test -- --run src/app/App.test.tsx`

Expected: booking creation test passes.

### Task 3: My Bookings And Payment Status

**Files:**
- Modify: `frontend/src/pages/MyBookingsPage.tsx`
- Modify: `frontend/src/app/styles.css`

- [ ] **Step 1: Replace placeholder booking row**

Use `useQuery` with `listMyBookings()` and render loading, empty, error, and populated states.

- [ ] **Step 2: Add per-booking payment status component**

Use `findBookingPayments(booking.id)` and show `No payment yet`, loading, error, or the latest payment status chip.

- [ ] **Step 3: Add compact row styles**

Add styles for booking metadata and payment status without changing the global layout.

- [ ] **Step 4: Run targeted test**

Run: `rtk npm test -- --run src/app/App.test.tsx`

Expected: booking list and payment status tests pass.

### Task 4: Verification And TODO Update

**Files:**
- Modify: `TODO.md`

- [ ] **Step 1: Run frontend tests**

Run: `rtk npm test`

Expected: all frontend tests pass.

- [ ] **Step 2: Run production build**

Run: `rtk npm run build`

Expected: TypeScript and Vite build succeed.

- [ ] **Step 3: Mark completed frontend TODO items**

Mark passenger booking flow, my bookings page, and payment/status display as complete in `TODO.md`.
