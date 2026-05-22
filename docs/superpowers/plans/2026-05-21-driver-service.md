# Driver Service Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a standalone Driver Service with OpenAPI, persistence, user/admin endpoints, and tests.

**Architecture:** Follow the existing Spring Boot business-service pattern. The service owns `DriverProfile` persistence, uses Flyway/PostgreSQL, and trusts gateway identity headers for user id and roles.

**Tech Stack:** Java 17, Spring Boot 3.3, Spring Data JPA, Spring Web, Spring Security, Spring Cloud Config/Eureka, Flyway, PostgreSQL, JUnit 5, Mockito, Testcontainers.

---

### Task 1: Contract And Module Skeleton

**Files:**
- Create: `openapi/driver-service.yaml`
- Create: `services/driver-service/pom.xml`
- Create: `services/driver-service/src/main/java/com/ringochi/driverservice/DriverServiceApplication.java`
- Create: `services/driver-service/src/main/resources/application.yml`
- Create: `services/driver-service/src/test/resources/application.yml`
- Create: `services/driver-service/src/test/resources/application-test.yml`
- Modify: `pom.xml`

- [ ] Add the Driver Service module to the parent POM.
- [ ] Add an OpenAPI contract for driver profile endpoints and shared error responses.
- [ ] Add the service POM with web, actuator, data-jpa, security, config, eureka, flyway, postgres, validation, openapi generator, spring test, and testcontainers dependencies.
- [ ] Add application config on port `8086` using `driver_db`.

### Task 2: Controller TDD

**Files:**
- Create: `services/driver-service/src/test/java/com/ringochi/driverservice/DriverControllerTest.java`
- Create after RED: `services/driver-service/src/main/java/com/ringochi/driverservice/DriverAvailabilityStatus.java`
- Create after RED: `services/driver-service/src/main/java/com/ringochi/driverservice/DriverProfile.java`
- Create after RED: `services/driver-service/src/main/java/com/ringochi/driverservice/DriverProfileRepository.java`
- Create after RED: `services/driver-service/src/main/java/com/ringochi/driverservice/DriverController.java`
- Create after RED: `services/driver-service/src/main/java/com/ringochi/driverservice/SecurityConfig.java`
- Create after RED: `services/driver-service/src/main/java/com/ringochi/driverservice/ApiExceptionHandler.java`

- [ ] Write failing tests for `me`, `updateMe`, admin create/list/get/update, available drivers, duplicate `userId`, missing profile, and non-admin access.
- [ ] Run `rtk mvn -pl services/driver-service -Dtest=DriverControllerTest test` and confirm compilation fails because production classes do not exist.
- [ ] Implement minimal production code to satisfy the tests.
- [ ] Re-run the controller test and confirm it passes.

### Task 3: Flyway TDD

**Files:**
- Create: `services/driver-service/src/test/java/com/ringochi/driverservice/DriverFlywayIT.java`
- Create after RED: `services/driver-service/src/main/resources/db/migration/V1__create_driver_profiles.sql`

- [ ] Write failing Testcontainers/Flyway integration test that saves and reloads a driver profile through the repository.
- [ ] Run `rtk mvn -pl services/driver-service -Dtest=DriverFlywayIT test` and confirm it fails because the table is missing.
- [ ] Add the Flyway migration.
- [ ] Re-run the integration test and confirm it passes.

### Task 4: Runtime Wiring And TODO

**Files:**
- Modify: `config-repo/driver-service.yml`
- Modify: `docker-compose.yml`
- Modify: `README.md`
- Modify: `TODO.md`

- [ ] Add Driver Service config repo settings and compose database/service wiring if the existing compose structure supports app services.
- [ ] Add README references for the new service.
- [ ] Mark the first four Driver Service sub-tasks complete and leave Trip Service integration unchecked.
- [ ] Run `rtk mvn -pl services/driver-service test`.
- [ ] Run `rtk mvn -pl services/driver-service verify`.
