# Notification Service Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Notification Service that listens to payment Kafka events and emits MVP booking/cargo notifications through a logging adapter.

**Architecture:** The service is a new Spring Boot Maven module under `services/notification-service`. It consumes the existing `payment-events` topic, maps supported payment events to notification messages, and delegates delivery to a provider abstraction whose MVP implementation logs the notification.

**Tech Stack:** Java 17, Spring Boot 3.3.5, Spring Kafka, Spring Cloud Config, Eureka client, JUnit 5, Mockito.

---

### Task 1: Consumer And Adapter Behavior

**Files:**
- Create: `services/notification-service/src/test/java/com/ringochi/notificationservice/PaymentNotificationConsumerTest.java`
- Create: `services/notification-service/src/main/java/com/ringochi/notificationservice/PaymentEvent.java`
- Create: `services/notification-service/src/main/java/com/ringochi/notificationservice/NotificationMessage.java`
- Create: `services/notification-service/src/main/java/com/ringochi/notificationservice/NotificationProvider.java`
- Create: `services/notification-service/src/main/java/com/ringochi/notificationservice/LoggingNotificationProvider.java`
- Create: `services/notification-service/src/main/java/com/ringochi/notificationservice/PaymentNotificationConsumer.java`

- [ ] **Step 1: Write failing tests**

Create tests proving `PaymentSucceeded` for `BOOKING` sends a confirmation notification, `PaymentFailed` sends a failure notification, cargo targets are supported, and unsupported events are ignored.

- [ ] **Step 2: Run test to verify RED**

Run: `rtk mvn -pl services/notification-service -Dtest=PaymentNotificationConsumerTest test`
Expected: FAIL because the module/classes do not exist yet.

- [ ] **Step 3: Implement minimal classes**

Add the record DTOs, provider interface, logging provider, and Kafka consumer.

- [ ] **Step 4: Run test to verify GREEN**

Run: `rtk mvn -pl services/notification-service -Dtest=PaymentNotificationConsumerTest test`
Expected: PASS.

### Task 2: Module Wiring

**Files:**
- Modify: `pom.xml`
- Create: `services/notification-service/pom.xml`
- Create: `services/notification-service/src/main/java/com/ringochi/notificationservice/NotificationServiceApplication.java`
- Create: `services/notification-service/src/main/resources/application.yml`
- Create: `services/notification-service/src/test/resources/application.yml`
- Create: `services/notification-service/src/test/resources/application-test.yml`
- Create: `config-repo/notification-service.yml`

- [ ] **Step 1: Register Maven module**

Add `<module>services/notification-service</module>` to root `pom.xml`.

- [ ] **Step 2: Add dependencies**

Use `spring-boot-starter`, `spring-boot-starter-actuator`, `spring-kafka`, Eureka client, Config client, and test dependencies.

- [ ] **Step 3: Add runtime config**

Use port `8090`, application name `notification-service`, Kafka JSON consumer config for `PaymentEvent`, and actuator health/info exposure.

- [ ] **Step 4: Compile module**

Run: `rtk mvn -pl services/notification-service compile`
Expected: exit 0.

### Task 3: Runtime And Docs

**Files:**
- Modify: `docker-compose.yml`
- Modify: `README.md`
- Modify: `TODO.md`

- [ ] **Step 1: Add Compose service**

Add `notification-service` using the shared Dockerfile, config server, discovery server, Kafka, and healthcheck on port `8090`.

- [ ] **Step 2: Document topics and MVP behavior**

Document that Notification Service consumes `payment-events`, logs booking/cargo success/failure notifications, and uses Kafka listener retry/DLQ settings.

- [ ] **Step 3: Update TODO**

Mark Notification Service items complete after verification.

- [ ] **Step 4: Verify targeted build**

Run: `rtk mvn -pl services/notification-service test`
Expected: exit 0.
