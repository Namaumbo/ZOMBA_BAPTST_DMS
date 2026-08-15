export interface AuthUser {
  id: number;
  username: string;
  email: string;
  role: "admin" | "data-entry" | "viewer";
  is_active: boolean;
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

export function storeAuth(token: string, user: AuthUser): void {
  localStorage.setItem("access_token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

export function clearAuth(): void {
  localStorage.removeItem("access_token");
  localStorage.removeItem("user");
}

export function hasRole(user: AuthUser | null, ...roles: string[]): boolean {
  return !!user && roles.includes(user.role);
}
