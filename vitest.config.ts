import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "src");

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": root,
      types: resolve(root, "types"),
      hooks: resolve(root, "hooks"),
      components: resolve(root, "components"),
      pages: resolve(root, "pages"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
