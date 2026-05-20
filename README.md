# System Transport Architecture MVP

MVP is a Maven multi-module Spring Boot project for intercity transport booking.

## Modules

- `services/config-server` on `8889`
- `services/discovery-server` on `8761`
- `services/api-gateway` on `8080`
- `services/user-service` on `8081`
- `services/route-service` on `8083`
- `services/trip-service` on `8084`
- `services/booking-service` on `8085`
- `services/payment-service` on `8087`

## Run Order

1. `docker compose up -d`
2. `mvn clean package`
3. Start Config Server.
4. Start Discovery Server.
5. Start API Gateway.
6. Start User, Route, Trip, Booking, and Payment services.

## Smoke Scenario

1. Register through `POST http://localhost:8080/api/auth/register`.
2. Login through `POST http://localhost:8080/api/auth/login`.
3. Query cities, routes, and trips through Gateway.
4. Create a booking through `POST http://localhost:8080/api/bookings` with bearer JWT.
5. Payment Service emits `PaymentSucceeded`; Booking Service confirms the booking.
