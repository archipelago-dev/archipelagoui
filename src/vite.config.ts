import fs from "fs";
import path from "path";
import { defineConfig } from "vite";
import archipelagoPlugin from "../vite-plugin-archipelago";

const coreLibsPath = path.resolve(__dirname, "../core-libs");

const aliases = Object.fromEntries(
    fs
        .readdirSync(coreLibsPath, { withFileTypes: true })
        .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
        .map((entry) => [
            `@archipelagoui/${entry.name}`,
            path.resolve(coreLibsPath, entry.name, "src")
        ])
);

export default defineConfig({
    plugins: [archipelagoPlugin()],
    resolve: {
        alias: aliases
    }
});
