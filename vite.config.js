import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: '/campus_vista/', // Must match your repo name exactly
  plugins: [react()],
})