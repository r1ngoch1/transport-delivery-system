# Архитектура системы междугородних перевозок

## 1. Обзор системы

Система междугородних перевозок — учебное микросервисное приложение для дипломного проекта, построенное на Java Spring Boot и Spring Cloud. Система обеспечивает бронирование пассажирских билетов на междугородние рейсы и попутную перевозку грузов. На первом этапе интеграция с магазином не реализуется: грузовая заявка создаётся вручную пассажиром/заказчиком. Разработка ведётся по подходу API-First: сначала проектируется OpenAPI-спецификация, затем на её основе генерируются серверные интерфейсы и клиентский код.

Для дипломного проекта выбран формат монорепозитория с Maven multi-module. Это упрощает сборку, запуск через Docker Compose, синхронизацию версий зависимостей и демонстрацию проекта.

MVP включает только ядро системы:
- Config Server
- Eureka Server
- API Gateway
- User Service
- Route Service
- Trip Service
- Booking Service
- Payment Service
- Kafka
- PostgreSQL

Driver Service, Cargo Service, Admin Service, Notification Service и фронтенды относятся ко второй итерации.

---

## 2. Роли пользователей

| Роль | Описание |
|------|----------|
| **Пассажир / Заказчик (PASSENGER)** | Бронирует билеты на рейсы, создаёт заявки на перевозку груза, просматривает свои заказы |
| **Водитель / Перевозчик (DRIVER)** | Выполняет рейсы, принимает грузовые заявки, имеет расширенный профиль с балансом и статистикой |
| **Администратор (ADMIN)** | Полное управление системой через отдельную админ-панель |

---

## 3. Микросервисы

### 3.1. Инфраструктурные сервисы

#### Config Server
- Централизованное хранение конфигураций всех сервисов
- Git-репозиторий как источник конфигов
- Профили окружения: dev, prod
- Порт: 8888

#### Eureka Server (Service Discovery)
- Реестр всех микросервисов
- Каждый сервис регистрируется при запуске
- Сервисы находят друг друга по имени, а не по IP-адресу
- Порт: 8761

#### API Gateway (Spring Cloud Gateway)
- Единая точка входа для всех внешних запросов
- Маршрутизация:
  - `/api/**` → бизнес-сервисы (пассажир, водитель)
  - `/internal/admin/**` → Admin Service (только роль ADMIN)
- Проверка JWT-токена на уровне шлюза
- Для `/internal/**` — дополнительная проверка роли ADMIN
- Rate limiting (ограничение частоты запросов)
- CORS-настройки для фронтендов
- Порт: 8080

---

### 3.2. Бизнес-сервисы

#### User Service (Сервис пользователей)
- Регистрация и аутентификация (Spring Security + JWT)
- Три роли: PASSENGER, DRIVER, ADMIN
- Профиль пользователя (ФИО, телефон, email)
- Порт: 8081
- БД: user_db
- Сущности: User, Role, UserRole

#### Driver Service (Сервис профиля водителя)
- Расширенный профиль водителя (стаж, категория прав, фото, рейтинг, описание)
- Привязка к транспортному средству (марка, модель, госномер, вместимость, объём багажа)
- Баланс и история заработка
- Статус водителя: AVAILABLE / ON_TRIP / DAY_OFF
- Документы водителя (верификация)
- Статистика (количество рейсов, рейтинг)
- Связь с User Service через userId
- Порт: 8082
- БД: driver_db
- Сущности: DriverProfile, Vehicle, DriverDocument, DriverBalance, BalanceTransaction

#### Route Service (Сервис маршрутов)
- Справочник городов
- Маршруты (город отправления → город назначения)
- Расстояние и примерное время в пути
- Промежуточные остановки
- CRUD для админа, чтение для всех
- Порт: 8083
- БД: route_db
- Сущности: City, Route, RouteStop

#### Trip Service (Сервис рейсов)
- Конкретные рейсы по маршрутам
- Дата и время отправления / прибытия
- Привязка водителя к рейсу
- Количество мест (всего / свободно)
- Доступный объём багажа (для грузоперевозок)
- Является источником истины по вместимости рейса: пассажирские места и багажный объём резервируются и освобождаются только через Trip Service
- Статусы рейса: SCHEDULED → IN_PROGRESS → COMPLETED / CANCELLED
- Связь с Route Service через OpenFeign — получает данные маршрута
- Порт: 8084
- БД: trip_db
- Сущности: Trip

