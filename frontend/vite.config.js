import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
// Les textes contiennent des jetons :i-nom: ; le runtime JSX "@icons" les transforme en icônes SVG (aucun emoji affiché).
export default defineConfig({
  base: "./",
  plugins: [react({ jsxImportSource: "@icons" })],
  resolve: { alias: { "@icons": fileURLToPath(new URL("./src/icons", import.meta.url)) } },
  server: { port: 5173 },
});
