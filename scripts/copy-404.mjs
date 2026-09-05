import { existsSync, copyFileSync } from "node:fs";
import { resolve } from "node:path";

const distDir = resolve(process.cwd(), "dist");
const indexHtml = resolve(distDir, "index.html");
const notFoundHtml = resolve(distDir, "404.html");

if (!existsSync(indexHtml)) {
  console.error("dist/index.html introuvable. Vérifiez que le build a réussi.");
  process.exit(1);
}

copyFileSync(indexHtml, notFoundHtml);
console.log("SPA fallback cree : dist/404.html (copie de index.html)");