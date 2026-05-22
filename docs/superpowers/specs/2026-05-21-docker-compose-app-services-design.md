# Docker Compose App Services Design

## Goal

Extend the existing Docker Compose setup so the full MVP stack can be built and started with one command, including infrastructure, Config Server, Discovery Server, Gateway, and all business services.

## Approach

Use a single root Dockerfile with a `SERVICE_MODULE` build argument. Each compose application service builds the same Dockerfile with a different Maven module path, which avoids eight duplicated Dockerfiles while keeping module ownership clear.

`docker-compose.yml` remains the runtime entry point. It will keep the existing PostgreSQL and Kafka services, add healthchecks to infrastructure, add all Spring Boot services, and wire service-to-service addresses through environment variables. Local `application.yml` files continue to use localhost defaults; compose overrides container-only values such as Config Server, Eureka, PostgreSQL, and Kafka hosts.

## Runtime Topology

Startup order is infrastructure first, then Config Server, Discovery Server, business services, and Gateway. `depends_on` uses health conditions where practical so services start after their dependencies are available.

The compose network uses service names as hostnames:

- `config-server:8889`
- `discovery-server:8761`
- `postgres-user:5432`
- `postgres-route:5432`
- `postgres-trip:5432`
- `postgres-booking:5432`
- `postgres-payment:5432`
- `kafka:9092`

## Validation

Run `docker compose config` to validate the compose model. Run a targeted Maven package before image build if needed. The full acceptance check is `docker compose up --build`, followed by health checks on the exposed service ports.