#### Booking Service (Сервис бронирования)
- Бронирование места на рейс пассажиром
- Проверка свободных мест через Trip Service (OpenFeign)
- Статусы бронирования: PENDING → CONFIRMED → CANCELLED
- После успешной оплаты — статус меняется на CONFIRMED
- Просмотр своих бронирований для пассажира
- Порт: 8085
- БД: booking_db
- Сущности: Booking

#### Cargo Service (Сервис грузоперевозок)
- Создание заявки на перевозку груза (откуда, куда, вес, габариты, описание)
- Поиск подходящих рейсов с доступным багажным местом
- Водитель видит список заявок по своим рейсам и принимает/отклоняет
- Статусы заявки: CREATED → ACCEPTED → IN_TRANSIT → DELIVERED / CANCELLED
- Связь с Trip Service — поиск попутных рейсов
- Связь с Payment Service — оплата доставки
- Порт: 8086
- БД: cargo_db
- Сущности: CargoOrder, CargoItem

#### Payment Service (Сервис оплаты)
- Приём запроса на оплату от Booking Service и Cargo Service
- Интеграция с платёжной системой (первый этап — заглушка, далее — реальная интеграция)
- В MVP оплата обрабатывается асинхронно: после обработки платежа сервис публикует событие в Kafka
- Статусы платежа: PENDING → SUCCESS → FAILED → REFUNDED
- История платежей
- Привязка платежа к бронированию или грузовой заявке
- Payment Service инициирует финансовые транзакции, но не является владельцем баланса водителя
- Порт: 8087
- БД: payment_db
- Сущности: Payment

#### Notification Service (Сервис уведомлений)
- Отправка уведомлений (email, в перспективе — push)
- Слушает события из Kafka
- События: бронирование подтверждено, рейс отменён, груз доставлен, оплата прошла
- Порт: 8088
- БД: notification_db
- Сущности: Notification, NotificationTemplate

---

### 3.3. Admin Service (Сервис администрирования)

- Отдельный микросервис-агрегатор для админ-панели
- Все эндпоинты под префиксом `/internal/admin/**`
- Доступ контролируется через API Gateway и методную security-проверку по JWT внутри сервиса
- Агрегирует данные из всех бизнес-сервисов через OpenFeign:
  - Управление пользователями (User Service)
  - Верификация документов водителей (Driver Service)
  - CRUD маршрутов и городов (Route Service)
  - CRUD рейсов, назначение водителей (Trip Service)
  - Управление бронированиями (Booking Service)
  - Управление грузовыми заявками (Cargo Service)
  - Просмотр платежей (Payment Service)
- Аудит действий админа (кто, когда, что изменил)
- Дашборд и статистика системы
- Порт: 8089
- БД: admin_db
- Сущности: AuditLog, DashboardStats

---

## 4. Подход API-First

Разработка каждого микросервиса ведётся по принципу API-First:

1. Сначала описывается OpenAPI 3.0 спецификация (YAML) для каждого сервиса
2. На основе спецификации с помощью OpenAPI Generator (Maven-плагин) генерируются:
   - Серверные интерфейсы контроллеров (Spring-стабы)
   - DTO-классы (модели запросов и ответов)
   - Feign-клиенты для межсервисного взаимодействия
3. Разработчик реализует сгенерированные интерфейсы контроллеров
4. Спецификация является единым источником правды для API

Преимущества:
- Контракт API фиксируется до написания кода
- Автоматическая генерация серверного и клиентского кода
- Согласованность между сервисами
- Актуальная документация Swagger UI из спецификации

---

## 5. Схема взаимодействия

```
       Пассажир / Водитель                    Администратор
              │                                     │
      React SPA (3000)                   React SPA Admin (3001)
              │                                     │
              ├──── /api/** ────┐    ┌── /internal/admin/** ──┤
              │                 │    │                        │
              │            API Gateway (8080)                 │
              │            JWT-проверка                       │
              │            /internal/** → проверка ADMIN      │
              │                 │                             │
  ┌───────────┼─────────────────┼─────────────────────────────┤
  │           │                 │                             │
  │    ┌──────┼──────┬──────────┼────────┬─────────┬──────────┤
  │    │      │      │          │        │         │          │
User Driver Route  Trip     Booking   Cargo    Payment  Notification  Admin
Svc   Svc   Svc    Svc       Svc      Svc       Svc       Svc        Svc
(8081)(8082)(8083) (8084)   (8085)   (8086)    (8087)    (8088)     (8089)
  │    │            │         │        │         │          ▲          │
  │    │            │         │        │         │          │          │
  │    ├→Trip Svc   │         │        │         │          │     Feign│
  │    ├→Cargo Svc  │         │        │         │          │     ко   │
  │    ├→Payment    │         │        │         │          │     всем │
  │    │            │         │        │         │          │   сервисам
  │    │     Route←─┤         │        │         │          │          │
  │    │     Svc    │  Trip←──┤        │         │          │          │
  │    │            │  Svc    │ Payment←┤         │          │          │
  │    │            │         │  Svc   │         │          │          │
  └────┴────────────┴─────────┴────────┴─────────┴──→ Kafka ┘          │
                                                    (события)          │
```

