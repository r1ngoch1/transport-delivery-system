import type { PropsWithChildren } from "react";
import { useQuery } from "@tanstack/react-query";
import { NavLink, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { authStore } from "../features/auth/authStore";
import { useAuthToken } from "../features/auth/useAuthToken";
import { getCurrentUser } from "../features/profile/profileApi";
import { NotificationCenter } from "../features/notifications/NotificationCenter";
import { AdminPage } from "../pages/AdminPage";
import { DriverPage } from "../pages/DriverPage";
import { LoginPage } from "../pages/LoginPage";
import { MyBookingsPage } from "../pages/MyBookingsPage";
import { MyCargoOrdersPage } from "../pages/MyCargoOrdersPage";
import { NotificationsPage } from "../pages/NotificationsPage";
import { ProfilePage } from "../pages/ProfilePage";
import { SearchPage } from "../pages/SearchPage";
import { ApiErrorMessage } from "../shared/ui/ApiErrorMessage";
import { ScreenState } from "../shared/ui/ScreenState";

export function AppRoutes() {
  const navigate = useNavigate();
  const token = useAuthToken();
  const currentUserQuery = useQuery({
    queryKey: ["current-user", token],
    queryFn: getCurrentUser,
    enabled: Boolean(token)
  });
  const roles = currentUserQuery.data?.roles ?? [];
  const isAdmin = roles.includes("ADMIN");
  const isDriver = roles.includes("DRIVER");

  function handleLogout() {
    authStore.clearToken();
    navigate("/login");
  }

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
          <NavLink
            to="/bookings"
            className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
          >
            Bookings
          </NavLink>
          <NavLink
            to="/profile"
            className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
          >
            Profile
          </NavLink>
          {token && (
            <NavLink
              to="/cargo"
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
            >
              Cargo
            </NavLink>
          )}
          {isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
            >
              Admin
            </NavLink>
          )}
          {isDriver && (
            <NavLink
              to="/driver"
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
            >
              Driver
            </NavLink>
          )}
          <NotificationCenter enabled={Boolean(token) && currentUserQuery.isSuccess && roles.length > 0} />
          {token ? (
            <button className="nav-button" type="button" onClick={handleLogout}>
              Logout
            </button>
          ) : (
            <NavLink
              to="/login"
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
            >
              Login
            </NavLink>
          )}
        </nav>
      </header>
      <Routes>
        <Route path="/" element={<SearchPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/bookings"
          element={
            <ProtectedRoute>
              <MyBookingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cargo"
          element={
            <ProtectedRoute>
              <MyCargoOrdersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <NotificationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/*"
          element={
            <AdminRoute
              isLoading={currentUserQuery.isLoading}
              isError={currentUserQuery.isError}
              error={currentUserQuery.error}
              isAdmin={isAdmin}
            >
              <AdminPage />
            </AdminRoute>
          }
        />
        <Route
          path="/driver"
          element={
            <DriverRoute
              isLoading={currentUserQuery.isLoading}
              isError={currentUserQuery.isError}
              error={currentUserQuery.error}
              isDriver={isDriver}
            >
              <DriverPage />
            </DriverRoute>
          }
        />
      </Routes>
    </div>
  );
}

function ProtectedRoute({ children }: PropsWithChildren) {
  if (!authStore.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

interface AdminRouteProps extends PropsWithChildren {
  error: Error | null;
  isAdmin: boolean;
  isError: boolean;
  isLoading: boolean;
}

function AdminRoute({ children, error, isAdmin, isError, isLoading }: AdminRouteProps) {
  if (!authStore.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  if (isLoading) {
    return (
      <main className="page">
        <ScreenState className="page-subtitle" inline kind="loading" message="Checking admin access" />
      </main>
    );
  }
  if (isError) {
    return (
      <main className="page">
        <ApiErrorMessage error={error} fallback="Could not check admin access" />
      </main>
    );
  }
  if (!isAdmin) {
    return (
      <main className="page">
        <section className="panel content-panel">
          <p className="eyebrow">Restricted area</p>
          <h1 className="page-title">Admin access required</h1>
          <p className="page-subtitle">This workspace is available only to users with the ADMIN role.</p>
          <NavLink to="/" className="inline-link access-link">
            Back to trips
          </NavLink>
        </section>
      </main>
    );
  }
  return children;
}

interface DriverRouteProps extends PropsWithChildren {
  error: Error | null;
  isDriver: boolean;
  isError: boolean;
  isLoading: boolean;
}

function DriverRoute({ children, error, isDriver, isError, isLoading }: DriverRouteProps) {
  if (!authStore.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  if (isLoading) {
    return (
      <main className="page">
        <ScreenState className="page-subtitle" inline kind="loading" message="Checking driver access" />
      </main>
    );
  }
  if (isError) {
    return (
      <main className="page">
        <ApiErrorMessage error={error} fallback="Could not check driver access" />
      </main>
    );
  }
  if (!isDriver) {
    return (
      <main className="page">
        <section className="panel content-panel">
          <p className="eyebrow">Restricted area</p>
          <h1 className="page-title">Driver access required</h1>
          <p className="page-subtitle">This workspace is available only to users with the DRIVER role.</p>
          <NavLink to="/" className="inline-link access-link">
            Back to trips
          </NavLink>
        </section>
      </main>
    );
  }
  return children;
}
