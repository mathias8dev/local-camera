import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import fs from "fs";
import crypto from "crypto";

// Hashes every build output file except sw.js itself, so the digest only
// changes when the deployed content actually changes.
function hashBuildOutput(dir: string, exclude: string): string {
  const hash = crypto.createHash("sha256");
  const walk = (current: string) => {
    const entries = fs
      .readdirSync(current, { withFileTypes: true })
      .sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (fullPath === exclude) continue;
      if (entry.isDirectory()) walk(fullPath);
      else hash.update(fs.readFileSync(fullPath));
    }
  };
  walk(dir);
  return hash.digest("hex").slice(0, 12);
}

function injectServiceWorkerBuildId(): Plugin {
  let outDir = "dist";
  return {
    name: "inject-sw-build-id",
    apply: "build",
    configResolved(config) {
      outDir = config.build.outDir;
    },
    closeBundle() {
      const swPath = path.resolve(outDir, "sw.js");
      if (!fs.existsSync(swPath)) return;
      const buildId = hashBuildOutput(outDir, swPath);
      const contents = fs.readFileSync(swPath, "utf-8");
      fs.writeFileSync(swPath, contents.replace("__BUILD_ID__", buildId));
    },
  };
}

export default defineConfig({
  plugins: [react(), injectServiceWorkerBuildId()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
});
