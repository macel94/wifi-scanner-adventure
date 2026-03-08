import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  root: ".",
  base: "./",
  resolve: {
    alias: {
      "@core": resolve(__dirname, "src/core"),
      "@acquisition": resolve(__dirname, "src/acquisition"),
      "@sensors": resolve(__dirname, "src/sensors"),
      "@renderer": resolve(__dirname, "src/renderer"),
      "@ui": resolve(__dirname, "src/ui"),
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
    target: "es2022",
  },
  server: {
    port: 3000,
    open: true,
  },
});
