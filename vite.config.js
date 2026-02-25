import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: './', // Heu sabh khan behtar aa, her repo te halando
  plugins: [react()],
})