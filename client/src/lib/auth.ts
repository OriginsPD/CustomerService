/**
 * Staff authentication — JWT-backed.
 * On login, calls POST /api/auth/login to get a signed JWT.
 * Token and username are stored in localStorage.
 */

const TOKEN_KEY = "vcc_staff_token";
const SESSION_KEY = "vcc_staff_session";

interface StaffSession {
  username: string;
  loginAt: string;
}

export const auth = {
  /** Persist token + session after a successful server login */
  setSession(token: string, username: string): void {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ username, loginAt: new Date().toISOString() } satisfies StaffSession)
    );
  },

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(SESSION_KEY);
  },

  isAuthenticated(): boolean {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return false;
    // Decode the JWT payload (base64url) and verify the exp claim client-side.
    // This prevents stale tokens from being used after the 8-hour TTL expires,
    // so staff are redirected to /staff/login instead of hitting a 401 mid-session.
    try {
      const payloadB64 = token.split(".")[1];
      if (!payloadB64) return false;
      const payload = JSON.parse(atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/")));
      if (typeof payload.exp === "number" && payload.exp < Math.floor(Date.now() / 1000)) {
        // Token is expired — clear storage proactively
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(SESSION_KEY);
        return false;
      }
      return true;
    } catch {
      return false;
    }
  },

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  getSession(): StaffSession | null {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as StaffSession) : null;
  },
};

/** Key used to persist the current customer's session across page refreshes */
export const MY_SESSION_KEY = "vcc_my_session_id";

/** Key used to store the 24-hour Day Pass from QR scan */
export const DAY_SESSION_KEY = "vcc_day_session_id";
