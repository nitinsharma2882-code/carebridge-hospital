// lib/auth.ts — EXTENDED VERSION (replace your existing lib/auth.ts)
// Adds role-based helpers while keeping all existing functions intact.

export type UserRole = 'hospital' | 'corporate' | 'clinic' | 'pharmaceutical';

// ─── EXISTING (keep as-is) ────────────────────────────────────────────────────
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('cb_hospital_token');
}

export function getHospital(): Record<string, unknown> | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('cb_hospital');
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function clearAuth(): void {
  localStorage.removeItem('cb_hospital_token');
  localStorage.removeItem('cb_hospital');
  localStorage.removeItem('cb_selected_role');
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

// ─── UPDATED saveAuth — now stores role ──────────────────────────────────────
export function saveAuth(token: string, data: Record<string, unknown>): void {
  localStorage.setItem('cb_hospital_token', token);
  localStorage.setItem('cb_hospital', JSON.stringify(data));
  // Persist the role from select-role screen inside user data for easy access
  if (data.role) {
    localStorage.setItem('cb_selected_role', data.role as string);
  }
}

// ─── NEW role helpers ─────────────────────────────────────────────────────────
export function getRole(): UserRole {
  if (typeof window === 'undefined') return 'hospital';
  return (localStorage.getItem('cb_selected_role') as UserRole) ?? 'hospital';
}

export function isRole(role: UserRole): boolean {
  return getRole() === role;
}

/** Returns the correct dashboard path for the current role */
export function getDashboardPath(): string {
  const paths: Record<UserRole, string> = {
    hospital:       '/dashboard',
    corporate:      '/corporate/dashboard',
    clinic:         '/clinic/dashboard',
    pharmaceutical: '/pharmaceutical/dashboard',
  };
  return paths[getRole()];
}
