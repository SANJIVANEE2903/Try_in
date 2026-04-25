import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const port = Number(process.env.PORT ?? "5175");

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: Number.isFinite(port) ? port : 5175,
    strictPort: true,
  },
  preview: {
    host: "0.0.0.0",
    port: Number.isFinite(port) ? port : 5175,
  },
});
