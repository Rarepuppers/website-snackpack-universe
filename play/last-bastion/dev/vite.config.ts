import { defineConfig } from "vite";

export default defineConfig({
  base: "/play/last-bastion/",
  publicDir: false,
  build: {
    assetsInlineLimit: 0,
    assetsDir: "game-assets",
    emptyOutDir: false,
    outDir: "..",
    rolldownOptions: {
      output: {
        entryFileNames: "game-assets/game.js",
        chunkFileNames: "game-assets/[name].js",
        assetFileNames: "game-assets/[name][extname]",
      },
    },
  },
  server: {
    open: "/play/last-bastion/",
  },
});
