import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Resuelve el alias "@/..." → raíz de web/ (igual que tsconfig).
const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  resolve: {
    alias: [{ find: /^@\//, replacement: root }],
  },
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
  },
});
