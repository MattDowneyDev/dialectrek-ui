import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/setupTests.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      // Next's own [language]/[verb]/[topic] route folders use literal square
      // brackets, which the glob matcher used for coverage.include treats as
      // a character class -- "src/**" alone silently skips everything under
      // them, so their path needs its own escaped entry.
      include: ["src/**/*.{ts,tsx}", "src/app/\\[language\\]/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.d.ts",
        "src/**/__tests__/**",
        "src/setupTests.ts",
        "src/languages/es/grammar.ts",
        "src/languages/fr/grammar.ts",
      ],
    },
  },
});
