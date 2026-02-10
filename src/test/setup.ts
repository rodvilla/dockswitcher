import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
Object.defineProperty(window, "crypto", {
  value: {
    getRandomValues: (buffer: ArrayBufferView) =>
      (globalThis.crypto as unknown as typeof import("crypto")).randomFillSync(
        buffer,
      ),
  },
});

afterEach(() => {
  cleanup();
});
