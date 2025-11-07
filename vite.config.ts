import { defineConfig } from "vite";

export default defineConfig({
  root: "src/public",
  build: {
    outDir: "../../dist",
    emptyOutDir: false, // Don't empty the directory to preserve server files
    // Production optimizations
    minify: "esbuild", // Fast minification
    target: "es2020", // Modern browser support
    cssMinify: true,
    rollupOptions: {
      input: {
        main: "src/public/index.html",
      },
      output: {
        // Consistent file naming for caching
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
    // Ensure proper asset handling
    assetsDir: "assets",
    // Generate source maps for production debugging
    sourcemap: true,
    // Optimize bundle size
    chunkSizeWarningLimit: 1000,
    // Enable compression-friendly builds
    reportCompressedSize: true,
  },
  server: {
    // Proxy API requests to the Express server during development
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      "/tasks": {
        target: "http://localhost:3000",
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
    // Enable CSS source maps in development
    devSourcemap: true,
    // CSS optimization for production
    postcss: {},
  },
  // Optimize dependencies
  optimizeDeps: {
    // Pre-bundle dependencies for faster dev server startup
    include: [],
    // Exclude dependencies that should not be pre-bundled
    exclude: [],
  },
  // Enable modern browser features
  esbuild: {
    // Remove console.log in production
    drop: process.env.NODE_ENV === "production" ? ["console", "debugger"] : [],
  },
});
