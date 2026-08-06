import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Backend actually listens on NODE_PORT (api/server.js), defaulting to 4000 — not the 3000
// documented in api/README.md nor the 5000 this file used to hardcode. Override via
// VITE_API_PROXY_TARGET in .env / .env.local if your api/ runs elsewhere.
const DEFAULT_API_TARGET = "http://localhost:4000";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: Number(env.VITE_PORT) || 3001,
      proxy: {
        "/api": {
          target: env.VITE_API_PROXY_TARGET || DEFAULT_API_TARGET,
          changeOrigin: true,
        },
      },
    },
  };
});
