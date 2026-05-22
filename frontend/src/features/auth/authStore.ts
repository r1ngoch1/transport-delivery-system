const TOKEN_KEY = "transport.jwt";

type AuthListener = (token: string | null) => void;

const listeners = new Set<AuthListener>();

export const authStore = {
  getToken(): string | null {
    return window.localStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string): void {
    window.localStorage.setItem(TOKEN_KEY, token);
    notify(token);
  },

  clearToken(): void {
    window.localStorage.removeItem(TOKEN_KEY);
    notify(null);
  },

  isAuthenticated(): boolean {
    return Boolean(this.getToken());
  },

  subscribe(listener: AuthListener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }
};

function notify(token: string | null): void {
  listeners.forEach((listener) => listener(token));
}
