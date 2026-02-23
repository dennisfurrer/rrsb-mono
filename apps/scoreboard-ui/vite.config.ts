import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react(), viteSingleFile()],
    server: {
      port: Number(env.PORT) || 7201,
    },
    build: {
      outDir: "dist",
      assetsInlineLimit: 100000000,
    },
  };
});
