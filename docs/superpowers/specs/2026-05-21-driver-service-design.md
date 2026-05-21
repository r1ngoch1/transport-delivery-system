# Driver Service Design

## Scope

Build the standalone Driver Service slice from `TODO.md` without Trip Service integration. This closes the OpenAPI contract, Maven module, driver profile/license/availability entities, and admin/user profile endpoints.

## Architecture

`driver-service` is a Spring Boot business service matching the existing service pattern. It uses PostgreSQL with Flyway, registers with Eureka, imports optional config from Config Server, exposes `/actuator/health`, and uses header-based identity/role checks from the gateway.

The service stores one `DriverProfile` aggregate with driver identity, license, availability, active flag, and timestamps. Availability is a small enum: `AVAILABLE`, `UNAVAILABLE`, `ON_TRIP`, `SUSPENDED`.

## API

Public authenticated driver endpoints:

- `GET /api/drivers/me`: returns the current user's profile by `X-User-Id`.
- `PATCH /api/drivers/me`: updates current user's phone, license fields, and availability.

Admin endpoints:

- `GET /api/drivers`: returns all driver profiles.
- `GET /api/drivers/{id}`: returns one profile.
- `POST /api/drivers`: creates a profile for a user.
- `PATCH /api/drivers/{id}`: updates profile fields and active status.
- `GET /api/drivers/available`: returns active profiles with `AVAILABLE` status.

Admin endpoints require `X-User-Roles` containing `ADMIN`. Missing profile returns `404`; duplicate `userId` returns `409`.

## Data

Flyway creates `driver_profiles` with a UUID primary key and unique `user_id`. Required columns include `full_name`, `phone`, `license_number`, `license_category`, `license_expires_at`, `availability_status`, `active`, `created_at`, and `updated_at`.

## Testing

Use TDD. Add controller unit tests first for user/admin flows and conflict cases, then implement the service. Add a Flyway integration test with PostgreSQL Testcontainers to verify the migration creates the repository-backed table.
