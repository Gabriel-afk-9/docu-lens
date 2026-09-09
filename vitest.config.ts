import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      vscode: path.resolve(__dirname, "test/__mocks__/vscode.ts"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    include: ["test/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reportsDirectory: "coverage",
    },
  },
});
