import { defineConfig, type Plugin } from "vite";

/**
 * `index.html` here IS the published page: the build writes it straight over
 * `/play/last-bastion/index.html`, so its head must already carry the
 * production SEO, Open Graph, breadcrumb, and analytics markup. It previously
 * did not, and every `npm run build` silently replaced the live page with a
 * bare `noindex` prototype shell.
 *
 * The two dev-only adjustments are applied here instead, so serving locally
 * never reaches the analytics endpoint and never risks a crawlable preview.
 */
function developmentIndexAdjustments(): Plugin {
  return {
    name: "last-bastion-dev-index",
    apply: "serve",
    transformIndexHtml(html) {
      return html
        .replace("<head>", '<head>\n    <meta name="robots" content="noindex, nofollow" />')
        .replace(/<!-- Cloudflare Web Analytics -->[\s\S]*?<!-- End Cloudflare Web Analytics -->/, "");
    },
  };
}

export default defineConfig({
  base: "/play/last-bastion/",
  publicDir: false,
  plugins: [developmentIndexAdjustments()],
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
        codeSplitting: {
          groups: [
            {
              name: "phaser",
              test: /node_modules[\\/]phaser/,
            },
          ],
        },
      },
    },
  },
  server: {
    open: "/play/last-bastion/",
  },
});
