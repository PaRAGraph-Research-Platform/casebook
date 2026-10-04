import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

// Single-file build: JS, CSS and case data are inlined into
// dist-single/index.html. This is the canonical public copy — the PaRAGraph
// site vendors it with a SHA-256 manifest and serves it at
// https://www.sciencerag.win/casebook.
export default defineConfig({
    plugins: [react(), viteSingleFile()],
    build: { outDir: "dist-single", emptyOutDir: true, chunkSizeWarningLimit: 2000 },
});
