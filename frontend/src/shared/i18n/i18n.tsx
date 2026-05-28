import type { PropsWithChildren } from "react";
import { createContext, useContext, useMemo, useState } from "react";

type Locale = "en" | "ru";
type Params = Record<string, string | number>;

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Params) => string;
}

const STORAGE_KEY = "routeflow-locale";

const dictionary: Record<Locale, Record<string, string>> = {
  en: {},
  ru: {
    Trips: "Рейсы",
    Bookings: "Бронирования",
    Profile: "Профиль",
    Cargo: "Грузы",
    Admin: "Админ",
    Driver: "Водитель",
    Login: "Вход",
    Logout: "Выход",
    Notifications: "Уведомления",
    "View all": "Показать все",
    "Loading notifications": "Загрузка уведомлений",
    "Could not load notifications": "Не удалось загрузить уведомления",
    "No notifications": "Нет уведомлений",
    Open: "Открыть",
    "Mark read": "Отметить прочитанным",
    "All notifications": "Все уведомления",
    "Mark all as read": "Отметить все прочитанными",
    "All notifications marked as read": "Все уведомления отмечены как прочитанные",
    "Notification status": "Статус уведомления",
    "Any status": "Любой статус",
    Unread: "Непрочитанные",
    Read: "Прочитанные",
    "Notification type": "Тип уведомления",
    "Any type": "Любой тип",
    Booking: "Бронирование",
    Payment: "Оплата",
    System: "Система",
    "Open linked item": "Открыть связанный объект",
    "Could not mark notification as read": "Не удалось отметить уведомление как прочитанное",
    "Passenger access": "Доступ пассажира",
    "Driver access": "Доступ водителя",
    "Welcome back": "С возвращением",
    "Create account": "Создать аккаунт",
    "Sign in to manage bookings and payment status.": "Войдите, чтобы управлять бронированиями и статусами оплат.",
    "Register as a passenger or driver.": "Зарегистрируйтесь как пассажир или водитель.",
    "Auth mode": "Режим авторизации",
    "Show login form": "Показать форму входа",
    "Show register form": "Показать форму регистрации",
    Register: "Регистрация",
    Email: "Email",
    "Full name": "Полное имя",
    Phone: "Телефон",
    "Account type": "Тип аккаунта",
    Passenger: "Пассажир",
    Password: "Пароль",
    "Gateway is unavailable. Start backend services and try again.": "Шлюз недоступен. Запустите backend-сервисы и попробуйте снова.",
    "Please wait": "Подождите",
    Identity: "Данные",
    "Review account details and role access.": "Проверьте данные аккаунта и права доступа.",
    "Loading profile": "Загрузка профиля",
    "Could not load profile": "Не удалось загрузить профиль",
    Roles: "Роли",
    Reservations: "Резервы",
    "My bookings": "Мои бронирования",
    "Track trip reservations and payment status.": "Отслеживайте брони рейсов и статусы оплат.",
    "Loading bookings": "Загрузка бронирований",
    "Could not load bookings": "Не удалось загрузить бронирования",
    "No bookings yet": "Бронирований пока нет",
    "Could not load payment status": "Не удалось загрузить статус оплаты",
    "No payment yet": "Оплаты пока нет",
    "Loading payment": "Загрузка оплаты",
    "My cargo orders": "Мои грузовые заказы",
    "Review cargo shipments, route details, and payment status.": "Проверьте отправки грузов, детали маршрута и статус оплаты.",
    "Cargo order cancelled": "Грузовой заказ отменен",
    "Loading cargo orders": "Загрузка грузовых заказов",
    "Could not load cargo orders": "Не удалось загрузить грузовые заказы",
    "Could not cancel cargo order": "Не удалось отменить грузовой заказ",
    "No cargo orders yet": "Грузовых заказов пока нет",
    "Cargo details": "Детали груза",
    "Cancel cargo order": "Отменить грузовой заказ",
    Pickup: "Погрузка",
    Dropoff: "Выгрузка",
    "Pickup address pending": "Адрес погрузки не указан",
    "Dropoff address pending": "Адрес выгрузки не указан",
    "Sender pending": "Отправитель не указан",
    "Recipient pending": "Получатель не указан",
    "Route preview": "Предпросмотр маршрута",
    "Select route": "Выберите маршрут",
    "Choose a route to preview distance and capacity.": "Выберите маршрут, чтобы посмотреть расстояние и вместимость.",
    "Route preview placeholder": "Заглушка предпросмотра маршрута",
    "Route from {from} to {to}": "Маршрут из {from} в {to}",
    "Find a trip": "Найти рейс",
    "Passenger route": "Пассажирский маршрут",
    "Cargo route": "Грузовой маршрут",
    "Search routes, compare cargo capacity, and create cargo orders through the gateway.": "Ищите маршруты, сравнивайте доступный объем и оформляйте грузовые заказы через шлюз.",
    "Search routes, compare seats, and book through the gateway.": "Ищите маршруты, сравнивайте количество мест и бронируйте через шлюз.",
    Showing: "Показаны",
    "on {date}": "на {date}",
    "Search trip": "Поиск рейса",
    "Search cargo space": "Поиск грузового места",
    "Search mode": "Режим поиска",
    From: "Откуда",
    To: "Куда",
    Date: "Дата",
    Search: "Поиск",
    "Any city": "Любой город",
    "No route found for selected cities": "Маршрут для выбранных городов не найден",
    "Booking created": "Бронирование создано",
    "View bookings": "Смотреть бронирования",
    "Cargo order created": "Грузовой заказ создан",
    "Could not create booking": "Не удалось создать бронирование",
    "Could not create cargo order": "Не удалось создать грузовой заказ",
    "Searching trips": "Поиск рейсов",
    "Could not search trips": "Не удалось выполнить поиск рейсов",
    "No trips found for this route and date": "Рейсы по этому маршруту и дате не найдены",
    departure: "отправление",
    Shipping: "Отправка",
    "Ship cargo": "Отправить груз",
    Book: "Забронировать",
    Description: "Описание",
    "Pickup address": "Адрес погрузки",
    "Dropoff address": "Адрес выгрузки",
    "Declared value": "Объявленная стоимость",
    "Sender name": "Имя отправителя",
    "Sender phone": "Телефон отправителя",
    "Recipient name": "Имя получателя",
    "Recipient phone": "Телефон получателя",
    "Weight kg": "Вес, кг",
    "Length cm": "Длина, см",
    "Width cm": "Ширина, см",
    "Height cm": "Высота, см",
    "Cargo description is required": "Необходимо указать описание груза",
    "Cargo dimensions and weight must be positive": "Габариты и вес груза должны быть положительными",
    "Cargo volume exceeds available trip capacity": "Объем груза превышает доступную вместимость рейса",
    "Enter cargo details": "Введите параметры груза",
    "Estimated cargo price {price} RUB": "Оценочная стоимость груза {price} RUB",
    "Loading cities and routes": "Загрузка городов и маршрутов",
    "Could not load route catalog": "Не удалось загрузить каталог маршрутов",
    Cities: "Города",
    Routes: "Маршруты",
    "No cities available": "Нет доступных городов",
    "No routes available": "Нет доступных маршрутов",
    "Restricted area": "Ограниченная зона",
    "Admin access required": "Требуется доступ администратора",
    "This workspace is available only to users with the ADMIN role.": "Этот раздел доступен только пользователям с ролью ADMIN.",
    "Back to trips": "Назад к рейсам",
    "Checking admin access": "Проверка доступа администратора",
    "Could not check admin access": "Не удалось проверить доступ администратора",
    "Driver access required": "Требуется доступ водителя",
    "This workspace is available only to users with the DRIVER role.": "Этот раздел доступен только пользователям с ролью DRIVER.",
    "Checking driver access": "Проверка доступа водителя",
    "Could not check driver access": "Не удалось проверить доступ водителя",
    "Passenger flow": "Пассажирский поток",
    Dashboard: "Панель",
    Audit: "Аудит",
    "Loading admin data": "Загрузка данных администратора",
    "Could not load admin data": "Не удалось загрузить данные администратора",
    Overview: "Обзор",
    "Admin dashboard": "Панель администратора",
    "Operational workspace backed by the Admin Service facade.": "Операционная панель, поддерживаемая фасадом Admin Service.",
    "Audit log is written by Admin Service runtime logs.": "Журнал аудита ведется журналами выполнения Admin Service.",
    "Search users": "Поиск пользователей",
    "Email, name, role": "Email, имя, роль",
    "Search users, inspect profile fields, and review roles.": "Ищите пользователей, просматривайте поля профиля и роли.",
    Users: "Пользователи",
    "Driver profile saved": "Профиль водителя сохранен",
    "Availability slot created": "Слот доступности создан",
    "Availability slot saved": "Слот доступности сохранен",
    "Availability slot deleted": "Слот доступности удален",
    "Driver profile created": "Профиль водителя создан",
    "Trip created": "Рейс создан",
    "Loading driver profile": "Загрузка профиля водителя",
    "Could not load driver profile": "Не удалось загрузить профиль водителя",
    "Driver profile not found": "Профиль водителя не найден",
    "Driver workspace": "Рабочее место водителя",
    "Manage your profile, availability, and current assignments.": "Управляйте профилем, доступностью и текущими назначениями.",
    "Could not save driver profile": "Не удалось сохранить профиль водителя",
    Route: "Маршрут",
    "Departure time": "Время отправления",
    "Arrival time": "Время прибытия",
    "Total seats": "Всего мест",
    "Total cargo volume": "Общий объем груза",
    Price: "Цена",
    "Create trip": "Создать рейс",
    "Set availability to AVAILABLE before creating a trip": "Перед созданием рейса установите доступность AVAILABLE",
    "Could not create trip": "Не удалось создать рейс",
    Availability: "Доступность",
    "Loading availability": "Загрузка доступности",
    "Could not load availability": "Не удалось загрузить доступность",
    "Payment {status}": "Платеж {status}",
    "Booking {id}": "Бронирование {id}",
    "Trip {id}": "Рейс {id}",
    "Seat {seat}": "Место {seat}",
    "Trip {tripId}": "Рейс {tripId}",
    "Declared value {value} {currency}": "Объявленная стоимость {value} {currency}",
    "Trip {tripIdValue}": "Рейс {tripIdValue}",
    "Booking, cargo, and payment events delivered through Notification Service.": "События бронирований, грузов и оплат, доставляемые через Notification Service.",
    "Notifications {count} unread": "Уведомления: непрочитанных {count}",
    "{value} m3 cargo available": "{value} м3 доступно для груза",
    "{value} seats available": "{value} мест доступно",
    "Open {title}": "Открыть {title}",
    "Mark {title} as read": "Отметить {title} как прочитанное"
  }
};

const I18nContext = createContext<I18nContextValue | null>(null);

function format(template: string, params?: Params) {
  if (!params) {
    return template;
  }
  return Object.entries(params).reduce(
    (value, [key, param]) => value.replaceAll(`{${key}}`, String(param)),
    template
  );
}

function readInitialLocale(): Locale {
  const saved = globalThis.localStorage?.getItem(STORAGE_KEY);
  return saved === "ru" ? "ru" : "en";
}

export function LanguageProvider({ children }: PropsWithChildren) {
  const [locale, setLocaleState] = useState<Locale>(readInitialLocale);

  function setLocale(next: Locale) {
    setLocaleState(next);
    globalThis.localStorage?.setItem(STORAGE_KEY, next);
  }

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key, params) => {
        const translated = dictionary[locale][key] ?? key;
        return format(translated, params);
      }
    }),
    [locale]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used inside LanguageProvider");
  }
  return context;
}
