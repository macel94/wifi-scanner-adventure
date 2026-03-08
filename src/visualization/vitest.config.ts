import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@core": resolve(__dirname, "src/core"),
      "@acquisition": resolve(__dirname, "src/acquisition"),
      "@sensors": resolve(__dirname, "src/sensors"),
      "@renderer": resolve(__dirname, "src/renderer"),
      "@ui": resolve(__dirname, "src/ui"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
