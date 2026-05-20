# MVP TODO

## Выполнено

- [x] Подготовить Maven multi-module монорепозиторий.
  - [x] Переделать корневой `pom.xml` в parent POM.
  - [x] Добавить модули `config-server`, `discovery-server`, `api-gateway`, `user-service`, `route-service`, `trip-service`, `booking-service`, `payment-service`.
  - [x] Зафиксировать Java 17, Spring Boot 3, Spring Cloud, Maven compiler и общие версии зависимостей.
  - [x] Добавить `services/`, `openapi/`, `config-repo/`.

- [x] Добавить OpenAPI-контракты MVP.
  - [x] `openapi/user-service.yaml`.
  - [x] `openapi/route-service.yaml`.
  - [x] `openapi/trip-service.yaml`.
  - [x] `openapi/booking-service.yaml`.
  - [x] `openapi/payment-service.yaml`.
  - [x] Описать JWT security scheme.

- [x] Реализовать инфраструктурные сервисы.
  - [x] Config Server на порту `8888`.
  - [x] Eureka Discovery Server на порту `8761`.
  - [x] API Gateway на порту `8080`.
  - [x] Gateway routes для User, Route, Trip, Booking, Payment.
  - [x] JWT-фильтр Gateway для защищенных routes.
  - [x] CORS для будущих frontend-приложений.

- [x] Реализовать User Service.
  - [x] Регистрация пользователя.
  - [x] Логин пользователя.
  - [x] Выдача JWT access token.
  - [x] Профиль текущего пользователя.
  - [x] Обновление профиля.
  - [x] Роли `PASSENGER`, `DRIVER`, `ADMIN`.
  - [x] Flyway-миграция для `users` и `user_roles`.

- [x] Реализовать Route Service.
  - [x] Сущность `City`.
  - [x] Сущность `Route`.
  - [x] Просмотр городов и маршрутов.
  - [x] Поиск маршрута по городам.
  - [x] Admin CRUD для городов и маршрутов.
  - [x] Seed-данные для демо-маршрута.
  - [x] Flyway-миграция для `cities` и `routes`.

- [x] Реализовать Trip Service.
  - [x] Сущность `Trip`.
  - [x] Статусы `SCHEDULED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`.
  - [x] Поиск рейсов по маршруту и дате.
  - [x] Admin CRUD для рейсов.
  - [x] Feign-клиент к Route Service.
  - [x] Транзакционное резервирование места.
  - [x] Транзакционное освобождение места.
  - [x] Pessimistic lock для защиты от гонок.
  - [x] Seed-рейс для демо-сценария.
  - [x] Flyway-миграция для `trips`.

- [x] Реализовать Payment Service.
  - [x] Сущность `Payment`.
  - [x] Статусы `PENDING`, `SUCCESS`, `FAILED`, `REFUNDED`.
  - [x] Создание платежа.
  - [x] MVP-заглушка успешной оплаты.
  - [x] Публикация `PaymentSucceeded` в Kafka topic `payment-events`.
  - [x] Поиск платежей по target.
  - [x] Flyway-миграция для `payments`.

- [x] Реализовать Booking Service.
  - [x] Сущность `Booking`.
  - [x] Статусы `PENDING`, `CONFIRMED`, `CANCELLED`.
  - [x] Создание бронирования.
  - [x] Получение `userId` из Gateway header.
  - [x] Feign-клиент к Trip Service.
  - [x] Feign-клиент к Payment Service.
  - [x] Резервирование места через Trip Service.
  - [x] Создание платежа через Payment Service.
  - [x] Kafka consumer для `payment-events`.
  - [x] Подтверждение booking по `PaymentSucceeded`.
  - [x] Отмена booking и release-seat по `PaymentFailed`.
  - [x] Просмотр своих бронирований.
  - [x] Flyway-миграция для `bookings`.

- [x] Добавить локальное окружение.
  - [x] `docker-compose.yml` для PostgreSQL и Kafka.
  - [x] Отдельные PostgreSQL базы для User, Route, Trip, Booking, Payment.
  - [x] `config-repo` для Config Server.
  - [x] `README.md` с порядком запуска.

- [x] Выполнить базовую проверку.
  - [x] `mvn validate`.
  - [x] `mvn compile`.

## Осталось улучшить

- [ ] Добавить полноценные request/response schemas в OpenAPI, а не только paths.
- [ ] Подключить OpenAPI Generator к Maven и генерировать DTO/API interfaces.
- [ ] Добавить unit-тесты User, Trip, Payment, Booking.
- [ ] Добавить integration-тесты с PostgreSQL и Kafka.
- [ ] Добавить единый `ApiExceptionHandler` во все бизнес-сервисы.
- [ ] Добавить idempotency key для Payment Service.
- [ ] Добавить сохранение обработанных Kafka event id в Booking Service.
- [ ] Добавить HTTP-файл или Postman collection для smoke-сценария.
- [ ] Проверить полный runtime-сценарий через Docker Compose и запущенные сервисы.
- [ ] Расширить Docker Compose application-сервисами после стабилизации запуска.

## Не входит в MVP

- [ ] Driver Service.
- [ ] Cargo Service.
- [ ] Admin Service.
- [ ] Notification Service.
- [ ] Frontend.
- [ ] Реальная платежная интеграция.
- [ ] Kubernetes.
