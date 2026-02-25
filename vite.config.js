import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/campus_vista/", // important for GitHub Pages
  plugins: [react()],
});
