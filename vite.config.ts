import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

// Standard Vite + React SPA. Build output goes to ./dist
// Deployable by copying dist/* into any web root (e.g. Nginx).
export default defineConfig({
  plugins: [
    // tanstackRouter plugin MUST come before react()
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
      routesDirectory: "./src/routes",
      generatedRouteTree: "./src/routeTree.gen.ts",
    }),
    react(),
    tailwindcss(),
    tsconfigPaths(),
  ],
  server: {
    host: "::",
    port: 8080,
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (!id.includes("node_modules")) return;
          // Landing-critical vendors kept in the main chunk so the first
          // paint doesn't wait for a second waterfall request.
          if (id.includes("react-dom") || id.match(/[\\/]react[\\/]/)) return;
          // Heavy libs used only on specific routes -> isolate so tree
          // shaking / route-level code split can drop them from landing.
          if (id.includes("xlsx")) return "vendor-xlsx";
          if (id.includes("html2canvas")) return "vendor-html2canvas";
          if (id.includes("jspdf")) return "vendor-jspdf";
          if (id.includes("recharts") || id.includes("d3-")) return "vendor-recharts";
          if (id.includes("react-day-picker") || id.includes("date-fns")) return "vendor-date";
          if (id.includes("embla-carousel")) return "vendor-carousel";
          if (id.includes("@radix-ui")) return "vendor-radix";
          if (id.includes("@tanstack")) return "vendor-tanstack";
          if (id.includes("@supabase")) return "vendor-supabase";
          if (id.includes("lucide-react")) return "vendor-icons";
        },
      },
    },
  },
});
