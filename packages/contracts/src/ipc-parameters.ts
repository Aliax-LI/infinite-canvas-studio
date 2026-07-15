// IPC parameter validators — pure functions shared between preload and main.
// Keep Node-free so contracts can run in any TS runtime (renderer, tests).

export const MAXIMUM_URL_LENGTH = 8_192;
export const MAXIMUM_PATH_LENGTH = 4_096;

// Characters that must never appear in a user-supplied storage path.
export const INVALID_PATH_CHARACTERS = /[\x00-\x1f<>"|?\x7f]/;

export type ValidationResult<T> =
  | { ok: true; value: T }
  | {
      ok: false;
      code:
        | "invalid_type"
        | "string_too_long"
        | "invalid_characters"
        | "unsupported_protocol"
        | "empty";
    };

export function validateStorageDirectory(
  value: unknown,
): ValidationResult<string> {
  if (typeof value !== "string") {
    return { ok: false, code: "invalid_type" };
  }
  if (value.length === 0) {
    return { ok: false, code: "empty" };
  }
  if (value.length > MAXIMUM_PATH_LENGTH) {
    return { ok: false, code: "string_too_long" };
  }
  if (INVALID_PATH_CHARACTERS.test(value)) {
    return { ok: false, code: "invalid_characters" };
  }
  return { ok: true, value };
}

export function validateHttpsUrl(value: unknown): ValidationResult<string> {
  if (typeof value !== "string") {
    return { ok: false, code: "invalid_type" };
  }
  if (value.length === 0) {
    return { ok: false, code: "empty" };
  }
  if (value.length > MAXIMUM_URL_LENGTH) {
    return { ok: false, code: "string_too_long" };
  }
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return { ok: false, code: "invalid_type" };
  }
  if (url.protocol !== "https:") {
    return { ok: false, code: "unsupported_protocol" };
  }
  return { ok: true, value };
}
