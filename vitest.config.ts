import { defineConfig, configDefaults } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["./test/setup.ts"],
    globals: true,
    exclude: [
      ...configDefaults.exclude,
      ...(process.env.DRIK_PARITY ? [] : ["test/drik-parity.test.ts"]),
    ],
    coverage: {
      provider: "v8",
      reporter: ["html", "lcov", "text"],
      reportsDirectory: "./coverage",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/index.ts"],
    },
  },
});
