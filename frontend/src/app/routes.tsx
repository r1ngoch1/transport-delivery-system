import type { PropsWithChildren } from "react";
import { NavLink, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { authStore } from "../features/auth/authStore";
import { useAuthToken } from "../features/auth/useAuthToken";
import { LoginPage } from "../pages/LoginPage";
import { MyBookingsPage } from "../pages/MyBookingsPage";
import { ProfilePage } from "../pages/ProfilePage";
import { SearchPage } from "../pages/SearchPage";

export function AppRoutes() {
  const navigate = useNavigate();
  const token = useAuthToken();

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
