import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { createServer } from "./server/index.js";

export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
    fs: {
      allow: ["./", "./src", "./shared", "./public"],
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
    },
  },
  build: {
    outDir: "dist/spa",
  },
  plugins: [react(), (function expressPlugin() {
    return {
      name: "express-plugin",
      apply: "serve",
      configureServer(server) {
        const app = createServer();
        server.middlewares.use(app);
      },
    };
  })()],
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "./src"),
      "@shared": path.resolve(process.cwd(), "./shared"),
    },
  },
}));


