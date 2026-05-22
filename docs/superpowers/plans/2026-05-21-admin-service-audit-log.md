# Admin Service Audit Log Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Record structured audit log entries for successful Admin Service facade actions.

**Architecture:** Admin Service receives `X-User-Id` and `X-User-Roles` from Gateway. Each admin endpoint checks `ADMIN`, delegates to the downstream service, then calls a small `AdminAuditLogger` with admin id, action, resource type, and optional resource id. The logger writes structured application logs now; persistent audit storage can be added later with a DB-backed implementation without changing controller call sites.

**Tech Stack:** Java 17, Spring Boot MVC, SLF4J, JUnit 5, Mockito.

---

### Task 1: Structured Admin Audit Logging

**Files:**
- Create: `services/admin-service/src/main/java/com/ringochi/adminservice/AdminAuditLogger.java`
- Modify: `services/admin-service/src/main/java/com/ringochi/adminservice/AdminController.java`
- Modify: `services/admin-service/src/test/java/com/ringochi/adminservice/AdminControllerTest.java`
- Modify: `TODO.md`

- [ ] **Step 1: Write failing tests**

Update `AdminControllerTest` to inject `AdminAuditLogger`, pass `X-User-Id` into admin endpoint method calls, and verify successful list/get actions call `audit.log(adminUserId, action, resourceType, resourceId)`. Add a non-admin test proving audit logging does not happen when RBAC rejects the request.

- [ ] **Step 2: Verify red**

Run: `rtk mvn -pl services/admin-service "-Dtest=AdminControllerTest" test`

Expected: compile failure because `AdminAuditLogger` and the new controller constructor/signatures do not exist yet.

- [ ] **Step 3: Implement minimal logger and controller calls**

Add `AdminAuditLogger` as a Spring component with a structured SLF4J line. Add `X-User-Id` to controller methods and call audit only after downstream delegation succeeds.

- [ ] **Step 4: Verify green**

Run the same targeted test command and expect success.

- [ ] **Step 5: Update TODO**

Mark `Добавить audit log для admin actions` as completed.
