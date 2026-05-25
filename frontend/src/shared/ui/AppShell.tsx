import type { PropsWithChildren } from "react";
import { NavLink } from "react-router-dom";
import { NotificationCenter } from "../../features/notifications/NotificationCenter";

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
  return (
    <div className="app-shell">
      <header className="top-nav">
        <NavLink to="/" className="brand">
          RouteFlow
        </NavLink>
        <nav className="nav-links" aria-label="Main navigation">
          <NavLink to="/" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            Trips
          </NavLink>
          <NavLink to="/bookings" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            Bookings
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            Profile
          </NavLink>
          {isAuthenticated && (
            <NavLink to="/cargo" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
              Cargo
            </NavLink>
          )}
          {isAdmin && (
            <NavLink to="/admin" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
              Admin
            </NavLink>
          )}
          {isDriver && (
            <NavLink to="/driver" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
              Driver
            </NavLink>
          )}
          <NotificationCenter enabled={notificationsEnabled} />
          {isAuthenticated ? (
            <button className="nav-button" type="button" onClick={onLogout}>
              Logout
            </button>
          ) : (
            <NavLink to="/login" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
              Login
            </NavLink>
          )}
        </nav>
      </header>
      {children}
    </div>
  );
}
