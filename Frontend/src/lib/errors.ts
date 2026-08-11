/**
 * Normalize API / Axios / thrown values into a user-facing error string.
 * Handles both raw Axios errors and our `{ error: string | object }` API wrappers.
 */
export function getErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again."
): string {
  const resolved = resolveErrorMessage(error, 0);
  if (!resolved) return fallback;
  if (isGenericTransportMessage(resolved)) {
    return fallback;
  }
  return resolved;
}

function resolveErrorMessage(error: unknown, depth: number): string | null {
  if (error == null || error === "") return null;
  if (depth > 5) return null;

  if (typeof error === "string") {
    const trimmed = error.trim();
    return trimmed || null;
  }

  if (typeof error === "number" || typeof error === "boolean") {
    return String(error);
  }

  if (Array.isArray(error)) {
    const parts = error
      .map((item) => resolveErrorMessage(item, depth + 1))
      .filter((part): part is string => Boolean(part));
    return parts.length ? parts.join("; ") : null;
  }

  if (typeof error !== "object") return null;

  const err = error as Record<string, unknown>;

  // Our API helpers: { error: "..." } or { error: { message, response } }
  if ("error" in err && err.error != null) {
    const fromWrapped = resolveErrorMessage(err.error, depth + 1);
    if (fromWrapped && !isGenericTransportMessage(fromWrapped)) return fromWrapped;
    if (fromWrapped) {
      const fromData = extractFromData(err.response) || extractFromData((err.error as any)?.response?.data);
      if (fromData) return fromData;
      return fromWrapped;
    }
  }

  // Axios-style: response.data.message / error / errors
  const fromAxiosData = extractFromData(err.response && typeof err.response === "object"
    ? (err.response as Record<string, unknown>).data
    : undefined);
  if (fromAxiosData) return fromAxiosData;

  // Sometimes callers pass response.data directly
  const fromDirectData = extractFromData(err.data);
  if (fromDirectData) return fromDirectData;

  if (typeof err.message === "string" && err.message.trim()) {
    const msg = err.message.trim();
    if (!isGenericTransportMessage(msg)) return msg;
  }

  if (typeof err.msg === "string" && err.msg.trim()) {
    return err.msg.trim();
  }

  if (error instanceof Error && error.message.trim()) {
    const msg = error.message.trim();
    if (!isGenericTransportMessage(msg)) return msg;
    return msg;
  }

  return null;
}

function extractFromData(data: unknown): string | null {
  if (data == null) return null;
  if (typeof data === "string") {
    const trimmed = data.trim();
    return trimmed || null;
  }
  if (typeof data !== "object") return null;

  const d = data as Record<string, unknown>;

  if (typeof d.message === "string" && d.message.trim()) {
    return d.message.trim();
  }

  if (typeof d.error === "string" && d.error.trim()) {
    return d.error.trim();
  }

  if (d.error && typeof d.error === "object") {
    const nested = resolveErrorMessage(d.error, 0);
    if (nested) return nested;
  }

  if (Array.isArray(d.errors)) {
    const parts = d.errors
      .map((item) => {
        if (typeof item === "string") return item.trim();
        if (item && typeof item === "object") {
          const obj = item as Record<string, unknown>;
          if (typeof obj.msg === "string") return obj.msg.trim();
          if (typeof obj.message === "string") return obj.message.trim();
        }
        return resolveErrorMessage(item, 0);
      })
      .filter((part): part is string => Boolean(part));
    if (parts.length) return parts.join("; ");
  }

  if (typeof d.detail === "string" && d.detail.trim()) {
    return d.detail.trim();
  }

  return null;
}

function isGenericTransportMessage(message: string): boolean {
  const normalized = message.trim().toLowerCase();
  return (
    normalized === "network error" ||
    normalized === "request failed" ||
    normalized.startsWith("timeout of ") ||
    normalized === "failed to fetch" ||
    /^request failed with status code \d+$/i.test(normalized)
  );
}

/** Type guard for API helper results that return `{ error: string }` on failure. */
export function isApiError(result: unknown): result is { error: string } {
  return (
    typeof result === "object" &&
    result !== null &&
    "error" in result &&
    (result as { error: unknown }).error != null
  );
}

/** Convenience for API catch blocks: always returns `{ error: string }`. */
export function toApiError(
  error: unknown,
  fallback = "Operation failed"
): { error: string } {
  const message = getErrorMessage(error, fallback);

  // Make transport failures clearer than "Network Error"
  if (typeof error === "object" && error && "isAxiosError" in (error as object)) {
    const axiosErr = error as { code?: string; message?: string; response?: unknown };
    if (!axiosErr.response) {
      if (axiosErr.code === "ECONNABORTED" || /timeout/i.test(axiosErr.message || "")) {
        return { error: "Request timed out. Please try again." };
      }
      if (isGenericTransportMessage(message) || /network error/i.test(message)) {
        return { error: "Unable to reach the server. Check your connection and try again." };
      }
    }
  }

  return { error: message };
}
