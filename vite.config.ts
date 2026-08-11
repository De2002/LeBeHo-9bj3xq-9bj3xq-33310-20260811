import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Shim the functions-js package to add the missing FunctionRegion export
      "@supabase/functions-js": path.resolve(
        __dirname,
        "src/lib/functions-js-shim.ts"
      ),
    },
    dedupe: ["@supabase/supabase-js"],
  },
});
