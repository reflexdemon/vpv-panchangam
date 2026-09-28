#!/usr/bin/env node
// Copies the Swiss Ephemeris WebAssembly binary next to an ESM bundle so the
// browser can fetch it at runtime. @swisseph/browser resolves the sidecar as
// new URL("./swisseph.wasm", import.meta.url), so the .wasm MUST be a sibling
// of the bundle that loads it.
//
// Usage: node scripts/copy-wasm.cjs <outdir>
const fs = require("node:fs");
const path = require("node:path");

const outDir = process.argv[2];
if (!outDir) {
  console.error("usage: node scripts/copy-wasm.cjs <outdir>");
  process.exit(1);
}

const packageRoot = path.dirname(require.resolve("@swisseph/browser"));
const srcFile = path.join(packageRoot, "swisseph.wasm");
const outFile = path.join(__dirname, "..", outDir, "swisseph.wasm");

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.copyFileSync(srcFile, outFile);
console.log("copied swisseph.wasm ->", path.relative(process.cwd(), outFile));
