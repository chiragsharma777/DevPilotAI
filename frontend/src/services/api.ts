const API_BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();
  if (!response.ok) {
    const detail = typeof payload === "object" && payload
      ? (payload.detail || payload.message || payload.error)
      : payload;
    throw new Error(detail || `Request failed (${response.status})`);
  }
  return payload as T;
}

export { API_BASE_URL };
