/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
  },
  build: {
    chunkSizeWarningLimit: 800,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: "three-core",
              test: /[\\/]node_modules[\\/]three[\\/]/,
            },
            {
              name: "r3f-ecosystem",
              test: /[\\/]node_modules[\\/](@react-three|troika|three-stdlib|maath|camera-controls)[\\/]/,
            },
            {
              name: "react-vendor",
              test: /[\\/]node_modules[\\/](react|react-dom|zustand|lucide-react)[\\/]/,
            },
          ],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
  },
});
