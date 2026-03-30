import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-vite-plugin";
import path from "path";

// In Docker the API lives on the server container (not localhost).
// Set VITE_API_TARGET=http://server:3001 in docker-compose.yml.
// Falls back to localhost for regular npm run dev.
const API_TARGET = process.env.VITE_API_TARGET ?? "http://localhost:3001";

// For LAN device testing (phones on the same WiFi), set VITE_DEV_HOST to
// your machine's local IP in client/.env.local (gitignored).
// e.g.  VITE_DEV_HOST=192.168.0.6
// This fixes the HMR WebSocket so hot-reload works on real devices.
const DEV_HOST = process.env.VITE_DEV_HOST ?? "localhost";

export default defineConfig({
  plugins: [
    react(),
    TanStackRouterVite({
      routesDirectory: "./src/routes",
      generatedRouteTree: "./src/routeTree.gen.ts",
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    // Bind to all interfaces so the Docker-forwarded port is reachable
    host: "0.0.0.0",
    // Vite 5.4.6+ tightened Host-header validation (CVE-2025-31125).
    // Setting true disables the check for this dev-only container.
    allowedHosts: true,
    // Tell the browser-side HMR client to reconnect via localhost:5173.
    // Without this, Vite advertises the container's internal hostname and
    // the WebSocket upgrade fails, tearing down every HTTP connection.
    hmr: {
      host: DEV_HOST,
      clientPort: 5174,
    },
    proxy: {
      "/api": {
        target: API_TARGET,
        changeOrigin: true,
      },
    },
  },
});
