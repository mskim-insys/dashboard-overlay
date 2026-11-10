import { resolve } from "node:path";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  main: {
    define: {
      __BUILD_TIMESTAMP__: JSON.stringify(new Date().toISOString()),
    },
    plugins: [externalizeDepsPlugin()],
  },
  preload: {
    define: {
      __INPUT_DEBUG_ENABLED__: JSON.stringify(
        process.env["DASHBOARD_OVERLAY_DEBUG_INPUT"] === "1",
      ),
    },
    build: {
      externalizeDeps: false,
      rollupOptions: {
        output: {
          format: "cjs",
          entryFileNames: "[name].cjs",
        },
      },
    },
  },
  renderer: {
    define: {
      __INPUT_DEBUG_ENABLED__: JSON.stringify(
        process.env["DASHBOARD_OVERLAY_DEBUG_INPUT"] === "1",
      ),
    },
    resolve: {
      alias: {
        "@renderer": resolve("src/renderer/src"),
      },
    },
    plugins: [react()],
  },
});
