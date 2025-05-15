import { defineConfig } from "tsup";

export default defineConfig({
    entry: ["src/index.ts"],
    outDir: "dist",
    format: ["esm"],
    dts: true,
    clean: true,
    target: "es2020",
    tsconfig: "tsconfig.build.json",
    external: ["react", "react/jsx-runtime"]
});
