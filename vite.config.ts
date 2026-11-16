/// <reference types="vitest/config" />
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

const external = [/^react($|\/)/, /^react-dom($|\/)/, /^@floating-ui\//, /^@tanstack\//];

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    dts({ tsconfigPath: "./tsconfig.build.json", rollupTypes: true }),
  ],
  build: {
    lib: { entry: "src/index.ts", formats: ["es", "cjs"], fileName: (f) => (f === "es" ? "index.js" : "index.cjs"), cssFileName: "seun-ui" },
    rollupOptions: { external },
    sourcemap: true,
    emptyOutDir: true,
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    css: false,
  },
});
