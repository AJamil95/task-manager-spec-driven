import { defineConfig } from "vite";

export default defineConfig({
  root: "src/public",
  build: {
    outDir: "../../dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: "src/public/index.html",
      },
    },
    // Ensure proper asset handling
    assetsDir: "assets",
    // Generate source maps for debugging
    sourcemap: true,
  },
  server: {
    // Proxy API requests to the Express server during development
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
    // Serve from port 5173 (Vite default)
    port: 5173,
    // Open browser automatically
    open: false,
  },
  // Ensure proper module resolution
  resolve: {
    alias: {
      // Allow absolute imports from src/public
      "@": "/ts",
    },
  },
  // CSS configuration
  css: {
    // Enable CSS source maps
    devSourcemap: true,
  },
});