### 5.1. Синхронное взаимодействие (REST + OpenFeign)

| Кто вызывает | Кого вызывает | Зачем |
|---|---|---|
| Trip Service | Route Service | Получить данные маршрута |
| Booking Service | Trip Service | Проверить наличие свободных мест |
| Booking Service | Payment Service | Инициировать оплату билета |
| Cargo Service | Trip Service | Найти попутные рейсы с багажным местом |
| Cargo Service | Payment Service | Инициировать оплату доставки |
| Driver Service | Trip Service | Получить рейсы водителя |
| Driver Service | Cargo Service | Получить грузовые заявки водителя |
| Driver Service | Payment Service | Получить заработок и историю выплат |
| Admin Service | User Service | Управление пользователями |
| Admin Service | Driver Service | Верификация водителей |
| Admin Service | Route Service | CRUD маршрутов и городов |
| Admin Service | Trip Service | CRUD рейсов |
| Admin Service | Booking Service | Управление бронированиями |
| Admin Service | Cargo Service | Управление грузовыми заявками |
| Admin Service | Payment Service | Просмотр платежей |

### 5.2. Асинхронное взаимодействие (Kafka)

| Источник события | Событие | Потребитель |
|---|---|---|
| Booking Service | Бронирование создано / подтверждено / отменено | Notification Service |
| Payment Service | Оплата прошла / не прошла | Notification Service, Booking Service, Cargo Service |
| Cargo Service | Груз принят / в пути / доставлен | Notification Service |
| Trip Service | Рейс отменён / завершён | Notification Service, Booking Service, Cargo Service |

---

### 5.3. Бронирование и резервирование мест в MVP

Trip Service является владельцем вместимости рейса. Booking Service не изменяет количество свободных мест напрямую, а вызывает Trip Service для резервирования или освобождения места.

Сценарий успешного бронирования:

1. Booking Service создаёт бронирование со статусом `PENDING`
2. Booking Service вызывает Trip Service: зарезервировать одно место на рейсе
3. Trip Service атомарно уменьшает `availableSeats`
4. Booking Service создаёт платёж в Payment Service
5. Payment Service обрабатывает платёж-заглушку и публикует событие `PaymentSucceeded` в Kafka
6. Booking Service получает событие и меняет статус бронирования на `CONFIRMED`

Сценарий неуспешной оплаты:

1. Payment Service публикует событие `PaymentFailed`
2. Booking Service меняет статус бронирования на `CANCELLED`
3. Booking Service вызывает Trip Service: освободить ранее зарезервированное место

Для защиты от двойного бронирования Trip Service должен выполнять резервирование в транзакции и проверять, что `availableSeats > 0`.

---

## 6. Базы данных (database-per-service)

| Сервис | База данных | Основные таблицы |
|---|---|---|
| User Service | user_db | users, roles, user_roles |
| Driver Service | driver_db | driver_profiles, vehicles, driver_documents, driver_balances, balance_transactions |
| Route Service | route_db | cities, routes, route_stops |
| Trip Service | trip_db | trips |
| Booking Service | booking_db | bookings |
| Cargo Service | cargo_db | cargo_orders, cargo_items |
| Payment Service | payment_db | payments |
| Notification Service | notification_db | notifications, notification_templates |
| Admin Service | admin_db | audit_logs |

- СУБД: PostgreSQL для всех сервисов
- Миграции: Flyway

---

## 7. Основные сценарии

### 7.1. Пассажир бронирует билет

1. Регистрация / вход → User Service → получает JWT-токен
2. Поиск маршрута (откуда → куда) → Route Service
3. Просмотр доступных рейсов по маршруту → Trip Service
4. Бронирование места → Booking Service
   - Booking Service проверяет свободные места → Trip Service
   - Booking Service создаёт платёж → Payment Service
5. Оплата → Payment Service → статус SUCCESS
6. Бронирование подтверждено → статус CONFIRMED
7. Уведомление пассажиру → Notification Service (через Kafka)

### 7.2. Заказчик создаёт заявку на перевозку груза

