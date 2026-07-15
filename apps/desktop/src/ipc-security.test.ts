import assert from "node:assert/strict";
import test from "node:test";

import {
  validateStorageDirectory,
  validateHttpsUrl,
  MAXIMUM_PATH_LENGTH,
  MAXIMUM_URL_LENGTH,
} from "@ics/contracts";

test("validateStorageDirectory accepts a clean absolute path", () => {
  const result = validateStorageDirectory("/home/user/documents/canvas");
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.value, "/home/user/documents/canvas");
  }
});

test("validateStorageDirectory accepts Windows-style paths", () => {
  const result = validateStorageDirectory("C:\\Users\\dev\\ICS");
  assert.equal(result.ok, true);
});

test("validateStorageDirectory rejects non-string input", () => {
  assert.equal(validateStorageDirectory(123).ok, false);
  assert.equal(validateStorageDirectory(null).ok, false);
  assert.equal(validateStorageDirectory(undefined).ok, false);
  assert.equal(validateStorageDirectory({}).ok, false);
});

test("validateStorageDirectory rejects empty string", () => {
  const result = validateStorageDirectory("");
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.code, "empty");
});

test("validateStorageDirectory rejects paths that exceed the maximum length", () => {
  const result = validateStorageDirectory("a".repeat(MAXIMUM_PATH_LENGTH + 1));
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.code, "string_too_long");
});

test("validateStorageDirectory rejects paths with invalid characters", () => {
  assert.equal(validateStorageDirectory("/path/with<angle").ok, false);
  assert.equal(validateStorageDirectory("/path/with>angle").ok, false);
  assert.equal(validateStorageDirectory('/path/with"quote').ok, false);
  assert.equal(validateStorageDirectory("/path/with|pipe").ok, false);
  assert.equal(validateStorageDirectory("/path/with?wildcard").ok, false);
});

test("validateStorageDirectory accepts a path exactly at the maximum length", () => {
  const result = validateStorageDirectory("a".repeat(MAXIMUM_PATH_LENGTH));
  assert.equal(result.ok, true);
});

test("validateHttpsUrl accepts a clean HTTPS URL", () => {
  const result = validateHttpsUrl("https://github.com/Aliax-LI");
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.value, "https://github.com/Aliax-LI");
  }
});

test("validateHttpsUrl rejects HTTP URLs", () => {
  const result = validateHttpsUrl("http://example.com");
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.code, "unsupported_protocol");
});

test("validateHttpsUrl rejects non-string input", () => {
  assert.equal(validateHttpsUrl(123).ok, false);
  assert.equal(validateHttpsUrl(null).ok, false);
});

test("validateHttpsUrl rejects invalid URL strings", () => {
  const result = validateHttpsUrl("not a url at all");
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.code, "invalid_type");
});

test("validateHttpsUrl rejects empty string", () => {
  const result = validateHttpsUrl("");
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.code, "empty");
});

test("validateHttpsUrl rejects URLs that exceed the maximum length", () => {
  const longUrl = "https://example.com/" + "a".repeat(MAXIMUM_URL_LENGTH);
  const result = validateHttpsUrl(longUrl);
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.code, "string_too_long");
});

test("validateHttpsUrl rejects javascript: and data: protocols", () => {
  assert.equal(validateHttpsUrl("javascript:alert(1)").ok, false);
  assert.equal(validateHttpsUrl("data:text/html,a").ok, false);
});
