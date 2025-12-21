import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  // Carga variables desde .env, .env.local, etc.
  const env = loadEnv(mode, process.cwd(), "");

  return {
    base: "/Decreto-Real/",
    plugins: [react()],
    define: {
      // Mantengo compatibilidad con tu código actual:
      "process.env.API_KEY": JSON.stringify(env.GEMINI_API_KEY),
      "process.env.GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
  };
});