1. Вход → User Service → JWT-токен
2. Создание заявки (откуда, куда, вес, габариты, описание) → Cargo Service
3. Cargo Service ищет подходящие рейсы → Trip Service
4. Водитель видит заявку в своём профиле → Driver Service → Cargo Service
5. Водитель принимает заявку → Cargo Service → статус ACCEPTED
6. Заказчик оплачивает доставку → Payment Service
7. Водитель выполняет доставку → статус IN_TRANSIT → DELIVERED
8. Средства начисляются на баланс водителя → Payment Service → Driver Service
9. Уведомления на каждом этапе → Notification Service (через Kafka)

### 7.3. Профиль водителя

1. Вход → User Service → JWT-токен
2. Просмотр / редактирование профиля → Driver Service
3. Просмотр назначенных рейсов → Driver Service → Trip Service
4. Просмотр и принятие грузовых заявок → Driver Service → Cargo Service
5. Просмотр баланса и истории заработка → Driver Service → Payment Service
6. Смена статуса (доступен / в рейсе / выходной) → Driver Service

### 7.4. Администратор

Все действия через Admin Service (`/internal/admin/**`), отдельная авторизация:

- Дашборд со статистикой системы
- Управление пользователями (блокировка, роли) → Admin Service → User Service
- Верификация документов водителей → Admin Service → Driver Service
- CRUD городов и маршрутов → Admin Service → Route Service
- CRUD рейсов, назначение водителей → Admin Service → Trip Service
- Управление бронированиями → Admin Service → Booking Service
- Управление грузовыми заявками → Admin Service → Cargo Service
- Просмотр платежей → Admin Service → Payment Service
- Все действия логируются в audit_logs

---

## 8. Стек технологий

### Backend

| Категория | Технология |
|---|---|
| Язык | Java 17+ |
| Фреймворк | Spring Boot 3 |
| Микросервисная инфраструктура | Spring Cloud (Gateway, Config, Eureka, OpenFeign) |
| Безопасность | Spring Security + JWT |
| База данных | PostgreSQL |
| Миграции БД | Flyway |
| Брокер сообщений | Kafka |
| Отказоустойчивость | Resilience4j (Circuit Breaker, Retry, Fallback) |
| Контейнеризация | Docker + Docker Compose |
| API-подход | API-First (OpenAPI 3.0 + OpenAPI Generator Maven Plugin) |
| Документация API | Swagger UI (генерируется из OpenAPI-спецификации) |
| Сборка | Maven |

### Frontend

| Категория | Технология |
|---|---|
| Язык | TypeScript |
| Фреймворк | React 18+ |
| Сборщик | Vite |
| Маршрутизация | React Router |
| HTTP-клиент | Axios |
| UI-библиотека | Material UI (MUI) |
| Управление состоянием | Redux Toolkit |
| Генерация API-клиента | OpenAPI Generator (typescript-axios) |

Два отдельных фронтенд-приложения:
- Основной сайт (пассажир, водитель) — порт 3000, ходит через `/api/**`
- Админ-панель — порт 3001, ходит через `/internal/admin/**`

---

## 9. Порты сервисов

| Сервис | Порт |
|---|---|
| Config Server | 8888 |
| Eureka Server | 8761 |
| API Gateway | 8080 |
| User Service | 8081 |
| Driver Service | 8082 |
| Route Service | 8083 |
| Trip Service | 8084 |
| Booking Service | 8085 |
| Cargo Service | 8086 |
| Payment Service | 8087 |
| Notification Service | 8088 |
| Admin Service | 8089 |
| Frontend (основной) | 3000 |
| Frontend (админ-панель) | 3001 |

---

## 10. Порядок реализации

Тестирование (unit, integration) и документация ведутся параллельно с разработкой на каждом этапе.

### Итерация 1 — Ядро системы (Backend)
1. Config Server, Eureka Server, API Gateway
2. User Service (регистрация, аутентификация, JWT)
3. Route Service (города, маршруты)
4. Trip Service (рейсы)
5. Booking Service (бронирование)
6. Payment Service (заглушка оплаты)

### Итерация 2 — Расширение + Фронтенд
7. Driver Service (профиль водителя, баланс, статистика)
8. Cargo Service (грузоперевозки, попутная доставка)
9. Admin Service (админ-панель, агрегация, аудит)
10. Notification Service (уведомления через Kafka)
11. Интеграция Payment Service с реальной платёжной системой
12. Frontend — основной сайт (React SPA): поиск, бронирование, личный кабинет, профиль водителя
13. Frontend — админ-панель (React SPA): дашборд, управление всеми сущностями
14. Docker Compose для всей системы
