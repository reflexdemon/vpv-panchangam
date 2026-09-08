#!/usr/bin/env node
// Copies the Swiss Ephemeris WebAssembly binary next to the demo bundle so the
// browser can fetch it at runtime (see --outfile=example/dist/vpv-demo.mjs).
const fs = require("node:fs");
const path = require("node:path");

const packageRoot = path.dirname(require.resolve("@swisseph/browser"));
const srcFile = path.join(packageRoot, "swisseph.wasm");
const outFile = path.join(__dirname, "..", "example", "dist", "swisseph.wasm");

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.copyFileSync(srcFile, outFile);
console.log("copied swisseph.wasm ->", path.relative(process.cwd(), outFile));