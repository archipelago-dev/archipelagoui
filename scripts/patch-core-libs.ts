// @ts-nocheck
import fs from "fs";
import path from "path";

const BASE = path.resolve("core-libs");
const TEMPLATE = {
    compilerOptions: {
        target: "ES2020",
        module: "ESNext",
        moduleResolution: "Node",
        outDir: "dist",
        rootDir: "src",
        declaration: true,
        declarationDir: "dist",
        esModuleInterop: true,
        strict: true,
        jsx: "react-jsx",
        allowSyntheticDefaultImports: true,
        skipLibCheck: true,
        incremental: false
    },
    include: ["src"]
};

for (const folder of fs.readdirSync(BASE)) {
    const libPath = path.join(BASE, folder);
    const configPath = path.join(libPath, "tsconfig.build.json");
    const stat = fs.statSync(libPath);
    if (!stat.isDirectory()) continue;

    fs.writeFileSync(configPath, JSON.stringify(TEMPLATE, null, 2));
    console.log(`✅ Patched: core-libs/${folder}/tsconfig.build.json`);
}
