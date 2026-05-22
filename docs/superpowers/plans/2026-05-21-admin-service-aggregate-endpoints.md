# Admin Service Aggregate Endpoints Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add working Admin Service aggregate read endpoints over users, routes, trips, bookings, payments, drivers, and cargo orders.

**Architecture:** Admin Service is a Spring Boot facade with Feign clients for existing business services. User Service gets an admin-only list endpoint, and Booking Service gets admin-only list/get endpoints so the facade can aggregate without direct database access.

**Tech Stack:** Java 17, Spring Boot 3, Spring Cloud OpenFeign, Maven multi-module, JUnit 5, Mockito.

---

### Task 1: Supporting Business Endpoints

**Files:**
- Modify: `services/user-service/src/test/java/com/ringochi/userservice/UserControllerTest.java`
- Modify: `services/user-service/src/main/java/com/ringochi/userservice/UserController.java`
- Modify: `services/booking-service/src/test/java/com/ringochi/bookingservice/BookingControllerTest.java`
- Modify: `services/booking-service/src/main/java/com/ringochi/bookingservice/BookingController.java`

- [ ] **Step 1: Write failing tests**

Add tests for `UserController.all("ADMIN")`, forbidden non-admin user list access, `BookingController.all("ADMIN")`, and `BookingController.adminById("ADMIN", id)`.

- [ ] **Step 2: Verify red**

Run: `rtk mvn -pl services/user-service,services/booking-service -Dtest=UserControllerTest,BookingControllerTest test`

Expected: compile failure because the controller methods do not exist yet.

- [ ] **Step 3: Implement minimal endpoints**

Add admin role checks and read-only list/get methods. Do not change existing passenger behavior.

- [ ] **Step 4: Verify green**

Run the same targeted Maven command and expect success.

### Task 2: Admin Facade Module

**Files:**
- Modify: `pom.xml`
- Create: `services/admin-service/pom.xml`
- Create: `services/admin-service/src/main/java/com/ringochi/adminservice/AdminServiceApplication.java`
- Create: `services/admin-service/src/main/java/com/ringochi/adminservice/AdminController.java`
- Create: `services/admin-service/src/main/java/com/ringochi/adminservice/AdminClients.java`
- Create: `services/admin-service/src/test/java/com/ringochi/adminservice/AdminControllerTest.java`

- [ ] **Step 1: Write failing facade tests**

Add tests proving admin aggregate endpoints delegate to the expected client methods and forward `X-User-Roles: ADMIN`.

- [ ] **Step 2: Verify red**

Run: `rtk mvn -pl services/admin-service -Dtest=AdminControllerTest test`

Expected: failure because the module/classes are incomplete.

- [ ] **Step 3: Implement minimal facade**

Create the Maven module, application class, Feign client interfaces, and controller list/get methods matching `openapi/admin-service.yaml`.

- [ ] **Step 4: Verify green**

Run: `rtk mvn -pl services/admin-service -Dtest=AdminControllerTest test`

Expected: success.

### Task 3: Register Runtime Surface

**Files:**
- Modify: `services/api-gateway/src/main/resources/application.yml`
- Create: `config-repo/admin-service.yml`
- Modify: `TODO.md`

- [ ] **Step 1: Wire Gateway and config**

Add Gateway route `/api/admin/** -> lb://admin-service` and a small config-repo file for the new service.

- [ ] **Step 2: Verify compile**

Run: `rtk mvn -pl services/admin-service,services/user-service,services/booking-service -am compile`

Expected: success.

- [ ] **Step 3: Update TODO**

Mark `Добавить агрегированные endpoints для пользователей, маршрутов, рейсов, бронирований, платежей` as completed. Leave `RBAC только для ADMIN` and `audit log` open.
