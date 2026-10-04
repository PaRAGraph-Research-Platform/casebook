import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Static offline viewer: relative base so `dist/` works both from a plain
// file server and from any sub-path deployment, without external requests.
export default defineConfig({
    base: "./",
    plugins: [react()],
});
