# Docker Compose App Services Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `docker compose up --build` start the complete MVP application stack.

**Architecture:** Add one reusable root Dockerfile that builds any Maven service module through `SERVICE_MODULE`. Extend `docker-compose.yml` with application services, environment overrides, healthchecks, and dependency conditions while preserving local localhost defaults in service configs.

**Tech Stack:** Java 17, Spring Boot 3.3.5, Spring Cloud, Maven, Docker Compose, PostgreSQL 16, Apache Kafka 3.7.1.

---

### Task 1: Add Reusable Spring Boot Dockerfile

**Files:**
- Create: `Dockerfile`
- Modify: `.dockerignore`

- [ ] Add a root `Dockerfile` using Maven and Eclipse Temurin Java 17.
- [ ] Build the selected module with `mvn -pl ${SERVICE_MODULE} -am package -DskipTests`.
- [ ] Copy the selected module jar into a slim runtime image.
- [ ] Add `.dockerignore` entries for build output, IDE files, and Git metadata.
- [ ] Validate with `docker compose config` after compose references are added.

### Task 2: Add Infrastructure Healthchecks

**Files:**
- Modify: `docker-compose.yml`

- [ ] Add healthchecks for each PostgreSQL service using `pg_isready`.
- [ ] Add an internal Kafka listener so app containers can reach Kafka by service name.
- [ ] Add Kafka healthcheck using Kafka CLI metadata check.

### Task 3: Add Config, Discovery, and Gateway Services

**Files:**
- Modify: `docker-compose.yml`

- [ ] Add `config-server` built from `services/config-server`.
- [ ] Mount `config-repo` read-only into the Config Server container.
- [ ] Add `discovery-server` with `SPRING_CONFIG_IMPORT=optional:configserver:http://config-server:8889`.
- [ ] Add `api-gateway` with Eureka and Config Server environment overrides.
- [ ] Expose ports `8889`, `8761`, and `8080`.

### Task 4: Add Business Application Services

**Files:**
- Modify: `docker-compose.yml`

- [ ] Add `user-service`, `route-service`, `trip-service`, `booking-service`, and `payment-service`.
- [ ] Set datasource URLs to compose PostgreSQL hostnames.
- [ ] Set Eureka default zone to `http://discovery-server:8761/eureka/`.
- [ ] Set Kafka bootstrap servers to `kafka:9092` for Booking and Payment.
- [ ] Expose existing service ports `8081`, `8083`, `8084`, `8085`, and `8087`.

### Task 5: Update TODO and Validate

**Files:**
- Modify: `TODO.md`

- [ ] Mark each Docker Compose application-service subtask complete only after the corresponding compose changes exist.
- [ ] Run `docker compose config`.
- [ ] Run `mvn -pl services/config-server,services/discovery-server,services/api-gateway,services/user-service,services/route-service,services/trip-service,services/booking-service,services/payment-service -am package -DskipTests` if image build is not run.
- [ ] Run `docker compose up --build` when Docker is available.
