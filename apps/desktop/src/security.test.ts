import assert from "node:assert/strict";
import test from "node:test";

import {
  isTrustedRendererUrl,
  parseHttpsExternalUrl,
  requiresExternalConfirmation,
} from "./security";

test("accepts only the configured renderer entry", () => {
  assert.equal(
    isTrustedRendererUrl("http://127.0.0.1:5173/", "http://127.0.0.1:5173/"),
    true,
  );
  assert.equal(
    isTrustedRendererUrl("http://localhost:5173/", "http://127.0.0.1:5173/"),
    false,
  );
  assert.equal(
    isTrustedRendererUrl(
      "file:///tmp/untrusted/index.html",
      "file:///Applications/ICS/renderer/index.html",
    ),
    false,
  );
});

test("allows HTTPS external URLs and rejects other input", () => {
  assert.equal(parseHttpsExternalUrl("http://example.com"), null);
  assert.equal(parseHttpsExternalUrl("not a URL"), null);
  assert.equal(parseHttpsExternalUrl({}), null);
  assert.equal(
    parseHttpsExternalUrl("https://example.com/path")?.hostname,
    "example.com",
  );
});

test("requires confirmation outside the product allowlist", () => {
  assert.equal(
    requiresExternalConfirmation(new URL("https://github.com/Aliax-LI")),
    false,
  );
  assert.equal(
    requiresExternalConfirmation(new URL("https://example.com")),
    true,
  );
});
