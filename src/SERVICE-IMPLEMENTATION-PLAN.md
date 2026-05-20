# План реализации сервисов для агентов

Документ предназначен для раздачи задач агентам по сервисам. Проект учебный, для диплома. Основная цель MVP — показать микросервисную архитектуру, API-First подход, сервисное взаимодействие через OpenFeign, асинхронную обработку платежей через Kafka и database-per-service.

## Общие правила для всех агентов

- Работать в монорепозитории Maven multi-module.
- Не реализовывать весь проект в одном модуле.
- Использовать Java 17, Spring Boot 3, Spring Cloud, Maven.
- Для каждого бизнес-сервиса использовать отдельную PostgreSQL БД.
- Для миграций использовать Flyway.
- Для публичного API сначала создать OpenAPI YAML в папке `openapi/`.
- Не писать DTO вручную, если они должны генерироваться из OpenAPI.
- Каждый сервис должен иметь `application.yml`, health endpoint, Swagger/OpenAPI доступ и минимальные тесты.
- В MVP реализуются только: Config Server, Eureka Server, API Gateway, User Service, Route Service, Trip Service, Booking Service, Payment Service, Kafka, PostgreSQL.
- Cargo, Driver, Admin, Notification и frontend не входят в первый MVP.

## Рекомендуемая структура репозитория

```text
system-transport-architecture/
  pom.xml
  docker-compose.yml
  openapi/
    user-service.yaml
    route-service.yaml
    trip-service.yaml
    booking-service.yaml
    payment-service.yaml
  services/
    config-server/
    discovery-server/
    api-gateway/
    user-service/
    route-service/
    trip-service/
    booking-service/
    payment-service/
```

## Общие доменные решения MVP

- Kafka — единственный брокер сообщений.
- Payment Service работает как заглушка оплаты.
- Оплата подтверждается асинхронно через Kafka-события.
- Trip Service является источником истины по вместимости рейса.
- Booking Service не меняет `availableSeats` напрямую.
- Резервирование места происходит через Trip Service.
- При успешной оплате Booking Service переводит бронирование в `CONFIRMED`.
- При неуспешной оплате Booking Service переводит бронирование в `CANCELLED` и освобождает место через Trip Service.
- JWT создаёт User Service.
- API Gateway проверяет JWT на внешних запросах.
- Каждый сервис, которому нужна авторизация, дополнительно проверяет роли на уровне Spring Security method security.

---

## Агент 1. Parent Maven + Docker Compose

### Зона ответственности

Подготовить основу монорепозитория, чтобы остальные сервисы можно было добавлять как Maven-модули.

### Что создать

- Корневой `pom.xml` с packaging `pom`.
- Общие версии зависимостей Spring Boot, Spring Cloud, OpenAPI Generator, PostgreSQL, Flyway, Kafka.
- Папку `services/`.
- Папку `openapi/`.
- `docker-compose.yml` для PostgreSQL, Kafka и сервисов MVP.
- Общие настройки кодировки UTF-8 и Java 17.

### Docker Compose MVP

Должны быть контейнеры:

- `postgres-user`
- `postgres-route`
- `postgres-trip`
- `postgres-booking`
- `postgres-payment`
- `kafka`
- `zookeeper` или kraft-режим Kafka

Сервисы приложения можно добавить в compose позже, когда их модули появятся.

### Критерии готовности

- `mvn validate` проходит из корня.
- Все MVP-модули можно будет подключить в `<modules>`.
- Docker Compose поднимает PostgreSQL и Kafka.

---

## Агент 2. Config Server

### Зона ответственности

Создать Spring Cloud Config Server для централизованной конфигурации.

### Модуль

`services/config-server`

### Порт

`8888`

### Что реализовать

- Spring Boot приложение с `@EnableConfigServer`.
- Конфигурацию для native profile, чтобы в учебном проекте хранить конфиги локально.
- Папку конфигов, например `config-repo/`.
- Базовые конфиги для MVP-сервисов:
  - `api-gateway.yml`
  - `discovery-server.yml`
  - `user-service.yml`
  - `route-service.yml`
  - `trip-service.yml`
  - `booking-service.yml`
  - `payment-service.yml`

### Критерии готовности

- Config Server стартует на `8888`.
- По URL вида `/user-service/default` возвращается конфигурация.
- Есть README с примером проверки.

---

## Агент 3. Eureka Discovery Server

### Зона ответственности

