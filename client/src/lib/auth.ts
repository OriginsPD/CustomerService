/**
 * Staff authentication — JWT-backed.
 * On login, calls POST /api/auth/login to get a signed JWT.
 * Token and username are stored in localStorage.
 */

const TOKEN_KEY = "vcc_staff_token";
const SESSION_KEY = "vcc_staff_session";

export type StaffRole = "superadmin" | "admin" | "agent";

interface StaffSession {
  username: string;
  fullName: string;
  role: StaffRole;
  loginAt: string;
}

export const auth = {
  /** Persist token + session after a successful server login */
  setSession(token: string, username: string, role: StaffRole, fullName: string): void {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ 
        username, 
        role, 
        fullName, 
        loginAt: new Date().toISOString() 
      } satisfies StaffSession)
    );
  },

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(SESSION_KEY);
  },

  isAuthenticated(): boolean {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return false;
    
    try {
      const payloadB64 = token.split(".")[1];
      if (!payloadB64) return false;
      const payload = JSON.parse(atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/")));
      
      if (typeof payload.exp === "number" && payload.exp < Math.floor(Date.now() / 1000)) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(SESSION_KEY);
        return false;
      }
      return true;
    } catch {
      return false;
    }
  },

  isSuperAdmin(): boolean {
    const session = this.getSession();
    return session?.role === "superadmin";
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
