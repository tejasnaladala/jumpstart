// PocketBase client. Activates only when NEXT_PUBLIC_POCKETBASE_URL is
// set in env (defaults to http://localhost:8090 if you've run
// scripts/start-pocketbase.sh). Stub mode (closed-beta-of-10) keeps
// using localStorage; the client below is dormant until you wire it.
//
// Why PocketBase: single Go binary, SQLite-backed, includes auth +
// realtime + admin UI + file storage out of the box. Cheaper to run
// than Supabase for the ~50-200 user closed-beta window. We migrate
// to Supabase or another full Postgres BaaS only if scale demands it.

export type PocketBaseClient = {
  baseUrl: string;
  // Light typed wrapper around fetch. Keeps this file tiny so we don't
  // pull in the full PocketBase SDK until we actually need it. The
  // typed methods below cover 90% of what the app does.
  get<T>(path: string): Promise<T>;
  post<T>(path: string, body: unknown): Promise<T>;
  patch<T>(path: string, body: unknown): Promise<T>;
  del(path: string): Promise<void>;
};

const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || "";

function authHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = window.localStorage.getItem("jumpstart.pb.token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function isConfigured(): boolean {
  return Boolean(PB_URL);
}

export function getClient(): PocketBaseClient | null {
  if (!isConfigured()) return null;
  return {
    baseUrl: PB_URL,
    async get<T>(path: string): Promise<T> {
      const res = await fetch(`${PB_URL}${path}`, {
        headers: { ...authHeader() },
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`PocketBase ${res.status}: ${path}`);
      return (await res.json()) as T;
    },
    async post<T>(path: string, body: unknown): Promise<T> {
      const res = await fetch(`${PB_URL}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`PocketBase ${res.status}: ${path}`);
      return (await res.json()) as T;
    },
    async patch<T>(path: string, body: unknown): Promise<T> {
      const res = await fetch(`${PB_URL}${path}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`PocketBase ${res.status}: ${path}`);
      return (await res.json()) as T;
    },
    async del(path: string): Promise<void> {
      const res = await fetch(`${PB_URL}${path}`, {
        method: "DELETE",
        headers: { ...authHeader() },
      });
      if (!res.ok && res.status !== 404) {
        throw new Error(`PocketBase ${res.status}: ${path}`);
      }
    },
  };
}
