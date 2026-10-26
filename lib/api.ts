export const API_BASE_URL =
  "https://alitinvoiceappapi.azurewebsites.net/api";

const TOKEN_KEY = "token";
const SESSION_KEY = "session";

export type SessionUser = {
  userID: number;
  firstName: string;
  lastName?: string | null;
  email: string;
};

export type SessionCompany = {
  companyID: number;
  companyName: string;
  currencySymbol: string;
};

export type AuthResponse = {
  token: string;
  user?: SessionUser;
  company?: SessionCompany;
};

// ---------------- Session / token storage ----------------

const isBrowser = () => typeof window !== "undefined";

export function saveSession(auth: AuthResponse, rememberMe: boolean) {
  if (!isBrowser()) return;
  clearSession();
  const storage = rememberMe ? window.localStorage : window.sessionStorage;
  storage.setItem(TOKEN_KEY, auth.token);
  storage.setItem(
    SESSION_KEY,
    JSON.stringify({ user: auth.user ?? null, company: auth.company ?? null }),
  );
}

export function getToken(): string | null {
  if (!isBrowser()) return null;
  return (
    window.sessionStorage.getItem(TOKEN_KEY) ??
    window.localStorage.getItem(TOKEN_KEY)
  );
}

export function getSession(): {
  user: SessionUser | null;
  company: SessionCompany | null;
} {
  if (!isBrowser()) return { user: null, company: null };
  const raw =
    window.sessionStorage.getItem(SESSION_KEY) ??
    window.localStorage.getItem(SESSION_KEY);
  try {
    return raw ? JSON.parse(raw) : { user: null, company: null };
  } catch {
    return { user: null, company: null };
  }
}

export function getCurrencySymbol(): string {
  return getSession().company?.currencySymbol ?? "";
}

export function clearSession() {
  if (!isBrowser()) return;
  for (const s of [window.localStorage, window.sessionStorage]) {
    s.removeItem(TOKEN_KEY);
    s.removeItem(SESSION_KEY);
  }
}

export function requireAuth(): boolean {
  if (getToken()) return true;
  if (isBrowser()) window.location.href = "/login";
  return false;
}

// ---------------- Errors ----------------

export class ApiError extends Error {
  status: number;
  fieldErrors?: Record<string, string>;
  constructor(
    message: string,
    status: number,
    fieldErrors?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

const DEFAULT_MESSAGES: Record<number, string> = {
  400: "Invalid request. Please check your input.",
  401: "Your session has expired. Please log in again.",
  403: "You do not have permission to do this.",
  404: "Record not found.",
  409: "This record conflicts with an existing one.",
  412: "Record changed by another user. Please reload.",
  413: "File is too large.",
  415: "Unsupported file type.",
  429: "Too many attempts. Please wait and try again.",
  500: "Server error. Please try again later.",
};

function parseBody(text: string): unknown {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function toApiError(status: number, body: unknown): ApiError {
  let message = "";
  let fieldErrors: Record<string, string> | undefined;

  if (typeof body === "string") {
    message = body.trim();
  } else if (body && typeof body === "object") {
    const b = body as Record<string, unknown>;
    if (b.errors && typeof b.errors === "object") {
      fieldErrors = {};
      for (const [k, v] of Object.entries(b.errors as Record<string, unknown>)) {
        fieldErrors[k.toLowerCase()] = Array.isArray(v)
          ? String(v[0] ?? "Invalid value")
          : String(v);
      }
      message = Object.values(fieldErrors)[0] ?? "";
    }
    message = String(b.error ?? b.message ?? (message || b.title || ""));
  }

  return new ApiError(
    message || DEFAULT_MESSAGES[status] || `Request failed (${status}).`,
    status,
    fieldErrors,
  );
}

// ---------------- Request ----------------

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  query?: Record<string, string | number | null | undefined>;
  body?: unknown;
  /** Set false for public endpoints (login/signup). */
  auth?: boolean;
  timeoutMs?: number;
};

export async function apiRequest<T>(
  path: string,
  { method = "GET", query, body, auth = true, timeoutMs = 30000 }: RequestOptions = {},
): Promise<T> {
  const url = new URL(`${API_BASE_URL}/${path.replace(/^\/+/, "")}`);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
    }
  }

  const headers: Record<string, string> = { Accept: "application/json" };
  let payload: BodyInit | undefined;
  if (body instanceof FormData) {
    payload = body; 
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      method,
      headers,
      body: payload,
      signal: controller.signal,
    });
  } catch (err) {
    const timedOut = err instanceof DOMException && err.name === "AbortError";
    throw new ApiError(
      timedOut
        ? "The request timed out. Please try again."
        : "Network error. Please check your connection.",
      0,
    );
  } finally {
    clearTimeout(timer);
  }

  const data = parseBody(await response.text());

  if (!response.ok) {
    const error = toApiError(response.status, data);
    if (response.status === 401 && auth) {
      clearSession();
      if (isBrowser() && window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[api] ${method} ${url.pathname} -> ${response.status}: ${error.message}`);
    }
    throw error;
  }

  return data as T;
}

export function errorMessage(err: unknown, fallback = "Something went wrong.") {
  return err instanceof Error && err.message ? err.message : fallback;
}