Создать service discovery для регистрации всех сервисов MVP.

### Модуль

`services/discovery-server`

### Порт

`8761`

### Что реализовать

- Spring Boot приложение с `@EnableEurekaServer`.
- Отключить регистрацию Eureka Server самого в себя.
- Настроить получение конфигурации из Config Server.
- Добавить actuator health.

### Критерии готовности

- Eureka UI доступен на `http://localhost:8761`.
- Сервис стартует без попытки зарегистрироваться как клиент.
- Другие сервисы смогут регистрироваться по имени.

---

## Агент 4. API Gateway

### Зона ответственности

Создать единую точку входа для внешних запросов MVP.

### Модуль

`services/api-gateway`

### Порт

`8080`

### Маршруты MVP

- `/api/auth/**` -> `user-service`
- `/api/users/**` -> `user-service`
- `/api/cities/**` -> `route-service`
- `/api/routes/**` -> `route-service`
- `/api/trips/**` -> `trip-service`
- `/api/bookings/**` -> `booking-service`
- `/api/payments/**` -> `payment-service`

### Что реализовать

- Spring Cloud Gateway.
- Eureka client.
- JWT-фильтр для защищённых маршрутов.
- Разрешить без токена:
  - регистрацию
  - логин
  - просмотр городов, маршрутов и рейсов
- CORS для будущего frontend.
- Единый формат ошибки авторизации.

### Критерии готовности

- Gateway проксирует запросы к сервисам по Eureka service id.
- Защищённый endpoint без JWT возвращает `401`.
- Endpoint с валидным JWT проксируется дальше.

---

## Агент 5. User Service

### Зона ответственности

Реализовать регистрацию, логин, выдачу JWT и базовый профиль пользователя.

### Модуль

`services/user-service`

### OpenAPI

`openapi/user-service.yaml`

### Порт и БД

- Порт: `8081`
- БД: `user_db`

### Сущности

- `User`
- `Role`
- `UserRole`

### Минимальные поля User

- `id`
- `email`
- `phone`
- `passwordHash`
- `fullName`
- `enabled`
- `createdAt`
- `updatedAt`

### Роли

- `PASSENGER`
- `DRIVER`
- `ADMIN`

