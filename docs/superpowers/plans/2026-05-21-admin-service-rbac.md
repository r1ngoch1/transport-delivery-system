# Admin Service RBAC Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restrict every Admin Service facade endpoint to requests carrying the `ADMIN` role.

**Architecture:** Gateway remains responsible for JWT validation and role propagation through `X-User-Roles`. Admin Service performs a local guard at the controller boundary before delegating to Feign clients, matching the existing business-service `requireAdmin` pattern.

**Tech Stack:** Java 17, Spring Boot MVC, JUnit 5, Mockito.

---

### Task 1: Admin Controller Role Guard

**Files:**
- Modify: `services/admin-service/src/test/java/com/ringochi/adminservice/AdminControllerTest.java`
- Modify: `services/admin-service/src/main/java/com/ringochi/adminservice/AdminController.java`
- Modify: `TODO.md`

- [ ] **Step 1: Write failing RBAC tests**

Add tests proving a non-admin role gets HTTP 403 before any client call and an admin role still delegates.

- [ ] **Step 2: Verify red**

Run: `rtk mvn -pl services/admin-service "-Dtest=AdminControllerTest" test`

Expected: compile failure because controller methods do not accept a roles header yet.

- [ ] **Step 3: Implement minimal guard**

Add `@RequestHeader(value = "X-User-Roles", required = false) String roles` to every admin endpoint method, call `requireAdmin(roles)`, and throw `ResponseStatusException(HttpStatus.FORBIDDEN, "ADMIN role required")` when missing or non-admin.

- [ ] **Step 4: Verify green**

Run the same targeted test command and expect success.

- [ ] **Step 5: Update TODO**

Mark `Добавить RBAC только для ADMIN` as completed. Leave audit log open.
