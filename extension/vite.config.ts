import react from "@vitejs/plugin-react";
import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";

function copyIfChanged(source: string, destination: string): void {
  if (existsSync(destination)) {
    const sourceContent = readFileSync(source);
    const destinationContent = readFileSync(destination);

    if (sourceContent.equals(destinationContent)) {
      return;
    }
  }

  mkdirSync(dirname(destination), { recursive: true });
  copyFileSync(source, destination);
}

function copyExtensionStaticFiles(): Plugin {
  return {
    name: "copy-extension-static-files",
    closeBundle() {
      copyIfChanged(resolve(__dirname, "manifest.json"), resolve(__dirname, "dist/manifest.json"));

      for (const size of [16, 48, 128]) {
        copyIfChanged(
          resolve(__dirname, `public/icons/icon${size}.png`),
          resolve(__dirname, `dist/icons/icon${size}.png`),
        );
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), copyExtensionStaticFiles()],
  publicDir: false,
  build: {
    outDir: "dist",
    emptyOutDir: false,
    rollupOptions: {
      input: {
        sidepanel: resolve(__dirname, "index.html"),
        contentScript: resolve(__dirname, "src/content/contentScript.ts"),
        serviceWorker: resolve(__dirname, "src/background/serviceWorker.ts"),
      },
      output: {
        entryFileNames: "assets/[name].js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: "assets/[name][extname]",
      },
    },
  },
});
