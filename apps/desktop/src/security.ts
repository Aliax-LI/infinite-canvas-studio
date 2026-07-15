const trustedExternalHosts = new Set(["github.com"]);

export function isTrustedRendererUrl(
  senderUrl: string,
  expectedRendererUrl: string,
): boolean {
  try {
    const sender = new URL(senderUrl);
    const expected = new URL(expectedRendererUrl);

    if (expected.protocol === "file:") {
      return (
        sender.protocol === "file:" &&
        sender.pathname === expected.pathname &&
        sender.search === ""
      );
    }

    return (
      sender.protocol === expected.protocol &&
      sender.origin === expected.origin &&
      sender.pathname === expected.pathname
    );
  } catch {
    return false;
  }
}

export function parseHttpsExternalUrl(value: unknown): URL | null {
  if (typeof value !== "string") return null;

  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

export function requiresExternalConfirmation(url: URL): boolean {
  return !trustedExternalHosts.has(url.hostname);
}
