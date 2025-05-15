import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["cli.ts"],
  outDir: "../dist", // puts output in root-level /dist
  format: ["esm"],
  target: "node2022",
  clean: true,
  splitting: false,
  dts: true,
  external: ["mlkem", "bsdiff-node", "node:fs", "node:os", "node:path", "node:stream", "node:util", "brotli-wasm"],

});
