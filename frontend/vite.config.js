// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/setupTests.js",
  },
  server: {
    port: 5173,
    allowedHosts: [
      'noncotyledonal-sloppier-sierra.ngrok-free.dev', // ← Tu dominio de ngrok
      'localhost' // ← Para desarrollo local
    ],
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
});