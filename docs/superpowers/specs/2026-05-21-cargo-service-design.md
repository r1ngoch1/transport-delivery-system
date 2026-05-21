# Cargo Service Design

## Scope

Build the Cargo Service slice from `TODO.md` as an autonomous Spring Boot business service. This closes the OpenAPI contract, Maven module, cargo order/dimensions/status persistence, MVP cargo capacity calculation, and payment integration through the existing Payment Service `CARGO_ORDER` target type.

## Architecture

`cargo-service` follows the existing business-service pattern used by Driver, Booking, and Payment. It uses PostgreSQL with Flyway, Eureka, optional Config Server import, actuator health, generated OpenAPI interfaces, and gateway-provided identity headers.

The service owns cargo order state. Trip Service is treated as an external identifier source at this stage; Cargo Service does not modify Trip Service schema. Capacity is enforced locally with configurable limits per trip: `cargo.max-weight-kg` and `cargo.max-volume-m3`. Occupied capacity is the sum of non-terminal cargo orders for the same `tripId`.

## Domain

`CargoOrder` contains:

- `id`, `userId`, `tripId`
- cargo description
- dimensions: `weightKg`, `lengthCm`, `widthCm`, `heightCm`, computed `volumeM3`
- `price`, `currency`, `paymentId`
- `status`
- `createdAt`, `updatedAt`

Statuses:

- `PENDING_PAYMENT`: order created and payment requested.
- `PAID`: payment already succeeded according to Payment Service response.
- `CANCELLED`: user/admin cancelled the order.

For capacity calculations, `PENDING_PAYMENT` and `PAID` reserve cargo capacity. `CANCELLED` does not.

## API

Authenticated user endpoints:

- `POST /api/cargo-orders`: create a cargo order for the current `X-User-Id`, check capacity, compute price/volume, create a payment with `targetType=CARGO_ORDER`, and return the order.
- `GET /api/cargo-orders/my`: list current user's cargo orders.
- `GET /api/cargo-orders/{id}`: return own cargo order; other users receive `403`.
- `POST /api/cargo-orders/{id}/cancel`: cancel own cargo order.

Admin endpoints:

- `GET /api/cargo-orders`: list all cargo orders, requires `X-User-Roles` containing `ADMIN`.
- `GET /api/cargo-orders/trips/{tripId}/capacity`: return configured, reserved, and available weight/volume for one trip.

Errors use the existing JSON shape: `timestamp`, `status`, `error`, `message`, `path`. Capacity overflow returns `409`.

## Payment Integration

Cargo Service calls Payment Service through Feign:

```json
{
  "targetType": "CARGO_ORDER",
  "targetId": "<cargoOrderId>",
  "userId": "<currentUserId>",
  "amount": "<computedPrice>",
  "currency": "RUB"
}
```

The current Payment Service MVP auto-succeeds, so Cargo Service marks the order `PAID` if the payment response status is `SUCCESS`; otherwise it stays `PENDING_PAYMENT`. If Payment Service call fails, Cargo Service marks the order `CANCELLED` and propagates the error, matching Booking Service behavior.

## Pricing And Capacity MVP

Price is calculated locally as:

- base price: `cargo.base-price`
- plus `weightKg * cargo.price-per-kg`
- plus `volumeM3 * cargo.price-per-m3`

Default values should live in Cargo Service config so they can be changed without code.

Capacity check:

- reject non-positive dimensions/weight with `400`
- compute `volumeM3 = lengthCm * widthCm * heightCm / 1_000_000`
- sum active order weight and volume for the same `tripId`
- reject with `409` when adding the new order exceeds configured weight or volume

## Runtime Wiring

Use port `8088` and a dedicated `cargo_db` PostgreSQL database. Add config repo, Docker Compose service/database, API Gateway route, README reference, and `TODO.md` checkboxes for Cargo Service sub-tasks.

## Testing

Use TDD. Add controller tests first for create/my/by-id/cancel/admin/capacity/payment/capacity-overflow/forbidden cases, then implement minimal code. Add Flyway Testcontainers integration to persist/reload cargo orders. Add a targeted module test run and compile the affected service set with Cargo included.
