import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest, ApiError } from "../api/http";
import type { AuthResponse } from "../api/types";
import { authStore } from "../features/auth/authStore";
import { Button } from "../shared/ui/Button";

export function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await apiRequest<AuthResponse>(
        mode === "login" ? "/api/auth/login" : "/api/auth/register",
        {
          method: "POST",
          body: JSON.stringify(
            mode === "login"
              ? { email, password }
              : { email, phone, password, fullName, role: "PASSENGER" }
          )
        }
      );

      authStore.setToken(response.accessToken);
      navigate("/");
    } catch (caught) {
      if (caught instanceof ApiError) {
        setError(caught.message);
      } else {
        setError("Gateway is unavailable. Start backend services and try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="page auth-page">
      <section className="panel auth-panel">
        <p className="eyebrow">Passenger access</p>
        <h1 className="page-title">{mode === "login" ? "Welcome back" : "Create account"}</h1>
        <p className="page-subtitle">
          {mode === "login"
            ? "Sign in to manage bookings and payment status."
            : "Register as a passenger and start booking trips."}
        </p>
        <div className="segmented-control" aria-label="Auth mode">
          <button
            aria-label="Show login form"
            className={mode === "login" ? "segment active" : "segment"}
            type="button"
            onClick={() => setMode("login")}
          >
            Login
          </button>
          <button
            aria-label="Show register form"
            className={mode === "register" ? "segment active" : "segment"}
            type="button"
            onClick={() => setMode("register")}
          >
            Register
          </button>
        </div>
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Email
            <input
              required
              type="email"
              placeholder="passenger@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          {mode === "register" && (
            <>
              <label>
                Full name
                <input
                  required
                  placeholder="Passenger Name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                />
              </label>
              <label>
                Phone
                <input
                  required
                  placeholder="+79990000000"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                />
              </label>
            </>
          )}
          <label>
            Password
            <input
              required
              minLength={6}
              type="password"
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          {error && <div className="form-error">{error}</div>}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Please wait" : mode === "login" ? "Login" : "Register"}
          </Button>
        </form>
      </section>
    </main>
  );
}
