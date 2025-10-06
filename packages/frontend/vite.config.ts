import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// import basicSsl from "@vitejs/plugin-basic-ssl";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import { serverLogger } from "./vite-plugin-logger";

// https://vite.dev/config/
export default defineConfig({
  base: "/tap-stake/",
  plugins: [
    react(),
    // basicSsl(), // Temporarily disabled for Playwright testing
    serverLogger(), // Add server logging plugin
    nodePolyfills({
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      protocolImports: true,
    }),
  ],
  server: {
    port: 3000,
    host: true,
  },
  define: {
    global: "globalThis",
  },
});
