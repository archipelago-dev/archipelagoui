import esbuild from "esbuild";
import ArchipelagoPlugin from "./esbuild-plugins/esbuild-plugin/archipelago";

// @ts-ignore
esbuild.build({
    entryPoints: ["src/main.ts"],
    bundle: true,
    outfile: "dist/bundle.js",
    plugins: [ArchipelagoPlugin()],
    format: "esm",
    target: "esnext"
});
