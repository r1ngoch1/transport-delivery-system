# Cargo Service Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Cargo Service with cargo orders, dimensions, status, capacity checks, and Payment Service integration.

**Architecture:** Cargo Service is a standalone Spring Boot business service following Driver/Booking/Payment patterns. It owns cargo order persistence, computes capacity from active orders per trip, and calls Payment Service with `targetType=CARGO_ORDER`.

**Tech Stack:** Java 17, Spring Boot 3.3, Spring Web, Spring Data JPA, Spring Security, Spring Cloud OpenFeign/Config/Eureka, Flyway, PostgreSQL, JUnit 5, Mockito, Testcontainers.

---

### Task 1: Contract And Module Skeleton

**Files:**
- Create: `openapi/cargo-service.yaml`
- Create: `services/cargo-service/pom.xml`
- Create: `services/cargo-service/src/main/java/com/ringochi/cargoservice/CargoServiceApplication.java`
- Create: `services/cargo-service/src/main/resources/application.yml`
- Create: `services/cargo-service/src/test/resources/application.yml`
- Create: `services/cargo-service/src/test/resources/application-test.yml`
- Modify: `pom.xml`

- [ ] Add `services/cargo-service` to the parent POM after `driver-service`.
- [ ] Add OpenAPI paths for `POST /api/cargo-orders`, `GET /api/cargo-orders/my`, `GET /api/cargo-orders`, `GET /api/cargo-orders/{id}`, `POST /api/cargo-orders/{id}/cancel`, and `GET /api/cargo-orders/trips/{tripId}/capacity`.
- [ ] Define schemas: `CargoOrder`, `CargoStatus`, `CreateCargoOrderRequest`, `CargoCapacity`, and `ErrorResponse`.
- [ ] Add a service POM matching Booking Service dependencies: web, actuator, data-jpa, security, openfeign, eureka, config, flyway, postgres, validation, openapi generator, spring boot test, testcontainers postgres.
- [ ] Add `CargoServiceApplication` with `@SpringBootApplication` and `@EnableFeignClients`.
- [ ] Add app config on port `8088`, app name `cargo-service`, datasource `cargo_db`, actuator health exposure, and cargo defaults:

```yaml
cargo:
  max-weight-kg: 1000.00
  max-volume-m3: 20.0000
  base-price: 500.00
  price-per-kg: 20.00
  price-per-m3: 300.00
```

- [ ] Run `rtk mvn -pl services/cargo-service generate-sources` and expect generated API/DTO compilation to succeed.

### Task 2: Controller TDD

**Files:**
- Create: `services/cargo-service/src/test/java/com/ringochi/cargoservice/CargoControllerTest.java`
- Create after RED: `services/cargo-service/src/main/java/com/ringochi/cargoservice/CargoStatus.java`
- Create after RED: `services/cargo-service/src/main/java/com/ringochi/cargoservice/CargoOrder.java`
- Create after RED: `services/cargo-service/src/main/java/com/ringochi/cargoservice/CargoOrderRepository.java`
- Create after RED: `services/cargo-service/src/main/java/com/ringochi/cargoservice/CargoProperties.java`
- Create after RED: `services/cargo-service/src/main/java/com/ringochi/cargoservice/PaymentClient.java`
- Create after RED: `services/cargo-service/src/main/java/com/ringochi/cargoservice/CargoController.java`
- Create after RED: `services/cargo-service/src/main/java/com/ringochi/cargoservice/SecurityConfig.java`
- Create after RED: `services/cargo-service/src/main/java/com/ringochi/cargoservice/ApiExceptionHandler.java`

- [ ] Write failing `CargoControllerTest` using `@SpringBootTest` and `@MockBean PaymentClient`.
- [ ] Cover create: computes volume, checks capacity, saves order, calls Payment Service with `CARGO_ORDER`, stores `paymentId`, and returns `PAID` for `SUCCESS`.
- [ ] Cover user access: `my`, `byId`, forbidden access to another user's order, and cancel excluding the order from active capacity.
- [ ] Cover admin access: list all orders and capacity endpoint require `ADMIN`.
- [ ] Cover validation/conflict: non-positive dimensions return `400`; capacity overflow returns `409`.
- [ ] Run `rtk mvn -pl services/cargo-service -Dtest=CargoControllerTest test` and confirm RED from missing production classes.
- [ ] Implement minimal production classes and controller logic to pass tests.
- [ ] Re-run `rtk mvn -pl services/cargo-service -Dtest=CargoControllerTest test` and confirm GREEN.

### Task 3: Flyway TDD

**Files:**
- Create: `services/cargo-service/src/test/java/com/ringochi/cargoservice/CargoFlywayIT.java`
- Create after RED: `services/cargo-service/src/main/resources/db/migration/V1__create_cargo_orders.sql`

- [ ] Write failing Testcontainers integration test that saves and reloads a `CargoOrder` through `CargoOrderRepository`.
- [ ] Assert columns persist user/trip ids, dimensions, computed volume, price, payment id, status, and timestamps.
- [ ] Run `rtk mvn -pl services/cargo-service -Dtest=CargoFlywayIT test` and confirm RED because the table is missing.
- [ ] Add Flyway migration for `cargo_orders` with UUID primary key, indexed `user_id`, indexed `trip_id`, numeric dimension/price fields, status, payment id, and timestamps.
- [ ] Re-run `rtk mvn -pl services/cargo-service -Dtest=CargoFlywayIT test` and confirm GREEN.

### Task 4: Runtime Wiring

**Files:**
- Modify: `config-repo/cargo-service.yml`
- Modify: `config-repo/api-gateway.yml`
- Modify: `docker-compose.yml`
- Modify: `README.md`

- [ ] Add `config-repo/cargo-service.yml` with cargo defaults and standard service config.
- [ ] Add API Gateway route `/api/cargo-orders/**` to `cargo-service`.
- [ ] Add `postgres-cargo` with `cargo_db`, `cargo_service`, and host port `15439`.
- [ ] Add `cargo-service` app container with port `8088`, datasource env vars, config server, Eureka, and dependency on `postgres-cargo`.
- [ ] Add `cargo-service` as a dependency of `api-gateway`.
- [ ] Document Cargo Service port and smoke path in `README.md`.

### Task 5: TODO And Verification

**Files:**
- Modify: `TODO.md`

- [ ] Mark all Cargo Service sub-tasks complete only after tests and wiring are green.
- [ ] Run `rtk mvn -pl services/cargo-service test`.
- [ ] Run `rtk mvn -pl services/cargo-service verify`.
- [ ] Run `rtk mvn -pl services/config-server,services/discovery-server,services/api-gateway,services/user-service,services/route-service,services/trip-service,services/driver-service,services/payment-service,services/booking-service,services/cargo-service -am compile`.
- [ ] If Docker is available, run `rtk docker compose config` to validate compose syntax.

## Self-Review

Spec coverage: all Cargo Service TODO sub-tasks are mapped to Tasks 1-5. The plan keeps Trip Service unchanged while still implementing cargo capacity with local active-order sums. Type names are consistent: `CargoOrder`, `CargoStatus`, `CargoProperties`, `PaymentClient`, `CargoController`, and `CargoOrderRepository`.
