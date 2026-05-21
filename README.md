# System Transport Architecture MVP

MVP is a Maven multi-module Spring Boot project for intercity transport booking.

## Modules

- `services/config-server` on `8889`
- `services/discovery-server` on `8761`
- `services/api-gateway` on `8080`
- `services/user-service` on `8081`
- `services/route-service` on `8083`
- `services/trip-service` on `8084`
- `services/driver-service` on `8086`
- `services/cargo-service` on `8088`
- `services/admin-service` on `8089`
- `services/booking-service` on `8085`
- `services/payment-service` on `8087`
- `services/notification-service` on `8090`

## Run Order

1. `docker compose up -d`
2. `mvn clean package`
3. Start Config Server.
4. Start Discovery Server.
5. Start API Gateway.
6. Start User, Route, Trip, Driver, Cargo, Admin, Booking, Payment, and Notification services.

## Smoke Scenario

The executable HTTP smoke scenario is available at `http/smoke.http`.

Run order:

1. Start infrastructure and services as described above.
2. Open `http/smoke.http` in IntelliJ IDEA or another `.http` client with response handler support.
3. Execute requests from top to bottom.
4. After `Create booking`, wait a few seconds and run `Get booking status` again if the status is still `PENDING`; Payment Service emits `PaymentSucceeded` asynchronously and Booking Service confirms the booking from Kafka.

The scenario registers a passenger and an admin, logs in, stores JWT tokens, queries seeded cities/routes/trips through Gateway, creates a booking, checks booking status, finds the payment by booking id, and checks an Admin Service aggregate endpoint.

Driver Service is available through Gateway at `/api/drivers/**` and directly on port `8086`.
Cargo Service is available through Gateway at `/api/cargo-orders/**` and directly on port `8088`.
Admin Service is available through Gateway at `/api/admin/**` and directly on port `8089`.

Notification Service consumes the existing Kafka topic `payment-events` with group `notification-service`.
For MVP it sends booking and cargo success/failure notifications through a logging provider.
Listener failures are retried three times and then published to `payment-events.DLT`.
