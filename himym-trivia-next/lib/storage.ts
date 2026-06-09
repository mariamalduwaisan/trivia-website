// Safe localStorage helpers — won't throw in sandboxed environments
export function lsGet(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
export function lsSet(key: string, val: string): void {
  try { localStorage.setItem(key, val); } catch { /* noop */ }
}
export function lsDel(key: string): void {
  try { localStorage.removeItem(key); } catch { /* noop */ }
}