### API MVP

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/users/me`
- `PATCH /api/users/me`
- `GET /api/users/{id}` для межсервисных запросов

### Что реализовать

- OpenAPI спецификацию.
- Генерацию DTO и API-интерфейсов.
- Spring Security.
- BCrypt для паролей.
- JWT access token.
- Flyway миграции.
- Seed-миграцию ролей.
- Методную проверку доступа для профиля.

### Критерии готовности

- Пользователь может зарегистрироваться.
- Пользователь может войти и получить JWT.
- `/api/users/me` возвращает профиль по JWT.
- Пароль не хранится в открытом виде.
- Есть unit/integration тесты для регистрации и логина.

---

## Агент 6. Route Service

### Зона ответственности

Реализовать справочник городов и маршрутов.

### Модуль

`services/route-service`

### OpenAPI

`openapi/route-service.yaml`

### Порт и БД

- Порт: `8083`
- БД: `route_db`

### Сущности

- `City`
- `Route`
- `RouteStop`

### Минимальные поля City

- `id`
- `name`
- `region`
- `country`
- `active`

### Минимальные поля Route

- `id`
- `fromCityId`
- `toCityId`
- `distanceKm`
- `estimatedDurationMinutes`
- `active`

### API MVP

- `GET /api/cities`
- `GET /api/cities/{id}`
- `POST /api/cities` только ADMIN
- `PATCH /api/cities/{id}` только ADMIN
- `GET /api/routes`
- `GET /api/routes/{id}`
- `GET /api/routes/search?fromCityId=&toCityId=`
- `POST /api/routes` только ADMIN
- `PATCH /api/routes/{id}` только ADMIN

### Что реализовать

- OpenAPI спецификацию.
- CRUD городов и маршрутов.
- Поиск маршрута по городам.
- Flyway миграции.
- Seed-данные для нескольких городов и маршрутов.
- Методную security-проверку для admin endpoints.

### Критерии готовности

- Публичный поиск городов и маршрутов работает без авторизации.
- Admin endpoints требуют роль `ADMIN`.
- Trip Service может получить маршрут по id.

---

## Агент 7. Trip Service

### Зона ответственности

Реализовать рейсы и атомарное резервирование мест.

### Модуль

`services/trip-service`

### OpenAPI

`openapi/trip-service.yaml`

### Порт и БД

- Порт: `8084`
- БД: `trip_db`

### Сущности

- `Trip`

### Минимальные поля Trip

- `id`
- `routeId`
- `driverId` nullable для MVP
- `departureTime`
- `arrivalTime`
- `totalSeats`
- `availableSeats`
- `totalCargoVolume`
- `availableCargoVolume`
- `price`
- `status`
- `version` для optimistic locking

### Статусы

- `SCHEDULED`
- `IN_PROGRESS`
- `COMPLETED`
- `CANCELLED`

### API MVP

- `GET /api/trips`
- `GET /api/trips/{id}`
- `GET /api/trips/search?routeId=&date=`
- `POST /api/trips` только ADMIN
- `PATCH /api/trips/{id}` только ADMIN
- `POST /api/trips/{id}/reserve-seat` внутренний/защищённый endpoint
- `POST /api/trips/{id}/release-seat` внутренний/защищённый endpoint

### Межсервисные вызовы

- Trip Service вызывает Route Service через OpenFeign, чтобы проверить существование маршрута и получить данные маршрута.

### Что реализовать

- OpenAPI спецификацию.
- CRUD рейсов.
- Поиск рейсов по маршруту и дате.
- Резервирование места в транзакции.
- Освобождение места в транзакции.
- Проверку `availableSeats > 0`.
- Защиту от гонок через optimistic locking или pessimistic lock.
- Flyway миграции.
- Seed-рейсы.

### Критерии готовности

- Нельзя зарезервировать место, если `availableSeats = 0`.
- При резервировании `availableSeats` уменьшается на 1.
- При освобождении `availableSeats` увеличивается на 1, но не выше `totalSeats`.
- Booking Service может вызвать reserve/release endpoint.
- Есть тест на попытку двойного или лишнего резервирования.

---

## Агент 8. Payment Service

### Зона ответственности

Реализовать платёжную заглушку и публикацию событий оплаты в Kafka.

### Модуль

`services/payment-service`

### OpenAPI

`openapi/payment-service.yaml`

### Порт и БД

- Порт: `8087`
- БД: `payment_db`

### Сущности

- `Payment`

### Минимальные поля Payment

- `id`
- `targetType`
- `targetId`
- `userId`
- `amount`
- `currency`
- `status`
- `createdAt`
- `updatedAt`

### targetType

- `BOOKING`
- `CARGO_ORDER` для будущей итерации

### Статусы

- `PENDING`
- `SUCCESS`
- `FAILED`
- `REFUNDED`

### API MVP

- `POST /api/payments`
- `GET /api/payments/{id}`
- `GET /api/payments?targetType=&targetId=`

### Kafka events

Топик:

- `payment-events`

События:

- `PaymentSucceeded`
- `PaymentFailed`

Минимальный payload:

```json
{
  "eventId": "uuid",
  "eventType": "PaymentSucceeded",
  "paymentId": "uuid",
  "targetType": "BOOKING",
  "targetId": "uuid",
  "userId": "uuid",
  "amount": 1500.00,
  "occurredAt": "2026-05-18T12:00:00Z"
}
```

### Что реализовать

- OpenAPI спецификацию.
- Создание платежа в статусе `PENDING`.
- Заглушку обработки: для MVP можно сразу переводить платёж в `SUCCESS`.
- Публикацию Kafka-события после изменения статуса.
- Flyway миграции.
- Idempotency key желательно, но можно оставить как улучшение после MVP.

### Критерии готовности

- Создание платежа сохраняет запись в БД.
- После обработки публикуется событие в Kafka.
- Booking Service может получить событие и подтвердить бронирование.

---

## Агент 9. Booking Service

### Зона ответственности

Реализовать бронирование билетов, резервирование места через Trip Service и обработку событий оплаты.

### Модуль

`services/booking-service`

### OpenAPI

`openapi/booking-service.yaml`

### Порт и БД

- Порт: `8085`
- БД: `booking_db`

### Сущности

- `Booking`

### Минимальные поля Booking

- `id`
- `userId`
- `tripId`
- `paymentId`
- `seatNumber` nullable для MVP
- `status`
- `price`
- `createdAt`
- `updatedAt`

### Статусы

- `PENDING`
- `CONFIRMED`
- `CANCELLED`

### API MVP

- `POST /api/bookings`
- `GET /api/bookings/{id}`
- `GET /api/bookings/my`
- `POST /api/bookings/{id}/cancel`

### Межсервисные вызовы

- Booking Service вызывает Trip Service:
  - `reserve-seat`
  - `release-seat`
  - получение информации о рейсе
- Booking Service вызывает Payment Service:
  - создание платежа

### Kafka

Booking Service слушает топик:

- `payment-events`

Обрабатывает события:

- `PaymentSucceeded`
- `PaymentFailed`

### Процесс создания бронирования

1. Получить `userId` из JWT.
2. Получить рейс из Trip Service.
3. Создать Booking со статусом `PENDING`.
4. Вызвать Trip Service `reserve-seat`.
5. Вызвать Payment Service для создания платежа.
6. Сохранить `paymentId` в Booking.
7. Вернуть Booking клиенту.

### Процесс обработки оплаты

- Если пришёл `PaymentSucceeded`, найти booking по `paymentId` и перевести в `CONFIRMED`.
- Если пришёл `PaymentFailed`, найти booking по `paymentId`, перевести в `CANCELLED` и вызвать Trip Service `release-seat`.

### Что реализовать

- OpenAPI спецификацию.
- Создание бронирования.
- Получение своих бронирований.
- Отмену бронирования.
- Kafka consumer.
- Feign clients для Trip Service и Payment Service.
- Flyway миграции.
- Защиту от повторной обработки события оплаты.

### Критерии готовности

- При создании бронирования место резервируется в Trip Service.
- После `PaymentSucceeded` бронирование становится `CONFIRMED`.
- После `PaymentFailed` бронирование становится `CANCELLED`, место освобождается.
- Пользователь видит только свои бронирования.
- Есть тест успешного сценария и сценария failed payment.

---

## Агент 10. OpenAPI Contracts

### Зона ответственности

Подготовить согласованные OpenAPI-спецификации для MVP-сервисов до реализации контроллеров.

### Файлы

- `openapi/user-service.yaml`
- `openapi/route-service.yaml`
- `openapi/trip-service.yaml`
- `openapi/booking-service.yaml`
- `openapi/payment-service.yaml`

### Что учесть

- Единый формат ошибок.
- Единые поля `id`, `createdAt`, `updatedAt`.
- UUID для идентификаторов.
- Даты в ISO-8601.
- Деньги через decimal/string или number с явным `format: decimal`.
- JWT передаётся через `Authorization: Bearer <token>`.

### Общий формат ошибки

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Human readable message",
  "details": {
    "field": "reason"
  }
}
```

