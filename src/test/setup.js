import { afterEach, vi } from "vitest";

// Keep every test independent of the one before it.
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
