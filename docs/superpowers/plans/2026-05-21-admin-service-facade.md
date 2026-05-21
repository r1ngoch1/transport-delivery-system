# Admin Service Facade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Define the Admin Service API facade contract over existing business services.

**Architecture:** The Admin Service is a facade and should not own business data directly. Its API exposes `/api/admin/**` endpoints that require `ADMIN` and delegate to User, Route, Trip, Booking, Payment, Driver, and Cargo services through their existing HTTP APIs.

**Tech Stack:** OpenAPI 3.0.3, Spring Boot services, API Gateway JWT role propagation, Maven multi-module repository.

---

### Task 1: Define Admin API Facade Contract

**Files:**
- Create: `openapi/admin-service.yaml`
- Modify: `TODO.md`

- [ ] **Step 1: Add the OpenAPI contract**

Create `openapi/admin-service.yaml` with aggregate read endpoints for users, cities, routes, trips, bookings, payments, drivers, cargo orders, and cargo capacity. Include `bearerAuth`, reusable `AdminForbidden`, `NotFound`, and `ErrorResponse` definitions. Schemas should mirror the existing service contracts closely enough for the next task to generate DTO/API interfaces without inventing a separate data model.

- [ ] **Step 2: Verify the contract is discoverable**

Run: `rtk rg -n "Admin Service API|/api/admin/users|/api/admin/payments|AdminForbidden" openapi/admin-service.yaml`

Expected: matching lines for the title, representative admin paths, and the admin-only response.

- [ ] **Step 3: Update TODO status**

Change the completed `Driver Service` parent checkbox to `[x]`, and mark `Определить admin API facade поверх business services` as `[x]`. Do not mark aggregate endpoints, RBAC, or audit log yet.
