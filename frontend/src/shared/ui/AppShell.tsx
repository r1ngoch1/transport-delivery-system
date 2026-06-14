import type { PropsWithChildren } from "react";
import { NavLink } from "react-router-dom";
import { NotificationCenter } from "../../features/notifications/NotificationCenter";
import { useI18n } from "../i18n/i18n";

interface AppShellProps extends PropsWithChildren {
  isAdmin: boolean;
  isAuthenticated: boolean;
  isDriver: boolean;
  notificationsEnabled: boolean;
  onLogout: () => void;
}

export function AppShell({
  children,
  isAdmin,
  isAuthenticated,
  isDriver,
  notificationsEnabled,
  onLogout
}: AppShellProps) {
  const { locale, setLocale, t } = useI18n();

  return (
    <div className="app-shell">
      <header className="top-nav">
        <NavLink to="/" className="brand">
          RouteFlow
        </NavLink>
        <nav className="nav-links" aria-label="Main navigation">
          <NavLink to="/" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            {t("Trips")}
          </NavLink>
          <NavLink to="/bookings" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            {t("Bookings")}
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            {t("Profile")}
          </NavLink>
          {isAuthenticated && (
            <NavLink to="/cargo" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
              {t("Cargo")}
            </NavLink>
          )}
          {isAdmin && (
            <NavLink to="/admin" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
              {t("Admin")}
            </NavLink>
          )}
          {isDriver && (
            <NavLink to="/driver" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
              {t("Driver")}
            </NavLink>
          )}
          <NotificationCenter enabled={notificationsEnabled} />
          <div className="language-switch" role="group" aria-label="Language switch">
            <button
              className={locale === "en" ? "nav-button language-button active" : "nav-button language-button"}
              type="button"
              onClick={() => setLocale("en")}
            >
              EN
            </button>
            <button
              className={locale === "ru" ? "nav-button language-button active" : "nav-button language-button"}
              type="button"
              onClick={() => setLocale("ru")}
            >
              RU
            </button>
          </div>
          {isAuthenticated ? (
            <button className="nav-button" type="button" onClick={onLogout}>
              {t("Logout")}
            </button>
          ) : (
            <NavLink to="/login" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
              {t("Login")}
            </NavLink>
          )}
        </nav>
      </header>
      {children}
    </div>
  );
}