### Критерии готовности

- Все YAML проходят валидацию OpenAPI 3.
- По спецификациям можно сгенерировать Spring interfaces и DTO.
- Пути совпадают с маршрутами API Gateway.

---

## Агент 11. Integration сценарий MVP

### Зона ответственности

Проверить, что MVP-сервисы работают вместе как единая система.

### Сценарий для проверки

1. Поднять PostgreSQL и Kafka.
2. Запустить Config Server.
3. Запустить Eureka.
4. Запустить Gateway.
5. Запустить User, Route, Trip, Booking, Payment.
6. Зарегистрировать пользователя.
7. Получить JWT.
8. Получить список городов.
9. Найти маршрут.
10. Найти рейс.
11. Создать бронирование.
12. Убедиться, что в Trip Service стало меньше свободных мест.
13. Дождаться события успешной оплаты.
14. Убедиться, что Booking стал `CONFIRMED`.

### Критерии готовности

- Сценарий можно выполнить через Gateway.
- Есть Postman collection, HTTP-файл IntelliJ или README с curl-командами.
- В README описан порядок запуска MVP.

---

## Что не делать в MVP

- Не реализовывать frontend.
- Не реализовывать Cargo Service.
- Не реализовывать Driver Service.
- Не реализовывать Admin Service.
- Не реализовывать Notification Service.
- Не подключать реальную платёжную систему.
- Не усложнять распределёнными транзакциями или Saga framework.
- Не делать Kubernetes.

## Порядок раздачи задач агентам

1. Parent Maven + Docker Compose
2. OpenAPI Contracts
3. Config Server
4. Eureka Discovery Server
5. User Service
6. Route Service
7. Trip Service
8. Payment Service
9. Booking Service
10. API Gateway
11. Integration сценарий MVP

API Gateway можно начинать раньше, но финально проверить его удобнее после появления бизнес-сервисов.
